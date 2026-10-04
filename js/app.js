/* ==========================================================================
   LIW — LOST IN WIRED · app.js
   Весь контент берётся из config.js. Здесь — только отрисовка и поведение.
   Пользовательские данные НИКОГДА не вставляются через innerHTML:
   только textContent / createTextNode / setAttribute.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 0. Проверка конфига ---------- */
  if (typeof CONFIG === 'undefined' || !CONFIG) {
    var msg = document.createElement('p');
    msg.className = 'noscript';
    msg.textContent = 'Ошибка загрузки настроек сайта (config.js).';
    document.body.prepend(msg);
    return;
  }
  var C = CONFIG;

  /* ---------- 1. Утилиты ---------- */
  function str(v) { return typeof v === 'string' ? v.trim() : ''; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function digits(v) { return str(v).replace(/\D/g, ''); }
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, C);
  }
  function pad2(n) { return String(n).padStart(2, '0'); }

  // Разрешаем только http(s)-ссылки (защита от javascript: и подобного)
  function safeUrl(u) {
    u = str(u);
    if (!u) return '';
    try {
      var parsed = new URL(u, location.href);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? u : '';
    } catch (e) { return ''; }
  }

  function el(tag, props) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var kids = [].concat(arguments[i]);
      for (var j = 0; j < kids.length; j++) {
        var kid = kids[j];
        if (kid == null || kid === false) continue;
        n.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
      }
    }
    return n;
  }

  /* ---------- 2. Иконки (контурные, 24×24) ---------- */
  var ICONS = {
    arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
    out: ['M7 17L17 7', 'M8 7h9v9'],
    phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
    whatsapp: ['M3.5 20.5l1.5-4.6A8.5 8.5 0 1 1 8.2 19z', 'M9.2 8.8c.4 2.4 2.7 4.7 5.2 5.3'],
    telegram: ['M21 4L3 11l6 2.2L11 20l3-4 4.5 3.5L21 4z', 'M9 13.2L21 4'],
    mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
    plus: ['M12 5v14', 'M5 12h14'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    card: ['M3 6h18v12H3z', 'M3 10h18', 'M7 15h4'],
    page: ['M6 3h12v18H6z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
    building: ['M4 21V8l8-5 8 5v13', 'M9 21v-6h6v6', 'M4 21h16'],
    sliders: ['M4 7h9', 'M17 7h3', 'M13 4.5v5', 'M4 17h3', 'M11 17h9', 'M7 14.5v5'],
    link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
    dot: ['M12 12h.01']
  };

  function icon(name, cls) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
    (ICONS[name] || ICONS.dot).forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  /* ---------- 3. Тема, <head>, привязки ---------- */
  document.documentElement.classList.add('js-ready');

  (function applyTheme() {
    var map = { bg: '--bg', surface: '--surface', text: '--text', muted: '--muted', accent: '--accent', accentInk: '--accent-ink' };
    var theme = C.theme || {};
    Object.keys(map).forEach(function (k) {
      var v = str(theme[k]);
      if (v && window.CSS && CSS.supports('color', v)) {
        document.documentElement.style.setProperty(map[k], v);
      }
    });
  })();

  (function applySeo() {
    var seo = C.seo || {};
    if (str(seo.title)) document.title = seo.title;
    var d = document.querySelector('meta[name="description"]');
    if (d && str(seo.description)) d.setAttribute('content', seo.description);
  })();

  document.querySelectorAll('[data-text]').forEach(function (n) {
    var v = get(n.getAttribute('data-text'));
    if (typeof v === 'string' && v) n.textContent = v;
  });
  var skip = document.getElementById('skip-link');
  if (skip && str(get('texts.skipLink'))) skip.textContent = C.texts.skipLink;
  var burger = document.getElementById('burger');
  if (burger) burger.setAttribute('aria-label', str(get('texts.menuOpen')) || 'Открыть меню');

  /* ---------- 4. Ссылки для связи ---------- */
  var contact = C.contact || {};

  function waHref(message) {
    var d = digits(contact.whatsapp);
    if (d.length < 8) return '';
    var text = str(message) || str(contact.whatsappMessage);
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function telHref() {
    var p = str(contact.phone).replace(/[^\d+]/g, '');
    return digits(p).length >= 5 ? 'tel:' + p : '';
  }
  function tgHref() {
    var t = str(contact.telegram);
    if (!t) return { href: '', label: '' };
    if (/^https?:\/\//i.test(t)) {
      var u = safeUrl(t);
      return { href: u, label: u.replace(/^https?:\/\//i, '').replace(/\/$/, '') };
    }
    t = t.replace(/^@/, '').replace(/^t\.me\//i, '');
    if (!/^[A-Za-z0-9_]{3,64}$/.test(t)) return { href: '', label: '' };
    return { href: 'https://t.me/' + t, label: '@' + t };
  }
  function mailHref() {
    var m = str(contact.email);
    return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(m) ? 'mailto:' + m : '';
  }

  /* ---------- 5. Общие кирпичики ---------- */
  function rv(node, delay) {
    node.classList.add('reveal');
    node.style.setProperty('--d', (delay == null ? 0 : delay) + 'ms');
    return node;
  }

  function sectionHead(kicker, title, intro, extraClass) {
    return rv(el('div', { class: 'section__head' + (extraClass ? ' ' + extraClass : '') },
      str(kicker) ? el('p', { class: 'kicker', text: kicker }) : null,
      str(title) ? el('h2', { class: 'section__title', text: title }) : null,
      str(intro) ? el('p', { class: 'lead', text: intro }) : null
    ));
  }

  function button(label, href, variant, iconName, external) {
    var a = el('a', {
      class: 'btn' + (variant ? ' btn--' + variant : ''),
      href: href,
      target: external ? '_blank' : null,
      rel: external ? 'noopener noreferrer' : null
    }, el('span', { text: label }), iconName ? icon(iconName) : null);
    return a;
  }

  function sec(id) { return document.getElementById(id); }
  function drop(id) { var s = sec(id); if (s) s.remove(); }
  function fill(id, container) {
    var s = sec(id);
    if (!s) return;
    s.appendChild(el('div', { class: 'container' }, container));
  }

  /* ---------- 6. HERO ---------- */
  function renderHero() {
    var h = C.hero || {};
    var copy = document.getElementById('hero-copy');
    var pointsEl = document.getElementById('hero-points');
    if (!copy) return;

    var hasProjects = arr(C.projects).length > 0;
    var title = str(h.title);
    var accent = str(h.titleAccent);
    var idx = accent ? title.indexOf(accent) : -1;
    var titleNodes = idx < 0 ? [title] : [
      title.slice(0, idx), el('span', { class: 'accent', text: accent }), title.slice(idx + accent.length)
    ];

    var actions = el('div', { class: 'hero__actions' });
    var p = h.primaryCta || {};
    if (str(p.label)) actions.appendChild(button(p.label, p.href || '#apply', 'primary', 'arrow'));
    var s = h.secondaryCta || {};
    var sec2 = null;
    if (str(s.label) && (hasProjects || !s.hideIfEmpty)) sec2 = s;
    else if (s.fallback && str(s.fallback.label)) sec2 = s.fallback;
    if (sec2) actions.appendChild(button(sec2.label, sec2.href || '#services', 'ghost'));

    var wa = waHref();
    var waLink = (wa && str(h.whatsappLabel))
      ? el('a', { class: 'hero__wa', href: wa, target: '_blank', rel: 'noopener noreferrer' },
          icon('whatsapp'), el('span', { text: h.whatsappLabel }))
      : null;

    copy.appendChild(el('div', { class: 'hero__brand' },
      el('span', { class: 'hero__brand-name', text: str(get('brand.name')) }),
      str(get('brand.fullName')) ? el('span', { class: 'hero__brand-full', text: C.brand.fullName }) : null
    ));
    if (str(h.eyebrow)) copy.appendChild(el('p', { class: 'eyebrow' }, el('span', { class: 'eyebrow__dot' }), h.eyebrow));
    copy.appendChild(el('h1', { class: 'hero__title' }, titleNodes));
    if (str(h.text)) copy.appendChild(el('p', { class: 'hero__text', text: h.text }));
    copy.appendChild(actions);
    if (waLink) copy.appendChild(waLink);
    if (str(h.priceNote)) copy.appendChild(el('p', { class: 'hero__note', text: h.priceNote }));

    var pts = arr(h.points).filter(str);
    if (pointsEl) {
      if (!pts.length) pointsEl.remove();
      pts.forEach(function (t) {
        pointsEl.appendChild(el('li', { class: 'point' }, icon('check'), el('span', { text: t })));
      });
    }
  }

  /* ---------- 7. Услуги ---------- */
  function renderServices() {
    var s = C.services || {};
    var items = arr(s.items).filter(function (i) { return i && str(i.title); });
    if (!items.length) return drop('services');

    var grid = el('div', { class: 'cards' });
    items.forEach(function (it, i) {
      grid.appendChild(rv(el('article', { class: 'card glow' },
        el('div', { class: 'card__top' },
          el('span', { class: 'card__icon' }, icon(it.icon)),
          el('span', { class: 'card__num', text: pad2(i + 1) })
        ),
        el('h3', { class: 'card__title', text: it.title }),
        str(it.description) ? el('p', { class: 'card__text', text: it.description }) : null
      ), i * 70));
    });

    fill('services', [
      sectionHead(s.kicker, s.title, s.intro),
      grid,
      str(s.note) ? rv(el('p', { class: 'note', text: s.note }), 100) : null
    ]);
  }

  /* ---------- 8. Что можно подключить ---------- */
  function renderFeatures() {
    var f = C.features || {};
    var items = arr(f.items).filter(str);
    if (!items.length) return drop('features');

    var list = el('ul', { class: 'features' });
    items.forEach(function (t, i) {
      list.appendChild(rv(el('li', { class: 'feature' },
        el('span', { class: 'feature__tick' }, icon('check')),
        el('span', { text: t })
      ), (i % 3) * 60));
    });

    fill('features', [
      sectionHead(f.kicker, f.title, f.intro),
      list,
      str(f.note) ? rv(el('p', { class: 'note', text: f.note }), 100) : null
    ]);
  }

  /* ---------- 9. Работы ---------- */
  // Архитектурная точка расширения: когда появятся отдельные страницы кейсов,
  // достаточно вернуть здесь, например, '/cases/' + p.slug.
  function projectHref(p) {
    return safeUrl(p.url);
  }

  function renderProjects() {
    var w = C.worksSection || {};
    var items = arr(C.projects).filter(function (p) { return p && str(p.title); });
    if (!items.length) return drop('works');

    var grid = el('div', { class: 'works' });
    items.forEach(function (p, i) {
      var href = projectHref(p);
      var imgSrc = safeUrl(p.image) || (/^(\/|\.\/|images\/)/.test(str(p.image)) ? str(p.image) : '');

      var media = el('div', { class: 'work__media' });
      var ph = el('div', { class: 'work__ph' }, el('span', { text: str(p.title).charAt(0).toUpperCase() }));
      media.appendChild(ph);
      if (imgSrc) {
        var img = el('img', { src: imgSrc, alt: p.title, loading: 'lazy', decoding: 'async', width: '1200', height: '750' });
        img.addEventListener('error', function () { img.remove(); });
        media.appendChild(img);
      }
      if (href) media.appendChild(el('span', { class: 'work__go' }, icon('out')));

      var tags = arr(p.tags).filter(str);
      var body = el('div', { class: 'work__body' },
        str(p.category) ? el('p', { class: 'work__cat', text: p.category }) : null,
        el('h3', { class: 'work__title', text: p.title }),
        str(p.description) ? el('p', { class: 'work__text', text: p.description }) : null,
        tags.length ? el('ul', { class: 'tags' }, tags.map(function (t) { return el('li', { text: t }); })) : null
      );

      var card = href
        ? el('a', { class: 'work glow', href: href, target: '_blank', rel: 'noopener noreferrer',
            'aria-label': p.title + (str(w.linkLabel) ? ' — ' + w.linkLabel : '') }, media, body)
        : el('article', { class: 'work glow' }, media, body);
      grid.appendChild(rv(card, (i % 2) * 80));
    });

    fill('works', [sectionHead(w.kicker, w.title, w.intro), grid]);
  }

  /* ---------- 10. Процесс ---------- */
  function renderProcess() {
    var p = C.process || {};
    var steps = arr(p.steps).filter(function (s) { return s && str(s.title); });
    if (!steps.length) return drop('process');

    var list = el('ol', { class: 'steps' });
    steps.forEach(function (st, i) {
      list.appendChild(rv(el('li', { class: 'step' },
        el('span', { class: 'step__num', text: pad2(i + 1) }),
        el('div', { class: 'step__body' },
          el('h3', { class: 'step__title', text: st.title }),
          str(st.description) ? el('p', { text: st.description }) : null
        )
      ), i * 60));
    });

    fill('process', el('div', { class: 'split' },
      sectionHead(p.kicker, p.title, p.intro, 'section__head--sticky'),
      list
    ));
  }

  /* ---------- 11. Отзывы ---------- */
  function renderReviews() {
    var r = C.reviewsSection || {};
    var items = arr(C.reviews).filter(function (x) { return x && str(x.text); });
    if (!items.length) return drop('reviews');

    var grid = el('div', { class: 'reviews' });
    items.forEach(function (rev, i) {
      var meta = [str(rev.company), str(rev.project)].filter(Boolean).join(' · ');
      grid.appendChild(rv(el('figure', { class: 'review glow' },
        el('blockquote', { class: 'review__text' }, el('p', { text: rev.text })),
        el('figcaption', { class: 'review__by' },
          str(rev.name) ? el('strong', { text: rev.name }) : null,
          meta ? el('span', { text: meta }) : null
        )
      ), (i % 3) * 70));
    });

    fill('reviews', [sectionHead(r.kicker, r.title), grid]);
  }

  /* ---------- 12. FAQ ---------- */
  function renderFaq() {
    var f = C.faq || {};
    var items = arr(f.items).filter(function (q) { return q && str(q.question) && str(q.answer); });
    if (!items.length) return drop('faq');

    var list = el('div', { class: 'faq' });
    var all = [];

    items.forEach(function (q, i) {
      var qid = 'faq-q-' + i, aid = 'faq-a-' + i;
      var btn = el('button', { class: 'faq__q', type: 'button', id: qid, 'aria-expanded': 'false', 'aria-controls': aid },
        el('span', { text: q.question }),
        el('span', { class: 'faq__icon' }, icon('plus'))
      );
      var panel = el('div', { class: 'faq__a', id: aid, role: 'region', 'aria-labelledby': qid },
        el('div', { class: 'faq__a-inner' }, el('p', { text: q.answer }))
      );
      var item = el('div', { class: 'faq__item' }, el('h3', { class: 'faq__h' }, btn), panel);
      all.push({ item: item, btn: btn });

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        all.forEach(function (o) {
          o.btn.setAttribute('aria-expanded', 'false');
          o.item.classList.remove('is-open');
        });
        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          item.classList.add('is-open');
        }
      });
      list.appendChild(rv(item, i * 40));
    });

    fill('faq', el('div', { class: 'split split--faq' },
      sectionHead(f.kicker, f.title, '', 'section__head--sticky'),
      list
    ));
  }

  /* ---------- 13. Форма заявки ---------- */
  function renderForm() {
    var f = C.form || {};
    var fl = f.fields || {};
    var endpoint = str(f.endpoint) || '/.netlify/functions/lead';

    function field(id, label, control, opts) {
      opts = opts || {};
      return el('div', { class: 'field' },
        el('label', { class: 'field__label', for: id },
          el('span', { text: label }),
          opts.required
            ? el('span', { class: 'req', 'aria-hidden': 'true', text: '*' })
            : (str(f.optional) ? el('span', { class: 'opt', text: f.optional }) : null)
        ),
        control,
        opts.error ? el('p', { class: 'field__error', id: id + '-err', role: 'alert' }) : null
      );
    }

    var phone = el('input', {
      class: 'input', id: 'f-phone', name: 'phone', type: 'tel', inputmode: 'tel',
      autocomplete: 'tel', maxlength: '30', required: true,
      placeholder: str(fl.phonePlaceholder), 'aria-describedby': 'f-phone-err'
    });
    var name = el('input', { class: 'input', id: 'f-name', name: 'name', type: 'text', autocomplete: 'name', maxlength: '80', placeholder: str(fl.namePlaceholder) });
    var business = el('input', { class: 'input', id: 'f-business', name: 'business', type: 'text', autocomplete: 'organization', maxlength: '120', placeholder: str(fl.businessPlaceholder) });

    var select = el('select', { class: 'input select', id: 'f-type', name: 'type' },
      el('option', { value: '', text: str(fl.typePlaceholder) || '—' }),
      arr(fl.typeOptions).filter(str).map(function (o) { return el('option', { value: o, text: o }); })
    );
    var message = el('textarea', { class: 'input textarea', id: 'f-message', name: 'message', rows: '4', maxlength: '1500', placeholder: str(fl.messagePlaceholder) });

    // Honeypot: человек его не видит и не заполняет, боты — заполняют
    var honey = el('input', { id: 'f-website', name: 'website', type: 'text', tabindex: '-1', autocomplete: 'off' });
    var hp = el('div', { class: 'hp', 'aria-hidden': 'true' }, el('label', { for: 'f-website', text: 'Website' }), honey);

    var submit = el('button', { class: 'btn btn--primary btn--block', type: 'submit' },
      el('span', { class: 'btn__label', text: str(f.submit) || 'Отправить' }), icon('arrow'));
    var status = el('p', { class: 'form__status', role: 'status', 'aria-live': 'polite' });

    var form = el('form', { class: 'form', novalidate: true, autocomplete: 'on' },
      field('f-phone', str(fl.phoneLabel), phone, { required: true, error: true }),
      el('div', { class: 'row2' },
        field('f-name', str(fl.nameLabel), name),
        field('f-business', str(fl.businessLabel), business)
      ),
      field('f-type', str(fl.typeLabel), select),
      field('f-message', str(fl.messageLabel), message),
      hp, submit, status,
      str(f.privacyNote) ? el('p', { class: 'form__note', text: f.privacyNote }) : null
    );

    var success = el('div', { class: 'success', tabindex: '-1', hidden: true },
      el('span', { class: 'success__icon' }, icon('check')),
      el('p', { class: 'success__text', text: str(f.success) })
    );

    // --- Левая колонка ---
    var wa = waHref();
    var side = rv(el('div', { class: 'apply__side' },
      el('p', { class: 'kicker', text: str(f.kicker) }),
      el('h2', { class: 'section__title', text: str(f.title) }),
      str(f.intro) ? el('p', { class: 'lead', text: f.intro }) : null,
      wa ? el('div', { class: 'apply__wa' },
        button(str(get('hero.whatsappLabel')) || 'WhatsApp', wa, 'ghost', 'whatsapp', true)) : null,
      str(get('hero.priceNote')) ? el('p', { class: 'note note--small', text: C.hero.priceNote }) : null
    ));

    var panel = rv(el('div', { class: 'apply__panel' }, form, success), 80);

    fill('apply', el('div', { class: 'apply' }, side, panel));

    // --- Поведение ---
    function setError(msg) {
      var e = document.getElementById('f-phone-err');
      e.textContent = msg || '';
      phone.setAttribute('aria-invalid', msg ? 'true' : 'false');
      phone.classList.toggle('is-invalid', !!msg);
    }
    function setStatus(msg, kind) {
      status.textContent = msg || '';
      status.className = 'form__status' + (kind ? ' is-' + kind : '');
    }
    function phoneOk(v) {
      v = v.trim();
      var d = v.replace(/\D/g, '');
      return /^[+\d\s().-]+$/.test(v) && d.length >= 10 && d.length <= 15;
    }

    phone.addEventListener('input', function () { if (phone.classList.contains('is-invalid')) setError(''); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      setStatus('');
      if (!phoneOk(phone.value)) {
        setError(str(f.errorPhone) || 'Укажите корректный номер.');
        phone.focus();
        return;
      }
      setError('');

      var payload = {
        phone: phone.value.trim(),
        name: name.value.trim(),
        business: business.value.trim(),
        type: select.value,
        message: message.value.trim(),
        website: honey.value
      };

      submit.disabled = true;
      submit.classList.add('is-loading');
      submit.querySelector('.btn__label').textContent = str(f.sending) || '…';

      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return null; }).then(function (data) {
          return { status: res.status, ok: res.ok, data: data };
        });
      }).then(function (r) {
        if (r.ok && r.data && r.data.ok) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
          form.reset();
          return;
        }
        if (r.status === 429) setStatus(str(f.errorTooMany) || str(f.errorGeneric), 'error');
        else if (r.data && r.data.field === 'phone') {
          setError(str(f.errorPhone));
          phone.focus();
        } else setStatus(str(f.errorGeneric), 'error');
      }).catch(function () {
        setStatus(str(f.errorNetwork) || str(f.errorGeneric), 'error');
      }).then(function () {
        if (timer) clearTimeout(timer);
        submit.disabled = false;
        submit.classList.remove('is-loading');
        submit.querySelector('.btn__label').textContent = str(f.submit) || 'Отправить';
      });
    });
  }

  /* ---------- 14. Контакты ---------- */
  function renderContacts() {
    var c = C.contactsSection || {};
    var items = [];

    var tel = telHref();
    if (tel && str(contact.phoneDisplay || contact.phone)) {
      items.push({ icon: 'phone', label: str(c.phoneLabel) || 'Телефон', value: str(contact.phoneDisplay) || str(contact.phone), href: tel });
    }
    var wa = waHref();
    if (wa) {
      var wd = digits(contact.whatsapp);
      var sameAsPhone = wd && wd === digits(contact.phone) && str(contact.phoneDisplay);
      items.push({ icon: 'whatsapp', label: str(c.whatsappLabel) || 'WhatsApp', value: sameAsPhone ? str(contact.phoneDisplay) : '+' + wd, href: wa, ext: true });
    }
    var tg = tgHref();
    if (tg.href) items.push({ icon: 'telegram', label: str(c.telegramLabel) || 'Telegram', value: tg.label, href: tg.href, ext: true });
    var mail = mailHref();
    if (mail) items.push({ icon: 'mail', label: str(c.emailLabel) || 'Email', value: str(contact.email), href: mail });

    var socials = arr(C.socialLinks).filter(function (s) { return s && str(s.label) && safeUrl(s.url); });

    if (!items.length && !socials.length) return drop('contacts');

    var grid = el('div', { class: 'contact-grid' });
    items.forEach(function (it, i) {
      grid.appendChild(rv(el('a', {
        class: 'contact glow', href: it.href,
        target: it.ext ? '_blank' : null, rel: it.ext ? 'noopener noreferrer' : null
      },
        el('span', { class: 'contact__icon' }, icon(it.icon)),
        el('span', { class: 'contact__body' },
          el('span', { class: 'contact__label', text: it.label }),
          el('span', { class: 'contact__value', text: it.value })
        ),
        icon('arrow', 'contact__arrow')
      ), i * 60));
    });

    var soc = socials.length
      ? rv(el('ul', { class: 'socials' }, socials.map(function (s) {
          return el('li', null, el('a', { class: 'social', href: safeUrl(s.url), target: '_blank', rel: 'noopener noreferrer' },
            el('span', { text: s.label }), icon('out')));
        })), 120)
      : null;

    fill('contacts', [sectionHead(c.kicker, c.title, c.text), items.length ? grid : null, soc]);
  }

  /* ---------- 15. Навигация и футер ---------- */
  function renderNav() {
    var list = document.getElementById('nav-list');
    if (!list) return;
    var linked = [];

    arr(C.nav).forEach(function (n) {
      if (!n || !str(n.label) || !/^#[\w-]+$/.test(str(n.href))) return;
      if (n.hideIfEmpty && !arr(C[n.hideIfEmpty]).length) return;
      var id = n.href.slice(1);
      if (!document.getElementById(id)) return;          // раздел скрыт — пункт меню тоже
      var a = el('a', { class: 'nav__link', href: n.href, text: n.label });
      list.appendChild(el('li', null, a));
      linked.push({ id: id, a: a });
    });

    var cta = el('a', { class: 'btn btn--primary btn--block', href: '#apply' },
      el('span', { text: str(get('texts.navCta')) }), icon('arrow'));
    list.appendChild(el('li', { class: 'nav__cta-mobile' }, cta));

    return linked;
  }

  function renderFooter() {
    var f = document.getElementById('footer');
    if (!f) return;
    var year = new Date().getFullYear();
    f.appendChild(el('div', { class: 'container footer__inner' },
      el('div', { class: 'footer__brand' },
        el('span', { class: 'footer__name', text: str(get('brand.name')) }),
        el('span', { class: 'footer__full', text: str(get('brand.fullName')) })
      ),
      el('p', { class: 'footer__text', text: '© ' + year + ' ' + str(get('brand.name')) + (str(get('texts.footer')) ? ' · ' + C.texts.footer : '') }),
      el('a', { class: 'footer__top', href: '#top' }, el('span', { text: str(get('texts.backToTop')) || 'Наверх' }), icon('arrow', 'icon--up'))
    ));
  }

  /* ---------- 16. Запуск ---------- */
  renderHero();
  renderServices();
  renderFeatures();
  renderProjects();
  renderProcess();
  renderReviews();
  renderFaq();
  renderForm();
  renderContacts();
  var linked = renderNav() || [];
  renderFooter();

  /* ---------- 17. Поведение: меню, скролл, анимации ---------- */
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? (str(get('texts.menuClose')) || 'Закрыть меню') : (str(get('texts.menuOpen')) || 'Открыть меню'));
    document.body.classList.toggle('menu-open', open);
  }
  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      if (burger) burger.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setMenu(false);
  });
  document.querySelectorAll('.brand, .header__cta').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Подсветка пункта меню по текущему разделу
  if ('IntersectionObserver' in window && linked.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        linked.forEach(function (l) {
          var on = l.id === en.target.id;
          l.a.classList.toggle('is-active', on);
          if (on) l.a.setAttribute('aria-current', 'true'); else l.a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    // Следим за всеми разделами, чтобы подсветка снималась и в разделах без пункта меню
    document.querySelectorAll('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  // Плавное появление блоков
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (n) { io.observe(n); });
  } else {
    revealEls.forEach(function (n) { n.classList.add('is-visible'); });
  }

  // Мягкая подсветка карточек под курсором
  document.addEventListener('pointermove', function (e) {
    var t = e.target.closest ? e.target.closest('.glow') : null;
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
