# Заявки в Google Sheet

Каждая отправка корзины пишется параллельно в Netlify Forms (резерв) и в твою Google-таблицу. Настройка занимает ~3 минуты.

## 1. Создай Google Sheet

1. Зайди на https://sheets.google.com → "Создать пустую таблицу"
2. Назови как угодно (например, "PrintBuddy Orders")
3. Первый лист переименуй в `Orders` (правый клик по вкладке → Rename)
4. Можешь оставить лист пустым — заголовки скрипт создаст сам

## 2. Привяжи Apps Script

1. В таблице: **Extensions → Apps Script** (откроется редактор скрипта)
2. Удали всё содержимое в `Code.gs`
3. Скопируй и вставь содержимое файла [`google-apps-script.gs`](./google-apps-script.gs) из этого репо
4. Сохрани (⌘S или иконка дискеты), назови проект (например, "Orders webhook")

## 3. Задеплой как Web App

1. В редакторе: **Deploy → New deployment**
2. Шестерёнка слева сверху → **Web app**
3. Параметры:
   - **Description:** PrintBuddy orders
   - **Execute as:** Me (твой email)
   - **Who has access:** **Anyone** ← важно, иначе вернёт 401
4. **Deploy** → разреши доступ (нажми "Authorize" → выбери аккаунт → "Advanced" → "Go to ... (unsafe)" → "Allow"; это нормально, скрипт твой собственный)
5. Скопируй **Web app URL** — выглядит как `https://script.google.com/macros/s/AKfycb…/exec`

## 4. Подключи к сайту

Открой `/config.json` в репо, вставь URL:

```json
{
  "checkout": {
    "google_sheets_webhook": "https://script.google.com/macros/s/AKfycb…/exec"
  }
}
```

`git add config.json && git commit -m "Hook up sheet" && git push` — Netlify задеплоит за 15 секунд. Готово.

## 5. Проверь

Открой свой магазин, добавь принт в корзину, оформи заявку → проверь Google Sheet, должна появиться строка с timestamp, именем, email, телефоном, комментарием, итогом и составом заказа в JSON.

## Если потом нужно поменять скрипт

Apps Script кешируется по версии деплоя. После правок:
- **Deploy → Manage deployments → редактирование → New version → Deploy**
- URL остаётся тем же

## Безопасность

- URL публичный, но угадать его невозможно (длинный ID)
- В скрипте можно добавить простой shared-secret в заголовке/поле — спроси, если нужно
- Honeypot-поле (`bot-field`) уже отсекает большинство ботов
