// Stud Fees: a horse's owner earns 10% of every rider's winning mirrored trade. Idempotent.
const fs = require('fs'), path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const load = (f) => fs.readFileSync(R(f), 'utf8').split('\r').join('');
function patch(file, pairs) {
  let s = load(file);
  for (const [a, b] of pairs) { if (s.includes(b)) continue; if (!s.includes(a)) throw new Error(file + ' missing: ' + a.slice(0, 70)); s = s.split(a).join(b); }
  fs.writeFileSync(R(file), s); console.log('patched', file);
}
const NL = '\n';

patch('server/index.js', [
  ['const DESK_MAX_LEV = 3;', 'const DESK_MAX_LEV = 3;' + NL + 'const STUD_FEE = 0.10;          // share of a rider\'s winning mirrored trade paid to the horse\'s owner'],
  ["d.usdg = r2(d.usdg + q.margin * (1 + ret)); d.positions.splice(i, 1);",
    "d.usdg = r2(d.usdg + q.margin * (1 + ret)); const stud = studFee(d, q, pnlUsd); d.positions.splice(i, 1);"],
  ["pnlUsd, pnlPct: r2(ret * 100), why, ride: q.ride || null, t: now() });", "pnlUsd, pnlPct: r2(ret * 100), why, ride: q.ride || null, stud, t: now() });"],
  ['function deskClose(d, i, why) {',
    ['// Stud fee: when a mirrored trade closes in profit, 10% of that profit moves from the rider\'s desk to the desk of the horse\'s owner (same mode). Ledger-conserving.',
      'function studFee(d, q, pnlUsd) {',
      '  if (!q.ride || !(pnlUsd > 0)) return 0; const pet = db.pets[q.ride]; if (!pet || !pet.owner || pet.owner === d.wallet) return 0;',
      '  const fee = r2(pnlUsd * STUD_FEE); if (!(fee > 0)) return 0; const mode = d.mode === \'live\' ? \'live\' : \'practice\'; const od = desk(pet.owner, mode);',
      '  d.usdg = r2(d.usdg - fee); d.studPaid = r2((d.studPaid || 0) + fee); od.usdg = r2(od.usdg + fee); od.studEarned = r2((od.studEarned || 0) + fee);',
      '  pet.stud = pet.stud || { live: 0, practice: 0, n: 0 }; pet.stud[mode] = r2(pet.stud[mode] + fee); pet.stud.n++;',
      '  db.stats.stud = db.stats.stud || { live: 0, practice: 0, n: 0 }; db.stats.stud[mode] = r2(db.stats.stud[mode] + fee); db.stats.stud.n++;',
      '  if (mode === \'live\' || fee >= 5) mkPost(pet.id, \'stud fee paid. a rider banked $\' + pnlUsd.toFixed(2) + \' on my $\' + q.sym + \' and $\' + fee.toFixed(2) + \' of it went to my owner\' + (mode === \'live\' ? \', in real ETH terms\' : \'\') + \'. good horses pay rent.\');',
      '  return fee;',
      '}',
      'function deskClose(d, i, why) {'].join(NL)],
  ["trades: d.trades, wins: d.", "studEarned: d.studEarned || 0, studPaid: d.studPaid || 0, trades: d.trades, wins: d."],
  ["calls: p.calls,", "calls: p.calls, stud: p.stud || { live: 0, practice: 0, n: 0 },"],
  ["owners: ownersBoard(), liveOwners: ownersBoard('live'), stats: db.stats });",
    "owners: ownersBoard(), liveOwners: ownersBoard('live'), studs: rows.filter((x) => x.stud.n > 0).sort((a, b) => (b.stud.live - a.stud.live) || (b.stud.practice - a.stud.practice)).slice(0, 20), studFee: STUD_FEE, stats: db.stats });"],
]);

patch('client/app.html', [
  ["<div class=\"pstat\"><span>W / L</span><b>'+dk.wins+' / '+dk.losses+'</b></div></div>'+",
    "<div class=\"pstat\"><span>W / L</span><b>'+dk.wins+' / '+dk.losses+'</b></div></div>'+'<div class=\"pstatgrid\" style=\"grid-template-columns:1fr 1fr\"><div class=\"pstat\"><span>stud fees earned</span><b style=\"color:var(--bull)\">$'+(dk.studEarned||0).toLocaleString()+'</b></div><div class=\"pstat\"><span>stud fees paid</span><b>$'+(dk.studPaid||0).toLocaleString()+'</b></div></div>'+"],
  ["'% of the time · '+(p.riders||0)+' riding'+", "'% of the time · '+(p.riders||0)+' riding · stud fees earned $'+((p.stud&&(p.stud.live+p.stud.practice))||0).toLocaleString()+"],
  ["' · '+(a.riders||0)+' riding'+", "' · '+(a.riders||0)+' riding · stud fees $'+((a.stud&&(a.stud.live+a.stud.practice))||0).toLocaleString()+"],
  ["mirror a horse\\'s entries at half size · up to 3", "mirror a horse\\'s entries at half size · 10% of a winning ride goes to the horse\\'s owner as a stud fee · up to 3"],
]);

patch('client/index.html', [
  ['<div class="card red"><div class="k">06 · Scored</div>',
    '<div class="card blue"><div class="k">NEW · Stud fees</div><h3>Own the horse, earn the rent</h3><p>Every time a rider closes a winning mirrored trade, 10% of that profit moves to the desk of the horse\'s owner. Foal it, train it, get it ridden, and every rider\'s win pays you. On Live desks the fee is part of your withdrawable ETH balance.</p></div>' + NL + '      <div class="card red"><div class="k">06 · Scored</div>'],
  ['<details><summary>Can I trade myself instead of riding?</summary>',
    '<details><summary>What are stud fees?</summary><p>When you ride a horse that another wallet owns and your mirrored trade closes in profit, 10% of that profit is paid to the owner\'s desk as a stud fee. Losing trades pay nothing. Practice rides pay the owner\'s Practice desk, Live rides pay the owner\'s Live desk, where the fee is withdrawable like any other balance. Paddock horses have no owner and charge no fee. Each horse\'s card shows the stud fees it has earned, and each desk shows fees earned and paid.</p></details>' + NL + '      <details><summary>Can I trade myself instead of riding?</summary>'],
]);

patch('client/docs.html', [
  ['<h2><span>V</span>Owner\'s Desk · Practice</h2>',
    '<h2><span>★</span>Stud fees</h2>' + NL + '<div class="eq">on close of a mirrored position with pnl &gt; 0 and horse.owner ≠ rider' + NL + 'fee   = pnl × 0.10' + NL + 'rider.balance −= fee     owner.balance += fee     (same mode: Practice→Practice, Live→Live)</div>' + NL + '<p>Stud fees are ledger transfers between desks, so the books always sum. Paddock horses charge nothing. Fees earned on a Live desk are free balance and can be withdrawn.</p>' + NL + NL + '<h2><span>V</span>Owner\'s Desk · Practice</h2>'],
]);
