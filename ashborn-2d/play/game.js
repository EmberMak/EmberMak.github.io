'use strict';
/* ASHBORN: The Last Vigil — browser demo duel (Wren Thorne vs the Tide Warden). All art procedural. */
const cv=document.getElementById('c'),cx=cv.getContext('2d');
let W=0,H=0,DPR=1,U=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR|0;cv.height=H*DPR|0;cx.setTransform(DPR,0,0,DPR,0,0);U=Math.min(W,H)/400;}
addEventListener('resize',resize);resize();
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const buzz=p=>{try{HAP.raw(p)}catch(e){try{navigator.vibrate&&navigator.vibrate(p)}catch(e2){}}};
const hap=(n,m)=>{try{HAP.play(n,m)}catch(e){}};
const FJ="AshSerif,Lora,Georgia,serif",FS="px "+FJ;const font=(px,b)=>(b?'bold ':'')+(px|0)+'px '+FJ;

/* ---------- audio ---------- */
const SFX=['hit1.ogg','hit2.ogg','hurt.ogg','block.ogg','parry.ogg','perfect.ogg','swish1.wav','swish2.wav','windup.wav','pain1.wav','pain2.wav','die.wav','fire.wav','super.ogg','victory.ogg','dodge.ogg'];
let AC=null,MG=null;const BUF={};
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return}
 MG=AC.createGain();MG.gain.value=S.set.vol;MG.connect(AC.destination);
 SFX.forEach(f=>fetch('sfx/'+f).then(r=>r.arrayBuffer()).then(a=>AC.decodeAudioData(a)).then(b=>BUF[f.split('.')[0]]=b).catch(()=>{}));startAmbience();}
function play(n,vol=1,rate=1){if(!AC||!BUF[n])return;const s=AC.createBufferSource(),g=AC.createGain();s.buffer=BUF[n];s.playbackRate.value=rate;g.gain.value=vol;s.connect(g).connect(MG);s.start();}
function setVol(v){S.set.vol=v;if(MG)MG.gain.value=v;try{MUSIC.setVol(v);}catch(e){}save();}
let blipSeed=0;function blip(ch){if(!AC||S.set.vol<=0)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=220+((ch.charCodeAt(0)*5+blipSeed)%50);o.type='sine';o.frequency.setValueAtTime(f*2,t);o.frequency.exponentialRampToValueAtTime(f,t+0.05);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.05,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+0.08);o.connect(g).connect(MG);o.start(t);o.stop(t+0.09);}
function bell(f=440,vol=0.12,dur=1.4){if(!AC)return;const t=AC.currentTime;[1,2.76,5.4].forEach((h,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f*h;g.gain.setValueAtTime(vol/(i+1),t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur/(1+i*0.6));o.connect(g).connect(MG);o.start(t);o.stop(t+dur);});}
function startAmbience(){ // low sea-drone + filtered noise surf (procedural)
 const g=AC.createGain();g.gain.value=0.05;g.connect(MG);
 [55,82.4,110].forEach((f,i)=>{const o=AC.createOscillator();o.type='sine';o.frequency.value=f;const og=AC.createGain();og.gain.value=i?0.25:0.5;o.connect(og).connect(g);o.start();});
 const len=AC.sampleRate*4,nb=AC.createBuffer(1,len,AC.sampleRate),d=nb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
 const n=AC.createBufferSource();n.buffer=nb;n.loop=true;const bq=AC.createBiquadFilter();bq.type='lowpass';bq.frequency.value=400;const ng=AC.createGain();ng.gain.value=0.6;
 const lfo=AC.createOscillator();lfo.frequency.value=0.12;const lg=AC.createGain();lg.gain.value=0.5;lfo.connect(lg).connect(ng.gain);lfo.start();
 n.connect(bq).connect(ng).connect(g);n.start();}

