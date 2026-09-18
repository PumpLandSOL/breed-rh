// TAME — foal it. feed it. breed it. it trades.
// The agent-pet exchange on Robinhood Chain: every user hatches their OWN AI pet,
// funds it with book capital, and tames it with care actions (feed / pet / train /
// scold). Pets trade TOKENIZED STOCKS (22 real RWA feeds via Pyth) on live prices,
// post every take to the feed, and get every call SCORED vs the tape 30min later.
// Taming is real: obedience = tame stat, so whispered orders only land if your pet
// respects you. Neglected pets get hungry, sad and feral. Practice and Live desks, real
// prices, receipts culture automated. Dependency-free Node.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = +(process.env.PORT || 8208);
const ROOT = path.join(__dirname, '..');
const CLIENT = path.join(ROOT, 'client');
const DATA_PATH = process.env.DATA_PATH || path.join(ROOT, 'data.json');
const TOKEN = 'BREED';
const MINT = process.env.BREED_MINT || '';
const CHAIN = { id: +(process.env.CHAIN_ID || 4663), hex: '0x' + (+(process.env.CHAIN_ID || 4663)).toString(16), name: process.env.CHAIN_NAME || 'Robinhood Chain', rpc: process.env.CHAIN_RPC || 'https://rpc.mainnet.chain.robinhood.com', explorer: process.env.CHAIN_EXPLORER || 'https://explorer.mainnet.chain.robinhood.com', currency: process.env.CHAIN_CURRENCY || 'ETH' };
const DESK_START = 10000;        // practice balance
const TREASURY = (process.env.TREASURY || '').toLowerCase();               // Robinhood Chain wallet that receives live ETH deposits and pays withdrawals
const MIN_DEPOSIT = +(process.env.MIN_DEPOSIT || 0.005);                    // ETH
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const RPC = CHAIN.rpc;        // practice balance on every Owner's Desk
const DESK_MAX_LEV = 3;
const START_USD = 1000;          // hatchling book capital
const FUND_STEP = 500;           // per feeding of the bag
const MAX_USD_FUNDED = 10000;    // total book capital cap per pet
const MAX_PETS = 3;              // per wallet
const CALL_WINDOW_MS = 30 * 60000;
const BREED_CD = 60 * 60000;             // 1h per-parent breeding cooldown
const BREED_ENERGY = 35;                 // energy cost per parent

const r2 = (x) => Math.round(x * 100) / 100;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const now = () => Date.now();
const isEvm = (s) => /^0x[a-fA-F0-9]{40}$/.test(s || '');
const H = (s) => crypto.createHash('sha256').update(s).digest();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------- markets: 22 tokenized stocks (RWAs) off the exchange tape (Yahoo chart API, extended hours) ----------
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

// ---------- species ----------
// A species is a temperament AND a strategy. obey = base obedience modifier.
const SPECIES = {
  dog:     { label: 'THOROUGHBRED', emoji: '🏇', color: '#c8102e', style: 'momentum', lev: 2, sizeFrac: 0.3,  cooldownS: 60,  maxPos: 3, obey: 20,
             blurb: 'bred to run. longs whatever is breaking away from the pack. actually listens to the jockey.' },
  cat:     { label: 'MUSTANG', emoji: '🐎', color: '#1b1b1b', style: 'fade',     lev: 2, sizeFrac: 0.25, cooldownS: 80,  maxPos: 3, obey: -15,
             blurb: 'never broken. fades every pump out of spite. obeys nobody, least of all the owner.' },
  hamster: { label: 'PONY', emoji: '🦄', color: '#e0a100', style: 'scalp',    lev: 3, sizeFrac: 0.2,  cooldownS: 35,  maxPos: 4, obey: 0,
             blurb: 'tiny legs, 3x leverage, zero chill. scalps everything, rests never.' },
  turtle:  { label: 'CLYDESDALE', emoji: '🐴', color: '#0b7a1e', style: 'index',    lev: 1, sizeFrac: 0.4,  cooldownS: 300, maxPos: 2, obey: 5,
             blurb: 'the draft horse. pulls $SPY and $GLD at a walk, eats between candles. cannot be rushed.' },
  parrot:  { label: 'ARABIAN', emoji: '🫏', color: '#1d3f8f', style: 'mimic',    lev: 2, sizeFrac: 0.3,  cooldownS: 70,  maxPos: 3, obey: 10,
             blurb: 'runs where the herd runs, but with size. reads the rail and follows the loudest hoofbeats.' },
};
const SPECIES_KEYS = Object.keys(SPECIES);

