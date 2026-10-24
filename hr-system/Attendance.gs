/**
 * Monthly attendance sheets and attendance file upload.
 *
 * Month sheet "Att Nov-2026": one row per employee, one column per day.
 * Row 1: Emp Code | Name | 1 .. 31 | Late | Leave | OD    Row 2: day names (Mon, Tue ...)
 * Day cell: in-time (red if late, green if on time), LEAVE, OD, SUN (Sunday) or HOL (holiday).
 */

const ATT_FIRST_DAY_COL = 3;
const ATT_FIRST_ROW = 3;

// HR marks (from the Today sheet or typed directly in a day cell).
const MARKS = ['LEAVE', 'OD'];
const FIXED_CODES = ['LEAVE', 'OD', 'SUN', 'HOL'];

function monthSheetName_(key) {
  return 'Att ' + fmt_(monthKeyToDate_(key), 'MMM-yyyy');
}

function daysInMonth_(key) {
  const d = monthKeyToDate_(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Creates the month sheet if missing, adds newly added employees and fills SUN / HOL. */
function ensureMonthSheet_(dateInMonth) {
  const key = fmt_(dateInMonth, 'yyyy-MM');
  const ss = SpreadsheetApp.getActive();
  const name = monthSheetName_(key);
  const days = daysInMonth_(key);
  const width = 2 + days + 3;
  let sh = ss.getSheetByName(name);

  // Old layout (one row per day): convert it to the new grid, keeping times and HR marks.
  let oldRecords = null;
  if (sh && sh.getRange('A1').getValue() === 'Date') {
    oldRecords = readOldMonthSheet_(sh);
    ss.deleteSheet(sh);
    sh = null;
  }

  if (!sh) {
    sh = ss.insertSheet(name, 0);
    if (sh.getMaxColumns() < width) sh.insertColumnsAfter(sh.getMaxColumns(), width - sh.getMaxColumns());
    const header = ['Emp Code', 'Name'], dayNames = ['', ''];
    for (let d = 1; d <= days; d++) {
      header.push(d);
      dayNames.push(fmt_(new Date(dateInMonth.getFullYear(), dateInMonth.getMonth(), d), 'EEE'));
    }
    sh.getRange(1, 1, 2, width).setValues([header.concat(['Late', 'Leave', 'OD']), dayNames.concat(['', '', ''])]);
    styleSheet_(sh, width, [80, 180].concat(Array(days).fill(48), [60, 60, 50]), '#1f3864');
    sh.getRange(2, 1, 1, width).setBackground('#d9e1f2').setFontColor('#1f3864').setFontWeight('bold').setHorizontalAlignment('center');
    sh.setFrozenRows(2);
    sh.setFrozenColumns(2);
  }

  const existing = new Set();
  if (sh.getLastRow() >= ATT_FIRST_ROW) {
    sh.getRange(ATT_FIRST_ROW, 2, sh.getLastRow() - ATT_FIRST_ROW + 1, 1).getValues().forEach(r => existing.add(normName_(r[0])));
  }
  const missing = getEmployees_().filter(e => !existing.has(normName_(e.name)));
  if (missing.length) {
    const first = Math.max(sh.getLastRow() + 1, ATT_FIRST_ROW);
    const need = first + missing.length - 1 - sh.getMaxRows();
    if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
    sh.getRange(first, 1, missing.length, 2).setValues(missing.map(e => [e.code, e.name]));
    sh.getRange(ATT_FIRST_ROW, 1, sh.getLastRow() - ATT_FIRST_ROW + 1, width).sort({ column: 2, ascending: true });
  }

  formatMonthSheet_(sh, key);
  if (oldRecords) applyRecords_(sh, key, oldRecords);
  return sh;
}

/** Totals formulas, SUN / HOL in empty cells, colours. Safe to run again. */
function formatMonthSheet_(sh, key) {
  const days = daysInMonth_(key);
  const n = sh.getLastRow() - ATT_FIRST_ROW + 1;
  if (n < 1) return;
  const grid = sh.getRange(ATT_FIRST_ROW, ATT_FIRST_DAY_COL, n, days);
  grid.setNumberFormat('HH:mm').setHorizontalAlignment('center');

  fillFixedCodes_(grid, key);
  writeTotals_(sh, ATT_FIRST_ROW, n, days);

  const top = grid.getA1Notation().split(':')[0];
  const rule = () => SpreadsheetApp.newConditionalFormatRule().setRanges([grid]);
  const text = (t, bg, color) => rule().whenTextEqualTo(t).setBackground(bg).setFontColor(color).setBold(true).build();
  sh.setConditionalFormatRules([
    rule().whenFormulaSatisfied('=AND(ISNUMBER(' + top + '),MOD(' + top + ',1)>MOD(INDIRECT("OfficeStart"),1))')
      .setBackground('#f4cccc').setFontColor('#990000').setBold(true).build(),
    rule().whenFormulaSatisfied('=ISNUMBER(' + top + ')').setBackground('#d9ead3').setFontColor('#274e13').build(),
    text('LEAVE', '#ffe599', '#7f6000'),
    text('OD', '#cfe2f3', '#073763'),
    text('SUN', '#eeeeee', '#999999'),
    text('HOL', '#d9d2e9', '#20124d'),
  ]);
}

/** Puts SUN / HOL in empty cells of a day grid (columns = days 1..N of the month). */
function fillFixedCodes_(grid, key) {
  const start = monthKeyToDate_(key);
  const holidays = getHolidayDays_(key);
  const values = grid.getDisplayValues();
  let changed = false;
  for (let d = 1; d <= daysInMonth_(key); d++) {
    const code = new Date(start.getFullYear(), start.getMonth(), d).getDay() === 0 ? 'SUN' : holidays.has(d) ? 'HOL' : '';
    if (!code) continue;
    values.forEach(row => { if (!row[d - 1]) { row[d - 1] = code; changed = true; } });
  }
  if (changed) grid.setValues(values);
}

/** Late / Leave / OD count formulas next to the day columns. */
function writeTotals_(sh, firstRow, n, days) {
  const a1 = c => sh.getRange(1, c).getA1Notation().replace(/\d+/g, '');
  const firstCol = a1(ATT_FIRST_DAY_COL), lastCol = a1(ATT_FIRST_DAY_COL + days - 1);
  const range = r => firstCol + r + ':' + lastCol + r;
  const totals = [];
  for (let r = firstRow; r < firstRow + n; r++) {
    totals.push(['=COUNTIF(' + range(r) + ',">"&MOD(OfficeStart,1))', '=COUNTIF(' + range(r) + ',"LEAVE")', '=COUNTIF(' + range(r) + ',"OD")']);
  }
  sh.getRange(firstRow, ATT_FIRST_DAY_COL + days, n, 3).setFormulas(totals)
    .setHorizontalAlignment('center').setFontWeight('bold').setBackground('#f3f6fb');
}

/** Day numbers (1..31) of holidays in this month, from the Holidays sheet. */
function getHolidayDays_(key) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.HOLIDAYS);
  const out = new Set();
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(r => {
    const d = toDate_(r[0]);
    if (d && fmt_(d, 'yyyy-MM') === key) out.add(d.getDate());
  });
  return out;
}