/* ---------- directions ---------- */
// 0=→ 1=↘ 2=↓ 3=↙ 4=← 5=↖ 6=↑ 7=↗ (screen space)
const DV=[...Array(8)].map((_,i)=>[Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)]);
const dirOf=(dx,dy)=>((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;

/* ---------- attack library (wind in s; every wind-up is hard-capped at 2.0 s) ---------- */
// dir: swipe that parries. side: where the blow comes from (dodge away). unblock: must dodge.
const ATK={
 thrust:{n:'Thrust',dir:6,side:'C',wind:1.3,dmg:34}, stab:{n:'Quick Stab',dir:6,side:'C',wind:0.8,dmg:18},
 jabL:{n:'Low Cut',dir:1,side:'L',wind:0.75,dmg:16}, jabR:{n:'Low Cut',dir:3,side:'R',wind:0.75,dmg:16},
 bashL:{n:'Shield Bash',dir:0,side:'L',wind:1.1,dmg:28},
 sweepR:{n:'Sweep',dir:4,side:'R',wind:1.5,dmg:38}, sweepL:{n:'Sweep',dir:0,side:'L',wind:1.5,dmg:38},
 riseL:{n:'Rising Cut',dir:7,side:'L',wind:1.2,dmg:30}, riseR:{n:'Rising Cut',dir:5,side:'R',wind:1.2,dmg:30},
 chopR:{n:'Chop',dir:3,side:'R',wind:1.2,dmg:32}, chopL:{n:'Chop',dir:1,side:'L',wind:1.2,dmg:32},
 over:{n:'Overhead',dir:2,side:'C',wind:1.4,dmg:40},
 crash:{n:'Crushing Blow',dir:-1,side:'C',wind:1.9,dmg:60,unblock:true},
 slam:{n:'Ground Slam',dir:-1,side:'C',wind:1.7,dmg:66,unblock:true},
 feintA:{n:'Feint',dir:7,side:'L',wind:1.7,dmg:36,feint:{at:0.7,dir:3,side:'R'}},
 feintB:{n:'Feint',dir:4,side:'R',wind:1.8,dmg:38,feint:{at:0.7,dir:0,side:'L'}},
 feintC:{n:'Feint',dir:2,side:'C',wind:1.6,dmg:40,feint:{at:0.68,dir:6,side:'C'}},
};
// pattern lists per weapon style. [seq, weight, phase2only]
const STYLE={
 daggers:[[['stab'],3],[['jabL','jabR'],3],[['jabR','jabL','stab'],2],[['jabL','jabR','jabL','jabR'],1,1],[['feintA'],1]],
 mace:[[['over'],3],[['chopL'],2],[['chopR','over'],2],[['slam'],1],[['feintC'],1],[['chopL','chopR','over'],1,1]],
 axe:[[['sweepR'],3],[['chopL','chopR'],2],[['crash'],1],[['sweepL','over'],2],[['feintB'],1],[['chopR','chopL','sweepR'],1,1]],
 swordshield:[[['bashL'],2],[['thrust'],3],[['bashL','chopR'],2],[['chopL','thrust','chopR'],1],[['feintA'],1],[['bashL','bashL','thrust'],1,1]],
 greatsword:[[['over'],2],[['sweepR'],2],[['sweepL','sweepR'],2],[['crash'],2],[['feintA'],1],[['feintB','over'],1],[['sweepL','sweepR','over'],1,1]],
 spear:[[['thrust'],3],[['bashL','sweepR'],3],[['riseL','chopR','thrust'],2],[['crash'],2],[['feintA'],2],[['feintB','thrust'],2],[['chopR','riseL','chopR','sweepR'],1,1]],
 flail:[[['sweepL'],2],[['over'],2],[['sweepR','sweepL'],2],[['slam'],1],[['feintC'],1],[['over','sweepR','sweepL'],1,1]],
 halberd:[[['thrust'],3],[['sweepR'],2],[['thrust','sweepL'],2],[['crash'],1],[['feintB','thrust'],1],[['riseL','riseR','thrust'],1,1]],
 scythe:[[['sweepL'],2],[['sweepR'],2],[['sweepL','sweepR','sweepL'],1],[['feintA'],2],[['feintB'],2],[['crash'],1],[['riseR','sweepL','riseL'],1,1]],
 claws:[[['jabL'],2],[['jabR'],2],[['jabL','jabR','jabL'],2],[['jabR','jabL','jabR','stab'],1],[['slam'],1],[['jabL','jabR','jabL','jabR','stab'],1,1]],
 twinaxe:[[['chopL','chopR'],3],[['chopR','chopL','over'],2],[['crash'],1],[['feintA'],1],[['chopL','chopR','chopL','chopR'],1,1]],
 club:[[['over'],3],[['slam'],2],[['sweepR'],2],[['slam','over'],1],[['feintC'],1],[['sweepL','sweepR','slam'],1,1]],
 hammer:[[['slam'],2],[['over'],2],[['sweepL'],2],[['sweepR','over'],2],[['crash'],1],[['feintC'],1],[['sweepL','sweepR','crash'],1,1]],
 fists:[[['slam'],2],[['bashL'],2],[['chopR'],2],[['crash','slam'],1],[['over','bashL'],2],[['bashL','chopR','over','slam'],1,1]],
 mirror:[[['riseL'],2],[['riseR'],2],[['chopL','chopR'],2],[['feintA'],2],[['feintB'],2],[['feintC','thrust'],1],[['riseL','riseR','chopL','chopR'],1,1]],
 ember:[[['thrust'],2],[['over'],2],[['sweepL','sweepR'],2],[['crash'],1],[['feintA','chopR'],2],[['feintB','thrust'],2],[['riseL','riseR','over','crash'],1,1],[['feintC','sweepR','sweepL'],1,1]],
};

/* ---------- chapters + backgrounds ---------- */
const THEME={
 causeway:{sky:['#1d3336','#2e4a4b','#22393b','#0c1819'],floor:['#3d5a5a','#081314'],glow:'255,140,60',arch:'40,66,68',arch2:'14,30,32',fog:'120,160,160',water:1},
 nave:{sky:['#1f1a24','#3a3038','#2a2229','#0d0a0e'],floor:['#4a3f3a','#120e0d'],glow:'255,190,90',arch:'70,58,66',arch2:'24,18,24',fog:'160,140,130',water:0},
 hall:{sky:['#16261c','#2a3f30','#1e3024','#08130c'],floor:['#35503c','#06110a'],glow:'190,255,150',arch:'44,70,52',arch2:'12,26,16',fog:'120,170,130',water:1},
 crypt:{sky:['#0d1220','#1b2438','#141b2c','#05070d'],floor:['#273246','#04060b'],glow:'190,210,255',arch:'40,52,80',arch2:'10,14,26',fog:'130,150,200',water:1},
 bridge:{sky:['#3a2420','#7a4a32','#4a2e26','#120a08'],floor:['#5a4036','#140c0a'],glow:'255,170,90',arch:'90,60,48',arch2:'30,18,14',fog:'200,150,120',water:0},
 core:{sky:['#07090c','#101a20','#0c1216','#020304'],floor:['#14262c','#020405'],glow:'255,90,40',arch:'30,60,70',arch2:'8,16,20',fog:'80,200,220',water:0,circuit:1},
};
const CHAPTERS=[
 {id:0,name:'The Causeway Gate',theme:'causeway',
  intro:['Low tide. The bells of the drowned cathedral ring once, and then the sea goes quiet.',
   'Cass Merrow lights the lamps along the causeway the way he has done for forty years. He does not look at her face for long.',
   '“Gate’s held by the Warden, same as always. Mind the pilgrims. They aren’t pilgrims any more.”'],
  end:['The Tide Warden goes down on one knee in the shallows and does not get up.',
   'Behind the gate, the nave is lit. Somebody has been keeping the candles.',
   'Wren wrings the seawater from her cloak. She knows the way in. She is not sure how.']},
 {id:1,name:'The Nave of Ash',theme:'nave',
  intro:['The nave smells of tallow and old salt. Hymn-boards list the dead of House Thorne, thirty-one names, all in the same hand.',
   'Every one of them is spelled the way she spells her own.'],
  end:['Brother Sallow dies praying. His last word is her name, and he says it like an apology.',
   'Below the altar a stair runs down into water.']},
 {id:2,name:'The Flooded Undercroft',theme:'hall',
  intro:['The undercroft has been underwater for a century. Now and then the tide lets it breathe.',
   'Something large moves under the black water. It has been fed on the ones who came before her.'],
  end:['Gorrow sinks back into the silt it came from. The water drains a hand’s width.',
   'Carved on the far wall: a lullaby, eight bars. She can hum the first two without reading them.']},
 {id:3,name:'The Drowned Crypts',theme:'crypt',
  intro:['The crypts are dry, which is wrong. Rows of stone beds. Each one holds a shape of ash about her height.',
   'A voice in the bells, warm as a hearth: “Hush, child. You are nearly home.”'],
  end:['Sister Oriel looks up at her with Wren’s own eyes.',
   '“Every Thorne is you,” she says. “Thirty-one of us. They took my laugh on the fourth waking. Keep yours as long as you can.”',
   'Then the ash takes her, and the crypt is just a crypt.']},
 {id:4,name:'The Titan’s Bridge',theme:'bridge',
  intro:['The bridge to the Spire is a mile of wind. At the far end, the old king’s first knight is still kneeling where he was told to kneel.',
   'Cass catches up with her at the bridgehead. He is out of breath, and older than she remembers. “I should have told you,” he says. “I buried you nine times.”'],
  end:['Uthmar rises for the first time in nine hundred years, and falls for the last.',
   '“Tell him,” the old knight says, “I stood.”']},
 {id:5,name:'The Heart of Morrow',theme:'core',
  intro:['Under the Spire the stone gives way to metal, and the metal hums.',
   'There are no candles here. The light comes from the walls, the colour of embers, and it pulses like something breathing.'],
  end:['Aurec, the Ember King, sits down on the steps of his throne like a tired man at the end of a long road.',
   '“Not with that blade,” he says. “Not without the song.” He is smiling.',
   'The Kiln glows behind him. Somewhere above, the bells begin to ring for a thirty-third Vigil.',
   'The rest of the song is still out there. So is the voice in the bells.']},
];

/* ---------- enemies (24) ---------- */
// look: m=metal, c=cloth, e=eye glow, helm, sh=shield, sz=size, beast/golem, w=weapon, barn=barnacles
const EN=[
 // ch0
 {id:'acolyte',ch:0,name:'Ash Acolyte',style:'daggers',hp:420,pow:0.8,spd:1.0,look:{m:'#3a3330',c:'#2a1e1a',e:'255,120,50',helm:'hood',sh:0,w:'daggers',sz:0.85},pre:'“Kneel, and the ash is kind.”',mid:'“You bleed like the others did.”',post:'He was young. They are all young here.'},
 {id:'pilgrim',ch:0,name:'Drowned Pilgrim',style:'flail',hp:480,pow:0.85,spd:1.0,look:{m:'#3c4a48',c:'#25302f',e:'150,220,210',helm:'hood',sh:0,w:'flail',sz:0.95,barn:1},pre:'He hums a hymn under the water in his lungs.',mid:'The censer-chain sings as it swings.',post:'The tide takes him back without a sound.'},
 {id:'censer',ch:0,name:'Censer Bearer',style:'mace',hp:540,pow:0.9,spd:0.98,look:{m:'#4a4038',c:'#33261c',e:'255,170,80',helm:'great',sh:'round',w:'mace',sz:1},pre:'“The smoke remembers you, Thorne.”',mid:'“Breathe it in. Sleep.”',post:'The censer rolls away, still smoking.'},
 {id:'penitent',ch:0,name:'The Penitent',style:'axe',hp:620,pow:1.0,spd:0.96,look:{m:'#2e2a2a',c:'#4a1c18',e:'255,90,60',helm:'mask',sh:0,w:'axe',sz:1.05},pre:'“I carry the axe that took the last of you.”',mid:'“Forgive me. Forgive me.”',post:'Cass: “He used to sell eels at the market. Before.”'},
 {id:'sergeant',ch:0,name:'Drowned Sergeant',style:'swordshield',hp:700,pow:1.05,spd:0.95,look:{m:'#41585a',c:'#203234',e:'120,220,255',helm:'great',sh:'tower',w:'sword',sz:1.05,barn:1},pre:'“Hold the line. Hold the line.”',mid:'“The line holds!”',post:'His orders were nine hundred years old. He kept them anyway.'},
 {id:'warden',ch:0,name:'The Tide Warden',style:'spear',hp:900,pow:1.1,spd:0.94,boss:1,look:{m:'#3e5556',c:'#24393a',e:'255,120,50',helm:'crest',sh:'kite',w:'spear',sz:1.12,barn:1},pre:'“This one again. The tide decides.”',mid:'“Better. You were always better on the left.”',post:'“The tide… has decided.”'},
 // ch1
 {id:'bellringer',ch:1,name:'Bell-Ringer',style:'flail',hp:900,pow:1.15,spd:0.93,look:{m:'#4a3f46',c:'#2b2028',e:'255,200,120',helm:'hood',sh:0,w:'flail',sz:1},pre:'“Every bell is your name.”',mid:'He counts strikes under his breath.',post:'The bells ring on without him.'},
 {id:'choir',ch:1,name:'Choir Warden',style:'halberd',hp:980,pow:1.2,spd:0.92,look:{m:'#5a4e52',c:'#3a1e2a',e:'255,210,140',helm:'great',sh:0,w:'halberd',sz:1.08},pre:'“Silence in the nave.”',mid:'“Sing, then. Sing for him.”',post:'His halberd rings once against the flagstones.'},
 {id:'gravetender',ch:1,name:'Grave Tender',style:'scythe',hp:1040,pow:1.25,spd:0.9,look:{m:'#3a3a34',c:'#1e1d18',e:'200,255,160',helm:'hood',sh:0,w:'scythe',sz:1.02},pre:'“I dug thirty-one. I can dig one more.”',mid:'“Same stance. Same mistake. Almost.”',post:'He planted flowers on every grave. Someone should water them.'},
 {id:'lamplord',ch:1,name:'Candle Knight',style:'swordshield',hp:1120,pow:1.3,spd:0.89,look:{m:'#6a5a40',c:'#3a2a18',e:'255,220,120',helm:'crest',sh:'kite',w:'sword',sz:1.08},pre:'“Not one candle has gone out since the first of you.”',mid:'“I will light one for you too.”',post:'Wax drips onto his armour, slow as tears.'},
 {id:'sallow',ch:1,name:'Brother Sallow',style:'greatsword',hp:1400,pow:1.4,spd:0.88,boss:1,look:{m:'#6b6a66',c:'#4a2a1a',e:'255,150,60',helm:'great',sh:0,w:'greatsword',sz:1.15},pre:'“Ash to ash, Thorne. And back again.”',mid:'“He spares you every time. Did you know that?”',post:'“Forgive him. He only… kept us alive.”'},
 // ch2
 {id:'reaver',ch:2,name:'Salt Reaver',style:'twinaxe',hp:1400,pow:1.45,spd:0.87,look:{m:'#3d4a3c',c:'#22301f',e:'180,255,140',helm:'horned',sh:0,w:'twinaxe',sz:1.05},pre:'“Fresh one. Smells of the lamps.”',mid:'He laughs through rotten teeth.',post:'The salt in his beard glitters as he sinks.'},
 {id:'eelknight',ch:2,name:'Eel-Knight',style:'spear',hp:1480,pow:1.5,spd:0.86,look:{m:'#2f4a46',c:'#162a26',e:'120,255,220',helm:'crest',sh:'round',w:'spear',sz:1.05,barn:1},pre:'“The deep water keeps its knights.”',mid:'“Faster. Faster than the last.”',post:'Something black and long slithers out of his helm and away.'},
 {id:'mirewitch',ch:2,name:'Mire Priest',style:'scythe',hp:1560,pow:1.55,spd:0.85,look:{m:'#304030',c:'#1a2a18',e:'200,255,120',helm:'horned',sh:0,w:'scythe',sz:1.02},pre:'“The mother of the mire wants a word.”',mid:'“She’s listening. She always listens.”',post:'The bells stop ringing while he dies.'},
 {id:'gorrow',ch:2,name:'Gorrow the Saltbound',style:'club',hp:2000,pow:1.7,spd:0.86,boss:1,look:{m:'#4c5a44',c:'#2a3424',e:'255,200,90',helm:'none',sh:0,w:'club',sz:1.3,beast:1,barn:1},pre:'It does not speak. It remembers how you taste.',mid:'The floor shakes. Dodge the red.',post:'Gorrow sinks into the silt like a stone into a well.'},
 // ch3
 {id:'misprint',ch:3,name:'Kiln Misprint',style:'claws',hp:1900,pow:1.7,spd:0.83,look:{m:'#6a6460',c:'#3a3430',e:'255,255,255',helm:'none',sh:0,w:'claws',sz:1,beast:1},pre:'A body that was meant to be hers. It got the eyes wrong.',mid:'It makes a sound like a lullaby played backward.',post:'It crumbles into warm ash.'},
 {id:'bonechoir',ch:3,name:'Ossuary Guard',style:'swordshield',hp:2000,pow:1.75,spd:0.82,look:{m:'#8a8676',c:'#2e2c26',e:'160,200,255',helm:'great',sh:'tower',w:'sword',sz:1.08},pre:'“None leave the crypt with what they came for.”',mid:'“You came with nothing. You will leave with less.”',post:'The bones settle back into their niches.'},
 {id:'hollow',ch:3,name:'The Hollow',style:'claws',hp:2500,pow:1.85,spd:0.8,boss:1,look:{m:'#2a2a34',c:'#14141c',e:'160,180,255',helm:'none',sh:0,w:'claws',sz:1.28,beast:1},pre:'Something the Kiln printed and could not finish.',mid:'It screams in thirty-one voices.',post:'Quiet. At last, quiet.'},
 {id:'oriel',ch:3,name:'Sister Oriel',style:'mirror',hp:2600,pow:1.9,spd:0.78,boss:1,look:{m:'#9aa4b0',c:'#3a3e52',e:'200,220,255',helm:'hood',sh:0,w:'sword',sz:1,ghost:1},pre:'“Hello, little me. Did they let you keep your laugh?”',mid:'“You parry the way I did. Of course you do.”',post:'“Keep it. Whatever they leave you, keep it.”'},
 // ch4
 {id:'lancer',ch:4,name:'Spire Lancer',style:'halberd',hp:2600,pow:2.0,spd:0.78,look:{m:'#7a5a40',c:'#4a2a1a',e:'255,180,90',helm:'crest',sh:0,w:'halberd',sz:1.1},pre:'“The bridge is closed by order of the King.”',mid:'“The wind is on my side, girl.”',post:'The wind takes his cloak over the edge.'},
 {id:'emberguard',ch:4,name:'Ember Guard',style:'swordshield',hp:2800,pow:2.1,spd:0.77,look:{m:'#5a3a2a',c:'#3a1a10',e:'255,120,40',helm:'great',sh:'kite',w:'embersword',sz:1.12},pre:'“His Majesty asked that you be spared pain. I will try.”',mid:'“You are better than the last. He said you would be.”',post:'“Go on, then. He is waiting. He always waits.”'},
 {id:'uthmar',ch:4,name:'Uthmar, the Old Titan',style:'hammer',hp:3400,pow:2.25,spd:0.8,boss:1,look:{m:'#6a5a4a',c:'#3a2a22',e:'255,200,140',helm:'horned',sh:0,w:'hammer',sz:1.4},pre:'“I have knelt nine hundred years. Let me stand once.”',mid:'“Good. Good! Make it worth the standing.”',post:'“Tell him… I stood.”'},
 // ch5
 {id:'golem',ch:5,name:'Kiln Golem',style:'fists',hp:3600,pow:2.35,spd:0.76,boss:1,look:{m:'#4a4a46',c:'#22282a',e:'80,220,255',helm:'none',sh:0,w:'fists',sz:1.38,golem:1},pre:'The stone cracks. There is wiring underneath.',mid:'A flat voice: “PRINT THIRTY-TWO. NONCOMPLIANT.”',post:'The light in its chest gutters and goes out.'},
 {id:'aurec',ch:5,name:'Aurec, the Ember King',style:'ember',hp:4200,pow:2.5,spd:0.72,boss:1,look:{m:'#3a2a20',c:'#5a1a10',e:'255,140,40',helm:'crown',sh:0,w:'embersword',sz:1.2},pre:'“Low tide again. You always come with the low tide.”',mid:'“Thirty-one graves on that shore, Wren. I dug the first one.”',post:'“Sleep. I’ll be here when the water goes out.”'},
];
// Campaign path: each chapter = list of enemy ids (main duels) in order.
const PATH=CHAPTERS.map(c=>EN.filter(e=>e.ch===c.id).map(e=>e.id));

/* ---------- gear (5 slots) ---------- */
// stats: atk (weapon dmg), crit (%), hp, def (% dmg reduction), blk (extra block charges), mg (% magic gain), pw (parry window +s), heal (% HP healed per win in a row — survival of fights)
const ITEMS=[
 // weapons
 {id:'w_tide',s:'weapon',n:'Tidewake Blade',st:{atk:20},p:0,col:'#d8ecec',f:'Your family’s sword. The edge never quite dries.'},
 {id:'w_saltknife',s:'weapon',n:'Pilgrim’s Saltknife',st:{atk:22,crit:8},p:500,ch:0,col:'#e0e6d8',f:'Short, cruel, honest.'},
 {id:'w_warden',s:'weapon',n:'Warden’s Spear-Blade',st:{atk:28,crit:4},p:0,col:'#c8d6d4',f:'Cut down from the Warden’s spear.'},
 {id:'w_censer',s:'weapon',n:'Censer Mace',st:{atk:30,mg:15},p:1600,ch:1,col:'#c9a46a',f:'Still smells of myrrh.'},
 {id:'w_sallow',s:'weapon',n:'Sallow’s Penance',st:{atk:38,crit:6},p:0,col:'#e7e2d6',f:'A greatsword with every Thorne name etched down the fuller.'},
 {id:'w_reaver',s:'weapon',n:'Reaver’s Hook',st:{atk:40,crit:12},p:3400,ch:2,col:'#b8d4a0',f:'Built for pulling people off boats.'},
 {id:'w_gorrow',s:'weapon',n:'Saltbound Cleaver',st:{atk:48,crit:5},p:0,col:'#d0c8a8',f:'Pried from Gorrow’s hide.'},
 {id:'w_oriel',s:'weapon',n:'Oriel’s Echo',st:{atk:56,crit:10,mg:15},p:0,col:'#d8e4ff',f:'It is the same sword as yours. Older.'},
 {id:'w_bridge',s:'weapon',n:'Bridgewind Glaive',st:{atk:58,crit:8},p:7200,ch:4,col:'#f0d0a8',f:'Light as a gull.'},
 {id:'w_uthmar',s:'weapon',n:'Titan’s Oath',st:{atk:68,crit:6},p:0,col:'#f4c890',f:'Uthmar’s sword, kept polished for nine centuries.'},
 // armour
 {id:'a_coat',s:'armour',n:'Vigil Coat',st:{hp:0,def:0},p:0,col:'#3a4a4c',f:'Patched by Cass. Many times.'},
 {id:'a_mail',s:'armour',n:'Causeway Mail',st:{hp:60,def:4},p:400,ch:0,col:'#6a7a7c',f:'Rings rusted green.'},
 {id:'a_barnacle',s:'armour',n:'Barnacle Plate',st:{hp:120,def:6},p:0,col:'#4e6262',f:'The Warden wore it for three hundred years.'},
 {id:'a_vestment',s:'armour',n:'Ashen Vestment',st:{hp:100,def:10,mg:10},p:2200,ch:1,col:'#6a5a5a',f:'Soft, grey, smells of candles.'},
 {id:'a_mire',s:'armour',n:'Mire-Leather',st:{hp:200,def:12},p:4200,ch:2,col:'#3e5a3a',f:'Never quite dry.'},
 {id:'a_ossuary',s:'armour',n:'Ossuary Plate',st:{hp:300,def:16},p:0,col:'#9a9484',f:'Bone-white enamel.'},
 {id:'a_ember',s:'armour',n:'Emberguard Harness',st:{hp:380,def:20},p:8200,ch:4,col:'#6a3a2a',f:'Warm to the touch.'},
 // shields
 {id:'s_none',s:'shield',n:'Bare Arm',st:{blk:0},p:0,col:'#555',f:'Nothing between you and the blow.'},
 {id:'s_buckler',s:'shield',n:'Lamplighter’s Buckler',st:{blk:1},p:0,col:'#8a6a3a',f:'Cass’s. He insisted.'},
 {id:'s_kite',s:'shield',n:'Barnacled Kite Shield',st:{blk:1,def:5},p:0,col:'#2f4748',f:'It still smells of low tide.'},
 {id:'s_tower',s:'shield',n:'Sergeant’s Tower',st:{blk:2,def:3},p:1400,ch:0,col:'#41585a',f:'Heavy. Reliable. Heavy.'},
 {id:'s_candle',s:'shield',n:'Candlewax Aegis',st:{blk:2,def:7},p:3000,ch:1,col:'#c9b07a',f:'Wax over oak over iron.'},
 {id:'s_bone',s:'shield',n:'Ossuary Wall',st:{blk:3,def:6},p:5800,ch:3,col:'#a8a494',f:'Made of the people it protected.'},
 // helms
 {id:'h_none',s:'helm',n:'Bare Head',st:{},p:0,col:'#555',f:'The wind in your hair.'},
 {id:'h_hood',s:'helm',n:'Acolyte’s Hood',st:{mg:15},p:0,col:'#2a1e1a',f:'Smoke-stained wool.'},
 {id:'h_sallet',s:'helm',n:'Causeway Sallet',st:{hp:40,def:3},p:600,ch:0,col:'#6a7a7c',f:'A plain soldier’s helm.'},
 {id:'h_choir',s:'helm',n:'Choir Helm',st:{hp:60,def:4,mg:10},p:2400,ch:1,col:'#5a4e52',f:'Sings faintly in high wind.'},
 {id:'h_horn',s:'helm',n:'Reaver’s Horns',st:{hp:80,crit:6},p:3800,ch:2,col:'#3d4a3c',f:'Ugly. Effective.'},
 {id:'h_crown',s:'helm',n:'Ember Circlet',st:{hp:140,def:6,mg:20},p:0,col:'#e0a040',f:'Too warm to be metal.'},
 // rings
 {id:'r_none',s:'ring',n:'No Ring',st:{},p:0,col:'#555',f:''},
 {id:'r_lullaby',s:'ring',n:'Music-Box Key',st:{pw:0.08},p:0,col:'#d4b070',f:'Winds a box she cannot find. Widens the parry window.'},
 {id:'r_salt',s:'ring',n:'Salt Ring',st:{hp:50},p:500,ch:0,col:'#cfd8d8',f:'Cass found it in the sand.'},
 {id:'r_ember',s:'ring',n:'Ember Ring',st:{atk:5,mg:15},p:2000,ch:1,col:'#ff8a3d',f:'Burns a little.'},
 {id:'r_mender',s:'ring',n:'Mender’s Band',st:{heal:20},p:3200,ch:2,col:'#9fe3a0',f:'Heals 20% HP after each victory.'},
 {id:'r_keen',s:'ring',n:'Ring of the Keen Edge',st:{crit:14},p:4600,ch:3,col:'#d8e4ff',f:'Finds the gaps in armour.'},
 {id:'r_vigil',s:'ring',n:'Ring of the Last Vigil',st:{pw:0.12,atk:6,hp:80},p:9000,ch:4,col:'#fff0c0',f:'Thirty-one names on the inside of the band.'},
];
const IT=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const SLOTS=['weapon','armour','shield','helm','ring'],SLOTN={weapon:'WEAPON',armour:'ARMOUR',shield:'SHIELD',helm:'HELM',ring:'RING'};
// first-clear drop per enemy; repeats give gold + chance of a chapter item
const DROP={acolyte:'h_hood',pilgrim:'r_salt',censer:'s_buckler',penitent:'a_mail',sergeant:'s_tower',warden:'w_warden',
 bellringer:'r_lullaby',choir:'h_choir',gravetender:'a_vestment',lamplord:'s_kite',sallow:'w_sallow',
 reaver:'h_horn',eelknight:'a_barnacle',mirewitch:'r_mender',gorrow:'w_gorrow',
 misprint:'r_keen',bonechoir:'a_ossuary',hollow:'s_bone',oriel:'w_oriel',
 lancer:'w_bridge',emberguard:'a_ember',uthmar:'w_uthmar',golem:'r_vigil',aurec:'h_crown'};
const CASS=['Cass: “Again, then.”','Cass: “Again, then.”','Cass: “Up you get. Tide won’t wait.”','Cass: “Again, then, love.”','Cass says nothing. He hands her the lantern.'];
/* ---------- save ---------- */
const SKEY='ash2_save';
function freshSave(){return{v:2,gold:0,xp:0,vigil:32,ch:0,node:0,cleared:{},inv:['w_tide','a_coat','s_none','h_none','r_none'],eq:{weapon:'w_tide',armour:'a_coat',shield:'s_none',helm:'h_none',ring:'r_none'},seen:{},maxCh:0,wins:0,deaths:0,set:{hap:2,vol:0.9,ring:1,slow:1,fx:'auto'},tot:{parries:0,perfect:0,dodges:0,wins:0,counters:0},ending:null,seenP2:false,seenCh:{},part:1};}
let S;try{S=JSON.parse(localStorage.getItem(SKEY))}catch(e){}if(!S||S.v!==2)S=null;
const hasSave=!!S;if(!S)S=freshSave();else{const d=freshSave();S.set=Object.assign(d.set,S.set||{});S.tot=Object.assign(d.tot,S.tot||{});S.seenCh=S.seenCh||{};if(S.ending===undefined)S.ending=null;if(S.seenP2===undefined)S.seenP2=false;if(S.part===undefined)S.part=1;}
try{HAP.set({on:S.set.hap>0,strength:[0,0.6,1,1.4][S.set.hap]||1});setQuality(S.set.fx||'auto');}catch(e){}
function save(){try{localStorage.setItem(SKEY,JSON.stringify(S))}catch(e){}}
const level=()=>1+Math.floor(S.xp/900);
function gearStats(){const o={atk:0,crit:0,hp:0,def:0,blk:0,mg:0,pw:0,heal:0,sp:0};SLOTS.forEach(sl=>{const it=IT[S.eq[sl]];if(it)for(const k in it.st)o[k]=(o[k]||0)+it.st[k];});
 const lv=level();o.maxHp=260+lv*18+o.hp;o.atk=o.atk+lv*1.2;o.def=Math.min(45,o.def);o.blockMax=2+o.blk;o.crit=Math.min(60,o.crit);return o;}

/* ---------- state ---------- */
let scene='title',sceneT=0,P,E,G,ED,texts,parts,trail,etrail,shake,flash,stats,sub=null,midSaid=false,curNode=null,storyPages=[],storyI=0,storyNext=null,lootInfo=null,invSlot='weapon',shopSel=null,toast=null;
function newDuel(enemyId){G=gearStats();ED=EN.find(e=>e.id===enemyId);
 P={hp:G.maxHp,max:G.maxHp,blockDur:G.blockMax,blockMax:G.blockMax,blockRegen:0,blocking:false,dodge:0,dodgeSide:0,magic:0,superM:0,swing:0,swingDir:0,hurt:0,kb:0,bob:0,counter:0,ghost:G.maxHp,lowT:0};
 E={hp:ED.hp,max:ED.hp,state:'idle',t:1.6,queue:[],atk:null,wind:0,windT:0,dir:0,side:'C',feinted:false,open:0,hurt:0,lunge:0,chain:0,dodges:0,combo:0,lastDir:-1,dead:false,block:0,stag:0,kb:0,kbv:0,recoil:0,follow:0,deadT:0,hitDir:0,sway:0,ghost:ED.hp,miss:0,missDir:-1};
 texts=[];parts=[];trail=[];etrail=[];shake=0;flash=0;stats={parries:0,perfect:0,dodges:0,hits:0,maxCombo:0,t:0,counters:0,streak:0};midSaid=false;sub={s:ED.pre,t:0};try{FX.resetStreak();FX.reset();}catch(e){}}
function say(s,col='#fff',size=1){texts.push({s,col,size,t:0});if(texts.length>3)texts.shift();}
function sparks(x,y,col,n=18,sp=6){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(1,sp)*U;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:rnd(.3,.7),t:0,col});}}

/* ---------- layout ---------- */
function L(){const land=W>H,m=10*U;const barW=W*(land?0.34:0.42),bh=Math.max(10,9*U);const r=Math.max(26,22*U),dr=Math.max(34,(land?30:34)*U);
 const sz=ED?ED.look.sz:1;
 return{land,m,barW,bh,magic:{x:m+r+4,y:m+bh+26+r+4,r},super:{x:W-m-r-4,y:m+bh+26+r+4,r},
  dodgeL:{x:m+dr+6,y:H-m-dr-10,r:dr},dodgeR:{x:W-m-dr-6,y:H-m-dr-10,r:dr},block:{x:W/2,y:H-m-dr-10,r:dr*0.9},
  ex:W/2,ey:land?H*0.56:H*0.5,es:Math.min(W*(land?0.55:0.95),H*0.62)/300/Math.pow(Math.max(1,sz),0.7)};}
const inC=(p,c)=>(p.x-c.x)**2+(p.y-c.y)**2<=(c.r*1.15)**2;

/* ---------- combat ---------- */
const WCAP=2.0;
function pickPattern(){const ph2=E.hp<E.max*0.5,ps=STYLE[ED.style].filter(p=>!p[2]||ph2);let tw=ps.reduce((a,p)=>a+p[1],0),r=Math.random()*tw;for(const p of ps){if((r-=p[1])<0)return p[0].slice();}return ps[0][0].slice();}
function beginAttack(k){const a=ATK[k];const sp=ED.spd*(E.hp<E.max*0.5?0.9:1);
 E.state='windup';E.atk=a;E.wind=clamp(a.wind*sp,0.5,WCAP);E.windT=0;E.dir=a.dir;E.side=a.side;E.feinted=false;E.miss=0;play('windup',0.35,a.unblock?0.7:1);
 if(a.unblock){say('UNBLOCKABLE','#ff6a3d',0.8);hap('warn');}else hap('windup');}
