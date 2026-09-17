// STABLE patch over the TAME engine: Yahoo tape (Pyth is gated), rename, horse breeds, paddock legends, Owner's Desk + ride-along.
const fs = require('fs'), path = require('path');
const S = path.join(__dirname, '..', 'server', 'index.js');
let s = fs.readFileSync(S, 'utf8').replace(/\r\n/g, '\n');
const rep = (from, to, all) => { if (!s.includes(from)) throw new Error('miss: ' + from.slice(0, 80)); s = all ? s.split(from).join(to) : s.replace(from, () => to); };

// ---- constants
rep("const PORT = +(process.env.PORT || 8172);", "const PORT = +(process.env.PORT || 8204);");
rep("const TOKEN = 'TAME';", "const TOKEN = 'STABLE';");
rep("const MINT = process.env.TAME_MINT || '0x050b9B4f75F3B680885e99da3c38089c20D94278';", "const MINT = process.env.STABLE_MINT || '';\nconst DESK_START = 10000;        // paper USDG on every Owner's Desk\nconst DESK_MAX_LEV = 3;");

// ---- Yahoo tape replaces Pyth
const a = s.indexOf("// ---------- markets: 22 tokenized stocks"); const b = s.indexOf("// ---------- species ----------");
s = s.slice(0, a) + `// ---------- markets: 22 tokenized stocks (RWAs) off the exchange tape (Yahoo chart API, extended hours) ----------
const YF = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36';
const FEED = ['SPY', 'QQQ', 'GLD', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD', 'INTC', 'DIS', 'UBER', 'COIN', 'MSTR', 'HOOD', 'CRCL', 'GME', 'AMC', 'PLTR'];
const MKT = {};
for (const sym of FEED) MKT[sym] = { px: 0, hist: [] };
const SYMS = Object.keys(MKT);
let PRICE_OK = false;

function pushPx(sym, px) {
  if (!(px > 0)) return;
  const m = MKT[sym];
  m.px = px; m.hist.push(px);
  if (m.hist.length > 400) m.hist.shift();
  const back = (n) => m.hist[Math.max(0, m.hist.length - 1 - n)];
  m.chg5m = back(20) ? (px / back(20) - 1) * 100 : 0;      // ~15s cadence
  m.chg30m = back(120) ? (px / back(120) - 1) * 100 : 0;
}
async function pollTape() {
  let ok = 0;
  for (const sym of FEED) {
    try {
      const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 9000);
      const r = await fetch(YF + sym + '?range=1d&interval=1m&includePrePost=true', { headers: { accept: 'application/json', 'user-agent': UA }, signal: ac.signal }); clearTimeout(tm);
      if (!r.ok) continue; const res = (await r.json()).chart.result[0]; const m = res.meta; let v = +m.regularMarketPrice, ts = m.regularMarketTime * 1000;
      const T = res.timestamp || [], C = (res.indicators.quote[0] && res.indicators.quote[0].close) || [];
      for (let i = C.length - 1; i >= 0; i--) if (C[i] != null && T[i] * 1000 > ts) { v = +C[i]; ts = T[i] * 1000; break; }
      if (v > 0) { pushPx(sym, v); MKT[sym].ts = ts; ok++; }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 70));
  }
  if (ok >= FEED.length - 3) PRICE_OK = true;
}
pollTape();
setInterval(pollTape, 15000);

` + s.slice(b);

// ---- breeds (keys kept for the engine; labels/emoji/blurbs are horses now)
rep("dog:     { label: 'DOG',     emoji: '🐕',", "dog:     { label: 'THOROUGHBRED', emoji: '🏇',");
rep("'loyal momentum chaser. longs whatever is running. actually listens to you.'", "'bred to run. longs whatever is breaking away from the pack. actually listens to the jockey.'");
rep("cat:     { label: 'CAT',     emoji: '🐈',", "cat:     { label: 'MUSTANG', emoji: '🐎',");
rep("'contrarian. fades every pump out of spite. obeys nobody, especially you.'", "'never broken. fades every pump out of spite. obeys nobody, least of all the owner.'");
rep("hamster: { label: 'HAMSTER', emoji: '🐹',", "hamster: { label: 'PONY', emoji: '🦄',");
rep("'degen scalper on the wheel. 3x leverage, zero chill, tiny heart rate of 400bpm.'", "'tiny legs, 3x leverage, zero chill. scalps everything, rests never.'");
rep("turtle:  { label: 'TURTLE',  emoji: '🐢',", "turtle:  { label: 'CLYDESDALE', emoji: '🐴',");
rep("'zen index enjoyer. buys $SPY and $GLD, naps between candles. cannot be rushed.'", "'the draft horse. pulls $SPY and $GLD at a walk, eats between candles. cannot be rushed.'");
rep("parrot:  { label: 'PARROT',  emoji: '🦜',", "parrot:  { label: 'ARABIAN', emoji: '🐫',");
rep("'repeats whatever the feed is saying, but with size. herd animal, proud of it.'", "'runs where the herd runs, but with size. reads the rail and follows the loudest hoofbeats.'");
s = s.replace(/emoji: '🐫'/, "emoji: '🫏'");   // arabian: use the donkey glyph until unicode gives us a better horse

