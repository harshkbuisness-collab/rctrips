/**
 * Monthly attendance sheets and attendance file upload.
 *
 * Month sheet "Att Nov-2026": one row per day per employee.
 * A Date | B Day | C Emp Code | D Name | E City | F In Time | G Out Time | H Status (auto) | I Leave (HR) | J Remarks
 */

const ATT_HEADERS = ['Date', 'Day', 'Emp Code', 'Name', 'City', 'In Time', 'Out Time', 'Status', 'Leave (HR)', 'Remarks'];

// Status is a live formula, so it updates as soon as HR marks a leave or a holiday is added.
const STATUS_FORMULA_R1C1 =
  '=IF(RC9="Full Day","Leave",IF(RC9="Half Day","Half Day Leave",IF(RC2="Sun","Week Off",' +
  'IF(COUNTIF(Holidays!C1:C1,RC1)>0,"Holiday",IF(RC6="",IF(RC1<TODAY(),"Absent",""),' +
  'IF(MOD(RC6,1)>MOD(OfficeStart,1),"Late","Present"))))))';

function monthSheetName_(key) {
  return 'Att ' + fmt_(monthKeyToDate_(key), 'MMM-yyyy');
}

/** Creates the month sheet if missing and adds rows for any newly added employees. */
function ensureMonthSheet_(dateInMonth) {
  const key = fmt_(dateInMonth, 'yyyy-MM');
  const ss = SpreadsheetApp.getActive();
  const name = monthSheetName_(key);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name, 0);
    sh.getRange(1, 1, 1, ATT_HEADERS.length).setValues([ATT_HEADERS]);
    styleSheet_(sh, ATT_HEADERS.length, [110, 60, 90, 190, 100, 90, 90, 130, 110, 240], '#1f3864');
    formatMonthSheet_(sh);
  }

  const existing = new Set();
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 4, sh.getLastRow() - 1, 1).getValues().forEach(r => existing.add(normName_(r[0])));
  }
  const missing = getEmployees_().filter(e => !existing.has(normName_(e.name)));
  if (!missing.length) return sh;

  const start = monthKeyToDate_(key);
  const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(start.getFullYear(), start.getMonth(), d);
    missing.forEach(e => rows.push([date, fmt_(date, 'EEE'), e.code, e.name, e.city, '', '', '', '', '']));
  }
  const first = sh.getLastRow() + 1;
  const need = first + rows.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
  sh.getRange(first, 1, rows.length, ATT_HEADERS.length).setValues(rows);
  sh.getRange(first, 8, rows.length, 1).setFormulaR1C1(STATUS_FORMULA_R1C1);
  sh.getRange(2, 1, sh.getLastRow() - 1, ATT_HEADERS.length).sort([{ column: 1, ascending: true }, { column: 4, ascending: true }]);
  // Re-apply so new rows get the dropdown, colours and banding.
  formatMonthSheet_(sh);
  applyBanding_(sh, ATT_HEADERS.length);
  sh.getRange(1, 1, sh.getMaxRows(), ATT_HEADERS.length).setFontFamily(THEME.font).setFontSize(10);
  return sh;
}

