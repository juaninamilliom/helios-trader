/** Real inference adapters against local HTTP stand-ins. No credentials or personal data. */
import * as assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { CategoryInference } from '../src/finance/inference';
async function control(scenario: string, provider = 'openrouter') {
  const r = await fetch(`http://127.0.0.1:4010/${provider}/test/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  assert.equal(r.status, 200);
}
async function main() {
  const config = new ConfigService({
    OPENAI_API_KEY: 'test',
    TYPESAFE_API_KEY: 'test',
    TYPESAFE_BASE_URL: 'http://127.0.0.1:4010/typesafe',
    OPENROUTER_API_KEY: 'test',
    PROVIDER_TEST_MODE: 'true',
    OPENAI_BASE_URL: 'http://127.0.0.1:4010/openai',
    OPENROUTER_BASE_URL: 'http://127.0.0.1:4010/openrouter',
    FINANCE_MODEL: 'gpt-6-luna',
  });
  const inference = new CategoryInference(config);
  await fetch('http://127.0.0.1:4010/openai/test/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"scenario":"normal"}',
  });
  assert.equal(inference.model, 'gpt-6-luna');
  assert.equal(
    (await inference.classifyDetailed('Synthetic Market 123')).ok,
    true,
    'Luna Responses wire format',
  );
  const openaiScope = inference.consentScope;
  config.set('FINANCE_CLASSIFIER', 'jev');
  assert.notEqual(inference.consentScope, openaiScope);
  await control('normal', 'typesafe');
  assert.equal(inference.recipient, 'TypeSafe');
  assert.equal(
    (await inference.classifyDetailed('Synthetic Market')).ok,
    true,
    'Direct Jev System One wire format',
  );
  const directScope = inference.consentScope;
  config.set('FINANCE_JEV_PROVIDER', 'openrouter');
  assert.notEqual(inference.consentScope, directScope);
  await control('normal');
  assert.equal(
    (await inference.classifyDetailed('Synthetic Market')).ok,
    true,
    'Jev typed answer accepted',
  );
  for (const scenario of ['invalid', 'low', 'abstain']) {
    await control(scenario);
    assert.equal(
      (await inference.classifyDetailed('Synthetic Market')).ok,
      false,
      `Jev ${scenario} not accepted`,
    );
  }
  await control('unauthorized');
  assert.deepEqual(await inference.classifyDetailed('Synthetic Market'), {
    ok: false,
    reason: 'unauthorized',
  });
  await control('rate-limit');
  assert.deepEqual(await inference.classifyDetailed('Synthetic Market'), {
    ok: false,
    reason: 'rate_limited',
  });
  config.set('FINANCE_CLASSIFIER', 'luna');
  config.set('FINANCE_LUNA_PROVIDER', 'openrouter');
  assert.deepEqual(
    await inference.classifyDetailed('Synthetic Market'),
    { ok: false, reason: 'privacy_route_missing' },
    'OpenRouter Luna fails closed without provider allowlist',
  );
  config.set('OPENROUTER_PROVIDERS', 'Azure');
  await control('normal');
  assert.equal(
    (await inference.classifyDetailed('Synthetic Market')).ok,
    true,
    'OpenRouter Luna chat format',
  );
  await control('invalid');
  assert.equal(
    (await inference.classifyDetailed('Synthetic Market')).ok,
    false,
  );
  console.log(
    'PASS: Luna Responses, direct Jev System One, Jev Decisions, OpenRouter Luna chat, consent route fingerprint, privacy allowlist, invalid answers, abstention, unauthorized and rate-limit handling. Stand-ins only.',
  );
}
void main().catch(() => {
  console.error('FAIL: inference routing HTTP integration');
  process.exitCode = 1;
});
