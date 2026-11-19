# General architect

## Scope

System boundaries, cross-vertical changes, design decisions and scope expansion.

## Current source anchors

- `packages/api/src/finance/finance.module.ts:14`: ``AuthModule,``
- `packages/web/src/app/page.tsx:3`: ``redirect("/connected");``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Keep the finance entry isolated from legacy trading initialization. Treat service extraction and new providers as decisions, not incidental refactors.
- Separate implemented, tested, simulated and proposed behavior. A configured key is not a successful provider request.
- Preserve deterministic financial facts and explicit user intent at every boundary. Do not turn a model output or demo affordance into authority to move money.
- Prefer the present modular monolith until isolation, scaling or ownership requirements justify a separate service. The council is organized by product vertical, not by deployment unit.

## Collaborators

All verticals. Identity controls ownership; accounts supplies facts; transactions owns accounting; intelligence owns model egress; experience owns truthful presentation; platform owns persistence and lifecycle.

## Planning and review questions

- Which boundary or accepted decision changes, and what alternative was considered?
- Are all downstream readers, writers, migrations, docs and checks covered?
- Does the diff accidentally enable dormant trading paths or imply production readiness?
- Is a risk being hidden behind a fixture, model confidence or a document claim?

## Verification

Run both root no-emit checks. Choose focused behavioral checks with each affected vertical. Read the final diff a second time; do not substitute a council filename list for review.

## Maintenance triggers

Update for new verticals, service extraction, trust boundaries, financial authority or shared decision changes.
