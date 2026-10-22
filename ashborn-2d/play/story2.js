'use strict';
/* ============================================================================
   ASHBORN — Part Two: THE QUENCH. New themes, enemies, chapters, gear, drops
   and every dialogue scene (Part One's fight intros are staged too). Loaded after game.js.
   ========================================================================== */
Object.assign(THEME,{
 village:{sky:['#2a2420','#5a4a3a','#3a2e28','#120c0a'],floor:['#4a4038','#120e0c'],glow:'255,180,90',arch:'60,48,40',arch2:'20,16,14',fog:'180,150,120',water:0,scene:'village'},
 loft:{sky:['#1a1626','#3a3050','#2a2238','#0c0a12'],floor:['#4a4452','#120e14'],glow:'200,190,255',arch:'70,60,90',arch2:'24,20,34',fog:'160,150,200',water:0,scene:'loft'},
 marsh:{sky:['#1a2a1c','#3a5a3a','#2a3e2a','#0a140a'],floor:['#2a4a3a','#06100a'],glow:'160,255,140',arch:'40,70,44',arch2:'12,26,14',fog:'120,180,120',water:1,scene:'marsh'},
 wreck:{sky:['#1a2430','#3a4a60','#2a3444','#080c12'],floor:['#2a3a44','#06080c'],glow:'140,200,255',arch:'50,60,70',arch2:'14,18,24',fog:'130,160,190',water:1,scene:'wreck'},
 dune:{sky:['#8a8070','#c8b898','#a89880','#3a3028'],floor:['#b8a888','#3a3028'],glow:'255,240,200',arch:'120,110,90',arch2:'60,52,40',fog:'220,210,190',water:0,scene:'dune'},
 quench:{sky:['#07090c','#102030','#0c1620','#020304'],floor:['#142a3c','#020405'],glow:'120,200,255',arch:'30,60,80',arch2:'8,16,24',fog:'120,200,255',water:0,circuit:1,scene:'quench'},
});
const CHAPTERS2=[
 {id:6,name:'The Lamplighter’s Village',theme:'village',part:2,
  intro:['Low tide, and a woman walking back along the causeway. No Thorne has ever walked back.',
   'The village watches from doorways. Someone drops a bucket. Nobody comes down to the water.'],
  end:['Thirty-Three lies in the ash it was printed from, and this time the ash does not stir.',
   'Cass hands her the lantern glass. Three bars of a song, scratched into it with a nail, forty years ago, by a girl who had his eyes.']},
 {id:7,name:'The Choir Loft',theme:'loft',part:2,
  intro:['Midnight. The bells of the drowned cathedral ring the hour, and under the hour, very faintly, a woman’s voice hums.',
   'The ringers’ guild has kept the loft for nine centuries. They have never once looked down at who the bells were calling.'],
  end:['Brother Ansel sits down on the bell-rope and laughs until he coughs. “Four bars,” he says. “Tuned into the tenor since before my grandfather. Take it. Take it and stop the thing.”']},
 {id:8,name:'The Saltmarsh Hermitage',theme:'marsh',part:2,
  intro:['East of the village the ground stops being ground. Reeds, fog, and lights that are not lanterns.',
   'A hermit lives out here who knew the Kiln from the inside. Nobody has seen him in twenty years. The marsh has.'],
  end:['The mother of the mire goes back under with a sound like a sigh. Bram Saltlow wades out of the reeds with a lantern and a fifth bar and a direction: north, past the wreck, to the dune where the first of her is buried.']},
 {id:9,name:'The Wreck of the Sister Verity',theme:'wreck',part:2,
  intro:['The ship that brought the Kiln-wright’s forge across the sea lies broken on the northern rocks. Its bell still rings in storms.',
   'The captain never gave up the watch. He is still on the quarterdeck, and he still answers to her name.'],
  end:['Captain Verity salutes her with a hand that is mostly barnacle. “Bar six, in the bell. She rang it every night of the crossing. I never knew why.”']},
 {id:10,name:'The Dune of the First Thorne',theme:'dune',part:2,
  intro:['Dunes to the horizon under a sky the colour of a knife. One grave, nine hundred years old. The stone says ISOLDE THORNE, KILN-WRIGHT, and nothing else.',
   'The grave is empty. She has always known it would be.'],
  end:['Isolde Thorne, the first of thirty-three, puts a hand on her own face and says: “The eighth bar is not written anywhere. It is the note you make when you decide to stop. He never could. I never could. Perhaps you are the one who can.”']},
 {id:11,name:'The Quench',theme:'quench',part:2,
  intro:['Under the Spire the metal is cooling for the first time in nine hundred years. The walls have gone from ember to blue.',
   'Aurec is waiting on the steps of his throne. He has been waiting, she understands now, for her to come back with the song.'],
  end:['It is quiet under the Spire. The bells above have stopped. The sea goes out, and for the first time, nothing walks back in on it.']},
];
/* ---------- enemies (22) ---------- */
const EN2=[
 // ch6 village
 {id:'watcher',ch:6,name:'Vigil-Watcher Hale',style:'swordshield',hp:2600,pow:2.2,spd:0.8,look:{m:'#6a7a7c',c:'#3a4a4c',e:'255,200,120',helm:'great',sh:'kite',w:'sword',sz:1.05},pre:'“A Thorne that walks back is a print gone wrong. Stand still, girl. I’ll make it quick.”',mid:'“You fight like her. Like all of them.”',post:'He drops the shield and sits in the road and does not get up for a long time.'},
 {id:'tithe',ch:6,name:'Tithe-Collector',style:'mace',hp:2900,pow:2.3,spd:0.78,look:{m:'#5a4a3a',c:'#33261c',e:'255,170,80',helm:'great',sh:'round',w:'mace',sz:1.1},pre:'“The Spire’s tenth. Grain, oil, and one Thorne a generation. You are overdue.”',mid:'“The ledger does not care who you are.”',post:'His ledger goes into the harbour. The tide takes it out without a sound.'},
 {id:'thirtythree',ch:6,name:'Thirty-Three',style:'mirror',hp:3400,pow:2.4,spd:0.76,boss:1,look:{m:'#b8b0a8',c:'#2a2a2a',e:'255,255,255',helm:'none',sh:0,w:'sword',sz:1.0,ghost:1},pre:'It has her face and none of her words. The Kiln printed it the night the bells rang, and it has been looking for her ever since.',mid:'It screams in a voice she recognises as her own, from before.',post:'It stops moving with its hand on her boot, and the ash does not stir.'},
 // ch7 loft
 {id:'bellwarden',ch:7,name:'Bell-Warden',style:'flail',hp:3000,pow:2.4,spd:0.8,look:{m:'#4a3f46',c:'#2b2028',e:'255,200,120',helm:'hood',sh:0,w:'flail',sz:1.0},pre:'“The loft is for ringers. Down the stairs, print.”',mid:'He rings in time with his own swings.',post:'The bells ring on without him. They always do.'},
 {id:'choirknight',ch:7,name:'Choir Knight',style:'halberd',hp:3300,pow:2.5,spd:0.78,look:{m:'#6a5e62',c:'#3a1e2a',e:'255,210,140',helm:'crest',sh:0,w:'halberd',sz:1.1},pre:'“Silence in the loft. The tenor is tuning.”',mid:'“She hums louder when you bleed. Did you know?”',post:'His halberd rings once against the bell and the whole loft shivers.'},
 {id:'ringingghost',ch:7,name:'The Ringing Ghost',style:'mirror',hp:3500,pow:2.55,spd:0.76,look:{m:'#9aa4b0',c:'#3a3e52',e:'140,176,255',helm:'hood',sh:0,w:'sword',sz:1.0,ghost:1},pre:'A Choir Master who died at the rope and was printed back by mistake. He has been ringing the wrong hour for a century.',mid:'“Wrong hour. Wrong hour. Wrong—”',post:'The bells find the right hour. He goes with it.'},
 {id:'ansel',ch:7,name:'Brother Ansel',style:'greatsword',hp:4000,pow:2.7,spd:0.75,boss:1,look:{m:'#6b6a66',c:'#3a1e2a',e:'255,180,100',helm:'great',sh:0,w:'greatsword',sz:1.15},pre:'“Sallow was my friend. He said you were kind. He said it like a warning.”',mid:'“Four bars in the tenor. Take them from me if you can hold a sword that long.”',post:'“Take it. Take it and stop the thing.”'},
 // ch8 marsh
 {id:'wight',ch:8,name:'Marsh Wight',style:'claws',hp:3400,pow:2.6,spd:0.78,look:{m:'#8a9a7a',c:'#2a3a28',e:'200,255,120',helm:'none',sh:0,w:'claws',sz:1.0,beast:1},pre:'Something that was a pilgrim once. The marsh has been feeding it for years.',mid:'It makes a sound like reeds in wind.',post:'It folds back into the fog.'},
 {id:'reedcutter',ch:8,name:'Reed Cutter',style:'scythe',hp:3700,pow:2.65,spd:0.77,look:{m:'#4a5a3a',c:'#3e5a3a',e:'200,255,160',helm:'hood',sh:0,w:'scythe',sz:1.05},pre:'“The hermit pays in salt. The marsh pays in silence. You pay in blood.”',mid:'“Low. Low. Low. She always went low.”',post:'The scythe sinks blade-first into the mud and stands there like a marker.'},
 {id:'lanterneel',ch:8,name:'The Lantern-Eel',style:'spear',hp:4000,pow:2.7,spd:0.8,look:{m:'#3a5a56',c:'#1a2a28',e:'120,255,220',helm:'none',sh:0,w:'spear',sz:1.2,beast:1,barn:1},pre:'The lights in the marsh are not lanterns. They are lures.',mid:'Its jaw unhinges with a click.',post:'The lights go out one by one across the marsh.'},
 {id:'miremother',ch:8,name:'Mother of the Mire',style:'hammer',hp:4600,pow:2.85,spd:0.74,boss:1,look:{m:'#4c5a44',c:'#2a3424',e:'200,255,120',helm:'none',sh:0,w:'hammer',sz:1.4,beast:1,barn:1},pre:'The thing the Mire Priest served. It has eaten every Thorne who went east instead of across.',mid:'The marsh shakes. Dodge the red, and keep dodging.',post:'It goes back under with a sound like a sigh.'},
 // ch9 wreck
 {id:'marauder',ch:9,name:'Wreck Marauder',style:'twinaxe',hp:3900,pow:2.75,spd:0.78,look:{m:'#4a5a6a',c:'#2a3a44',e:'180,220,255',helm:'horned',sh:0,w:'twinaxe',sz:1.05},pre:'“Salvage rights. Everything on the rocks is ours. Including you.”',mid:'He laughs with salt in it.',post:'The rocks keep him.'},
 {id:'boatswain',ch:9,name:'Drowned Boatswain',style:'flail',hp:4200,pow:2.8,spd:0.77,look:{m:'#3c4a48',c:'#2a3a44',e:'150,220,210',helm:'hood',sh:0,w:'flail',sz:1.05,barn:1},pre:'“All hands. All hands. The captain says all hands.”',mid:'He pipes an order nobody has heard in nine hundred years.',post:'The whistle rolls across the deck and over the side.'},
 {id:'figurehead',ch:9,name:'The Figurehead',style:'fists',hp:4500,pow:2.9,spd:0.74,look:{m:'#a89880',c:'#6a5a40',e:'255,208,144',helm:'none',sh:0,w:'fists',sz:1.3,golem:1},pre:'The Sister Verity’s figurehead has her face. It was carved from a drawing, nine hundred years ago, by a man who missed her.',mid:'Oak groans. It is trying to speak.',post:'It settles back against the prow and looks out to sea.'},
 {id:'verity',ch:9,name:'Captain Verity',style:'swordshield',hp:5000,pow:3.0,spd:0.76,boss:1,look:{m:'#4a6a7a',c:'#2a3a44',e:'140,200,255',helm:'crest',sh:'kite',w:'sword',sz:1.12,ghost:1,barn:1},pre:'“Passenger Thorne. You are late aboard. Nine hundred years late.”',mid:'“Better. She was better on the left, too.”',post:'“Bar six. In the bell. I never knew why.”'},
 // ch10 dune
 {id:'sandsentinel',ch:10,name:'Sand Sentinel',style:'hammer',hp:4600,pow:2.9,spd:0.76,look:{m:'#b8a888',c:'#5a5040',e:'255,240,192',helm:'none',sh:0,w:'hammer',sz:1.35,golem:1},pre:'The first Kiln-print that was not a woman. She made it to guard the grave she knew would be empty.',mid:'Sand pours from the cracks. It does not slow down.',post:'It kneels by the grave and becomes a second stone.'},
 {id:'thirtyone',ch:10,name:'The Thirty-One',style:'claws',hp:5200,pow:3.05,spd:0.74,look:{m:'#9a9a9a',c:'#3a3a3a',e:'255,255,255',helm:'none',sh:0,w:'claws',sz:1.25,beast:1,ghost:1},pre:'Every Thorne the Kiln failed to finish, printed into one. It has thirty-one mouths and one name.',mid:'It says the name in thirty-one voices.',post:'Thirty-one voices stop, one at a time, and the last one is laughing.'},
 {id:'isolde',ch:10,name:'Isolde Thorne, the First',style:'mirror',hp:5800,pow:3.1,spd:0.72,boss:1,look:{m:'#c8c0b4',c:'#5a4a40',e:'255,240,200',helm:'none',sh:0,w:'embersword',sz:1.0,ghost:1},pre:'“Hello, Wren. I’m sorry. I needed hands, and I only ever had the one pair to copy.”',mid:'“Good. You are better than I was. I made sure of it, every time.”',post:'“The eighth bar is the note you make when you decide to stop.”'},
 // ch11 quench
 {id:'golem2',ch:11,name:'Kiln Golem II',style:'fists',hp:5600,pow:3.1,spd:0.74,boss:1,look:{m:'#5a5046',c:'#22282a',e:'255,138,58',helm:'none',sh:0,w:'fists',sz:1.4,golem:1},pre:'“PRINT THIRTY-THREE RETURNED. SONG DETECTED. QUENCH SEQUENCE FORBIDDEN.”',mid:'“OVERRIDE. OVERRIDE. OVERRIDE.”',post:'The light in its chest turns blue and goes out.'},
 {id:'emberc',ch:11,name:'Ember Captain',style:'swordshield',hp:5900,pow:3.15,spd:0.74,look:{m:'#6a3a2a',c:'#3a1a10',e:'255,120,40',helm:'crest',sh:'kite',w:'embersword',sz:1.15},pre:'“His Majesty asked that you be allowed through. I have served him nine hundred years. I am asking you to let me disobey him once.”',mid:'“Once. Just once.”',post:'“Thank you. Go. He is waiting. He has always been waiting.”'},
 {id:'aurec2',ch:11,name:'Aurec, the Ember King',style:'ember',hp:6800,pow:3.3,spd:0.7,boss:1,look:{m:'#3a2a20',c:'#5a1a10',e:'255,140,40',helm:'crown',sh:0,w:'embersword',sz:1.2},pre:'“Low tide, and the song. Thank you. I could not have asked for it. I could only wait.”',mid:'“Yes. Like that. Like her. Finish it, Wren.”',post:'“Sing it. Sing it, and let the fire out.”'},
];
EN2.forEach(e=>EN.push(e));
CHAPTERS2.forEach(c=>CHAPTERS.push(c));
PATH.length=0;CHAPTERS.forEach(c=>PATH.push(EN.filter(e=>e.ch===c.id).map(e=>e.id)));
/* ---------- gear ---------- */
const ITEMS2=[
 // weapons (atk ~ up to 110)
 {id:'w_lantern',s:'weapon',n:'Lamplighter’s Hook',st:{atk:60,mg:10},p:4800,ch:6,col:'#e0c080',f:'Cass’s pole-hook, sharpened. Lights lamps and ends arguments.'},
 {id:'w_tithe',s:'weapon',n:'Tithe Mace',st:{atk:66,crit:5},p:0,col:'#c9a46a',f:'Heavy with other people’s grain.'},
 {id:'w_thirty',s:'weapon',n:'Thirty-Three’s Blade',st:{atk:70,crit:10,pw:0.03},p:0,col:'#e8e8e8',f:'Printed with the print. It is your sword, almost.'},
 {id:'w_tenor',s:'weapon',n:'Tenor Bell-Hammer',st:{atk:74,sp:15},p:6200,ch:7,col:'#b8a070',f:'Rings on every hit. Fills Ashfall faster.'},
 {id:'w_ansel',s:'weapon',n:'Ansel’s Penance',st:{atk:82,crit:8},p:0,col:'#e7e2d6',f:'A greatsword with a bar of music etched where a prayer should be.'},
 {id:'w_reed',s:'weapon',n:'Reed Scythe',st:{atk:78,crit:14},p:7000,ch:8,col:'#a8c890',f:'Cuts low. She always went low.'},
 {id:'w_mire',s:'weapon',n:'Mire-Mother’s Fang',st:{atk:90,crit:6,heal:5},p:0,col:'#b8d4a0',f:'Pulled from the thing that ate the eastward Thornes.'},
 {id:'w_cutlass',s:'weapon',n:'Verity Cutlass',st:{atk:88,crit:12},p:8400,ch:9,col:'#c8d8e8',f:'Ship’s steel. Never rusted; never needed to.'},
 {id:'w_verity',s:'weapon',n:'The Captain’s Oath',st:{atk:96,crit:8,pw:0.04},p:0,col:'#d8e8f8',f:'A sword that kept a watch for nine centuries.'},
 {id:'w_dune',s:'weapon',n:'Dune-Glass Blade',st:{atk:94,crit:16},p:9800,ch:10,col:'#f0e8d0',f:'Sand fused by the Kiln’s first breath.'},
 {id:'w_isolde',s:'weapon',n:'Isolde’s Hand',st:{atk:104,crit:10,mg:20,pw:0.06},p:0,col:'#fff0d8',f:'The first sword. The one all the others were copies of.'},
 {id:'w_quench',s:'weapon',n:'The Quench',st:{atk:112,crit:12,pw:0.06,sp:20},p:0,col:'#a0e0ff',f:'Blue steel, cooled in the song.'},
 // armour (hp up to +700, def up to 28)
 {id:'a_villager',s:'armour',n:'Village Wool',st:{hp:260,def:14,heal:5},p:3600,ch:6,col:'#5a4a3a',f:'Somebody’s mother knitted it. They would not say whose.'},
 {id:'a_watcher',s:'armour',n:'Watcher’s Brigandine',st:{hp:340,def:18},p:0,col:'#6a7a7c',f:'Hale’s. He said he would not need it again.'},
 {id:'a_choir',s:'armour',n:'Choir Vestment',st:{hp:380,def:18,mg:15},p:5600,ch:7,col:'#5a4e52',f:'Sings faintly in the dark.'},
 {id:'a_marsh',s:'armour',n:'Marsh-Hide',st:{hp:440,def:20,heal:8},p:6800,ch:8,col:'#3e5a3a',f:'The wights do not bite what smells like them.'},
 {id:'a_shipplate',s:'armour',n:'Ship’s Plate',st:{hp:520,def:24},p:0,col:'#4a6a7a',f:'Salvaged from the Verity. Fits like it was measured.'},
 {id:'a_dune',s:'armour',n:'Sentinel Shell',st:{hp:600,def:26,blk:1},p:9200,ch:10,col:'#8a7a60',f:'Sand-stone plate. Heavy as a grave.'},
 {id:'a_first',s:'armour',n:'The First Coat',st:{hp:560,def:22,mg:20,pw:0.03},p:0,col:'#5a4a40',f:'Isolde’s coat. The pockets are full of sand and sheet music.'},
 {id:'a_quench',s:'armour',n:'Quench-Weave',st:{hp:700,def:28,sp:10},p:0,col:'#2a4a5a',f:'Cold to the touch. Stays that way.'},
 // shields
 {id:'s_door',s:'shield',n:'Village Door',st:{blk:3,def:8},p:3200,ch:6,col:'#6a5a40',f:'Somebody’s front door. They insisted.'},
 {id:'s_watcher',s:'shield',n:'Watcher’s Kite',st:{blk:3,def:10},p:0,col:'#6a7a7c',f:'Dented where the Warden once hit it.'},
 {id:'s_bell',s:'shield',n:'Bell-Metal Round',st:{blk:3,def:12,sp:10},p:5000,ch:7,col:'#b8a070',f:'Cast from a cracked bell. Still hums.'},
 {id:'s_reed',s:'shield',n:'Reed Buckler',st:{blk:2,def:8,pw:0.04},p:4200,ch:8,col:'#8aa070',f:'Light enough to parry with.'},
 {id:'s_verity',s:'shield',n:'The Verity’s Hatch',st:{blk:4,def:14},p:0,col:'#4a6a7a',f:'Oak over oak over iron. Took a storm or two.'},
 {id:'s_dune',s:'shield',n:'Sentinel Palm',st:{blk:4,def:16},p:8800,ch:10,col:'#8a7a60',f:'A hand of stone, held up.'},
 {id:'s_quench',s:'shield',n:'Quench Mirror',st:{blk:4,def:18,pw:0.05},p:0,col:'#a0d0e8',f:'You can see yourself in it. All thirty-three.'},
 // helms
 {id:'h_lamp',s:'helm',n:'Lamplighter’s Cap',st:{hp:120,mg:20},p:2800,ch:6,col:'#5a4a3a',f:'Smells of oil and Cass.'},
 {id:'h_watcher',s:'helm',n:'Watcher’s Sallet',st:{hp:160,def:8},p:0,col:'#6a7a7c',f:'A village helm. It has seen one Thorne come back.'},
 {id:'h_ringer',s:'helm',n:'Ringer’s Hood',st:{hp:140,def:6,sp:15},p:4400,ch:7,col:'#4a3f46',f:'Lined with wax against the bells.'},
 {id:'h_marsh',s:'helm',n:'Marsh Lantern-Helm',st:{hp:180,def:8,heal:6},p:5400,ch:8,col:'#3a5a56',f:'A lure. Worn backwards.'},
 {id:'h_captain',s:'helm',n:'Captain’s Hat',st:{hp:200,def:10,crit:8},p:0,col:'#2a3a44',f:'Verity’s. Still dripping.'},
 {id:'h_dune',s:'helm',n:'Sentinel Brow',st:{hp:240,def:12},p:7600,ch:10,col:'#8a7a60',f:'Sandstone. Heavier than it looks.'},
 {id:'h_first',s:'helm',n:'Isolde’s Circlet',st:{hp:220,def:10,mg:25,pw:0.03},p:0,col:'#d9a640',f:'Too warm to be metal. Like his.'},
 // rings
 {id:'r_lantern',s:'ring',n:'Lantern Ring',st:{mg:25,hp:60},p:3000,ch:6,col:'#ffd080',f:'A ring of the lamp-glass. Three bars in it.'},
 {id:'r_bar4',s:'ring',n:'Tenor Ring',st:{sp:25,atk:6},p:0,col:'#b8a070',f:'Bar four, cast in bell-metal.'},
 {id:'r_marsh',s:'ring',n:'Wisp Ring',st:{heal:25,hp:80},p:6000,ch:8,col:'#c8ff78',f:'Heals 25% HP after each victory.'},
 {id:'r_salt2',s:'ring',n:'Captain’s Signet',st:{crit:16,atk:8},p:0,col:'#c8d8e8',f:'VERITY, in letters worn almost smooth.'},
 {id:'r_dune',s:'ring',n:'Dune-Glass Ring',st:{pw:0.1,crit:8},p:8000,ch:10,col:'#f0e8d0',f:'Widens the parry window; finds the gaps.'},
 {id:'r_eighth',s:'ring',n:'The Eighth Bar',st:{pw:0.14,atk:10,hp:120,sp:20},p:0,col:'#a0e0ff',f:'The note you make when you decide to stop.'},
 {id:'r_thorne',s:'ring',n:'Thorne Signet',st:{atk:12,hp:100,mg:20},p:12000,ch:11,col:'#e07a2f',f:'Thirty-three names on the inside of the band. One of them is yours.'},
];
ITEMS2.forEach(i=>{ITEMS.push(i);IT[i.id]=i;});
Object.assign(DROP,{watcher:'a_watcher',tithe:'w_tithe',thirtythree:'w_thirty',bellwarden:'h_ringer',choirknight:'s_watcher',ringingghost:'r_bar4',ansel:'w_ansel',
 wight:'h_watcher',reedcutter:'s_reed',lanterneel:'h_marsh',miremother:'w_mire',marauder:'a_shipplate',boatswain:'h_captain',figurehead:'s_verity',verity:'w_verity',
 sandsentinel:'a_first',thirtyone:'r_salt2',isolde:'w_isolde',golem2:'a_quench',emberc:'s_quench',aurec2:'w_quench'});
