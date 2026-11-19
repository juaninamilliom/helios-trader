/* eslint-disable @typescript-eslint/no-require-imports -- Load app modules only after installing isolated test environment values. */
/** Focused, explicitly scoped finance integration checks; not the legacy Jest suite.
 * Requires the isolated helios_integration Postgres database and local Postman simulation.
 * Never loads real provider keys or makes requests to external providers.
 */
import * as assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL:
    'postgresql://postgres:helios_local_test@127.0.0.1:55432/helios_integration',
  SESSION_SECRET: 'finance-integration-only-session-secret-32',
  FRONTEND_URL: 'http://localhost:3001',
  GOOGLE_CLIENT_ID: 'test-google-client',
  GOOGLE_CLIENT_SECRET: 'test-google-secret',
  PLAID_ENV: 'sandbox',
  PLAID_CLIENT_ID: 'test-client',
  PLAID_SECRET: 'test-secret',
  FINANCE_TOKEN_KEY: '1234567890abcdef'.repeat(4),
  PROVIDER_TEST_MODE: 'true',
  PLAID_BASE_URL: 'http://127.0.0.1:4010/plaid',
  OPENAI_BASE_URL: 'http://127.0.0.1:4010/openai',
  OPENAI_API_KEY: 'test-openai-key',
  FINANCE_CLASSIFIER: 'luna',
  FINANCE_LUNA_PROVIDER: 'openai',
  FINANCE_MODEL: 'gpt-6-luna',
});
const { createFinanceApp } =
  require('../src/finance.main') as typeof import('../src/finance.main');
const { FinanceDatabase } =
  require('../src/finance/database') as typeof import('../src/finance/database');
const { minorUnits } =
  require('../src/finance/domain') as typeof import('../src/finance/domain');
const { CategoryInference } =
  require('../src/finance/providers') as typeof import('../src/finance/providers');
type TestPayload = Awaited<
  ReturnType<
    import('../src/finance/finance.service').FinanceService['snapshot']
  >
