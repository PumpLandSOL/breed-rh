// Phone-width fixes for the 8-bit look: no sideways scroll, compact header. Idempotent.
const fs=require('fs'),path=require('path');
const CSS=`
/* mobile-fix */
.hero>div,.wrap,.tote>div{min-width:0}
@media(max-width:640px){
.bar{gap:6px!important;padding:0 10px!important;height:56px!important}
.logo,.logo b{font-size:13px!important}.logo span{display:none!important}
.bar .btn{font-size:7.5px!important;padding:8px 7px!important;white-space:nowrap;box-shadow:2px 2px 0 #056a09!important}
.bar a.btn[href="/docs"]{display:none!important}
.hero{padding:34px 0 24px!important;gap:24px!important}
.hero h1{font-size:44px!important}.hero p{font-size:16px!important}
.btn.big{font-size:9.5px!important;padding:13px 16px!important}
.silks{gap:5px!important}.silk{font-size:0!important}.silk .e{font-size:26px!important;top:50%!important;transform:translateY(-50%)}
.tote{grid-template-columns:repeat(3,1fr)!important}.tote>div{border-bottom:1px solid rgba(255,255,255,.1)}.tote>div{padding:10px 3px!important;text-align:center}
.tote .l{font-size:6.5px!important;letter-spacing:0!important}.tote .v{font-size:15px!important}
.sec h2{font-size:28px!important}
.wrap{padding:0 14px!important}
.tabs{flex-wrap:nowrap!important;overflow-x:auto;justify-content:flex-start!important;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}
.tab{white-space:nowrap;flex:0 0 auto;padding:8px 10px!important}
.trendrow{flex-wrap:nowrap!important;overflow-x:auto;justify-content:flex-start!important;scrollbar-width:none}.trendrow::-webkit-scrollbar{display:none}.tchip{flex:0 0 auto;white-space:nowrap}
.bhead .hd{display:none}.av{width:40px!important;height:40px!important;font-size:20px!important}
.msg{gap:9px!important}.bubble{padding:11px 12px!important}
.petcard,.prof{padding:16px 14px!important}.modal{padding:24px 10px!important}
.seg button{font-size:7px!important;padding:9px 4px!important}
.dtable{display:block;overflow-x:auto;white-space:nowrap}
.statstrip .hs{min-width:0!important;flex:1 1 40%}
.foot{font-size:6.5px!important}
}
`;
for(const f of ['index','app','docs']){const p=path.join(__dirname,'..','client',f+'.html');let h=fs.readFileSync(p,'utf8');
  h=h.replace(/\n\/\* mobile-fix \*\/[\s\S]*?(?=<\/style><\/head>)/,'');
  h=h.replace('</style></head>',()=>CSS+'</style></head>');fs.writeFileSync(p,h);console.log(f,h.includes('mobile-fix'))}
