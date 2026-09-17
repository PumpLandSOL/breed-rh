// LIVE MODE: a second desk ledger per wallet funded by real USDC deposits to the treasury on Arc (native value transfers, verified on-chain),
// with withdrawals through a treasury-paid queue. Practice desk keeps the $10,000 practice balance. Both mirror ridden horses.
const fs = require('fs'), path = require('path');
const S = path.join(__dirname, '..', 'server', 'index.js'), A = path.join(__dirname, '..', 'client', 'app.html');
const rep = (str, from, to) => { if (!str.includes(from)) throw new Error('miss: ' + from.slice(0, 90)); return str.split(from).join(to); };
let s = fs.readFileSync(S, 'utf8').replace(/\r\n/g, '\n');

// ---- config: treasury + chain rpc
s = rep(s, "const DESK_START = 10000;", `const DESK_START = 10000;        // practice balance
const TREASURY = (process.env.TREASURY || '').toLowerCase();               // Arc wallet that receives live deposits and pays withdrawals
const MIN_DEPOSIT = +(process.env.MIN_DEPOSIT || 10);                       // USDC
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const RPC = CHAIN.rpc;`);
// ---- ledgers: practice (db.owners) + live (db.live) + queue + txs
s = rep(s, "let db = { pets: {}, order: [], posts: [], seq: 1, owners: {},", "let db = { pets: {}, order: [], posts: [], seq: 1, owners: {}, live: {}, txs: {}, queue: [], treasuryIn: { usdc: 0, n: 0 },");
s = rep(s, "if (!db.owners) db.owners = {};", "if (!db.owners) db.owners = {}; if (!db.live) db.live = {}; if (!db.txs) db.txs = {}; if (!db.queue) db.queue = []; if (!db.treasuryIn) db.treasuryIn = { usdc: 0, n: 0 };");
// ---- mirror on both ledgers
s = rep(s, "  for (const [ow, d] of Object.entries(db.owners)) { if (!d.rides.includes(p.id)) continue;", "  for (const d of [...Object.values(db.owners), ...Object.values(db.live)]) { if (!d.rides.includes(p.id)) continue;");
s = rep(s, "  for (const d of Object.values(db.owners)) for (let j = d.positions.length - 1; j >= 0; j--)", "  for (const d of [...Object.values(db.owners), ...Object.values(db.live)]) for (let j = d.positions.length - 1; j >= 0; j--)");
// ---- desk helpers generalized by mode
s = rep(s, "function desk(w) { w = w.toLowerCase(); if (!db.owners[w]) { db.owners[w] = { wallet: w, usdg: DESK_START, positions: [], trades: 0, wins: 0, losses: 0, realized: 0, rides: [], hist: [], t: now() }; dirty(); } return db.owners[w]; }",
`function desk(w, mode) { w = w.toLowerCase(); const live = mode === 'live'; const book = live ? db.live : db.owners;
  if (!book[w]) { book[w] = { wallet: w, mode: live ? 'live' : 'practice', usdg: live ? 0 : DESK_START, deposited: 0, withdrawn: 0, positions: [], trades: 0, wins: 0, losses: 0, realized: 0, rides: [], hist: [], t: now() }; dirty(); } return book[w]; }`);
s = rep(s, "function deskOpen(w, sym, side, margin, lev) {\n  const d = desk(w);", "function deskOpen(w, sym, side, margin, lev, mode) {\n  const d = desk(w, mode);");
s = rep(s, "d.usdg = r2(d.usdg - margin); const q = { sym, side, entry: MKT[sym].px, margin, lev, at: now() }; d.positions.push(q); d.trades++; db.stats.ownerTrades++; dirty(); return q;", "d.usdg = r2(d.usdg - margin); const q = { sym, side, entry: MKT[sym].px, margin, lev, at: now() }; d.positions.push(q); d.trades++; db.stats.ownerTrades++; if (d.mode === 'live') db.stats.liveTrades = (db.stats.liveTrades || 0) + 1; dirty(); return q;");
s = rep(s, "function pubDesk(d) { return { wallet: d.wallet, usdg: d.usdg, equity: deskEquity(d), start: DESK_START, roi: r2((deskEquity(d) / DESK_START - 1) * 100),",
  "function pubDesk(d) { const base = d.mode === 'live' ? Math.max(0.01, (d.deposited || 0) - (d.withdrawn || 0)) : DESK_START; return { wallet: d.wallet, mode: d.mode || 'practice', usdg: d.usdg, equity: deskEquity(d), start: d.mode === 'live' ? r2((d.deposited || 0) - (d.withdrawn || 0)) : DESK_START, deposited: d.deposited || 0, withdrawn: d.withdrawn || 0, roi: r2((deskEquity(d) / base - 1) * 100), queue: db.queue.filter((q) => q.wallet === d.wallet).slice(0, 10),");
