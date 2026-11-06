const crypto = require('node:crypto');

const serviceNames = {
  maintenance: 'Preventive maintenance', service: 'HVAC service',
  installation: 'HVAC installation and replacement', repair: 'AC and heating repair',
  generators: 'Electric generator sales'
};
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
function deliveryConfigured(env = process.env, recipient) {
  const from = env.CONTACT_FROM_EMAIL || '';
  const mailbox = from.match(/<([^<>]+)>$/)?.[1] || from;
  return Boolean(env.RESEND_API_KEY && emailPattern.test(mailbox) && !/[\r\n]/.test(from) && emailPattern.test(recipient || ''));
}

function validateInquiry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: ['form'] };
  const data = {}, errors = [];
  const fields = { name: 100, phone: 30, email: 254, address: 200, unit: 50, city: 100, state: 2, zip: 10, details: 2000, service: 20, property: 20 };
  for (const [key, limit] of Object.entries(fields)) {
    const value = input[key] === undefined ? '' : input[key];
    if (typeof value !== 'string') { errors.push(key); continue; }
    data[key] = value.trim();
    if (data[key].length > limit || (key === 'details' ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(data[key])) errors.push(key);
  }
  for (const key of ['name', 'phone', 'address', 'city', 'state', 'zip', 'details']) if (!data[key]) errors.push(key);
  if (data.phone && (!/^[+\d\s().-]+$/.test(data.phone) || !/^\d{10,15}$/.test(data.phone.replace(/\D/g, '')))) errors.push('phone');
  if (data.email && !emailPattern.test(data.email)) errors.push('email');
  if (data.state !== 'TX') errors.push('state');
  if (!/^\d{5}(-\d{4})?$/.test(data.zip || '')) errors.push('zip');
  if (!Object.hasOwn(serviceNames, data.service || '')) errors.push('service');
  if (!['residential', 'commercial'].includes(data.property)) errors.push('property');
  if (input.consent !== true) errors.push('consent');
  if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(input.requestId || '')) errors.push('requestId');
  return { data, errors: [...new Set(errors)] };
}

function createInquiryHandler({ contact, json, allowed, readBody, env = process.env, fetchImpl = fetch }) {
  // Only fingerprints and in-flight promises are cached; customer details are not written to disk or logs.
  const requests = new Map();
  return async (req, res) => {
    const origin = req.headers.origin;
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    if (origin !== `${protocol}://${req.headers.host}`) return json(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'JSON_REQUIRED' });
    let input;
    try { input = JSON.parse(await readBody(req)); }
    catch (error) { return json(res, error.message === 'BODY_TOO_LARGE' ? 413 : 400, { error: error.message === 'BODY_TOO_LARGE' ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON' }); }
    if (input?.website) return json(res, 422, { error: 'INVALID_REQUEST' });
    const { data, errors } = validateInquiry(input);
    if (errors.length) return json(res, 422, { error: 'INVALID_FIELDS', fields: errors });
    if (!deliveryConfigured(env, contact.email)) return json(res, 503, { error: 'DELIVERY_NOT_CONFIGURED' });
    const id = input.requestId;
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const now = Date.now();
    for (const [key, entry] of requests) if (entry.expires < now) requests.delete(key);
    const existing = requests.get(id);
    if (existing) {
      if (existing.fingerprint !== fingerprint) return json(res, 409, { error: 'REQUEST_CHANGED' });
      const result = await existing.promise;
      return json(res, result.status, result.body);
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    if (!allowed('inquiry:' + ip, 5, 15 * 60 * 1000) || requests.size >= 2000) return json(res, 429, { error: 'RATE_LIMITED' });
    const reference = 'TC-' + id.slice(0, 8).toUpperCase();
    const text = [
      'Texcold website quote request', `Reference: ${reference}`, '',
      `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email || 'Not provided'}`,
      `Property: ${data.property}`, `Service: ${serviceNames[data.service]}`,
      `Service address: ${[data.address, data.unit, data.city, data.state + ' ' + data.zip].filter(Boolean).join(', ')}`,
      '', data.details, '', 'Customer agreed to be contacted about this request. No appointment is booked.'
    ].join('\n');
    const payload = { from: env.CONTACT_FROM_EMAIL, to: [contact.email], subject: `Texcold quote request - ${serviceNames[data.service]} - ${reference}`, text };
    if (data.email) payload.reply_to = data.email;
    const entry = { fingerprint, expires: now + 24 * 60 * 60 * 1000 };
    entry.promise = (async () => {
      try {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'texcold-quote/' + id },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(12000)
        });
        const result = await response.json();
        if (!response.ok || typeof result.id !== 'string' || !result.id) {
          requests.delete(id);
          return { status: 502, body: { error: 'DELIVERY_UNCONFIRMED' } };
        }
        return { status: 200, body: { ok: true, reference, status: 'accepted_for_email_delivery' } };
      } catch {
        requests.delete(id);
        return { status: 502, body: { error: 'DELIVERY_UNCONFIRMED' } };
      }
    })();
    requests.set(id, entry);
    const result = await entry.promise;
    return json(res, result.status, result.body);
  };
}

module.exports = { createInquiryHandler, validateInquiry, deliveryConfigured };
