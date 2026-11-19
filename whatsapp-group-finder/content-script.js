(async () => {
  const pageUrl = new URL(location.href);
  if (pageUrl.searchParams.get("wagf") !== "1" || window.__wagfRan) return;
  window.__wagfRan = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const send = (msg) => chrome.runtime.sendMessage({ type: "PAGE_RESULT", url: location.href, ...msg });

  // Google's CAPTCHA page. After the user solves it, Google redirects back to
  // the original URL (with wagf=1), so this script runs again and continues.
  if (location.pathname.startsWith("/sorry/")) { send({ captcha: true, groups: [] }); return; }

  const rso = await waitFor("#rso", 10000);
  if (!rso) { send({ groups: [], loadedResults: 0 }); return; }

  const bar = document.createElement("div");
  bar.style.cssText = "position:sticky;bottom:12px;z-index:9999;margin:12px 0;padding:10px 14px;border:1px solid #c8e6c9;border-radius:8px;background:#e8f5e9;color:#1b5e20;font:13px Arial;box-shadow:0 5px 18px rgba(0,0,0,.12)";
  bar.textContent = "WhatsApp Group Finder: loading 100 results…";
  rso.parentNode.insertBefore(bar, rso.nextSibling);

  const baseUrl = new URL(pageUrl.origin + pageUrl.pathname);
  ["hl", "gl", "safe", "lr", "tbs"].forEach((k) => pageUrl.searchParams.has(k) && baseUrl.searchParams.set(k, pageUrl.searchParams.get(k)));
  let rateLimited = false;

  // Same technique as the original extension: fetch pages 2-10 and append them.
  for (let start = 10; start < 100; start += 10) {
    bar.textContent = `WhatsApp Group Finder: loading results ${start + 1}–${start + 10}…`;
    await sleep(800 + Math.random() * 900);
    try {
      const u = new URL(baseUrl.href);
      u.searchParams.set("q", pageUrl.searchParams.get("q") || "");
      u.searchParams.set("start", String(start));
      u.searchParams.set("filter", "0");
      const res = await fetch(u.href, { credentials: "include", headers: { Accept: "text/html" } });
      if (!res.ok || res.url.includes("/sorry/")) { rateLimited = true; break; }
      const html = await res.text();
      if (/unusual traffic|our systems have detected/i.test(html)) { rateLimited = true; break; }
      const doc = new DOMParser().parseFromString(html, "text/html");
      const box = doc.querySelector("#rso");
      if (!box || !box.children.length) break;
      [...box.children].forEach((n) => {
        n.querySelectorAll("script,style").forEach((e) => e.remove());
        rso.appendChild(document.importNode(n, true));
      });
    } catch { rateLimited = true; break; }
  }

  // Equivalent of Ctrl+A / Ctrl+C: read all text + all link hrefs on the page.
  const groups = extractGroups();
  const resultCount = [...rso.querySelectorAll("h3")].length;
  bar.textContent = `${rateLimited ? "Google stopped early. " : ""}Done: ${resultCount} results scanned, ${groups.length} WhatsApp group link(s) found.`;
  send({ groups, loadedResults: resultCount, rateLimited });

  function normalise(s) {
    return String(s || "")
      .replace(/<\/?(em|b|strong|wbr)[^>]*>/gi, "")
      .replace(/%2F/gi, "/").replace(/%3A/gi, ":")
      .replace(/chat\s*\.\s*whatsapp\s*\.\s*com\s*\/\s*/gi, "chat.whatsapp.com/")
      .replace(/chat\.whatsapp\.com\/invite\//gi, "chat.whatsapp.com/");
  }

  function codesIn(text) {
    const out = new Set();
    const re = /chat\.whatsapp\.com\/([A-Za-z0-9]{20,24})(?![A-Za-z0-9])/g;
    let m;
    while ((m = re.exec(normalise(text)))) out.add(m[1]);
    return [...out];
  }

  function extractGroups() {
    const found = new Map();
    // 1) Per result block, so each link keeps its source title/URL.
    rso.querySelectorAll("h3").forEach((h3) => {
      const block = h3.closest("div[data-hveid], div.g, div.MjjYud") || h3.parentElement?.parentElement;
      if (!block) return;
      const link = h3.closest("a")?.href || block.querySelector("a[href^='http']")?.href || "";
      const hrefs = [...block.querySelectorAll("a[href]")].map((a) => a.href).join(" ");
      codesIn(block.innerHTML + " " + block.innerText + " " + hrefs).forEach((code) => {
        if (!found.has(code)) found.set(code, { code, link: `https://chat.whatsapp.com/${code}`, title: h3.innerText.trim(), source: link });
      });
    });
    // 2) Whole page sweep for anything missed.
    const all = document.body.innerHTML + " " + document.body.innerText + " " + [...document.querySelectorAll("a[href]")].map((a) => a.href).join(" ");
    codesIn(all).forEach((code) => {
      if (!found.has(code)) found.set(code, { code, link: `https://chat.whatsapp.com/${code}`, title: "", source: location.href });
    });
    return [...found.values()];
  }

  function waitFor(sel, timeout) {
    return new Promise((resolve) => {
      const el = document.querySelector(sel);
      if (el) return resolve(el);
      const ob = new MutationObserver(() => { const e = document.querySelector(sel); if (e) { ob.disconnect(); resolve(e); } });
      ob.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => { ob.disconnect(); resolve(null); }, timeout);
    });
  }
})();
