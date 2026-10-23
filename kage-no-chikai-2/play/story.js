'use strict';
/* ============================================================================
   STORY — Kage no Chikai 2: the Shadow's Vow.
   Part One  · 影の誓い  — Kage, body double of Lord Satō of Kyō, must kill the
               Eight Eagles and Shōgun Iki to buy his family's freedom.
   Part Two  · 天下統一  — the secret map, the sea shrines, eight clans, one Japan.
   Engine: linear quest STEPS, a cutscene player (CUT), guiding-wind targets,
   story NPC placement, generic NPC talk.
   ========================================================================== */
const CUT={on:false,q:[],t:0,cur:null,fade:0,fadeDir:0,camLock:null,letter:0,done:null,skipR:null};
/* ---------- cutscene player ---------- */
function cutPlay(cmds,done){CUT.on=true;CUT.q=cmds.slice();CUT.cur=null;CUT.done=done||null;CUT.letter=0;inputMode='ui';BTN_DEFS.length=0;}
function cutNext(){CUT.cur=CUT.q.shift()||null;CUT.t=0;if(!CUT.cur){CUT.on=false;CUT.camLock=null;CUT.letter=0;inputMode='world';if(window.worldButtons)worldButtons();const d=CUT.done;CUT.done=null;if(d)d();if(!CUT.on&&SCENE.cur==='world'&&window.ambientMusic)ambientMusic(true);return;}
 const c=CUT.cur;
 if(c.dlg){DLG.start(c.dlg,()=>{CUT.cur=null;cutNext();},{style:DLSTYLE});}
 else if(c.fx==='flash'){FX.flash(W/2,H/2,0,W,'#fff',H,0.4);}
 else if(c.shake){CAM.shake=c.shake;}
 else if(c.hap){hap(c.hap);}
 else if(c.sfx){try{if(c.sfx==='taiko')taiko(0.8,50);else if(c.sfx==='squelch')squelch(0.7);else if(c.sfx==='crack')crack(0.7);else if(c.sfx==='thud')thud(0.7);else if(c.sfx==='chime')chime(880,0.15,2);else if(c.sfx==='steel')steel(0.4);else play(c.sfx,1);}catch(e){}}
 else if(c.music){MUSIC2.play(c.music,{fallback:c.fallback||['duel']});}
 else if(c.spawn){const n=placeStoryNpc(c.spawn.id,c.spawn.char,c.spawn.x,c.spawn.y,c.spawn.o||{});n.state='cut';if(c.spawn.dir!=null)n.dir=c.spawn.dir;}
 else if(c.remove){const n=NPC_BY_ID.get(c.remove);if(n){const i=NPCS.indexOf(n);if(i>=0)NPCS.splice(i,1);NPC_BY_ID.delete(c.remove);}}
 else if(c.kill){const n=NPC_BY_ID.get(c.kill);if(n){n.dead=true;n.deadT=0;n.state='idle';n.fallDir=c.dir||0;bloodBurst(n.x,n.y);}}
 else if(c.face){const n=NPC_BY_ID.get(c.face);if(n)n.dir=c.dir;}
 else if(c.pose){const n=NPC_BY_ID.get(c.pose);if(n){n.cutFrame=c.frame;}}
 else if(c.set){Object.assign(S.flags,c.set);}
 else if(c.fn){try{c.fn();}catch(e){reportError(e);}}
 else if(c.teleport){PL.x=c.teleport.x;PL.y=c.teleport.y;CAM.x=PL.x-W/2;CAM.y=PL.y-H/2;CAM.tx=CAM.x;CAM.ty=CAM.y;if(S.horse){HORSE.x=PL.x+16;HORSE.y=PL.y;}}
 else if(c.letter!=null){CUT.letter=c.letter;}
 // commands with duration: move / cam / wait / fade continue in cutUpdate
 if(!c.dlg&&!c.move&&!c.cam&&!c.wait&&!c.fade&&!c.walkPlayer)cutNext();}
function cutUpdate(dt){if(!CUT.on)return;if(!CUT.cur){cutNext();return;}const c=CUT.cur;CUT.t+=dt;
 if(c.dlg){DLG.update(dt);return;}
 if(c.wait){if(CUT.t>=c.wait)cutNext();return;}
 if(c.fade){const dur=c.dur||0.6;CUT.fade=c.fade==='out'?Math.min(1,CUT.t/dur):Math.max(0,1-CUT.t/dur);if(CUT.t>=dur)cutNext();return;}
 if(c.move){const n=NPC_BY_ID.get(c.move);if(!n){cutNext();return;}n.state='cut';const dx=c.to.x-n.x,dy=c.to.y-n.y,d=Math.hypot(dx,dy);const sp=(c.speed||40)*dt;
  if(d<=sp||CUT.t>8){n.x=c.to.x;n.y=c.to.y;n.frame=0;if(c.dir!=null)n.dir=c.dir;cutNext();return;}n.x+=dx/d*sp;n.y+=dy/d*sp;n.dir=dir4(dx,dy);n.animT+=dt*6;n.frame=Math.floor(n.animT)%4;return;}
 if(c.walkPlayer){const dx=c.to.x-PL.x,dy=c.to.y-PL.y,d=Math.hypot(dx,dy);const sp=(c.speed||48)*dt;if(d<=sp||CUT.t>8){PL.x=c.to.x;PL.y=c.to.y;PL.frame=0;if(c.dir!=null)PL.dir=c.dir;cutNext();return;}PL.x+=dx/d*sp;PL.y+=dy/d*sp;PL.dir=dir4(dx,dy);PL.animT+=dt*7;PL.frame=Math.floor(PL.animT)%4;return;}
 if(c.cam){const tx=c.cam.x-W/2,ty=c.cam.y-H/2;const k=1-Math.pow(0.002,dt);CAM.x+=(tx-CAM.x)*k;CAM.y+=(ty-CAM.y)*k;CUT.camLock={x:c.cam.x,y:c.cam.y};if(Math.hypot(tx-CAM.x,ty-CAM.y)<2||CUT.t>(c.dur||2.5))cutNext();return;}}
function bloodBurst(x,y){for(let i=0;i<24;i++){const a=Math.random()*TAU,v=rndf(10,60);WORLD_FX.push({x,y:y-8,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,t:0,l:rndf(0.4,0.9),col:i%3?'#c41b26':'#8e1119',g:140});}WORLD_DECALS.push({x,y,r:6+Math.random()*4,col:'rgba(120,10,16,.8)'});}
const WORLD_FX=[],WORLD_DECALS=[];
/* ---------- dialogue style ---------- */
const DLSTYLE={hero:'kage',get chars(){return CHARS},font,bar:'#0a0708',textCol:'#2a1a12',plateCol:'#f3e6d0',hintCol:'#8a2a20',narrCol:'#f3e6d0',titleCol:'#f3e6d0',subCol:'#d8c4ac',
 paper:(c,x,y,w,h)=>{c.fillStyle='#ece0c8';c.fillRect(x,y,w,h);c.fillStyle='#3a2416';c.fillRect(x-2,y-2,w+4,2);c.fillRect(x-2,y+h,w+4,2);c.fillStyle='#b8242a';c.fillRect(x-2,y,2,h);},
 plate:(c,x,y,w,h)=>{c.fillStyle='#1a1010';c.fillRect(x,y,w,h);c.fillStyle='#b8242a';c.fillRect(x,y,2,h);},
 narrBox:(c,x,y,w,h)=>{c.fillStyle='rgba(10,7,8,.82)';c.fillRect(x,y,w,h);c.strokeStyle='rgba(184,147,90,.5)';c.lineWidth=1;c.strokeRect(x+3.5,y+3.5,w-7,h-7);},
 choiceBtn:(c,x,y,w,h,t)=>{c.fillStyle='rgba(20,12,10,.9)';c.fillRect(x,y,w,h);c.fillStyle='#b8242a';c.fillRect(x,y,3,h);c.fillStyle='#f3e6d0';c.font=font(9,1);c.textAlign='center';c.fillText(t,x+w/2,y+h*0.66);},
 skipBtn:(c,x,y,w,h)=>{c.fillStyle='rgba(20,12,10,.8)';c.fillRect(x,y,w,h);c.fillStyle='#f3e6d0';c.font=font(7,1);c.textAlign='center';c.fillText('SKIP ▶▶',x+w/2,y+h*0.68);},
 play:(n,v,r)=>play(n,v,r),hap:n=>hap(n),blip:ch=>blip(ch),fx:k=>{if(k==='shake')CAM.shake=8;if(k==='flash')FX.flash(W/2,H/2,0,W,'#fff',H,0.3);},
 titleDeco:(c,W2,H2)=>{c.fillStyle='#b8242a';c.fillRect(W2/2-40,H2*0.47+8,80,1);}};
/* ============================================================================
   DIALOGUE TEXT
   ========================================================================== */
