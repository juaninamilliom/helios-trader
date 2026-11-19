> Historical planning/review snapshot. See finance-local-setup.md for current implementation and verification.

# Helios web prototype — November 17, 2026

The originating chat explicitly authorized implementation after the plan was prepared. That approval supersedes the planning-only status recorded in `helios.md`. Implemented the first web slice plus local interactive previews of automation and withdrawal behavior. Later architecture phases remain proposed.

## Run locally

From `helios-trader`:

```sh
WATCHPACK_POLLING=true npm run dev:web
```

Open http://localhost:3001. Polling works around this machine's `EMFILE: too many open files, watch` failure. It is a development server, not a production build. No API, database, API keys or Google authentication are needed for this fictional demo.

## Implemented

- Three-stage connection-centered onboarding, first checking requirement, partial coverage, sample institution failure/retry, cancellation and persisted account selections.
- Mobile Today/Activity/Plan/Accounts navigation, checking overview, before-payday outflows, merchant comparison and an optional future spending goal. The goal never increases current eligibility.
- Editable checking cushion, reserve target and per-run limit; changing a rule invalidates demo consent. Consent, pause/resume/revoke, manual simulation trigger and event history.
- Simulated checking-to-reserve cycle followed by an ETF allocation when the reserve target is reached. Simulations are immediate; there is no background scheduler or provider lifecycle.
- Cash-only withdrawal simulation updates checking and brokerage cash separately from holdings. Stale data blocks transfers and withdrawals; incomplete account coverage blocks automation. Disconnect pauses the rule.
- Demo state persists in browser localStorage; Accounts → Reset sample workspace clears it. No real personal data should be entered. The application does not send this demo state to the existing backend.

## Verification actually performed

- Web `tsc --noEmit --incremental false -p packages/web/tsconfig.json` passed before and after interaction review.
- `git diff --check` passed.
- Browser: completed four sample account connections; exercised failure/retry; completed onboarding; reviewed desktop and 390×844 mobile layouts (no horizontal page overflow in the checked Today view).
- Browser: authorized the demo rule, ran a $200 savings simulation, observed checking decrease from $4,280 to $4,080 and savings increase from $3,200 to $3,400. Pause disabled the next-run button.
- Browser: stale-data scenario disabled withdrawal; restoring freshness allowed a $100 withdrawal, resulting in $4,180 checking and $8,540 brokerage total. No holdings were sold.
- Captured desktop/mobile review screenshots outside the repository. Browser review state is fictional and may remain in the preview's localStorage.
- Full API type-check was run before application edits and failed with 17 existing diagnostics in four spec files. Representative verbatim failure: `packages/api/src/auth/auth.controller.spec.ts(31,42): error TS2554: Expected 0 arguments, but got 1.` API source was not modified. These failures remain unresolved and were not bypassed for a commit.

## Limits

The expected bills and merchant totals are scenario fixtures, not derived from the short example activity list. The line chart is labeled illustrative and is not recomputed from simulated events. Forecasting uses a simplified fixed $2,000 obligation total. It does not implement ingestion, recurring detection, pending/posting reconciliation, safe financial arithmetic, rolling limits or durable idempotent execution. No claim is made that the prototype is suitable for real funds.

There is no verified live Plaid, Chase, American Express or Robinhood integration. No real provider access, transfers, trades, external messages, commits, builds or deployment occurred. Existing changes in root package.json, package-lock.json and web package.json were preserved. Existing-account funding/withdrawal provider feasibility remains a gate.

A second source review corrected brokerage total conservation in cash withdrawals and simulated investments, and prevented a disconnected checking account from displaying a current hero balance. Future work should extract individual screens and a proper domain/state layer before extending production behavior.
