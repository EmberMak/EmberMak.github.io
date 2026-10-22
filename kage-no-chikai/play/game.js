'use strict';
/* 影ノ誓 KAGE NO CHIKAI — Oath of the Shadow. A 2D shadow-duel spin-off of the ASHBORN demo. All art procedural. */
const cv=document.getElementById('c'),cx=cv.getContext('2d');
let W=0,H=0,DPR=1,U=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR|0;cv.height=H*DPR|0;cx.setTransform(DPR,0,0,DPR,0,0);U=Math.min(W,H)/400;}
addEventListener('resize',resize);resize();
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2;
// legacy buzz(): routed through the haptic engine (HAP) so strength/off settings apply everywhere
const buzz=p=>{try{HAP.raw(p)}catch(e){try{navigator.vibrate&&navigator.vibrate(p)}catch(e2){}}};
const hap=(n,m)=>{try{HAP.play(n,m)}catch(e){}};
const FJ="'KageSerif','Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','Noto Serif CJK JP','Source Han Serif JP',serif";
const font=(px,b)=>(b?'bold ':'')+(px|0)+'px '+FJ;

/* ---------- save ---------- */
const SAVE_KEY='kage_save_v2';
let SV={cleared:0,weapons:['katana'],equip:'katana',tensei:0,xp:0,mon:0,best:0,diff:'normal',gear:{hat:'kasa',body:'none',cloak:'scarf',charm:'none'},gearOwned:[],
 set:{hap:2,vol:0.9,ring:1,slow:1,fx:'auto'},tot:{parries:0,perfect:0,dodges:0,wins:0,hits:0,counters:0},ending:null,seenPro:false,seenB2:false,book:1,seenCh:{}};let SURV=null;
try{const L=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');const d=SV;Object.assign(SV,L);SV.gear=Object.assign({},d.gear,L.gear||{});SV.set=Object.assign({},d.set,L.set||{});SV.tot=Object.assign({},d.tot,L.tot||{});SV.seenCh=L.seenCh||{};if(L.cleared>0)SV.seenPro=true;}catch(e){}
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(SV))}catch(e){}};
try{HAP.set({on:SV.set.hap>0,strength:[0,0.6,1,1.4][SV.set.hap]||1});setQuality(SV.set.fx||'auto');}catch(e){}

/* ---------- audio: CC0/CC-BY samples + generated taiko, steel, shakuhachi ---------- */
const SFX=['hit1.ogg','hit2.ogg','hurt.ogg','block.ogg','parry.ogg','perfect.ogg','swish1.wav','swish2.wav','windup.wav','pain1.wav','pain2.wav','die.wav','fire.wav','super.ogg','victory.ogg','dodge.ogg'];
let AC=null,MG=null;const BUF={};
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return}
 MG=AC.createGain();MG.gain.value=SV.set.vol;MG.connect(AC.destination);
 SFX.forEach(f=>fetch('sfx/'+f).then(r=>r.arrayBuffer()).then(a=>AC.decodeAudioData(a)).then(b=>BUF[f.split('.')[0]]=b).catch(()=>{}));ambience();}
function play(n,vol=1,rate=1){if(!AC||!BUF[n])return;const s=AC.createBufferSource(),g=AC.createGain();s.buffer=BUF[n];s.playbackRate.value=rate;g.gain.value=vol;s.connect(g).connect(MG);s.start();}
let NOISE=null;function noise(){if(!NOISE){const len=AC.sampleRate*2;NOISE=AC.createBuffer(1,len,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}return NOISE;}
function taiko(vol=0.6,f=95,when=0){if(!AC)return;const t=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f*0.5,t+0.35);
 g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+0.6);o.connect(g).connect(MG);o.start(t);o.stop(t+0.65);
 const n=AC.createBufferSource();n.buffer=noise();const bq=AC.createBiquadFilter();bq.type='lowpass';bq.frequency.value=900;const ng=AC.createGain();ng.gain.setValueAtTime(vol*0.5,t);ng.gain.exponentialRampToValueAtTime(0.0001,t+0.12);n.connect(bq).connect(ng).connect(MG);n.start(t);n.stop(t+0.15);}
function steel(vol=0.35,p=1){if(!AC)return;const t=AC.currentTime;[2120,3310,4870,6230].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=i%2?'triangle':'sine';o.frequency.value=f*p*rnd(.98,1.02);g.gain.setValueAtTime(vol/(i+1),t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.5+i*0.15);o.connect(g).connect(MG);o.start(t);o.stop(t+1.2);});}
function shaku(f,dur=2.2,vol=0.05){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),v=AC.createOscillator(),vg=AC.createGain();o.type='sine';o.frequency.setValueAtTime(f*0.97,t);o.frequency.linearRampToValueAtTime(f,t+0.25);
 v.frequency.value=5;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*0.012,t+dur*0.6);v.connect(vg).connect(o.frequency);
 g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.35);g.gain.setValueAtTime(vol,t+dur*0.6);g.gain.linearRampToValueAtTime(0.0001,t+dur);
 const n=AC.createBufferSource();n.buffer=noise();n.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=4;const ng=AC.createGain();ng.gain.value=0.5;
 n.connect(bp).connect(ng).connect(g);o.connect(g).connect(MG);[o,v,n].forEach(x=>{x.start(t);x.stop(t+dur+0.1)});}
const INSCALE=[146.8,155.6,196,220,233.1,293.7,311.1,392,440];
function setVol(v){SV.set.vol=v;if(MG)MG.gain.value=v;try{MUSIC.setVol(v);}catch(e){}save();}
// dialogue "voice": a tiny plucked tone per two characters, pitched per speaker
let blipSeed=0;function blip(ch){if(!AC||SV.set.vol<=0)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=160+((ch.charCodeAt(0)*7+blipSeed)%40);o.type='triangle';o.frequency.setValueAtTime(f*2,t);o.frequency.exponentialRampToValueAtTime(f,t+0.05);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.06,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+0.07);o.connect(g).connect(MG);o.start(t);o.stop(t+0.08);}
// koto-like pluck for menus / stamps
function pluck(f=293.7,vol=0.12,dur=0.6){if(!AC)return;const t=AC.currentTime;[1,2,3].forEach((h,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=i?'sine':'triangle';o.frequency.value=f*h;g.gain.setValueAtTime(vol/(h*h),t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur/(1+i*0.5));o.connect(g).connect(MG);o.start(t);o.stop(t+dur);});}
function ambience(){const g=AC.createGain();g.gain.value=0.035;g.connect(MG);
 [73.4,110,146.8].forEach((f,i)=>{const o=AC.createOscillator();o.type='sine';o.frequency.value=f;const og=AC.createGain();og.gain.value=i?0.3:0.6;o.connect(og).connect(g);o.start();});
 const n=AC.createBufferSource();n.buffer=noise();n.loop=true;const bq=AC.createBiquadFilter();bq.type='bandpass';bq.frequency.value=500;bq.Q.value=0.6;const ng=AC.createGain();ng.gain.value=0.9;
 const lfo=AC.createOscillator();lfo.frequency.value=0.08;const lg=AC.createGain();lg.gain.value=0.6;lfo.connect(lg).connect(ng.gain);lfo.start();n.connect(bq).connect(ng).connect(g);n.start();}
let musT=0,drumT=0,drumStep=0;
function music(dt){if(!AC||MUSIC.active)return;musT-=dt;if(musT<=0){musT=rnd(2.5,5.5);if(scene!=='fight'||Math.random()<0.5){const f=INSCALE[Math.random()*INSCALE.length|0];shaku(f,rnd(1.6,3),scene==='fight'?0.03:0.05);if(Math.random()<.4)setTimeout(()=>shaku(INSCALE[Math.random()*INSCALE.length|0],1.5,0.035),900);}}
 if(scene==='fight'&&E&&!E.dead){drumT-=dt;const fast=E.hp<E.max*0.35;if(drumT<=0){const pat=[1,0,0.5,0,1,0.6,0,0.4];const v=pat[drumStep%8];if(v)taiko((fast?0.22:0.13)*v,drumStep%4?120:80);drumStep++;drumT=fast?0.22:0.32;}}}