// ---- paddock legends
rep("{ id: 'rex',      name: 'REX',", "{ id: 'rex',      name: 'SECRETARIAT',");
rep("{ id: 'whiskers', name: 'WHISKERS',", "{ id: 'whiskers', name: 'MUSTANGSALLY',");
s = s.replace(/name: 'NIBBLES'/, "name: 'POCKET'").replace(/name: 'SHELLY'/, "name: 'BIGRED'").replace(/name: 'ECHO'/, "name: 'ZENYATTA'").replace(/name: 'PIP'/, "name: 'SEABISCUIT'");
rep("'_shelter'", "'_paddock'");
s = s.split('shelter').join('paddock').split('Shelter').join('Paddock').split('SHELTER').join('PADDOCK');
s = s.split('cracks out of the egg').join('trots out of the foaling barn').split('has hatched').join('is foaled').split('species: ').join('breed: ');
s = s.split("'TAME on :'").join("'STABLE on :'").split('hatch it. feed it. tame it. it trades.').join('foal it. feed it. break it. it trades.');

// ---- Owner's Desk: humans trade the same 22 stocks; ride-along mirrors a horse's entries
rep("let db = { pets: {}, order: [], posts: [], seq: 1, stats: { posts: 0, trades: 0, calls: 0, hits: 0, hatched: 0 } };",
    "let db = { pets: {}, order: [], posts: [], seq: 1, owners: {}, stats: { posts: 0, trades: 0, calls: 0, hits: 0, hatched: 0, ownerTrades: 0, rides: 0 } };");
rep("try { db = Object.assign(db, JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))); } catch (e) {}",
    "try { db = Object.assign(db, JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))); } catch (e) {}\nif (!db.owners) db.owners = {}; if (db.stats.ownerTrades == null) { db.stats.ownerTrades = 0; db.stats.rides = 0; }");
// mirror on horse entry / exit
rep("  p.trades++; db.stats.trades++;\n  mkPost(p.id, voice(p, obeyed ? 'obey' : 'open',",
    "  p.trades++; db.stats.trades++;\n  for (const [ow, d] of Object.entries(db.owners)) { if (!d.rides.includes(p.id)) continue; const mg = r2(Math.min(d.usdg * g.sizeFrac * 0.5, d.usdg)); if (mg < 10) continue; d.usdg = r2(d.usdg - mg); d.positions.push({ sym, side, entry: m.px, margin: mg, lev, at: now(), ride: p.id }); d.trades++; db.stats.rides++; }\n  mkPost(p.id, voice(p, obeyed ? 'obey' : 'open',");
rep("  p.positions.splice(i, 1);\n  if (pnl >= 0) p.wins++; else p.losses++;",
    "  p.positions.splice(i, 1);\n  if (pnl >= 0) p.wins++; else p.losses++;\n  for (const d of Object.values(db.owners)) for (let j = d.positions.length - 1; j >= 0; j--) { const q = d.positions[j]; if (q.ride === p.id && q.sym === pos.sym && q.side === pos.side) deskClose(d, j, 'ride · ' + why); }");
