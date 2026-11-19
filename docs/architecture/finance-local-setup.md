# Connected finance: setup and verification

The default `/connected` app uses the backend and real Plaid Sandbox. `/demo` is fictional UI data. No Trial/Production Plaid access, transfers, withdrawals or trading are enabled.

## Local services

From the repository root, install dependencies with `npm ci`. Copy `packages/api/.env.example` to `packages/api/.env` only on first setup; do not overwrite existing credentials. Then:

```sh
node scripts/setup-finance-env.mjs
docker compose --env-file packages/api/.env.finance.local -f compose.finance.yml up -d db
npm run --workspace=api db:generate:finance
npm run --workspace=api db:migrate:finance
npm run dev
```

Open http://localhost:3001. Register `http://localhost:3001/api/authentication/google/callback` in Google's authorized redirect URIs. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL=http://localhost:3001`, `PLAID_CLIENT_ID`, the **Sandbox** `PLAID_SECRET`, and `PLAID_ENV=sandbox` in the ignored API `.env`. Never use NEXT_PUBLIC variables for secrets. Google verified-email login creates the user; sessions persist in Postgres.

The generated `.env.finance.local` contains a random database password, session secret and token encryption key. Preserve it across restarts. Rotating the encryption key without re-encrypting tokens makes them unreadable. Finance commands load `.env`, then `.env.finance.local`, then explicit shell overrides. Postgres uses localhost:55433 and the `finance_data` volume. API uses localhost:3003. The web proxy uses `HELIOS_API_URL` if supplied. If web watching encounters EMFILE, use `WATCHPACK_POLLING=true npm run dev:web`. API uses polling; see [manager commands](dev-server-management.md).

## Model routes

Plaid categories and conservative merchant rules run first at no model inference cost. Only uncertain posted purchases are eligible for explicit user-triggered classification, at most 20 per request.

| Classifier | Transport | Server environment |
| --- | --- | --- |
| Luna (default) | OpenAI Responses | `FINANCE_CLASSIFIER=luna`, `FINANCE_LUNA_PROVIDER=openai`, `OPENAI_API_KEY`, `FINANCE_MODEL=gpt-6-luna` |
| Jev | Direct TypeSafe System One | `FINANCE_CLASSIFIER=jev`, `FINANCE_JEV_PROVIDER=typesafe`, `TYPESAFE_API_KEY`, `FINANCE_JEV_MODEL=jev-latest` |
| Jev | OpenRouter Decisions | `FINANCE_CLASSIFIER=jev`, `FINANCE_JEV_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, `OPENROUTER_JEV_MODEL=typesafe/jev-1.14` |
| Luna | OpenRouter chat | `FINANCE_CLASSIFIER=luna`, `FINANCE_LUNA_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, `OPENROUTER_LUNA_MODEL=openai/gpt-6-luna`, approved `OPENROUTER_PROVIDERS` |

`OPENROUTER_PROVIDERS` is a comma-separated endpoint-provider allowlist; routed Jev defaults to TypeSafe. Routed Luna refuses requests without an explicit allowlist. Requests disable provider fallback, require supported parameters and request `data_collection=deny` plus `zdr=true`. Availability depends on the selected provider's current policies and your OpenRouter account settings; there is no unrestricted retry. Verify those policies before using personal data. No automatic fallback crosses recipients. A key's presence is not proof of balance, model access or successful inference.

The Intelligence tab displays the selected recipient/model and readiness. Consent is bound to classifier, transport, model and routing allowlist. Changing that scope requires fresh opt-in. Revocation stops subsequent requests but cannot recall requests already sent. Only a shortened merchant description with digits removed is sent; it can still reveal purchase context. Amounts, dates, account IDs, user identities and full transaction objects are excluded.

Luna uses strict JSON schema, reasoning disabled and a 200-token output cap. Jev uses a typed choice question with explicit Other/abstain; confidence and chosen probability must both reach the provisional 0.8 threshold. This threshold is not calibrated accuracy. Outputs cannot create income/transfers or change amounts/accounting. Invalid output, refusal and provider failures preserve the existing category and produce visible feedback. Generative financial explanations are not implemented.

