'use strict';
/* ============================================================================
   UI — world HUD & buttons, NPC menu, inventory, trade, map/teleport,
   pause/settings, title, credits.
   ========================================================================== */
let UI={open:null,t:0,tab:'weapon',sel:null,scroll:0,shopTab:'buy',npc:null,mapZoom:1,mapX:0,mapY:0,confirmWp:null,dragging:false,dragX:0,dragY:0,dragMoved:false,credits:null,msg:null};
let HOT=[];
function hotTap(p){for(let i=HOT.length-1;i>=0;i--){const h=HOT[i];if(p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h){if(!h.silent){hap('tap');pluck(392,0.05,0.3);}h.fn(p);return true;}}return false;}
function btn(x,y,w,h,label,fn,o={}){X.save();X.fillStyle=o.hi?'rgba(184,36,42,.92)':o.dim?'rgba(20,12,10,.5)':'rgba(20,12,10,.86)';X.fillRect(x,y,w,h);X.fillStyle=o.hi?'#f3e6d0':'#b8242a';X.fillRect(x,y,2,h);X.strokeStyle='rgba(184,147,90,.5)';X.lineWidth=1;X.strokeRect(x+0.5,y+0.5,w-1,h-1);
 X.fillStyle=o.dim?'rgba(243,230,208,.45)':'#f3e6d0';X.font=font(o.fs||8,1);X.textAlign='center';X.fillText(label,x+w/2,y+h*0.64+(o.fs||8)*0.1);X.restore();if(!o.dim)HOT.push({x,y,w,h,fn});}
function openUI(k,o){UI.open=k;UI.t=0;UI.sel=null;UI.scroll=0;Object.assign(UI,o||{});inputMode='ui';BTN_DEFS.length=0;hap('page');if(k==='map'){UI.mapZoom=1;UI.mapX=0;UI.mapY=0;UI.confirmWp=null;}}
function closeUI(){UI.open=null;UI.npc=null;inputMode=SCENE.cur==='duel'?'duel':'world';if(SCENE.cur==='world')worldButtons();if(SCENE.cur==='duel')duelButtons();hap('page');}
/* ---------- world buttons ---------- */
function worldButtons(){BTN_DEFS.length=0;const r=Math.max(13,H*0.062),m=8;const right=S.set.stickSide==='left';const bx=right?W-m-r:m+r;const sx=right?-1:1;const vis=()=>!CUT.on&&!DLG.active();
 BTN_DEFS.push({id:'act',x:bx,y:H-m-r,r:r*1.15,visible:vis,down:()=>actionPress()},
  {id:'horse',x:bx+sx*(r*2.5),y:H-m-r,r:r*0.85,visible:()=>S.horse&&vis(),down:()=>horsePress()},
  {id:'run',x:bx+sx*(r*4.6),y:H-m-r,r:r*0.85,visible:vis},
  {id:'bag',x:bx,y:H-m-r*3.3,r:r*0.8,visible:vis,down:()=>openUI('inv')},
  {id:'map',x:bx+sx*(r*2.5),y:H-m-r*3.3,r:r*0.8,visible:vis,down:()=>openUI('map')},
  {id:'jump',x:bx+sx*(r*4.6),y:H-m-r*3.3,r:r*0.8,visible:vis,down:()=>playerJump()},
  {id:'menu',x:W-12,y:11,r:9,visible:vis,down:()=>openUI('pause')});}
function actionPress(){if(CUT.on||DLG.active()||UI.open)return;const n=npcNear();if(n){hap('tap');if(n.story){openUI('npc',{npc:n});return;}openUI('npc',{npc:n});return;}
 // nearby waypoint with no NPC: open map
 for(const wp of WAYPOINTS){if(S.wps[wp.id]&&Math.abs(wp.x-PL.x)<24&&Math.abs(wp.y-PL.y)<24){openUI('map');return;}}
 const pin=questTarget();if(pin&&pin.reached&&curStep().kind==='cut'){playStoryCut(curStep().id);return;}
 hap('tick');}
function horsePress(){if(!S.horse)return;if(PL.mounted){PL.mounted=false;HORSE.x=PL.x+14;HORSE.y=PL.y;HORSE.state='wait';hap('tap');toast('Dismounted','#f3e6d0');return;}
 const d=dist(HORSE.x,HORSE.y,PL.x,PL.y);const t=tileAt(Math.floor(PL.x/TS),Math.floor(PL.y/TS));if(t===TILE.PLANK){toast('Kaze will not cross planks.','#ffb070');hap('tick');return;}
 if(d<30){PL.mounted=true;hap('equip');whoosh(0.2,0.3,true);}else{HORSE.state='come';hap('tap');whoosh(0.3,0.6,true);toast('Kaze comes running…','#f3e6d0');}}
