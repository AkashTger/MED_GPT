import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/api.js';
import { selectLabel, validateEvidence } from '../src/safety.js';
import { Quota } from '../src/quota.js';

const origin = 'https://example.github.io';
const lookup = { medicineName: 'Example brand', activeIngredient: 'Paracetamol', strength: '500 mg', dosageForm: 'Tablet', accessCode: 'test-code', confirmedIngredient: true };
const record = {
  set_id: '12345678-1234-1234-1234-123456789abc', effective_time: '20260101',
  openfda: { generic_name: ['ACETAMINOPHEN'], substance_name: ['ACETAMINOPHEN'], route: ['ORAL'], brand_name: ['Test label'] },
  active_ingredient: ['Acetaminophen 500 mg in each tablet'],
  purpose: ['Temporarily relieves minor aches and pains.'], warnings: ['Do not use with another medicine containing acetaminophen.'],
};
const section = { id: 'uses', title: 'Uses', content: 'Relieves minor aches and pains.', field: 'purpose', quote: record.purpose[0] };
const environment = () => ({ ALLOWED_ORIGIN: origin, GEMINI_API_KEY: 'fake-key', GEMINI_MODEL: 'test-model', BETA_ACCESS_CODES: 'test-code', QUOTA: { idFromName: x => x, get: () => ({ fetch: async () => Response.json({ allowed: true }) }) } });
const request = (body = lookup) => new Request('https://api.example/api/lookup', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('matches paracetamol alias to single-ingredient acetaminophen label', () => assert.equal(selectLabel([record], lookup), record));
test('matches cetirizine to a single-ingredient cetirizine hydrochloride label', () => {
  const cetirizine = {
    ...record,
    openfda: { ...record.openfda, generic_name: ['CETIRIZINE HYDROCHLORIDE'], substance_name: ['CETIRIZINE HYDROCHLORIDE'] },
    active_ingredient: ['Cetirizine hydrochloride 10 mg in each tablet'],
  };
  assert.equal(selectLabel([cetirizine], { ...lookup, activeIngredient: 'Cetirizine', strength: '10 mg' }), cetirizine);
});

test('rejects combination, wrong route, strength, and release variants', () => {
  for (const changed of [
    { openfda: { ...record.openfda, substance_name: ['ACETAMINOPHEN', 'CAFFEINE'] } },
    { openfda: { ...record.openfda, route: ['INTRAVENOUS'] } },
    { active_ingredient: ['Acetaminophen 650 mg in each tablet'] },
    { description: ['Extended release tablets'] },
  ]) assert.equal(selectLabel([{ ...record, ...changed }], lookup), null);
});
test('requires source quotes and preserves clinical text exactly', () => {
  const label = { facts: { purpose: record.purpose[0], warnings: record.warnings[0] } };
  assert.equal(validateEvidence({ sections: [section] }, label), true);
  assert.equal(validateEvidence({ sections: [{ ...section, quote: 'Invented evidence that is absent.' }] }, label), false);
  assert.equal(validateEvidence({ sections: [section, section] }, label), false);
  assert.equal(validateEvidence({ sections: [{ ...section, id: 'precautions', field: 'warnings', quote: record.warnings[0] }] }, label), false);
  assert.equal(validateEvidence({ sections: [{ ...section, id: 'precautions', field: 'warnings', quote: record.warnings[0], content: record.warnings[0] }] }, label), true);
});

test('chat gets a structured Gemini overview without a FDA label lookup', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.ok(String(url).includes('generativelanguage.googleapis.com'));
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({
      medicineName: 'Cetirizine', summary: 'General education only.', sections: [{ title: 'Overview', content: 'An antihistamine.' }],
      safetyNotices: [{ severity: 'caution', message: 'Verify the package.' }],
    }) }] } }] });
  };
  try {
    const chat = new Request('https://api.example/api/chat', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'What is cetirizine?', accessCode: 'test-code' }) });
    const response = await worker.fetch(chat, environment());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'general');
  } finally { globalThis.fetch = previous; }
});

test('successful lookup uses isolated Gemini instructions and a record-specific source', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    if (String(url).includes('api.fda.gov')) return Response.json({ results: [record] });
    const payload = JSON.parse(options.body);
    assert.equal(payload.generationConfig.responseMimeType, 'application/json');
    assert.equal(payload.generationConfig.responseJsonSchema.type, 'object');
    assert.ok(!payload.systemInstruction.parts[0].text.includes(lookup.medicineName));
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ sections: [section] }) }] } }] });
  };
  try {
    const response = await worker.fetch(request(), environment());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const body = await response.json();
    assert.equal(body.status, 'source_backed');
    assert.ok(body.sources[0].url.includes(record.set_id));
    assert.equal(body.labelWarnings.warnings, record.warnings[0]);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = previous; }
});

test('refusal, truncated response, malformed JSON and unsupported claims fail closed', async () => {
  const previous = globalThis.fetch;
  try {
    for (const output of [
      { promptFeedback: { blockReason: 'SAFETY' } },
      { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [] } }] },
      { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'invalid' }] } }] },
      { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ sections: [{ ...section, quote: 'Invented medical instructions here.' }] }) }] } }] },
    ]) {
      globalThis.fetch = async url => Response.json(String(url).includes('api.fda.gov') ? { results: [record] } : output);
      assert.equal((await worker.fetch(request(), environment())).status, 502);
    }
  } finally { globalThis.fetch = previous; }
});

test('unconfigured, oversized and query injection requests do not reach providers', async () => {
  assert.equal((await worker.fetch(request(), {})).status, 403);
  assert.equal((await worker.fetch(request(), { ALLOWED_ORIGIN: origin })).status, 503);
  assert.equal((await worker.fetch(request({ ...lookup, medicineName: 'a'.repeat(5000) }), environment())).status, 413);
  assert.equal((await worker.fetch(request({ ...lookup, activeIngredient: 'x" OR *' }), environment())).status, 400);
});
test('quota refusal prevents source and AI calls', async () => {
  const env = environment();
  env.QUOTA.get = () => ({ fetch: async () => Response.json({ allowed: false }) });
  assert.equal((await worker.fetch(request(), env)).status, 429);
});

test('transactional quota enforces code, IP and global caps', async () => {
  const values = new Map();
  let queue = Promise.resolve();
  const storage = { get: async key => structuredClone(values.get(key)), put: async (key, value) => values.set(key, structuredClone(value)) };
  storage.transaction = fn => { const next = queue.then(() => fn(storage)); queue = next.catch(() => {}); return next; };
  const quota = new Quota({ storage });
  const consume = async (code, ip) => (await (await quota.fetch(new Request('https://quota', { method: 'POST', body: JSON.stringify({ code, ip, limit: 2, globalLimit: 3 }) }))).json()).allowed;
  const concurrent = await Promise.all([consume('a', 'one'), consume('a', 'two'), consume('a', 'three')]);
  assert.equal(concurrent.filter(Boolean).length, 2);
  assert.equal(await consume('b', 'one'), true);
  assert.equal(await consume('c', 'four'), false);
});
