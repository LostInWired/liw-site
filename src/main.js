import '@fontsource-variable/unbounded/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/literata/wght.css';
import './style.css';
import { dict } from './i18n.js';
import { niches, nicheOrder } from './niches.js';
import { WHATSAPP, WHATSAPP_DISPLAY, INSTAGRAM } from './contacts.js';

const root = document.documentElement;
root.classList.add('js');

// ---------- шаблоны ----------
let lang = 'ru';
let niche = 'barber';
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const PC_BUSY = [2, 5, 9, 12, 13, 19];

function widgetHtml(id, n) {
  const w = n.w;
  if (id === 'barber') {
    return `<h4>${esc(w.title)}</h4><div class="slots">${w.slots.map((t, i) => w.busy.includes(i)
      ? `<span class="slot slot--busy" title="${esc(w.busyL)}">${t}</span>`
      : `<button type="button" class="slot" data-slot="${t}">${t}</button>`).join('')}</div>`;
  }
  if (id === 'pc') {
    const seats = Array.from({ length: 24 }, (_, i) => i + 1).map((k) => {
      const zone = k <= 8 ? 0 : 1;
      return PC_BUSY.includes(k)
        ? `<span class="seat seat--busy" data-z="${zone}">${k}</span>`
        : `<button type="button" class="seat" data-seat="${k}" data-z="${zone}">${k}</button>`;
    }).join('');
    return `<h4>${esc(w.title)}</h4><div class="hall"><div class="hall__zone"><b>${esc(w.zones[0])}</b></div><div class="seats">${seats}</div></div>
      <p class="legend"><i class="seat"></i>${esc(w.legend[0])} <i class="seat seat--busy"></i>${esc(w.legend[1])} <i class="seat seat--on"></i>${esc(w.legend[2])}</p>
      <p class="picked" data-role="picked">${esc(w.hint)}</p>`;
  }
  if (id === 'dental') {
    return `<h4>${esc(w.title)}</h4><ol class="steps">${w.steps.map(([t, d], i) => `<li><span>${i + 1}</span><b>${esc(t)}</b><em>${esc(d)}</em></li>`).join('')}</ol>
      <p class="badge">${esc(w.badge)}</p>`;
  }
  return `<h4>${esc(w.title)}</h4><div class="ctabs">${w.tabs.map((t, i) => `<button type="button" data-ctab="${i}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('')}</div>
    <ul class="menu" data-role="menu"></ul><p class="badge">${esc(w.badge)}</p>`;
}

function fillMenu(n, tab) {
  const ul = document.querySelector('[data-role="menu"]');
  if (!ul) return;
  ul.innerHTML = n.w.menu[tab].map(([a, p]) => `<li><span>${esc(a)}</span><em>${esc(p)}</em></li>`).join('');
  document.querySelectorAll('[data-ctab]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ctab) === tab)));
}

function renderTemplates() {
  const n = niches[niche][lang];
  document.getElementById('tpl-tabs').innerHTML = nicheOrder
    .map((id) => `<button type="button" data-niche="${id}" aria-pressed="${id === niche}">${esc(niches[id][lang].label)}</button>`)
    .join('');
  const demo = document.getElementById('demo');
  demo.dataset.theme = niche;
  const list = n.s.length
    ? `<div class="demo__prices"><h4>${esc(n.listT)}</h4><ul class="demo__list">${n.s.map((x, i) => `<li><span>${esc(x)}</span><em>${esc(n.p[i])}</em></li>`).join('')}</ul></div>`
    : '';
  demo.innerHTML = `
    <div class="demo__bar"><i></i><i></i><i></i><span>${esc(n.url)}</span></div>
    <div class="demo__page">
      <div class="demo__nav"><b>${esc(n.brand)}</b>${n.nav.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="demo__hero">
        <div class="demo__copy">
          <h3>${esc(n.h)}</h3>
          <p>${esc(n.sub)}</p>
          <span class="demo__btn" data-role="cta" data-base="${esc(n.btn)}">${esc(n.btn)}</span>
        </div>
        <div class="demo__art" aria-hidden="true"></div>
      </div>
      <div class="demo__grid">
        <div class="demo__widget">${widgetHtml(niche, n)}</div>
        ${list}
      </div>
      <div class="demo__foot"><span>${esc(n.foot[0])}</span><span>${esc(n.foot[1])}</span></div>
    </div>
    <p class="demo__feat">${esc(n.feat)}</p>`;
  if (niche === 'coffee') fillMenu(n, 0);
  const wa = document.getElementById('tpl-wa');
  if (wa) wa.href = waLink(dict[lang]['wa.tpl'] + n.label);
}

function setCta(text) {
  const el = document.querySelector('[data-role="cta"]');
  if (el) el.textContent = text;
}

document.addEventListener('click', (e) => {
  const nb = e.target.closest('[data-niche]');
  if (nb) {
    niche = nb.dataset.niche;
    renderTemplates();
    document.querySelector('#tpl-tabs [aria-pressed="true"]')?.focus();
    return;
  }
  const n = niches[niche][lang];
  const slot = e.target.closest('[data-slot]');
  if (slot) {
    document.querySelectorAll('[data-slot]').forEach((b) => b.classList.toggle('slot--on', b === slot));
    setCta(`${n.btn} · ${slot.dataset.slot}`);
    return;
  }
  const seat = e.target.closest('[data-seat]');
  if (seat) {
    document.querySelectorAll('[data-seat]').forEach((b) => b.classList.toggle('seat--on', b === seat));
    const z = Number(seat.dataset.z);
    const price = n.p[z === 0 ? 1 : 0];
    document.querySelector('[data-role="picked"]').textContent = `${n.w.seat} ${seat.dataset.seat} · ${n.w.zones[z]} · ${price}`;
    setCta(`${n.btn} · ${seat.dataset.seat}`);
    return;
  }
  const ct = e.target.closest('[data-ctab]');
  if (ct) fillMenu(n, Number(ct.dataset.ctab));
});


// ---------- форма заявки ----------
const form = document.getElementById('lead-form');
const statusEl = document.getElementById('lead-status');

function say(key, ok) {
  statusEl.textContent = dict[lang][key] || '';
  statusEl.dataset.state = ok ? 'ok' : 'err';
}

// «Обсудить проект» подставляет выбор в форму
document.addEventListener('click', (e) => {
  const custom = e.target.closest('[data-choice]');
  if (custom) document.getElementById('choice').value = custom.dataset.choice;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(form);
  const name = String(f.get('name') || '').trim();
  const phone = String(f.get('phone') || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (!name) return say('m.name', false);
  if (!/^[+\d\s().-]+$/.test(phone) || digits.length < 10 || digits.length > 15) return say('m.phone', false);
  if (!form.elements.consent.checked) return say('m.consent', false);

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  statusEl.textContent = dict[lang]['f.sending'];
  statusEl.dataset.state = '';
  try {
    const res = await fetch('/.netlify/functions/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, choice: f.get('choice'), consent: true, website: f.get('website') || '' }),
    });
    if (res.ok) {
      say('m.ok', true);
      form.reset();
    } else {
      say(res.status === 429 ? 'm.many' : 'm.fail', false);
    }
  } catch {
    say('m.fail', false);
  } finally {
    btn.disabled = false;
  }
});

// ---------- язык ----------
function applyLang(l) {
  lang = l === 'kk' ? 'kk' : 'ru';
  const t = dict[lang];
  document.documentElement.lang = lang;
  renderTemplates();
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = waLink(t['wa.msg']);
    if (!a.querySelector('span')) a.textContent = `WhatsApp ${WHATSAPP_DISPLAY}`;
  });
  document.querySelectorAll('[data-ig]').forEach((a) => {
    a.hidden = !INSTAGRAM;
    if (INSTAGRAM) a.href = `https://instagram.com/${INSTAGRAM}`;
  });
  document.querySelectorAll('#choice option').forEach((o) => { o.textContent = t['o.' + o.value]; });
  document.querySelectorAll('[data-i18n]').forEach((el) => { const k = el.dataset.i18n; const v = t[k]; if (v) el.textContent = v; });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  try { localStorage.setItem('liw-lang', lang); } catch { /* ignore */ }
}
let saved = 'ru';
try { saved = localStorage.getItem('liw-lang') || 'ru'; } catch { /* ignore */ }
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));
applyLang(saved);

// ---------- шапка и появление блоков ----------
const topbar = document.querySelector('.top');
const onScroll = () => topbar.classList.toggle('top--on', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const reveal = [...document.querySelectorAll('.rv')];
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  reveal.forEach((el) => io.observe(el));
} else {
  reveal.forEach((el) => el.classList.add('in'));
}
