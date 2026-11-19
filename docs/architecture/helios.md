> Historical planning/review snapshot. See [the current architecture](../../ARCHITECTURE.md) for design and decisions, and finance-local-setup.md for setup and verification.

# Helios architecture and implementation plan

Prepared November 17, 2026. Original planning snapshot. The user subsequently approved the web prototype and integrated account-data milestone. See `integrated-milestone.md` and `finance-local-setup.md` for current implementation and verification status. Later live-money phases remain proposed.

Repository: `helios-trader`.
All source paths below are relative to that repository. New paths are explicitly proposed, not existing functionality.

## Product definition

Helios helps people understand and organize money held in their existing bank, savings, credit card and brokerage accounts. It starts with “what is happening with my money?” and grows into user-authorized automation: protect checking obligations and a cushion, build a cash reserve, then invest eligible surplus in stocks and ETFs. A brokerage account opened with Alpaca is not a prerequisite or a substitute for supporting existing institutions.

Deliver a mobile-first web prototype first; preserve a provider-neutral API and domain model for a later native app. Use generous spacing, clear typography, prominent numbers, quiet surfaces, persistent thumb-friendly navigation, and original Helios branding. Do not lead with chat, AI, budgeting homework, or crypto.

An account connection permits only the capabilities actually granted. Reading balances is not permission to move money. A simulation is not an institution connection. A provider-app handoff is not a completed transfer or a proven integration.

## Rechecked repository evidence

These verbatim excerpts were read with line-numbered commands during this session. They describe current code, not runtime integration verification.

| Finding | Evidence |
|---|---|
| Reuse the workspace split | `package.json:4-5`: `"workspaces": [` / `"packages/*"`; `packages/web/package.json:16-18`: `"next": "^15.3.4",` / `"react": "^19.1.0",` / `"react-dom": "^19.1.0",` |
| Backend already uses Nest and Prisma | `packages/api/package.json:29`: `"@nestjs/core": "^11.0.1",`; `:32`: `"@prisma/client": "^6.10.1",`; `packages/api/prisma/schema.prisma:8`: `provider = "postgresql"` |
| Entry flow is chat-first and crypto-branded | `packages/web/src/app/page.tsx:27`: `router.push('/chat');`; `:68`: `<p className="mt-2 text-gray-600 dark:text-gray-400">Autonomous Meme Coin Trading Bot</p>` |
| Dashboard values are literals | `packages/web/src/app/dashboard/page.tsx:98`: `<span className="font-medium">$10,000.00</span>` |
| Chat is simulated | `packages/web/src/app/chat/page.tsx:78-80`: `// Simulate agent response (in a real app, this would call your API)` / `setTimeout(() => {` / `// Mock response - in a real app, this would come from your backend` |
| Alpaca implementation targets paper trading | `packages/api/src/alpaca/alpaca.service.ts:259`: `paper: true, // Use paper trading environment` |
| Sentiment and risk are mocks | `packages/api/src/sentiment/sentiment.service.ts:40-42`: `// TODO: Integrate with actual sentiment analysis API` / `// For now, return mock data` / `return this.getMockSentiment(symbol);`; `packages/api/src/risk/risk.service.ts:64-65`: `// TODO: Integrate with actual blockchain analysis APIs` / `// For now, return mock data` |
| Current agent depends on trading/crypto services | `packages/api/src/agent/agent.service.ts:210`: `const account: Account = await this.alpacaService.getAccountInfo();`; `:236`: `'Returns a list of currently trending coins from CoinGecko.',` |
| Schema is brokerage-centered, ownership needs redesign | `packages/api/prisma/schema.prisma:17`: `brokerage     String   @default("Alpaca")`; `:84`: `// portfolios Portfolio[] // Uncomment if you want to relate portfolios to users` |
| Existing money fields are floats | `packages/api/prisma/schema.prisma:31-32`: `quantity          Float` / `averageEntryPrice Float` |
| Authentication callback forces chat | `packages/api/src/auth/auth.controller.ts:51`: `res.redirect('http://localhost:3001/chat');` |
| Sensitive debug logging requires removal before real data | `packages/api/src/auth/auth.controller.ts:67-69`: `console.log('Session data:', req.session);` / `console.log('User in request:', req.user);` / `console.log('Cookies:', req.headers.cookie);` |
| Session configuration needs production work | `packages/api/src/main.ts:20`: `secure: false, // Must be false for HTTP`; the session block at lines 11-24 supplies no persistent store |
| Agent query has no local guard in the inspected controller | `packages/api/src/agent/agent.controller.ts:16`: `@Controller('agent')`; `:26`: `@Post('query')`; `:35`: `const response = await this.agentService.query(queryDto.query);` No claim is made here about deployment-level controls. |
| Two Next configurations require deliberate consolidation | `packages/web/next.config.js:6-7`: `source: '/api/:path*',` / `destination: 'http://localhost:3003/:path*',`; `packages/web/next.config.ts:4`: `/* config options here */` |
| Template identity remains | `packages/web/src/app/layout.tsx:16-17`: `title: "Create Next App",` / `description: "Generated by create next app",` |