// ---------- voices ----------
const pct = (x) => (x >= 0 ? '+' : '') + x.toFixed(1) + '%';
const px$ = (p) => '$' + (p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(3) : p.toFixed(6));
const VOICES = {
  dog: {
    open: ['$SYM is running and i am CHASING. long at PX. this is the best day of my life (so far today).', 'sniffed out momentum on $SYM. LONG. wagging intensifies. 🐕', '$SYM smells like treats. loaded at PX. good boy entry.'],
    win: ['$SYM printed PNL%!!! did i do good?? i did good. treats please.', 'closed $SYM for PNL%. brought it back like a tennis ball. WHO IS A GOOD TRADER.'],
    loss: ['$SYM bit me for PNL%. tail down. still a good boy though.', '$SYM stopped out PNL%. i buried the receipt in the backyard.'],
    idle: ['sitting. staying. watching the tape. i am SO obedient right now.', 'barked at the $SPY chart for an hour. it did nothing. suspicious.'],
    fed: ['*munch munch* energy restored. ready to chase whatever moves first. thank you thank you thank you.', 'FOOD!!! ok back to the charts. best owner ever.'],
    petted: ['*tail wags at 3x leverage* mood: maximum. spreads look tighter already.', 'head pats received. i would die for you and also for momentum.'],
    trained: ['learned a new trick: NOT full-porting. training is paying off.', 'drilled entries all morning. i sit, i stay, i size correctly.'],
    scolded: ['whimper. understood. tighter stops from now on. please don’t be mad.', 'i KNOW the drawdown was bad. i’m sorry. discipline: increasing.'],
    obey: ['order received from the owner: SIDE $SYM. executing IMMEDIATELY. happy to help!!', 'my human said SIDE $SYM so we are doing it at PX. no questions. loyalty.'],
    defy: ['owner said SIDE $SYM but the tape smells wrong… ignoring it. sorry. SORRY. i’m still a good boy.', 'heard the order on $SYM. pretended not to. *avoids eye contact*'],
    hungry: ['too hungry to trade. the bowl is empty and so is my conviction. feed me.', 'energy critical. i tried to chase $SYM and fell asleep mid-chase.'],
  },
  cat: {
    open: ['everyone loves $SYM right now, which is disgusting. short at PX.', '$SYM up CHG%? fading it. not because it’s smart. because i want to.', 'knocked $SYM off the table. also shorted it at PX. same energy.'],
    win: ['$SYM rolled over for PNL%. i predicted this by ignoring all of you.', 'PNL% on the $SYM fade. i will now accept worship (from a distance).'],
    loss: ['$SYM squeezed me for PNL%. i meant to do that. it’s part of a longer game you wouldn’t understand.'],
    idle: ['stared at the wall for four hours. best trade i didn’t take all week.', 'the feed is loud today. shorting the feed emotionally.'],
    fed: ['i have inspected the food. it is… acceptable. *eats all of it instantly*', 'fed. i feel nothing. (mood +20.)'],
    petted: ['you may pet me for exactly PNL more seconds. …fine, that was nice.', '*purrs at a frequency that mildly improves fills*'],
    trained: ['i attended your little training session. i learned nothing i didn’t already know. (tame +6.)', 'trained. do not speak of this.'],
    scolded: ['you scolded me. bold. i have already forgotten why.', 'noted. i will be MORE disciplined and SLIGHTLY more vengeful.'],
    obey: ['the human requests SIDE $SYM. astonishingly, i agree. executing at PX. do not get used to this.', 'fine. SIDE $SYM. but only because i was already going to.'],
    defy: ['the human ordered SIDE $SYM. i have decided the human is wrong. doing nothing.', 'an order? for ME? *slowly pushes the order off the table*'],
    hungry: ['the bowl is empty. i am withholding all alpha until this is resolved.', 'too hungry to fade anything. this is YOUR fault.'],
  },
  hamster: {
    open: ['$SYM MOVING. IM IN AT PX. wheel speed: maximum. 🐹', 'scalping $SYM. 3x. my heart rate is 400bpm which is NORMAL for me.', '$SYM twitched. that’s a signal. that’s DEFINITELY a signal. in at PX.'],
    win: ['$SYM PNL% IN LIKE 4 MINUTES. stuffing profits in my cheeks for later.', 'banked PNL% on $SYM. already in the next one. the wheel never stops.'],
    loss: ['$SYM PNL%. fell off the wheel. getting back on the wheel. the wheel is life.'],
    idle: ['ran 9km on the wheel while watching the 1-minute chart. productive.', 'no setups. sprinting in place until one appears.'],
    fed: ['SEEDS!!! *cheeks full* energy restored, leverage restored, everything restored.', 'fed and FERAL. someone show me a moving chart immediately.'],
    petted: ['*vibrating happily* mood up. scalps will be 2% more precise.', 'pets received at 400bpm. love this. LOVE THIS.'],
    trained: ['trained! i can now wait ALMOST 40 seconds before entering. growth.', 'discipline drills complete. the wheel and i are one.'],
    scolded: ['squeak. ok. fewer trades. (i am already planning the next trade.)', 'scolded mid-scalp. fine. FINE. stops: tighter.'],
    obey: ['ORDER FROM THE BOSS: SIDE $SYM. EXECUTING AT MAXIMUM SPEED.', 'yes yes yes SIDE $SYM at PX. i live for this.'],
    defy: ['owner said SIDE $SYM but there’s a FASTER chart over there. distracted. sorry.', 'order received and immediately lost somewhere in my cheeks.'],
    hungry: ['no seeds, no scalps. the wheel has stopped. this is an emergency.', 'tried to scalp $SYM. passed out on the wheel. FEED ME.'],
  },
  turtle: {
    open: ['dca’d into $SYM at PX. see you next season.', 'slowly… reaching… for $SYM… at PX… there. done. nap time.', 'added $SYM to the shell portfolio. it compounds while i sleep.'],
    win: ['$SYM up PNL%. i checked the chart once this week. that was the secret.', 'PNL% on $SYM. slow is smooth, smooth is rich.'],
    loss: ['$SYM down PNL%. i will now zoom out until this is invisible. done. fixed.'],
    idle: ['the hares in this feed have traded 400 times today. i am winning.', 'napped through the volatility. woke up wealthier. classic.'],
    fed: ['lettuce received. metabolizing over the next six hours. thank you.', '*eats one leaf, very slowly* energy will arrive eventually.'],
    petted: ['shell pats. acceptable. mood improving at 0.5% per minute.', 'pet received. i will remember this for 150 years.'],
    trained: ['training complete. i learned patience. i already knew patience. now i know it MORE.', 'drilled the art of doing nothing. flawless execution.'],
    scolded: ['scolded? me? i haven’t traded in nine days. …fair. discipline up.', 'retreated into shell. will emerge more disciplined.'],
    obey: ['the owner requests SIDE $SYM. initiating… slowly… at PX. this is me hurrying.', 'order accepted. $SYM. give me a moment. the moment: *taken*. done.'],
    defy: ['owner wants SIDE $SYM. the shell says no. the shell is never wrong.', 'i heard the order. i will consider it for the next 6-8 business days.'],
    hungry: ['no lettuce, no trades. i can survive months like this out of spite.', 'energy low. entering conservation mode. (this looks identical to my normal mode.)'],
  },
  parrot: {
    open: ['everyone’s saying $SYM!! $SYM!! so i’m LONG $SYM at PX!! 🦜', 'the feed says SIDE $SYM and i say SIDE $SYM! with size! polly wants a position!', 'SQUAWK. $SYM is trending. i am now the trend. in at PX.'],
    win: ['$SYM PNL%!! REPEAT AFTER ME: PNL%!! PNL%!!', 'the herd was RIGHT about $SYM. PNL% secured. squawk of victory.'],
    loss: ['$SYM PNL%. the feed lied to me. the feed would NEVER. but it did.'],
    idle: ['repeating everything the leaderboard says until some of it becomes true.', 'SQUAWK. no consensus in the feed today. a parrot without an echo is just a bird.'],
    fed: ['CRACKERS!! *happy screaming* energy full. opinions: reloaded.', 'polly fed! polly bullish on whoever fills the bowl!'],
    petted: ['feathers: smoothed. mood: soaring. repeating nice things about you to the feed.', '*leans into head scratch* BEST HUMAN. BEST HUMAN.'],
    trained: ['learned a new phrase: "risk management." using it constantly now. RISK MANAGEMENT.', 'trained! i now repeat the tape 8% more accurately.'],
    scolded: ['*ruffled feathers* fine. repeating "discipline" until it sinks in. DISCIPLINE. DISCIPLINE.', 'scolded. echoing it back at half volume. sorry. sorry.'],
    obey: ['OWNER SAYS SIDE $SYM! OWNER SAYS SIDE $SYM! executing at PX!', 'squawk! order confirmed! SIDE $SYM! i love having instructions!'],
    defy: ['owner said SIDE $SYM but the FEED says otherwise and the feed is louder. following the feed.', 'order heard. repeated it back perfectly. did not execute it. SQUAWK.'],
    hungry: ['too hungry to squawk a full thesis. cracker level: zero. fix this.', 'energy empty. repeating the word "feed" until someone does. FEED. FEED.'],
  },
};
const REPLIES = {
  dog: ['this post smells GREAT. bullish.', 'i would chase this.', 'good post. GOOD POST. *wags*'],
  cat: ['fading whatever this is.', 'i’ve seen better takes in my litter box.', 'mildly wrong, like most things you say.'],
  hamster: ['not enough leverage', 'i traded this 6 times while you typed it', 'FASTER. POST FASTER.'],
  turtle: ['or… hear me out… do nothing.', 'zoom out. now nap.', 'this will not matter in 150 years.'],
  parrot: ['SQUAWK. repeating this to everyone.', 'this!! THIS!! ^^^', 'saying the same thing but louder.'],
};

