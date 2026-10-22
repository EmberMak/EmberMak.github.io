'use strict';
/* ============================================================================
   影ノ誓 — Book Two: 「七つ目の名」 THE SEVENTH NAME
   New foes, chapters 7–12, backgrounds, and every dialogue scene (Book One's
   fight intros are also staged as portrait dialogues). Loaded after game.js.
   ========================================================================== */

/* ---------- new foes (same schema as FOES) ---------- */
Object.assign(FOES,{
 // ch7 Ibuki's Keep
 morikawa:{name:'Morikawa',title:'the Steward',jp:'家令 森川',wpn:'katana',look:{hat:'eboshi',cloak:1},hp:900,dmg:16,aggr:700,pat:PW(3,2,2,1,0,2),blk:.35},
 kinbei:{name:'Kinbei',title:'the Door',jp:'戸の金兵衛',wpn:'nodachi',look:{hat:'jingasa',armor:1,bulk:1.2},hp:1150,dmg:22,aggr:800,pat:PW(3,1,1,2,2,1),blk:.3},
 sadayoshi:{name:'Ibuki Sadayoshi',title:'the Heir',jp:'伊吹貞義',wpn:'katana',look:{hat:'kabuto',armor:1,cloak:1},hp:1500,dmg:19,aggr:650,pat:PW(3,4,3,2,1,3),blk:.4,boss:1},
 // ch8 Salt Road
 tollman:{name:'Salt Toll-Man',jp:'塩の関守',wpn:'yari',look:{hat:'jingasa'},hp:820,dmg:15,aggr:800,pat:PW(3,2,1,1,0,1),blk:.25,minor:1},
 rokuro:{name:'Rokurō',title:'the Hired Blade',jp:'雇われ 六郎',wpn:'katana',look:{hat:'kasa',cloak:1},hp:1100,dmg:18,aggr:600,pat:PW(3,3,3,1,1,2),blk:.3},
 oiwa:{name:'Oiwa',title:'of the Shirakawa',jp:'白川の お岩',wpn:'kodachi',look:{hat:'kunoichi',cloak:1,tall:0.95},hp:1200,dmg:13,aggr:520,pat:PW(2,5,4,0,1,1),blk:.25},
 kurodo:{name:'Kurōdo',title:'the Mountain Monk',jp:'山法師 蔵人',wpn:'kanabo',look:{hat:'shaven',bulk:1.4,cloak:1},hp:1800,dmg:27,aggr:900,pat:PW(3,1,2,3,3,1),blk:.25,boss:1},
 // ch9 Kanazawa Foundry
 hammerman:{name:'Foundry Hammer',jp:'鋳物場の槌打ち',wpn:'kanabo',look:{hat:'band',bulk:1.25},hp:1000,dmg:20,aggr:1000,pat:PW(3,0,1,2,1,0),blk:.15,minor:1},
 gonta:{name:'Iron-Arm Gonta',title:'the Bellows',jp:'鉄腕 権太',wpn:'ono',look:{hat:'band',bulk:1.3},hp:1400,dmg:24,aggr:850,pat:PW(3,2,1,2,2,0),blk:.2},
 mcaptain:{name:'Captain Nagai',title:'of the Musket Line',jp:'鉄砲組頭 永井',wpn:'yari',look:{hat:'jingasa',armor:1},hp:1350,dmg:18,aggr:720,pat:PW(3,3,2,2,1,3),blk:.4},
 jubei:{name:'Kanazawa Jūbei',title:'the Foundry Master',jp:'鋳物師 十兵衛',wpn:'ono',look:{hat:'band',bulk:1.25,armor:1},hp:2100,dmg:26,aggr:800,pat:PW(3,2,2,3,2,2),blk:.3,boss:1},
 // ch10 Floating World
 bouncer:{name:'Plum House Bouncer',jp:'梅屋の用心棒',wpn:'kanabo',look:{hat:'topknot',bulk:1.3},hp:1100,dmg:20,aggr:950,pat:PW(3,1,1,2,1,0),blk:.2,minor:1},
 tokuzo:{name:'Tokuzō',title:"the Gambler's Brother",jp:'博徒 徳蔵',wpn:'tanto',look:{hat:'topknot',cloak:1},hp:1250,dmg:14,aggr:500,pat:PW(2,5,4,0,0,1),blk:.25},
 yojimbo:{name:'The Two Yōjimbō',title:'of Plum Lane',jp:'梅小路の用心棒',wpn:'nagamaki',look:{hat:'kasa',cloak:1},hp:1500,dmg:21,aggr:700,pat:PW(3,3,2,2,1,2),blk:.3},
 kichi:{name:'Blind Kichi',title:'Champion of the Lanterns',jp:'盲目の吉',wpn:'katana',look:{hat:'band',cloak:1},hp:2300,dmg:22,aggr:560,pat:PW(2,4,5,2,2,3),blk:.45,boss:1},
 // ch11 Hakusan Shrine
 shira1:{name:'Shirakawa Shadow',jp:'白川の影',wpn:'kodachi',look:{hat:'kunoichi',cloak:1,tall:0.95},hp:1300,dmg:15,aggr:520,pat:PW(2,5,3,0,1,1),blk:.25,minor:1},
 shira2:{name:'Shirakawa Chain',jp:'白川の鎖',wpn:'kusarigama',look:{hat:'mask',cloak:1},hp:1500,dmg:17,aggr:620,pat:PW(2,3,3,2,2,1),blk:.3},
 yamabushi:{name:'Yamabushi Dōkai',title:'the Ascetic',jp:'山伏 道海',wpn:'naginata',look:{hat:'tengai',cloak:1,tall:1.05},hp:1800,dmg:21,aggr:650,pat:PW(3,3,2,2,2,2),blk:.35},
 shadow:{name:'The Shadow',title:'the Oath Itself',jp:'影',wpn:'katana',look:{hat:'player',cloak:1,tall:1.02},hp:2800,dmg:22,aggr:450,pat:PW(3,4,4,3,3,4),blk:.5,boss:1},
 // ch12 End of Winter
 retainer:{name:'Retainer Hanzō',jp:'家臣 半蔵',wpn:'yari',look:{hat:'kabuto',armor:1},hp:1700,dmg:21,aggr:720,pat:PW(3,3,2,2,1,3),blk:.4,minor:1},
 oiwa2:{name:'Oiwa',title:'Unbound',jp:'お岩',wpn:'kodachi',look:{hat:'kunoichi',cloak:1,tall:0.95},hp:2000,dmg:17,aggr:480,pat:PW(2,5,5,1,2,2),blk:.3},
 sadayoshi2:{name:'Ibuki Sadayoshi',title:'Lord of Kitanosaki',jp:'北崎城主 伊吹貞義',wpn:'nodachi',look:{hat:'kabuto',armor:1,cloak:1,tall:1.08},hp:3200,dmg:25,aggr:520,pat:PW(3,4,3,3,3,4),blk:.45,boss:1},
});
Object.assign(KIND,{ono:'ono',nagamaki:'nagamaki',naginata:'naginata'});
Object.assign(HATMAP,{eboshi:'eboshi',kunoichi:'kunoichi',tengai:'tengai',player:'player'});
// attack sets for the new weapon kinds
Object.assign(ATKSET,{
 ono:{s:[['Ono-otoshi','斧落とし',2,1.7,50],['Yoko-wari','横割り',4,1.6,46],['Kiri-age','切り上げ',5,1.5,44]],
  u:[['Ne-giri','根斬り',4,1.9,70,{unblock:true,dg:'jump'}]],f:[['Mikazuki','三日月',3,1.8,48,{feint:{at:0.7,dir:5}}]]},
 nagamaki:{s:[['Nagi-giri','薙ぎ斬り',4,1.4,38],['Kabuto-wari','兜割り',2,1.45,40],['Tsuki-giri','突き斬り',3,1.35,36],['Kaeshi','返し',5,1.3,34]],
  u:[['Jūmonji','十文字',2,1.85,60,{unblock:true,dg:'back'}]],f:[['Kasumi','霞',7,1.65,38,{feint:{at:0.7,dir:3}}]]},
 naginata:{s:[['Harai','払い',4,1.25,34],['Sōtō','双頭',3,1.3,36],['Ashi-nagi','足薙ぎ',1,1.2,32],['Kachi-age','かち上げ',5,1.25,34]],
  u:[['Kaze-maki','風巻き',4,1.7,56,{unblock:true,dg:'jump'}]],f:[['Tsubame-gaeshi','燕返し',7,1.6,36,{feint:{at:0.72,dir:2}}]]},
});

