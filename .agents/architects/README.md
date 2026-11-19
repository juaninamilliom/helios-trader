# Coding-agent architect references

Use the [root agreement](../../AGENTS.md) to select all applicable perspectives. Start with [General](general.md). These files capture the current product boundaries and review obligations; they are not role-play prompts or independent agent processes.

## Consultation output

For each selected architect, briefly record the change's risk, the invariant it must preserve, source evidence, dependencies and meaningful checks. Resolve conflicts in the plan before implementation. During review, try to falsify the plan's assumptions against the final diff. Do not let a document substitute for reading the code.

## File contract and maintenance

Each architect names its scope, current source anchors, constraints, collaborators, review questions, checks and change triggers. Anchors are navigation aids, not immutable line numbers: re-read and refresh them when the code moves. Constraints describe design intent, not a guarantee that every edge case already satisfies it.

Changes to behavior, contracts, persistence, provider route/privacy, operational assumptions or test commands require updating the affected references in the same PR. Internal refactors only require an update if the source map or guidance becomes stale. Keep secrets and user-specific configuration out of these documents. Use ARCHITECTURE.md for shared decisions rather than creating contradictory copies in each vertical.

Architect consultation does not grant permission for deployments, real financial activity, external messages or model data sharing. Follow the user's authorization and the root agreement. The council does not automatically spawn subagents.
