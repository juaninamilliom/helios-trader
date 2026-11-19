> Historical approved plan. Model selection and delivery scope were superseded by model-routing-plan.md; see finance-local-setup.md for current status.

# Integrated milestone — approved scope from November 17 voice discussion

The user requested all of the previously presented integrated components, then explicitly asked how identity, SSO and Postgres would fit. This approves the connection → processing → categorization → inference → integrated UI milestone. It does not authorize provider account creation, real account linking, transfers, deployment or sending personal financial data to an LLM.

## Rechecked source and consultation

`packages/api/src/app.module.ts:17-20` currently imports `PrismaModule`, `AlpacaModule`, `AgentModule`, `AuthModule`. General architecture consultation: isolate the finance application entry point from legacy trading startup rather than requiring Alpaca keys for an account aggregation app.

`packages/api/src/auth/auth.service.ts:31` says `const existingUser = await this.prisma.findUserByEmail(details.email);`; General identity consultation: reuse Google login/user creation, verify email and persist sessions, enforce ownership and same-origin mutations before any account data API.

`packages/api/docker-compose.yml:4` says `image: postgres:15`; General storage consultation: keep Postgres and additive Prisma migrations, use a dedicated isolated database for verification, never reset the existing database. Docker daemon was unavailable; local Postgres binaries are available.

`packages/web/src/features/helios/demo.ts:49` says `export const transactions: Event[] = [`; General financial-data consultation: preserve explicit demo mode, add a separate connected mode displaying only imported data, using integer minor-unit amounts and provider category confidence; never blend fixtures with connected accounts.

General provider/AI consultation: documented Plaid Link client with server token exchange; cursor changes applied atomically with pending replacement and removals. OpenAI constrained classification of a redacted merchant description only after user opt-in. Classification never changes income/transfer accounting or calculates cash. GPT-4.1 mini is a configurable initial candidate with no claimed accuracy advantage; offline evaluation plus mocked HTTP verification first. Provider real credentials remain required.

## Planned change boundaries

1. Identity/data foundation: finance entry/module, secure session store, auth hardening, additive account/transaction/cursor schema, Compose/setup documentation. Verify both web/API no-emit type-checks (report existing spec failures separately), isolated migration and session behavior.
2. Provider boundary: Plaid Link-token/exchange/accounts/sync/disconnect, encrypted tokens, bounded worker/polling and ownership. Verify against local HTTP provider stand-ins, including errors, atomic pagination, duplicate updates and removed/pending transactions. Missing credentials yield explicit configuration status; no fabricated provider success.
3. Processing/inference: deterministic category provenance and cash-vs-spending accounting, manual corrections, opt-in minimal-data model classifier, timeout/refusal/schema validation. Verify fixtures and HTTP failure modes; classify unknowns as unknown rather than pretend success.
4. Connected UI: SSO entry, real Link modal via Plaid CDN, API-backed accounts/activity/category/merchant summaries and status, labeled mode switch; simulations stay confined to demo. Verify browser and no-emit types.
5. Operational handoff: environment contract, migration/worker/start instructions, API contract, evaluations and tested-vs-unverified report. No commit/deploy; every prospective commit must run harness-commit and satisfy its gates.

Verification uses `tsc --noEmit --incremental false -p packages/web/tsconfig.json` and equivalent API config; no builds. Existing API spec failures are not hidden by deleting/excluding specs. Focused new tests are reviewed financial/provider checks, not a claim the legacy suite is trustworthy.