/* ---------- directions (screen space) 0=→ 1=↘ 2=↓ 3=↙ 4=← 5=↖ 6=↑ 7=↗ ---------- */
const DV=[...Array(8)].map((_,i)=>[Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)]);
const dirOf=(dx,dy)=>((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;

/* ---------- content ---------- */
function A(name,jp,dir,wind,dmg,o={}){return Object.assign({name,jp,dir,wind,dmg},o);}
// ===== Kage no Chikai v2 — data =====
const W2_OLD = {
  katana:    {name:'Katana', jp:'刀', dmg:16, spd:330, rec:230, combo:3, intr:.35, gb:0,   len:72, price:0,   desc:'Balanced. Three-cut combo.'},
  kodachi:   {name:'Twin Kodachi', jp:'二刀小太刀', dmg:8, spd:200, rec:150, combo:5, intr:.18, gb:0, len:46, price:220, desc:'Very fast five-hit flurry. Light damage.'},
  nodachi:   {name:'Nodachi', jp:'野太刀', dmg:33, spd:560, rec:420, combo:2, intr:.55, gb:.5, len:104, price:320, desc:'Slow, heavy two-cut. Half chance to break guard.'},
  yari:      {name:'Yari', jp:'槍', dmg:15, spd:360, rec:260, combo:3, intr:.65, gb:0, len:132, price:260, desc:'Long reach. Best at stopping wind-ups.'},
  kusarigama:{name:'Kusarigama', jp:'鎖鎌', dmg:12, spd:290, rec:220, combo:4, intr:.45, gb:0, len:90, price:300, wrap:.35, desc:'Chain-sickle. 35% of hits slip past a guard.'},
  kanabo:    {name:'Kanabō', jp:'金棒', dmg:46, spd:720, rec:560, combo:1, intr:.75, gb:1, len:80, price:400, desc:'Very heavy. Every hit breaks guard.'},
  tessen:    {name:'Tessen', jp:'鉄扇', dmg:8, spd:250, rec:180, combo:4, intr:.2, gb:0, len:36, price:240, parry:1.7, desc:'Iron fan. Much wider parry window, longer parry stun.'},
  tanto:     {name:'Tantō', jp:'短刀', dmg:7, spd:180, rec:140, combo:6, intr:.12, gb:0, len:30, price:160, crit:2.6, desc:'Six quick stabs. x2.6 damage on stunned foes.'},
};
const W2ORDER_OLD = ['katana','kodachi','yari','kusarigama','nodachi','kanabo','tessen','tanto'];

// pattern weights: s=strike c=combo f=feint d=delayed u=unblockable g=counter-guard
function PW(s,c,f,d,u,g){return {s,c,f,d,u,g};}
const FOES = {
 // minors
 ronin:   {name:'Ronin', jp:'浪人', wpn:'katana', look:{hat:'kasa',cloak:1}, hp:240, dmg:11, aggr:900, pat:PW(4,1,1,0,0,0), blk:.15, minor:1},
 bandit:  {name:'Salt Road Bandit', jp:'山賊', wpn:'tanto', look:{hat:'band'}, hp:220, dmg:9, aggr:800, pat:PW(3,2,0,0,0,0), blk:.1, minor:1},
 scav:    {name:'Kiln Scavenger', jp:'焼け跡の盗人', wpn:'kodachi', look:{hat:'hood'}, hp:260, dmg:8, aggr:750, pat:PW(2,3,1,0,0,0), blk:.15, minor:1},
 thug:    {name:'Post-Town Thug', jp:'宿場のごろつき', wpn:'kanabo', look:{hat:'band',bulk:1.25}, hp:320, dmg:16, aggr:1200, pat:PW(3,0,1,1,0,0), blk:.1, minor:1},
 mbandit: {name:'Pass Bandit', jp:'峠の山賊', wpn:'yari', look:{hat:'fur',cloak:1}, hp:300, dmg:12, aggr:850, pat:PW(3,2,1,1,0,0), blk:.2, minor:1},
 tguard:  {name:'Temple Guard', jp:'寺の番兵', wpn:'nodachi', look:{hat:'shaven'}, hp:340, dmg:15, aggr:1000, pat:PW(3,1,1,1,0,1), blk:.25, minor:1},
 ashigaru:{name:'Castle Ashigaru', jp:'足軽', wpn:'yari', look:{hat:'jingasa',armor:1}, hp:340, dmg:13, aggr:800, pat:PW(3,2,1,1,0,1), blk:.25, minor:1},
 // named lieutenants & six bosses (ledger names)
 gonzo:   {name:'Gonzō', title:'the Ferryman', jp:'渡し守 権三', wpn:'yari', look:{hat:'kasa',cloak:1,tall:1.05}, hp:420, dmg:12, aggr:800, pat:PW(3,2,1,0,0,0), blk:.2},
 ikkaku:  {name:'Ikkaku', title:'the Collector', jp:'取立人 一角', wpn:'kanabo', look:{hat:'oni',bulk:1.3}, hp:520, dmg:18, aggr:1100, pat:PW(3,0,1,1,1,0), blk:.15},
 kamata:  {name:'Kamata Hyōe', title:'the Tally-Man · First Name', jp:'帳付け 鎌田兵衛', wpn:'katana', look:{hat:'topknot',armor:1,cloak:1}, hp:700, dmg:15, aggr:700, pat:PW(3,3,2,1,1,1), blk:.3, boss:1},
 hachi:   {name:'Hachi', title:'of the Ash Pits', jp:'灰穴の八', wpn:'kodachi', look:{hat:'hood',cloak:1}, hp:520, dmg:9, aggr:600, pat:PW(1,4,2,0,0,1), blk:.2},
 senkichi:{name:'Senkichi', title:'the Mute', jp:'唖の仙吉', wpn:'kusarigama', look:{hat:'mask'}, hp:560, dmg:12, aggr:750, pat:PW(2,3,2,1,1,0), blk:.2},
 onishi:  {name:'Ōnishi Dengo', title:'the Charcoal Buyer · Second Name', jp:'炭買い 大西伝吾', wpn:'nodachi', look:{hat:'kasa',armor:1,bulk:1.15}, hp:900, dmg:20, aggr:850, pat:PW(3,2,2,2,1,1), blk:.3, boss:1},
 tokubei: {name:'Tokubei', title:'the Gambler', jp:'博徒 徳兵衛', wpn:'tanto', look:{hat:'topknot',cloak:1}, hp:600, dmg:10, aggr:550, pat:PW(2,4,3,0,0,1), blk:.2},
 kyuzo:   {name:'Watanabe Kyūzō', title:'the Wall', jp:'渡辺久蔵', wpn:'katana', look:{hat:'jingasa',armor:1}, hp:720, dmg:14, aggr:800, pat:PW(2,2,1,1,0,4), blk:.45},
 mibu:    {name:'Mibu Tadakatsu', title:"the Magistrate's Hand · Third Name", jp:'奉行の手 壬生忠勝', wpn:'yari', look:{hat:'kabuto',armor:1,tall:1.08}, hp:1050, dmg:17, aggr:700, pat:PW(3,3,2,2,2,2), blk:.35, boss:1},
 koda:    {name:'Koda Brothers', title:'the Elder', jp:'幸田兄', wpn:'kusarigama', look:{hat:'fur',cloak:1}, hp:760, dmg:13, aggr:600, pat:PW(2,4,2,1,1,1), blk:.25},
 tamon:   {name:'Tamon', title:'the Trapper', jp:'罠師 多聞', wpn:'yari', look:{hat:'fur',bulk:1.1}, hp:800, dmg:15, aggr:650, pat:PW(2,2,3,3,1,1), blk:.25},
 goro:    {name:'Gorō of the Pass', title:'the Bear · Fourth Name', jp:'峠の五郎', wpn:'kanabo', look:{hat:'fur',bulk:1.45,cloak:1}, hp:1300, dmg:26, aggr:950, pat:PW(3,1,2,2,3,0), blk:.2, boss:1},
 jikkai:  {name:'Jikkai', title:'the Shaven', jp:'十戒', wpn:'nodachi', look:{hat:'shaven',cloak:1}, hp:880, dmg:20, aggr:750, pat:PW(3,2,2,2,1,2), blk:.3},
 komei:   {name:'Kōmei', title:'the Bellkeeper', jp:'鐘守 光明', wpn:'kanabo', look:{hat:'shaven',bulk:1.3}, hp:950, dmg:24, aggr:900, pat:PW(2,1,2,3,3,1), blk:.25},
 ryozen:  {name:'Abbot Ryōzen', title:'the Ash Monk · Fifth Name', jp:'灰の僧 良善', wpn:'tessen', look:{hat:'shaven',cloak:1,tall:1.05}, hp:1400, dmg:16, aggr:500, pat:PW(2,4,3,2,2,4), blk:.45, boss:1},
 sakuma:  {name:'Sakuma Ittō', title:'Captain of the Gate', jp:'門の隊長 佐久間一刀', wpn:'nodachi', look:{hat:'kabuto',armor:1,bulk:1.15}, hp:1250, dmg:22, aggr:650, pat:PW(3,3,2,2,2,2), blk:.35},
 ibuki:   {name:'Lord Ibuki Tsunemasa', title:'Sixth Name', jp:'伊吹常正', wpn:'katana', look:{hat:'kabuto',armor:1,cloak:1,tall:1.1}, hp:1800, dmg:20, aggr:450, pat:PW(3,4,3,3,2,3), blk:.45, boss:1},
};

const PROLOGUE = [
 'Hokuroku. The far north.\nWinter does not end here. It rests.',
 'Nine winters ago, six men came to the kilns at Kurosawa.\nMy father sold them charcoal.',
 'They paid by writing their names in his ledger.\nThen they barred the door and lit the house.',
 'I was in the woodshed. The snow kept me alive.\nThe ledger, I pulled from the ashes.',
 'Six names. I have learned to read them.'
];
const CHAPTERS = [
 {id:1, name:'Shiomi Ferry', jp:'潮見の渡し', sky:['#b9b6ae','#e6e1d6'], mtn:'#8d8a84', snow:.4,
  intro:'The ferry runs twice a day. Kamata counts every coin that crosses.',
  fights:[
   ['ronin','“Turn back. The ferry is closed to men like you.”','He did not need to die. He chose to.'],
   ['gonzo','“Kamata pays me to watch the water. Not to ask names.”','…'],
   ['ikkaku','“You owe the toll. Everyone owes.”','The toll is paid.'],
   ['kamata','“A charcoal burner’s boy. I remember the price, not the face.”','One name. I strike it through.']],
  reward:'yari'},
 {id:2, name:'Kurosawa Kilns', jp:'黒沢の窯', sky:['#9e9890','#d8d0c2'], mtn:'#6f6a64', snow:.2,
  intro:'The kilns are cold. Someone has been selling the bricks.',
  fights:[
   ['scav','“Nothing left here worth fighting over.”','There was. Once.'],
   ['hachi','“Dengo said you’d come home. I said you were dead.”','…'],
   ['senkichi','(He says nothing. He only unwinds the chain.)','Quiet, now.'],
   ['onishi','“Your father haggled. I hated that.”','Two names.']],
  reward:'nodachi'},
 {id:3, name:'Hakuba Post Town', jp:'白馬宿', sky:['#a7a9ab','#dcdcd8'], mtn:'#7a7d80', snow:.6,
  intro:'Lanterns, rice wine, a magistrate’s seal on every door.',
  fights:[
   ['thug','“Wrong inn, stranger.”','…'],
   ['tokubei','“I’ll wager you don’t leave this street.”','You lose.'],
   ['kyuzo','“Lord Mibu has no business with you. Go.”','He has. He wrote it down.'],
   ['mibu','“The law hangs men like you. I only save it the rope.”','Three.']],
  reward:'kusarigama'},
 {id:4, name:'Tsurugi Pass', jp:'剣峠', sky:['#c8ccd0','#f0f0ee'], mtn:'#9aa0a6', snow:1,
  intro:'The storm closes the pass for weeks. Gorō waits it out with his men.',
  fights:[
   ['mbandit','“No one crosses in this.”','I crossed.'],
   ['koda','“My brother waits farther up. So does the wind.”','…'],
   ['tamon','“Every path here is mine. Watch your feet.”','I watched yours.'],
   ['goro','“I carried the oil that night. It was heavy.”','Four.']],
  reward:'kanabo'},
 {id:5, name:'Akagane Temple', jp:'赤金寺', sky:['#a89890','#e0d2c4'], mtn:'#7c6c64', snow:.3,
  intro:'The abbot buys silence with prayer. The bell has not rung in years.',
  fights:[
   ['tguard','“The temple is closed to the armed.”','…'],
   ['jikkai','“The abbot forgave himself. Why can’t you?”','It is not mine to give.'],
   ['komei','“When I strike the bell, the mountain answers.”','Let it.'],
   ['ryozen','“Six men. Five are dust. I have prayed for all of them.”','Five.']],
  reward:'tessen'},
 {id:6, name:'Kitanosaki Castle', jp:'北崎城', sky:['#5e5c60','#a9a4a2'], mtn:'#3f3e42', snow:.7,
  intro:'The sixth name is a lord now. He has a castle, and a gate, and men.',
  fights:[
   ['ashigaru','“Halt.”','…'],
   ['sakuma','“My lord does not remember you. Be grateful.”','He will.'],
   ['ibuki','“I bought this province with that night. I would buy it again.”','Six.']],
  reward:'tanto'},
];
const EPILOGUE = [
 'The ledger has no more names in it.',
 'In spring the ferry ran without a toll.',
 'I went back to Kurosawa and fired one kiln.\nIt burned clean.'
];
const SURV_POOL = ['ronin','bandit','scav','thug','mbandit','tguard','ashigaru'];
const SURV_BOSSES = ['gonzo','ikkaku','hachi','senkichi','tokubei','kyuzo','koda','tamon','jikkai','komei','sakuma','kamata','onishi','mibu','goro','ryozen','ibuki'];

// ===== v2.2: weapons in v1 format (dmg = damage mult, cd = swing cooldown s, mag = Foxfire gain, win = extra parry window s) =====
const V2WEAPONS={
 katana:{id:'katana',jp:'刀',name:'Katana',kind:'katana',desc:'Your father\u2019s blade. Balanced.',dmg:1.0,cd:0.16,mag:1.0,win:0,price:0},
 kodachi:{id:'kodachi',jp:'二刀小太刀',name:'Twin Kodachi',kind:'wakizashi',off:1,desc:'Two short blades. Very fast, light, fills Foxfire fast.',dmg:0.62,cd:0.07,mag:1.6,win:0,price:400},
 yari:{id:'yari',jp:'槍',name:'Yari',kind:'yari',desc:'Long reach: enemies stay open 0.5 s longer after a parry.',dmg:1.05,cd:0.18,mag:1.0,win:0,reach:0.5,price:480},
 kusarigama:{id:'kusarigama',jp:'鎖鎌',name:'Kusarigama',kind:'kusarigama',desc:'Chain-sickle. 35% of strikes wrap past a raised guard.',dmg:0.9,cd:0.13,mag:1.2,win:0,wrap:0.35,price:520},
 nodachi:{id:'nodachi',jp:'野太刀',name:'Nodachi',kind:'odachi',desc:'Slow, crushing field sword.',dmg:1.55,cd:0.32,mag:0.9,win:0,price:600},
 kanabo:{id:'kanabo',jp:'金棒',name:'Kanab\u014d',kind:'kanabo',desc:'Iron club. Very slow; no guard can stop it.',dmg:1.9,cd:0.42,mag:0.8,win:0,gb:1,price:750},
 tessen:{id:'tessen',jp:'鉄扇',name:'Tessen',kind:'tessen',desc:'Iron fan. Much wider parry window.',dmg:0.7,cd:0.12,mag:1.2,win:0.14,price:450},
 tanto:{id:'tanto',jp:'短刀',name:'Tant\u014d',kind:'tanto',desc:'Quick stabs; x2.2 damage on a broken foe.',dmg:0.55,cd:0.06,mag:1.4,win:0,crit:2.2,price:350},
};
const V2ORDER=['katana','kodachi','yari','kusarigama','nodachi','kanabo','tessen','tanto'];
// attire. hp=bonus HP, dmg=damage mult, cdm=swing cooldown mult, win=parry window +s, blk=extra block charges, dodge=dodge window +s, regen=block recharge seconds
const GEAR={
 hat:{topknot:{name:'Bare head',jp:'髷',unlock:'free',desc:'No effect'},
  kasa:{name:'Straw Kasa',jp:'笠',hp:10,win:0.03,unlock:'free',desc:'+10 HP, +0.03 s parry window'},
  jingasa:{name:'Iron Jingasa',jp:'陣笠',hp:30,unlock:'chap2',desc:'+30 HP'},
  kabuto:{name:'Kabuto Helm',jp:'兜',hp:60,cdm:1.05,unlock:'shop',price:500,desc:'+60 HP, swings 5% slower'}},
 body:{none:{name:'Kimono only',jp:'着物',dodge:0.05,unlock:'free',desc:'Dodge window +0.05 s'},
  kote:{name:'Kote Sleeves',jp:'籠手',dmg:1.08,unlock:'chap1',desc:'+8% damage'},
  sode:{name:'Sode Shoulders',jp:'袖',blk:1,unlock:'surv5',desc:'+1 block charge'},
  do:{name:'D\u014d Chest Plate',jp:'胴',hp:60,dodge:-0.05,unlock:'shop',price:450,desc:'+60 HP, dodge window -0.05 s'},
  oyoroi:{name:'\u014c-yoroi (full)',jp:'大鎧',hp:120,blk:1,cdm:1.1,dodge:-0.08,unlock:'surv15',desc:'+120 HP, +1 block, swings 10% slower, dodge -0.08 s'}},
 cloak:{scarf:{name:'Scarf',jp:'襟巻',unlock:'free',desc:'No effect'},
  haori:{name:'Haori',jp:'羽織',regen:3.5,unlock:'free',desc:'Block charges refill every 3.5 s (not 5)'},
  travel:{name:'Travel Cloak',jp:'合羽',hp:25,unlock:'shop',price:200,desc:'+25 HP'},
  mino:{name:'Straw Mino',jp:'蓑',dodge:0.1,hp:-20,unlock:'chap4',desc:'Dodge window +0.1 s, -20 HP'}}};
const DIFFS={easy:{hp:0.75,dm:0.7,spd:1.12,label:'Easy · 易'},normal:{hp:1,dm:1,spd:1,label:'Normal · 常'},hard:{hp:1.3,dm:1.3,spd:0.88,label:'Hard · 修羅'}};
// map v2 foe weapon keys -> v1 drawing kinds
const KIND={katana:'katana',kodachi:'wakizashi',nodachi:'odachi',yari:'yari',kusarigama:'kusarigama',kanabo:'kanabo',tessen:'tessen',tanto:'tanto'};
// per-weapon attack sets in v1 format [name,jp,dir,wind,dmg,extra]
const ATKSET={
 katana:{s:[['Kesa-giri','袈裟斬り',3,1.2,28],['Kabuto-wari','兜割り',2,1.3,32],['Kiriage','切り上げ',5,1.1,26],['Yoko-giri','横斬り',4,1.15,30]],
  u:[['Tsuki','突き',4,1.6,48,{unblock:true,dg:'back'}]],f:[['Kasumi','霞',7,1.55,32,{feint:{at:0.7,dir:3}}],['Tsubame','燕',1,1.55,32,{feint:{at:0.7,dir:5}}]]},
 odachi:{s:[['Oni-otoshi','鬼落とし',2,1.6,44],['Yoko-nagi','横薙ぎ',4,1.5,42],['Tsuki-age','突き上げ',5,1.45,40]],
  u:[['Chi-wari','地割り',2,1.95,66,{unblock:true,dg:'back'}]],f:[['Damashi','騙し',3,1.8,44,{feint:{at:0.72,dir:5}}]]},
 wakizashi:{s:[['Kogiri','小斬り',3,0.9,18],['Hane','跳ね',5,0.9,18],['Ura','裏',1,0.95,18],['Kaeshi','返し',7,0.9,18]],
  u:[['Ashi-kiri','足斬り',4,1.4,36,{unblock:true,dg:'jump'}]],f:[['Kagerō','陽炎',5,1.4,22,{feint:{at:0.68,dir:1}}]]},
 yari:{s:[['Su-yari','素槍',4,1.05,28],['Jōdan-tsuki','上段突き',3,1.1,30],['Harai','払い',2,1.3,32],['Kachiage','かち上げ',5,1.1,28]],
  u:[['Ashi-barai','足払い',4,1.5,46,{unblock:true,dg:'jump'}]],f:[['Itomaki','糸巻',7,1.55,32,{feint:{at:0.72,dir:4}}]]},
 kusarigama:{s:[['Kusari-uchi','鎖打ち',4,1.0,24],['Kama-gake','鎌掛け',3,1.05,28],['Tobi-kama','飛び鎌',1,1.1,26]],
  u:[['Fundō','分銅',4,1.45,44,{unblock:true,dg:'back'}]],f:[['Gaeshi','返し',5,1.5,30,{feint:{at:0.68,dir:2}}],['Kage-nui','影縫い',2,1.55,30,{feint:{at:0.7,dir:7}}]]},
 kanabo:{s:[['Tetsu-otoshi','鉄落とし',2,1.75,50],['Nagi','薙ぎ',4,1.6,46],['Kachi-age','かち上げ',5,1.55,44]],
  u:[['Jishin','地震',2,1.95,72,{unblock:true,dg:'jump'}]],f:[['Oni-damashi','鬼騙し',3,1.85,48,{feint:{at:0.72,dir:5}}]]},
 tessen:{s:[['Tessen-uchi','鉄扇打ち',3,0.95,20],['Ōgi-gaeshi','扇返し',7,0.9,20],['Kubi-uchi','首打ち',4,1.0,22]],
  u:[['Kaze-giri','風斬り',4,1.45,40,{unblock:true,dg:'jump'}]],f:[['Yuki-fubuki','雪吹雪',2,1.5,26,{feint:{at:0.7,dir:5}}],['Kagerō','陽炎',5,1.5,26,{feint:{at:0.7,dir:1}}]]},
 tanto:{s:[['Sashi','刺し',4,0.85,20],['Kiri','切り',3,0.85,20],['Hane','跳ね',5,0.85,20]],
  u:[['Kubi-sashi','首刺し',4,1.35,40,{unblock:true,dg:'back'}]],f:[['Uso','嘘',7,1.4,22,{feint:{at:0.68,dir:3}}]]}};
const HATMAP={kasa:'kasa',hood:'hood',mask:'mask',jingasa:'jingasa',oni:'oni',kabuto:'kabuto',topknot:'topknot',band:'band',fur:'fur',shaven:'shaven'};
// Build a v1-format stage from a v2 foe. sc = {hp,spd,dm,unlock} for survival scaling.
function buildStage(key,sc,extra){const f=FOES[key],kind=KIND[f.wpn],set=ATKSET[kind];sc=sc||{};
 const atk={},pat=[];let n=0;const add=(t,o)=>{const k='a'+(n++);atk[k]=A(t[0],t[1],t[2],t[3],t[4],Object.assign({},t[5]||{},o||{}));return k;};
 const S=set.s.map(t=>add(t)),U=set.u.map(t=>add(t)),F=set.f.map(t=>add(t)),D=set.s.map(t=>add([t[0]+' (delayed)',t[1]+'・溜め',t[2],Math.min(1.95,t[3]*1.55),Math.round(t[4]*1.15)]));
 const p=Object.assign({},f.pat);if(sc.unlock){for(const k in p)if(!sc.unlock.includes(k))p[k]=0;}if(!p.s)p.s=1;
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 S.forEach(k=>pat.push({s:[k],w:p.s}));
 if(p.c){for(let i=0;i<3;i++){const len=2+i;const s=[];for(let j=0;j<len;j++)s.push(S[(i+j*2)%S.length]);pat.push({s,w:p.c/(i+1),p2:i===2?1:0});}}
 if(p.f)F.forEach(k=>{pat.push({s:[k],w:p.f});pat.push({s:[pick(S),k],w:p.f*0.5,p2:1});});
 if(p.d)D.forEach(k=>pat.push({s:[k],w:p.d/D.length*1.5}));
 if(p.u)U.forEach(k=>{pat.push({s:[k],w:p.u});pat.push({s:[pick(S),k],w:p.u*0.5,p2:1});});
 const look=f.look||{};const D2=DIFFS[(typeof SV!=='undefined'&&SV.diff)||'normal'];
 const spd=Math.max(0.55,Math.min(1.05,f.aggr/1000))*(sc.spd||1)*D2.spd;
 const enemy={name:f.title?f.name+', '+f.title:f.name,jp:f.jp,hp:Math.round(f.hp*1.6*(sc.hp||1)*D2.hp),weapon:kind,hat:HATMAP[look.hat]||'kasa',spd,
  dm:Math.min(1.6,f.dmg/14)*(sc.dm||1)*D2.dm,size:(look.bulk||1)*(look.tall||1),armor:!!look.armor||['kabuto','jingasa','oni'].includes(look.hat),cloth:look.cloak!==undefined?!!look.cloak:look.hat!=='oni',guard:0.45+f.blk*0.8+(f.pat.g||0)*0.05,key};
 return Object.assign({atk,pat,enemy},extra||{});}
const CH_BG=['bridge','bamboo','temple','pass','temple','castle'];
const STAGES=[];
function pushChapterStages(c,ci,bookEnd){c.fights.forEach((fg,fi)=>{const last=fi===c.fights.length-1,fin=bookEnd&&last;
 STAGES.push(buildStage(fg[0],null,{id:c.id+'-'+fi,ch:ci,fi,jp:c.jp,name:c.name,bg:fin&&!c.bg?'throne':(c.bg||CH_BG[ci]),boss:fin,chBoss:last,ending:c.ending&&last?c.ending:null,
  story:(fi===0?[c.intro]:[]).concat([fg[1]]),win:fg[2],loot:last?(c.reward?'You take the '+((V2WEAPONS[c.reward]||{}).name||c.reward)+'.':''):'+ mon',give:last?c.reward:null}));});}
CHAPTERS.forEach((c,ci)=>{c.book=1;pushChapterStages(c,ci,ci===CHAPTERS.length-1);});
STAGES[STAGES.length-1].enemy.p2name='Ibuki, the Sixth Name';STAGES[STAGES.length-1].ending='one';
const BOOK1_STAGES=STAGES.length;
// Book Two is appended after all data files are loaded (keeps Book One stage indices stable for old saves)
function initContent2(){if(typeof CHAPTERS2==='undefined')return;const base=CHAPTERS.length;
 CHAPTERS2.forEach((c,i)=>{CHAPTERS.push(c);CH_BG.push(c.bg);const ci=base+i;c.ending=c.id===11?'choice':c.id===12?'final':null;pushChapterStages(c,ci,false);
  if(c.ending){const st=STAGES[STAGES.length-1];st.boss=true;st.ending=c.ending;}});
 const sh=STAGES.find(s=>s.enemy.key==='shadow');if(sh)sh.enemy.p2name='The Shadow, unbound';
 const sd=STAGES.find(s=>s.enemy.key==='sadayoshi2');if(sd)sd.enemy.p2name='Sadayoshi, his father’s son';
 SURV_POOL.push('tollman','hammerman','bouncer','shira1','retainer');SURV_BOSSES.push('morikawa','kinbei','rokuro','oiwa','gonta','mcaptain','tokuzo','yojimbo','shira2','yamabushi','sadayoshi','kurodo','jubei','kichi','oiwa2','shadow','sadayoshi2');
 SBG.push('keep','road','foundry','ukiyo','shrine','spring');rebuildStages();}

const WEAPONS=V2WEAPONS;
const ENDING=EPILOGUE.concat(['\u2014 終 \u2014']);

/* ---------- state ---------- */
let scene='title',sceneT=0,stageI=0,P,E,ST,texts,parts,trail,shake,flash,stats,camX=0;
const lvl=()=>Math.min(20,1+Math.floor(SV.xp/900));
function gearList(){return (typeof GEAR_SLOTS!=='undefined'?GEAR_SLOTS:['hat','body','cloak']).map(s=>(GEAR[s]&&GEAR[s][SV.gear[s]])||{});}
function gsum(k){return gearList().reduce((a,x)=>a+(x[k]||0),0);}function gmul(k){return gearList().reduce((a,x)=>a*(x[k]||1),1);}
// unlock rules shared by attire and weapons: free | shop (bought) | chapN | survN | tot:key:N | tensei:N | ending:x
function unlockMet(u,sl,k){if(!u||u==='free')return true;if(u==='shop')return sl?SV.gearOwned.includes(sl+':'+k):SV.weapons.includes(k);
 if(u.startsWith('chap'))return chapCleared(+u.slice(4)-1);if(u.startsWith('surv'))return SV.best>=+u.slice(4);
 if(u.startsWith('tot:')){const [,key,n]=u.split(':');return (SV.tot[key]||0)>=+n;}if(u.startsWith('tensei:'))return SV.tensei>=+u.slice(7);if(u.startsWith('ending:'))return SV.ending===u.slice(7);return false;}
function unlockHow(u,price){if(!u||u==='free')return '';if(u==='shop')return 'buy '+price+' 文';if(u.startsWith('chap'))return 'clear chapter '+u.slice(4);if(u.startsWith('surv'))return 'survive round '+u.slice(4);
 if(u.startsWith('tot:')){const [,key,n]=u.split(':');return n+' lifetime '+({parries:'parries',perfect:'perfect parries',dodges:'dodges',wins:'victories',hits:'hits',counters:'counters'}[key]||key);}
 if(u.startsWith('tensei:'))return u.slice(7)+' rebirths';if(u.startsWith('ending:'))return 'reach the “'+(u.slice(7)==='shadow'?'Seven':'Ash')+'” ending';return u;}
function gearUnlocked(sl,k){const it=GEAR[sl][k];if(!it)return false;return unlockMet(it.unlock,sl,k);}
function weaponUnlocked(id){const w=V2WEAPONS[id];if(!w)return false;if(SV.weapons.includes(id))return true;if(w.unlock)return unlockMet(w.unlock,null,id);return false;}
function weaponBuyable(id){const w=V2WEAPONS[id];return w&&w.price>0&&!SV.weapons.includes(id)&&(w.req==null||chapCleared(w.req));}
function chapFirst(ci){return STAGES.findIndex(s=>s.ch===ci);}function chapLast(ci){let r=-1;STAGES.forEach((s,i)=>{if(s.ch===ci)r=i;});return r;}
function chapCleared(ci){return SV.cleared>chapLast(ci);}
function playerWeapon(){const w0=WEAPONS[SV.equip]||WEAPONS.katana;
 return Object.assign({},w0,{dmg:w0.dmg*gmul('dmg'),cd:w0.cd*gmul('cdm'),win:(w0.win||0)+gsum('win'),mag:(w0.mag||1)*gmul('mag'),sm:(w0.sm||1)*gmul('sm'),fx:(w0.fx||1)*gmul('fx'),
  counter:(w0.counter||1)*gmul('counter'),ls:(w0.ls||0)+gsum('ls'),crit:(w0.crit||1)*gmul('crit'),mon:(w0.mon||1)*gmul('mon'),xp:gmul('xp'),self:w0.self||0});}
function playerMaxHp(){return Math.max(120,Math.round(300+(lvl()-1)*20+gsum('hp')));}
function newDuel(i,stObj){stageI=i;ST=stObj||STAGES[i];const d=ST.enemy,w=playerWeapon();
 const mh=playerMaxHp(),bm=3+gsum('blk');
 P={hp:mh,max:mh,blockDur:bm,blockMax:bm,regen:Math.min(...gearList().map(x=>x.regen||5)),dodgeMax:0.55+gsum('dodge'),blockRegen:0,blocking:false,dodge:0,dodgeKind:'',magic:0,superM:clamp(gsum('start'),0,100),swing:0,swingDir:0,hurt:0,cd:0,w,counter:0,ghost:mh,lowT:0};
 E={def:d,hp:d.hp,max:d.hp,state:'idle',t:1.6,queue:[],atk:null,wind:0,windT:0,dir:0,feinted:false,hurt:0,lunge:0,chain:0,dodges:0,combo:0,lastDir:-1,dead:false,block:0,stag:0,p2:false,deadT:0,recoil:0,ghost:d.hp,miss:0,missDir:-1};
 texts=[];parts=[];trail=[];shake=0;flash=0;stats={parries:0,perfect:0,dodges:0,hits:0,maxCombo:0,t:0,counters:0,streak:0};E.kd=0;if(SURV&&SURV.hp!=null&&stObj)P.hp=Math.min(P.max,SURV.hp);
 try{FX.resetStreak();FX.reset();}catch(e){}}
newDuel(0);
function say(s,col='#fff',size=1,jp){texts=texts.filter(t=>t.dmg);texts.push({s,jp,col,size,t:0});if(texts.length>3)texts.shift();}
function sparks(x,y,col,n=18,sp=6){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(1,sp)*U;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:rnd(.3,.7),t:0,col});}}

/* ---------- layout ---------- */
function L(){const land=W>H,m=10*U;const barW=W*(land?0.34:0.42),bh=Math.max(10,9*U);
 const r=Math.max(26,22*U),dr=Math.max(34,(land?30:34)*U);
 const gy=land?H*0.8:H*0.64,fs=land?H*0.0027:Math.min(W*0.0036,H*0.0021);
 return{land,m,barW,bh,gy,fs,hz:gy-(land?H*0.16:H*0.12),
  magic:{x:m+r+4,y:m+bh+26+r+4,r},super:{x:W-m-r-4,y:m+bh+26+r+4,r},
  dodgeL:{x:m+dr+6,y:H-m-dr-10,r:dr},dodgeR:{x:W-m-dr-6,y:H-m-dr-10,r:dr},block:{x:W/2,y:H-m-dr-10,r:dr*0.9},
  px:W*(land?0.36:0.28),ex:W*(land?0.64:0.72)};}
const inC=(p,c)=>(p.x-c.x)**2+(p.y-c.y)**2<=(c.r*1.15)**2;

/* ---------- combat (ported from ASHBORN demo) ---------- */
function pickPattern(){const ph2=E.p2||E.hp<E.max*0.5,ps=ST.pat.filter(p=>!p.p2||ph2);let tw=ps.reduce((a,p)=>a+p.w,0),r=Math.random()*tw;for(const p of ps){if((r-=p.w)<0)return p.s.slice();}return [ps[0].s[0]];}
function speedMul(){return E.def.spd*(E.hp<E.max*0.5?0.9:1)*(E.p2?0.88:1);}
function beginAttack(k){const a=ST.atk[k];E.state='windup';E.atk=a;E.wind=Math.min(1.95,a.wind*speedMul());E.windT=0;E.dir=a.dir;E.feinted=false;E.miss=0;play('windup',0.35,a.unblock?0.7:1);
 if(a.unblock){say(a.dg==='jump'?'JUMP!':'STEP BACK!','#ff5a3d',0.8,a.dg==='jump'?'跳べ':'退け');hap('warn');taiko(0.35,70);}else hap('windup');}
function enemyIdle(t){E.state='idle';E.t=t||rnd(0.9,1.7)*E.def.spd;E.atk=null;}
const superGain=v=>{P.superM=Math.min(100,P.superM+v*(P.w.sm||1));};
function strikeLands(){const a=E.atk;E.state='strike';E.t=0.3;E.lunge=1;const l=L();
 const ok=P.dodge>0&&(!a.unblock||a.dg===P.dodgeKind);
 if(ok){stats.dodges++;SV.tot.dodges++;E.dodges++;superGain(10);
  FX.shard(l.px+10*l.fs,l.gy-110*l.fs,10,'rgba(240,235,225,.8)',5,8);
  if(E.queue.length===0&&E.dodges>=3){say('DODGE BREAK!!','#ffe9c0',1.1,'見切り');FX.stamp('見切',l.ex,l.gy-170*l.fs,{col:'#ffe9c0',size:34,ink:'rgba(0,0,0,.55)',sub:'DODGE BREAK'});FX.hitStop(0.06);hap('dodgeBreak');openEnemy(2.4,true);}
  else{say('DODGE','#e8dcc8',0.8,'回避');hap('dodge');if(!E.queue.length)openEnemy(1.4);}
  play('dodge',0.8);return;}
 if(P.blocking&&!a.unblock&&P.blockDur>0){P.blockDur--;say('BLOCK','#cdd',0.8,'受け');play('block',0.9);steel(0.15,0.8);hap(P.blockDur===0?'blockBreak':'block');shake=4;sparks(l.px+30*l.fs,l.gy-110*l.fs,'#fff',10,4);
  FX.ring(l.px+30*l.fs,l.gy-110*l.fs,10,40,'rgba(220,225,235,.8)',3,0.3);FX.hitStop(0.03);
  if(P.blockDur===0){say('GUARD BROKEN','#f96',0.8,'崩し');FX.stamp('崩',l.px+30*l.fs,l.gy-150*l.fs,{col:'#ff9a6a',size:30,ink:'rgba(0,0,0,.5)'});}return;}
 const heavy=a.unblock;const dmg=a.dmg*E.def.dm*(P.blocking&&!a.unblock?0.5:1);P.hp=Math.max(0,P.hp-dmg);P.hurt=1;shake=heavy?16:12;flash=0.25;superGain(6);P.counter=0;
 play('hurt',1);play(Math.random()<.5?'pain1':'pain2',0.7);taiko(0.4,60);hap(heavy?'hurtHeavy':'hurt');E.chain=0;E.dodges=-99;FX.onHurt();FX.hitStop(heavy?0.08:0.05);
 if(heavy)FX.zoom(0.35,1.06,l.px,l.gy-100*l.fs);
 texts.push({s:'-'+Math.round(dmg),col:'#ff8a7a',size:0.6,t:0,dmg:1,x:rnd(-30,30),px:1});
 for(let i=0;i<14;i++)parts.push({x:l.px+rnd(-10,20)*l.fs,y:l.gy-rnd(80,140)*l.fs,vx:rnd(-6,-1)*U,vy:rnd(-3,1)*U,l:rnd(.4,.9),t:0,col:'#000',ink:1});
 if(P.hp<=0)toDeath();}