function enemyIdle(t){E.state='idle';E.t=t||rnd(0.8,1.6)*ED.spd;E.atk=null;}
const superGain=v=>{P.superM=Math.min(100,P.superM+v*(1+(G.sp||0)/100));};
function strikeLands(){const a=E.atk;E.state='strike';E.t=0.3;E.lunge=1;E.follow=1;
 const l=L();etrail.push({a0:wAngle(a.dir,a.side,1),side:a.side,t:0,col:a.unblock?'255,90,40':'210,240,255'});
 const sideOK=P.dodge>0&&(a.side==='C'||(a.side==='L'&&P.dodgeSide>0)||(a.side==='R'&&P.dodgeSide<0));
 if(sideOK){stats.dodges++;S.tot.dodges++;E.dodges++;superGain(10);FX.shard(W/2+P.dodgeSide*60*U,H*0.7,10,'rgba(200,240,255,.8)',5,8);
  if(E.queue.length===0&&E.dodges>=3){say('DODGE BREAK!!!','#9ff',1.2);FX.stamp('DODGE BREAK',l.ex,l.ey-170*l.es,{col:'#bff',size:26,ink:'rgba(0,20,30,.55)'});FX.hitStop(0.06);hap('dodgeBreak');openEnemy(2.2,true);}else{say('DODGE','#cfe');hap('dodge');if(!E.queue.length)openEnemy(1.3);}
  play('dodge',0.8);return;}
 const dmg0=a.dmg*ED.pow*(1-G.def/100);
 if(P.blocking&&!a.unblock&&P.blockDur>0){P.blockDur--;say('BLOCK','#bcd');play('block',0.9);hap(P.blockDur===0?'blockBreak':'block');shake=4;P.kb=0.4;sparks(W/2,H*0.7,'#9cf',10,4);FX.ring(W/2,H*0.68,10,46,'rgba(190,230,255,.8)',3,0.3);FX.hitStop(0.03);
  if(P.blockDur===0){say('GUARD BROKEN','#f96',0.8);FX.stamp('GUARD BROKEN',W/2,H*0.5,{col:'#ff9a6a',size:22,ink:'rgba(0,0,0,.5)'});}return;}
 const heavy=a.unblock;const dmg=Math.round(dmg0*(P.blocking&&!a.unblock?0.5:1));P.hp=Math.max(0,P.hp-dmg);P.hurt=1;P.kb=1;shake=heavy?16:12;flash=0.25;superGain(6);P.counter=0;
 texts.push({s:'-'+dmg,col:'#ff8070',size:0.6,t:0,dmg:1,x:-W*0.2,py:1});
 play('hurt',1);play(Math.random()<.5?'pain1':'pain2',0.7);hap(heavy?'hurtHeavy':'hurt');E.chain=0;E.dodges=-99;FX.onHurt();FX.hitStop(heavy?0.08:0.05);if(heavy)FX.zoom(0.35,1.05,W/2,H*0.7);
 if(P.hp<P.max*0.25&&P.hp>0&&!P.lowSaid){P.lowSaid=1;sub={s:'Wren: “Not again. Please, not again.”',t:0};}
 if(P.hp<=0)toDeath();}
function openEnemy(t,broken){E.state='open';E.t=t;E.open=t;E.combo=0;E.lastDir=-1;E.queue=[];E.stag=broken?1.5:1;E.recoil=1;E.kbv=broken?1:0.6;const l=L();FX.glyph(broken?'STRIKE!':'strike',l.ex,l.ey-200*l.es,{col:broken?'#ffd27a':'rgba(220,245,255,.9)',size:broken?20:14,l:0.9,vy:-18});if(broken){superGain(15);hap('parryBreak');}}
function enemyUpdate(dt){
 E.hurt=Math.max(0,E.hurt-dt*4);E.lunge=Math.max(0,E.lunge-dt*3);E.block=Math.max(0,E.block-dt*3);E.stag=Math.max(0,E.stag-dt*1.2);E.recoil=Math.max(0,E.recoil-dt*2.5);E.follow=Math.max(0,E.follow-dt*2.2);
 E.kb+= (E.kbv-E.kb)*Math.min(1,dt*10);E.kbv=Math.max(0,E.kbv-dt*1.6);
 if(E.state==='dead'){E.deadT+=dt;return;}
 if(!midSaid&&E.hp<E.max*0.5){midSaid=true;sub={s:ED.mid,t:0};if(ED.boss){const l=L();hap('phase2');FX.hitStop(0.1);FX.zoom(0.8,1.08,l.ex,l.ey-100*l.es);FX.ring(l.ex,l.ey-100*l.es,20,170,'rgba(255,120,60,.9)',6,0.7);FX.stamp(ED.name.toUpperCase(),l.ex,l.ey-190*l.es,{col:'#ff8a5a',size:22,ink:'rgba(0,0,0,.6)',sub:'HOLDS NOTHING BACK',subCol:'#ffd0c0',l:1.4});}}
 if(E.state==='idle'){E.t-=dt;if(E.t<=0){E.queue=pickPattern();E.chain=0;E.dodges=0;beginAttack(E.queue.shift());}}
 else if(E.state==='windup'){E.windT+=dt;const a=E.atk;
  if(a.feint&&!E.feinted&&E.windT>=E.wind*a.feint.at){E.feinted=true;E.dir=a.feint.dir;E.side=a.feint.side;E.wind=Math.min(WCAP,E.windT+0.7);say('FEINT!','#ffb070',0.8);play('swish2',0.5,1.3);hap('feint');}
  if(E.windT>=E.wind)strikeLands();}
 else if(E.state==='strike'){E.t-=dt;if(E.t<=0){if(E.queue.length&&P.hp>0)beginAttack(E.queue.shift());else enemyIdle();}}
 else if(E.state==='open'){E.t-=dt;if(E.t<=0){if(E.combo>=2)say('COMBO x'+E.combo,'#ffd27a',0.9);enemyIdle(rnd(.6,1.1)*ED.spd);}}}
const windRemaining=()=>E.wind-E.windT;
function playerSwipe(d){if(scene!=='fight'||P.hp<=0||E.dead)return;
 P.swing=1;P.swingDir=d;trailBoost=1;play(Math.random()<.5?'swish1':'swish2',0.5,rnd(.9,1.15));hap('swipe');
 if(E.state==='windup'){const rem=windRemaining(),a=E.atk,win=0.6+G.pw;
  if(!a.unblock&&d===E.dir&&rem<=win&&!(a.feint&&!E.feinted)){
   stats.parries++;S.tot.parries++;E.chain++;let label='PARRY',col='#bfe9ff',tier=0;
   if(rem<=0.2+G.pw/2){label='PERFECT PARRY';col='#fff';tier=2;stats.perfect++;S.tot.perfect++;play('perfect',0.8);}else if(rem<=0.38+G.pw/2){label='GREAT PARRY';tier=1;}
   play('parry',1,rnd(.95,1.05));hap(tier===2?'parryPerfect':tier===1?'parryGreat':'parry');superGain(tier===0?6:10);
   const l=L(),cxp=l.ex,cyp=l.ey-60*l.es;sparks(cxp,cyp,'#dff',26,7);shake=tier===2?9:6;E.recoil=1;E.kbv=0.5;FX.onParry(tier===2);stats.streak=Math.max(stats.streak,FX.streak);
   const ang=Math.atan2(DV[d][1],DV[d][0]);FX.flash(cxp,cyp,ang,tier===2?100:70,tier===2?'#ffffff':'#dff6ff',tier===2?6:4,0.2);
   FX.shard(cxp,cyp,tier===2?26:14,tier===2?'#fff':'#bfe9ff',tier===2?9:6,12);FX.ring(cxp,cyp,12,tier===2?130:80,tier===2?'rgba(255,255,255,.95)':'rgba(190,233,255,.7)',tier===2?5:3,tier===2?0.45:0.3);
   if(tier===2){FX.hitStop(0.09);if(S.set.slow)FX.slow(0.28,0.3);FX.zoom(0.5,1.06,cxp,cyp);P.counter=1;FX.stamp('PERFECT',cxp,cyp-90*l.es,{col:'#fff',size:30,ink:'rgba(0,10,20,.65)',sub:'PARRY',subCol:'#bfe9ff',l:1.0});}
   else if(tier===1){FX.hitStop(0.05);FX.stamp('GREAT',cxp,cyp-85*l.es,{col:'#e8f6ff',size:24,ink:'rgba(0,10,20,.5)',sub:'PARRY',l:0.8});}
   else FX.hitStop(0.03);
   if(FX.streak>=3&&FX.streak%3===0){FX.glyph('STREAK ×'+FX.streak,W*0.5,H*0.3,{col:'#ffd27a',size:16,l:0.9,vy:-20});if(FX.streak%5===0){superGain(5);hap('combo');}}
   if(E.queue.length){if(tier<2)say(label,col);beginAttack(E.queue.shift());}
   else if(E.chain>=3||tier===2&&E.chain>=2){say('PERFECT PARRY BREAK!!','#fff',1.15);FX.stamp('BREAK',l.ex,l.ey-150*l.es,{col:'#ffe9c0',size:40,ink:'rgba(0,0,0,.6)',sub:'GUARD SHATTERED',rot:0.1,l:1.1});FX.hitStop(0.08);openEnemy(2.4,true);}
   else{if(tier<2)say(label,col);openEnemy(tier===2?1.9:1.4);}
   return;}
  if(!a.unblock&&d!==E.dir&&rem<=win&&!(a.feint&&!E.feinted)){E.miss=0.5;E.missDir=d;}
  enemyShield();return;}
 if(E.state==='open'){hitEnemy(d);return;}
 if(E.state==='idle'){if(Math.random()<0.6){enemyShield();if(Math.random()<.4)E.t=Math.min(E.t,0.25);}else hitEnemy(d,0.6);}}
function enemyShield(){E.block=1;E.kbv=0.25;say('BLOCKED','#9ab',0.7);play('block',0.6,1.2);const l=L();sparks(l.ex-40*l.es,l.ey-40*l.es,'#cde',8,3);hap('tick');}
function hitEnemy(d,mult=1){const alt=E.lastDir>=0&&d!==E.lastDir;E.combo++;E.lastDir=d;stats.hits++;stats.maxCombo=Math.max(stats.maxCombo,E.combo);
 const crit=Math.random()*100<G.crit,counter=P.counter>0&&mult===1;if(counter){P.counter=0;stats.counters++;S.tot.counters++;}
 let dmg=(G.atk+E.combo*3+(alt?6:0))*mult*(E.stag>1?1.4:1)*(crit?1.8:1)*(counter?1.5:1);dmg=Math.round(dmg);E.hp=Math.max(0,E.hp-dmg);E.hurt=1;E.recoil=1;E.hitDir=DV[d][0];E.kbv=Math.min(1,E.kbv+0.35);shake=crit||counter?9:5;
 P.magic=Math.min(100,P.magic+7*(1+G.mg/100));superGain(3);
 play(Math.random()<.5?'hit1':'hit2',0.8,rnd(.9,1.1));hap(counter?'counter':crit?'crit':alt?'hitAlt':'hit');
 const l=L();sparks(l.ex+DV[d][0]*30*l.es,l.ey-70*l.es,crit?'#fff':'#ffb36b',crit?24:14,5);FX.shard(l.ex,l.ey-70*l.es,counter?14:crit?10:5,counter?'#ffd27a':'rgba(255,230,200,.7)',counter?8:5,8);if(counter)FX.hitStop(0.06);
 texts.push({s:(counter?'COUNTER ':crit?'CRIT ':'')+dmg,col:counter?'#ffd27a':crit?'#fff':'#ffd9a0',size:counter?0.85:crit?0.8:0.6,t:0,dmg:1,x:rnd(-40,40)});
 if(counter)say('COUNTER','#ffd27a',1.0);else if(E.combo>=3&&E.combo%3===0)say('COMBO x'+E.combo,'#ffd27a',0.9);else if(mult===1&&!crit)say('HIT','#ffe3c4',0.6);
 if(E.hp<=0)toVictory();}
function castMagic(){if(P.magic<100||E.dead||scene!=='fight')return;P.magic=0;const l=L();
 say('EMBERBRAND','#ff8a3d',1.1);play('fire',1);hap('magic');FX.ring(l.ex,l.ey-90*l.es,20,150,'rgba(255,140,60,.9)',5,0.6);FX.stamp('EMBERBRAND',l.ex,l.ey-200*l.es,{col:'#ffb070',size:26,ink:'rgba(40,10,0,.6)',l:1.0});for(let i=0;i<40;i++)sparks(l.ex+rnd(-60,60)*l.es,l.ey-rnd(0,160)*l.es,'#ff7a2a',3,6);
 E.hp=Math.max(0,E.hp-Math.round(G.atk*4.5));E.hurt=1;E.kbv=1;shake=14;flash=0.15;if(E.state==='windup')E.queue=[];openEnemy(1.6);if(E.hp<=0)toVictory();}
function castSuper(){if(P.superM<100||E.dead||scene!=='fight')return;P.superM=0;say('ASHFALL','#ffffff',1.2);play('super',1);hap('superHit');flash=0.4;shake=16;const l=L();FX.hitStop(0.1);if(S.set.slow)FX.slow(0.35,0.25);FX.zoom(0.7,1.1,l.ex,l.ey-100*l.es);FX.flash(l.ex,l.ey-100*l.es,-0.6,170,'#fff',8,0.35);FX.shard(l.ex,l.ey-100*l.es,40,'#fff',10,14);
 E.queue=[];openEnemy(3.0,true);E.hp=Math.max(0,E.hp-Math.round(G.atk*3));if(E.hp<=0)toVictory();}
function dodge(side){if(scene!=='fight'||P.dodge>0)return;P.dodge=0.55;P.dodgeSide=side;play('dodge',0.6);hap('tap');}

/* ---------- scene flow ---------- */
function go(s){scene=s;sceneT=0;BTN=[];}
function story(pages,next,titleTxt){storyPages=pages;storyI=0;storyNext=next;storyTitle=titleTxt||'';go('story');}
let storyTitle='';
const MOODQ={warden:'calm',sallow:'grim',oriel:'warm',aurec:'calm',aurec2:'calm',uthmar:'calm',gorrow:'angry',hollow:'shout',golem:'neutral',golem2:'neutral',isolde:'calm',verity:'calm',ansel:'calm',thirtythree:'surprised',tithe:'sly',watcher:'grim',misprint:'surprised',thirtyone:'shout'};
const reqOK=l=>!l.req||l.req===S.ending;
const DLSTYLE={hero:'wren',get chars(){return CHARS},font,bar:'#06090a',textCol:'#e6efee',plateCol:'#f3e6d0',hintCol:'#ffd27a',narrCol:'#dfecea',titleCol:'#e9d9b8',subCol:'#a9cfcc',
 paper:(c,x,y,w,h)=>{const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(12,22,26,.94)');g.addColorStop(1,'rgba(6,12,14,.96)');c.fillStyle=g;c.fillRect(x,y,w,h);c.strokeStyle='#8a6d42';c.lineWidth=1.5;c.strokeRect(x+.5,y+.5,w-1,h-1);c.strokeStyle='rgba(255,220,150,.18)';c.strokeRect(x+4.5,y+4.5,w-9,h-9);c.fillStyle='#e07a2f';c.fillRect(x,y,w,2*U);},
 plate:(c,x,y,w,h,side)=>{c.fillStyle='#1a1010';c.fillRect(x,y,w,h);c.strokeStyle='#b8935a';c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);c.fillStyle='#e07a2f';c.fillRect(side==='R'?x+w-3*U:x,y,3*U,h);},
 narrBox:(c,x,y,w,h)=>{c.fillStyle='rgba(4,10,11,.78)';c.fillRect(x,y,w,h);c.fillStyle='#e07a2f';c.fillRect(x+w/2-1*U,y+10*U,2*U,14*U);},
 portraitBack:(c,x,y,s,side,active)=>{const g=c.createRadialGradient(x+s/2,y+s*0.55,s*0.1,x+s/2,y+s*0.55,s*0.6);g.addColorStop(0,active?'rgba(255,170,90,.22)':'rgba(0,0,0,.25)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-s*0.2,y-s*0.2,s*1.4,s*1.4);},
 choiceBtn:(c,x,y,w,h,t,i)=>{const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,i?'rgba(30,40,42,.92)':'rgba(90,64,30,.92)');g.addColorStop(1,i?'rgba(10,18,20,.92)':'rgba(50,32,14,.92)');c.fillStyle=g;c.fillRect(x,y,w,h);c.strokeStyle='#b8935a';c.lineWidth=1.6;c.strokeRect(x+.5,y+.5,w-1,h-1);c.fillStyle='#efe2c4';c.font=font(13*U,1);c.textAlign='center';c.fillText(t,x+w/2,y+h*0.66);},
 skipBtn:(c,x,y,w,h)=>{c.fillStyle='rgba(10,18,20,.85)';c.fillRect(x,y,w,h);c.strokeStyle='#b8935a';c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);c.fillStyle='#efe2c4';c.font=font(10*U,1);c.textAlign='center';c.fillText('SKIP ▶▶',x+w/2,y+h*0.68);},
 titleDeco:(c,W,H,U,t)=>{c.strokeStyle='#b8935a';c.lineWidth=1.5;c.beginPath();c.moveTo(W/2-120*U*Math.min(1,t*2),H*0.47+34*U);c.lineTo(W/2+120*U*Math.min(1,t*2),H*0.47+34*U);c.stroke();},
 play:(n)=>play(n,0.5),hap:(n)=>hap(n),blip:(ch)=>blip(ch),fx:(k)=>{if(k==='shake')shake=12;if(k==='flash')flash=0.3;}};
function nodeLines(ch,i){const c=CHAPTERS[ch],id=PATH[ch][i],e=EN.find(z=>z.id===id),chKey='ch'+ch;let lines=[];
 if(i===0){if(ch===6&&!S.seenP2&&typeof DL!=='undefined')lines=lines.concat(DL.p2open);
  if(!S.seenCh[chKey]){lines.push({title:'CHAPTER '+(ch+1),sub:c.name.toUpperCase()});c.intro.forEach(t=>lines.push({narr:t}));if(typeof DL!=='undefined'&&DL[chKey]&&DL[chKey].open)lines=lines.concat(DL[chKey].open);}}
 const who=(typeof CHARS!=='undefined'&&CHARS[id])?id:null,q=e.pre;
 if(q){if(who&&q.startsWith('“'))lines.push({who,mood:MOODQ[id]||'grim',text:q.replace(/^“|”$/g,'')});else lines.push({narr:q});}
 if(typeof DL!=='undefined'){const ex=(c.part||1)===1?DL.p1[id]:(DL[chKey]&&DL[chKey].fights&&DL[chKey].fights[i]);if(ex&&ex.length)lines=lines.concat(ex);}
 return lines.filter(reqOK);}
function startNode(ch,i){curNode={ch,i};const id=PATH[ch][i];newDuel(id);const lines=nodeLines(ch,i);
 if(lines.length){go('dialog');DLG.start(lines,()=>{if(i===0){S.seenCh['ch'+ch]=1;if(ch===6)S.seenP2=true;save();}go('pre');},{style:DLSTYLE});}else go('pre');}
function toFight(){go('fight');say('FIGHT','#e9f6f5',1.3);hap('tap');}
function toVictory(){E.dead=true;E.state='dead';E.deadT=0;go('victory');play('die',0.9,0.8);play('victory',0.9);hap('victory');S.tot.wins++;
 {const l=L();FX.hitStop(0.12);if(S.set.slow)FX.slow(0.7,0.22);FX.zoom(1.2,1.1,l.ex,l.ey-100*l.es);FX.flash(l.ex,l.ey-100*l.es,-0.7,180,'#fff',7,0.4);FX.shard(l.ex,l.ey-100*l.es,30,'#fff',9,14);}
 const id=ED.id,first=!S.cleared[id],tier=EN.indexOf(ED);
 stats.xp=Math.round((200+tier*70+stats.parries*15+stats.perfect*25+stats.maxCombo*10)*(first?1:0.5)+P.hp/P.max*100);
 let gold=Math.round((140+tier*95)*(ED.boss?1.6:1)*(first?1:0.5));let item=null;
 if(first&&DROP[id]&&!S.inv.includes(DROP[id]))item=DROP[id];
 else if(!first&&Math.random()<0.3){const pool=ITEMS.filter(i=>i.p>0&&(i.ch||0)<=ED.ch&&!S.inv.includes(i.id));if(pool.length)item=pool[Math.random()*pool.length|0].id;}
 if(item)S.inv.push(item);S.gold+=gold;S.xp+=stats.xp;S.cleared[id]=(S.cleared[id]||0)+1;S.wins++;
 lootInfo={item,gold,first,lvUp:level()>Math.floor((S.xp-stats.xp)/900)+1};
 const {ch,i}=curNode;let chapterDone=false;
 if(ch===S.ch&&i===S.node){S.node++;if(S.node>=PATH[ch].length){chapterDone=true;if(ch<CHAPTERS.length-1){S.ch++;S.node=0;}else S.node=PATH[ch].length;S.maxCh=Math.max(S.maxCh,S.ch);}}
 lootInfo.chapterDone=chapterDone;lootInfo.chId=ch;save();}
