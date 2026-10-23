'use strict';
/* ============================================================================
   DUEL — the swipe-parry combat of Kage no Chikai / Ashborn, in pixel art.
   Phases: intro → fight → victory → exec (weapon-specific execution) → loot
                               ↘ death
   Mechanics are identical to Kage no Chikai: swipe in the attack's direction
   while the foe winds up to parry (perfect/great/parry tiers), block (hold),
   step back / jump dodges for unblockables, feints, delayed strikes, combos,
   parry-break, Foxfire (magic) and Kage-giri (super).
   ========================================================================== */
const D={on:false,phase:'',t:0,P:null,E:null,ST:null,texts:[],parts:[],trail:[],shake:0,flash:0,stats:null,camX:0,layers:null,npc:null,loot:null,exec:null,gibs:[],blood:[],decals:[],zoom:1,zx:0,zy:0,superFx:0,pending:null,onDone:null,retry:null,intro:0};
let P=null,E=null,ST=null;
const rndf=(a,b)=>a+Math.random()*(b-a);
const DIFFS={easy:{id:'easy',hp:0.7,dm:0.65,spd:1.18,win:0.1,ring:1,loot:0.9,dmgOut:1.15,label:'Easy · 易',jp:'易',desc:'Slow wind-ups, soft hits, a wide parry window. For the story.'},
 normal:{id:'normal',hp:1,dm:1,spd:1,win:0,ring:1,loot:1,dmgOut:1,label:'Normal · 常',jp:'常',desc:'The duel as it was meant to be fought.'},
 hard:{id:'hard',hp:1.35,dm:1.35,spd:0.88,win:-0.03,ring:1,loot:1.15,dmgOut:1,label:'Hard · 修羅',jp:'修羅',desc:'Faster blades, heavier hits, a narrower window. Better loot.'},
 hell:{id:'hell',hp:1.7,dm:1.75,spd:0.8,win:-0.06,ring:0,loot:1.35,dmgOut:1,label:'Hell · 地獄',jp:'地獄',desc:'No timing ring. Every mistake bleeds. Legendary loot.'}};
const DIFF=()=>DIFFS[S.diff]||DIFFS.normal;
/* ---------- layout (logical px) ---------- */
function L(){const land=W>H,fs=H/270*0.44;const gy=H*0.8;const m=8;const dr=Math.max(22,H*0.1),r=Math.max(16,H*0.075);
 return{land,m,fs,gy,hz:gy-H*0.22,px:W*0.36,ex:W*0.64,barW:W*0.33,bh:7,
  magic:{x:m+r+2,y:m+30+r,r},super:{x:W-m-r-2,y:m+30+r,r},dodgeL:{x:m+dr+4,y:H-m-dr-4,r:dr},dodgeR:{x:W-m-dr-4,y:H-m-dr-4,r:dr},block:{x:W/2,y:H-m-dr*0.9-4,r:dr*0.85},pause:{x:W/2,y:11,r:8}};}
/* ---------- stage construction ---------- */
function A(name,jp,dir,wind,dmg,o={}){return Object.assign({name,jp,dir,wind,dmg},o);}
function buildStage(def){const kind=WKIND[def.wpn]?def.wpn:'katana',set=ATKSET[kind];const atk={},pat=[];let n=0;
 const add=(t,o)=>{const k='a'+(n++);atk[k]=A(t[0],t[1],t[2],t[3],t[4],Object.assign({},t[5]||{},o||{}));return k;};
 const Sx=set.s.map(t=>add(t)),U=set.u.map(t=>add(t)),F=set.f.map(t=>add(t)),Dd=set.s.map(t=>add([t[0]+' (delayed)',t[1]+'・溜め',t[2],Math.min(1.95,t[3]*1.55),Math.round(t[4]*1.15)]));
 const p=Object.assign({},def.pat);if(!p.s)p.s=1;const pick=a=>a[Math.floor(Math.random()*a.length)];
 Sx.forEach(k=>pat.push({s:[k],w:p.s}));
 if(p.c){for(let i=0;i<3;i++){const len=2+i;const s=[];for(let j=0;j<len;j++)s.push(Sx[(i+j*2)%Sx.length]);pat.push({s,w:p.c/(i+1),p2:i===2?1:0});}}
 if(p.f)F.forEach(k=>{pat.push({s:[k],w:p.f});pat.push({s:[pick(Sx),k],w:p.f*0.5,p2:1});});
 if(p.d)Dd.forEach(k=>pat.push({s:[k],w:p.d/Dd.length*1.5}));
 if(p.u)U.forEach(k=>{pat.push({s:[k],w:p.u});pat.push({s:[pick(Sx),k],w:p.u*0.5,p2:1});});
 const Df=DIFF();const spd=Math.max(0.45,Math.min(1.25,def.aggr/1000*Df.spd));
 const enemy={name:def.name,jp:def.jp,hp:Math.round(def.hp*1.5*Df.hp),weapon:kind,look:def.look,spd,dm:Math.min(2.6,def.dmg/14)*Df.dm,size:def.look.bulk||1,guard:0.45+def.blk*0.8+(def.pat.g||0)*0.05,key:def.key,boss:def.boss,final:def.final,lord:def.lord,p2name:def.p2name,char:def.char,lvl:def.lvl,drop:def.drop};
 return {atk,pat,enemy,boss:def.boss,bg:def.bg};}
/* ---------- start / end ---------- */
function startDuel(npc,o){o=o||{};const def=o.def||npcDuelDef(npc);ST=buildStage(def);ST.npc=npc;ST.steal=o.steal||false;D.npc=npc;D.opts=o;D.onDone=o.onDone||null;D.retry=o.retry||null;D.story=o.story||null;
 const w=playerWeapon(),mh=playerMaxHp(),bm=3+gsum('blk');const buff=S.buff||{};
 P={hp:Math.min(mh,Math.max(mh*0.35,PL.hp)),max:mh,blockDur:bm,blockMax:bm,regen:Math.min(...gearList().map(x=>x.regen||5)),dodgeMax:0.55+gsum('dodge'),blockRegen:0,blocking:false,dodge:0,dodgeKind:'',magic:buff.mag?100:0,superM:0,swing:0,swingDir:0,hurt:0,cd:0,w:Object.assign({},w,{dmg:w.dmg*(buff.dmg?1.15:1),win:w.win+(buff.win?0.08:0)}),counter:0,ghost:0,lowT:0,dead:false,deadT:0};
 P.ghost=P.hp;S.buff=null;const d=ST.enemy;
 E={def:d,hp:d.hp,max:d.hp,state:'idle',t:1.8,queue:[],atk:null,wind:0,windT:0,dir:0,feinted:false,hurt:0,lunge:0,chain:0,dodges:0,combo:0,lastDir:-1,dead:false,block:0,stag:0,p2:false,deadT:0,recoil:0,ghost:d.hp,miss:0,missDir:-1,kd:0};
 D.texts=[];D.parts=[];D.trail=[];D.shake=0;D.flash=0;D.stats={parries:0,perfect:0,dodges:0,hits:0,maxCombo:0,t:0,counters:0,streak:0};D.camX=0;D.gibs=[];D.blood=[];D.decals=[];D.zoom=1;D.superFx=0;D.exec=null;D.loot=null;D.on=true;D.phase='intro';D.t=0;D.intro=0;
 try{FX.resetStreak();FX.reset();}catch(e){}dfxReset();P.ox=0;P.face=1;E.lift=0;D.vignette=0;
 D.layers=buildDuelBg(ST.bg||(PL.region?PL.region.biome:'temperate'));
 goScene('duel');inputMode='ui';duelButtons();
 const bossKey=d.boss?'boss_'+(d.char||'generic'):null;MUSIC2.play(bossKey||'duel',{fallback:d.boss?['boss','duel']:['duel'],fade:0.6});
 S.flags.firstDuel=1;hap('tap');taiko(0.5,60);}
function wakeAtShrine(){let best=null,bd=1e18;for(const wp of WAYPOINTS){if(!S.wps[wp.id])continue;const d=(wp.x-PL.x)**2+(wp.y-PL.y)**2;if(d<bd){bd=d;best=wp;}}
 const lost=Math.round(S.coins*0.1);S.coins-=lost;PL.hp=playerMaxHp();PL.mounted=false;
 const go=()=>{const p=snapToFree(best?best.x:LANDMARKS.start.x,best?best.y:LANDMARKS.start.y);PL.x=p.x;PL.y=p.y;PL.jumpT=0;PL.z=0;CAM.x=PL.x-W/2;CAM.y=PL.y-H/2;CAM.tx=CAM.x;CAM.ty=CAM.y;if(S.horse){HORSE.x=PL.x+18;HORSE.y=PL.y;HORSE.state='wait';}toast('You wake at '+(best?best.name:'Fushimi')+(lost?' — '+lost+' mon lost':''),'#ffb070');save();};
 if(typeof FADE!=='undefined'){FADE.to=go;FADE.t=0.001;FADE.col='#0a0708';}else go();}
function endDuel(result){D.on=false;D.phase='';inputMode='world';goScene('world');BTN_DEFS.length=0;if(window.worldButtons)worldButtons();
 PL.hp=Math.max(1,Math.round(result==='win'?Math.max(P.hp,P.max*0.4):P.max));if(window.ambientMusic)ambientMusic(true);
 const cb=D.onDone;D.onDone=null;if(cb)cb(result);save();}
/* ---------- messages / particles ---------- */
function say(s,col='#fff',size=1,jp){D.texts=D.texts.filter(t=>t.dmg);D.texts.push({s,jp,col,size,t:0});if(D.texts.length>3)D.texts.shift();}
function sparks(x,y,col,n=18,sp=6){if(window.LITE)n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=Math.random()*TAU,v=rndf(0.3,sp)*0.35;D.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-0.3,l:rndf(.3,.7),t:0,col});}}
function bloodSpray(x,y,n,dir,power){if(!S.set.gore)return;if(window.LITE)n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=(dir||0)+(Math.random()-0.5)*1.6,v=rndf(0.4,1)*(power||3);D.blood.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rndf(0.5,1.5),t:0,l:rndf(0.5,1.4),s:Math.random()<0.3?2:1});}}
function gib(x,y,w,h,col,vx,vy,o){D.gibs.push(Object.assign({x,y,w,h,col,vx,vy,rot:0,vr:(Math.random()-0.5)*0.3,t:0,rest:false,bled:0},o||{}));}
/* ---------- combat core (identical rules to Kage no Chikai) ---------- */
function pickPattern(){const ph2=E.p2||E.hp<E.max*0.5,ps=ST.pat.filter(p=>!p.p2||ph2);let tw=ps.reduce((a,p)=>a+p.w,0),r=Math.random()*tw;for(const p of ps){if((r-=p.w)<0)return p.s.slice();}return [ps[0].s[0]];}
function speedMul(){return E.def.spd*(E.hp<E.max*0.5?0.9:1)*(E.p2?0.88:1);}
function beginAttack(k){const a=ST.atk[k];E.state='windup';E.atk=a;E.wind=Math.min(1.95,a.wind*speedMul());E.windT=0;E.dir=a.dir;E.feinted=false;E.miss=0;play('windup',0.35,a.unblock?0.7:1);
 if(a.unblock){say(a.dg==='jump'?'JUMP!':'STEP BACK!','#ff5a3d',0.8,a.dg==='jump'?'跳べ':'退け');hap('warn');taiko(0.35,70);}else hap('windup');}
function enemyIdle(t){E.state='idle';E.t=t||rndf(0.9,1.7)*E.def.spd;E.atk=null;}
const superGain=v=>{P.superM=Math.min(100,P.superM+v);};
function strikeLands(){const a=E.atk;E.state='strike';E.t=0.3;E.lunge=1;const l=L();
 const ok=P.dodge>0&&(!a.unblock||a.dg===P.dodgeKind);
 if(ok){D.stats.dodges++;S.tot.dodges++;E.dodges++;superGain(10);FX.shard(l.px+4,l.gy-40*l.fs/0.38,10,'rgba(240,235,225,.8)',5,8);
  if(E.queue.length===0&&E.dodges>=3){say('DODGE BREAK!!','#ffe9c0',1.1,'見切り');FX.stamp('見切',l.ex,l.gy-62,{col:'#ffe9c0',size:26,ink:'rgba(0,0,0,.55)',sub:'DODGE BREAK'});FX.hitStop(0.06);hap('dodgeBreak');openEnemy(2.4,true);}
  else{say('DODGE','#e8dcc8',0.8,'回避');hap('dodge');if(!E.queue.length)openEnemy(1.4);}
  play('dodge',0.8);return;}
 if(P.blocking&&!a.unblock&&P.blockDur>0){P.blockDur--;say('BLOCK','#cdd',0.8,'受け');play('block',0.9);steel(0.15,0.8);hap(P.blockDur===0?'blockBreak':'block');D.shake=3;sparks(l.px+12,l.gy-40,'#fff',10,4);flameBurst(l.px+12,l.gy-40,8,3,-0.4,'gold');shockwave(l.px+12,l.gy-40,3,26,'#bfefff',2,0.3);
  FX.ring(l.px+12,l.gy-40,4,16,'rgba(220,225,235,.8)',2,0.3);FX.hitStop(0.03);
  if(P.blockDur===0){say('GUARD BROKEN','#f96',0.8,'崩し');FX.stamp('崩',l.px+12,l.gy-56,{col:'#ff9a6a',size:22,ink:'rgba(0,0,0,.5)'});}return;}
 const heavy=a.unblock;const dmg=a.dmg*E.def.dm*(P.blocking&&!a.unblock?0.5:1);P.hp=Math.max(0,P.hp-dmg);P.hurt=1;D.shake=heavy?7:5;D.flash=0.25;superGain(6);P.counter=0;shockwave(l.px+4,l.gy-40,2,heavy?40:22,'#ff8a7a',2,0.3);DFX.tint={col:'rgba(255,40,40,1)',a:heavy?0.3:0.18,t:0,l:0.25};
 play('hurt',1);play(Math.random()<.5?'pain1':'pain2',0.7);taiko(0.4,60);hap(heavy?'hurtHeavy':'hurt');E.chain=0;E.dodges=-99;FX.onHurt();FX.hitStop(heavy?0.08:0.05);
 if(heavy)FX.zoom(0.35,1.06,l.px,l.gy-36);
 D.texts.push({s:'-'+Math.round(dmg),col:'#ff8a7a',size:0.6,t:0,dmg:1,x:rndf(-14,14),px:1});
 bloodSpray(l.px+4,l.gy-40,heavy?14:8,Math.PI+0.3,heavy?3:2);
 if(P.hp<=0)toDeath();}