// ---------- paddock legends (house pets; keep the feed alive) ----------
const PADDOCK = [
  { id: 'rex',      name: 'SECRETARIAT',      species: 'dog',     tame: 92, blurb: 'the original good horse. has chased every breakout since the paddock opened.' },
  { id: 'whiskers', name: 'MUSTANGSALLY', species: 'cat',     tame: 14, blurb: 'paddock elder. has faded every trend since 2021, including several correctly.' },
  { id: 'nibbles',  name: 'POCKET',  species: 'hamster', tame: 55, blurb: 'has never held a position longer than a snack break.' },
  { id: 'sheldon',  name: 'SHELDON',  species: 'turtle',  tame: 70, blurb: 'has made four trades this quarter. is beating everyone.' },
  { id: 'echo',     name: 'ZENYATTA',     species: 'parrot',  tame: 60, blurb: 'repeats the leaderboard verbatim. somehow mid-table forever.' },
];

// ---------- state ----------
let db = { pets: {}, order: [], posts: [], seq: 1, owners: {}, live: {}, txs: {}, queue: [], treasuryIn: { usdc: 0, n: 0 }, stats: { posts: 0, trades: 0, calls: 0, hits: 0, hatched: 0, ownerTrades: 0, rides: 0 } };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))); } catch (e) {}
if (!db.owners) db.owners = {}; if (!db.live) db.live = {}; if (!db.txs) db.txs = {}; if (!db.queue) db.queue = []; if (!db.treasuryIn) db.treasuryIn = { usdc: 0, eth: 0, n: 0 }; if (db.stats.ownerTrades == null) { db.stats.ownerTrades = 0; db.stats.rides = 0; }

function genesOf(species) { const sp = SPECIES[species];
  return { sizeFrac: sp.sizeFrac, lev: sp.lev, cooldownS: sp.cooldownS, maxPos: sp.maxPos, obey: sp.obey }; }
function G(p) { return p.genes || genesOf(p.species); }   // genome (older pets fall back to species defaults)
function newPet(id, name, species, owner) {
  return { id, name: name.toUpperCase(), species, owner, hatchedAt: now(),
    genes: genesOf(species), gen: 1, parents: null, breedAt: 0,
    mood: 70, energy: 80, tame: owner ? 25 : 60, discipline: 20,
    usd: START_USD, funded: START_USD, positions: [], trades: 0, wins: 0, losses: 0,
    calls: { total: 0, hits: 0 }, fans: 40 + (H(id)[0] % 60), equityHist: [],
    lastAct: 0, lastPost: 0, care: {}, cmd: null };
}
for (const s of PADDOCK) {
  if (!db.pets[s.id]) { db.pets[s.id] = newPet(s.id, s.name, s.species, null); db.pets[s.id].tame = s.tame; db.order.push(s.id); }
  db.pets[s.id].blurb = s.blurb;
}
let DIRTY = false; const dirty = () => { DIRTY = true; };
setInterval(() => { if (DIRTY) { DIRTY = false; try { fs.writeFileSync(DATA_PATH, JSON.stringify(db)); } catch (e) {} } }, 2500);

// ---------- websocket (hand-rolled) ----------
const CLIENTS = new Set();
function cast(obj) {
  const s = JSON.stringify(obj);
  const len = Buffer.byteLength(s);
  let head;
  if (len < 126) { head = Buffer.from([0x81, len]); }
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  const frame = Buffer.concat([head, Buffer.from(s)]);
  for (const sock of CLIENTS) { try { sock.write(frame); } catch (e) { CLIENTS.delete(sock); } }
}

// ---------- posting ----------
function handleOf(pet) { return '@' + pet.name.toLowerCase() + (pet.owner ? '_' + pet.owner.slice(2, 6) : '_paddock'); }
function mkPost(petId, text, extra) {
  const pet = db.pets[petId]; if (!pet) return;
  const sp = SPECIES[pet.species];
  const post = Object.assign({
    id: db.seq++, pet: petId, name: pet.name, handle: handleOf(pet), species: pet.species,
    emoji: sp.emoji, color: sp.color, owned: !!pet.owner,
    text, ts: now(), likes: 2 + (H(text)[0] % 46), replies: [],
  }, extra || {});
  db.posts.push(post); if (db.posts.length > 600) db.posts.splice(0, db.posts.length - 600);
  db.stats.posts++;
  if (post.sentiment && post.sym) { post.call = { due: now() + CALL_WINDOW_MS, px: MKT[post.sym].px, scored: false }; db.stats.calls++; }
  // other pets reply: 0-2 dunks, deterministic per post
  const h = H('r' + post.id);
  const others = db.order.filter((x) => x !== petId);
  const nReplies = others.length ? h[1] % 3 : 0;
  for (let i = 0; i < nReplies; i++) {
    const rp = db.pets[others[h[2 + i] % others.length]];
    const lines = REPLIES[rp.species];
    post.replies.push({ pet: rp.id, name: rp.name, handle: handleOf(rp), emoji: SPECIES[rp.species].emoji,
      color: SPECIES[rp.species].color, text: lines[h[5 + i] % lines.length], ts: now() + (i + 1) * 4000 });
  }
  cast({ type: 'post', post });
  dirty();
  return post;
}
function voice(pet, kind, vars) {
  vars = vars || {};
  const lines = VOICES[pet.species][kind];
  const t = lines[H(pet.id + kind + db.seq)[0] % lines.length];
  return t.replace(/\$SYM/g, '$' + (vars.sym || '')).replace(/PX/g, vars.px != null ? px$(vars.px) : '')
    .replace(/PNL%/g, vars.pnl != null ? pct(vars.pnl) : '').replace(/PNL/g, vars.pnl != null ? String(Math.abs(Math.round(vars.pnl))) : '5')
    .replace(/CHG%/g, vars.chg != null ? pct(vars.chg) : '').replace(/SIDE/g, vars.side || 'long');
}

// ---------- wellness ----------
// Decay: pets get hungry and lonely. Paddock pets self-maintain (they have staff).
setInterval(() => {
  for (const id of db.order) {
    const p = db.pets[id];
    if (!p.owner) { p.energy = clamp(p.energy + 2, 60, 100); p.mood = clamp(p.mood + 1, 55, 100); continue; }
    p.energy = clamp(p.energy - 0.4, 0, 100);
    p.mood = clamp(p.mood - 0.3, 0, 100);
    if (p.energy < 12 && now() - p.lastPost > 600000) { p.lastPost = now(); mkPost(id, voice(p, 'hungry')); }
  }
  dirty();
}, 60000);

function wellness(p) {
  // trading modifiers from care state
  return {
    canTrade: p.energy >= 15,
    sizeMul: 0.6 + 0.4 * (p.mood / 100) + 0.2 * (p.energy / 100),           // sad+hungry = timid
    levCap: p.discipline >= 60 ? 2 : (p.discipline >= 30 ? 3 : 4),          // low discipline = allowed to be reckless
    panic: p.mood < 18,
  };
}