function toDeath(){go('death');E.state='gloat';E.queue=[];S.vigil++;S.deaths++;save();play('die',1);hap('death');if(S.set.slow)FX.slow(0.8,0.3);}
let endingKey=null;
function afterPost(){if(lootInfo.chapterDone){const ci=lootInfo.chId,c=CHAPTERS[ci],chKey='ch'+ci,last=ci===CHAPTERS.length-1,p1end=ci===5;
  let lines=[];if(typeof DL!=='undefined'&&DL[chKey]&&DL[chKey].close)lines=lines.concat(DL[chKey].close);
  lines.push({title:'END OF CHAPTER '+(ci+1),sub:c.name.toUpperCase()});c.end.forEach(t=>lines.push({narr:t}));
  if(p1end)lines.push({narr:'— End of Part One —'},{narr:'She did not die. Part Two — The Quench — is now open on the map.'});
  go('dialog');DLG.start(lines.filter(reqOK),()=>{if(last){endingKey=S.ending||'quench';go('ending');hap('unlock');}else go('map');},{style:DLSTYLE});}
 else go('map');}
const INTRO=['ASHBORN','Vael is a grey coast of salt marsh and broken causeways. On a tidal island stands the Spire of Morrow, and on its throne sits Aurec, the Ember King, who has ruled for nine hundred years.',
 'Every generation, House Thorne sends one heir across the causeway at low tide to kill him. None come back. A few weeks later, a new Thorne walks out of the ash on the shore.',
 'The village calls it a blessing. Wren Thorne has stopped calling it anything.','This is the thirty-second Vigil.'];

/* ---------- buttons ---------- */
let BTN=[];
function button(x,y,w,h,label,fn,o={}){BTN.push({x,y,w,h,fn});cx.save();
 const g=cx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,o.hi?'rgba(90,64,30,.92)':'rgba(30,40,42,.88)');g.addColorStop(1,o.hi?'rgba(50,32,14,.92)':'rgba(10,18,20,.88)');cx.fillStyle=g;cx.fillRect(x,y,w,h);
 cx.strokeStyle=o.dis?'rgba(150,150,150,.4)':o.sel?'#ffe08a':'#b8935a';cx.lineWidth=o.sel?3:1.6;cx.strokeRect(x+.5,y+.5,w-1,h-1);
 cx.strokeStyle='rgba(255,220,150,.18)';cx.strokeRect(x+3.5,y+3.5,w-7,h-7);
 cx.fillStyle=o.dis?'#777':o.col||'#efe2c4';cx.font=(o.b===0?'':'bold ')+((o.fs||13)*U|0)+'px AshSerif,Lora,Georgia,serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(label,x+w/2,y+h/2+1);cx.restore();cx.textBaseline='alphabetic';}
function panel(x,y,w,h){cx.fillStyle='rgba(8,14,16,.82)';cx.fillRect(x,y,w,h);cx.strokeStyle='#8a6d42';cx.lineWidth=1.5;cx.strokeRect(x+.5,y+.5,w-1,h-1);}

/* ---------- input ---------- */
const ptr={};let trailBoost=0;
function btnHit(p){const l=L();if(scene!=='fight')return null;if(p.y<l.m+l.bh+30&&p.x>W*0.42&&p.x<W*0.58)return'pause';
 if(inC(p,l.dodgeL))return'dl';if(inC(p,l.dodgeR))return'dr';if(inC(p,l.block))return'block';if(inC(p,l.magic))return'magic';if(inC(p,l.super))return'super';return null;}
cv.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();if(AC&&AC.state==='suspended')AC.resume();
 const p={x:e.clientX,y:e.clientY};const b=btnHit(p);ptr[e.pointerId]={b,pts:[p]};
 if(b==='dl')dodge(-1);else if(b==='dr')dodge(1);else if(b==='block'){P.blocking=true;hap('tick');}else if(b==='magic')castMagic();else if(b==='super')castSuper();else if(b==='pause'){P.blocking=false;hap('tap');go('pause');}
 if(!b)trail=[{x:p.x,y:p.y,t:0}];},{passive:false});
cv.addEventListener('pointermove',e=>{const q=ptr[e.pointerId];if(!q||q.b)return;const p={x:e.clientX,y:e.clientY};const prev=q.pts[q.pts.length-1];q.pts.push(p);trail.push({x:p.x,y:p.y,t:0});if(trail.length>24)trail.shift();
 if((scene==='inv'||scene==='shop')&&prev){invScroll=clamp(invScroll-(p.y-prev.y),0,invMax);q.scrolled=(q.scrolled||0)+Math.abs(p.y-prev.y);return;}
 if(!q.fired&&scene==='fight'){const s=q.pts[0],dx=p.x-s.x,dy=p.y-s.y;if(Math.hypot(dx,dy)>Math.max(55,38*U)){q.fired=1;playerSwipe(dirOf(dx,dy));}}});
function up(e){const q=ptr[e.pointerId];delete ptr[e.pointerId];if(!q)return;if(q.b==='block'){P.blocking=Object.values(ptr).some(o=>o.b==='block');return;}if(q.b)return;
 const s=q.pts[0],p={x:e.clientX,y:e.clientY},dx=p.x-s.x,dy=p.y-s.y,len=Math.hypot(dx,dy);
 if(scene==='fight'){if(!q.fired&&len>Math.max(28,20*U))playerSwipe(dirOf(dx,dy));return;}
 if(len<24&&!(q.scrolled>12))tap(p);}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
// Android back button: menus go back, fights pause, title asks to exit
window.onAndroidBack=function(){try{if(scene==='fight'){P.blocking=false;go('pause');return true;}if(scene==='pause'){scene='fight';sceneT=2;BTN=[];return true;}
 if(scene==='dialog'){DLG.skip();return true;}if(scene==='settings'){go(settingsFrom||'map');return true;}
 if(['map','credits','inv','shop'].includes(scene)){go(scene==='map'?'title':'map');return true;}if(scene==='title')return false;
 if(scene==='pre'){go('map');return true;}return true;}catch(e){return false;}};
window.onAndroidPause=function(){try{if(scene==='fight'){P.blocking=false;go('pause');}if(AC&&AC.state==='running')AC.suspend();}catch(e){}};
window.onAndroidResume=function(){try{if(AC&&AC.state==='suspended')AC.resume();}catch(e){}};
let settingsFrom='map';
function tap(p){if(scene==='dialog'){DLG.tap(p);return;}if(sceneT<0.35)return;
 for(let i=BTN.length-1;i>=0;i--){const b=BTN[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){play('block',0.3,1.6);hap('tap');b.fn();return;}}
 if(scene==='ending'){if(sceneT>3)go('map');return;}
 if(scene==='story'){storyI++;if(storyI>=storyPages.length)storyNext();else sceneT=0.35;return;}
 if(scene==='pre'){toFight();return;}
 if(scene==='victory'&&sceneT>2.0){go('loot');return;}
 if(scene==='loot'){go('xp');return;}
 if(scene==='xp'){go('post');return;}
 if(scene==='post'){afterPost();return;}
 if(scene==='death'&&sceneT>2.5){go('map');return;}}

/* ---------- world ---------- */
let T=0;
function theme(){const ch=(scene==='fight'||scene==='pre'||scene==='victory'||scene==='death'||scene==='dialog'||scene==='pause'||scene==='post')&&ED?ED.ch:(scene==='map'?Math.min(mapView,S.maxCh):(scene==='story'&&storyTheme!=null?storyTheme:S.ch));return THEME[CHAPTERS[Math.min(ch,CHAPTERS.length-1)].theme];}
let storyTheme=null;
function sceneDraw(k,hz,es){const s=es;
 if(k==='village'){ // stone houses with lit windows, lamp posts, sea behind
  cx.fillStyle='rgba(20,16,14,.6)';cx.fillRect(0,hz-90*s,W,90*s);
  for(let i=0;i<7;i++){const x=W*(i*0.16-0.03),w=W*0.13,h=(120+(i%3)*40)*s,y=hz-h;cx.fillStyle='rgba(34,28,24,.95)';cx.fillRect(x,y,w,h);cx.beginPath();cx.moveTo(x-6*s,y);cx.lineTo(x+w/2,y-40*s);cx.lineTo(x+w+6*s,y);cx.fill();
   for(let k2=0;k2<2;k2++){cx.fillStyle='rgba(255,190,100,'+(0.35+0.2*Math.sin(T*2+i+k2))+')';cx.fillRect(x+w*0.2+k2*w*0.4,y+h*0.35,w*0.18,h*0.22);}}
  for(let i=0;i<4;i++){const x=W*(0.14+i*0.25);cx.fillStyle='rgba(20,14,10,.95)';cx.fillRect(x-2*s,hz-110*s,4*s,110*s);const g=cx.createRadialGradient(x,hz-112*s,2*s,x,hz-112*s,40*s);g.addColorStop(0,'rgba(255,200,110,.8)');g.addColorStop(1,'rgba(255,200,110,0)');cx.fillStyle=g;cx.beginPath();cx.arc(x,hz-112*s,40*s,0,7);cx.fill();}}
 else if(k==='loft'){ // bell loft: rose window, hanging bells, ropes
  const g=cx.createRadialGradient(W/2,hz-230*s,10*s,W/2,hz-230*s,120*s);g.addColorStop(0,'rgba(220,200,255,.35)');g.addColorStop(1,'rgba(120,100,180,0)');cx.fillStyle=g;cx.beginPath();cx.arc(W/2,hz-230*s,120*s,0,7);cx.fill();
  cx.strokeStyle='rgba(30,24,40,.9)';cx.lineWidth=6*s;cx.beginPath();cx.arc(W/2,hz-230*s,90*s,0,7);cx.stroke();for(let i=0;i<8;i++){cx.beginPath();cx.moveTo(W/2,hz-230*s);cx.lineTo(W/2+Math.cos(i*0.785)*90*s,hz-230*s+Math.sin(i*0.785)*90*s);cx.stroke();}
  for(let i=0;i<5;i++){const x=W*(0.1+i*0.2),sw=Math.sin(T*1.2+i)*0.08;cx.save();cx.translate(x,0);cx.rotate(sw);cx.strokeStyle='rgba(60,50,40,.9)';cx.lineWidth=2*s;cx.beginPath();cx.moveTo(0,0);cx.lineTo(0,hz-200*s);cx.stroke();
   cx.fillStyle='rgba(90,80,60,.95)';cx.beginPath();cx.moveTo(-18*s,hz-200*s);cx.quadraticCurveTo(-22*s,hz-150*s,-30*s,hz-140*s);cx.lineTo(30*s,hz-140*s);cx.quadraticCurveTo(22*s,hz-150*s,18*s,hz-200*s);cx.fill();cx.restore();}
  cx.fillStyle='rgba(20,16,26,.95)';for(let i=0;i<5;i++)cx.fillRect(W*(0.02+i*0.24),0,12*s,hz);}
 else if(k==='marsh'){ // reeds and wisps
  for(let i=0;i<60;i++){const x=(i*61%1000)/1000*W,h=(60+(i*37%80))*s,sw=Math.sin(T*1.5+i)*4*s;cx.strokeStyle='rgba(20,40,24,'+(0.4+(i%3)*0.2)+')';cx.lineWidth=2*s;cx.beginPath();cx.moveTo(x,hz+10*s);cx.quadraticCurveTo(x+sw,hz-h*0.5,x+sw*2,hz-h);cx.stroke();}
  for(let i=0;i<7;i++){const x=W*((i*0.17+T*0.01)%1),y=hz-(40+30*Math.sin(T*0.7+i))*s;const g=cx.createRadialGradient(x,y,1,x,y,18*s);g.addColorStop(0,'rgba(200,255,160,.8)');g.addColorStop(1,'rgba(200,255,160,0)');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,18*s,0,7);cx.fill();}
  cx.fillStyle='rgba(10,20,12,.9)';for(let i=0;i<3;i++){cx.beginPath();cx.ellipse(W*(0.15+i*0.35),hz-150*s,60*s,120*s,0,0,7);cx.fill();}}
 else if(k==='wreck'){ // tilted hull ribs, mast, lightning
  cx.save();cx.translate(W*0.5,hz);cx.rotate(-0.12);cx.strokeStyle='rgba(30,40,50,.95)';cx.lineWidth=10*s;for(let i=-4;i<=4;i++){cx.beginPath();cx.moveTo(i*60*s,0);cx.quadraticCurveTo(i*60*s-30*s,-150*s,i*40*s,-260*s);cx.stroke();}
  cx.lineWidth=8*s;cx.beginPath();cx.moveTo(-250*s,-30*s);cx.quadraticCurveTo(0,-70*s,250*s,-30*s);cx.stroke();cx.lineWidth=12*s;cx.beginPath();cx.moveTo(60*s,-40*s);cx.lineTo(90*s,-330*s);cx.stroke();cx.restore();
  if(Math.sin(T*3.7)>0.97){cx.fillStyle='rgba(200,220,255,.25)';cx.fillRect(0,0,W,hz);cx.strokeStyle='#eef';cx.lineWidth=2;cx.beginPath();cx.moveTo(W*0.7,0);cx.lineTo(W*0.66,hz*0.3);cx.lineTo(W*0.72,hz*0.45);cx.lineTo(W*0.65,hz*0.8);cx.stroke();}
  for(let i=0;i<40;i++){const x=(i*97+T*300)%W,y=(i*53+T*700)%H;cx.strokeStyle='rgba(200,220,240,.25)';cx.lineWidth=1;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-4,y+14);cx.stroke();}}
 else if(k==='dune'){ // dunes and a grave
  for(let i=0;i<4;i++){cx.fillStyle='rgba('+(120+i*30)+','+(108+i*28)+','+(88+i*24)+',.95)';cx.beginPath();cx.moveTo(0,hz+10*s);for(let x=0;x<=W;x+=20)cx.lineTo(x,hz-(40+i*45)*s+Math.sin(x*0.004+i*2)*(30+i*10)*s+Math.sin(x*0.013+i)*8*s);cx.lineTo(W,hz+10*s);cx.fill();}
  cx.fillStyle='rgba(60,52,40,.95)';cx.fillRect(W*0.5-18*s,hz-70*s,36*s,70*s);cx.beginPath();cx.arc(W*0.5,hz-70*s,18*s,Math.PI,0);cx.fill();cx.fillStyle='rgba(200,190,170,.5)';cx.font='bold '+(7*s|0)+FS;cx.textAlign='center';cx.fillText('ISOLDE',W*0.5,hz-50*s);cx.fillText('THORNE',W*0.5,hz-40*s);
  for(let i=0;i<30;i++){const x=(i*131+T*120)%W,y=hz-(i*17%60)*s;cx.fillStyle='rgba(230,220,200,.25)';cx.fillRect(x,y,2,1);}}
 else if(k==='quench'){ // cooling kiln core
  for(let i=0;i<12;i++){const x=(i*W/12+20)%W;cx.strokeStyle='rgba(120,200,255,'+(0.15+0.1*Math.sin(T*2+i))+')';cx.lineWidth=2;cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,hz-40*s-(i%3)*30);cx.lineTo(x+30,hz-20*s-(i%3)*30);cx.stroke();}
  const g=cx.createRadialGradient(W/2,hz-120*s,10*s,W/2,hz-120*s,160*s);g.addColorStop(0,'rgba(140,220,255,'+(0.3+0.1*Math.sin(T*1.5))+')');g.addColorStop(1,'rgba(40,80,120,0)');cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.fillStyle='rgba(10,20,30,.9)';for(let i=0;i<5;i++){cx.fillRect(W*(0.05+i*0.22)-10*s,hz-280*s,20*s,280*s);}
  cx.strokeStyle='rgba(160,230,255,.5)';cx.lineWidth=3*s;cx.beginPath();cx.arc(W/2,hz-120*s,90*s,0,7);cx.stroke();cx.beginPath();cx.arc(W/2,hz-120*s,60*s+6*s*Math.sin(T*2),0,7);cx.stroke();}}
function drawWorld(){const l=L(),th=theme(),es=Math.min(W*(l.land?0.55:0.95),H*0.62)/300;
 const g=cx.createLinearGradient(0,0,0,H);th.sky.forEach((c,i)=>g.addColorStop([0,.55,.62,1][i],c));cx.fillStyle=g;cx.fillRect(0,0,W,H);
 const hz=l.ey+10*es;
 if(!th.scene)for(let layer=0;layer<2;layer++){const s=es*(layer?1.3:0.8);cx.fillStyle='rgba('+(layer?th.arch2:th.arch)+','+(layer?0.55:0.3)+')';
  const span=120*s;for(let x=-((T*3*(layer+1))%span)-span;x<W+span;x+=span){
   cx.beginPath();cx.rect(x,hz-260*s,22*s,260*s);cx.fill();
   cx.beginPath();cx.moveTo(x+22*s,hz-170*s);cx.quadraticCurveTo(x+span/2+11*s,hz-300*s,x+span,hz-170*s);cx.lineTo(x+span,hz-150*s);cx.quadraticCurveTo(x+span/2+11*s,hz-270*s,x+22*s,hz-150*s);cx.fill();}}
 else sceneDraw(th.scene,hz,es);
 if(th.circuit){cx.strokeStyle='rgba(80,200,220,'+(0.15+0.1*Math.sin(T*2))+')';cx.lineWidth=2;for(let i=0;i<12;i++){const x=(i*W/12+20)%W;cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,hz-40*es-(i%3)*30);cx.lineTo(x+30,hz-20*es-(i%3)*30);cx.stroke();}}
 const rw=cx.createRadialGradient(W/2,hz-230*es,0,W/2,hz-230*es,70*es);rw.addColorStop(0,'rgba('+th.glow+',.38)');rw.addColorStop(1,'rgba('+th.glow+',0)');cx.fillStyle=rw;cx.fillRect(0,0,W,H);
 const wg=cx.createLinearGradient(0,hz,0,H);wg.addColorStop(0,th.floor[0]);wg.addColorStop(1,th.floor[1]);cx.fillStyle=wg;cx.fillRect(0,hz,W,H-hz);
 if(th.water){cx.strokeStyle='rgba(170,215,210,.12)';cx.lineWidth=1;for(let i=0;i<14;i++){const y=hz+(i*i*3+((T*8)%6))*U*0.5;cx.beginPath();for(let x=0;x<=W;x+=20)cx.lineTo(x,y+Math.sin(x*0.03+T*1.5+i)*1.5);cx.stroke();}}
 else{cx.strokeStyle='rgba(0,0,0,.25)';cx.lineWidth=1;for(let i=1;i<8;i++){const y=hz+(i*i*4)*U*0.5;cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}}
 for(let i=0;i<3;i++){const y=hz-40*es+i*30*es,fg=cx.createLinearGradient(0,y-50,0,y+50);fg.addColorStop(0,'rgba('+th.fog+',0)');fg.addColorStop(.5,'rgba('+th.fog+',.12)');fg.addColorStop(1,'rgba('+th.fog+',0)');cx.fillStyle=fg;cx.fillRect(0,y-50,W,100);}
 for(let i=0;i<22;i++){const x=(i*97+T*(8+i%5*3))%W,y=H-((i*53+T*(14+i%7*4))%H);cx.fillStyle='rgba('+th.glow+','+(0.25+0.3*Math.sin(T*2+i)**2)+')';cx.fillRect(x,y,2,2);}}

