# LIW — lost in wired

Сайт веб-разработчика: оффер, живые демо-шаблоны для малого бизнеса, шаги, тарифы, FAQ и форма заявки (имя, телефон, выбор шаблона).

**Стек:** Vite (без Three.js и GSAP, чтобы сайт быстро открывался на телефоне). Одна серверная функция Netlify (`netlify/functions/lead.cjs`) отправляет заявки в Telegram.

## Запуск
```
npm install
npm run dev      # сайт на http://localhost:5173 (форма локально не отправляется: функция работает только на Netlify)
npm run build    # сборка в dist/
npm test         # проверка серверной функции (Telegram подменён)
```

## Секреты
Токены **не хранятся в коде и репозитории**. Они задаются только в Netlify → Site configuration → Environment variables:
- `TG_TOKEN` — токен бота от @BotFather
- `TG_CHAT_ID` — chat id, куда приходят заявки
- по желанию: `BRAND_NAME`, `LEAD_TIMEZONE` (по умолчанию `Asia/Almaty`)

Файл `.env` (если создаёте для локальных проверок) в репозиторий не попадает.

## Где что менять
- Тексты и переводы (RU/ҚАЗ), цены тарифов: `src/i18n.js`
- Демо-шаблоны ниш (тексты, цены, время): `src/niches.js`
- Логика страницы и формы: `src/main.js`, 3D-сцена: `src/scene.js`
- Стили: `src/style.css`
- Политика конфиденциальности: `public/privacy.html`
- Пример работы (картинка): `public/images/`

## Обновление сайта
`git add . && git commit -m "что изменил" && git push` — Netlify сам соберёт и опубликует ветку `main`.
