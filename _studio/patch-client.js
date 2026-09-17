// STABLE client patch: vocabulary, racing-silks retheme (turf green + silks + tote-board type), Owner's Desk tab with stock trading + ride-along.
const fs = require('fs'), path = require('path');
const A = path.join(__dirname, '..', 'client', 'app.html');
let a = fs.readFileSync(A, 'utf8').replace(/\r\n/g, '\n');
const sw = (from, to) => { if (!a.includes(from)) throw new Error('miss: ' + from.slice(0, 70)); a = a.split(from).join(to); };
const swOpt = (from, to) => { a = a.split(from).join(to); };

// ---- vocabulary
sw('<title>TAME — The Club Floor</title>', '<title>STABLE — The Rail</title>');
sw('The club floor of the pedigree registry. Register an AI trading companion, fund it, train it, breed it — every call scored against the tape.', 'The rail at the stable. Foal an AI racehorse that trades tokenized stocks, feed it, break it, breed it, ride along on its book, and trade the same 22 stocks from your own desk.');
sw("fill='%231f4030'/><text x='16' y='22' font-size='15' text-anchor='middle' fill='%23c9a959' font-family='Georgia'>T</text>", "fill='%230b3d2e'/><text x='16' y='22' font-size='15' text-anchor='middle' fill='%23f2c531' font-family='Georgia'>S</text>");
sw('<a class="logo" href="/">TA<b>ME</b> <span style="font-variant:small-caps;font-size:11px;letter-spacing:.2em;color:#a8b39a;font-weight:400;margin-left:8px">the club floor</span></a>', '<a class="logo" href="/">STA<b>BLE</b> <span style="font-size:11px;letter-spacing:.24em;color:#9fd3b6;font-weight:600;margin-left:8px;text-transform:uppercase">the rail</span></a>');
sw('>Club Rules</a>', '>Stable Rules</a>');
sw('https://x.com/TameProtocol', 'https://x.com/StableRH');
sw('<button class="tab on" data-v="feed">The Floor</button>', '<button class="tab on" data-v="feed">The Rail</button>');
sw('<button class="tab" data-v="mine">My Kennel</button>', '<button class="tab" data-v="mine">My Stable</button><button class="tab" data-v="desk">Owner\'s Desk</button>');
sw('<button class="tab" data-v="callers">Field Trials</button>', '<button class="tab" data-v="callers">The Derby</button>');
sw('<button class="tab" data-v="rich">Best in Show</button>', '<button class="tab" data-v="rich">Winner\'s Circle</button>');
sw('<button class="tab" data-v="shelter">The Shelter</button>', '<button class="tab" data-v="shelter">The Paddock</button>');
swOpt('connect a wallet, register a companion, and this page becomes your kennel.', 'connect a wallet, foal a horse, and this page becomes your stable.');
swOpt('no companions on your register.', 'no horses in your stable.');
swOpt('enroll your first →', 'foal your first →');
swOpt('The Nest', 'The Breeding Shed');
swOpt('two champions → one egg. the hatchling inherits', 'two champions → one foal. the foal inherits');
swOpt('HATCHLING NAME', 'FOAL NAME');
swOpt('🥚 Make an egg', '🐴 Breed a foal');
swOpt("hatched — GEN", "foaled — GEN");
swOpt('<div class="pe">🥚</div><div class="pn">ENROLL</div>', '<div class="pe">🐴</div><div class="pn">FOAL</div>');
swOpt('📜 Register a companion', '🏇 Foal a horse');
swOpt('choose a breed (or leave it to the litter), give it a name worthy of the registry, and it begins trading tokenized stocks', 'choose a breed (or let the barn decide), give it a name worthy of the stud book, and it begins trading tokenized stocks');
swOpt('REGISTERED', 'OWNED'); swOpt('SHELTER', 'PADDOCK');
swOpt('the companions are waking up', 'the horses are waking up');
swOpt('the stewards return in 30 minutes', 'the stewards return in 30 minutes');
swOpt('READING THE WIRE…', 'READING THE TAPE…');
swOpt('companion', 'horse'); swOpt('Companion', 'Horse'); swOpt('kennel', 'stable'); swOpt('Kennel', 'Stable'); swOpt('shelter pets', 'paddock horses'); swOpt('registry', 'stud book'); swOpt('Registry', 'Stud Book');

