/* jockey silks: drawn, not emoji */
var SILKS={'#c8102e':['hoops','#c8102e','#f4efe3'],'#f5a623':['hoops','#c8102e','#f4efe3'],
'#1b1b1b':['sash','#26231d','#00c805'],'#c084fc':['sash','#26231d','#00c805'],
'#e0a100':['spots','#e0a100','#1b1b1b'],'#ff2d95':['spots','#e0a100','#1b1b1b'],
'#0b7a1e':['halves','#0b7a1e','#f4efe3'],'#37d67a':['halves','#0b7a1e','#f4efe3'],
'#1d3f8f':['chevrons','#1d3f8f','#f4efe3'],'#29f3ff':['chevrons','#1d3f8f','#f4efe3']};
var _sk=0;
function silk(color,size){var s=SILKS[String(color||'').toLowerCase()]||['halves','#1b1b1b','#f4efe3'],p=s[0],a=s[1],b=s[2],id='sk'+(++_sk),m='';
  if(p==='hoops')for(var y=6;y<40;y+=10)m+='<rect x="0" y="'+y+'" width="40" height="5" fill="'+b+'"/>';
  if(p==='sash')m='<path d="M4 6 L14 6 L38 36 L28 36Z" fill="'+b+'"/>';
  if(p==='spots')[[14,16],[26,16],[20,24],[14,31],[26,31],[6,15],[34,15]].forEach(function(c){m+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="2.6" fill="'+b+'"/>'});
  if(p==='halves')m='<rect x="20" y="0" width="20" height="40" fill="'+b+'"/>';
  if(p==='chevrons')for(var k=0;k<3;k++)m+='<path d="M0 '+(14+k*9)+' L20 '+(22+k*9)+' L40 '+(14+k*9)+'" fill="none" stroke="'+b+'" stroke-width="3.4"/>';
  var d='M13 7 L20 10.5 L27 7 L37.5 13.5 L33.5 22 L29 19.8 L29 35.5 L11 35.5 L11 19.8 L6.5 22 L2.5 13.5Z';
  return '<svg class="silkv" viewBox="0 0 40 40" width="'+(size||28)+'" height="'+(size||28)+'" aria-hidden="true"><defs><clipPath id="'+id+'"><path d="'+d+'"/></clipPath></defs><g clip-path="url(#'+id+')"><rect width="40" height="40" fill="'+a+'"/>'+m+'</g><path d="'+d+'" fill="none" stroke="#ece5d3" stroke-width="1.4" stroke-linejoin="round"/></svg>';}
