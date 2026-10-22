'use strict';
/* ============================================================================
   FX — combat feel: hit-stop & slow-motion, camera punch/zoom, ink rings,
   calligraphy stamps, spark shards, blade flashes, parry streak, timing ring.
   Game code calls FX.timeScale(dt) each frame to get the gameplay dt.
   ========================================================================== */
const FX=(()=>{
 let hitStopT=0,slowT=0,slowK=1,zoomT=0,zoomD=0,zoomK=1,zoomX=0,zoomY=0,T=0;
 const stamps=[],rings=[],shards=[],flashes=[],glyphs=[];
 let streak=0,streakT=0,bestStreak=0,streakMax=0;
 function reset(){hitStopT=0;slowT=0;zoomT=0;}
 function hitStop(sec){hitStopT=Math.max(hitStopT,sec);}
 function slow(sec,k){slowT=Math.max(slowT,sec);slowK=k;}
 function zoom(sec,k,x,y){if(window.LITE)return;zoomT=sec;zoomD=sec;zoomK=k;zoomX=x;zoomY=y;}
 /** returns the gameplay time scale for this frame (0 during hit-stop) */
 function timeScale(dt){if(hitStopT>0){hitStopT-=dt;return 0;}if(slowT>0){slowT-=dt;return slowK;}return 1;}
 /** apply camera zoom (call inside ctx.save) */
 function applyZoom(ctx){if(zoomT<=0)return;const k=zoomT/zoomD,e=Math.sin(k*Math.PI)**0.6,z=1+(zoomK-1)*e;ctx.translate(zoomX,zoomY);ctx.scale(z,z);ctx.translate(-zoomX,-zoomY);}
 function stamp(s,x,y,o){o=o||{};stamps.push({s,x,y,t:0,l:o.l||0.9,col:o.col||'#fff',rot:o.rot==null?(Math.random()-0.5)*0.25:o.rot,size:o.size||40,sub:o.sub,subCol:o.subCol,font:o.font,ink:o.ink,stroke:o.stroke});}
 function ring(x,y,r0,r1,col,w,l){rings.push({x,y,r0,r1,col:col||'#fff',w:w||3,t:0,l:l||0.4});}
 function shard(x,y,n,col,sp,len){if(window.LITE)n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(0.4+Math.random())*sp;shards.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,l:0.25+Math.random()*0.35,col:col||'#fff',len:len||10});}}
 function flash(x,y,a,len,col,w,l){flashes.push({x,y,a,len,col:col||'#fff',w:w||4,t:0,l:l||0.18});}
 function glyph(s,x,y,o){o=o||{};glyphs.push({s,x,y,t:0,l:o.l||1.1,col:o.col||'#fff',size:o.size||18,vy:o.vy==null?-30:o.vy,font:o.font});}
 function onParry(perfect){streak++;streakT=0;streakMax=Math.max(streakMax,streak);bestStreak=Math.max(bestStreak,streak);}
 function onHurt(){streak=0;streakT=0;}
 function resetStreak(){streak=0;streakMax=0;}
 function update(dt){T+=dt;if(zoomT>0)zoomT-=dt;streakT+=dt;
  for(const a of [stamps,rings,shards,flashes,glyphs])for(let i=a.length-1;i>=0;i--){a[i].t+=dt;if(a[i].t>=a[i].l)a.splice(i,1);}
  shards.forEach(s=>{s.x+=s.vx*dt*60;s.y+=s.vy*dt*60;s.vx*=0.92;s.vy=s.vy*0.92+0.35;});}
 function draw(ctx,U,font){
  rings.forEach(r=>{const k=r.t/r.l,e=1-(1-k)*(1-k);ctx.save();ctx.globalAlpha=(1-k)*0.9;ctx.strokeStyle=r.col;ctx.lineWidth=r.w*(1-k*0.6)*U;ctx.beginPath();ctx.arc(r.x,r.y,(r.r0+(r.r1-r.r0)*e)*U,0,6.283);ctx.stroke();ctx.restore();});
  flashes.forEach(f=>{const k=f.t/f.l;ctx.save();ctx.globalAlpha=1-k;ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.strokeStyle=f.col;ctx.lineCap='round';ctx.lineWidth=f.w*U*(1-k*0.7);ctx.shadowColor=f.col;ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(-f.len*U*(1-k*0.3),0);ctx.lineTo(f.len*U*(1-k*0.3),0);ctx.stroke();ctx.restore();});
  shards.forEach(s=>{const k=s.t/s.l;ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle=s.col;ctx.lineWidth=1.6*U;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*s.len*0.12*U,s.y-s.vy*s.len*0.12*U);ctx.stroke();ctx.restore();});
  stamps.forEach(s=>{const k=s.t/s.l,pop=k<0.12?1.6-0.6*(k/0.12):1-0.08*(k-0.12),a=k<0.7?1:1-(k-0.7)/0.3;ctx.save();ctx.globalAlpha=a;ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.scale(pop,pop);ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.font=(s.font||font)(s.size*U,1);if(s.ink){ctx.fillStyle=s.ink;ctx.beginPath();ctx.ellipse(0,0,s.size*U*0.72*(s.s.length>1?s.s.length*0.5:1),s.size*U*0.6,0.2,0,6.283);ctx.fill();}
   ctx.lineWidth=5*U;ctx.strokeStyle=s.stroke||'rgba(0,0,0,.8)';ctx.strokeText(s.s,0,0);ctx.fillStyle=s.col;ctx.fillText(s.s,0,0);
   if(s.sub){ctx.font=(s.font||font)(s.size*U*0.36,1);ctx.lineWidth=3*U;ctx.strokeText(s.sub,0,s.size*U*0.72);ctx.fillStyle=s.subCol||s.col;ctx.fillText(s.sub,0,s.size*U*0.72);}ctx.restore();});
  glyphs.forEach(g=>{const k=g.t/g.l;ctx.save();ctx.globalAlpha=1-k*k;ctx.textAlign='center';ctx.font=(g.font||font)(g.size*U,1);ctx.lineWidth=3*U;ctx.strokeStyle='rgba(0,0,0,.7)';const y=g.y+g.vy*g.t*U;ctx.strokeText(g.s,g.x,y);ctx.fillStyle=g.col;ctx.fillText(g.s,g.x,y);ctx.restore();});}
 /** timing ring around the parry arrow: rem = seconds until impact, win = parry window, pw = perfect window */
 function timingRing(ctx,x,y,rem,win,pw,U,col,colPerfect){const R=58*U,rIn=16*U;const k=Math.max(0,Math.min(1,rem/(win*1.9)));const r=rIn+(R-rIn)*k;ctx.save();
  ctx.globalAlpha=0.9;ctx.lineWidth=2*U;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(x,y,rIn,0,6.283);ctx.stroke();
  const inWin=rem<=win,perfect=rem<=pw;ctx.strokeStyle=perfect?colPerfect:inWin?col:'rgba(255,255,255,.35)';ctx.lineWidth=(perfect?4:inWin?3:2)*U;ctx.setLineDash(inWin?[]:[4*U,4*U]);
  ctx.shadowColor=perfect?colPerfect:col;ctx.shadowBlur=perfect?18:inWin?8:0;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.stroke();ctx.restore();}
 return {reset,hitStop,slow,zoom,timeScale,applyZoom,stamp,ring,shard,flash,glyph,update,draw,timingRing,onParry,onHurt,resetStreak,get streak(){return streak},get streakT(){return streakT},get streakMax(){return streakMax},get bestStreak(){return bestStreak},get zooming(){return zoomT>0},get frozen(){return hitStopT>0}};
})();