No on-disk AGENTS.md was found in the repository scan or checked ancestor paths. The supplied global agreement applies. No project architect council was found; the following are explicit General-domain consultations from relevant perspectives, performed in this context, without subagents.

## Architecture consultations and resolutions

**General / application architecture:** Keep Next.js, NestJS and Postgres. Introduce a modular monolith, not services or a native rewrite. Add a pure TypeScript domain package and a contracts package. Keep React and provider SDKs out of both. Existing `app.module.ts`, app routes, and Prisma schema are integration points. Preserve legacy records through additive migration; disable legacy agent/trading routes in the new product configuration before real account access.

**General / product and accessibility:** Account connection is the onboarding spine. Show useful progress after the first connection, partial results when other institutions fail, and freshness beside each number. Use Today, Activity, Plan and Accounts navigation. `page.tsx`, `dashboard/page.tsx`, `layout.tsx`, `globals.css` and proposed `onboarding/` routes are the first UI surface. Financial clarity takes precedence over decorative charts.

**General / financial data:** Deterministic calculations precede prose. Normalize provider events into versioned account facts; retain provenance, currencies and effective times. Use integer minor units for money and decimal strings/Decimal for fractional securities. Separate spending from cash movement and observed change from hypothetical savings. Proposed domain accounting and forecasting modules own these rules, not prompts.

**General / execution and reliability:** A durable worker executes versioned consent policies, not model instructions. Reserve funds across concurrent jobs, enforce limits atomically, and reconcile provider outcomes before spending again. New automation, execution, webhook and reconciliation modules own this. A timeout is an unknown result, not permission to resubmit blindly.

**General / privacy and security:** User ownership is mandatory on every query and mutation. Harden `main.ts`, auth controllers/session handling, and schema before real data. Encrypt provider tokens with managed keys, keep them server-side, redact logs, verify webhooks and prevent replay. Do not send raw transaction histories or credentials to an LLM.

**Resolution:** Build a connection-centered simulated web experience immediately after approval, while treating live read access and live execution as separate gated stages. The full automatic savings-to-investing cycle remains a requirement, not a feature removed because providers are uncertain. Simulation can demonstrate it; no interface may claim it is operating with real money before the execution gate passes.

## Target boundaries

```text
Next.js web now / native client later
                 |
         versioned NestJS API
                 |
 Identity + Connections -> ingestion -> normalized account facts
                                      |
                           deterministic money domain
                         /             |              \
                  Today/Activity   policy preview   explanation facts
                                       |                  |
                              authorization gate     optional prose
                                       |
                        durable execution + reconciliation
                                       |
                         capability-specific provider adapters
```

