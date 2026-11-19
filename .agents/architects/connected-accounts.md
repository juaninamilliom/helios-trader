# Connected accounts architect

## Scope

Plaid Link, provider boundaries, encrypted access tokens, imported accounts, cursor sync, disconnect and connection freshness.

## Current source anchors

- `packages/api/src/finance/providers.ts:64`: ``if (this.environment !== 'sandbox')``
- `packages/api/src/finance/providers.ts:122`: ``const cipher = createCipheriv('aes-256-gcm', this.key(), iv);``
- `packages/api/src/finance/finance.service.ts:193`: ``await this.db.$transaction(``
- `packages/api/src/finance/finance.service.ts:186`: ``e.code === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION' &&``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Keep Plaid Sandbox enforced for this release. Do not interpret a real Link popup as a real-account or Trial connection.
- Exchange public tokens server-side; encrypt persistent access tokens and never return them to the browser or logs. Key rotation needs an explicit recovery/re-encryption design.
- Commit imported pages with the cursor atomically. Retry pagination mutations from the original cursor. Resolve removals/pending replacements without duplication or resurrection.
- Preserve ownership and idempotency; reason about leases, concurrent sync, disconnect races, stale data and upstream timeouts. Do not claim polling is a webhook system.
- New products or institutions require separate coverage and reauthorization checks; a transactions Link flow is not proof of investments/liabilities support.

## Collaborators

Identity for ownership; Transactions for normalization/tombstones/corrections; Platform for migrations, encryption keys and worker lifecycle; Product experience for Link/reconnect/error states.

## Planning and review questions

- Does a failed middle page leave both rows and cursor unchanged?
- Can retries duplicate purchases or erase corrections/model provenance?
- Can concurrent sync/disconnect lose data or leave an unrecoverable lease?
- Are provider errors distinguishable from an empty successful account import?

## Verification

`npm run --workspace=api test:finance` against isolated Postgres and the local simulation. Inspect idempotency, page failure, mutation retry, pending replacement and removal assertions. Real Sandbox Link and institution reauthorization need their own provider checks.

## Maintenance triggers

Update for providers/products, sync/lease/cursor semantics, token storage, account contracts or connection status changes.
