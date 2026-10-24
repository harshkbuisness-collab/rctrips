/**
 * Month summary: late count, leaves, absents and leave balance per employee.
 *
 * Monthly Summary columns:
 * A Month | B Emp Code | C Name | D Email | E Late Count | F Over Late Limit | G Leaves Taken |
 * H Absent Days | I Leave Balance | J Salary Deduction (HR fills) | K Email Sent
 */

function calculateMonthSummaryPrompt() {
  const key = askMonth_('Calculate Month Summary');
  if (!key) return;
  calculateMonthSummary_(key);
  SpreadsheetApp.getActive().setActiveSheet(SpreadsheetApp.getActive().getSheetByName(SHEETS.SUMMARY));
  SpreadsheetApp.getUi().alert('Summary for ' + monthLabel_(key) + ' is ready.\n\n' +
    'Now fill "Salary Deduction" for employees marked "Yes" in "Over Late Limit", then send emails.');
}

function calculateMonthSummary_(key) {
  const ss = SpreadsheetApp.getActive();
  const settings = getSettings_();
  const grid = getMonthGrid_(key);
  if (!grid || !grid.length) throw new Error('Attendance for ' + monthLabel_(key) + ' not found.');
  const cutoff = ss.getRangeByName('OfficeStart').getDisplayValue().slice(0, 5);

  // Count per employee from the month grid (times are 'HH:mm').
  const counts = {};
  grid.forEach(r => {
    const c = counts[normName_(r.name)] = { late: 0, leaves: 0, absent: 0 };
    r.days.forEach(v => {
      if (/^\d{2}:\d{2}/.test(v) && v.slice(0, 5) > cutoff) c.late++;
      else if (v === 'LEAVE') c.leaves++;
    });
  });

  // Rebuild this month's summary rows, keeping what HR already typed (deduction, email sent).
  const summary = ss.getSheetByName(SHEETS.SUMMARY);
  const all = summary.getLastRow() > 1 ? summary.getRange(2, 1, summary.getLastRow() - 1, 11).getValues() : [];
  const kept = {};
  all.filter(r => normalizeMonthKey_(r[0]) === key).forEach(r => { kept[normName_(r[2])] = r; });
  const others = all.filter(r => normalizeMonthKey_(r[0]) !== key);

  const employees = getEmployees_();
  const monthRows = employees.map(e => {
    const c = counts[normName_(e.name)] || { late: 0, leaves: 0, absent: 0 };
    const old = kept[normName_(e.name)] || [];
    return [key, e.code, e.name, e.email, c.late, c.late > settings.lateLimit ? 'Yes' : 'No',
      c.leaves, c.absent, '', old[9] || '', old[10] || ''];
  });

  const rows = others.concat(monthRows).sort((a, b) =>
    String(a[0]).localeCompare(String(b[0])) || String(a[2]).localeCompare(String(b[2])));

  // Leave balance through this month.
  const balances = updateLeaveBalance_(key, rows, employees, settings);
  rows.forEach(r => {
    if (normalizeMonthKey_(r[0]) === key) r[8] = balances[normName_(r[2])];
  });

  if (all.length) summary.getRange(2, 1, all.length, 11).clearContent();
  summary.getRange(2, 1, rows.length, 11).setValues(rows);
  summary.getRange(2, 1, rows.length, 1).setNumberFormat('@');
}

/**
 * Balance = Opening (HR, till the month before tracking starts)
 *         + leaves per month x months from start till `key`
 *         - leaves used (and absents, if setting is Yes) from start till `key`.
 * Returns {normName: balance} and updates the Leave Balance sheet.
 */
function updateLeaveBalance_(key, summaryRows, employees, settings) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.BALANCE);
  const existing = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues() : [];
  const byName = {};
  existing.forEach(r => { byName[normName_(r[1])] = r; });
  employees.forEach(e => {
    if (!byName[normName_(e.name)]) {
      const row = [e.code, e.name, 0, 0, 0, 0, ''];
      existing.push(row);
      byName[normName_(e.name)] = row;
    }
  });

  const start = settings.startMonth || key;
  const months = key < start ? 0 : monthDiff_(start, key) + 1;
  const accrued = months * settings.leavesPerMonth;

  const used = {};
  summaryRows.forEach(r => {
    const m = normalizeMonthKey_(r[0]);
    if (m < start || m > key) return;
    const n = normName_(r[2]);
    used[n] = (used[n] || 0) + Number(r[6] || 0) + (settings.absentAsLeave ? Number(r[7] || 0) : 0);
  });

  const result = {};
  existing.forEach(r => {
    const n = normName_(r[1]);
    const u = used[n] || 0;
    const bal = Number(r[2] || 0) + accrued - u;
    r[3] = accrued;
    r[4] = u;
    r[5] = bal;
    r[6] = key;
    result[n] = bal;
  });
  if (existing.length) {
    sh.getRange(2, 1, existing.length, 7).setValues(existing);
    sh.getRange(2, 7, existing.length, 1).setNumberFormat('@');
  }
  return result;
}

function monthDiff_(fromKey, toKey) {
  const [y1, m1] = fromKey.split('-').map(Number);
  const [y2, m2] = toKey.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}