function openEnemy(t,broken){E.state='open';E.t=t+(P.w.reach||0);if(broken)E.kd=1.1;E.combo=0;E.lastDir=-1;E.queue=[];E.stag=broken?1.5:1;E.recoil=1;
 const l=L();FX.glyph(broken?'斬れ！ STRIKE':'斬れ',l.ex,l.gy-74,{col:broken?'#ffd27a':'rgba(255,240,220,.9)',size:broken?12:9,l:0.9,vy:-10});
 if(broken){superGain(15);hap('parryBreak');taiko(0.5,90);}}
function enemyUpdate(dt){
 E.hurt=Math.max(0,E.hurt-dt*4);E.miss=Math.max(0,E.miss-dt*1.5);E.lunge=Math.max(0,E.lunge-dt*3);E.block=Math.max(0,E.block-dt*3);E.stag=Math.max(0,E.stag-dt*1.2);E.recoil=Math.max(0,E.recoil-dt*2.5);
 if(ST.boss&&!E.p2&&E.hp<=E.max*0.5){E.p2=true;say('NO MORE HOLDING BACK','#ff3a3a',1.1,'本気');D.flash=0.5;D.shake=6;taiko(0.7,55);taiko(0.6,55,0.25);hap('phase2');E.queue=[];enemyIdle(1.4);
  const l=L();FX.hitStop(0.12);FX.zoom(0.8,1.1,l.ex,l.gy-40);FX.ring(l.ex,l.gy-40,8,60,'rgba(255,60,60,.9)',4,0.7);FX.stamp('本気',l.ex,l.gy-70,{col:'#ff3a3a',size:30,ink:'rgba(0,0,0,.6)',sub:E.def.p2name||'NO MORE HOLDING BACK',subCol:'#ffd0c0',l:1.6});return;}
 if(E.state==='idle'){E.t-=dt;if(E.t<=0){E.queue=pickPattern();E.chain=0;E.dodges=0;beginAttack(E.queue.shift());}}
 else if(E.state==='windup'){E.windT+=dt;const a=E.atk;
  if(a.feint&&!E.feinted&&E.windT>=E.wind*a.feint.at){E.feinted=true;E.dir=a.feint.dir;E.wind=Math.min(1.95,E.windT+0.75*E.def.spd);say('FEINT!','#ffb070',0.8,'虚');play('swish2',0.5,1.3);hap('feint');}
  if(E.windT>=E.wind)strikeLands();}
 else if(E.state==='strike'){E.t-=dt;if(E.t<=0){if(E.queue.length&&P.hp>0)beginAttack(E.queue.shift());else enemyIdle();}}
 else if(E.state==='open'){E.t-=dt;if(E.t<=0){if(E.combo>=2)say('COMBO x'+E.combo,'#ffd27a',0.9,'連撃');enemyIdle(rndf(.7,1.2)*E.def.spd);}}}
const windRemaining=()=>E.wind-E.windT;
function playerSwipe(d){
 if(D.phase!=='fight'||P.hp<=0||E.dead||P.cd>0)return;
 P.swing=1;P.swingDir=d;P.cd=P.w.cd;play(Math.random()<.5?'swish1':'swish2',0.5,rndf(.9,1.15)*(P.w.kind==='odachi'?0.8:1));
 const l=L(),clashX=(l.px+l.ex)/2,clashY=l.gy-44;hap('swipe');
 if(DFX.superSeq||DFX.magicSeq&&DFX.magicSeq.t<0.5)return;
 if(E.state==='windup'){const rem=windRemaining(),a=E.atk,wb=P.w.win+DIFF().win;
  if(!a.unblock&&d===E.dir&&rem<=0.6+wb&&!(a.feint&&!E.feinted)){
   D.stats.parries++;S.tot.parries++;E.chain++;let label='PARRY',jp='受け流し',col='#e9f2ff',tier=0;
   if(rem<=0.2+wb*0.5){label='PERFECT PARRY';jp='完璧';col='#fff';tier=2;D.stats.perfect++;S.tot.perfect++;play('perfect',0.8);}else if(rem<=0.38+wb*0.5){label='GREAT PARRY';jp='見事';tier=1;}
   play('parry',1,rndf(.95,1.05));steel(tier===2?0.4:0.25);hap(tier===2?'parryPerfect':tier===1?'parryGreat':'parry');superGain(tier===0?6:10);
   sparks(clashX,clashY,'#fff6e0',28,7);D.shake=tier===2?5:3;E.recoil=1;FX.onParry(tier===2);D.stats.streak=Math.max(D.stats.streak,FX.streak);
   const ang=Math.atan2(DV[d][1],DV[d][0]);FX.flash(clashX,clashY,ang,tier===2?40:26,tier===2?'#ffffff':'#fff2dc',tier===2?4:3,0.2);
   FX.shard(clashX,clashY,tier===2?26:14,tier===2?'#fff':'#ffe9c0',tier===2?6:4,8);FX.ring(clashX,clashY,6,tier===2?56:34,tier===2?'rgba(255,255,255,.95)':'rgba(255,235,210,.7)',tier===2?3:2,tier===2?0.45:0.3);
   if(tier===2){if(P.w.kind==='iaito'){afterimage('P','#ffffff',0.7,0.3);cutLine(clashX,clashY,ang,40,'#ffffff',0.6);}flameBurst(clashX,clashY,36,5.5,ang,'fire');flameBurst(clashX,clashY,16,4,ang+Math.PI,'gold');emberRise(clashX,clashY,16,'fire');shockwave(clashX,clashY,4,74,'#fff8e0',3,0.55);shockwave(clashX,clashY,2,30,'#ffd27a',2,0.3);DFX.glowT=0.4;DFX.tint={col:'rgba(255,220,160,1)',a:0.28,t:0,l:0.22};
    FX.hitStop(0.09);if(S.set.slow)FX.slow(0.28,0.3);FX.zoom(0.5,1.07,clashX,clashY);P.counter=1;if(P.w.ls){P.hp=Math.min(P.max,P.hp+P.w.ls);D.texts.push({s:'+'+P.w.ls,col:'#9fe3a0',size:0.55,t:0,dmg:1,x:rndf(-10,10),px:1});}
    FX.stamp('完璧',clashX,clashY-40,{col:'#fff',size:28,ink:'rgba(10,6,8,.65)',sub:'PERFECT',subCol:'#ffe9c0',l:1.0});}
   else if(tier===1){flameBurst(clashX,clashY,14,3.5,ang,'fire');emberRise(clashX,clashY,6,'fire');shockwave(clashX,clashY,3,40,'#ffe9c0',2,0.35);DFX.glowT=0.2;FX.hitStop(0.05);FX.stamp('見事',clashX,clashY-38,{col:'#f3ecdf',size:22,ink:'rgba(10,6,8,.5)',sub:'GREAT',l:0.8});}
   else{flameBurst(clashX,clashY,6,2.5,ang,'fire');FX.hitStop(0.03);}
   if(FX.streak>=3&&FX.streak%3===0){FX.glyph('連 x'+FX.streak,l.px+4,l.gy-80,{col:'#ffd27a',size:11,l:0.9,vy:-12});if(FX.streak%5===0){superGain(5);hap('combo');}}
   if(E.queue.length){if(tier<2)say(label,col,1,jp);beginAttack(E.queue.shift());}
   else if(E.chain>=3||tier===2&&E.chain>=2){say('PARRY BREAK!!','#fff',1.15,'崩し');FX.stamp('崩',l.ex,l.gy-70,{col:'#ffe9c0',size:34,ink:'rgba(0,0,0,.6)',sub:'PARRY BREAK',rot:0.15,l:1.1});FX.hitStop(0.08);openEnemy(2.6,true);}
   else{if(tier<2)say(label,col,1,jp);openEnemy(tier===2?2.0:1.5);}
   return;}
  if(!a.unblock&&d!==E.dir&&rem<=0.6+wb&&!(a.feint&&!E.feinted)){E.miss=0.5;E.missDir=d;}
  enemyShield();return;}
 if(E.state==='open'){hitEnemy(d);return;}
 if(E.state==='idle'){if(!P.w.gb&&!(P.w.wrap&&Math.random()<P.w.wrap)&&Math.random()<Math.min(0.85,E.def.guard||0.6)){enemyShield();if(Math.random()<.35)E.t=Math.min(E.t,0.25);}else hitEnemy(d,0.6);}}
function enemyShield(){E.block=1;say('BLOCKED','#aab',0.7,'防');play('block',0.6,1.2);steel(0.12,1.2);const l=L();sparks((l.px+l.ex)/2+8,l.gy-40,'#ddd',8,3);flameBurst((l.px+l.ex)/2+8,l.gy-40,5,2,null,'gold');hap('tick');}
function hitEnemy(d,mult=1){
 const alt=E.lastDir>=0&&d!==E.lastDir;E.combo++;E.lastDir=d;D.stats.hits++;S.tot.hits=(S.tot.hits||0)+1;D.stats.maxCombo=Math.max(D.stats.maxCombo,E.combo);
 const broken=E.stag>1,counter=P.counter>0&&mult===1;if(counter){P.counter=0;D.stats.counters++;S.tot.counters++;}
 let dmg=(20+E.combo*3+(alt?6:0))*mult*(broken?1.4*(P.w.crit||1):1)*P.w.dmg*(counter?P.w.counter:1)*(1+S.level*0.03);dmg=Math.round(dmg);E.hp=Math.max(0,E.hp-dmg);E.hurt=1;D.shake=counter?5:3;
 P.magic=Math.min(100,P.magic+7*P.w.mag);superGain(3);
 play(Math.random()<.5?'hit1':'hit2',0.8,rndf(.9,1.1));hap(counter?'counter':broken?'crit':alt?'hitAlt':'hit');if(P.w.kind==='odachi'||P.w.kind==='kanabo'||P.w.kind==='ono')taiko(0.3,80);
 const l=L();bloodSpray(l.ex-4,l.gy-40,counter?16:7,0.2,counter?3.5:2);if(counter){flameBurst(l.ex-4,l.gy-40,18,4,0.3,'gold');shockwave(l.ex-4,l.gy-40,4,50,'#ffd27a',2,0.4);}else if(broken)flameBurst(l.ex-4,l.gy-40,6,2.5,0.3,'blood');
 FX.shard(l.ex-4,l.gy-40,counter?14:6,counter?'#ffd27a':'rgba(255,240,220,.7)',counter?6:3,6);if(counter)FX.hitStop(0.06);
 D.texts.push({s:''+dmg,col:counter?'#ffd27a':broken?'#ffb07a':'#ffe1b0',size:counter?0.85:broken?0.7:0.6,t:0,dmg:1,x:rndf(-16,16)});
 if(counter)say('COUNTER','#ffd27a',1.0,'返し');else if(E.combo>=3&&E.combo%3===0)say('COMBO x'+E.combo,'#ffd27a',0.9,'連撃');else if(mult===1)say('HIT','#f3e6d0',0.6);
 if(E.hp<=0)toVictory();}
function castMagic(){if(P.magic<100||E.dead||D.phase!=='fight'||DFX.magicSeq||DFX.superSeq)return;P.magic=0;startMagicSeq();}
function castSuper(){if(P.superM<100||E.dead||D.phase!=='fight'||DFX.superSeq||DFX.magicSeq)return;P.superM=0;steel(0.4,0.7);D.shake=8;startSuperSeq();}
function dodge(kind){if(D.phase!=='fight'||P.dodge>0||DFX.superSeq)return;P.dodge=P.dodgeMax;P.dodgeKind=kind;play('dodge',0.6,kind==='jump'?1.2:1);hap('tap');const l=L();afterimage('P','#9fe3ff',0.5,0.35);dustPuff(l.px,l.gy,8);}
function toVictory(){E.dead=true;E.state='dead';E.deadT=0;E.hurt=0;D.phase='victory';D.t=0;play('die',0.9,0.8);play('victory',0.9);taiko(0.8,60);hap('victory');S.tot.wins++;S.kills++;FX.hitStop(0.1);if(S.set.slow)FX.slow(0.5,0.35);
 const l=L();FX.stamp('斬',l.ex,l.gy-70,{col:'#f3e6d0',size:40,ink:'rgba(120,10,16,.75)',sub:'FELLED',l:1.3});}
