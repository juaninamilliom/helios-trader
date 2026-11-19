> Includes historical troubleshooting notes. The polling manager is active; see finance-local-setup.md for current status.

# Local watched API and accessible logs

The user explicitly authorized watched API restart, background operation and local log capture on November 18, 2026. Authentication behavior is not changed by this setup.

## Planning protocol and boundary

Rechecked evidence: `package.json:8` previously read `"dev:api": "npm run --workspace=api start:finance"`; `scripts/finance-command.mjs:13` starts a single child with inherited output. This provides neither source watching nor an agent-readable log file. The existing Nest `start:dev` runs a different legacy entry point and invokes its compilation pipeline, so it is unsuitable for this no-build finance flow.

General architecture consultation: retain the existing finance entry and environment loader; use Node built-ins, with polling over API source, TypeScript configuration, both server environment files and the environment-loader script. Re-read environment values on every restart. Exclude runtime logs from watched paths. Use private authenticated localhost control instead of broad process-name kills. General privacy consultation: log route templates/status/session-presence flags only; suppress unknown application payloads and redact credentials before writing to ignored, size-limited local files.

Implementation boundaries: (1) watcher/control/log wrapper and scripts; (2) development-only sanitized HTTP instrumentation; (3) operational verification and documentation. No commit was made. Both workspace no-emit type-checks are required; no build. The direct user request authorizes implementing this setup without another optional confirmation.

## Commands

From the repository root:

```sh
npm run dev:api:start
npm run dev:api:status
npm run dev:api:logs
npm run dev:api:restart
npm run dev:api:stop
```

`npm run dev:api` runs the same polling supervisor in the foreground. `npm run dev` combines that API supervisor and Next's existing development watcher. Do not run a second API alongside the background-managed API. To start the frontend separately, use `WATCHPACK_POLLING=true npm run dev:web`.

The API keeps serving at http://127.0.0.1:3003 and the browser entry is http://localhost:3001/connected. A source or server environment-file save triggers a graceful API restart. Invalid source leaves the process failed until the next source change or explicit restart; it does not enter an infinite restart loop. Schema edits still need explicit Prisma generation/migration.

## Files

- `.local/helios-dev/api.log`: agent-readable, sanitized API/HTTP operational log. Rotates at approximately 5 MiB, retaining one `.1` file.
- `.local/helios-dev/api.pid.json`: private supervisor metadata and control credential. Do not paste or share its contents.
- Both are ignored by Git. Log writes do not trigger restarts.

The supervisor accepts only a private generated bearer token on an ephemeral localhost control port. Commands read it locally; tokens are not printed. It refuses startup if the API port is already occupied. It never kills processes by a broad pattern or uses a stale PID file as authority to stop an unrelated process.

HTTP logs include method, route template, status, requestAuthenticated and sessionHasUser. They omit request URLs/query parameters, cookies, session IDs, tokens, email, balances and account data. Unrecognized output is suppressed instead of being copied blindly into logs. The agent can read this log directly; the user should not need to copy/paste logs.

## Verification record

- API and web full no-emit type-checks passed after instrumentation.
- Script syntax checks passed.
- Synthetic redaction checks passed for credentials, cookies, email, account numbers and unexpected payload fields.
- Native Node watch initially failed under local permissions after launching an API child. Polling replaced that implementation. The API child from the failed launch was identified from its own startup output, but macOS denied the agent's signal with `EPERM`; one-time user termination was requested. This is an operational blocker until the occupied port is released, not a claim that the final polling supervisor has been verified.
- Final source/environment restart and readiness outcomes are recorded below when completed.

The original watcher-only scope did not change authentication. The later explicitly approved callback fix is recorded below.

## Approved follow-up: session login and activation

The user explicitly authorized “fix it” for the diagnosed login defect and completion of the watcher. Rechecked `auth.controller.ts:21-24`: `googleAuthRedirect(@Req() _req: Request, @Res() res: Response)` immediately calls `res.redirect(...)`. Installed Nest Passport guard sets the request user at `node_modules/@nestjs/passport/dist/auth.guard.js:45` but provides a separate `async logIn(request)` at line 54. Passport's session manager saves the session before invoking the login completion callback.

General identity consultation: retain the existing OAuth guard, state verification, verified-email validation, serializer, session rotation and persistent store. Explicitly await callback-style `req.logIn` with sessions enabled; reject missing users and propagate save/serialization errors before redirect. General operations consultation: recheck the occupied port rather than trusting the old process identifier; activate the polling supervisor only after port release, then verify source and environment mtime changes without altering their contents.

Boundaries: minimal callback fix and timing/error tests; shared session middleware configuration for a synthetic OAuth-result HTTP regression using real Passport and Postgres; polling activation/restart/readiness checks. No commits, builds, provider account changes or deployment. Verification requires both no-emit type-checks, focused auth tests, and the new persisted-login regression. A synthetic guard stands in for Google only in the test; it does not prove a live browser/provider login.


### Follow-up verification

The callback now awaits `req.logIn` with `session: true` before redirecting and rejects callbacks with no user. Existing OAuth state and verified-email checks remain. Unit checks passed for delayed-save redirect timing, session-save error propagation and missing-user rejection. Both workspace type-checks passed.

`test/auth-session.integration.ts` passed against the isolated Docker Postgres database, with only the Google guard replaced by a synthetic result. It verified a rotated login cookie, the persisted Passport user before redirect completion, authenticated status and a protected API on a later request, anonymous/tampered-cookie rejection, and logout invalidation. An initial test expected logout HTTP 200; it was corrected to match the existing endpoint’s HTTP 201 response, without changing logout behavior.

Run with `npm run --workspace=api test:auth-session` after starting `helios-integration-pg`. No actual Google, Plaid or OpenAI requests are made by this regression. Live Google browser sign-in remains a separate final check after the running server reloads the fixed source.

Current activation blocker as of this follow-up: port 3003 was rechecked and still owned by the old verified Helios API process despite the earlier user-reported stop. Its working directory was confirmed as this repository’s `packages/api`. The OS denied a new termination attempt with `EPERM`. A one-time user force-stop was requested; the new manager was not started on top of the old listener. No unrelated processes were stopped. Final polling restart verification must not be claimed until that port is released.

### Activation completed

On November 18, after the user released the stuck listener, the polling supervisor started successfully in the background. Its private control/status endpoint reported `managed: true`, `watchMode: polling` and `apiChildRunning: true`. Source-file and `.env.finance.local` modification-time changes each triggered an automatic graceful restart and restored API readiness. Contents were not changed; original timestamps were restored, triggering a third successful restart. Final API and frontend checks returned HTTP 200. Google login initiation returned HTTP 302 to Google with the expected localhost callback and a state parameter; no tokens or cookies were printed.

The earlier port/termination blocker is resolved. The running API now loads the approved session-login fix. The agent read the sanitized private log directly and confirmed startup and request events. The remaining provider verification is an actual user Google sign-in in the browser; the persisted-login regression already passed with a synthetic provider result and real Passport/Postgres behavior.
