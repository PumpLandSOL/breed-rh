// Arc retheme: white + sky-blue gradient, navy ink #1b3158, DM Sans / Space Grotesk / Space Mono, orange #e9a13f accent, periwinkle #acc6e9 buttons, charcoal #414c4c tote.
const fs = require('fs'), path = require('path');
const C = (f) => path.join(__dirname, '..', 'client', f);
const R = (f, fn) => { let s = fs.readFileSync(f, 'utf8'); const o = s; s = fn(s); if (s === o) console.log('NO CHANGE', f); fs.writeFileSync(f, s); };
const FONT = 'family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700';
const GRAD = 'background:linear-gradient(90deg,#2f578c,#412c5c);-webkit-background-clip:text;background-clip:text;color:transparent';
const ROOT = `:root{
  --bg:#f4f8fd; --panel:#ffffff; --panel2:#e9f1fb; --ink:#1b3158; --sub:#41464c; --mut:#7a858e;
  --pink:#e9a13f; --mint:#2f578c; --bull:#1f8a5a; --bear:#c9413a; --blu:#2f578c; --gold:#e9a13f;
  --line:rgba(27,49,88,.16); --line2:rgba(27,49,88,.12);
  --lcd:#1b3158; --lcdink:#acc6e9;
  --pix:'DM Sans',system-ui,sans-serif;
  --serif:'Space Grotesk',system-ui,sans-serif; --mono:'Space Mono',monospace;
}`;

