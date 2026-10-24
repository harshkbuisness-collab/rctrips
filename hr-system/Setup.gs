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

// Employees sheet columns (matches the HR list: Name, City, Designation, Emp Code, Phone, Email)
const EMP_COLS = ['Name', 'City', 'Designation', 'Emp Code', 'Phone', 'Email', 'Active (Yes/No)'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HR System')
    .addItem('1. First-time Setup', 'setupSystem')
    .addItem('2. Connect Outlook (hr@rctrips.com)', 'connectOutlook')
    .addSeparator()
    .addItem('Create / Refresh This Month Sheet', 'refreshCurrentMonth')
    .addItem('Process Attendance Upload', 'processUpload')
    .addSeparator()
    .addItem('Calculate Month Summary', 'calculateMonthSummaryPrompt')
    .addItem('Send Test Email', 'sendTestEmail')
    .addItem('Send Monthly Emails', 'sendMonthlyEmails')
    .addToUi();
}

function setupSystem() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('Asia/Kolkata');

  const settings = getOrCreateSheet_(SHEETS.SETTINGS, ['Setting', 'Value', 'Note']);
  if (settings.getLastRow() < 2) {
    settings.getRange('B5').setNumberFormat('@');
    settings.getRange(2, 1, 6, 3).setValues([
      ['Office Start Time', '10:00', 'In time after this = Late'],
      ['Late Limit Per Month', 5, 'More lates than this = salary deduction'],
      ['Paid Leaves Per Month', 1.5, '18 per year'],
      ['Leave Tracking Starts', '2026-11', 'YYYY-MM. Opening balance in Leave Balance sheet is till the month before this'],
      ['Test Email', '', 'Your email, for "Send Test Email"'],
      ['Count Absent As Leave', 'Yes', 'Yes/No - absent days (no punch, no leave marked) reduce leave balance'],
    ]);
    settings.getRange('B2').setNumberFormat('HH:mm');
    ss.setNamedRange('OfficeStart', settings.getRange('B2'));
    settings.autoResizeColumns(1, 3);
  }

  getOrCreateSheet_(SHEETS.EMPLOYEES, EMP_COLS);
  getOrCreateSheet_(SHEETS.HOLIDAYS, ['Date', 'Holiday Name']).getRange('A:A').setNumberFormat('dd-MMM-yyyy');
  getOrCreateSheet_(SHEETS.RAW, ['Import the attendance file here (File > Import > Replace current sheet), then run HR System > Process Attendance Upload']);
  getOrCreateSheet_(SHEETS.BALANCE, ['Emp Code', 'Name', 'Opening Balance (HR fills)', 'Accrued', 'Used', 'Current Balance', 'Updated Till']);
  const summary = getOrCreateSheet_(SHEETS.SUMMARY, ['Month', 'Emp Code', 'Name', 'Email', 'Late Count', 'Over Late Limit',
    'Leaves Taken', 'Absent Days', 'Leave Balance', 'Salary Deduction (HR fills)', 'Email Sent']);
  summary.getRange('A:A').setNumberFormat('@');

  // Daily trigger: makes sure the current month sheet exists from day 1.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyJob')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(1).create();

  SpreadsheetApp.getUi().alert('Setup done.\n\nNext:\n1. Paste the employee list in "Employees" sheet (from cell A2).\n' +
    '2. Add holidays in "Holidays" sheet.\n3. Run HR System > Create / Refresh This Month Sheet.\n4. Run HR System > Connect Outlook.');
}

function dailyJob() {
  ensureMonthSheet_(new Date());
}

function refreshCurrentMonth() {
  const sh = ensureMonthSheet_(new Date());
  SpreadsheetApp.getActive().setActiveSheet(sh);
}

// ---------- helpers ----------

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#d9e2f3');
    sh.setFrozenRows(1);
  }
  return sh;
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

/** Active employees: [{name, city, designation, code, email}] */
function getEmployees_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.EMPLOYEES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, EMP_COLS.length).getValues()
    .filter(r => String(r[0]).trim() && String(r[6]).trim().toLowerCase() !== 'no')
    .map(r => ({
      name: String(r[0]).trim(),
      city: String(r[1]).trim(),
      designation: String(r[2]).trim(),
      code: String(r[3]).trim(),
      email: String(r[5]).trim(),
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