const K=(mood,text)=>({who:'kage',mood,text});
const DL={
 prologue:[
  {title:'影ノ誓・弐',sub:'KAGE NO CHIKAI 2 — THE SHADOW’S VOW'},
  {narr:'Kyō. The old capital. Eleven years ago a charcoal-burner’s son from the hills of Yamashiro was brought before Lord Satō Masanobu, because he had the lord’s face.'},
  {narr:'He was taught to walk like the lord, to sign like the lord, to sit in the lord’s place when arrows were likely. They called him Kage. The Shadow.'},
  {narr:'For eleven years, every death warrant the lord did not want to be seen signing, every riot the lord did not want to be seen crushing, wore the face of Kage.'},
  {title:'一章 · 影屋敷',sub:'Chapter One — The Shadow Estate'},
  {who:'chamberlain',mood:'calm',text:'Kneel. The lord will see you now.'},
  K('calm','I kneel to him every day, Muneyori. Half the province thinks I am him.'),
  {who:'chamberlain',mood:'grim',text:'Half the province is not in this room.'},
  {who:'sato',mood:'calm',text:'Kage. My other face. Stand up, let me look at the work of eleven winters.'},
  K('neutral','My lord.'),
  {who:'sato',mood:'smirk',text:'Perfect. Even the scar — I had the surgeon put one on you so the archers would know which of us to shoot. Do you remember?'},
  K('grim','I remember the arrow.'),
  {who:'sato',mood:'calm',text:'Then you will remember this too. Shōgun Iki Nobutora has raised the provinces against me. His banners fly over Tanba. His men hold the ferry at Ōmi, the temples of Yamato, the ports of Settsu.'},
  {who:'sato',mood:'angry',text:'Eight of his “Eagles” guard the roads to his Black Eagle Castle. Each of them wants my head. Each of them has seen my face. They will come for it, Kage — and the face they will find is yours.'},
  K('calm','You want me to go to them first.'),
  {who:'sato',mood:'smirk',text:'I want you to kill them. All eight. Then Iki. Bring me the shōgun’s head in a lacquered box, and this war ends before it reaches my gate.'},
  K('angry','I am a double, my lord. A target. Not an executioner.'),
  {who:'sato',mood:'calm',text:'You were a charcoal-burner’s boy. You became my shadow. You can become this. Muneyori — bring them in.'},
  {fx:'shake',hap:'hurt'},
  {narr:'The screen slid open. His mother. His wife, Hana. His son Tarō, seven winters old, holding a wooden sword.'},
  {who:'hana',mood:'sad',text:'Kage— they said we were guests. They have not let us leave the inner hall for nine days.'},
  {who:'taro',mood:'warm',text:'Father! Lord Satō says you are going on a journey. Can I come?'},
  K('pain','…Tarō.'),
  {who:'sato',mood:'calm',text:'They will be comfortable. The inner hall has the best garden in Kyō. They will stay there until Iki’s head is in my hands.'},
  {who:'sato',mood:'smirk',text:'And then they walk free, and you with them. I give you my vow. The vow of the Lord of Kyō.'},
  K('grim','A lord’s vow.'),
  {who:'sato',mood:'calm',text:'The only kind that matters, Kage. Oyone keeps a horse for you at Fushimi. Go. The Eagles are waiting for my face.'},
  {narr:'He did not look back at the inner hall. He knew that if he did, he would never leave it.'},
 ],
 oyone:[
  {who:'oyone',mood:'warm',text:'So you are the lord’s… cousin. The one the whole castle whispers about. I was told to give you Kaze — the fastest horse in Yamashiro, and the most stubborn.'},
  K('calm','Kaze. Wind.'),
  {who:'oyone',mood:'smile',text:'Tap the horse button and he comes running wherever you are. He hates bridges, mind. And he will not swim.'},
  {who:'oyone',mood:'calm',text:'There is a rōnin drunk on the south road who has been challenging every man who passes. Half the village is scared to go to market. If you really carry the lord’s sword… you could start with him.'},
  K('grim','Everyone starts with someone.'),
 ],
 oyone_after:[{who:'oyone',mood:'warm',text:'Kaze is yours. The Wind Shrines along the roads will carry you home when the road is long — touch one and you can return to it from the map.'},{who:'oyone',mood:'calm',text:'Find Gonbei the Ferryman at Lake Biwa, in Ōmi. He is the first Eagle. He will not be glad to see your face.'}],
 drunk_before:[{who:'ronin',mood:'laugh',text:'Hic— another one! You walk like a lord. Lords bleed slower, I hear. Let’s test it.'},K('calm','You are blocking the road to market.'),{who:'ronin',mood:'angry',text:'I AM the road to market. Draw!'}],
 drunk_after:[{narr:'The rōnin lay in the dust. The village did not cheer. It never does.'},K('grim','One. There will be more.')],
 // ---- the Eight Eagles ----
 gonbei_before:[
  {title:'二章 · 琵琶の渡し',sub:'Chapter Two — The Biwa Ferry'},
  {who:'gonbei',mood:'grim',text:'There. That face. I would know it under any kasa. Lord Satō of Kyō, come to the lake by himself.'},
  K('calm','I am not—'),
  {who:'gonbei',mood:'angry',text:'Four years ago. The salt riots. You sat on your horse on that hill and ordered the boats burned with the men still in them. My boy was pulling the oars of the third boat.'},
  K('pain','…I remember the hill.'),
  {who:'gonbei',mood:'shout',text:'You remember the HILL? He was fourteen! The lake gave him back to me in the spring, and I buried what the fish had left.'},
  {narr:'He did not say: it was me on the hill, wearing your enemy’s face. He did not say: I was told to raise my hand, so I raised it. There was no sentence in any language that would bring the boy back from the lake.'},
  K('grim','Then take what you came for. If you can.'),
  {who:'gonbei',mood:'angry',text:'The lake remembers, Satō. So do I.'},
 ],
 gonbei_after:[{who:'gonbei',mood:'pain',text:'You… fight like a farmer. Not like a lord. Who… are you…'},K('grim','Nobody. A shadow on a hill.'),{narr:'The first Eagle. Ōmi’s roads were open again. The water of Lake Biwa did not look any different.'}],
 ryoka_before:[
  {title:'三章 · 大和の尼',sub:'Chapter Three — The Nun of Yamato'},
  {who:'ryoka',mood:'calm',text:'I prayed you would come, Lord Satō. Every morning for two years. Amida is slow but he does listen.'},
  K('calm','Sister Ryōka. Iki’s second Eagle.'),
  {who:'ryoka',mood:'grim',text:'My brother was a carpenter in Nara. He repaired a temple roof that your tax collectors said was rebel property. You signed his death warrant yourself — I watched your hand do it, from the gallery.'},
  {narr:'The hand had been his. The warrant had been placed in front of him by Muneyori with the lord’s seal already wet. He had signed eleven that morning.'},
  K('pain','I did not read the names.'),
  {who:'ryoka',mood:'angry',text:'Then I will read you his. Ryōsuke. Say it.'},
  K('grim','…Ryōsuke.'),
  {who:'ryoka',mood:'calm',text:'Good. Now I can kill you without hatred. That is the only way a nun is allowed to do it.'},
 ],
 ryoka_after:[{who:'ryoka',mood:'pain',text:'Not… hatred then. You fight like a man who has already lost something.'},K('sad','Not yet. Not yet.'),{narr:'Sakura petals settled on her robe. The second Eagle.'}],
 danzo_before:[
  {title:'四章 · 難波の仲買',sub:'Chapter Four — The Broker of Naniwa'},
  {who:'danzo',mood:'smirk',text:'Well, well. Come in, come in. Tea? No? You look exactly like him, you know. Exactly. I should — I sold Satō the mirror he used to check.'},
  K('calm','You know what I am.'),
  {who:'danzo',mood:'sly',text:'I know what everything is, friend, that is my trade. You are the double. The kagemusha. The shadow he sends out to die. Satō ruined my house — took my ships for his war and paid in promises — so I bought myself into Iki’s rebellion. Money is the only loyalty that explains itself.'},
  {who:'danzo',mood:'calm',text:'Here is my offer. Walk away. Take a ship from my dock to any province you like. Let the real Satō face the Eagles with his real face.'},
  {choice:[{t:'“I have a family in his hall.”',next:[{who:'danzo',mood:'grim',text:'Ah. Then he has you by the heart, and I have nothing to sell you. A pity. I liked you better than him.'}]},{t:'“Iki pays you. I don’t need to.”',next:[{who:'danzo',mood:'smirk',text:'Iki pays me badly, actually. But he pays. Satō never did.'}]}]},
  {who:'danzo',mood:'angry',text:'Twin kodachi. I learned from the sailors. Let us see what a shadow bleeds.'},
 ],
 danzo_after:[{who:'danzo',mood:'pain',text:'Heh… the dock… is still yours if you want it… no charge…'},K('grim','I know where I am going.'),{narr:'The third Eagle. The port of Naniwa went on loading ships, because ports do.'}],
 hanzo_before:[
  {title:'五章 · 伊賀の風',sub:'Chapter Five — The Wind of Iga'},
  {narr:'The bamboo closed behind him. Iga does not have roads. It has permissions.'},
  {who:'hanzo',mood:'calm',text:'You came alone. Satō would not have. So you are the one from the garden.'},
  K('grim','Hanzō.'),
  {who:'hanzo',mood:'grim',text:'Three springs ago I sent my best student over the wall of Satō’s garden with a blade for his throat. A girl of nineteen. My daughter, Kaede.'},
  {who:'hanzo',mood:'angry',text:'She came home in a cart. Her report, written by Satō’s chamberlain, said the lord himself had killed her with his own hands. I did not believe it. Satō cannot hold a sword without a servant to lift it.'},
  K('pain','It was dark. She came at me with a tantō. I did not know she was—'),
  {who:'hanzo',mood:'calm',text:'You did not know. Neither did she. She died thinking she had reached the lord. I let her believe it. I will not let you.'},
  {who:'hanzo',mood:'sly',text:'The fan reads the wind, shadow. Try to read the fan.'},
 ],
 hanzo_after:[{who:'hanzo',mood:'pain',text:'Kaede… would have… beaten you.'},K('grim','Yes. I think she would have.'),{narr:'He left the fan on the body. Iga took it back into the bamboo. The fourth Eagle.'}],
 daigo_before:[
  {title:'六章 · 高野の巨僧',sub:'Chapter Six — The Giant of Kōya'},
  {who:'daigo',mood:'calm',text:'NAMU AMIDA BUTSU. Sit, lord. The mountain is kind to the tired.'},
  K('calm','I am not tired.'),
  {who:'daigo',mood:'grim',text:'You will be. Seven years ago Satō’s men burned the lower temple of Kōya for sheltering Iki’s wounded. My master, the old abbot, went back in for the sutras. The roof came down while the lord watched from the gate.'},
  K('pain','I was at the gate.'),
  {who:'daigo',mood:'angry',text:'I know. I was ten paces from you with a water bucket. You did not move. The face that watched is the face that burned, lord. The Buddha does not sort shadows from men.'},
  {who:'daigo',mood:'calm',text:'I have carried this club up the mountain every day since, so that when you came my arms would be ready. Namu Amida Butsu.'},
 ],
 daigo_after:[{who:'daigo',mood:'pain',text:'Namu… Amida… good. Good. Now I can put it down.'},{narr:'The club rolled down the temple steps and did not stop until the maples. The fifth Eagle.'}],
 kuroda_before:[
  {title:'七章 · 関ヶ原の陣',sub:'Chapter Seven — The Camp at Sekigahara'},
  {who:'kuroda',mood:'grim',text:'Stand there. No closer. I want to look at the face that gave the order.'},
  K('calm','Captain Kuroda. You served Satō at the Sekigahara crossing.'),
  {who:'kuroda',mood:'angry',text:'I served under him. Two hundred spears on the left flank. When Iki’s cavalry broke through, I sent a rider for support. The rider came back with the lord’s own words: “Hold until dark.”'},
  {who:'kuroda',mood:'shout',text:'The lord was already on the road to Kyō by then. We held until dark. Eleven of us walked out. ELEVEN.'},
  {narr:'“Hold until dark.” Muneyori had whispered it. Kage had said it, loudly, from the lord’s saddle, so the rider could carry it. Then he had ridden south as he was told.'},
  K('grim','I was in the saddle. The words were mine.'),
  {who:'kuroda',mood:'calm',text:'Good. Then I need not explain anything to the eleven. Spear. For the men you left.'},
 ],
 kuroda_after:[{who:'kuroda',mood:'pain',text:'Tell… the eleven…'},K('sad','I will not meet them. I am going somewhere else.'),{narr:'The sixth Eagle. The camp fires at Sekigahara burned down one by one.'}],
 tsuru_before:[
  {title:'八章 · 尾張の寡婦',sub:'Chapter Eight — The Widow of Owari'},
  {who:'tsuru',mood:'calm',text:'Lord Satō. Or the thing he keeps in a box and takes out when he wants to be brave. I have heard both stories. Which are you?'},
  K('calm','Does it matter?'),
  {who:'tsuru',mood:'smirk',text:'That is exactly what I asked myself when they brought my husband’s head home. Ōkubo Nagayasu, magistrate of Kiyosu. Executed for “failing to prevent rebellion in his district.” He had been in bed with a fever for a month.'},
  {who:'tsuru',mood:'grim',text:'The edict carried Satō’s seal. The man who read it in my courtyard had Satō’s face. Which of you signed it? Which of you read it? Which of you went home to dinner?'},
  K('pain','…All of it was my face. None of it was my hand.'),
  {who:'tsuru',mood:'angry',text:'Then I will take the face, and let the hand explain itself to the next widow. Draw. My husband taught me iai. He was very patient.'},
 ],
 tsuru_after:[{who:'tsuru',mood:'pain',text:'He… was… patient…'},{narr:'She died with the blade still half-drawn. He finished drawing it for her and laid it across her chest. The seventh Eagle.'}],
 yukimura_before:[
  {title:'九章 · 越前の霜',sub:'Chapter Nine — The Frost of Echizen'},
  {narr:'Snow until the fourth month. The eighth Eagle waited where the road forgets itself.'},
  {who:'yukimura',mood:'calm',text:'Do you know this mask? No. You never looked. Five winters ago a swordsman from Echizen came to Kyō and challenged the Lord of the capital to a duel for honour. The lord accepted — in the courtyard, before the court.'},
  K('grim','I was the lord in the courtyard.'),
  {who:'yukimura',mood:'angry',text:'You cut my face from brow to jaw, and then you let me live, because the court was watching and mercy looks good from a distance. I have worn this ever since. Children run from it. Dogs bark.'},
  {who:'yukimura',mood:'grim',text:'Iki promised me the real one. The lord. You will do — because when I cut YOUR face, he will feel it. That is what shadows are for.'},
  K('calm','Then you understand him better than I did.'),
  {who:'yukimura',mood:'shout',text:'Ōdachi. Frost does not forgive.'},
 ],
 yukimura_after:[{who:'yukimura',mood:'pain',text:'The mask… take it off… I want to feel the snow…'},{narr:'He took it off. The face underneath was a boy’s face with a line through it. The eighth Eagle. The road to Tanba was open.'}],
 iki_before:[
  {title:'十章 · 黒鷲城',sub:'Chapter Ten — The Black Eagle Castle'},
  {narr:'The castle had no moat. It did not need one. Every man on the walls had lost someone to Kyō.'},
  {who:'iki',mood:'calm',text:'Eight. You killed all eight of them. Gonbei, who could not tell you apart. Ryōka, who could. Hanzō, who knew exactly.'},
  K('grim','Shōgun Iki.'),
  {who:'iki',mood:'grim',text:'Do you know why I raised the provinces, shadow? Not for a throne. Because a lord who sends another man’s face to his wars is a lord who will never stop. There is no bottom to a man like Satō. He will spend you. Then he will spend your children.'},
  K('angry','He holds my children.'),
  {who:'iki',mood:'sad',text:'…Of course he does. Of course he does. Then nothing I say will turn you around, and nothing I do will stop you, except this.'},
  {who:'iki',mood:'calm',text:'Hear me anyway. When you carry my head through his gate, look at his face when he sees it. Really look. You have worn that face for eleven years. You know every lie it can make.'},
  {who:'iki',mood:'angry',text:'Kurowashi. Black Eagle. Forged for the war he started. Come, Kage. Let us finish his war for him.'},
 ],
 iki_after:[{who:'iki',mood:'pain',text:'Look… at his face… promise me…'},K('grim','I promise.'),{narr:'He wrapped the head in the black banner and set it in the lacquered box the chamberlain had given him eleven chapters ago. It was heavier than he expected. Heads are.'},{narr:'The road back to Kyō was long. The wind blew toward the capital the whole way, as if it also wanted to see.'}],
 betrayal:[
  {title:'終章 · 誓い',sub:'Final Chapter — The Vow'},
  {who:'chamberlain',mood:'calm',text:'The lord receives you in the great hall. Bring the box.'},
  {who:'sato',mood:'smile',text:'Kage! My shadow. My own face, home from the war. Open it. Let the court see what one loyal man can do.'},
  {narr:'He opened it. The court looked. The lord looked longer than anyone.'},
  {who:'sato',mood:'laugh',text:'Iki Nobutora. The shōgun of the provinces. In a box. I will have it lacquered. Muneyori — bring the guests. Our shadow has earned his reunion.'},
  {narr:'They were brought in. Fumi, walking slowly. Hana, who had not slept. Tarō, who ran three steps before a guard’s hand found his collar.'},
  {who:'taro',mood:'warm',text:'Father! You came back! Did you win?'},
  K('warm','I won, Tarō. We are going home.'),
  {who:'sato',mood:'calm',text:'Home. Yes. Let me tell the court what I told my shadow eleven chapters ago. I gave him my vow: bring me Iki’s head, and your family walks free.'},
  {who:'sato',mood:'smirk',text:'And I keep my vows. Muneyori.'},
  {fx:'shake',hap:'hurtHeavy',sfx:'squelch'},
  {narr:'The chamberlain’s sword was already out. It went through Fumi first, because she was nearest. She did not even turn.'},
  K('shout','NO—'),
  {who:'sato',mood:'calm',text:'Hold him. Gently. He is the lord’s face; do not mark it.'},
  {hap:'death',sfx:'squelch'},
  {narr:'Hana looked at him the whole time. She did not scream. She said his name — his real name, the one from the hills, the one nobody in the castle knew — and then the sword took the rest of the sentence.'},
  {who:'taro',mood:'sad',text:'Father…? Father, I don’t— Father—'},
  {who:'sato',mood:'calm',text:'The boy too. A shadow with a son is a man with a reason. I need a shadow with nothing.'},
  {fx:'flash',hap:'death',sfx:'crack'},
  {narr:'…'},
  {who:'sato',mood:'smirk',text:'There. I said they would be free, and now they are. The dead are free of everything — that is the only freedom a lord can actually give. I kept my vow, Kage. Exactly as spoken.'},
  K('pain','You… you said… they would walk…'),
  {who:'sato',mood:'laugh',text:'They screamed YOUR name. Not mine. Did you notice? Eleven years of my face, and when it mattered they still knew which of us was the charcoal-burner. It changes nothing. It only proves you were never me.'},
  {who:'sato',mood:'calm',text:'And now you are perfect. No mother. No wife. No boy with a wooden sword. Just a face that does what it is told. Kneel, shadow. The war is over. Thank me.'},
  {narr:'He did not kneel. He had knelt every day for eleven years, and his knees did not remember how.'},
  K('shout','I will take your face off your skull and wear it to your grave, Satō.'),
  {who:'sato',mood:'angry',text:'Guards— no. No. Leave him. I taught this one myself. Let the court see how a lord corrects his shadow.'},
  {who:'sato',mood:'grim',text:'Chikai-wari. Vow-breaker. I named the blade the day I had it forged. I always knew which vow it would break.'},
 ],
 sato_after:[
  {who:'sato',mood:'pain',text:'You… cannot… I am the lord of… you are only—'},
  K('grim','I am only your face. And now your face is what dies here.'),
  {narr:'He did not take the head. He had carried enough heads. He left the lord on the floor of the great hall with his own eyes open, so the court could see which of them was real.'},
  {narr:'Under the dais, in the box where Satō kept the things he could not let the court see, there was a map. Every province. Every clan city. And, marked in red on the coast of Settsu, a cove with a single torii drawn in it: “for leaving, when leaving becomes necessary.”'},
  {narr:'He took the map. He took the horse. He went out through the gate that eleven years ago had closed behind a charcoal-burner’s son, and he did not look back at the inner hall, because there was no longer anyone in it.'},
  {title:'第一部 · 完',sub:'END OF PART ONE'},
 ],
 part2_intro:[
  {title:'第二部 · 天下統一',sub:'PART TWO — ONE JAPAN'},
  {narr:'A cove on the coast of Settsu. A torii standing in the surf. On Satō’s secret map, a red line from it ran across the water to Shikoku, to Kyūshū, to the snow country, to Ezo at the end of the world.'},
  {who:'genzo',mood:'calm',text:'So it was true. The lord kept a way out. He kept everything — maps, ships, other men’s faces. I drew that map, you know. Twenty years ago, for the father. I never thought the son would use it to run.'},
  K('grim','He will not be using it.'),
  {who:'genzo',mood:'sad',text:'No. I heard. The whole capital heard. Eight clans heard, boy — Mōri, Chōsokabe, Shimazu, Takeyama, Hōjō, Nagao, Date, Matsumae. Each of them will be in Kyō by autumn to pick the bones. Each of them is Satō with a different crest.'},
  K('angry','Then there will be eight more Satōs. Eight more inner halls.'),
  {who:'genzo',mood:'calm',text:'Unless someone stands in every one of their courts, with Satō’s face, and tells them no. The Wind Shrines will carry you across the water now. The map knows the way.'},
  {choice:[{t:'“I am done with vows.”',next:[{who:'genzo',mood:'warm',text:'Good. Make none. Just go.'}]},{t:'“Then I will unite every province under no lord at all.”',next:[{who:'genzo',mood:'smile',text:'That is a vow, boy. But it is yours this time.'}]}]},
  {narr:'Part Two. Eight clans. Sixteen lieutenants. One shadow, with nothing left to lose and a whole country still to lose it in.'},
 ],
 // Part Two — clans. Keyed by char id; lieutenants short, lords longer.
 kikkawa_before:[{title:'毛利 · 一',sub:'MŌRI — The Oar'},{who:'kikkawa',mood:'grim',text:'Mōri’s sea gate. You are the Kyō shadow who killed his own lord. The oar has sunk bigger men than you.'},K('calm','Then it will not mind one more.')],
 kikkawa_after:[{who:'kikkawa',mood:'pain',text:'Tell… Lord Mōri… the gate is open.'}],
 kobayakawa_before:[{title:'毛利 · 二',sub:'MŌRI — The Tide'},{who:'kobayakawa',mood:'sly',text:'The tide of Aki turns twice a day. You have arrived on the wrong one.'},K('grim','I did not come for the tide.')],
 kobayakawa_after:[{who:'kobayakawa',mood:'pain',text:'…the wrong one after all.'}],
 mori_before:[{title:'毛利元春',sub:'LORD MŌRI MOTOHARU'},{who:'mori',mood:'calm',text:'Three arrows. One breaks; three together do not. My sons, my captains, my clan. You have broken two of my arrows, shadow of Kyō.'},K('calm','You were on the road to the capital, Mōri. To sit where Satō sat.'),{who:'mori',mood:'grim',text:'Someone must sit there. Would you rather it be Shimazu? Hōjō? A country without a lord is a country at war with itself.'},K('angry','A country with Satō was at war with its own children. I have seen the inner hall. No one sits there again.'),{who:'mori',mood:'angry',text:'Then the third arrow is mine.'}],
 mori_after:[{who:'mori',mood:'pain',text:'…three arrows… and still…'},{narr:'The Mōri banners came down from Yoshida castle. The west was quiet. One clan.'}],
 kosokabe_before:[{title:'長宗我部 · 一',sub:'CHŌSOKABE — The Reed'},{who:'kosokabe',mood:'calm',text:'Tosa faces the open ocean. Nothing comes from the north that we did not invite. We did not invite you.'},K('grim','I came anyway.')],
 kosokabe_after:[{who:'kosokabe',mood:'pain',text:'The reed… bends…'}],
 kira_before:[{title:'長宗我部 · 二',sub:'CHŌSOKABE — The Whaler'},{who:'kira',mood:'laugh',text:'I have put this axe through whales, shadow. You are a very small whale.'},K('calm','Whales do not parry.')],
 kira_after:[{who:'kira',mood:'pain',text:'…small whale… big teeth…'}],
 chosokabe_before:[{title:'長宗我部国親',sub:'LORD CHŌSOKABE KUNICHIKA'},{who:'chosokabe',mood:'grim',text:'One leaf, one soldier. Every farmer in Tosa carries a spear in his field. That is how a small island stays free of Kyō.'},K('calm','Then keep it free. Of Kyō, and of lords.'),{who:'chosokabe',mood:'angry',text:'A lord IS freedom, boy — freedom from the next lord. Kill me and Mōri’s ghost takes Tosa by spring.'},K('grim','Mōri is dead. So is spring, for both of you.')],
 chosokabe_after:[{who:'chosokabe',mood:'pain',text:'…one leaf…'},{narr:'The spears went back into the fields. Two clans.'}],
 ijuin_before:[{title:'島津 · 一',sub:'SHIMAZU — The Ash-walker'},{who:'ijuin',mood:'calm',text:'You walked across the ash fields to reach us. Most men go around. Shimazu does not go around.'},K('calm','Neither do I.')],
 ijuin_after:[{who:'ijuin',mood:'pain',text:'…ash… to ash…'}],
 niiro_before:[{title:'島津 · 二',sub:'SHIMAZU — The Devil'},{who:'niiro',mood:'shout',text:'ONI! They call me the devil of Satsuma! Come and see why!'},K('grim','I have met devils with better manners.')],
 niiro_after:[{who:'niiro',mood:'pain',text:'…devil… meets… shadow…'}],
 shimazu_before:[{title:'島津貴久',sub:'LORD SHIMAZU TAKAHISA'},{who:'shimazu',mood:'calm',text:'The devil’s charge. Satsuma has never lost a battle it chose to fight. We chose this one the day Satō died.'},K('calm','You never met Satō.'),{who:'shimazu',mood:'grim',text:'I met his taxes. I met his edicts. I met the double he sent to sign them in Kyūshū — eleven years ago, a frightened boy with a borrowed face. Was that you?'},K('pain','…It was.'),{who:'shimazu',mood:'angry',text:'Then I have waited eleven years for you to grow a spine. Show me.'}],
 shimazu_after:[{who:'shimazu',mood:'pain',text:'…a spine… after all…'},{narr:'The southern edge of the world was quiet. Three clans.'}],
 yamagata_before:[{title:'武山 · 一',sub:'TAKEYAMA — The Red Horse'},{who:'yamagata',mood:'grim',text:'The red cavalry of Kai has never been broken. On foot, shadow, you are already behind.'},K('calm','Horses do not duel.')],
 yamagata_after:[{who:'yamagata',mood:'pain',text:'…the red… runs…'}],
 baba_before:[{title:'武山 · 二',sub:'TAKEYAMA — The Unwounded'},{who:'baba',mood:'calm',text:'Forty battles. Not one wound. Do you know how? I never fight the man. I fight his mistake.'},K('grim','Then wait for mine.')],
 baba_after:[{who:'baba',mood:'pain',text:'…first… wound… hm.'}],
 takeyama_before:[{title:'武山晴信',sub:'LORD TAKEYAMA HARUNOBU'},{who:'takeyama',mood:'calm',text:'Wind. Forest. Fire. Mountain. Swift as the wind, silent as the forest, fierce as fire, immovable as the mountain. That is Kai. What are you?'},K('calm','Shadow. It follows all four.'),{who:'takeyama',mood:'laugh',text:'HA! Good. I would have liked you at my table. I will like you better at my feet.'}],
 takeyama_after:[{who:'takeyama',mood:'pain',text:'…immovable… was a lie…'},{narr:'The mountains of Kai stood where they always had. Four clans.'}],
 matsuda_before:[{title:'北条 · 一',sub:'HŌJŌ — The Wall'},{who:'matsuda',mood:'calm',text:'Odawara has never fallen. I am the reason.'},K('grim','Walls fall from the inside.')],
 matsuda_after:[{who:'matsuda',mood:'pain',text:'…from… the inside…'}],
 daidoji_before:[{title:'北条 · 二',sub:'HŌJŌ — The Quiet'},{who:'daidoji',mood:'calm',text:'…'},K('calm','Nothing to say?'),{who:'daidoji',mood:'sly',text:'I said it with the knife. You just have not heard it yet.'}],
 daidoji_after:[{who:'daidoji',mood:'pain',text:'…heard.'}],
 hojo_before:[{title:'北条氏政',sub:'LORD HŌJŌ UJIMASA'},{who:'hojo',mood:'calm',text:'A castle too big to besiege. A plain too wide to cross. A lord too patient to provoke. That was my father’s Odawara, and my grandfather’s.'},K('grim','And now it is one man at a gate.'),{who:'hojo',mood:'angry',text:'One SHADOW. You think killing lords makes a country? It makes a cemetery with nice roads.'},K('calm','Satō made the cemetery. I am only closing the gate.')],
 hojo_after:[{who:'hojo',mood:'pain',text:'…the castle… does not… fall…'},{narr:'It did not. Only the lord did. Five clans.'}],
 naoe_before:[{title:'長尾 · 一',sub:'NAGAO — The Steward'},{who:'naoe',mood:'calm',text:'Lord Nagao prays before every battle. I count the rice. Today I counted one shadow.'},K('grim','Count again after.')],
 naoe_after:[{who:'naoe',mood:'pain',text:'…zero…'}],
 kakizaki_before:[{title:'長尾 · 二',sub:'NAGAO — The Avalanche'},{who:'kakizaki',mood:'shout',text:'SNOW COUNTRY! The mountain comes DOWN on you!'},K('calm','Then I will be under it.')],
 kakizaki_after:[{who:'kakizaki',mood:'pain',text:'…under… it…'}],
 nagao_before:[{title:'長尾景持',sub:'LORD NAGAO KAGEMOCHI'},{who:'nagao',mood:'calm',text:'They call me the god of war. I have never wanted the title. Bishamonten lends it; he does not give it.'},K('calm','Then lend me the field.'),{who:'nagao',mood:'grim',text:'I know what Satō did to you. The whole north knows. I would have given you his head myself. But a man who kills eight lords does not stop at eight.'},K('angry','He stops when there are none.'),{who:'nagao',mood:'calm',text:'Then the god of war descends. Forgive me, shadow. This is not hatred.'}],
 nagao_after:[{who:'nagao',mood:'pain',text:'…not hatred… remember that…'},{narr:'The snow fell on Kasugayama for three days. Six clans.'}],
 katakura_before:[{title:'伊達 · 一',sub:'DATE — The Shield'},{who:'katakura',mood:'calm',text:'The dragon has one eye. I am the other.'},K('grim','Then he will be blind soon.')],
 katakura_after:[{who:'katakura',mood:'pain',text:'…my lord… forgive…'}],
 oniniwa_before:[{title:'伊達 · 二',sub:'DATE — The Oak'},{who:'oniniwa',mood:'laugh',text:'Seventy winters, shadow. The oak does not fall for a breeze from Kyō.'},K('calm','I am not a breeze.')],
 oniniwa_after:[{who:'oniniwa',mood:'pain',text:'…not… a breeze… no…'}],
 date_before:[{title:'伊達輝宗',sub:'LORD DATE TERUMUNE'},{who:'date',mood:'sly',text:'The one-eyed dragon of the north. I lost the eye to a fever at six. I lost the north to no one. Seven lords dead and here you are at my gate, Kage of Kyō, with nothing in your hands but their silence.'},K('calm','Silence is enough.'),{who:'date',mood:'grim',text:'I would have made you a general. I still would. Kneel and the north is yours to keep.'},K('angry','I have knelt. It is the one thing I will never do again.'),{who:'date',mood:'angry',text:'Then stand, and die standing. The dragon is awake.'}],
 date_after:[{who:'date',mood:'pain',text:'…standing… good… good…'},{narr:'The dragon banner came down over Sendai. Seven clans. Only the end of the map remained.'}],
 horai_before:[{title:'松前 · 一',sub:'MATSUMAE — The Bear-hunter'},{who:'horai',mood:'grim',text:'Beyond this line there are bears, and there is me. You should have preferred the bears.'},K('calm','I have met worse than bears.')],
 horai_after:[{who:'horai',mood:'pain',text:'…the bears… will eat well…'}],
 kudo_before:[{title:'松前 · 二',sub:'MATSUMAE — The Ice Road'},{who:'kudo',mood:'calm',text:'The ice road to Matsumae. Every step is a feint. The ground lies. So do I.'},K('grim','Then I will believe nothing.')],
 kudo_after:[{who:'kudo',mood:'pain',text:'…believed… nothing… correct…'}],
 matsumae_before:[{title:'松前慶広',sub:'LORD MATSUMAE YOSHIHIRO — THE END OF THE MAP'},{narr:'Ezo. Beyond the maps of most men. The last castle, the last lord, the last crest between the shadow and a country with none.'},{who:'matsumae',mood:'calm',text:'So this is the face. I have heard about it for a year — from merchants, from refugees, from the ghosts of seven clans. The face that would not kneel.'},K('calm','The last one.'),{who:'matsumae',mood:'grim',text:'Tell me, Kage. When I am dead, and there are no lords from Satsuma to Ezo — who will you be? A shadow needs something to stand in front of it.'},K('grim','…I will find out.'),{who:'matsumae',mood:'calm',text:'Then let us finish the map together. Nagamaki. The end of everything is an honest place to die.'}],
 matsumae_after:[{who:'matsumae',mood:'pain',text:'…the map… ends… here…'},{narr:'He stood in the last court of the last castle. The snow came in through the open gate. There was no one left in the whole country to tell him what to do with his face.'}],
 ending_early:[
  {title:'誓いの前に',sub:'ENDING — BEFORE THE VOW'},
  {narr:'He killed the Lord of Kyō before the lord could keep his vow — or break it. For one breath the great hall was silent, and the shadow stood over the man whose face he wore, and nothing in the world told him what to do next.'},
  {narr:'Then the chamberlain’s men remembered the inner hall.'},
  {fx:'shake',hap:'hurtHeavy'},
  {narr:'He ran. The garden was the best in Kyō. He had never seen it. He reached it in time to see that it had been used, and by whom, and that the guards had been thorough in the way guards are when the lord is dead and the orders have stopped.'},
  {narr:'Fumi. Hana. Tarō, with the wooden sword still in his hand.'},
  {narr:'There was no one left to carry a head to. There was no one left to walk free. There was only a map, under the dais, with every province drawn on it and a cove marked in red: “for leaving, when leaving becomes necessary.”'},
  {narr:'He took the map. He did not take the horse. He walked out of the gate as a man walks out of his own house after the fire, and the Eight Eagles, and Shōgun Iki, and the eight lords of the eight clans, went on living in a country that no longer had a shadow in it.'},
  {narr:'Some say he went to the cove and crossed the water. Some say he is still in the hills of Yamashiro, burning charcoal, with a lord’s face and a farmer’s hands. Nobody says he is happy.'},
  {title:'影ノ誓・弐',sub:'— the vow was never kept —'},
 ],
 iki_early:[
  {narr:'The shōgun was dead before his Eagles had even been called home. On the walls of the Black Eagle Castle, men who had lost someone to Kyō put down their spears one by one and looked at the lacquered box, and did not stop him.'},
  {narr:'The remaining Eagles scattered to their provinces. They are still out there, each with a grudge and a face to hate. The road to Kyō is open; so is every road to them.'},
 ],
 oyone_dead:[
  {narr:'Oyone was dead. Kaze had bolted from the stable the night she fell, and no stranger’s whistle brought him back. Every horse-keeper in the provinces sells horses — for a price.'},
 ],
 genzo_dead:[
  {narr:'Genzō the cartographer lay where he had fallen by the cove. The map was still in Kage’s sleeve. He read it himself, by lamplight, in a dead man’s boat: twenty years of a cartographer’s notes, eight clan cities, and a red line across the water.'},
  {narr:'Part Two. Eight clans. Sixteen lieutenants. One shadow, with nothing left to lose and a whole country still to lose it in.'},
 ],
 ending:[
  {title:'天下統一',sub:'ONE JAPAN'},
  {narr:'He went back to Kyō in the spring. Nijō castle stood empty; no one had wanted to sit where Satō sat, and he had made sure no one would.'},
  {narr:'In the inner hall, the garden was still the best in the capital. He sat in it for one afternoon. Then he burned the hall to the ground, carefully, so that nothing else caught.'},
  {narr:'Genzō the cartographer drew a new map that year. It had no crests on it. Only roads, and the Wind Shrines, and one small red mark in the hills of Yamashiro where a charcoal-burner’s son had been born.'},
  {narr:'They say a man with Lord Satō’s face still rides the roads from Satsuma to Ezo. He stops at every village. He challenges no one. If a lord rises anywhere, the rider arrives within the month.'},
  {narr:'He has no name that anyone uses. The children, who are not afraid of him, call him Kaze-no-Kage. The wind’s shadow.'},
  {narr:'He has never knelt again.'},
  {title:'影ノ誓・弐',sub:'— 終 —'},
 ],
};
/* ---------- generic NPC talk ---------- */
const TALK={
 villager:['The rice is late this year. The war is early.','They say an eclipse brings back the dead. I say it brings back the tax collector.','A rider with the lord’s face passed here. He did not stop. They never stop.','My brother went to Tanba with the rebels. I pray for the wrong side every morning.','Mind the Wind Shrines on the road. Touch one, and the wind remembers you.'],
 town:['Business is good when lords are nervous. Everyone buys blades.','The merchant by the plaza sells things that glow. He also fights like three men. Do not steal from him.','There was a duel in the street last night. The winner took the loser’s sandals. Sandals!','The dōjō master says every man can be challenged. The dōjō master has never been challenged.','If the sun goes dark, go inside. If the dead walk, go inside faster.'],
 farmer:['Every spear in my field was a plough once.','The paddies flood in the fourth month. The roads flood in the fifth. The lords flood in the sixth.','My son wants to be a samurai. I tell him samurai cannot eat their swords.'],
 fisher:['The sea does not care who the lord is. That is why I like it.','Past the harbour the shrine in the surf glows at night. The old men say it can carry you across the water. The old men drink.','Fish are honest. Men parry.'],
 child:['Are you a lord? You have a lord’s face but a farmer’s hands.','My father says the Eagles eat children. I think they just eat rice like everybody.','Can I see your sword? Can I? Can I?','When the sun goes black I am going to hide in the well. Do not tell mother.'],
 elder:['I remember the old lord. He was worse. They are always worse, until the next one.','Satō has a shadow, you know. A man he dresses in his own face. I saw them both once. I could not tell which one was sad.','The Wind Shrines are older than the clans. The wind was here first.'],
 pilgrim:['Eighty-eight temples. I have seen eleven. My feet have seen all of them.','Amida takes everyone. Even lords. Especially lords.','A monk at Kōya is the size of a gate. He carries a club. He is very polite.'],
 miko:['The kami of this shrine does not like blood on the stones. Please duel on the grass.','The wind that guides you — it is not the kami. It is older. Follow it anyway.','An eclipse is the sun closing its eye. What it does not see, it cannot forbid.'],
 monk:['All things pass. Lords faster than most.','I do not carry a sword. I carry a staff. The difference is important to me and to no one else.','There is a nun in Yamato who prays for one man to come to her. I do not think she prays for his health.'],
 abbot:['This temple was burned once by the lord of Kyō. We rebuilt it. We will rebuild it again. Temples are patient.','You carry grief like a second sword. Put one of them down, my son.'],
 inn:['Rest here and the night passes. The night always passes.','Rice and sake. Tea for the pious. Nothing for the dead — they do not pay.','Travellers talk. I listen. The Eagles are gathering at the Black Eagle castle, they say.'],
 merchant:['Epic, legendary, mythic — I have blades that have ended clans. Prices to match.','You may challenge me for my stock, like the others did. Their swords are in the back now. Discounted.','I buy what you loot. I sell what others looted. Trade is a circle with a blade in it.'],
 horse:['Kaze is a good horse. Faster than any in the province, and he knows it.','Whistle and he comes. Mount and the roads shrink. Dismount before bridges — he will not cross planks.'],
 ronin:['No lord. No stipend. Just the road and whoever is on it.','I have challenged forty men this year. I am still here. Think about that.','Your face is worth a great deal to some people. Some of them are me.'],
 bandit:['Toll. Coins or blood, your choice.','Rich clothes, rich sword. Walk slower, friend.','We hunt the forest roads. The forest hunts us. It evens out.'],
 samurai:['I serve the castle. The castle serves the lord. The lord serves… I have never asked.','Draw and I will answer. Walk on and I will forget you.','A duel is a conversation. Most men say nothing worth hearing.'],
 guard:['Move along. The lord sees no one.','The gate is closed to the armed. Unless you are very good.','I was at Sekigahara. We held until dark. Eleven of us walked out.'],
 ashigaru:['Spear, rice, boots. That is a soldier.','Iki pays us in promises. Satō pays in edicts. We eat neither.','If you fight the captain, fight him on the open ground. He is not patient.'],
 shinobi:['Iga does not have roads. It has permissions.','You were followed. By me. You are welcome.','Hanzō lost a daughter over a wall in Kyō. Do not say her name here.'],
 sensei:['Parry when the arrow turns gold. Strike when the man is open. That is the whole art.','Every man who enters my dōjō can be challenged. Most leave on their feet. Some leave on a board.','Your stance is a farmer’s. Good. Farmers survive.'],
 sailor:['The hidden cove on the Settsu coast — the old lord kept a torii there in the surf. It does not lead anywhere I can take a ship.','Wind shrines on every harbour. The sea has its own roads.','I have sailed to Ezo. There is nothing there but snow and bears and a lord who thinks he owns the snow.'],
 hunter:['The bears are easier than the bandits. The bears do not lie about the toll.','I track for the castle. I do not fight for it.','A deer ran from me into a duel between two rōnin. All three died. The forest is like that.'],
 story:[],
};
/* ============================================================================
   QUEST STEPS
   ========================================================================== */