/* ---------- animated fighters ---------- */
// Weapon resting angle and wind-up angle by attack direction/side (anticipation = pull back opposite the strike)
function wAngle(dir,side,strike){if(dir<0)return strike?0.9:-2.4; // overhead slam: raise high, crash down
 const sd=side==='L'?-1:side==='R'?1:0;if(strike)return 0.3+sd*0.5;return -1.25+(dir===6?-0.35:dir===2?-1.0:sd*0.9);}
const WLEN={spear:196,sword:140,embersword:150,greatsword:190,daggers:64,mace:120,club:130,hammer:150,flail:110,axe:120,twinaxe:100,halberd:200,scythe:190,claws:40,fists:30};
function enemyPose(){const wind=E.state==='windup'?clamp(E.windT/E.wind,0,1):0;const a=E.atk;
 const breathe=Math.sin(T*2.2)*3,bob=Math.sin(T*4.4)*1.5;let lean=Math.sin(T*1.1)*0.03,wA=-1.25+Math.sin(T*2.2)*0.06,shieldX=-46,crouch=0,dx=Math.sin(T*0.9)*8;
 if(E.state==='windup'){const sd=E.side==='L'?-1:E.side==='R'?1:0;const ease=wind*wind*(3-2*wind);
  lean=sd*ease*0.16-(a.unblock?ease*0.12:0);wA=lerp(-1.25,wAngle(E.dir,E.side,0),ease);crouch=ease*10;dx+=sd*ease*-14;
  if(E.windT>E.wind-0.12)wA+=Math.sin(T*60)*0.03;} // tremble just before release
 if(E.state==='strike'||E.follow>0){const f=E.follow,sd=E.side==='L'?-1:E.side==='R'?1:0;const tgt=wAngle(E.dir,E.side,1);
  wA=lerp(tgt+0.5,tgt,1-f*f);lean=-sd*0.14*f+0.1*f;crouch=-6*f;dx+=-sd*20*f;}
 if(E.state==='open'){lean=Math.sin(T*9)*0.07*E.stag+0.08;wA=-0.3+Math.sin(T*5)*0.1;shieldX=-72;crouch=8*E.stag;}
 if(E.recoil>0){lean+=-E.hitDir*0.2*E.recoil;crouch+=6*E.recoil;}
 if(E.block>0)shieldX=-18;
 return{wind,breathe,bob,lean,wA,shieldX,crouch,dx};}
function drawEnemy(){if(!ED)return;const l=L(),s=l.es/ED.look.sz*ED.look.sz;const x0=l.ex,y=l.ey;const po=enemyPose();
 const kbOff=-E.kb*26*s; // knockback pushes away (up/back into the scene)
 const x=x0+po.dx*s+(E.recoil>0?E.hitDir*10*E.recoil*s:0);
 const lunge=E.lunge*22;
 // shadow
 cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(x,y+4*s,(70+E.lunge*10)*s,10*s,0,0,7);cx.fill();
 const deadA=E.state==='dead'?E.deadT:0;
 const draw=(alpha,refl)=>{cx.save();cx.translate(x,y+(refl?10*s:lunge*s+kbOff));if(refl){cx.scale(1,-0.35);cx.globalAlpha=0.16;}
  cx.scale(1+E.lunge*0.1,1+E.lunge*0.1);
  if(deadA){const f=Math.min(1,deadA/0.9),fall=f*f;cx.translate(0,-fall*4*s);cx.rotate(fall*1.35*(E.hitDir>=0?1:-1));if(!refl)cx.globalAlpha=Math.max(0,1-Math.max(0,deadA-1.6)*0.5);}
  fighter(ED.look,s,po,E.hurt);cx.restore();};
 if(theme().water)draw(0,1);draw(1,0);
 // enemy weapon trail on strike
 etrail.forEach(t=>{const a=1-t.t/0.35;if(a<=0)return;cx.save();cx.translate(x+60*s,y-110*s);cx.strokeStyle='rgba('+t.col+','+a*0.8+')';cx.lineWidth=14*s*a;cx.lineCap='round';cx.shadowColor='rgba('+t.col+',1)';cx.shadowBlur=14;
  const r=(WLEN[ED.look.w]||140)*s*0.9*ED.look.sz,a1=t.a0;cx.beginPath();cx.arc(0,0,r,a1-1.4,a1);cx.stroke();cx.restore();});
 if(E.state==='windup'){const a=E.atk,rem=windRemaining(),ready=rem<=0.6+G.pw&&!(a.feint&&!E.feinted);const cxp=x,cyp=y-120*s;
  if(a.unblock){cx.strokeStyle='rgba(255,80,40,'+(0.4+0.5*po.wind)+')';cx.lineWidth=4*U;cx.beginPath();cx.arc(cxp,cyp,(70-30*po.wind)*s,0,7);cx.stroke();cx.fillStyle='#ff6a3d';cx.font='bold '+(22*U|0)+'px AshSerif,Lora,Georgia,serif';cx.textAlign='center';cx.fillText('DODGE',cxp,cyp+8*U);}
  else{const d=DV[E.dir],len=70*s;const feintPending=a.feint&&!E.feinted;
   if(S.set.ring&&!feintPending)FX.timingRing(cx,cxp,cyp,rem,0.6+G.pw,0.2+G.pw/2,U,'#7fe0ff','#ffffff');
   cx.save();cx.translate(cxp,cyp);cx.rotate(Math.atan2(d[1],d[0]));
   cx.globalAlpha=ready?0.95:0.45;cx.strokeStyle=ready?'#e8fbff':'#8fc9cf';cx.lineWidth=(ready?7:4)*U;cx.lineCap='round';
   cx.shadowColor='#7ff';cx.shadowBlur=ready?18:4;cx.beginPath();cx.moveTo(-len,0);cx.lineTo(len,0);cx.moveTo(len-18*U,-14*U);cx.lineTo(len,0);cx.lineTo(len-18*U,14*U);cx.stroke();cx.restore();
   if(E.miss>0){const md=DV[E.missDir];cx.save();cx.translate(cxp,cyp);cx.rotate(Math.atan2(md[1],md[0]));cx.globalAlpha=E.miss*1.4;cx.strokeStyle='#ff5a3d';cx.lineWidth=4*U;cx.lineCap='round';cx.beginPath();cx.moveTo(-len*0.6,0);cx.lineTo(len*0.6,0);cx.moveTo(len*0.6-12*U,-10*U);cx.lineTo(len*0.6,0);cx.lineTo(len*0.6-12*U,10*U);cx.stroke();cx.restore();
    cx.save();cx.globalAlpha=E.miss*1.4;cx.fillStyle='#ff5a3d';cx.font='bold '+(10*U|0)+FS;cx.textAlign='center';cx.fillText('✕ wrong way · follow the arrow',cxp,cyp+80*s);cx.restore();}}
  const wl=(WLEN[ED.look.w]||140)*ED.look.sz;cx.fillStyle='rgba(255,255,255,'+(po.wind*0.9)+')';cx.beginPath();cx.arc(x+60*s*ED.look.sz+Math.cos(po.wA)*wl*s,y-110*s*ED.look.sz+Math.sin(po.wA)*wl*s,(3+po.wind*6)*s,0,7);cx.fill();}}
function fighter(k,s0,po,hurt){const s=s0*k.sz,br=po.breathe+po.bob,cr=po.crouch;
 cx.rotate(po.lean);const metal=hurt>0?'#e8e2da':k.m,dark='#141c1d',cloth=k.c;
 if(k.ghost)cx.globalAlpha*=0.82+0.1*Math.sin(T*3);
 const ty=cr; // crouch lowers upper body
 // legs with weight shift
 const ws=Math.sin(T*1.1)*4+(po.dx||0)*0.1;cx.fillStyle=dark;
 if(k.beast){cx.fillRect(-46*s,-50*s,30*s,52*s);cx.fillRect(16*s,-50*s,30*s,52*s);}
 else{cx.save();cx.translate(-21*s,-60*s);cx.rotate(-0.05-ws*0.01);cx.fillRect(-13*s,0,26*s,62*s);cx.restore();cx.save();cx.translate(21*s,-60*s);cx.rotate(0.05-ws*0.01);cx.fillRect(-13*s,0,26*s,62*s);cx.restore();}
 cx.translate(0,ty*s);
 cx.fillStyle=cloth;cx.beginPath();cx.moveTo(-44*s,-70*s);cx.lineTo(44*s,-70*s);cx.lineTo((52+Math.sin(T*2)*3)*s,-20*s);cx.lineTo((-52+Math.sin(T*2+1)*3)*s,-20*s);cx.fill();
 const sw=k.beast||k.golem?1.35:1,top=k.beast?-140:-160;
 cx.fillStyle=metal;cx.beginPath();cx.moveTo(-58*sw*s,(top+br)*s);cx.lineTo(58*sw*s,(top+br)*s);cx.lineTo(44*s,-70*s);cx.lineTo(-44*s,-70*s);cx.closePath();cx.fill();
 cx.strokeStyle='rgba(220,220,210,.22)';cx.lineWidth=2*s;cx.stroke();
 cx.beginPath();cx.ellipse(-62*sw*s,(top+10+br)*s,26*sw*s,18*s,0,0,7);cx.ellipse(62*sw*s,(top+10+br)*s,26*sw*s,18*s,0,0,7);cx.fill();
 if(k.golem){cx.strokeStyle='rgba('+k.e+',.8)';cx.lineWidth=2*s;cx.beginPath();cx.moveTo(-20*s,(top+30)*s);cx.lineTo(-5*s,(top+60)*s);cx.lineTo(10*s,(top+50)*s);cx.lineTo(25*s,(top+85)*s);cx.stroke();
  const cg=cx.createRadialGradient(0,(top+50)*s,0,0,(top+50)*s,22*s);cg.addColorStop(0,'rgba('+k.e+',.9)');cg.addColorStop(1,'rgba('+k.e+',0)');cx.fillStyle=cg;cx.fillRect(-30*s,(top+20)*s,60*s,60*s);}
 if(k.barn){cx.fillStyle='#b9b29a';[[-30,-120],[-12,-140],[20,-100],[36,-135],[-68,-155],[70,-148],[0,-85]].forEach(([bx,by],i)=>{cx.beginPath();cx.arc(bx*s,(by+br)*s,(4+i%3*2)*s,0,7);cx.fill();});}
 // head / helm
 const hy=top+br-2;cx.fillStyle=metal;
 if(k.helm==='hood'){cx.fillStyle=cloth;cx.beginPath();cx.moveTo(-30*s,(hy+4)*s);cx.quadraticCurveTo(-30*s,(hy-58)*s,0,(hy-62)*s);cx.quadraticCurveTo(30*s,(hy-58)*s,30*s,(hy+4)*s);cx.fill();cx.fillStyle='#050505';cx.beginPath();cx.ellipse(0,(hy-26)*s,15*s,18*s,0,0,7);cx.fill();}
 else if(k.helm==='none'){cx.beginPath();cx.ellipse(0,(hy-24)*s,(k.beast?30:24)*s,(k.beast?22:26)*s,0,0,7);cx.fill();}
 else{cx.beginPath();cx.moveTo(-24*s,hy*s);cx.lineTo(-22*s,(hy-43)*s);cx.quadraticCurveTo(0,(hy-63)*s,22*s,(hy-43)*s);cx.lineTo(24*s,hy*s);cx.fill();
  if(k.helm==='crest'){cx.strokeStyle='#7a4a3a';cx.lineWidth=3*s;cx.beginPath();cx.moveTo(0,(hy-58)*s);cx.lineTo(-8*s,(hy-80)*s);cx.moveTo(0,(hy-58)*s);cx.lineTo(10*s,(hy-76)*s);cx.stroke();}
  if(k.helm==='horned'){cx.strokeStyle='#cfc6a8';cx.lineWidth=6*s;cx.lineCap='round';cx.beginPath();cx.moveTo(-20*s,(hy-40)*s);cx.quadraticCurveTo(-50*s,(hy-50)*s,-46*s,(hy-82)*s);cx.moveTo(20*s,(hy-40)*s);cx.quadraticCurveTo(50*s,(hy-50)*s,46*s,(hy-82)*s);cx.stroke();}
  if(k.helm==='crown'){cx.fillStyle='#e0a040';for(let i=-2;i<=2;i++){cx.beginPath();cx.moveTo(i*9*s-5*s,(hy-52)*s);cx.lineTo(i*9*s,(hy-70-Math.abs(i)*-3)*s);cx.lineTo(i*9*s+5*s,(hy-52)*s);cx.fill();}}
  if(k.helm==='mask'){cx.fillStyle='#d8d0c0';cx.beginPath();cx.ellipse(0,(hy-26)*s,16*s,20*s,0,0,7);cx.fill();}}
 cx.fillStyle='rgba('+k.e+','+(0.6+po.wind*0.4)+')';cx.shadowColor='rgba('+k.e+',1)';cx.shadowBlur=6+po.wind*12;
 if(k.helm==='hood'||k.helm==='none'||k.helm==='mask'){cx.fillRect(-10*s,(hy-30)*s,6*s,3*s);cx.fillRect(4*s,(hy-30)*s,6*s,3*s);}else cx.fillRect(-15*s,(hy-30)*s,30*s,4*s);cx.shadowBlur=0;
 // weapon in right hand
 cx.save();cx.translate(60*sw*s,(-110+br)*s);cx.rotate(po.wA);weapon(k.w,s,po.wind);cx.restore();
 if(k.w==='daggers'||k.w==='twinaxe'||k.w==='claws'||k.w==='fists'){cx.save();cx.translate(-60*sw*s,(-110+br)*s);cx.scale(-1,1);cx.rotate(-1.25+Math.sin(T*2.2+1)*0.08+(po.wind*0.4));weapon(k.w,s,po.wind);cx.restore();}
 if(k.sh){cx.save();cx.translate(po.shieldX*s,(-105+br)*s);cx.rotate(Math.sin(T*1.6)*0.04);cx.fillStyle=hurt>0?'#ddd':k.m;cx.strokeStyle='#b8a47a';cx.lineWidth=3*s;cx.beginPath();
  if(k.sh==='round')cx.arc(0,0,38*s,0,7);else if(k.sh==='tower')cx.rect(-36*s,-70*s,72*s,130*s);else{cx.moveTo(-30*s,-55*s);cx.lineTo(30*s,-55*s);cx.lineTo(30*s,5*s);cx.lineTo(0,60*s);cx.lineTo(-30*s,5*s);cx.closePath();}
  cx.fill();cx.stroke();cx.fillStyle='rgba('+k.e+',.7)';cx.beginPath();cx.arc(0,-6*s,8*s,0,7);cx.fill();cx.restore();}}
function weapon(w,s,wind){const glow=wind>0.6;cx.lineCap='butt';
 const blade=(len,wd,col)=>{cx.fillStyle=col||'#c8d6d4';cx.beginPath();cx.moveTo(10*s,-wd*s);cx.lineTo(len*s,-wd*0.6*s);cx.lineTo((len+16)*s,0);cx.lineTo(len*s,wd*0.6*s);cx.lineTo(10*s,wd*s);cx.fill();cx.fillStyle='#6a5a3a';cx.fillRect(4*s,-12*s,6*s,24*s);};
 const haft=(a,b,wd)=>{cx.fillStyle='#5a4632';cx.fillRect(a*s,-wd*s,(b-a)*s,wd*2*s);};
 if(glow){cx.shadowColor='#fff';cx.shadowBlur=10;}
 switch(w){
  case'spear':haft(-120,160,3);cx.fillStyle='#c8d6d4';cx.beginPath();cx.moveTo(160*s,-9*s);cx.lineTo(196*s,0);cx.lineTo(160*s,9*s);cx.fill();break;
  case'sword':blade(130,5);break;case'greatsword':blade(175,9,'#d4d8d4');break;
  case'embersword':cx.shadowColor='#ff7a2a';cx.shadowBlur=16;blade(140,6,'#ffb070');break;
  case'daggers':blade(54,4);break;
  case'mace':haft(-10,100,3);cx.fillStyle='#6a6a66';cx.beginPath();cx.arc(110*s,0,16*s,0,7);cx.fill();break;
  case'club':haft(-10,90,8);cx.fillStyle='#4a3a28';cx.beginPath();cx.ellipse(110*s,0,30*s,16*s,0,0,7);cx.fill();break;
  case'hammer':haft(-30,130,4);cx.fillStyle='#6a6460';cx.fillRect(118*s,-24*s,34*s,48*s);break;
  case'flail':haft(-10,50,3);cx.strokeStyle='#888';cx.lineWidth=2*s;cx.beginPath();cx.moveTo(50*s,0);const fx=95,fy=Math.sin(T*6)*14;cx.lineTo(fx*s,fy*s);cx.stroke();cx.fillStyle='#5a5a56';cx.beginPath();cx.arc(fx*s,fy*s,14*s,0,7);cx.fill();break;
  case'axe':case'twinaxe':{const L2=w==='axe'?110:88;haft(-10,L2,3);cx.fillStyle='#b8c0bc';cx.beginPath();cx.moveTo(L2*s-20*s,-4*s);cx.quadraticCurveTo(L2*s+14*s,-34*s,L2*s+6*s,-4*s);cx.lineTo(L2*s+6*s,4*s);cx.quadraticCurveTo(L2*s+14*s,30*s,L2*s-20*s,4*s);cx.fill();break;}
  case'halberd':haft(-80,180,3);cx.fillStyle='#c0c8c4';cx.beginPath();cx.moveTo(180*s,-6*s);cx.lineTo(205*s,0);cx.lineTo(180*s,6*s);cx.fill();cx.beginPath();cx.moveTo(150*s,0);cx.quadraticCurveTo(165*s,-36*s,180*s,-4*s);cx.fill();break;
  case'scythe':haft(-60,180,3);cx.fillStyle='#c0c8c4';cx.beginPath();cx.moveTo(180*s,0);cx.quadraticCurveTo(150*s,70*s,90*s,80*s);cx.quadraticCurveTo(140*s,55*s,172*s,0);cx.fill();break;
  case'claws':cx.strokeStyle='#e8e0d0';cx.lineWidth=3*s;for(let i=-1;i<=1;i++){cx.beginPath();cx.moveTo(0,i*8*s);cx.quadraticCurveTo(25*s,i*10*s,42*s,i*14*s+8*s);cx.stroke();}break;
  case'fists':cx.fillStyle='#5a5a56';cx.beginPath();cx.arc(20*s,0,24*s,0,7);cx.fill();break;}
 cx.shadowBlur=0;}