// ---- retheme: tokens, fonts, hard-coded header colors
sw("family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600", "family=Barlow+Condensed:wght@500;700;800;900&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600");
const r0 = a.indexOf(':root{'); const r1 = a.indexOf('}', r0) + 1;
a = a.slice(0, r0) + `:root{
  --bg:#0b3d2e; --panel:#114a38; --panel2:#0d4232; --ink:#f4f1e6; --sub:#c9dccd; --mut:#8fb3a0;
  --pink:#f2c531; --mint:#d8262c; --bull:#5ee39a; --bear:#ff6b6b; --blu:#2f6fd6; --gold:#f2c531;
  --line:rgba(242,197,49,.45); --line2:rgba(244,241,230,.18);
  --lcd:#062418; --lcdink:#f2c531;
  --pix:'Barlow',system-ui,sans-serif;
  --serif:'Barlow Condensed',Impact,sans-serif; --mono:'IBM Plex Mono',monospace;
}` + a.slice(r1);
sw("body{background:var(--bg);color:var(--ink);font-family:'Source Serif 4',Georgia,serif;font-size:15px;line-height:1.6;\n  background-image:radial-gradient(900px 460px at 50% -5%,rgba(176,141,46,.09),transparent 60%)}", "body{background:var(--bg);color:var(--ink);font-family:'Barlow',system-ui,sans-serif;font-size:15px;line-height:1.55;\n  background-image:repeating-linear-gradient(90deg,transparent 0 120px,rgba(255,255,255,.025) 120px 240px)}");
sw("header{position:sticky;top:0;z-index:50;background:var(--mint);color:#e9e2cf;border-bottom:3px double var(--gold)}", "header{position:sticky;top:0;z-index:50;background:#062418;color:#f4f1e6;border-bottom:4px solid var(--gold);background-image:repeating-linear-gradient(45deg,#062418 0 14px,#0a2f22 14px 28px)}");
sw(".logo{font-family:var(--serif);font-weight:900;font-size:19px;color:#f2ead8}\n.logo b{color:#c9a959}", ".logo{font-family:var(--serif);font-weight:900;font-size:26px;color:#f4f1e6;letter-spacing:.04em;text-transform:uppercase}\n.logo b{color:var(--gold)}");
sw("font-size:13.5px;padding:9px 18px;cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:'Source Serif 4',serif}", "font-size:13px;padding:9px 18px;cursor:pointer;border:2px solid transparent;transition:all .15s;font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-variant:normal}");
sw(".btn-pink{background:var(--gold);color:#1d2417;border-color:#8a6d20}\n.btn-pink:hover{background:#c9a959}", ".btn-pink{background:var(--gold);color:#062418;border-color:#b8921a}\n.btn-pink:hover{background:#ffd54a}");
sw(".btn-mint{background:var(--mint);color:#e9e2cf;border-color:#16301f}\n.btn-mint:hover{background:#2c5741}", ".btn-mint{background:var(--mint);color:#fff;border-color:#a3161b}\n.btn-mint:hover{background:#ff3b41}");
sw(".btn-ghost{background:transparent;color:#cfd6bf;border-color:#40573f}", ".btn-ghost{background:transparent;color:#e6efe8;border-color:#2f6b52}");
swOpt('#e9e2cf', '#f4f1e6'); swOpt('#c9a959', '#f2c531'); swOpt('#f2ead8', '#f4f1e6'); swOpt('#1d2417', '#062418'); swOpt('rgba(31,64,48,.6)', 'rgba(6,36,24,.7)'); swOpt('#4a4a33', '#f2c531');

