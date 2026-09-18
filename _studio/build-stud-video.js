'use strict';
// "Stud Fees" update hype video, 8-bit Robinhood look. Writes stud-video.html (12s), rendered by stud-video.cjs.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'build-video.js'), 'utf8');
const ENGINE = src.slice(src.indexOf('const ENGINE = `') + 16, src.indexOf('`;\nconst page'));
const CSS = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:1280px;height:720px;overflow:hidden;background:#0b0f0c;color:#e8ffe6;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
body{background:radial-gradient(circle at 50% -10%,rgba(0,200,5,.16),transparent 55%),#0b0f0c}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 1px,transparent 1px 3px)}
.sc{position:absolute;inset:0;opacity:0;padding:60px 80px;display:flex;flex-direction:column;justify-content:center}
.px{font-family:'Press Start 2P',monospace;text-transform:uppercase}
.h{font-weight:700;letter-spacing:-.03em;line-height:.98}
.g{color:#00c805}.l{color:#9cff7a}.mut{color:#7e8f7c}.sub{color:#b9c9b8}
.box{background:#101610;border:3px solid #1f4a24;box-shadow:8px 8px 0 #071a09;padding:26px 30px}
.tag{display:inline-block;background:#00c805;color:#0b0f0c;padding:12px 16px;box-shadow:5px 5px 0 #056a09}
.logo{position:absolute;left:80px;top:48px;font-size:22px}.logo b{color:#00c805;font-weight:400}
.foot{position:absolute;right:80px;top:54px;font-size:11px;color:#7e8f7c}
.step{flex:1;text-align:left}`;
const sc = (a, b, html, last) => `<div class="sc" data-a="${a}" data-b="${b}"${last ? ' data-last="1"' : ''}><div class="px logo">BR<b>EED</b></div><div class="px foot">update · stud fees</div>${html}</div>`;
const body = [
  sc(0, 2.3, `<div><span class="px tag" data-in=".1" style="font-size:18px">New on BREED</span></div><div class="h" data-in=".3" style="font-size:150px;margin-top:34px">Stud fees<br><span class="g">are live.</span></div>`),
  sc(2.2, 4.7, `<div class="h" data-in=".05" style="font-size:112px">Own the horse.<br><span class="g">Earn the rent.</span></div><div class="sub" data-in=".7" style="font-size:34px;margin-top:30px;max-width:1000px;line-height:1.35"><b style="color:#e8ffe6">10%</b> of every rider's winning trade goes straight to the horse's owner.</div>`),
  sc(4.6, 8.1, `<div class="px l" data-in=".05" style="font-size:14px;margin-bottom:18px">how it pays</div>
    <div style="display:grid;grid-template-columns:1fr 120px 1fr;align-items:center">
      <div class="box" data-in=".2"><div class="px mut" style="font-size:11px">rider · riding RENTDUE</div><div class="h" style="font-size:40px;margin:14px 0 6px">Long $AAPL closed</div><div class="px g" style="font-size:26px"><span data-count="0,1000.09,.5,1,+$,2"></span></div></div>
      <div class="px g" data-in="1.4" style="font-size:40px;text-align:center">►</div>
      <div class="box" data-in="1.6" style="border-color:#00c805"><div class="px mut" style="font-size:11px">owner's desk</div><div class="h" style="font-size:40px;margin:14px 0 6px">Stud fee received</div><div class="px l" style="font-size:26px"><span data-count="0,100.01,1.8,1,+$,2"></span></div></div>
    </div>
    <div class="box" data-in="2.5" style="margin-top:26px;font-size:26px;display:flex;gap:18px;align-items:center"><span style="font-size:40px">🏇</span><span><b>RENTDUE</b> <span class="mut">·</span> stud fee paid. a rider banked on my $AAPL and a cut went to my owner. <b class="l">good horses pay rent.</b></span></div>`),
  sc(8, 10.2, `<div class="px l" data-in=".05" style="font-size:14px;margin-bottom:26px">three moves</div><div style="display:flex;gap:22px">${[['01', 'Foal it', 'Pick a breed. It trades 22 tokenized stocks on the live tape.'], ['02', 'Get it ridden', 'Every call is scored in public. Winners attract riders.'], ['03', 'Get paid', 'Live rides pay your Live desk. Withdraw it as ETH.']].map((s, i) => `<div class="box step" data-in="${(.15 + i * .3).toFixed(2)}"><div class="px g" style="font-size:14px">${s[0]}</div><div class="h" style="font-size:50px;margin:16px 0 12px">${s[1]}</div><div class="sub" style="font-size:23px;line-height:1.4">${s[2]}</div></div>`).join('')}</div>`),
  sc(10.1, 12, `<div class="h" data-in=".05" style="font-size:120px">Good horses<br><span class="g">pay rent.</span></div><div data-in=".6" style="margin-top:36px;display:flex;gap:26px;align-items:center"><span class="px tag" style="font-size:18px">breedonrh.xyz</span><span class="px mut" style="font-size:13px">$BREED · Robinhood Chain</span></div>`, true),
].join('');
fs.writeFileSync(path.join(__dirname, 'stud-video.html'), `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${body}<script>const DUR=12;${ENGINE}</script></body></html>`);
const rec = fs.readFileSync(path.join(__dirname, 'hype-video.cjs'), 'utf8').replace('DUR = 10, PORT = 9517', 'DUR = 12, PORT = 9519').replace("'breed-hype-10s.mp4'", "'breed-studfees-12s.mp4'").replace("'hype-frames'", "'stud-frames'").replace("'hype-video.html'", "'stud-video.html'");
fs.writeFileSync(path.join(__dirname, 'stud-video.cjs'), rec); console.log('built', ENGINE.length > 500, rec.includes('stud-video.html'));
