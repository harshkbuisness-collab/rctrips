// Bulk paste: titles one per line; scripts in the same order, separated in one of three ways (first that fits):
//   1. each script in double quotes: "Script one ... (may have blank lines inside)" "Script two ..."
//   2. a line with --- between scripts
//   3. a blank line between scripts (only for one-paragraph scripts)
const unquote = (s) => s.trim().replace(/^["“”]+|["“”]+$/g, '').trim();

export function splitBulk(titlesText, scriptsText) {
  const titles = titlesText.split('\n').map(unquote).filter(Boolean);
  const raw = scriptsText.replace(/\r/g, '').replace(/[“”]/g, '"').trim();
  let scripts, by;
  const quoted = raw.match(/"[^"]+"/g);
  if (raw.startsWith('"') && raw.endsWith('"') && quoted && quoted.join('').replace(/\s/g, '').length >= raw.replace(/\s/g, '').length * 0.98) {
    // every script is a "..." block (blank lines inside a block stay part of that script)
    scripts = quoted.map(unquote);
    by = 'quotes';
  } else if (/^\s*-{3,}\s*$/m.test(raw)) {
    scripts = raw.split(/^\s*-{3,}\s*$/m).map(unquote);
    by = '---';
  } else {
    scripts = raw.split(/\n\s*\n+/).map(unquote);
    by = 'blank lines';
  }
  return {titles, scripts: scripts.filter(Boolean), by};
}