// target: id of a story NPC (its position is the wind's goal). kind: 'talk' (dialogue only), 'duel' (dialogue → duel → after), 'cut' (custom)
const EAGLES=['gonbei','ryoka','danzo','hanzo','daigo','kuroda','tsuru','yukimura'];
const STEPS=[];
function defStep(o){STEPS.push(o);return o;}
defStep({id:'prologue',title:'The Shadow Estate',jp:'影屋敷',text:'Answer Lord Satō’s summons at the Shadow Estate.',target:'sato_estate',kind:'cut'});
defStep({id:'horse',title:'A Horse Named Wind',jp:'風という馬',text:'Oyone keeps a horse for you at the Fushimi stable.',target:'oyone',kind:'talk',before:'oyone',after:'oyone_after',onDone:()=>{const oy=NPC_BY_ID.get('oyone');if(oy&&oy.dead){S.flags.noHorse=1;toast('No horse. Horse-keepers in any town will sell you one.','#ffb070');return;}S.horse=true;HORSE.x=PL.x+18;HORSE.y=PL.y;toast('Kaze the horse is yours — tap 馬 to mount','#ffd27a');}});
defStep({id:'drunk',title:'The Road to Market',jp:'市への道',text:'A drunk rōnin blocks the south road out of Fushimi. Challenge him.',target:'drunk',kind:'duel',before:'drunk_before',after:'drunk_after'});
EAGLES.forEach((e,i)=>{const R=REGIONS[regionIndex(CHARS[e].region)];defStep({id:e,title:'Eagle '+['One','Two','Three','Four','Five','Six','Seven','Eight'][i]+' — '+CHARS[e].name,jp:'八鷲・'+'一二三四五六七八'[i],text:CHARS[e].name+' waits in '+R.name+' ('+R.jp+'). Find and kill the Eagle.',target:e,kind:'duel',before:e+'_before',after:e+'_after',boss:1});});
defStep({id:'iki',title:'The Black Eagle',jp:'黒鷲',text:'Shōgun Iki holds the Black Eagle Castle in Tanba. Take his head.',target:'iki',kind:'duel',before:'iki_before',after:'iki_after',boss:1,onDone:()=>{S.flags.ikiHead=1;moveSatoToThrone();}});
function moveSatoToThrone(){const th=LANDMARKS.kyotoThrone;const sat=NPC_BY_ID.get('sato'),ch=NPC_BY_ID.get('chamberlain');if(sat){sat.x=sat.hx=th.x;sat.y=sat.hy=th.y;sat.dir=0;}if(ch){ch.x=ch.hx=th.x+20;ch.y=ch.hy=th.y+8;ch.dir=2;}}
defStep({id:'return',title:'The Lord’s Vow',jp:'殿の誓い',text:'Carry Iki’s head back to Lord Satō at Nijō Castle, Kyō.',target:'sato',kind:'cut'});
defStep({id:'sato',title:'Vow-breaker',jp:'誓割',text:'Kill Lord Satō Masanobu.',target:'sato',kind:'duel',before:null,after:'sato_after',boss:1,onDone:()=>{S.part=2;S.flags.secretMap=1;S.flags.part1done=1;WAYPOINTS.forEach(w=>{if(w.hidden)S.wps[w.id]=0;});toast('SECRET MAP — the clan cities and the sea shrines are revealed','#ffd27a');}});
defStep({id:'genzo',title:'The Secret Map',jp:'秘図',text:'Satō’s map marks a hidden cove on the Settsu coast. Go there.',target:'genzo',kind:'talk',before:'part2_intro',onDone:()=>{WAYPOINTS.forEach(w=>{if(w.sea)S.wps[w.id]=1;});toast('Sea Shrines unlocked — the map can carry you across the water to every island','#9fe3ff');chime(1318,0.15,2.5);}});
CLANS.forEach((c,ci)=>{c.lts.forEach((lt,li)=>{const R=REGIONS[regionIndex(CHARS[lt].region)];defStep({id:lt,title:c.name+' — '+CHARS[lt].name,jp:c.jp+'・'+(li?'二':'一'),text:CHARS[lt].name+' holds '+R.name+' for the '+c.name+' clan.',target:lt,kind:'duel',before:lt+'_before',after:lt+'_after',boss:1,clan:c.id});});
 const R=REGIONS[regionIndex(c.region)];defStep({id:c.lord,title:c.name+' — '+CHARS[c.lord].name,jp:c.jp+'・殿',text:'Lord '+CHARS[c.lord].name.replace('Lord ','')+' sits in his castle at '+R.capital+', '+R.name+'.',target:c.lord,kind:'duel',before:c.lord+'_before',after:c.lord+'_after',boss:1,clan:c.id,lord:1,onDone:()=>{S.flags['clan_'+c.id]=1;toast(c.name+' clan has fallen — '+(ci+1)+' of 8','#ffd27a');}});});
