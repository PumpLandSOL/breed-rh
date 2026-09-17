// STABLE E2E: tape (Yahoo), breeds relabeled, foal, desk open/close, ride-along mirror on horse entry + exit via whisper, leaderboard owners.
const B = 'http://localhost:8208'; const W = '0x00000000000000000000000000000000000000d1';
const get = (u) => fetch(B + u).then((r) => r.json()); const post = (u, b) => fetch(B + u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json());
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const near = (a, b, e) => Math.abs(a - b) <= e;
(async () => {
  const cfg = await get('/api/config'); ok('config: STABLE, breeds relabeled', cfg.token === 'BREED' && cfg.species.some((s) => s.label === 'THOROUGHBRED') && cfg.species.some((s) => s.label === 'MUSTANG'));
  const m = await get('/api/markets'); const live = m.markets.filter((x) => x.px > 0); ok('22 stocks priced off Yahoo', live.length >= 19, live.length + '/22');
  const pets = (await get('/api/pets')).pets; ok('paddock legends renamed', pets.some((p) => p.name === 'SECRETARIAT') && pets.every((p) => p.handle.endsWith('_paddock')) && pets[0].riders === 0);
  const h = await post('/api/hatch', { wallet: W, name: 'BOLT', species: 'dog' }); ok('foal BOLT (thoroughbred)', h.pet && h.pet.label === 'THOROUGHBRED' && h.pet.emoji === '🏇');
  const d0 = await get('/api/desk?wallet=' + W); ok('desk opens with 10k USDC', d0.usdg === 10000 && d0.equity === 10000 && d0.maxLev === 3);
  const bad = await post('/api/trade/open', { wallet: W, sym: 'NVDA', side: 'long', margin: 5, lev: 3 }); ok('min margin enforced', /min/.test(bad.error || ''));
  const lev = await post('/api/trade/open', { wallet: W, sym: 'NVDA', side: 'long', margin: 500, lev: 9 }); ok('lev clamped to 3, position open', lev.opened && lev.opened.lev === 3 && lev.desk.usdg === 9500 && lev.desk.positions.length === 1, 'entry ' + lev.opened.entry);
  const sh = await post('/api/trade/open', { wallet: W, sym: 'SPY', side: 'short', margin: 250, lev: 1 }); ok('short SPY 1x', sh.opened && sh.opened.side === 'short' && sh.desk.positions.length === 2);
  const cl = await post('/api/trade/close', { wallet: W, i: 0 }); ok('close NVDA → history + cash back', cl.closed && cl.closed.sym === 'NVDA' && cl.desk.positions.length === 1 && near(cl.desk.usdg, 9250 + 500 + cl.closed.pnlUsd, 0.05) && cl.desk.hist.length === 1);
  const r1 = await post('/api/ride', { wallet: W, petId: h.pet.id }); ok('ride along BOLT', r1.riding === true && r1.desk.rides[0].name === 'BOLT');
  const petR = await get('/api/pet?id=' + h.pet.id); ok('horse card counts riders', petR.riders === 1);
  // force an entry via whisper: raise tame so it obeys (train x N not needed: whisper roll vs tame 25+20=45%). Loop whispers until obeyed.
  let mirrored = null; for (let k = 0; k < 8 && !mirrored; k++) { await post('/api/whisper', { wallet: W, petId: h.pet.id, sym: 'AAPL', side: 'long' }); await sleep(11000); const d = await get('/api/desk?wallet=' + W); mirrored = d.positions.find((q) => q.ride === 'BOLT' && q.sym === 'AAPL'); }
  ok('horse entry mirrored onto desk (ride tag, half size)', !!mirrored && mirrored.side === 'long', mirrored && ('margin $' + mirrored.margin + ' lev ' + mirrored.lev));
  const p2 = await get('/api/pet?id=' + h.pet.id); ok('horse holds the AAPL position too', p2.positions.some((q) => q.sym === 'AAPL'));
  const lb = await get('/api/leaderboard'); ok('leaderboard includes owner desks', Array.isArray(lb.owners) && lb.owners.some((o) => o.wallet === W) && lb.stats.ownerTrades === 2 && lb.stats.rides >= 1);
  const r2 = await post('/api/ride', { wallet: W, petId: h.pet.id }); ok('dismount', r2.riding === false && r2.desk.rides.length === 0);
  const feed = await get('/api/feed'); ok('feed posts use horse vocabulary', feed.posts.some((p) => /foal|paddock|riding along/i.test(p.text)));
  console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exitCode = fails ? 1 : 0;
})();