function openEnemy(t,broken){E.state='open';E.t=t+(P.w.reach||0);if(broken)E.kd=1.1;E.combo=0;E.lastDir=-1;E.queue=[];E.stag=broken?1.5:1;E.recoil=1;
 const l=L();FX.glyph(broken?'斬れ！ STRIKE':'斬れ',l.ex,l.gy-200*l.fs,{col:broken?'#ffd27a':'rgba(255,240,220,.9)',size:broken?20:15,l:0.9,vy:-18});
 if(broken){superGain(15);hap('parryBreak');taiko(0.5,90);}}
function enemyUpdate(dt){
 E.hurt=Math.max(0,E.hurt-dt*4);E.lunge=Math.max(0,E.lunge-dt*3);E.block=Math.max(0,E.block-dt*3);E.stag=Math.max(0,E.stag-dt*1.2);E.recoil=Math.max(0,E.recoil-dt*2.5);
 if(ST.boss&&!E.p2&&E.hp<=E.max*0.5){E.p2=true;say('HE STOPS HOLDING BACK','#ff3a3a',1.1,'本気');flash=0.5;shake=14;taiko(0.7,55);taiko(0.6,55,0.25);hap('phase2');E.queue=[];enemyIdle(1.4);
  const l=L();FX.hitStop(0.12);FX.zoom(0.8,1.1,l.ex,l.gy-110*l.fs);FX.ring(l.ex,l.gy-110*l.fs,20,160,'rgba(255,60,60,.9)',6,0.7);FX.stamp('本気',l.ex,l.gy-190*l.fs,{col:'#ff3a3a',size:44,ink:'rgba(0,0,0,.6)',sub:E.def.p2name||'NO MORE HOLDING BACK',subCol:'#ffd0c0',l:1.4});return;}
 if(E.state==='idle'){E.t-=dt;if(E.t<=0){E.queue=pickPattern();E.chain=0;E.dodges=0;beginAttack(E.queue.shift());}}
 else if(E.state==='windup'){E.windT+=dt;const a=E.atk;
  if(a.feint&&!E.feinted&&E.windT>=E.wind*a.feint.at){E.feinted=true;E.dir=a.feint.dir;E.wind=Math.min(1.95,E.windT+0.75*E.def.spd);say('FEINT!','#ffb070',0.8,'虚');play('swish2',0.5,1.3);hap('feint');}
  if(E.windT>=E.wind)strikeLands();}
 else if(E.state==='strike'){E.t-=dt;if(E.t<=0){if(E.queue.length&&P.hp>0)beginAttack(E.queue.shift());else enemyIdle();}}
 else if(E.state==='open'){E.t-=dt;if(E.t<=0){if(E.combo>=2)say('COMBO x'+E.combo,'#ffd27a',0.9,'連撃');enemyIdle(rnd(.7,1.2)*E.def.spd);}}}
const windRemaining=()=>E.wind-E.windT;
function playerSwipe(d){
 if(scene!=='fight'||P.hp<=0||E.dead||P.cd>0)return;
 P.swing=1;P.swingDir=d;P.cd=P.w.cd;play(Math.random()<.5?'swish1':'swish2',0.5,rnd(.9,1.15)*(P.w.kind==='odachi'?0.8:1));
 const l=L(),clashX=(l.px+l.ex)/2,clashY=l.gy-120*l.fs;hap('swipe');
 if(E.state==='windup'){const rem=windRemaining(),a=E.atk,wb=P.w.win;
  if(!a.unblock&&d===E.dir&&rem<=0.6+wb&&!(a.feint&&!E.feinted)){
   stats.parries++;SV.tot.parries++;E.chain++;let label='PARRY',jp='受け流し',col='#e9f2ff',tier=0;
   if(rem<=0.2+wb*0.5){label='PERFECT PARRY';jp='完璧';col='#fff';tier=2;stats.perfect++;SV.tot.perfect++;play('perfect',0.8);}else if(rem<=0.38+wb*0.5){label='GREAT PARRY';jp='見事';tier=1;}
   play('parry',1,rnd(.95,1.05));steel(tier===2?0.4:0.25);hap(tier===2?'parryPerfect':tier===1?'parryGreat':'parry');superGain(tier===0?6:10);
   sparks(clashX,clashY,'#fff6e0',28,7);shake=tier===2?9:6;E.recoil=1;FX.onParry(tier===2);stats.streak=Math.max(stats.streak,FX.streak);
   // feel: hit-stop on every parry, a breath of slow-motion + camera push on a perfect one
   const ang=Math.atan2(DV[d][1],DV[d][0]);FX.flash(clashX,clashY,ang,tier===2?90:60,tier===2?'#ffffff':'#fff2dc',tier===2?6:4,0.2);
   FX.shard(clashX,clashY,tier===2?26:14,tier===2?'#fff':'#ffe9c0',tier===2?9:6,12);FX.ring(clashX,clashY,12,tier===2?120:70,tier===2?'rgba(255,255,255,.95)':'rgba(255,235,210,.7)',tier===2?5:3,tier===2?0.45:0.3);
   if(tier===2){FX.hitStop(0.09);if(SV.set.slow)FX.slow(0.28,0.3);FX.zoom(0.5,1.07,clashX,clashY);P.counter=1;if(P.w.ls){P.hp=Math.min(P.max,P.hp+P.w.ls);texts.push({s:'+'+P.w.ls,col:'#9fe3a0',size:0.55,t:0,dmg:1,x:rnd(-20,20),px:1});}
    FX.stamp('完璧',clashX,clashY-100*l.fs,{col:'#fff',size:40,ink:'rgba(10,6,8,.65)',sub:'PERFECT',subCol:'#ffe9c0',l:1.0});}
   else if(tier===1){FX.hitStop(0.05);FX.stamp('見事',clashX,clashY-95*l.fs,{col:'#f3ecdf',size:30,ink:'rgba(10,6,8,.5)',sub:'GREAT',l:0.8});}
   else{FX.hitStop(0.03);}
   if(FX.streak>=3&&FX.streak%3===0){FX.glyph('連 x'+FX.streak,l.px+10*l.fs,l.gy-205*l.fs,{col:'#ffd27a',size:16,l:0.9,vy:-20});if(FX.streak%5===0){superGain(5);hap('combo');}}
   if(E.queue.length){if(tier<2)say(label,col,1,jp);beginAttack(E.queue.shift());}
   else if(E.chain>=3||tier===2&&E.chain>=2){say('PARRY BREAK!!','#fff',1.15,'崩し');FX.stamp('崩',l.ex,l.gy-180*l.fs,{col:'#ffe9c0',size:48,ink:'rgba(0,0,0,.6)',sub:'PARRY BREAK',rot:0.15,l:1.1});FX.hitStop(0.08);openEnemy(2.6,true);}
   else{if(tier<2)say(label,col,1,jp);openEnemy(tier===2?2.0:1.5);}
   return;}
  if(!a.unblock&&d!==E.dir&&rem<=0.6+wb&&!(a.feint&&!E.feinted)){E.miss=0.5;E.missDir=d;}
  enemyShield();return;}
 if(E.state==='open'){hitEnemy(d);return;}
 if(E.state==='idle'){if(!P.w.gb&&!(P.w.wrap&&Math.random()<P.w.wrap)&&Math.random()<Math.min(0.85,E.def.guard||0.6)){enemyShield();if(Math.random()<.35)E.t=Math.min(E.t,0.25);}else hitEnemy(d,0.6);}}
function enemyShield(){E.block=1;say('BLOCKED','#aab',0.7,'防');play('block',0.6,1.2);steel(0.12,1.2);const l=L();sparks((l.px+l.ex)/2+20*l.fs,l.gy-110*l.fs,'#ddd',8,3);hap('tick');}
function hitEnemy(d,mult=1){
 const alt=E.lastDir>=0&&d!==E.lastDir;E.combo++;E.lastDir=d;stats.hits++;SV.tot.hits++;stats.maxCombo=Math.max(stats.maxCombo,E.combo);
 const broken=E.stag>1,counter=P.counter>0&&mult===1;if(counter){P.counter=0;stats.counters++;SV.tot.counters++;}
 let dmg=(20+E.combo*3+(alt?6:0))*mult*(broken?1.4*(P.w.crit||1):1)*P.w.dmg*(counter?P.w.counter:1);dmg=Math.round(dmg);E.hp=Math.max(0,E.hp-dmg);E.hurt=1;shake=counter?9:5;
 P.magic=Math.min(100,P.magic+7*P.w.mag);superGain(3);
 if(P.w.self&&P.hp>P.w.self){P.hp-=P.w.self;}
 play(Math.random()<.5?'hit1':'hit2',0.8,rnd(.9,1.1));hap(counter?'counter':broken?'crit':alt?'hitAlt':'hit');if(P.w.kind==='odachi'||P.w.kind==='kanabo'||P.w.kind==='ono')taiko(0.3,80);
 const l=L();for(let i=0;i<12;i++)parts.push({x:l.ex+rnd(-15,10)*l.fs,y:l.gy-rnd(70,140)*l.fs,vx:rnd(1,7)*U,vy:rnd(-4,1)*U,l:rnd(.4,.9),t:0,col:'#4a4d52',ink:1});
 FX.shard(l.ex-10*l.fs,l.gy-110*l.fs,counter?14:6,counter?'#ffd27a':'rgba(255,240,220,.7)',counter?8:4,8);if(counter)FX.hitStop(0.06);
 texts.push({s:''+dmg,col:counter?'#ffd27a':broken?'#ffb07a':'#ffe1b0',size:counter?0.85:broken?0.7:0.6,t:0,dmg:1,x:rnd(-40,40)});
 if(counter)say('COUNTER','#ffd27a',1.0,'返し');else if(E.combo>=3&&E.combo%3===0)say('COMBO x'+E.combo,'#ffd27a',0.9,'連撃');else if(mult===1)say('HIT','#f3e6d0',0.6);
 if(E.hp<=0)toVictory();}
function castMagic(){if(P.magic<100||E.dead||scene!=='fight')return;P.magic=0;const l=L();
 say('KITSUNEBI','#8fd8ff',1.1,'狐火');play('fire',1,1.2);hap('magic');for(let i=0;i<46;i++)parts.push({x:l.ex+rnd(-40,40)*l.fs,y:l.gy-rnd(0,170)*l.fs,vx:rnd(-1,1)*U,vy:rnd(-4,-1)*U,l:rnd(.5,1.1),t:0,col:Math.random()<.5?'#7fd0ff':'#d8f4ff',fire:1});
 FX.ring(l.ex,l.gy-100*l.fs,20,140,'rgba(140,216,255,.9)',5,0.6);FX.stamp('狐火',l.ex,l.gy-200*l.fs,{col:'#bfe8ff',size:36,ink:'rgba(0,20,40,.6)',sub:'KITSUNEBI',l:1.0});
 const dm=Math.round(95*(P.w.fx||1));E.hp=Math.max(0,E.hp-dm);E.hurt=1;shake=14;flash=0.15;texts.push({s:''+dm,col:'#bfe8ff',size:0.8,t:0,dmg:1,x:0});if(E.state==='windup')E.queue=[];openEnemy(1.6);if(E.hp<=0)toVictory();}
let superFx=0;
function castSuper(){if(P.superM<100||E.dead||scene!=='fight')return;P.superM=0;say('KAGE-GIRI','#fff',1.2,'奥義・影斬り');play('super',1);taiko(0.8,50);steel(0.4,0.7);hap('superHit');superFx=1;shake=16;
 const l=L();FX.hitStop(0.1);if(SV.set.slow)FX.slow(0.35,0.25);FX.zoom(0.7,1.1,l.ex,l.gy-110*l.fs);FX.flash(l.ex,l.gy-110*l.fs,-0.6,160,'#fff',8,0.35);FX.shard(l.ex,l.gy-110*l.fs,40,'#fff',10,14);
 E.queue=[];openEnemy(3.2,true);E.hp=Math.max(0,E.hp-70);texts.push({s:'70',col:'#fff',size:0.9,t:0,dmg:1,x:0});if(E.hp<=0)toVictory();}
function dodge(kind){if(scene!=='fight'||P.dodge>0)return;P.dodge=P.dodgeMax;P.dodgeKind=kind;play('dodge',0.6,kind==='jump'?1.2:1);hap('tap');}

/* ---------- scenes ---------- */
const MOODQ={tokubei:'smirk',goro:'laugh',kurodo:'laugh',oume:'smirk',kichi:'calm',ibuki:'calm',ryozen:'calm',shadow:'neutral',tokuzo:'smirk',rokuro:'calm',ladyibuki:'calm',jubei:'grim',sadayoshi:'angry',sadayoshi2:'grim',kamata:'calm',mibu:'grim',onishi:'angry',ikkaku:'angry',thug:'angry',bouncer:'angry'};
const reqOK=l=>!l.req||l.req===SV.ending;
const DLSTYLE={hero:'kage',get chars(){return CHARS},font,bar:'#0a0708',textCol:'#2a1a12',plateCol:'#f3e6d0',hintCol:'#8a2a20',narrCol:'#f3e6d0',titleCol:'#f3e6d0',subCol:'#d8c4ac',
 paper:(c,x,y,w,h)=>{const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(236,224,200,.97)');g.addColorStop(1,'rgba(214,196,164,.97)');c.fillStyle=g;c.fillRect(x,y,w,h);c.fillStyle='#3a2416';c.fillRect(x-4*U,y-3*U,w+8*U,4*U);c.fillRect(x-4*U,y+h-1*U,w+8*U,4*U);c.fillStyle='rgba(120,80,50,.035)';for(let i=0;i<10;i++){c.beginPath();c.arc(x+((i*211)%w),y+((i*137)%h),(i%4+2)*7*U,0,7);c.fill();}},
 plate:(c,x,y,w,h,side)=>{c.fillStyle='#1a1010';c.fillRect(x,y,w,h);c.fillStyle='#b8242a';c.fillRect(side==='R'?x+w-3*U:x,y,3*U,h);},
 narrBox:(c,x,y,w,h)=>{c.fillStyle='rgba(8,4,4,.72)';c.fillRect(x,y,w,h);c.fillStyle='#b8242a';c.fillRect(x+w/2-1*U,y+10*U,2*U,14*U);},
 portraitBack:(c,x,y,s,side,active)=>{c.fillStyle=active?'rgba(236,224,200,.14)':'rgba(0,0,0,.2)';c.beginPath();c.arc(x+s/2,y+s*0.55,s*0.55,0,7);c.fill();},
 choiceBtn:(c,x,y,w,h,t,i)=>{c.fillStyle='rgba(20,12,10,.92)';c.fillRect(x,y,w,h);c.fillStyle=i?'#e9e2d4':'#b8242a';c.fillRect(x,y,4*U,h);c.fillStyle='#f3e6d0';c.font=font(13*U,1);c.textAlign='center';c.fillText(t,x+w/2,y+h*0.66);},
 skipBtn:(c,x,y,w,h)=>{c.fillStyle='rgba(20,12,10,.75)';c.fillRect(x,y,w,h);c.fillStyle='#f3e6d0';c.font=font(10*U,1);c.textAlign='center';c.fillText('SKIP ▶▶',x+w/2,y+h*0.68);},
 titleDeco:(c,W,H,U,t)=>{c.fillStyle='#b8242a';c.beginPath();c.arc(W/2,H*0.47-40*U,Math.min(1,t*2)*10*U,0,7);c.fill();},
 play:(n)=>play(n,0.5),hap:(n)=>hap(n),blip:(ch)=>blip(ch),fx:(k)=>{if(k==='shake')shake=12;if(k==='flash')flash=0.3;}};
function stageLines(i){const st=STAGES[i],c=CHAPTERS[st.ch],fi=st.fi||0,key=st.enemy.key,chKey='ch'+c.id;let lines=[];
 if(fi===0){if(c.book===2&&c.id===7&&!SV.seenB2&&typeof DL!=='undefined')lines=lines.concat(DL.b2open);
  lines.push({title:c.jp,sub:'CHAPTER '+c.id+' · '+c.name.toUpperCase()});lines.push({narr:c.intro});
  if(c.book===2&&!SV.seenCh[chKey]&&DL[chKey]&&DL[chKey].open)lines=lines.concat(DL[chKey].open);}
 const q=c.fights[fi][1],who=(typeof CHARS!=='undefined'&&CHARS[key])?key:null;
 if(q){if(who&&q.startsWith('“'))lines.push({who,mood:MOODQ[key]||'grim',text:q.replace(/^“|”$/g,'')});else lines.push({narr:q.replace(/^\(|\)$/g,'')});}
 if(typeof DL!=='undefined'){const ex=c.book===1?DL.b1[key]:(DL[chKey]&&DL[chKey].fights&&DL[chKey].fights[fi]);if(ex&&ex.length)lines=lines.concat(ex);}
 return lines.filter(reqOK);}
function toStory(i){newDuel(i);const lines=SURV?[]:stageLines(i);const st=STAGES[i],c=CHAPTERS[st.ch];
 if(lines.length){scene='dialog';sceneT=0;DLG.start(lines,()=>{if((st.fi||0)===0){SV.seenCh['ch'+c.id]=1;if(c.id===7)SV.seenB2=true;save();}scene='story';sceneT=0;},{style:DLSTYLE});}
 else{scene='story';sceneT=0;}}
function toFight(){newDuel(stageI,SURV?SURV.st:null);scene='fight';sceneT=0;say('HAJIME!','#f3e6d0',1.3,'始め');taiko(0.7,70);taiko(0.6,90,0.3);hap('tap');}
let unlockedNow=null,endingKey='one',gearUnlockedNow=[];
function toVictory(){E.dead=true;E.state='dead';sceneT=0;play('die',0.9,0.8);play('victory',0.9);taiko(0.8,60);hap('victory');SV.tot.wins++;
 const l=L();FX.hitStop(0.12);if(SV.set.slow)FX.slow(0.7,0.22);FX.zoom(1.2,1.12,l.ex,l.gy-110*l.fs);FX.flash(l.ex,l.gy-110*l.fs,-0.7,170,'#fff',7,0.4);FX.shard(l.ex,l.gy-110*l.fs,30,'#fff',9,14);
 if(SURV){const heal=Math.round(P.max*0.18);SURV.hp=Math.min(P.max,P.hp+heal);SURV.healed=heal;SV.best=Math.max(SV.best,SURV.round);SV.mon+=Math.round((20+SURV.round*5)*(P.w.mon||1));SURV.round++;survStage();save();scene='survnext';return;}
 scene='victory';
 stats.xp=Math.round((250+stageI*60+stats.parries*15+stats.perfect*25+stats.maxCombo*10+stats.counters*12+Math.round(P.hp/2))*(P.w.xp||1));SV.xp+=stats.xp;stats.mon=Math.round((100+stageI*80)*(P.w.mon||1));SV.mon+=stats.mon;
 unlockedNow=null;if(ST.give&&V2WEAPONS[ST.give]&&!SV.weapons.includes(ST.give)){SV.weapons.push(ST.give);unlockedNow=ST.give;}
 const before=gearSnapshot();SV.cleared=Math.max(SV.cleared,stageI+1);gearUnlockedNow=gearSnapshot().filter(k=>!before.includes(k));save();}
function gearSnapshot(){const o=[];for(const sl in GEAR)for(const k in GEAR[sl])if(GEAR[sl][k].unlock&&GEAR[sl][k].unlock!=='free'&&GEAR[sl][k].unlock!=='shop'&&gearUnlocked(sl,k))o.push(sl+':'+k);
 for(const id in V2WEAPONS)if(V2WEAPONS[id].unlock&&weaponUnlocked(id))o.push('weapon:'+id);return o;}
function toDeath(){hap('death');if(SURV){scene='survover';sceneT=0;SURV.final=SURV.round-1;SV.best=Math.max(SV.best,SURV.final);save();play('die',1);taiko(0.6,45);return;}scene='death';sceneT=0;SV.tensei++;save();play('die',1);taiko(0.6,45);
 const l=L();if(SV.set.slow)FX.slow(0.8,0.3);FX.zoom(1.4,1.1,l.px,l.gy-100*l.fs);}
function afterXp(){const c=CHAPTERS[ST.ch],chKey='ch'+c.id;const close=(ST.chBoss&&typeof DL!=='undefined'&&DL[chKey]&&DL[chKey].close)?DL[chKey].close.filter(reqOK):null;
 const next=()=>{if(ST.ending){endingKey=ST.ending;scene='ending';sceneT=0;hap('unlock');}else if(!ST.chBoss&&stageI+1<STAGES.length)toStory(stageI+1);else{scene='map';sceneT=0;}};
 if(close&&close.length){scene='dialog';sceneT=0;DLG.start(close,next,{style:DLSTYLE});}else next();}
const DEATH_Q=['\u201cThe snow is patient.\u201d','\u201cGet up. There are names left.\u201d','\u201cFather counted every coin twice. Count their blows.\u201d','\u201cNot yet.\u201d'];

/* ---------- input ---------- */
const ptr={};
function btnHit(p){const l=L();if(scene!=='fight')return null;
 if(inC(p,l.dodgeL))return'dl';if(inC(p,l.dodgeR))return'dr';if(inC(p,l.block))return'block';if(inC(p,l.magic))return'magic';if(inC(p,l.super))return'super';
 if(sceneT>0.5&&Math.abs(p.x-W/2)<26*U&&p.y<l.m+l.bh+30*U)return'pause';return null;}
cv.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();if(AC&&AC.state==='suspended')AC.resume();
 const p={x:e.clientX,y:e.clientY};const b=btnHit(p);ptr[e.pointerId]={b,pts:[p]};
 if(b==='dl')dodge('back');else if(b==='dr')dodge('jump');else if(b==='block'){P.blocking=true;hap('tick');}else if(b==='magic')castMagic();else if(b==='super')castSuper();else if(b==='pause')pauseGame();
 if(!b)trail=[{x:p.x,y:p.y,t:0}];},{passive:false});
