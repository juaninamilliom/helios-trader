# Product experience architect

## Scope

Connected and demo journeys, Today/Activity/Accounts/Intelligence, Plaid Link interactions, accessible controls, responsive layouts and failure/recovery states.

## Current source anchors

- `packages/web/src/app/page.tsx:3`: ``redirect("/connected");``
- `packages/web/src/app/demo/page.tsx:3`: ``return <Helios />;``
- `packages/web/src/features/helios/connected.tsx:142`: ``script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";``
- `packages/web/src/features/helios/connected.tsx:727`: ``{data.inference.recipient} a shortened merchant``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Connected screens display backend results and explicit failures; never substitute demo fixtures after an API error. Keep fictional simulations visibly separate.
- Treat Link loaded, Link opened, account linked and data synchronized as different outcomes. Make empty, stale, pending, reconnect and retry states understandable.
- Match consent copy to the configured recipient/model and explain uncertain classifications without overstating accuracy or financial authority.
- Preserve keyboard/focus semantics, accessible names, status/error announcements and mobile usability. Do not imply a disabled or simulated transfer/trade actually executed.
- Keep secrets and internal operational details off product screens unless needed for a meaningful user decision.

## Collaborators

Identity for login/session states; Connected accounts for Link/status; Transactions for truthful totals/coverage; Intelligence for consent/provenance; Platform for proxy/runtime availability.

## Planning and review questions

- Does every visible action have a verified outcome and a recovery path?
- Can a provider/API failure appear as success or fictional connected data?
- Are amounts, currencies, pending states and coverage caveats visible where decisions are made?
- Can keyboard and narrow-screen users reach and understand the flow?

## Verification

Web no-emit check and `npm run --workspace=web lint`. Inspect the changed journey at desktop and mobile widths when behavior/layout changes. Verify actual Link opening separately from mocked API success. Docs-only changes need link/source verification, not invented UI checks.

## Maintenance triggers

Update for routes/navigation, interaction contracts, consent/error text, accessibility patterns or demo/connected separation.