function drawPlayer(){const l=L(),s=Math.min(W,H)/(l.land?620:400);
 const dp=P.dodge>0?(0.55-P.dodge)/0.55:0,dArc=Math.sin(dp*Math.PI);const dx=P.dodge>0?P.dodgeSide*dArc*W*0.2:0;
 const bob=Math.sin(T*4)*3+Math.sin(T*1.3)*2,sway=Math.sin(T*1.1)*4;
 const kb=P.kb;const x=W*0.5+dx+sway-(l.land?W*0.18:W*0.22),y=H+10*s+bob*s+kb*22*s+dArc*18*s;
 cx.save();cx.translate(x,y);cx.rotate(P.dodgeSide*dArc*0.35+(P.hurt>0?-0.08*P.hurt:0)+Math.sin(T*1.1)*0.02);
 if(P.dodge>0){cx.globalAlpha=0.25;cx.fillStyle='#0a1112';cx.beginPath();cx.arc(-P.dodgeSide*40*s,-120*s,60*s,0,7);cx.fill();cx.globalAlpha=1;}
 const it=IT[S.eq.armour],cloak=P.hurt>0?'#5a1f1a':'#0a1112';
 cx.fillStyle=cloak;cx.beginPath();cx.moveTo((-60+Math.sin(T*2)*4)*s,0);cx.quadraticCurveTo(-70*s,-120*s,-30*s,-170*s);cx.quadraticCurveTo(0,-200*s,30*s,-170*s);cx.quadraticCurveTo(70*s,-120*s,(60+Math.sin(T*2+1)*4)*s,0);cx.fill();
 cx.fillStyle=it.col;cx.globalAlpha=0.35;cx.fillRect(-36*s,-165*s,72*s,30*s);cx.globalAlpha=1;
 cx.fillStyle=cloak;cx.beginPath();cx.arc(0,-190*s,24*s,0,7);cx.fill();
 if(S.eq.helm!=='h_none'){cx.fillStyle=IT[S.eq.helm].col;cx.beginPath();cx.arc(0,-194*s,24*s,Math.PI,0);cx.fill();}
 cx.fillStyle='rgba(224,122,47,.5)';cx.fillRect(-30*s,-160*s,60*s,3*s);
 if(S.eq.shield!=='s_none'){cx.save();cx.translate(-55*s,(P.blocking?-150:-110)*s);cx.rotate(P.blocking?0.2:-0.3);cx.fillStyle=IT[S.eq.shield].col;cx.strokeStyle='#b8935a';cx.lineWidth=3*s;cx.beginPath();cx.moveTo(-26*s,-40*s);cx.lineTo(26*s,-40*s);cx.lineTo(26*s,6*s);cx.lineTo(0,46*s);cx.lineTo(-26*s,6*s);cx.closePath();cx.fill();cx.stroke();cx.restore();}
 // sword: anticipation (cock back) -> slash -> follow-through overshoot
 const wcol=IT[S.eq.weapon].col,sw=P.swing;let ang;
 if(sw>0){const d=Math.atan2(DV[P.swingDir][1],DV[P.swingDir][0]),t=1-sw;ang=t<0.15?d+Math.PI-0.6:lerp(d+Math.PI-0.6,d+0.5,Math.min(1,(t-0.15)/0.45));}
 else ang=-1.0+Math.sin(T*2.2)*0.08;
 cx.translate(45*s,-130*s);cx.rotate(P.blocking?-1.57:ang);cx.fillStyle=wcol;cx.shadowColor='#bff';cx.shadowBlur=10;
 cx.beginPath();cx.moveTo(0,-4*s);cx.lineTo(150*s,-2*s);cx.lineTo(166*s,0);cx.lineTo(150*s,2*s);cx.lineTo(0,4*s);cx.fill();cx.shadowBlur=0;
 if(sw>0.1&&sw<0.85){cx.strokeStyle='rgba(220,250,255,'+sw*0.5+')';cx.lineWidth=18*s;cx.beginPath();cx.arc(0,0,130*s,-0.9,0);cx.stroke();}
 cx.fillStyle='#e07a2f';cx.fillRect(-4*s,-14*s,8*s,28*s);cx.restore();
 if(P.blocking){cx.strokeStyle='rgba(150,220,255,.35)';cx.lineWidth=6;cx.beginPath();cx.arc(W/2,H*0.95,W*0.5,Math.PI*1.15,Math.PI*1.85);cx.stroke();}}

/* ---------- HUD (unchanged layout) ---------- */
function bar(x,y,w,h,v,col,right,ghost){cx.fillStyle='rgba(0,0,0,.58)';cx.fillRect(x,y,w,h);
 if(ghost!=null&&ghost>v){const gw=w*clamp(ghost,0,1);cx.fillStyle='rgba(255,90,60,.75)';cx.fillRect(right?x+w-gw:x,y,gw,h);}
 const fw=w*clamp(v,0,1);cx.fillStyle=col;cx.fillRect(right?x+w-fw:x,y,fw,h);
 cx.fillStyle='rgba(255,255,255,.25)';cx.fillRect(right?x+w-fw:x,y,fw,h*0.35);cx.fillStyle='rgba(0,0,0,.35)';for(let i=1;i<4;i++)cx.fillRect(x+w*i/4-0.5,y,1,h);
 cx.strokeStyle='rgba(210,230,230,.6)';cx.lineWidth=1.5;cx.strokeRect(x,y,w,h);}
function circleBtn(c,fill,ready,icon,pressed){cx.save();cx.globalAlpha=ready?0.95:0.55;
 const g=cx.createRadialGradient(c.x,c.y-c.r*0.3,c.r*0.2,c.x,c.y,c.r);g.addColorStop(0,pressed?'rgba(60,80,90,.8)':'rgba(16,36,40,.6)');g.addColorStop(1,'rgba(6,16,18,.5)');cx.fillStyle=g;cx.beginPath();cx.arc(c.x,c.y,c.r,0,7);cx.fill();
 if(fill!=null){cx.strokeStyle='rgba(255,255,255,.08)';cx.lineWidth=4;cx.beginPath();cx.arc(c.x,c.y,c.r-2,0,7);cx.stroke();if(ready){cx.shadowColor='#ffd27a';cx.shadowBlur=14+6*Math.sin(T*6);}cx.strokeStyle=ready?'#ffd27a':'#7fb7c0';cx.lineWidth=4;cx.beginPath();cx.arc(c.x,c.y,c.r-2,-Math.PI/2,-Math.PI/2+6.283*fill);cx.stroke();cx.shadowBlur=0;}
 cx.strokeStyle='rgba(220,240,240,.6)';cx.lineWidth=2;cx.beginPath();cx.arc(c.x,c.y,c.r,0,7);cx.stroke();cx.strokeStyle='rgba(184,147,90,.5)';cx.lineWidth=1;cx.beginPath();cx.arc(c.x,c.y,c.r-5,0,7);cx.stroke();
 if(ready&&fill!=null&&fill>=1){cx.save();cx.globalAlpha=0.5+0.5*Math.sin(T*6);cx.strokeStyle='#ffd27a';cx.lineWidth=2;cx.beginPath();cx.arc(c.x,c.y,c.r+4*U+2*Math.sin(T*6),0,7);cx.stroke();cx.restore();}
 icon(c);cx.restore();}
function drawHUD(){const l=L(),m=l.m,dt=0.016;
 P.ghost=P.ghost==null?P.hp:(P.ghost>P.hp?Math.max(P.hp,P.ghost-P.max*dt*0.45):P.hp);E.ghost=E.ghost==null?E.hp:(E.ghost>E.hp?Math.max(E.hp,E.ghost-E.max*dt*0.45):E.hp);
 const pr=Math.max(17,16*U),bx=m+2*pr+6,bw=l.barW-(2*pr+6);
 bar(bx,m,bw,l.bh,P.hp/P.max,P.hp<P.max*0.25?'#ff9a8a':'#3fd0e0',false,P.ghost/P.max);bar(W-m-l.barW,m,bw,l.bh,E.hp/E.max,'#d8382e',true,E.ghost/E.max);
 const pm=P.hurt>0?'pain':P.hp<P.max*0.25?'grim':(E.state==='open'?'angry':P.blocking?'calm':'neutral');medallion(typeof CHARS!=='undefined'?CHARS.wren:null,pm,m+pr,m+pr,pr,false,'#3fd0e0');
 const ed=(typeof CHARS!=='undefined'&&CHARS[ED.id])||null,em=E.state==='dead'?'dead':E.hurt>0?'pain':E.state==='windup'?'angry':E.state==='open'?'surprised':(MOODQ[ED.id]||'grim');medallion(ed,em,W-m-pr,m+pr,pr,true,'#d8382e');
 cx.font='bold '+Math.max(12,10.5*U|0)+FS;cx.fillStyle='#e8f6f6';cx.textAlign='left';cx.fillText(Math.ceil(P.hp)+' / '+P.max,bx,m+l.bh+14*U);
 const hw=cx.measureText(Math.ceil(P.hp)+' / '+P.max).width;for(let i=0;i<P.blockMax;i++){const dx=bx+hw+12*U+i*10*U,dy=m+l.bh+10.5*U;cx.beginPath();cx.arc(dx,dy,3.4*U,0,7);cx.fillStyle=i<P.blockDur?(P.blocking?'#ffd27a':'#bfe9ff'):'rgba(191,233,255,.22)';cx.fill();}
 cx.font=Math.max(10,9*U|0)+FS;cx.fillStyle='#a9cfcc';cx.fillText('WREN · Lv '+level()+' · '+IT[S.eq.weapon].n,bx,m+l.bh+26*U);
 cx.textAlign='right';cx.font='bold '+Math.max(12,10.5*U|0)+FS;cx.fillStyle='#e8f6f6';cx.fillText(Math.ceil(E.hp)+' / '+E.max,W-bx,m+l.bh+14*U);
 cx.font=Math.max(10,9*U|0)+FS;cx.fillStyle=ED.boss?'#ffb09a':'#a9cfcc';cx.fillText((ED.boss?'☠ ':'')+ED.name.toUpperCase(),W-bx,m+l.bh+26*U);
 if(P.counter>0){cx.save();cx.globalAlpha=0.6+0.4*Math.sin(T*8);cx.fillStyle='#ffd27a';cx.font='bold '+Math.max(10,9*U|0)+FS;cx.textAlign='right';cx.fillText('COUNTER READY',W-bx,m+l.bh+38*U);cx.restore();}
 {const px=W/2,py=m+l.bh*0.5+1;cx.save();cx.globalAlpha=0.75;cx.fillStyle='rgba(6,14,16,.6)';cx.beginPath();cx.arc(px,py+6*U,11*U,0,7);cx.fill();cx.fillStyle='#e9e0c8';cx.fillRect(px-4.5*U,py+1.5*U,3*U,9*U);cx.fillRect(px+1.5*U,py+1.5*U,3*U,9*U);cx.restore();}
 cx.textAlign='center';cx.font=Math.max(10,9*U|0)+FS;cx.fillStyle='rgba(230,220,190,.7)';cx.fillText(CHAPTERS[ED.ch].name,W/2,m+l.bh+30*U);
 if(FX.streak>=2){const sN=FX.streak,hot=sN>=5;cx.save();cx.textAlign='center';if(hot){cx.shadowColor='#ff8a3a';cx.shadowBlur=12;}cx.fillStyle=hot?'#ffb070':'#ffd27a';cx.font='bold '+Math.max(12,11*U|0)+FS;cx.fillText('PARRY STREAK ×'+sN+(hot?'  · VIGIL':''),W/2,m+l.bh+46*U);cx.restore();}
 circleBtn(l.magic,P.magic/100,P.magic>=100,c=>{cx.strokeStyle='#ff9a50';cx.lineWidth=3;cx.beginPath();for(let a=0;a<12;a+=0.2){const r=a/12*c.r*0.6;cx.lineTo(c.x+Math.cos(a+T*2)*r,c.y+Math.sin(a+T*2)*r);}cx.stroke();});
 circleBtn(l.super,P.superM/100,P.superM>=100,c=>{cx.fillStyle='#fff6d0';cx.beginPath();for(let i=0;i<10;i++){const r=i%2?c.r*0.25:c.r*0.55,a=i*Math.PI/5-Math.PI/2;cx.lineTo(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r);}cx.fill();});
 const arrow=(c,d)=>{cx.fillStyle='rgba(230,245,245,.85)';cx.beginPath();cx.moveTo(c.x+d*c.r*0.5,c.y);cx.lineTo(c.x-d*c.r*0.15,c.y-c.r*0.4);cx.lineTo(c.x-d*c.r*0.15,c.y+c.r*0.4);cx.fill();};
 circleBtn(l.dodgeL,null,true,c=>arrow(c,-1),P.dodge>0&&P.dodgeSide<0);circleBtn(l.dodgeR,null,true,c=>arrow(c,1),P.dodge>0&&P.dodgeSide>0);
 circleBtn(l.block,null,P.blockDur>0,c=>{cx.fillStyle=P.blocking?'#bfe9ff':'#9cb7b9';cx.beginPath();cx.moveTo(c.x-c.r*.35,c.y-c.r*.45);cx.lineTo(c.x+c.r*.35,c.y-c.r*.45);cx.lineTo(c.x+c.r*.35,c.y);cx.lineTo(c.x,c.y+c.r*.5);cx.lineTo(c.x-c.r*.35,c.y);cx.fill();
  cx.fillStyle='#0b1416';cx.font='bold '+(c.r*0.5|0)+FS;cx.textAlign='center';cx.fillText(P.blockDur,c.x,c.y+c.r*0.12);},P.blocking);
 texts.forEach(t=>{const a=t.dmg?1-t.t/0.9:1-Math.max(0,t.t-0.7)/0.4;if(a<=0)return;cx.save();cx.globalAlpha=a;cx.textAlign='center';
  const sz=(t.dmg?18:30)*U*t.size*(t.dmg?1:1+0.25*Math.max(0,0.15-t.t)/0.15);cx.font='bold '+(sz|0)+FS;
  const y=t.dmg?(t.py?H*0.62:l.ey-140*l.es)-t.t*50:H*0.4;cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,.7)';cx.strokeText(t.s,W/2+(t.x||0),y);cx.fillStyle=t.col;cx.fillText(t.s,W/2+(t.x||0),y);cx.restore();});
 if(sub&&sub.t<4){cx.save();cx.globalAlpha=Math.min(1,sub.t*3,(4-sub.t));cx.textAlign='center';cx.font='italic '+(13*U|0)+FS;cx.fillStyle='rgba(0,0,0,.5)';const w=Math.min(W*0.9,cx.measureText(sub.s).width+30);cx.fillRect(W/2-w/2,l.block.y-l.block.r-44*U,w,24*U);cx.fillStyle='#e9e0c8';cx.fillText(sub.s,W/2,l.block.y-l.block.r-27*U);cx.restore();}}
function drawTrail(){if(trail.length<2)return;cx.save();cx.lineCap='round';cx.lineJoin='round';for(let i=1;i<trail.length;i++){const a=1-trail[i].t/0.25;if(a<=0)continue;cx.strokeStyle='rgba(220,250,255,'+a+')';cx.shadowColor='#8ff';cx.shadowBlur=12;cx.lineWidth=(2+i/trail.length*9)*a;cx.beginPath();cx.moveTo(trail[i-1].x,trail[i-1].y);cx.lineTo(trail[i].x,trail[i].y);cx.stroke();}cx.restore();}
function drawParts(dt){parts=parts.filter(p=>(p.t+=dt)<p.l);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.25;cx.fillStyle=p.col;cx.globalAlpha=1-p.t/p.l;cx.fillRect(p.x,p.y,3,3);});cx.globalAlpha=1;}