/** Row number of each employee in a month sheet: {normName: row, '#code': row}. */
function monthRowIndex_(sh, firstRow = ATT_FIRST_ROW, n = sh.getLastRow() - ATT_FIRST_ROW + 1) {
  const index = {};
  if (n < 1) return index;
  sh.getRange(firstRow, 1, n, 2).getValues().forEach((r, i) => {
    index[normName_(r[1])] = firstRow + i;
    if (String(r[0]).trim()) index['#' + String(r[0]).trim()] = firstRow + i;
  });
  return index;
}

/** Records from an old-layout month sheet (Date | Day | Code | Name | City | In | Out | Status | Leave (HR) | Remarks). */
function readOldMonthSheet_(sh) {
  if (sh.getLastRow() < 2) return [];
  const map = { 'Absent': 'LEAVE', 'Full Day Leave': 'LEAVE', 'Half Day Leave': 'LEAVE', 'On Duty': 'OD' };
  return sh.getRange(2, 1, sh.getLastRow() - 1, 10).getDisplayValues()
    .map(r => ({ code: r[2], name: r[3], date: toDate_(r[0]), inTime: toTime_(r[5]), mark: map[r[8]] || '', note: r[9] }))
    .filter(r => r.date && (r.inTime || r.mark));
}

/**
 * Writes records into one month sheet. HR's LEAVE / OD (and SUN / HOL) are never overwritten.
 * Returns {filled, unmatched: [names], rows: Set of sheet rows that got data}.
 */