> & { linkToken: string; connectionId: string; classified: number };
const origin = 'http://localhost:3001';
async function main() {
  assert.equal(minorUnits(12.34), 1234);
  assert.equal(minorUnits(-12.34), -1234);
  assert.throws(() => minorUnits(NaN));
  const app = await createFinanceApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const db = app.get(FinanceDatabase);
  const suffix = randomUUID();
  const users: number[] = [];
  const sessions: string[] = [];
  async function control(member: string, scenario: string) {
    const res = await fetch(`http://127.0.0.1:4010/${member}/test/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    assert.equal(res.status, 200);
  }
  async function identity() {
    const user = await db.user.create({
      data: { email: `finance-test-${suffix}-${users.length}@example.invalid` },
    });
    users.push(user.id);
    const sid = randomUUID();
    sessions.push(sid);
    await db.financeSession.create({
      data: {
        id: sid,
        expiresAt: new Date(Date.now() + 60000),
        payload: {
          cookie: {
            expires: new Date(Date.now() + 60000).toISOString(),
            httpOnly: true,
            originalMaxAge: 60000,
          },
          passport: { user: { id: user.id, email: user.email } },
        },
      },
    });
    const signature = createHmac('sha256', process.env.SESSION_SECRET!)
      .update(sid)
      .digest('base64')
      .replace(/=+$/, '');
    return {
      id: user.id,
      cookie: `helios.sid=${encodeURIComponent(`s:${sid}.${signature}`)}`,
    };
  }
  async function call(
    path: string,
    cookie?: string,
    body?: object,
    requestOrigin = origin,
  ) {
    const res = await fetch(`${base}/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body
          ? { 'Content-Type': 'application/json', Origin: requestOrigin }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = (await res.json().catch(() => ({}))) as TestPayload;
    return { status: res.status, payload };
  }
  try {
    await control('plaid', 'normal');
    await control('openai', 'normal');
    assert.equal(
      (await call('agent/health')).status,
      404,
      'legacy agent is not exposed by finance entry',
    );
    const one = await identity(),
      two = await identity();
    assert.equal(
      (await call('finance/snapshot')).status,
      403,
      'anonymous reads denied',
    );
    assert.equal(
      (
        await call(
          'finance/link-token',
          one.cookie,
          {},
          'https://foreign.invalid',
        )
      ).status,
      403,
      'CSRF origin denied',
    );
    assert.equal(
      (await call('finance/link-token', one.cookie, {})).payload.linkToken,
      'link-sandbox-test',
    );
    const exchange = await call('finance/exchange', one.cookie, {
      publicToken: 'public-sandbox-fake',
    });
    assert.equal(exchange.status, 201);
    const connection = exchange.payload.connectionId;
    const snapshot = async () =>
      (await call('finance/snapshot', one.cookie)).payload;
    let view = await snapshot();
    assert.equal(view.accounts.length, 1);
    assert.equal(
      view.summary.postedSpendingCents,
      6200,
      'repayment excluded and pending excluded',
    );
    assert.equal(
      view.summary.confirmedIncomeCents,
      200000,
      'unknown credit excluded',
    );
    assert.equal(view.transactions.length, 6);
    assert.equal(
      (await call('finance/snapshot', two.cookie)).payload.accounts.length,
      0,
      'ownership isolation',
    );
    assert.equal(
      (await call(`finance/connections/${connection}/sync`, two.cookie, {}))
        .status,
      404,
      'cross-user sync denied',
    );
    const stored = await db.financeConnection.findUniqueOrThrow({
      where: { id: connection },
    });
    assert(!stored.encryptedToken.includes('access-sandbox-fake'));
    assert(!JSON.stringify(view).includes('encryptedToken'));
    await call(`finance/connections/${connection}/sync`, one.cookie, {});
    assert.equal(
      (await snapshot()).transactions.length,
      6,
      'idempotent replay',
    );
    await control('plaid', 'page-failure');
    assert.equal(
      (await call(`finance/connections/${connection}/sync`, one.cookie, {}))
        .status,
      502,
    );
    assert.equal(
      await db.financeTransaction.count({ where: { id: 'should-not-commit' } }),
      0,
      'no partial page commit',
    );
    assert.equal(
      (
        await db.financeConnection.findUniqueOrThrow({
          where: { id: connection },
        })
      ).cursor,
      'base',
      'cursor preserved after failed pagination',
    );
    await control('plaid', 'posted');
    await call(`finance/connections/${connection}/sync`, one.cookie, {});
    view = await snapshot();
    assert(
      !view.transactions.some(
        (t: { id: string }) => t.id === 'pending-purchase',
      ),
    );
    assert.equal(
      view.summary.postedSpendingCents,
      8700,
      'pending-to-posted one economic event',
    );
    await control('plaid', 'removed');
    await call(`finance/connections/${connection}/sync`, one.cookie, {});
    assert.equal(
      (await snapshot()).summary.postedSpendingCents,
      6200,
      'removal applied',
    );
    await control('plaid', 'mutation');
    assert.equal(
      (await call(`finance/connections/${connection}/sync`, one.cookie, {}))
        .status,
      201,
      'mutation restart',
    );
    assert.equal(
      (await call('finance/classify', one.cookie, {})).status,
      400,
      'AI opt-in required',
    );
    await call('finance/ai-consent', one.cookie, { consent: true });
    const inferred = await call('finance/classify', one.cookie, {});
    assert.equal(inferred.payload.classified, 1);
    view = await snapshot();
    assert.equal(
      view.transactions.find((t: { id: string }) => t.id === 'ambiguous-store')
        ?.categorySource,
      'model',
    );
    await call(`finance/connections/${connection}/sync`, one.cookie, {});
    assert.equal(
      (await snapshot()).transactions.find((t) => t.id === 'ambiguous-store')
        ?.categorySource,
      'model',
      'unchanged sync preserves paid category suggestion',
    );
    const inference = app.get(CategoryInference);
    await db.financePreference.update({
      where: { userId: one.id },
      data: { aiConsentScope: 'old-provider-route' },
    });
    assert.equal(
      (await call('finance/classify', one.cookie, {})).status,
      400,
      'route change invalidates previous consent',
    );
    await call('finance/ai-consent', one.cookie, { consent: true });
    await control('openai', 'refusal');
    assert.equal(
      await inference.classify('untrusted merchant 12345'),
      null,
      'refusal leaves unknown',
    );
    await control('openai', 'invalid');
    assert.equal(
      await inference.classify('merchant'),
      null,
      'income cannot be inferred by model',
    );
    await control('openai', 'failure');
    assert.equal(
      await inference.classify('merchant'),
      null,
      '429 leaves unknown',
    );
    await call('finance/transactions/ambiguous-store/category', one.cookie, {
      category: 'Groceries',
    });
    await control('plaid', 'normal');
    await call(`finance/connections/${connection}/sync`, one.cookie, {});
    view = await snapshot();
    assert.equal(
      view.transactions.find((t: { id: string }) => t.id === 'ambiguous-store')
        ?.category,
      'Groceries',
      'correction survives provider replay',
    );
    assert.equal(
      view.summary.postedSpendingCents,
      6200,
      'correction does not change accounting',
    );
    const expired = sessions[0];
    await db.financeSession.update({
      where: { id: expired },
      data: { expiresAt: new Date(0) },
    });
    assert.equal(
      (await call('finance/snapshot', one.cookie)).status,
      403,
      'expired sessions denied',
    );
    const fresh = await identity();
    assert.equal(
      (await call('finance/snapshot', fresh.cookie)).status,
      200,
      'new persistent session usable',
    );
    console.log(
      'PASS: finance HTTP integration, Postgres persistence, ownership, CSRF, encrypted tokens, sync replay/pagination/replacement/removal, category provenance, AI consent/schema/refusal/rate-limit, session expiry.',
    );
  } finally {
    await db.financeSession.deleteMany({ where: { id: { in: sessions } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await app.close();
  }
}
void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
