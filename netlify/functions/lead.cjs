/* ==========================================================================
   LIW v3 · netlify/functions/lead.cjs
   Принимает заявку (имя, телефон, выбор шаблона/своего сайта) и отправляет
   ОДНО сообщение в Telegram. Секреты — только в переменных окружения Netlify:
     TG_TOKEN    — токен бота от @BotFather
     TG_CHAT_ID  — ваш chat id
   Необязательные: BRAND_NAME, LEAD_TIMEZONE (по умолчанию Asia/Almaty)

   Защита: метод/тип/размер, same-origin, honeypot, лимит запросов с IP,
   белый список выбора, согласие обязательно, очистка и экранирование.
   ========================================================================== */
'use strict';

const LIMITS = { phone: 30, name: 80 };
const MAX_BODY_CHARS = 2000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const TELEGRAM_TIMEOUT_MS = 8000;

const CHOICES = {
  barber: 'Шаблон: барбершоп',
  pc: 'Шаблон: ПК-клуб',
  dental: 'Шаблон: стоматология',
  coffee: 'Шаблон: кофейня',
  custom: 'Собственный сайт (под заказ)'
};

// Память живёт, пока «тёплый» экземпляр функции: базовая защита от простого спама.
const hits = new Map();

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

// Убираем управляющие и невидимые символы, схлопываем пробелы, режем длину
function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[​-‏‪-‮⁠-⁩﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const phoneDigits = (phone) => phone.replace(/\D/g, '');

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
  const wa = whatsappLink(lead.phone);
  return [
    `<b>НОВАЯ ЗАЯВКА — ${brand}</b>`,
    `<b>Что выбрал:</b> ${escapeHtml(lead.choiceLabel)}`,
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Телефон / WhatsApp:</b>\n${escapeHtml(formatPhone(lead.phone))}` + (wa ? `\n<a href="${wa}">Открыть чат в WhatsApp</a>` : ''),
    `<b>Дата:</b> ${formatDate(date)}`
  ].join('\n\n');
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
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: ctrl.signal
    });
    return res.ok;
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
    if (!sameOrigin(event)) return json(403, { ok: false, error: 'forbidden' });
    if (!/application\/json/i.test(header(event, 'content-type'))) return json(415, { ok: false, error: 'unsupported_media_type' });

    let raw = event.body || '';
    if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    if (raw.length > MAX_BODY_CHARS) return json(413, { ok: false, error: 'payload_too_large' });

    let data;
    try { data = JSON.parse(raw); } catch (e) { data = null; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, { ok: false, error: 'bad_request' });

    // Honeypot: бот заполнил скрытое поле — делаем вид, что всё хорошо, но ничего не отправляем
    if (typeof data.website === 'string' && data.website.trim() !== '') return json(200, { ok: true });

    if (rateLimited(clientIp(event), Date.now())) {
      return json(429, { ok: false, error: 'too_many_requests' }, { 'Retry-After': '600' });
    }

    const choice = typeof data.choice === 'string' && Object.prototype.hasOwnProperty.call(CHOICES, data.choice) ? data.choice : '';
    const lead = {
      name: clean(data.name, LIMITS.name),
      phone: clean(data.phone, LIMITS.phone),
      choiceLabel: CHOICES[choice] || ''
    };

    if (!lead.name) return json(400, { ok: false, error: 'invalid_name', field: 'name' });
    if (!validPhone(lead.phone)) return json(400, { ok: false, error: 'invalid_phone', field: 'phone' });
    if (!lead.choiceLabel) return json(400, { ok: false, error: 'invalid_choice', field: 'choice' });
    if (data.consent !== true) return json(400, { ok: false, error: 'consent_required', field: 'consent' });

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
    // В лог пишем только тип ошибки: без токенов и без данных пользователя
    console.error('lead: непредвиденная ошибка:', err && err.name ? err.name : 'Error');
    return json(500, { ok: false, error: 'internal_error' });
  }
};

// Для тестов (scripts/test-lead.cjs); Netlify это игнорирует
exports._test = { clean, validPhone, formatPhone, buildMessage, hits };
