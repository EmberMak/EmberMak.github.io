'use strict';
/* ============================================================================
   影ノ誓 — expanded armory. Weapons by category, attire by slot, charms.
   Weapon perks: dmg (mult), cd (swing cooldown s), mag (Foxfire gain mult), win (+parry window s),
     reach (+open s after parry), wrap (chance to slip guard), gb (chance to break guard), crit (mult on broken foe),
     counter (mult on the first hit after a perfect parry), ls (HP healed per perfect parry), sm (Ougi gain mult),
     fx (Foxfire damage mult), self (HP lost per hit you land), mon (mon mult).
   Unlock: price>0 => shop (needs chapter `req` cleared, 0-based chapter index); story rewards come from chapters;
     surv:N, tot:key:N (lifetime stats), tensei:N, ending:x.
   ========================================================================== */
const WCAT={katana:{jp:'刀',name:'Katana'},twin:{jp:'二刀',name:'Twin Blades'},yari:{jp:'槍',name:'Spears'},kusari:{jp:'鎖鎌',name:'Chain-Sickles'},odachi:{jp:'野太刀',name:'Great Swords'},kanabo:{jp:'金棒',name:'Clubs'},tessen:{jp:'鉄扇',name:'War Fans'},tanto:{jp:'短刀',name:'Daggers'},naginata:{jp:'薙刀',name:'Polearms'},ono:{jp:'斧',name:'Axes'}};
const W2=(id,jp,name,kind,cat,desc,st)=>Object.assign({id,jp,name,kind,cat,desc,dmg:1,cd:0.16,mag:1,win:0,price:0},st);
const NEW_WEAPONS=[
 // 刀
 W2('bizen','備前長船','Bizen Osafune','katana','katana','A true smith’s blade. Cleaner, heavier cuts.',{dmg:1.12,cd:0.16,price:700,req:1}),
 W2('kiyomitsu','清光','Kiyomitsu','katana','katana','Light in the hand. The parry comes a hair sooner.',{dmg:1.0,cd:0.14,mag:1.1,win:0.03,price:900,req:3}),
 W2('muramasa','村正','Muramasa','cursed','katana','Cursed. Every cut you land costs you a little blood.',{dmg:1.45,cd:0.16,mag:0.8,self:2,price:1600,req:5}),
 W2('kichi','耳','Mimi, the Listening Blade','katana','katana','Blind Kichi’s sword. Hears the strike before it lands.',{dmg:1.1,cd:0.15,win:0.06,counter:1.3,story:1}),
 W2('kageuchi','影打ち','Kage-uchi','cursed','katana','Struck from the Shadow’s own steel. Foxfire burns half again as hot.',{dmg:1.3,cd:0.15,fx:1.5,unlock:'chap11'}),
 W2('chikai','誓','Chikai','katana','katana','The oath, re-forged. Nothing left of the old steel.',{dmg:1.25,cd:0.14,mag:1.2,win:0.04,counter:1.4,sm:1.2,story:1}),
 // 二刀
 W2('tsubame','燕','Tsubame Twins','wakizashi','twin','Swallow-tail blades. Faster still.',{off:1,dmg:0.66,cd:0.065,mag:1.7,price:800,req:2}),
 W2('shirakawa','白川の爪','Shirakawa Claws','wakizashi','twin','Clan steel. Savage on a broken foe.',{off:1,dmg:0.58,cd:0.06,mag:1.8,crit:1.8,price:1200,req:7}),
 W2('onitwins','鬼切','Oni-kiri Pair','wakizashi','twin','Heavy short swords. Three in ten strikes break guard.',{off:1,dmg:0.8,cd:0.08,mag:1.4,gb:0.3,price:1500,req:8}),
 W2('yukikaze','雪風','Yukikaze','wakizashi','twin','Yuki’s blades. Every perfect parry closes a wound.',{off:1,dmg:0.72,cd:0.07,mag:1.6,win:0.04,ls:6,story:1}),
 // 槍
 W2('jumonji','十文字槍','Jūmonji Yari','yari','yari','Cross-bladed. Foes stay open longer after a parry.',{dmg:1.15,cd:0.19,reach:0.7,price:900,req:2}),
 W2('kikuchi','菊池槍','Kikuchi Yari','yari','yari','A short spear, quick as a sword.',{dmg:1.0,cd:0.16,mag:1.1,reach:0.4,win:0.02,price:1000,req:4}),
 W2('omi','近江の長槍','Ōmi Nagayari','yari','yari','Absurdly long. Slow, but the opening never ends.',{dmg:1.25,cd:0.22,mag:0.9,reach:0.9,price:1400,req:7}),
 W2('tonbo','蜻蛉切','Tonbogiri','yari','yari','The dragonfly that landed on its edge was cut in two.',{dmg:1.3,cd:0.18,reach:0.8,crit:1.5,price:2400,req:10}),
 // 鎖鎌
 W2('fundo','分銅鎖','Fundō Chain','kusarigama','kusari','Heavier weight. Half of all strikes slip past a guard.',{dmg:0.95,cd:0.14,mag:1.2,wrap:0.5,price:950,req:3}),
 W2('kyoketsu','距跋渉毛','Kyoketsu-shoge','kusarigama','kusari','Rope and hooked blade. Builds the Ougi quickly.',{dmg:0.85,cd:0.12,mag:1.4,wrap:0.4,sm:1.2,price:1300,req:6}),
 W2('kodakama','幸田の鎌','Koda’s Sickle','kusarigama','kusari','The elder brother’s sickle. Vicious on a broken foe.',{dmg:1.05,cd:0.14,mag:1.1,wrap:0.45,crit:1.4,price:1800,req:9}),
 // 野太刀
 W2('zanbato','斬馬刀','Zanbatō','odachi','odachi','Horse-cutter. A third of hits break guard.',{dmg:1.8,cd:0.38,mag:0.8,gb:0.35,price:1100,req:3}),
 W2('nagamaki','長巻','Nagamaki','nagamaki','odachi','Long-handled. Quicker than it looks.',{dmg:1.4,cd:0.26,reach:0.3,story:1}),
 W2('norimitsu','則光大太刀','Norimitsu Ōdachi','odachi','odachi','Seven feet of steel. Counters are devastating.',{dmg:2.0,cd:0.4,mag:0.8,counter:1.5,price:2200,req:8}),
 // 金棒
 W2('tetsubo','鉄棒','Tetsubō','kanabo','kanabo','Lighter iron. Still breaks every guard.',{dmg:1.7,cd:0.36,mag:0.85,gb:1,price:1200,req:4}),
 W2('kurodo','蔵人の金棒','Kurōdo’s Kanabō','kanabo','kanabo','The mountain monk’s club. Fills the Ougi fast.',{dmg:2.2,cd:0.46,mag:0.7,gb:1,sm:1.3,price:2600,req:7}),
 // 鉄扇
 W2('gunsen','軍扇','Gunsen','tessen','tessen','War fan. The widest parry window in the ledger.',{dmg:0.75,cd:0.12,mag:1.2,win:0.18,price:900,req:4}),
 W2('oumefan','お梅の扇','Oume’s Fan','tessen','tessen','Plum-painted iron. Ripostes bite.',{dmg:0.8,cd:0.11,mag:1.3,win:0.14,counter:1.35,price:1600,req:9}),
 W2('abbotfan','良善の鉄扇','Abbot’s Tessen','tessen','tessen','Ryōzen’s fan. A perfect parry mends a little.',{dmg:0.7,cd:0.12,mag:1.4,win:0.16,ls:4,unlock:'surv20'}),
 // 短刀
 W2('yoroidoshi','鎧通し','Yoroi-dōshi','tanto','tanto','Armour-piercer. A quarter of stabs ignore guard.',{dmg:0.6,cd:0.07,mag:1.3,crit:2.0,gb:0.25,price:800,req:2}),
 W2('kaiken','懐剣','Kaiken','tanto','tanto','A sleeve dagger. The fastest blade there is.',{dmg:0.5,cd:0.05,mag:1.6,crit:2.4,price:1100,req:5}),
 W2('gamblertanto','博徒の短刀','Gambler’s Tantō','tanto','tanto','Tokubei’s knife. Every duel pays a quarter more.',{dmg:0.58,cd:0.06,mag:1.5,crit:2.6,mon:1.25,price:1500,req:9}),
 // 薙刀
 W2('naginata','薙刀','Naginata','naginata','naginata','Sweeping blade. Reaches past guards a little.',{dmg:1.2,cd:0.2,reach:0.5,wrap:0.15,story:1}),
 W2('bisento','眉尖刀','Bisentō','naginata','naginata','A heavy glaive. Four in ten hits break guard.',{dmg:1.45,cd:0.26,mag:0.9,reach:0.5,gb:0.4,price:1500,req:8}),
 W2('shizuka','静の薙刀','Shizuka’s Naginata','naginata','naginata','Light, long and patient.',{dmg:1.15,cd:0.17,mag:1.2,reach:0.6,win:0.05,price:2000,req:10}),
 // 斧
 W2('ono','鋳物場の大斧','Foundry Ōno','ono','ono','Jūbei’s axe. Splits guards and broken men alike.',{dmg:1.75,cd:0.34,mag:0.9,gb:0.6,crit:1.4,story:1}),
 W2('masakari','鉞','Masakari','ono','ono','A woodsman’s broad axe. Half of hits break guard.',{dmg:1.6,cd:0.3,mag:0.9,gb:0.5,price:1000,req:7}),
 W2('gontaaxe','権太の斧','Gonta’s Bellows-Axe','ono','ono','Iron-Arm’s axe. Nearly every hit breaks guard.',{dmg:1.9,cd:0.36,mag:0.85,gb:0.7,price:1700,req:8}),
];
NEW_WEAPONS.forEach(w=>{V2WEAPONS[w.id]=w;V2ORDER.push(w.id);});
// categorise the originals
Object.assign(V2WEAPONS.katana,{cat:'katana'});Object.assign(V2WEAPONS.kodachi,{cat:'twin'});Object.assign(V2WEAPONS.yari,{cat:'yari'});Object.assign(V2WEAPONS.kusarigama,{cat:'kusari'});
Object.assign(V2WEAPONS.nodachi,{cat:'odachi'});Object.assign(V2WEAPONS.kanabo,{cat:'kanabo'});Object.assign(V2WEAPONS.tessen,{cat:'tessen'});Object.assign(V2WEAPONS.tanto,{cat:'tanto'});
['kodachi','yari','kusarigama','nodachi','kanabo','tessen','tanto'].forEach(k=>{V2WEAPONS[k].story=1;});
Object.assign(WLEN,{ono:64,nagamaki:84});Object.assign(TWO,{ono:1,nagamaki:1});