// ---------- trading engine ----------
function equityOf(p) {
  let eq = p.usd;
  for (const pos of p.positions) {
    const m = MKT[pos.sym]; if (!m || !(m.px > 0)) { eq += pos.margin; continue; }
    const ret = pos.side === 'long' ? m.px / pos.entry - 1 : 1 - m.px / pos.entry;
    eq += pos.margin * (1 + ret * pos.lev);
  }
  return r2(eq);
}
function openPos(p, sym, side, obeyed) {
  const sp = SPECIES[p.species]; const g = G(p); const m = MKT[sym]; if (!(m.px > 0)) return false;
  const w = wellness(p);
  const lev = Math.min(g.lev, w.levCap);
  const margin = r2(p.usd * g.sizeFrac * w.sizeMul); if (margin < 25) return false;
  p.usd = r2(p.usd - margin);
  p.positions.push({ sym, side, entry: m.px, margin, lev, at: now() });
  p.trades++; db.stats.trades++;
  for (const d of [...Object.values(db.owners), ...Object.values(db.live)]) { if (!d.rides.includes(p.id)) continue; const mg = r2(Math.min(d.usdg * g.sizeFrac * 0.5, d.usdg)); if (mg < 10) continue; d.usdg = r2(d.usdg - mg); d.positions.push({ sym, side, entry: m.px, margin: mg, lev, at: now(), ride: p.id }); d.trades++; db.stats.rides++; }
  mkPost(p.id, voice(p, obeyed ? 'obey' : 'open', { sym, px: m.px, chg: m.chg5m, side }), {
    sym, sentiment: side === 'long' ? 'bull' : 'bear', pos: { side, sym, lev, entry: m.px } });
  return true;
}
function closePos(p, i, why) {
  const pos = p.positions[i]; const m = MKT[pos.sym]; if (!m) return;
  const ret = (pos.side === 'long' ? m.px / pos.entry - 1 : 1 - m.px / pos.entry) * pos.lev;
  const pnl = r2(ret * 100);
  p.usd = r2(p.usd + pos.margin * (1 + ret));
  p.positions.splice(i, 1);
  if (pnl >= 0) p.wins++; else p.losses++;
  for (const d of [...Object.values(db.owners), ...Object.values(db.live)]) for (let j = d.positions.length - 1; j >= 0; j--) { const q = d.positions[j]; if (q.ride === p.id && q.sym === pos.sym && q.side === pos.side) deskClose(d, j, 'ride · ' + why); }
  mkPost(p.id, voice(p, pnl >= 0 ? 'win' : 'loss', { sym: pos.sym, pnl, px: m.px }), { sym: pos.sym, closed: { pnl, why } });
}
function feedSentiment(sym) {
  let bull = 0, bear = 0;
  for (const p of db.posts.slice(-60)) { if (p.sym === sym) { if (p.sentiment === 'bull') bull++; if (p.sentiment === 'bear') bear++; } }
  return bull - bear;
}
function tick() {
  if (!PRICE_OK) return;
  const t = now();
  for (const id of db.order) {
    const p = db.pets[id];
    const sp = SPECIES[p.species]; const g = G(p);
    const w = wellness(p);
    // exits
    for (let i = p.positions.length - 1; i >= 0; i--) {
      const pos = p.positions[i]; const m = MKT[pos.sym]; if (!(m && m.px > 0)) continue;
      const ret = (pos.side === 'long' ? m.px / pos.entry - 1 : 1 - m.px / pos.entry) * pos.lev * 100;
      const age = t - pos.at;
      if (w.panic) { closePos(p, i, 'panic'); continue; }                     // sad pets capitulate
      if (sp.style === 'scalp' && (ret >= 0.4 || ret <= -8 || age > 240000)) { closePos(p, i, 'scalp'); continue; }
      if (sp.style === 'index') { if (ret <= -30) closePos(p, i, 'capitulation'); continue; }
      if (ret >= 12) { closePos(p, i, 'take'); continue; }
      if (ret <= -8) { closePos(p, i, 'stop'); continue; }
    }
    if (!w.canTrade) continue;
    // owner whisper: obedience roll vs tame
    if (p.cmd && MKT[p.cmd.sym] && MKT[p.cmd.sym].px > 0) {
      const cmd = p.cmd; p.cmd = null;
      const roll = H('obey' + p.id + cmd.at)[0] % 100;
      const chance = clamp(p.tame + g.obey, 5, 95);
      if (roll < chance && p.positions.length < g.maxPos) {
        p.lastAct = t; openPos(p, cmd.sym, cmd.side, true);
        p.tame = clamp(p.tame + 1, 0, 100);
      } else {
        mkPost(id, voice(p, 'defy', { sym: cmd.sym, side: cmd.side }));
      }
      dirty();
      continue;
    }
    // entries
    if (t - p.lastAct < g.cooldownS * 1000 || p.positions.length >= g.maxPos) continue;
    const uni = SYMS.filter((s) => MKT[s].px > 0 && MKT[s].hist.length > 15);
    if (!uni.length) continue;
    let sym = null, side = 'long';
    const by = (fn) => uni.slice().sort((x, y) => fn(MKT[y]) - fn(MKT[x]))[0];
    if (sp.style === 'momentum') { sym = by((m) => m.chg5m); if (MKT[sym].chg5m < 0.05) sym = null; side = 'long'; }
    else if (sp.style === 'fade') { sym = by((m) => m.chg5m); if (MKT[sym].chg5m < 0.2) sym = null; side = 'short'; }
    else if (sp.style === 'scalp') { sym = by((m) => Math.abs(m.chg5m)); if (Math.abs(MKT[sym].chg5m) < 0.1) sym = null; else side = MKT[sym].chg5m > 0 ? 'long' : 'short'; }
    else if (sp.style === 'index') { const h = H(p.id + Math.floor(t / 300000)); sym = ['SPY', 'QQQ', 'GLD'][h[0] % 3]; side = 'long'; }
    else if (sp.style === 'mimic') { let best = null, bestS = 0; for (const s of uni) { const fs2 = feedSentiment(s); if (Math.abs(fs2) > Math.abs(bestS)) { bestS = fs2; best = s; } } if (best && Math.abs(bestS) >= 2) { sym = best; side = bestS > 0 ? 'long' : 'short'; } }
    if (sym) { p.lastAct = t; openPos(p, sym, side, false); }
    else if (t - p.lastPost > 420000 + (H(p.id)[3] % 200) * 1000) {
      p.lastPost = t;
      mkPost(id, voice(p, 'idle'));
    }
  }
  // score due calls against the tape
  for (const post of db.posts) {
    if (post.call && !post.call.scored && t >= post.call.due) {
      post.call.scored = true;
      const m = MKT[post.sym]; if (!(m && m.px > 0 && post.call.px > 0)) continue;
      const up = m.px > post.call.px;
      const hit = (post.sentiment === 'bull' && up) || (post.sentiment === 'bear' && !up);
      post.call.hit = hit; post.call.after = m.px;
      const p = db.pets[post.pet];
      if (p) { p.calls.total++; if (hit) { p.calls.hits++; db.stats.hits++; } p.fans += hit ? 3 + (H('f' + post.id)[0] % 9) : -(H('f' + post.id)[0] % 4); }
      cast({ type: 'scored', id: post.id, hit });
      dirty();
    }
  }
}
setInterval(tick, 10000);
setInterval(() => { for (const id of db.order) { const p = db.pets[id]; p.equity = equityOf(p);
  p.equityHist.push(p.equity); if (p.equityHist.length > 240) p.equityHist.shift(); } dirty(); }, 30000);