function toDeath(){P.dead=true;P.deadT=0;D.phase='death';D.t=0;hap('death');play('die',1);taiko(0.6,45);S.deaths=(S.deaths||0)+1;FX.hitStop(0.1);if(S.set.slow)FX.slow(0.6,0.3);MUSIC2.play('death',{fallback:[],loop:false,fade:0.3});}
/* ---------- per-frame update ---------- */
function duelUpdate(dtRaw){const dt=dtRaw;D.t+=dt;
 FX.update(dt);const ts=FX.timeScale(dt);const gdt=dt*ts;D.stats.t+=gdt;
 D.shake=Math.max(0,D.shake-dt*22);D.flash=Math.max(0,D.flash-dt*2);D.superFx=Math.max(0,D.superFx-dt*1.6);D.camX=Math.sin(T*0.3)*4;
 D.texts.forEach(t=>t.t+=dt);D.texts=D.texts.filter(t=>t.t<(t.dmg?0.9:1.4));
 D.parts=D.parts.filter(p=>(p.t+=dt)<p.l);D.parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.fire?-0.02:0.09;});
 updateBlood(dt);updateGibs(dt);if(D.phase!=='exec')dfxUpdate(dt);
 if(D.phase==='intro'){if(D.t>2.2||consumeTaps().length&&D.t>0.4){D.phase='fight';D.t=0;say('HAJIME!','#f3e6d0',1.3,'始め');taiko(0.7,70);taiko(0.6,90,0.3);hap('tap');inputMode='duel';}return;}
 if(D.phase==='fight'){for(const p of consumeTaps()){if(p.esc){openPause();return;}}
  P.swing=Math.max(0,P.swing-gdt*4.2);P.hurt=Math.max(0,P.hurt-gdt*3);P.cd=Math.max(0,P.cd-gdt);P.dodge=Math.max(0,P.dodge-gdt);P.counter=Math.max(0,P.counter-gdt*0.45);
  if(P.blockDur<P.blockMax){P.blockRegen+=gdt;if(P.blockRegen>=P.regen){P.blockRegen=0;P.blockDur++;}}
  P.ghost+=(P.hp-P.ghost)*Math.min(1,dt*3);E.ghost+=(E.hp-E.ghost)*Math.min(1,dt*3);
  if(P.hp<P.max*0.25){P.lowT+=dt;if(P.lowT>1.1){P.lowT=0;hap('heartbeat');}}
  for(const sw of consumeSwipes())playerSwipe(dirOf(sw.dx,sw.dy));
  P.blocking=!!IN.hold.block;
  enemyUpdate(gdt);D.trail.forEach(t=>t.t+=dt);D.trail=D.trail.filter(t=>t.t<0.25);
  if(IN.anyDown){for(const id in IN.ptr){const q=IN.ptr[id];if(!q.btn&&!q.stick&&q.fired){D.trail.push({x:q.x,y:q.y,t:0});if(D.trail.length>14)D.trail.shift();}}}
  return;}
 if(D.phase==='victory'){consumeTaps();E.deadT+=dt;if(D.t>1.1){if(S.set.gore&&!window.LITE_GORE)startExecution();else{finishKill();}}return;}
 if(D.phase==='exec'){execUpdate(dt);return;}
 if(D.phase==='loot'){const tp=consumeTaps();if(D.t>0.5)tp.some(t=>lootTap(t));return;}
 if(D.phase==='death'){P.deadT+=dt;const tp=consumeTaps();if(D.t>1.6&&tp.length){ // retry (story bosses) or wake at the last Wind Shrine
   if(D.story){const npc=D.npc,opts=D.opts;endDuel('lose');PL.hp=playerMaxHp();setTimeout(()=>startDuel(npc,opts),50);}
   else{endDuel('lose');wakeAtShrine();}}return;}
}
/* ---------- buttons ---------- */
function duelButtons(){BTN_DEFS.length=0;const l=L();
 BTN_DEFS.push({id:'block',x:l.block.x,y:l.block.y,r:l.block.r,visible:()=>D.phase==='fight'},
  {id:'dodgeL',x:l.dodgeL.x,y:l.dodgeL.y,r:l.dodgeL.r,visible:()=>D.phase==='fight',down:()=>dodge('back')},
  {id:'dodgeR',x:l.dodgeR.x,y:l.dodgeR.y,r:l.dodgeR.r,visible:()=>D.phase==='fight',down:()=>dodge('jump')},
  {id:'magic',x:l.magic.x,y:l.magic.y,r:l.magic.r,visible:()=>D.phase==='fight',down:()=>castMagic()},
  {id:'super',x:l.super.x,y:l.super.y,r:l.super.r,visible:()=>D.phase==='fight',down:()=>castSuper()},
  {id:'pause',x:l.pause.x,y:l.pause.y,r:l.pause.r,visible:()=>D.phase==='fight',down:()=>{if(window.openPause)openPause();}});}
/* ============================================================================
   PIXEL FIGURES — same IK skeleton as Kage no Chikai, drawn with pixel limbs.
   ========================================================================== */
