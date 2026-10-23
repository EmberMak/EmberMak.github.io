'use strict';
/* ============================================================================
   DUELFX — pixel flames, shockwaves, afterimages, cut-lines, Foxfire orbs and
   the Kage-giri sequence. Drawn on the pixel canvas (G); fighters in duel.js.
   ========================================================================== */
const DFX={flames:[],waves:[],ghosts:[],orbs:[],lines:[],tweens:[],dust:[],tint:null,dark:0,darkTo:0,sun:0,sunTo:0,superSeq:null,glowT:0,foxT:0,magicSeq:null,embers:[],t:0};
function dfxReset(){DFX.flames.length=0;DFX.waves.length=0;DFX.ghosts.length=0;DFX.orbs.length=0;DFX.lines.length=0;DFX.tweens.length=0;DFX.dust.length=0;DFX.embers.length=0;DFX.tint=null;DFX.dark=0;DFX.darkTo=0;DFX.sun=0;DFX.sunTo=0;DFX.superSeq=null;DFX.magicSeq=null;DFX.glowT=0;DFX.foxT=0;}
const FLAME_PAL={fire:['#fff6c8','#ffd24a','#ff8a2a','#ff4a1a','#7a2a1a','#3a2a2a'],fox:['#ffffff','#bfefff','#6fc8ff','#2f7fe0','#1a3a7a','#101a3a'],blood:['#ff6a6a','#d8202a','#8e1119','#5a0a10','#3a0a0a','#2a0a0a'],gold:['#ffffff','#ffe9a0','#ffc44a','#d98a2a','#6a4a1a','#3a2a1a']};
function flameBurst(x,y,n,power,dir,pal){if(window.LITE)n=Math.ceil(n/2);pal=pal||'fire';for(let i=0;i<n;i++){const a=(dir==null?Math.random()*TAU:dir+(Math.random()-0.5)*1.4),v=(0.3+Math.random())*power;DFX.flames.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-0.6,t:0,l:0.35+Math.random()*0.5,s:1+Math.floor(Math.random()*3),pal,ph:Math.random()*TAU});}}
function emberRise(x,y,n,pal){for(let i=0;i<n;i++)DFX.embers.push({x:x+(Math.random()-0.5)*14,y:y+(Math.random()-0.5)*8,vy:-(10+Math.random()*20),t:0,l:0.8+Math.random()*0.9,pal:pal||'fire',ph:Math.random()*TAU});}
function shockwave(x,y,r0,r1,col,w,l){DFX.waves.push({x,y,r0,r1,col:col||'#fff',w:w||2,t:0,l:l||0.4});}
function cutLine(x,y,a,len,col,l){DFX.lines.push({x,y,a,len,col:col||'#ffffff',t:0,l:l||0.5});}
function dfxTween(obj,key,to,dur,ez){DFX.tweens.push({obj,key,from:obj[key],to,t:0,dur,ez:ez||ease});}
function afterimage(who,col,alpha,l){const lay=L();const sc=lay.fs;if(who==='P'){const ps=playerPose();DFX.ghosts.push({x:lay.px+(P.ox||0)*sc,y:lay.gy,f:P.face||1,s:sc,ps:JSON.parse(JSON.stringify(ps)),C:playerColors(true),col,a:alpha,t:0,l});}
 else{const es=sc*(E.def.size||1);DFX.ghosts.push({x:lay.ex,y:lay.gy,f:-1,s:es,ps:JSON.parse(JSON.stringify(enemyPose())),C:enemyColors(true),col,a:alpha,t:0,l});}}
