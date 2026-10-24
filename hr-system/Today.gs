/**
 * "Today" sheet: only today's date with every employee. HR picks Absent / Full Day Leave /
 * Half Day Leave; each pick is copied into the month sheet (column I) right away.
 * The daily trigger moves this sheet to the new date every night.
 */

const TODAY_SHEET = 'Today';
const TODAY_HEADERS = ['Date', 'Day', 'Name', 'City', 'Designation', 'Mark (leave empty if present)', 'Remarks'];

function openToday() {
  SpreadsheetApp.getActive().setActiveSheet(refreshToday_());
}

/** Rebuilds the Today sheet for today's date, showing marks already saved in the month sheet. */
function refreshToday_() {
  const ss = SpreadsheetApp.getActive();
  const sh = getOrCreateSheet_(TODAY_SHEET, TODAY_HEADERS, [110, 60, 200, 110, 260, 200, 280], '#e69138');
  const now = new Date();
  const day = fmt_(now, 'yyyy-MM-dd');
  const month = ensureMonthSheet_(now);

  const saved = {};
  if (month.getLastRow() > 1) {
    month.getRange(2, 1, month.getLastRow() - 1, 10).getValues().forEach(r => {
      if (fmt_(r[0], 'yyyy-MM-dd') === day) saved[normName_(r[3])] = [r[8], r[9]];
    });
  }

  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rows = getEmployees_().map(e => {
    const m = saved[normName_(e.name)] || ['', ''];
    return [date, fmt_(now, 'EEE'), e.name, e.city, e.designation, m[0], m[1]];
  });

  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, TODAY_HEADERS.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, TODAY_HEADERS.length).setValues(rows);

  sh.getRange('A:A').setNumberFormat('dd-MMM-yyyy');
  sh.getRange('A:B').setHorizontalAlignment('center');
  sh.getRange('F:F').setHorizontalAlignment('center');
  const marks = sh.getRange('F2:F');
  marks.setBackground('#fffbea').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(MARKS, true).setAllowInvalid(false).build());
  const rule = (text, bg, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$F2="' + text + '"').setBackground(bg).setFontColor(color)
    .setRanges([sh.getRange('A2:G')]).build();
  sh.setConditionalFormatRules([
    rule('Absent', '#f4cccc', '#990000'),
    rule('Full Day Leave', '#ffe599', '#7f6000'),
    rule('Half Day Leave', '#fff2cc', '#7f6000'),
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
  const n = month.getLastRow() - 1;
  const data = month.getRange(2, 1, n, 4).getValues();
  const marks = month.getRange(2, 9, n, 2).getValues();
  const index = {};
  data.forEach((r, i) => { index[fmt_(r[0], 'yyyy-MM-dd') + '|' + normName_(r[3])] = i; });

  rows.forEach(r => {
    if (!(r[0] instanceof Date)) return;
    const i = index[fmt_(r[0], 'yyyy-MM-dd') + '|' + normName_(r[2])];
    if (i !== undefined) marks[i] = [r[5], r[6]];
  });
  month.getRange(2, 9, n, 2).setValues(marks);
}
