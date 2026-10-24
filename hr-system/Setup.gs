/**
 * RC Trips HR System - setup, menu, settings and shared helpers.
 */

const SHEETS = {
  SETTINGS: 'Settings',
  EMPLOYEES: 'Employees',
  HOLIDAYS: 'Holidays',
  RAW: 'Raw Upload',
  BALANCE: 'Leave Balance',
  SUMMARY: 'Monthly Summary',
};

// Employees sheet columns (matches the HR list: Name, City, Designation, Emp Code, Phone, Email).
// "Machine Name" = how the name is written in the attendance machine file, if different.
const EMP_COLS = ['Name', 'City', 'Designation', 'Emp Code', 'Phone', 'Email', 'Active (Yes/No)', 'Machine Name'];
const EMP_ACTIVE = 6;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HR System')
    .addItem('1. First-time Setup', 'setupSystem')
    .addItem('2. Connect Outlook (hr@rctrips.com)', 'connectOutlook')
    .addItem('Load / Update Employees', 'loadEmployees')
    .addSeparator()
    .addItem('Open Today Sheet', 'openToday')
    .addItem('Create / Refresh This Month Sheet', 'refreshCurrentMonth')
    .addItem('Upload Attendance File (PDF / Excel)', 'showUploadDialog')
    .addSeparator()
    .addItem('Calculate Month Summary', 'calculateMonthSummaryPrompt')
    .addItem('Send Test Email', 'sendTestEmail')
    .addItem('Send Monthly Emails', 'sendMonthlyEmails')
    .addToUi();
}

function setupSystem() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('Asia/Kolkata');

  const settings = getOrCreateSheet_(SHEETS.SETTINGS, ['Setting', 'Value', 'Note'], [220, 140, 520], '#666666');
  if (settings.getLastRow() < 2) {
    settings.getRange('B5').setNumberFormat('@');
    settings.getRange(2, 1, 6, 3).setValues([
      ['Late After (time)', '10:10', 'Office starts 10:00. In time after this = Late'],
      ['Late Limit Per Month', 5, 'More lates than this = salary deduction'],
      ['Paid Leaves Per Month', 1.5, '18 per year'],
      ['Leave Tracking Starts', '2026-11', 'YYYY-MM. Opening balance in Leave Balance sheet is till the month before this'],
      ['Test Email', '', 'Your email, for "Send Test Email"'],
      ['Count Absent As Leave', 'Yes', 'No punch days are marked LEAVE and reduce leave balance'],
    ]);
    settings.getRange('B2').setNumberFormat('HH:mm');
    ss.setNamedRange('OfficeStart', settings.getRange('B2'));
    settings.getRange('A2:A7').setFontWeight('bold');
    settings.getRange('B2:B7').setBackground('#fff2cc').setHorizontalAlignment('center');
  }

  const emp = getOrCreateSheet_(SHEETS.EMPLOYEES, EMP_COLS, [200, 110, 280, 90, 110, 240, 110, 150], '#38761d');
  emp.getRange('D:E').setNumberFormat('@');
  emp.getRange('G2:G').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).build());
  getOrCreateSheet_(SHEETS.HOLIDAYS, ['Date', 'Holiday Name'], [140, 260], '#b45f06').getRange('A:A').setNumberFormat('dd-MMM-yyyy');
  getOrCreateSheet_(SHEETS.RAW, ['This sheet shows what was read from the last uploaded attendance file (for checking only)'], [900], '#999999');
  const balance = getOrCreateSheet_(SHEETS.BALANCE, ['Emp Code', 'Name', 'Opening Balance (HR fills)', 'Accrued', 'Used', 'Current Balance', 'Updated Till'],
    [90, 200, 170, 100, 100, 140, 120], '#674ea7');
  balance.getRange('C2:C').setBackground('#fff2cc');
  balance.getRange('C:G').setHorizontalAlignment('center');
  const summary = getOrCreateSheet_(SHEETS.SUMMARY, ['Month', 'Emp Code', 'Name', 'Email', 'Late Count', 'Over Late Limit',
    'Leaves Taken', 'Absent Days', 'Leave Balance', 'Salary Deduction (HR fills)', 'Email Sent'],
    [90, 90, 200, 240, 100, 120, 110, 110, 120, 190, 150], '#cc0000');
  summary.getRange('A:A').setNumberFormat('@');
  summary.getRange('E:K').setHorizontalAlignment('center');
  summary.getRange('J2:J').setBackground('#fff2cc');
  summary.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Yes').setBackground('#f4cccc').setFontColor('#990000').setBold(true)
    .setRanges([summary.getRange('F2:F')]).build()]);

  const added = addEmployees_().added;
  ensureMonthSheet_(new Date());
  refreshToday_();
  archiveOldMonths_();
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  orderTabs_();

  // Daily trigger (1am): creates the new month sheet on day 1 and moves the Today sheet to the new date.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyJob')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(1).create();

  SpreadsheetApp.getUi().alert('Setup done. ' + added + ' employees added.\n\nNext:\n1. Fill "Opening Balance" in the Leave Balance sheet.\n' +
    '2. Add holidays in the Holidays sheet.\n3. Run HR System > Connect Outlook.');
}

