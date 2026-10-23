'use strict';
/* ============================================================================
   ITEMS — rarity tiers, weapon kinds, helms, armour, charms, consumables,
   procedural generation (named uniques for bosses), inventory & equip maths,
   16×16 pixel icons.
   ========================================================================== */
const RARITY={common:{n:'Common',jp:'並',col:'#c9c2b4',mult:1.0,w:60,val:1},rare:{n:'Rare',jp:'稀',col:'#6fb3ff',mult:1.18,w:26,val:3},epic:{n:'Epic',jp:'秀',col:'#c58cff',mult:1.4,w:10,val:8},legendary:{n:'Legendary',jp:'伝説',col:'#ffb347',mult:1.7,w:3.5,val:22},mythic:{n:'Mythic',jp:'神話',col:'#ff4d5a',mult:2.1,w:0.6,val:60}};
const RARITY_ORDER=['common','rare','epic','legendary','mythic'];
// weapon kinds: base stats for the player (dmg mult, swing cooldown, parry window bonus, crit on broken foe, guard-break, wrap past guard, reach after parry) + duel attack set + execution style
const WKIND={
 katana:{name:'Katana',jp:'刀',dmg:1.0,cd:0.16,win:0,desc:'Balanced. The samurai’s soul.',exec:'behead',icon:'sword'},
 wakizashi:{name:'Twin Kodachi',jp:'二刀',dmg:0.64,cd:0.07,win:0,mag:1.5,desc:'Two short blades. Very fast.',exec:'scissor',icon:'twin'},
 odachi:{name:'Ōdachi',jp:'大太刀',dmg:1.55,cd:0.32,win:0,desc:'Slow, crushing field sword.',exec:'cleave',icon:'bigsword'},
 yari:{name:'Yari',jp:'槍',dmg:1.05,cd:0.18,win:0,reach:0.5,desc:'Long reach: foes stay open longer.',exec:'impale',icon:'spear'},
 naginata:{name:'Naginata',jp:'薙刀',dmg:1.2,cd:0.22,win:0.04,reach:0.3,desc:'Sweeping polearm. Wide parries.',exec:'sweep',icon:'glaive'},
 kusarigama:{name:'Kusarigama',jp:'鎖鎌',dmg:0.9,cd:0.13,win:0,wrap:0.35,mag:1.2,desc:'Chain-sickle. Wraps past guards.',exec:'strangle',icon:'sickle'},
 kanabo:{name:'Kanabō',jp:'金棒',dmg:1.9,cd:0.42,win:0,gb:1,desc:'Iron club. No guard can stop it.',exec:'crush',icon:'club'},
 tessen:{name:'Tessen',jp:'鉄扇',dmg:0.7,cd:0.12,win:0.14,mag:1.2,desc:'Iron fan. Much wider parry window.',exec:'throat',icon:'fan'},
 tanto:{name:'Tantō',jp:'短刀',dmg:0.55,cd:0.06,win:0,crit:2.2,mag:1.4,desc:'Quick stabs; brutal on a broken foe.',exec:'stab',icon:'knife'},
 ono:{name:'Ōno',jp:'大斧',dmg:1.75,cd:0.38,win:0,gb:0.6,desc:'War axe. Splits guards and men.',exec:'split',icon:'axe'},
 bo:{name:'Bō',jp:'棒',dmg:0.8,cd:0.11,win:0.1,counter:1.4,desc:'Oak staff. Strong counters.',exec:'neck',icon:'staff'},
 nagamaki:{name:'Nagamaki',jp:'長巻',dmg:1.3,cd:0.24,win:0.02,reach:0.2,desc:'Long-hilted blade. Deep cuts.',exec:'bisect',icon:'longsword'},
 iaito:{name:'Iaitō',jp:'居合刀',dmg:1.15,cd:0.13,win:0.06,counter:1.6,mag:1.1,desc:'Drawn and sheathed in one breath. Perfect parries become draw-cuts; twelve kata finish the fallen.',exec:'mae',icon:'iaito'},
};
const WKINDS=Object.keys(WKIND);
// how enemies with each kind attack (name, jp, swipe dir, wind-up s, dmg, extras). dirs: 0 → right,1 ↘,2 ↓,3 ↙,4 ←,5 ↖,6 ↑,7 ↗  (screen space, enemy on the right)
const ATKSET={
 katana:{s:[['Kesa-giri','袈裟斬り',3,1.2,28],['Kabuto-wari','兜割り',2,1.3,32],['Kiriage','切り上げ',5,1.1,26],['Yoko-giri','横斬り',4,1.15,30]],u:[['Tsuki','突き',4,1.6,48,{unblock:true,dg:'back'}]],f:[['Kasumi','霞',7,1.55,32,{feint:{at:0.7,dir:3}}],['Tsubame','燕',1,1.55,32,{feint:{at:0.7,dir:5}}]]},
 odachi:{s:[['Oni-otoshi','鬼落とし',2,1.6,44],['Yoko-nagi','横薙ぎ',4,1.5,42],['Tsuki-age','突き上げ',5,1.45,40]],u:[['Chi-wari','地割り',2,1.95,66,{unblock:true,dg:'back'}]],f:[['Damashi','騙し',3,1.8,44,{feint:{at:0.72,dir:5}}]]},
 wakizashi:{s:[['Kogiri','小斬り',3,0.9,18],['Hane','跳ね',5,0.9,18],['Ura','裏',1,0.95,18],['Kaeshi','返し',7,0.9,18]],u:[['Ashi-kiri','足斬り',4,1.4,36,{unblock:true,dg:'jump'}]],f:[['Kagerō','陽炎',5,1.4,22,{feint:{at:0.68,dir:1}}]]},
 yari:{s:[['Su-yari','素槍',4,1.05,28],['Jōdan-tsuki','上段突き',3,1.1,30],['Harai','払い',2,1.3,32],['Kachiage','かち上げ',5,1.1,28]],u:[['Ashi-barai','足払い',4,1.5,46,{unblock:true,dg:'jump'}]],f:[['Itomaki','糸巻',7,1.55,32,{feint:{at:0.72,dir:4}}]]},
 naginata:{s:[['Ō-nagi','大薙ぎ',4,1.3,34],['Kesa','袈裟',3,1.25,32],['Ashi-nagi','足薙ぎ',2,1.35,30],['Mawashi','回し',5,1.2,30]],u:[['Kaze-maki','風巻き',4,1.7,52,{unblock:true,dg:'jump'}]],f:[['Tsubame-gaeshi','燕返し',1,1.6,36,{feint:{at:0.7,dir:3}}]]},
 kusarigama:{s:[['Kusari-uchi','鎖打ち',4,1.0,24],['Kama-gake','鎌掛け',3,1.05,28],['Tobi-kama','飛び鎌',1,1.1,26]],u:[['Fundō','分銅',4,1.45,44,{unblock:true,dg:'back'}]],f:[['Gaeshi','返し',5,1.5,30,{feint:{at:0.68,dir:2}}],['Kage-nui','影縫い',2,1.55,30,{feint:{at:0.7,dir:7}}]]},
 kanabo:{s:[['Tetsu-otoshi','鉄落とし',2,1.75,50],['Nagi','薙ぎ',4,1.6,46],['Kachi-age','かち上げ',5,1.55,44]],u:[['Jishin','地震',2,1.95,72,{unblock:true,dg:'jump'}]],f:[['Oni-damashi','鬼騙し',3,1.85,48,{feint:{at:0.72,dir:5}}]]},
 tessen:{s:[['Tessen-uchi','鉄扇打ち',3,0.95,20],['Ōgi-gaeshi','扇返し',7,0.9,20],['Kubi-uchi','首打ち',4,1.0,22]],u:[['Kaze-giri','風斬り',4,1.45,40,{unblock:true,dg:'jump'}]],f:[['Yuki-fubuki','雪吹雪',2,1.5,26,{feint:{at:0.7,dir:5}}],['Kagerō','陽炎',5,1.5,26,{feint:{at:0.7,dir:1}}]]},
 tanto:{s:[['Sashi','刺し',4,0.85,20],['Kiri','切り',3,0.85,20],['Hane','跳ね',5,0.85,20]],u:[['Kubi-sashi','首刺し',4,1.35,40,{unblock:true,dg:'back'}]],f:[['Uso','嘘',7,1.4,22,{feint:{at:0.68,dir:3}}]]},
 ono:{s:[['Wari','割り',2,1.7,48],['Yoko-wari','横割り',4,1.55,44],['Age-wari','上げ割り',5,1.5,42]],u:[['Daichi-wari','大地割り',2,1.95,70,{unblock:true,dg:'back'}]],f:[['Kuma-damashi','熊騙し',3,1.8,46,{feint:{at:0.7,dir:4}}]]},
 bo:{s:[['Tsuki','突き',4,0.95,22],['Uchi-otoshi','打ち落とし',2,1.0,24],['Harai','払い',3,1.0,22],['Age','上げ',5,0.95,22]],u:[['Ashi-barai','足払い',4,1.4,40,{unblock:true,dg:'jump'}]],f:[['Mawashi-uke','回し受け',7,1.5,26,{feint:{at:0.7,dir:2}}]]},
 nagamaki:{s:[['Ō-kesa','大袈裟',3,1.35,36],['Hira-nagi','平薙ぎ',4,1.3,34],['Kiri-age','切り上げ',5,1.25,32]],u:[['Tsuki','突き',4,1.7,54,{unblock:true,dg:'back'}]],f:[['Kasumi','霞',1,1.6,36,{feint:{at:0.7,dir:3}}]]},
 iaito:{s:[['Nukitsuke','抜き付け',4,0.95,30],['Kirioroshi','切り下ろし',2,1.15,34],['Kesagiri','袈裟切り',3,1.05,30],['Gyaku-kesa','逆袈裟',5,1.0,30]],u:[['Nukiuchi','抜き打ち',2,1.5,54,{unblock:true,dg:'back'}]],f:[['Kasumi','霞',7,1.45,32,{feint:{at:0.68,dir:4}}],['Ukenagashi','受け流し',1,1.5,32,{feint:{at:0.7,dir:3}}]]},
};
/* ---------- helms / armour / charms ---------- */
const HELMS=[ // hat = sprite headwear, stats
 {id:'bareh',name:'Bare Head',jp:'無帽',hat:null,hp:0,rar:'common'},
 {id:'kasa',name:'Straw Kasa',jp:'笠',hat:'kasa',hp:10,win:0.02,rar:'common'},
 {id:'headcloth',name:'Hachimaki',jp:'鉢巻',hat:'band',hp:5,dodge:0.03,rar:'common'},
 {id:'jingasa',name:'Iron Jingasa',jp:'陣笠',hat:'jingasa',hp:30,rar:'rare'},
 {id:'hood',name:'Shinobi Hood',jp:'頭巾',hat:'hood',dodge:0.08,mag:1.1,rar:'rare'},
 {id:'eboshi',name:'Court Eboshi',jp:'烏帽子',hat:'eboshi',coin:1.15,xp:1.05,rar:'rare'},
 {id:'kabuto',name:'Kabuto',jp:'兜',hat:'kabuto',hp:60,cdm:1.04,rar:'epic'},
 {id:'tengai',name:'Komusō Tengai',jp:'天蓋',hat:'tengai',win:0.06,mag:1.2,rar:'epic'},
 {id:'onimask',name:'Oni Mempō',jp:'鬼面',hat:'oni',dmg:1.1,hp:20,rar:'epic'},
 {id:'furhood',name:'Bear-fur Hood',jp:'熊皮頭巾',hat:'fur',hp:45,regen:4,rar:'rare'},
 {id:'dragonkabuto',name:'Dragon Kabuto',jp:'龍兜',hat:'kabuto',hatCol:'#3a2a5a',hp:110,dmg:1.08,rar:'legendary'},
 {id:'goldkabuto',name:'Golden Kabuto',jp:'金兜',hat:'kabuto',hatCol:'#8a6a1a',hp:90,coin:1.3,rar:'legendary'},
 {id:'crown',name:'Crown of the Unifier',jp:'統一の冠',hat:'crown',hp:150,dmg:1.15,win:0.08,rar:'mythic'},
 {id:'shadowmask',name:'Mask of the Double',jp:'影武者の面',hat:'mask',dodge:0.12,counter:1.4,mag:1.3,rar:'mythic'},
];
const BODIES=[ // bodyCol = kimono colour; armor = plated
 {id:'kimono',name:'Plain Kimono',jp:'着物',bodyCol:'#3a4a6a',dodge:0.05,rar:'common'},
 {id:'rags',name:'Traveller’s Rags',jp:'襤褸',bodyCol:'#6a5a48',dodge:0.03,rar:'common'},
 {id:'haori',name:'Haori',jp:'羽織',bodyCol:'#2a2a3a',regen:3.5,rar:'common'},
 {id:'kote',name:'Kote Sleeves',jp:'籠手',bodyCol:'#3a3a44',dmg:1.08,rar:'rare'},
 {id:'do',name:'Dō Chest Plate',jp:'胴',bodyCol:'#2a2e36',armor:1,armorCol:'#4a4a52',hp:60,dodge:-0.04,rar:'rare'},
 {id:'mino',name:'Straw Mino',jp:'蓑',bodyCol:'#8a7a4a',dodge:0.1,hp:-10,rar:'rare'},
 {id:'shinobi',name:'Shinobi Shōzoku',jp:'忍装束',bodyCol:'#1a1a22',dodge:0.1,mag:1.15,rar:'epic'},
 {id:'monk',name:'Monk’s Kesa',jp:'袈裟',bodyCol:'#5a3a2a',win:0.05,regen:3,rar:'epic'},
 {id:'oyoroi',name:'Ō-yoroi',jp:'大鎧',bodyCol:'#4a2a2a',armor:1,armorCol:'#5a3a3a',hp:120,blk:1,cdm:1.08,dodge:-0.06,rar:'epic'},
 {id:'redyoroi',name:'Crimson Yoroi',jp:'赤備え',bodyCol:'#7a1a1a',armor:1,armorCol:'#9a2a2a',hp:140,dmg:1.1,rar:'legendary'},
 {id:'blackyoroi',name:'Black Eagle Yoroi',jp:'黒鷲の鎧',bodyCol:'#1a1a1e',armor:1,armorCol:'#2a2a30',hp:170,blk:1,counter:1.2,rar:'legendary'},
 {id:'whiteyoroi',name:'White Heron Yoroi',jp:'白鷺の鎧',bodyCol:'#e8e4dc',armor:1,armorCol:'#f0ece4',hp:160,win:0.06,ls:3,rar:'legendary'},
 {id:'shogunyoroi',name:'Shōgun’s Dragon Yoroi',jp:'将軍の龍鎧',bodyCol:'#2a1a4a',armor:1,armorCol:'#5a3a8a',hp:260,dmg:1.15,blk:2,rar:'mythic'},
 {id:'shadowrobe',name:'Robe of the Shadow Vow',jp:'影ノ誓の衣',bodyCol:'#141218',hp:120,dodge:0.12,counter:1.5,ls:4,rar:'mythic'},
];
const CHARMS=[
 {id:'none',name:'No Charm',jp:'無',rar:'common'},
 {id:'omamori',name:'Omamori',jp:'御守',hp:15,rar:'common'},
 {id:'coinbag',name:'Merchant’s Coin Bag',jp:'銭袋',coin:1.25,rar:'rare'},
 {id:'foxbell',name:'Fox Bell',jp:'狐鈴',mag:1.35,rar:'rare'},
 {id:'ema',name:'Ema Plaque',jp:'絵馬',xp:1.2,rar:'rare'},
 {id:'kuroda',name:'Kuroda Prayer Beads',jp:'数珠',win:0.05,rar:'epic'},
 {id:'tsubacharm',name:'Cracked Tsuba',jp:'割れ鍔',counter:1.5,rar:'epic'},
 {id:'bloodcharm',name:'Blood Scroll',jp:'血の巻物',ls:4,rar:'legendary'},
 {id:'sunfan',name:'Fan of the Rising Sun',jp:'日の丸扇',dmg:1.12,coin:1.2,rar:'legendary'},
 {id:'eclipse',name:'Eclipse Shard',jp:'蝕の欠片',dmg:1.2,ls:5,mag:1.5,rar:'mythic'},
];
const CONSUMABLES=[
 {id:'onigiri',name:'Onigiri',jp:'握り飯',heal:40,price:12,rar:'common',desc:'Restores 40 HP.'},
 {id:'mochi',name:'Mochi',jp:'餅',heal:80,price:30,rar:'common',desc:'Restores 80 HP.'},
 {id:'sake',name:'Sake',jp:'酒',heal:30,buff:'dmg',price:40,rar:'rare',desc:'Heals 30. Next duel: +15% damage.'},
 {id:'tea',name:'Monk’s Tea',jp:'茶',heal:60,buff:'win',price:50,rar:'rare',desc:'Heals 60. Next duel: wider parry window.'},
 {id:'elixir',name:'Kitsune Elixir',jp:'狐の霊薬',heal:999,buff:'mag',price:150,rar:'epic',desc:'Full heal. Next duel: starts with Foxfire ready.'},
];
/* ---------- item generation ---------- */
const PREFIX={common:['Plain','Worn','Rusted','Village','Old','Simple','Field'],rare:['Fine','Tempered','Blue-steel','Keen','Polished','Clan','Folded'],epic:['Master’s','Storm','Moonlit','Crimson','Jade','Whispering','Thunder'],legendary:['Dragon','Phoenix','Eclipse','Heaven’s','Emperor’s','Thousand-fold','Shōgun’s'],mythic:['Godslayer','Amaterasu’s','Yomi','Susanoo’s','Vow-breaker','Void','Oath']};
const PREFIX_JP={common:['並','古','錆','村','旧','素','野'],rare:['良','鍛','青鋼','鋭','研','家','折'],epic:['名','嵐','月','紅','翠','囁','雷'],legendary:['龍','鳳','蝕','天','帝','千','将'],mythic:['神殺','天照','黄泉','須佐','破誓','虚','誓']};
const SUFFIX=['','',' of the Mist',' of Ash',' of the Heron',' of the Ferry',' of Silence',' of Dawn',' of the Last Vow',' of Hatred',' of the Shadow',' of Rain',' of Ten Thousand Cuts'];
let ITEM_SEQ=1;
function rollRarity(rng,bias){ // bias: 0 common-heavy … 1 mythic-heavy
 const w=RARITY_ORDER.map(r=>RARITY[r].w*Math.pow(1+bias*3,RARITY_ORDER.indexOf(r)));const tot=w.reduce((a,b)=>a+b,0);let v=rng()*tot;for(let i=0;i<w.length;i++){if((v-=w[i])<0)return RARITY_ORDER[i];}return 'common';}
