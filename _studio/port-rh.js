// BREED on Robinhood Chain: chain defaults → RH mainnet (4663, ETH gas); Live desk funded with ETH, credited in USD at the ETH mark; all Arc/USDC wording → Robinhood Chain/ETH.
const fs = require('fs'), path = require('path');
const F = (f) => path.join(__dirname, '..', f);
const R = (f) => fs.readFileSync(F(f), 'utf8').split(String.fromCharCode(13)).join('');
const Wr = (f, s) => fs.writeFileSync(F(f), s);
let SOFT = false; const rep = (s, a, b, f) => { if (!s.includes(a)) { if (SOFT) { console.log('already:', f); return s; } throw new Error(f + ' miss: ' + a.slice(0, 90)); } return s.split(a).join(b); };

// ── server ──
SOFT = true; let s = R('server/index.js');
s = rep(s, "// The agent-pet exchange on Arc:", "// The agent-pet exchange on Robinhood Chain:", 'hdr');
s = rep(s, "const PORT = +(process.env.PORT || 8204);", "const PORT = +(process.env.PORT || 8208);", 'port');
s = rep(s, "const CHAIN = { id: +(process.env.CHAIN_ID || 5042), hex: '0x' + (+(process.env.CHAIN_ID || 5042)).toString(16), name: process.env.CHAIN_NAME || 'Arc', rpc: process.env.CHAIN_RPC || 'https://rpc.mainnet.arc.io', explorer: process.env.CHAIN_EXPLORER || 'https://explorer.arc.io', currency: process.env.CHAIN_CURRENCY || 'USDC' };",
  "const CHAIN = { id: +(process.env.CHAIN_ID || 4663), hex: '0x' + (+(process.env.CHAIN_ID || 4663)).toString(16), name: process.env.CHAIN_NAME || 'Robinhood Chain', rpc: process.env.CHAIN_RPC || 'https://rpc.mainnet.chain.robinhood.com', explorer: process.env.CHAIN_EXPLORER || 'https://explorer.mainnet.chain.robinhood.com', currency: process.env.CHAIN_CURRENCY || 'ETH' };", 'chain');
s = rep(s, "const TREASURY = (process.env.TREASURY || '').toLowerCase();               // Arc wallet that receives live deposits and pays withdrawals",
  "const TREASURY = (process.env.TREASURY || '').toLowerCase();               // Robinhood Chain wallet that receives live ETH deposits and pays withdrawals", 'treasury');
s = rep(s, "const MIN_DEPOSIT = +(process.env.MIN_DEPOSIT || 10);                       // USDC",
  "const MIN_DEPOSIT = +(process.env.MIN_DEPOSIT || 0.005);                    // ETH", 'min');
