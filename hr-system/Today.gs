/**
 * "Today" sheet: only today's date with every employee. HR picks LEAVE / OD;
 * each pick is copied into today's cell of the month sheet right away (remarks go in as a cell note).
 * The daily trigger moves this sheet to the new date every night.
 */

const TODAY_SHEET = 'Today';
const TODAY_HEADERS = ['Date', 'Day', 'Name', 'City', 'Designation', 'Mark (leave empty if present)', 'Remarks'];

function openToday() {
  SpreadsheetApp.getActive().setActiveSheet(refreshToday_());
}

/** Rebuilds the Today sheet for today's date, showing marks already saved in the month sheet. */
function refreshToday_() {
  const sh = getOrCreateSheet_(TODAY_SHEET, TODAY_HEADERS, [110, 60, 200, 110, 260, 200, 280], '#e69138');
  const now = new Date();
  const month = ensureMonthSheet_(now);
  const index = monthRowIndex_(month);
  const col = ATT_FIRST_DAY_COL + now.getDate() - 1;
  const n = month.getLastRow() - ATT_FIRST_ROW + 1;
  const cells = n > 0 ? month.getRange(ATT_FIRST_ROW, col, n, 1) : null;
  const values = cells ? cells.getDisplayValues() : [];
  const notes = cells ? cells.getNotes() : [];

  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rows = getEmployees_().map(e => {
    const row = index[normName_(e.name)];
    const i = row ? row - ATT_FIRST_ROW : -1;
    const mark = i >= 0 && MARKS.indexOf(values[i][0]) >= 0 ? values[i][0] : '';
    return [date, fmt_(now, 'EEE'), e.name, e.city, e.designation, mark, i >= 0 ? notes[i][0] : ''];
  });

  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, TODAY_HEADERS.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, TODAY_HEADERS.length).setValues(rows);

  sh.getRange('A:A').setNumberFormat('dd-MMM-yyyy');
  sh.getRange('A:B').setHorizontalAlignment('center');
  sh.getRange('F:F').setHorizontalAlignment('center');
  sh.getRange('F2:F').setBackground('#fffbea').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(MARKS, true).setAllowInvalid(false).build());
  const rule = (text, bg, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$F2="' + text + '"').setBackground(bg).setFontColor(color)
    .setRanges([sh.getRange('A2:G')]).build();
  sh.setConditionalFormatRules([
    rule('LEAVE', '#ffe599', '#7f6000'),
    rule('OD', '#cfe2f3', '#073763'),
  ]);
  return sh;
}

/** Simple trigger: copies marks/remarks typed in the Today sheet into the month sheet. */
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== TODAY_SHEET || e.range.getLastRow() < 2) return;
  if (e.range.getLastColumn() < 6 || e.range.getColumn() > 7) return;

  const firstRow = Math.max(2, e.range.getRow());
  const rows = sh.getRange(firstRow, 1, e.range.getLastRow() - firstRow + 1, TODAY_HEADERS.length).getValues();
  const date = rows[0][0] instanceof Date ? rows[0][0] : new Date();
  const month = SpreadsheetApp.getActive().getSheetByName(monthSheetName_(fmt_(date, 'yyyy-MM'))) || ensureMonthSheet_(date);
  const index = monthRowIndex_(month);
  const col = ATT_FIRST_DAY_COL + date.getDate() - 1;
  const remarksEdited = e.range.getLastColumn() >= 7;

  rows.forEach(r => {
    const row = index[normName_(r[2])];
    if (!row) return;
    const cell = month.getRange(row, col);
    const current = cell.getDisplayValue();
    if (r[5]) cell.setValue(r[5]);
    else if (MARKS.indexOf(current) >= 0) cell.clearContent();
    if (remarksEdited) cell.setNote(r[6] || '');
  });
}