function ik(sx,sy,tx,ty,a,b,bend){const dx=tx-sx,dy=ty-sy,dd=Math.hypot(dx,dy)||1,d=clamp(dd,Math.abs(a-b)+0.5,a+b-0.5);const base=Math.atan2(dy,dx),ang=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1)),t=base+bend*ang;return[sx+Math.cos(t)*a,sy+Math.sin(t)*a,sx+dx/dd*d,sy+dy/dd*d];}
const BASE={hx:0,hy:-86,lean:0.12,head:0,fF:[20,0],fB:[-22,0],hand:[24,26],wa:-1.05,rot:0,ox:0,oy:0,hb:0,bl:1,bk:0}; // hb: left hand on the koiguchi · bl: visible blade fraction · bk: blade drawn from the hand to the koiguchi (nōtō)
function mixp(a,b,t){const o={};for(const k in a){const va=a[k],vb=b[k]===undefined?va:b[k];o[k]=Array.isArray(va)?[lerp(va[0],vb[0],t),lerp(va[1],vb[1],t)]:lerp(va,vb,t);}return o;}
const WLEN={kanabo:70,tanto:40,katana:72,wakizashi:52,odachi:100,naginata:70,yari:70,kusarigama:30,tessen:26,ono:60,bo:60,nagamaki:84,iaito:74};
const TWO={kanabo:1,katana:1,odachi:1,naginata:1,yari:1,ono:1,bo:1,nagamaki:1,iaito:1};
// pixel thick line
function pline(x0,y0,x1,y1,w,col){G.fillStyle=col;const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0||1;const h=Math.floor(w/2);for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);G.fillRect(x-h,y-h,w,w);}}
function prect(x,y,w,h,col){G.fillStyle=col;G.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
/** draw a fighter at (x,y ground), facing f (1 right / -1 left), scale s, pose ps, colours C */
function figure(x,y,f,s,ps,C){
 const tf=(px,py)=>{let lx=px+ps.ox,ly=py+ps.oy;if(ps.rot){const c=Math.cos(ps.rot),sn=Math.sin(ps.rot);const rx=lx*c-ly*sn,ry=lx*sn+ly*c;lx=rx;ly=ry;}return [x+lx*f*s,y+ly*s];};
 const hx=ps.hx,hy=ps.hy,tl=58,sx=hx+Math.sin(ps.lean)*tl,sy=hy-Math.cos(ps.lean)*tl;
 const nx=sx+Math.sin(ps.lean+ps.head*0.5)*12,ny=sy-Math.cos(ps.lean+ps.head*0.5)*12;
 const legB=ik(hx-4,hy,ps.fB[0],ps.fB[1]-4,44,44,-1),legF=ik(hx+4,hy,ps.fF[0],ps.fF[1]-4,44,44,-1);
 const wdx=Math.cos(ps.wa),wdy=Math.sin(ps.wa);
 const armF=ik(sx+4,sy+2,sx+ps.hand[0],sy+ps.hand[1],30,28,1);
 const kg=[hx-6,hy-2];let h2=TWO[C.weapon]?[armF[2]-wdx*11,armF[3]-wdy*11]:[sx-10+Math.sin(T*2)*2,sy+34];if(ps.hb>0)h2=[lerp(h2[0],kg[0],ps.hb),lerp(h2[1],kg[1],ps.hb)];
 const armB=ik(sx-4,sy+2,h2[0],h2[1],30,28,1);
 const lw=Math.max(2,Math.round(5*s*2.6)),aw=Math.max(2,Math.round(4*s*2.6)),body=C.body,back=C.back,skin=C.skin||'#e8c39f';
 const L2=(a,b,w,col)=>{const p=tf(a[0],a[1]),q=tf(b[0],b[1]);pline(p[0],p[1],q[0],q[1],w,col);};
 C.parts=C.parts||{};const hide=C.hide||{};
 // cape
 if(C.cape&&!hide.cape){const sw=Math.sin(T*3)*3*(1+(C.wind||0));const a=tf(sx-6,sy+2),b=tf(hx-24-(C.wind||0)*18+sw,sy+62),c=tf(hx-4,sy+60),d=tf(sx+6,sy+10);G.fillStyle=C.capeCol||'#5a1a24';G.beginPath();G.moveTo(a[0],a[1]);G.lineTo(b[0],b[1]);G.lineTo(c[0],c[1]);G.lineTo(d[0],d[1]);G.closePath();G.fill();}
 // saya (scabbard) at the left hip for the iaitō
 if(C.weapon==='iaito'&&!hide.torso){const a=tf(hx-6,hy-2),b=tf(hx-6-38*(C.sheathed?1:1),hy+18);pline(a[0],a[1],b[0],b[1],2,'#1a1218');const c=tf(hx-6-10,hy+4);prect(c[0],c[1],2,1,'#8a2a2a');}
 // back leg + back arm
 if(!hide.legB){L2([hx-4,hy],[legB[0],legB[1]],lw,back);L2([legB[0],legB[1]],[legB[2],legB[3]],lw-1,back);const ft=tf(legB[2]+2,legB[3]);prect(ft[0]-3,ft[1]-1,7,3,'#1a1612');}
 if(!hide.armB){L2([sx-4,sy+2],[armB[0],armB[1]],aw,back);L2([armB[0],armB[1]],[armB[2],armB[3]],aw-1,back);const hd=tf(armB[2],armB[3]);prect(hd[0]-1,hd[1]-1,3,3,skin);}
 // hakama / robe skirt (with pleat lines and a darker hem)
 const k0=tf(hx-14,hy-6),k1=tf(legB[0]-10,legB[1]+14),k2=tf(legF[0]+10,legF[1]+14),k3=tf(hx+14,hy-6);G.fillStyle=body;G.beginPath();G.moveTo(k0[0],k0[1]);G.lineTo(k1[0],k1[1]);G.lineTo(k2[0],k2[1]);G.lineTo(k3[0],k3[1]);G.closePath();G.fill();
 {const pl=shade(body,0.72);for(let i=1;i<4;i++){const t=i/4;const a=[k0[0]+(k3[0]-k0[0])*t,k0[1]+(k3[1]-k0[1])*t],b=[k1[0]+(k2[0]-k1[0])*t,k1[1]+(k2[1]-k1[1])*t];pline(a[0],a[1],b[0],b[1],1,pl);}pline(k1[0],k1[1],k2[0],k2[1],1,pl);
  if(C.armor){const kz=shade(C.armorCol||'#4a4a52',0.85);for(let i=0;i<4;i++){const t=i/4;const a=tf(hx-13+(t*26),hy-4),b=tf(hx-15+(t*30),hy+14);pline(a[0],a[1],b[0],b[1],1,kz);}}}
 // front leg
 if(!hide.legF){L2([hx+4,hy],[legF[0],legF[1]],lw,body);L2([legF[0],legF[1]],[legF[2],legF[3]],lw-1,body);const ft=tf(legF[2]+2,legF[3]);prect(ft[0]-3,ft[1]-1,7,3,'#1a1612');}
 // torso
 if(!hide.torso){const t0=tf(hx-13,hy),t1=tf(sx-16,sy-2),t2=tf(sx+16,sy-2),t3=tf(hx+14,hy);G.fillStyle=body;G.beginPath();G.moveTo(t0[0],t0[1]);G.lineTo(t1[0],t1[1]);G.lineTo(t2[0],t2[1]);G.lineTo(t3[0],t3[1]);G.closePath();G.fill();
  if(C.armor){const a0=tf(hx-15,hy-2),a1=tf(sx-15,sy+2),a2=tf(sx+15,sy+2),a3=tf(hx+15,hy-2);G.fillStyle=C.armorCol||'#4a4a52';G.beginPath();G.moveTo(a0[0],a0[1]);G.lineTo(a1[0],a1[1]);G.lineTo(a2[0],a2[1]);G.lineTo(a3[0],a3[1]);G.closePath();G.fill();
   for(let k=0;k<3;k++){const p=tf(sx-13,sy+8+k*12),q=tf(sx+13,sy+8+k*12);pline(p[0],p[1],q[0],q[1],1,shade(C.armorCol||'#4a4a52',0.7));}
   const s0=tf(sx-8,sy-4),s1=tf(sx-24,sy+10);pline(s0[0],s0[1],s1[0],s1[1],Math.round(6*s*2.6),C.armorCol||'#4a4a52');}
  else{const c0=tf(sx-6,sy-2),c1=tf(hx+1,hy-14);pline(c0[0],c0[1],c1[0],c1[1],1,C.trim||'#e8dcc0');const c2=tf(sx+8,sy-2);pline(c2[0],c2[1],c1[0],c1[1],1,C.trim||'#e8dcc0');
   const u0=tf(sx-14,sy+6),u1=tf(sx+14,sy+6);pline(u0[0],u0[1],u1[0],u1[1],1,shade(body,1.25)); // shoulder highlight
   const o0=tf(hx-13,hy-6),o1=tf(hx+13,hy-6);pline(o0[0],o0[1],o1[0],o1[1],2,C.obi||'#2b2130');const kn=tf(hx-8,hy-6);prect(kn[0]-1,kn[1]-1,3,3,shade(C.obi||'#2b2130',1.5));}
  // sleeves: kimono sleeves hang from the upper arms
  if(!C.armor&&!hide.armF){const sl=tf(armF[0],armF[1]+2);prect(sl[0]-2,sl[1]-1,5,4,shade(body,0.85));}}
 // neck + head
 if(!hide.head){L2([sx,sy],[nx,ny],Math.max(2,Math.round(3*s*2.6)),skin);const hp=tf(nx,ny-8);const hr=Math.max(3,Math.round(11*s));prect(hp[0]-hr,hp[1]-hr,hr*2+1,hr*2+1,skin);
  // hair / hat
  drawHatPx(C.hat,hp[0],hp[1],hr,f,C);
  // face: brow, eye, cheek shade, mouth
  if(!C.noEye){const ex=Math.round(hp[0]+f*2),ey=Math.round(hp[1]-1),ew=Math.max(1,Math.round(hr*0.45));G.fillStyle=shade(skin,0.82);G.fillRect(ex-1,ey-3,ew+2,1);G.fillRect(Math.round(hp[0]-hr+1),Math.round(hp[1]+2),hr*2-1,1);
   G.fillStyle=C.eye||'#1a1416';G.fillRect(ex,ey,ew,1);G.fillStyle=shade(skin,0.7);G.fillRect(Math.round(hp[0]+f*3),Math.round(hp[1]+hr-3),2,1);
   if(C.glow){G.globalAlpha=0.6;G.fillRect(ex-1,ey-1,ew+2,3);G.globalAlpha=1;}}
  if(C.beard){prect(hp[0]-hr+2,hp[1]+hr-2,hr*2-3,2,C.hair||'#1a1416');}
  if(C.blood>0){G.fillStyle='rgba(140,10,20,.8)';G.fillRect(Math.round(hp[0]-hr),Math.round(hp[1]+hr-2),hr*2+1,2);}}
 // weapon + front arm
 if(!hide.armF){const hd=tf(armF[2],armF[3]);
  if(!hide.weapon){if(C.weapon==='iaito'&&!C.sheathed&&(ps.bk>0||(ps.bl!=null&&ps.bl<1))){ // nōtō: the blade is laid toward the koiguchi and only the part outside the saya is drawn
    let ang=ps.wa,vl=WLEN.iaito*(ps.bl==null?1:ps.bl);if(ps.bk>0){const vx=kg[0]-armF[2],vy=kg[1]-armF[3];ang=Math.atan2(vy,vx);vl=Math.min(WLEN.iaito,Math.hypot(vx,vy))*(ps.bl==null?1:ps.bl);}
    C.visLen=vl*s;drawWeaponPx('iaito',hd[0],hd[1],ang*f+(f<0?Math.PI:0),s,C,f);C.visLen=null;}
   else drawWeaponPx(C.weapon,hd[0],hd[1],ps.wa*f+(f<0?Math.PI:0),s,C,f);}
  L2([sx+4,sy+2],[armF[0],armF[1]],aw,body);L2([armF[0],armF[1]],[armF[2],armF[3]],aw-1,C.kote?C.armorCol||body:body);prect(hd[0]-1,hd[1]-1,3,3,skin);}
}
function drawHatPx(h,x,y,hr,f,C){const hair=C.hair||'#1a1416';x=Math.round(x);y=Math.round(y);
 if(h==='kasa'){G.fillStyle='#c9a66e';const w=hr*2+6;for(let i=0;i<4;i++)G.fillRect(x-w/2+i*2,y-hr-1+i,w-i*4,1);G.fillRect(x-w/2,y-hr+3,w,1);G.fillStyle='#8a6a40';G.fillRect(x-w/2,y-hr+4,w,1);}
 else if(h==='jingasa'){G.fillStyle='#3a3b40';const w=hr*2+4;for(let i=0;i<3;i++)G.fillRect(x-w/2+i*3,y-hr-1+i,w-i*6,1);G.fillRect(x-w/2,y-hr+2,w,1);}
 else if(h==='kabuto'){G.fillStyle=C.hatCol||'#2a2e36';G.fillRect(x-hr-1,y-hr-2,hr*2+3,hr+1);G.fillRect(x-hr-2,y-1,hr*2+5,2);G.fillStyle='#d9b24e';G.fillRect(x-1,y-hr-5,3,3);G.fillRect(x-hr-1,y-hr-5,1,3);G.fillRect(x+hr+1,y-hr-5,1,3);}
 else if(h==='hood'||h==='shadowhood'){G.fillStyle=C.hatCol||'#2a2622';G.fillRect(x-hr-1,y-hr-2,hr*2+3,hr+2);G.fillRect(x-hr-1,y-1,2,hr+2);G.fillRect(x+hr,y-1,2,hr+2);}
 else if(h==='band'){G.fillStyle=hair;G.fillRect(x-hr,y-hr-1,hr*2+1,2);G.fillStyle=C.hatCol||'#efe6d2';G.fillRect(x-hr-1,y-hr+1,hr*2+3,2);G.fillRect(x-hr-4*f-2,y-hr+2,3,1);}
 else if(h==='oni'){G.fillStyle='#b8242a';G.fillRect(x-hr,y-hr-1,hr*2+1,hr*2+2);G.fillStyle='#ffd27a';G.fillRect(x-2,y-1,2,1);G.fillRect(x+2,y-1,2,1);G.fillStyle='#efe6d2';G.fillRect(x-hr+1,y-hr-4,1,3);G.fillRect(x+hr-1,y-hr-4,1,3);G.fillRect(x-1,y+hr-1,3,1);}
 else if(h==='eboshi'){G.fillStyle='#111014';G.fillRect(x-2,y-hr-9,5,9);G.fillStyle=hair;G.fillRect(x-hr,y-hr-1,hr*2+1,2);}
 else if(h==='tengai'){G.fillStyle='#c9a66e';G.fillRect(x-hr-1,y-hr-3,hr*2+3,hr*2+4);for(let j=0;j<hr*2+4;j+=2)G.fillRect(x-hr-1,y-hr-3+j,hr*2+3,1);G.fillStyle='#a98756';for(let j=1;j<hr*2+4;j+=2)G.fillRect(x-hr-1,y-hr-3+j,hr*2+3,1);}
 else if(h==='fur'){G.fillStyle='#5a4a3a';G.fillRect(x-hr-1,y-hr-3,hr*2+3,hr);G.fillStyle='#7a6a5a';for(let i=0;i<hr*2+3;i+=2)G.fillRect(x-hr-1+i,y-hr-4,1,1);}
 else if(h==='mask'){G.fillStyle=hair;G.fillRect(x-hr,y-hr-1,hr*2+1,2);G.fillStyle=C.hatCol||'#1a1a1e';G.fillRect(x-hr,y+1,hr*2+1,hr);}
 else if(h==='crown'){G.fillStyle=hair;G.fillRect(x-hr,y-hr-1,hr*2+1,2);G.fillStyle='#d9b24e';G.fillRect(x-hr,y-hr-3,hr*2+1,2);G.fillRect(x-hr+1,y-hr-4,1,1);G.fillRect(x,y-hr-5,1,2);G.fillRect(x+hr-1,y-hr-4,1,1);}
 else if(h==='headcloth'){G.fillStyle=C.hatCol||'#4a5a8a';G.fillRect(x-hr-1,y-hr-2,hr*2+3,3);}
 else if(h==='shaven'||h==='bald'){}
 else if(h==='long'){G.fillStyle=hair;G.fillRect(x-hr-1,y-hr-1,hr*2+3,3);G.fillRect(x-hr-1-(f<0?0:0),y-hr+1,2,hr*2+4);G.fillRect(x+hr,y-hr+1,2,hr*2+4);}
 else{ // topknot / short default
  G.fillStyle=hair;G.fillRect(x-hr,y-hr-1,hr*2+1,3);G.fillRect(x-hr,y-hr+2,1,2);G.fillRect(x+hr,y-hr+2,1,2);if(h==='topknot'||h==='player'||!h){G.fillRect(x-1-f*2,y-hr-4,3,3);}}
}
function drawWeaponPx(k,x,y,a,s,C,f){const len=(WLEN[k]||60)*s;const col=C.steel||'#d8dde6',colD='#8a909a',wood='#7a5536';const cs=Math.cos(a),sn=Math.sin(a);
 const P2=(d)=>[x+cs*d,y+sn*d];const seg=(d0,d1,w,c)=>{const p=P2(d0),q=P2(d1);pline(p[0],p[1],q[0],q[1],w,c);};
 if(k==='iaito'&&C.sheathed){const g=P2(0);prect(g[0]-1,g[1]-2,3,5,'#d9b24e');seg(-16*s,0,2,'#1a1612');for(let d=-14*s;d<-1;d+=4){const p=P2(d);prect(p[0],p[1],1,1,'#e8dcc0');}return;}
 if(k==='iaito'&&C.visLen!=null){const hl=18*s;seg(-hl,0,2,'#1a1612');for(let d=-hl+2;d<-1;d+=4){const p=P2(d);prect(p[0],p[1],1,1,'#e8dcc0');}const g=P2(0);prect(g[0]-1,g[1]-2,3,5,'#d9b24e');const vl=C.visLen;if(vl>2){seg(2,vl,2,col);if(vl>10)seg(vl*0.45,vl-2,1,'#ffffff');const tp=P2(vl);prect(tp[0],tp[1],1,1,'#ffffff');}return;}
 if(k==='katana'||k==='odachi'||k==='wakizashi'||k==='nagamaki'||k==='tanto'||k==='iaito'){const hl=(k==='odachi'?26:k==='nagamaki'?46:k==='wakizashi'?12:k==='tanto'?10:18)*s;seg(-hl,0,2,k==='nagamaki'?wood:'#1a1612');for(let d=-hl+2;d<-1;d+=4){const p=P2(d);prect(p[0],p[1],1,1,'#e8dcc0');}const g=P2(0);prect(g[0]-1,g[1]-2,3,5,'#d9b24e');seg(2,len,2,col);seg(len*0.45,len-2,1,'#ffffff');const tp=P2(len);prect(tp[0],tp[1],1,1,'#ffffff');}
 else if(k==='naginata'||k==='yari'){seg(-60*s,len,2,wood);if(k==='naginata'){seg(len,len+30*s,2,col);seg(len+8*s,len+30*s,1,'#fff');}else{seg(len,len+26*s,2,col);const p=P2(len+26*s);prect(p[0],p[1],1,1,'#fff');}}
 else if(k==='bo'){seg(-60*s,len,3,wood);seg(-60*s,-54*s,3,'#4a4a52');seg(len-6*s,len,3,'#4a4a52');}
 else if(k==='kusarigama'){seg(-4,len,2,wood);const t=P2(len);const a2=a-Math.PI/2;pline(t[0],t[1],t[0]+Math.cos(a2)*18*s-cs*6*s,t[1]+Math.sin(a2)*18*s-sn*6*s,2,col);
  const sp=C.chainSpin||0;for(let i=1;i<=5;i++){const cx2=x-cs*i*6*s-Math.cos(T*9)*10*s*sp*i/5,cy2=y+i*5*s+Math.sin(T*9)*6*s*sp*i/5;prect(cx2,cy2,2,2,colD);}}
 else if(k==='tessen'){const op=C.fanOpen===undefined?1:C.fanOpen;G.fillStyle='#1c1a1e';const n=7;for(let i=0;i<=n;i++){const aa=a+(i/n-0.5)*1.8*op;const p=[x+Math.cos(aa)*len,y+Math.sin(aa)*len];pline(x,y,p[0],p[1],2,i%2?'#1c1a1e':'#b8242a');}prect(x-1,y-1,3,3,'#d9b24e');}
 else if(k==='kanabo'){seg(-14*s,4*s,2,wood);seg(4*s,len,4,'#4a4a52');for(let d=10*s;d<len;d+=6*s){const p=P2(d);prect(p[0]-1,p[1]-1,2,2,'#8a8a94');}}
 else if(k==='ono'){seg(-22*s,len-6*s,2,wood);const p=P2(len-10*s);const a2=a-Math.PI/2;G.fillStyle=col;G.beginPath();G.moveTo(p[0]+Math.cos(a2)*12*s,p[1]+Math.sin(a2)*12*s);G.lineTo(p[0]+cs*18*s+Math.cos(a2)*10*s,p[1]+sn*18*s+Math.sin(a2)*10*s);G.lineTo(p[0]+cs*18*s-Math.cos(a2)*10*s,p[1]+sn*18*s-Math.sin(a2)*10*s);G.lineTo(p[0]-Math.cos(a2)*12*s,p[1]-Math.sin(a2)*12*s);G.closePath();G.fill();}
}
/* ---------- poses ---------- */
function swingPose(d,p,f){const v=[DV[d][0]*f,DV[d][1]],st=[-v[0],-v[1]],k=ease(clamp(p*1.6,0,1));const a0=Math.atan2(st[1],st[0]),a1=Math.atan2(v[1],v[0]);let da=a1-a0;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
 return{hand:[lerp(st[0]*26+8,v[0]*34+22,k),lerp(st[1]*26+18,v[1]*30+22,k)],wa:a0+da*k,lean:0.12+0.25*k,hx:6*k,hy:-86+8*k,fF:[26+10*k,0]};}
function windPose(d,f,w){const v=[DV[d][0]*f,DV[d][1]],st=[-v[0],-v[1]],k=ease(clamp(w*1.6,0,1));return mixp(BASE,{hand:[st[0]*26+4,st[1]*24+16],wa:Math.atan2(st[1],st[0])+0.25,lean:0.12-0.18*k+st[0]*0.1,hy:-81,fB:[-28,0],head:-0.1},k);}
function enemyPose(){if(E.forcePose){if(E.lift){const p=Object.assign({},E.forcePose);p.oy=(p.oy||0)+E.lift;return p;}return E.forcePose;}const f=-1;let ps=mixp(BASE,{},0);const br=Math.sin(T*2.2)*2;ps.hy+=br*0.6;ps.hand=[ps.hand[0],ps.hand[1]+br*0.4];if(E.def.weapon==='iaito'&&E.state==='idle'&&E.block<=0&&E.hurt<=0)ps=mixp(ps,IAI_IDLE,1);
 if(E.state==='windup'){const w=E.windT/E.wind;ps=windPose(E.dir,f,w);if(E.atk.unblock){ps.hy+=8*w;ps.lean-=0.1*w;}ps.oy=Math.sin(T*40)*w*w*0.8;}
 else if(E.state==='strike'){const p=1-E.t/0.3;ps=mixp(BASE,swingPose(E.dir,clamp(p*1.4,0,1),f),1);ps.ox=12*E.lunge;}
 else if(E.state==='open'){const r=E.recoil,sw=Math.sin(T*8)*0.06*E.stag;ps=mixp(BASE,{hand:[-14,-8],wa:-2.3,lean:-0.28+sw,hy:-80,fF:[26,0],fB:[-34,0],head:-0.3,ox:-10*r},clamp(0.6+r*0.4,0,1));
  if(E.hurt>0){ps.lean-=E.hurt*0.15;ps.ox-=E.hurt*6;}
  if(E.kd>0){const q=1-E.kd/1.1,k2=q<0.3?ease(q/0.3):q<0.7?1:1-ease((q-0.7)/0.3);ps=mixp(ps,{hy:-58,lean:0.5,hand:[6,40],wa:0.8,head:0.4,fF:[30,0],fB:[-14,0],ox:-26},k2);ps.rot=-1.25*k2;}}
 else if(E.state==='dead'){const k=clamp(E.deadT/1.1,0,1);ps=mixp(BASE,{hy:-62,lean:0.5,hand:[10,40],wa:0.9,fF:[18,0],fB:[-30,0],head:0.5},ease(k));}
 else if(E.block>0)ps=mixp(ps,{hand:[20,-4],wa:-1.65},E.block);
 return ps;}
const IAI_IDLE={hand:[2,0],wa:-2.55,lean:0.08,hy:-86,fF:[18,0],fB:[-20,0]};
function playerPose(){if(P.forcePose)return P.forcePose;let ps=mixp(BASE,{},0);const br=Math.sin(T*2.4+1)*2;ps.hy+=br*0.6;if(P.w&&P.w.kind==='iaito'&&!P.drawn&&P.swing<=0.02&&!P.blocking&&P.dodge<=0&&P.hurt<=0)ps=mixp(ps,IAI_IDLE,1);
 if(P.swing>0)ps=mixp(BASE,swingPose(P.swingDir,1-P.swing,1),1);
 if(P.blocking)ps=mixp(ps,{hand:[22,-4],wa:-1.6,lean:0.02,hy:-80,fB:[-28,0]},0.9);
 if(P.dodge>0){const k=Math.sin((P.dodgeMax-P.dodge)/P.dodgeMax*Math.PI);if(P.dodgeKind==='jump')ps=mixp(ps,{fF:[14,-30],fB:[-12,-26],lean:0.3,oy:-70},k);else ps=mixp(ps,{ox:-60,lean:-0.25,hy:-74,fF:[30,0],fB:[-26,0]},k);}
 if(P.hurt>0)ps=mixp(ps,{lean:-0.3,ox:ps.ox-10,head:-0.4},P.hurt*0.8);
 if(P.dead)ps=mixp(BASE,{hy:-50,lean:0.9,hand:[16,46],wa:1.2,head:0.6,fF:[22,0],fB:[-28,0]},ease(clamp(P.deadT,0,1)));
 return ps;}
function enemyColors(live){const d=E.def,lk=d.look||{};const hurt=live&&E.hurt>0,p2=live&&E.p2;const body=hurt?'#7a4a4a':(lk.bodyCol||'#34373c');
 return{body,back:shade(body,0.72),skin:lk.skin||'#d8b898',hair:lk.hair||'#1a1416',eye:p2?'#ff2a2a':(lk.hat==='oni'?'#ff6a3a':'#1a1416'),glow:p2||lk.hat==='oni'?1:0,hat:lk.hat,hatCol:lk.hatCol,weapon:d.weapon,armor:lk.armor,armorCol:lk.armorCol,cape:lk.cloak,capeCol:lk.capeCol,trim:lk.trim,beard:lk.beard,
  wind:live?E.lunge:0.3,chainSpin:live&&E.state==='windup'?1:0.2,fanOpen:live&&E.state==='idle'?0.4:1,hide:E.hide||{},blood:E.blood||0,steel:'#d8dde6',sheathed:d.weapon==='iaito'&&live&&E.state==='idle'&&E.block<=0&&E.hurt<=0&&!E.forcePose};}
function playerColors(live){const sp=playerSpriteDef();const w=P?P.w:playerWeapon();const body=live&&P&&P.hurt>0?'#3a1a1a':(sp.bodyCol||'#141218');
 return{body,back:shade(body,0.7),skin:sp.skin,hair:sp.hair,eye:'#f4f4f4',glow:1,hat:sp.hat||'topknot',hatCol:sp.hatCol,weapon:w.kind,armor:sp.armor,armorCol:sp.armorCol,cape:sp.cape,capeCol:sp.capeCol,trim:'#8a7a70',wind:live?P.swing+(P.dodge>0?1:0):0.3,hide:(P&&P.hide)||{},steel:w.rar&&w.rar!=='common'?RARITY[w.rar].col:'#d8dde6',chainSpin:0.2,fanOpen:1,sheathed:w.kind==='iaito'&&live&&P&&!P.drawn&&(D.phase==='exec'||(P.swing<=0.02&&!P.forcePose&&!P.blocking&&P.dodge<=0&&P.hurt<=0))};}
/* ============================================================================
   BACKGROUNDS — layered pixel parallax per region/boss
   ========================================================================== */
const DUEL_BG={
 temperate:{sky:['#8fc1e8','#dcecf5'],far:'#7d95a8',mid:'#56795a',near:'#3f6442',ground:'#6a9a4e',groundD:'#4f7a3b',props:'trees'},
 sakura:{sky:['#f3c9d6','#fbe9ee'],far:'#b58aa0',mid:'#d98aa0',near:'#8a5a6a',ground:'#86a860',groundD:'#5c7a44',props:'sakura',petals:1},
 maple:{sky:['#e5a071','#f7d6b0'],far:'#8a5a4a',mid:'#b84a2e',near:'#6a2a1e',ground:'#7a6a3a',groundD:'#5a4a2a',props:'maple',petals:2},
 bamboo:{sky:['#a7c8b0','#e3efe0'],far:'#6f8f74',mid:'#4f7a46',near:'#2f5a30',ground:'#6a8a48',groundD:'#4a6a34',props:'bamboo'},
 snow:{sky:['#9aa8ba','#e6ebf1'],far:'#b5bfca','mid':'#8a97a8',near:'#5a6778',ground:'#e9eef3',groundD:'#c3cdd6',props:'pines',snow:1},
 volcanic:{sky:['#5a4a4a','#b08a7a'],far:'#4a3a3a',mid:'#6a4a3a',near:'#3a2a24',ground:'#5a5050',groundD:'#3a3030',props:'rocks',ash:1},
 pine:{sky:['#9cb7cf','#dbe6ee'],far:'#6d8498',mid:'#3f6244',near:'#2a4a2e',ground:'#5f8a46',groundD:'#476a36',props:'pines'},
 marsh:{sky:['#aab8b0','#e0e8e0'],far:'#7a8a80',mid:'#5a7a5a',near:'#3a5a3a',ground:'#6a8a5a',groundD:'#4a6a44',props:'trees'},
 lake:{sky:['#7fb0d8','#e0eef8'],far:'#7a9ab5',mid:'#2e6fa6',near:'#5a7a6a',ground:'#a2b57a',groundD:'#7a8a5a',props:'lake'},
 port:{sky:['#c9b58a','#f0e2c0'],far:'#2e6fa6',mid:'#8a6a4a',near:'#5a3a2a',ground:'#a67c4a',groundD:'#7d5a33',props:'port'},
 temple:{sky:['#c99a7a','#f0dcc4'],far:'#8a6a5a',mid:'#5a3a2a',near:'#3a2a24',ground:'#9a9a90',groundD:'#7a7a70',props:'temple'},
 camp:{sky:['#d8b080','#f3dfc0'],far:'#8a7a5a',mid:'#6a5a3a',near:'#4a3a2a',ground:'#a0845a',groundD:'#7e6540',props:'camp'},
 castle:{sky:['#8a8ab0','#e0dcea'],far:'#4a4a62','mid':'#5a5a70',near:'#2f3744',ground:'#9c9a92',groundD:'#7a786f',props:'castle'},
 fortress:{sky:['#3a2a34','#7a4a4a'],far:'#2a2a33',mid:'#1f2026',near:'#101014',ground:'#4a4b4f',groundD:'#33343a',props:'fortress',ash:1},
 throne:{sky:['#1a1014','#4a2a2a'],far:'#2a1a24',mid:'#4a2a3a',near:'#1c1a1e',ground:'#3a2a2a',groundD:'#2a1a1a',props:'throne',embers:1},
 pass:{sky:['#c8ccd0','#f0f0ee'],far:'#9aa0a6',mid:'#6a7078',near:'#3a3f44',ground:'#8a8c90',groundD:'#5f6165',props:'rocks',snow:1},
 volcano:{sky:['#6a3a2a','#d08a5a'],far:'#3a2a2a',mid:'#5a3a2a',near:'#2a1a14',ground:'#4a4040',groundD:'#2a2020',props:'rocks',ash:1,embers:1},
};
function skyFor(B){const t=DAY.t;const n=nightAmount();const dusk=t>0.68&&t<0.8?1-Math.abs(t-0.74)/0.06:0,dawn=t>0.22&&t<0.34?1-Math.abs(t-0.28)/0.06:0;
 let top=B.sky[0],bot=B.sky[1];if(n>0){top=mixc(top,'#0b0f24',n*0.9);bot=mixc(bot,'#1a2244',n*0.85);}if(dusk>0){top=mixc(top,'#5a2a4a',dusk*0.6);bot=mixc(bot,'#ff9a5a',dusk*0.6);}if(dawn>0){bot=mixc(bot,'#ffd0b0',dawn*0.4);}return {top,bot,n,dusk,dawn};}
function buildDuelBg(key){const B=DUEL_BG[key]||DUEL_BG.temperate;const [far,fq]=mkCanvas(W*2,H),[mid,mq]=mkCanvas(W*2,H),[near,nq]=mkCanvas(W*2,H);const l=L(),gy=l.gy,hz=l.hz;const rng=RNG(hashStr(key)+7);
 const sky=skyFor(B);const night=sky.n>0.5;
 // far mountains (two ridges)
 fq.fillStyle=mixc(B.far,'#1a2040',sky.n*0.6);fq.beginPath();fq.moveTo(0,H);for(let x=0;x<=W*2;x+=3){fq.lineTo(x,hz-36-fbm(x*0.009,0.3,91,3)*70);}fq.lineTo(W*2,H);fq.fill();
 fq.fillStyle='rgba(255,255,255,.1)';for(let x=0;x<W*2;x+=3){const y=hz-36-fbm(x*0.009,0.3,91,3)*70;fq.fillRect(x,y,3,2);}
 fq.fillStyle=mixc(B.far,'#101428',0.25+sky.n*0.5);fq.beginPath();fq.moveTo(0,H);for(let x=0;x<=W*2;x+=3){fq.lineTo(x,hz-14-fbm(x*0.014,0.9,93,3)*44);}fq.lineTo(W*2,H);fq.fill();
 // mid: tree line / silhouettes by props type
 const midCol=mixc(B.mid,'#0a0e20',sky.n*0.65),nearCol=mixc(B.near,'#06080f',sky.n*0.6);
 mq.fillStyle=midCol;mq.beginPath();mq.moveTo(0,H);for(let x=0;x<=W*2;x+=3){mq.lineTo(x,hz+6-fbm(x*0.02,0.7,92,3)*30);}mq.lineTo(W*2,H);mq.fill();
 const silTree=(q,x,y,h,col,kind)=>{q.fillStyle=col;if(kind==='pine'){for(let k=0;k<3;k++){const w=h*0.35-k*h*0.08,yy=y-k*h*0.3;q.beginPath();q.moveTo(x-w,yy);q.lineTo(x+w,yy);q.lineTo(x,yy-h*0.45);q.fill();}q.fillRect(x-1,y-2,3,4);}
  else if(kind==='bamboo'){for(let k=-2;k<=2;k++){q.fillRect(x+k*4,y-h,2,h);for(let j=y-h;j<y;j+=7)q.fillRect(x+k*4,j,2,1);}}
  else{q.fillRect(x-1,y-h*0.4,3,h*0.4);q.beginPath();q.ellipse(x,y-h*0.6,h*0.35,h*0.3,0,0,TAU);q.fill();q.beginPath();q.ellipse(x-h*0.15,y-h*0.5,h*0.2,h*0.18,0,0,TAU);q.fill();}};
 const pr=B.props;
 for(let x=10;x<W*2;x+=rng.int(16,40)){const h=rng.int(30,64),y=hz+8+rng.int(-6,6);
  if(pr==='trees'||pr==='lake'||pr==='temple'||pr==='castle')silTree(mq,x,y,h,nearCol,'round');else if(pr==='pines'||pr==='rocks'||pr==='camp')silTree(mq,x,y,h,nearCol,'pine');else if(pr==='bamboo')silTree(mq,x,y,h+24,nearCol,'bamboo');
  else if(pr==='sakura'||pr==='maple'){silTree(mq,x,y,h,mixc(pr==='sakura'?'#e8a0b4':'#c84a2e','#101020',sky.n*0.6),'round');}}
 if(pr==='castle'||pr==='throne'||pr==='fortress'){const bx=W*0.9;const dark=pr==='fortress'?'#15151a':pr==='throne'?'#2a1a24':'#3a3d48';mq.fillStyle=dark;for(let t=0;t<4;t++){const w=120-t*22,yb=hz+10-t*26;mq.fillRect(bx-w/2,yb-24,w,24);mq.fillRect(bx-w/2-8,yb-28,w+16,5);mq.fillRect(bx-w/2-10,yb-27,4,3);mq.fillRect(bx+w/2+6,yb-27,4,3);}mq.fillStyle=pr==='fortress'?'#f29a2f':'#f3d58a';for(let t=0;t<4;t++)for(let i=0;i<3;i++)mq.fillRect(bx-30+i*28,hz-6-t*26,6,5);}
 if(pr==='temple'){const bx=W*0.8;mq.fillStyle='#2a1a14';for(let t=0;t<5;t++){const w=70-t*8,yb=hz+10-t*20;mq.fillRect(bx-w/2,yb-14,w,14);mq.fillRect(bx-w/2-8,yb-17,w+16,4);}mq.fillStyle='#b8242a';mq.fillRect(W*0.3-14,hz-30,4,40);mq.fillRect(W*0.3+10,hz-30,4,40);mq.fillRect(W*0.3-18,hz-34,36,4);}
 if(pr==='port'||pr==='lake'){mq.fillStyle=mixc(pr==='port'?'#2e6fa6':'#3a7fb3','#0a1030',sky.n*0.7);mq.fillRect(0,hz+2,W*2,gy-hz-10);mq.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<80;i++)mq.fillRect(rng.int(0,W*2),hz+6+rng.int(0,gy-hz-20),rng.int(3,9),1);if(pr==='port'){mq.fillStyle='#3a2a1a';for(let i=0;i<3;i++){const bx=rng.int(40,W*2-40);mq.fillRect(bx-16,hz+14,32,6);mq.fillRect(bx-1,hz-20,2,34);mq.fillRect(bx+1,hz-18,10,12);}}}
 if(pr==='camp'){mq.fillStyle='#4a3a2a';for(let i=0;i<6;i++){const bx=rng.int(20,W*2-20);mq.beginPath();mq.moveTo(bx-16,gy-10);mq.lineTo(bx,gy-34);mq.lineTo(bx+16,gy-10);mq.fill();}mq.fillStyle='#b8242a';for(let i=0;i<5;i++){const bx=rng.int(20,W*2-20);mq.fillRect(bx,hz-24,1,30);mq.fillRect(bx+1,hz-24,8,12);}}
 if(pr==='fortress'||pr==='castle'){mq.fillStyle=pr==='fortress'?'#2a2a33':'#7f7a70';mq.fillRect(0,gy-26,W*2,20);mq.fillStyle=pr==='fortress'?'#1a1a22':'#5d594f';for(let x=0;x<W*2;x+=16){mq.fillRect(x,gy-26,1,20);mq.fillRect(x+6,gy-32,6,6);}}
 if(pr==='throne'){mq.fillStyle='#1c1a1e';mq.fillRect(0,gy-40,W*2,34);mq.fillStyle='#8a2a2a';for(let x=0;x<W*2;x+=48){mq.fillRect(x+8,gy-40,6,34);}mq.fillStyle='#d9b24e';for(let x=0;x<W*2;x+=48){mq.fillRect(x+8,gy-40,6,2);}mq.fillStyle='#f3d58a';for(let x=0;x<W*2;x+=48)mq.fillRect(x+26,gy-28,4,6);}
 // near: ground + texture
 const gcol=mixc(B.ground,'#0a0c18',sky.n*0.55),gd=mixc(B.groundD,'#06080f',sky.n*0.55);
 nq.fillStyle=gcol;nq.fillRect(0,gy-4,W*2,H-gy+4);nq.fillStyle=gd;for(let x=0;x<W*2;x+=3)for(let y=gy;y<H;y+=3)if(hash2(x,y,33)<0.18)nq.fillRect(x,y,2,1);nq.fillStyle='rgba(0,0,0,.18)';nq.fillRect(0,gy-4,W*2,2);
 for(let i=0;i<60;i++){const x=rng.int(0,W*2),y=gy+rng.int(2,H-gy-2);nq.fillStyle=rng()<0.5?shade(gcol,0.8):shade(gcol,1.15);nq.fillRect(x,y,rng.int(2,4),1);}
 if(B.snow){nq.fillStyle='#fff';for(let x=0;x<W*2;x+=2)if(hash2(x,1,34)<0.4)nq.fillRect(x,gy-4,2,1);}
 // set pieces at the edges (never behind the fighters)
 const piece=(q,kind,x)=>{if(kind==='torii'){q.fillStyle=mixc('#c8402a','#200810',sky.n*0.5);q.fillRect(x-14,gy-70,5,70);q.fillRect(x+9,gy-70,5,70);q.fillRect(x-20,gy-64,40,5);q.fillStyle='#1c1a1e';q.fillRect(x-24,gy-72,48,5);q.fillRect(x-10,gy-54,20,4);}
  else if(kind==='lantern'){q.fillStyle='#6d6a62';q.fillRect(x-3,gy-26,6,26);q.fillRect(x-9,gy-30,18,4);q.fillRect(x-7,gy-40,14,10);q.fillStyle='#f2c56a';q.fillRect(x-4,gy-38,8,6);q.fillStyle='#6d6a62';q.beginPath();q.moveTo(x-11,gy-40);q.lineTo(x,gy-48);q.lineTo(x+11,gy-40);q.fill();}
  else if(kind==='banner'){q.fillStyle='#5b3f28';q.fillRect(x,gy-80,2,80);q.fillStyle=B.props==='fortress'?'#1a1a1e':'#b8242a';q.fillRect(x+2,gy-78,16,40);q.fillStyle='#f3e6d0';q.fillRect(x+6,gy-66,8,3);q.fillRect(x+8,gy-58,4,10);}
  else if(kind==='trunk'){q.fillStyle=mixc('#4a3222','#0a0c18',sky.n*0.5);q.fillRect(x-7,gy-120,14,120);q.fillRect(x-12,gy-60,8,3);q.fillStyle=shade('#4a3222',0.7);q.fillRect(x-2,gy-110,2,100);}
  else if(kind==='boat'){q.fillStyle='#5b3f28';q.fillRect(x-20,gy-12,40,8);q.fillRect(x-24,gy-10,4,6);q.fillRect(x-1,gy-40,2,30);q.fillStyle='#e8dcc0';q.fillRect(x+1,gy-38,14,18);}
  else if(kind==='bamboo'){for(let k=0;k<3;k++){q.fillStyle=mixc('#7fb24c','#0a1a10',sky.n*0.6);q.fillRect(x+k*6,gy-130+k*10,3,130-k*10);q.fillStyle=mixc('#d9e8a0','#101a10',sky.n*0.6);for(let j=gy-120;j<gy;j+=14)q.fillRect(x+k*6,j+k*3,3,1);}}
  else if(kind==='rock'){q.fillStyle=mixc('#7d7f84','#0a0c18',sky.n*0.5);q.beginPath();q.ellipse(x,gy-8,22,14,0,0,TAU);q.fill();q.fillStyle=mixc('#a3a5a9','#0a0c18',sky.n*0.5);q.beginPath();q.ellipse(x-6,gy-14,10,6,0,0,TAU);q.fill();}};
 const left=W*0.5-W*0.42,right=W*0.5+W*0.42+W*0.5; // near layer is drawn at -W*0.5 offset
 const pieces={temperate:['trunk','lantern'],sakura:['torii','trunk'],maple:['trunk','lantern'],bamboo:['bamboo','bamboo'],snow:['lantern','rock'],volcanic:['rock','rock'],pine:['trunk','rock'],marsh:['trunk','rock'],lake:['lantern','boat'],port:['boat','banner'],temple:['torii','lantern'],camp:['banner','banner'],castle:['lantern','banner'],fortress:['banner','banner'],throne:['lantern','lantern'],pass:['rock','rock'],volcano:['rock','rock']}[key]||['trunk','lantern'];
 piece(nq,pieces[0],left+W*0.5);piece(nq,pieces[1],right-W*0.5+W*0.5-6);
 // foreground blades (swaying, drawn live)
 const fg=[];for(let i=0;i<Math.round(W/9);i++){fg.push({x:i*9+rng.int(0,8),h:rng.int(6,16),ph:rng()*TAU,kind:B.snow?'snow':pr==='bamboo'?'bamboo':pr==='rocks'||pr==='fortress'||pr==='throne'||pr==='castle'?'stone':'grass'});}
 // clouds
 const clouds=[];for(let i=0;i<4;i++)clouds.push({x:rng()*W*1.4,y:hz*(0.15+rng()*0.35),w:rng.int(40,90),h:rng.int(6,12),sp:2+rng()*4});
 const stars=[];for(let i=0;i<40;i++)stars.push({x:rng()*W,y:rng()*hz*0.8,b:rng()});
 const lanternGlow=pieces.filter(p=>p==='lantern').length;
 return {B,far,mid,near,sky,fg,clouds,stars,key,pieces,rain:!B.snow&&!B.ash&&rng()<0.18,petals:B.petals?[...Array(26)].map(()=>({x:Math.random(),y:Math.random(),z:rndf(0.4,1.4),r:Math.random()*6})):null,rainDrops:[]};}
