# Intelligence and inference architect

## Scope

Classifier/transport selection, model contracts, explicit consent, merchant data egress, validated suggestions, abstention and inference costs.

## Current source anchors

- `packages/api/src/finance/inference.ts:69`: ``get consentScope() {``
- `packages/api/src/finance/inference.ts:124`: ``allow_fallbacks: false,``
- `packages/api/src/finance/inference.ts:179`: ``path = router ? '/alpha/decisions' : '/v1/systemone';``
- `packages/api/src/finance/inference.ts:283`: ``if (c === 'Other' || confidence < 0.8 || probability < 0.8)``
- `packages/api/src/finance/finance.service.ts:319`: ``take: 2000,``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Run provider/rule categorization first. Models only suggest purchase categories; never delegate accounting, cash forecasts or money movement to them.
- Bind opt-in to classifier, transport, model and allowed recipients. Recheck consent between requests; provider/model routing changes require renewed consent.
- Send only the minimized merchant input and disclose that merchant text can still be sensitive. Never send full transactions, account/user IDs or credentials.
- Choose routes explicitly; no silent cross-provider fallback. OpenRouter restrictions must remain enforceable and fail closed when configuration is missing.
- Validate typed/schema outputs, permitted categories, confidence/probability bounds and abstention. Provisional thresholds are not calibrated guarantees.
- Bound calls/output/timeouts, retain visible failure reasons and preserve unchanged paid suggestions. A new cache, batch, fallback or explanation feature needs its own privacy, invalidation and evaluation design.

## Collaborators

Transactions for eligible rows and provenance; Identity for per-user opt-in; Platform for server-only keys and route configuration; Product experience for truthful consent/readiness/errors.

## Planning and review questions

- Does the actual recipient match the consent shown, including fallback/routing settings?
- Are injected merchant instructions, invalid categories, truncation, refusal, 401/429 and timeouts handled without fabricated success?
- Can repeat sync/classify spend again unnecessarily or retain a stale suggestion after changed input?
- What labeled evaluation supports a model/threshold change, and which live requests were actually verified?

## Verification

`npm run --workspace=api test:inference-routing` against the local simulation, plus `test:finance` for scoped consent and persistence. Separate synthetic live connectivity tests from quality/cost evaluation. Do not use personal transactions for a smoke test.

## Maintenance triggers

Update for model/provider routes, payload fields, recipient/privacy policy, consent fingerprints, confidence thresholds, budgets, caching or evaluation criteria.
