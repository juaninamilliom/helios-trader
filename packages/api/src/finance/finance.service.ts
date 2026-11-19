import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { FinanceDatabase } from './database';
import {
  PlaidProvider,
  TokenVault,
  CategoryInference,
  UpstreamError,
  type ProviderAccount,
  type SyncPage,
} from './providers';
import {
  classify,
  minorUnits,
  categories,
  observedPatterns,
  type Category,
} from './domain';

@Injectable()
export class FinanceService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private working = false;
  constructor(
    private readonly db: FinanceDatabase,
    private readonly plaid: PlaidProvider,
    private readonly vault: TokenVault,
    private readonly inference: CategoryInference,
  ) {}
  onModuleInit() {
    this.timer = setInterval(() => {
      void this.backgroundSync().catch(() =>
        console.warn(
          '[finance-sync] Background sync failed; retrying on the next poll.',
        ),
      );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    clearInterval(this.timer);
  }
  private async backgroundSync() {
    if (this.working) return;
    this.working = true;
    try {
      await this.db.financeSession.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (!this.plaid.configured) return;
      const due = await this.db.financeConnection.findMany({
        where: {
          status: { in: ['connected', 'sync_error', 'initializing'] },
          OR: [
            { attemptedAt: null },
            { attemptedAt: { lt: new Date(Date.now() - 15 * 60000) } },
          ],
        },
        take: 10,
      });
      for (const item of due) {
        try {
          await this.sync(item.userId, item.id);
        } catch {
          /* Stored status is surfaced; no tokens or provider bodies in logs. */
        }
      }
    } finally {
      this.working = false;
    }
  }
  async createLink(userId: number) {
    this.vault.assertConfigured();
    const response = await this.plaid.call<{ link_token: string }>(
      '/link/token/create',
      {
        user: { client_user_id: String(userId) },
        client_name: 'Helios',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        transactions: { days_requested: 180 },
      },
    );
    return {
      linkToken: response.link_token,
      environment: this.plaid.environment,
    };
  }
  async exchange(userId: number, publicToken: string) {
    const result = await this.plaid.call<{
      item_id: string;
      access_token: string;
    }>('/item/public_token/exchange', { public_token: publicToken });
    // Encrypt before persistence; never return a provider access token.
    const encryptedToken = this.vault.encrypt(result.access_token);
    const existing = await this.db.financeConnection.findUnique({
      where: { itemId: result.item_id },
    });
    if (existing && existing.userId !== userId)
      throw new ConflictException('Connection belongs to another user');
    const item =
      existing ??
      (await this.db.financeConnection.create({
        data: {
          userId,
          itemId: result.item_id,
          encryptedToken,
          institution: 'Linked institution',
          environment: this.plaid.environment,
        },
      }));
    try {
      await this.sync(userId, item.id);
    } catch {
      /* Link succeeded; data may not be ready. Subsequent sync and status are explicit. */
    }
    return { connectionId: item.id };
  }
  private async owned(userId: number, id: string) {
    const item = await this.db.financeConnection.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Connection not found');
    return item;
  }
  async sync(userId: number, id: string) {
    const item = await this.owned(userId, id);
    const lease = await this.db.financeConnection.updateMany({
      where: {
        id,
        userId,
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      },
      data: {
        leaseUntil: new Date(Date.now() + 10 * 60000),
        attemptedAt: new Date(),
      },
    });
    if (!lease.count) throw new ConflictException('Sync is already running');
    try {
      const access_token = this.vault.decrypt(item.encryptedToken);
      const accounts = await this.plaid.call<{
        accounts: ProviderAccount[];
        item?: { institution_id?: string };
      }>('/accounts/get', { access_token });
      let pages: SyncPage[] = [];
      let cursor = item.cursor || undefined;
      for (let restart = 0; restart < 3; restart++) {
        pages = [];
        cursor = item.cursor || undefined;
        try {
          for (let i = 0; i < 100; i++) {
            const page = await this.plaid.call<SyncPage>('/transactions/sync', {
              access_token,
              ...(cursor ? { cursor } : {}),
              count: 500,
            });
            if (
              !Array.isArray(page.added) ||
              !Array.isArray(page.modified) ||
              !Array.isArray(page.removed) ||
              typeof page.next_cursor !== 'string'
            )
              throw new Error('Invalid provider sync response');
            pages.push(page);
            cursor = page.next_cursor;
            await this.db.financeConnection.update({
              where: { id },
              data: { leaseUntil: new Date(Date.now() + 10 * 60000) },
            });
            if (!page.has_more) break;
            if (i === 99)
              throw new Error('Provider pagination exceeded safety limit');
          }
          break;
        } catch (e) {
          if (
            e instanceof UpstreamError &&
            e.code === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION' &&
            restart < 2
          )
            continue;
          throw e;
        }
      }
      await this.db.$transaction(
        async (tx) => {
          for (const a of accounts.accounts) {
            const data = {
              name: a.name,
              mask: a.mask,
              type: a.type,
              subtype: a.subtype,
              currency: a.balances.iso_currency_code,
              currentCents:
                a.balances.current === null
                  ? null
                  : BigInt(minorUnits(a.balances.current)),
              availableCents:
                a.balances.available === null
                  ? null
                  : BigInt(minorUnits(a.balances.available)),
              balanceAt: new Date(),
            };
            await tx.financeAccount.upsert({
              where: { id: a.account_id },
              create: { id: a.account_id, connectionId: id, ...data },
              update: data,
            });
          }
          for (const page of pages) {
            for (const t of [...page.added, ...page.modified]) {
              const data = {
                accountId: t.account_id,
                date: t.date,
                merchant: (t.merchant_name || t.name).slice(0, 250),
                amountCents: BigInt(minorUnits(t.amount)),
                currency: t.iso_currency_code,
                pending: t.pending,
                pendingId: t.pending_transaction_id,
                removed: false,
                ...classify(t),
                model: null as string | null,
              };
              const previous = await tx.financeTransaction.findUnique({
                where: { id: t.transaction_id },
              });
              // Preserve a paid suggestion on unchanged ambiguous merchant data. Provider semantics still win.
              if (
                previous?.connectionId === id &&
                previous.categorySource === 'model' &&
                previous.merchant === data.merchant &&
                data.categorySource === 'unclassified' &&
                data.accounting === 'spend'
              ) {
                data.category = previous.category as Category;
                data.categorySource = 'model';
                data.confidence = previous.confidence;
                data.model = previous.model;
              }
              await tx.financeTransaction.upsert({
                where: { id: t.transaction_id },
                create: { id: t.transaction_id, connectionId: id, ...data },
                update: data,
              });
            }
          }
          // Resolve tombstones after all pages: provider pagination is not economic-time ordering.
          const removedIds = new Set(
            pages.flatMap((page) => page.removed.map((t) => t.transaction_id)),
          );
          for (const page of pages)
            for (const t of [...page.added, ...page.modified]) {
              if (t.pending_transaction_id && !t.pending)
                removedIds.add(t.pending_transaction_id);
            }
          if (removedIds.size)
            await tx.financeTransaction.updateMany({
              where: { connectionId: id, id: { in: [...removedIds] } },
              data: { removed: true },
            });
          await tx.financeConnection.update({
            where: { id },
            data: {
              cursor,
              syncedAt: cursor ? new Date() : null,
              status: cursor ? 'connected' : 'initializing',
            },
          });
        },
        { timeout: 30000 },
      );
      return { synced: true };
    } catch (e) {
      await this.db.financeConnection.update({
        where: { id },
        data: {
          status:
            e instanceof UpstreamError && e.code === 'ITEM_LOGIN_REQUIRED'
              ? 'reconnect_required'
              : 'sync_error',
        },
      });
      throw e;
    } finally {
      await this.db.financeConnection.update({
        where: { id },
        data: { leaseUntil: null },
      });
    }
  }
  async disconnect(userId: number, id: string) {
    const item = await this.owned(userId, id);
    if (item.leaseUntil && item.leaseUntil > new Date())
      throw new ConflictException(
        'Wait for the active sync before disconnecting',
      );
    await this.plaid.call('/item/remove', {
      access_token: this.vault.decrypt(item.encryptedToken),
    });
    await this.db.financeConnection.delete({ where: { id } });
    return { disconnected: true };
  }
  async snapshot(userId: number) {
    const items = await this.db.financeConnection.findMany({
      where: { userId },
      include: {
        accounts: true,
        transactions: {
          where: { removed: false },
          orderBy: { date: 'desc' },
          take: 2000,
        },
      },
    });
    const preference = await this.db.financePreference.findUnique({
      where: { userId },
    });
    const transactions = items
      .flatMap((i) => i.transactions)
      .sort((a, b) => b.date.localeCompare(a.date));
    const thisMonth = new Date().toISOString().slice(0, 7);
    const totals: Record<string, number> = {};
    let income = 0,
      spending = 0;
    for (const t of transactions) {
      if (t.currency !== 'USD' || t.pending || !t.date.startsWith(thisMonth))
        continue;
      const cents = Number(t.amountCents);
      if (!Number.isSafeInteger(cents)) continue;
      if (t.accounting === 'spend') {
        spending += cents;
        const category = t.correctedCategory || t.category;
        totals[category] = (totals[category] || 0) + cents;
      }
      if (t.accounting === 'income') income += -cents;
    }
    return {
      patterns: observedPatterns(transactions),
      environment: this.plaid.environment,
      connections: items.map((i) => ({
        id: i.id,
        institution: i.institution,
        status: i.status,
        syncedAt: i.syncedAt,
        stale: !i.syncedAt || Date.now() - i.syncedAt.getTime() > 20 * 60000,
      })),
      accounts: items.flatMap((i) =>
        i.accounts.map((a) => ({
          ...a,
          currentCents: a.currentCents === null ? null : Number(a.currentCents),
          availableCents:
            a.availableCents === null ? null : Number(a.availableCents),
        })),
      ),
      transactions: transactions.map((t) => ({
        ...t,
        amountCents: Number(t.amountCents),
        category: t.correctedCategory || t.category,
        categorySource: t.correctedCategory ? 'user' : t.categorySource,
      })),
      summary: {
        month: thisMonth,
        postedSpendingCents: spending,
        confirmedIncomeCents: income,
        categories: totals,
        coverage:
          'Imported transactions only; not a full cash forecast. Transfers and unknown credits are excluded.',
        truncated: items.some((i) => i.transactions.length === 2000),
      },
      inference: {
        configured: this.inference.configured,
        model: this.inference.model,
        consent:
          !!preference?.aiConsent &&
          preference.aiConsentScope === this.inference.consentScope,
        recipient: this.inference.recipient,
        classifier: this.inference.classifier,
        readiness: this.inference.readiness,
      },
      moneyMovement: {
        enabled: false,
        reason:
          'Read-only integration. Existing-account transfer and trading providers are not verified.',
      },
    };
  }
  async correct(userId: number, transactionId: string, category: string) {
    if (!categories.includes(category as Category))
      throw new BadRequestException('Unsupported category');
    const t = await this.db.financeTransaction.findFirst({
      where: { id: transactionId, connection: { userId } },
    });
    if (!t) throw new NotFoundException('Transaction not found');
    await this.db.financeTransaction.update({
      where: { id: transactionId },
      data: { correctedCategory: category },
    });
    return { updated: true };
  }
  async consent(userId: number, consent: boolean) {
    await this.db.financePreference.upsert({
      where: { userId },
      create: {
        userId,
        aiConsent: consent,
        aiConsentScope: consent ? this.inference.consentScope : null,
      },
      update: {
        aiConsent: consent,
        aiConsentScope: consent ? this.inference.consentScope : null,
      },
    });
    return { consent };
  }
  async infer(userId: number) {
    const preference = await this.db.financePreference.findUnique({
      where: { userId },
    });
    if (
      !preference?.aiConsent ||
      preference.aiConsentScope !== this.inference.consentScope
    )
      throw new BadRequestException(
        'Enable minimal-data AI classification first',
      );
    const rows = await this.db.financeTransaction.findMany({
      where: {
        connection: { userId },
        removed: false,
        correctedCategory: null,
        categorySource: 'unclassified',
        accounting: 'spend',
        pending: false,
      },
      take: 20,
    });
    let classified = 0,
      attempted = 0;
    const failures: Record<string, number> = {};
    for (const row of rows) {
      const current = await this.db.financePreference.findUnique({
        where: { userId },
      });
      if (
        !current?.aiConsent ||
        current.aiConsentScope !== this.inference.consentScope
      )
        break;
      attempted++;
      const result = await this.inference.classifyDetailed(row.merchant);
      if (!result.ok) {
        failures[result.reason] = (failures[result.reason] || 0) + 1;
        if (
          [
            'unauthorized',
            'not_configured',
            'privacy_route_missing',
            'rate_limited',
          ].includes(result.reason)
        )
          break;
        continue;
      }
      classified += (
        await this.db.financeTransaction.updateMany({
          where: {
            id: row.id,
            updatedAt: row.updatedAt,
            correctedCategory: null,
          },
          data: {
            category: result.category,
            confidence: result.confidence,
            model: result.model,
            categorySource: 'model',
          },
        })
      ).count;
    }
    const blocked = failures.unauthorized
      ? 'Provider rejected the API key or access. Check the server credential.'
      : failures.not_configured
        ? 'The selected provider needs a server API key.'
        : failures.privacy_route_missing
          ? 'An approved provider allowlist is required for OpenRouter.'
          : failures.rate_limited
            ? 'Provider rate or credit limit reached. Try later or check billing.'
            : null;
    return {
      classified,
      attempted,
      remaining: rows.length - classified,
      failures,
      model: this.inference.model,
      message:
        blocked ||
        (classified
          ? `Saved ${classified} category suggestions from ${attempted} attempts. Accounting is unchanged.`
          : attempted
            ? 'No categories saved: the model abstained, returned an invalid response, or was unavailable.'
            : 'No uncertain posted purchases need classification.'),
    };
  }
}
