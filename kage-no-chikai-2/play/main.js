'use strict';
/* ============================================================================
   MAIN — boot (art → world → NPCs), the frame loop, world rendering, scenes.
   ========================================================================== */
const bootBar=document.getElementById('bootbar'),bootMsg=document.getElementById('bootmsg'),bootEl=document.getElementById('boot');
function setBoot(p,msg){try{bootBar.style.width=Math.round(p*100)+'%';if(msg)bootMsg.textContent=msg;}catch(e){}}
function boot(){setBoot(0.02,'drawing the land…');buildArt();setBoot(0.05,'raising the islands…');
 const gen=genWorld();const step=()=>{let r,n=0;const t0=performance.now();do{r=gen.next();n++;}while(!r.done&&performance.now()-t0<40);
  if(!r.done){const p=0.05+r.value*0.85;setBoot(p,p<0.4?'raising the islands…':p<0.55?'naming the provinces…':p<0.75?'building castles, shrines and villages…':p<0.85?'laying the roads…':'planting forests…');requestAnimationFrame(step);return;}
  setBoot(0.92,'waking the people…');setTimeout(()=>{spawnWorldNpcs();spawnStoryNpcs();initPlayer();setBoot(1,'');setTimeout(()=>{bootEl.style.opacity='0';setTimeout(()=>{bootEl.style.display='none';},700);goScene('title');inputMode='ui';MUSIC2.probe();MUSIC2.play('title',{fallback:[]});requestAnimationFrame(frame);},150);},30);};
 requestAnimationFrame(step);}
function startGame(fresh){if(fresh){wipeSave();if(UI.pendingDiff){S.diff=UI.pendingDiff;UI.pendingDiff=null;}S.px=LANDMARKS.estateGate.x;S.py=LANDMARKS.estateGate.y+8;}initPlayer();UI.open=null;UI.confirmNew=false;goScene('world');inputMode='world';worldButtons();ambientMusic(true);
 if(fresh||S.quest===0&&!S.flags.prologueDone){S.flags.prologueDone=1;setTimeout(()=>{if(S.quest===0)playStoryCut('prologue',()=>{toast('Drag on the left half to walk · 話 talk / trade / challenge · 図 map · 袋 bag','#9fe3ff');});},400);}
 else{const st=curStep();if(st)toast('目的 · '+st.title+' — '+st.text,'#ffe9c0');}}
/* ---------- music by place ---------- */
function regionMusic(R){if(!R)return 'explore_kansai';const g={yamashiro:'kansai',omi:'kansai',yamato:'kansai',settsu:'kansai',iga:'kansai',kii:'kansai',ise:'kansai',mino:'kansai',owari:'kansai',harima:'kansai',tanba:'tanba',echizen:'north',bitchu:'west',aki:'west',nagato:'west',sanuki:'shikoku',tosa:'shikoku',chikuzen:'kyushu',higo:'kyushu',satsuma:'kyushu',shinano:'mountain',kai:'mountain',sagami:'kanto',musashi:'kanto',echigo:'north',dewa:'north',mutsu:'north',tsugaru:'north',ezo:'ezo',kitaezo:'ezo'};return 'explore_'+(g[R.id]||'kansai');}
function ambientMusic(force){if(SCENE.cur!=='world')return;if(ECLIPSE.on){MUSIC2.play('eclipse',{fallback:['duel']});return;}const nt=nearestTown(PL.x,PL.y);let key=regionMusic(PL.region);
 if(nt.t&&nt.d<130){if(nt.t.kind==='shrine'||nt.t.kind==='temple')key='shrine';else if(nt.t.kind==='castle'||nt.t.kind==='fort')key=nt.t.kind==='fort'?'fortress':'castle';else key='town';}
 if(nightAmount()>0.6&&key.startsWith('explore'))key='night';MUSIC2.play(key,{fallback:[regionMusic(PL.region),'explore_kansai','title']});}
window.onRegionEnter=function(R){ambientMusic(true);};
let musicT=0;
/* ---------- world rendering ---------- */
function drawWorld(){const night=nightAmount();drawGround(CAM);drawWorldFx();drawDrops();
 const out=[];visibleProps(CAM,out);const dr=out.map(p=>({y:p.y,draw:()=>drawProp(p,CAM,night)}));collectDrawables(dr);dr.sort((a,b)=>a.y-b.y);for(const d of dr)d.draw();
 drawWind();drawWeather();drawDayTint();drawLights(out);drawFade();
 if(CUT.letter||CUT.fade>0){if(CUT.letter){G.fillStyle='#0a0708';G.fillRect(0,0,W,H*0.1);G.fillRect(0,H*0.9,W,H*0.1);}if(CUT.fade>0){G.fillStyle='rgba(10,7,8,'+CUT.fade+')';G.fillRect(0,0,W,H);}}}
