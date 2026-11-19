# Platform and operations architect

## Scope

Postgres/Prisma migrations, configuration/secrets, Docker/local runtime, development supervisor/logging, proxy and verification infrastructure.

## Current source anchors

- `packages/api/src/finance/finance.module.ts:12`: ``envFilePath: ['.env.finance.local', '.env'],``
- `packages/api/src/finance.main.ts:62`: ``store: new PostgresSessionStore(app.get(FinanceDatabase)),``
- `packages/web/next.config.ts:8`: ``destination: `${process.env.HELIOS_API_URL || "http://127.0.0.1:3003"}/:path*`,``
- `scripts/finance-dev.mjs:307`: ``"[manager] Polling source and server environment files; logs are excluded from watched paths.",``
- `compose.finance.yml:9`: ``- "127.0.0.1:55433:5432"``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Keep migrations additive and applied checksums stable. Plan backfill/rollback and encryption-key recovery for schema/key changes; never reset a user's database to make tests pass.
- Keep provider keys server-only, private env/control/log files ignored and local processes bound appropriately. Review actual effective env precedence, including shell overrides.
- Preserve isolated test data and localhost-only stand-ins; a test mode must not become an arbitrary production egress override.
- Stop/restart only the verified managed process. Redact/allowlist logs and expose operational failures without printing provider payloads or credentials.
- Keep the finance startup independent of legacy trading/Alpaca dependencies. Distinguish local development from production deployment and polling from a durable job system.
- Type-check instead of building during development. Record pre-existing lint debt separately rather than relaxing production rules or hiding failed checks.

## Collaborators

All verticals for schema/config/startup changes. Identity owns session behavior; accounts owns sync leases; intelligence owns recipient configuration; experience owns browser proxy assumptions.

## Planning and review questions

- Is the migration compatible with existing data and running readers/writers?
- Can keys or personal data enter Git, logs, browser bundles or test fixtures?
- Can manager failure signal an unrelated process or leave a duplicate listener?
- Are process/DB/provider failures visible and checks reproducible from documented commands?

## Verification

Both root no-emit checks, declared lint and relevant isolated HTTP checks. Use docs/architecture/finance-local-setup.md for DB/simulation setup. For runtime changes check managed start/status/restart/stop and recovery without exposing private control metadata. No build.

## Maintenance triggers

Update for deployment/runtime topology, migrations, environment precedence, keys, logging, process control, local ports or verification tooling.