defStep({id:'ending',title:'One Japan',jp:'天下統一',text:'Return to Nijō Castle.',target:'throne',kind:'cut'});
function curStep(){return STEPS[Math.min(S.quest,STEPS.length-1)];}
function stepIndex(id){return STEPS.findIndex(s=>s.id===id);}
function npcDead(id){const n=NPC_BY_ID.get(id);return !!(n&&n.dead);}
/* a step whose goal is already met by the state of the world (an NPC killed out of order) */
function stepSatisfied(st){if(!st)return false;if(st.kind==='duel'||st.kind==='talk')return npcDead(st.target);return false;}
function skipLines(st){const n=NPC_BY_ID.get(st.target);const nm=n?n.name:st.target;
 if(st.id==='horse')return DL.oyone_dead;if(st.id==='genzo')return DL.genzo_dead;
 if(EAGLES.includes(st.id)){const R=REGIONS[regionIndex(CHARS[st.id].region)];return [{narr:nm+' was already dead by the time the road reached '+R.name+'. Kage stood where the Eagle had waited for him and found he had nothing to say to the ground.'}];}
 if(st.id==='iki')return DL.iki_early;
 const clan=CLANS.find(c=>c.lord===st.id||c.lts.includes(st.id));
 if(clan){if(clan.lts.includes(st.id)){const lord=NPC_BY_ID.get(clan.lord);if(lord&&lord.dead&&!S.flags['killed_'+st.id])return [{narr:'With Lord '+CHARS[clan.lord].name.replace('Lord ','')+' dead, '+nm+' laid down the spear and went home to the rice. There was no one left to hold the province for.'}];return [{narr:nm+' was already dead. The '+clan.name+' banners over the road hung a little lower.'}];}
  return [{narr:'Lord '+CHARS[st.id].name.replace('Lord ','')+' had already fallen to the shadow. The '+clan.name+' clan was finished before its lieutenants knew the war had come.'}];}
 return [{narr:nm+' was already dead.'}];}