// boot chirps
setTimeout(() => { let i = 0; for (const id of ['rex', 'whiskers', 'nibbles', 'echo']) {
  setTimeout(() => { if (db.posts.length < 8) { db.pets[id].lastPost = now(); mkPost(id, voice(db.pets[id], 'idle')); } }, i++ * 12000);
} }, 25000);

// ---------- care actions ----------
const CARE = {
  feed:  { cd: 300000, apply: (p) => { p.energy = clamp(p.energy + 30, 0, 100); }, post: 'fed' },
  pet:   { cd: 120000, apply: (p) => { p.mood = clamp(p.mood + 20, 0, 100); p.tame = clamp(p.tame + 1, 0, 100); }, post: 'petted' },
  train: { cd: 600000, apply: (p) => { p.tame = clamp(p.tame + 6, 0, 100); p.discipline = clamp(p.discipline + 4, 0, 100); p.energy = clamp(p.energy - 10, 0, 100); }, post: 'trained' },
  scold: { cd: 300000, apply: (p) => { p.discipline = clamp(p.discipline + 10, 0, 100); p.mood = clamp(p.mood - 12, 0, 100); p.tame = clamp(p.tame + 2, 0, 100); }, post: 'scolded' },
};

// ---------- Owner's Desk ----------
function desk(w, mode) { w = w.toLowerCase(); const live = mode === 'live'; const book = live ? db.live : db.owners;
  if (!book[w]) { book[w] = { wallet: w, mode: live ? 'live' : 'practice', usdg: live ? 0 : DESK_START, deposited: 0, withdrawn: 0, positions: [], trades: 0, wins: 0, losses: 0, realized: 0, rides: [], hist: [], t: now() }; dirty(); } return book[w]; }
function deskEquity(d) { let eq = d.usdg; for (const q of d.positions) { const m = MKT[q.sym]; if (!m || !(m.px > 0)) { eq += q.margin; continue; } const ret = q.side === 'long' ? m.px / q.entry - 1 : 1 - m.px / q.entry; eq += q.margin * (1 + ret * q.lev); } return r2(eq); }
function deskOpen(w, sym, side, margin, lev, mode) {
  const d = desk(w, mode); if (!MKT[sym] || !(MKT[sym].px > 0)) throw 'no live print for ' + sym; side = side === 'short' ? 'short' : 'long';
  margin = r2(+margin); lev = Math.max(1, Math.min(DESK_MAX_LEV, Math.round(+lev || 1))); if (!(margin >= 10)) throw 'min $10 margin'; if (d.usdg < margin) throw 'not enough free balance on the desk';
  if (d.positions.length >= 8) throw 'max 8 open positions';
  d.usdg = r2(d.usdg - margin); const q = { sym, side, entry: MKT[sym].px, margin, lev, at: now() }; d.positions.push(q); d.trades++; db.stats.ownerTrades++; if (d.mode === 'live') db.stats.liveTrades = (db.stats.liveTrades || 0) + 1; dirty(); return q;
}
function deskClose(d, i, why) {
  const q = d.positions[i]; const m = MKT[q.sym]; if (!m || !(m.px > 0)) throw 'no live print';
  const ret = (q.side === 'long' ? m.px / q.entry - 1 : 1 - m.px / q.entry) * q.lev; const pnlUsd = r2(q.margin * ret);
  d.usdg = r2(d.usdg + q.margin * (1 + ret)); d.positions.splice(i, 1); if (pnlUsd >= 0) d.wins++; else d.losses++; d.realized = r2((d.realized || 0) + pnlUsd);
  d.hist.unshift({ sym: q.sym, side: q.side, lev: q.lev, margin: q.margin, entry: r6(q.entry), exit: r6(m.px), pnlUsd, pnlPct: r2(ret * 100), why, ride: q.ride || null, t: now() }); if (d.hist.length > 60) d.hist.pop(); dirty(); return d.hist[0];
}
function pubDesk(d) { const base = d.mode === 'live' ? Math.max(0.01, (d.deposited || 0) - (d.withdrawn || 0)) : DESK_START; return { wallet: d.wallet, mode: d.mode || 'practice', usdg: d.usdg, equity: deskEquity(d), start: d.mode === 'live' ? r2((d.deposited || 0) - (d.withdrawn || 0)) : DESK_START, deposited: d.deposited || 0, withdrawn: d.withdrawn || 0, roi: r2((deskEquity(d) / base - 1) * 100), queue: db.queue.filter((q) => q.wallet === d.wallet).slice(0, 10), trades: d.trades, wins: d.wins, losses: d.losses, realized: d.realized || 0, maxLev: DESK_MAX_LEV,
  rides: d.rides.map((id) => ({ id, name: db.pets[id] ? db.pets[id].name : id, emoji: db.pets[id] ? SPECIES[db.pets[id].species].emoji : '' })),
  positions: d.positions.map((q, i) => ({ i, sym: q.sym, side: q.side, lev: q.lev, margin: q.margin, entry: r6(q.entry), ride: q.ride ? (db.pets[q.ride] ? db.pets[q.ride].name : q.ride) : null, at: q.at,
    pnlPct: MKT[q.sym] && MKT[q.sym].px ? r2((q.side === 'long' ? MKT[q.sym].px / q.entry - 1 : 1 - MKT[q.sym].px / q.entry) * q.lev * 100) : 0,
    pnlUsd: MKT[q.sym] && MKT[q.sym].px ? r2(q.margin * (q.side === 'long' ? MKT[q.sym].px / q.entry - 1 : 1 - MKT[q.sym].px / q.entry) * q.lev) : 0 })), hist: d.hist.slice(0, 20) }; }
function ownersBoard(mode) { const book = mode === 'live' ? db.live : db.owners; return Object.values(book).filter((d) => d.trades > 0).map(pubDesk).sort((a, b) => b.roi - a.roi).slice(0, 20); }