function genWeapon(rng,o){o=o||{};const kind=o.kind||rng.pick(WKINDS),rar=o.rar||rollRarity(rng,o.bias||0),K=WKIND[kind],R=RARITY[rar],lvl=o.lvl||1;
 const q=R.mult*(1+lvl*0.04);const pre=rng.pick(PREFIX[rar]),preJ=PREFIX_JP[rar][PREFIX[rar].indexOf(pre)],suf=rar==='common'?'':rng.pick(SUFFIX);
 const it={uid:'w'+(ITEM_SEQ++)+'_'+Math.floor(rng()*1e6),type:'weapon',kind,rar,lvl,name:o.name||(pre+' '+K.name+suf),jp:o.jp||(preJ+K.jp),
  dmg:+(K.dmg*q).toFixed(2),cd:+(K.cd*(rar==='mythic'?0.9:1)).toFixed(3),win:+((K.win||0)+(rar==='legendary'||rar==='mythic'?0.03:0)).toFixed(2),crit:K.crit||1,gb:K.gb||0,wrap:K.wrap||0,reach:K.reach||0,mag:K.mag||1,counter:K.counter||1,
  ls:rar==='mythic'?3:rar==='legendary'&&rng()<0.4?2:0,price:Math.round(60*R.val*(1+lvl*0.1)),desc:K.desc};
 if(o.name){it.unique=1;}if(o.extra)Object.assign(it,o.extra);return it;}
