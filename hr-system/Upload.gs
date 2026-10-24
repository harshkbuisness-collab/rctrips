/**
 * Upload button: HR picks a PDF / Excel / CSV file, the script converts it into a table,
 * shows it in the "Raw Upload" sheet and fills the month sheet(s).
 *
 * Needs the Drive API service: Apps Script > Services (+) > Drive API > Add.
 */

function showUploadDialog() {
  const html = HtmlService.createHtmlOutput(`
<div style="font-family:Arial,sans-serif;font-size:14px">
  <p>Choose the attendance file from the machine (<b>PDF</b>, <b>Excel</b> or <b>CSV</b>).</p>
  <input type="file" id="f" accept=".pdf,.xlsx,.xls,.csv">
  <p><button id="b" onclick="go()" style="background:#1f3864;color:#fff;border:0;padding:10px 18px;border-radius:6px;cursor:pointer">Upload</button></p>
  <p id="s" style="white-space:pre-wrap;color:#444"></p>
</div>
<script>
function go() {
  const file = document.getElementById('f').files[0];
  const s = document.getElementById('s');
  if (!file) { s.textContent = 'Please choose a file first.'; return; }
  document.getElementById('b').disabled = true;
  s.textContent = 'Reading file... please wait (up to 1 minute).';
  const reader = new FileReader();
  reader.onload = () => google.script.run
    .withSuccessHandler(msg => { s.textContent = msg; document.getElementById('b').disabled = false; })
    .withFailureHandler(e => { s.textContent = 'Error: ' + e.message; document.getElementById('b').disabled = false; })
    .uploadAttendanceFile(reader.result.split(',')[1], file.name, file.type);
  reader.readAsDataURL(file);
}
</script>`).setWidth(460).setHeight(320);
  SpreadsheetApp.getUi().showModalDialog(html, 'Upload Attendance File');
}

/** Called from the dialog. Returns a message shown to HR. */
function uploadAttendanceFile(base64, name, mime) {
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime || '', name);
  const ext = name.split('.').pop().toLowerCase();
  let values;
  if (ext === 'csv') values = Utilities.parseCsv(blob.getDataAsString());
  else if (ext === 'xlsx' || ext === 'xls') values = excelToValues_(blob);
  else if (ext === 'pdf') values = pdfToValues_(blob);
  else throw new Error('Please choose a PDF, Excel or CSV file.');

  writeRaw_(values);
  return fillAttendance_(values);
}

function excelToValues_(blob) {
  const id = convertWithDrive_(blob, 'application/vnd.google-apps.spreadsheet');
  try {
    return SpreadsheetApp.openById(id).getSheets()[0].getDataRange().getDisplayValues();
  } finally {
    DriveApp.getFileById(id).setTrashed(true);
  }
}

/** PDF -> Google Doc (Drive conversion) -> table rows. Uses the doc's tables, else splits text lines. */
function pdfToValues_(blob) {
  const id = convertWithDrive_(blob, 'application/vnd.google-apps.document');
  try {
    const body = DocumentApp.openById(id).getBody();
    const rows = [];
    body.getTables().forEach(t => {
      for (let r = 0; r < t.getNumRows(); r++) {
        const row = t.getRow(r);
        const cells = [];
        for (let c = 0; c < row.getNumCells(); c++) cells.push(row.getCell(c).getText().trim());
        rows.push(cells);
      }
    });
    if (rows.length) return rows;
    return body.getText().split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      .map(l => l.split(/\t|\s{2,}/).map(c => c.trim()));
  } finally {
    DriveApp.getFileById(id).setTrashed(true);
  }
}

function convertWithDrive_(blob, targetMime) {
  if (typeof Drive === 'undefined') {
    throw new Error('Turn on Drive API: Apps Script > Services (+) > Drive API > Add. Then try again.');
  }
  return Drive.Files.create({ name: 'HR_TEMP_' + Date.now(), mimeType: targetMime }, blob).id;
}

/** Shows exactly what was read from the file in the Raw Upload sheet. */
function writeRaw_(values) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.RAW);
  const width = Math.max(1, ...values.map(r => r.length));
  const rows = values.map(r => r.concat(Array(width - r.length).fill('')));
  sh.clear();
  if (sh.getMaxColumns() < width) sh.insertColumnsAfter(sh.getMaxColumns(), width - sh.getMaxColumns());
  if (sh.getMaxRows() < rows.length) sh.insertRowsAfter(sh.getMaxRows(), rows.length - sh.getMaxRows());
  if (rows.length) sh.getRange(1, 1, rows.length, width).setNumberFormat('@').setValues(rows);
}