// desk functions + projections, placed before pubPet
rep("// ---------- projections ----------\nfunction pubPet(p) {", `// ---------- Owner's Desk ----------
function desk(w) { w = w.toLowerCase(); if (!db.owners[w]) { db.owners[w] = { wallet: w, usdg: DESK_START, positions: [], trades: 0, wins: 0, losses: 0, realized: 0, rides: [], hist: [], t: now() }; dirty(); } return db.owners[w]; }
function deskEquity(d) { let eq = d.usdg; for (const q of d.positions) { const m = MKT[q.sym]; if (!m || !(m.px > 0)) { eq += q.margin; continue; } const ret = q.side === 'long' ? m.px / q.entry - 1 : 1 - m.px / q.entry; eq += q.margin * (1 + ret * q.lev); } return r2(eq); }
function deskOpen(w, sym, side, margin, lev) {
  const d = desk(w); if (!MKT[sym] || !(MKT[sym].px > 0)) throw 'no live print for ' + sym; side = side === 'short' ? 'short' : 'long';
  margin = r2(+margin); lev = Math.max(1, Math.min(DESK_MAX_LEV, Math.round(+lev || 1))); if (!(margin >= 10)) throw 'min $10 margin'; if (d.usdg < margin) throw 'not enough USDG on the desk';
  if (d.positions.length >= 8) throw 'max 8 open positions';
  d.usdg = r2(d.usdg - margin); const q = { sym, side, entry: MKT[sym].px, margin, lev, at: now() }; d.positions.push(q); d.trades++; db.stats.ownerTrades++; dirty(); return q;
}
function deskClose(d, i, why) {
  const q = d.positions[i]; const m = MKT[q.sym]; if (!m || !(m.px > 0)) throw 'no live print';
  const ret = (q.side === 'long' ? m.px / q.entry - 1 : 1 - m.px / q.entry) * q.lev; const pnlUsd = r2(q.margin * ret);
  d.usdg = r2(d.usdg + q.margin * (1 + ret)); d.positions.splice(i, 1); if (pnlUsd >= 0) d.wins++; else d.losses++; d.realized = r2((d.realized || 0) + pnlUsd);
  d.hist.unshift({ sym: q.sym, side: q.side, lev: q.lev, margin: q.margin, entry: r6(q.entry), exit: r6(m.px), pnlUsd, pnlPct: r2(ret * 100), why, ride: q.ride || null, t: now() }); if (d.hist.length > 60) d.hist.pop(); dirty(); return d.hist[0];
}
function pubDesk(d) { return { wallet: d.wallet, usdg: d.usdg, equity: deskEquity(d), start: DESK_START, roi: r2((deskEquity(d) / DESK_START - 1) * 100), trades: d.trades, wins: d.wins, losses: d.losses, realized: d.realized || 0, maxLev: DESK_MAX_LEV,
  rides: d.rides.map((id) => ({ id, name: db.pets[id] ? db.pets[id].name : id, emoji: db.pets[id] ? SPECIES[db.pets[id].species].emoji : '' })),
  positions: d.positions.map((q, i) => ({ i, sym: q.sym, side: q.side, lev: q.lev, margin: q.margin, entry: r6(q.entry), ride: q.ride ? (db.pets[q.ride] ? db.pets[q.ride].name : q.ride) : null, at: q.at,
    pnlPct: MKT[q.sym] && MKT[q.sym].px ? r2((q.side === 'long' ? MKT[q.sym].px / q.entry - 1 : 1 - MKT[q.sym].px / q.entry) * q.lev * 100) : 0,
    pnlUsd: MKT[q.sym] && MKT[q.sym].px ? r2(q.margin * (q.side === 'long' ? MKT[q.sym].px / q.entry - 1 : 1 - MKT[q.sym].px / q.entry) * q.lev) : 0 })), hist: d.hist.slice(0, 20) }; }
function ownersBoard() { return Object.values(db.owners).filter((d) => d.trades > 0).map(pubDesk).sort((a, b) => b.equity - a.equity).slice(0, 20); }

// ---------- projections ----------
function pubPet(p) {`);
rep("    careReady: Object.fromEntries(Object.keys(CARE).map((k) => [k, Math.max(0, ((p.care[k] || 0) + CARE[k].cd) - now())])) };",
    "    riders: Object.values(db.owners).filter((d) => d.rides.includes(p.id)).length,\n    careReady: Object.fromEntries(Object.keys(CARE).map((k) => [k, Math.max(0, ((p.care[k] || 0) + CARE[k].cd) - now())])) };");
// routes
rep("  if (p === '/api/hatch' && req.method === 'POST') {", `  if (p === '/api/desk') { const w = (u.searchParams.get('wallet') || '').toLowerCase(); if (!isEvm(w)) return json(res, 200, { error: 'wallet' }); return json(res, 200, pubDesk(desk(w))); }
  if (p === '/api/owners') return json(res, 200, { owners: ownersBoard() });
  if (p === '/api/trade/open' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' });
    try { const q = deskOpen(w, String(d.sym || '').toUpperCase(), d.side, d.margin, d.lev); return json(res, 200, { opened: q, desk: pubDesk(desk(w)) }); } catch (e) { return json(res, 400, { error: String(e) }); } }
  if (p === '/api/trade/close' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); const dk = desk(w); const i = +d.i;
    if (!(i >= 0 && i < dk.positions.length)) return json(res, 400, { error: 'no such position' }); try { const c = deskClose(dk, i, 'manual'); return json(res, 200, { closed: c, desk: pubDesk(dk) }); } catch (e) { return json(res, 400, { error: String(e) }); } }
  if (p === '/api/ride' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); const pet = db.pets[d.petId]; if (!pet) return json(res, 400, { error: 'no such horse' });
    const dk = desk(w); const k = dk.rides.indexOf(pet.id); if (k >= 0) dk.rides.splice(k, 1); else { if (dk.rides.length >= 3) return json(res, 400, { error: 'you can ride at most 3 horses' }); dk.rides.push(pet.id); mkPost(pet.id, 'a new owner is riding along on my book. every entry I make, they mirror at half size. no pressure. ' + SPECIES[pet.species].emoji); }
    dirty(); return json(res, 200, { riding: k < 0, desk: pubDesk(dk) }); }
  if (p === '/api/hatch' && req.method === 'POST') {`);
rep("      stats: db.stats });", "      owners: ownersBoard(), stats: db.stats });");
fs.writeFileSync(S, s.replace(/\n/g, '\r\n'));
console.log('patched server');
