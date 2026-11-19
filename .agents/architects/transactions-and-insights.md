# Transactions and financial insights architect

## Scope

Amounts, accounting semantics, category provenance/corrections, spending/income summaries, merchant comparisons and inferred recurrence.

## Current source anchors

- `packages/api/src/finance/domain.ts:51`: ``primary.startsWith('TRANSFER') || primary === 'LOAN_PAYMENTS';``
- `packages/api/src/finance/domain.ts:98`: ``categorySource: rule ? 'merchant_rule' : 'unclassified',``
- `packages/api/src/finance/finance.service.ts:334`: ``if (t.currency !== 'USD' || t.pending || !t.date.startsWith(thisMonth))``
- `packages/api/src/finance/finance.service.ts:238`: ``previous.categorySource === 'model' &&``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Store money as integer minor units and preserve sign/currency. Do not silently mix currencies, use float model arithmetic or count pending and posted versions twice.
- Provider semantics determine accounting; presentation corrections and model labels cannot create income or turn cash into spendable/investable funds.
- Preserve provider/rule/model/user provenance. User corrections survive sync; unchanged ambiguous merchant data can retain a paid suggestion, while new provider semantics take precedence.
- Disclose imported-history limits. Comparable windows are not complete coverage; missing observations are not zero spending. Recurrence is an observed estimate, not a confirmed bill or cash forecast.

## Collaborators

Connected accounts for provider updates/removals; Intelligence for validated suggestions; Product experience for totals/labels/limitations; Platform for monetary storage/schema.

## Planning and review questions

- Are transfers/repayments excluded, unknown credits conservative and pending records handled correctly?
- Do correction and classification change only presentation, not accounting?
- Can sync overwrite a user correction or repeatedly erase paid suggestions?
- Do truncation, date windows, non-USD amounts, duplicate events and sparse history change the meaning of a total?

## Verification

`npm run --workspace=api test -- --runInBand finance/domain.spec.ts` and `npm run --workspace=api test:finance`. Add meaningful edge cases for changed financial semantics; no model call is required to verify arithmetic.

## Maintenance triggers

Update for amount/sign/currency rules, categories/provenance, correction precedence, aggregation windows, history limits or inferred-pattern semantics.