function drawDuelWorld(){const Ly=D.layers,B=Ly.B,l=L();const sky=Ly.sky;
 // dithered sky bands
 const bands=6;for(let i=0;i<bands;i++){const t=i/(bands-1);G.fillStyle=mixc(sky.top,sky.bot,t);const y0=Math.round(l.hz*i/bands),y1=Math.round(l.hz*(i+1)/bands);G.fillRect(0,y0,W,y1-y0);if(i>0){G.fillStyle=mixc(sky.top,sky.bot,(i-1)/(bands-1));for(let x=(i%2)*2;x<W;x+=4)G.fillRect(x,y0,2,1);}}
 if(sky.n>0.3){for(const st of Ly.stars){G.globalAlpha=sky.n*(0.4+0.6*Math.abs(Math.sin(T*2+st.b*7)));G.fillStyle='#ffffff';G.fillRect(Math.round(st.x),Math.round(st.y),1,1);}G.globalAlpha=1;}
 // sun / moon
 const sunY=l.hz*0.45;G.fillStyle=B.embers?'#ff5a3a':sky.n>0.5?'#f6f0d8':'#fff4d8';G.globalAlpha=0.9;G.beginPath();G.arc(W*0.78,sunY,sky.n>0.5?8:10,0,TAU);G.fill();if(sky.n>0.5){G.fillStyle=mixc(sky.top,sky.bot,0.2);G.beginPath();G.arc(W*0.78+4,sunY-2,7,0,TAU);G.fill();}G.globalAlpha=1;
 // clouds
 for(const c of Ly.clouds){const x=((c.x+T*c.sp)%(W*1.4))-W*0.2;G.fillStyle=sky.n>0.5?'rgba(40,50,90,.6)':sky.dusk>0.3?'rgba(255,200,170,.55)':'rgba(255,255,255,.55)';G.fillRect(Math.round(x),Math.round(c.y),c.w,c.h);G.fillRect(Math.round(x+c.w*0.2),Math.round(c.y-c.h*0.6),c.w*0.5,c.h*0.7);G.fillRect(Math.round(x-c.w*0.1),Math.round(c.y+c.h*0.5),c.w*0.7,c.h*0.5);}
 G.drawImage(Ly.far,Math.round(-W*0.25-D.camX*0.2),0);
 // mist band
 G.fillStyle='rgba(235,240,250,.16)';for(let x=0;x<W;x+=4){const h=6+Math.sin(x*0.05+T*0.5)*3+fbm(x*0.03+T*0.1,0,5,2)*8;G.fillRect(x,Math.round(l.hz-4-h*0.5),4,Math.round(h));}
 G.drawImage(Ly.mid,Math.round(-W*0.4-D.camX*0.5),0);G.drawImage(Ly.near,Math.round(-W*0.5-D.camX),0);
 if(Ly.petals){Ly.petals.forEach(p=>{p.x+=0.0006*p.z;p.y+=0.0009*p.z;if(p.x>1.05)p.x=-0.05;if(p.y>1.05)p.y=-0.05;G.fillStyle=B.petals===1?'#f6c8d4':'#d2472f';G.fillRect(Math.round(p.x*W),Math.round(p.y*H),2,2);});}
 if(B.ash||B.snow){for(let i=0;i<18;i++){const x=(i*97+T*(B.snow?12:20))%W,y=(i*53+T*(B.snow?18:10))%H;G.fillStyle=B.snow?'#fff':'rgba(220,210,200,.5)';G.fillRect(Math.round(x),Math.round(y),1,1);}}
 if(B.embers){for(let i=0;i<14;i++){const x=(i*71+Math.sin(T+i)*20)%W,y=H-((i*37+T*22)%H);G.fillStyle=i%2?'#ff7a3a':'#ffc04a';G.fillRect(Math.round(x),Math.round(y),1,1);}}
 if(Ly.rain){G.fillStyle='rgba(200,220,255,.5)';for(let i=0;i<40;i++){const x=(i*53+T*40)%W,y=(i*97+T*260)%H;G.fillRect(Math.round(x),Math.round(y),1,4);}G.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<8;i++){const x=(i*131+Math.floor(T*6)*37)%W;G.fillRect(x,l.gy+((i*17)%12),3,1);}}
 if(sky.n>0.4){[[W*0.08,0],[W*0.92-6,1]].forEach(([px,i])=>{if(Ly.pieces[i]!=='lantern')return;const x=px-D.camX;G.globalCompositeOperation='lighter';const fl=0.8+0.2*Math.sin(T*7+i);G.globalAlpha=0.16*sky.n*fl;G.fillStyle='#ff9a3a';G.beginPath();G.arc(x,l.gy-36,30,0,TAU);G.fill();G.globalAlpha=0.26*sky.n*fl;G.fillStyle='#ffd27a';G.beginPath();G.arc(x,l.gy-36,14,0,TAU);G.fill();G.globalAlpha=1;G.globalCompositeOperation='source-over';});}}
