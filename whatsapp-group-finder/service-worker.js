const KEY = "wagfState";
const DEFAULT = { status: "idle", queries: [], index: 0, results: [], tabId: null, delay: 8, domain: "www.google.com", error: "", log: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getState() { return { ...DEFAULT, ...((await chrome.storage.local.get(KEY))[KEY] || {}) }; }
async function setState(patch) { const s = { ...(await getState()), ...patch }; await chrome.storage.local.set({ [KEY]: s }); return s; }

async function openNext() {
  const s = await getState();
  if (s.status !== "running") return;
  if (s.index >= s.queries.length) return finish();
  const q = s.queries[s.index];
  const url = `https://${s.domain}/search?q=${encodeURIComponent(q)}&filter=0&wagf=1`;
  chrome.action.setBadgeText({ text: `${s.index + 1}/${s.queries.length}` });
  chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
  try {
    if (s.tabId) { await chrome.tabs.update(s.tabId, { url }); return; }
  } catch { /* tab was closed */ }
  const tab = await chrome.tabs.create({ url, active: false });
  await setState({ tabId: tab.id });
}

async function finish() {
  const s = await setState({ status: "complete" });
  chrome.action.setBadgeText({ text: "✓" });
  chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title: "WhatsApp Group Finder", message: `Finished. ${s.results.length} unique group link(s) found.` });
}

async function onPageResult(msg, sender) {
  let s = await getState();
  if (!["running", "captcha"].includes(s.status) || sender.tab?.id !== s.tabId) return;

  if (msg.captcha) {
    await setState({ status: "captcha", error: "Google CAPTCHA: solve it in the open Google tab. The run continues automatically." });
    chrome.tabs.update(s.tabId, { active: true });
    chrome.windows.update(sender.tab.windowId, { focused: true });
    chrome.action.setBadgeText({ text: "!" });
    chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title: "Google verification needed", message: "Solve the CAPTCHA in the Google tab. The run will continue." });
    return;
  }
  if (s.status === "captcha") s = await setState({ status: "running", error: "" });

  const query = s.queries[s.index];
  const map = new Map(s.results.map((r) => [r.code, r]));
  let added = 0;
  for (const g of msg.groups || []) {
    if (!map.has(g.code)) { map.set(g.code, { ...g, query, foundAt: new Date().toISOString() }); added++; }
  }
  const log = [...s.log, `${query} → ${msg.loadedResults || 0} results, ${added} new group(s)${msg.rateLimited ? " (Google stopped early)" : ""}`];
  await setState({ results: [...map.values()], index: s.index + 1, log, error: msg.rateLimited ? "Google limited the last search; partial results saved." : "" });
  await sleep(Math.max(3, s.delay) * 1000);
  openNext();
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const s = await getState();
  if (s.tabId === tabId) await setState({ tabId: null, status: s.status === "running" || s.status === "captcha" ? "paused" : s.status });
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    if (msg.type === "PAGE_RESULT") { await onPageResult(msg, sender); reply({ ok: true }); return; }
    if (msg.type === "GET") { reply(await getState()); return; }
    if (msg.type === "START") {
      const queries = msg.queries.map((q) => q.trim()).filter(Boolean);
      if (!queries.length) { reply({ error: "Add at least one search." }); return; }
      const keep = msg.keepResults ? (await getState()).results : [];
      await setState({ ...DEFAULT, status: "running", queries, delay: msg.delay, domain: msg.domain, results: keep });
      openNext(); reply({ ok: true }); return;
    }
    if (msg.type === "STOP") { await setState({ status: "paused" }); chrome.action.setBadgeText({ text: "" }); reply({ ok: true }); return; }
    if (msg.type === "RESUME") { await setState({ status: "running" }); openNext(); reply({ ok: true }); return; }
    if (msg.type === "CLEAR") { await chrome.storage.local.set({ [KEY]: { ...DEFAULT } }); chrome.action.setBadgeText({ text: "" }); reply({ ok: true }); return; }
  })();
  return true;
});