function dustPuff(x,y,n){for(let i=0;i<n;i++)DFX.dust.push({x:x+(Math.random()-0.5)*10,y:y-Math.random()*3,vx:(Math.random()-0.5)*20,vy:-(4+Math.random()*10),t:0,l:0.3+Math.random()*0.3});}
function dfxUpdate(dt){DFX.t+=dt;
 for(let i=DFX.flames.length-1;i>=0;i--){const f=DFX.flames[i];f.t+=dt;if(f.t>f.l){DFX.flames.splice(i,1);continue;}f.x+=f.vx*dt*60*0.5+Math.sin(f.t*14+f.ph)*0.3;f.y+=f.vy*dt*60*0.5;f.vy-=dt*2.2;f.vx*=0.94;}
 for(let i=DFX.embers.length-1;i>=0;i--){const e=DFX.embers[i];e.t+=dt;if(e.t>e.l){DFX.embers.splice(i,1);continue;}e.x+=Math.sin(e.t*6+e.ph)*0.4;e.y+=e.vy*dt;}
 for(let i=DFX.waves.length-1;i>=0;i--){const w=DFX.waves[i];w.t+=dt;if(w.t>w.l)DFX.waves.splice(i,1);}
 for(let i=DFX.ghosts.length-1;i>=0;i--){const g=DFX.ghosts[i];g.t+=dt;if(g.t>g.l)DFX.ghosts.splice(i,1);}
 for(let i=DFX.lines.length-1;i>=0;i--){const c=DFX.lines[i];c.t+=dt;if(c.t>c.l)DFX.lines.splice(i,1);}
 for(let i=DFX.dust.length-1;i>=0;i--){const d=DFX.dust[i];d.t+=dt;if(d.t>d.l){DFX.dust.splice(i,1);continue;}d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=20*dt;}
 for(let i=DFX.tweens.length-1;i>=0;i--){const tw=DFX.tweens[i];tw.t+=dt;const k=Math.min(1,tw.t/tw.dur);tw.obj[tw.key]=tw.from+(tw.to-tw.from)*tw.ez(k);if(k>=1)DFX.tweens.splice(i,1);}
 if(DFX.tint){DFX.tint.t+=dt;if(DFX.tint.t>DFX.tint.l)DFX.tint=null;}
 DFX.dark+=(DFX.darkTo-DFX.dark)*Math.min(1,dt*9);DFX.sun+=(DFX.sunTo-DFX.sun)*Math.min(1,dt*6);DFX.glowT=Math.max(0,DFX.glowT-dt);DFX.foxT=Math.max(0,DFX.foxT-dt*1.2);
 // orbs (Foxfire)
 for(let i=DFX.orbs.length-1;i>=0;i--){const o=DFX.orbs[i];o.t+=dt;if(o.t<0)continue;const k=Math.min(1,o.t/o.dur);const u=1-k;o.x=u*u*o.x0+2*u*k*o.cx+k*k*o.x1;o.y=u*u*o.y0+2*u*k*o.cy+k*k*o.y1;
  if(Math.random()<0.8)DFX.flames.push({x:o.x,y:o.y,vx:(Math.random()-0.5)*0.4,vy:-0.2,t:0,l:0.3+Math.random()*0.3,s:1+Math.floor(Math.random()*2),pal:'fox',ph:0});
  if(k>=1){flameBurst(o.x,o.y,14,3,null,'fox');shockwave(o.x,o.y,2,22,'#9fe3ff',2,0.3);hap('hitAlt');steel(0.08,1.6);DFX.orbs.splice(i,1);if(o.last&&DFX.magicSeq)DFX.magicSeq.land=true;}}
 if(DFX.magicSeq)magicSeqUpdate(dt);
 if(DFX.superSeq)superSeqUpdate(dt);}
/* ---------- drawing ---------- */
function dfxDrawBack(){ // behind the fighters: darkness + red sun + fox + ghosts
 const l=L();if(DFX.dark>0.01){G.fillStyle='rgba(8,4,6,'+(0.82*DFX.dark)+')';G.fillRect(0,0,W,H);}
 if(DFX.sun>0.01){const r=H*0.42*DFX.sun;G.fillStyle='#b8242a';G.beginPath();G.arc(l.px+8,l.gy-40,r,0,TAU);G.fill();G.fillStyle='rgba(255,120,120,.25)';G.beginPath();G.arc(l.px+8,l.gy-40,r*0.86,0,TAU);G.fill();}
 if(DFX.foxT>0){drawFoxSpirit(l.px-14,l.gy,DFX.foxT);}
 for(const g of DFX.ghosts){const a=g.a*(1-g.t/g.l);figureFlat(g.x,g.y,g.f,g.s,g.ps,g.C,g.col,a);}}