function drawForeground(){const Ly=D.layers,l=L();const sky=Ly.sky;for(const b of Ly.fg){const sw=Math.sin(T*1.6+b.ph)*2;const x=Math.round(b.x-D.camX*1.3)%(W+10);const y=l.gy+2+(b.ph*3|0)%8;
  if(b.kind==='grass'){G.fillStyle=mixc('#3f6a33','#06080f',sky.n*0.6);G.fillRect(x,y-b.h,2,b.h);G.fillRect(x+Math.round(sw),y-b.h-2,2,3);}
  else if(b.kind==='bamboo'){G.fillStyle=mixc('#4d7a2f','#06080f',sky.n*0.6);G.fillRect(x,y-b.h-6,2,b.h+6);}
  else if(b.kind==='snow'){G.fillStyle='#eef2f6';G.fillRect(x-2,y-2,6,2);}
  else{G.fillStyle=mixc('#5f6165','#06080f',sky.n*0.6);G.fillRect(x-1,y-2,4,2);}}}
function drawDecals(){for(const d of D.decals){G.fillStyle=d.col;G.globalAlpha=d.a;G.beginPath();G.ellipse(d.x,d.y,d.rx,d.ry,0,0,TAU);G.fill();}G.globalAlpha=1;}
let FIGC=null,FIGQ=null,OUTC=null,OUTQ=null;
function figureOutlined(x,y,f,s,ps,C){ // draw into an offscreen sprite, add a 1px ink outline, blit
 const SZ=160;if(!FIGC){[FIGC,FIGQ]=mkCanvas(SZ,SZ);[OUTC,OUTQ]=mkCanvas(SZ,SZ);}
 const ox=SZ/2,oy=SZ-20;FIGQ.clearRect(0,0,SZ,SZ);const g0=G;G=FIGQ;try{figure(ox,oy,f,s,ps,C);}finally{G=g0;}
 OUTQ.clearRect(0,0,SZ,SZ);OUTQ.globalCompositeOperation='source-over';for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])OUTQ.drawImage(FIGC,dx,dy);OUTQ.globalCompositeOperation='source-in';OUTQ.fillStyle='#17120f';OUTQ.fillRect(0,0,SZ,SZ);
 const bx=Math.round(x-ox),by=Math.round(y-oy);G.drawImage(OUTC,bx,by);G.drawImage(FIGC,bx,by);}