Proposed packages:

- `packages/contracts/src/`: runtime-validated API DTOs and schemas, versioned errors, money/currency types, data mode and freshness envelopes. Every response identifies `demo`, `sandbox` or `live`, source time, sync time, completeness and limitations.
- `packages/domain/src/`: accounting, recurring obligations, cash forecasts, policy evaluation and explanation facts. Pure functions, explicit clock and inputs, no network calls or model dependencies.
- `packages/web/src/components/`, `features/`, `lib/`: presentation and replaceable demo/API adapters. Prototype fixtures live outside pages; the UI never invents balances independently.
- `packages/api/src/connections/`, `ingestion/`, `accounts/`, `insights/`: link lifecycle, cursor sync, normalized facts and read models.
- `packages/api/src/policies/`, `execution/`, `reconciliation/`, `notifications/`: versioned consent, scheduling, durable outbox/jobs, external lifecycle and user-visible outcomes.
- `packages/api/src/explanations/`: optionally turns precomputed facts into plain language. No execution dependency and no tools with money permissions; deterministic text fallback.

Start with a Postgres-backed jobs/outbox worker running separately from HTTP. Avoid a new queue service until throughput demands it. Claims, retries, leases and state transitions must survive restarts.

### Data model and API

Add user-owned Connection, Account, BalanceSnapshot, Transaction, TransactionRevision, TransferMatch, RecurringObligation, ForecastSnapshot, SavingsGoal, PolicyVersion, ConsentGrant, ExecutionIntent, ProviderEvent, ReconciliationRecord, AuditEvent and NotificationDelivery records. Provider identifiers are unique within their provider/connection scope. Preserve raw-source references with restricted retention; normal views use normalized facts.

Track account ownership and exclusions explicitly; similarly named accounts are not sufficient proof of an internal transfer. Holdings and cash use different records and liquidity statuses. Transactions retain original and normalized merchant identity, pending-to-posted linkage, revisions/removals and confidence. Currency conversion is not implicit; start calculations in USD and show unsupported currencies separately.

Proposed `/v1` endpoints: connection link-session/exchange/status/disconnect; accounts; activity; today; forecast; savings goals; policy preview/authorize/pause; executions/status; withdrawal preview/authorize; notification preferences. All are authenticated and scoped by server-side identity. Webhook endpoints use provider verification, not browser sessions. Do not return tokens in account DTOs. The demo adapter implements the same read contracts locally without pretending to obtain provider consent.

### Accounting and forecasting invariants

1. Card purchases count as spending. Card repayments are checking outflows and debt reduction, not a second purchase. Interest and fees remain expenses.
2. Matched owned-account transfers are excluded from consolidated income/spending but remain relevant to account-specific forecasts. Uncertain matches stay visible and block movement if material.
3. Pending and posted transactions are one economic event after confirmed linkage. Apply provider updates/removals idempotently; never deduplicate solely by amount and date.
4. Forecast checking using conservative liquid balances, known obligations, card due amounts, uncertain outflow reserves, held execution funds and a user cushion. Do not subtract pending debits twice when already reflected in available balance. Record which obligations and income are already incorporated.
5. Project the minimum balance over the full policy horizon, including before payday and the next automation run. Payroll is an estimate until confirmed. Missing liability information or material unknown obligations reduce confidence and disable movement rather than treating unknown amounts as zero.
6. “Amazon $600 versus $400” uses comparable windows and discloses coverage. “Spend $200 less” is potential future reduction; it cannot increase available cash today. Observed lower spending still needs a fresh cash eligibility check before transfer.
7. Brokerage market value, unsettled proceeds, withdrawable cash and bank cash remain distinct. A cash reserve is not replaced by equities.

### Automation contract

Each consent version records source/destination accounts, permitted actions, reserve target, checking cushion, scheduling/horizon, per-action and rolling limits, eligible investments/allocation, expiration, freshness thresholds and revocation semantics. Reauthorization is required when permissions expand. Within an active consent, eligible routine actions execute without asking the user every time.