/* ---------- HUD ---------- */
function drawWorldHud(){const m=6;X.clearRect(0,0,W,H);
 // hp / level / coins
 const mh=playerMaxHp();const bw=Math.min(120,W*0.26);panel9(X,m,m,bw+26,24,'ink');
 X.fillStyle='rgba(0,0,0,.5)';X.fillRect(m+28,m+5,bw-6,5);X.fillStyle=PL.hp<mh*0.25?'#ff5a3d':'#e8dcc8';X.fillRect(m+28,m+5,(bw-6)*clamp(PL.hp/mh,0,1),5);
 try{PIX.draw(X,CHARS.kage,PL.hp<mh*0.3?'pain':'calm',m+3,m+2,20,false);}catch(e){}
 X.font=font(6,1);X.fillStyle='#f3e6d0';X.textAlign='left';X.fillText('影 Lv '+S.level+'  ·  '+Math.round(PL.hp)+'/'+mh,m+28,m+18);X.textAlign='right';X.fillStyle='#ffd27a';X.fillText(S.coins+' 文',m+bw+20,m+18);
 // xp bar
 X.fillStyle='rgba(255,210,122,.25)';X.fillRect(m+28,m+20,bw-6,1);X.fillStyle='#ffd27a';X.fillRect(m+28,m+20,(bw-6)*clamp(S.xp/xpFor(S.level),0,1),1);
 // objective
 const st=questDone()?null:curStep();if(st&&!CUT.on){const tg=questTarget();X.textAlign='center';X.font=font(6,1);X.fillStyle='rgba(243,230,208,.9)';const txt='目的 · '+st.title+(tg?'  —  '+(tg.dist<40?'here':Math.round(tg.dist/TS)+' ri'):'');X.fillText(txt,W/2,m+8);
  X.font=font(5);X.fillStyle='rgba(243,230,208,.6)';X.fillText(S.pinned?'wind guide on · tap objective to toggle':'wind guide off',W/2,m+15);HOT.push({x:W/2-80,y:m,w:160,h:16,fn:()=>{S.pinned=!S.pinned;save();},silent:1});}
 // minimap
 drawMinimap(W-m-54,m+22,48,48);
 // region
 if(PL.region){X.textAlign='right';X.font=font(6,1);X.fillStyle='rgba(243,230,208,.8)';X.fillText(PL.region.jp+' '+PL.region.name,W-m-6,m+80);}
 // buttons
 const r=Math.max(13,H*0.062);BTN_DEFS.forEach(b=>{if(b.visible&&!b.visible())return;let icon='',label='';const n=b.id==='act'?npcNear():null;
  if(b.id==='act'){icon=n?(n.dead?'…':'話'):'◎';label=n?(n.dead?'':'TALK · '+n.name.split(' ')[0]):'';}else if(b.id==='horse'){icon='馬';label=PL.mounted?'DISMOUNT':'HORSE';}else if(b.id==='bag'){icon='袋';label='BAG';}else if(b.id==='map'){icon='図';label='MAP';}else if(b.id==='menu'){icon='≡';}else if(b.id==='run'){icon='走';label=PL.run?'RUNNING':'HOLD · RUN';}else if(b.id==='jump'){icon='跳';label='JUMP';}
  X.save();X.globalAlpha=0.92;X.beginPath();X.arc(b.x,b.y,b.r,0,TAU);X.fillStyle=b.held?'rgba(184,36,42,.9)':'rgba(14,10,10,.78)';X.fill();X.lineWidth=1.2;X.strokeStyle=b.id==='act'&&n?'#ffd27a':'rgba(243,230,208,.6)';X.stroke();X.fillStyle='#f3e6d0';X.font=font(b.r*0.8,1);X.textAlign='center';X.textBaseline='middle';X.fillText(icon,b.x,b.y+1);X.textBaseline='alphabetic';
  if(label){X.font=font(5,1);X.fillStyle='rgba(243,230,208,.8)';X.fillText(label,b.x,b.y+b.r+7);}X.restore();});
 // joystick
 if(IN.stick.active){X.save();X.globalAlpha=0.5;X.strokeStyle='#f3e6d0';X.lineWidth=1.5;X.beginPath();X.arc(IN.stick.ox,IN.stick.oy,34,0,TAU);X.stroke();X.fillStyle='rgba(243,230,208,.6)';X.beginPath();X.arc(IN.stick.ox+IN.stick.dx*34,IN.stick.oy+IN.stick.dy*34,10,0,TAU);X.fill();X.restore();}
 // npc name tags nearby
 for(const n of NPCS){const d2=(n.x-PL.x)**2+(n.y-PL.y)**2;if(d2>70*70||n.dead)continue;const x=n.x-CAM.x,y=n.y-CAM.y-30;X.font=font(5,1);X.textAlign='center';X.fillStyle=n.boss?'#ff8a8a':n.story?'#ffd27a':'rgba(243,230,208,.8)';X.lineWidth=2;X.strokeStyle='rgba(0,0,0,.6)';X.strokeText(n.name,x,y);X.fillText(n.name,x,y);
  if(n.trade==='shop'){X.fillStyle='#9fe3ff';X.strokeText('商 · '+(n.shop||'shop'),x,y+6);X.fillText('商 · '+(n.shop||'shop'),x,y+6);}}
 // toasts
 TOASTS.forEach((t,i)=>{t.t+=1/60;const k=t.t/4;if(k>1)return;const a=k<0.1?k/0.1:k>0.8?(1-k)/0.2:1;X.globalAlpha=a;X.font=font(7,1);X.textAlign='center';X.lineWidth=3;X.strokeStyle='rgba(0,0,0,.75)';X.fillStyle=t.col;const y=H-40-(TOASTS.length-1-i)*11;X.strokeText(t.s,W/2,y);X.fillText(t.s,W/2,y);X.globalAlpha=1;});TOASTS=TOASTS.filter(t=>t.t<4);
 // banner
 if(BANNER){BANNER.t+=1/60;const k=BANNER.t/3.4;if(k>1)BANNER=null;else{const a=k<0.15?k/0.15:k>0.8?(1-k)/0.2:1;X.globalAlpha=a;X.fillStyle='rgba(10,7,8,.55)';X.fillRect(0,H*0.2,W,44);X.fillStyle=BANNER.col;X.fillRect(W/2-60,H*0.2+40,120,1);X.textAlign='center';X.font=font(20,1);X.fillText(BANNER.R.jp,W/2,H*0.2+22);X.font=font(8,1);X.fillText(BANNER.R.name.toUpperCase(),W/2,H*0.2+34);if(BANNER.R.desc){X.font=font(6);X.fillStyle='rgba(243,230,208,.8)';X.fillText(BANNER.R.desc,W/2,H*0.2+52);}X.globalAlpha=1;}}
 if(ECLIPSE.on){X.fillStyle='rgba(255,77,90,.9)';X.font=font(7,1);X.textAlign='center';X.fillText('日蝕 · ECLIPSE — the dead walk · '+Math.ceil(ECLIPSE.dur-ECLIPSE.t)+'s',W/2,H-6);}
 if(CUT.on&&!DLG.active()){X.fillStyle='rgba(243,230,208,.6)';X.font=font(6,1);X.textAlign='right';X.fillText('SKIP ▶▶',W-8,H-8);HOT.push({x:W-50,y:H-18,w:48,h:16,fn:()=>{skipCut();},silent:1});}
}
function skipCut(){if(!CUT.on)return;while(CUT.q.length){const c=CUT.q.shift();if(c.spawn||c.remove||c.kill||c.fn||c.set||c.teleport||c.music){CUT.cur=null;CUT.q.unshift(c);cutNext();CUT.q=CUT.q;}}CUT.cur=null;if(DLG.active())DLG.skip();cutNext();}
function drawMinimap(x,y,w,h){const sc=0.5;const cx=PL.x/TS,cy=PL.y/TS;const vw=w/sc,vh=h/sc;X.save();X.fillStyle='rgba(10,7,8,.8)';X.fillRect(x-2,y-2,w+4,h+4);X.beginPath();X.rect(x,y,w,h);X.clip();X.imageSmoothingEnabled=false;
 X.drawImage(MINI,cx-vw/2,cy-vh/2,vw,vh,x,y,w,h);
 const tg=questTarget();if(tg&&S.pinned){const dx=(tg.x/TS-cx)*sc,dy=(tg.y/TS-cy)*sc;const d=Math.hypot(dx,dy);const r=Math.min(d,w/2-3);const a=Math.atan2(dy,dx);X.fillStyle='#ffd27a';X.beginPath();X.arc(x+w/2+Math.cos(a)*r,y+h/2+Math.sin(a)*r,2,0,TAU);X.fill();}
 for(const wp of WAYPOINTS){if(!S.wps[wp.id])continue;const dx=(wp.tx-cx)*sc,dy=(wp.ty-cy)*sc;if(Math.abs(dx)<w/2&&Math.abs(dy)<h/2){X.fillStyle='#9fe3ff';X.fillRect(x+w/2+dx-1,y+h/2+dy-1,2,2);}}
 X.fillStyle='#fff';X.fillRect(x+w/2-1,y+h/2-1,3,3);X.restore();X.strokeStyle='rgba(184,147,90,.6)';X.lineWidth=1;X.strokeRect(x-1.5,y-1.5,w+3,h+3);HOT.push({x:x-4,y:y-4,w:w+8,h:h+8,fn:()=>openUI('map'),silent:1});}