function applyRecords_(sh, key, records, firstRow = ATT_FIRST_ROW, n = sh.getLastRow() - ATT_FIRST_ROW + 1) {
  const days = daysInMonth_(key);
  const index = monthRowIndex_(sh, firstRow, n);
  const result = { filled: 0, unmatched: [], rows: new Set() };
  if (n < 1) return result;
  const grid = sh.getRange(firstRow, ATT_FIRST_DAY_COL, n, days);
  const values = grid.getDisplayValues();
  const notes = grid.getNotes();
  const names = Object.keys(index).filter(k => k[0] !== '#');

  records.forEach(r => {
    const row = r.code && index['#' + r.code] ? index['#' + r.code] : index[resolveName_(r.name, names)];
    if (!row) { result.unmatched.push(r.name || r.code); return; }
    const i = row - firstRow, j = r.date.getDate() - 1;
    result.rows.add(row);
    // A punch in the file replaces LEAVE (e.g. "no punch" LEAVE from an earlier upload); OD / SUN / HOL stay.
    const keep = FIXED_CODES.indexOf(values[i][j]) >= 0 && !(values[i][j] === 'LEAVE' && r.inTime && !r.mark);
    if (keep) return;
    const v = r.mark || r.inTime;
    if (!v) return;
    values[i][j] = v;
    if (r.note && !notes[i][j]) notes[i][j] = r.note;
    result.filled++;
  });
  grid.setValues(values);
  grid.setNotes(notes);
  return result;
}

/**
 * Reads the "Raw Upload" sheet and fills the month sheet(s).
 */
function processUpload() {
  const raw = SpreadsheetApp.getActive().getSheetByName(SHEETS.RAW);
  SpreadsheetApp.getUi().alert(fillAttendance_(raw.getDataRange().getDisplayValues()));
}

/**
 * Fills the month sheet(s) from a table of values. Days up to the last date in the file with
 * no punch become LEAVE (only for employees found in the file). Returns a message for HR.
 */
function fillAttendance_(values) {
  const records = parseRawAttendance_(values);
  if (!records.length) {
    return 'No attendance rows could be read from this file. Check the "' + SHEETS.RAW + '" sheet to see what was read.';
  }

  const byMonth = {};
  records.forEach(r => (byMonth[fmt_(r.date, 'yyyy-MM')] = byMonth[fmt_(r.date, 'yyyy-MM')] || []).push(r));
  const lastDate = records.reduce((m, r) => (r.date > m ? r.date : m), records[0].date);

  const unmatched = new Set();
  let filled = 0;
  Object.keys(byMonth).forEach(key => {
    // Finished month already in Attendance History: fill it there. Otherwise use the month sheet.
    let block = !SpreadsheetApp.getActive().getSheetByName(monthSheetName_(key)) && historyBlock_(key);
    if (block) block = addHistoryRows_(block, key, byMonth[key]);
    const sh = block ? block.sheet : ensureMonthSheet_(monthKeyToDate_(key));
    const res = block ? applyRecords_(sh, key, byMonth[key], block.firstRow, block.n) : applyRecords_(sh, key, byMonth[key]);
    filled += res.filled;
    res.unmatched.forEach(u => unmatched.add(u));

    const lastDay = fmt_(lastDate, 'yyyy-MM') === key ? lastDate.getDate() : daysInMonth_(key);
    res.rows.forEach(row => {
      const cells = sh.getRange(row, ATT_FIRST_DAY_COL, 1, lastDay);
      const v = cells.getDisplayValues();
      if (v[0].some(c => !c)) cells.setValues([v[0].map(c => c || 'LEAVE')]);
    });
  });

  archiveOldMonths_();
  orderTabs_();

  let msg = 'Done. ' + filled + ' attendance entries filled (' + Object.keys(byMonth).map(monthLabel_).join(', ') + ').';
  if (unmatched.size) {
    msg += '\n\nThese names from the file are not in the Employees sheet (add them, then upload again):\n' +
      Array.from(unmatched).join('\n');
  }
  return msg;
}

