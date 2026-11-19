# Helios coding-agent agreement

Integration branch: `main`. Create a feature branch from current remote main; never commit directly to main. Architecture documentation is [ARCHITECTURE.md](ARCHITECTURE.md). This file supplements the user's global working agreement; it does not replace it.

## Architect council

These are living Markdown references for coding agents, not deployed services, autonomous processes or a requirement to spawn agents. One coding agent can consult each applicable perspective explicitly. Read [the council guide](.agents/architects/README.md) and select all affected verticals:

| Architect | Consult when touching |
| --- | --- |
| [General](.agents/architects/general.md) | Every non-trivial plan/review; cross-vertical boundaries and design decisions |
| [Identity](.agents/architects/identity.md) | Google login, sessions, users, authorization, Origin/CORS and identity deletion |
| [Connected accounts](.agents/architects/connected-accounts.md) | Plaid Link, provider tokens, accounts, sync cursors/leases, disconnect and reauthorization |
| [Transactions and insights](.agents/architects/transactions-and-insights.md) | Amounts, accounting, categories/corrections, summaries, recurrence and merchant comparisons |
| [Intelligence](.agents/architects/intelligence.md) | Models/providers, inference contracts, consent, merchant egress, abstention, evaluation and cost |
| [Product experience](.agents/architects/product-experience.md) | Next.js routes, connected/demo screens, interactions, accessibility and user-facing states |
| [Platform](.agents/architects/platform.md) | Prisma/SQL, Docker, environment/config, process lifecycle, logs, proxy and test infrastructure |

Select by behavior, not just directory. `FinanceService` spans accounts, transactions and intelligence; use the relevant methods to choose perspectives. Shared schema/session/privacy changes often require several. Legacy trading/agent code requires General and Platform plus the relevant data/identity perspectives; do not invent an active trading vertical from dormant code.

## Planning

For non-trivial work, follow the global `/plan` protocol before edits. Read the relevant code first, then consult General and each selected architect in the plan: risk, invariant, affected contracts/files, verification, and any disagreement. Resolve disagreements explicitly. Keep implementation facts separate from proposals. A docs-only gate exemption remains available under harness-plan.

A consultation is a reasoned application of the reference, not merely listing its filename. Current code wins as evidence of behavior; an architectural invariant is the desired constraint. If they disagree, record a finding or proposed decision change instead of silently claiming compliance. Recheck file:line anchors and quote the actual source for load-bearing claims.

## Review

Apply the same selected architects to the diff during the global `/review` three-pass protocol: correctness, adversarial recheck, and silent-failure/type-check sweep. Check cross-vertical contracts in both directions. Confirm failures with source evidence and a concrete scenario. Critical findings block commit. No fresh-context reviewer or parallel-agent execution is implied by the council.

## Keep the documents live

When a change affects a vertical's boundary, invariant, source map, configuration or verification, update that architect in the same PR. Update ARCHITECTURE.md when system boundaries or decisions change. Update both sides of a shared contract. For a new decision, record context, choice, alternatives, consequences and reconsideration trigger. Mark a superseded decision and link its replacement; do not rewrite history as if the new design always existed.

Routine internal changes need no ceremonial document edit when the guidance remains accurate; the PR must say which architects were consulted and whether their guidance changed. In every architecture-affecting PR description include: architects consulted; decisions changed; docs updated or why still accurate; checks run and residual limitations.

## Verification and delivery

Type-check; never build during development:

```sh
./node_modules/.bin/tsc --noEmit --incremental false -p packages/api/tsconfig.json
./node_modules/.bin/tsc --noEmit --incremental false -p packages/web/tsconfig.json
```

Choose behavioral checks from the architect references. The focused finance suite is scoped evidence; do not treat the entire legacy suite as trustworthy. Keep live-provider success distinct from stand-in tests. Before any commit run `/commit`: deliberate staging, type-check hard block, declared lint fixed or justified, and three-pass self-review. Use `/pr` for delivery against main. Never commit real provider credentials, private environment files, runtime control credentials or personal financial fixtures.
