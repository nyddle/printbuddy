/**
 * PrintBuddy — Google Sheets webhook
 *
 * Receives POST from /js/cart.js and appends a row to the "Orders" sheet.
 * Setup instructions: see /docs/google-sheets-setup.md
 *
 * Body format (JSON, sent as text/plain to avoid CORS preflight):
 *   {
 *     name, email, phone, message,
 *     store, portfolio, order_total, order_json
 *   }
 */

const SHEET_NAME = 'Orders';
const HEADERS = [
  'timestamp',
  'store',
  'portfolio',
  'name',
  'email',
  'phone',
  'message',
  'order_total',
  'order_json',
  'user_agent'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date(),
      data.store || '',
      data.portfolio || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.message || '',
      data.order_total || '',
      data.order_json || '',
      data.user_agent || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Quick test: paste the URL into a browser, you should see "OK".
function doGet() {
  return ContentService
    .createTextOutput('OK — PrintBuddy webhook is alive. Use POST to submit orders.')
    .setMimeType(ContentService.MimeType.TEXT);
}