s = rep(s, "// ---- LIVE: real USDC on Arc. Deposits are native value transfers to TREASURY, verified from the transaction; withdrawals queue for the treasury to pay.",
`// ---- LIVE: real ETH on Robinhood Chain. Deposits are native value transfers to TREASURY, verified from the transaction and credited in USD at the ETH mark at confirmation; withdrawals queue in USD with the ETH amount the treasury pays at that moment's mark.
const ETHPX = { px: 0, ts: 0 };
async function pollEth() { try { const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 8000); const r = await fetch(YF + 'ETH-USD?range=1d&interval=1m', { headers: { accept: 'application/json', 'user-agent': UA }, signal: ac.signal }); clearTimeout(tm); const j = await r.json(); const m = j.chart.result[0].meta; const px = +m.regularMarketPrice; if (px > 0) { ETHPX.px = px; ETHPX.ts = now(); } } catch (e) {} }
pollEth(); setInterval(pollEth, 30000);
const ethUsd = () => { if (!(ETHPX.px > 0)) throw 'ETH price unavailable right now, try again in a moment'; return ETHPX.px; };`, 'live hdr');
s = rep(s, "const TCHAIN = { ok: false, block: 0, treasuryUsdc: 0, lastRead: 0 };", "const TCHAIN = { ok: false, block: 0, treasuryEth: 0, lastRead: 0 };", 'tchain');
s = rep(s, "TCHAIN.treasuryUsdc = hexToNum(await rpc('eth_getBalance', [TREASURY, 'latest']), 18);", "TCHAIN.treasuryEth = hexToNum(await rpc('eth_getBalance', [TREASURY, 'latest']), 18);", 'tbal');
s = rep(s, "  const amt = hexToNum(tx.value, 18); if (!(amt > 0)) throw 'no USDC value in this transaction';\n  if (amt < MIN_DEPOSIT) throw 'minimum deposit is ' + MIN_DEPOSIT + ' USDC';\n  const d = desk(w, 'live'); d.usdg = r2(d.usdg + amt); d.deposited = r2((d.deposited || 0) + amt);\n  db.txs[txHash] = { w, amt, block: Number(BigInt(rc.blockNumber)), ts: now() }; db.treasuryIn.usdc = r2(db.treasuryIn.usdc + amt); db.treasuryIn.n++; dirty();\n  return { amt, tx: txHash, block: db.txs[txHash].block };",
`  const eth = hexToNum(tx.value, 18); if (!(eth > 0)) throw 'no ETH value in this transaction';
  if (eth < MIN_DEPOSIT) throw 'minimum deposit is ' + MIN_DEPOSIT + ' ETH';
  const px = ethUsd(); const amt = r2(eth * px);
  const d = desk(w, 'live'); d.usdg = r2(d.usdg + amt); d.deposited = r2((d.deposited || 0) + amt); d.depositedEth = +((d.depositedEth || 0) + eth).toFixed(6);
  db.txs[txHash] = { w, eth, px, amt, block: Number(BigInt(rc.blockNumber)), ts: now() }; db.treasuryIn.usdc = r2(db.treasuryIn.usdc + amt); db.treasuryIn.eth = +((db.treasuryIn.eth || 0) + eth).toFixed(6); db.treasuryIn.n++; dirty();
  return { amt, eth, px, tx: txHash, block: db.txs[txHash].block };`, 'credit');
s = rep(s, "amount = r2(+amount); if (!(amount >= 1)) throw 'minimum withdrawal is 1 USDC'; if (d.usdg < amount) throw 'not enough free USDC on your live desk (close positions first)';",
  "amount = r2(+amount); if (!(amount >= 1)) throw 'minimum withdrawal is $1'; if (d.usdg < amount) throw 'not enough free balance on your live desk (close positions first)'; const px = ethUsd();", 'wd1');
s = rep(s, "const q = { id: 'w' + crypto.randomBytes(5).toString('hex'), wallet: w, amt: amount, status: 'queued', ts: now(), paidTx: null, paidAt: null };",
  "const q = { id: 'w' + crypto.randomBytes(5).toString('hex'), wallet: w, amt: amount, eth: +(amount / px).toFixed(6), px, status: 'queued', ts: now(), paidTx: null, paidAt: null };", 'wd2');
s = rep(s, "if (p === '/api/live') return json(res, 200, { open: !!TREASURY, treasury: TREASURY || null, minDeposit: MIN_DEPOSIT, chain: { ...CHAIN, ...TCHAIN },",
  "if (p === '/api/live') return json(res, 200, { open: !!TREASURY, treasury: TREASURY || null, minDeposit: MIN_DEPOSIT, ethUsd: ETHPX.px, chain: { ...CHAIN, ...TCHAIN, treasuryUsd: r2((TCHAIN.treasuryEth || 0) * (ETHPX.px || 0)) }, depositedEth: db.treasuryIn.eth || 0,", 'live route');
s = s.split("if (!db.treasuryIn) db.treasuryIn = { usdc: 0, n: 0 };").join("if (!db.treasuryIn) db.treasuryIn = { usdc: 0, eth: 0, n: 0 };");
s = s.split('USDC on Arc').join('ETH on Robinhood Chain').split(' on Arc').join(' on Robinhood Chain');
Wr('server/index.js', s); SOFT = false;

