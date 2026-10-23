'use strict';
/* ============================================================================
   MUSIC — optional drop-in soundtrack. Put audio files in www/music/ and list them
   in www/music/tracks.json, e.g. {"title":"title.ogg","duel":"duel.mp3","boss":"boss.ogg"}
   (keys: title, map, duel, boss, victory, death — any subset). Without tracks.json the
   in-game synthesized music keeps playing instead.
   Tracks loop (except victory/death) and cross-fade on scene changes.
   ========================================================================== */
const MUSIC=(()=>{
 const tracks={},want=['title','map','duel','boss','victory','death'];let cur=null,curName=null,vol=0.9,on=true,probed=false,fading=[];
 function probe(){if(probed)return;probed=true;fetch('music/tracks.json').then(r=>r.ok?r.json():null).then(j=>{if(!j)return;want.forEach(n=>{if(j[n]){const a=new Audio('music/'+j[n]);a.loop=!(n==='victory'||n==='death');a.preload='auto';tracks[n]=a;}});}).catch(()=>{});}
 const alias={boss:'duel',map:'title',victory:null,death:null};
 function resolve(n){if(tracks[n])return tracks[n];const a=alias[n];return a?tracks[a]:null;}
 function play(n){probe();const t=resolve(n);const key=t?(tracks[n]?n:alias[n]):null;if(key===curName)return;
  if(cur){const old=cur;fading.push({a:old,from:old.volume,to:0,t:0,done:()=>{old.pause();}});}
  cur=t;curName=key;if(t){try{t.currentTime=0;t.volume=0;const p=t.play();if(p&&p.catch)p.catch(()=>{});fading.push({a:t,from:0,to:on?vol:0,t:0});}catch(e){}}}
 function update(dt){for(let i=fading.length-1;i>=0;i--){const f=fading[i];f.t+=dt;const k=Math.min(1,f.t/0.8);try{f.a.volume=f.from+(f.to-f.from)*k;}catch(e){}if(k>=1){if(f.done)f.done();fading.splice(i,1);}}}
 function setVol(v){vol=v;if(cur&&!fading.some(f=>f.a===cur))try{cur.volume=on?v:0;}catch(e){}}
 function setOn(o){on=o;setVol(vol);}
 function stop(){if(cur){const old=cur;fading.push({a:old,from:old.volume,to:0,t:0,done:()=>old.pause()});cur=null;curName=null;}}
 return {play,update,setVol,setOn,stop,probe,get active(){return !!cur},get has(){return Object.keys(tracks).length>0}};
})();