## Persistence and synchronization

Plaid access tokens are encrypted with AES-256-GCM before database storage. Connections and queries belong to authenticated users; mutation Origin checks block foreign browser origins. All transaction pages and the cursor commit atomically. Pagination mutation retries restart from the original cursor; removals and pending replacements are resolved after all pages. User category corrections survive sync. A single-process worker polls every minute for connections due after 15 minutes, using per-connection leases. Provider webhooks are not implemented.

Amounts are stored as integer cents. Summaries include posted USD purchases and provider-identified income only, exclude transfers/repayments and disclose truncated history. Merchant comparisons use comparable imported periods. Recurrence needs three consistent observations and is an estimate, not a confirmed bill or safe-to-invest forecast.

## Verification

```sh
./node_modules/.bin/tsc --noEmit --incremental false -p packages/api/tsconfig.json
./node_modules/.bin/tsc --noEmit --incremental false -p packages/web/tsconfig.json
npm run --workspace=web lint
npm run --workspace=api test -- --runInBand finance/domain.spec.ts auth/auth.controller.spec.ts auth/auth.service.spec.ts auth/google.strategy.spec.ts prisma/prisma.service.spec.ts
```

The reviewed focused suite passes 27 tests. It is not a declaration that the legacy suite is trustworthy. API-wide lint still reports 29 errors and 5 warnings in unchanged legacy files; all changed API TypeScript files pass targeted lint. No production build was run.

For isolated HTTP checks, create a disposable database (never point these fixtures at personal data):

```sh
docker run -d --name helios-integration-pg -e POSTGRES_DB=helios_integration -e POSTGRES_PASSWORD=helios_local_test -p 127.0.0.1:55432:5432 postgres:15
DATABASE_URL=postgresql://postgres:helios_local_test@127.0.0.1:55432/helios_integration npm run --workspace=api db:migrate
postman simulation run postman/simulations/finance.sim.yaml --port 4010 --no-history --output ndjson
```

In a separate terminal:

```sh
npm run --workspace=api test:finance
npm run --workspace=api test:auth-session
npm run --workspace=api test:inference-routing
```

The real API and Postgres run against local provider stand-ins. Checks cover session persistence before Google callback redirect, anonymous/tampered/expired sessions, ownership, Origin rejection, encrypted tokens, idempotent sync, pagination rollback/mutation, pending replacement/removal, corrections, scoped consent, each inference wire format, restricted routing, invalid answers, abstention, 401 and 429. These establish caller behavior, not upstream reliability or model quality. Postman CLI 1.76.0 ran locally; no shared workspace artifacts were published.

Live development evidence: the user completed Google sign-in and Plaid Sandbox linking, and fictional provider data was imported. A direct TypeSafe synthetic request succeeded with the label Groceries for “Fictional Corner Grocery Market”. No personal transaction was used for that smoke. No successful live Luna request has been established; the earlier OpenAI credential check returned HTTP 401 / `invalid_api_key`. OpenRouter remains optional and has not been exercised against its live service. No comparative accuracy, latency or billing evaluation has been performed.

This is not a production deployment. Institution OAuth return/reauthorization, broader products, provider webhooks, rate limiting, managed Postgres/HTTPS, monitoring, deletion/retention and key recovery need release work before real-account use. Legacy agent/dependency risks remain isolated from the finance entry point.

Primary references: [Plaid Link](https://plaid.com/docs/link/web/), [transaction sync](https://plaid.com/docs/api/products/transactions/), [TypeSafe quickstart](https://docs.typesafe.ai/introduction/quickstart), [OpenRouter Jev](https://openrouter.ai/docs/guides/community/jev-tutorial), [OpenRouter routing](https://openrouter.ai/docs/guides/routing/provider-selection), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Read November 18, 2026.
