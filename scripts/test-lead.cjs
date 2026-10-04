/* Проверка серверной функции без реального Telegram: node scripts/test-lead.cjs */
'use strict';

const assert = require('assert');
const path = require('path');

process.env.TG_TOKEN = 'fake:test-only';
process.env.TG_CHAT_ID = '123456';

const sent = [];
let telegramOk = true;
global.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body) });
  return { ok: telegramOk };
};

const lead = require(path.join(__dirname, '..', 'netlify', 'functions', 'lead.js'));

let ipCounter = 0;
function ev(body, overrides) {
  ipCounter += 1;
  return Object.assign({
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'liw.test',
      origin: 'https://liw.test',
      'x-nf-client-connection-ip': '10.0.0.' + ipCounter
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  }, overrides || {});
}

const good = {
  phone: '8 (777) 123-45-67', name: 'Александр', business: 'BARBER HOUSE',
  type: 'Сайт для бизнеса', message: 'Нужен сайт для барбершопа\nс услугами и ценами'
};

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('валидная заявка → 1 сообщение в Telegram', async () => {
  sent.length = 0;
  const r = await lead.handler(ev(good));
  assert.strictEqual(r.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(r.body), { ok: true });
  assert.strictEqual(sent.length, 1);
  const t = sent[0].body.text;
  assert.ok(t.includes('НОВАЯ ЗАЯВКА — LIW'));
  assert.ok(t.includes('+7 777 123 45 67'));
  assert.ok(t.includes('BARBER HOUSE'));
  assert.ok(t.includes('https://wa.me/77771234567'));
  assert.strictEqual(sent[0].body.chat_id, '123456');
  assert.ok(sent[0].url.startsWith('https://api.telegram.org/bot'));
  console.log('\n--- пример сообщения ---\n' + t + '\n------------------------');
});

test('HTML в полях экранируется', async () => {
  sent.length = 0;
  await lead.handler(ev(Object.assign({}, good, { name: '<b>x</b><script>', message: '<a href="x">y</a> & z' })));
  const t = sent[0].body.text;
  assert.ok(!t.includes('<script>'));
  assert.ok(t.includes('&lt;b&gt;x&lt;/b&gt;&lt;script&gt;'));
  assert.ok(t.includes('&amp; z'));
});

test('только телефон — тоже ок', async () => {
  const r = await lead.handler(ev({ phone: '+7 777 123 45 67' }));
  assert.strictEqual(r.statusCode, 200);
});

test('нет телефона → 400 field=phone', async () => {
  const r = await lead.handler(ev({ name: 'Аня' }));
  assert.strictEqual(r.statusCode, 400);
  assert.strictEqual(JSON.parse(r.body).field, 'phone');
});

test('мусор вместо телефона → 400', async () => {
  for (const p of ['abc', '123', '+7 777 <script>', '1'.repeat(40)]) {
    const r = await lead.handler(ev({ phone: p }));
    assert.strictEqual(r.statusCode, 400, p);
  }
});

test('honeypot → 200, но ничего не отправлено', async () => {
  sent.length = 0;
  const r = await lead.handler(ev(Object.assign({}, good, { website: 'http://spam' })));
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(sent.length, 0);
});

test('не POST → 405', async () => {
  const r = await lead.handler(ev(good, { httpMethod: 'GET' }));
  assert.strictEqual(r.statusCode, 405);
});

test('не JSON content-type → 415', async () => {
  const e = ev(good);
  e.headers['content-type'] = 'text/plain';
  assert.strictEqual((await lead.handler(e)).statusCode, 415);
});

test('битый JSON → 400', async () => {
  assert.strictEqual((await lead.handler(ev('{oops'))).statusCode, 400);
});

test('слишком большое тело → 413', async () => {
  const r = await lead.handler(ev({ phone: '+77771234567', message: 'x'.repeat(20000) }));
  assert.strictEqual(r.statusCode, 413);
});

test('чужой Origin → 403', async () => {
  const e = ev(good);
  e.headers.origin = 'https://evil.example';
  assert.strictEqual((await lead.handler(e)).statusCode, 403);
});

test('лимиты длины полей', async () => {
  sent.length = 0;
  await lead.handler(ev(Object.assign({}, good, { name: 'N'.repeat(500), message: 'M'.repeat(5000) })));
  const t = sent[0].body.text;
  assert.ok(!t.includes('N'.repeat(81)));
  assert.ok(!t.includes('M'.repeat(1501)));
  assert.ok(t.length < 4096);
});

test('rate limit: 6-я заявка с одного IP → 429', async () => {
  const mk = () => {
    const e = ev(good);
    e.headers['x-nf-client-connection-ip'] = '192.168.1.1';
    return e;
  };
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await lead.handler(mk())).statusCode);
  assert.deepStrictEqual(codes, [200, 200, 200, 200, 200, 429]);
});

test('Telegram вернул ошибку → 502 без технических деталей', async () => {
  telegramOk = false;
  const r = await lead.handler(ev(good));
  telegramOk = true;
  assert.strictEqual(r.statusCode, 502);
  assert.ok(!r.body.includes('TOKEN'));
});

test('нет переменных окружения → 500 без утечек', async () => {
  const t = process.env.TG_TOKEN;
  delete process.env.TG_TOKEN;
  const r = await lead.handler(ev(good));
  process.env.TG_TOKEN = t;
  assert.strictEqual(r.statusCode, 500);
  assert.ok(!r.body.includes('TG_'));
});

(async () => {
  let failed = 0;
  const origErr = console.error;
  console.error = () => {}; // серверные логи ошибок в тестах не нужны
  for (const [name, fn] of tests) {
    try { await fn(); console.log('✓', name); }
    catch (e) { failed += 1; console.log('✗', name, '\n   ', e.message); }
  }
  console.error = origErr;
  console.log(failed ? `\nПровалено: ${failed}` : `\nВсе тесты пройдены (${tests.length})`);
  process.exit(failed ? 1 : 0);
})();