/* ---------- NPC menu ---------- */
function drawNpcMenu(){const n=UI.npc;if(!n){closeUI();return;}const pw=Math.min(W*0.8,280),ph=118,x=W/2-pw/2,y=H/2-ph/2;panel9(X,x,y,pw,ph,'dark');
 const ps=64;try{PIX.draw(X,CHARS[n.char]||CHARS.villager,n.boss?'grim':'neutral',x+10,y+10,ps,false);}catch(e){}
 X.textAlign='left';X.fillStyle=n.boss?'#ff8a8a':'#f3e6d0';X.font=font(11,1);X.fillText(n.jp+'  '+n.name,x+84,y+22);X.font=font(6);X.fillStyle='rgba(243,230,208,.75)';
 const rd=ROLE[n.role]||{};X.fillText((n.boss?'STORY BOSS · ':n.tier>=6?'MERCHANT — among the deadliest duellists · ':'')+'Level '+n.lvl+' · '+WKIND[n.weapon].name+' ('+WKIND[n.weapon].jp+')'+(n.region?' · '+(REGIONS[regionIndex(n.region)]||{}).name:''),x+84,y+33);
 const dd=npcDuelDef(n);const danger=dd.lvl-S.level;X.fillStyle=danger>4?'#ff5a3d':danger>1?'#ffb070':'#9fe3a0';X.fillText('threat: '+(danger>4?'DEADLY':danger>1?'dangerous':danger>-3?'even':'easy')+' · hp '+dd.hp,x+84,y+42);
 const bw=(pw-30)/2,bh=18;let by=y+52;
 btn(x+10,by,bw,bh,'話 TALK',()=>{closeUI();n.state='talkto';if(n.story)storyTalk(n);else{const pool=TALK[n.talk]||TALK.villager;const rng=RNG(hashStr(n.id)+Math.floor(T/7));const line=pool[Math.floor(rng()*pool.length)];runDialogue([{who:n.char,mood:'neutral',text:line}],()=>{n.state='idle';});}});
 if(n.trade)btn(x+20+bw,by,bw,bh,n.trade==='horse'?'馬 STABLE & TRADE':n.trade==='inn'?'宿 REST & BUY':n.trade==='shop'?'商 TRADE':'商 BARTER',()=>{openUI('shop',{npc:n,shopTab:'buy'});});
 by+=bh+6;btn(x+10,by,bw,bh,'⚔ CHALLENGE TO A DUEL',()=>{closeUI();challenge(n);},{hi:1});btn(x+20+bw,by,bw,bh,'LEAVE',()=>closeUI());
 by+=bh+6;X.font=font(5);X.fillStyle='rgba(243,230,208,.5)';X.textAlign='center';X.fillText(n.trade==='shop'?'Win the duel and you take their best stock.':'Win and take their loot and coins. They stay dead until the next eclipse.',W/2,by+6);}
function challenge(n){if(n.dead)return;n.state='talkto';const isStory=!!n.story&&!questDone()&&curStep().target===n.story;if(isStory){storyTalk(n);return;}
 runDialogue([{who:n.char,mood:'angry',text:n.boss?'You dare?':n.tier>=6?'My stock is not for the taking. Draw, and learn why.':(['Very well.','You want this? Fine.','Draw, then.','So be it. Steel decides.'][Math.floor(Math.random()*4)])}],()=>{startDuel(n,{steal:n.trade==='shop',onDone:()=>{n.state='idle';}});});}