function dfxDrawFront(){ // in front of the fighters: flames, cut lines, shockwaves, dust, tint
 for(const d of DFX.dust){G.globalAlpha=0.6*(1-d.t/d.l);G.fillStyle='#d8cdb0';G.fillRect(Math.round(d.x),Math.round(d.y),2,2);}
 for(const f of DFX.flames){const k=f.t/f.l,pal=FLAME_PAL[f.pal]||FLAME_PAL.fire;const ci=Math.min(pal.length-1,Math.floor(k*pal.length));G.globalAlpha=k>0.8?(1-k)*5:1;G.fillStyle=pal[ci];const s=Math.max(1,Math.round(f.s*(1-k*0.6)));G.fillRect(Math.round(f.x-s/2),Math.round(f.y-s/2),s,s);}
 for(const e of DFX.embers){const k=e.t/e.l,pal=FLAME_PAL[e.pal];G.globalAlpha=(1-k)*(0.6+0.4*Math.sin(e.t*12+e.ph));G.fillStyle=pal[1+Math.floor(k*2)];G.fillRect(Math.round(e.x),Math.round(e.y),1,1);}
 G.globalAlpha=1;
 for(const w of DFX.waves){const k=w.t/w.l,e=1-(1-k)*(1-k);const r=w.r0+(w.r1-w.r0)*e;G.globalAlpha=(1-k)*0.9;G.strokeStyle=w.col;G.lineWidth=Math.max(1,w.w*(1-k*0.5));G.beginPath();G.arc(Math.round(w.x),Math.round(w.y),r,0,TAU);G.stroke();}
 for(const c of DFX.lines){const k=c.t/c.l;G.globalAlpha=k<0.15?1:1-(k-0.15)/0.85;G.strokeStyle=c.col;G.lineWidth=k<0.15?3:1.5;G.beginPath();G.moveTo(c.x-Math.cos(c.a)*c.len,c.y-Math.sin(c.a)*c.len);G.lineTo(c.x+Math.cos(c.a)*c.len,c.y+Math.sin(c.a)*c.len);G.stroke();}
 G.globalAlpha=1;
 if(DFX.tint){const k=DFX.tint.t/DFX.tint.l;G.fillStyle=DFX.tint.col;G.globalAlpha=(1-k)*DFX.tint.a;G.fillRect(0,0,W,H);G.globalAlpha=1;}}
function figureFlat(x,y,f,s,ps,C,color,alpha){const SZ=160;if(!FIGC){[FIGC,FIGQ]=mkCanvas(SZ,SZ);[OUTC,OUTQ]=mkCanvas(SZ,SZ);}
 const ox=SZ/2,oy=SZ-20;FIGQ.clearRect(0,0,SZ,SZ);const g0=G;G=FIGQ;try{figure(ox,oy,f,s,ps,C);}finally{G=g0;}
 OUTQ.clearRect(0,0,SZ,SZ);OUTQ.globalCompositeOperation='source-over';OUTQ.drawImage(FIGC,0,0);OUTQ.globalCompositeOperation='source-in';OUTQ.fillStyle=color;OUTQ.fillRect(0,0,SZ,SZ);
 G.globalAlpha=alpha;G.drawImage(OUTC,Math.round(x-ox),Math.round(y-oy));G.globalAlpha=1;}
function drawFoxSpirit(x,y,k){ // a blue fox spirit sitting behind Kage, fading
 const a=Math.min(1,k*1.5)*0.75;G.globalAlpha=a;const c='#6fc8ff',c2='#bfefff';const s=1+(1-k)*0.3;G.save();G.translate(Math.round(x),Math.round(y));G.scale(s,s);
 G.fillStyle=c;G.beginPath();G.ellipse(0,-14,13,11,0,0,TAU);G.fill();G.beginPath();G.ellipse(-2,-30,8,7,0,0,TAU);G.fill();
 G.beginPath();G.moveTo(-9,-33);G.lineTo(-7,-46);G.lineTo(-2,-35);G.fill();G.beginPath();G.moveTo(1,-35);G.lineTo(5,-46);G.lineTo(7,-33);G.fill();
 G.beginPath();G.moveTo(10,-10);G.quadraticCurveTo(30,-30,34,-6);G.quadraticCurveTo(26,-4,12,-4);G.fill();
 G.fillStyle=c2;G.fillRect(-6,-31,2,2);G.fillRect(0,-31,2,2);G.beginPath();G.ellipse(0,-10,5,4,0,0,TAU);G.fill();
 for(let i=0;i<5;i++){G.fillStyle=i%2?c2:c;G.fillRect(-16+i*8,-50-Math.sin(DFX.t*5+i)*4-(1-k)*20,2,2);}
 G.restore();G.globalAlpha=1;}
/* ---------- Foxfire sequence ---------- */
function startMagicSeq(){const l=L();const sc=l.fs;P.forcePose=mixp(BASE,{hand:[18,-30],wa:-2.0,lean:-0.1,hy:-86,fF:[26,0]},1);DFX.foxT=1;DFX.magicSeq={t:0,land:false,done:false};
 DFX.tint={col:'rgba(90,160,255,1)',a:0.25,t:0,l:0.5};hap('magic');play('fire',1,1.2);shaku(392,1.2,0.08);
 for(let i=0;i<5;i++){const x0=l.px+18*sc/0.44,y0=l.gy-54;const x1=l.ex-6+(Math.random()-0.5)*10,y1=l.gy-40+(Math.random()-0.5)*20;DFX.orbs.push({x0,y0,x1,y1,cx:(x0+x1)/2+(Math.random()-0.5)*40,cy:l.gy-90-Math.random()*40,x:x0,y:y0,t:-i*0.09,dur:0.55,last:i===4});}
 flameBurst(l.px+14,l.gy-50,20,3,-1.57,'fox');shockwave(l.px+12,l.gy-44,4,40,'#9fe3ff',2,0.5);}
