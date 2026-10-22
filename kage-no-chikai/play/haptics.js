'use strict';
/* ============================================================================
   HAP — a small haptic language for the duel games.
   Uses the native AndroidHaptics bridge (amplitude-controlled waveforms, API 26+)
   when the game runs inside the app shell, and falls back to navigator.vibrate
   on/off patterns on the web. Every game event has a named pattern so the feel
   is consistent: parries feel crisp and bright, hits taken feel heavy, warnings
   feel urgent, menus feel like paper.
   ========================================================================== */
const HAP=(()=>{
 const N=(typeof window!=='undefined'&&window.AndroidHaptics)||null;
 let avail=false,amp=false;
 try{avail=N?!!N.available():!!(navigator.vibrate);amp=N?!!N.hasAmplitudeControl():false;}catch(e){}
 const S={on:true,strength:1.0};            // settings (persisted by the game)
 // timings in ms (alternating vibrate/pause as given by amplitude 0 entries), amplitudes 0..255
 const PAT={
  tick:        [[12],[90]],
  tap:         [[10],[70]],
  swipe:       [[9],[60]],
  windup:      [[8],[50]],
  warn:        [[26,50,26,50,34],[210,0,210,0,230]],       // unblockable incoming
  feint:       [[11,36,11],[170,0,170]],
  block:       [[30],[140]],
  blockBreak:  [[20,30,70],[220,0,255]],
  parry:       [[20,18,22],[190,0,130]],
  parryGreat:  [[28,22,36],[235,0,190]],
  parryPerfect:[[12,14,44,36,30],[255,0,255,0,120]],
  parryBreak:  [[18,26,70,30,110],[255,0,255,0,170]],
  counter:     [[30,20,40],[255,0,200]],
  hit:         [[15],[140]],
  hitAlt:      [[13,10,13],[150,0,110]],
  crit:        [[22,18,26],[230,0,170]],
  combo:       [[10,26,10,26,22],[120,0,130,0,210]],
  hurt:        [[70,40,55],[255,0,120]],
  hurtHeavy:   [[90,40,70,40,45],[255,0,210,0,110]],
  dodge:       [[14,28,14],[120,0,80]],
  dodgeBreak:  [[18,26,18,26,60],[200,0,200,0,255]],
  phase2:      [[120,60,210],[255,0,255]],
  magic:       [[40,30,80,30,130],[140,0,200,0,255]],
  superHit:    [[60,40,60,40,170],[255,0,255,0,255]],
  victory:     [[40,60,40,60,130],[180,0,180,0,255]],
  death:       [[220,80,170,80,120,80,80],[255,0,200,0,140,0,80]],
  heartbeat:   [[36,70,58],[150,0,220]],
  equip:       [[10,40,16],[120,0,200]],
  unlock:      [[12,30,12,30,44],[120,0,120,0,220]],
  buy:         [[14,30,30],[150,0,230]],
  page:        [[8],[50]],
  choice:      [[14,30,14],[110,0,160]],
  levelUp:     [[20,40,20,40,20,40,90],[120,0,160,0,200,0,255]],
 };
 function clampA(a){return Math.max(0,Math.min(255,Math.round(a*S.strength)));}
 function fallback(ts,as){ // on/off pattern: shorten "on" segments for low amplitudes so light taps feel lighter
  const out=[];for(let i=0;i<ts.length;i++){const a=as?as[i]:255;out.push(a>0?Math.max(5,Math.round(ts[i]*(0.45+0.55*clampA(a)/255))):ts[i]);}return out;}
 function wave(ts,as){if(!S.on||!avail)return;try{
  if(N){N.waveform(ts.join(','),as?as.map(clampA).join(','):'');}
  else if(navigator.vibrate){navigator.vibrate(fallback(ts,as));}}catch(e){}}
 function play(name,mul){const p=PAT[name];if(!p)return;if(mul&&mul!==1){wave(p[0],p[1].map(a=>a*mul));}else wave(p[0],p[1]);}
 function one(ms,a){if(!S.on||!avail)return;try{if(N)N.oneShot(ms,clampA(a==null?200:a));else if(navigator.vibrate)navigator.vibrate(Math.max(5,ms));}catch(e){}}
 function stop(){try{if(N)N.cancel();else if(navigator.vibrate)navigator.vibrate(0);}catch(e){}}
 // legacy adapter so old buzz(x) calls keep working but go through the strength setting
 function raw(p){if(!S.on||!avail)return;try{if(Array.isArray(p)){const ts=p,as=p.map((v,i)=>i%2?0:200);wave(ts,as);}else one(p,200);}catch(e){}}
 return {play,one,stop,raw,set:o=>Object.assign(S,o),get S(){return S},native:!!N,amp,avail,PAT};
})();