/* ---------- inventory ---------- */
const TABS=[['weapon','刀 WEAPONS'],['helm','兜 HELMS'],['body','鎧 ARMOUR'],['charm','守 CHARMS'],['consumable','品 ITEMS']];
function drawInventory(){X.fillStyle='rgba(6,4,5,.86)';X.fillRect(0,0,W,H);const m=8;X.textAlign='left';X.fillStyle='#f3e6d0';X.font=font(12,1);X.fillText('袋 · INVENTORY',m,m+12);X.font=font(6);X.fillStyle='rgba(243,230,208,.7)';X.fillText(S.coins+' 文 · '+S.inv.length+' items · Lv '+S.level+' · '+S.xp+'/'+xpFor(S.level)+' xp',m+100,m+12);
 btn(W-m-40,m,40,14,'CLOSE',()=>closeUI());
 let tx=m;TABS.forEach(([k,l])=>{const w=X.measureText(l).width+16;btn(tx,m+18,Math.max(44,w),13,l,()=>{UI.tab=k;UI.sel=null;UI.scroll=0;},{hi:UI.tab===k,fs:6});tx+=Math.max(44,w)+4;});
 // left: list
 const lx=m,ly=m+36,lw=W*0.52,lh=H-ly-m;X.fillStyle='rgba(0,0,0,.35)';X.fillRect(lx,ly,lw,lh);
 const items=S.inv.filter(i=>i.type===UI.tab).sort((a,b)=>RARITY_ORDER.indexOf(b.rar)-RARITY_ORDER.indexOf(a.rar)||itemScore(b)-itemScore(a));
 const rowH=20,vis=Math.floor(lh/rowH);UI.scroll=clamp(UI.scroll,0,Math.max(0,items.length-vis));
 if(!items.length){X.fillStyle='rgba(243,230,208,.5)';X.font=font(7);X.fillText('Nothing here yet. Defeat foes, open chests, trade with merchants.',lx+8,ly+20);}
 items.slice(UI.scroll,UI.scroll+vis).forEach((it,i)=>{const y=ly+i*rowH;const eq=Object.values(S.eq).includes(it.uid);const sel=UI.sel===it.uid;if(sel){X.fillStyle='rgba(184,36,42,.35)';X.fillRect(lx,y,lw,rowH);}
  X.drawImage(itemIcon(it),lx+4,y+2,16,16);X.fillStyle=RARITY[it.rar].col;X.font=font(7,1);X.textAlign='left';X.fillText(it.name,lx+24,y+9);X.font=font(5);X.fillStyle='rgba(243,230,208,.7)';X.fillText(RARITY[it.rar].n+(it.type==='weapon'?' · '+WKIND[it.kind].name+' · dmg ×'+it.dmg:it.type==='consumable'?' · '+it.desc:'')+(it.lvl>1?' · lv'+it.lvl:''),lx+24,y+16);
  if(eq){X.textAlign='right';X.fillStyle='#9fe3a0';X.font=font(5,1);X.fillText('EQUIPPED',lx+lw-4,y+9);}HOT.push({x:lx,y,w:lw,h:rowH,fn:()=>{UI.sel=it.uid;}});});
 if(items.length>vis){btn(lx+lw-30,ly+lh-14,14,12,'▲',()=>{UI.scroll--;},{fs:6});btn(lx+lw-15,ly+lh-14,14,12,'▼',()=>{UI.scroll++;},{fs:6});}
 // right: detail + paper doll
 const rx=lx+lw+8,rw=W-rx-m;X.fillStyle='rgba(0,0,0,.35)';X.fillRect(rx,ly,rw,lh);
 const sh=charSheet(playerSpriteDef());X.imageSmoothingEnabled=false;X.drawImage(sh.c,0,0,sh.fw,sh.fh,rx+rw-sh.fw*2-6,ly+6,sh.fw*2,sh.fh*2);
 const w=playerWeapon();X.fillStyle='#f3e6d0';X.font=font(6,1);X.textAlign='left';X.fillText('HP '+playerMaxHp()+'  ·  dmg ×'+w.dmg.toFixed(2)+'  ·  parry +'+w.win.toFixed(2)+'s',rx+6,ly+12);X.font=font(5);X.fillStyle='rgba(243,230,208,.7)';X.fillText('dodge '+(0.55+gsum('dodge')).toFixed(2)+'s · blocks '+(3+gsum('blk'))+' · lifesteal '+w.ls+' · counter ×'+w.counter.toFixed(1)+' · coin ×'+gmul('coin').toFixed(2)+' · xp ×'+gmul('xp').toFixed(2),rx+6,ly+20);
 ['weapon','helm','body','charm'].forEach((sl,i)=>{const it=eqItem(sl);X.font=font(5);X.fillStyle='rgba(243,230,208,.55)';X.fillText(sl.toUpperCase(),rx+6,ly+32+i*9);X.fillStyle=it?RARITY[it.rar].col:'rgba(243,230,208,.4)';X.font=font(5,1);X.fillText(it?it.name:'—',rx+36,ly+32+i*9);});
 const it=S.inv.find(i=>i.uid===UI.sel);if(it){const dy=ly+74;X.fillStyle=RARITY[it.rar].col;X.font=font(8,1);X.fillText(it.name,rx+6,dy);X.fillStyle='rgba(243,230,208,.8)';X.font=font(5);X.fillText((it.jp?it.jp+' · ':'')+RARITY[it.rar].jp+' '+RARITY[it.rar].n+' · '+(it.type==='weapon'?WKIND[it.kind].jp+' '+WKIND[it.kind].name:it.type),rx+6,dy+8);
  const stats=describe(it);X.fillStyle='rgba(243,230,208,.85)';stats.forEach((s,i)=>X.fillText(s,rx+6,dy+17+i*7));
  const bw=(rw-18)/2;const by=ly+lh-20;const eq=Object.values(S.eq).includes(it.uid);
  if(it.type==='consumable')btn(rx+6,by,bw,14,'USE',()=>{useItem(it);},{hi:1});else btn(rx+6,by,bw,14,eq?'UNEQUIP':'EQUIP',()=>{if(eq){S.eq[it.type==='weapon'?'weapon':it.type]=null;}else equip(it);hap('equip');save();},{hi:!eq});
  btn(rx+12+bw,by,bw,14,'DROP',()=>{removeItem(it.uid);UI.sel=null;save();hap('tick');});}
}
function describe(it){const o=[];if(it.type==='weapon'){o.push('damage ×'+it.dmg+'  ·  swing '+it.cd+'s');if(it.win)o.push('parry window +'+it.win+'s');if(it.crit>1)o.push('×'+it.crit+' on a broken foe');if(it.gb)o.push('breaks guards ('+Math.round(it.gb*100)+'%)');if(it.wrap)o.push('wraps past guards ('+Math.round(it.wrap*100)+'%)');if(it.reach)o.push('foes stay open +'+it.reach+'s');if(it.ls)o.push('lifesteal '+it.ls+' on perfect parry');if(it.counter>1)o.push('counter ×'+it.counter);if(it.mag>1)o.push('Foxfire gain ×'+it.mag);if(it.desc)o.push(it.desc);}
 else if(it.type==='consumable'){o.push(it.desc);}
 else{if(it.hp)o.push('HP '+(it.hp>0?'+':'')+it.hp);if(it.dmg)o.push('damage ×'+it.dmg);if(it.win)o.push('parry window +'+it.win+'s');if(it.dodge)o.push('dodge window '+(it.dodge>0?'+':'')+it.dodge+'s');if(it.blk)o.push('+'+it.blk+' block charge');if(it.regen)o.push('blocks refill every '+it.regen+'s');if(it.cdm)o.push('swings ×'+it.cdm+' slower');if(it.ls)o.push('lifesteal '+it.ls);if(it.counter)o.push('counter ×'+it.counter);if(it.mag)o.push('Foxfire gain ×'+it.mag);if(it.coin)o.push('coins ×'+it.coin);if(it.xp)o.push('xp ×'+it.xp);}
 o.push('value '+sellPrice(it)+' 文');return o;}