function genGear(rng,type,o){o=o||{};const pool=type==='helm'?HELMS:type==='body'?BODIES:CHARMS;const rar=o.rar||rollRarity(rng,o.bias||0);
 let cands=pool.filter(p=>p.rar===rar&&p.id!=='bareh'&&p.id!=='none');if(!cands.length)cands=pool.filter(p=>p.rar===rar)||pool;const base=o.id?pool.find(p=>p.id===o.id):rng.pick(cands);
 const it=Object.assign({uid:type[0]+(ITEM_SEQ++)+'_'+Math.floor(rng()*1e6),type,base:base.id,lvl:o.lvl||1},base);delete it.id;it.rar=base.rar;it.price=Math.round(50*RARITY[it.rar].val);return it;}
function genConsumable(id){const c=CONSUMABLES.find(x=>x.id===id)||CONSUMABLES[0];return Object.assign({uid:'c'+(ITEM_SEQ++),type:'consumable',base:c.id},c);}
/* ---------- named uniques (story drops) ---------- */
const UNIQUES={
 kurowashi:()=>genWeapon(RNG(1),{kind:'odachi',rar:'legendary',lvl:8,name:'Kurowashi — Black Eagle',jp:'黒鷲',extra:{dmg:2.5,ls:3,desc:'Shōgun Iki’s field sword. It remembers the rebellion.'}}),
 chikai:()=>genWeapon(RNG(2),{kind:'katana',rar:'mythic',lvl:10,name:'Chikai-wari — Vow-breaker',jp:'誓割',extra:{dmg:2.6,counter:1.6,ls:4,desc:'Lord Satō’s blade. The vow it broke was yours.'}}),
 kagemaru:()=>genWeapon(RNG(3),{kind:'katana',rar:'rare',lvl:1,name:'Kagemaru — the Double’s Blade',jp:'影丸',extra:{dmg:1.25,desc:'Given to the double so he could die convincingly.'}}),
 sakuragiri:()=>genWeapon(RNG(4),{kind:'naginata',rar:'epic',lvl:4,name:'Sakura-giri',jp:'桜斬',extra:{dmg:1.9,desc:'A nun’s naginata. Petals on the edge.'}}),
 ferryhook:()=>genWeapon(RNG(5),{kind:'kusarigama',rar:'epic',lvl:3,name:'Ferryman’s Hook',jp:'渡しの鉤',extra:{wrap:0.5,desc:'It pulled drowning men from Lake Biwa. And some into it.'}}),
 tenguhane:()=>genWeapon(RNG(6),{kind:'tessen',rar:'legendary',lvl:6,name:'Tengu-bane',jp:'天狗羽',extra:{win:0.22,desc:'An Iga fan. Reads the wind before the blow.'}}),
 oniwari:()=>genWeapon(RNG(7),{kind:'kanabo',rar:'legendary',lvl:7,name:'Oni-wari',jp:'鬼割',extra:{dmg:3.3,desc:'The club of the Kōya giant. Still warm.'}}),
 unifier:()=>genWeapon(RNG(8),{kind:'nagamaki',rar:'mythic',lvl:14,name:'Tenka-ittō — One Blade Under Heaven',jp:'天下一刀',extra:{dmg:3.4,counter:1.8,ls:6,win:0.08,desc:'Forged from the swords of eight lords.'}}),
 tsurumai:()=>genWeapon(RNG(9),{kind:'iaito',rar:'legendary',lvl:9,name:'Tsuru-no-mai — the Crane’s Dance',jp:'鶴の舞',extra:{dmg:2.1,counter:2.0,win:0.12,desc:'Lady Ōkubo’s iaitō. Her husband taught her the twelve forms; she taught them to the fallen.'}}),
};
/* ---------- stat helpers ---------- */
function eqItem(slot){const u=S.eq[slot];if(!u)return null;return S.inv.find(i=>i.uid===u)||null;}
function gearList(){return ['helm','body','charm'].map(s=>eqItem(s)||{});}
function gsum(k){return gearList().reduce((a,x)=>a+(x[k]||0),0);}function gmul(k){return gearList().reduce((a,x)=>a*(x[k]||1),1);}
function playerWeapon(){const w0=eqItem('weapon')||genWeapon(RNG(99),{kind:'katana',rar:'common'});const K=WKIND[w0.kind];
 return Object.assign({},w0,{dmg:w0.dmg*gmul('dmg'),cd:w0.cd*gmul('cdm'),win:(w0.win||0)+gsum('win'),mag:(w0.mag||1)*gmul('mag'),counter:(w0.counter||1)*gmul('counter'),ls:(w0.ls||0)+gsum('ls'),crit:w0.crit||1,xp:gmul('xp'),coin:gmul('coin'),exec:K.exec});}