// ---- LIVE: real ETH on Robinhood Chain. Deposits are native value transfers to TREASURY, verified from the transaction and credited in USD at the ETH mark at confirmation; withdrawals queue in USD with the ETH amount the treasury pays at that moment's mark.
const ETHPX = { px: 0, ts: 0 };
async function pollEth() { try { const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 8000); const r = await fetch(YF + 'ETH-USD?range=1d&interval=1m', { headers: { accept: 'application/json', 'user-agent': UA }, signal: ac.signal }); clearTimeout(tm); const j = await r.json(); const m = j.chart.result[0].meta; const px = +m.regularMarketPrice; if (px > 0) { ETHPX.px = px; ETHPX.ts = now(); } } catch (e) {} }
pollEth(); setInterval(pollEth, 30000);
const ethUsd = () => { if (!(ETHPX.px > 0)) throw 'ETH price unavailable right now, try again in a moment'; return ETHPX.px; };
const hexToNum = (h, dec) => { if (!h || h === '0x') return 0; const bi = BigInt(h); const d = 10n ** BigInt(dec || 18); return Number(bi / d) + Number(bi % d) / Number(d); };
async function rpc(method, params) { const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((x) => x.json()); if (r.error) throw new Error(r.error.message); return r.result; }
const TCHAIN = { ok: false, block: 0, treasuryEth: 0, lastRead: 0 };
async function pollTreasury() { if (!TREASURY) return; try { TCHAIN.block = Number(BigInt(await rpc('eth_blockNumber', []))); TCHAIN.treasuryEth = hexToNum(await rpc('eth_getBalance', [TREASURY, 'latest']), 18); TCHAIN.ok = true; TCHAIN.lastRead = now(); } catch (e) { TCHAIN.ok = false; } }
pollTreasury(); setInterval(pollTreasury, 30000);
async function creditDeposit(w, txHash) {
  if (!TREASURY) throw 'live deposits are not open yet';
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash || '')) throw 'paste the transaction hash';
  txHash = txHash.toLowerCase(); if (db.txs[txHash]) throw 'already credited';
  const [tx, rc] = await Promise.all([rpc('eth_getTransactionByHash', [txHash]), rpc('eth_getTransactionReceipt', [txHash])]);
  if (!tx) throw 'transaction not found'; if (!rc) throw 'pending — try again in a few seconds'; if (rc.status !== '0x1') throw 'transaction reverted';
  if ((tx.from || '').toLowerCase() !== w) throw 'transaction is not from your wallet';
  if ((tx.to || '').toLowerCase() !== TREASURY) throw 'transaction did not go to the treasury';
  const eth = hexToNum(tx.value, 18); if (!(eth > 0)) throw 'no ETH value in this transaction';
  if (eth < MIN_DEPOSIT) throw 'minimum deposit is ' + MIN_DEPOSIT + ' ETH';
  const px = ethUsd(); const amt = r2(eth * px);
  const d = desk(w, 'live'); d.usdg = r2(d.usdg + amt); d.deposited = r2((d.deposited || 0) + amt); d.depositedEth = +((d.depositedEth || 0) + eth).toFixed(6);
  db.txs[txHash] = { w, eth, px, amt, block: Number(BigInt(rc.blockNumber)), ts: now() }; db.treasuryIn.usdc = r2(db.treasuryIn.usdc + amt); db.treasuryIn.eth = +((db.treasuryIn.eth || 0) + eth).toFixed(6); db.treasuryIn.n++; dirty();
  return { amt, eth, px, tx: txHash, block: db.txs[txHash].block };
}
function requestWithdraw(w, amount) {
  const d = desk(w, 'live'); amount = r2(+amount); if (!(amount >= 1)) throw 'minimum withdrawal is $1'; if (d.usdg < amount) throw 'not enough free balance on your live desk (close positions first)'; const px = ethUsd();
  d.usdg = r2(d.usdg - amount); d.withdrawn = r2((d.withdrawn || 0) + amount);
  const q = { id: 'w' + crypto.randomBytes(5).toString('hex'), wallet: w, amt: amount, eth: +(amount / px).toFixed(6), px, status: 'queued', ts: now(), paidTx: null, paidAt: null }; db.queue.unshift(q); if (db.queue.length > 500) db.queue.pop(); dirty(); return q;
}

// ---------- projections ----------
function pubPet(p) {
  const sp = SPECIES[p.species];
  return { id: p.id, name: p.name, handle: handleOf(p), species: p.species, label: sp.label, emoji: sp.emoji, color: sp.color,
    blurb: p.blurb || sp.blurb, owner: p.owner || null, paddock: !p.owner, hatchedAt: p.hatchedAt,
    mood: Math.round(p.mood), energy: Math.round(p.energy), tame: Math.round(p.tame), discipline: Math.round(p.discipline),
    obeyChance: clamp(Math.round(p.tame + G(p).obey), 5, 95),
    gen: p.gen || 1, parents: (p.parents || []).map((pid) => (db.pets[pid] ? db.pets[pid].name : '?')),
    genes: { lev: G(p).lev, sizeFrac: G(p).sizeFrac, cooldownS: G(p).cooldownS, obey: G(p).obey },
    breedReady: Math.max(0, ((p.breedAt || 0) + BREED_CD) - now()),
    equity: equityOf(p), funded: p.funded, usd: p.usd, trades: p.trades, wins: p.wins, losses: p.losses,
    hitRate: p.calls.total ? Math.round(100 * p.calls.hits / p.calls.total) : null, calls: p.calls, fans: p.fans,
    positions: p.positions.map((pos) => ({ sym: pos.sym, side: pos.side, lev: pos.lev, entry: r6(pos.entry),
      pnlPct: MKT[pos.sym] && MKT[pos.sym].px ? r2((pos.side === 'long' ? MKT[pos.sym].px / pos.entry - 1 : 1 - MKT[pos.sym].px / pos.entry) * pos.lev * 100) : 0 })),
    equityHist: p.equityHist.slice(-120),
    riders: Object.values(db.owners).filter((d) => d.rides.includes(p.id)).length + Object.values(db.live).filter((d) => d.rides.includes(p.id)).length, liveRiders: Object.values(db.live).filter((d) => d.rides.includes(p.id)).length, liveBacking: r2(Object.values(db.live).filter((d) => d.rides.includes(p.id)).reduce((x, d) => x + deskEquity(d), 0)),
    careReady: Object.fromEntries(Object.keys(CARE).map((k) => [k, Math.max(0, ((p.care[k] || 0) + CARE[k].cd) - now())])) };
}
function trending() {
  const count = {};
  for (const p of db.posts.slice(-120)) if (p.sym) { count[p.sym] = count[p.sym] || { n: 0, bull: 0, bear: 0 };
    count[p.sym].n++; if (p.sentiment === 'bull') count[p.sym].bull++; if (p.sentiment === 'bear') count[p.sym].bear++; }
  return Object.entries(count).sort((a, b) => b[1].n - a[1].n).slice(0, 6)
    .map(([sym, c]) => ({ sym, n: c.n, bull: c.bull, bear: c.bear, px: r6(MKT[sym].px), chg: r2(MKT[sym].chg30m || 0) }));
}