function magicSeqUpdate(dt){const m=DFX.magicSeq;m.t+=dt;if(m.t>0.5&&P.forcePose&&!m.posed){m.posed=1;P.forcePose=null;}
 if(m.land&&!m.done){m.done=true;const l=L();const dm=Math.round(95*(1+S.level*0.04)*(DIFF().dmgOut||1));E.hp=Math.max(0,E.hp-dm);E.hurt=1;D.shake=7;D.flash=0.18;
  flameBurst(l.ex,l.gy-40,46,4.5,null,'fox');shockwave(l.ex,l.gy-40,6,80,'#bfefff',3,0.6);emberRise(l.ex,l.gy-40,14,'fox');DFX.tint={col:'rgba(120,190,255,1)',a:0.35,t:0,l:0.35};
  FX.ring(l.ex,l.gy-38,8,56,'rgba(140,216,255,.9)',3,0.6);FX.stamp('狐火',l.ex,l.gy-76,{col:'#bfe8ff',size:26,ink:'rgba(0,20,40,.6)',sub:'KITSUNEBI',l:1.0});D.texts.push({s:''+dm,col:'#bfe8ff',size:0.8,t:0,dmg:1,x:0});
  taiko(0.5,70);hap('superHit');if(E.state==='windup')E.queue=[];openEnemy(1.6);if(E.hp<=0)toVictory();}
 if(m.t>1.2)DFX.magicSeq=null;}
/* ---------- Kage-giri sequence ---------- */
function startSuperSeq(){const l=L(),sc=l.fs;const far=(l.ex-l.px)/sc+46;DFX.superSeq={t:0,step:0,far,cuts:0};P.ox=0;P.forcePose=mixp(BASE,{hand:[-6,-10],wa:-2.6,lean:0.35,hy:-70,fF:[30,0],fB:[-26,0],head:-0.2},1);
 DFX.darkTo=1;DFX.sunTo=1;FX.hitStop(0.12);hap('superHit');play('super',1);taiko(0.8,50);E.queue=[];E.state='open';E.t=3.6;E.stag=1.5;E.kd=0;E.combo=0;E.lastDir=-1;E.recoil=0;
 FX.stamp('奥義',l.px+10,l.gy-90,{col:'#ffffff',size:24,ink:'rgba(120,10,16,.75)',sub:'KAGE-GIRI · 影斬り',subCol:'#ffd0c0',l:1.6});}
function superSeqUpdate(dt){const s=DFX.superSeq;s.t+=dt;const l=L(),sc=l.fs;
 if(s.step===0&&s.t>0.4){s.step=1;dfxTween(P,'ox',s.far,0.16,easeOut);whoosh(0.5,0.3,false);P.forcePose=mixp(BASE,{hand:[34,10],wa:-0.1,lean:0.55,hy:-80,fF:[38,0],fB:[-30,0]},1);hap('swipe');}
 if(s.step===1){if(Math.random()<0.9)afterimage('P','#ff6a5a',0.55,0.35);if(s.t>0.6){s.step=2;dustPuff(l.px+P.ox*sc,l.gy,8);}}
 if(s.step===2){const cutT=[0.75,0.9,1.05];const i=s.cuts;if(i<3&&s.t>cutT[i]){s.cuts++;const a=[-0.6,0.5,-1.1][i];cutLine(l.ex,l.gy-40,a,30+i*6,'#ffffff',0.9);FX.flash(l.ex,l.gy-40,a,52,'#fff',4,0.25);crack(0.5);steel(0.3,1+i*0.2);FX.hitStop(0.05);hap(i<2?'crit':'parryPerfect');}
  if(s.t>1.3){s.step=3;const dm=Math.round(70*(1+S.level*0.05)*(DIFF().dmgOut||1));E.hp=Math.max(0,E.hp-dm);E.hurt=1;D.texts.push({s:''+dm,col:'#fff',size:0.9,t:0,dmg:1,x:0});
   for(let i=0;i<3;i++)bloodSpray(l.ex-4,l.gy-30-i*10,16,0.3+i*0.5,4);flameBurst(l.ex,l.gy-40,30,5,null,'blood');shockwave(l.ex,l.gy-40,8,120,'#ffd0c0',4,0.6);D.shake=12;D.flash=0.4;hap('death');taiko(0.9,45);squelch(0.6);
   DFX.darkTo=0;DFX.sunTo=0;afterimage('P','#ffffff',0.8,0.4);P.ox=0;P.forcePose=null;dustPuff(l.px,l.gy,10);if(E.hp<=0)toVictory();}}
 if(s.step===3&&s.t>1.8){DFX.superSeq=null;}}
