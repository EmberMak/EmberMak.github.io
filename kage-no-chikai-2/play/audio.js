'use strict';
/* ============================================================================
   AUDIO — sample SFX (sfx/*.ogg|wav), synthesized instruments & foley, and
   MUSIC2: the original soundtrack manager (music/tracks.json → named OGG tracks,
   cross-fades, region themes, per-boss themes, ducking under dialogue).
   ========================================================================== */
const SFX=['hit1.ogg','hit2.ogg','hurt.ogg','block.ogg','parry.ogg','perfect.ogg','swish1.wav','swish2.wav','windup.wav','pain1.wav','pain2.wav','die.wav','fire.wav','super.ogg','victory.ogg','dodge.ogg'];
let AC=null,MG=null,SFXG=null;const BUF={};
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
 MG=AC.createGain();MG.gain.value=S.set.vol;MG.connect(AC.destination);SFXG=AC.createGain();SFXG.gain.value=1;SFXG.connect(MG);
 SFX.forEach(f=>{const n=f.split('.')[0];fetch('sfx/'+f).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(d=>{BUF[n]=d;}).catch(()=>{});});
 if(AC.state==='suspended')AC.resume().catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(!AC)return;if(document.hidden)AC.suspend().catch(()=>{});else AC.resume().catch(()=>{});});
function play(n,vol=1,rate=1){if(!AC||!BUF[n])return;try{const s=AC.createBufferSource(),g=AC.createGain();s.buffer=BUF[n];s.playbackRate.value=rate;g.gain.value=vol;s.connect(g).connect(SFXG);s.start();}catch(e){}}
let NOISE=null;function noiseBuf(){if(!NOISE){const len=AC.sampleRate*2;NOISE=AC.createBuffer(1,len,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}return NOISE;}
const rnd=(a,b)=>a+Math.random()*(b-a);
function taiko(vol=0.6,f=95,when=0){if(!AC)return;const t=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f*0.5,t+0.35);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.5);o.connect(g).connect(SFXG);o.start(t);o.stop(t+0.55);
 const n=AC.createBufferSource(),ng=AC.createGain(),bp=AC.createBiquadFilter();n.buffer=noiseBuf();bp.type='bandpass';bp.frequency.value=900;ng.gain.setValueAtTime(vol*0.5,t);ng.gain.exponentialRampToValueAtTime(0.0001,t+0.08);n.connect(bp).connect(ng).connect(SFXG);n.start(t);n.stop(t+0.1);}
function steel(vol=0.35,p=1){if(!AC)return;const t=AC.currentTime;[2120,3310,4870,6230].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=i%2?'triangle':'sine';o.frequency.value=f*p*rnd(.98,1.02);g.gain.setValueAtTime(vol/(i+1),t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.5+i*0.15);o.connect(g).connect(SFXG);o.start(t);o.stop(t+1.2);});}
function shaku(f,dur=2.2,vol=0.05){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),v=AC.createOscillator(),vg=AC.createGain();o.type='sine';o.frequency.setValueAtTime(f*0.97,t);o.frequency.linearRampToValueAtTime(f,t+0.25);
 v.frequency.value=5.5;vg.gain.value=f*0.012;v.connect(vg).connect(o.frequency);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.4);g.gain.setValueAtTime(vol,t+dur*0.6);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 const n=AC.createBufferSource(),ng=AC.createGain(),bp=AC.createBiquadFilter();n.buffer=noiseBuf();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=8;ng.gain.value=vol*0.35;n.connect(bp).connect(ng).connect(SFXG);n.start(t);n.stop(t+dur);
 o.connect(g).connect(SFXG);o.start(t);v.start(t);o.stop(t+dur+0.1);v.stop(t+dur+0.1);}
function pluck(f=293.7,vol=0.12,dur=0.6){if(!AC)return;const t=AC.currentTime;[1,2,3].forEach((h,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=i?'sine':'triangle';o.frequency.value=f*h;g.gain.setValueAtTime(vol/(h*h),t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur/(1+i*0.5));o.connect(g).connect(SFXG);o.start(t);o.stop(t+dur);});}
function chime(f=880,vol=0.12,dur=1.6){if(!AC)return;const t=AC.currentTime;[1,2.76,5.4].forEach((h,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f*h;g.gain.setValueAtTime(vol/(i+1)/2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur/(1+i*0.4));o.connect(g).connect(SFXG);o.start(t);o.stop(t+dur);});}
function coin(vol=0.1){if(!AC)return;const t=AC.currentTime;[1760,2217].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(vol*0.4,t+i*0.06);g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.06+0.18);o.connect(g).connect(SFXG);o.start(t+i*0.06);o.stop(t+i*0.06+0.2);});}
function squelch(vol=0.5){if(!AC)return;const t=AC.currentTime;const n=AC.createBufferSource(),g=AC.createGain(),lp=AC.createBiquadFilter();n.buffer=noiseBuf();lp.type='lowpass';lp.frequency.setValueAtTime(1800,t);lp.frequency.exponentialRampToValueAtTime(200,t+0.25);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.3);n.connect(lp).connect(g).connect(SFXG);n.start(t);n.stop(t+0.32);
 const o=AC.createOscillator(),og=AC.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(40,t+0.25);og.gain.setValueAtTime(vol*0.8,t);og.gain.exponentialRampToValueAtTime(0.0001,t+0.3);o.connect(og).connect(SFXG);o.start(t);o.stop(t+0.32);}
