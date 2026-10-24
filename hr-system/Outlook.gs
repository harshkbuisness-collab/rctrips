/**
 * Sends mail from hr@rctrips.com (Outlook / Microsoft 365) using Microsoft Graph.
 *
 * Needs Script Properties (Project Settings > Script Properties):
 *   CLIENT_ID, TENANT_ID, CLIENT_SECRET
 * Needs library OAuth2 (ID 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsBxEc).
 */

const SENDER_EMAIL = 'hr@rctrips.com';

function getOutlookService_() {
  const p = PropertiesService.getScriptProperties();
  const tenant = p.getProperty('TENANT_ID');
  if (!tenant || !p.getProperty('CLIENT_ID') || !p.getProperty('CLIENT_SECRET')) {
    throw new Error('Add CLIENT_ID, TENANT_ID and CLIENT_SECRET in Project Settings > Script Properties.');
  }
  return OAuth2.createService('outlook')
    .setAuthorizationBaseUrl('https://login.microsoftonline.com/' + tenant + '/oauth2/v2.0/authorize')
    .setTokenUrl('https://login.microsoftonline.com/' + tenant + '/oauth2/v2.0/token')
    .setClientId(p.getProperty('CLIENT_ID'))
    .setClientSecret(p.getProperty('CLIENT_SECRET'))
    .setCallbackFunction('outlookAuthCallback')
    .setPropertyStore(p) // shared token, so it also works from triggers
    .setScope('https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access')
    .setParam('prompt', 'select_account');
}

/** Menu: shows the Microsoft sign-in link (open it where hr@rctrips.com is logged in). */
function connectOutlook() {
  const service = getOutlookService_();
  const ui = SpreadsheetApp.getUi();
  if (service.hasAccess()) {
    const me = graphGet_('/me');
    const res = ui.alert('Already connected as ' + (me.mail || me.userPrincipalName) + '.\n\nReconnect with another account?', ui.ButtonSet.YES_NO);
    if (res !== ui.Button.YES) return;
    service.reset();
  }
  const url = service.getAuthorizationUrl();
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:Arial">Open this link and sign in with <b>' + SENDER_EMAIL + '</b>:</p>' +
    '<p style="font-family:Arial"><a href="' + url + '" target="_blank">Connect Outlook</a></p>' +
    '<p style="font-family:Arial;color:#666">After you see "Connected", close this box.</p>')
    .setWidth(380).setHeight(160);
  ui.showModalDialog(html, 'Connect Outlook');
}

function outlookAuthCallback(request) {
  const service = getOutlookService_();
  if (!service.handleCallback(request)) {
    return HtmlService.createHtmlOutput('Access denied. Please try again.');
  }
  const me = graphGet_('/me');
  const email = String(me.mail || me.userPrincipalName || '').toLowerCase();
  if (email !== SENDER_EMAIL) {
    service.reset();
    return HtmlService.createHtmlOutput('You signed in as ' + email + '. Please connect with ' + SENDER_EMAIL + '.');
  }
  return HtmlService.createHtmlOutput('Connected as ' + email + '. You can close this tab.');
}

function graphGet_(path) {
  const res = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0' + path, {
    headers: { Authorization: 'Bearer ' + getOutlookService_().getAccessToken() },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error('Graph error: ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

/** Sends one HTML email from hr@rctrips.com. Throws on failure. */
function sendOutlookMail_(to, subject, html) {
  const service = getOutlookService_();
  if (!service.hasAccess()) throw new Error('Outlook not connected. Run HR System > Connect Outlook.');
  const res = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + service.getAccessToken() },
    payload: JSON.stringify({
      message: {
        subject: subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 202) throw new Error('Send failed (' + res.getResponseCode() + '): ' + res.getContentText());
}