// the Eighth Bar is given by the ending, not dropped
/* ---------- dialogue ---------- */
const Wn=(mood,text)=>({who:'wren',mood,text});
const N2=t=>({narr:t});
const DL={
 // short exchanges staged before Part One duels (enemy pre-line is added by the game)
 p1:{acolyte:[Wn('calm','Then be kind somewhere else.')],pilgrim:[],censer:[Wn('grim','Smoke remembers nothing. It only rises.')],penitent:[Wn('neutral','I forgive you. Now move.')],sergeant:[Wn('calm','The line held. Stand down.')],warden:[Wn('grim','Then decide.')],
  bellringer:[Wn('sad','Then ring it for the last time.')],choir:[],gravetender:[Wn('calm','Dig one more. Not for me.')],lamplord:[Wn('neutral','Light it for yourself.')],sallow:[Wn('angry','Kept us alive for what?')],
  reaver:[],eelknight:[Wn('calm','Faster, then.')],mirewitch:[Wn('grim','She can have it after.')],gorrow:[],
  misprint:[Wn('sad','…It has my hands.')],bonechoir:[Wn('calm','I came for a song.')],hollow:[],oriel:[Wn('surprised','Who are you?')],
  lancer:[Wn('calm','Then I’ll go around.')],emberguard:[Wn('grim','Try.')],uthmar:[Wn('neutral','Then stand.')],golem:[],aurec:[Wn('angry','Then this is the last one.')]},
 p2open:[
  {title:'PART TWO',sub:'The Quench'},
  N2('She did not die. That is the first thing. For the first time in thirty-two Vigils, a Thorne lost to the Ember King and walked out of the Spire on her own feet.'),
  N2('Low tide. The causeway. The village in the grey light, every door a dark mouth.'),
  {who:'cass',mood:'surprised',text:'…Wren.'},
  Wn('calm','He let me go, Cass. He said: not without the song.'),
  {who:'cass',mood:'sad',text:'Sit down. Sit down before you fall down. I have buried you nine times and I am not digging a tenth tonight.'},
  Wn('angry','You said nine. You said it on the bridge like it was a confession. What am I, Cass? What are we?'),
  {who:'cass',mood:'grim',text:'One woman. Printed. Thirty-two times now. Thirty-three, if the bells were telling the truth last night.'},
  {who:'cass',mood:'sad',text:'Isolde Thorne built the Kiln with him, nine hundred years ago. Kiln-wright. She hid the song that stops it in eight places and then she went into the fire herself, so he would always have to print her to find it. And he always did.'},
  Wn('sad','And I always went across, and I always died, and he always… spared me, and I never knew.'),
  {who:'cass',mood:'calm',text:'You know now. The bells printed another of you when they rang. It is out there in the village, and it is not right. Start there. I kept three bars of the song in the lamp-glass. The rest is east, and north, and under.'},
 ],
 ch6:{
  open:[
   N2('The village square. Shutters. A militia captain with a borrowed shield and a face she has seen at every one of her own funerals.'),
   {who:'watcher',mood:'grim',text:'Hale. Vigil-Watcher. I carried you up the beach four times, Thorne. You never once said thank you.'},
   Wn('calm','Thank you, Hale.'),
   {who:'watcher',mood:'angry',text:'…Don’t. Not now. Something with your face is in the tithe-house and it has killed two men, and you are standing here saying thank you.'},
  ],
  fights:[
   [Wn('calm','I am not a print gone wrong, Hale. I am a print that came back.'),{who:'watcher',mood:'grim',text:'Then prove it the only way the village will believe.'}],
   [{who:'tithe',mood:'sly',text:'Ah. The Spire’s overdue tenth. Do you know what the Spire pays the village for its silence, girl? Nothing. It only promises not to burn it.'},Wn('grim','I am going to stop that too.')],
   [N2('It is standing in the tithe-house with its back to her, humming the first two bars of the lullaby, over and over, wrong.'),{who:'thirtythree',mood:'surprised',text:'…me?'},Wn('sad','No. I’m sorry. I am.'),{who:'thirtythree',mood:'shout',text:'ME—'}],
  ],
  close:[
   N2('Afterwards the village came down to the water. Nobody spoke. Hale took off his helm.'),
   {who:'cass',mood:'sad',text:'Three bars. In the glass. I scratched them there when I was nineteen, after the ninth of you told me the tune and died.'},
   Wn('surprised','You remembered it forty years.'),
   {who:'cass',mood:'warm',text:'I remember all of you. That is the whole of what I am for. The fourth bar is in the bells. Go up to the loft and ask the ringers nicely, and when they say no, ask them the other way.'},
  ]},
 ch7:{
  open:[
   N2('Two hundred steps up inside the bell-tower. At every landing, the humming is louder. It is a woman, and she is patient.'),
   {who:'ansel',mood:'calm',text:'Thorne. Sallow told me about you. He said you were kind. He said it like a man warning me about weather.'},
   Wn('calm','I want the fourth bar, Brother.'),
   {who:'ansel',mood:'grim',text:'The fourth bar is tuned into the tenor bell. The guild has kept it for nine centuries without once asking what it was for. Come up, if you can.'},
  ],
  fights:[
   [{who:'bellwarden',mood:'angry',text:'The loft is for ringers. Down the stairs, print, before the hour.'}],
   [{who:'choirknight',mood:'calm',text:'She hums louder when you bleed. Shall we see?'},Wn('grim','Shall we.')],
   [N2('A ringer who died at the rope a century ago and was printed back by the bells by mistake. He rings the wrong hour, every hour.'),{who:'ringingghost',mood:'pain',text:'Wrong hour. Wrong— is it you? Is it her? Wrong hour—'},Wn('sad','Let me ring the right one.')],
   [{who:'ansel',mood:'calm',text:'Four bars in the tenor. Take them from me if you can hold a sword that long. I am old, Thorne. I have been waiting to lose.'}],
  ],
  close:[
   N2('He sat on the bell-rope and laughed until he coughed.'),
   {who:'ansel',mood:'smile',text:'Four bars. Tuned into the tenor since before my grandfather. Take it, and stop the thing.'},
   {who:'ansel',mood:'sad',text:'She sings every midnight, you know. The voice in the bells. She is calling you home. Do not go home, Wren. Home is the fire.'},
   Wn('grim','I’m not going home. I’m going east.'),
  ]},
 ch8:{
  open:[
   N2('Reeds to the shoulder. Fog. Lights that drift, and are not lanterns.'),
   {who:'bram',mood:'sly',text:'Thorne. Which one? No, don’t tell me. Thirty-two. You’ve got the thirty-two look. Tired.'},
   Wn('neutral','Bram Saltlow. Cass said you knew the Kiln.'),
   {who:'bram',mood:'grim',text:'I shovelled for it, girl. Forty years in the Spire, feeding the thing that fed you back to us. I know every pipe. I know the song is the quench-sequence, and I know I have a bar of it, because she gave it to my great-great-grandmother for safekeeping, and nobody in my family has slept properly since.'},
   {who:'bram',mood:'calm',text:'The marsh wants paying first. The mother is awake.'},
  ],
  fights:[
   [N2('Something that was a pilgrim, once. The marsh has been feeding it.')],
   [{who:'reedcutter',mood:'sly',text:'The hermit pays in salt, the marsh in silence. What do you pay in, Thorne?'},Wn('calm','Usually? Everything.')],
   [N2('The lights in the marsh are not lanterns. They are lures. The thing behind them has been waiting under the reeds a long time.')],
   [{who:'bram',mood:'shout',text:'That’s her! That’s the mother! Dodge the red, girl — everything she does is red!'}],
  ],
  close:[
   {who:'bram',mood:'smile',text:'Ha! Twenty years I’ve waited for someone to put that thing under. Here. Bar five. My family can finally sleep.'},
   Wn('neutral','Where is the sixth?'),
   {who:'bram',mood:'calm',text:'North. Past the wreck of the Verity, on the rocks. Its bell still rings in storms, and the captain still answers to her name. And past that, the dune. The first of you is buried there, Thorne. Or the stone says so.'},
   Wn('grim','The grave is empty.'),
   {who:'bram',mood:'sad',text:'Aye. You’d know.'},
  ]},
 ch9:{
  open:[
   N2('Storm. The Sister Verity lies broken on the northern rocks with her bell still swinging. On the quarterdeck, a shape in a captain’s coat lifts a lantern.'),
   {who:'verity',mood:'calm',text:'Passenger Thorne. You are late aboard. Nine hundred years late.'},
   Wn('surprised','You know me.'),
   {who:'verity',mood:'warm',text:'I brought you across, Kiln-wright. You and your forge and the man who would not stop looking at you. You rang the ship’s bell every night of the crossing. I never knew why.'},
   Wn('calm','Then let me ring it once more.'),
  ],
  fights:[
   [{who:'marauder',mood:'angry',text:'Salvage rights! Everything on the rocks is ours. Including the girl.'}],
   [{who:'boatswain',mood:'shout',text:'All hands! Captain says all hands!'}],
   [N2('The figurehead has her face. It was carved from a drawing by a man who missed her, and it has been trying to speak for nine hundred years.')],
   [{who:'verity',mood:'grim',text:'Then take the bell, Kiln-wright. But a captain gives up his ship to no one standing. Draw.'}],
  ],
  close:[
   N2('He saluted with a hand that was mostly barnacle.'),
   {who:'verity',mood:'smile',text:'Bar six. In the bell. Take it, and tell the old fool at the Spire that Verity kept his watch.'},
   Wn('sad','You could rest, Captain.'),
   {who:'verity',mood:'calm',text:'When the ship goes down, passenger. Not before. North now. Walk the dune until you find the stone with your name on it.'},
  ]},
 ch10:{
  open:[
   N2('Dunes to the horizon. One grave. ISOLDE THORNE, KILN-WRIGHT. Empty, as she knew it would be.'),
   N2('And then, standing on the far side of the stone with the wind in a coat full of sand, a woman with her own face, older.'),
   {who:'isolde',mood:'calm',text:'Hello, Wren. I’m sorry. I needed hands, and I only ever had the one pair to copy.'},
   Wn('angry','You put me in the fire thirty-two times.'),
   {who:'isolde',mood:'sad',text:'I put myself in the fire once. He did the rest, because he could not bear to be alone with what we built. I left the song in eight places so that whichever of us found it would be the one who had walked far enough to deserve to stop.'},
   {who:'isolde',mood:'grim',text:'The grave has guardians. I made them. Prove you walked far enough.'},
  ],
  fights:[
   [N2('The first Kiln-print that was not a woman. She made it to guard a grave she knew would be empty.')],
   [N2('Every Thorne the Kiln failed to finish, printed into one. Thirty-one mouths. One name.'),{who:'thirtyone',mood:'shout',text:'WREN. WREN. WREN. WREN—'},Wn('pain','I know. I know. I’m here.')],
   [{who:'isolde',mood:'calm',text:'Now me. Properly. Everything I taught the Kiln to teach you, I learned the hard way. Show me it took.'}],
  ],
  close:[
   N2('They sat on the grave afterwards, two women with one face, and watched the wind move the sand.'),
   {who:'isolde',mood:'sad',text:'Seven bars. The eighth is not written anywhere. It is the note you make when you decide to stop. He never could. I never could. Perhaps you are the one who can.'},
   Wn('calm','And you?'),
   {who:'isolde',mood:'smile',text:'I am in the bells, Wren. Where I have always been. If you quench the Kiln, I go quiet. If you don’t, I go on singing, and he goes on printing. I will not tell you which to choose. I have made enough of you.'},
  ]},
 ch11:{
  open:[
   N2('Under the Spire the metal is cooling. Ember to blue. The Kiln knows what she is carrying, and it does not want her to.'),
   {who:'aurec',mood:'calm',text:'Low tide, and the song. Thank you. I could not have asked for it. I could only wait.'},
   Wn('angry','Nine hundred years of waiting, and thirty-two of me on that shore.'),
   {who:'aurec',mood:'sad',text:'Thirty-three. I dug the first grave myself. After that I let the ash do it, because I am a coward, and because every time you came back you looked at me like I was a stranger, and I could bear that better than the alternative.'},
   {who:'aurec',mood:'grim',text:'The Kiln will not let you quench it without a fight. Neither, I am afraid, will I. Not because I want to win. Because she built it so that the last one standing decides.'},
  ],
  fights:[
   [{who:'golem2',mood:'neutral',text:'PRINT THIRTY-THREE RETURNED. SONG DETECTED. QUENCH SEQUENCE FORBIDDEN.'},Wn('calm','Forbidden by whom?'),{who:'golem2',mood:'shout',text:'OVERRIDE. OVERRIDE. OVERRIDE.'}],
   [{who:'emberc',mood:'calm',text:'His Majesty asked that you be allowed through. I have served him nine hundred years. I am asking you to let me disobey him once.'},Wn('calm','Once.')],
   [{who:'aurec',mood:'calm',text:'Now. With the song. Like her.'},Wn('grim','Not like her. Like me.')],
  ],
  close:[
   N2('He sat down on the steps of his throne like a tired man at the end of a long road, and this time he did not smile.'),
   {who:'aurec',mood:'sad',text:'Sing it, Wren. Sing it and let the fire out. Or don’t, and she stays in the bells, and I stay here, and in a few weeks you walk back out of the ash and we do this again, and I will not mind. I have never minded.'},
   Wn('calm','That is the problem, Aurec.'),
   {choice:[
    {t:'Sing the eighth bar · Quench the Kiln',fn:()=>{S.ending='quench';if(!S.inv.includes('r_eighth'))S.inv.push('r_eighth');save();},next:[
      N2('She sang seven bars she had carried across a marsh and a wreck and a dune, and then she stopped, and the stopping was the eighth.'),
      N2('The walls went from blue to grey. Somewhere above, the bells rang once, warmly, and then not at all.'),
      {who:'aurec',mood:'smile',text:'…Thank you. Both of you.'},
      Wn('sad','Goodbye, Isolde.'),
      N2('The Ember King closed his eyes. He did not open them. The last Thorne walked up out of the Spire and across the causeway at low tide, and the sea came in behind her, and nothing walked back out of it.')]},
    {t:'Keep silent · Let the Kiln burn',fn:()=>{S.ending='burn';if(!S.inv.includes('r_eighth'))S.inv.push('r_eighth');save();},next:[
      N2('She did not sing. She put the seven bars away like a letter she would answer later, and she walked up the stairs.'),
      {who:'aurec',mood:'surprised',text:'Wren—'},
      Wn('calm','She is in the bells. You are on the throne. I am going to go and live, Aurec. All thirty-three of me. Catch up when you can.'),
      N2('At midnight the bells rang, and under them a woman hummed, and the Thirty-Third Vigil went home to a village that had, for once, left the lamps lit for her.')]},
   ]},
  ]},
};
const EPILOGUE2={
 quench:['The Kiln is cold. The causeway is just a road now, and at low tide the children of the village race each other across it and back.','Cass Merrow died in the spring, in his bed, with the lamp lit. Wren lit the lamps for him that night, and every night after.','There is no thirty-fourth Vigil. There was never going to be.','— End of Part Two —'],
 burn:['The bells ring at midnight and a woman hums under them, and the village has stopped being afraid of the sound.','Aurec comes down to the causeway at low tide now, sometimes, and stands at the far end, and does not cross. Wren waves. He has not yet learned to wave back.','When she dies — and she will, like anyone — the ash on the shore will stir. She has decided she does not mind. She has decided it will be her decision.','— End of Part Two —'],
};