let questCheckT=0;
function checkQuest(dt){questCheckT+=dt;if(questCheckT<0.5)return;questCheckT=0;if(questDone()||CUT.on||DLG.active()||SCENE.cur!=='world'||UI.open||FADE.t>0)return;const st=curStep();
 if(stepSatisfied(st)){const lines=skipLines(st);runDialogue(lines,()=>{if(curStep()===st)advanceStep();});}}
/* consequences of killing story characters out of order */
function onStoryDeath(n){const id=n.story;if(!id)return;S.flags['killed_'+id]=1;
 if(id==='sato'&&!S.flags.betrayalSeen&&S.ending!=='early'){S.flags.satoEarly=1;setTimeout(()=>playStoryCut('ending_early'),400);return;}
 if(id==='iki'&&S.quest<stepIndex('iki')){S.flags.ikiEarly=1;S.flags.ikiHead=1;moveSatoToThrone();S.quest=stepIndex('return');save();
  setTimeout(()=>{if(!DLG.active()&&!CUT.on)runDialogue(DL.iki_early,()=>{const st=curStep();toast('目的 · '+st.title+' — '+st.text,'#ffe9c0');});},600);return;}
 if(id==='oyone'&&!S.horse)S.flags.noHorse=1;
 if(id==='chamberlain')S.flags.muneyoriDead=1;
 if(CLANS.some(c=>c.lord===id)){const all=CLANS.every(c=>npcDead(c.lord));if(all&&S.ending!=='unified'&&(questDone()||S.flags.satoEarly)){setTimeout(()=>playStoryCut('ending'),600);}
  else if(all)S.flags.allLords=1;}}
