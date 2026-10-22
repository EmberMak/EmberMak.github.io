'use strict';
/* ============================================================================
   DOM overlays over the canvas: ARMORY (weapons by category, attire by slot,
   charms, stat comparison, live preview on the canvas) and SETTINGS.
   The duel input itself is untouched.
   ========================================================================== */
initContent2();
let armoryOpen=false,armTab='weapons',armCat='katana',armSlot='hat',settingsOpen=false;
const $=id=>document.getElementById(id);
function openArmory(){armoryOpen=true;$('arm').style.display='flex';renderArmory();}
function closeArmory(){armoryOpen=false;$('arm').style.display='none';}
function openSettings(){settingsOpen=true;$('set').style.display='flex';renderSettings();}
function closeSettings(){settingsOpen=false;$('set').style.display='none';}
function closeOverlays(){let c=false;if(armoryOpen){closeArmory();c=true;}if(settingsOpen){closeSettings();c=true;}return c;}
const fmt=(v,d=2)=>(Math.round(v*100)/100).toFixed(d);
const sgn=(v,d=2,suf='')=>(v>0?'+':'')+fmt(v,d)+suf;
function statLine(w){const o=[];o.push('DMG '+fmt(w.dmg));o.push('SPD '+fmt(0.16/w.cd,1));if(w.win)o.push('PARRY +'+fmt(w.win)+'s');if(w.reach)o.push('OPEN +'+fmt(w.reach,1)+'s');if(w.wrap)o.push('WRAP '+Math.round(w.wrap*100)+'%');if(w.gb)o.push('BREAK '+Math.round(w.gb*100)+'%');
 if(w.crit&&w.crit!==1)o.push('CRIT x'+fmt(w.crit,1));if(w.counter&&w.counter!==1)o.push('COUNTER x'+fmt(w.counter));if(w.ls)o.push('HEAL '+w.ls);if(w.sm&&w.sm!==1)o.push('OUGI x'+fmt(w.sm,1));if(w.fx&&w.fx!==1)o.push('FOX x'+fmt(w.fx,1));if(w.mag&&w.mag!==1)o.push('FOXGAIN x'+fmt(w.mag,1));if(w.mon&&w.mon!==1)o.push('MON x'+fmt(w.mon));if(w.self)o.push('BLOOD -'+w.self);return o.join(' · ');}
