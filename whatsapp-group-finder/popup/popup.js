const $ = (id) => document.getElementById(id);
const call = (msg) => chrome.runtime.sendMessage(msg);

async function render() {
  const s = await call({ type: "GET" });
  if (!$("queries").value && s.queries.length) $("queries").value = s.queries.join("\n");
  const progress = s.queries.length ? `Search ${Math.min(s.index + 1, s.queries.length)} of ${s.queries.length}` : "";
  $("status").textContent = `Status: ${s.status}  ${progress}\nGroups found: ${s.results.length}` +
    (s.error ? `\n⚠ ${s.error}` : "") + (s.log.length ? `\nLast: ${s.log[s.log.length - 1]}` : "");
  $("list").innerHTML = "";
  s.results.slice().reverse().forEach((r) => {
    const d = document.createElement("div");
    d.className = "item";
    const a = document.createElement("a");
    a.href = r.link; a.target = "_blank"; a.textContent = r.link;
    const sm = document.createElement("small");
    sm.textContent = `${r.title || "(no title)"} — ${r.query}`;
    d.append(a, sm);
    $("list").appendChild(d);
  });
  return s;
}

$("start").onclick = async () => {
  const res = await call({ type: "START", queries: $("queries").value.split("\n"), delay: Number($("delay").value) || 8, domain: $("domain").value, keepResults: $("keep").checked });
  if (res?.error) alert(res.error);
  render();
};
$("stop").onclick = async () => { await call({ type: "STOP" }); render(); };
$("resume").onclick = async () => { await call({ type: "RESUME" }); render(); };
$("clear").onclick = async () => { if (confirm("Clear all results?")) { await call({ type: "CLEAR" }); $("queries").value = ""; render(); } };
$("copy").onclick = async () => {
  const s = await call({ type: "GET" });
  await navigator.clipboard.writeText(s.results.map((r) => r.link).join("\n"));
  $("copy").textContent = "Copied!"; setTimeout(() => ($("copy").textContent = "Copy links"), 1200);
};
$("csv").onclick = async () => {
  const s = await call({ type: "GET" });
  const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
  const rows = [["WhatsApp Link", "Invite Code", "Result Title", "Source URL", "Search Query", "Found At"],
    ...s.results.map((r) => [r.link, r.code, r.title, r.source, r.query, r.foundAt])];
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `whatsapp-groups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

render();
setInterval(render, 2000);