function useItem(it){const mh=playerMaxHp();PL.hp=Math.min(mh,PL.hp+(it.heal||0));if(it.buff){S.buff={[it.buff]:1};toast('Next duel: '+(it.buff==='dmg'?'+15% damage':it.buff==='win'?'wider parry window':'Foxfire ready'),'#9fe3ff');}removeItem(it.uid);UI.sel=null;hap('buy');chime(1046,0.08,1);save();}
/* ---------- shop ---------- */
function drawShop(){const n=UI.npc;if(!n){closeUI();return;}X.fillStyle='rgba(6,4,5,.88)';X.fillRect(0,0,W,H);const m=8;X.textAlign='left';X.fillStyle='#f3e6d0';X.font=font(11,1);X.fillText('商 · '+n.name+(n.shop?' — '+n.shop:''),m,m+12);X.font=font(6);X.fillStyle='#ffd27a';X.fillText(S.coins+' 文',m+200,m+12);
 btn(W-m-40,m,40,14,'CLOSE',()=>closeUI());btn(m,m+18,50,13,'BUY',()=>{UI.shopTab='buy';UI.scroll=0;},{hi:UI.shopTab==='buy',fs:6});btn(m+54,m+18,50,13,'SELL',()=>{UI.shopTab='sell';UI.scroll=0;},{hi:UI.shopTab==='sell',fs:6});
 const ly=m+36,lh=H-ly-m,rowH=20,vis=Math.floor(lh/rowH);X.fillStyle='rgba(0,0,0,.35)';X.fillRect(m,ly,W-m*2,lh);
 const list=UI.shopTab==='buy'?npcStock(n):S.inv.filter(i=>!Object.values(S.eq).includes(i.uid));UI.scroll=clamp(UI.scroll,0,Math.max(0,list.length-vis));
 if(!list.length){X.fillStyle='rgba(243,230,208,.5)';X.font=font(7);X.fillText(UI.shopTab==='buy'?'Sold out. Stock returns after an eclipse.':'Nothing to sell (equipped items are kept).',m+8,ly+20);}
 list.slice(UI.scroll,UI.scroll+vis).forEach((it,i)=>{const y=ly+i*rowH;const price=UI.shopTab==='buy'?Math.round(it.price*(n.shop==='exotic'?1.3:1)):sellPrice(it);X.drawImage(itemIcon(it),m+4,y+2,16,16);X.fillStyle=RARITY[it.rar].col;X.font=font(7,1);X.textAlign='left';X.fillText(it.name,m+24,y+9);X.font=font(5);X.fillStyle='rgba(243,230,208,.7)';X.fillText(describe(it).slice(0,3).join('  ·  '),m+24,y+16);
  const can=UI.shopTab==='sell'||S.coins>=price;btn(W-m-64,y+3,58,14,(UI.shopTab==='buy'?'BUY ':'SELL ')+price+' 文',()=>{if(UI.shopTab==='buy'){if(S.coins<price){hap('tick');return;}S.coins-=price;const st=npcStock(n);st.splice(st.indexOf(it),1);addItem(it);toast('Bought '+it.name,RARITY[it.rar].col);coin(0.15);hap('buy');}else{S.coins+=price;removeItem(it.uid);toast('Sold '+it.name+' for '+price+' 文','#ffd27a');coin(0.12);hap('buy');}save();},{hi:can,dim:!can,fs:6});});
 if(list.length>vis){btn(W-m-30,ly+lh-14,14,12,'▲',()=>{UI.scroll--;},{fs:6});btn(W-m-15,ly+lh-14,14,12,'▼',()=>{UI.scroll++;},{fs:6});}
 if(n.trade==='horse'&&!S.horse){btn(m+112,m+18,96,13,'BUY A HORSE · 400 文',()=>{if(S.coins<400){hap('tick');toast('Not enough mon.','#ffb070');return;}S.coins-=400;S.horse=true;HORSE.x=PL.x+18;HORSE.y=PL.y;HORSE.state='wait';toast('A horse is yours — tap 馬 to mount','#ffd27a');hap('buy');save();},{fs:6,hi:1});}
 if(n.trade==='inn'){btn(m+112,m+18,70,13,'REST 20 文',()=>{if(S.coins<20){hap('tick');return;}S.coins-=20;PL.hp=playerMaxHp();DAY.t=0.27;toast('You sleep until dawn. HP restored.','#9fe3a0');hap('buy');save();},{fs:6});}}