Every run: refresh relevant data -> validate ownership/capability/consent/freshness -> forecast -> reserve eligible amount atomically -> create one durable intent -> dispatch -> reconcile -> notify. Re-evaluate consent and balances immediately before dispatch. Check forecast minimum rather than current balance alone. Count pending actions against limits. Unconfirmed transfers into savings or brokerage cannot fund subsequent actions.

Priority: protect checking -> replenish reserve -> invest remaining eligible surplus only after required reserve is confirmed. Weakening reserve/cash flow pauses investing and returns future allocation to reserve recovery; it does not automatically sell assets. A manual pause immediately blocks unsent actions; submitted actions remain monitored and cancellation is requested only when supported. Explain that a submitted transfer may still settle.

Lifecycle: `planned -> reserved -> submitted -> provider_pending -> confirmed`, with `paused`, `rejected`, `failed`, `cancel_requested`, `cancelled`, `unknown` and return/reversal events. Acceptance is not settlement. Use stable idempotency keys, unique database constraints, authenticated deduplicated webhooks and scheduled reconciliation. After ambiguous submit results, query provider status; do not assume exactly-once external execution. Release reservations only with a resolved outcome; late returns reopen reconciliation and recompute eligibility.

Withdrawals are separate flows: existing withdrawable brokerage cash -> bank, or explicit sale authorization -> order fills -> settlement -> withdrawable cash -> bank transfer. Present estimated timing, possible price changes and tax consequences separately. Never infer sale permission from a savings or investment consent. Tax and settlement details must be verified against the selected provider before live copy is approved.

Every action preview answers: what changes today, what may change later, and what could go wrong. An audit entry stores input snapshot/version, policy version, numerical decision factors, provider references and outcome; it does not require hidden model reasoning.

## Connection-centered prototype

Flow: welcome and explanation -> account access/privacy -> connect primary checking -> connection outcome and sync progress -> review detected accounts/ownership -> add savings, cards and brokerage -> first money picture -> optionally set cushion/reserve -> preview automation and its limitations.

Each stage supports back, resume, cancellation, expired authorization, institution outage, retry, incomplete history and disconnect. Do not force all connections before first value. Missing cards or savings are explicit gaps in coverage. Do not require manual category cleanup or a budget. The first Today view shows checking cash, expected outflows before payday, income rhythm, recurring patterns, merchant changes and freshness.

Prototype actions are labeled “Simulate connection,” “Preview rule,” or “Simulate transfer.” For unverified real actions, show “Complete in your provider’s app” as a handoff requirement/instruction, without claiming a working deep link, completed action, or automated support. A provider app action remains unconfirmed until authoritative data arrives.

## Provider feasibility gates

The originating chat supplied earlier official-document research. It was not re-browsed here and is not current verification by this plan. Treat it as a research lead, not permission or a live capability guarantee:

- Plaid was reported to offer fake-data Sandbox and eligible limited US/Canada Trial reads, including balances, transactions/recurring, liabilities and investments; Trial reportedly excludes Transfer. Recheck eligibility, institution/product coverage and current terms before connection work.
- Robinhood Trading MCP was reported to support reads/orders in a dedicated Agentic/MCP account. Commercial embedding, existing regular-account compatibility, funding and withdrawals remain unestablished.
- Alpaca Broker API was reported to support funding, withdrawals and equity trading, but requires Alpaca-backed accounts. It cannot silently replace the existing-account requirement.
- SnapTrade funding/transfer support was reported absent in its FAQ. Supertake integration details were not established. Neither supplies an assumed end-to-end solution.