function pauseGame(){if(scene!=='fight')return;scene='pause';sceneT=0;P.blocking=false;hap('tap');}
function resumeGame(){if(scene!=='pause')return;scene='fight';sceneT=2;HOT=[];}
function retreat(){if(SURV){SURV.final=SURV.round-1;SV.best=Math.max(SV.best,SURV.final);save();SURV=null;}scene='map';sceneT=0;HOT=[];}
// Android back button: menus go back, fights pause, title asks to exit
window.onAndroidBack=function(){try{if(typeof closeOverlays==='function'&&closeOverlays())return true;
 if(scene==='fight'){pauseGame();return true;}if(scene==='pause'){resumeGame();return true;}
 if(scene==='dialog'){DLG.skip();return true;}
 if(scene==='map'||scene==='credits'){scene='title';sceneT=0;return true;}
 if(scene==='title')return false;
 if(scene==='story'||scene==='survnext'){if(SURV){retreat();}else{scene='map';sceneT=0;}return true;}
 if(['loot','xp','victory','ending','death','survover'].includes(scene))return true;return true;}catch(e){return false;}};
window.onAndroidPause=function(){try{if(scene==='fight')pauseGame();if(AC&&AC.state==='running')AC.suspend();}catch(e){}};
window.onAndroidResume=function(){try{if(AC&&AC.state==='suspended')AC.resume();}catch(e){}};
cv.addEventListener('pointermove',e=>{const q=ptr[e.pointerId];if(!q||q.b)return;const p={x:e.clientX,y:e.clientY};q.pts.push(p);trail.push({x:p.x,y:p.y,t:0});if(trail.length>24)trail.shift();
 if(!q.fired&&scene==='fight'){const s=q.pts[0],dx=p.x-s.x,dy=p.y-s.y;if(Math.hypot(dx,dy)>Math.max(55,38*U)){q.fired=1;playerSwipe(dirOf(dx,dy));}}});
function up(e){const q=ptr[e.pointerId];delete ptr[e.pointerId];if(!q)return;if(q.b==='block'){P.blocking=Object.values(ptr).some(o=>o.b==='block');return;}if(q.b)return;
 const s=q.pts[0],p={x:e.clientX,y:e.clientY},dx=p.x-s.x,dy=p.y-s.y,len=Math.hypot(dx,dy);
 if(scene==='fight'){if(!q.fired&&len>Math.max(28,20*U))playerSwipe(dirOf(dx,dy));return;}
 if(len<20)tap(p);}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
let HOT=[];
function hotTap(p){for(let i=HOT.length-1;i>=0;i--){const h=HOT[i];if(p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h){hap('tap');pluck(392,0.06,0.3);h.fn();return true;}}return false;}
function startPrologue(){scene='dialog';sceneT=0;DLG.start(DL.prologue,()=>{SV.seenPro=true;save();scene='map';sceneT=0;},{style:DLSTYLE});}
function tap(p){if(scene==='dialog'){DLG.tap(p);return;}if(sceneT<0.4)return;
 if(scene==='title'){if(hotTap(p))return;try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{});screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}
  hap('page');if(!SV.seenPro&&typeof DL!=='undefined')startPrologue();else{scene='map';sceneT=0;}return;}
 if(scene==='credits'){scene='title';sceneT=0;return;}
 if(scene==='map'||scene==='pause'){hotTap(p);return;}
 if(scene==='story'){if(sceneT>0.6)toFight();return;}
 if(scene==='victory'&&sceneT>2.2){scene='loot';sceneT=0;hap('page');return;}
 if(scene==='loot'){scene='xp';sceneT=0;hap('page');return;}
 if(scene==='xp'){if(sceneT>0.8){hap('page');afterXp();}return;}
 if(scene==='survnext'&&sceneT>0.6){toFight();return;}
 if(scene==='survover'&&sceneT>1.2){SURV=null;scene='map';sceneT=0;return;}
 if(scene==='ending'){if(sceneT>3){if(hotTap(p))return;scene='map';sceneT=0;}return;}
 if(scene==='death'&&sceneT>2.2){hap('page');toFight();return;}}

/* ---------- skeleton figure (2-bone IK limbs, rim-lit silhouette) ---------- */
function ik(sx,sy,tx,ty,a,b,bend){const dx=tx-sx,dy=ty-sy,dd=Math.hypot(dx,dy)||1,d=clamp(dd,Math.abs(a-b)+0.5,a+b-0.5);
 const base=Math.atan2(dy,dx),ang=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1)),t=base+bend*ang;
 return[sx+Math.cos(t)*a,sy+Math.sin(t)*a,sx+dx/dd*d,sy+dy/dd*d];}
const BASE={hx:0,hy:-86,lean:0.12,head:0,fF:[20,0],fB:[-22,0],hand:[24,26],wa:-1.05,rot:0,ox:0,oy:0};
function mix(a,b,t){const o={};for(const k in a){const va=a[k],vb=b[k]===undefined?va:b[k];o[k]=Array.isArray(va)?[lerp(va[0],vb[0],t),lerp(va[1],vb[1],t)]:lerp(va,vb,t);}return o;}
function limb(x1,y1,x2,y2,w){cx.lineWidth=w;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke();}
const WLEN={kanabo:70,tanto:40,katana:72,wakizashi:52,odachi:100,cursed:76,naginata:70,yari:70,kusarigama:30,tessen:26,kunai:20};
const TWO={kanabo:1,katana:1,odachi:1,cursed:1,naginata:1,yari:1};
function figure(x,y,f,s,ps,C){
 const pass=(rim)=>{cx.save();cx.translate(x+(rim?-1.7*U:0),y+(rim?-1.5*U:0));cx.scale(f*s,s);cx.translate(ps.ox,ps.oy);if(ps.rot)cx.rotate(ps.rot);
  cx.lineCap='round';cx.lineJoin='round';const body=rim?C.rim:C.body,back=rim?C.rim:C.back;
  const hx=ps.hx,hy=ps.hy,tl=58,sx=hx+Math.sin(ps.lean)*tl,sy=hy-Math.cos(ps.lean)*tl;
  const nx=sx+Math.sin(ps.lean+ps.head*0.5)*12,ny=sy-Math.cos(ps.lean+ps.head*0.5)*12;
  const legB=ik(hx-4,hy,ps.fB[0],ps.fB[1]-4,44,44,-1),legF=ik(hx+4,hy,ps.fF[0],ps.fF[1]-4,44,44,-1);
  const wdx=Math.cos(ps.wa),wdy=Math.sin(ps.wa);
  const armF=ik(sx+4,sy+2,sx+ps.hand[0],sy+ps.hand[1],30,28,1);
  const h2=TWO[C.weapon]?[armF[2]-wdx*11,armF[3]-wdy*11]:[sx-10+Math.sin(T*2)*2,sy+34];
  const armB=ik(sx-4,sy+2,h2[0],h2[1],30,28,1);
  const wind=C.wind||0,ph=T*7+C.seed;
  cx.strokeStyle=back;cx.fillStyle=back;
  if(C.cloth){const bx=hx-10,by=hy-4;cx.lineWidth=3;for(let k=0;k<1;k++){cx.beginPath();cx.moveTo(bx,by+k*5);for(let i=1;i<=6;i++){const tt=i/6;cx.lineWidth=3.2*(1-tt*0.6);cx.lineTo(bx-tt*(26+wind*18),by+k*5+tt*(20-wind*12)+Math.sin(ph-i*0.9+k)*(2+tt*5*(1+wind)));}cx.stroke();}}
  if(C.cape&&C.cape!=='kesa'){const sw=Math.sin(ph*0.5)*3*(1+wind),cl=C.cape==='haori'?62:C.cape==='mino'?50:C.cape==='jinbaori'?56:C.cape==='kataginu'?40:70;
   if(!rim&&C.capeCol){cx.fillStyle=C.capeCol;cx.strokeStyle=C.capeCol;}
   cx.beginPath();cx.moveTo(sx-6,sy+2);cx.quadraticCurveTo(sx-24-wind*10,sy+cl*0.5,hx-26-wind*22+sw,sy+cl+(1-wind)*4);cx.lineTo(hx-6+sw*0.5,sy+cl-4);cx.lineTo(sx+6,sy+10);cx.closePath();cx.fill();
   if(C.cape==='mino'||C.cape==='fur'){cx.lineWidth=1.6;for(let i=0;i<7;i++){cx.beginPath();cx.moveTo(sx-4-i*3,sy+6);cx.lineTo(hx-18-i*2+sw,sy+cl+2);cx.stroke();}}
   if(C.cape==='kataginu'){cx.beginPath();cx.moveTo(sx-20,sy-6);cx.lineTo(sx+20,sy-6);cx.lineTo(sx+14,sy+8);cx.lineTo(sx-14,sy+8);cx.closePath();cx.fill();}
   cx.fillStyle=back;cx.strokeStyle=back;}
  limb(hx-4,hy,legB[0],legB[1],14);limb(legB[0],legB[1],legB[2],legB[3],11);cx.beginPath();cx.ellipse(legB[2]+4,legB[3]+1,8,3.5,0,0,7);cx.fill();
  limb(sx-4,sy+2,armB[0],armB[1],10);limb(armB[0],armB[1],armB[2],armB[3],8);
  if(C.offhand)drawWeapon(C.offhand,armB[2],armB[3],1.3+Math.sin(T*2)*0.1,back,rim,C);
  cx.fillStyle=body;cx.strokeStyle=body;
  if(C.hakama){const sw=Math.sin(ph*0.6)*2*(1+wind);cx.beginPath();cx.moveTo(hx-15,hy-6);cx.quadraticCurveTo(legB[0]-10,legB[1],legB[0]-12+sw,legB[1]+16);cx.lineTo(legF[0]+12+sw,legF[1]+16);cx.quadraticCurveTo(legF[0]+8,legF[1],hx+15,hy-6);cx.closePath();cx.fill();}
  limb(hx+4,hy,legF[0],legF[1],14);limb(legF[0],legF[1],legF[2],legF[3],11);cx.beginPath();cx.ellipse(legF[2]+4,legF[3]+1,8,3.5,0,0,7);cx.fill();
  const px=Math.cos(ps.lean),py=Math.sin(ps.lean);cx.beginPath();cx.moveTo(hx-13*px,hy-13*py);cx.lineTo(sx-17*px,sy-17*py);cx.quadraticCurveTo(sx,sy-6,sx+17*px,sy+17*py);cx.lineTo(hx+14*px,hy+14*py);cx.closePath();cx.fill();
  if(C.cape==='kesa'&&!rim){cx.fillStyle=C.capeCol||'#6a4a2a';cx.beginPath();cx.moveTo(sx+10,sy-4);cx.lineTo(sx+18,sy+4);cx.lineTo(hx-14,hy+10);cx.lineTo(hx-22,hy+2);cx.closePath();cx.fill();cx.fillStyle=body;}
  if(C.armor){if(!rim&&C.armorCol)cx.fillStyle=C.armorCol;cx.beginPath();cx.ellipse(sx-12,sy+6,14,9,ps.lean-0.4,0,7);cx.fill();cx.beginPath();cx.moveTo(hx-18,hy-4);cx.lineTo(hx+18,hy-4);cx.lineTo(hx+22,hy+22);cx.lineTo(hx-22,hy+22);cx.fill();
   if(!rim&&C.armorCol){cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=1.2;for(let k=0;k<3;k++){cx.beginPath();cx.moveTo(hx-17+k,hy+2+k*7);cx.lineTo(hx+17-k,hy+2+k*7);cx.stroke();}cx.strokeStyle=body;}cx.fillStyle=body;}
  if(C.sode){if(!rim&&C.armorCol)cx.fillStyle=C.armorCol;cx.beginPath();cx.moveTo(sx-2,sy-2);cx.lineTo(sx+16,sy+2);cx.lineTo(sx+14,sy+22);cx.lineTo(sx-6,sy+18);cx.closePath();cx.fill();cx.beginPath();cx.moveTo(sx-8,sy-2);cx.lineTo(sx-24,sy+4);cx.lineTo(sx-22,sy+22);cx.lineTo(sx-6,sy+16);cx.fill();cx.fillStyle=body;}
  limb(sx,sy,nx,ny,9);
  cx.beginPath();cx.arc(nx,ny-6,11,0,7);cx.fill();
  if(C.scarf&&C.hat!=='player')drawHat('scarf',nx,ny-6,body,ph,wind);drawHat(C.hat,nx,ny-6,body,ph,wind);
  if(!rim&&C.eye){cx.fillStyle=C.eye;cx.shadowColor=C.eye;cx.shadowBlur=C.glow||0;cx.fillRect(nx+3,ny-9,6,2.2);cx.shadowBlur=0;cx.fillStyle=body;}
  drawWeapon(C.weapon,armF[2],armF[3],ps.wa,body,rim,C);
  cx.strokeStyle=body;limb(sx+4,sy+2,armF[0],armF[1],10);limb(armF[0],armF[1],armF[2],armF[3],C.kote?12:8);
  cx.restore();};
 pass(true);pass(false);}
function drawWeapon(k,x,y,a,col,rim,C){const len=WLEN[k]||60;cx.save();cx.translate(x,y);
 if(k==='kusarigama'&&!rim){const sp=C.chainSpin||0,wx=-Math.cos(T*9)*30*sp-20,wy=Math.sin(T*9)*20*sp+30;cx.strokeStyle='rgba(120,125,135,.9)';cx.lineWidth=1.6;cx.setLineDash([3,2]);cx.beginPath();cx.moveTo(0,0);cx.quadraticCurveTo(wx*0.5,wy+20,wx,wy);cx.stroke();cx.setLineDash([]);cx.fillStyle=col;cx.beginPath();cx.arc(wx,wy,4,0,7);cx.fill();}
 cx.rotate(a);cx.fillStyle=col;cx.strokeStyle=col;const edge=rim?null:(C.edge||'rgba(225,232,245,.85)');
 const blade=(x0,x1,w,curve)=>{cx.beginPath();cx.moveTo(x0,-w);cx.quadraticCurveTo((x0+x1)/2,-w-curve,x1,0);cx.quadraticCurveTo((x0+x1)/2,w-curve*0.6,x0,w);cx.closePath();cx.fill();
  if(edge){cx.strokeStyle=edge;cx.lineWidth=1.1;cx.beginPath();cx.moveTo(x0,-w);cx.quadraticCurveTo((x0+x1)/2,-w-curve,x1,0);cx.stroke();cx.strokeStyle=col;}};
 if(k==='katana'||k==='odachi'||k==='wakizashi'||k==='cursed'){const hl=k==='odachi'?26:k==='wakizashi'?12:18;
  cx.lineWidth=4.5;cx.lineCap='round';cx.beginPath();cx.moveTo(-hl,0);cx.lineTo(0,0);cx.stroke();cx.beginPath();cx.ellipse(1,0,2.2,6.5,0,0,7);cx.fill();blade(2,len,2.4,k==='odachi'?7:5);
  if(k==='cursed'&&!rim){cx.strokeStyle='rgba(255,120,160,.6)';cx.lineWidth=1;cx.beginPath();cx.moveTo(8,0);cx.lineTo(len-6,-2);cx.stroke();}}
 else if(k==='naginata'||k==='yari'){cx.lineWidth=3.5;cx.lineCap='round';cx.beginPath();cx.moveTo(-60,0);cx.lineTo(len,0);cx.stroke();
  if(k==='naginata')blade(len-2,len+30,3.2,8);else{cx.beginPath();cx.moveTo(len-2,-3.5);cx.lineTo(len+26,0);cx.lineTo(len-2,3.5);cx.fill();if(edge){cx.strokeStyle=edge;cx.lineWidth=1;cx.beginPath();cx.moveTo(len,-2.5);cx.lineTo(len+26,0);cx.stroke();}cx.fillRect(len-6,-5,4,10);}}
 else if(k==='kusarigama'){cx.lineWidth=3.5;cx.beginPath();cx.moveTo(-4,0);cx.lineTo(len,0);cx.stroke();cx.beginPath();cx.moveTo(len,-2);cx.quadraticCurveTo(len+4,-22,len-16,-30);cx.quadraticCurveTo(len-2,-18,len-3,2);cx.fill();
  if(edge){cx.strokeStyle=edge;cx.lineWidth=1;cx.beginPath();cx.moveTo(len-3,0);cx.quadraticCurveTo(len-1,-18,len-16,-30);cx.stroke();}}
 else if(k==='tessen'){const op=C.fanOpen===undefined?1:C.fanOpen;cx.beginPath();cx.moveTo(0,0);cx.arc(0,0,len,-0.9*op,0.9*op);cx.closePath();cx.fill();
  if(edge){cx.strokeStyle=edge;cx.lineWidth=0.8;for(let i=-3;i<=3;i++){const aa=i*0.3*op;cx.beginPath();cx.moveTo(4*Math.cos(aa),4*Math.sin(aa));cx.lineTo(len*Math.cos(aa),len*Math.sin(aa));cx.stroke();}}}
 else if(k==='kanabo'){cx.lineWidth=4.5;cx.lineCap='round';cx.beginPath();cx.moveTo(-14,0);cx.lineTo(4,0);cx.stroke();cx.beginPath();cx.moveTo(4,-3.5);cx.lineTo(len,-8);cx.quadraticCurveTo(len+6,0,len,8);cx.lineTo(4,3.5);cx.closePath();cx.fill();for(let s=14;s<len;s+=9){cx.fillRect(s,-9-s*0.04,3,18+s*0.08);}}
 else if(k==='tanto'){cx.lineWidth=4;cx.lineCap='round';cx.beginPath();cx.moveTo(-10,0);cx.lineTo(0,0);cx.stroke();cx.fillRect(0,-4,2.5,8);blade(2,len,2.2,2);}
 else if(k==='nagamaki'){cx.lineWidth=4.2;cx.lineCap='round';cx.beginPath();cx.moveTo(-46,0);cx.lineTo(0,0);cx.stroke();cx.beginPath();cx.ellipse(1,0,2.2,6.5,0,0,7);cx.fill();blade(2,len,2.6,6);}
 else if(k==='ono'){cx.lineWidth=4.5;cx.lineCap='round';cx.beginPath();cx.moveTo(-22,0);cx.lineTo(len-10,0);cx.stroke();cx.beginPath();cx.moveTo(len-18,-4);cx.quadraticCurveTo(len+10,-30,len+16,-6);cx.quadraticCurveTo(len+20,0,len+16,8);cx.quadraticCurveTo(len+10,30,len-18,4);cx.closePath();cx.fill();
  if(edge){cx.strokeStyle=edge;cx.lineWidth=1.1;cx.beginPath();cx.moveTo(len+16,-6);cx.quadraticCurveTo(len+20,0,len+16,8);cx.stroke();cx.strokeStyle=col;}}
 else if(k==='kunai'){cx.lineWidth=3;cx.beginPath();cx.moveTo(-8,0);cx.lineTo(2,0);cx.stroke();cx.beginPath();cx.arc(-11,0,3,0,7);cx.stroke();cx.beginPath();cx.moveTo(2,-3.5);cx.lineTo(len,0);cx.lineTo(2,3.5);cx.fill();}
 cx.restore();}