/* ---------- map ---------- */
function drawMap(){X.fillStyle='#1a1416';X.fillRect(0,0,W,H);const m=6;const fit=Math.min((W-120)/MAPW,(H-20)/MAPH)*UI.mapZoom;const mw=MAPW*fit,mh=MAPH*fit;const ox=(W-110)/2-mw/2+UI.mapX,oy=H/2-mh/2+UI.mapY;
 X.save();X.beginPath();X.rect(0,0,W-108,H);X.clip();X.imageSmoothingEnabled=false;X.drawImage(MINI,ox,oy,mw,mh);
 // locked regions hatch
 if(S.part===1){X.fillStyle='rgba(10,7,8,.55)';REGIONS.forEach(R=>{if(R.part!==2)return;const t=R.towns[0];if(!t)return;});
  // cheap: hatch by sampling region map coarsely
  for(let y=0;y<MAPH;y+=6)for(let x=0;x<MAPW;x+=6){const r=REG[idx(x,y)];if(!r)continue;if(REGIONS[r-1].part===2){X.fillRect(ox+x*fit,oy+y*fit,6*fit,6*fit);}}}
 // region names
 X.textAlign='center';REGIONS.forEach(R=>{if(S.part===1&&R.part===2&&!S.flags.secretMap)return;const x=ox+R.cx*fit,y=oy+R.cy*fit;X.font=font(Math.max(5,6*UI.mapZoom),1);X.fillStyle=R.clan?'#ffb0a0':'rgba(243,230,208,.85)';X.lineWidth=2;X.strokeStyle='rgba(0,0,0,.7)';X.strokeText(R.jp,x,y);X.fillText(R.jp,x,y);if(UI.mapZoom>1.5){X.font=font(4);X.strokeText(R.name,x,y+6);X.fillText(R.name,x,y+6);}});
 // waypoints
 WAYPOINTS.forEach(wp=>{const un=!!S.wps[wp.id];if(!un&&!(S.flags.secretMap&&wp.sea))return;const x=ox+wp.tx*fit,y=oy+wp.ty*fit;X.fillStyle=un?(wp.sea?'#9fe3ff':'#ffd27a'):'rgba(243,230,208,.35)';X.fillRect(x-2,y-2,4,4);if(un){X.strokeStyle=X.fillStyle;X.lineWidth=1;X.beginPath();X.arc(x,y,4+Math.sin(T*4)*1,0,TAU);X.stroke();}
  if(un)HOT.push({x:x-9,y:y-9,w:18,h:18,fn:()=>{UI.confirmWp=wp;}});});
 // quest marker
 const tg=questTarget();if(tg){const x=ox+tg.x/TS*fit,y=oy+tg.y/TS*fit;X.fillStyle='#ff4d5a';X.beginPath();X.moveTo(x,y);X.lineTo(x-4,y-8);X.lineTo(x+4,y-8);X.closePath();X.fill();}
 // player
 const px=ox+PL.x/TS*fit,py=oy+PL.y/TS*fit;X.fillStyle='#fff';X.beginPath();X.arc(px,py,2.5,0,TAU);X.fill();X.strokeStyle='#fff';X.lineWidth=1;X.beginPath();X.arc(px,py,5+Math.sin(T*5),0,TAU);X.stroke();
 X.restore();
 // side panel
 const sx=W-104;panel9(X,sx,m,98,H-m*2,'dark');X.textAlign='left';X.fillStyle='#f3e6d0';X.font=font(9,1);X.fillText('図 · MAP OF JAPAN',sx+8,m+14);X.font=font(5);X.fillStyle='rgba(243,230,208,.7)';
 const cnt=WAYPOINTS.filter(w=>S.wps[w.id]).length;X.fillText('Wind Shrines: '+cnt+'/'+WAYPOINTS.length,sx+8,m+24);X.fillText('Regions seen: '+Object.keys(S.visited).length+'/'+REGIONS.length,sx+8,m+31);X.fillText('Kills: '+S.kills+' · eclipses: '+S.eclipses,sx+8,m+38);
 if(PL.region){X.fillStyle='#ffd27a';X.font=font(6,1);X.fillText(PL.region.jp+' '+PL.region.name,sx+8,m+50);X.font=font(5);X.fillStyle='rgba(243,230,208,.75)';wrapText(X,PL.region.desc,sx+8,m+58,84,6);}
 const st=questDone()?null:curStep();if(st){X.fillStyle='#ff8a8a';X.font=font(6,1);X.fillText('目的 · '+st.jp,sx+8,m+86);X.fillStyle='rgba(243,230,208,.8)';X.font=font(5);wrapText(X,st.text,sx+8,m+94,84,6);}
 btn(sx+6,H-m-50,42,13,'ZOOM +',()=>{UI.mapZoom=Math.min(4,UI.mapZoom*1.5);},{fs:6});btn(sx+52,H-m-50,42,13,'ZOOM −',()=>{UI.mapZoom=Math.max(1,UI.mapZoom/1.5);if(UI.mapZoom===1){UI.mapX=0;UI.mapY=0;}},{fs:6});
 btn(sx+6,H-m-34,88,13,'CENTRE ON ME',()=>{const f=Math.min((W-120)/MAPW,(H-20)/MAPH)*UI.mapZoom;UI.mapX=-(PL.x/TS*f-MAPW*f/2);UI.mapY=-(PL.y/TS*f-MAPH*f/2);},{fs:6});
 btn(sx+6,H-m-18,88,13,'CLOSE',()=>closeUI(),{hi:1});
 X.fillStyle='rgba(243,230,208,.5)';X.font=font(5);X.textAlign='center';X.fillText('drag to pan · tap a glowing shrine to teleport',(W-108)/2,H-4);
 if(UI.confirmWp){const wp=UI.confirmWp;const pw=200,ph=60,x=(W-108)/2-pw/2,y=H/2-ph/2;panel9(X,x,y,pw,ph,'dark');X.textAlign='center';X.fillStyle='#9fe3ff';X.font=font(8,1);X.fillText('風の社 · '+wp.jp,W2(x,pw),y+16);X.fillStyle='#f3e6d0';X.font=font(6);X.fillText('Travel on the wind to '+wp.name+'?',W2(x,pw),y+28);
  btn(x+14,y+38,80,14,'TRAVEL',()=>{teleportTo(wp);UI.confirmWp=null;closeUI();},{hi:1});btn(x+106,y+38,80,14,'CANCEL',()=>{UI.confirmWp=null;});}}
const W2=(x,w)=>x+w/2;
function wrapText(c,s,x,y,maxW,lh){const words=(s||'').split(' ');let line='';for(const w of words){const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){c.fillText(line,x,y);y+=lh;line=w;}else line=t;}c.fillText(line,x,y);return y+lh;}
function teleportTo(wp){PL.mounted=false;PL.jumpT=0;PL.z=0;FADE.to=()=>{const sp=snapToFree(wp.x,wp.y);PL.x=sp.x;PL.y=sp.y;PL.dir=0;CAM.x=PL.x-W/2;CAM.y=PL.y-H/2;CAM.tx=CAM.x;CAM.ty=CAM.y;if(S.horse){HORSE.x=PL.x+18;HORSE.y=PL.y;HORSE.state='wait';}save();FX.ring(W/2,H/2,10,80,'rgba(159,227,255,.9)',3,0.8);};FADE.t=0.001;FADE.col='#dbeefc';whoosh(0.4,1.0,true);hap('unlock');chime(1318,0.1,2);}
/* ---------- pause / settings ---------- */
function openPause(){if(SCENE.cur==='duel'&&D.phase==='fight'){openUI('pause');}else openUI('pause');}
function drawPause(){X.fillStyle='rgba(5,2,3,.8)';X.fillRect(0,0,W,H);X.textAlign='center';X.fillStyle='#f3e6d0';X.font=font(28,1);X.fillText('間',W/2,H*0.2);X.font=font(9,1);X.fillText('PAUSED · '+(SCENE.cur==='duel'?'DUEL':'JOURNEY'),W/2,H*0.2+14);
 const bw=130,bh=15,x=W/2-bw/2;let y=H*0.3;
 btn(x,y,bw,bh,'RESUME',()=>closeUI(),{hi:1});y+=bh+5;
 btn(x,y,bw,bh,'SETTINGS',()=>openUI('settings'));y+=bh+5;
 if(SCENE.cur==='duel'){btn(x,y,bw,bh,'FLEE THE DUEL',()=>{closeUI();endDuel('flee');});y+=bh+5;}
 btn(x,y,bw,bh,'CREDITS',()=>{if(window.startCredits)startCredits();});y+=bh+5;
 btn(x,y,bw,bh,'SAVE & QUIT TO TITLE',()=>{save();closeUI();if(SCENE.cur==='duel')endDuel('flee');goScene('title');inputMode='ui';MUSIC2.play('title',{fallback:[]});});y+=bh+5;
 X.font=font(5);X.fillStyle='rgba(243,230,208,.55)';X.fillText('Kage no Chikai 2 · v1.3 · play '+Math.floor(S.play/60)+' min · parries '+S.tot.parries+' (perfect '+S.tot.perfect+') · wins '+S.tot.wins,W/2,H-8);}