function tier(w){return w.story?'story':w.unlock?'rare':(w.price||0)>=1500?'rare':(w.price||0)>=800?'fine':'plain';}
function renderArmory(){const o=$('armIn');const eqW=V2WEAPONS[SV.equip]||V2WEAPONS.katana;
 const hp=playerMaxHp(),bm=3+gsum('blk'),win=0.6+(eqW.win||0)+gsum('win'),dodge=0.55+gsum('dodge');
 let h=`<div class="hd"><b>武器庫 ARMORY</b><span class="mon">${SV.mon} <i>文</i></span><span class="st">HP ${hp} · 受 ${bm} · parry ${fmt(win)}s · dodge ${fmt(dodge)}s · Lv ${lvl()}</span><button id="armX">閉 BACK</button></div>`;
 h+=`<div class="tabs">${[['weapons','武器 WEAPONS'],['attire','装束 ATTIRE']].map(([k,t])=>`<button class="tab${armTab===k?' on':''}" data-tab="${k}">${t}</button>`).join('')}</div>`;
 if(armTab==='weapons'){
  const cats=Object.keys(WCAT);h+=`<div class="sub">${cats.map(c=>{const n=V2ORDER.filter(k=>V2WEAPONS[k].cat===c).length,own=V2ORDER.filter(k=>V2WEAPONS[k].cat===c&&SV.weapons.includes(k)).length;return `<button class="sub${armCat===c?' on':''}" data-cat="${c}">${WCAT[c].jp} ${WCAT[c].name}<small>${own}/${n}</small></button>`;}).join('')}</div><div class="grid">`;
  V2ORDER.filter(k=>V2WEAPONS[k].cat===armCat).forEach(k=>{const w=V2WEAPONS[k],own=SV.weapons.includes(k),eq=SV.equip===k,buy=weaponBuyable(k),can=own||buy||weaponUnlocked(k);
   let how=own?(eq?'<b class="eq">EQUIPPED</b>':'tap to equip'):buy?(SV.mon>=w.price?`<b class="buy">buy ${w.price} 文</b>`:`<span class="no">${w.price} 文 — not enough</span>`):w.unlock?(unlockMet(w.unlock)?'tap to claim':unlockHow(w.unlock,w.price)):w.price>0?`<span class="no">${w.price} 文 · clear chapter ${(w.req||0)+1} to buy</span>`:'story reward';
   const d=eq?'':`<div class="cmp">${sgn(w.dmg-eqW.dmg)} dmg · ${sgn(0.16/w.cd-0.16/eqW.cd,1)} spd</div>`;
   h+=`<div class="it ${tier(w)}${eq?' on':''}${can?'':' lk'}" data-w="${k}"><div class="nm"><b>${w.jp}</b> ${w.name}</div><div class="sl">${statLine(w)}</div><i>${w.desc}</i>${d}<div class="how">${how}</div></div>`;});
  h+='</div>';}
 else{
  h+=`<div class="sub">${GEAR_SLOTS.map(s=>`<button class="sub${armSlot===s?' on':''}" data-slot="${s}">${SLOT_JP[s]} ${s.toUpperCase()}<small>${Object.keys(GEAR[s]).filter(k=>gearUnlocked(s,k)).length}/${Object.keys(GEAR[s]).length}</small></button>`).join('')}</div><div class="grid">`;
  const cur=GEAR[armSlot][SV.gear[armSlot]]||{};
  for(const k in GEAR[armSlot]){const it=GEAR[armSlot][k],own=gearUnlocked(armSlot,k),on=SV.gear[armSlot]===k,buy=it.unlock==='shop'&&!own;
   const how=own?(on?'<b class="eq">WORN</b>':'tap to wear'):buy?((it.req!=null&&!chapCleared(it.req))?`<span class="no">${it.price} 文 · clear chapter ${it.req+1} to buy</span>`:SV.mon>=it.price?`<b class="buy">buy ${it.price} 文</b>`:`<span class="no">${it.price} 文 — not enough</span>`):unlockHow(it.unlock,it.price);
   const dh=(it.hp||0)-(cur.hp||0);const d=on?'':`<div class="cmp">${dh?sgn(dh,0,' HP'):''}</div>`;
   h+=`<div class="it ${it.unlock==='free'?'plain':it.price>=1500?'rare':it.unlock==='shop'?'fine':'story'}${on?' on':''}${own||buy?'':' lk'}" data-g="${armSlot}:${k}"><div class="nm"><b>${it.jp}</b> ${it.name}</div><i>${it.desc}</i>${d}<div class="how">${how}</div></div>`;}
  h+='</div>';}
 o.innerHTML=h;
 o.querySelector('#armX').onclick=()=>{hap('tap');closeArmory();};
 o.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{armTab=b.dataset.tab;hap('tick');renderArmory();});
 o.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{armCat=b.dataset.cat;hap('tick');renderArmory();});
 o.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{armSlot=b.dataset.slot;hap('tick');renderArmory();});
 o.querySelectorAll('[data-w]').forEach(d=>d.onclick=()=>{const k=d.dataset.w,w=V2WEAPONS[k];
  if(!SV.weapons.includes(k)){if(weaponBuyable(k)&&SV.mon>=w.price){SV.mon-=w.price;SV.weapons.push(k);hap('buy');pluck(392,0.1);}else if(w.unlock&&unlockMet(w.unlock)){SV.weapons.push(k);hap('unlock');}else{hap('tick');return;}}
  SV.equip=k;save();try{steel(0.2)}catch(e){}hap('equip');renderArmory();});
 o.querySelectorAll('[data-g]').forEach(d=>d.onclick=()=>{const [sl,k]=d.dataset.g.split(':'),it=GEAR[sl][k];
  if(!gearUnlocked(sl,k)){if(it.unlock==='shop'&&(it.req==null||chapCleared(it.req))&&SV.mon>=it.price){SV.mon-=it.price;SV.gearOwned.push(sl+':'+k);hap('buy');pluck(392,0.1);}else{hap('tick');return;}}
  SV.gear[sl]=k;save();hap('equip');renderArmory();});}