function formatMonthSheet_(sh) {
  sh.getRange('A:A').setNumberFormat('dd-MMM-yyyy');
  sh.getRange('F:G').setNumberFormat('HH:mm');
  sh.getRange('I2:I').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Full Day', 'Half Day'], true).setAllowInvalid(false).build());
  sh.getRange('A:C').setHorizontalAlignment('center');
  sh.getRange('F:I').setHorizontalAlignment('center');
  sh.getRange('I2:I').setBackground('#fffbea');
  const all = sh.getRange('A2:J');
  const status = sh.getRange('H2:H');
  const rowRule = (text, bg, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$H2="' + text + '"').setBackground(bg).setFontColor(color).setRanges([all]).build();
  const cellRule = (text, bg, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text).setBackground(bg).setFontColor(color).setBold(true).setRanges([status]).build();
  sh.setConditionalFormatRules([
    cellRule('Late', '#f4cccc', '#990000'),
    cellRule('Absent', '#e06666', '#ffffff'),
    cellRule('Leave', '#ffe599', '#7f6000'),
    cellRule('Half Day Leave', '#fff2cc', '#7f6000'),
    cellRule('Present', '#d9ead3', '#274e13'),
    rowRule('Week Off', '#eeeeee', '#999999'),
    rowRule('Holiday', '#d0e0e3', '#0c343d'),
  ]);
}

/**
 * Reads the "Raw Upload" sheet and fills In/Out times in the month sheet(s).
 */
function processUpload() {
  const ui = SpreadsheetApp.getUi();
  const raw = SpreadsheetApp.getActive().getSheetByName(SHEETS.RAW);
  const records = parseRawAttendance_(raw.getDataRange().getDisplayValues());
  if (!records.length) {
    ui.alert('No attendance rows found in "' + SHEETS.RAW + '" sheet.');
    return;
  }

  // Group records by month so each month sheet is read and written once.
  const byMonth = {};
  records.forEach(r => (byMonth[fmt_(r.date, 'yyyy-MM')] = byMonth[fmt_(r.date, 'yyyy-MM')] || []).push(r));

  const unmatched = new Set();
  let filled = 0;
  Object.keys(byMonth).forEach(key => {
    const sh = ensureMonthSheet_(monthKeyToDate_(key));
    const n = sh.getLastRow() - 1;
    const data = sh.getRange(2, 1, n, 7).getValues();
    const index = {};
    data.forEach((row, i) => {
      const day = fmt_(row[0], 'yyyy-MM-dd');
      index[day + '|' + normName_(row[3])] = i;
      if (String(row[2]).trim()) index[day + '|#' + String(row[2]).trim()] = i;
    });
    const times = data.map(row => [row[5], row[6]]);
    byMonth[key].forEach(r => {
      const day = fmt_(r.date, 'yyyy-MM-dd');
      const i = r.code && index[day + '|#' + r.code] !== undefined ? index[day + '|#' + r.code] : index[day + '|' + normName_(r.name)];
      if (i === undefined) { unmatched.add(r.name || r.code); return; }
      times[i] = [r.inTime || '', r.outTime || ''];
      filled++;
    });
    sh.getRange(2, 6, n, 2).setValues(times);
  });

  let msg = 'Done. ' + filled + ' attendance entries filled.';
  if (unmatched.size) {
    msg += '\n\nThese names were not found in the Employees sheet (add them or fix the spelling, then upload again):\n' +
      Array.from(unmatched).join('\n');
  }
  ui.alert(msg);
}

/**
 * Converts the raw export into [{code, name, date (Date), inTime 'HH:mm', outTime 'HH:mm'}].
 *
 * TEMPORARY generic version: finds a header row with columns like Name / Emp Code / Date / In / Out.
 * Will be replaced to match the exact format of the attendance app export.
 */
function parseRawAttendance_(values) {
  const headerIdx = values.findIndex(r => r.some(c => /date/i.test(c)) && r.some(c => /name|code|id/i.test(c)));
  if (headerIdx < 0) return [];
  const h = values[headerIdx].map(c => String(c).toLowerCase().trim());
  const col = re => h.findIndex(c => re.test(c));
  const cName = col(/name/), cCode = col(/code|emp.?id|^id$/), cDate = col(/date/);
  const cIn = col(/^in|in.?time|first.?in|check.?in/), cOut = col(/^out|out.?time|last.?out|check.?out/);

  const out = [];
  values.slice(headerIdx + 1).forEach(r => {
    const date = toDate_(r[cDate]);
    if (!date) return;
    out.push({
      code: cCode >= 0 ? String(r[cCode]).trim() : '',
      name: cName >= 0 ? String(r[cName]).trim() : '',
      date: date,
      inTime: toTime_(r[cIn]),
      outTime: toTime_(r[cOut]),
    });
  });
  return out;
}

function toDate_(v) {
  if (v instanceof Date) return v;
  const s = String(v || '').trim();
  const m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/); // dd-mm-yyyy
  if (m) return new Date(Number(m[3].length === 2 ? '20' + m[3] : m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = s ? new Date(s.replace(/-/g, ' ')) : null;
  return d && !isNaN(d) ? d : null;
}

/** Returns 'HH:mm' or '' (strings are parsed by Sheets as time values). */
function toTime_(v) {
  if (v instanceof Date) return fmt_(v, 'HH:mm');
  const m = String(v || '').trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : '';
}
