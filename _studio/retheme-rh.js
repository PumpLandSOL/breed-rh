// Robinhood retheme: black + Robinhood green, slight 8-bit (Press Start 2P labels, square corners, pixel-step shadows, scanlines).
// 1) literal palette remap across client + kit sources  2) override stylesheet appended to each page's <head>.
const fs = require('fs'), path = require('path');
const F = (f) => path.join(__dirname, '..', f);
const MAP = [
  ['rgba(244,248,253,.88)', 'rgba(11,15,12,.92)'], ['rgba(244,248,253,.92)', 'rgba(11,15,12,.92)'],
  ['rgba(27,49,88,.35)', 'rgba(0,200,5,.18)'], ['rgba(27,49,88,.25)', 'rgba(0,200,5,.18)'], ['rgba(27,49,88,.16)', 'rgba(0,200,5,.28)'], ['rgba(27,49,88,.14)', 'rgba(0,200,5,.26)'], ['rgba(27,49,88,.12)', 'rgba(0,200,5,.22)'], ['rgba(27,49,88,.2)', 'rgba(0,200,5,.3)'], ['rgba(27,49,88,.08)', 'rgba(0,200,5,.14)'],
  ['#f4f8fd', '#0b0f0c'], ['#cfe3f7', '#0e1a10'], ['#e9f1fb', '#131c14'], ['#eef4fc', '#0f1a12'], ['#fff7ec', '#151a10'], ['#c9daf0', '#00c805'],
  ['#1b3158', '#e8ffe6'], ['#2f578c', '#00c805'], ['#412c5c', '#9cff7a'], ['#acc6e9', '#00c805'], ['#9bb8e0', '#00a804'], ['#bcd3f0', '#19d81f'],
  ['#e9a13f', '#9cff7a'], ['#414c4c', '#101610'], ['#41464c', '#b9c9b8'], ['#7a858e', '#7e8f7c'], ['#1f8a5a', '#00c805'], ['#c9413a', '#ff5c5c'], ['#c8d1d8', '#7e8f7c'],
  ['#7fe0a8', '#9cff7a'], ['#ff9a94', '#ff5c5c'], ['#f2c531', '#9cff7a'],
  ['#ffffff', '#101610'], ['#fff', '#101610'],
];
const remap = (s) => { for (const [a, b] of MAP) s = s.split(a).join(b); return s; };
const FONTLINK = '<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">';
const OVERRIDE = `<style id="rh-theme">
:root{--px:'Press Start 2P',monospace;--green:#00c805;--lime:#9cff7a}
html{scrollbar-color:#00c805 #0b0f0c}
body{background:#0b0f0c!important;background-image:radial-gradient(circle at 50% -10%,rgba(0,200,5,.14),transparent 55%)!important;color:#e8ffe6}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:9999;background:repeating-linear-gradient(0deg,rgba(0,0,0,.09) 0 1px,transparent 1px 3px);mix-blend-mode:multiply}
*,*::before,*::after{border-radius:0!important;box-shadow:none!important}
.logo,.logo b{font-family:var(--px)!important;font-size:18px!important;letter-spacing:.02em!important;text-transform:uppercase!important;-webkit-text-fill-color:initial!important;background:none!important;color:#e8ffe6!important}
.logo b{color:#00c805!important}
.btn{font-family:var(--px)!important;font-size:9.5px!important;letter-spacing:.04em!important;text-transform:uppercase!important;padding:11px 16px!important;border:2px solid #00c805!important;image-rendering:pixelated}
.btn.big{font-size:11px!important;padding:16px 26px!important}
.btn-gold,.btn-pink{background:#00c805!important;color:#0b0f0c!important;box-shadow:4px 4px 0 #056a09!important}
.btn-gold:hover,.btn-pink:hover{background:#19d81f!important;transform:translate(-1px,-1px)}
.btn-ghost{background:#0b0f0c!important;color:#9cff7a!important;border-color:#1f4a24!important}
.btn-ghost:hover{border-color:#00c805!important;color:#e8ffe6!important}
.btn-red,.btn-mint{background:#e8ffe6!important;color:#0b0f0c!important;border-color:#e8ffe6!important;box-shadow:4px 4px 0 #00c805!important}
.card,.petcard,.tote,.sbox,.panel,.pstat,.lbrow,.silk,.faq details,select,input,textarea,.seg,.dtable{border:2px solid #1f4a24!important;box-shadow:4px 4px 0 #071a09!important}
.card,.petcard{background:#101610!important}
.card.red{background:#141a10!important}.card.blue{background:#0f1a12!important}
.card .k,.cond,.tote .l,.pstat span,.k,.eyebrow,h2 small,.tabs button,.tabs a,.seg button{font-family:var(--px)!important;font-size:9px!important;letter-spacing:.06em!important;line-height:1.6!important;text-transform:uppercase!important}
.card .k{color:#00c805!important}
.hero h1,.sec h2,h1,.card h3,h3{font-family:'DM Sans',system-ui,sans-serif!important;font-weight:700!important;letter-spacing:-.02em!important}
.hero h1 .g,.sec h2 em{color:#00c805!important;-webkit-text-fill-color:#00c805!important;background:none!important}
.hero h1::before{content:"▶ ";color:#00c805;font-family:var(--px);font-size:.35em;vertical-align:middle}
.rail{background:#000!important;color:#00c805!important;font-family:var(--px)!important;font-size:9px!important;border-top:2px solid #00c805!important;border-bottom:2px solid #00c805!important}
.rail span{padding:11px 18px!important}
.tote{background:#000!important}.tote .v{color:#9cff7a!important}
.silk{border:2px solid #1f4a24!important;image-rendering:pixelated}
.tagpill{font-family:var(--px)!important;font-size:7px!important}
.tabs button.on,.seg button.on{background:#00c805!important;color:#0b0f0c!important}
header{border-bottom:2px solid #00c805!important;backdrop-filter:none!important}
.foot{border-top:2px solid #1f4a24!important;font-family:var(--px)!important;font-size:8px!important;line-height:1.8!important}
::selection{background:#00c805;color:#0b0f0c}
</style>`;
for (const f of ['client/index.html', 'client/app.html', 'client/docs.html']) {
  let s = fs.readFileSync(F(f), 'utf8');
  s = remap(s);
  if (!s.includes('rh-theme')) s = s.replace('</head>', FONTLINK + OVERRIDE + '</head>');
  fs.writeFileSync(F(f), s); console.log('themed', f);
}
for (const f of ['_studio/build.js', '_studio/hype-video.html', '_studio/demo-video.html']) {
  let s = fs.readFileSync(F(f), 'utf8'); s = remap(s);
  s = s.split("family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700").join("family=Press+Start+2P&family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700");
  s = s.split("'Space Mono'").join("'Press Start 2P'").split('"Space Mono"').join('"Press Start 2P"');
  s = s.split('in the Arc look').join('in the Robinhood look').split('sky gradient, navy').join('black, Robinhood green');
  fs.writeFileSync(F(f), s); console.log('themed', f);
}
console.log('retheme done');