/* ---------- attire ---------- */
// hat
Object.assign(GEAR.hat,{
 hood:{name:'Zukin Hood',jp:'頭巾',dodge:0.04,mag:1.1,unlock:'shop',price:350,desc:'Dodge window +0.04 s, Foxfire gain +10%'},
 band:{name:'Hachimaki',jp:'鉢巻',win:0.02,cdm:0.97,unlock:'chap3',desc:'+0.02 s parry window, swings 3% faster'},
 hachigane:{name:'Hachigane Plate',jp:'額当て',hp:20,win:0.02,unlock:'shop',price:600,desc:'+20 HP, +0.02 s parry window'},
 fur:{name:'Bear-Fur Cap',jp:'熊皮帽',hp:35,regen:4.5,unlock:'chap4',desc:'+35 HP, block charges refill every 4.5 s'},
 tengai:{name:'Tengai Basket',jp:'天蓋',hp:40,win:0.03,dodge:-0.02,unlock:'chap5',desc:'+40 HP, +0.03 s parry window, dodge -0.02 s'},
 menpo:{name:'Iron Menpō',jp:'面頬',hp:25,dmg:1.04,unlock:'shop',price:900,desc:'+25 HP, +4% damage'},
 eboshi:{name:'Court Eboshi',jp:'烏帽子',mon:1.15,xp:1.1,unlock:'chap7',desc:'Mon +15%, XP +10%'},
 kitsune:{name:'Kitsune Mask',jp:'狐面',mag:1.3,fx:1.2,unlock:'tot:perfect:40',desc:'Foxfire gain +30%, Foxfire damage +20% · 40 perfect parries'},
 oni:{name:'Oni Mask',jp:'鬼面',dmg:1.1,hp:-20,unlock:'surv10',desc:'+10% damage, -20 HP'},
 kabuto2:{name:'Lord’s Kabuto',jp:'大名兜',hp:90,blk:1,cdm:1.08,unlock:'shop',price:1800,req:9,desc:'+90 HP, +1 block, swings 8% slower'},
 shadowhood:{name:'Shadow Cowl',jp:'影の頭巾',dodge:0.06,win:0.03,hp:-15,unlock:'chap11',desc:'Dodge +0.06 s, parry +0.03 s, -15 HP'},
});
// body
Object.assign(GEAR.body,{
 haramaki:{name:'Haramaki Wrap',jp:'腹巻',hp:40,unlock:'shop',price:300,desc:'+40 HP',tint:'#3a2e2a'},
 kusari:{name:'Kusari Shirt',jp:'鎖帷子',hp:50,blk:1,unlock:'shop',price:700,req:2,desc:'+50 HP, +1 block charge',tint:'#4a4e56'},
 shinobi:{name:'Shinobi Shōzoku',jp:'忍装束',dodge:0.08,dmg:0.95,mag:1.2,unlock:'chap8',desc:'Dodge +0.08 s, -5% damage, Foxfire gain +20%',tint:'#1a1a22'},
 monk:{name:'Monk’s Robe',jp:'法衣',regen:3,win:0.02,unlock:'chap5',desc:'Block refills every 3 s, +0.02 s parry window',tint:'#5a4a3a'},
 yukata:{name:'Light Yukata',jp:'浴衣',dodge:0.07,hp:-30,mag:1.3,unlock:'shop',price:250,desc:'Dodge +0.07 s, -30 HP, Foxfire gain +30%',tint:'#3a3a5a'},
 tatami:{name:'Tatami Gusoku',jp:'畳具足',hp:80,dodge:-0.03,cdm:1.03,unlock:'shop',price:1100,req:4,desc:'+80 HP, dodge -0.03 s, swings 3% slower',tint:'#3a3e46',armor:1},
 apron:{name:'Foundry Apron',jp:'鋳物場の前掛け',hp:30,sm:1.15,unlock:'chap9',desc:'+30 HP, Ougi gain +15%',tint:'#4a3a2a'},
 akazonae:{name:'Red Gusoku',jp:'赤備え',hp:100,dmg:1.05,cdm:1.06,dodge:-0.06,unlock:'shop',price:2000,req:8,desc:'+100 HP, +5% damage, swings 6% slower, dodge -0.06 s',tint:'#8a1a1a',armor:1,sode:1},
 nanban:{name:'Nanban Plate',jp:'南蛮胴',hp:150,blk:1,cdm:1.12,dodge:-0.1,unlock:'shop',price:3000,req:10,desc:'+150 HP, +1 block, swings 12% slower, dodge -0.1 s',tint:'#2a2a30',armor:1,sode:1,kote:1},
 yukiarmor:{name:'Shirakawa Weave',jp:'白川の織',hp:30,dodge:0.05,win:0.03,unlock:'tot:dodges:60',desc:'+30 HP, dodge +0.05 s, parry +0.03 s · 60 dodges',tint:'#2a2230'},
 shadowskin:{name:'Shadow Skin',jp:'影の衣',dmg:1.12,fx:1.3,hp:-40,unlock:'ending:shadow',desc:'+12% damage, Foxfire damage +30%, -40 HP',tint:'#0a0a12'},
 ashcoat:{name:'Ash Coat',jp:'灰の衣',hp:60,regen:4,ls:3,unlock:'ending:ash',desc:'+60 HP, block refills every 4 s, perfect parry heals 3',tint:'#5a5650'},
});
// cloak
Object.assign(GEAR.cloak,{
 jinbaori:{name:'Jinbaori',jp:'陣羽織',hp:40,sm:1.1,unlock:'shop',price:600,req:2,desc:'+40 HP, Ougi gain +10%',cape:'jinbaori',capeCol:'#5a1a24'},
 kesa:{name:'Kesa Stole',jp:'袈裟',regen:3,win:0.02,unlock:'chap5',desc:'Block refills every 3 s, +0.02 s parry window',cape:'kesa',capeCol:'#6a4a2a'},
 furcloak:{name:'Fur Cloak',jp:'毛皮の外套',hp:50,dodge:-0.03,unlock:'chap4',desc:'+50 HP, dodge -0.03 s',cape:'fur',capeCol:'#4a3a2a'},
 shirakawa:{name:'Shirakawa Night-Cloth',jp:'白川の夜衣',dodge:0.08,win:0.02,unlock:'chap8',desc:'Dodge +0.08 s, +0.02 s parry window',cape:'travel',capeCol:'#1a1a26'},
 kataginu:{name:'Kataginu',jp:'肩衣',mon:1.15,unlock:'shop',price:500,desc:'Mon +15%',cape:'kataginu',capeCol:'#2a2a3a'},
 redhaori:{name:'Crimson Haori',jp:'紅羽織',dmg:1.06,regen:4.5,unlock:'shop',price:1200,req:6,desc:'+6% damage, block refills every 4.5 s',cape:'haori',capeCol:'#8a1a22'},
 snow:{name:'Snow Cloak',jp:'雪の外套',hp:30,dodge:0.04,unlock:'chap10',desc:'+30 HP, dodge +0.04 s',cape:'travel',capeCol:'#d8d4cc'},
 lordcape:{name:'Lord’s Cape',jp:'大名の外套',hp:60,blk:1,cdm:1.05,unlock:'shop',price:2200,req:9,desc:'+60 HP, +1 block, swings 5% slower',cape:'travel',capeCol:'#2a1a30'},
 tattered:{name:'Tattered Cloak',jp:'襤褸',hp:-20,dmg:1.1,dodge:0.05,unlock:'tensei:5',desc:'-20 HP, +10% damage, dodge +0.05 s · 5 rebirths',cape:'travel',capeCol:'#3a3530'},
 oathcloak:{name:'Oath Cloak',jp:'誓の外套',hp:40,win:0.03,counter:1.15,unlock:'chap12',desc:'+40 HP, +0.03 s parry window, counters +15%',cape:'haori',capeCol:'#1a1a1a'},
});
// charms (new slot)
GEAR.charm={
 none:{name:'No charm',jp:'なし',unlock:'free',desc:'No effect'},
 omamori:{name:'Omamori',jp:'お守り',hp:15,unlock:'shop',price:150,desc:'+15 HP'},
 foxcharm:{name:'Fox Charm',jp:'狐の守り',mag:1.25,unlock:'shop',price:400,desc:'Foxfire gain +25%'},
 bell:{name:'Temple Bell',jp:'鈴',sm:1.2,unlock:'chap5',desc:'Ougi gain +20%'},
 beads:{name:'Prayer Beads',jp:'数珠',ls:3,unlock:'shop',price:700,req:4,desc:'Perfect parry heals 3 HP'},
 ledgerpage:{name:'Ledger Page',jp:'帳の一頁',mon:1.3,xp:1.2,unlock:'chap6',desc:'Mon +30%, XP +20%'},
 coin:{name:'Father’s Coin',jp:'父の銭',start:30,unlock:'chap2',desc:'Start every duel with 30% Ougi'},
 ferry:{name:'Ferry Token',jp:'渡し札',dodge:0.05,unlock:'chap1',desc:'Dodge window +0.05 s'},
 ash:{name:'Pinch of Ash',jp:'一つまみの灰',dmg:1.05,hp:-10,unlock:'surv5',desc:'+5% damage, -10 HP'},
 ribbon:{name:'Yuki’s Ribbon',jp:'雪の紐',win:0.04,unlock:'chap8',desc:'+0.04 s parry window'},
 whetstone:{name:'Tetsu’s Whetstone',jp:'鉄爺の砥石',crit:1.2,dmg:1.03,unlock:'chap7',desc:'+3% damage, x1.2 damage on a broken foe'},
 seal:{name:'Ibuki’s Seal',jp:'伊吹の印',regen:3.5,blk:1,unlock:'chap7',desc:'+1 block, refills every 3.5 s'},
 shardcharm:{name:'Shadow Shard',jp:'影の欠片',fx:1.4,hp:-30,unlock:'chap11',desc:'Foxfire damage +40%, -30 HP'},
 lantern:{name:'Plum Lantern',jp:'梅屋の提灯',sm:1.15,mag:1.15,unlock:'chap10',desc:'Ougi gain +15%, Foxfire gain +15%'},
 heron:{name:'Heron Feather',jp:'鷺の羽',dodge:0.04,win:0.02,unlock:'tot:parries:150',desc:'Dodge +0.04 s, parry +0.02 s · 150 parries'},
 ember:{name:'Kiln Ember',jp:'窯の熾火',counter:1.25,unlock:'tot:wins:40',desc:'Counters +25% · 40 victories'},
};
const GEAR_SLOTS=['hat','body','cloak','charm'];
const SLOT_JP={hat:'被り物',body:'胴',cloak:'羽織',charm:'お守り'};
// extra player hats / cloaks need drawing data: handled in game patches (drawHat/figure overrides)
