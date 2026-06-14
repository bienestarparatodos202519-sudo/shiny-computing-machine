const SHEETS = ['patients', 'doctors', 'appointments', 'blockedDays'];

function doGet() {
  const data = {};
  SHEETS.forEach((name) => {
    data[name] = readSheet_(name);
  });

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  SHEETS.forEach((name) => {
    writeSheet_(name, payload[name] || []);
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  return values.slice(1).filter((row) => row.some(Boolean)).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      try {
        record[header] = JSON.parse(row[index]);
      } catch {
        record[header] = row[index];
      }
    });
    return record;
  });
}

function writeSheet_(name, rows) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.clearContents();

  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? ''))));
}