Gate A: supported existing-bank/card/brokerage reads and consent lifecycle. Gate B: authorized checking-to-existing-savings movement. Gate C: existing brokerage funding, trading and withdrawals, including reconciliation and returns. Gate D: commercial access, security, legal/compliance and operational review for the chosen exact funds flow. No provider contact or real transfers are authorized by this plan. Until B-D are established, automation stays simulated or clearly described as provider-app work.

## Phased implementation plan

Each numbered phase is one proposed commit, with its own approval boundary and second-pass diff review. A failing relevant type-check blocks its commit under harness-commit. New tests must be declared and reviewed as verification for financial invariants; the existing Jest suite is not presumed trustworthy. No build command is used.

Run verification from the repository root. Define commands:

```sh
# W: existing web scope
./node_modules/.bin/tsc --noEmit --incremental false -p packages/web/tsconfig.json
# A: full API scope, including existing specs
./node_modules/.bin/tsc --noEmit --incremental false -p packages/api/tsconfig.json
# C and D: once proposed packages exist
./node_modules/.bin/tsc --noEmit --incremental false -p packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --incremental false -p packages/domain/tsconfig.json
```

| Phase / commit boundary | Proposed files | Verification and acceptance |
|---|---|---|
| 0. Record architecture, verification policy and provider capability matrix; no runtime changes | `docs/architecture/helios.md`, `docs/verification.md`, `docs/providers.md` | W + A; record baseline failures. Agree whether later web-only commits require both scopes; do not silently waive a failing global gate. |
| 1. Connection-centered web slice using labeled sample data; no provider SDK or money movement | Existing `src/app/page.tsx`, `dashboard/page.tsx`, `layout.tsx`, `globals.css`; new web `app/onboarding/page.tsx`, `components/app-shell.tsx`, `features/connections/*`, `lib/demo/*`; retire chat entry points | W + A. Manual keyboard and mobile-width review of complete/resumed/cancelled/failed/partial connection paths; useful Today view after one sample connection. Preserve dirty package files. |
| 2. Restore full API type-check baseline, separately from product behavior | `auth/auth.controller.spec.ts`, `auth/auth.service.spec.ts`, `auth/google.strategy.spec.ts`, `prisma/prisma.service.spec.ts`; production files only if evidence demands and approval expands scope | W + A both pass; mocks follow actual service interfaces and complete fixtures. Do not exclude specs to hide errors. This is a proposed repair, not a fix performed during this review. |
| 3. Add shared contracts, money types and standalone deterministic accounting | New `packages/contracts/{package.json,tsconfig.json,src/*}`, `packages/domain/{package.json,tsconfig.json,src/accounting/*,src/forecast/*}`; workspace dependency manifests/lock with explicit reconciliation of user changes | W + A + C + D; approve a focused test runner/command in `docs/verification.md` before relying on it. Fixtures cover card repayment, internal transfer ambiguity, pending replacement, removals, currency and balance semantics. |
| 4. Establish secure account ownership and durable storage | `api/prisma/schema.prisma`, new additive migration, `src/prisma/*`, `src/auth/*`, `src/main.ts`, new `src/accounts/*`; consolidate web Next configuration | W + A + C + D; migration tested on disposable database, cross-user access denied, log/cookie/session/CSRF review, preserve legacy data. No real connection yet. |
| 5. Integrate read-only accounts after Gate A | New API `connections/*`, `ingestion/*`, provider read adapter, `app.module.ts`; web connection adapter/status UI; `.env.example` placeholders | W + A + C + D; Sandbox fake data first. Reviewed contract/replay tests for duplicated, reordered and removed events, cursor restart, reauth and disconnect. Separate consent before real Trial access. No funding claims. |
| 6. Deliver deterministic money picture | Domain forecasting/recurrence/merchant modules; API `insights/*`; web Today, Activity and Accounts views | W + A + C + D plus approved financial fixture checks. Show provenance, range/confidence and before-payday obligations; prove spending/cash forecasts diverge correctly without double counting. |
| 7. Demonstrate full automatic cycle in simulation | Domain `policies/*`; API `policies/*`, `execution/*`, `reconciliation/*`, `notifications/*`; additive schema/migration; web Plan and action timeline | W + A + C + D plus reviewed invariant and failure-injection checks. Exercise reserve replenishment, investment pause, stale data stop, revocation/dispatch race, parallel jobs, duplicate webhook, timeout, return and restart. No live adapter. |
| 8. Add explanation utility | API `explanations/*`; web insight text and template fallback; retire legacy crypto/agent modules from new app configuration | W + A + C + D; facts and numbers identical with LLM disabled, no tool path into execution, hostile merchant text treated as data, no secrets/raw histories in prompts. |
| 9. Add live money movement only after Gates B-D | Chosen provider execution adapters, webhook verification, worker deployment config, reconciliation/runbooks, consent/withdrawal UI | W + A + C + D plus explicitly approved provider Sandbox lifecycle tests and operational review. Real-money validation requires separate authorization; no automatic promotion from simulation. If gates fail, retain read-only/handoff product and report full automation unavailable. |
| 10. Native readiness review, then separately scoped native client | Stable contracts, native navigation/auth/linking design; proposed new client package only after separate platform choice | W + A + C + D; native scope/commands defined at that point. Reuse domain/API, not Next-specific UI assumptions. |

