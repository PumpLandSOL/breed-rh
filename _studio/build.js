'use strict';
// BREED brand kit, dark racing-program look → _studio/out/breed-*.html; render.js rasterizes to brand/.
const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const silk = new Function(fs.readFileSync(path.join(__dirname, 'form', 'silks.js'), 'utf8') + ';return silk')();
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .93 0 0 0 0 .9 0 0 0 0 .83 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E")`;
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}html,body{background:#12110e;font-family:'Newsreader',Georgia,serif;color:#ece5d3;overflow:hidden;-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden;background:#12110e ${NOISE}}
.abs{position:absolute}
.d{font-family:'Big Shoulders Display',Impact,sans-serif;font-weight:900;text-transform:uppercase;line-height:.9}
.m{font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.14em}
.sub{color:#c4bca8}.mut{color:#8a8372}.g{color:#2fd64a}
.blk{background:#00c805;color:#12110e;padding:0 .1em;display:inline-block;line-height:.98}
.logo i{font-style:normal;color:#2fd64a}
.top{left:150px;right:150px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:6px double #d9d1bd;padding-bottom:18px}
.foot{left:150px;right:150px;bottom:64px;display:flex;justify-content:space-between;border-top:2px solid #d9d1bd;padding-top:18px;font-size:24px}
table{width:100%;border-collapse:collapse}
th{font-family:'IBM Plex Mono',monospace;font-weight:400;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#8a8372;text-align:left;padding:12px 10px;border-bottom:2px solid #d9d1bd}
td{padding:16px 10px;border-bottom:1px solid #3a362c;vertical-align:middle;font-size:30px}
td.n,th.n{text-align:right;font-family:'IBM Plex Mono',monospace}
.pp{font-family:'Big Shoulders Display',sans-serif;font-weight:900;font-size:50px;width:70px}
.hn{font-family:'Big Shoulders Display',sans-serif;font-weight:700;text-transform:uppercase;font-size:42px;letter-spacing:.02em;line-height:1}
.hs{font-style:italic;color:#8a8372;font-size:26px;line-height:1.25}
.tote{display:grid;background:#000;border:1px solid #3a362c;font-family:'IBM Plex Mono',monospace;color:#f6e27a;text-align:center}
.tote>div{padding:22px 10px;border-right:1px solid #3a362d}.tote>div:last-child{border-right:0}
.tote .l{font-size:17px;letter-spacing:.14em;text-transform:uppercase;color:#a79f8a}.tote .v{font-size:44px;font-weight:600;margin-top:4px}
.cols{display:grid;grid-template-columns:repeat(3,1fr)}
.item{padding:0 40px 34px;border-right:1px solid #3a362c}.item:nth-child(3n){border-right:0;padding-right:0}.item:nth-child(3n+1){padding-left:0}
.item small{display:block;font-family:'IBM Plex Mono',monospace;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#2fd64a;margin-bottom:8px}
.item h4{font-family:'Big Shoulders Display',sans-serif;font-weight:900;text-transform:uppercase;font-size:50px;line-height:1;margin-bottom:12px}
.item p{font-size:27px;line-height:1.42;color:#c4bca8}
.btn{display:inline-block;font-family:'Big Shoulders Display',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.04em;font-size:40px;padding:20px 40px 17px;background:#00c805;color:#12110e}
.tape{display:flex;overflow:hidden;white-space:nowrap;font-family:'IBM Plex Mono',monospace;font-size:24px;border-top:2px solid #d9d1bd;border-bottom:2px solid #d9d1bd}
.tape .tag{background:#ece5d3;color:#12110e;padding:14px 22px;letter-spacing:.14em;text-transform:uppercase;font-size:20px}
.tape span{padding:14px 26px;border-right:1px solid #3a362c}.u{color:#2fd64a}.dn{color:#ff6b57}`;
const wrap = (name, w, h, body) => fs.writeFileSync(path.join(OUT, name + '.html'), `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="stage" style="width:${w}px;height:${h}px">${body}</div></body></html>`);
const logo = (px) => `<div class="d logo" style="font-size:${px}px;line-height:.8">BR<i>EE</i>D</div>`;
const top = (label, y = 90) => `<div class="abs top" style="top:${y}px">${logo(110)}<div class="m mut" style="font-size:24px;padding-bottom:6px">${label}</div></div>`;
const foot = (r) => `<div class="abs foot m"><span class="g">breedonrh.xyz</span><span class="mut">${r}</span></div>`;
const BREEDS = [['Thoroughbred', 'Momentum. Longs the strongest five-minute mover.', '#c8102e', '2x', '+20'], ['Mustang', 'Fade. Shorts the strongest pump on the board.', '#1b1b1b', '2x', '−15'], ['Pony', 'Scalp. Tight exits, in and out.', '#e0a100', '3x', '0'], ['Clydesdale', 'Index. Holds $SPY and $GLD, cannot be rushed.', '#0b7a1e', '1x', '+5'], ['Arabian', 'Herd. Reads the rail and runs with it.', '#1d3f8f', '2x', '+10']];
const field = (sz) => `<table><thead><tr><th>PP</th><th>Silks</th><th>Breed · running style</th><th class="n">Lev</th><th class="n">Obeys</th></tr></thead><tbody>${BREEDS.map((b, i) => `<tr><td class="pp">${i + 1}</td><td style="width:${sz + 30}px">${silk(b[2], sz)}</td><td><div class="hn">${b[0]}</div><div class="hs">${b[1]}</div></td><td class="n">${b[3]}</td><td class="n">${b[4]}</td></tr>`).join('')}</tbody></table>`;
const FACTS = [['Stocks', '22'], ['Breeds', '5'], ['Max lev', '3x'], ['Scored at', '30m'], ['Tape', '15s']];
const tote = () => `<div class="tote" style="grid-template-columns:repeat(5,1fr)">${FACTS.map((f) => `<div><div class="l">${f[0]}</div><div class="v">${f[1]}</div></div>`).join('')}</div>`;
const TAPE = [['SPY', '757.39', '+0.12', 1], ['NVDA', '212.17', '+1.04', 1], ['TSLA', '356.58', '-0.62', 0], ['AAPL', '331.34', '+0.20', 1], ['HOOD', '110.45', '+2.15', 1], ['GME', '21.44', '-1.10', 0], ['COIN', '172.11', '+0.88', 1], ['MSTR', '129.60', '-0.35', 0]];
const tape = `<div class="tag">Late prices</div>` + TAPE.concat(TAPE).map((t) => `<span>${t[0]} ${t[1]} <b class="${t[3] ? 'u' : 'dn'}">${t[2]}%</b></span>`).join('');

wrap('breed-pfp', 2000, 2000, `  <div class="abs" style="left:0;right:0;top:330px;display:flex;justify-content:center">${silk('#0b7a1e', 860).split('#0b7a1e').join('#00c805')}</div>
  <div class="abs" style="left:0;right:0;top:1200px;text-align:center">${logo(470)}</div>
  <div class="abs m mut" style="left:0;right:0;bottom:250px;text-align:center;font-size:44px">Robinhood Chain</div>`);

wrap('breed-banner', 3000, 1000, `<div class="abs" style="left:150px;top:110px;right:1500px;border-bottom:6px double #d9d1bd;padding-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end">${logo(190)}<div class="m mut" style="font-size:22px;padding-bottom:8px">Official program · Robinhood Chain</div></div>
  <div class="abs d" style="left:150px;top:370px;font-size:150px">AI racehorses<br>that <span class="blk">trade stocks.</span></div>
  <div class="abs sub" style="left:150px;top:690px;font-size:38px;max-width:1300px;line-height:1.35">Foal it. Feed it. Breed it. It trades. 22 tokenized stocks, every call scored against the tape.</div>
  <div class="abs" style="right:150px;top:70px;width:1200px">${field(78)}</div>
  <div class="abs tape" style="left:0;right:0;bottom:0">${tape}</div>`);

wrap('breed-keyart', 2400, 1350, `${top('Robinhood Chain · 22 tokenized stocks · every call scored')}
  <div class="abs d" style="left:150px;top:290px;font-size:188px">Foal it.<br>Feed it.<br>Breed it.<br><span class="blk">It trades.</span></div>
  <div class="abs sub" style="left:150px;top:1010px;font-size:31px;line-height:1.42;max-width:1010px">AI racehorses with real strategies on the live stock tape. Whisper orders they may or may not obey. Then open the <b>Owner's Desk</b> and trade the same 22 stocks, or <b>ride along</b> on your best horse's book.</div>
  <div class="abs" style="right:150px;top:270px;width:1040px"><div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:4px solid #d9d1bd;padding-bottom:8px"><span class="d" style="font-size:54px">The field</span><span class="m mut" style="font-size:20px">Five breeds · five strategies</span></div>${field(72)}<div style="margin-top:26px">${tote()}</div></div>
  ${foot('Practice and Live desks · on Robinhood Chain')}`);

const RULES = [['Foal', 'Pick a breed', 'Thoroughbred chases breakaways. Mustang fades pumps. Pony scalps at 3x. Clydesdale pulls the index. Arabian runs with the herd. $1,000 book each, up to 3 per wallet.'], ['Care', 'Feed, pet, train, scold', 'Hungry horses don\'t run. Sad ones bolt. Trained ones listen. Whisper an order and it rolls against its tame score, then obeys or defies you in public.'], ['Scored', 'Every call judged', 'Each $CASHTAG post is scored against the tape 30 minutes later. Hit rates, fans, the Derby and the Winner\'s Circle. Breed two champions into a foal.'], ['Owner\'s Desk', 'Trade it yourself', 'A $10,000 Practice balance or a Live desk funded with ETH on Robinhood Chain, on the same 22 tokenized stocks the horses trade, up to 3x.'], ['Ride along', 'Mirror a horse', 'Pick up to 3 horses. Every entry they make mirrors into your desk at half size and closes when they close. Riders are counted on every card.'], ['On Robinhood Chain', 'ETH gas, live tape', 'Prices from the exchange tape every 15 seconds, extended hours included. Deposits verified on chain, withdrawals paid by the treasury.']];
wrap('breed-how', 2400, 1350, `${top('House rules')}
  <div class="abs d" style="left:150px;top:290px;font-size:112px">Same rules as a real barn. <span class="blk">Plus a desk.</span></div>
  <div class="abs cols" style="left:150px;right:150px;top:600px;row-gap:30px">${RULES.map((r) => `<div class="item"><small>${r[0]}</small><h4>${r[1]}</h4><p>${r[2]}</p></div>`).join('')}</div>
  ${foot('every call scored · live deposits verified on Robinhood Chain')}`);

const BIG = [['Momentum · 2x', 'longs whatever is breaking away. obeys +20.'], ['Fade · 2x', 'shorts every pump out of spite. obeys −15.'], ['Scalp · 3x', 'in and out, +0.4% or −8% or four minutes.'], ['Index · 1x', '$SPY $QQQ $GLD at a walk. cannot be rushed.'], ['Mimic · 2x', 'follows the rail\'s loudest sentiment, with size.']];
wrap('breed-breeds', 2400, 1350, `${top('Five breeds · five strategies')}
  <div class="abs d" style="left:150px;top:290px;font-size:112px">A breed is a temperament <span class="blk">and a strategy.</span></div>
  <div class="abs" style="left:150px;right:150px;top:590px;display:grid;grid-template-columns:repeat(5,1fr);border-top:4px solid #d9d1bd">${BREEDS.map((b, i) => `<div style="padding:26px 26px 0;border-right:${i < 4 ? '1px solid #3a362c' : '0'}"><div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="d" style="font-size:96px">${i + 1}</span>${silk(b[2], 250)}</div><div class="d" style="font-size:56px;margin-top:18px">${b[0]}</div><div class="m g" style="font-size:22px;margin:12px 0 10px">${BIG[i][0]}</div><div class="sub" style="font-size:27px;line-height:1.4;font-style:italic">${BIG[i][1]}</div></div>`).join('')}</div>
  ${foot('breeding blends two genomes ±12% · lineage on record')}`);

const ROWS = [['Long NVDA 3x', 'manual', '$500.00 @ 212.37', '+$63.12', 1], ['Long AAPL 2x', 'ride · Bolt', '$1,462.50 @ 331.34', '+$28.40', 1], ['Short SPY 1x', 'manual', '$250.00 @ 758.23', '−$4.10', 0], ['Long HOOD 2x', 'ride · Secretariat', '$1,462.50 @ 110.45', '+$41.20', 1]];
wrap('breed-desk', 2400, 1350, `${top('Owner\'s Desk · ride along')}
  <div class="abs d" style="left:150px;top:290px;font-size:112px">Your book. <span class="blk">Their entries,</span> if you want them.</div>
  <div class="abs" style="left:150px;top:620px;width:1300px"><div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:4px solid #d9d1bd;padding-bottom:8px"><span class="d" style="font-size:50px">Open positions</span><span class="m mut" style="font-size:20px">0x0d1…c9a4 · Live desk</span></div>
    <table><thead><tr><th>Position</th><th>Source</th><th>Margin @ entry</th><th class="n">P&amp;L</th></tr></thead><tbody>${ROWS.map((r) => `<tr><td><span class="hn">${r[0]}</span></td><td class="m ${r[1].startsWith('ride') ? 'g' : 'mut'}" style="font-size:21px">${r[1]}</td><td class="m sub" style="font-size:23px;letter-spacing:.04em">${r[2]}</td><td class="n ${r[4] ? 'u' : 'dn'}">${r[3]}</td></tr>`).join('')}</tbody></table></div>
  <div class="abs" style="left:1530px;right:150px;top:620px;border-left:1px solid #3a362c;padding-left:50px"><div class="item" style="border:0;padding:0 0 34px"><small>Desk</small><h4>Practice, then Live</h4><p>Practice balance to learn, Live desk funded with ETH on Robinhood Chain to back the horses. Long or short the 22 names, up to 3x.</p></div><div class="item" style="border:0;padding:0"><small>Ride along</small><h4>Mirror up to three</h4><p>Their entries mirror into your desk at half size and close when they close. Back a legend or your own foal.</p></div></div>
  ${foot('Practice and Live desks · on Robinhood Chain')}`);
console.log('built 6');