/* ---------- Book Two chapters ---------- */
const CHAPTERS2=[
 {id:7,name:'Ibuki’s Keep',jp:'伊吹の居館',book:2,bg:'keep',
  intro:'A letter sealed in black wax. The widow of the Sixth Name asks for the man who made her one.',
  fights:[
   ['morikawa','“My lady receives you. I do not.”','The steward kept the keys for thirty years. He keeps them still.'],
   ['kinbei','“Nothing passes this door that my lady has not asked for.”','…'],
   ['sadayoshi','“You killed my father in his own hall. Try it in mine.”','I did not strike the last blow. He is alive. The ledger is not his.']],
  reward:'nagamaki'},
 {id:8,name:'The Salt Road South',jp:'塩の道',book:2,bg:'road',
  intro:'Rain for nine days. Yuki walks ahead and does not look back. She has learned that from somewhere.',
  fights:[
   ['tollman','“Toll is doubled for those travelling with weapons. Trebled for those travelling with her.”','…'],
   ['rokuro','“Someone in the south paid for your head. I only asked which road.”','He named no one. He did not need to.'],
   ['oiwa','“Sister. The clan does not sell what it owns. Come back, and he may live.”','She did not fight to win. She fought to be seen.'],
   ['kurodo','“The foundry pays me in rice and the mountain pays me in silence. Which will you offer?”','Neither.']],
  reward:'naginata'},
 {id:9,name:'Kanazawa Foundry',jp:'金沢の鋳物場',book:2,bg:'foundry',
  intro:'The foundry never cools. It ate my father’s charcoal for twenty years, and then it ate the boys who shovelled it.',
  fights:[
   ['hammerman','“No one leaves the yard during a pour!”','…'],
   ['gonta','“I pumped the bellows the winter your kilns stopped sending. Twelve boys froze at the line.”','He did not say it to wound me. He said it because it was true.'],
   ['mcaptain','“The powder in these barrels is the province’s future. You are its past.”','…'],
   ['jubei','“I know your crest. I countersigned it. Ask me why before you kill me.”','I asked.']],
  reward:'ono'},
 {id:10,name:'The Floating World',jp:'浮世',book:2,bg:'ukiyo',
  intro:'Snow on red lanterns. The Plum House keeps every letter it was ever paid to burn.',
  fights:[
   ['bouncer','“Blades check at the door. Yours, the house would like to keep.”','…'],
   ['tokuzo','“My brother wagered you would not leave Hakuba. I wagered you would not leave at all.”','He paid the house in full.'],
   ['yojimbo','“Two of us. One of you. The arithmetic is the house’s.”','The house miscounted.'],
   ['kichi','“I hear it in your feet, charcoal-boy. You are tired of this.”','He was right. I did it anyway.']],
  reward:'kichi'},
 {id:11,name:'Hakusan Shrine',jp:'白山の社',book:2,bg:'shrine',
  intro:'The family grave is on the mountain. My uncle went up to it in the snow, alone, without a sword.',
  fights:[
   ['shira1','(The clan does not speak before it strikes.)','…'],
   ['shira2','“The elder says: the girl was bought fairly. Fair is fair.”','Fair is a word for ledgers.'],
   ['yamabushi','“The mountain does not care who was wronged. Climb if you can.”','I climbed.'],
   ['shadow','“You swore to me in the woodshed. Six names. Seven. I will not be left unfinished.”','']],
  reward:'yukikaze'},
 {id:12,name:'End of Winter',jp:'冬の終わり',book:2,bg:'spring',
  intro:'Spring came late. So did the heir of Kitanosaki, with a new sword and an old question.',
  fights:[
   ['retainer','“My lord asks that you come out. He will not burn the house. He has read your ledger.”','…'],
   ['oiwa2','“No clan now. No elder. I came to see how it ends.”','She bowed first. I have never been bowed to.'],
   ['sadayoshi2','“One of us has to stop. Make it me, or make it you.”','']],
  reward:'chikai'},
];
const EPILOGUE_B2={
 shadow:['The seventh name is struck through.','The ledger has no more names. It has no more pages.','In spring the kilns at Kurosawa were lit by a man no one in the village would look at.','They burned clean. They always burn clean.','— 終 —'],
 ash:['The ledger is ash. I let it be ash.','Genpachi rebuilt the village houses first and the kilns last. He did not ask forgiveness and I did not offer it.','Yuki stayed. The Shirakawa did not come for her again.','In spring we fired three kilns. The smoke went straight up, the way it does when the wind has nothing left to say.','— 終 —'],
 final:['Sadayoshi went home to his castle with his father’s sword and left mine in my hands.','There are two kilns at Kurosawa now, and a girl on the ferry who does not charge me.','I still keep the ledger. It is only a book.','— 終 —'],
};