function drawHat(h,x,y,body,ph,wind){cx.fillStyle=body;cx.strokeStyle=body;
 if(h==='tengai'){cx.beginPath();cx.moveTo(x-16,y+14);cx.quadraticCurveTo(x-18,y-22,x,y-24);cx.quadraticCurveTo(x+18,y-22,x+16,y+14);cx.closePath();cx.fill();cx.strokeStyle='rgba(255,255,255,.12)';cx.lineWidth=1;for(let i=-3;i<=3;i++){cx.beginPath();cx.moveTo(x-16,y-10+i*6);cx.lineTo(x+16,y-10+i*6);cx.stroke();}return;}
 if(h==='eboshi'){cx.beginPath();cx.moveTo(x-9,y-6);cx.lineTo(x-6,y-30);cx.quadraticCurveTo(x+2,y-36,x+8,y-28);cx.lineTo(x+10,y-6);cx.closePath();cx.fill();return;}
 if(h==='menpo'){cx.beginPath();cx.ellipse(x-4,y-11,5,4,-.5,0,7);cx.fill();cx.fillStyle='#3a3b40';cx.beginPath();cx.moveTo(x-10,y-2);cx.lineTo(x+12,y-2);cx.lineTo(x+10,y+9);cx.quadraticCurveTo(x,y+13,x-9,y+8);cx.closePath();cx.fill();cx.fillStyle=body;return;}
 if(h==='kitsune'){cx.beginPath();cx.ellipse(x-4,y-11,5,4,-.5,0,7);cx.fill();cx.fillStyle='#f3ede2';cx.beginPath();cx.moveTo(x-11,y-10);cx.lineTo(x-9,y-22);cx.lineTo(x-4,y-13);cx.lineTo(x+6,y-13);cx.lineTo(x+11,y-22);cx.lineTo(x+13,y-10);cx.quadraticCurveTo(x+14,y+8,x+1,y+12);cx.quadraticCurveTo(x-12,y+8,x-11,y-10);cx.closePath();cx.fill();
  cx.strokeStyle='#c94a4a';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(x-7,y-6);cx.lineTo(x-3,y-3);cx.moveTo(x+9,y-6);cx.lineTo(x+5,y-3);cx.moveTo(x-4,y+6);cx.lineTo(x+6,y+6);cx.stroke();cx.fillStyle=body;cx.strokeStyle=body;return;}
 if(h==='hachigane'){cx.beginPath();cx.ellipse(x-4,y-11,5,4,-.5,0,7);cx.fill();cx.fillStyle='#8a8a90';cx.fillRect(x-7,y-9,15,5);cx.fillStyle=body;cx.fillRect(x-11,y-5,22,3);return;}
 if(h==='kabuto2'){drawHat('kabuto',x,y,body,ph,wind);cx.fillStyle='#d9a640';cx.beginPath();cx.arc(x+2,y-14,4,0,7);cx.fill();cx.fillStyle=body;return;}
 if(h==='shadowhood'){cx.beginPath();cx.arc(x,y-1,15,Math.PI*0.9,Math.PI*2.25);cx.lineTo(x-10,y+16);cx.quadraticCurveTo(x-20,y+6,x-14,y-6);cx.fill();cx.lineWidth=2.5;for(let k=0;k<2;k++){cx.beginPath();cx.moveTo(x-9,y+4+k*2);for(let i=1;i<=7;i++){const t=i/7;cx.lineTo(x-9-t*(30+wind*16),y+4+k*3+t*(8-wind*6)+Math.sin(ph*1.2-i*0.8+k*1.5)*(1+t*4*(1+wind)));}cx.stroke();}return;}
 if(h==='scarf'){cx.lineWidth=2.5;for(let k=0;k<2;k++){cx.beginPath();cx.moveTo(x-9,y+6+k*2);for(let i=1;i<=7;i++){const t=i/7;cx.lineTo(x-9-t*(30+wind*16),y+6+k*3+t*(8-wind*6)+Math.sin(ph*1.2-i*0.8+k*1.5)*(1+t*4*(1+wind)));}cx.stroke();}return;}
 if(h==='topknot'){cx.beginPath();cx.ellipse(x-4,y-11,4.5,4,-.5,0,7);cx.fill();return;}
 if(h==='shaven'){return;}
 if(h==='band'){cx.fillRect(x-11,y-5,22,3.5);cx.lineWidth=2.4;cx.beginPath();cx.moveTo(x-10,y-4);cx.lineTo(x-22,y+2+Math.sin(ph)*3);cx.moveTo(x-10,y-3);cx.lineTo(x-20,y+6+Math.sin(ph+1)*3);cx.stroke();return;}
 if(h==='fur'){cx.beginPath();cx.ellipse(x,y-6,15,9,0,0,7);cx.fill();for(let i=-14;i<15;i+=4){cx.fillRect(x+i,y-16-Math.abs(i%3)*2,2.4,7);}cx.beginPath();cx.moveTo(x-12,y-2);cx.lineTo(x-20,y+16);cx.lineTo(x-6,y+8);cx.fill();return;}
 if(h==='player'){cx.beginPath();cx.ellipse(x-6,y-10,5,4,-.6,0,7);cx.fill();
  cx.lineWidth=2.5;for(let k=0;k<2;k++){cx.beginPath();cx.moveTo(x-9,y-3+k*2);for(let i=1;i<=7;i++){const t=i/7;cx.lineTo(x-9-t*(30+wind*16),y-3+k*3+t*(8-wind*6)+Math.sin(ph*1.2-i*0.8+k*1.5)*(1+t*4*(1+wind)));}cx.stroke();}}
 else if(h==='kasa'){cx.beginPath();cx.moveTo(x-26,y-2);cx.lineTo(x+1,y-16);cx.lineTo(x+28,y-2);cx.quadraticCurveTo(x,y-7,x-26,y-2);cx.fill();}
 else if(h==='hood'){cx.beginPath();cx.arc(x,y-1,14,Math.PI*0.9,Math.PI*2.25);cx.lineTo(x-10,y+16);cx.quadraticCurveTo(x-20,y+6,x-14,y-6);cx.fill();}
 else if(h==='mask'){cx.lineWidth=2.4;for(let k=0;k<2;k++){cx.beginPath();cx.moveTo(x-10,y-1+k*3);for(let i=1;i<=6;i++){const t=i/6;cx.lineTo(x-10-t*24,y+k*3+t*6+Math.sin(ph-i+k)*(1+t*4));}cx.stroke();}}
 else if(h==='jingasa'){cx.beginPath();cx.moveTo(x-22,y-4);cx.quadraticCurveTo(x,y-22,x+22,y-4);cx.quadraticCurveTo(x,y-9,x-22,y-4);cx.fill();}
 else if(h==='oni'){cx.beginPath();cx.moveTo(x-6,y-8);cx.quadraticCurveTo(x-10,y-24,x-2,y-30);cx.quadraticCurveTo(x-2,y-18,x+1,y-9);cx.fill();cx.beginPath();cx.moveTo(x+4,y-9);cx.quadraticCurveTo(x+6,y-24,x+15,y-28);cx.quadraticCurveTo(x+10,y-17,x+10,y-6);cx.fill();
  cx.lineWidth=3;for(let i=0;i<4;i++){cx.beginPath();cx.moveTo(x-8,y-6+i*3);cx.quadraticCurveTo(x-22,y+4+i*4,x-20-Math.sin(ph+i)*3,y+20+i*4);cx.stroke();}}
 else if(h==='kunoichi'){cx.lineWidth=5;cx.beginPath();cx.moveTo(x-6,y-8);for(let i=1;i<=7;i++){const t=i/7;cx.lineTo(x-6-t*(28+wind*14),y-8+t*(30-wind*14)+Math.sin(ph-i*0.7)*(1+t*5));}cx.stroke();cx.beginPath();cx.ellipse(x-6,y-9,5,4,0,0,7);cx.fill();}
 else if(h==='kabuto'){cx.beginPath();cx.ellipse(x,y-3,16,12,0,Math.PI,Math.PI*2);cx.fill();cx.beginPath();cx.moveTo(x-16,y-3);cx.lineTo(x-22,y+8);cx.lineTo(x-4,y+2);cx.fill();
  cx.lineWidth=2.6;cx.beginPath();cx.moveTo(x+2,y-12);cx.quadraticCurveTo(x-14,y-26,x-20,y-40);cx.moveTo(x+2,y-12);cx.quadraticCurveTo(x+16,y-26,x+22,y-40);cx.stroke();
  cx.lineWidth=2.4;for(let i=0;i<3;i++){cx.beginPath();cx.moveTo(x-12,y+2+i*4);cx.quadraticCurveTo(x-24,y+16,x-22-Math.sin(ph+i)*3,y+30);cx.stroke();}}}

/* ---------- poses ---------- */
function swingPose(d,p,f){const v=[DV[d][0]*f,DV[d][1]],st=[-v[0],-v[1]],k=ease(clamp(p*1.6,0,1));
 const a0=Math.atan2(st[1],st[0]),a1=Math.atan2(v[1],v[0]);let da=a1-a0;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;
 return{hand:[lerp(st[0]*26+8,v[0]*34+22,k),lerp(st[1]*26+18,v[1]*30+22,k)],wa:a0+da*k,lean:0.12+0.25*k,hx:6*k,hy:-86+8*k,fF:[26+10*k,0]};}
function windPose(d,f,w){const v=[DV[d][0]*f,DV[d][1]],st=[-v[0],-v[1]],k=ease(clamp(w*1.6,0,1));
 return mix(BASE,{hand:[st[0]*26+4,st[1]*24+16],wa:Math.atan2(st[1],st[0])+0.25,lean:0.12-0.18*k+st[0]*0.1,hy:-81,fB:[-28,0],head:-0.1},k);}
function enemyPose(){const f=-1;let ps=mix(BASE,{},0);const br=Math.sin(T*2.2)*2;ps.hy+=br*0.6;ps.hand=[ps.hand[0],ps.hand[1]+br*0.4];
 if(E.state==='windup'){const w=E.windT/E.wind;ps=windPose(E.dir,f,w);if(E.atk.unblock){ps.hy+=8*w;ps.lean-=0.1*w;}ps.oy=Math.sin(T*40)*w*w*0.8;}
 else if(E.state==='strike'){const p=1-E.t/0.3;ps=mix(BASE,swingPose(E.dir,clamp(p*1.4,0,1),f),1);ps.ox=12*E.lunge;}
 else if(E.state==='open'){const r=E.recoil,sw=Math.sin(T*8)*0.06*E.stag;ps=mix(BASE,{hand:[-14,-8],wa:-2.3,lean:-0.28+sw,hy:-80,fF:[26,0],fB:[-34,0],head:-0.3,ox:-10*r},clamp(0.6+r*0.4,0,1));
  if(E.hurt>0){ps.lean-=E.hurt*0.15;ps.ox-=E.hurt*6;}
  if(E.kd>0){const q=1-E.kd/1.1,k2=q<0.3?ease(q/0.3):q<0.7?1:1-ease((q-0.7)/0.3);ps=mix(ps,{hy:-58,lean:0.5,hand:[6,40],wa:0.8,head:0.4,fF:[30,0],fB:[-14,0],ox:-26},k2);ps.rot=-1.25*k2;}}
 else if(E.state==='dead'){const k=clamp(E.deadT/1.1,0,1),k2=clamp((E.deadT-0.5)/0.7,0,1);ps=mix(BASE,{hy:-52,lean:0.7,hand:[10,44],wa:0.9,fF:[18,0],fB:[-30,0],head:0.5},ease(k));ps.rot=-1.45*ease(k2);}
 else if(E.block>0)ps=mix(ps,{hand:[20,-4],wa:-1.65},E.block);
 return ps;}
function playerPose(){let ps=mix(BASE,{},0);const br=Math.sin(T*2.4+1)*2;ps.hy+=br*0.6;
 if(P.swing>0)ps=mix(BASE,swingPose(P.swingDir,1-P.swing,1),1);
 if(P.blocking)ps=mix(ps,{hand:[22,-4],wa:-1.6,lean:0.02,hy:-80,fB:[-28,0]},0.9);
 if(P.dodge>0){const k=Math.sin((P.dodgeMax-P.dodge)/P.dodgeMax*Math.PI);
  if(P.dodgeKind==='jump')ps=mix(ps,{fF:[14,-30],fB:[-12,-26],lean:0.3,oy:-70},k);
  else ps=mix(ps,{ox:-60,lean:-0.25,hy:-74,fF:[30,0],fB:[-26,0]},k);}
 if(P.hurt>0)ps=mix(ps,{lean:-0.3,ox:ps.ox-10,head:-0.4},P.hurt*0.8);
 if(scene==='death')ps=mix(BASE,{hy:-50,lean:0.9,hand:[16,46],wa:1.2,head:0.6,fF:[22,0],fB:[-28,0]},ease(clamp(sceneT,0,1)));
 return ps;}
function enemyColors(d,live){const hurt=live&&E.hurt>0,p2=live&&E.p2;
 return{body:hurt?'#5a5d63':'#34373c',back:hurt?'#6a6d73':'#44484f',rim:hurt?'#fff':(p2?'#ff8a8a':'#a9b6cc'),eye:p2?'#ff2a2a':(d.hat==='oni'?'#ff6a3a':'#d8dde6'),glow:p2||d.hat==='oni'?10:4,hat:d.hat,weapon:d.weapon,
  offhand:d.weapon==='tessen'?'kunai':d.weapon==='wakizashi'?'wakizashi':null,cloth:d.cloth!==undefined?d.cloth:d.hat!=='oni',hakama:true,armor:d.armor!==undefined?d.armor:['kabuto','jingasa','oni'].includes(d.hat),seed:3,wind:live?E.lunge:0.3,chainSpin:live&&E.state==='windup'?1:0.2,fanOpen:live&&E.state==='idle'?0.4:1};}
function playerColors(w,live){const G=SV.gear,b=G.body,bi=GEAR.body[b]||{},ci=GEAR.cloak[G.cloak]||{};
 const armor=b==='do'||b==='oyoroi'||!!bi.armor,sode=b==='sode'||b==='oyoroi'||!!bi.sode,kote=b==='kote'||b==='oyoroi'||!!bi.kote;
 return{body:live&&P&&P.hurt>0?'#2a0d0d':'#020203',back:'#16161b',rim:'rgba(235,225,255,.55)',eye:'#f4f4f4',glow:6,hat:G.hat==='topknot'?'player':G.hat,scarf:G.cloak==='scarf',
  cape:G.cloak!=='scarf'?(ci.cape||G.cloak):null,capeCol:ci.capeCol||null,armor,sode,kote,armorCol:(armor||sode)?(bi.tint||null):null,
  offhand:(WEAPONS[SV.equip]||{}).off?'wakizashi':null,weapon:w,cloth:true,hakama:true,seed:0,wind:live?P.swing+(P.dodge>0?1:0):0.3,edge:(WEAPONS[SV.equip]||{}).kind==='cursed'?'rgba(255,120,160,.85)':undefined};}

/* ---------- world (layered parallax) ---------- */
const BG={
 bamboo:{sky:['#e9b06a','#c46a3a','#4a2a22'],sun:'#fff0c8',far:'#7a4a3a',mist:'rgba(255,215,170,',ground:['#3a2620','#120a08'],pc:'rgba(150,190,110,'},
 bridge:{sky:['#f4c6cc','#c07a8e','#4a2a3a'],sun:'#fff2f0',far:'#8a5a6c',mist:'rgba(255,220,230,',ground:['#3a2228','#100809'],pc:'rgba(255,190,205,'},
 pass:{sky:['#c9d2d6','#8a9aa2','#3a464c'],sun:'#f4f8fa',far:'#6a7a82',mist:'rgba(230,238,242,',ground:['#2e3438','#0c0f10'],pc:'rgba(240,245,250,'},
 temple:{sky:['#c7a6d4','#7a5a8e','#2c2038'],sun:'#fbeaff',far:'#5a4470',mist:'rgba(225,205,240,',ground:['#2a2230','#0c090e'],pc:'rgba(255,200,220,'},
 castle:{sky:['#f08a4a','#9a2e1e','#2a0c0a'],sun:'#ffe0a0',far:'#6a2018',mist:'rgba(255,170,120,',ground:['#2e1612','#0e0605'],pc:'rgba(255,150,60,'},
 roof:{sky:['#1a2a4a','#2e4670','#0e1426'],sun:'#f6f2e2',far:'#24345a',mist:'rgba(170,190,230,',ground:['#1a2234','#06080e'],pc:'rgba(255,210,225,'},
 throne:{sky:['#5a0a14','#2a0408','#0a0203'],sun:'#ff4a4a',far:'#3a0810',mist:'rgba(200,40,60,',ground:['#200608','#060102'],pc:'rgba(255,60,80,'},
 keep:{sky:['#4a2e22','#2a1a14','#120a08'],sun:'#f6d890',far:'#3a2418',mist:'rgba(255,200,140,',ground:['#2e1e14','#0c0806'],pc:'rgba(255,220,170,',indoor:1},
 road:{sky:['#7a8a90','#3a4a52','#1a2228'],sun:'#c8d0d4',far:'#2a3a3c',mist:'rgba(180,200,210,',ground:['#2a2e2c','#0a0c0b'],pc:'rgba(200,220,230,',rain:1},
 foundry:{sky:['#ff8a3a','#8a2a10','#1a0806'],sun:'#ffd090',far:'#3a1a10',mist:'rgba(255,140,60,',ground:['#2a1410','#0a0403'],pc:'rgba(255,170,80,',embers:1},
 ukiyo:{sky:['#4a1a30','#1a0a16','#080408'],sun:'#f3e6d0',far:'#2a1020',mist:'rgba(255,120,120,',ground:['#241a1e','#06040a'],pc:'rgba(255,255,255,',snow:1},
 shrine:{sky:['#b8c4d0','#6a7a90','#1a2230'],sun:'#f8f8f0',far:'#4a5a6a',mist:'rgba(220,230,240,',ground:['#aab0b8','#3a3e46'],pc:'rgba(255,255,255,',snow:1},
 spring:{sky:['#f6d8b8','#c88a8a','#6a4a6a'],sun:'#fff4e0',far:'#8a6a7a',mist:'rgba(255,220,220,',ground:['#4a4a3a','#161610'],pc:'rgba(255,200,215,'},
};
function lantern(x,y,s,col,glow){cx.save();cx.fillStyle=glow;cx.shadowColor=glow;cx.shadowBlur=18*s;cx.beginPath();cx.ellipse(x,y,9*s,12*s,0,0,7);cx.fill();cx.shadowBlur=0;cx.fillStyle=col;cx.fillRect(x-5*s,y-15*s,10*s,3*s);cx.fillRect(x-5*s,y+12*s,10*s,3*s);cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=1;for(let i=-1;i<=1;i++){cx.beginPath();cx.moveTo(x+i*5*s,y-12*s);cx.lineTo(x+i*5*s,y+12*s);cx.stroke();}cx.restore();}
function stoneLantern(x,y,s,col){cx.fillStyle=col;cx.fillRect(x-4*s,y-40*s,8*s,40*s);cx.fillRect(x-14*s,y-56*s,28*s,6*s);cx.fillRect(x-10*s,y-50*s,20*s,10*s);cx.beginPath();cx.moveTo(x-18*s,y-56*s);cx.lineTo(x,y-68*s);cx.lineTo(x+18*s,y-56*s);cx.fill();cx.fillRect(x-10*s,y-4*s,20*s,4*s);cx.fillStyle='rgba(255,220,150,.5)';cx.fillRect(x-5*s,y-48*s,10*s,6*s);}
function pine(x,y,s,col){cx.fillStyle=col;cx.fillRect(x-3*s,y-70*s,6*s,70*s);for(let k=0;k<4;k++){const w=(40-k*8)*s,yy=y-(26+k*14)*s;cx.beginPath();cx.moveTo(x-w,yy);cx.quadraticCurveTo(x,yy-10*s,x+w,yy);cx.quadraticCurveTo(x,yy-4*s,x-w,yy);cx.fill();}}
function kiln(x,y,s,col){cx.fillStyle=col;cx.beginPath();cx.moveTo(x-40*s,y);cx.quadraticCurveTo(x-40*s,y-50*s,x,y-56*s);cx.quadraticCurveTo(x+40*s,y-50*s,x+40*s,y);cx.fill();cx.fillRect(x+10*s,y-78*s,8*s,30*s);cx.fillStyle='rgba(255,200,140,.35)';cx.beginPath();cx.arc(x-12*s,y-14*s,8*s,0,7);cx.fill();}
let petals=[];for(let i=0;i<46;i++)petals.push({x:Math.random(),y:Math.random(),z:rnd(0.4,1.4),r:Math.random()*6});
function mtn(y,amp,col,seed,par){cx.fillStyle=col;cx.beginPath();cx.moveTo(0,H);for(let x=0;x<=W+20;x+=16){const xx=x+camX*par;cx.lineTo(x,y-amp*(0.5+0.5*Math.sin(xx*0.006+seed)*Math.sin(xx*0.0023+seed*2))-amp*0.3*Math.sin(xx*0.02+seed)**2);}cx.lineTo(W,H);cx.fill();}
function mistBand(y,h,c,a){const g=cx.createLinearGradient(0,y-h,0,y+h);g.addColorStop(0,c+'0)');g.addColorStop(.5,c+a+')');g.addColorStop(1,c+'0)');cx.fillStyle=g;cx.fillRect(0,y-h,W,h*2);}
function sakuraTree(x,y,s,col,bl){cx.strokeStyle=col;cx.lineCap='round';cx.lineWidth=10*s;cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+10*s,y-60*s,x-6*s,y-110*s);cx.stroke();
 cx.lineWidth=5*s;[[-1,0.7],[1,0.6],[-0.5,0.9],[0.8,0.95]].forEach(([d,h])=>{cx.beginPath();cx.moveTo(x-2*s,y-h*110*s);cx.quadraticCurveTo(x+d*40*s,y-h*130*s,x+d*70*s,y-h*120*s-20*s);cx.stroke();});
 cx.fillStyle=bl;for(let i=0;i<14;i++){const a=i*0.9,r=(40+(i*37)%40)*s;cx.beginPath();cx.arc(x+Math.cos(a)*r*1.4,y-130*s+Math.sin(a)*r*0.6,(22+(i*13)%16)*s,0,7);cx.fill();}}
function pagoda(x,y,s,col,tiers){cx.fillStyle=col;for(let i=0;i<tiers;i++){const w=(70-i*9)*s,yy=y-i*34*s;cx.fillRect(x-w*0.6,yy-26*s,w*1.2,26*s);cx.beginPath();cx.moveTo(x-w-12*s,yy-22*s);cx.quadraticCurveTo(x-w*0.5,yy-30*s,x,yy-40*s);cx.quadraticCurveTo(x+w*0.5,yy-30*s,x+w+12*s,yy-22*s);cx.lineTo(x+w,yy-28*s);cx.lineTo(x-w,yy-28*s);cx.fill();}
 cx.fillRect(x-1.5*s,y-tiers*34*s-40*s,3*s,30*s);}
function torii(x,y,s,col){cx.fillStyle=col;cx.fillRect(x-40*s,y-110*s,9*s,110*s);cx.fillRect(x+31*s,y-110*s,9*s,110*s);cx.fillRect(x-48*s,y-92*s,96*s,7*s);
 cx.beginPath();cx.moveTo(x-62*s,y-118*s);cx.quadraticCurveTo(x,y-108*s,x+62*s,y-118*s);cx.lineTo(x+58*s,y-106*s);cx.quadraticCurveTo(x,y-100*s,x-58*s,y-106*s);cx.fill();}
