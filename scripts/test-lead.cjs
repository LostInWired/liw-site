/* Проверка серверной функции без реального Telegram: node scripts/test-lead.cjs */
'use strict';
const assert = require('assert');
const path = require('path');

process.env.TG_TOKEN = 'fake:test-only';
process.env.TG_CHAT_ID = '123456';

const sent = [];
let telegramOk = true;
global.fetch = async (url, opts) => { sent.push({ url, body: JSON.parse(opts.body) }); return { ok: telegramOk }; };

const lead = require(path.join(__dirname, '..', 'netlify', 'functions', 'lead.cjs'));

let ip = 0;
const ev = (body, over) => Object.assign({
  httpMethod: 'POST',
  headers: { 'content-type': 'application/json', host: 'liw.test', origin: 'https://liw.test', 'x-nf-client-connection-ip': '10.0.0.' + (++ip) },
  body: typeof body === 'string' ? body : JSON.stringify(body)
}, over || {});

const good = { name: 'Алия', phone: '8 (777) 123-45-67', choice: 'barber', consent: true };
const tests = [];
const test = (n, f) => tests.push([n, f]);
const status = async (e) => (await lead.handler(e)).statusCode;

test('нормальная заявка уходит в Telegram', async () => {
  sent.length = 0;
  assert.strictEqual(await status(ev(good)), 200);
  assert.strictEqual(sent.length, 1);
  assert.ok(sent[0].body.text.includes('Шаблон: барбершоп') && sent[0].body.text.includes('+7 777 123 45 67'));
});
test('собственный сайт принимается', async () => assert.strictEqual(await status(ev({ ...good, choice: 'custom' })), 200));
for (const c of ['auto', 'beauty', 'fitness']) test(`шаблон ${c} принимается`, async () => assert.strictEqual(await status(ev({ ...good, choice: c })), 200));
test('неизвестный выбор отклоняется', async () => assert.strictEqual(await status(ev({ ...good, choice: 'hack' })), 400));
test('без согласия отклоняется', async () => assert.strictEqual(await status(ev({ ...good, consent: false })), 400));
test('без имени отклоняется', async () => assert.strictEqual(await status(ev({ ...good, name: '  ' })), 400));
test('плохой телефон отклоняется', async () => assert.strictEqual(await status(ev({ ...good, phone: '123' })), 400));
test('honeypot молча принимается и НЕ отправляется', async () => {
  sent.length = 0;
  assert.strictEqual(await status(ev({ ...good, website: 'http://spam' })), 200);
  assert.strictEqual(sent.length, 0);
});
test('чужой origin блокируется', async () => assert.strictEqual(await status(ev(good, { headers: { 'content-type': 'application/json', host: 'liw.test', origin: 'https://evil.test' } })), 403));
test('GET запрещён', async () => assert.strictEqual(await status(ev(good, { httpMethod: 'GET' })), 405));
test('не-JSON отклоняется', async () => assert.strictEqual(await status(ev(good, { headers: { 'content-type': 'text/plain', host: 'liw.test' } })), 415));
test('большое тело отклоняется', async () => assert.strictEqual(await status(ev({ ...good, name: 'a'.repeat(5000) })), 413));
test('HTML в имени экранируется', async () => {
  sent.length = 0;
  await lead.handler(ev({ ...good, name: '<b>x</b>' }));
  assert.ok(!sent[0].body.text.includes('<b>x</b>') && sent[0].body.text.includes('&lt;b&gt;x'));
});
test('лимит запросов с одного IP', async () => {
  const same = { headers: { 'content-type': 'application/json', host: 'liw.test', 'x-nf-client-connection-ip': '9.9.9.9' } };
  let last = 0;
  for (let i = 0; i < 7; i++) last = await status(ev(good, same));
  assert.strictEqual(last, 429);
});
test('ошибка Telegram даёт 502', async () => { telegramOk = false; assert.strictEqual(await status(ev(good)), 502); telegramOk = true; });
test('без токена в окружении даёт 500', async () => {
  const t = process.env.TG_TOKEN; delete process.env.TG_TOKEN;
  assert.strictEqual(await status(ev(good)), 500); process.env.TG_TOKEN = t;
});

(async () => {
  let failed = 0;
  for (const [n, f] of tests) {
    try { await f(); console.log('ok  ', n); } catch (e) { failed++; console.log('FAIL', n, '-', e.message); }
  }
  console.log(failed ? `\n${failed} тест(ов) упало` : `\nВсе ${tests.length} тестов прошли`);
  process.exit(failed ? 1 : 0);
})();