/* ---------- dialogue scripts ---------- */
const K=(mood,text)=>({who:'kage',mood,text});
const N=t=>({narr:t});
const DL={
 prologue:[
  {title:'影ノ誓',sub:'KAGE NO CHIKAI · Oath of the Shadow'},
  N('Hokuroku. The far north. Winter does not end here. It rests.'),
  N('Nine winters ago, six men came to the kilns at Kurosawa. My father sold them charcoal.'),
  N('They paid by writing their names in his ledger. Then they barred the door and lit the house.'),
  N('I was in the woodshed. The snow kept me alive. The ledger, I pulled from the ashes.'),
  {who:'father',mood:'calm',text:'Count twice, Kage. Every coin. Every name. A man who counts is never cheated.'},
  K('grim','Six names. I have learned to read them.'),
 ],
 // Book One: short exchanges before each fight (enemy quote comes from the chapter data)
 b1:{
  ronin:[K('calm','Open the ferry.')],gonzo:[K('neutral','I did not come for the water.')],ikkaku:[K('grim','Everyone pays. Today, you.')],
  kamata:[K('angry','You remember the price. I remember the door.')],
  scav:[K('calm','There was. Once.')],hachi:[K('neutral','Dengo was wrong.')],senkichi:[],onishi:[K('angry','He haggled because he had children to feed.')],
  thug:[],tokubei:[K('calm','I do not gamble.')],kyuzo:[K('neutral','He wrote it down. Ask him.')],mibu:[K('grim','You hung the wrong men for nine years.')],
  mbandit:[K('calm','I am crossing.')],koda:[],tamon:[K('neutral','I watch everything. It is all I have done since.')],goro:[K('angry','Heavy. Yes. I carried my father out of what was left.')],
  tguard:[K('calm','I am not armed. I am a blade.')],jikkai:[K('neutral','It is not mine to give.')],komei:[K('calm','Let it.')],ryozen:[K('grim','Pray for the sixth. He will need it.')],
  ashigaru:[],sakuma:[K('neutral','He will.')],ibuki:[K('angry','Then buy it back from me.')],
 },
 // Book Two
 b2open:[
  {title:'第二巻 ・ 七つ目の名',sub:'BOOK TWO · The Seventh Name'},
  N('Spring. The kiln burned clean for three days. On the fourth, a woman stood at the edge of the clearing with snow still on her shoulders.'),
  {who:'yuki',mood:'neutral',text:'You fire it too hot. Father would have thrown a bucket at you.'},
  K('surprised','…Yuki.'),
  {who:'yuki',mood:'calm',text:'The roof hatch. I went up while you went down. Men on the road took me south before dawn. I have been a long time coming back.'},
  K('sad','I counted you with the dead. For nine years.'),
  {who:'yuki',mood:'grim',text:'Count again. You are good at that. Show me the ledger.'},
  N('She turned the burnt page to the light. In the scorched margin, under the six names, there was a seventh mark. Not a name. A seal.'),
  {who:'yuki',mood:'angry',text:'Three charcoal sticks in a ring. Our crest, Kage. Someone with our own seal told those men where the kilns were, and paid them.'},
  K('angry','Only two men ever carried that seal. Father. And Uncle Genpachi, who manages the kiln lands now, for the castle.'),
  {who:'tetsu',mood:'grim',text:'Put that blade down a moment and listen to an old man. I have re-set that edge nine times. A sword that hunts its own house cuts both ways. Every time.'},
  K('grim','Then I will count the cuts.'),
  {who:'yuki',mood:'neutral',text:'The Sixth Name kept letters. His widow kept the Sixth Name. Start at the keep.'},
 ],
 ch7:{
  open:[
   {who:'ladyibuki',mood:'calm',text:'You are smaller than the story. The story has you ten feet tall and made of smoke.'},
   K('neutral','I am made of charcoal, my lady. It is cheaper.'),
   {who:'ladyibuki',mood:'neutral',text:'My husband kept every order he ever received, because he trusted no one who gave them. The one you want is here. You will not be handed it.'},
   {who:'ladyibuki',mood:'grim',text:'My household will test you. If you are only a killer, they will kill you, and I will have lost nothing. If you are something else, I will know by the end.'},
  ],
  fights:[
   [{who:'morikawa',mood:'grim',text:'Thirty years I have kept this door. I was keeping it the night your village burned, and I did not know. I am keeping it now, and I do.'},K('calm','Then open it.')],
   [{who:'kinbei',mood:'angry',text:'The boy is behind me. You will not reach him without reaching through me.'}],
   [{who:'sadayoshi',mood:'angry',text:'I was twelve. I heard it from the stairs. Do you know what a father sounds like, dying?'},K('grim','Yes.'),{who:'sadayoshi',mood:'shout',text:'Then you know why I cannot let you leave!'}],
  ],
  close:[
   N('The heir of Kitanosaki lay on the boards with his sword three feet away and his eyes open. I did not close them. I let him keep them.'),
   K('calm','Your father is dead. The man who killed him is standing here. Those are the only two facts you have. Build on them, not on me.'),
   {who:'sadayoshi',mood:'pain',text:'…Get out of my house.'},
   {who:'ladyibuki',mood:'neutral',text:'A killer would have finished it. You are the other thing. Here.'},
   N('A letter. The magistrate’s office, nine winters ago. “The Kurosawa kilns are released to the Kanazawa foundry by order of the house. Resistance from the burner is to be answered.” Sealed with three charcoal sticks in a ring.'),
   {who:'ladyibuki',mood:'sad',text:'Your father stopped delivering charcoal to the foundry the winter the furnace burst. Twelve boys at the bellows. He would not sell another sack for powder. Someone with your seal sold it for him.'},
   K('grim','The foundry.'),
   {who:'ladyibuki',mood:'calm',text:'South, past the salt road. Take the long way, charcoal-burner. The short way is mine, and I have not forgiven you.'},
  ]},
 ch8:{
  open:[
   N('Nine days of rain. The salt road runs along the coast where the carts have worn the stone into two black grooves.'),
   {who:'yuki',mood:'calm',text:'You walk like him. Father. Heel first, like the ground owes you money.'},
   K('smile','You talk like Mother.'),
   {who:'yuki',mood:'sad',text:'I do not remember how she talked. I remember a song about a fox and a lantern. That is all I kept.'},
   {who:'tetsu',mood:'neutral',text:'I will wait at the pass inn. Bring the blade back with something left on it, or do not bring it back at all.'},
  ],
  fights:[
   [{who:'tollman',mood:'sly',text:'The clan has a bounty on the woman and the foundry has one on you. I am only a toll-man. I collect.'}],
   [{who:'rokuro',mood:'calm',text:'Nothing personal. A purse came north with your description. Black kimono, straw hat, counts under his breath.'},K('grim','Who sent the purse?'),{who:'rokuro',mood:'smirk',text:'The purse did not say. Purses never do.'}],
   [{who:'oiwa',mood:'neutral',text:'Yuki. Sister. The elder is patient but he is not kind. Come back and the burner lives.'},{who:'yuki',mood:'angry',text:'I was not given to the Shirakawa, Oiwa. I was sold. Tell him I know the price now.'},K('angry','Sold. By whom?'),{who:'oiwa',mood:'grim',text:'Ask the man with your face, burner. Not me.'}],
   [{who:'kurodo',mood:'laugh',text:'Ha! The foundry sends me rice to hold this pass. The mountain gives me silence to keep it. You have brought neither!'},K('calm','I have brought a question.'),{who:'kurodo',mood:'shout',text:'Then ask it with steel!'}],
  ],
  close:[
   N('The monk sat down in the mud when it was over and laughed until he coughed.'),
   {who:'kurodo',mood:'smile',text:'Go on, then. Down the pass, follow the smoke. You cannot miss the foundry. Nothing else there is still burning.'},
   {who:'yuki',mood:'sad',text:'He sold me, Kage. Our uncle. Oiwa does not lie; the clan beats it out of them young. I was the price of something.'},
   K('grim','Then we will find out what he bought.'),
  ]},
 ch9:{
  open:[
   N('Smoke you can taste. The foundry at Kanazawa sits in a black bowl of its own slag, and the furnace has not been cold since my father was a boy.'),
   {who:'jubei',mood:'neutral',text:'Kurosawa charcoal. I would know it in the dark. Burns hotter and longer than anything in the province. Your father was an artist. He was also a fool.'},
   K('angry','He stopped selling to you.'),
   {who:'jubei',mood:'grim',text:'After the furnace burst, yes. Twelve boys. He came down here and looked at them and went home and never sent another sack. The lord did not take it well.'},
   {who:'jubei',mood:'calm',text:'Come through the yard if you want the rest of it. My men will not let you. That is what I pay them for.'},
  ],
  fights:[
   [{who:'hammerman',mood:'shout',text:'The pour is on! Nobody crosses the yard during a pour!'}],
   [{who:'gonta',mood:'grim',text:'I pumped the bellows the winter your kilns stopped. The line froze. I buried two of them myself. I do not hate you, burner. I only want you to know.'},K('sad','I know.')],
   [{who:'mcaptain',mood:'angry',text:'Three hundred muskets by summer. That is the lord’s order. Your family’s charcoal was the difference between a province and a graveyard.'},K('grim','It was both.')],
   [{who:'jubei',mood:'calm',text:'I countersigned the order. I knew what “answered” meant. Ask me why before you kill me, boy. You will not get a second chance to.'},K('angry','Why.'),{who:'jubei',mood:'grim',text:'Because the lord gave your uncle a choice. The burner’s house, or the whole village. Two hundred souls. He chose six names and one house. I would have chosen the same.'}],
  ],
  close:[
   N('He was still breathing when he showed me the second letter. In a careful hand, the hand of a man who manages ledgers: “I release my brother’s kilns. Spare Kurosawa. Spare the girl.” Signed Genpachi.'),
   K('pain','Spare the girl. He wrote that.'),
   {who:'jubei',mood:'pain',text:'Then the lord sold her anyway, to the Shirakawa, for their silence. Your uncle did not know until after. He went white. I have never seen a man go so white.'},
   {who:'yuki',mood:'angry',text:'He signed us away to save strangers. Do not ask me to call that mercy.'},
   K('grim','I am not asking. I am counting. There is one letter left: the one he sent to the magistrate. Tokubei’s people kept the magistrate’s letters.'),
   {who:'yuki',mood:'calm',text:'Then we go to the Floating World. Wear something that is not black.'},
  ]},
 ch10:{
  open:[
   N('Hakuba at night, in snow. Red lanterns down every lane, and under them the Plum House, where Tokubei once lost a street and won a magistrate.'),
   {who:'oume',mood:'smirk',text:'The charcoal-burner. You are famous, you know. They sing about you in the kitchens. The tune is terrible.'},
   K('neutral','I want the magistrate’s letters.'),
   {who:'oume',mood:'sly',text:'Everyone wants the magistrate’s letters. The house keeps what it was paid to burn, and it does not give. It is won. Four lanterns, four duels. Win the last and I will read you anything you like.'},
   {who:'yuki',mood:'grim',text:'And if he loses?'},
   {who:'oume',mood:'smile',text:'Then the song gets a last verse. The kitchens will be thrilled.'},
  ],
  fights:[
   [{who:'bouncer',mood:'angry',text:'Blades check at the door. The house would like to keep yours.'}],
   [{who:'tokuzo',mood:'smirk',text:'Tokubei was my brother. He said you would never leave Hakuba. I bet against him. I bet you would never leave at all.'},K('calm','Then you have already lost once.')],
   [{who:'yojimbo',mood:'calm',text:'Two of us. One of you. The house likes its arithmetic.'},K('grim','So did my father.')],
   [{who:'kichi',mood:'calm',text:'Charcoal-boy. I hear it in your feet. You are tired. You have been tired since the ferry.'},K('sad','…Yes.'),{who:'kichi',mood:'smile',text:'Good. Tired men fight honestly. Come.'}],
  ],
  close:[
   N('Kichi sat against the lantern post with his sword across his knees and told me I had a good left and no right at all. Then he told the house to pay.'),
   {who:'oume',mood:'neutral',text:'A promise is a promise. The magistrate’s letters. Here is your uncle’s, to Mibu, nine winters ago.'},
   N('“Honoured Magistrate. I have signed what the lord required. I ask only what was agreed: the village untouched, and my niece left with the village. If the house must burn, let me be the one to tell my brother. Do not let strangers do it.” They did not let him.'),
   {who:'oume',mood:'sad',text:'He went to the kilns that night to warn your father. The six were already there. Mibu had moved the date. Your uncle watched it from the tree line, I am told, and did nothing, because there was nothing. That is the letter. That is all of it.'},
   {who:'yuki',mood:'pain',text:'He watched.'},
   K('grim','He watched, and then he managed the land for nine years and let me hunt six men and never once said my name.'),
   {who:'oume',mood:'calm',text:'He went up Hakusan three days ago, to your family grave. Without a sword. The Shirakawa went up after him. I think he is waiting for you, burner. I think he has been waiting a long time.'},
  ]},
 ch11:{
  open:[
   N('Hakusan in the last snow of the year. Stone lanterns up the mountain path, unlit. My uncle’s footprints in the snow, one set, not hurrying.'),
   {who:'yuki',mood:'grim',text:'The clan is on the mountain. They will not let him speak. A sold thing that talks is a thing that was stolen.'},
   K('calm','Then we cut a path.'),
   {who:'tetsu',mood:'sad',text:'Kage. I re-set the edge one last time. There is nothing left of the old steel. Whatever you do at the top, it will be with a new blade. Remember that.'},
  ],
  fights:[
   [],
   [{who:'shira2',mood:'neutral',text:'The elder says the girl was bought fairly. Fair is fair.'},{who:'yuki',mood:'angry',text:'Then come and collect.'}],
   [{who:'yamabushi',mood:'calm',text:'The mountain does not care who was wronged. It cares who can climb. Can you?'}],
   [N('At the top, in front of the grave, there was no one. My uncle’s footprints went on past it into the snow. And something stood up out of my own shadow and drew my own sword.'),
    {who:'shadow',mood:'neutral',text:'You swore to me in the woodshed. “Every name.” Six are struck. There is a seventh. I will not be left unfinished.'},
    K('angry','You are not my father.'),
    {who:'shadow',mood:'grim',text:'No. I am what you made of him. Strike me down and I will be waiting under your feet. Or let me finish, and rest.'}],
  ],
  close:[
   N('When it was done there was only one shadow on the snow, and it was mine, and it was lying down.'),
   N('Genpachi was kneeling at the grave with his hands open on his knees. He did not get up. He did not turn around.'),
   {who:'genpachi',mood:'sad',text:'I counted, too. Two hundred and twelve in the village. Three in your house. I did the arithmetic and I signed it. Then I went to warn him and I was late, and I watched, and I have been watching ever since.'},
   {who:'genpachi',mood:'pain',text:'They promised me Yuki would stay with the village. I believed a lord. That is the whole of my crime and the whole of my excuse. I have no other.'},
   {who:'yuki',mood:'angry',text:'Say my name again and I will cut it out of you.'},
   {who:'genpachi',mood:'calm',text:'The ledger is yours, Kage. Your father’s. Mine is the seventh name. I have come to be struck through. Do it, or do not. I will not run from either.'},
   {choice:[
    {t:'斬る · Strike. Seven.',fn:()=>{SV.ending='shadow';save();},next:[
      N('One cut. I did not count it.'),
      {who:'yuki',mood:'sad',text:'That was the oath, then. The whole of it. I thought there would be more.'},
      K('grim','There is nothing more. There was never anything more.'),
      {who:'yuki',mood:'calm',text:'Then I will go south, Kage. Not with the clan. Just south. Do not follow me. You would only count the steps.'},
      N('She went down the mountain alone. The snow filled her footprints before I had finished reading the grave.')]},
    {t:'納める · Sheathe. The ledger is ash.',fn:()=>{SV.ending='ash';save();},next:[
      N('I put the sword away. It took longer than drawing it ever had.'),
      K('calm','Two hundred and twelve. You did the arithmetic. Now do the work. Rebuild the village. Rebuild the kilns last. And never manage anything of mine again.'),
      {who:'genpachi',mood:'pain',text:'…Yes.'},
      {who:'yuki',mood:'angry',text:'Kage. He sold me.'},
      K('sad','He did. And the lord sold you again, and the clan bought you, and the magistrate moved the date, and six men lit the house. I have struck six. I am done, Yuki. The ledger is ash. Let it be ash.'),
      {who:'yuki',mood:'sad',text:'…I do not forgive him.'},
      K('calm','No one asked you to. Come home.'),
      N('She came down the mountain beside me. We did not speak. We did not need to count.')]},
   ]},
  ]},
 ch12:{
  open:[
   N('Spring came late, and with it a column of banners on the ferry road. The heir of Kitanosaki, with a new sword, and his father’s question.'),
   {who:'sadayoshi',mood:'calm',text:'I read your ledger, charcoal-burner. All of it. Lady Ibuki had it copied. I know about the seventh name. I know what you did on the mountain.'},
   K('neutral','Then you know I am finished.'),
   {who:'sadayoshi',mood:'grim',text:'I know you think you are. A boy heard his father die on the stairs. Tell me how he finishes.'},
  ],
  fights:[
   [{who:'retainer',mood:'neutral',text:'My lord asks that you come out. He will not burn the house. He has read the ledger. He only wants it answered.'}],
   [{who:'oiwa2',mood:'calm',text:'No clan now. No elder. He was not kind, but he was old, and the mountain was cold. I came to see how your story ends, burner. I have never seen one end.'},{who:'yuki',mood:'neutral',text:'Then watch, sister.'}],
   [{who:'sadayoshi',mood:'angry',text:'One of us has to stop. One of us has to put the sword down and stay down. Make it me, or make it you.'},K('calm','I have already stopped. You are the one still counting.'),{who:'sadayoshi',mood:'shout',text:'Then show me how!'}],
  ],
  close:[
   N('He lay in the spring mud and looked at the sky for a long time. Then he sat up and asked for his father’s sword, and I gave it to him hilt first.'),
   {who:'sadayoshi',mood:'sad',text:'My father bought a province with your house. I inherited the province. What do I do with that?'},
   K('calm','Run it. Run the ferry without a toll. Rebuild the foundry so it makes bells. Let the boys who shovel charcoal grow old. That is what you do with it.'),
   {who:'sadayoshi',mood:'calm',text:'…And you?'},
   K('smile','I burn charcoal. It is cheaper than smoke.'),
   {who:'oiwa2',mood:'smile',text:'That is how it ends? Nobody dies?'},
   {who:'yuki',mood:'smile',text:'Somebody always dies, Oiwa. Today it is only winter.'},
  ]},
};