function drawWorld(){const l=L(),b=BG[ST.bg],hz=l.hz,gy=l.gy,sc=l.fs;
 const g=cx.createLinearGradient(0,0,0,gy);g.addColorStop(0,b.sky[2]);g.addColorStop(0.55,b.sky[1]);g.addColorStop(1,b.sky[0]);cx.fillStyle=g;cx.fillRect(0,0,W,H);
 const mr=(ST.bg==='roof'?90:ST.bg==='throne'?70:55)*sc,mx=W*(ST.bg==='roof'?0.5:0.62)-camX*0.05,my=hz-(ST.bg==='roof'?170:120)*sc;
 const sg=cx.createRadialGradient(mx,my,mr*0.6,mx,my,mr*3);sg.addColorStop(0,b.mist+'0.5)');sg.addColorStop(1,b.mist+'0)');cx.fillStyle=sg;cx.fillRect(0,0,W,H);
 if(!b.indoor){cx.fillStyle=b.sun;cx.beginPath();cx.arc(mx,my,mr,0,7);cx.fill();
 mtn(hz-30*sc,110*sc,b.far,1.3,0.08);mistBand(hz-40*sc,60*sc,b.mist,0.55);
 mtn(hz,70*sc,'rgba(20,10,15,.35)',4.1,0.15);}
 const dark='rgba(0,0,0,';cx.save();cx.translate(-camX*0.3,0);
 if(ST.bg==='bamboo'){for(let layer=0;layer<3;layer++){const n=14-layer*3,a=0.25+layer*0.3;cx.fillStyle=dark+a+')';for(let i=0;i<n;i++){const x=((i*137+layer*61)%1000)/1000*W*1.2-W*0.1,w=(4+layer*3)*sc,sw=Math.sin(T*0.8+i)*3*layer;
  cx.beginPath();cx.moveTo(x,gy);cx.quadraticCurveTo(x+sw,gy*0.5,x+sw*2,-10);cx.lineTo(x+sw*2+w,-10);cx.quadraticCurveTo(x+sw+w,gy*0.5,x+w,gy);cx.fill();for(let k=1;k<8;k++)cx.fillRect(x+sw*(k/8)-1,gy-k*gy/8,w+2,2*sc);}}}
 else if(ST.bg==='bridge'){sakuraTree(W*0.12,gy-10*sc,sc*1.1,'rgba(40,15,25,.85)','rgba(120,60,85,.55)');sakuraTree(W*0.9,gy-6*sc,sc*1.3,'rgba(40,15,25,.9)','rgba(110,50,75,.6)');
  cx.fillStyle='rgba(30,10,18,.9)';cx.fillRect(-20,gy-58*sc,W+40,6*sc);for(let x=0;x<W+40;x+=40*sc)cx.fillRect(x,gy-58*sc,5*sc,58*sc);}
 else if(ST.bg==='pass'){for(let i=0;i<9;i++){const x=(i*173%1000)/1000*W*1.2-W*0.1,s=sc*(0.6+(i%3)*0.3),y=hz+20*sc+(i%3)*14*sc;cx.fillStyle='rgba(25,32,36,'+(0.3+(i%3)*0.2)+')';
  cx.fillRect(x-2*s,y-120*s,4*s,120*s);for(let k=0;k<4;k++){cx.beginPath();cx.ellipse(x+(k%2?14:-12)*s,y-(40+k*24)*s,(36-k*6)*s,8*s,(k%2?-.15:.15),0,7);cx.fill();}}
  mistBand(hz+30*sc,50*sc,b.mist,0.7);}
 else if(ST.bg==='temple'){pagoda(W*0.78,hz+10*sc,sc,'rgba(25,15,35,.75)',5);torii(W*0.25,gy-20*sc,sc*1.2,'rgba(20,10,25,.92)');
  for(let i=0;i<6;i++){const x=W*(0.05+i*0.19),s=sc*0.8;cx.fillStyle='rgba(15,8,20,.9)';cx.fillRect(x-4*s,gy-50*s,8*s,50*s);cx.fillRect(x-14*s,gy-64*s,28*s,14*s);cx.beginPath();cx.moveTo(x-20*s,gy-64*s);cx.lineTo(x,gy-80*s);cx.lineTo(x+20*s,gy-64*s);cx.fill();
   cx.fillStyle='rgba(255,200,140,'+(0.15+0.1*Math.sin(T*3+i))+')';cx.fillRect(x-8*s,gy-61*s,16*s,8*s);}}
 else if(ST.bg==='castle'){const s=sc*1.2,x=W*0.5;cx.fillStyle='rgba(30,8,6,.85)';cx.fillRect(-20,gy-90*s,W+40,90*s);
  for(let i=0;i<4;i++){const w=(110-i*22)*s,y=gy-90*s-i*38*s;cx.fillRect(x-w*0.8,y-30*s,w*1.6,30*s);cx.beginPath();cx.moveTo(x-w-14*s,y-26*s);cx.quadraticCurveTo(x,y-46*s,x+w+14*s,y-26*s);cx.lineTo(x+w,y-34*s);cx.lineTo(x-w,y-34*s);cx.fill();}
  for(let i=0;i<5;i++){const bx=W*(0.08+i*0.22),wv=Math.sin(T*3+i)*4*sc;cx.fillStyle='rgba(20,5,4,.95)';cx.fillRect(bx,gy-150*sc,3*sc,150*sc);cx.beginPath();cx.moveTo(bx+3*sc,gy-148*sc);cx.lineTo(bx+26*sc+wv,gy-144*sc);cx.lineTo(bx+24*sc+wv*1.4,gy-80*sc);cx.lineTo(bx+3*sc,gy-84*sc);cx.fill();}}
 else if(ST.bg==='roof'){pagoda(W*0.2,hz+30*sc,sc*1.1,'rgba(8,12,24,.85)',3);pagoda(W*0.86,hz+20*sc,sc*0.8,'rgba(8,12,24,.7)',4);}
 else if(ST.bg==='throne'){const x=W*0.5;cx.lineCap='round';cx.strokeStyle='rgba(10,0,2,.95)';cx.lineWidth=26*sc;cx.beginPath();cx.moveTo(x,gy);cx.quadraticCurveTo(x+30*sc,gy-120*sc,x-10*sc,gy-220*sc);cx.stroke();cx.lineWidth=9*sc;
  for(let i=0;i<7;i++){const d=i%2?1:-1,h=0.5+i*0.07;cx.beginPath();cx.moveTo(x,gy-h*220*sc);cx.quadraticCurveTo(x+d*(80+i*15)*sc,gy-h*260*sc,x+d*(150+i*20)*sc,gy-h*240*sc-30*sc);cx.stroke();}
  cx.fillStyle='rgba(200,20,40,.35)';for(let i=0;i<30;i++){const a=i*0.7,r=(80+(i*53)%160)*sc;cx.beginPath();cx.arc(x+Math.cos(a)*r*1.3,gy-230*sc+Math.sin(a)*r*0.4,(18+(i*7)%14)*sc,0,7);cx.fill();}
  for(const px of [0.08,0.3,0.7,0.92]){cx.fillStyle='rgba(8,0,2,.95)';cx.fillRect(W*px-10*sc,0,20*sc,gy);}}
 else if(ST.bg==='keep'){ // lantern-lit hall: shoji screens, pillars, hanging lanterns
  for(let i=0;i<7;i++){const x=W*(0.02+i*0.16),w=W*0.13,y0=hz-150*sc,h=gy-y0;cx.fillStyle='rgba(255,230,180,'+(0.18+0.06*Math.sin(T*2+i))+')';cx.fillRect(x,y0,w,h);cx.strokeStyle='rgba(30,16,10,.9)';cx.lineWidth=3*sc;cx.strokeRect(x,y0,w,h);cx.lineWidth=1.5*sc;for(let k=1;k<4;k++){cx.beginPath();cx.moveTo(x,y0+h*k/4);cx.lineTo(x+w,y0+h*k/4);cx.stroke();}for(let k=1;k<3;k++){cx.beginPath();cx.moveTo(x+w*k/3,y0);cx.lineTo(x+w*k/3,y0+h);cx.stroke();}}
  for(let i=0;i<4;i++){cx.fillStyle='rgba(20,10,6,.95)';cx.fillRect(W*(0.12+i*0.25)-7*sc,0,14*sc,gy);}cx.fillStyle='rgba(20,10,6,.95)';cx.fillRect(0,hz-160*sc,W,12*sc);
  for(let i=0;i<3;i++)lantern(W*(0.25+i*0.25),hz-110*sc+Math.sin(T+i)*3*sc,sc*0.9,'#2a1a10','rgba(255,170,80,.75)');}
 else if(ST.bg==='road'){for(let i=0;i<8;i++){const x=(i*211%1000)/1000*W*1.2-W*0.1,s=sc*(0.7+(i%3)*0.3);pine(x,hz+30*sc+(i%3)*10*sc,s,'rgba(14,22,24,'+(0.4+(i%3)*0.2)+')');}
  mistBand(hz+30*sc,50*sc,b.mist,0.5);cx.fillStyle='rgba(20,24,26,.9)';cx.fillRect(W*0.2-8*sc,gy-60*sc,16*sc,60*sc);cx.fillRect(W*0.2-14*sc,gy-62*sc,28*sc,6*sc);}
 else if(ST.bg==='foundry'){const x=W*0.5;cx.fillStyle='rgba(30,10,6,.95)';cx.fillRect(x-150*sc,hz-40*sc,300*sc,gy-hz+40*sc);cx.fillRect(x-200*sc,hz+10*sc,400*sc,gy-hz);
  const fg=cx.createRadialGradient(x,gy-40*sc,10*sc,x,gy-40*sc,110*sc);fg.addColorStop(0,'rgba(255,220,120,'+(0.9+0.1*Math.sin(T*9))+')');fg.addColorStop(0.5,'rgba(255,120,40,.7)');fg.addColorStop(1,'rgba(120,20,0,0)');cx.fillStyle=fg;cx.beginPath();cx.arc(x,gy-40*sc,110*sc,0,7);cx.fill();
  cx.fillStyle='rgba(30,10,6,.98)';cx.beginPath();cx.moveTo(x-90*sc,gy);cx.lineTo(x-90*sc,gy-70*sc);cx.quadraticCurveTo(x,gy-150*sc,x+90*sc,gy-70*sc);cx.lineTo(x+90*sc,gy);cx.fill();cx.fillRect(x-40*sc,gy-60*sc,80*sc,-4*sc);
  for(const cxs of [0.12,0.26,0.74,0.9]){cx.fillStyle='rgba(20,6,4,.95)';cx.fillRect(W*cxs-9*sc,hz-170*sc,18*sc,170*sc);cx.fillStyle='rgba(60,50,50,.5)';for(let k=0;k<4;k++){cx.beginPath();cx.ellipse(W*cxs+Math.sin(T*0.7+k+cxs)*10*sc,hz-180*sc-k*22*sc,(14+k*7)*sc,(8+k*4)*sc,0,0,7);cx.fill();}}}
 else if(ST.bg==='ukiyo'){for(let i=0;i<6;i++){const x=W*(0.02+i*0.17),w=W*0.15,y0=hz-120*sc-(i%2)*30*sc;cx.fillStyle='rgba(16,8,12,.95)';cx.fillRect(x,y0,w,gy-y0);cx.fillRect(x-6*sc,y0-8*sc,w+12*sc,10*sc);
   for(let k=0;k<3;k++){cx.fillStyle='rgba(255,200,120,'+(0.25+0.15*Math.sin(T*3+k+i))+')';cx.fillRect(x+10*sc+k*w*0.3,y0+24*sc,w*0.2,30*sc);}}
  for(let i=0;i<9;i++){lantern(W*(0.06+i*0.11),hz-140*sc+Math.sin(T*1.3+i)*4*sc,sc*0.8,'#3a0c10','rgba(255,70,60,.85)');}
  cx.strokeStyle='rgba(0,0,0,.6)';cx.lineWidth=1.5*sc;cx.beginPath();cx.moveTo(0,hz-156*sc);cx.lineTo(W,hz-156*sc);cx.stroke();}
 else if(ST.bg==='shrine'){for(let i=0;i<7;i++){const x=(i*173%1000)/1000*W*1.2-W*0.1,s=sc*(0.8+(i%3)*0.3);pine(x,hz+16*sc+(i%3)*8*sc,s,'rgba(30,40,46,'+(0.35+(i%3)*0.2)+')');cx.fillStyle='rgba(240,244,248,.85)';cx.beginPath();cx.ellipse(x,hz+16*sc+(i%3)*8*sc-62*s,22*s,4*s,0,0,7);cx.fill();}
  torii(W*0.5,gy-10*sc,sc*1.35,'rgba(120,20,24,.95)');stoneLantern(W*0.2,gy-6*sc,sc,'rgba(60,66,74,.95)');stoneLantern(W*0.8,gy-6*sc,sc,'rgba(60,66,74,.95)');
  cx.fillStyle='rgba(235,240,245,.9)';cx.beginPath();cx.ellipse(W*0.2,gy-6*sc,22*sc,5*sc,0,0,7);cx.ellipse(W*0.8,gy-6*sc,22*sc,5*sc,0,0,7);cx.fill();mistBand(hz+40*sc,40*sc,b.mist,0.5);}
 else if(ST.bg==='spring'){sakuraTree(W*0.1,gy-6*sc,sc*1.2,'rgba(50,30,30,.85)','rgba(240,180,190,.7)');sakuraTree(W*0.92,gy-4*sc,sc*1.0,'rgba(50,30,30,.85)','rgba(240,170,185,.7)');
  kiln(W*0.62,hz+36*sc,sc*0.9,'rgba(40,30,26,.9)');kiln(W*0.42,hz+40*sc,sc*0.7,'rgba(40,30,26,.75)');cx.fillStyle='rgba(255,255,255,.25)';for(let k=0;k<5;k++){cx.beginPath();cx.ellipse(W*0.62+9*sc+Math.sin(T*0.5+k)*6*sc,hz-50*sc-k*16*sc,(8+k*4)*sc,(5+k*2)*sc,0,0,7);cx.fill();}
  cx.fillStyle='rgba(40,30,26,.9)';cx.fillRect(-20,gy-30*sc,W+40,4*sc);for(let x=0;x<W+40;x+=50*sc)cx.fillRect(x,gy-30*sc,4*sc,30*sc);}
 cx.restore();
 const top=gy-34*sc,gg=cx.createLinearGradient(0,top,0,H);gg.addColorStop(0,b.ground[0]);gg.addColorStop(1,b.ground[1]);cx.fillStyle=gg;cx.fillRect(0,top,W,H);
 mistBand(top,16*sc,b.mist,0.35);
 cx.strokeStyle='rgba(255,255,255,.06)';cx.lineWidth=1;const vx=W/2-camX*0.6,vy=gy-160*sc;
 for(let i=-12;i<=12;i++){const bx=W/2+i*W*0.12-camX;cx.beginPath();cx.moveTo(lerp(vx,bx,(top-vy)/(H-vy)),top);cx.lineTo(bx,H);cx.stroke();}
 for(let i=1;i<7;i++){const y=top+(H-top)*((i/7)**1.8);cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}
 cx.fillStyle='rgba(0,0,0,.45)';cx.beginPath();cx.ellipse(l.px+(playerPoseCache.ox||0)*sc,gy+2,48*sc,8*sc,0,0,7);cx.fill();
 cx.beginPath();cx.ellipse(l.ex,gy+2,52*sc*(ST.enemy.size||1),8*sc,0,0,7);cx.fill();}
function drawForeground(){const l=L(),b=BG[ST.bg],sc=l.fs;cx.fillStyle='rgba(0,0,0,.85)';const f=-camX*1.6;
 if(ST.bg==='bamboo'||ST.bg==='pass'){for(const [x,w] of [[-0.02,26],[1.0,34]])cx.fillRect(W*x+f-w*sc/2,0,w*sc,H);}
 else if(ST.bg==='roof'){cx.beginPath();cx.moveTo(-10,H);cx.lineTo(-10,H-40*sc);cx.quadraticCurveTo(W*0.5,H-20*sc,W+10,H-44*sc);cx.lineTo(W+10,H);cx.fill();}
 else{cx.beginPath();cx.ellipse(W*0.03+f,H,80*sc,40*sc,0,0,7);cx.ellipse(W*0.97+f,H,90*sc,34*sc,0,0,7);cx.fill();}
 if(b.indoor)return;
 for(const p of petals){const up=ST.bg==='castle'||b.embers;p.y+=(b.rain?0.012:b.snow?0.0012:0.0009)*p.z*(up?-1.4:1);p.x+=0.0006*p.z*Math.sin(T+p.r)-(b.rain?0.002:0.0004)*p.z;if(p.y>1.05)p.y=-0.05;if(p.y<-0.05)p.y=1.05;if(p.x<-0.05)p.x=1.05;
  const x=p.x*W-camX*p.z,y=p.y*H,s=p.z*3*U;
  if(b.rain){cx.strokeStyle=b.pc+(0.25+0.3*(p.z-0.4))+')';cx.lineWidth=1;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-4*U*p.z,y+16*U*p.z);cx.stroke();continue;}
  if(b.snow){cx.fillStyle=b.pc+(0.5+0.4*(p.z-0.4))+')';cx.beginPath();cx.arc(x,y,s*0.6,0,7);cx.fill();continue;}
  if(b.embers){cx.fillStyle=b.pc+(0.4+0.5*Math.sin(T*6+p.r)**2)+')';cx.fillRect(x,y,2*U*p.z,2*U*p.z);continue;}
  cx.fillStyle=b.pc+(0.35+0.4*(p.z-0.4))+')';cx.save();cx.translate(x,y);cx.rotate(T*2*p.z+p.r);cx.beginPath();cx.ellipse(0,0,s,s*0.55,0,0,7);cx.fill();cx.restore();}}

/* ---------- fight render ---------- */
let playerPoseCache=BASE;
function drawFighters(){const l=L(),sc=l.fs;const pp=playerPose();playerPoseCache=pp;const es=sc*(E.def.size||1);
 if(E.state==='strike'&&E.t>0.12){const d=DV[E.dir],a=Math.atan2(d[1],-d[0]),k=(0.3-E.t)/0.18,r=95*es;cx.save();cx.strokeStyle='rgba(70,72,80,'+(0.5*(1-k))+')';cx.lineWidth=10*es;cx.lineCap='round';cx.beginPath();cx.arc(l.ex-20*es,l.gy-110*es,r,a-1.1,a+0.3);cx.stroke();cx.restore();}
 if(P.swing>0.4){const d=DV[P.swingDir],a=Math.atan2(d[1],d[0]),r=(WLEN[P.w.kind]||70)*1.1*sc;cx.save();cx.strokeStyle='rgba(0,0,0,'+(0.45*P.swing)+')';cx.lineWidth=9*sc;cx.lineCap='round';cx.beginPath();cx.arc(l.px+24*sc,l.gy-110*sc,r,a-1.2,a+0.2);cx.stroke();cx.restore();}
 figure(l.ex,l.gy,-1,es,enemyPose(),enemyColors(E.def,true));figure(l.px,l.gy,1,sc,pp,playerColors(P.w.kind,true));
 if(E.state==='windup'){const a=E.atk,rem=windRemaining(),ready=rem<=0.6+P.w.win&&!(a.feint&&!E.feinted),wind=E.windT/E.wind;
  const cxp=(l.px+l.ex)/2+20*sc,cyp=l.gy-125*sc;
  if(a.unblock){cx.strokeStyle='rgba(255,60,40,'+(0.4+0.5*wind)+')';cx.lineWidth=4*U;cx.beginPath();cx.arc(cxp,cyp,Math.max(20*U,(70-30*wind)*sc),0,7);cx.stroke();
   cx.textAlign='center';cx.fillStyle='#ff5a3d';cx.font=font(26*U,1);cx.fillText(a.dg==='jump'?'跳':'退',cxp,cyp+6*U);cx.font=font(11*U,1);cx.fillText(a.dg==='jump'?'JUMP ▶':'◀ STEP BACK',cxp,cyp+22*U);}
  else{const d=DV[E.dir],len=62*sc;const feintPending=a.feint&&!E.feinted;
   if(SV.set.ring&&!feintPending)FX.timingRing(cx,cxp,cyp,rem,0.6+P.w.win,0.2+P.w.win*0.5,U,'#ffd27a','#ffffff');
   cx.save();cx.translate(cxp,cyp);cx.rotate(Math.atan2(d[1],d[0]));
   cx.globalAlpha=ready?0.95:0.45;cx.strokeStyle=ready?'#fff8ec':'#d8b9a0';cx.lineWidth=(ready?7:4)*U;cx.lineCap='round';
   cx.shadowColor='#ff7a50';cx.shadowBlur=ready?18:4;cx.beginPath();cx.moveTo(-len,0);cx.lineTo(len,0);cx.moveTo(len-18*U,-14*U);cx.lineTo(len,0);cx.lineTo(len-18*U,14*U);cx.stroke();cx.restore();
   if(E.miss>0){const md=DV[E.missDir];cx.save();cx.translate(cxp,cyp);cx.rotate(Math.atan2(md[1],md[0]));cx.globalAlpha=E.miss*1.4;cx.strokeStyle='#ff5a3d';cx.lineWidth=4*U;cx.lineCap='round';cx.beginPath();cx.moveTo(-len*0.6,0);cx.lineTo(len*0.6,0);cx.moveTo(len*0.6-12*U,-10*U);cx.lineTo(len*0.6,0);cx.lineTo(len*0.6-12*U,10*U);cx.stroke();cx.restore();
    cx.save();cx.globalAlpha=E.miss*1.4;cx.fillStyle='#ff5a3d';cx.font=font(10*U,1);cx.textAlign='center';cx.fillText('✕ wrong way · follow the arrow',cxp,cyp+70*sc);cx.restore();}}
  cx.textAlign='center';cx.font=font(11*U);cx.fillStyle='rgba(255,240,225,.85)';cx.fillText(a.jp+' · '+a.name,l.ex,Math.max(l.m+l.bh+34*U,l.gy-215*es-4*U));}}

/* ---------- HUD ---------- */
function bar(x,y,w,h,v,col,right,ghost){cx.fillStyle='rgba(0,0,0,.62)';cx.fillRect(x,y,w,h);
 if(ghost!=null&&ghost>v){const gw=w*clamp(ghost,0,1);cx.fillStyle='rgba(255,80,60,.75)';cx.fillRect(right?x+w-gw:x,y,gw,h);}
 const fw=w*clamp(v,0,1);cx.fillStyle=col;cx.fillRect(right?x+w-fw:x,y,fw,h);
 cx.fillStyle='rgba(255,255,255,.22)';cx.fillRect(right?x+w-fw:x,y,fw,h*0.35);
 // brush-ink ticks every 25%
 cx.fillStyle='rgba(0,0,0,.35)';for(let i=1;i<4;i++)cx.fillRect(x+w*i/4-0.5,y,1,h);
 cx.strokeStyle='rgba(240,225,200,.7)';cx.lineWidth=1.5;cx.strokeRect(x,y,w,h);}
function circleBtn(c,fill,ready,icon,label,pressed){cx.save();cx.globalAlpha=ready?0.95:0.55;
 const g=cx.createRadialGradient(c.x,c.y-c.r*0.3,c.r*0.2,c.x,c.y,c.r);g.addColorStop(0,pressed?'rgba(70,40,30,.75)':'rgba(30,18,16,.6)');g.addColorStop(1,'rgba(8,4,4,.55)');cx.fillStyle=g;cx.beginPath();cx.arc(c.x,c.y,c.r,0,7);cx.fill();
 if(fill!=null){cx.strokeStyle='rgba(255,255,255,.08)';cx.lineWidth=4;cx.beginPath();cx.arc(c.x,c.y,c.r-2,0,7);cx.stroke();
  if(ready){cx.shadowColor='#ffd27a';cx.shadowBlur=14+6*Math.sin(T*6);}cx.strokeStyle=ready?'#ffd27a':'#c9a88a';cx.lineWidth=4;cx.beginPath();cx.arc(c.x,c.y,c.r-2,-Math.PI/2,-Math.PI/2+6.283*fill);cx.stroke();cx.shadowBlur=0;}
 // ink-brush rim: two slightly offset strokes
 cx.strokeStyle='rgba(240,225,200,.65)';cx.lineWidth=2;cx.beginPath();cx.arc(c.x,c.y,c.r,0.2,6.1);cx.stroke();cx.strokeStyle='rgba(240,225,200,.3)';cx.lineWidth=3;cx.beginPath();cx.arc(c.x+1,c.y+1,c.r-1,2.6,5.9);cx.stroke();
 if(ready&&fill!=null&&fill>=1){cx.save();cx.globalAlpha=0.5+0.5*Math.sin(T*6);cx.strokeStyle='#ffd27a';cx.lineWidth=2;cx.beginPath();cx.arc(c.x,c.y,c.r+4*U+2*Math.sin(T*6),0,7);cx.stroke();cx.restore();}
 icon(c);if(label){cx.fillStyle='#f3e6d0';cx.font=font(c.r*0.3,1);cx.textAlign='center';cx.fillText(label,c.x,c.y+c.r*0.78);}cx.restore();}
function glyph(c,ch,col){cx.fillStyle=col;cx.font=font(c.r*0.8,1);cx.textAlign='center';cx.fillText(ch,c.x,c.y+c.r*0.22);}
function medallion(def,mood,x,y,r,flip){cx.save();cx.beginPath();cx.arc(x,y,r,0,7);cx.fillStyle='rgba(8,4,4,.85)';cx.fill();cx.clip();
 if(def){const sz=32*Math.max(1,Math.round(r*2.4/32));PIX.draw(cx,def,mood,x-sz/2,y-sz*0.46,sz,flip);}cx.restore();cx.strokeStyle='rgba(240,225,200,.8)';cx.lineWidth=2;cx.beginPath();cx.arc(x,y,r,0,7);cx.stroke();cx.strokeStyle='rgba(184,36,42,.9)';cx.lineWidth=1.5;cx.beginPath();cx.arc(x,y,r+3,0,7);cx.stroke();}
