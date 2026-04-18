# PrintBuddy — лендинг

Статический лендинг. Все тексты живут в `content.json` — редактируй его, не HTML.

## Структура

```
printbuddy/
├── index.html       # вёрстка + стили + рендер из JSON
├── content.json     # все тексты лендинга
├── netlify.toml     # конфиг деплоя
└── README.md
```

## Как редактировать тексты

1. Открой `content.json`
2. Поменяй нужное поле (заголовок, отзыв, цену, что угодно)
3. Сохрани — локально увидишь изменения после reload
4. `git add content.json && git commit -m "..." && git push` — Netlify задеплоит сам

## Локальная разработка

```bash
python3 -m http.server 8080
# открой http://localhost:8080
```

Просто `open index.html` не сработает — браузер заблокирует `fetch('content.json')` из-за CORS на `file://`.

## Деплой

Подключено к Netlify через GitHub. Любой пуш в `main` → автоматический деплой.
Ветки и PR получают свои preview URL.
