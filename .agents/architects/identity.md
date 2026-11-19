# Identity and access architect

## Scope

Google account creation/login, persistent sessions, authenticated users, authorization and browser-origin boundaries.

## Current source anchors

- `packages/api/src/auth/google.strategy.ts:28`: ``state: true,``
- `packages/api/src/auth/google.strategy.ts:52`: ``if (!emails?.[0]?.value || profile._json?.email_verified !== true) {``
- `packages/api/src/auth/auth.controller.ts:29`: ``req.logIn(req.user!, { session: true }, (error) =>``
- `packages/api/src/finance.main.ts:62`: ``store: new PostgresSessionStore(app.get(FinanceDatabase)),``

Read surrounding implementations before relying on these anchors. Shared decisions live in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Constraints

- Require verified identity and OAuth state validation; persist/rotate the session before redirecting to an authenticated screen.
- Revalidate the user on session restoration; expired/deleted identities must not retain access.
- Enforce ownership on server reads and writes. Client IDs, hidden UI and a successful sign-in are not substitutes for per-resource authorization.
- Keep HTTP-only cookies and production HTTPS requirements. Mutation Origin validation and CORS have distinct jobs; review both. Do not log cookies, user identities or OAuth tokens.

## Collaborators

Connected accounts for ownership and token exchange; Platform for session schema/cookie/proxy lifecycle; Product experience for login and recovery states.

## Planning and review questions

- Can anonymous, expired, tampered or another user's session read or mutate this resource?
- Can a callback redirect before session save, or swallow its failure?
- What happens after logout, user deletion, concurrent sign-up, callback failure or origin mismatch?
- Are login tokens and application sessions kept distinct?

## Verification

`npm run --workspace=api test:auth-session` uses real Passport/Postgres with a synthetic Google result; follow the isolated database setup first. Focused Jest: `npm run --workspace=api test -- --runInBand auth/auth.controller.spec.ts auth/auth.service.spec.ts auth/google.strategy.spec.ts`. Real browser OAuth success requires a separate explicit check; the synthetic guard does not establish it.

## Maintenance triggers

Update for identity providers, session lifetime/store/cookies, ownership rules, callback routes or sign-in/out contracts.