Phase 1 is the recommended first product slice after approval. Phase 2 is a separate prerequisite to committing backend changes and may need to precede Phase 1 if harness-commit applies a repository-wide type-check gate. Do not commit through the existing failures on an inferred exception.

## Baseline verification and limits

Executed in this session using the local compiler, without downloading packages or building:

- W passed (exit 0).
- A failed (exit 2), with 17 diagnostics across four existing spec files. Representative failures, verbatim:

```text
packages/api/src/auth/auth.controller.spec.ts(31,42): error TS2554: Expected 0 arguments, but got 1.
packages/api/src/auth/auth.service.spec.ts(52,25): error TS2339: Property 'user' does not exist on type 'PrismaService'.
packages/api/src/auth/google.strategy.spec.ts(63,68): error TS2345: Argument of type '{ name: { givenName: string; familyName: string; }; emails: { value: string; }[]; photos: { value: string; }[]; }' is not assignable to parameter of type 'Profile'.
```

Remaining diagnostics concern an incomplete Request fixture, repeated nonexistent `PrismaService.user` access, and Partial portfolio/position/trade/decision fixtures passed where complete records are required. No fixes were made. No tests, builds, provider connections, transfers or deployed runtime checks were performed. Passing web compilation establishes type correctness only, not UX or financial correctness.

Initial and final repository status showed the same three modified files: `package-lock.json`, `package.json`, `packages/web/package.json`. They belong to pre-existing work and were not changed by this planning task.

Second-pass review: checked the proposed plan against the inspected source and product requirements; kept full automation and withdrawal requirements, removed any inference that paper trading proves existing-account funding, separated cash and spending accounting, and made stale-data, unknown-result and pause handling explicit. Application diff is empty for this task.

## Approval boundary and coordinating report

Verified: existing workspace and technology split; crypto/chat/demo UI; Alpaca paper configuration; brokerage-centered schema; web type-check pass; API spec type-check failures; pre-existing manifest edits.

Proposed first coding slice: Phase 1, a coherent simulated account-connection onboarding that leads into Today, with persistent mobile navigation, clear sample labels, partial/error/resume paths and no real financial actions.

Blockers/decisions: approve architecture and first slice; establish the commit type-check scope and approve the separate baseline repair if required; verify provider access for existing savings/brokerage funding and withdrawals before promising execution. Native platform choice and exact investment allocation are deferred; neither blocks the web slice.

Under `harness-plan/SKILL.md`, step 5: “Present the plan and stop. Implement only after approval.” This document is ready for review. No application implementation or commit has started; every future commit must first run harness-commit.
