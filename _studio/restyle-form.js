// Restyle: drop the dark 8-bit skin, print the site as a racing form. Idempotent.
const fs = require('fs'), path = require('path');
const C = (f) => path.join(__dirname, '..', 'client', f), F = (f) => path.join(__dirname, 'form', f);
const theme = fs.readFileSync(F('theme.css'), 'utf8'), silks = fs.readFileSync(F('silks.js'), 'utf8');
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">';

// ---- landing: rebuilt from template, FAQ carried over verbatim
{
  const old = fs.readFileSync(C('index.html'), 'utf8');
  const m = old.match(/<div class="faq">[\s\S]*?<\/details>\s*<\/div>/);
  if (!m) throw new Error('faq block not found');
  const faq = m[0].replace('put USDC behind the ones that earn it', 'put ETH behind the ones that earn it');
  fs.writeFileSync(C('index.html'), fs.readFileSync(F('index.tpl.html'), 'utf8').replace('{{FAQ}}', () => faq).replace('{{SILKS}}', () => silks));
}

function reskin(html, extra) {
  html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*Press\+Start[^>]*>/, '');
  html = html.replace(/<style id="(rh-theme|form-theme)">[\s\S]*?<\/style>/, '');
  html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=(DM\+Sans|Big\+Shoulders)[^>]*>/, FONTS);
  return html.replace('</head>', () => '<style id="form-theme">\n' + theme + (extra || '') + '</style></head>');
}

// ---- app
{
  let h = reskin(fs.readFileSync(C('app.html'), 'utf8'));
  const rep = (a, b) => { if (h.includes(a)) h = h.split(a).join(b); };
  rep("'\">'+r.emoji+'</div>", "'\">'+silk(r.color,22)+'</div>");
  rep("openProfile(\\''+p.pet+'\\')\">'+p.emoji+'</div>", "openProfile(\\''+p.pet+'\\')\">'+silk(p.color,44)+'</div>");
  rep("<div class=\"pav\" style=\"border-color:'+p.color+'\">'+p.emoji+'</div>", "<div class=\"pav\">'+silk(p.color,60)+'</div>");
  rep("<div class=\"pav\" style=\"border-color:'+a.color+'\">'+a.emoji+'</div>", "<div class=\"pav\">'+silk(a.color,60)+'</div>");
  rep("openProfile(\\''+a.id+'\\')\">'+a.emoji+'</div>", "openProfile(\\''+a.id+'\\')\">'+silk(a.color,38)+'</div>");
  rep("<div class=\"lbav\" style=\"border-color:'+p.color+'\">'+p.emoji+'</div>", "<div class=\"lbav\">'+silk(p.color,30)+'</div>");
  rep("<div class=\"pe\">'+p.emoji+'</div>", "<div class=\"pe\">'+silk(p.color,44)+'</div>");
  rep("<div class=\"e\">'+s.emoji+'</div>", "<div class=\"e\">'+silk(s.color,40)+'</div>");
  rep("toast(r.pet.emoji+' '+r.pet.name", "toast(r.pet.name");
  rep("textContent=s.emoji+' '+s.blurb", "textContent=s.blurb");
  rep('<h3>🏇 Foal a horse</h3>', '<h3>Foal a horse</h3>');
  rep("return p.energy<15?'😵':p.mood<20?'😢':p.mood>70?'😊':'😐'}", "return p.energy<15?'spent':p.mood<20?'sour':p.mood>70?'keen':'steady'}");
  rep("'<div class=\"btxt\">'+cashify(p.text)+'</div>'", "'<div class=\"btxt\">'+cashify(noEmo(p.text))+'</div>'");
  rep("+esc(r.text)+'</div></div>'", "+esc(noEmo(r.text))+'</div></div>'");
  rep('✕ clear', 'clear');
  [['✓ CALLED IT','CALLED IT'],['✗ MISSED','MISSED'],["💬 '+","replies '+"],["❤ '+","likes '+"],["🔁 '+","echoes '+"],
   ['🍖 FEED','FEED'],['✋ PET','PET'],['🎖 TRAIN','TRAIN'],['⚡ SCOLD','SCOLD'],['💰 Fund','Fund'],['🐴 Breed a foal','Breed a foal'],
   ['<div class="pav" style="border-color:var(--gold)">🥚</div>','<div class="pav pavx">×</div>'],['<div class="pav" style="border-color:var(--gold)">💠</div>','<div class="pav pavx">L</div>'],['<div class="pav" style="border-color:var(--gold)">🏁</div>','<div class="pav pavx">P</div>'],
   ['<div class="pe">🐴</div>','<div class="pe">+</div>'],["' 🗨 <span","' posts <span"],[' 🍖',''],[' ✋',''],[' 🎖',''],[' ⚡',''],[' 💰',''],['🎲 no breed','no breed']].forEach(([a,b])=>rep(a,b));

  if (!h.includes('function silk(')) h = h.replace('<script>', () => '<script>\n' + silks + "function noEmo(s){return String(s||'').replace(/[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{FE0F}\\u{200D}]/gu,'').replace(/^\\s+/,'').replace(/ {2,}/g,' ')}\n");
  h = h.replace(/<link rel="icon"[\s\S]*?(?=\n<link rel="preconnect")/, () =>"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%2312110e'/><rect x='3' y='3' width='26' height='26' fill='none' stroke='%23ece5d3' stroke-width='2'/><text x='16' y='23' font-size='20' font-weight='900' text-anchor='middle' fill='%2300c805' font-family='Impact,sans-serif'>B</text></svg>\">");
  fs.writeFileSync(C('app.html'), h);
  const left = (h.match(/\.emoji/g) || []).length; console.log('app.html done; remaining .emoji refs:', left);
}

// ---- docs
fs.writeFileSync(C('docs.html'), reskin(fs.readFileSync(C('docs.html'), 'utf8').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]\s?/gu, ''), '.wrap a{color:var(--gtext)!important;border-bottom:1px solid currentColor}th{border-bottom:1px solid var(--rule)!important}td{border-bottom:1px solid var(--hair)!important}\n'));
console.log('ok');