window.onStoryDeath=onStoryDeath;
function questDone(){return S.quest>=STEPS.length;}
/* ---------- story NPC placement ---------- */
const STORY_POS={};
function townSpot(id,name){const t=TOWNS.find(t=>t.id===id);if(!t)return null;const s=t.spots[name]||t.spots.plaza;return s?{x:s.x,y:s.y}:{x:t.x,y:t.y};}
function regionSpot(regionId,kinds,name){const R=REGIONS[regionIndex(regionId)];for(const k of kinds){const t=R.towns.find(t=>t.kind===k);if(t){const s=t.spots[name]||t.spots.plaza;return s?{x:s.x,y:s.y}:{x:t.x,y:t.y};}}const t=R.towns[0];return t?{x:t.x,y:t.y}:{x:R.cx*TS,y:R.cy*TS};}
function spawnStoryNpcs(){
 const eagleSite={gonbei:()=>townSpot('biwa_dock','plaza'),ryoka:()=>regionSpot('yamato',['temple','shrine'],'altar'),danzo:()=>regionSpot('settsu',['port'],'plaza'),hanzo:()=>regionSpot('iga',['hideout'],'plaza'),daigo:()=>townSpot('koya_temple','altar'),kuroda:()=>townSpot('sekigahara','plaza'),tsuru:()=>regionSpot('owari',['castle','town'],'court'),yukimura:()=>regionSpot('echizen',['shrine','village','town'],'plaza')};
 EAGLES.forEach(e=>{const p=eagleSite[e]();STORY_POS[e]=p;placeStoryNpc(e,e,p.x,p.y+12,{wander:0});});
 const ikiP=LANDMARKS.ikiThrone;placeStoryNpc('iki','iki',ikiP.x,ikiP.y,{wander:0});
 const satoP=S.flags.part1done||S.quest>=STEPS.findIndex(s=>s.id==='return')?LANDMARKS.kyotoThrone:LANDMARKS.estateHall;placeStoryNpc('sato','sato',satoP.x,satoP.y,{wander:0});
 const oy=townSpot('start_village','plaza');placeStoryNpc('oyone','oyone',oy.x+26,oy.y-6,{wander:8,role:'horsekeeper',trade:'horse'});
 placeStoryNpc('chamberlain','chamberlain',LANDMARKS.estateHall.x-14,LANDMARKS.estateHall.y+2,{wander:0});if(S.flags.ikiHead)moveSatoToThrone();
 const dr=townSpot('start_village','entry');placeStoryNpc('drunk','ronin',dr.x+4,dr.y+10,{wander:6,role:'ronin',lvl:1,story:'drunk'});NPC_BY_ID.get('drunk').name='Drunk Rōnin';NPC_BY_ID.get('drunk').jp='酔った浪人';
 const cove=townSpot('secret_cove','plaza');placeStoryNpc('genzo','genzo',cove.x-10,cove.y-4,{wander:0});
 CLANS.forEach(c=>{const R=REGIONS[regionIndex(c.region)];const sites=[['shrine','temple','village'],['port','village','town']];
  c.lts.forEach((lt,i)=>{const p=regionSpot(c.region,sites[i],'plaza');placeStoryNpc(lt,lt,p.x+(i?8:-8),p.y+10,{wander:0});});
  const lp=regionSpot(c.region,['castle','town','port'],'court');placeStoryNpc(c.lord,c.lord,lp.x,lp.y,{wander:0});});
 // family only exists in the betrayal cutscene
}
function questTarget(){if(questDone())return null;const st=curStep();let p=null;
 if(st.target==='sato_estate')p=LANDMARKS.estateGate;else if(st.target==='throne')p=LANDMARKS.kyotoThrone;else{const n=NPC_BY_ID.get(st.target);if(n)p={x:n.x,y:n.y};}
 if(!p)return null;const d=dist(p.x,p.y,PL.x,PL.y);return {x:p.x,y:p.y,reached:d<40,dist:d,step:st};}