/* ---------- loop ---------- */
let last=performance.now(),acc=0;
function frame(now){requestAnimationFrame(frame);let dt=(now-last)/1000;last=now;if(dt>0.1)dt=0.1;T+=dt;SCENE.t+=dt;
 try{window.perfTick(dt,SCENE.cur==='world'||SCENE.cur==='duel');}catch(e){}
 MUSIC2.update(dt);updateFade(dt);
 try{
  if(SCENE.cur==='title'){HOT=[];drawTitle(dt);if(UI.open==='settings'){drawSettings();}else if(UI.open==='diff'){HOT=[];drawDiffPick();}for(const p of consumeTaps()){hotTap(p);}return;}
  if(SCENE.cur==='credits'){drawCredits(dt);for(const p of consumeTaps()){hotTap(p);}return;}
  if(SCENE.cur==='duel'){if(UI.open){duelDraw();HOT=[];if(UI.open==='pause')drawPause();else if(UI.open==='settings')drawSettings();for(const p of consumeTaps()){if(p.esc){closeUI();continue;}hotTap(p);}return;}duelUpdate(dt);duelDraw();return;}
  // ---- world ----
  HOT=[];updateDay(dt);updateWorldFx(dt);FX.update(dt);musicT+=dt;if(musicT>4){musicT=0;ambientMusic();}
  if(CUT.on){cutUpdate(dt);updateNpcs(dt);}
  else if(DLG.active()){DLG.update(dt);}
  else if(UI.open){}
  else{updatePlayer(dt);updateNpcs(dt);updateWind(dt);checkQuest(dt);const tg=questTarget();if(tg&&tg.reached&&!questDone()&&curStep().kind==='cut'&&!FADE.t){playStoryCut(curStep().id);}}
  updateWeather(dt);
  if(CUT.on&&CUT.camLock){const tx=CUT.camLock.x-W/2,ty=CUT.camLock.y-H/2;CAM.x+=(tx-CAM.x)*Math.min(1,dt*4);CAM.y+=(ty-CAM.y)*Math.min(1,dt*4);}
  if(CAM.shake>0){CAM.shake=Math.max(0,CAM.shake-dt*20);}
  G.save();if(CAM.shake>0&&!window.LITE)G.translate(Math.round((Math.random()-0.5)*CAM.shake),Math.round((Math.random()-0.5)*CAM.shake));drawWorld();G.restore();
  // overlay
  if(UI.open){X.clearRect(0,0,W,H);if(UI.open==='npc')drawNpcMenu();else if(UI.open==='inv')drawInventory();else if(UI.open==='shop')drawShop();else if(UI.open==='map')drawMap();else if(UI.open==='pause')drawPause();else if(UI.open==='settings')drawSettings();
   for(const p of consumeTaps()){if(p.esc){if(UI.open==='settings')openUI('pause');else closeUI();continue;}hotTap(p);}
   if(UI.open==='map')mapDrag();return;}
  drawWorldHud();
  if(DLG.active()){DLG.draw(X,W,H,1);for(const p of consumeTaps()){if(p.esc){DLG.skip();continue;}DLG.tap(p);}return;}
  X.save();FX.draw(X,1,font);X.restore();
  for(const p of consumeTaps()){if(p.esc){openUI('pause');continue;}if(hotTap(p))continue;}
 }catch(e){reportError(e);}}
function mapDrag(){const ids=Object.keys(IN.ptr);if(ids.length===1){const q=IN.ptr[ids[0]];if(q.btn)return;if(!UI.dragging){UI.dragging=true;UI.dragX=q.x;UI.dragY=q.y;}else{UI.mapX+=q.x-UI.dragX;UI.mapY+=q.y-UI.dragY;UI.dragX=q.x;UI.dragY=q.y;}}else UI.dragging=false;}
/* ---------- android hooks ---------- */
window.onAndroidBack=function(){if(SCENE.cur==='title'){if(UI.open){UI.open=null;return true;}return false;}if(UI.open){if(UI.open==='settings')openUI('pause');else closeUI();return true;}if(DLG.active()){DLG.skip();return true;}if(SCENE.cur==='duel'){openPause();return true;}openUI('pause');return true;};
window.onAndroidPause=function(){save();try{if(AC)AC.suspend();}catch(e){}};
window.onAndroidResume=function(){try{if(AC)AC.resume();}catch(e){}};
addEventListener('beforeunload',()=>save());setInterval(()=>{if(SCENE.cur==='world')save();},20000);
window.onLiteSwitch=function(){S.set.fx='lite';save();toast('Lite effects enabled for smoother play','#ffe9c0');};
window.onResized=function(){if(SCENE.cur==='world'&&!UI.open)worldButtons();if(SCENE.cur==='duel')duelButtons();};
/* ---------- test hooks ---------- */
window.__K2={get S(){return S},get PL(){return PL},get E(){return E},get P(){return P},get ST(){return ST},get NPCS(){return NPCS},get D(){return D},get CUT(){return CUT},startDuel,startGame,goScene,openUI,closeUI,teleportTo,questTarget,curStep,advanceStep,playStoryCut,TOWNS,WAYPOINTS,LANDMARKS,REGIONS,get UI(){return UI},DLG,startCredits,startEclipse,genWeapon,RNG,CHARS,BOSSES,STEPS,get HOT(){return HOT},tap:(x,y)=>IN.taps.push({x,y}),swipe:(dx,dy)=>IN.swipes.push({dx,dy}),hold:(id,v)=>{IN.hold[id]=v;},stick:(dx,dy)=>{IN.stick.dx=dx;IN.stick.dy=dy;IN.stick.mag=Math.hypot(dx,dy);},press:(id)=>{const b=BTN_DEFS.find(b=>b.id===id);if(b&&b.down)b.down({x:b.x,y:b.y});},jump:playerJump,get CUTQ(){return CUT.q},onStoryDeath,checkQuest,killNpc};
boot();