R(C('app.html'), (s) => {
  s = s.replace(/family=Barlow\+Condensed[^"']*/, FONT);
  const r0 = s.indexOf(':root{'), r1 = s.indexOf('}', r0) + 1; s = s.slice(0, r0) + ROOT + s.slice(r1);
  s = s.replace(/body\{background:var\(--bg\);color:var\(--ink\);font-family:'Barlow',system-ui,sans-serif;font-size:15px;line-height:1\.55;\s*background-image:[^}]*\}/, "body{background:var(--bg);color:var(--ink);font-family:'DM Sans',system-ui,sans-serif;font-size:15px;line-height:1.55;background-image:linear-gradient(180deg,#cfe3f7 0%,#f4f8fd 420px)}");
  s = s.replace(/header\{position:sticky;top:0;z-index:50;background:#062418;color:#f4f1e6;border-bottom:4px solid var\(--gold\);background-image:[^}]*\}/, "header{position:sticky;top:0;z-index:50;background:rgba(244,248,253,.88);backdrop-filter:blur(10px);color:var(--ink);border-bottom:1px solid var(--line)}");
  s = s.replace(/\.logo\{font-family:var\(--serif\);font-weight:900;font-size:26px;color:#f4f1e6;letter-spacing:\.04em;text-transform:uppercase\}\s*\.logo b\{color:var\(--gold\)\}/, ".logo{font-family:var(--serif);font-weight:700;font-size:24px;color:var(--ink);letter-spacing:-.01em;text-transform:none}\n.logo b{" + GRAD + "}");
  s = s.replace(/font-size:13px;padding:9px 18px;cursor:pointer;border:2px solid transparent;transition:all \.15s;font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:\.14em;font-variant:normal\}/, "font-size:13.5px;padding:9px 18px;cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:'DM Sans',sans-serif;font-weight:600;text-transform:none;letter-spacing:0;font-variant:normal;border-radius:10px}");
  s = s.replace(/\.btn-pink\{background:var\(--gold\);color:#062418;border-color:#b8921a\}\s*\.btn-pink:hover\{background:#ffd54a\}/, ".btn-pink{background:#acc6e9;color:#1b3158;border-color:#9bb8e0}\n.btn-pink:hover{background:#bcd3f0}");
  s = s.replace(/\.btn-mint\{background:var\(--mint\);color:#fff;border-color:#a3161b\}\s*\.btn-mint:hover\{background:#ff3b41\}/, ".btn-mint{background:#1b3158;color:#fff;border-color:#1b3158}\n.btn-mint:hover{background:#2f578c}");
  s = s.replace(/\.btn-ghost\{background:transparent;color:#e6efe8;border-color:#2f6b52\}/, ".btn-ghost{background:#fff;color:var(--ink);border-color:var(--line)}");
  s = s.split('#f4f1e6').join('#1b3158').split('#062418').join('#ffffff').split('rgba(6,36,24,.7)').join('rgba(27,49,88,.25)');
  s = s.replace("color:#9fd3b6;font-weight:600;margin-left:8px;text-transform:uppercase", "color:var(--mut);font-weight:700;margin-left:8px;text-transform:uppercase;font-family:var(--mono)");
  return s;
});

R(C('index.html'), (s) => {
  s = s.replace(/family=Barlow\+Condensed[^"']*/, FONT);
  s = s.replace(/:root\{[^}]*\}/, ':root{--bg:#f4f8fd;--panel:#ffffff;--ink:#1b3158;--sub:#41464c;--mut:#7a858e;--gold:#e9a13f;--red:#c9413a;--blue:#2f578c;--bull:#1f8a5a;--bear:#c9413a;--line:rgba(27,49,88,.14);--peri:#acc6e9;--navy:#1b3158}');
  s = s.replace(/body\{background:var\(--bg\);color:var\(--ink\);font-family:'Barlow',system-ui,sans-serif;font-size:16px;line-height:1\.55;background-image:[^}]*\}/, "body{background:var(--bg);color:var(--ink);font-family:'DM Sans',system-ui,sans-serif;font-size:16px;line-height:1.55;background-image:linear-gradient(180deg,#cfe3f7 0%,#f4f8fd 560px)}");
  s = s.replace(/\.cond\{font-family:'Barlow Condensed',Impact,sans-serif;text-transform:uppercase\}\.mono\{font-family:'IBM Plex Mono',monospace\}/, ".cond{font-family:'Space Mono',monospace;text-transform:uppercase}.mono{font-family:'Space Mono',monospace}");
  s = s.replace(/header\{background:#062418;border-bottom:4px solid var\(--gold\);background-image:[^}]*\}/, "header{background:rgba(244,248,253,.88);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}");
  s = s.replace(/\.logo\{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:28px;letter-spacing:\.04em;text-transform:uppercase\}\.logo b\{color:var\(--gold\)\}/, ".logo{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:26px;letter-spacing:-.01em}.logo b{" + GRAD + "}");
  s = s.replace(/\.btn\{display:inline-flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:\.14em;font-size:14px;padding:11px 22px;border:2px solid transparent;cursor:pointer\}/, ".btn{display:inline-flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:600;font-size:15px;padding:12px 22px;border:1px solid transparent;cursor:pointer;border-radius:12px}");
  s = s.replace(/\.btn-gold\{[^}]*\}\.btn-ghost\{[^}]*\}\.btn-red\{[^}]*\}/, ".btn-gold{background:var(--peri);color:var(--navy);border-color:#9bb8e0}.btn-ghost{background:#fff;color:var(--navy);border-color:var(--line)}.btn-red{background:var(--navy);color:#fff}");
  s = s.replace(/\.hero h1\{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:clamp\(46px,7vw,96px\);line-height:\.92;letter-spacing:\.01em\}/, ".hero h1{font-family:'Space Grotesk',sans-serif;font-weight:500;text-transform:none;font-size:clamp(44px,6.4vw,84px);line-height:1.0;letter-spacing:-.02em}");
  s = s.replace('.hero h1 .g{color:var(--gold)}', '.hero h1 .g{' + GRAD + '}');
  s = s.replace(/\.silk\{aspect-ratio:3\/4;border:3px solid #062418;/, '.silk{aspect-ratio:3/4;border:2px solid #fff;border-radius:14px;box-shadow:0 10px 30px -14px rgba(27,49,88,.35);');
  s = s.replace(/color:#062418;text-shadow:0 1px 0 rgba\(255,255,255,\.4\)\}/, "color:#1b3158;text-shadow:0 1px 0 rgba(255,255,255,.6);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em}");
  s = s.replace(/\.s1\{[^}]*\}\.s2\{[^}]*\}\.s3\{[^}]*\}\.s4\{[^}]*\}\.s5\{[^}]*\}/, '.s1{background:repeating-linear-gradient(0deg,#e9a13f 0 14px,#fff 14px 28px)}.s2{background:#c9413a}.s3{background:linear-gradient(135deg,#2f578c 50%,#fff 50%)}.s4{background:radial-gradient(circle,#fff 30%,transparent 32%) 0 0/28px 28px,#acc6e9}.s5{background:repeating-linear-gradient(45deg,#fff 0 12px,#412c5c 12px 24px)}');
  s = s.replace(/\.tote\{display:grid;grid-template-columns:repeat\(5,1fr\);background:#062418;border:3px solid var\(--gold\);margin-top:10px\}/, '.tote{display:grid;grid-template-columns:repeat(5,1fr);background:#414c4c;border-radius:14px;margin-top:10px;overflow:hidden}');
  s = s.replace(/\.tote div\{padding:16px 18px;border-right:1px solid #1a4a38\}/, '.tote div{padding:16px 18px;border-right:1px solid rgba(255,255,255,.1)}');
  s = s.replace(/\.tote \.l\{[^}]*\}\.tote \.v\{[^}]*\}/, ".tote .l{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c8d1d8;font-weight:700;font-family:'Space Mono',monospace}.tote .v{font-family:'Space Mono',monospace;font-size:24px;font-weight:700;color:#fff;margin-top:2px}");
  s = s.replace(/\.sec h2\{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:40px;letter-spacing:\.02em;margin-bottom:6px\}/, ".sec h2{font-family:'Space Grotesk',sans-serif;font-weight:500;text-transform:none;font-size:38px;letter-spacing:-.02em;margin-bottom:6px}");
  s = s.replace(/\.card\{background:var\(--panel\);border:1px solid var\(--line\);border-top:5px solid var\(--gold\);padding:18px 20px\}/, '.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 12px 30px -20px rgba(27,49,88,.35)}');
  s = s.replace(/\.card\.red\{border-top-color:var\(--red\)\}\.card\.blue\{border-top-color:var\(--blue\)\}/, '.card.red{background:#fff7ec}.card.blue{background:#eef4fc}');
  s = s.replace(/\.card \.k\{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:\.14em;font-size:13px;color:var\(--mut\);margin-bottom:6px\}/, ".card .k{font-family:'Space Mono',monospace;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:var(--gold);margin-bottom:6px}");
  s = s.replace(/\.card h3\{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:26px;margin-bottom:8px\}/, ".card h3{font-family:'Space Grotesk',sans-serif;font-weight:700;text-transform:none;font-size:22px;margin-bottom:8px}");
  s = s.replace(/\.rail\{background:#062418;color:var\(--gold\);font-family:'IBM Plex Mono',monospace;font-size:12\.5px;white-space:nowrap;overflow:hidden;border-top:1px solid var\(--gold\);border-bottom:1px solid var\(--gold\)\}/, ".rail{background:#1b3158;color:#acc6e9;font-family:'Space Mono',monospace;font-size:12px;white-space:nowrap;overflow:hidden}");
  s = s.replace(/\.rail span\{padding:9px 18px;border-right:1px solid #1a4a38\}/, '.rail span{padding:9px 18px;border-right:1px solid rgba(255,255,255,.12)}');
  s = s.replace("color:'+(x.chg30m>=0?'#5ee39a':'#ff6b6b')+'", "color:'+(x.chg30m>=0?'#7fe0a8':'#ff9a94')+'");
  s = s.replace('<meta property="og:image" content="/brand/breed-keyart.png">', '<meta property="og:image" content="https://breedonarc.xyz/brand/breed-keyart.png"><meta property="og:url" content="https://breedonarc.xyz"><link rel="canonical" href="https://breedonarc.xyz">');
  return s;
});

R(C('docs.html'), (s) => {
  s = s.replace(/family=Barlow\+Condensed[^"']*/, FONT);
  s = s.replace(/:root\{[^}]*\}/, ':root{--bg:#f4f8fd;--panel:#ffffff;--ink:#1b3158;--sub:#41464c;--mut:#7a858e;--gold:#e9a13f;--line:rgba(27,49,88,.14)}');
  s = s.replace(/body\{background:var\(--bg\);color:var\(--ink\);font-family:'Barlow',system-ui,sans-serif;font-size:15\.5px;line-height:1\.6\}/, "body{background:var(--bg);color:var(--ink);font-family:'DM Sans',system-ui,sans-serif;font-size:15.5px;line-height:1.6;background-image:linear-gradient(180deg,#cfe3f7 0%,#f4f8fd 300px)}");
  s = s.replace(/header\{background:#062418;border-bottom:4px solid var\(--gold\);background-image:[^}]*\}/, 'header{background:rgba(244,248,253,.88);border-bottom:1px solid var(--line)}');
  s = s.replace(/\.logo\{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:28px;text-transform:uppercase;color:var\(--ink\)\}\.logo b\{color:var\(--gold\)\}/, ".logo{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:26px;color:var(--ink)}.logo b{" + GRAD + "}");
  s = s.split("font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase").join("font-family:'Space Grotesk',sans-serif;font-weight:700;text-transform:none").split("font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase").join("font-family:'Space Grotesk',sans-serif;font-weight:700;text-transform:none").split("font-family:'Barlow Condensed';font-weight:800;text-transform:uppercase;letter-spacing:.14em").join("font-family:'DM Sans';font-weight:600");
  s = s.split('#062418').join('#1b3158').split("'IBM Plex Mono'").join("'Space Mono'").replace(".eq{background:#1b3158;border-left:4px solid var(--gold);", ".eq{background:#fff;border:1px solid var(--line);border-left:4px solid var(--gold);").replace("overflow-x:auto;margin:10px 0;color:var(--ink)}", "overflow-x:auto;margin:10px 0;color:var(--ink);border-radius:10px}").replace("code{background:#1b3158;", "code{background:#eef4fc;").replace("font-size:13px;color:var(--gold)}", "font-size:13px;color:var(--ink)}");
  return s;
});
console.log('rethemed');