// ── client app ──
let a = R('client/app.html');
a = rep(a, "Live · USDC on Arc</button>", "Live · ETH on Robinhood Chain</button>", 'app seg');
a = rep(a, "<h3>Live desk · USDC on Arc</h3><div class=\"ph\">'+(lv.open?'Send USDC on Arc to the treasury and it is credited to your live desk once the transaction confirms. Every deposit is verified against the chain. Withdrawals are paid from the treasury to your wallet.'",
  "<h3>Live desk · ETH on Robinhood Chain</h3><div class=\"ph\">'+(lv.open?'Send ETH on Robinhood Chain to the treasury and it is credited to your live desk in dollars at the ETH price when it confirms. Every deposit is verified against the chain. Withdrawals are paid in ETH from the treasury to your wallet.'", 'app ph');
a = rep(a, "<div class=\"pstat\"><span>treasury balance</span><b>$'+Math.round(lv.chain.treasuryUsdc||0).toLocaleString()+'</b></div>",
  "<div class=\"pstat\"><span>treasury</span><b>'+(+(lv.chain.treasuryEth||0)).toFixed(3)+' ETH</b></div><div class=\"pstat\"><span>ETH</span><b>$'+Math.round(lv.ethUsd||0).toLocaleString()+'</b></div>", 'app tstat');
a = rep(a, "<input id=\"depAmt\" placeholder=\"USDC\" value=\"50\"", "<input id=\"depAmt\" placeholder=\"ETH\" value=\"0.02\"", 'app depamt');
a = rep(a, " · min '+lv.minDeposit+' USDC · Arc chain '+CFG.chain.id+'", " · min '+lv.minDeposit+' ETH · Robinhood Chain '+CFG.chain.id+' · credited in $ at the ETH price on confirmation", 'app min');
a = rep(a, "<input id=\"wdAmt\" placeholder=\"USDC\"", "<input id=\"wdAmt\" placeholder=\"$ amount\"", 'app wdamt');
a = rep(a, "free balance $'+dk.usdg.toFixed(2)+' · paid by the treasury to your wallet", "free balance $'+dk.usdg.toFixed(2)+' · paid in ETH by the treasury to your wallet", 'app wd note');
a = rep(a, "<td class=\"mono\">$'+q.amt.toFixed(2)+'</td>", "<td class=\"mono\">$'+q.amt.toFixed(2)+(q.eth?' · '+q.eth+' ETH':'')+'</td>", 'app queue');
a = rep(a, "'your USDC on the same 22 tokenized stocks the horses trade.", "'your ETH, in dollars, on the same 22 tokenized stocks the horses trade.", 'app desk ph');
a = rep(a, "return toast('open a wallet to send USDC, or paste a transaction hash')", "return toast('open a wallet to send ETH, or paste a transaction hash')", 'app toast');
a = rep(a, "const value='0x'+(BigInt(Math.round(amt*1e6))*10n**12n).toString(16);", "const value='0x'+(BigInt(Math.round(amt*1e9))*10n**9n).toString(16);", 'app value');
a = rep(a, "toast('credited $'+r.amt.toFixed(2)+' USDC to your live desk')", "toast('credited $'+r.amt.toFixed(2)+' from '+r.eth+' ETH to your live desk')", 'app cred1');
a = rep(a, "toast('credited $'+r.amt.toFixed(2)+' USDC')", "toast('credited $'+r.amt.toFixed(2)+' from '+r.eth+' ETH')", 'app cred2');
a = rep(a, "toast('withdrawal of $'+r.queued.amt.toFixed(2)+' queued · '+r.queued.id)", "toast('withdrawal of $'+r.queued.amt.toFixed(2)+' ('+r.queued.eth+' ETH) queued · '+r.queued.id)", 'app wd toast');
a = a.split('USDC on Arc').join('ETH on Robinhood Chain').split(' on Arc').join(' on Robinhood Chain').split('breedonarc.xyz').join('breedonrh.xyz').split('BreedOnArc').join('BreedOnRH');
Wr('client/app.html', a);