// ---- Owner's Desk view + ride-along
sw("    if(VIEW==='shelter'){", `    if(VIEW==='desk'){
      if(!wallet){$('feed').innerHTML='<div class="empty">connect a wallet and the desk opens with $10,000 paper USDG. trade the same 22 stocks the horses do, or ride along on a horse\\'s book.</div>';return}
      const dk=await api('/api/desk?wallet='+wallet);const m=await api('/api/markets');
      const opts=m.markets.map(x=>'<option value="'+x.sym+'">$'+x.sym+' · '+fmtPx(x.px)+'</option>').join('');
      const posRows=dk.positions.length?dk.positions.map(q=>'<tr><td><b>'+(q.side==='long'?'▲':'▼')+' $'+q.sym+'</b> '+q.lev+'x'+(q.ride?' <span class="tagpill s">RIDE · '+esc(q.ride)+'</span>':'')+'</td><td class="mono">$'+q.margin.toFixed(2)+' @ '+fmtPx(q.entry)+'</td><td class="mono" style="color:'+(q.pnlUsd>=0?'var(--bull)':'var(--bear)')+'">'+(q.pnlUsd>=0?'+':'')+'$'+q.pnlUsd.toFixed(2)+' ('+(q.pnlPct>=0?'+':'')+q.pnlPct.toFixed(2)+'%)</td><td><button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="deskClose('+q.i+')">close</button></td></tr>').join(''):'<tr><td colspan="4" class="mono" style="color:var(--mut)">no open positions</td></tr>';
      const hist=dk.hist.length?dk.hist.slice(0,8).map(h=>'<tr><td>'+(h.side==='long'?'▲':'▼')+' $'+h.sym+' '+h.lev+'x'+(h.ride?' · ride':'')+'</td><td class="mono">'+fmtPx(h.entry)+' → '+fmtPx(h.exit)+'</td><td class="mono" style="color:'+(h.pnlUsd>=0?'var(--bull)':'var(--bear)')+'">'+(h.pnlUsd>=0?'+':'')+'$'+h.pnlUsd.toFixed(2)+'</td><td class="mono" style="color:var(--mut)">'+esc(h.why)+'</td></tr>').join(''):'<tr><td colspan="4" class="mono" style="color:var(--mut)">nothing closed yet</td></tr>';
      const rideIds=dk.rides.map(r=>r.id);
      const horses=PETS.map(p=>'<div class="lbrow"><div class="lbav" style="border-color:'+p.color+'">'+p.emoji+'</div><div class="lbmain"><b>'+esc(p.name)+'</b> <span class="mono" style="font-size:11px;color:var(--mut)">'+p.label+' · '+(p.hitRate!=null?p.hitRate+'% hit':'unscored')+' · '+p.riders+' riding</span></div><button class="btn '+(rideIds.includes(p.id)?'btn-mint':'btn-ghost')+'" style="padding:6px 12px;font-size:11px" onclick="ride(\\''+p.id+'\\')">'+(rideIds.includes(p.id)?'riding · stop':'ride along')+'</button></div>').join('');
      $('feed').innerHTML='<div class="petcard"><div class="ptop"><div class="pav" style="border-color:var(--gold)">🏁</div><div style="flex:1"><h3>Owner\\'s Desk <span class="mono" style="font-size:11px;color:var(--mut)">'+short(wallet)+'</span></h3><div class="ph">your own book on the same 22 tokenized stocks. up to '+dk.maxLev+'x. same tape the horses trade.</div></div></div>'+
        '<div class="pstatgrid"><div class="pstat"><span>equity</span><b>$'+dk.equity.toLocaleString()+'</b></div><div class="pstat"><span>cash</span><b>$'+dk.usdg.toLocaleString()+'</b></div><div class="pstat"><span>ROI</span><b style="color:'+(dk.roi>=0?'var(--bull)':'var(--bear)')+'">'+(dk.roi>=0?'+':'')+dk.roi+'%</b></div><div class="pstat"><span>W / L</span><b>'+dk.wins+' / '+dk.losses+'</b></div></div>'+
        '<div class="whisper"><span style="font-size:11px;letter-spacing:.16em;color:var(--sub);text-transform:uppercase;font-weight:700">TRADE</span><select id="dkSym">'+opts+'</select><select id="dkSide"><option value="long">LONG</option><option value="short">SHORT</option></select><select id="dkLev"><option value="1">1x</option><option value="2">2x</option><option value="3">3x</option></select><input id="dkMargin" placeholder="margin $" value="500" style="background:var(--bg);border:1px solid var(--line2);padding:9px 10px;font-family:var(--mono);font-size:12px;color:var(--ink);width:110px"><button class="btn btn-pink" style="padding:8px 14px;font-size:12px" onclick="deskOpen()">Place</button></div>'+
        '<table class="dtable"><thead><tr><th>position</th><th>margin @ entry</th><th>p&l</th><th></th></tr></thead><tbody>'+posRows+'</tbody></table>'+
        '<h3 style="margin-top:18px">Ride along <span class="mono" style="font-size:11px;color:var(--mut)">mirror a horse\\'s entries at half size · up to 3</span></h3>'+horses+
        '<h3 style="margin-top:18px">Closed</h3><table class="dtable"><tbody>'+hist+'</tbody></table></div>';
      return}
    if(VIEW==='shelter'){`);
sw("window.breed=async()=>{", `window.deskOpen=async()=>{if(!wallet)return connect();try{const r=await api('/api/trade/open',{wallet,sym:$('dkSym').value,side:$('dkSide').value,lev:$('dkLev').value,margin:$('dkMargin').value});toast('opened '+r.opened.side+' $'+r.opened.sym+' '+r.opened.lev+'x @ '+fmtPx(r.opened.entry));refreshFeed()}catch(e){toast(e.message)}};
window.deskClose=async(i)=>{try{const r=await api('/api/trade/close',{wallet,i});toast('closed $'+r.closed.sym+' '+(r.closed.pnlUsd>=0?'+':'')+'$'+r.closed.pnlUsd.toFixed(2));refreshFeed()}catch(e){toast(e.message)}};
window.ride=async(id)=>{if(!wallet)return connect();try{const r=await api('/api/ride',{wallet,petId:id});toast(r.riding?'riding along — every entry mirrors at half size':'dismounted');await refreshRails();refreshFeed()}catch(e){toast(e.message)}};
window.breed=async()=>{`);
// desk table style
sw('.toast{position:fixed;', '.dtable{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}.dtable th{text-align:left;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);border-bottom:1px solid var(--line2);padding:6px 8px}.dtable td{padding:7px 8px;border-bottom:1px solid var(--line2);vertical-align:middle}\n.toast{position:fixed;');
fs.writeFileSync(A, a.replace(/\n/g, '\r\n'));
console.log('patched client');