function drawSettings(){X.fillStyle='rgba(5,2,3,.88)';X.fillRect(0,0,W,H);X.textAlign='center';X.fillStyle='#f3e6d0';X.font=font(12,1);X.fillText('設定 · SETTINGS',W/2,16);
 const rows=[['Vibration',['Off','Light','Normal','Strong'][S.set.hap],()=>{S.set.hap=(S.set.hap+1)%4;HAP.set({on:S.set.hap>0,strength:[0,0.6,1,1.4][S.set.hap]});hap('parry');}],
  ['Sound volume',Math.round(S.set.vol*100)+'%',()=>{setVol(((Math.round(S.set.vol*10)+2)%12)/10);play('parry',1);}],
  ['Music volume',Math.round(S.set.mus*100)+'%',()=>{MUSIC2.setVol(((Math.round(S.set.mus*10)+2)%12)/10);}],
  ['Timing ring',S.set.ring?'On':'Off',()=>{S.set.ring=S.set.ring?0:1;}],
  ['Slow-motion on perfect parry',S.set.slow?'On':'Off',()=>{S.set.slow=S.set.slow?0:1;}],
  ['Blood & executions',S.set.gore?'On (brutal)':'Off',()=>{S.set.gore=S.set.gore?0:1;}],
  ['Joystick side',S.set.stickSide==='left'?'Left (buttons right)':'Right (buttons left)',()=>{S.set.stickSide=S.set.stickSide==='left'?'right':'left';}],
  ['Effects quality',S.set.fx==='auto'?'Auto':S.set.fx==='lite'?'Lite':'Full',()=>{S.set.fx=S.set.fx==='auto'?'lite':S.set.fx==='lite'?'full':'auto';setQuality(S.set.fx);}],
  ['Pixel size',S.set.pix==='large'?'Large':'Normal',()=>{S.set.pix=S.set.pix==='large'?'normal':'large';resize();}],
  ['Difficulty',DIFF().label,()=>{const ks=['easy','normal','hard','hell'];S.diff=ks[(ks.indexOf(S.diff||'normal')+1)%ks.length];hap('choice');}]];
 let y=26;const rh=Math.min(18,(H-56)/rows.length);rows.forEach(([l,v,fn])=>{X.textAlign='left';X.fillStyle='rgba(243,230,208,.85)';X.font=font(7);X.fillText(l,W*0.12,y+10);btn(W*0.55,y,W*0.33,rh-3,v,()=>{fn();save();},{fs:6});y+=rh;});
 btn(W/2-50,H-24,100,15,'BACK',()=>openUI('pause'),{hi:1});}
/* ---------- title ---------- */
let TITLE={t:0,camA:0,demo:null};
function drawTitle(dt){TITLE.t+=dt;
 // slow pan over Kyō
 const th=LANDMARKS.kyotoGate||{x:MAPW*TS/2,y:MAPH*TS/2};const a=TITLE.t*0.08;CAM.x=clamp(th.x-W/2+Math.cos(a)*120,0,MAPW*TS-W);CAM.y=clamp(th.y-H/2+Math.sin(a*0.7)*60+30,0,MAPH*TS-H);
 drawGround(CAM);const out=[];visibleProps(CAM,out);out.sort((p,q)=>p.y-q.y);out.forEach(p=>drawProp(p,CAM,nightAmount()));DAY.t=0.74;drawDayTint();drawLights(out);
 G.fillStyle='rgba(5,2,3,.45)';G.fillRect(0,0,W,H);
 X.clearRect(0,0,W,H);HOT=[];X.textAlign='center';
 X.fillStyle='rgba(243,230,208,.95)';X.font=font(34,1);X.lineWidth=5;X.strokeStyle='rgba(0,0,0,.7)';X.strokeText('影ノ誓・弐',W/2,H*0.36);X.fillText('影ノ誓・弐',W/2,H*0.36);
 X.font=font(9,1);X.fillStyle='#b8242a';X.fillText('KAGE NO CHIKAI 2 — THE SHADOW’S VOW',W/2,H*0.36+16);X.fillRect(W/2-70,H*0.36+22,140,1);
 const bw=120,bh=15;let y=H*0.56;
 if(HAS_SAVE||S.play>5){btn(W/2-bw/2,y,bw,bh,'続 CONTINUE',()=>startGame(false),{hi:1});y+=bh+5;btn(W/2-bw/2,y,bw,bh,'新 NEW GAME',()=>{UI.confirmNew=true;});y+=bh+5;}
 else{btn(W/2-bw/2,y,bw,bh,'始 BEGIN',()=>{UI.open='diff';},{hi:1});y+=bh+5;}
 btn(W/2-bw/2,y,bw,bh,'SETTINGS',()=>openUI('settings'));y+=bh+5;btn(W/2-bw/2,y,bw,bh,'CREDITS',()=>startCredits());
 X.font=font(5);X.fillStyle='rgba(243,230,208,.55)';X.fillText('an open-world pixel duel · by KeiCheong Mai · swipe to parry',W/2,H-6);
 if(UI.confirmNew){const pw=200,ph=56,x=W/2-pw/2,yy=H/2-ph/2;panel9(X,x,yy,pw,ph,'dark');X.fillStyle='#f3e6d0';X.font=font(7,1);X.fillText('Erase your journey and begin again?',W/2,yy+18);btn(x+14,yy+30,80,14,'ERASE',()=>{UI.confirmNew=false;UI.open='diff';},{hi:1});btn(x+106,yy+30,80,14,'KEEP',()=>{UI.confirmNew=false;});}}