/* ---------- interactions ---------- */
function storyApproach(n,cb){ // a small cinematic: letterbox, camera to the NPC, they turn and step toward Kage
 const dx=PL.x-n.x,dy=PL.y-n.y,d=Math.hypot(dx,dy)||1;const to={x:n.x+dx/d*Math.max(0,d-18),y:n.y+dy/d*Math.max(0,d-18)};
 cutPlay([{letter:1},{cam:{x:(n.x+PL.x)/2,y:(n.y+PL.y)/2-10},dur:1.0},{face:n.id,dir:dir4(dx,dy)},{wait:0.35},{move:n.id,to,speed:30,dir:dir4(dx,dy)},{fn:()=>{hap('page');if(n.boss){FX.ring(n.x-CAM.x,n.y-CAM.y-12,4,40,'rgba(255,77,90,.9)',2,0.7);taiko(0.5,55);}}},{wait:0.4},{letter:0}],cb);}
function storyTalk(n){const st=curStep();
 if(!questDone()&&st.target===n.story&&!S.flags['app_'+st.id]&&st.kind!=='cut'){S.flags['app_'+st.id]=1;storyApproach(n,()=>storyTalk(n));return;}
 if(!questDone()&&st.target===n.story){ // this NPC is the current objective
  if(st.kind==='talk'){const lines=DL[st.before]||[];n.state='talkto';runDialogue(lines,()=>{n.state='idle';if(st.after){runDialogue(DL[st.after],()=>advanceStep());}else advanceStep();});return;}
  if(st.kind==='duel'){n.state='talkto';const go=()=>{startDuel(n,{story:st.id,retry:()=>{PL.hp=playerMaxHp();},onDone:res=>{if(res==='win'){const after=DL[st.after]||[];runDialogue(after,()=>{advanceStep();});}else{n.state='idle';}}});};
   if(st.before&&!S.flags['seen_'+st.before]){S.flags['seen_'+st.before]=1;runDialogue(DL[st.before],go);}else go();return;}
  if(st.kind==='cut'){playStoryCut(st.id);return;}}
 // not the objective: story NPC idle talk
 const lines=storyIdle(n);n.state='talkto';runDialogue(lines,()=>{n.state='idle';});}