// ── landing ──
let i = R('client/index.html');
i = i.split('Live desk funded with USDC on Arc').join('Live desk funded with ETH on Robinhood Chain');
i = rep(i, "<h3>Back them with USDC</h3><p>Deposit USDC on Arc to the treasury and your Live desk is credited once the transaction confirms.", "<h3>Back them with ETH</h3><p>Deposit ETH on Robinhood Chain to the treasury and your Live desk is credited in dollars at the ETH price once the transaction confirms.", 'idx card');
i = rep(i, "Live is a second desk funded by USDC you deposit on Arc.", "Live is a second desk funded by ETH you deposit on Robinhood Chain, credited in dollars at the ETH price when it confirms.", 'idx faq1');
i = rep(i, "Connect a wallet on Arc, open the Live desk, and send USDC to the treasury address shown there, either straight from the desk with one click or by pasting the transaction hash. The deposit is verified against the Arc chain: the sender must be your wallet, the recipient must be the treasury, and the value is read from the transaction itself. Once it confirms, your Live balance updates. Minimum deposit is 10 USDC.",
  "Connect a wallet on Robinhood Chain, open the Live desk, and send ETH to the treasury address shown there, either straight from the desk with one click or by pasting the transaction hash. The deposit is verified against Robinhood Chain: the sender must be your wallet, the recipient must be the treasury, and the value is read from the transaction itself. Once it confirms, the ETH is credited to your Live balance in dollars at the ETH price at that moment. Minimum deposit is 0.005 ETH.", 'idx faq2');
i = rep(i, "The treasury pays queued withdrawals to the wallet that deposited, and the transaction hash is attached to your request when it is paid.", "Each request records the ETH amount at the ETH price when you requested it. The treasury pays that ETH to the wallet that deposited, and the transaction hash is attached to your request when it is paid.", 'idx faq3');
i = rep(i, "On Live it mirrors your USDC.", "On Live it mirrors your funded balance.", 'idx faq4');
i = rep(i, "The treasury is a wallet on Arc. Its address is printed on the Live desk, its balance is read from the chain every 30 seconds and shown next to the block it was read at, and every deposit credited to a desk is tied to a transaction hash you can open on the Arc explorer.", "The treasury is a wallet on Robinhood Chain. Its address is printed on the Live desk, its ETH balance is read from the chain every 30 seconds and shown next to the block it was read at, and every deposit credited to a desk is tied to a transaction hash you can open on the Robinhood Chain explorer.", 'idx faq5');
i = rep(i, "<p>Arc mainnet, chain id 5042. USDC is Arc's native gas token, so a deposit is a plain transfer with no approval step. The desk switches your wallet to Arc when you connect. Any EVM wallet works.</p>", "<p>Robinhood Chain mainnet, chain id 4663. ETH is the gas token, so a deposit is a plain ETH transfer with no approval step. The desk switches your wallet to Robinhood Chain when you connect. Any EVM wallet works.</p>", 'idx faq6');
i = rep(i, "$BREED is the token of the stable on Arc.", "$BREED is the token of the stable on Robinhood Chain.", 'idx faq7');
i = i.split('tokenized stocks on Arc').join('tokenized stocks on Robinhood Chain').split('Practice and Live desks on Arc').join('Practice and Live desks on Robinhood Chain').split('breedonarc.xyz').join('breedonrh.xyz').split('BreedOnArc').join('BreedOnRH').split(' on Arc').join(' on Robinhood Chain');
Wr('client/index.html', i);