/* ---------- difficulty picker ---------- */
function drawDiffPick(){X.fillStyle='rgba(5,2,3,.86)';X.fillRect(0,0,W,H);X.textAlign='center';X.fillStyle='#f3e6d0';X.font=font(14,1);X.fillText('難易度 · CHOOSE YOUR DIFFICULTY',W/2,24);X.font=font(6);X.fillStyle='rgba(243,230,208,.7)';X.fillText('You can change it later in Settings.',W/2,34);
 const keys=['easy','normal','hard','hell'];const cw=Math.min(100,(W-40)/4-6),ch=H*0.5,y=H*0.22;keys.forEach((k,i)=>{const d=DIFFS[k];const x=W/2-(cw+6)*2+i*(cw+6)+3;const cols={easy:'#6fb3ff',normal:'#f3e6d0',hard:'#ffb347',hell:'#ff4d5a'};
  X.fillStyle='rgba(14,10,10,.9)';X.fillRect(x,y,cw,ch);X.strokeStyle=cols[k];X.lineWidth=1.5;X.strokeRect(x+0.5,y+0.5,cw-1,ch-1);X.fillStyle=cols[k];X.font=font(22,1);X.fillText(d.jp,x+cw/2,y+30);X.font=font(7,1);X.fillText(d.label.split(' · ')[0].toUpperCase(),x+cw/2,y+42);
  X.fillStyle='rgba(243,230,208,.8)';X.font=font(5);wrapText(X,d.desc,x+cw/2,y+54,cw-10,7);X.textAlign='center';
  X.font=font(5);X.fillStyle='rgba(243,230,208,.6)';X.fillText('foe hp ×'+d.hp+' · dmg ×'+d.dm,x+cw/2,y+ch-22);X.fillText('loot ×'+d.loot+(d.ring?'':' · no ring'),x+cw/2,y+ch-14);
  HOT.push({x,y,w:cw,h:ch,fn:()=>{UI.pendingDiff=k;UI.open=null;startGame(true);}});});
 btn(W/2-40,H-20,80,13,'BACK',()=>{UI.open=null;},{fs:6});}
/* ---------- credits (Ghost of Tsushima style: slow roll, OST) ---------- */
const CREDITS=[['影ノ誓・弐','KAGE NO CHIKAI 2'],['',''],['Directed by','KeiCheong Mai'],['Written by','KeiCheong Mai'],['Game Design','KeiCheong Mai'],['Combat Design','KeiCheong Mai'],['World Design','KeiCheong Mai'],['Pixel Art','KeiCheong Mai'],['Character Art','KeiCheong Mai'],['Animation','KeiCheong Mai'],['Execution Choreography','KeiCheong Mai'],['Programming','KeiCheong Mai'],['Engine','KeiCheong Mai'],['User Interface','KeiCheong Mai'],['Original Soundtrack','KeiCheong Mai'],['Boss Themes','KeiCheong Mai'],['Sound Design','KeiCheong Mai'],['Haptic Design','KeiCheong Mai'],['Story & Dialogue','KeiCheong Mai'],['Japanese Text','KeiCheong Mai'],['Quality Assurance','KeiCheong Mai'],['Producer','KeiCheong Mai'],['Executive Producer','KeiCheong Mai'],['',''],['Cast',''],['Kage','KeiCheong Mai'],['Lord Satō Masanobu','KeiCheong Mai'],['Shōgun Iki Nobutora','KeiCheong Mai'],['The Eight Eagles','KeiCheong Mai'],['The Eight Lords','KeiCheong Mai'],['Everyone else','KeiCheong Mai'],['',''],['Special Thanks','The wind, for guiding'],['','Lake Biwa, for remembering'],['',''],['','He has never knelt again.'],['',''],['','© KeiCheong Mai']];
function startCredits(){UI.open=null;goScene('credits');inputMode='ui';UI.credits={t:0,y:H+10};MUSIC2.play('credits',{fallback:['title'],fade:1.5});
 CREDITS[1]=S.ending==='early'?['ENDING · 誓いの前に','Before the Vow — the story ended early']:S.ending==='unified'?['ENDING · 天下統一','One Japan']:['',''];}
function drawCredits(dt){const c=UI.credits;c.t+=dt;c.y-=dt*11;
 const th=LANDMARKS.start||{x:0,y:0};const a=c.t*0.05;CAM.x=clamp(th.x-W/2+Math.cos(a)*200,0,MAPW*TS-W);CAM.y=clamp(th.y-H/2+Math.sin(a*0.6)*90,0,MAPH*TS-H);
 drawGround(CAM);const out=[];visibleProps(CAM,out);out.sort((p,q)=>p.y-q.y);out.forEach(p=>drawProp(p,CAM,0.7));DAY.t=0.76;drawDayTint();drawLights(out);
 for(let i=0;i<24;i++){const x=(i*97+c.t*18)%W,y=(i*53+c.t*12)%H;G.fillStyle='#f2b8c6';G.fillRect(Math.round(x),Math.round(y),2,2);}
 G.fillStyle='rgba(5,2,3,.5)';G.fillRect(0,0,W,H);G.fillStyle='#0a0708';G.fillRect(0,0,W,H*0.1);G.fillRect(0,H*0.9,W,H*0.1);
 X.clearRect(0,0,W,H);HOT=[];X.textAlign='center';let y=c.y;
 CREDITS.forEach(([role,name],i)=>{if(i===0){X.font=font(22,1);X.fillStyle='#f3e6d0';X.lineWidth=4;X.strokeStyle='rgba(0,0,0,.7)';X.strokeText(role,W/2,y);X.fillText(role,W/2,y);X.font=font(8,1);X.fillStyle='#b8242a';X.fillText(name,W/2,y+12);y+=40;return;}
  if(role==='Cast'){X.font=font(10,1);X.fillStyle='#ffd27a';X.fillText('— CAST —',W/2,y);y+=22;return;}
  if(!role&&!name){y+=14;return;}
  if(i===1){X.font=font(8,1);X.fillStyle='#ffd27a';X.fillText(role,W/2,y);X.font=font(6);X.fillStyle='rgba(243,230,208,.75)';X.fillText(name,W/2,y+10);y+=28;return;}
  if(role){X.font=font(6);X.fillStyle='rgba(243,230,208,.65)';X.fillText(role.toUpperCase(),W/2,y);}
  if(name){X.font=font(9,1);X.fillStyle='#f3e6d0';X.lineWidth=3;X.strokeStyle='rgba(0,0,0,.6)';X.strokeText(name,W/2,y+11);X.fillText(name,W/2,y+11);}y+=26;});
 if(y<H*0.1-20){c.y=H+10;}
 X.font=font(5);X.fillStyle='rgba(243,230,208,.5)';X.fillText('tap to return',W/2,H-4);HOT.push({x:0,y:0,w:W,h:H,fn:()=>{goScene(S.play>5||HAS_SAVE?'title':'title');inputMode='ui';MUSIC2.play('title',{fallback:[]});},silent:1});}
/* ---------- fade helper ---------- */
const FADE={t:0,to:null,col:'#0a0708'};
function updateFade(dt){if(FADE.t<=0)return;FADE.t+=dt*2.2;if(FADE.t>=1&&FADE.to){const f=FADE.to;FADE.to=null;f();}if(FADE.t>=2){FADE.t=0;}}
function drawFade(){if(FADE.t<=0)return;const a=FADE.t<1?FADE.t:2-FADE.t;G.fillStyle=FADE.col;G.globalAlpha=clamp(a,0,1);G.fillRect(0,0,W,H);G.globalAlpha=1;}
