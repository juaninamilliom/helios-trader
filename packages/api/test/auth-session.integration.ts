/* eslint-disable @typescript-eslint/no-require-imports -- Load app modules only after installing isolated test environment values. */
/** Synthetic Google-result regression: real callback, Passport, cookies and Postgres.
 * The Google guard alone is replaced in this test. No Google/Plaid/OpenAI requests.
 */
import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL:
    'postgresql://postgres:helios_local_test@127.0.0.1:55432/helios_integration',
  SESSION_SECRET: 'synthetic-login-session-test-secret-32',
  FRONTEND_URL: 'http://localhost:3001',
  GOOGLE_CLIENT_ID: 'synthetic-google-client',
  GOOGLE_CLIENT_SECRET: 'synthetic-google-secret',
  PLAID_CLIENT_ID: '',
  PLAID_SECRET: '',
  OPENAI_API_KEY: '',
  PLAID_ENV: 'sandbox',
});
const { Test } = require('@nestjs/testing') as typeof import('@nestjs/testing');
const { AuthGuard } =
  require('@nestjs/passport') as typeof import('@nestjs/passport');
const { FinanceModule } =
  require('../src/finance/finance.module') as typeof import('../src/finance/finance.module');
const { FinanceDatabase } =
  require('../src/finance/database') as typeof import('../src/finance/database');
const { configureFinanceApp } =
  require('../src/finance.main') as typeof import('../src/finance.main');
type AuthStatus = { isAuthenticated: boolean; user: { id: number } | null };
async function main() {
  let fixture: { id: number; email: string } | undefined;
  const module = await Test.createTestingModule({ imports: [FinanceModule] })
    .overrideGuard(AuthGuard('google'))
    .useValue({
      canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<Request>();
        req.user = fixture;
        return true;
      },
    })
    .compile();
  const app = configureFinanceApp(
    module.createNestApplication({ logger: false }),
  );
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const db = app.get(FinanceDatabase);
  let sid: string | undefined;
  try {
    fixture = await db.user.create({
      data: { email: `session-regression-${randomUUID()}@example.invalid` },
      select: { id: true, email: true },
    });
    const anonymous = await fetch(`${base}/authentication/status`);
    assert.equal(
      ((await anonymous.json()) as AuthStatus).isAuthenticated,
      false,
    );
    const callback = await fetch(`${base}/authentication/google/callback`, {
      redirect: 'manual',
    });
    assert.equal(callback.status, 302);
    assert.equal(
      callback.headers.get('location'),
      'http://localhost:3001/connected',
    );
    const header = callback.headers.get('set-cookie');
    assert(header, 'callback must set rotated login cookie');
    const cookie = header.split(';')[0];
    const signed = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
    sid = signed.slice(2, signed.lastIndexOf('.'));
    const persisted = await db.financeSession.findUniqueOrThrow({
      where: { id: sid },
    });
    assert.equal(
      (persisted.payload as { passport?: { user?: { id: number } } }).passport
        ?.user?.id,
      fixture.id,
      'session user must be persisted before redirect response',
    );
    const status = await fetch(`${base}/authentication/status`, {
      headers: { Cookie: cookie },
    });
    const identity = (await status.json()) as AuthStatus;
    assert.equal(identity.isAuthenticated, true);
    assert.equal(identity.user?.id, fixture.id);
    assert.equal(
      (await fetch(`${base}/finance/snapshot`, { headers: { Cookie: cookie } }))
        .status,
      200,
      'subsequent guarded API request authenticated',
    );
    const tampered = await fetch(`${base}/authentication/status`, {
      headers: { Cookie: 'helios.sid=invalid-synthetic-cookie' },
    });
    assert.equal(
      ((await tampered.json()) as AuthStatus).isAuthenticated,
      false,
    );
    const logout = await fetch(`${base}/authentication/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'http://localhost:3001' },
    });
    assert.equal(logout.status, 201);
    const after = await fetch(`${base}/authentication/status`, {
      headers: { Cookie: cookie },
    });
    assert.equal(
      ((await after.json()) as AuthStatus).isAuthenticated,
      false,
      'logout invalidates persisted login',
    );
    console.log(
      'PASS: synthetic Google callback -> persisted Passport/Postgres session -> authenticated status and protected API; anonymous/tampered-cookie/logout requests remain unauthenticated. No live Google login claimed.',
    );
  } finally {
    if (sid) await db.financeSession.deleteMany({ where: { id: sid } });
    if (fixture) await db.user.deleteMany({ where: { id: fixture.id } });
    await app.close();
  }
}
void main().catch(() => {
  console.error(
    'FAIL: synthetic auth-session regression. Inspect the focused test assertions; no credentials or cookies were printed.',
  );
  process.exitCode = 1;
});
