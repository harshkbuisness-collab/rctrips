/**
 * Monthly attendance emails to employees (sent from hr@rctrips.com).
 */

/** Sends the first employee's email for the chosen month to the "Test Email" from Settings. */
function sendTestEmail() {
  const ui = SpreadsheetApp.getUi();
  const settings = getSettings_();
  if (!settings.testEmail) { ui.alert('Fill "Test Email" in the Settings sheet first.'); return; }
  const key = askMonth_('Send Test Email');
  if (!key) return;
  const rows = getSummaryRows_(key);
  if (!rows.length) { ui.alert('No summary for ' + key + '. Run "Calculate Month Summary" first.'); return; }
  const mail = buildEmail_(rows[0].values, key, settings);
  sendOutlookMail_(settings.testEmail, '[TEST] ' + mail.subject, mail.html);
  ui.alert('Test email sent to ' + settings.testEmail + ' (sample: ' + rows[0].values[2] + ').');
}

/** Sends emails to all employees of a month whose "Email Sent" is still empty. */
function sendMonthlyEmails() {
  const ui = SpreadsheetApp.getUi();
  const settings = getSettings_();
  const key = askMonth_('Send Monthly Emails');
  if (!key) return;
  const rows = getSummaryRows_(key).filter(r => !r.values[10] && r.values[3]);
  if (!rows.length) { ui.alert('Nothing to send for ' + key + ' (already sent, or no summary).'); return; }

  const missingDeduction = rows.filter(r => r.values[5] === 'Yes' && !r.values[9]).map(r => r.values[2]);
  let question = 'Send ' + rows.length + ' emails for ' + monthLabel_(key) + ' from ' + SENDER_EMAIL + '?';
  if (missingDeduction.length) {
    question += '\n\nWarning: salary deduction is empty for:\n' + missingDeduction.join('\n');
  }
  if (ui.alert(question, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.SUMMARY);
  const failed = [];
  rows.forEach(r => {
    try {
      const mail = buildEmail_(r.values, key, settings);
      sendOutlookMail_(r.values[3], mail.subject, mail.html);
      sheet.getRange(r.row, 11).setValue(fmt_(new Date(), 'dd-MMM-yyyy HH:mm'));
    } catch (e) {
      failed.push(r.values[2] + ': ' + e.message);
    }
  });
  ui.alert('Sent: ' + (rows.length - failed.length) + (failed.length ? '\nFailed:\n' + failed.join('\n') : ''));
}

function getSummaryRows_(key) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.SUMMARY);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues()
    .map((values, i) => ({ row: i + 2, values: values }))
    .filter(r => normalizeMonthKey_(r.values[0]) === key);
}

/** Builds subject + HTML body from one Monthly Summary row. */
function buildEmail_(v, key, settings) {
  const name = esc_(v[2]);
  const late = Number(v[4] || 0);
  const leaves = Number(v[6] || 0);
  const absent = Number(v[7] || 0);
  const balance = Number(v[8] || 0);
  const deduction = String(v[9] || '').trim();
  const month = monthLabel_(key);
  const parts = [];

  if (late === 0) {
    parts.push('<p style="color:#38761d"><b>Congratulations!</b> You were on time every day in ' + month +
      '. Thank you for your punctuality - keep it up!</p>');
  } else if (late <= settings.lateLimit) {
    parts.push('<p>You were late <b>' + late + '</b> time(s) in ' + month + '. Please note that more than ' +
      settings.lateLimit + ' late arrivals in a month lead to a salary deduction.</p>');
  } else {
    parts.push('<p style="color:#cc0000">You were late <b>' + late + '</b> times in ' + month +
      ', which is above the allowed limit of ' + settings.lateLimit + '.</p>');
  }
  if (deduction) {
    parts.push('<p style="color:#cc0000">Salary deduction for this month: <b>' + esc_(formatAmount_(deduction)) + '</b></p>');
  }

  parts.push('<table cellpadding="6" style="border-collapse:collapse;border:1px solid #ccc">' +
    row_('Late arrivals', late) +
    row_('Leaves taken', leaves) +
    (absent ? row_('Absent days', absent) : '') +
    row_('Paid leave balance', balance) +
    '</table>');

  if (balance <= 0) {
    parts.push('<p style="color:#cc0000">Your paid leaves are exhausted. Any further leave will be unpaid.</p>');
  } else {
    parts.push('<p>You have <b>' + balance + '</b> paid leave(s) remaining.</p>');
  }

  const html = '<div style="font-family:Arial,sans-serif;font-size:14px">' +
    '<p>Dear ' + name + ',</p>' +
    '<p>Here is your attendance summary for <b>' + month + '</b>.</p>' +
    parts.join('') +
    '<p>If anything looks incorrect, please contact HR.</p>' +
    '<p>Regards,<br>HR Team<br>RC Trips</p></div>';

  return { subject: 'Attendance Summary - ' + month, html: html };
}

function row_(label, value) {
  return '<tr><td style="border:1px solid #ccc">' + label + '</td><td style="border:1px solid #ccc"><b>' + value + '</b></td></tr>';
}

function formatAmount_(v) {
  return /^\d+(\.\d+)?$/.test(v) ? 'Rs. ' + v : v;
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