// ── docs ──
let d = R('client/docs.html');
d = rep(d, "rev. 2 · Arc mainnet · Practice and Live desks", "rev. 3 · Robinhood Chain mainnet · Practice and Live desks", 'docs rev');
d = rep(d, "<p>The Live desk is funded with <b>USDC on Arc</b>.", "<p>The Live desk is funded with <b>ETH on Robinhood Chain</b>, credited in dollars at the ETH price when the deposit confirms.", 'docs live');
d = rep(d, "<li><b>Deposit.</b> Send USDC to the treasury address shown on the desk, from the desk with one click or by pasting a transaction hash. The server reads the transaction from Arc: the sender must match your wallet, the recipient must be the treasury, and the credited amount is the transaction's value. Minimum 10 USDC. Each transaction hash is credited once.</li>",
  "<li><b>Deposit.</b> Send ETH to the treasury address shown on the desk, from the desk with one click or by pasting a transaction hash. The server reads the transaction from Robinhood Chain: the sender must match your wallet, the recipient must be the treasury, and the credited amount is the transaction's ETH value × the ETH/USD mark at confirmation (Yahoo ETH-USD, refreshed every 30 s). Minimum 0.005 ETH. Each transaction hash is credited once and the ETH amount and price are kept on the ledger.</li>", 'docs dep');
d = rep(d, "<li><b>Treasury.</b> A wallet on Arc, address published on the desk. Its balance is read from the chain every 30 seconds and shown with the block number of the read.", "<li><b>Treasury.</b> A wallet on Robinhood Chain, address published on the desk. Its ETH balance is read from the chain every 30 seconds and shown with the block number of the read.", 'docs tre');
d = rep(d, "<li><b>Withdraw.</b> Request any amount up to your free Live balance. It leaves the desk immediately and joins the payout queue with an id. The treasury pays the queue to the depositing wallet and records the payout transaction hash on the request.", "<li><b>Withdraw.</b> Request any dollar amount up to your free Live balance. It leaves the desk immediately and joins the payout queue with an id and the ETH amount at that moment's mark. The treasury pays that ETH to the depositing wallet and records the payout transaction hash on the request.", 'docs wd');
d = rep(d, "mirrors its entries with your USDC at half", "mirrors its entries with your funded balance at half", 'docs ride');
d = rep(d, "<p>Arc mainnet, chain id 5042, RPC <code>rpc.mainnet.arc.io</code>, explorer <code>explorer.arc.io</code>. USDC is Arc's native gas token with 18 decimals, so a deposit is a plain value transfer with no approval. The desk switches a connected wallet to Arc automatically.</p>",
  "<p>Robinhood Chain mainnet, chain id 4663, RPC <code>rpc.mainnet.chain.robinhood.com</code>, explorer <code>explorer.mainnet.chain.robinhood.com</code>. ETH is the gas token with 18 decimals, so a deposit is a plain value transfer with no approval. The desk switches a connected wallet to Robinhood Chain automatically.</p>", 'docs chain');
d = rep(d, "credit a verified Arc transaction", "credit a verified Robinhood Chain ETH transaction", 'docs api');
d = d.split(' on Arc').join(' on Robinhood Chain');
Wr('client/docs.html', d);

// ── README / X-KIT / kit sources / tests ──
for (const f of ['README.md', 'X-KIT.md', '_studio/build.js', '_studio/hype-video.html', '_studio/demo-video.html', '_studio/e2e.cjs', '_studio/e2e-live.cjs']) {
  let t = R(f);
  t = t.split('breedonarc.xyz').join('breedonrh.xyz').split('BreedOnArc').join('BreedOnRH').split('USDC on Arc').join('ETH on Robinhood Chain').split('ON ARC').join('ON ROBINHOOD CHAIN').split(' on Arc').join(' on Robinhood Chain').split('Arc mainnet (5042, USDC gas)').join('Robinhood Chain mainnet (4663, ETH gas)').split('verified on Arc').join('verified on Robinhood Chain').split('localhost:8204').join('localhost:8208').split(':8204').join(':8208').split('Arc chain 5042').join('Robinhood Chain 4663');
  if (f === '_studio/e2e-live.cjs') t = t.split("cfg.minDeposit === 10").join("cfg.minDeposit === 0.005").split("'treasuryUsdc' in lv.chain").join("'treasuryEth' in lv.chain").split("/^0x[0-9a-f]{40}$/.test(cfg.treasury) && ").join("");
  Wr(f, t);
}
console.log('ported to Robinhood Chain');