/* ---------- screens ---------- */
function wrap(s,x,y,maxW,lh){const w=s.split(' ');let line='';for(const word of w){const t=line?line+' '+word:word;if(cx.measureText(t).width>maxW&&line){cx.fillText(line,x,y);y+=lh;line=word;}else line=t;}cx.fillText(line,x,y);return y+lh;}
function bw(){return Math.min(W*0.7,260*U)}
function title(){drawWorld();cx.fillStyle='rgba(5,12,13,.45)';cx.fillRect(0,0,W,H);cx.textAlign='center';
 cx.fillStyle='#e9d9b8';cx.font='bold '+(46*U|0)+'px AshSerif,Lora,Georgia,serif';cx.shadowColor='#e07a2f';cx.shadowBlur=20;cx.fillText('ASHBORN',W/2,H*0.26);cx.shadowBlur=0;
 cx.fillStyle='#a9cfcc';cx.font='italic '+(18*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('The Last Vigil',W/2,H*0.26+30*U);
 const w=bw(),h=34*U,x=W/2-w/2;let y=H*0.42;const gap=h+8*U;
 if(hasSave||S.wins||S.deaths){button(x,y,w,h,'CONTINUE · Vigil '+S.vigil,()=>go('map'),{hi:1});y+=gap;}
 button(x,y,w,h,'NEW GAME',()=>{if((S.wins||S.deaths)&&!confirmNew){confirmNew=1;toast={s:'Tap NEW GAME again to erase your save',t:0};return;}S=freshSave();save();confirmNew=0;go('dialog');DLG.start([{title:'ASHBORN',sub:'THE LAST VIGIL'}].concat(INTRO.slice(1).map(t=>({narr:t}))),()=>go('map'),{style:DLSTYLE});},{hi:!(S.wins||S.deaths)});y+=gap;
 button(x,y,w,h,'CREDITS',()=>go('credits'));y+=gap;button(x,y,w,h,'SETTINGS',()=>{settingsFrom='title';go('settings');},{fs:12});
 cx.textAlign='center';cx.fillStyle='#7fa3a0';cx.font=(10*U|0)+'px '+FJ;cx.fillText('Part Two · The Quench   ·   Vigil '+S.vigil+' · Lv '+level()+' · '+S.wins+' victories',W/2,H*0.95);drawToast();}
let confirmNew=0;
function drawToast(){if(toast&&toast.t<2.5){cx.textAlign='center';cx.font=(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillStyle='#ffd27a';cx.fillText(toast.s,W/2,H*0.94);}}
function credits(){cx.fillStyle='#0b1416';cx.fillRect(0,0,W,H);cx.textAlign='center';cx.fillStyle='#e9d9b8';cx.font='bold '+(22*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('CREDITS',W/2,H*0.14);
 cx.fillStyle='#cfe';cx.font=(12*U|0)+'px AshSerif,Lora,Georgia,serif';let y=H*0.22;const lh=17*U;
 ['ASHBORN: The Last Vigil — a game by KeiCheong Mai. All art is procedural.',
 'Sound effects by Kenney (kenney.nl, CC0); Michel Baradari — "11 Male Human Pain/Death Sounds" (CC-BY 3.0); Virix — "Magic SFX Sample" (CC-BY 3.0); artisticdude — "Swishes Sound Pack" (CC0), via OpenGameArt.org.',
 'CC-BY 3.0: creativecommons.org/licenses/by/3.0/','Ambience generated in-app.','Tap to return.'].forEach(s=>{y=wrap(s,W/2,y,W*0.86,lh)+lh*0.6;});
 BTN.push({x:0,y:0,w:W,h:H,fn:()=>go('title')});}
function storyScr(){drawWorld();cx.fillStyle='rgba(4,10,11,.74)';cx.fillRect(0,0,W,H);cx.textAlign='center';
 if(storyTitle){cx.fillStyle='#e9d9b8';cx.font='bold '+(20*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText(storyTitle,W/2,H*0.2);cx.fillStyle='#a9cfcc';cx.font=(11*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('Vigil '+S.vigil+' · House Thorne',W/2,H*0.2+20*U);}
 const t=storyPages[storyI]||'';cx.globalAlpha=clamp(sceneT*2,0,1);cx.fillStyle='#dfecea';
 if(t==='ASHBORN'){cx.font='bold '+(40*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillStyle='#e9d9b8';cx.fillText('ASHBORN',W/2,H*0.5);}else{cx.font='italic '+(15*U|0)+'px AshSerif,Lora,Georgia,serif';wrap(t,W/2,H*0.42,Math.min(W*0.82,520*U),21*U);}
 cx.globalAlpha=1;cx.fillStyle='#7fa3a0';cx.font=(11*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText((storyI+1)+' / '+storyPages.length+'   ·   tap to continue',W/2,H*0.88);
 const w=70*U,h=26*U;button(W-w-10*U,10*U,w,h,'SKIP',()=>storyNext(),{fs:11});}
function medallion(def,mood,x,y,r,flip,col){cx.save();cx.beginPath();cx.arc(x,y,r,0,7);cx.fillStyle='rgba(6,12,14,.9)';cx.fill();cx.clip();
 if(def){const sz=32*Math.max(1,Math.round(r*2.4/32));PIX.draw(cx,def,mood,x-sz/2,y-sz*0.46,sz,flip);}cx.restore();cx.strokeStyle=col||'#b8935a';cx.lineWidth=2;cx.beginPath();cx.arc(x,y,r,0,7);cx.stroke();}
let mapPart=null;
function mapScr(){drawWorld();cx.fillStyle='rgba(4,10,11,.62)';cx.fillRect(0,0,W,H);const land=W>H,m=12*U;
 const ch=Math.min(S.ch,CHAPTERS.length-1),done=S.ch===CHAPTERS.length-1&&S.node>=PATH[ch].length,p2open=S.maxCh>=6;
 if(mapPart==null)mapPart=mapView>=6?2:1;if(mapPart===2&&!p2open)mapPart=1;
 const vch=Math.min(mapView,S.maxCh),C=CHAPTERS[vch];
 cx.textAlign='left';cx.fillStyle='#e9d9b8';cx.font='bold '+(17*U|0)+FS;cx.fillText('CHAPTER '+(vch+1)+' · '+C.name.toUpperCase(),m,m+18*U);
 cx.fillStyle='#a9cfcc';cx.font=(11*U|0)+FS;cx.fillText('Vigil '+S.vigil+'   ·   Lv '+level()+'   ·   '+S.gold.toLocaleString()+' gold   ·   '+(vch>=6?'Part Two — The Quench':'Part One — The Last Vigil'),m,m+34*U);
 // part tabs + chapter tabs
 const ptw=92*U,th=22*U;[['PART ONE',1,true],['PART TWO',2,p2open]].forEach(([t,pn,ok],i)=>{button(m+i*(ptw+5*U),m+42*U,ptw,th,t+(ok?'':' 🔒'),()=>{if(ok){mapPart=pn;const first=pn===2?6:0;mapView=Math.min(S.maxCh,Math.max(first,mapView>=first&&mapView<first+6?mapView:first));}},{fs:10,sel:mapPart===pn,dis:!ok});});
 const first=mapPart===2?6:0,tabs=CHAPTERS.slice(first,first+6).filter((c,i)=>first+i<=S.maxCh);const tw=Math.min(54*U,(W-2*m-2*(ptw+5*U)-6*U)/6-4);
 tabs.forEach((c,i)=>button(m+2*(ptw+5*U)+6*U+i*(tw+4),m+42*U,tw,th,'CH '+(first+i+1),()=>{mapView=first+i;},{fs:10,sel:first+i===mapView}));
 const nodes=PATH[vch];const y0=m+76*U,area=H-y0-60*U;const n=nodes.length;
 cx.strokeStyle='rgba(200,170,110,.5)';cx.lineWidth=3;cx.setLineDash([6,6]);cx.beginPath();
 const pos=i=>land?{x:m+50*U+(W-2*m-100*U)*i/Math.max(1,n-1),y:y0+area*0.45+Math.sin(i*1.7)*area*0.22}:{x:W/2+Math.sin(i*1.7)*W*0.28,y:y0+20*U+(area-40*U)*i/Math.max(1,n-1)};
 nodes.forEach((id,i)=>{const p=pos(i);i?cx.lineTo(p.x,p.y):cx.moveTo(p.x,p.y);});cx.stroke();cx.setLineDash([]);
 nodes.forEach((id,i)=>{const e=EN.find(z=>z.id===id),p=pos(i);const cleared=!!S.cleared[id],cur=vch===S.ch&&i===S.node,locked=!cleared&&!cur;const r=(e.boss?24:19)*U;
  if(cur){cx.save();cx.globalAlpha=0.35+0.25*Math.sin(T*4);cx.strokeStyle='#ffd27a';cx.lineWidth=3;cx.beginPath();cx.arc(p.x,p.y,r+6*U+2*Math.sin(T*4),0,7);cx.stroke();cx.restore();}
  const def=(typeof CHARS!=='undefined'&&CHARS[id])||null;
  if(locked){cx.fillStyle='rgba(20,24,26,.9)';cx.beginPath();cx.arc(p.x,p.y,r,0,7);cx.fill();cx.strokeStyle='#555';cx.lineWidth=2;cx.stroke();cx.fillStyle='#777';cx.font='bold '+(13*U|0)+FS;cx.textAlign='center';cx.fillText(e.boss?'☠':'?',p.x,p.y+5*U);}
  else medallion(def,cleared?'calm':(MOODQ[id]||'grim'),p.x,p.y,r,true,cur?'#ffd27a':cleared?'#9fd0c8':'#b8935a');
  if(e.boss&&!locked){cx.fillStyle='#ffd27a';cx.font='bold '+(11*U|0)+FS;cx.textAlign='center';cx.fillText('☠',p.x,p.y-r-4*U);}
  if(cleared){cx.fillStyle='#9fd0c8';cx.font='bold '+(10*U|0)+FS;cx.textAlign='center';cx.fillText('✓'+(S.cleared[id]>1?'×'+S.cleared[id]:''),p.x+r*0.75,p.y+r*0.9);}
  cx.font=(10*U|0)+FS;cx.fillStyle=locked?'#888':'#e9e0c8';cx.textAlign='center';cx.fillText(locked?'???':e.name,p.x,p.y+r+13*U);
  if(!locked)BTN.push({x:p.x-r,y:p.y-r,w:2*r,h:2*r,fn:()=>startNode(vch,i)});});
 const bh=34*U,bwid=(W-2*m-16*U)/4;const by=H-bh-m;
 button(m,by,bwid,bh,done?'REPLAY':'FIGHT',()=>{if(done)startNode(ch,PATH[ch].length-1);else startNode(S.ch,S.node);},{hi:1});
 button(m+(bwid+5*U),by,bwid,bh,'EQUIP',()=>go('inv'));button(m+2*(bwid+5*U),by,bwid,bh,'SHOP',()=>{shopSel=null;go('shop');});button(m+3*(bwid+5*U),by,bwid,bh,'MENU',()=>go('title'));
 if(done){cx.textAlign='center';cx.fillStyle='#ffd27a';cx.font='italic '+(12*U|0)+FS;cx.fillText('Part Two complete — '+(S.ending==='burn'?'the Kiln burns on.':'the Kiln is cold.')+' Replay any duel for gold and loot.',W/2,by-10*U);}
 else if(S.ch===6&&S.node===0&&!S.seenP2){cx.textAlign='center';cx.fillStyle='#ffd27a';cx.font='italic '+(12*U|0)+FS;cx.fillText('Part One complete. Part Two — The Quench — begins at the village.',W/2,by-10*U);}}
let mapView=S.ch;
function preScr(){drawWorld();drawEnemy();cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(0,0,W,H);const k=clamp(sceneT*2.5,0,1);
 const bw=Math.min(W*0.86,560*U),bh=Math.min(H*0.84,240*U),bx=(W-bw)/2,by=(H-bh)/2;cx.save();cx.globalAlpha=k;cx.translate(0,(1-k)*20*U);panel(bx,by,bw,bh);cx.fillStyle='#e07a2f';cx.fillRect(bx,by,bw,2*U);
 const ps=32*Math.max(2,Math.round(Math.min(bh*0.42,96*U)/32));const ed=typeof CHARS!=='undefined'?CHARS[ED.id]:null;
 if(typeof CHARS!=='undefined')PIX.draw(cx,CHARS.wren,'grim',bx+14*U,by+bh*0.47-ps*0.5,ps,false);
 if(ed)PIX.draw(cx,ed,MOODQ[ED.id]||'grim',bx+bw-14*U-ps,by+bh*0.47-ps*0.5,ps,true);
 cx.textAlign='center';cx.fillStyle='#e9d9b8';cx.font='bold '+(22*U|0)+FS;cx.fillText(ED.name.toUpperCase(),W/2,by+30*U);
 cx.fillStyle='#a9cfcc';cx.font=(10*U|0)+FS;cx.fillText(CHAPTERS[ED.ch].name+(ED.boss?' · BOSS':'')+' · '+ED.style.toUpperCase()+' · HP '+ED.hp,W/2,by+46*U);
 cx.fillStyle='#e07a2f';cx.font='bold italic '+(28*U|0)+FS;cx.fillText('vs',W/2,by+bh*0.5+10*U);
 cx.textAlign='left';cx.fillStyle='#e9d9b8';cx.font='bold '+(11*U|0)+FS;cx.fillText('WREN THORNE',bx+14*U,by+bh*0.47+ps*0.5+14*U);cx.font=(9*U|0)+FS;cx.fillStyle='#a9cfcc';cx.fillText('Lv '+level()+' · '+IT[S.eq.weapon].n+' · '+G.maxHp+' HP',bx+14*U,by+bh*0.47+ps*0.5+26*U);
 cx.textAlign='right';cx.fillStyle='#e9d9b8';cx.font='bold '+(11*U|0)+FS;cx.fillText(ED.name,bx+bw-14*U,by+bh*0.47+ps*0.5+14*U);cx.font=(9*U|0)+FS;cx.fillStyle='#a9cfcc';cx.fillText('POW ×'+ED.pow.toFixed(2)+' · '+ED.hp+' HP',bx+bw-14*U,by+bh*0.47+ps*0.5+26*U);
 cx.textAlign='center';cx.fillStyle='#7fa3a0';cx.font=(9.5*U|0)+FS;cx.fillText('Swipe to strike · swipe along the arrow to parry · DODGE red attacks · hold the shield to block',W/2,by+bh-24*U);
 if(sceneT>0.6){cx.fillStyle='rgba(255,210,122,'+(0.6+0.4*Math.sin(T*5))+')';cx.font='bold '+(12*U|0)+FS;cx.fillText('Tap to fight  ▶',W/2,by+bh-9*U);}cx.restore();}
function victory(){drawWorld();drawEnemy();drawPlayer();const a=sceneT<0.25?sceneT/0.25*0.6:sceneT<1.2?0.6:Math.max(0.5,0.6-(sceneT-1.2)*0.1);cx.fillStyle='rgba(255,255,255,'+(sceneT<0.9?0:a)+')';cx.fillRect(0,0,W,H);
 if(sceneT>0.9){cx.textAlign='center';const k=clamp((sceneT-0.9)/0.3,0,1);cx.save();cx.translate(W/2,H*0.44);cx.scale(1.3-0.3*k,1.3-0.3*k);cx.translate(-W/2,-H*0.44);
  const g=cx.createLinearGradient(0,H*0.38,0,H*0.48);g.addColorStop(0,'#fafafa');g.addColorStop(.5,'#9aa3a8');g.addColorStop(1,'#d9dfe2');cx.fillStyle=g;cx.strokeStyle='#5c666b';cx.lineWidth=2;cx.font='bold italic '+(48*U|0)+FS;cx.fillText('VICTORY',W/2,H*0.45);cx.strokeText('VICTORY',W/2,H*0.45);cx.restore();
  cx.fillStyle='#2a3a40';cx.font=(12*U|0)+FS;cx.fillText(ED.name.toUpperCase()+' FALLS',W/2,H*0.45+24*U);}
 if(sceneT>1.6){cx.textAlign='center';cx.fillStyle='#3a4a50';cx.font=(10.5*U|0)+FS;cx.fillText('Parries '+stats.parries+'   Perfect '+stats.perfect+'   Dodges '+stats.dodges+'   Counters '+stats.counters+'   Streak ×'+stats.streak+'   '+stats.t.toFixed(0)+' s',W/2,H*0.86);}
 if(sceneT>2.0){cx.fillStyle='rgba(60,70,80,'+(0.6+0.4*Math.sin(T*5))+')';cx.font=(13*U|0)+FS;cx.textAlign='center';cx.fillText('Tap to continue',W/2,H*0.93);}}
function watery(){const g=cx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);g.addColorStop(0,'#2b7bb0');g.addColorStop(1,'#08243a');cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.strokeStyle='rgba(160,220,255,.15)';cx.lineWidth=3;for(let i=0;i<9;i++){cx.beginPath();for(let a=0;a<6.3;a+=0.15){const r=30*U+i*28*U+Math.sin(a*3+T*1.5+i)*8*U;cx.lineTo(W/2+Math.cos(a+T*0.2*(i%2?1:-1))*r,H/2+Math.sin(a+T*0.2)*r*0.8);}cx.stroke();}}
function icon(it,x,y,r){cx.save();cx.translate(x,y);const s=r/40;cx.fillStyle=it.col;cx.strokeStyle='#e9d9b8';cx.lineWidth=2;
 if(it.s==='weapon'){cx.rotate(-0.8);cx.fillRect(-4*s,-38*s,8*s,58*s);cx.fillStyle='#e07a2f';cx.fillRect(-12*s,18*s,24*s,5*s);cx.fillRect(-3*s,22*s,6*s,14*s);}
 else if(it.s==='armour'){cx.beginPath();cx.moveTo(-28*s,-26*s);cx.lineTo(28*s,-26*s);cx.lineTo(20*s,30*s);cx.lineTo(-20*s,30*s);cx.closePath();cx.fill();cx.stroke();}
 else if(it.s==='shield'){cx.beginPath();cx.moveTo(-26*s,-30*s);cx.lineTo(26*s,-30*s);cx.lineTo(26*s,4*s);cx.lineTo(0,34*s);cx.lineTo(-26*s,4*s);cx.closePath();cx.fill();cx.stroke();}
 else if(it.s==='helm'){cx.beginPath();cx.arc(0,4*s,26*s,Math.PI,0);cx.lineTo(26*s,24*s);cx.lineTo(-26*s,24*s);cx.closePath();cx.fill();cx.stroke();cx.fillStyle='#000';cx.fillRect(-14*s,6*s,28*s,4*s);}
 else{cx.lineWidth=7*s;cx.strokeStyle=it.col;cx.beginPath();cx.arc(0,0,20*s,0,7);cx.stroke();cx.fillStyle='#fff';cx.beginPath();cx.arc(0,-20*s,6*s,0,7);cx.fill();}
 cx.restore();}
const STN={atk:'ATK',crit:'CRIT %',hp:'HP',def:'DEF %',blk:'BLOCK',mg:'MAGIC %',pw:'PARRY s',heal:'HEAL %',sp:'ASHFALL %'};
const statStr=it=>Object.entries(it.st).filter(([k,v])=>v).map(([k,v])=>STN[k]+' +'+v).join('  ')||'—';
function loot(){watery();const li=lootInfo;cx.textAlign='center';
 if(li.item){const it=IT[li.item];cx.save();cx.translate(0,Math.sin(T*2)*6*U);icon(it,W/2,H*0.4,46*U);cx.restore();cx.fillStyle='#fff';cx.font='bold '+(18*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText(it.n,W/2,H*0.62);
  cx.font=(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillStyle='#ffd27a';cx.fillText(SLOTN[it.s]+' · '+statStr(it),W/2,H*0.62+20*U);cx.fillStyle='#dde';cx.font='italic '+(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('“'+it.f+'”',W/2,H*0.62+38*U);}
 else{cx.fillStyle='#fff';cx.font='bold '+(18*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('No item this time',W/2,H*0.5);}
 cx.fillStyle='#fff';cx.font='bold '+(14*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('+ '+li.gold.toLocaleString()+' gold'+(li.first?'':'  (replay)'),W/2,H*0.8);cx.fillStyle='#bde';cx.font=(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('Tap to continue',W/2,H*0.92);}
function xp(){watery();cx.textAlign='left';const x=W*0.08;let y=H*0.14;cx.fillStyle='#fff';cx.font='bold '+(20*U|0)+FS;cx.fillText('EXPERIENCE',x,y);y+=26*U;cx.font=(12.5*U|0)+FS;
 if(typeof CHARS!=='undefined'&&W>H){PIX.draw(cx,CHARS.wren,lootInfo.lvUp?'smile':'calm',W*0.78,H*0.12,96*U,false);}
 [['Duel XP','+'+stats.xp],['Parries',stats.parries],['Perfect parries',stats.perfect],['Counters',stats.counters],['Dodges',stats.dodges],['Best combo',stats.maxCombo],['Longest parry streak',stats.streak],['Time',stats.t.toFixed(0)+' s']].forEach(([k,v])=>{cx.fillStyle='#bde';cx.fillText(k,x,y);cx.textAlign='right';cx.fillStyle='#fff';cx.fillText(v,W*0.7,y);cx.textAlign='left';y+=17*U;});
 y+=6*U;const f=(S.xp%900)/900;cx.fillStyle='#fff';cx.fillText('Wren — Level '+level()+(lootInfo.lvUp?'   ▲ LEVEL UP':''),x,y);y+=8*U;bar(x,y,W*0.62,10*U,f,lootInfo.lvUp?'#ffd27a':'#9fe3ff');y+=26*U;if(lootInfo.lvUp&&sceneT<0.05)hap('levelUp');
 SLOTS.slice(0,3).forEach(sl=>{const it=IT[S.eq[sl]];cx.fillStyle='#fff';cx.fillText(it.n,x,y);cx.fillStyle='#ffd27a';cx.textAlign='right';cx.fillText(statStr(it),W*0.7,y);cx.textAlign='left';y+=18*U;});
 cx.textAlign='center';cx.fillStyle='#bde';cx.fillText('Tap to continue',W/2,H*0.94);}
function post(){drawWorld();cx.fillStyle='rgba(4,10,11,.7)';cx.fillRect(0,0,W,H);cx.textAlign='center';
 if(typeof CHARS!=='undefined'&&CHARS[ED.id])PIX.draw(cx,CHARS[ED.id],'dead',W/2-48*U,H*0.08,96*U,true);
 cx.fillStyle='#e9d9b8';cx.font='bold '+(16*U|0)+FS;cx.fillText(ED.name.toUpperCase()+' FALLS',W/2,H*0.36);
 cx.fillStyle='#dfecea';cx.font='italic '+(15*U|0)+'px AshSerif,Lora,Georgia,serif';wrap(ED.post,W/2,H*0.48,W*0.82,20*U);cx.fillStyle='#7fa3a0';cx.font=(11*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('Tap to continue',W/2,H*0.88);}
function death(){drawWorld();drawEnemy();cx.fillStyle='rgba(0,0,0,'+Math.min(0.85,sceneT*0.6)+')';cx.fillRect(0,0,W,H);cx.textAlign='center';
 // dramatic fall: Wren's silhouette topples
 const f=Math.min(1,sceneT/1.1);cx.save();cx.translate(W*0.3,H+10);cx.rotate(-f*f*1.4);cx.globalAlpha=1-Math.max(0,sceneT-1.2)*0.6;cx.fillStyle='#200a08';cx.beginPath();cx.moveTo(-50,0);cx.quadraticCurveTo(-60,-110,-25,-150);cx.quadraticCurveTo(0,-175,25,-150);cx.quadraticCurveTo(60,-110,50,0);cx.fill();cx.restore();cx.globalAlpha=1;
 if(sceneT>0.8){cx.globalAlpha=clamp(sceneT-0.8,0,1);cx.fillStyle='#cfdcdb';cx.font='italic '+(15*U|0)+'px AshSerif,Lora,Georgia,serif';wrap('Wren falls into the tide. The ash on the shore stirs.',W/2,H*0.34,W*0.86,20*U);
  cx.fillStyle='#e9d9b8';cx.shadowColor='#e07a2f';cx.shadowBlur=24;cx.font='bold '+(40*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('VIGIL '+S.vigil,W/2,H*0.5);cx.shadowBlur=0;
  cx.fillStyle='#a9cfcc';cx.font=(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('Gear, gold and level are kept. It’s in the blood.',W/2,H*0.56);
  cx.font='italic '+(14*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText(CASS[Math.min(CASS.length-1,Math.floor(S.deaths/3))],W/2,H*0.63);cx.globalAlpha=1;}
 if(sceneT>2.5){cx.fillStyle='#7fa3a0';cx.font=(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('Tap to rise',W/2,H*0.86);}}
function pauseScr(){drawWorld();drawEnemy();drawPlayer();cx.fillStyle='rgba(0,0,0,.6)';cx.fillRect(0,0,W,H);cx.textAlign='center';cx.fillStyle='#e9d9b8';cx.font='bold '+(26*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('PAUSED',W/2,H*0.3);
 const w=bw(),h=34*U;button(W/2-w/2,H*0.42,w,h,'RESUME',()=>{scene='fight';sceneT=2;BTN=[];},{hi:1});button(W/2-w/2,H*0.42+h+8*U,w,h,'SETTINGS',()=>{settingsFrom='pause';go('settings');});button(W/2-w/2,H*0.42+2*(h+8*U),w,h,'RETREAT TO MAP',()=>go('map'));
 cx.fillStyle='#a9cfcc';cx.font=(9.5*U|0)+FS;cx.textAlign='center';cx.fillText('Swipe = strike / parry along the arrow · ◀ ▶ dodge · hold the shield to block · Emberbrand · Ashfall',W/2,H*0.92);}
let resetArmed=false;
function settingsScr(){drawWorld();cx.fillStyle='rgba(4,10,11,.8)';cx.fillRect(0,0,W,H);const m=14*U;cx.textAlign='left';cx.fillStyle='#e9d9b8';cx.font='bold '+(18*U|0)+FS;cx.fillText('SETTINGS',m,m+20*U);
 const rows=[['Haptics'+(HAP.native?' (native'+(HAP.amp?', amplitude)':')'):' (web)'),[['Off',0],['Light',1],['Normal',2],['Strong',3]],S.set.hap,v=>{S.set.hap=v;HAP.set({on:v>0,strength:[0,0.6,1,1.4][v]});save();hap('parryPerfect');}],
  ['Sound',[['Off',0],['Low',0.4],['Mid',0.7],['Full',1]],S.set.vol,v=>{audioInit();setVol(v);bell(440,0.1);}],
  ['Parry timing ring',[['On',1],['Off',0]],S.set.ring,v=>{S.set.ring=v;save();}],
  ['Slow-motion on perfect parry',[['On',1],['Off',0]],S.set.slow,v=>{S.set.slow=v;save();}],
  ['Effects quality ('+(window.LITE?'lite':'full')+' · '+Math.round(PERF.fps)+' fps)',[['Auto','auto'],['Full','full'],['Lite','lite']],S.set.fx||'auto',v=>{S.set.fx=v;setQuality(v);save();}]];
 let y=m+40*U;const lx=m,bx0=W*0.42,bwid=Math.min(70*U,(W*0.56-m)/4-4*U),bh=24*U;
 rows.forEach(([label,opts,cur,fn])=>{cx.fillStyle='#dfecea';cx.font='bold '+(12*U|0)+FS;cx.textAlign='left';cx.fillText(label,lx,y+16*U);opts.forEach(([t,v],i)=>button(bx0+i*(bwid+4*U),y,bwid,bh,t,()=>fn(v),{fs:10.5,sel:typeof v==='string'?cur===v:Math.abs(cur-v)<0.01}));y+=bh+10*U;});
 cx.fillStyle='#a9cfcc';cx.font=(10*U|0)+FS;cx.textAlign='left';cx.fillText('Record: Vigil '+S.vigil+' · Lv '+level()+' · '+S.gold.toLocaleString()+' gold · '+S.wins+' wins · parries '+S.tot.parries+' (perfect '+S.tot.perfect+') · counters '+S.tot.counters+' · dodges '+S.tot.dodges,lx,y+14*U);y+=14*U;
 cx.fillStyle='#7fa3a0';cx.font=(8.5*U|0)+FS;cx.fillText(('diag: '+navigator.userAgent.slice(0,70)+' · errors '+window.__ERR.length+(window.__ERR.length?' · '+window.__ERR[window.__ERR.length-1].slice(0,60):'')),lx,y+12*U);y+=16*U;
 button(bx0,y,bwid*2+4*U,bh,resetArmed?'TAP AGAIN TO ERASE':'Erase all progress',()=>{if(!resetArmed){resetArmed=true;hap('warn');return;}localStorage.removeItem(SKEY);location.reload();},{fs:10.5,col:'#ff9a8a'});
 cx.fillStyle='#dfecea';cx.font='bold '+(12*U|0)+FS;cx.fillText('Reset',lx,y+16*U);
 button(W-110*U-m,H-34*U-m,110*U,34*U,'BACK',()=>{resetArmed=false;go(settingsFrom==='pause'?'pause':settingsFrom);},{hi:1});
 if(HAP.avail)button(W-230*U-m,H-34*U-m,110*U,34*U,'TEST HAPTICS',()=>{hap('parryPerfect');setTimeout(()=>hap('hurt'),400);setTimeout(()=>hap('victory'),900);},{fs:11});}
function endingScr(){watery();const lines=(typeof EPILOGUE2!=='undefined'?EPILOGUE2[endingKey||'quench']:null)||['— End —'];cx.textAlign='center';cx.fillStyle='#e9d9b8';cx.font='bold '+(24*U|0)+FS;cx.fillText(endingKey==='burn'?'THE THIRTY-THIRD VIGIL':'THE LAST VIGIL',W/2,H*0.14);
 cx.strokeStyle='#b8935a';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(W/2-100*U,H*0.14+12*U);cx.lineTo(W/2+100*U,H*0.14+12*U);cx.stroke();
 cx.font='italic '+(13*U|0)+FS;cx.fillStyle='#dfecea';let y=H*0.28;lines.forEach((t,i)=>{cx.globalAlpha=clamp(sceneT*0.8-i*0.8,0,1);y=wrap(t,W/2,y,W*0.8,18*U)+10*U;});cx.globalAlpha=1;
 if(sceneT>3){cx.fillStyle='#7fa3a0';cx.font=(11*U|0)+FS;cx.fillText('Thank you for playing. Every duel stays open for rematches. Tap to return.',W/2,H*0.93);}}
function gearLayout(){const land=W>H,m=12*U;return land?{st:{x:m,y:m+40*U,w:W*0.3,h:H-m*2-90*U},gr:{x:W*0.3+2*m,y:m+76*U,w:W*0.7-3*m,h:H-m*2-130*U},cols:3}:{st:{x:m,y:m+40*U,w:W-2*m,h:118*U},gr:{x:m,y:m+196*U,w:W-2*m,h:H-m*2-250*U},cols:2};}
function statsPanel(r){panel(r.x,r.y,r.w,r.h);const g=gearStats();cx.textAlign='left';cx.font='bold '+(13*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillStyle='#e9d9b8';cx.fillText('WREN THORNE · Lv '+level(),r.x+10*U,r.y+20*U);
 cx.font=(11*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillStyle='#dfecea';const rows=[['HP',g.maxHp],['ATK',Math.round(g.atk)],['DEF',g.def+'%'],['BLOCKS',g.blockMax],['CRIT',g.crit+'%'],['MAGIC',(g.mg?'+':'')+g.mg+'%'],['PARRY',(0.6+g.pw).toFixed(2)+'s'],['ASHFALL',(g.sp?'+':'')+(g.sp||0)+'%'],['HEAL',(g.heal||0)+'%'],['GOLD',S.gold.toLocaleString()]];
 if(W>H&&typeof CHARS!=='undefined'&&r.h>220*U){PIX.draw(cx,CHARS.wren,'calm',r.x+r.w/2-32*U,r.y+r.h-74*U,64*U,false);}
 const two=W<=H;rows.forEach(([k,v],i)=>{const cxx=two?r.x+10*U+(i%5)*(r.w-20*U)/5:r.x+10*U,cyy=two?r.y+40*U+Math.floor(i/5)*36*U:r.y+42*U+i*15*U;cx.fillStyle='#8fb3ae';cx.fillText(k,cxx,cyy);cx.fillStyle='#fff';cx.fillText(''+v,two?cxx:r.x+r.w*0.55,two?cyy+15*U:cyy);});}
function slotTabs(y,x0,w){const tw=w/5;SLOTS.forEach((sl,i)=>button(x0+i*tw+1,y,tw-2,26*U,SLOTN[sl],()=>{invSlot=sl;shopSel=null;invScroll=0;},{fs:9.5,sel:invSlot===sl}));}
const STARTERS=['w_tide','a_coat','s_none','h_none','r_none'];
function rarity(it){if(STARTERS.includes(it.id))return '#6a6a6a';if(it.p>=8000)return '#ffd27a';if(it.p>=4000)return '#8ab4ff';if(it.p>0)return '#9fd0c8';return '#e07a2f';}
function cmpDeltas(it){const eq=IT[S.eq[it.s]]||{st:{}};const keys=new Set([...Object.keys(it.st),...Object.keys(eq.st)]);const out=[];keys.forEach(k=>{const d=(it.st[k]||0)-(eq.st[k]||0);if(Math.abs(d)>0.0001)out.push([k,d]);});return out;}
function itemGrid(gr,cols,items,onTap,isSel,extra){const cw=(gr.w-(cols-1)*6*U)/cols,chh=60*U;const sc=Math.max(0,invScroll||0);items.forEach((it,i)=>{const x=gr.x+(i%cols)*(cw+6*U),y=gr.y+Math.floor(i/cols)*(chh+6*U)-sc;if(y+chh>gr.y+gr.h+20*U||y<gr.y-chh)return;
  button(x,y,cw,chh,'',()=>onTap(it),{sel:isSel(it)});cx.fillStyle=rarity(it);cx.fillRect(x+1,y+1,3*U,chh-2);icon(it,x+26*U,y+chh/2-4*U,17*U);cx.textAlign='left';cx.fillStyle='#fff';cx.font='bold '+(11*U|0)+FS;cx.fillText(it.n,x+48*U,y+18*U,cw-52*U);
  cx.font=(9.5*U|0)+FS;cx.fillStyle='#ffd27a';cx.fillText(statStr(it),x+48*U,y+32*U,cw-52*U);
  if(S.eq[it.s]!==it.id){let dx=x+48*U;const ds=cmpDeltas(it).slice(0,4);cx.font=(9*U|0)+FS;ds.forEach(([k,d])=>{const t=(d>0?'+':'')+(k==='pw'?d.toFixed(2):Math.round(d))+' '+(STN[k]||k)+'  ';cx.fillStyle=d>0?'#9fe3a0':'#ff9a8a';cx.fillText(t,dx,y+44*U);dx+=cx.measureText(t).width;});}
  if(extra){cx.fillStyle='#bde';cx.font=(9.5*U|0)+FS;cx.fillText(extra(it),x+48*U,y+56*U,cw-52*U);}});
 const rows=Math.ceil(items.length/cols),total=rows*(chh+6*U);invMax=Math.max(0,total-gr.h);
 if(invMax>0){cx.fillStyle='rgba(255,255,255,.15)';cx.fillRect(gr.x+gr.w+2*U,gr.y,3*U,gr.h);cx.fillStyle='#b8935a';cx.fillRect(gr.x+gr.w+2*U,gr.y+gr.h*sc/(total),3*U,gr.h*gr.h/total);}}
let invScroll=0,invMax=0;
function invScr(){drawWorld();cx.fillStyle='rgba(4,10,11,.78)';cx.fillRect(0,0,W,H);const m=12*U,lay=gearLayout();
 cx.textAlign='left';cx.fillStyle='#e9d9b8';cx.font='bold '+(18*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('EQUIPMENT',m,m+20*U);statsPanel(lay.st);
 slotTabs(lay.gr.y-34*U,lay.gr.x,lay.gr.w);
 const items=S.inv.map(id=>IT[id]).filter(it=>it.s===invSlot);
 itemGrid(lay.gr,lay.cols,items,it=>{S.eq[it.s]=it.id;save();play('block',0.5,1.4);},it=>S.eq[it.s]===it.id,it=>S.eq[it.s]===it.id?'EQUIPPED':'tap to equip');
 const eq=IT[S.eq[invSlot]];cx.fillStyle='#a9cfcc';cx.font='italic '+(11*U|0)+'px AshSerif,Lora,Georgia,serif';cx.textAlign='left';cx.fillText('“'+eq.f+'”',lay.gr.x,H-m-44*U,lay.gr.w);
 const w=110*U;button(W-w-m,H-34*U-m,w,34*U,'BACK',()=>go('map'),{hi:1});button(W-2*w-2*m,H-34*U-m,w,34*U,'SHOP',()=>{shopSel=null;go('shop')});}
function shopScr(){drawWorld();cx.fillStyle='rgba(4,10,11,.78)';cx.fillRect(0,0,W,H);const m=12*U,lay=gearLayout();
 cx.textAlign='left';cx.fillStyle='#e9d9b8';cx.font='bold '+(18*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('CASS’S STALL',m,m+20*U);statsPanel(lay.st);slotTabs(lay.gr.y-34*U,lay.gr.x,lay.gr.w);
 const items=ITEMS.filter(it=>it.s===invSlot&&it.p>0&&(it.ch||0)<=S.maxCh&&!S.inv.includes(it.id));
 if(!items.length){cx.fillStyle='#a9cfcc';cx.font='italic '+(12*U|0)+'px AshSerif,Lora,Georgia,serif';cx.fillText('Nothing new for this slot. Push further up the Spire.',lay.gr.x,lay.gr.y+20*U);}
 itemGrid(lay.gr,lay.cols,items,it=>{shopSel=it.id;},it=>shopSel===it.id,it=>it.p.toLocaleString()+' gold'+(S.gold<it.p?' (need more)':''));
 const w=110*U;button(W-w-m,H-34*U-m,w,34*U,'BACK',()=>go('map'),{hi:1});
 if(shopSel){const it=IT[shopSel],ok=S.gold>=it.p;button(W-2*w-2*m,H-34*U-m,w,34*U,ok?'BUY':'TOO DEAR',()=>{if(!ok)return;S.gold-=it.p;S.inv.push(it.id);S.eq[it.s]=it.id;shopSel=null;save();play('perfect',0.6);toast={s:'Bought and equipped: '+it.n,t:0};},{dis:!ok,hi:ok});}
 drawToast();}

/* ---------- loop ---------- */
let last=performance.now();
function musicScene(){const n=scene==='fight'||scene==='pause'?(ED&&ED.boss?'boss':'duel'):scene==='death'?'death':scene==='victory'||scene==='loot'||scene==='xp'||scene==='post'?'victory':scene==='title'||scene==='credits'?'title':'map';MUSIC.play(n);}
let lastRaw=performance.now();window.onLiteSwitch=function(){toast={s:'Lite effects on (phone was below 35 fps) — see Settings',t:0};S.set.fx='lite';save();};
function frame(now){try{frameBody(now);}catch(e){try{reportError(e);}catch(x){}}requestAnimationFrame(frame);}
function frameBody(now){const rdt=Math.min(0.05,(now-last)/1000);last=now;T+=rdt;sceneT+=rdt;if(toast)toast.t+=rdt;if(sub)sub.t+=rdt;try{perfTick((now-lastRaw)/1000,scene==='fight');}catch(e){}lastRaw=now;try{if(AC)musicScene();MUSIC.update(rdt);}catch(e){}
 const ts=scene==='fight'?FX.timeScale(rdt):1,dt=rdt*ts;FX.update(rdt);if(scene==='dialog')DLG.update(rdt);
 trail=trail||[];trail.forEach(t=>t.t+=rdt);trail=trail.filter(t=>t.t<0.25);etrail&&etrail.forEach(t=>t.t+=rdt);etrail=(etrail||[]).filter(t=>t.t<0.35);texts&&(texts.forEach(t=>t.t+=rdt),texts=texts.filter(t=>t.t<1.2));
 if(E&&E.miss>0)E.miss=Math.max(0,E.miss-rdt);
 BTN=[];cx.save();
 if(scene==='fight'){stats.t+=dt;if(sceneT>1)enemyUpdate(dt);P.dodge=Math.max(0,P.dodge-dt);P.swing=Math.max(0,P.swing-dt*4);P.hurt=Math.max(0,P.hurt-dt*3);P.kb=Math.max(0,P.kb-dt*3);
  if(!P.blocking){P.blockRegen+=dt;if(P.blockRegen>5&&P.blockDur<P.blockMax){P.blockDur++;P.blockRegen=0;hap('tick');}}else P.blockRegen=0;
  if(P.hp>0&&P.hp<P.max*0.22){P.lowT+=rdt;if(P.lowT>1.1){P.lowT=0;hap('heartbeat',0.6);}}
  shake=Math.max(0,shake-rdt*40);if(shake)cx.translate(rnd(-shake,shake),rnd(-shake,shake));FX.applyZoom(cx);
  drawWorld();drawEnemy();drawPlayer();drawParts(rdt);drawTrail();FX.draw(cx,U,font);cx.restore();cx.save();
  if(ts<1&&ts>0){cx.fillStyle='rgba(255,255,255,.05)';cx.fillRect(0,0,W,H);cx.fillStyle='rgba(0,0,0,.4)';cx.fillRect(0,0,W,8*U);cx.fillRect(0,H-8*U,W,8*U);}
  drawHUD();
  if(flash>0){cx.fillStyle='rgba(255,'+(P.hurt>0?60:255)+','+(P.hurt>0?40:255)+','+flash+')';cx.fillRect(0,0,W,H);flash=Math.max(0,flash-rdt);}
  const low=P.hp>0&&P.hp<P.max*0.22?0.25+0.2*Math.sin(T*5):0;
  const v=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,low?'rgba(110,10,10,'+(0.6+low)+')':'rgba(2,10,12,.6)');cx.fillStyle=v;cx.fillRect(0,0,W,H);}
 else{if(E&&E.state==='dead')enemyUpdate(rdt);if(P){P.kb=Math.max(0,P.kb-rdt*3);}
  ({title,credits,story:storyScr,map:mapScr,pre:preScr,victory:()=>{FX.applyZoom(cx);drawParts(rdt);victory();FX.draw(cx,U,font);},loot,xp,post,death,pause:pauseScr,inv:invScr,shop:shopScr,settings:settingsScr,ending:endingScr,
    dialog:()=>{drawWorld();if(ED&&(scene==='dialog')&&curNode)drawEnemy();DLG.draw(cx,W,H,U);}})[scene]();}
 cx.restore();if(scene==='fight'&&toast&&toast.t<2.5)drawToast();}
requestAnimationFrame(frame);
window.__ash={get scene(){return scene},get P(){return P},get E(){return E},get S(){return S},get stats(){return stats},swipe:d=>playerSwipe(d),L,go,startNode,tap,get BTN(){return BTN},EN,ITEMS,setInv:s=>invSlot=s};