/** Menu: adds new employees from Employees.gs and updates details of existing ones. */
function loadEmployees() {
  const res = addEmployees_();
  ensureMonthSheet_(new Date());
  refreshToday_();
  let msg = res.added + ' new employee(s) added, ' + res.updated + ' updated.';
  if (res.notInList.length) {
    msg += '\n\nThese are in the Employees sheet but not in the Employees file. If they have left, set "Active" to No:\n' +
      res.notInList.join('\n');
  }
  SpreadsheetApp.getUi().alert(msg);
}

/**
 * Syncs EMPLOYEE_DATA (from Employees.gs, kept out of GitHub) into the Employees sheet:
 * adds missing people, updates city / designation / code / phone / email of existing ones
 * (Active is left as HR set it), and adds new names to Leave Balance.
 * Returns {added, updated, notInList}.
 */
function addEmployees_() {
  if (typeof EMPLOYEE_DATA === 'undefined') {
    throw new Error('Employees file not found. In Apps Script add a file named "Employees" with the EMPLOYEE_DATA list.');
  }
  const ss = SpreadsheetApp.getActive();
  const emp = ensureEmpColumns_(ss.getSheetByName(SHEETS.EMPLOYEES));
  const width = EMP_COLS.length;
  const data = EMPLOYEE_DATA.filter(r => String(r[0]).trim())
    .map(r => r.map(c => String(c == null ? '' : c).trim()).concat(Array(width).fill('')).slice(0, width));
  const byName = {};
  data.forEach(r => { byName[normName_(r[0])] = r; });

  const rows = emp.getLastRow() > 1 ? emp.getRange(2, 1, emp.getLastRow() - 1, width).getValues() : [];
  const have = new Set();
  const notInList = [];
  let updated = 0;
  rows.forEach(r => {
    const n = normName_(r[0]);
    if (!n) return;
    have.add(n);
    const src = byName[n];
    if (!src) { notInList.push(r[0]); return; }
    let changed = false;
    for (let c = 1; c < width; c++) {
      if (c !== EMP_ACTIVE && String(r[c]).trim() !== src[c]) { r[c] = src[c]; changed = true; }
    }
    if (changed) updated++;
  });
  if (rows.length) emp.getRange(2, 1, rows.length, width).setValues(rows);

  const newRows = data.filter(r => !have.has(normName_(r[0]))).map(r => { r[EMP_ACTIVE] = r[EMP_ACTIVE] || 'Yes'; return r; });
  if (newRows.length) emp.getRange(emp.getLastRow() + 1, 1, newRows.length, width).setValues(newRows);

  const bal = ss.getSheetByName(SHEETS.BALANCE);
  const inBal = new Set(bal.getLastRow() > 1 ? bal.getRange(2, 2, bal.getLastRow() - 1, 1).getValues().map(r => normName_(r[0])) : []);
  const balRows = getEmployees_().filter(e => !inBal.has(normName_(e.name))).map(e => [e.code, e.name, '']);
  if (balRows.length) bal.getRange(bal.getLastRow() + 1, 1, balRows.length, 3).setValues(balRows);
  return { added: newRows.length, updated: updated, notInList: notInList };
}

/** Adds header cells for columns added later (e.g. Machine Name) to an existing Employees sheet. */
function ensureEmpColumns_(sh) {
  if (sh.getMaxColumns() < EMP_COLS.length) sh.insertColumnsAfter(sh.getMaxColumns(), EMP_COLS.length - sh.getMaxColumns());
  const header = sh.getRange(1, 1, 1, EMP_COLS.length);
  if (header.getValues()[0].join('|') !== EMP_COLS.join('|')) {
    header.setValues([EMP_COLS]).setBackground(THEME.header).setFontColor(THEME.headerText).setFontWeight('bold')
      .setHorizontalAlignment('center').setWrap(true);
    sh.setColumnWidth(EMP_COLS.length, 150);
  }
  return sh;
}

function getEmployeesAll_(sh) {
  return sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => r[0]).filter(String);
}

function dailyJob() {
  ensureMonthSheet_(new Date());
  refreshToday_();
  archiveOldMonths_();
  orderTabs_();
}

function refreshCurrentMonth() {
  const sh = ensureMonthSheet_(new Date());
  archiveOldMonths_();
  orderTabs_();
  SpreadsheetApp.getActive().setActiveSheet(sh);
}

// ---------- helpers ----------

function getOrCreateSheet_(name, headers, widths, tabColor) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleSheet_(sh, headers.length, widths, tabColor);
  }
  return sh;
}

const THEME = { header: '#1f3864', headerText: '#ffffff', font: 'Roboto' };