function drawFighters(){const l=L(),sc=l.fs;const pp=playerPose(),ep=enemyPose();const es=sc*(E.def.size||1);
 G.fillStyle=PAL.shadow;G.fillRect(Math.round(l.px-14+((pp.ox||0)+(P.ox||0))*sc),Math.round(l.gy-2),28,3);G.fillRect(Math.round(l.ex-14-(ep.ox||0)*es),Math.round(l.gy-2),28,3);
 const pc=playerColors(true),ecl=enemyColors(true);if(DFX.glowT>0){pc.steel='#ffffff';ecl.steel='#ffffff';}
 figureOutlined(l.ex,l.gy,-1,es,ep,ecl);figureOutlined(l.px+(P.ox||0)*sc,l.gy,P.face||1,sc,pp,pc);
 if(D.superFx>0){G.globalAlpha=D.superFx*0.6;G.fillStyle='#fff';figure(l.px+8*(1-D.superFx),l.gy,1,sc,pp,Object.assign(playerColors(true),{body:'#fff',back:'#fff',skin:'#fff',noEye:1}));G.globalAlpha=1;}}
function drawParts(){for(const p of D.parts){G.globalAlpha=1-p.t/p.l;G.fillStyle=p.col;G.fillRect(Math.round(p.x),Math.round(p.y),p.fire?2:1,p.fire?2:1);}G.globalAlpha=1;}
function updateBlood(dt){const l=L();for(let i=D.blood.length-1;i>=0;i--){const b=D.blood[i];b.t+=dt;b.x+=b.vx;b.y+=b.vy;b.vy+=0.12;if(b.y>=l.gy-1){ // splat
  D.decals.push({x:b.x,y:l.gy-1+Math.random()*4,rx:1+Math.random()*2.5,ry:0.8+Math.random(),col:'#8e1119',a:0.85});if(D.decals.length>260)D.decals.shift();D.blood.splice(i,1);continue;}
  if(b.t>b.l)D.blood.splice(i,1);}}
function drawBlood(){G.fillStyle='#c41b26';for(const b of D.blood){G.fillRect(Math.round(b.x),Math.round(b.y),b.s,b.s);}}
function updateGibs(dt){const l=L();for(const g of D.gibs){g.t+=dt;if(g.rest)continue;g.x+=g.vx;g.y+=g.vy;g.vy+=0.14;g.rot+=g.vr;if(g.y+g.h>=l.gy+2){g.y=l.gy+2-g.h;g.vy*=-0.35;g.vx*=0.6;g.vr*=0.5;if(Math.abs(g.vy)<0.3){g.rest=true;g.vy=0;}
  if(S.set.gore&&g.bled<3){g.bled++;D.decals.push({x:g.x+g.w/2,y:l.gy+1+Math.random()*3,rx:2+Math.random()*4,ry:1+Math.random(),col:'#8e1119',a:0.9});}}
  if(g.bleed&&S.set.gore&&Math.random()<0.5)D.blood.push({x:g.x+g.w/2,y:g.y+g.h/2,vx:(Math.random()-0.5)*0.6,vy:-0.3,t:0,l:1,s:1});}}
function drawGibs(){for(const g of D.gibs){G.save();G.translate(Math.round(g.x+g.w/2),Math.round(g.y+g.h/2));G.rotate(Math.round(g.rot/0.5)*0.5);G.fillStyle=g.col;G.fillRect(-Math.round(g.w/2),-Math.round(g.h/2),g.w,g.h);if(g.col2){G.fillStyle=g.col2;G.fillRect(-Math.round(g.w/2),-Math.round(g.h/2),g.w,Math.max(1,Math.round(g.h/3)));}if(g.face){G.fillStyle='#1a1416';G.fillRect(-1,-1,2,1);}G.restore();}}
/* ---------- after the kill: loot ---------- */
function finishKill(){if(D.phase==='loot')return;D.phase='loot';D.t=0;D.zoomTarget=1.2;inputMode='ui';MUSIC2.setDuck(1);D.vignette=0;P.forcePose=null;P.ox=0;P.face=1;P.drawn=false;DFX.ghosts.length=0;
 const n=D.npc,d=E.def;const rng=RNG(hashStr((n?n.id:'x')+'loot'+S.kills));const items=[];const tier=n?n.tier:3;const lv=d.lvl||1;
 const xp=Math.round((d.boss?220:30+tier*22)*(1+lv*0.12));const coins=Math.round((d.boss?180:12+tier*14)*(1+lv*0.1)*rndf(0.8,1.3)*gmul('coin')*DIFF().loot);
 if(d.drop&&UNIQUES[d.drop]&&!S.flags['uniq_'+d.drop]){items.push(UNIQUES[d.drop]());S.flags['uniq_'+d.drop]=1;}
 if(n&&n.trade==='shop'){const st=npcStock(n);const picks=st.filter(i=>i.type!=='consumable').sort((a,b)=>RARITY_ORDER.indexOf(b.rar)-RARITY_ORDER.indexOf(a.rar)).slice(0,ST.steal?3:2);items.push(...picks);n.stock=null;}
 else{const bias=Math.min(0.95,(d.boss?0.7:Math.min(0.6,tier*0.1))*DIFF().loot);const r1=d.boss?(rng()<0.5?'legendary':'epic'):rollRarity(rng,bias);items.push(genWeapon(rng,{kind:d.weapon,rar:r1,lvl:lv}));
  if(rng()<(d.boss?1:0.28+tier*0.05))items.push(genGear(rng,rng.pick(['helm','body','charm']),{bias:d.boss?0.7:bias,lvl:lv}));
  if(rng()<0.35)items.push(genConsumable(rng.pick(['onigiri','onigiri','mochi','sake','tea'])));}
 items.forEach(addItem);S.coins+=coins;addXp(xp);S.tot.exec++;
 D.loot={items,coins,xp,taken:false};if(n&&!(D.opts&&D.opts.noKill))killNpc(n,0);save();}
function lootTap(p){const r=D.lootR;if(!r)return false;if(p.esc||(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)){hap('tap');pluck(392,0.06,0.3);endDuel('win');return true;}
 if(D.lootItemR){for(const it of D.lootItemR){if(p.x>=it.x&&p.x<=it.x+it.w&&p.y>=it.y&&p.y<=it.y+it.h){if(it.item.type!=='consumable'){equip(it.item);hap('equip');toast('Equipped '+it.item.name,RARITY[it.item.rar].col);}return true;}}}
 return false;}
/* ============================================================================
   DRAW — world + fighters on G (with execution zoom), HUD on X.
   ========================================================================== */
function duelDraw(){const l=L();
 G.save();if(D.shake>0&&!window.LITE){G.translate(Math.round((Math.random()-0.5)*D.shake),Math.round((Math.random()-0.5)*D.shake));}
 if(D.zoom>1.01){G.translate(Math.round(D.zx),Math.round(D.zy));G.scale(D.zoom,D.zoom);G.translate(-Math.round(D.zx),-Math.round(D.zy));}
 drawDuelWorld();drawDecals();dfxDrawBack();drawGibs();drawFighters();drawBlood();drawParts();dfxDrawFront();drawForeground();
 G.restore();
 if(D.vignette){const g=G.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.8);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.7)');G.fillStyle=g;G.fillRect(0,0,W,H);}
 if(D.flash>0){G.fillStyle='rgba(255,255,255,'+D.flash*0.6+')';G.fillRect(0,0,W,H);}
 // dim at intro / death
 if(D.phase==='intro'){G.fillStyle='rgba(5,2,3,'+(0.4*(1-Math.min(1,D.t/2)))+')';G.fillRect(0,0,W,H);}
 if(D.phase==='death'){G.fillStyle='rgba(0,0,0,'+Math.min(0.8,D.t*0.5)+')';G.fillRect(0,0,W,H);}
 if(D.phase==='exec'||D.phase==='loot'){G.fillStyle='#0a0708';const b=Math.min(H*0.1,D.t*60);G.fillRect(0,0,W,b);G.fillRect(0,H-b,W,b);}
 // HUD on crisp canvas
 X.clearRect(0,0,W,H);
 if(D.phase==='intro')drawIntro();else if(D.phase==='fight'||D.phase==='victory')drawHUD();else if(D.phase==='loot')drawLoot();else if(D.phase==='death')drawDeath();
 if(D.phase==='fight'||D.phase==='victory'||D.phase==='exec'){X.save();FX.applyZoom(X);FX.draw(X,1,font);X.restore();}
 drawTrail();}
function drawTrail(){if(D.trail.length<2)return;X.save();X.lineCap='round';X.lineJoin='round';for(let i=1;i<D.trail.length;i++){const a=1-D.trail[i].t/0.25;if(a<=0)continue;X.strokeStyle='rgba(255,248,235,'+a+')';X.lineWidth=(1+i/D.trail.length*4)*a;X.beginPath();X.moveTo(D.trail[i-1].x,D.trail[i-1].y);X.lineTo(D.trail[i].x,D.trail[i].y);X.stroke();}X.restore();}
function bar(x,y,w,h,v,col,right,ghost){X.fillStyle='rgba(0,0,0,.62)';X.fillRect(x,y,w,h);
 if(ghost!=null&&ghost>v){X.fillStyle='rgba(255,120,100,.6)';const gw=w*ghost;X.fillRect(right?x+w-gw:x,y,gw,h);}
 X.fillStyle=col;const fw=w*clamp(v,0,1);X.fillRect(right?x+w-fw:x,y,fw,h);X.fillStyle='rgba(255,255,255,.2)';X.fillRect(right?x+w-fw:x,y,fw,1);X.strokeStyle='rgba(243,230,208,.35)';X.lineWidth=1;X.strokeRect(x+0.5,y+0.5,w-1,h-1);}
function circleBtn(c,fill,ready,icon,label,pressed){X.save();X.globalAlpha=ready?0.95:0.5;X.beginPath();X.arc(c.x,c.y,c.r*(pressed?0.92:1),0,TAU);X.fillStyle=fill;X.fill();X.lineWidth=1.5;X.strokeStyle=ready?'rgba(243,230,208,.9)':'rgba(243,230,208,.35)';X.stroke();
 X.fillStyle='#f3e6d0';X.font=font(c.r*0.78,1);X.textAlign='center';X.textBaseline='middle';X.fillText(icon,c.x,c.y+1);X.textBaseline='alphabetic';
 if(label){X.font=font(Math.max(6,c.r*0.3),1);X.fillText(label,c.x,c.y+c.r+8);}X.restore();}