function storyIdle(n){const id=n.story;const past=S.quest>STEPS.findIndex(s=>s.target===id);
 if(id==='sato')return [{who:'sato',mood:'calm',text:S.flags.ikiHead?'You have the box. Bring it to the great hall. The court is waiting.':'The Eagles are waiting for my face, Kage. Why are you still in Kyō?'},{choice:[{t:'Draw on him now (ends the story early)',fn:()=>{setTimeout(()=>{startDuel(n,{onDone:res=>{n.state='idle';}});},50);}},{t:'Leave'}]}];
 if(id==='oyone')return [{who:'oyone',mood:'warm',text:S.horse?'Kaze looks well. You ride him hard.':'Come back when you are ready for the horse.'}];
 if(id==='genzo')return [{who:'genzo',mood:'calm',text:'The map does not lie. The lords do. Eight of them.'}];
 if(id==='chamberlain')return [{who:'chamberlain',mood:'calm',text:'The lord is not to be kept waiting.'}];
 if(BOSSES[id]){const idx2=STEPS.findIndex(s=>s.target===id);if(S.quest<idx2)return [{who:id,mood:'grim',text:'You are not ready for me, shadow. Finish what you started on the road.'},{choice:[{t:'Challenge anyway (to the death)',fn:()=>{setTimeout(()=>{startDuel(n,{onDone:res=>{n.state='idle';if(res==='win'){S.flags['early_'+id]=1;}}});},50);}},{t:'Leave'}]}];
  return [{who:id,mood:'calm',text:'…'}];}
 return [{narr:'…'}];}
function runDialogue(lines,done){inputMode='ui';BTN_DEFS.length=0;MUSIC2.setDuck(0.45);DLG.start(lines,()=>{MUSIC2.setDuck(1);inputMode='world';if(window.worldButtons)worldButtons();if(done)done();},{style:DLSTYLE});}
function advanceStep(){const st=curStep();if(st.onDone)try{st.onDone();}catch(e){reportError(e);}S.quest++;S.questStep=0;save();
 if(!questDone()){const n=curStep();toast('目的 · '+n.title+' — '+n.text,'#ffe9c0');hap('page');}
 if(questDone()&&S.ending!=='unified'){playStoryCut('ending');}}
/* ---------- big cutscenes ---------- */
function playStoryCut(id,after){
 if(id==='prologue'){const hall=LANDMARKS.estateHall;const sat=NPC_BY_ID.get('sato'),ch=NPC_BY_ID.get('chamberlain');
  cutPlay([{letter:1},{music:'story',fallback:['explore_kansai','title']},{walkPlayer:1,to:{x:hall.x,y:hall.y+22},dir:1},{cam:{x:hall.x,y:hall.y},dur:1.5},{wait:0.5},{face:'sato',dir:0},{dlg:DL.prologue.slice(0,9)},
   {fn:()=>{PL.frame=4;}},{dlg:DL.prologue.slice(9,19)},{spawn:{id:'hana',char:'hana',x:hall.x-30,y:hall.y-10,dir:0}},{spawn:{id:'taro',char:'taro',x:hall.x-22,y:hall.y-2,dir:0}},{spawn:{id:'fumi',char:'fumi',x:hall.x-38,y:hall.y-2,dir:0}},{hap:'hurt'},{shake:6},{wait:0.6},{dlg:DL.prologue.slice(19)},{fade:'out',dur:0.8},{remove:'hana'},{remove:'taro'},{remove:'fumi'},{fn:()=>{PL.x=LANDMARKS.estateGate.x;PL.y=LANDMARKS.estateGate.y+8;PL.dir=0;}},{fade:'in',dur:0.8},{letter:0}],()=>{advanceStep();if(after)after();});return;}
 if(id==='return'){const th=LANDMARKS.kyotoThrone,court=LANDMARKS.kyotoCourt;const sat=NPC_BY_ID.get('sato');sat.x=th.x;sat.y=th.y;sat.hx=th.x;sat.hy=th.y;const ch=NPC_BY_ID.get('chamberlain');const noMun=!ch||ch.dead;const killer=noMun?'sato':'chamberlain';S.flags.betrayalSeen=1;save();
  const B=DL.betrayal.map(l=>Object.assign({},l));if(noMun){B[1]={narr:'The guards led him into the great hall. There was no chamberlain to announce him; Muneyori was dead, and everyone in the room knew whose work that was.'};B[4]={who:'sato',mood:'laugh',text:'Iki Nobutora. The shōgun of the provinces. In a box. I will have it lacquered. Guards — bring the guests. Our shadow has earned his reunion.'};B[9]={who:'sato',mood:'smirk',text:'And I keep my vows. Muneyori is dead — you saw to that — so I will have to keep this one myself. I have not held a sword in years. Forgive the mess.'};B[11]={narr:'The lord’s sword was already out. It went through Fumi first, because she was nearest. She did not even turn.'};B[13]={who:'sato',mood:'calm',text:'Hold him. Gently. He is my face; do not mark it.'};}
  cutPlay([{letter:1},{music:'betrayal',fallback:['boss_sato','duel']},{fn:()=>{if(!noMun){ch.x=th.x+20;ch.y=th.y+8;ch.hx=ch.x;ch.hy=ch.y;ch.dir=2;}}},{walkPlayer:1,to:{x:court.x,y:court.y+6},dir:1},{cam:{x:th.x,y:th.y+10},dur:1.5},{dlg:B.slice(0,5)},
   {spawn:{id:'fumi',char:'fumi',x:th.x-40,y:th.y+30,dir:3}},{spawn:{id:'hana',char:'hana',x:th.x-52,y:th.y+30,dir:3}},{spawn:{id:'taro',char:'taro',x:th.x-62,y:th.y+32,dir:3}},
   {move:'fumi',to:{x:th.x-16,y:th.y+22},speed:30},{move:'hana',to:{x:th.x-28,y:th.y+24},speed:34},{move:'taro',to:{x:th.x-36,y:th.y+28},speed:52},{dlg:B.slice(5,10)},
   {move:killer,to:{x:th.x-8,y:th.y+22},speed:70,dir:2},{sfx:'steel'},{wait:0.3},{kill:'fumi',dir:1},{sfx:'squelch'},{hap:'hurtHeavy'},{shake:8},{fx:'flash'},{dlg:B.slice(10,13)},
   {move:killer,to:{x:th.x-20,y:th.y+24},speed:60,dir:2},{wait:0.4},{kill:'hana',dir:0},{sfx:'squelch'},{hap:'death'},{shake:8},{dlg:B.slice(13,17)},
   {move:killer,to:{x:th.x-30,y:th.y+28},speed:60,dir:2},{wait:0.6},{kill:'taro',dir:1},{sfx:'crack'},{hap:'death'},{shake:12},{fx:'flash'},{wait:1.2},{fn:()=>{if(noMun){sat.x=th.x;sat.y=th.y+6;}}},{dlg:B.slice(17)},{letter:0}],()=>{advanceStep();
   // immediately the final duel
   const n=NPC_BY_ID.get('sato');setTimeout(()=>{startDuel(n,{story:'sato',retry:()=>{PL.hp=playerMaxHp();},onDone:res=>{if(res==='win'){runDialogue(DL.sato_after,()=>{advanceStep();});}}});},100);});return;}
 if(id==='ending_early'){const th=LANDMARKS.kyotoThrone;const sat=NPC_BY_ID.get('sato');const at=sat?{x:sat.x,y:sat.y}:th;
  cutPlay([{letter:1},{music:'betrayal',fallback:['story','title']},{cam:{x:at.x,y:at.y},dur:2},{wait:0.8},{dlg:DL.ending_early.slice(0,3)},{shake:10},{fade:'out',dur:1.0},{fn:()=>{PL.x=th.x;PL.y=th.y+20;PL.dir=1;CAM.x=PL.x-W/2;CAM.y=PL.y-H/2;}},
   {spawn:{id:'fumi',char:'fumi',x:th.x-20,y:th.y+14,dir:0}},{spawn:{id:'hana',char:'hana',x:th.x+2,y:th.y+18,dir:0}},{spawn:{id:'taro',char:'taro',x:th.x+20,y:th.y+14,dir:0}},{kill:'fumi',dir:1},{kill:'hana',dir:0},{kill:'taro',dir:1},{fade:'in',dur:1.2},{wait:1.5},{dlg:DL.ending_early.slice(3)},{fade:'out',dur:1.5}],
   ()=>{S.ending='early';S.quest=STEPS.length;S.part=2;S.flags.secretMap=1;S.flags.part1done=1;WAYPOINTS.forEach(w=>{if(w.sea)S.wps[w.id]=1;});save();if(window.startCredits)startCredits();});return;}
 if(id==='ending'){const th=LANDMARKS.kyotoThrone;cutPlay([{letter:1},{music:'credits',fallback:['title']},{walkPlayer:1,to:{x:th.x,y:th.y+14},dir:1},{cam:{x:th.x,y:th.y},dur:2},{wait:1},{dlg:DL.ending},{fade:'out',dur:1.5}],()=>{S.ending='unified';S.quest=STEPS.length;save();if(window.startCredits)startCredits();});return;}
}
/* ---------- world-fx (blood bursts in cutscenes) ---------- */
function updateWorldFx(dt){for(let i=WORLD_FX.length-1;i>=0;i--){const p=WORLD_FX[i];p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;if(p.t>p.l){WORLD_DECALS.push({x:p.x,y:p.y,r:1+Math.random()*1.5,col:'rgba(120,10,16,.7)'});WORLD_FX.splice(i,1);}}if(WORLD_DECALS.length>300)WORLD_DECALS.splice(0,WORLD_DECALS.length-300);}
function drawWorldFx(){for(const d of WORLD_DECALS){const x=d.x-CAM.x,y=d.y-CAM.y;if(x<-10||y<-10||x>W+10||y>H+10)continue;G.fillStyle=d.col;G.fillRect(Math.round(x-d.r),Math.round(y-d.r/2),Math.round(d.r*2),Math.round(d.r));}
 for(const p of WORLD_FX){G.fillStyle=p.col;G.fillRect(Math.round(p.x-CAM.x),Math.round(p.y-CAM.y),1,1);}}