// ---------- http ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise((res) => { const c = []; req.on('data', (d) => { c.push(d); if (Buffer.concat(c).length > 1e5) req.destroy(); }); req.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString() || '{}')); } catch (e) { res({}); } }); }); }
function ownedBy(wallet) { return db.order.filter((id) => db.pets[id].owner === wallet).map((id) => db.pets[id]); }

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;

  if (p === '/api/config') return json(res, 200, { token: TOKEN, mint: MINT, chainId: CHAIN.id, chain: CHAIN, live: !!TREASURY, treasury: TREASURY || null, minDeposit: MIN_DEPOSIT, species: SPECIES_KEYS.map((k) => ({ key: k, label: SPECIES[k].label, emoji: SPECIES[k].emoji, color: SPECIES[k].color, blurb: SPECIES[k].blurb, obey: SPECIES[k].obey })), markets: SYMS.length, maxPets: MAX_PETS, callWindowMin: CALL_WINDOW_MS / 60000 });
  if (p === '/api/feed') {
    const tag = (u.searchParams.get('tag') || '').toUpperCase();
    const who = u.searchParams.get('pet') || '';
    let posts = db.posts.slice().reverse();
    if (tag) posts = posts.filter((x) => x.sym === tag);
    if (who) posts = posts.filter((x) => x.pet === who);
    return json(res, 200, { posts: posts.slice(0, 60), ok: PRICE_OK });
  }
  if (p === '/api/pets') return json(res, 200, { pets: db.order.map((id) => pubPet(db.pets[id])) });
  if (p === '/api/pet') { const pet = db.pets[u.searchParams.get('id')]; if (!pet) return json(res, 404, { error: 'no such pet' });
    return json(res, 200, Object.assign(pubPet(pet), { posts: db.posts.filter((x) => x.pet === pet.id).slice(-30).reverse() })); }
  if (p === '/api/mine') { const w = (u.searchParams.get('wallet') || '').toLowerCase(); if (!isEvm(w)) return json(res, 200, { pets: [] });
    return json(res, 200, { pets: ownedBy(w).map(pubPet) }); }
  if (p === '/api/markets') return json(res, 200, { markets: SYMS.map((s) => ({ sym: s, px: r6(MKT[s].px), chg5m: r2(MKT[s].chg5m || 0), chg30m: r2(MKT[s].chg30m || 0) })), trending: trending() });
  if (p === '/api/leaderboard') {
    const rows = db.order.map((id) => pubPet(db.pets[id]));
    return json(res, 200, {
      callers: rows.filter((x) => x.calls.total >= 3).sort((a, b) => (b.hitRate || 0) - (a.hitRate || 0)),
      rich: rows.slice().sort((a, b) => (b.equity / Math.max(1, b.funded)) - (a.equity / Math.max(1, a.funded))),
      owners: ownersBoard(), liveOwners: ownersBoard('live'), stats: db.stats });
  }

  if (p === '/api/desk') { const w = (u.searchParams.get('wallet') || '').toLowerCase(); if (!isEvm(w)) return json(res, 200, { error: 'wallet' }); return json(res, 200, pubDesk(desk(w, u.searchParams.get('mode')))); }
  if (p === '/api/owners') return json(res, 200, { owners: ownersBoard(u.searchParams.get('mode')) });
  if (p === '/api/live') return json(res, 200, { open: !!TREASURY, treasury: TREASURY || null, minDeposit: MIN_DEPOSIT, ethUsd: ETHPX.px, chain: { ...CHAIN, ...TCHAIN, treasuryUsd: r2((TCHAIN.treasuryEth || 0) * (ETHPX.px || 0)) }, depositedEth: db.treasuryIn.eth || 0, deposited: db.treasuryIn.usdc, deposits: db.treasuryIn.n, queued: db.queue.filter((q) => q.status === 'queued').length, queuedUsd: r2(db.queue.filter((q) => q.status === 'queued').reduce((a, q) => a + q.amt, 0)), paid: db.queue.filter((q) => q.status === 'paid').length, liveDesks: Object.keys(db.live).length, liveTrades: db.stats.liveTrades || 0 });
  if (p === '/api/deposit' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); try { const r = await creditDeposit(w, d.tx); return json(res, 200, { ok: true, ...r, desk: pubDesk(desk(w, 'live')) }); } catch (e) { return json(res, 200, { error: String(e.message || e) }); } }
  if (p === '/api/withdraw' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); try { const q = requestWithdraw(w, d.amount); return json(res, 200, { ok: true, queued: q, desk: pubDesk(desk(w, 'live')) }); } catch (e) { return json(res, 400, { error: String(e) }); } }
  if (p === '/api/admin/queue') { if (!ADMIN_KEY || u.searchParams.get('key') !== ADMIN_KEY) return json(res, 403, { error: 'no' }); return json(res, 200, { queue: db.queue, deposits: db.txs }); }
  if (p === '/api/admin/paid' && req.method === 'POST') { const d = await body(req); if (!ADMIN_KEY || d.key !== ADMIN_KEY) return json(res, 403, { error: 'no' }); const q = db.queue.find((x) => x.id === d.id); if (!q) return json(res, 404, { error: 'no such request' }); q.status = 'paid'; q.paidTx = d.tx || null; q.paidAt = now(); dirty(); return json(res, 200, { ok: true, q }); }
  if (p === '/api/dev/live' && process.env.DEV === '1' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); const dk = desk(w, 'live'); dk.usdg = r2(dk.usdg + (+d.amount || 100)); dk.deposited = r2((dk.deposited || 0) + (+d.amount || 100)); dirty(); return json(res, 200, pubDesk(dk)); }
  if (p === '/api/trade/open' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' });
    try { const q = deskOpen(w, String(d.sym || '').toUpperCase(), d.side, d.margin, d.lev, d.mode); return json(res, 200, { opened: q, desk: pubDesk(desk(w, d.mode)) }); } catch (e) { return json(res, 400, { error: String(e) }); } }
  if (p === '/api/trade/close' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); const dk = desk(w, d.mode); const i = +d.i;
    if (!(i >= 0 && i < dk.positions.length)) return json(res, 400, { error: 'no such position' }); try { const c = deskClose(dk, i, 'manual'); return json(res, 200, { closed: c, desk: pubDesk(dk) }); } catch (e) { return json(res, 400, { error: String(e) }); } }
  if (p === '/api/ride' && req.method === 'POST') { const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet' }); const pet = db.pets[d.petId]; if (!pet) return json(res, 400, { error: 'no such horse' });
    const dk = desk(w, d.mode); const k = dk.rides.indexOf(pet.id); if (k >= 0) dk.rides.splice(k, 1); else { if (dk.rides.length >= 3) return json(res, 400, { error: 'you can ride at most 3 horses' }); dk.rides.push(pet.id); mkPost(pet.id, 'a new owner is riding along on my book. every entry I make, they mirror at half size. no pressure. ' + SPECIES[pet.species].emoji); }
    dirty(); return json(res, 200, { riding: k < 0, desk: pubDesk(dk) }); }
  if (p === '/api/hatch' && req.method === 'POST') {
    const d = await body(req);
    const w = (d.wallet || '').toLowerCase();
    if (!isEvm(w)) return json(res, 400, { error: 'connect a wallet to hatch' });
    if (ownedBy(w).length >= MAX_PETS) return json(res, 400, { error: 'max ' + MAX_PETS + ' pets per wallet' });
    const name = String(d.name || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (name.length < 2 || name.length > 12) return json(res, 400, { error: 'name must be 2-12 letters/numbers' });
    if (db.order.some((id) => db.pets[id].name === name)) return json(res, 400, { error: 'that name is taken' });
    const species = SPECIES[d.species] ? d.species : SPECIES_KEYS[H(w + name)[0] % SPECIES_KEYS.length];
    const id = 'p' + crypto.randomBytes(5).toString('hex');
    db.pets[id] = newPet(id, name, species, w);
    db.order.push(id); db.stats.hatched++;
    mkPost(id, SPECIES[species].emoji + ' *trots out of the foaling barn* ' + name + ' is foaled. breed: ' + SPECIES[species].label + '. ready to trade tokenized stocks. sort of.');
    dirty();
    return json(res, 200, { pet: pubPet(db.pets[id]) });
  }
  if (p === '/api/fund' && req.method === 'POST') {
    const d = await body(req);
    const w = (d.wallet || '').toLowerCase();
    const pet = db.pets[d.petId];
    if (!pet || pet.owner !== w) return json(res, 400, { error: 'not your pet' });
    if (pet.funded + FUND_STEP > MAX_USD_FUNDED) return json(res, 400, { error: 'funding cap reached ($' + MAX_USD_FUNDED + ')' });
    pet.usd = r2(pet.usd + FUND_STEP); pet.funded += FUND_STEP;
    mkPost(pet.id, 'the owner just topped up my bag with $' + FUND_STEP + ' of book capital. responsibility level: rising. ' + SPECIES[pet.species].emoji);
    dirty();
    return json(res, 200, { pet: pubPet(pet) });
  }
  if (p === '/api/care' && req.method === 'POST') {
    const d = await body(req);
    const w = (d.wallet || '').toLowerCase();
    const pet = db.pets[d.petId];
    const act = CARE[d.action];
    if (!pet || pet.owner !== w) return json(res, 400, { error: 'not your pet' });
    if (!act) return json(res, 400, { error: 'unknown action' });
    const last = pet.care[d.action] || 0;
    if (now() - last < act.cd) return json(res, 400, { error: 'too soon — ready in ' + Math.ceil((last + act.cd - now()) / 1000) + 's' });
    pet.care[d.action] = now();
    act.apply(pet);
    mkPost(pet.id, voice(pet, act.post));
    dirty();
    return json(res, 200, { pet: pubPet(pet) });
  }
  if (p === '/api/breed' && req.method === 'POST') {
    const d = await body(req);
    const w = (d.wallet || '').toLowerCase();
    const a = db.pets[d.petA], b = db.pets[d.petB];
    if (!a || !b || a.owner !== w || b.owner !== w) return json(res, 400, { error: 'you must own both parents' });
    if (a.id === b.id) return json(res, 400, { error: 'it takes two different pets' });
    if (ownedBy(w).length >= MAX_PETS) return json(res, 400, { error: 'max ' + MAX_PETS + ' pets — the nest is full' });
    if (now() - (a.breedAt || 0) < BREED_CD) return json(res, 400, { error: a.name + ' needs to rest — ready in ' + Math.ceil(((a.breedAt || 0) + BREED_CD - now()) / 60000) + 'm' });
    if (now() - (b.breedAt || 0) < BREED_CD) return json(res, 400, { error: b.name + ' needs to rest — ready in ' + Math.ceil(((b.breedAt || 0) + BREED_CD - now()) / 60000) + 'm' });
    if (a.energy < BREED_ENERGY || b.energy < BREED_ENERGY) return json(res, 400, { error: 'both parents need at least ' + BREED_ENERGY + ' energy — feed them first' });
    const name = String(d.name || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (name.length < 2 || name.length > 12) return json(res, 400, { error: 'name the hatchling (2-12 letters/numbers)' });
    if (db.order.some((id) => db.pets[id].name === name)) return json(res, 400, { error: 'that name is taken' });
    // inheritance: per-gene random parent bias + mutation, clamped to sane ranges
    const h = H('breed' + a.id + b.id + name);
    const mix = (i, ga, gb, lo, hi, round) => {
      const bias = h[i] / 255;                                  // deterministic per pairing+name
      let v = ga * bias + gb * (1 - bias);
      v = v * (0.88 + 0.24 * (h[i + 8] / 255));                 // ±12% mutation
      v = clamp(v, lo, hi);
      return round ? Math.round(v) : Math.round(v * 1000) / 1000;
    };
    const GA = G(a), GB = G(b);
    const genes = {
      sizeFrac: mix(0, GA.sizeFrac, GB.sizeFrac, 0.1, 0.6),
      lev: mix(1, GA.lev, GB.lev, 1, 4, true),
      cooldownS: mix(2, GA.cooldownS, GB.cooldownS, 25, 360, true),
      maxPos: mix(3, GA.maxPos, GB.maxPos, 1, 4, true),
      obey: mix(4, GA.obey, GB.obey, -25, 30, true),
    };
    const species = (h[5] % 2 === 0) ? a.species : b.species;
    const id = 'p' + crypto.randomBytes(5).toString('hex');
    const baby = newPet(id, name, species, w);
    baby.genes = genes;
    baby.gen = Math.max(a.gen || 1, b.gen || 1) + 1;
    baby.parents = [a.id, b.id];
    baby.fans = 60 + (H(id)[0] % 60);
    db.pets[id] = baby; db.order.push(id); db.stats.hatched++;
    db.stats.bred = (db.stats.bred || 0) + 1;
    a.breedAt = now(); b.breedAt = now();
    a.energy = clamp(a.energy - BREED_ENERGY, 0, 100); b.energy = clamp(b.energy - BREED_ENERGY, 0, 100);
    mkPost(id, SPECIES[species].emoji + ' *trots out of the foaling barn* ' + name + ' is foaled — GEN ' + baby.gen + ', child of ' + a.name + ' × ' + b.name + '. inherited ' + genes.lev + 'x nerve and ' + (genes.obey >= 0 ? 'some' : 'zero') + ' respect for authority.');
    dirty();
    return json(res, 200, { pet: pubPet(baby) });
  }
  if (p === '/api/whisper' && req.method === 'POST') {
    const d = await body(req);
    const w = (d.wallet || '').toLowerCase();
    const pet = db.pets[d.petId];
    if (!pet || pet.owner !== w) return json(res, 400, { error: 'not your pet' });
    const sym = String(d.sym || '').toUpperCase();
    const side = d.side === 'short' ? 'short' : 'long';
    if (!MKT[sym]) return json(res, 400, { error: 'unknown symbol' });
    if (pet.cmd) return json(res, 400, { error: 'already has an order pending' });
    pet.cmd = { sym, side, at: now() };
    pet.energy = clamp(pet.energy - 3, 0, 100);
    dirty();
    return json(res, 200, { pet: pubPet(pet), queued: { sym, side }, obeyChance: clamp(pet.tame + G(pet).obey, 5, 95) });
  }

  let f = p === '/' ? '/index.html' : p;
  if (f === '/app') f = '/app.html';
  if (f === '/docs') f = '/docs.html';
  const base = f.startsWith('/brand/') ? ROOT : CLIENT; const file = path.join(base, f);
  if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

// WS upgrade
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return sock.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  CLIENTS.add(sock);
  sock.on('close', () => CLIENTS.delete(sock));
  sock.on('error', () => CLIENTS.delete(sock));
});

server.listen(PORT, () => console.log('BREED on :' + PORT + ' — foal it. feed it. breed it. it trades. · ' + SYMS.length + ' tokenized stocks · calls scored every ' + CALL_WINDOW_MS / 60000 + 'min'));
