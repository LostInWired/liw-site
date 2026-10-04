/* ==========================================================================
   LIW — scripts/build.cjs
   Маленькая сборка без зависимостей. Запускается Netlify автоматически.
   Что делает:
     1. Копирует только публичные файлы сайта в папку dist/
        (README, скрипты и прочее служебное в публикацию не попадает).
     2. Подставляет адрес сайта, title и description из config.js
        в index.html, robots.txt и sitemap.xml.
     3. Проверяет, что в публичных файлах нет похожего на токен Telegram-бота.
   Локально: node scripts/build.cjs
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PUBLIC_FILES = [
  'index.html', '404.html', 'config.js', 'favicon.svg', 'apple-touch-icon.png',
  'og-image.png', 'robots.txt', 'sitemap.xml'
];
const PUBLIC_DIRS = ['css', 'js', 'images'];
const TEXT_TO_PROCESS = ['index.html', '404.html', 'robots.txt', 'sitemap.xml'];

// Токен бота выглядит как 123456789:AAE... — такого в публичных файлах быть не должно
const TOKEN_RE = /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/;

function readConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  return vm.runInNewContext(src + '\n;CONFIG', {}, { timeout: 2000 });
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function walk(dir, out) {
  out = out || [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function main() {
  const config = readConfig();
  const seo = config.seo || {};

  let siteUrl = (process.env.SITE_URL || seo.siteUrl || process.env.URL || 'http://localhost:8000').trim();
  siteUrl = siteUrl.replace(/\/+$/, '');

  const title = escapeAttr(seo.title || 'LIW — разработка сайтов для бизнеса');
  const description = escapeAttr(seo.description || '');
  const today = new Date().toISOString().slice(0, 10);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const f of PUBLIC_FILES) {
    const from = path.join(ROOT, f);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(DIST, f));
  }
  for (const d of PUBLIC_DIRS) {
    const from = path.join(ROOT, d);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(DIST, d), { recursive: true });
  }

  for (const f of TEXT_TO_PROCESS) {
    const p = path.join(DIST, f);
    if (!fs.existsSync(p)) continue;
    const out = fs.readFileSync(p, 'utf8')
      .replace(/__SITE_URL__/g, siteUrl)
      .replace(/__TITLE__/g, title)
      .replace(/__DESCRIPTION__/g, description)
      .replace(/__DATE__/g, today);
    fs.writeFileSync(p, out);
  }

  // Проверка на утечку токена
  const textExt = /\.(html|js|css|json|txt|xml|svg|md)$/i;
  for (const file of walk(DIST)) {
    if (textExt.test(file) && TOKEN_RE.test(fs.readFileSync(file, 'utf8'))) {
      throw new Error('Похоже на токен Telegram-бота в файле: ' + path.relative(ROOT, file) +
        '\nУдалите его! Токен должен храниться только в Netlify Environment variables.');
    }
  }

  console.log('LIW build OK → dist/  (siteUrl: ' + siteUrl + ')');
}

try {
  main();
} catch (e) {
  console.error('LIW build FAILED:', e.message);
  process.exit(1);
}
