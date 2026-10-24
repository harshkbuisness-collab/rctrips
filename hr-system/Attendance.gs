/**
 * Monthly attendance sheets and attendance file upload.
 *
 * Month sheet "Att Nov-2026": one row per day per employee.
 * A Date | B Day | C Emp Code | D Name | E City | F In Time | G Out Time | H Status (auto) | I Leave (HR) | J Remarks
 */

const ATT_HEADERS = ['Date', 'Day', 'Emp Code', 'Name', 'City', 'In Time', 'Out Time', 'Status', 'Leave (HR)', 'Remarks'];

// HR marks (from the Today sheet or directly in column I of a month sheet).
const MARKS = ['Absent', 'Full Day Leave', 'Half Day Leave', 'On Duty'];

// Status is a live formula, so it updates as soon as HR marks something or the PDF is uploaded.
// No punch counts as Absent only for dates already covered by an upload (named range LastUpload).
const STATUS_FORMULA_R1C1 =
  '=IF(RC9="Absent","Absent",IF(RC9="Full Day Leave","Leave",IF(RC9="Half Day Leave","Half Day Leave",IF(RC9="On Duty","On Duty",' +
  'IF(RC2="Sun","Week Off",IF(COUNTIF(Holidays!C1:C1,RC1)>0,"Holiday",' +
  'IF(RC6="",IF(AND(N(LastUpload)>0,RC1<=LastUpload),"Absent",""),' +
  'IF(MOD(RC6,1)>MOD(OfficeStart,1),"Late","Present"))))))))';

function monthSheetName_(key) {
  return 'Att ' + fmt_(monthKeyToDate_(key), 'MMM-yyyy');
}

/** Creates the month sheet if missing and adds rows for any newly added employees. */
function ensureMonthSheet_(dateInMonth) {
  const key = fmt_(dateInMonth, 'yyyy-MM');
  const ss = SpreadsheetApp.getActive();
  const name = monthSheetName_(key);
  ensureLastUploadSetting_();
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
  if (!missing.length) {
    if (sh.getLastRow() > 1) {
      sh.getRange(2, 8, sh.getLastRow() - 1, 1).setFormulaR1C1(STATUS_FORMULA_R1C1);
      formatMonthSheet_(sh);
    }
    return sh;
  }

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
    SpreadsheetApp.newDataValidation().requireValueInList(MARKS, true).setAllowInvalid(false).build());
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
    cellRule('On Duty', '#cfe2f3', '#073763'),
    rowRule('Week Off', '#eeeeee', '#999999'),
    rowRule('Holiday', '#d0e0e3', '#0c343d'),
  ]);
}

/**
 * Reads the "Raw Upload" sheet and fills In/Out times in the month sheet(s).
 */
function processUpload() {
  const raw = SpreadsheetApp.getActive().getSheetByName(SHEETS.RAW);
  SpreadsheetApp.getUi().alert(fillAttendance_(raw.getDataRange().getDisplayValues()));
}

/** Fills In/Out times in the month sheet(s) from a table of values. Returns a message for HR. */
function fillAttendance_(values) {
  const records = parseRawAttendance_(values);
  if (!records.length) {
    return 'No attendance rows could be read from this file. Check the "' + SHEETS.RAW + '" sheet to see what was read.';
  }

  // Group records by month so each month sheet is read and written once.
  const byMonth = {};
  records.forEach(r => (byMonth[fmt_(r.date, 'yyyy-MM')] = byMonth[fmt_(r.date, 'yyyy-MM')] || []).push(r));

  const unmatched = new Set();
  let filled = 0;
  const lastDate = records.reduce((m, r) => (r.date > m ? r.date : m), records[0].date);
  Object.keys(byMonth).forEach(key => {
    const sh = ensureMonthSheet_(monthKeyToDate_(key));
    const n = sh.getLastRow() - 1;
    const data = sh.getRange(2, 1, n, 10).getValues();
    const index = {};
    data.forEach((row, i) => {
      const day = fmt_(row[0], 'yyyy-MM-dd');
      index[day + '|' + normName_(row[3])] = i;
      if (String(row[2]).trim()) index[day + '|#' + String(row[2]).trim()] = i;
    });
    const sheetNames = Array.from(new Set(data.map(row => normName_(row[3]))));
    const times = data.map(row => [row[5], row[6]]);
    const marks = data.map(row => [row[8], row[9]]);
    byMonth[key].forEach(r => {
      const day = fmt_(r.date, 'yyyy-MM-dd');
      const name = resolveName_(r.name, sheetNames);
      const i = r.code && index[day + '|#' + r.code] !== undefined ? index[day + '|#' + r.code] : index[day + '|' + name];
      if (i === undefined) { unmatched.add(r.name || r.code); return; }
      times[i] = [r.inTime || '', r.outTime || ''];
      // HR's own marks win over the machine file.
      if (r.mark && !marks[i][0]) marks[i][0] = r.mark;
      if (r.note && !marks[i][1]) marks[i][1] = r.note;
      filled++;
    });
    sh.getRange(2, 6, n, 2).setValues(times);
    sh.getRange(2, 9, n, 2).setValues(marks);
  });

  // Days up to the last date in the file: no punch now shows as Absent.
  const lastUpload = SpreadsheetApp.getActive().getRangeByName('LastUpload');
  if (!lastUpload.getValue() || lastDate > lastUpload.getValue()) lastUpload.setValue(lastDate);

  let msg = 'Done. ' + filled + ' attendance entries filled (' + Object.keys(byMonth).map(monthLabel_).join(', ') + ').';
  if (unmatched.size) {
    msg += '\n\nThese names from the file are not in the Employees sheet (add them, then upload again):\n' +
      Array.from(unmatched).join('\n');
  }
  return msg;
}