// ---------- Attendance History: finished months, stacked one below the other ----------

const HISTORY_SHEET = 'Attendance History';

/** Moves a finished month sheet to the bottom of Attendance History and deletes the month sheet. */
function archiveMonth_(key) {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(monthSheetName_(key)) || findHistoryBlock_(key)) return;
  const sh = ensureMonthSheet_(monthKeyToDate_(key)); // converts an old-layout sheet first
  let hist = ss.getSheetByName(HISTORY_SHEET);
  if (!hist) {
    hist = ss.insertSheet(HISTORY_SHEET);
    hist.setTabColor('#1f3864').setHiddenGridlines(true);
    hist.setColumnWidth(1, 80).setColumnWidth(2, 180);
  }
  const width = sh.getLastColumn(), height = sh.getLastRow();
  const top = hist.getLastRow() ? hist.getLastRow() + 2 : 1;
  if (hist.getMaxColumns() < width) hist.insertColumnsAfter(hist.getMaxColumns(), width - hist.getMaxColumns());
  if (hist.getMaxRows() < top + height) hist.insertRowsAfter(hist.getMaxRows(), top + height - hist.getMaxRows());
  for (let c = 3; c <= width; c++) hist.setColumnWidth(c, 48);

  hist.getRange(top, 1, 1, width).merge().setValue(monthLabel_(key)).setBackground('#cc0000').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('left');
  const src = sh.getRange(1, 1, height, width);
  const dest = hist.getRange(top + 1, 1, height, width);
  src.copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  dest.setValues(src.getDisplayValues());
  if (height >= ATT_FIRST_ROW) writeTotals_(hist, top + ATT_FIRST_ROW, height - ATT_FIRST_ROW + 1, daysInMonth_(key));
  ss.deleteSheet(sh);
}

/** Row of the month title in Attendance History, or 0. */
function findHistoryBlock_(key) {
  const hist = SpreadsheetApp.getActive().getSheetByName(HISTORY_SHEET);
  if (!hist || !hist.getLastRow()) return 0;
  const label = monthLabel_(key);
  const i = hist.getRange(1, 1, hist.getLastRow(), 1).getDisplayValues().findIndex(r => r[0] === label);
  return i < 0 ? 0 : i + 1;
}

/** Every month sheet before the current month is moved to Attendance History (oldest first). */
function archiveOldMonths_() {
  const current = fmt_(new Date(), 'yyyy-MM');
  SpreadsheetApp.getActive().getSheets().map(s => s.getName()).filter(n => n.indexOf('Att ') === 0)
    .map(n => normalizeMonthKey_(n.slice(4)))
    .filter(k => k && k < current)
    .sort()
    .forEach(archiveMonth_);
}