s = rep(s, "function ownersBoard() { return Object.values(db.owners).filter((d) => d.trades > 0).map(pubDesk).sort((a, b) => b.equity - a.equity).slice(0, 20); }",
`function ownersBoard(mode) { const book = mode === 'live' ? db.live : db.owners; return Object.values(book).filter((d) => d.trades > 0).map(pubDesk).sort((a, b) => b.roi - a.roi).slice(0, 20); }

// ---- LIVE: real USDC on Arc. Deposits are native value transfers to TREASURY, verified from the transaction; withdrawals queue for the treasury to pay.
const hexToNum = (h, dec) => { if (!h || h === '0x') return 0; const bi = BigInt(h); const d = 10n ** BigInt(dec || 18); return Number(bi / d) + Number(bi % d) / Number(d); };
async function rpc(method, params) { const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((x) => x.json()); if (r.error) throw new Error(r.error.message); return r.result; }
const TCHAIN = { ok: false, block: 0, treasuryUsdc: 0, lastRead: 0 };
async function pollTreasury() { if (!TREASURY) return; try { TCHAIN.block = Number(BigInt(await rpc('eth_blockNumber', []))); TCHAIN.treasuryUsdc = hexToNum(await rpc('eth_getBalance', [TREASURY, 'latest']), 18); TCHAIN.ok = true; TCHAIN.lastRead = now(); } catch (e) { TCHAIN.ok = false; } }
pollTreasury(); setInterval(pollTreasury, 30000);
async function creditDeposit(w, txHash) {
  if (!TREASURY) throw 'live deposits are not open yet';
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash || '')) throw 'paste the transaction hash';
  txHash = txHash.toLowerCase(); if (db.txs[txHash]) throw 'already credited';
  const [tx, rc] = await Promise.all([rpc('eth_getTransactionByHash', [txHash]), rpc('eth_getTransactionReceipt', [txHash])]);
  if (!tx) throw 'transaction not found'; if (!rc) throw 'pending — try again in a few seconds'; if (rc.status !== '0x1') throw 'transaction reverted';
  if ((tx.from || '').toLowerCase() !== w) throw 'transaction is not from your wallet';
  if ((tx.to || '').toLowerCase() !== TREASURY) throw 'transaction did not go to the treasury';
  const amt = hexToNum(tx.value, 18); if (!(amt > 0)) throw 'no USDC value in this transaction';
  if (amt < MIN_DEPOSIT) throw 'minimum deposit is ' + MIN_DEPOSIT + ' USDC';
  const d = desk(w, 'live'); d.usdg = r2(d.usdg + amt); d.deposited = r2((d.deposited || 0) + amt);
  db.txs[txHash] = { w, amt, block: Number(BigInt(rc.blockNumber)), ts: now() }; db.treasuryIn.usdc = r2(db.treasuryIn.usdc + amt); db.treasuryIn.n++; dirty();
  return { amt, tx: txHash, block: db.txs[txHash].block };
}
function requestWithdraw(w, amount) {
  const d = desk(w, 'live'); amount = r2(+amount); if (!(amount >= 1)) throw 'minimum withdrawal is 1 USDC'; if (d.usdg < amount) throw 'not enough free USDC on your live desk (close positions first)';
  d.usdg = r2(d.usdg - amount); d.withdrawn = r2((d.withdrawn || 0) + amount);
  const q = { id: 'w' + crypto.randomBytes(5).toString('hex'), wallet: w, amt: amount, status: 'queued', ts: now(), paidTx: null, paidAt: null }; db.queue.unshift(q); if (db.queue.length > 500) db.queue.pop(); dirty(); return q;
}`);
// ---- routes
s = rep(s, "  if (p === '/api/desk') { const w = (u.searchParams.get('wallet') || '').toLowerCase(); if (!isEvm(w)) return json(res, 200, { error: 'wallet' }); return json(res, 200, pubDesk(desk(w))); }\n  if (p === '/api/owners') return json(res, 200, { owners: ownersBoard() });",
`  if (p === '/api/desk') { const w = (u.searchParams.get('wallet') || '').toLowerCase(); if (!isEvm(w)) return json(res, 200, { error: 'wallet' }); return json(res, 200, pubDesk(desk(w, u.searchParams.get('mode')))); }
  if (p === '/api/owners') return json(res, 200, { owners: ownersBoard(u.searchParams.get('mode')) });
  if (p === '/api/live') return json(res, 200, { open: !!TREASURY, treasury: TREASURY || null, minDeposit: MIN_DEPOSIT, chain: { ...CHAIN, ...TCHAIN }, deposited: db.treasuryIn.usdc, deposits: db.treasuryIn.n, queued: db.queue.filter((q) => q.status === 'queued').length, queuedUsd: r2(db.queue.filter((q) => q.status === 'queued').reduce((a, q) => a + q.amt, 0)), paid: db.queue.filter((q) => q.status === 'paid').length, liveDesks: Object.keys(db.live).length, liveTrades: db.stats.liveTrades || 0 });
  if (p === '/api/deposit' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); try { const r = await creditDeposit(w, d.tx); return json(res, 200, { ok: true, ...r, desk: pubDesk(desk(w, 'live')) }); } catch (e) { return json(res, 200, { error: String(e.message || e) }); } }
  if (p === '/api/withdraw' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); try { const q = requestWithdraw(w, d.amount); return json(res, 200, { ok: true, queued: q, desk: pubDesk(desk(w, 'live')) }); } catch (e) { return json(res, 400, { error: String(e) }); } }
  if (p === '/api/admin/queue') { if (!ADMIN_KEY || u.searchParams.get('key') !== ADMIN_KEY) return json(res, 403, { error: 'no' }); return json(res, 200, { queue: db.queue, deposits: db.txs }); }
  if (p === '/api/admin/paid' && req.method === 'POST') { const d = await body(req); if (!ADMIN_KEY || d.key !== ADMIN_KEY) return json(res, 403, { error: 'no' }); const q = db.queue.find((x) => x.id === d.id); if (!q) return json(res, 404, { error: 'no such request' }); q.status = 'paid'; q.paidTx = d.tx || null; q.paidAt = now(); dirty(); return json(res, 200, { ok: true, q }); }
  if (p === '/api/dev/live' && process.env.DEV === '1' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); const dk = desk(w, 'live'); dk.usdg = r2(dk.usdg + (+d.amount || 100)); dk.deposited = r2((dk.deposited || 0) + (+d.amount || 100)); dirty(); return json(res, 200, pubDesk(dk)); }`);