function lvl(){return S.level;}
function xpFor(l){return Math.round(80*Math.pow(l,1.45));}
function playerMaxHp(){return Math.max(120,Math.round(240+(lvl()-1)*18+gsum('hp')));}
function addItem(it){S.inv.push(it);if(S.inv.length>120){ /* drop the cheapest common */ const i=S.inv.findIndex(x=>x.rar==='common'&&!Object.values(S.eq).includes(x.uid));if(i>=0)S.inv.splice(i,1);}return it;}
function removeItem(uid){const i=S.inv.findIndex(x=>x.uid===uid);if(i<0)return null;const it=S.inv[i];S.inv.splice(i,1);for(const k in S.eq)if(S.eq[k]===uid)S.eq[k]=null;return it;}
function equip(it){if(!it)return;const slot=it.type==='weapon'?'weapon':it.type;if(!(slot in S.eq))return;S.eq[slot]=it.uid;save();}
function itemScore(it){if(it.type==='weapon')return it.dmg*100+(it.win||0)*200+(it.ls||0)*20;return (it.hp||0)+((it.dmg||1)-1)*300+((it.win||0))*400+((it.dodge||0))*200+((it.ls||0))*25+((it.counter||1)-1)*100+((it.mag||1)-1)*80+((it.coin||1)-1)*60+((it.xp||1)-1)*60+((it.regen||0)?10:0)+((it.blk||0))*40;}
function sellPrice(it){return Math.max(1,Math.round((it.price||10)*0.4));}
/* ---------- icons (16×16, cached) ---------- */
const ICON_CACHE=new Map();
function itemIcon(it){const key=(it.type==='weapon'?'w:'+it.kind:it.type==='consumable'?'c:'+it.base:it.type+':'+(it.hat||it.base||''))+'|'+it.rar;let c=ICON_CACHE.get(key);if(c)return c;
 const [cv,q]=mkCanvas(16,16);const col=RARITY[it.rar]?RARITY[it.rar].col:'#ccc';const steel='#d8dde6',steelD='#8a909a',wood='#7a5536';
 if(it.type==='weapon'){const ic=WKIND[it.kind].icon;
  if(ic==='sword'){line(q,3,13,12,4,steel);line(q,4,13,13,4,steelD);rect(q,2,12,3,3,wood);px(q,5,10,'#d9b24e');px(q,6,9,'#d9b24e');}
  else if(ic==='twin'){line(q,2,13,9,6,steel);line(q,6,14,13,7,steel);rect(q,1,12,2,3,wood);rect(q,5,13,2,3,wood);}
  else if(ic==='bigsword'){line(q,2,14,13,3,steel);line(q,3,14,14,3,steel);line(q,2,13,12,3,steelD);rect(q,1,13,3,3,wood);rect(q,4,10,3,1,'#d9b24e');}
  else if(ic==='spear'){line(q,2,14,12,4,wood);tri(q,10,6,13,3,14,6,steel);px(q,13,2,steel);}
  else if(ic==='glaive'){line(q,2,14,10,6,wood);line(q,9,7,13,2,steel);line(q,10,8,14,4,steel);}
  else if(ic==='sickle'){rect(q,7,8,2,7,wood);line(q,8,8,13,4,steel);line(q,9,8,14,6,steel);for(let i=0;i<5;i++)px(q,2+i,13-i*2%4,steelD);}
  else if(ic==='club'){line(q,3,14,8,8,wood);rect(q,7,2,6,8,'#4a4a52');for(let y=3;y<10;y+=2)for(let x=8;x<12;x+=2)px(q,x,y,'#7a7a84');}
  else if(ic==='fan'){tri(q,8,14,2,4,14,4,'#1c1a1e');tri(q,8,13,4,5,12,5,'#b8242a');for(let i=0;i<5;i++)line(q,8,13,3+i*2.5,4,steelD);}
  else if(ic==='knife'){line(q,5,12,11,5,steel);line(q,6,12,12,6,steel);rect(q,3,12,3,3,wood);}
  else if(ic==='axe'){line(q,3,14,10,6,wood);tri(q,8,3,15,6,10,11,steel);tri(q,9,4,14,6,10,10,steelD);}
  else if(ic==='staff'){line(q,2,14,14,2,wood);line(q,3,14,14,3,'#5a3a24');px(q,2,14,'#4a4a52');px(q,14,2,'#4a4a52');}
  else if(ic==='longsword'){line(q,1,15,7,9,wood);line(q,7,9,14,2,steel);line(q,8,9,14,3,steel);rect(q,6,8,2,2,'#d9b24e');}
  else if(ic==='iaito'){line(q,2,14,9,7,'#1c1a1e');line(q,3,14,10,7,'#2a2630');rect(q,8,6,3,3,'#d9b24e');line(q,10,6,14,2,steel);line(q,11,6,14,3,steelD);px(q,3,13,'#8a2a2a');}}
 else if(it.type==='helm'){const h=it.hat;if(!h){ell(q,8,8,5,5,'#e8c39f');rect(q,3,3,10,3,'#2b1d16');}
  else if(h==='kasa'){tri(q,1,11,15,11,8,3,'#c9a66e');hline(q,1,15,11,'#8a6a40');}else if(h==='jingasa'){tri(q,2,11,14,11,8,5,'#3a3b40');hline(q,2,14,11,'#1e1f22');}
  else if(h==='kabuto'){rect(q,4,5,8,6,it.hatCol||'#2a2e36');rect(q,2,10,12,2,shade(it.hatCol||'#2a2e36',0.7));rect(q,6,2,4,3,'#d9b24e');line(q,4,5,2,2,'#d9b24e');line(q,11,5,13,2,'#d9b24e');}
  else if(h==='hood'){rect(q,4,3,8,10,'#2a2622');rect(q,6,7,4,4,'#e8c39f');}else if(h==='band'){ell(q,8,8,5,5,'#e8c39f');rect(q,3,5,11,2,'#efe6d2');}
  else if(h==='eboshi'){rect(q,6,2,5,9,'#111014');rect(q,4,10,8,3,'#e8c39f');}else if(h==='oni'){rect(q,4,3,8,10,'#b8242a');rect(q,5,6,2,1,'#ffd27a');rect(q,9,6,2,1,'#ffd27a');line(q,5,3,3,0,'#efe6d2');line(q,10,3,12,0,'#efe6d2');}
  else if(h==='tengai'){rect(q,3,2,10,11,'#c9a66e');for(let y=3;y<13;y+=2)hline(q,3,12,y,'#a98756');}else if(h==='fur'){rect(q,3,4,10,6,'#5a4a3a');speckle(q,3,4,10,6,'#7a6a5a',0.3,1);rect(q,5,10,6,3,'#e8c39f');}
  else if(h==='crown'){rect(q,3,8,10,4,'#d9b24e');px(q,4,6,'#d9b24e');px(q,8,5,'#d9b24e');px(q,12,6,'#d9b24e');px(q,8,9,'#b8242a');}else if(h==='mask'){rect(q,4,4,8,9,'#1a1a1e');rect(q,5,7,2,1,'#fff');rect(q,9,7,2,1,'#fff');}}
 else if(it.type==='body'){const b=it.bodyCol||'#3a4a6a';rect(q,3,4,10,10,b);rect(q,1,4,2,5,b);rect(q,13,4,2,5,b);if(it.armor){rect(q,4,5,8,6,it.armorCol||'#4a4a52');for(let y=6;y<11;y+=2)hline(q,4,11,y,shade(it.armorCol||'#4a4a52',0.7));}else{line(q,6,4,8,8,'#e8dcc0');line(q,10,4,8,8,'#e8dcc0');rect(q,3,10,10,1,'#2b2130');}}
 else if(it.type==='charm'){rect(q,5,4,6,9,'#b8242a');rect(q,6,5,4,7,'#d93a3a');rect(q,7,2,2,3,'#d9b24e');px(q,7,8,'#f3e6d0');px(q,8,8,'#f3e6d0');}
 else if(it.type==='consumable'){if(it.base==='onigiri'){tri(q,2,13,14,13,8,3,'#f3f0e8');rect(q,6,10,4,3,'#1a2a1a');}else if(it.base==='mochi'){ell(q,8,9,6,4,'#f3f0e8');ell(q,8,8,4,2,'#fff');}else if(it.base==='sake'){rect(q,5,5,6,9,'#e8dcc0');rect(q,6,2,4,4,'#a8a0a0');rect(q,6,8,4,2,'#b8242a');}else if(it.base==='tea'){rect(q,4,6,8,7,'#4a6a3a');rect(q,5,5,6,1,'#8a9a6a');}else{rect(q,5,4,6,10,'#4a2a6a');rect(q,6,5,4,3,'#9fe3ff');rect(q,6,2,4,3,'#d9b24e');}}
 // rarity frame glint
 if(it.rar&&it.rar!=='common'){px(q,0,0,col);px(q,15,0,col);px(q,0,15,col);px(q,15,15,col);}
 ICON_CACHE.set(key,cv);return cv;}