/**
 * Converts the raw file into [{code, name, date, inTime, outTime, mark, note}].
 * First tries the attendance machine's monthly grid; falls back to a simple row-per-day table.
 */
function parseRawAttendance_(values) {
  values = values.map(r => r.map(c => String(c == null ? '' : c).trim()));
  const grid = parseMonthGrid_(values);
  return grid.length ? grid : parseRowTable_(values);
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Machine format: a month name (e.g. "SEPTEMBER"), a header row with Emp Code / Employee and day
 * numbers 1..31, then one row per employee. Cells hold the in-time, or LEAVE / OD / SUN / 0:00.
 */
function parseMonthGrid_(values) {
  let month = -1;
  values.slice(0, 10).some(r => r.some(c => {
    const m = MONTHS.indexOf(c.toUpperCase().slice(0, 3));
    if (m >= 0 && /^[A-Za-z]+$/.test(c) && c.length >= 3) { month = m; return true; }
    return false;
  }));
  const headerIdx = values.findIndex(r => r.filter(c => /^\d{1,2}$/.test(c) && +c >= 1 && +c <= 31).length >= 20);
  if (month < 0 || headerIdx < 0) return [];

  const header = values[headerIdx];
  const dayCols = {};
  header.forEach((c, i) => { if (/^\d{1,2}$/.test(c) && +c >= 1 && +c <= 31) dayCols[i] = +c; });
  const firstDayCol = Math.min(...Object.keys(dayCols).map(Number));
  let nameCol = header.findIndex(c => /employee|name/i.test(c));
  const codeCol = header.findIndex(c => /code|s\.?\s*no/i.test(c));
  if (nameCol < 0 || nameCol >= firstDayCol) nameCol = firstDayCol - 1;

  const now = new Date();
  const year = month > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
  const out = [];
  values.slice(headerIdx + 1).forEach(r => {
    const name = r[nameCol] || '';
    if (!name || /^days?$/i.test(name) || /^\d+$/.test(name)) return;
    const code = codeCol >= 0 && codeCol < firstDayCol ? r[codeCol] : '';
    Object.keys(dayCols).forEach(col => {
      const v = String(r[col] || '').toUpperCase();
      const date = new Date(year, month, dayCols[col]);
      if (date.getMonth() !== month || !v || v === 'SUN') return;
      const rec = { code: '', name: name, date: date, inTime: '', outTime: '', mark: '', note: '' };
      if (/^LEAVE$|^L$/.test(v)) rec.mark = 'Full Day Leave';
      else if (/^HALF|^HD$/.test(v)) rec.mark = 'Half Day Leave';
      else if (/^OD$/.test(v)) rec.mark = 'On Duty';
      else {
        const t = toTime_(v);
        if (!t || t === '00:00') return; // no punch
        rec.inTime = t;
        if (+t.slice(0, 2) >= 14) rec.note = 'Single punch at ' + t + ' - check';
      }
      out.push(rec);
    });
  });
  return out;
}

/** Simple table: header row with Name / Code / Date / In / Out columns. */
function parseRowTable_(values) {
  const headerIdx = values.findIndex(r => r.some(c => /date/i.test(c)) && r.some(c => /name|code|id/i.test(c)));
  if (headerIdx < 0) return [];
  const h = values[headerIdx].map(c => c.toLowerCase());
  const col = re => h.findIndex(c => re.test(c));
  const cName = col(/name/), cCode = col(/code|emp.?id|^id$/), cDate = col(/date/);
  const cIn = col(/^in|in.?time|first.?in|check.?in/), cOut = col(/^out|out.?time|last.?out|check.?out/);

  const out = [];
  values.slice(headerIdx + 1).forEach(r => {
    const date = toDate_(r[cDate]);
    if (!date) return;
    out.push({
      code: cCode >= 0 ? r[cCode] : '',
      name: cName >= 0 ? r[cName] : '',
      date: date,
      inTime: toTime_(r[cIn]),
      outTime: toTime_(r[cOut]),
    });
  });
  return out;
}

/**
 * Machine names are often short ("Jyoti", "Umesh Gurani"). Match exact name first,
 * then a unique first-name match. Returns the normalised sheet name (or the input if no match).
 */
function resolveName_(machineName, sheetNames) {
  const n = normName_(machineName);
  if (sheetNames.indexOf(n) >= 0) return n;
  const first = n.split(' ')[0];
  const hits = sheetNames.filter(s => s.split(' ')[0] === first);
  return hits.length === 1 ? hits[0] : n;
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
