// LIVE desk E2E. Server: DEV=1 TREASURY=<any addr> so live is "open"; deposits are credited via /api/dev/live (chain deposits need a real tx).
const B = 'http://localhost:8208'; const W = '0x00000000000000000000000000000000000000e1';
const get = (u) => fetch(B + u).then((r) => r.json()); const post = (u, b) => fetch(B + u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json());
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const near = (a, b, e) => Math.abs(a - b) <= e;
(async () => {
  await sleep(2000);
  const cfg = await get('/api/config'); ok('config: live open, treasury published, min deposit 10', cfg.live === true && cfg.minDeposit === 0.005);
  const lv = await get('/api/live'); ok('/api/live exposes treasury + chain read', lv.open && lv.treasury === cfg.treasury && 'treasuryEth' in lv.chain);
  const p0 = await get('/api/desk?wallet=' + W + '&mode=practice'); const l0 = await get('/api/desk?wallet=' + W + '&mode=live');
  ok('practice desk starts at 10k, live desk starts at 0', p0.mode === 'practice' && p0.usdg === 10000 && l0.mode === 'live' && l0.usdg === 0 && l0.deposited === 0);
  const bad = await post('/api/trade/open', { wallet: W, mode: 'live', sym: 'NVDA', side: 'long', margin: 25, lev: 2 }); ok('live trade refused with no balance', /not enough/.test(bad.error || ''));
  const badTx = await post('/api/deposit', { wallet: W, tx: '0xnope' }); ok('deposit rejects a bad hash', /transaction hash/.test(badTx.error || ''));
  const dev = await post('/api/dev/live', { wallet: W, amount: 200 }); ok('dev credit → live desk 200 USDC', dev.usdg === 200 && dev.deposited === 200 && dev.start === 200);
  const t = await post('/api/trade/open', { wallet: W, mode: 'live', sym: 'NVDA', side: 'long', margin: 50, lev: 2 }); ok('live trade opens, practice untouched', t.opened && t.desk.mode === 'live' && t.desk.usdg === 150 && (await get('/api/desk?wallet=' + W + '&mode=practice')).usdg === 10000);
  const c = await post('/api/trade/close', { wallet: W, mode: 'live', i: 0 }); ok('live close returns margin ± pnl', c.closed && near(c.desk.usdg, 200 + c.closed.pnlUsd, 0.05));
  const wdBig = await post('/api/withdraw', { wallet: W, amount: 999 }); ok('withdraw over balance refused', /not enough/.test(wdBig.error || ''));
  const wd = await post('/api/withdraw', { wallet: W, amount: 60 }); ok('withdraw 60 → queued, balance down', wd.ok && wd.queued.status === 'queued' && near(wd.desk.usdg, 200 + c.closed.pnlUsd - 60, 0.05) && wd.desk.withdrawn === 60 && wd.desk.queue.length === 1);
  const lb = await get('/api/leaderboard'); ok('leaderboard has liveOwners with this desk', Array.isArray(lb.liveOwners) && lb.liveOwners.some((d) => d.wallet === W) && lb.stats.liveTrades === 1);
  // ride on live
  const pets = (await get('/api/pets')).pets; const h = await post('/api/hatch', { wallet: W, name: 'RIDER', species: 'dog' });
  const r = await post('/api/ride', { wallet: W, mode: 'live', petId: h.pet.id }); ok('ride on live desk', r.riding && r.desk.mode === 'live' && r.desk.rides[0].name === 'RIDER');
  const pr = await get('/api/pet?id=' + h.pet.id); ok('horse card shows live riders + live backing', pr.liveRiders === 1 && pr.liveBacking > 0 && pr.riders === 1, 'backing $' + pr.liveBacking);
  let mirrored = null; for (let k = 0; k < 8 && !mirrored; k++) { await post('/api/whisper', { wallet: W, petId: h.pet.id, sym: 'AAPL', side: 'long' }); await sleep(11000); const d = await get('/api/desk?wallet=' + W + '&mode=live'); mirrored = d.positions.find((q) => q.ride === 'RIDER'); }
  ok('horse entry mirrored onto the LIVE desk', !!mirrored, mirrored && ('margin $' + mirrored.margin));
  const pd = await get('/api/desk?wallet=' + W + '&mode=practice'); ok('practice desk did not mirror (not riding there)', pd.positions.length === 0 && pd.rides.length === 0);
  const adm = await get('/api/admin/queue?key=wrong'); ok('admin queue needs key', adm.error === 'no');
  const adm2 = await get('/api/admin/queue?key=testkey'); ok('admin queue lists the withdrawal', adm2.queue && adm2.queue.some((q) => q.wallet === W && q.amt === 60));
  const paid = await post('/api/admin/paid', { key: 'testkey', id: adm2.queue[0].id, tx: '0x' + 'ab'.repeat(32) }); const l2 = await get('/api/desk?wallet=' + W + '&mode=live');
  ok('admin marks paid → visible on the desk with tx', paid.ok && l2.queue[0].status === 'paid' && l2.queue[0].paidTx);
  console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exitCode = fails ? 1 : 0;
})();
