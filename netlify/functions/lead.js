/* ==========================================================================
   LIW — LOST IN WIRED · netlify/functions/lead.js
   Принимает заявку с сайта и отправляет ОДНО сообщение в Telegram.

   Секреты берутся только из переменных окружения Netlify:
     TG_TOKEN    — токен бота от @BotFather
     TG_CHAT_ID  — ваш chat id (куда присылать заявки)
   Необязательные:
     BRAND_NAME      — подпись в сообщении (по умолчанию "LIW")
     LEAD_TIMEZONE   — часовой пояс для даты (по умолчанию "Asia/Almaty")

   Защита: проверка метода/типа/размера, same-origin, honeypot, rate limit,
   валидация и очистка всех полей, лимиты длины, экранирование для Telegram.
   ========================================================================== */
'use strict';

const LIMITS = { phone: 30, name: 80, business: 120, type: 60, message: 1500 };
const MAX_BODY_CHARS = 10000;
const RATE_WINDOW_MS = 10 * 60 * 1000; // окно 10 минут
const RATE_MAX = 5;                    // не больше 5 заявок с одного IP за окно
const TELEGRAM_TIMEOUT_MS = 8000;

// Память живёт, пока «тёплый» экземпляр функции. Это базовая защита от простого спама;
// для жёсткой защиты используйте Netlify Rate Limiting / Cloudflare перед сайтом.
const hits = new Map();

/* ---------- Утилиты ---------- */
function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }, extraHeaders || {}),
    body: JSON.stringify(body)
  };
}

function header(event, name) {
  const h = event.headers || {};
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? String(h[key]) : '';
}

function clientIp(event) {
  return (
    header(event, 'x-nf-client-connection-ip') ||
    header(event, 'client-ip') ||
    header(event, 'x-forwarded-for').split(',')[0].trim() ||
    'unknown'
  );
}

function rateLimited(ip, now) {
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 2000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

// Очистка пользовательского текста: убираем управляющие и невидимые символы, режем длину
function clean(value, max, multiline) {
  if (typeof value !== 'string') return '';
  let s = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[​-‏‪-‮⁠-⁩﻿]/g, '')
    .replace(/\r\n?/g, '\n');
  if (multiline) {
    s = s.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n');
  } else {
    s = s.replace(/\s+/g, ' ');
  }
  return s.trim().slice(0, max);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function phoneDigits(phone) {
  return phone.replace(/\D/g, '');
}

function validPhone(phone) {
  const d = phoneDigits(phone);
  return /^[+\d\s().-]+$/.test(phone) && d.length >= 10 && d.length <= 15;
}

function formatPhone(phone) {
  const d = phoneDigits(phone);
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  }
  return phone;
}

function whatsappLink(phone) {
  let d = phoneDigits(phone);
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  return d.length >= 11 ? `https://wa.me/${d}` : '';
}

function formatDate(date) {
  const tz = process.env.LEAD_TIMEZONE || 'Asia/Almaty';
  const make = (timeZone) =>
    new Intl.DateTimeFormat('ru-RU', {
      timeZone, day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(date).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
  let p;
  try { p = make(tz); } catch (e) { p = make('UTC'); }
  return `${p.day}.${p.month}.${p.year} ${p.hour === '24' ? '00' : p.hour}:${p.minute}`;
}

function buildMessage(lead, date) {
  const brand = escapeHtml(clean(process.env.BRAND_NAME || 'LIW', 40) || 'LIW');
  const parts = [];

  parts.push(`<b>НОВАЯ ЗАЯВКА — ${brand}</b>`);
  parts.push(`<b>Тип:</b> ${escapeHtml(lead.type || 'Не указан')}`);

  const who = [];
  if (lead.name) who.push(`<b>Имя:</b> ${escapeHtml(lead.name)}`);
  if (lead.business) who.push(`<b>Бизнес:</b> ${escapeHtml(lead.business)}`);
  if (who.length) parts.push(who.join('\n'));

  const wa = whatsappLink(lead.phone);
  parts.push(
    `<b>WhatsApp / телефон:</b>\n${escapeHtml(formatPhone(lead.phone))}` +
    (wa ? `\n<a href="${wa}">Открыть чат в WhatsApp</a>` : '')
  );

  if (lead.message) parts.push(`<b>Описание:</b>\n${escapeHtml(lead.message)}`);
  parts.push(`<b>Дата:</b>\n${formatDate(date)}`);

  return parts.join('\n\n');
}

function sameOrigin(event) {
  const origin = header(event, 'origin');
  if (!origin) return true; // не-браузерные клиенты не блокируем
  let host;
  try { host = new URL(origin).host; } catch (e) { return false; }
  const allowed = [header(event, 'host'), header(event, 'x-forwarded-host')]
    .filter(Boolean).map((h) => h.split(',')[0].trim().toLowerCase());
  return allowed.includes(host.toLowerCase());
}

async function sendToTelegram(token, chatId, text) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TELEGRAM_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: ctrl.signal
    });
    return res.ok;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Обработчик ---------- */
exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
    }
    if (!sameOrigin(event)) {
      return json(403, { ok: false, error: 'forbidden' });
    }
    if (!/application\/json/i.test(header(event, 'content-type'))) {
      return json(415, { ok: false, error: 'unsupported_media_type' });
    }

    let raw = event.body || '';
    if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    if (raw.length > MAX_BODY_CHARS) {
      return json(413, { ok: false, error: 'payload_too_large' });
    }

    let data;
    try { data = JSON.parse(raw); } catch (e) { data = null; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return json(400, { ok: false, error: 'bad_request' });
    }

    // Honeypot: бот заполнил скрытое поле — делаем вид, что всё хорошо, но ничего не отправляем
    if (typeof data.website === 'string' && data.website.trim() !== '') {
      return json(200, { ok: true });
    }

    if (rateLimited(clientIp(event), Date.now())) {
      return json(429, { ok: false, error: 'too_many_requests' }, { 'Retry-After': '600' });
    }

    const lead = {
      phone: clean(data.phone, LIMITS.phone),
      name: clean(data.name, LIMITS.name),
      business: clean(data.business, LIMITS.business),
      type: clean(data.type, LIMITS.type),
      message: clean(data.message, LIMITS.message, true)
    };

    if (!validPhone(lead.phone)) {
      return json(400, { ok: false, error: 'invalid_phone', field: 'phone' });
    }

    const token = process.env.TG_TOKEN;
    const chatId = process.env.TG_CHAT_ID;
    if (!token || !chatId) {
      console.error('lead: TG_TOKEN или TG_CHAT_ID не заданы в переменных окружения Netlify');
      return json(500, { ok: false, error: 'server_not_configured' });
    }

    const delivered = await sendToTelegram(token, chatId, buildMessage(lead, new Date()));
    if (!delivered) {
      console.error('lead: Telegram API вернул ошибку');
      return json(502, { ok: false, error: 'delivery_failed' });
    }

    return json(200, { ok: true });
  } catch (err) {
    // В лог пишем только тип ошибки — без токенов и без пользовательских данных
    console.error('lead: непредвиденная ошибка:', err && err.name ? err.name : 'Error');
    return json(500, { ok: false, error: 'internal_error' });
  }
};

// Для тестов (scripts/test-lead.cjs); Netlify это игнорирует
exports._test = { clean, validPhone, formatPhone, buildMessage, hits };