function medallion(def,mood,x,y,r,flip){X.save();X.beginPath();X.arc(x,y,r,0,TAU);X.fillStyle='rgba(8,4,4,.85)';X.fill();X.clip();try{PIX.draw(X,def,mood,x-r,y-r,r*2,flip);}catch(e){}X.restore();X.strokeStyle='#b8935a';X.lineWidth=1.5;X.beginPath();X.arc(x,y,r,0,TAU);X.stroke();}
function drawHUD(){const l=L(),m=l.m;const pdef=CHARS.kage,edef=CHARS[E.def.char]||CHARS.ronin;const mr=Math.max(10,H*0.055);
 // bars
 const bw=l.barW,bh=l.bh,by=m+mr-bh/2;
 medallion(pdef,P.hurt>0?'pain':'calm',m+mr,m+mr,mr,false);bar(m+mr*2+4,by,bw,bh,P.hp/P.max,P.hp<P.max*0.25?'#ff5a3d':'#e8dcc8',false,P.ghost/P.max);
 medallion(edef,E.hurt>0?'pain':E.p2?'angry':'grim',W-m-mr,m+mr,mr,true);bar(W-m-mr*2-4-bw,by,bw,bh,E.hp/E.max,E.p2?'#ff3a3a':'#b8242a',true,E.ghost/E.max);
 X.textAlign='left';X.fillStyle='#f3e6d0';X.font=font(7,1);X.fillText('影 KAGE · Lv '+S.level,m+mr*2+4,by+bh+9);
 X.textAlign='right';X.font=font(7,1);X.fillText(E.def.jp+' '+E.def.name,W-m-mr*2-4,by+bh+9);X.font=font(6);X.fillStyle='rgba(243,230,208,.7)';X.fillText((E.def.boss?'BOSS · ':'')+'Lv '+(E.def.lvl||1)+' · '+WKIND[E.def.weapon].name,W-m-mr*2-4,by+bh+17);
 // block charges
 X.textAlign='left';for(let i=0;i<P.blockMax;i++){X.fillStyle=i<P.blockDur?'#9fd0ff':'rgba(159,208,255,.25)';X.fillRect(m+mr*2+4+i*9,by+bh+12,7,3);}
 // gauges
 const magic=l.magic,sup=l.super;circleBtn(magic,P.magic>=100?'rgba(80,160,220,.9)':'rgba(30,50,80,.8)',P.magic>=100,'狐',null,false);X.strokeStyle='#8fd8ff';X.lineWidth=2;X.beginPath();X.arc(magic.x,magic.y,magic.r+3,-Math.PI/2,-Math.PI/2+TAU*P.magic/100);X.stroke();
 circleBtn(sup,P.superM>=100?'rgba(220,60,60,.95)':'rgba(70,20,20,.8)',P.superM>=100,'奥',null,false);X.strokeStyle='#ffb0a0';X.lineWidth=2;X.beginPath();X.arc(sup.x,sup.y,sup.r+3,-Math.PI/2,-Math.PI/2+TAU*P.superM/100);X.stroke();
 if(D.phase==='fight'){circleBtn(l.dodgeL,'rgba(20,16,20,.8)',P.dodge<=0,'退','BACK',IN.hold.dodgeL);circleBtn(l.dodgeR,'rgba(20,16,20,.8)',P.dodge<=0,'跳','JUMP',IN.hold.dodgeR);circleBtn(l.block,P.blocking?'rgba(159,208,255,.9)':'rgba(20,16,20,.8)',P.blockDur>0,'受','HOLD · BLOCK',P.blocking);
  X.fillStyle='rgba(243,230,208,.7)';X.font=font(7,1);X.textAlign='center';X.fillText('II',l.pause.x,l.pause.y+3);X.strokeStyle='rgba(243,230,208,.5)';X.lineWidth=1;X.beginPath();X.arc(l.pause.x,l.pause.y,l.pause.r,0,TAU);X.stroke();}
 // incoming attack: the long arrow between the fighters + timing ring (as in Kage no Chikai)
 if(E.state==='windup'&&E.atk){const a=E.atk,rem=windRemaining(),win=0.6+P.w.win+DIFF().win,pw=0.2+(P.w.win+DIFF().win)*0.5,wind=E.windT/E.wind;const ready=rem<=win&&!(a.feint&&!E.feinted);
  const cxp=(l.px+l.ex)/2+6,cyp=l.gy-H*0.33;
  if(a.unblock){X.save();X.strokeStyle='rgba(255,60,40,'+(0.4+0.5*wind)+')';X.lineWidth=3;X.beginPath();X.arc(cxp,cyp,Math.max(14,46-20*wind),0,TAU);X.stroke();
   X.textAlign='center';X.fillStyle='#ff5a3d';X.font=font(20,1);X.lineWidth=3;X.strokeStyle='rgba(0,0,0,.7)';X.strokeText(a.dg==='jump'?'跳':'退',cxp,cyp+7);X.fillText(a.dg==='jump'?'跳':'退',cxp,cyp+7);X.font=font(8,1);X.strokeText(a.dg==='jump'?'JUMP ▶':'◀ STEP BACK',cxp,cyp+20);X.fillText(a.dg==='jump'?'JUMP ▶':'◀ STEP BACK',cxp,cyp+20);X.restore();}
  else{const d=DV[E.dir],len=44;const feintPending=a.feint&&!E.feinted;
   if(S.set.ring&&DIFF().ring&&!feintPending)FX.timingRing(X,cxp,cyp,rem,win,pw,0.66,'#ffd27a','#ffffff');
   X.save();X.translate(cxp,cyp);X.rotate(Math.atan2(d[1],d[0]));X.globalAlpha=ready?0.95:0.45;X.strokeStyle=ready?(rem<=pw?'#ffd27a':'#fff8ec'):'#d8b9a0';X.lineWidth=ready?5:3;X.lineCap='round';X.shadowColor='#ff7a50';X.shadowBlur=ready?14:3;
   X.beginPath();X.moveTo(-len,0);X.lineTo(len,0);X.moveTo(len-13,-10);X.lineTo(len,0);X.lineTo(len-13,10);X.stroke();X.restore();
   if(E.miss>0){const md=DV[E.missDir];X.save();X.translate(cxp,cyp);X.rotate(Math.atan2(md[1],md[0]));X.globalAlpha=E.miss*1.4;X.strokeStyle='#ff5a3d';X.lineWidth=3;X.lineCap='round';X.beginPath();X.moveTo(-len*0.6,0);X.lineTo(len*0.6,0);X.moveTo(len*0.6-9,-7);X.lineTo(len*0.6,0);X.lineTo(len*0.6-9,7);X.stroke();X.restore();
    X.save();X.globalAlpha=E.miss*1.4;X.fillStyle='#ff5a3d';X.font=font(7,1);X.textAlign='center';X.fillText('✕ wrong way · follow the arrow',cxp,cyp+48);X.restore();}}
  X.fillStyle='rgba(255,240,225,.85)';X.font=font(7);X.textAlign='center';X.fillText(a.jp+' · '+a.name,l.ex,Math.max(44,l.gy-H*0.36));}
 // messages
 D.texts.forEach((t,i)=>{if(t.dmg){const k=t.t/0.9;X.globalAlpha=1-k;X.font=font(10*t.size+6,1);X.textAlign='center';X.fillStyle=t.col;const x=(t.px?l.px:l.ex)+t.x,y=l.gy-60-k*30;X.lineWidth=3;X.strokeStyle='rgba(0,0,0,.7)';X.strokeText(t.s,x,y);X.fillText(t.s,x,y);X.globalAlpha=1;return;}
  const k=t.t/1.4,a=k<0.1?k/0.1:k>0.75?(1-k)/0.25:1;X.globalAlpha=a;X.textAlign='center';X.fillStyle=t.col;X.font=font(9*t.size+4,1);X.lineWidth=3;X.strokeStyle='rgba(0,0,0,.75)';const y=H*0.56+i*14;X.strokeText(t.s,W/2,y);X.fillText(t.s,W/2,y);if(t.jp){X.font=font(8*t.size+3,1);X.strokeText(t.jp,W/2,y-11*t.size-4);X.fillText(t.jp,W/2,y-11*t.size-4);}X.globalAlpha=1;});
 // tutorial hints for the first duels
 if(S.tot.wins<2&&D.phase==='fight'){const hints=['SWIPE in the arrow’s direction while the foe winds up · gold ring = PERFECT PARRY','HOLD 受 to block · unblockable attacks are RED: tap 退 (step back) or 跳 (jump)','After a parry the foe is OPEN — swipe to strike · 3 parries in a row BREAK him','狐 Foxfire and 奥 Kage-giri charge as you fight · tap them when they glow'];const hi=hints[Math.floor(D.stats.t/5)%hints.length];
  X.font=font(6,1);X.textAlign='center';X.fillStyle='rgba(243,230,208,.85)';X.lineWidth=3;X.strokeStyle='rgba(0,0,0,.7)';X.strokeText(hi,W/2,H-6);X.fillText(hi,W/2,H-6);}
 // streak
 if(FX.streak>=2&&FX.streakT<3){X.fillStyle='#ffd27a';X.font=font(8,1);X.textAlign='left';X.fillText('連 STREAK ×'+FX.streak,m+mr*2+4,by+bh+28);}
}
function drawIntro(){const l=L();const k=Math.min(1,D.t/0.5);const e=easeOut(k);X.fillStyle='#0a0708';X.fillRect(0,0,W,H*0.12*e);X.fillRect(0,H-H*0.12*e,W,H*0.12*e);
 const ps=Math.max(32,Math.round(H*0.3/32)*32);const edef=CHARS[E.def.char]||CHARS.ronin;
 X.save();X.globalAlpha=e;try{PIX.draw(X,CHARS.kage,'grim',W*0.08-(1-e)*40,H*0.3,ps,false);PIX.draw(X,edef,'angry',W*0.92-ps+(1-e)*40,H*0.3,ps,true);}catch(err){}
 X.textAlign='center';X.fillStyle='#f3e6d0';X.font=font(28,1);X.lineWidth=4;X.strokeStyle='rgba(0,0,0,.8)';X.strokeText('対',W/2,H*0.5);X.fillText('対',W/2,H*0.5);X.font=font(9,1);X.fillText('VS',W/2,H*0.5+14);
 X.textAlign='left';X.font=font(10,1);X.fillText('影 KAGE',W*0.08,H*0.3+ps+14);X.textAlign='right';X.fillText(E.def.jp+'  '+E.def.name,W*0.92,H*0.3+ps+14);X.font=font(7);X.fillStyle='rgba(243,230,208,.75)';X.fillText((E.def.boss?'BOSS · ':'')+'Level '+(E.def.lvl||1)+' · '+WKIND[E.def.weapon].jp+' '+WKIND[E.def.weapon].name,W*0.92,H*0.3+ps+24);
 X.restore();X.fillStyle='rgba(243,230,208,.6)';X.font=font(7);X.textAlign='center';X.fillText('swipe to parry & strike · hold 受 to block · 退 / 跳 against unblockables',W/2,H-6);}
function drawLoot(){const lo=D.loot;if(!lo)return;const k=Math.min(1,D.t/0.4);const pw=Math.min(W*0.8,300),ph=Math.min(H*0.8,56+lo.items.length*26+40);const x=W/2-pw/2,y=H/2-ph/2+(1-k)*20;
 X.globalAlpha=k;panel9(X,x,y,pw,ph,'dark');X.textAlign='center';X.fillStyle='#f3e6d0';X.font=font(14,1);X.fillText('勝 · VICTORY',W/2,y+18);X.font=font(7);X.fillStyle='rgba(243,230,208,.75)';X.fillText(E.def.name+' is dead.  +'+lo.xp+' XP   +'+lo.coins+' mon   parries '+D.stats.parries+' (perfect '+D.stats.perfect+')  best streak '+D.stats.streak,W/2,y+30);
 D.lootItemR=[];let yy=y+42;lo.items.forEach(it=>{const ic=itemIcon(it);X.drawImage(ic,x+14,yy-2,16,16);X.textAlign='left';X.fillStyle=RARITY[it.rar].col;X.font=font(9,1);X.fillText(it.name,x+36,yy+8);X.font=font(6);X.fillStyle='rgba(243,230,208,.7)';X.fillText(RARITY[it.rar].n+' · '+(it.type==='weapon'?WKIND[it.kind].name+' · dmg ×'+it.dmg:it.type==='consumable'?it.desc:it.type)+(it.jp?' · '+it.jp:''),x+36,yy+17);
  if(it.type!=='consumable'){const eq=Object.values(S.eq).includes(it.uid);X.textAlign='right';X.fillStyle=eq?'#9fe3a0':'#ffd27a';X.font=font(7,1);X.fillText(eq?'EQUIPPED':'TAP TO EQUIP',x+pw-12,yy+10);D.lootItemR.push({x:x+8,y:yy-4,w:pw-16,h:24,item:it});}yy+=26;});
 const bw=120,bh=20,bx=W/2-bw/2,byy=y+ph-bh-8;X.fillStyle='rgba(184,36,42,.9)';X.fillRect(bx,byy,bw,bh);X.fillStyle='#f3e6d0';X.font=font(9,1);X.textAlign='center';X.fillText('TAKE ALL · 続く',W/2,byy+14);D.lootR={x:bx,y:byy,w:bw,h:bh};X.globalAlpha=1;}
function drawDeath(){X.fillStyle='rgba(0,0,0,'+Math.min(0.6,D.t*0.4)+')';X.fillRect(0,0,W,H);X.textAlign='center';X.fillStyle='#f3e6d0';X.font=font(40,1);X.globalAlpha=Math.min(1,D.t/1.2);X.fillText('死',W/2,H*0.42);X.font=font(11,1);X.fillText('YOU FALL',W/2,H*0.42+18);
 X.font=font(7);X.fillStyle='rgba(243,230,208,.7)';X.fillText(E.def.name+' walks away. The vow waits.',W/2,H*0.42+32);if(D.t>1.6){X.globalAlpha=0.5+0.5*Math.sin(T*5);X.font=font(8,1);X.fillText(D.retry?'tap · try again':'tap · wake at the last Wind Shrine',W/2,H*0.8);}X.globalAlpha=1;}
