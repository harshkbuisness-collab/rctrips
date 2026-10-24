/**
 * Sends mail from hr@rctrips.com (Outlook / Microsoft 365) using Microsoft Graph.
 *
 * Needs Script Properties (Project Settings > Script Properties):
 *   CLIENT_ID, TENANT_ID, CLIENT_SECRET
 * Tokens are stored in Script Properties too, so triggers can send mail.
 */

const SENDER_EMAIL = 'hr@rctrips.com';
const GRAPH_SCOPE = 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access';

function msConfig_() {
  const p = PropertiesService.getScriptProperties();
  const cfg = { clientId: p.getProperty('CLIENT_ID'), tenant: p.getProperty('TENANT_ID'), secret: p.getProperty('CLIENT_SECRET') };
  if (!cfg.clientId || !cfg.tenant || !cfg.secret) {
    throw new Error('Add CLIENT_ID, TENANT_ID and CLIENT_SECRET in Project Settings > Script Properties.');
  }
  cfg.base = 'https://login.microsoftonline.com/' + cfg.tenant + '/oauth2/v2.0/';
  cfg.redirect = 'https://script.google.com/macros/d/' + ScriptApp.getScriptId() + '/usercallback';
  return cfg;
}

/** Menu: shows the Microsoft sign-in link (open it where hr@rctrips.com is logged in). */
function connectOutlook() {
  const ui = SpreadsheetApp.getUi();
  if (PropertiesService.getScriptProperties().getProperty('MS_REFRESH_TOKEN')) {
    const me = graphGet_('/me');
    const res = ui.alert('Already connected as ' + (me.mail || me.userPrincipalName) + '.\n\nReconnect with another account?', ui.ButtonSet.YES_NO);
    if (res !== ui.Button.YES) return;
  }
  const cfg = msConfig_();
  const state = ScriptApp.newStateToken().withMethod('outlookAuthCallback').withTimeout(3600).createToken();
  const url = cfg.base + 'authorize?' + toQuery_({
    client_id: cfg.clientId,
    response_type: 'code',
    redirect_uri: cfg.redirect,
    response_mode: 'query',
    scope: GRAPH_SCOPE,
    state: state,
    prompt: 'select_account',
  });
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:Arial">Open this link and sign in with <b>' + SENDER_EMAIL + '</b>:</p>' +
    '<p style="font-family:Arial"><a href="' + url + '" target="_blank">Connect Outlook</a></p>' +
    '<p style="font-family:Arial;color:#666">After you see "Connected", close this box.</p>')
    .setWidth(380).setHeight(160);
  ui.showModalDialog(html, 'Connect Outlook');
}

function outlookAuthCallback(request) {
  if (request.parameter.error) {
    return HtmlService.createHtmlOutput('Error: ' + request.parameter.error_description);
  }
  const cfg = msConfig_();
  saveTokens_(tokenRequest_({
    grant_type: 'authorization_code',
    code: request.parameter.code,
    redirect_uri: cfg.redirect,
  }));
  const me = graphGet_('/me');
  const email = String(me.mail || me.userPrincipalName || '').toLowerCase();
  if (email !== SENDER_EMAIL) {
    ['MS_ACCESS_TOKEN', 'MS_REFRESH_TOKEN', 'MS_EXPIRES_AT'].forEach(k => PropertiesService.getScriptProperties().deleteProperty(k));
    return HtmlService.createHtmlOutput('You signed in as ' + email + '. Please connect with ' + SENDER_EMAIL + '.');
  }
  return HtmlService.createHtmlOutput('Connected as ' + email + '. You can close this tab.');
}

function tokenRequest_(params) {
  const cfg = msConfig_();
  params.client_id = cfg.clientId;
  params.client_secret = cfg.secret;
  params.scope = GRAPH_SCOPE;
  const res = UrlFetchApp.fetch(cfg.base + 'token', { method: 'post', payload: params, muteHttpExceptions: true });
  const body = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error('Microsoft login error: ' + (body.error_description || res.getContentText()));
  return body;
}

function saveTokens_(t) {
  const p = PropertiesService.getScriptProperties();
  p.setProperty('MS_ACCESS_TOKEN', t.access_token);
  if (t.refresh_token) p.setProperty('MS_REFRESH_TOKEN', t.refresh_token);
  p.setProperty('MS_EXPIRES_AT', String(Date.now() + (Number(t.expires_in) - 120) * 1000));
}

function getAccessToken_() {
  const p = PropertiesService.getScriptProperties();
  const refresh = p.getProperty('MS_REFRESH_TOKEN');
  if (!refresh) throw new Error('Outlook not connected. Run HR System > Connect Outlook.');
  if (Date.now() > Number(p.getProperty('MS_EXPIRES_AT') || 0)) {
    saveTokens_(tokenRequest_({ grant_type: 'refresh_token', refresh_token: refresh }));
  }
  return p.getProperty('MS_ACCESS_TOKEN');
}

function toQuery_(obj) {
  return Object.keys(obj).map(k => k + '=' + encodeURIComponent(obj[k])).join('&');
}

function graphGet_(path) {
  const res = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0' + path, {
    headers: { Authorization: 'Bearer ' + getAccessToken_() },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error('Graph error: ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

/** Sends one HTML email from hr@rctrips.com. Throws on failure. */
function sendOutlookMail_(to, subject, html) {
  const res = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getAccessToken_() },
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