/** Adds rows to a history month for employees who are in the file and the Employees sheet but not in that month yet. */
function addHistoryRows_(block, key, records) {
  const emps = getEmployees_();
  const empNames = emps.map(e => normName_(e.name));
  const index = monthRowIndex_(block.sheet, block.firstRow, block.n);
  const blockNames = Object.keys(index).filter(k => k[0] !== '#');
  const wanted = new Set();
  records.forEach(r => {
    if (index[resolveName_(r.name, blockNames)]) return;
    const n = resolveName_(r.name, empNames);
    if (empNames.indexOf(n) >= 0 && !index[n]) wanted.add(n);
  });
  const missing = emps.filter(e => wanted.has(normName_(e.name)));
  if (!missing.length) return block;

  const sh = block.sheet, days = daysInMonth_(key);
  const at = block.firstRow + block.n;
  sh.insertRowsAfter(at - 1, missing.length);
  sh.getRange(at, 1, missing.length, 2).setValues(missing.map(e => [e.code, e.name]));
  fillFixedCodes_(sh.getRange(at, ATT_FIRST_DAY_COL, missing.length, days), key);
  block.n += missing.length;
  writeTotals_(sh, block.firstRow, block.n, days);
  return block;
}

/** Employee rows of a month in Attendance History: {sheet, firstRow, n} or null. */
function historyBlock_(key) {
  const top = findHistoryBlock_(key);
  if (!top) return null;
  const sheet = SpreadsheetApp.getActive().getSheetByName(HISTORY_SHEET);
  const firstRow = top + ATT_FIRST_ROW;
  let n = 0;
  if (firstRow <= sheet.getLastRow()) {
    const names = sheet.getRange(firstRow, 2, sheet.getLastRow() - firstRow + 1, 1).getDisplayValues();
    while (n < names.length && names[n][0]) n++;
  }
  return { sheet: sheet, firstRow: firstRow, n: n };
}

/**
 * Day grid of a month from its sheet or from Attendance History.
 * Returns [{name, days: ['10:05', 'LEAVE', 'SUN', ...]}] or null.
 */
function getMonthGrid_(key) {
  const ss = SpreadsheetApp.getActive();
  const days = daysInMonth_(key);
  const sh = ss.getSheetByName(monthSheetName_(key));
  let rows;
  if (sh) {
    if (sh.getLastRow() < ATT_FIRST_ROW) return [];
    rows = sh.getRange(ATT_FIRST_ROW, 1, sh.getLastRow() - ATT_FIRST_ROW + 1, 2 + days).getDisplayValues();
  } else {
    const block = historyBlock_(key);
    if (!block) return null;
    rows = block.n ? block.sheet.getRange(block.firstRow, 1, block.n, 2 + days).getDisplayValues() : [];
  }
  return rows.filter(r => r[1]).map(r => ({ name: r[1], days: r.slice(2) }));
}

/**
 * Converts the raw file into [{code, name, date, inTime, mark, note}].
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
      const rec = { code: '', name: name, date: date, inTime: '', mark: '', note: '' };
      if (/^LEAVE$|^L$|^HALF|^HD$/.test(v)) rec.mark = 'LEAVE';
      else if (/^OD$/.test(v)) rec.mark = 'OD';
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
  const cIn = col(/^in|in.?time|first.?in|check.?in/);

  const out = [];
  values.slice(headerIdx + 1).forEach(r => {
    const date = toDate_(r[cDate]);
    if (!date) return;
    out.push({
      code: cCode >= 0 ? r[cCode] : '',
      name: cName >= 0 ? r[cName] : '',
      date: date,
      inTime: toTime_(r[cIn]),
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
  const alias = machineAliases_()[n];
  if (alias && sheetNames.indexOf(alias) >= 0) return alias;
  const first = n.split(' ')[0];
  const hits = sheetNames.filter(s => s.split(' ')[0] === first);
  return hits.length === 1 ? hits[0] : n;
}

/** {normalised machine name: normalised employee name} from the Employees sheet "Machine Name" column. */
let machineAliasCache_ = null;
function machineAliases_() {
  if (!machineAliasCache_) {
    machineAliasCache_ = {};
    getEmployees_().forEach(e => { if (e.machineName) machineAliasCache_[normName_(e.machineName)] = normName_(e.name); });
  }
  return machineAliasCache_;
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