/* ---------- settings ---------- */
function renderSettings(){const o=$('setIn');const hapN=['Off','Light','Normal','Strong'];
 o.innerHTML=`<div class="hd"><b>設定 SETTINGS</b><button id="setX">閉 BACK</button></div>
 <div class="row"><label>振動 Haptics${HAP.native?' <small>(native · '+(HAP.amp?'amplitude':'basic')+')</small>':' <small>(web)</small>'}</label><div class="seg">${hapN.map((n,i)=>`<button class="${SV.set.hap===i?'on':''}" data-hap="${i}">${n}</button>`).join('')}<button id="hapTest">Test</button></div></div>
 <div class="row"><label>音量 Sound</label><input id="vol" type="range" min="0" max="100" value="${Math.round(SV.set.vol*100)}"><span id="volV">${Math.round(SV.set.vol*100)}%</span></div>
 <div class="row"><label>受け流しの輪 Parry timing ring</label><div class="seg"><button class="${SV.set.ring?'on':''}" data-ring="1">On</button><button class="${!SV.set.ring?'on':''}" data-ring="0">Off</button></div></div>
 <div class="row"><label>残心 Slow-motion on perfect parry</label><div class="seg"><button class="${SV.set.slow?'on':''}" data-slow="1">On</button><button class="${!SV.set.slow?'on':''}" data-slow="0">Off</button></div></div>
 <div class="row"><label>効果 Effects quality</label><div class="seg">${[['auto','Auto'],['full','Full'],['lite','Lite']].map(([k,t])=>`<button class="${(SV.set.fx||'auto')===k?'on':''}" data-fx="${k}">${t}</button>`).join('')}</div><small>now: ${window.LITE?'lite':'full'} · ${Math.round(PERF.fps)} fps</small></div>
 <div class="row"><label>難易度 Difficulty</label><div class="seg">${Object.keys(DIFFS).map(k=>`<button class="${SV.diff===k?'on':''}" data-diff="${k}">${DIFFS[k].label}</button>`).join('')}</div></div>
 <div class="row"><label>記録 Record</label><span class="rec">Lv ${lvl()} · ${SV.mon} 文 · 転生 ${SV.tensei} · best hunt ${SV.best} · parries ${SV.tot.parries} (perfect ${SV.tot.perfect}) · counters ${SV.tot.counters} · dodges ${SV.tot.dodges} · wins ${SV.tot.wins}</span></div>
 <div class="row"><label>初期化 Reset</label><button id="reset" class="danger">${resetArmed?'TAP AGAIN TO ERASE EVERYTHING':'Erase all progress'}</button></div>
 <div class="row small">diag: ${navigator.userAgent.slice(0,90)} · errors ${window.__ERR.length}${window.__ERR.length?' · last: '+window.__ERR[window.__ERR.length-1].slice(0,120):''}</div>
 <div class="row small">影ノ誓 KAGE NO CHIKAI 弐 — Book Two: The Seventh Name · a game by KeiCheong Mai · tap 功績 CREDITS on the title for sound credits</div>`;
 o.querySelector('#setX').onclick=()=>{hap('tap');resetArmed=false;closeSettings();};
 o.querySelectorAll('[data-hap]').forEach(b=>b.onclick=()=>{SV.set.hap=+b.dataset.hap;HAP.set({on:SV.set.hap>0,strength:[0,0.6,1,1.4][SV.set.hap]});save();hap('parryPerfect');renderSettings();});
 o.querySelector('#hapTest').onclick=()=>{hap('parryPerfect');setTimeout(()=>hap('hurt'),400);setTimeout(()=>hap('victory'),900);};
 const vol=o.querySelector('#vol');vol.oninput=()=>{o.querySelector('#volV').textContent=vol.value+'%';setVol(vol.value/100);};vol.onchange=()=>{audioInit();pluck(392,0.12);};
 o.querySelectorAll('[data-ring]').forEach(b=>b.onclick=()=>{SV.set.ring=+b.dataset.ring;save();hap('tick');renderSettings();});
 o.querySelectorAll('[data-slow]').forEach(b=>b.onclick=()=>{SV.set.slow=+b.dataset.slow;save();hap('tick');renderSettings();});
 o.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{SV.set.fx=b.dataset.fx;setQuality(SV.set.fx);save();hap('tick');renderSettings();});
 o.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{SV.diff=b.dataset.diff;save();rebuildStages();hap('tick');renderSettings();});
 o.querySelector('#reset').onclick=()=>{if(!resetArmed){resetArmed=true;hap('warn');renderSettings();return;}localStorage.removeItem(SAVE_KEY);location.reload();};}
let resetArmed=false;
/* ---------- armory preview drawn on the canvas (left of the panel) ---------- */
function drawArmoryPreview(){const l=L();ST=STAGES[Math.min(Math.max(0,SV.cleared-1),STAGES.length-1)];drawWorld();drawForeground();
 cx.fillStyle='rgba(5,2,3,.35)';cx.fillRect(0,0,W,H);const p=mix(BASE,{},0);p.hy+=Math.sin(T*2)*1.2;const w=WEAPONS[SV.equip]||WEAPONS.katana;
 cx.save();cx.translate(W*0.15,H*0.78);cx.scale(l.fs*1.25,l.fs*1.25);cx.translate(-W*0.15,-H*0.78);figure(W*0.15,H*0.78,1,1,p,playerColors(w.kind,false));cx.restore();
 cx.textAlign='center';cx.fillStyle='#f3e6d0';cx.font=font(13*U,1);cx.fillText(w.jp+' '+w.name,W*0.15,H*0.9);cx.font=font(9*U);cx.fillStyle='#d8c4ac';
 cx.fillText([GEAR.hat[SV.gear.hat],GEAR.body[SV.gear.body],GEAR.cloak[SV.gear.cloak],GEAR.charm[SV.gear.charm]].filter(x=>x).map(x=>x.jp).join(' · '),W*0.15,H*0.95);}
