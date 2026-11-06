const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createInquiryHandler, validateInquiry, deliveryConfigured } = require('../lib/inquiries');
const { renderPage } = require('../site');

const valid = () => ({ name: 'QA Test Customer', phone: '(202) 555-0147', email: 'customer@example.com', address: '123 Test Street', unit: 'Suite 2', city: 'Houston', state: 'TX', zip: '77002', details: 'Synthetic test only. No service requested.', service: 'repair', property: 'commercial', consent: true, requestId: crypto.randomUUID(), website: '' });
const env = { RESEND_API_KEY: 'synthetic-test-key', CONTACT_FROM_EMAIL: 'Texcold Website <test@example.com>' };
function harness(overrides = {}) {
  const calls = [];
  const handler = createInquiryHandler({ contact: { email: 'texcold@hotmail.com' }, env,
    json: (res, status, body) => Object.assign(res, { status, body }),
    readBody: async req => req.raw === undefined ? JSON.stringify(req.input) : req.raw,
    allowed: () => true,
    fetchImpl: async (url, options) => { calls.push({ url, ...options }); return { ok: true, json: async () => ({ id: 'synthetic-provider-email-id' }) }; }, ...overrides });
  const send = async (input = valid(), extra = {}) => {
    const res = {};
    await handler({ headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' }, input, ...extra }, res);
    return res;
  };
  return { send, calls };
}

test('validates mandatory contact/address information, consent and service choices on the server', () => {
  assert.deepEqual(validateInquiry(valid()).errors, []);
  for (const field of ['name', 'phone', 'address', 'city', 'state', 'zip', 'details']) {
    assert.ok(validateInquiry({ ...valid(), [field]: '  ' }).errors.includes(field), field);
  }
  for (const [field, value] of [['phone', '123'], ['phone', '2025550147<script>'], ['zip', '7700'], ['email', 'bad-email'], ['email', 'x@example.com\r\nBcc:a@example.com'], ['state', 'CA'], ['service', 'invented'], ['property', 'other'], ['consent', false], ['requestId', 'bad-id'], ['name', { unsafe: true }], ['details', 'x'.repeat(2001)]]) {
    assert.ok(validateInquiry({ ...valid(), [field]: value }).errors.includes(field), field);
  }
  assert.deepEqual(validateInquiry({ ...valid(), email: '', unit: '', zip: '77002-1234' }).errors, []);
  for (const input of [null, [], 'text']) assert.deepEqual(validateInquiry(input).errors, ['form']);
});

test('sends complete requests only to the configured business recipient and returns a reference after provider acceptance', async () => {
  const { send, calls } = harness(); const input = valid();
  const result = await send({ ...input, to: 'attacker@example.com', _cc: 'attacker@example.com' });
  assert.equal(result.status, 200); assert.equal(result.body.status, 'accepted_for_email_delivery');
  assert.equal(result.body.reference, 'TC-' + input.requestId.slice(0, 8).toUpperCase());
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].headers['Idempotency-Key'], 'texcold-quote/' + input.requestId);
  const payload = JSON.parse(calls[0].body);
  assert.deepEqual(payload.to, ['texcold@hotmail.com']); assert.equal(payload.reply_to, input.email);
  assert.match(payload.text, /\(202\) 555-0147/); assert.match(payload.text, /123 Test Street, Suite 2, Houston, TX 77002/);
  assert.match(payload.text, /Property: commercial/); assert.match(payload.text, /AC and heating repair/);
  assert.doesNotMatch(JSON.stringify(payload), /attacker/); assert.doesNotMatch(JSON.stringify(result), /synthetic-test-key|Test Street|customer@example.com/);
});

test('retries and simultaneous clicks share the same send; changed content cannot reuse the request ID', async () => {
  const { send, calls } = harness(); const input = valid();
  const [a, b] = await Promise.all([send(input), send(input)]);
  assert.deepEqual(a, b); assert.equal(calls.length, 1);
  assert.deepEqual(await send(input), a); assert.equal(calls.length, 1);
  assert.equal((await send({ ...input, phone: '2025550188' })).status, 409); assert.equal(calls.length, 1);
});

test('provider errors, malformed responses and timeouts never produce success; retries retain the provider idempotency key', async () => {
  for (const fetchImpl of [async () => ({ ok: false, json: async () => ({ message: 'private provider error' }) }), async () => ({ ok: true, json: async () => ({}) }), async () => { throw new Error('timeout containing private provider details'); }]) {
    const { send } = harness({ fetchImpl }); const result = await send();
    assert.equal(result.status, 502); assert.deepEqual(result.body, { error: 'DELIVERY_UNCONFIRMED' });
  }
  const keys = []; let attempt = 0;
  const { send } = harness({ fetchImpl: async (url, options) => { keys.push(options.headers['Idempotency-Key']); if (!attempt++) throw new Error('timeout'); return { ok: true, json: async () => ({ id: 'accepted' }) }; } });
  const input = valid(); assert.equal((await send(input)).status, 502); assert.equal((await send(input)).status, 200); assert.equal(keys[0], keys[1]);
});

test('missing credentials, invalid input, cross-site posts, spam trap and throttling never call the email provider', async () => {
  for (const missingEnv of [{}, { RESEND_API_KEY: 'synthetic-key' }, { ...env, CONTACT_FROM_EMAIL: 'x\r\n@example.com' }]) {
    const h = harness({ env: missingEnv }); assert.equal((await h.send()).status, 503); assert.equal(h.calls.length, 0);
  }
  const h = harness();
  assert.equal((await h.send({ ...valid(), phone: '' })).status, 422);
  assert.equal((await h.send({ ...valid(), website: 'bot' })).status, 422);
  assert.equal((await h.send(valid(), { headers: { host: 'localhost:3000', origin: 'https://other.example' } })).status, 403);
  assert.equal((await h.send(valid(), { headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await h.send(valid(), { raw: '{' })).status, 400);
  assert.equal(h.calls.length, 0);
  const limited = harness({ allowed: () => false }); assert.equal((await limited.send()).status, 429); assert.equal(limited.calls.length, 0);
});

test('contact page switches to direct sending only with configuration; private secrets never appear in HTML', () => {
  assert.equal(deliveryConfigured({}, 'texcold@hotmail.com'), false);
  assert.equal(deliveryConfigured(env, 'texcold@hotmail.com'), true);
  for (const lang of ['en', 'es']) {
    assert.match(renderPage('/contact', lang), /data-delivery="draft"/);
    const html = renderPage('/contact', lang, { deliveryReady: true });
    assert.match(html, /data-delivery="direct"/); assert.match(html, /name="consent" type="checkbox" required/);
    assert.match(html, /name="phone"[^>]*required/); assert.match(html, /name="address"[^>]*required/);
    assert.doesNotMatch(html, /synthetic-test-key|RESEND_API_KEY|CONTACT_FROM_EMAIL/);
  }
});