/** Dark header, banded rows, clean font, no gridlines, extra columns removed. */
function styleSheet_(sh, ncols, widths, tabColor) {
  sh.getRange(1, 1, sh.getMaxRows(), ncols).setFontFamily(THEME.font).setFontSize(10).setVerticalAlignment('middle');
  sh.getRange(1, 1, 1, ncols).setBackground(THEME.header).setFontColor(THEME.headerText).setFontWeight('bold')
    .setHorizontalAlignment('center').setWrap(true);
  sh.setRowHeight(1, 36);
  sh.setFrozenRows(1);
  sh.setHiddenGridlines(true);
  if (sh.getMaxColumns() > ncols) sh.deleteColumns(ncols + 1, sh.getMaxColumns() - ncols);
  (widths || []).forEach((w, i) => sh.setColumnWidth(i + 1, w));
  if (tabColor) sh.setTabColor(tabColor);
  applyBanding_(sh, ncols);
}

function applyBanding_(sh, ncols) {
  sh.getBandings().forEach(b => b.remove());
  sh.getRange(1, 1, sh.getMaxRows(), ncols)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(THEME.header)
    .setFirstRowColor('#ffffff')
    .setSecondRowColor('#f3f6fb');
}

/** Tab order: Today, Monthly Summary, current month, Leave Balance, older months (newest first), then the rest. */
function orderTabs_() {
  const ss = SpreadsheetApp.getActive();
  const current = monthSheetName_(fmt_(new Date(), 'yyyy-MM'));
  const months = ss.getSheets().map(s => s.getName()).filter(n => n.indexOf('Att ') === 0 && n !== current)
    .sort((a, b) => new Date('1 ' + b.slice(4).replace('-', ' ')) - new Date('1 ' + a.slice(4).replace('-', ' ')));
  const order = [TODAY_SHEET, SHEETS.SUMMARY, current, SHEETS.BALANCE].concat(months,
    [HISTORY_SHEET, SHEETS.EMPLOYEES, SHEETS.HOLIDAYS, SHEETS.RAW, SHEETS.SETTINGS]);
  let pos = 1;
  order.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(pos++); }
  });
  const today = ss.getSheetByName(TODAY_SHEET);
  if (today) ss.setActiveSheet(today);
}

function getSettings_() {
  const rows = SpreadsheetApp.getActive().getSheetByName(SHEETS.SETTINGS).getDataRange().getValues();
  const map = {};
  rows.slice(1).forEach(r => { map[r[0]] = r[1]; });
  return {
    lateLimit: Number(map['Late Limit Per Month']) || 5,
    leavesPerMonth: Number(map['Paid Leaves Per Month']) || 1.5,
    startMonth: normalizeMonthKey_(map['Leave Tracking Starts']),
    testEmail: String(map['Test Email'] || '').trim(),
    absentAsLeave: String(map['Count Absent As Leave']).toLowerCase() !== 'no',
  };
}

/** Active employees: [{name, city, designation, code, email, machineName}] */
function getEmployees_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.EMPLOYEES);
  if (!sh || sh.getLastRow() < 2) return [];
  const width = Math.min(EMP_COLS.length, sh.getMaxColumns());
  return sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues()
    .filter(r => String(r[0]).trim() && String(r[EMP_ACTIVE]).trim().toLowerCase() !== 'no')
    .map(r => ({
      name: String(r[0]).trim(),
      city: String(r[1]).trim(),
      designation: String(r[2]).trim(),
      code: String(r[3]).trim(),
      email: String(r[5]).trim(),
      machineName: String(r[7] || '').trim(),
    }));
}

function normName_(s) {
  return String(s || '').toLowerCase().replace(/[.\s]+/g, ' ').trim();
}

function tz_() {
  return SpreadsheetApp.getActive().getSpreadsheetTimeZone();
}

function fmt_(d, pattern) {
  return Utilities.formatDate(d, tz_(), pattern);
}

/** Accepts '2026-11', a Date, or 'Nov-2026'; returns 'yyyy-MM'. */
function normalizeMonthKey_(v) {
  if (v instanceof Date) return fmt_(v, 'yyyy-MM');
  const s = String(v || '').trim();
  if (/^\d{4}-\d{1,2}$/.test(s)) {
    const [y, m] = s.split('-');
    return y + '-' + ('0' + m).slice(-2);
  }
  const d = new Date('1 ' + s.replace('-', ' '));
  return isNaN(d) ? '' : fmt_(d, 'yyyy-MM');
}

function monthKeyToDate_(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

function monthLabel_(key) {
  return fmt_(monthKeyToDate_(key), 'MMMM yyyy');
}

function previousMonthKey_() {
  const d = new Date();
  return fmt_(new Date(d.getFullYear(), d.getMonth() - 1, 1), 'yyyy-MM');
}

/** Asks for a month; blank = last month. Returns 'yyyy-MM' or null. */
function askMonth_(title) {
  const ui = SpreadsheetApp.getUi();
  const def = previousMonthKey_();
  const res = ui.prompt(title, 'Enter month as YYYY-MM (leave blank for ' + def + ')', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return null;
  const key = res.getResponseText().trim() ? normalizeMonthKey_(res.getResponseText()) : def;
  if (!key) { ui.alert('Invalid month.'); return null; }
  return key;
}