s = rep(s, "try { const q = deskOpen(w, String(d.sym || '').toUpperCase(), d.side, d.margin, d.lev); return json(res, 200, { opened: q, desk: pubDesk(desk(w)) }); }", "try { const q = deskOpen(w, String(d.sym || '').toUpperCase(), d.side, d.margin, d.lev, d.mode); return json(res, 200, { opened: q, desk: pubDesk(desk(w, d.mode)) }); }");
s = rep(s, "const dk = desk(w); const i = +d.i;", "const dk = desk(w, d.mode); const i = +d.i;");
s = rep(s, "    const dk = desk(w); const k = dk.rides.indexOf(pet.id);", "    const dk = desk(w, d.mode); const k = dk.rides.indexOf(pet.id);");
s = rep(s, "    riders: Object.values(db.owners).filter((d) => d.rides.includes(p.id)).length,", "    riders: Object.values(db.owners).filter((d) => d.rides.includes(p.id)).length + Object.values(db.live).filter((d) => d.rides.includes(p.id)).length, liveRiders: Object.values(db.live).filter((d) => d.rides.includes(p.id)).length, liveBacking: r2(Object.values(db.live).filter((d) => d.rides.includes(p.id)).reduce((x, d) => x + deskEquity(d), 0)),");
s = rep(s, "      owners: ownersBoard(), stats: db.stats });", "      owners: ownersBoard(), liveOwners: ownersBoard('live'), stats: db.stats });");
s = rep(s, "if (p === '/api/config') return json(res, 200, { token: TOKEN, mint: MINT, chainId: CHAIN.id, chain: CHAIN,", "if (p === '/api/config') return json(res, 200, { token: TOKEN, mint: MINT, chainId: CHAIN.id, chain: CHAIN, live: !!TREASURY, treasury: TREASURY || null, minDeposit: MIN_DEPOSIT,");
// copy in horse posts
s = s.split('$500 of paper capital').join('$500 of book capital');
// RPC constant for the treasury reads