/* ---------- test hooks (#shot=..., #selftest) ---------- */
(function(){const h=location.hash.slice(1);if(!h)return;const q=Object.fromEntries(h.split('&').map(s=>s.split('=')));
 if(q.gear){const [a,b,c]=q.gear.split(',');SV.gear={hat:a,body:b,cloak:c,charm:'none'};}
 if(q.w){if(!SV.weapons.includes(q.w))SV.weapons.push(q.w);SV.equip=q.w;}
 if(q.shot==='map'){SV.cleared=+(q.cl||9);SV.seenPro=true;scene='map';sceneT=1;}
 if(q.shot==='armory'){SV.mon=900;SV.weapons=V2ORDER.slice(0,5);scene='map';sceneT=1;openArmory();}
 if(q.shot==='duel'||q.shot==='surv'){if(q.shot==='surv'){SURV={round:+(q.r||10),hp:null};survStage();stageI=0;newDuel(0,SURV.st);SURV.hp=Math.round(P.max*0.62);toFight();}else{stageI=+(q.s||3);toFight();}
  sceneT=2;const want=q.st||'windup';let n=0;
  while(n++<4000){P.hp=P.max*0.8;scene='fight';enemyUpdate(0.016);E.kd=Math.max(0,E.kd-0.016);if(want==='windup'&&E.state==='windup'&&!E.atk.unblock&&E.windT>E.wind-0.45&&!(E.atk.feint&&!E.feinted))break;if(want==='unblock'&&E.state==='windup'&&E.atk.unblock&&E.windT>E.wind*0.6)break;if(want==='open'&&E.state==='open')break;
   if(want==='open'&&E.state==='windup'&&!E.atk.unblock&&E.windT>E.wind-0.15&&!(E.atk.feint&&!E.feinted))playerSwipe(E.dir);P.cd=0;}
  if(q.hit){playerSwipe(+q.hit);P.swing=0.7;}}
 if(q.shot==='selftest'){const res=[];let wins=0,n=0,errs=[];const sk=+(q.sk||0.85);
  const run=(setup)=>{SV.xp=0;setup();let tgt=-1;scene='fight';sceneT=2;let t=0,nextAtk=0;while(!E.dead&&P.hp>0&&t<300){const dt=0.016;t+=dt;enemyUpdate(dt);
    P.dodge=Math.max(0,P.dodge-dt);P.cd=Math.max(0,P.cd-dt);P.swing=Math.max(0,P.swing-dt*5);E.kd=Math.max(0,E.kd-dt);
    if(!P.blocking){P.blockRegen+=dt;if(P.blockRegen>P.regen&&P.blockDur<P.blockMax){P.blockDur++;P.blockRegen=0;}}
    if(E.state!=='windup')tgt=-1;if(E.state==='windup'){const rem=E.wind-E.windT,a=E.atk;
     if(a.unblock){if(rem<0.3&&P.dodge<=0&&Math.random()<sk*0.2)dodge(a.dg);}
     else{if(E.windT<0.02||tgt<0)tgt=Math.random()*0.85-0.12;if(!(a.feint&&!E.feinted)&&rem<tgt&&P.cd<=0){playerSwipe(Math.random()<sk?E.dir:(E.dir+1)%8);tgt=-9;}}}
    else if(E.state==='open'&&P.cd<=0&&t-nextAtk>0.2){nextAtk=t;playerSwipe([0,1,7,0][Math.floor(Math.random()*4)]);}
    if(scene!=='fight'&&scene!=='survnext')break;}
   return {won:E.dead,t,hp:Math.round(P.hp)};};
  try{STAGES.forEach((s,i)=>{for(const w of ['katana','kanabo','kodachi','tessen']){SV.equip=w;if(!SV.weapons.includes(w))SV.weapons.push(w);SURV=null;const r=run(()=>{stageI=i;toFight();});n++;if(r.won)wins++;res.push(i+':'+s.enemy.key+'/'+w+':'+(r.won?'W':'L')+':'+r.t.toFixed(0)+'s:'+r.hp);}});}catch(e){errs.push(e.stack);}
  let surv='';try{SV.equip='katana';survStart();let rounds=0;while(rounds<40){const r=run(()=>{toFight();});if(!r.won){break;}rounds++;}surv='rounds '+rounds+' scene '+scene+' best '+SV.best+' round '+SURV.round+' hp '+Math.round(SURV.hp||0);}catch(e){errs.push(e.stack);}
  document.body.innerHTML='<pre id=res>WINS '+wins+'/'+n+'\nERRS '+errs.length+'\n'+errs.join('\n')+'\nSURV '+surv+'\nSTAGES '+STAGES.length+'\n'+res.join('\n')+'</pre>';}
})();