function drawHUD(){const l=L(),m=l.m,dt=0.016;
 P.ghost=P.ghost==null?P.hp:(P.ghost>P.hp?Math.max(P.hp,P.ghost-P.max*dt*0.45):P.hp);E.ghost=E.ghost==null?E.hp:(E.ghost>E.hp?Math.max(E.hp,E.ghost-E.max*dt*0.45):E.hp);
 const pr=Math.max(17,16*U),bx=m+2*pr+6,bw=l.barW-(2*pr+6);
 bar(bx,m,bw,l.bh,P.hp/P.max,P.hp<P.max*0.25?'#ff9a8a':'#e9e2d4',false,P.ghost/P.max);bar(W-m-l.barW,m,bw,l.bh,E.hp/E.max,E.p2?'#ff2a3a':'#b8282a',true,E.ghost/E.max);
 // portrait medallions at the bar ends
 const pm=P.hurt>0?'pain':P.hp<P.max*0.25?'grim':(E.state==='open'?'angry':P.blocking?'calm':'neutral');medallion(typeof CHARS!=='undefined'?CHARS.kage:null,pm,m+pr,m+pr,pr,false);
 const ek=E.def.key,ed=(typeof CHARS!=='undefined'&&CHARS[ek])||null,em=E.dead?'dead':E.hurt>0?'pain':E.p2?'shout':E.state==='windup'?'angry':E.state==='open'?'surprised':(MOODQ[ek]||'grim');medallion(ed,em,W-m-pr,m+pr,pr,true);
 // player text
 cx.font=font(Math.max(12,10.5*U),1);cx.fillStyle='#f3e6d0';cx.textAlign='left';cx.fillText(Math.ceil(P.hp)+' / '+P.max,bx,m+l.bh+14*U);
 const hw=cx.measureText(Math.ceil(P.hp)+' / '+P.max).width;for(let i=0;i<P.blockMax;i++){const dx=bx+hw+12*U+i*10*U,dy=m+l.bh+10.5*U;cx.beginPath();cx.arc(dx,dy,3.4*U,0,7);cx.fillStyle=i<P.blockDur?(P.blocking?'#ffd27a':'#f3e6d0'):'rgba(243,230,208,.22)';cx.fill();}
 cx.font=font(Math.max(10,9*U));cx.fillStyle='#d8c4ac';cx.fillText('影 KAGE · '+P.w.jp+' '+P.w.name+' · Lv '+lvl(),bx,m+l.bh+26*U);
 // enemy text
 cx.textAlign='right';cx.font=font(Math.max(12,10.5*U),1);cx.fillStyle='#f3e6d0';cx.fillText(Math.ceil(E.hp)+' / '+E.max,W-bx,m+l.bh+14*U);
 cx.font=font(Math.max(10,9*U));cx.fillStyle=E.p2?'#ff9a9a':'#d8c4ac';cx.fillText((ST.boss||ST.chBoss?'☗ ':'')+(E.p2?E.def.p2name:E.def.name),W-bx,m+l.bh+26*U);
 if(P.counter>0){cx.save();cx.globalAlpha=0.6+0.4*Math.sin(T*8);cx.fillStyle='#ffd27a';cx.font=font(Math.max(10,9*U),1);cx.textAlign='right';cx.fillText('返し COUNTER READY',W-bx,m+l.bh+38*U);cx.restore();}
 // centre: pause, chapter, streak
 {const px=W/2,py=m+l.bh*0.5+1;cx.save();cx.globalAlpha=0.75;cx.fillStyle='rgba(8,4,4,.6)';cx.beginPath();cx.arc(px,py+6*U,11*U,0,7);cx.fill();cx.fillStyle='#f3e6d0';cx.fillRect(px-4.5*U,py+1.5*U,3*U,9*U);cx.fillRect(px+1.5*U,py+1.5*U,3*U,9*U);cx.restore();}
 cx.textAlign='center';cx.font=font(Math.max(10,9*U));cx.fillStyle='rgba(243,230,208,.7)';cx.fillText(SURV?'無限狩り · ROUND '+SURV.round+'  (best '+SV.best+')':ST.jp+' · '+ST.name,W/2,m+l.bh+30*U);
 if(FX.streak>=2){const s=FX.streak,hot=s>=5;cx.save();cx.textAlign='center';if(hot){cx.shadowColor='#ff8a3a';cx.shadowBlur=12;}cx.fillStyle=hot?'#ffb070':'#ffd27a';cx.font=font(Math.max(12,11*U),1);cx.fillText('連 ×'+s+(hot?'  残心':''),W/2,m+l.bh+46*U);cx.restore();}
 circleBtn(l.magic,P.magic/100,P.magic>=100,c=>glyph(c,'狐','#8fd8ff'),'FOXFIRE');
 circleBtn(l.super,P.superM/100,P.superM>=100,c=>glyph(c,'奥','#fff2d0'),'OUGI');
 circleBtn(l.dodgeL,null,true,c=>glyph(c,'退','#f3e6d0'),'BACK',P.dodge>0&&P.dodgeKind==='back');circleBtn(l.dodgeR,null,true,c=>glyph(c,'跳','#f3e6d0'),'JUMP',P.dodge>0&&P.dodgeKind==='jump');
 circleBtn(l.block,null,P.blockDur>0,c=>{glyph(c,'受',P.blocking?'#fff':'#c9b8a0');cx.fillStyle='#ffd27a';cx.font=font(c.r*0.36,1);cx.fillText(P.blockDur,c.x+c.r*0.62,c.y-c.r*0.45);},'BLOCK',P.blocking);
 texts.forEach(t=>{const a=t.dmg?1-t.t/0.9:1-Math.max(0,t.t-0.7)/0.4;if(a<=0)return;cx.save();cx.globalAlpha=a;cx.textAlign='center';
  const pop=1+0.25*Math.max(0,0.15-t.t)/0.15,sz=(t.dmg?18:28)*U*t.size*(t.dmg?1:pop);
  const y=t.dmg?l.gy-190*l.fs-t.t*50:H*0.41,x=t.dmg?(t.px?l.px:l.ex)+(t.x||0):W/2;cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,.75)';cx.fillStyle=t.col;
  if(t.jp){cx.font=font(sz*1.15,1);cx.strokeText(t.jp,x,y);cx.fillText(t.jp,x,y);cx.font=font(sz*0.45,1);cx.strokeText(t.s,x,y+sz*0.6);cx.fillText(t.s,x,y+sz*0.6);}
  else{cx.font=font(sz,1);cx.strokeText(t.s,x,y);cx.fillText(t.s,x,y);}cx.restore();});}
function drawTrail(){if(trail.length<2)return;cx.save();cx.lineCap='round';cx.lineJoin='round';for(let i=1;i<trail.length;i++){const a=1-trail[i].t/0.25;if(a<=0)continue;cx.strokeStyle='rgba(255,248,235,'+a+')';cx.shadowColor='#ff9a6a';cx.shadowBlur=12;cx.lineWidth=(2+i/trail.length*9)*a;cx.beginPath();cx.moveTo(trail[i-1].x,trail[i-1].y);cx.lineTo(trail[i].x,trail[i].y);cx.stroke();}cx.restore();}
function drawParts(dt){parts=parts.filter(p=>(p.t+=dt)<p.l);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.fire?-0.05:0.25;cx.fillStyle=p.col;cx.globalAlpha=1-p.t/p.l;
 if(p.ink||p.fire){cx.beginPath();cx.arc(p.x,p.y,(p.fire?4:3)*U*(1-p.t/p.l*0.5),0,7);cx.fill();}else cx.fillRect(p.x,p.y,3,3);});cx.globalAlpha=1;}

/* ---------- screens ---------- */
function wrap(s,x,y,maxW,lh){const w=s.split(' ');let line='';for(const word of w){const t=line?line+' '+word:word;if(cx.measureText(t).width>maxW&&line){cx.fillText(line,x,y);y+=lh;line=word;}else line=t;}cx.fillText(line,x,y);return y+lh;}
function paper(){const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#ece0c8');g.addColorStop(1,'#d2c0a0');cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.fillStyle='rgba(120,80,50,.025)';for(let i=0;i<24;i++){cx.beginPath();cx.arc((i*211)%W,(i*137)%H,(i%5+2)*20,0,7);cx.fill();}}
function ensoSun(x,y,r){cx.fillStyle='#b8242a';cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();}
function demoFigs(){const l=L();const p=mix(BASE,{},0);p.hy+=Math.sin(T*2)*1.2;const d=ST.enemy;
 figure(l.ex,l.gy,-1,l.fs*(d.size||1),p,enemyColors(d,false));figure(l.px,l.gy,1,l.fs,p,playerColors((WEAPONS[SV.equip]||WEAPONS.katana).kind,false));}
function inkStroke(x,y,w,h,col,seed){cx.save();cx.fillStyle=col;cx.beginPath();cx.moveTo(x-w*0.5,y-h*0.5);for(let i=0;i<=8;i++){const t=i/8;cx.lineTo(x-w*0.5+w*t,y-h*0.5+Math.sin(t*9+seed)*h*0.08);}for(let i=8;i>=0;i--){const t=i/8;cx.lineTo(x-w*0.5+w*t,y+h*0.5+Math.sin(t*7+seed*2)*h*0.1);}cx.closePath();cx.fill();cx.restore();}
function smallBtn(x,y,w,h,label,fn,o={}){cx.save();cx.fillStyle=o.hi?'rgba(184,36,42,.9)':'rgba(20,12,10,.82)';cx.fillRect(x,y,w,h);cx.fillStyle=o.hi?'#f3e6d0':'#b8242a';cx.fillRect(x,y,3*U,h);cx.fillStyle='#f3e6d0';cx.font=font((o.fs||11)*U,1);cx.textAlign='center';cx.fillText(label,x+w/2,y+h*0.66);cx.restore();HOT.push({x,y,w,h,fn});}
function title(){ST=STAGES[Math.min(SV.cleared,STAGES.length-1)];drawWorld();demoFigs();drawForeground();cx.fillStyle='rgba(5,2,3,.38)';cx.fillRect(0,0,W,H);HOT=[];cx.textAlign='center';
 const k=clamp(sceneT*1.2,0,1);
 // ink banner behind the title
 cx.save();cx.globalAlpha=0.55*k;inkStroke(W/2,H*0.27,Math.min(W*0.7,420*U)*k,78*U,'#0a0708',1.3);cx.restore();
 cx.save();cx.globalAlpha=k;cx.fillStyle='#b8242a';cx.beginPath();cx.arc(W/2+Math.min(W*0.35,210*U),H*0.27-30*U,12*U*k,0,7);cx.fill();cx.restore();
 cx.fillStyle='#f3e6d0';cx.shadowColor='#000';cx.shadowBlur=18;cx.font=font(64*U,1);cx.save();cx.globalAlpha=k;cx.fillText('影ノ誓',W/2,H*0.3);cx.restore();cx.shadowBlur=0;
 cx.font=font(18*U,1);cx.fillText('KAGE NO CHIKAI',W/2,H*0.3+30*U);cx.font='italic '+font(13*U);cx.fillStyle='#e9d6c0';cx.fillText('Oath of the Shadow',W/2,H*0.3+50*U);
 cx.font=font(10*U);cx.fillStyle='#d8c4ac';cx.fillText('第二巻 ・ The Seventh Name',W/2,H*0.3+68*U);
 cx.fillStyle='rgba(255,245,230,'+(0.5+0.5*Math.sin(T*3))+')';cx.font=font(15*U);cx.fillText(SV.cleared>0?'画面をタップ  ·  Tap to continue':'画面をタップ  ·  Tap to begin',W/2,H*0.93-34*U);
 const b1=STAGES.filter((s,i)=>s.ch<6&&i<SV.cleared).length,b2=STAGES.filter((s,i)=>s.ch>=6&&i<SV.cleared).length;
 cx.fillStyle='#d8c4ac';cx.font=font(10*U);cx.fillText('Book One '+b1+'/'+BOOK1_STAGES+' · Book Two '+b2+'/'+(STAGES.length-BOOK1_STAGES)+' · Lv '+lvl()+' · 転生 '+SV.tensei+' · best hunt '+SV.best,W/2,H*0.93-16*U);
 const bw=74*U,bh=22*U;smallBtn(W/2-bw-6*U,H*0.95-bh*0.5,bw,bh,'設定 SETTINGS',()=>openSettings());smallBtn(W/2+6*U,H*0.95-bh*0.5,bw,bh,'功績 CREDITS',()=>{scene='credits';sceneT=0;});}
function credits(){paper();cx.textAlign='center';cx.fillStyle='#2a1a12';cx.font=font(22*U,1);cx.fillText('クレジット · CREDITS',W/2,H*0.13);
 cx.font=font(11.5*U);let y=H*0.21;const lh=16*U;
 ['影ノ誓 KAGE NO CHIKAI 弐 — a game by KeiCheong Mai. Original story and characters (The Ash Ledger); all art and animation are procedural.',
 'Sound effects: Kenney (kenney.nl, CC0); Michel Baradari — "11 Male Human Pain/Death Sounds" (CC-BY 3.0); Virix — "Magic SFX Sample" (CC-BY 3.0); artisticdude — "Swishes Sound Pack" (CC0), via OpenGameArt.org.',
 'CC-BY 3.0: creativecommons.org/licenses/by/3.0/ · Taiko, steel, shakuhachi and wind are synthesised in-game (WebAudio).',
 'Font: your device\u2019s Japanese serif (Noto Serif CJK / Hiragino / Yu Mincho).','Tap to return.'].forEach(s=>{y=wrap(s,W/2,y,W*0.86,lh)+lh*0.6;});}
function sealStamp(x,y,r,ch,rot){cx.save();cx.translate(x,y);cx.rotate(rot||-0.15);cx.fillStyle='rgba(184,36,42,.9)';cx.fillRect(-r,-r,2*r,2*r);cx.strokeStyle='rgba(255,220,200,.5)';cx.lineWidth=1.5;cx.strokeRect(-r*0.82,-r*0.82,r*1.64,r*1.64);cx.fillStyle='#f3e6d0';cx.font=font(r*1.3,1);cx.textAlign='center';cx.textBaseline='middle';cx.fillText(ch,0,r*0.05);cx.restore();cx.textBaseline='alphabetic';}
function mapScreen(){if(armoryOpen){drawArmoryPreview();return;}paper();HOT=[];const land=W>H;const book2Open=chapCleared(5);if(SV.book===2&&!book2Open)SV.book=1;
 cx.textAlign='left';cx.fillStyle='#2a1a12';cx.font=font(22*U,1);cx.fillText('灰の帳',W*0.05,H*0.1);cx.font=font(11*U);cx.fillText('THE ASH LEDGER  ·  Lv '+lvl()+'  ·  '+SV.mon+' 文  ·  転生 '+SV.tensei+'  ·  '+DIFFS[SV.diff].label,W*0.05+76*U,H*0.1);
 ensoSun(W*0.95,H*0.08,14*U);
 const colW=land?W*0.56:W*0.9,x0=W*0.05,y0=H*0.21,avail=(land?H*0.74:H*0.46),rh=Math.min(44*U,avail/6);
 // book tabs
 const tw=Math.min(150*U,colW*0.45),th=22*U;[['第一巻 · Book One',1,true],['第二巻 · Book Two',2,book2Open]].forEach(([t,b,ok],i)=>{const x=x0+i*(tw+6*U),y=H*0.13;cx.fillStyle=SV.book===b?'rgba(20,12,10,.9)':ok?'rgba(40,25,15,.12)':'rgba(40,25,15,.05)';cx.fillRect(x,y,tw,th);
  if(SV.book===b){cx.fillStyle='#b8242a';cx.fillRect(x,y,3*U,th);}cx.fillStyle=SV.book===b?'#f3e6d0':ok?'#2a1a12':'rgba(42,26,18,.35)';cx.font=font(11*U,1);cx.textAlign='left';cx.fillText(t+(ok?'':'  🔒'),x+10*U,y+th*0.68);if(ok)HOT.push({x,y,w:tw,h:th,fn:()=>{SV.book=b;save();}});});
 if(!book2Open){cx.fillStyle='#6a4a32';cx.font='italic '+font(9.5*U);cx.fillText('Strike through the six names to open Book Two',x0+2*(tw+6*U),H*0.13+th*0.68);}
 const chs=CHAPTERS.map((c,ci)=>[c,ci]).filter(([c])=>(c.book||1)===SV.book);
 chs.forEach(([c,ci],row)=>{const y=y0+row*rh,f=chapFirst(ci),open=f<=SV.cleared,done=chapCleared(ci),cur=open&&!done;
  cx.fillStyle=open?(cur?'rgba(184,36,42,.16)':'rgba(40,25,15,.06)'):'rgba(40,25,15,.03)';cx.fillRect(x0,y+2,colW,rh-4);if(cur){cx.fillStyle='#b8242a';cx.fillRect(x0,y+2,3*U,rh-4);}
  cx.fillStyle=open?'#2a1a12':'rgba(42,26,18,.35)';cx.font=font(rh*0.36,1);cx.textAlign='left';cx.fillText(c.jp,x0+10*U,y+rh*0.62);const tx=x0+10*U+rh*2.7;cx.font=font(rh*0.27,1);cx.fillText(c.id+'. '+c.name,tx,y+rh*0.42);
  const nb=STAGES.filter((s,i)=>s.ch===ci&&i<SV.cleared).length,tot=c.fights.length,bossF=FOES[c.fights[tot-1][0]];
  cx.font=font(rh*0.22);cx.fillStyle=open?'#6a4a32':'rgba(42,26,18,.3)';cx.fillText(open?(bossF.name+(bossF.title?', '+bossF.title:'')+' · '+((V2WEAPONS[bossF.wpn]||{}).name||bossF.wpn)):'— locked —',tx,y+rh*0.76);
  // duel progress dots
  for(let i=0;i<tot;i++){const dx=x0+colW-rh*1.6-8*U-(tot-i)*9*U,dy=y+rh*0.5;cx.beginPath();cx.arc(dx,dy,3*U,0,7);cx.fillStyle=i<nb?'#b8242a':'rgba(42,26,18,.2)';cx.fill();}
  // boss portrait medallion
  const pd=typeof CHARS!=='undefined'?CHARS[c.fights[tot-1][0]]:null;const mx=x0+colW-rh*0.55,my=y+rh*0.5;
  cx.save();cx.beginPath();cx.arc(mx,my,rh*0.4,0,7);cx.fillStyle=open?'rgba(20,12,10,.85)':'rgba(20,12,10,.25)';cx.fill();cx.clip();if(pd&&open)PIX.draw(cx,pd,done?(c.book===1?'dead':'calm'):(MOODQ[c.fights[tot-1][0]]||'grim'),mx-rh*0.42,my-rh*0.38,rh*0.84,true);
  if(!open){cx.fillStyle='rgba(42,26,18,.5)';cx.font=font(rh*0.4,1);cx.textAlign='center';cx.fillText('?',mx,my+rh*0.14);}cx.restore();cx.strokeStyle=open?'#2a1a12':'rgba(42,26,18,.2)';cx.lineWidth=1.5;cx.beginPath();cx.arc(mx,my,rh*0.4,0,7);cx.stroke();
  if(done)sealStamp(x0+colW-rh*1.25,y+rh*0.5,rh*0.26,'勝',-0.2);
  if(open)HOT.push({x:x0,y,w:colW,h:rh,fn:()=>{let s=f;while(s<SV.cleared&&s<chapLast(ci))s++;if(done)s=f;toStory(s);}});});
 const bx=land?W*0.65:W*0.05,bw=land?W*0.3:W*0.9,bh=Math.min(50*U,H*0.14);let by=land?H*0.13:y0+chs.length*rh+8*U;
 const wn=(WEAPONS[SV.equip]||WEAPONS.katana).name;
 [['無限狩り  SURVIVAL','Endless hunt · best round '+SV.best,()=>{survStart();}],['武器庫  ARMORY','Weapons & attire · '+wn,()=>openArmory()],
  ['設定  SETTINGS','Haptics · sound · parry ring',()=>openSettings()],
  ['難易度  DIFFICULTY',DIFFS[SV.diff].label+' (tap to change)',()=>{const k=Object.keys(DIFFS);SV.diff=k[(k.indexOf(SV.diff)+1)%k.length];save();rebuildStages();}]].forEach(([t,s,fn])=>{
  cx.fillStyle='rgba(20,12,10,.88)';cx.fillRect(bx,by,bw,bh-6*U);cx.fillStyle='#b8242a';cx.fillRect(bx,by,4*U,bh-6*U);cx.fillStyle='#f3e6d0';cx.font=font(bh*0.3,1);cx.textAlign='left';cx.fillText(t,bx+12*U,by+bh*0.42);
  cx.font=font(bh*0.2);cx.fillStyle='#cdb9a0';cx.fillText(s,bx+12*U,by+bh*0.72);HOT.push({x:bx,y:by,w:bw,h:bh-6*U,fn});by+=bh;});
 if(land){const ps=32*Math.floor(Math.min(96*U,H-by-34*U)/32);if(ps>=64){cx.save();const px=bx+bw/2-ps/2,py=by+4*U;cx.fillStyle='rgba(20,12,10,.08)';cx.fillRect(px-8*U,py-4*U,ps+16*U,ps+8*U);PIX.draw(cx,CHARS.kage,SV.ending==='shadow'?'grim':'neutral',px,py,ps,false);cx.restore();
  cx.fillStyle='#6a4a32';cx.font=font(9*U);cx.textAlign='center';cx.fillText(SV.ending==='shadow'?'The Shadow':SV.ending==='ash'?'The Charcoal-Burner':'Kage of Kurosawa',bx+bw/2,Math.min(H-6*U,by+ps+14*U));}}
 cx.fillStyle='#6a4a32';cx.font=font(10*U);cx.textAlign='center';cx.fillText('Tap a chapter to continue the hunt · cleared chapters replay their duels',W/2,H-6*U);}
function rebuildStages(){const old=STAGES.slice();old.forEach((s,i)=>{const fg=CHAPTERS[s.ch].fights.find(f=>true);});STAGES.forEach((s,i)=>{const n=buildStage(s.enemy.key,null,{});s.atk=n.atk;s.pat=n.pat;s.enemy=Object.assign(n.enemy,{p2name:s.enemy.p2name});});}
function survScale(r){const u=['s','c'];if(r>=3)u.push('f');if(r>=5)u.push('g');if(r>=7)u.push('d');if(r>=9)u.push('u');return{hp:1+0.12*(r-1),dm:1+0.06*(r-1),spd:Math.max(0.55,1-0.025*(r-1)),unlock:r>=12?null:u};}
function survFoe(r){if(r%5===0)return SURV_BOSSES[Math.min(SURV_BOSSES.length-1,Math.floor(r/5)-1+Math.floor(Math.random()*3))];return SURV_POOL[Math.floor(Math.random()*SURV_POOL.length)];}
const SBG=['bamboo','bridge','pass','temple','castle','roof','throne'];
function survStage(){const r=SURV.round,k=survFoe(r);SURV.st=buildStage(k,survScale(r),{id:'surv',ch:-1,jp:'無限狩り',name:'Endless Hunt · Round '+r,bg:SBG[Math.floor((r-1)/3)%SBG.length],story:[],win:'',loot:'',mini:r%5===0});ST=SURV.st;}
function survStart(){SURV={round:1,hp:null};survStage();stageI=0;newDuel(0,SURV.st);SURV.hp=P.max;scene='survnext';sceneT=0;}
function survCard(over){inkBg();cx.textAlign='center';cx.fillStyle='#f3e6d0';
 if(over){cx.font=font(46*U,1);cx.fillText('狩りの終わり',W/2,H*0.32);cx.font=font(16*U,1);cx.fillText('THE HUNT ENDS',W/2,H*0.32+26*U);cx.font=font(14*U);
  cx.fillText('Rounds survived: '+SURV.final,W/2,H*0.55);cx.fillText('Best: '+SV.best+(SURV.final>=SV.best&&SURV.final>0?'  — record':''),W/2,H*0.55+22*U);if(sceneT>1.2){cx.fillStyle='#e0b0a0';cx.fillText('Tap to return',W/2,H*0.9);}return;}
 const e=SURV.st.enemy,r=SURV.round;cx.font=font(14*U,1);cx.fillText('無限狩り · SURVIVAL',W/2,H*0.2);cx.font=font(40*U,1);cx.fillText('ROUND '+r,W/2,H*0.36);
 cx.font=font(15*U,1);cx.fillText((SURV.st.mini?'— a named blade —  ':'')+e.name,W/2,H*0.48);cx.font=font(12*U);cx.fillText(e.jp+' · '+(V2WEAPONS[FOES[e.key].wpn].name),W/2,H*0.48+18*U);
 if(SURV.healed)cx.fillText('You bind your wounds: +'+SURV.healed+' HP',W/2,H*0.62);
 cx.fillText('Health '+Math.round(SURV.hp)+' / '+P.max+'   ·   Best round '+SV.best,W/2,H*0.62+20*U);if(sceneT>0.6){cx.fillStyle='#e0b0a0';cx.fillText('Tap to fight',W/2,H*0.9);}}
function story(){drawWorld();demoFigs();drawForeground();cx.fillStyle='rgba(8,4,4,.66)';cx.fillRect(0,0,W,H);
 const bw=Math.min(W*0.86,560*U),bh=Math.min(H*0.84,250*U),bx=(W-bw)/2,by=(H-bh)/2;cx.save();const k=clamp(sceneT*2.5,0,1);cx.globalAlpha=k;cx.translate(0,(1-k)*20*U);
 const g=cx.createLinearGradient(0,by,0,by+bh);g.addColorStop(0,'rgba(236,224,200,.97)');g.addColorStop(1,'rgba(214,196,164,.97)');cx.fillStyle=g;cx.fillRect(bx,by,bw,bh);
 cx.fillStyle='#3a2416';cx.fillRect(bx-6*U,by-4*U,bw+12*U,6*U);cx.fillRect(bx-6*U,by+bh-2*U,bw+12*U,6*U);
 const ps=32*Math.max(2,Math.round(Math.min(bh*0.5,110*U)/32));const ek=ST.enemy.key,ed=typeof CHARS!=='undefined'?CHARS[ek]:null;
 if(typeof CHARS!=='undefined'){PIX.draw(cx,CHARS.kage,'grim',bx+14*U,by+bh*0.5-ps*0.5,ps,false);}
 if(ed)PIX.draw(cx,ed,MOODQ[ek]||'grim',bx+bw-14*U-ps,by+bh*0.5-ps*0.5,ps,true);else{cx.fillStyle='rgba(20,12,10,.2)';cx.fillRect(bx+bw-14*U-ps,by+bh*0.5-ps*0.5,ps,ps);}
 cx.textAlign='center';cx.fillStyle='#2a1a12';cx.font=font(24*U,1);cx.fillText(ST.jp,W/2,by+30*U);cx.font=font(10*U,1);cx.fillStyle='#6a4a32';cx.fillText((SURV?'ENDLESS HUNT':'CHAPTER '+CHAPTERS[ST.ch].id)+'  ·  '+ST.name.toUpperCase(),W/2,by+44*U);
 cx.fillStyle='#b8242a';cx.font=font(30*U,1);cx.fillText('対',W/2,by+bh*0.5+10*U);
 cx.fillStyle='#2a1a12';cx.font=font(11*U,1);cx.textAlign='left';cx.fillText('影 KAGE',bx+14*U,by+bh*0.5+ps*0.5+16*U);cx.font=font(9*U);cx.fillStyle='#6a4a32';cx.fillText(P.w.jp+' '+P.w.name+' · '+P.max+' HP',bx+14*U,by+bh*0.5+ps*0.5+28*U);
 cx.textAlign='right';cx.fillStyle='#2a1a12';cx.font=font(11*U,1);cx.fillText(ST.enemy.name,bx+bw-14*U,by+bh*0.5+ps*0.5+16*U);cx.font=font(9*U);cx.fillStyle='#6a4a32';cx.fillText(ST.enemy.jp+' · '+((V2WEAPONS[FOES[ek].wpn]||{}).name||FOES[ek].wpn)+' · '+ST.enemy.hp+' HP',bx+bw-14*U,by+bh*0.5+ps*0.5+28*U);
 cx.textAlign='center';cx.fillStyle='#8a2a20';cx.font=font(9.5*U,1);cx.fillText('Swipe to strike · swipe along the glowing arrow to parry · red 退/跳 = dodge · hold 受 to block',W/2,by+bh-24*U);
 if(sceneT>0.6){cx.fillStyle='rgba(138,42,32,'+(0.6+0.4*Math.sin(T*5))+')';cx.font=font(12*U,1);cx.fillText('Tap to fight  ▶',W/2,by+bh-9*U);}cx.restore();}
function victory(){drawWorld();drawFighters();drawForeground();const a=sceneT<0.25?sceneT/0.25:sceneT<1.2?1:Math.max(0.82,1-(sceneT-1.2)*0.3);cx.fillStyle='rgba(245,238,226,'+a+')';cx.fillRect(0,0,W,H);
 if(sceneT>0.3){cx.textAlign='center';cx.fillStyle='#1a0e0a';cx.font=font(80*U,1);cx.fillText('勝利',W/2,H*0.44);
  const k=clamp((sceneT-0.5)/0.25,0,1);if(k>0){cx.save();cx.globalAlpha=k;cx.translate(0,(1-k)*-20*U);sealStamp(W/2+104*U,H*0.44-60*U,16*U*(1.4-0.4*k),'勝',-0.2);cx.restore();}
  cx.font=font(18*U,1);cx.fillText('V I C T O R Y',W/2,H*0.44+28*U);
  cx.font=font(11*U);cx.fillStyle='#6a4a32';cx.fillText(ST.enemy.name+' falls',W/2,H*0.44+46*U);}
 if(sceneT>1.2&&ST.win){cx.font='italic '+font(12*U);cx.fillStyle='#4a3020';cx.textAlign='center';wrap(ST.win,W/2,H*0.44+70*U,W*0.8,16*U);}
 if(sceneT>1.6){cx.font=font(10*U);cx.fillStyle='#8a2a20';cx.textAlign='center';cx.fillText('受け流し '+stats.parries+'   完璧 '+stats.perfect+'   回避 '+stats.dodges+'   返し '+stats.counters+'   連 ×'+stats.streak+'   '+stats.t.toFixed(0)+' s',W/2,H*0.86);}
 if(sceneT>2.2){cx.fillStyle='rgba(138,42,32,'+(0.6+0.4*Math.sin(T*5))+')';cx.font=font(12*U);cx.fillText('Tap to continue',W/2,H*0.93);}}
function pauseScreen(){HOT=[];cx.fillStyle='rgba(5,2,3,.72)';cx.fillRect(0,0,W,H);cx.textAlign='center';cx.fillStyle='#f3e6d0';cx.font=font(40*U,1);cx.fillText('間',W/2,H*0.26);cx.font=font(14*U,1);cx.fillText('PAUSED',W/2,H*0.26+22*U);
 const bw=Math.min(W*0.5,240*U),bh=32*U,x=W/2-bw/2;let y=H*0.4;
 [['再開  RESUME',()=>resumeGame(),1],['設定  SETTINGS',()=>openSettings(),0],[SURV?'狩りを終える  END HUNT':'退却  RETREAT TO MAP',()=>retreat(),0]].forEach(([t,fn,hi])=>{smallBtn(x,y,bw,bh,t,fn,{hi,fs:13});y+=bh+10*U;});
 cx.fillStyle='#cdb9a0';cx.font=font(9.5*U);cx.fillText('Swipe = strike / parry along the arrow · 退 · 跳 dodge · hold 受 to block · 狐 Foxfire · 奥 Ougi',W/2,H*0.92);}
function inkBg(){const g=cx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);g.addColorStop(0,'#5a1a1c');g.addColorStop(1,'#120607');cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.strokeStyle='rgba(255,200,190,.08)';cx.lineWidth=3;for(let i=0;i<9;i++){cx.beginPath();for(let a=0;a<6.3;a+=0.15){const r=30*U+i*28*U+Math.sin(a*3+T*1.5+i)*8*U;cx.lineTo(W/2+Math.cos(a+T*0.2*(i%2?1:-1))*r,H/2+Math.sin(a+T*0.2)*r*0.8);}cx.stroke();}}
function loot(){inkBg();const wid=unlockedNow,k=wid?WEAPONS[wid].kind:ST.enemy.weapon;cx.save();cx.translate(W/2,H*0.38+Math.sin(T*2)*6*U);cx.rotate(-0.5+Math.sin(T)*0.1);cx.scale(2.2*U,2.2*U);
 drawWeapon(k,-30,0,0,'#0a0505',false,{edge:'#f3e6d0',fanOpen:1});cx.restore();
 if(wid){cx.save();cx.globalAlpha=0.5+0.3*Math.sin(T*3);cx.strokeStyle='#ffd27a';cx.lineWidth=2*U;cx.beginPath();cx.arc(W/2,H*0.38,70*U+6*U*Math.sin(T*3),0,7);cx.stroke();cx.restore();}
 cx.textAlign='center';cx.fillStyle='#f3e6d0';cx.font=font(20*U,1);cx.fillText(wid?WEAPONS[wid].jp+' '+WEAPONS[wid].name:'戦利品 · SPOILS',W/2,H*0.64);cx.font=font(12*U);cx.fillStyle='#e9d6c0';cx.fillText(wid?'NEW WEAPON — '+WEAPONS[wid].desc:ST.loot,W/2,H*0.64+20*U);
 cx.fillStyle='#ffd27a';cx.font=font(13*U,1);cx.fillText('+ '+(stats.mon||0)+' 文 mon',W/2,H*0.64+40*U);
 if(gearUnlockedNow.length){cx.fillStyle='#9fe3a0';cx.font=font(11*U);const names=gearUnlockedNow.slice(0,4).map(s=>{const [sl,k]=s.split(':');const it=sl==='weapon'?V2WEAPONS[k]:GEAR[sl][k];return (it.jp||'')+' '+it.name;}).join('  ·  ');cx.fillText('UNLOCKED: '+names+(gearUnlockedNow.length>4?' …':''),W/2,H*0.64+60*U);}
 cx.fillStyle='#e0b0a0';cx.font=font(12*U);cx.fillText('Tap to continue',W/2,H*0.93);}