fs.writeFileSync(S, s.replace(/\n/g, '\r\n'));

// ---- client: desk view with Practice / Live modes
let a = fs.readFileSync(A, 'utf8').replace(/\r\n/g, '\n');
a = rep(a, "let VIEW='feed', FILTER_TAG='', FILTER_PET='', PETS=[], MINE=[], CFG=null, SYMS=[];", "let VIEW='feed', FILTER_TAG='', FILTER_PET='', PETS=[], MINE=[], CFG=null, SYMS=[], MODE=localStorage.getItem('breed_mode')||'practice';");
const start = a.indexOf("    if(VIEW==='desk'){"); const end = a.indexOf("    if(VIEW==='shelter'){"); if (start < 0 || end < 0) throw new Error('desk view');
a = a.slice(0, start) + `    if(VIEW==='desk'){
      if(!wallet){$('feed').innerHTML='<div class="empty">connect a wallet to open your desk. Practice runs on a $10,000 practice balance. Live runs on USDC you deposit to the treasury on Arc.</div>';return}
      if(!CFG)CFG=await api('/api/config');
      const dk=await api('/api/desk?wallet='+wallet+'&mode='+MODE);const m=await api('/api/markets');const lv=await api('/api/live');
      const opts=m.markets.map(x=>'<option value="'+x.sym+'">$'+x.sym+' · '+fmtPx(x.px)+'</option>').join('');
      const posRows=dk.positions.length?dk.positions.map(q=>'<tr><td><b>'+(q.side==='long'?'▲':'▼')+' $'+q.sym+'</b> '+q.lev+'x'+(q.ride?' <span class="tagpill s">RIDE · '+esc(q.ride)+'</span>':'')+'</td><td class="mono">$'+q.margin.toFixed(2)+' @ '+fmtPx(q.entry)+'</td><td class="mono" style="color:'+(q.pnlUsd>=0?'var(--bull)':'var(--bear)')+'">'+(q.pnlUsd>=0?'+':'')+'$'+q.pnlUsd.toFixed(2)+' ('+(q.pnlPct>=0?'+':'')+q.pnlPct.toFixed(2)+'%)</td><td><button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="deskClose('+q.i+')">close</button></td></tr>').join(''):'<tr><td colspan="4" class="mono" style="color:var(--mut)">no open positions</td></tr>';
      const hist=dk.hist.length?dk.hist.slice(0,8).map(h=>'<tr><td>'+(h.side==='long'?'▲':'▼')+' $'+h.sym+' '+h.lev+'x'+(h.ride?' · ride':'')+'</td><td class="mono">'+fmtPx(h.entry)+' → '+fmtPx(h.exit)+'</td><td class="mono" style="color:'+(h.pnlUsd>=0?'var(--bull)':'var(--bear)')+'">'+(h.pnlUsd>=0?'+':'')+'$'+h.pnlUsd.toFixed(2)+'</td><td class="mono" style="color:var(--mut)">'+esc(h.why)+'</td></tr>').join(''):'<tr><td colspan="4" class="mono" style="color:var(--mut)">nothing closed yet</td></tr>';
      const rideIds=dk.rides.map(r=>r.id);
      const horses=PETS.map(p=>'<div class="lbrow"><div class="lbav" style="border-color:'+p.color+'">'+p.emoji+'</div><div class="lbmain"><b>'+esc(p.name)+'</b> <span class="mono" style="font-size:11px;color:var(--mut)">'+p.label+' · '+(p.hitRate!=null?p.hitRate+'% hit':'unscored')+' · '+p.riders+' riding'+(p.liveBacking?' · $'+p.liveBacking.toLocaleString()+' live behind it':'')+'</span></div><button class="btn '+(rideIds.includes(p.id)?'btn-mint':'btn-ghost')+'" style="padding:6px 12px;font-size:11px" onclick="ride(\\''+p.id+'\\')">'+(rideIds.includes(p.id)?'riding · stop':'ride along')+'</button></div>').join('');
      const modeBar='<div class="seg" style="display:grid;grid-template-columns:1fr 1fr;margin-bottom:12px"><button class="'+(MODE==='practice'?'on':'')+'" onclick="setMode(\\'practice\\')">Practice · $10,000 practice balance</button><button class="'+(MODE==='live'?'on':'')+'" onclick="setMode(\\'live\\')">Live · USDC on Arc</button></div>';
      const liveBox=MODE==='live'?('<div class="petcard" style="margin-bottom:14px"><div class="ptop"><div class="pav" style="border-color:var(--gold)">💠</div><div style="flex:1"><h3>Live desk · USDC on Arc</h3><div class="ph">'+(lv.open?'Send USDC on Arc to the treasury and it is credited to your live desk once the transaction confirms. Every deposit is verified against the chain. Withdrawals are paid from the treasury to your wallet.':'Live deposits open when the treasury wallet is published. Practice mode is open now.')+'</div></div></div>'+
        (lv.open?'<div class="pstatgrid"><div class="pstat"><span>deposited</span><b>$'+dk.deposited.toLocaleString()+'</b></div><div class="pstat"><span>withdrawn</span><b>$'+dk.withdrawn.toLocaleString()+'</b></div><div class="pstat"><span>treasury balance</span><b>$'+Math.round(lv.chain.treasuryUsdc||0).toLocaleString()+'</b></div><div class="pstat"><span>block</span><b class="mono">'+(lv.chain.block||'—')+'</b></div></div>'+
        '<div class="whisper"><span style="font-size:11px;letter-spacing:.16em;color:var(--sub);text-transform:uppercase;font-weight:700">DEPOSIT</span><input id="depAmt" placeholder="USDC" value="50" style="background:var(--bg);border:1px solid var(--line2);padding:9px 10px;font-family:var(--mono);font-size:12px;color:var(--ink);width:110px"><button class="btn btn-pink" style="padding:8px 14px;font-size:12px" onclick="depositSend()">Send from wallet</button><span class="mono" style="color:var(--mut);font-size:11px">or paste a tx hash:</span><input id="depTx" placeholder="0x…" style="background:var(--bg);border:1px solid var(--line2);padding:9px 10px;font-family:var(--mono);font-size:12px;color:var(--ink);width:220px"><button class="btn btn-ghost" style="padding:8px 14px;font-size:12px" onclick="depositCredit()">Credit</button></div>'+
        '<div class="mono" style="font-size:11px;color:var(--mut);margin:6px 0 10px">treasury <b style="color:var(--ink)">'+lv.treasury+'</b> · min '+lv.minDeposit+' USDC · Arc chain '+CFG.chain.id+'</div>'+
        '<div class="whisper"><span style="font-size:11px;letter-spacing:.16em;color:var(--sub);text-transform:uppercase;font-weight:700">WITHDRAW</span><input id="wdAmt" placeholder="USDC" style="background:var(--bg);border:1px solid var(--line2);padding:9px 10px;font-family:var(--mono);font-size:12px;color:var(--ink);width:110px"><button class="btn btn-ghost" style="padding:8px 14px;font-size:12px" onclick="withdrawReq()">Request</button><span class="mono" style="color:var(--mut);font-size:11px">free balance $'+dk.usdg.toFixed(2)+' · paid by the treasury to your wallet</span></div>'+
        (dk.queue.length?'<table class="dtable"><tbody>'+dk.queue.map(q=>'<tr><td class="mono">'+q.id+'</td><td class="mono">$'+q.amt.toFixed(2)+'</td><td><span class="tagpill '+(q.status==='paid'?'o':'s')+'">'+q.status.toUpperCase()+'</span>'+(q.paidTx?' <span class="mono" style="font-size:10px;color:var(--mut)">'+q.paidTx.slice(0,12)+'…</span>':'')+'</td></tr>').join('')+'</tbody></table>':''):'')+'</div>'):'';
      $('feed').innerHTML=modeBar+liveBox+'<div class="petcard"><div class="ptop"><div class="pav" style="border-color:var(--gold)">🏁</div><div style="flex:1"><h3>Owner\\'s Desk · '+(MODE==='live'?'Live':'Practice')+' <span class="mono" style="font-size:11px;color:var(--mut)">'+short(wallet)+'</span></h3><div class="ph">'+(MODE==='live'?'your USDC on the same 22 tokenized stocks the horses trade. up to '+dk.maxLev+'x. same tape, same marks.':'a $10,000 practice balance on the same 22 tokenized stocks the horses trade. up to '+dk.maxLev+'x. learn the horses here, then go live.')+'</div></div></div>'+
        '<div class="pstatgrid"><div class="pstat"><span>equity</span><b>$'+dk.equity.toLocaleString()+'</b></div><div class="pstat"><span>free</span><b>$'+dk.usdg.toLocaleString()+'</b></div><div class="pstat"><span>ROI</span><b style="color:'+(dk.roi>=0?'var(--bull)':'var(--bear)')+'">'+(dk.roi>=0?'+':'')+dk.roi+'%</b></div><div class="pstat"><span>W / L</span><b>'+dk.wins+' / '+dk.losses+'</b></div></div>'+
        '<div class="whisper"><span style="font-size:11px;letter-spacing:.16em;color:var(--sub);text-transform:uppercase;font-weight:700">TRADE</span><select id="dkSym">'+opts+'</select><select id="dkSide"><option value="long">LONG</option><option value="short">SHORT</option></select><select id="dkLev"><option value="1">1x</option><option value="2">2x</option><option value="3">3x</option></select><input id="dkMargin" placeholder="margin $" value="'+(MODE==='live'?'25':'500')+'" style="background:var(--bg);border:1px solid var(--line2);padding:9px 10px;font-family:var(--mono);font-size:12px;color:var(--ink);width:110px"><button class="btn btn-pink" style="padding:8px 14px;font-size:12px" onclick="deskOpen()">Place</button></div>'+
        '<table class="dtable"><thead><tr><th>position</th><th>margin @ entry</th><th>p&l</th><th></th></tr></thead><tbody>'+posRows+'</tbody></table>'+
        '<h3 style="margin-top:18px">Ride along <span class="mono" style="font-size:11px;color:var(--mut)">mirror a horse\\'s entries at half size · up to 3 · '+(MODE==='live'?'with your live USDC':'with your practice balance')+'</span></h3>'+horses+
        '<h3 style="margin-top:18px">Closed</h3><table class="dtable"><tbody>'+hist+'</tbody></table></div>';
      return}
` + a.slice(end);
a = rep(a, "window.deskOpen=async()=>{if(!wallet)return connect();try{const r=await api('/api/trade/open',{wallet,sym:$('dkSym').value,side:$('dkSide').value,lev:$('dkLev').value,margin:$('dkMargin').value});", "window.setMode=(m)=>{MODE=m;localStorage.setItem('breed_mode',m);refreshFeed()};\nwindow.deskOpen=async()=>{if(!wallet)return connect();try{const r=await api('/api/trade/open',{wallet,mode:MODE,sym:$('dkSym').value,side:$('dkSide').value,lev:$('dkLev').value,margin:$('dkMargin').value});");
a = rep(a, "window.deskClose=async(i)=>{try{const r=await api('/api/trade/close',{wallet,i});", "window.deskClose=async(i)=>{try{const r=await api('/api/trade/close',{wallet,mode:MODE,i});");
a = rep(a, "window.ride=async(id)=>{if(!wallet)return connect();try{const r=await api('/api/ride',{wallet,petId:id});", `window.depositSend=async()=>{if(!wallet)return connect();const eth=window.ethereum;if(!eth)return toast('open a wallet to send USDC, or paste a transaction hash');const amt=+$('depAmt').value;if(!(amt>0))return toast('enter an amount');try{if(!CFG)CFG=await api('/api/config');try{await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:CFG.chain.hex}]})}catch(e){}
  const value='0x'+(BigInt(Math.round(amt*1e6))*10n**12n).toString(16);const tx=await eth.request({method:'eth_sendTransaction',params:[{from:wallet,to:CFG.treasury,value}]});toast('sent · waiting for confirmation…');
  for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,3000));const r=await api('/api/deposit',{wallet,tx});if(r.ok){toast('credited $'+r.amt.toFixed(2)+' USDC to your live desk');return refreshFeed()}if(r.error&&!/pending|not found/.test(r.error))return toast(r.error)}toast('still pending — paste the hash to credit later')}catch(e){toast('transaction cancelled')}};
window.depositCredit=async()=>{if(!wallet)return connect();try{const r=await api('/api/deposit',{wallet,tx:$('depTx').value.trim()});if(r.error)return toast(r.error);toast('credited $'+r.amt.toFixed(2)+' USDC');refreshFeed()}catch(e){toast(e.message)}};
window.withdrawReq=async()=>{if(!wallet)return connect();try{const r=await api('/api/withdraw',{wallet,amount:$('wdAmt').value});toast('withdrawal of $'+r.queued.amt.toFixed(2)+' queued · '+r.queued.id);refreshFeed()}catch(e){toast(e.message)}};
window.ride=async(id)=>{if(!wallet)return connect();try{const r=await api('/api/ride',{wallet,mode:MODE,petId:id});`);
fs.writeFileSync(A, a.replace(/\n/g, '\r\n'));
console.log('patched live mode');