function crack(vol=0.5){if(!AC)return;const t=AC.currentTime;const n=AC.createBufferSource(),g=AC.createGain(),hp=AC.createBiquadFilter();n.buffer=noiseBuf();hp.type='highpass';hp.frequency.value=2500;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);n.connect(hp).connect(g).connect(SFXG);n.start(t);n.stop(t+0.06);
 const o=AC.createOscillator(),og=AC.createGain();o.type='square';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(90,t+0.06);og.gain.setValueAtTime(vol*0.4,t);og.gain.exponentialRampToValueAtTime(0.0001,t+0.08);o.connect(og).connect(SFXG);o.start(t);o.stop(t+0.1);}
function thud(vol=0.5){if(!AC)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(30,t+0.2);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.25);o.connect(g).connect(SFXG);o.start(t);o.stop(t+0.3);}
function step(vol=0.08,soft){if(!AC)return;const t=AC.currentTime;const n=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();n.buffer=noiseBuf();bp.type='bandpass';bp.frequency.value=soft?500:900;bp.Q.value=1.2;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+(soft?0.08:0.05));n.connect(bp).connect(g).connect(SFXG);n.start(t);n.stop(t+0.1);}
function hoof(vol=0.1){if(!AC)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(70,t+0.05);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.07);o.connect(g).connect(SFXG);o.start(t);o.stop(t+0.08);}
function whoosh(vol=0.25,dur=0.5,up){if(!AC)return;const t=AC.currentTime;const n=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();n.buffer=noiseBuf();bp.type='bandpass';bp.Q.value=2;bp.frequency.setValueAtTime(up?300:1800,t);bp.frequency.exponentialRampToValueAtTime(up?1800:300,t+dur);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*0.3);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);n.connect(bp).connect(g).connect(SFXG);n.start(t);n.stop(t+dur+0.05);}
let blipSeed=0;function blip(ch){if(!AC||S.set.vol<=0)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=160+((ch.charCodeAt(0)*7+blipSeed)%40);o.type='triangle';o.frequency.setValueAtTime(f*2,t);o.frequency.exponentialRampToValueAtTime(f,t+0.05);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.05,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+0.07);o.connect(g).connect(SFXG);o.start(t);o.stop(t+0.08);}
/* wind loop (guiding wind / eclipse) */
let windNode=null,windGain=null;
function windLevel(v){if(!AC)return;if(!windNode){windNode=AC.createBufferSource();windNode.buffer=noiseBuf();windNode.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=420;bp.Q.value=0.7;windGain=AC.createGain();windGain.gain.value=0;windNode.connect(bp).connect(windGain).connect(SFXG);windNode.start();
  const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=0.23;lg.gain.value=180;lfo.connect(lg).connect(bp.frequency);lfo.start();}
 windGain.gain.setTargetAtTime(v,AC.currentTime,0.4);}
function setVol(v){S.set.vol=v;if(MG)MG.gain.value=v;save();}
/* ---------- MUSIC2: the soundtrack ---------- */
const MUSIC2=(()=>{
 const tracks={};let list=null,cur=null,curName=null,vol=S.set.mus,fades=[],duck=1,probed=false,pending=null,sfxMode=false;
 function probe(){if(probed)return;probed=true;fetch('music/tracks.json').then(r=>r.ok?r.json():null).then(j=>{list=j||{};if(pending){const p=pending;pending=null;play(p.n,p.o);}}).catch(()=>{list={};});}
 function get(n){if(!list||!list[n])return null;let a=tracks[n];if(!a){a=new Audio('music/'+list[n]);a.loop=true;a.preload='auto';tracks[n]=a;}return a;}
 /** play a named track (title, explore_*, town, duel, boss_*, eclipse, credits, …). Falls back along a chain. */
 function play(n,o){o=o||{};probe();if(!list){pending={n,o};return;}
  const chain=[n].concat(o.fallback||[]);let key=null;for(const k of chain){if(list[k]){key=k;break;}}
  if(!key){if(cur)stop();curName=n;return;}
  if(key===curName&&cur)return;
  if(cur){const old=cur;fades.push({a:old,from:old.volume,to:0,t:0,l:o.fade||1.2,done:()=>{try{old.pause();}catch(e){}}});}
  const a=get(key);cur=a;curName=key;if(!a)return;a.loop=o.loop!==false;try{a.currentTime=0;a.volume=0;const p=a.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}
  fades.push({a,from:0,to:1,t:0,l:o.fade||1.2});}
 function update(dt){for(let i=fades.length-1;i>=0;i--){const f=fades[i];f.t+=dt;const k=Math.min(1,f.t/f.l);const v=f.from+(f.to-f.from)*k;try{f.a.volume=clamp(v*(f.a===cur?vol*duck:1),0,1);}catch(e){}if(k>=1){if(f.done)f.done();fades.splice(i,1);}}
  if(cur&&!fades.some(f=>f.a===cur)){try{cur.volume=clamp(vol*duck,0,1);}catch(e){}}}
 function stop(o){if(cur){const old=cur;fades.push({a:old,from:old.volume,to:0,t:0,l:(o&&o.fade)||1.0,done:()=>{try{old.pause();}catch(e){}}});cur=null;curName=null;}}
 function setVol(v){vol=v;S.set.mus=v;save();}
 function setDuck(d){duck=d;}
 return {play,stop,update,setVol,setDuck,probe,get name(){return curName},get has(){return !!(list&&Object.keys(list).length)},get list(){return list}};
})();