function xp(){inkBg();cx.textAlign='left';const x=W*0.08;let y=H*0.14;cx.fillStyle='#f3e6d0';cx.font=font(20*U,1);cx.fillText('経験 · EXPERIENCE',x,y);y+=26*U;cx.font=font(12.5*U);
 const lvBefore=Math.min(20,1+Math.floor((SV.xp-stats.xp)/900)),lvUp=lvl()>lvBefore;
 [['Duel XP','+'+stats.xp],['Parries',stats.parries],['Perfect parries',stats.perfect],['Counters',stats.counters],['Dodges',stats.dodges],['Best combo',stats.maxCombo],['Longest parry streak',stats.streak],['Time',stats.t.toFixed(0)+' s']].forEach(([k,v])=>{cx.fillStyle='#d8c4ac';cx.fillText(k,x,y);cx.textAlign='right';cx.fillStyle='#f3e6d0';cx.fillText(v,W*0.92,y);cx.textAlign='left';y+=17*U;});
 y+=6*U;const f=(SV.xp%900)/900;cx.fillStyle='#f3e6d0';cx.fillText('Kage — Level '+lvl()+'  (+20 HP per level)'+(lvUp?'   ▲ LEVEL UP':''),x,y);y+=8*U;bar(x,y,W*0.84,10*U,Math.min(f,sceneT/1.5*f+0.0001),lvUp?'#ffd27a':'#f3e6d0');
 if(lvUp&&sceneT<0.05)hap('levelUp');
 cx.textAlign='center';cx.fillStyle='#e0b0a0';cx.font=font(12*U);cx.fillText(ST.ending?'Tap — epilogue':ST.chBoss?'Tap to return to the Ledger':'Tap — next duel',W/2,H*0.93);}
function ending(){paper();HOT=[];const lines=endingKey==='one'?ENDING:(typeof EPILOGUE_B2!=='undefined'?(endingKey==='final'?EPILOGUE_B2.final:(EPILOGUE_B2[SV.ending]||EPILOGUE_B2.ash)):ENDING);
 cx.textAlign='center';cx.fillStyle='#2a1a12';cx.font=font(28*U,1);cx.fillText(endingKey==='one'?'結び · EPILOGUE':endingKey==='final'?'終章 · THE END OF WINTER':(SV.ending==='shadow'?'七 · SEVEN':'灰 · ASH'),W/2,H*0.15);ensoSun(W/2,H*0.15+20*U,7*U);
 cx.font='italic '+font(13*U);let y=H*0.3;lines.forEach((s,i)=>{cx.globalAlpha=clamp(sceneT*0.8-i*0.8,0,1);y=wrap(s,W/2,y,W*0.8,18*U)+10*U;});cx.globalAlpha=1;
 if(sceneT>3){cx.fillStyle='#8a2a20';cx.font=font(11*U);cx.fillText(endingKey==='one'?'Book Two — The Seventh Name — is now open on the Ledger. Tap to return.':'Thank you for playing. Every duel stays open for rematches. Tap to return.',W/2,H*0.93);}}
function death(){drawWorld();drawFighters();drawForeground();cx.fillStyle='rgba(0,0,0,'+Math.min(0.85,sceneT*0.6)+')';cx.fillRect(0,0,W,H);cx.textAlign='center';
 if(sceneT>0.8){cx.globalAlpha=clamp(sceneT-0.8,0,1);cx.fillStyle='#d8c8b8';cx.font='italic '+font(14*U);cx.fillText('The shadow falls… and gathers itself at dusk.',W/2,H*0.28);
  cx.fillStyle='#f3e6d0';cx.shadowColor='#b8242a';cx.shadowBlur=24;cx.font=font(56*U,1);cx.fillText('転生',W/2,H*0.5);cx.shadowBlur=0;cx.font=font(16*U,1);cx.fillText('TENSEI '+SV.tensei,W/2,H*0.5+24*U);
  cx.fillStyle='#c8b0a0';cx.font='italic '+font(13*U);cx.fillText(DEATH_Q[SV.tensei%DEATH_Q.length],W/2,H*0.68);
  cx.fillStyle='#a08878';cx.font=font(10*U);cx.fillText('Parries '+stats.parries+' · perfect '+stats.perfect+' · '+Math.round(100-E.hp/E.max*100)+'% of '+E.def.name+' cut down',W/2,H*0.76);cx.globalAlpha=1;}
 if(sceneT>2.2){cx.fillStyle='rgba(160,136,120,'+(0.6+0.4*Math.sin(T*5))+')';cx.font=font(12*U);cx.fillText('Tap to rise again',W/2,H*0.88);}}

/* ---------- loop ---------- */
let last=performance.now(),lastRaw=last,T=0,liteToast=0;window.onLiteSwitch=function(){liteToast=6;SV.set.fx='lite';save();};
let fade=0,fadeTo=null,fadeFn=null;
function transition(fn){fadeTo=fn;fade=0.001;}
function musicScene(){const n=scene==='fight'||scene==='pause'?((ST&&(ST.boss||ST.chBoss))||(SURV&&SURV.st&&SURV.st.mini)?'boss':'duel'):scene==='death'||scene==='survover'?'death':scene==='victory'||scene==='loot'||scene==='xp'?'victory':scene==='title'?'title':'map';MUSIC.play(n);}
function frame(now){try{frameBody(now);}catch(e){try{reportError(e);}catch(x){}}requestAnimationFrame(frame);}
function frameBody(now){const rdt=Math.min(0.05,(now-last)/1000);last=now;T+=rdt;sceneT+=rdt;music(rdt);try{perfTick((now-lastRaw)/1000,scene==='fight');}catch(e){}lastRaw=now;try{if(AC)musicScene();MUSIC.update(rdt);}catch(e){}
 const ts=scene==='fight'?FX.timeScale(rdt):1,dt=rdt*ts;FX.update(rdt);if(scene==='dialog')DLG.update(rdt);
 trail.forEach(t=>t.t+=rdt);trail=trail.filter(t=>t.t<0.25);texts.forEach(t=>t.t+=rdt);texts=texts.filter(t=>t.t<1.2);
 const ct=scene==='fight'?(E.state==='windup'?-8:E.state==='open'?14:0)+(P.dodge>0&&P.dodgeKind==='back'?-10:0):Math.sin(T*0.25)*16;camX=lerp(camX,ct,Math.min(1,rdt*2));
 if(E.dead)E.deadT+=rdt;if(E.kd>0)E.kd=Math.max(0,E.kd-dt);if(E.miss>0)E.miss=Math.max(0,E.miss-rdt);
 cx.save();
 if(scene==='fight'){stats.t+=dt;if(sceneT>1)enemyUpdate(dt);P.dodge=Math.max(0,P.dodge-dt);P.swing=Math.max(0,P.swing-dt*5);P.hurt=Math.max(0,P.hurt-dt*3);P.cd=Math.max(0,P.cd-dt);
  if(!P.blocking){P.blockRegen+=dt;if(P.blockRegen>P.regen&&P.blockDur<P.blockMax){P.blockDur++;P.blockRegen=0;hap('tick');}}else P.blockRegen=0;
  if(P.hp>0&&P.hp<P.max*0.22){P.lowT+=rdt;if(P.lowT>1.1){P.lowT=0;hap('heartbeat',0.6);}}
  shake=Math.max(0,shake-rdt*40);if(shake)cx.translate(rnd(-shake,shake),rnd(-shake,shake));FX.applyZoom(cx);
  drawWorld();drawFighters();drawParts(rdt);drawForeground();drawTrail();FX.draw(cx,U,font);cx.restore();cx.save();
  if(superFx>0){cx.fillStyle='rgba(255,250,240,'+superFx*0.8+')';cx.fillRect(0,0,W,H);cx.strokeStyle='rgba(0,0,0,'+superFx+')';cx.lineWidth=14*U*superFx;cx.beginPath();cx.moveTo(W*0.1,H*0.8);cx.lineTo(W*0.9,H*0.2);cx.stroke();superFx=Math.max(0,superFx-rdt*1.2);}
  if(ts<1&&ts>0){cx.fillStyle='rgba(255,255,255,.06)';cx.fillRect(0,0,W,H);cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(0,0,W,8*U);cx.fillRect(0,H-8*U,W,8*U);}
  drawHUD();
  if(flash>0){cx.fillStyle='rgba(255,'+(P.hurt>0?50:240)+','+(P.hurt>0?40:230)+','+flash+')';cx.fillRect(0,0,W,H);flash=Math.max(0,flash-rdt);}
  const low=P.hp>0&&P.hp<P.max*0.22?0.25+0.2*Math.sin(T*5):0;
  const v=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,low?'rgba(120,10,10,'+(0.55+low)+')':'rgba(10,2,2,.55)');cx.fillStyle=v;cx.fillRect(0,0,W,H);}
 else if(scene==='title')title();else if(scene==='credits')credits();else if(scene==='map')mapScreen();else if(scene==='story')story();
 else if(scene==='dialog'){drawWorld();demoFigs();drawForeground();DLG.draw(cx,W,H,U);}
 else if(scene==='pause'){drawWorld();drawFighters();drawForeground();drawHUD();pauseScreen();}
 else if(scene==='victory'){FX.applyZoom(cx);victory();drawParts(rdt);FX.draw(cx,U,font);}else if(scene==='loot')loot();else if(scene==='xp')xp();else if(scene==='death'){FX.applyZoom(cx);death();}else if(scene==='survnext')survCard(false);else if(scene==='survover')survCard(true);else if(scene==='ending')ending();
 cx.restore();
 if(fade>0){fade=Math.min(1,fade+rdt*3);cx.fillStyle='rgba(10,7,8,'+Math.sin(fade*Math.PI)+')';cx.fillRect(0,0,W,H);if(fade>=0.5&&fadeTo){const f=fadeTo;fadeTo=null;f();}if(fade>=1)fade=0;}
 if(liteToast>0){liteToast-=rdt;cx.save();cx.globalAlpha=Math.min(1,liteToast);cx.fillStyle='rgba(20,12,10,.85)';cx.fillRect(W/2-120*U,H-40*U,240*U,22*U);cx.fillStyle='#f3e6d0';cx.font=font(10*U,1);cx.textAlign='center';cx.fillText('Lite effects on (phone was below 35 fps) · Settings',W/2,H-25*U);cx.restore();}}
requestAnimationFrame(frame);
window.__k={survStart,toStory,afterXp,get ST(){return ST},startPrologue,get DLG(){return DLG},openSettings:()=>openSettings(),pauseGame,resumeGame,get SURV(){return SURV},buildStage,STAGES,openArmory:()=>openArmory(),enemyUpdate:dt=>enemyUpdate(dt),get scene(){return scene},get P(){return P},get E(){return E},get SV(){return SV},get stats(){return stats},swipe:d=>playerSwipe(d),dodge,tap:(x,y)=>tap({x,y}),go:i=>{toStory(i);toFight();},rem:windRemaining,L};
