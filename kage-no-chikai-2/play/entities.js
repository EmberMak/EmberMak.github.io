'use strict';
/* ============================================================================
   ENTITIES — player, horse, NPCs (townsfolk, merchants, guards, roaming rōnin,
   story cast), movement & collision, camera, day/night, eclipse, region banners,
   guiding wind, ground loot & chests.
   ========================================================================== */
const PL={x:0,y:0,dir:0,frame:0,animT:0,moving:false,mounted:false,hp:100,speedMul:1,invis:0,lastStep:0,push:{x:0,y:0},run:false,jumpT:0,jumpDur:0.42,jx0:0,jy0:0,jx1:0,jy1:0,jumpCd:0,z:0,dust:[]};
const HORSE={x:0,y:0,dir:2,frame:0,animT:0,col:'#6b4a2e',state:'wait',t:0};
const CAM={x:0,y:0,tx:0,ty:0,shake:0};
const NPCS=[];const NPC_BY_ID=new Map();
const DAY={t:0.3,len:600};                           // t in [0,1): 0 midnight · .25 dawn · .5 noon · .75 dusk ; len = seconds per day
const ECLIPSE={on:false,t:0,dur:70,every:1500};      // seconds of play between eclipses
let BANNER=null,TOASTS=[],WIND=[],DROPS=[],CHESTS=[];
const GIVEN=['Tarō','Jirō','Saburō','Shirō','Gorō','Rokurō','Shichirō','Hachirō','Kurō','Jūrō','Kichi','Genta','Heiji','Sōsuke','Yasuke','Tomoe','Sakura','Ume','Kiku','Fuji','Hatsu','Sen','Tae','Yae','Koto','Mitsu','Suzu','Nobu','Masa','Tsune','Yoshi','Hide','Kane','Tada','Haru','Aki','Natsu','Fuyu','Kaze','Tsuki'];
const GIVEN_JP=['太郎','次郎','三郎','四郎','五郎','六郎','七郎','八郎','九郎','十郎','吉','源太','平次','惣助','弥助','巴','桜','梅','菊','藤','初','千','妙','八重','琴','光','鈴','信','正','常','義','秀','金','忠','春','秋','夏','冬','風','月'];
const FAMILY=['Tanaka','Satō','Suzuki','Watanabe','Itō','Yamamoto','Nakamura','Kobayashi','Katō','Yoshida','Yamada','Sasaki','Matsumoto','Inoue','Kimura','Hayashi','Shimizu','Yamazaki','Mori','Abe','Ikeda','Hashimoto','Ishikawa','Ogawa','Gotō','Okada','Hasegawa','Murakami','Kondō','Ishii'];
const FAMILY_JP=['田中','佐藤','鈴木','渡辺','伊藤','山本','中村','小林','加藤','吉田','山田','佐々木','松本','井上','木村','林','清水','山崎','森','阿部','池田','橋本','石川','小川','後藤','岡田','長谷川','村上','近藤','石井'];
// role archetypes → look + duel strength tier (1 weak … 6 merchant-class), talk pools, trade
const ROLE={
 villager:{chars:['villager','villagerf'],tier:1,weapon:'tanto',talk:'villager'},townsman:{chars:['villager'],tier:1,weapon:'tanto',talk:'town'},townswoman:{chars:['villagerf'],tier:1,weapon:'tessen',talk:'town'},
 farmer:{chars:['farmer'],tier:1,weapon:'bo',talk:'farmer'},fisher:{chars:['fisher'],tier:1,weapon:'yari',talk:'fisher'},child:{chars:['child'],tier:0,weapon:'bo',talk:'child'},elder:{chars:['elder'],tier:1,weapon:'bo',talk:'elder'},
 pilgrim:{chars:['pilgrim'],tier:1,weapon:'bo',talk:'pilgrim'},miko:{chars:['miko'],tier:2,weapon:'naginata',talk:'miko'},monk:{chars:['monk'],tier:2,weapon:'bo',talk:'monk'},abbot:{chars:['abbot'],tier:3,weapon:'bo',talk:'abbot'},
 innkeeper:{chars:['innkeeper'],tier:1,weapon:'tanto',talk:'inn',trade:'inn'},merchant:{chars:['merchant'],tier:6,weapon:'katana',talk:'merchant',trade:'shop'},horsekeeper:{chars:['horsekeeper'],tier:2,weapon:'bo',talk:'horse',trade:'horse'},
 ronin:{chars:['ronin'],tier:3,weapon:'katana',talk:'ronin',roam:1},bandit:{chars:['bandit'],tier:2,weapon:'tanto',talk:'bandit',roam:1},samurai:{chars:['samurai'],tier:4,weapon:'katana',talk:'samurai'},guard:{chars:['guard'],tier:3,weapon:'yari',talk:'guard'},ashigaru:{chars:['ashigaru'],tier:3,weapon:'yari',talk:'ashigaru'},
 shinobi:{chars:['shinobi'],tier:4,weapon:'tessen',talk:'shinobi'},sensei:{chars:['sensei'],tier:5,weapon:'bo',talk:'sensei'},sailor:{chars:['sailor'],tier:2,weapon:'kusarigama',talk:'sailor'},hunter:{chars:['hunter'],tier:3,weapon:'yari',talk:'hunter'},
};
const ROAM_ROLES=['ronin','bandit','pilgrim','monk','ronin','hunter','samurai'];
const WEAPON_BY_ROLE={villager:['tanto','bo'],farmer:['bo','kama'],ronin:['katana','odachi','wakizashi','nagamaki','iaito'],bandit:['tanto','kanabo','ono'],samurai:['katana','yari','naginata','iaito'],guard:['yari','naginata'],ashigaru:['yari','bo'],shinobi:['tessen','kusarigama','wakizashi','tanto'],sensei:['bo','katana','naginata','iaito'],monk:['bo','naginata'],merchant:['katana','odachi','nagamaki','tessen','iaito'],miko:['naginata'],hunter:['yari','ono'],sailor:['kusarigama','ono']};
/* ---------- NPC creation ---------- */
function regionTier(R){ // story order drives enemy level by region
 const order={yamashiro:1,omi:2,yamato:3,settsu:4,iga:5,kii:6,mino:7,owari:8,ise:5,echizen:9,harima:6,tanba:11,bitchu:13,aki:14,nagato:14,sanuki:15,tosa:16,chikuzen:17,higo:18,satsuma:19,shinano:19,kai:21,sagami:23,musashi:22,echigo:25,dewa:26,mutsu:27,tsugaru:28,ezo:29,kitaezo:30};return order[R.id]||10;}
function makeNpc(id,role,x,y,o){o=o||{};const rng=RNG(hashStr(id));const rd=ROLE[role]||ROLE.villager;const ch=o.char||rng.pick(rd.chars);const def=CHARS[ch];
 const gi=rng.int(0,GIVEN.length-1),fi=rng.int(0,FAMILY.length-1);const female=!!(def.sprite&&def.sprite.female);
 const R=regionAt(Math.floor(x/TS),Math.floor(y/TS));const lvl=o.lvl||Math.max(1,regionTier(R||REGIONS[0])+rd.tier-1+(o.lvlAdj||0));
 const wk=o.weapon||rng.pick(WEAPON_BY_ROLE[role]||[rd.weapon]);const kind=WKIND[wk]?wk:'katana';
 const n={id,role,char:ch,name:o.name||(role==='child'?GIVEN[gi]:FAMILY[fi]+' '+GIVEN[gi]),jp:o.jp||(role==='child'?GIVEN_JP[gi]:FAMILY_JP[fi]+GIVEN_JP[gi]),x,y,hx:x,hy:y,dir:2,frame:0,animT:0,state:'idle',t:rng.range(0.5,3),
  wander:o.wander||(rd.roam?48:22),speed:o.speed||(role==='child'?34:26),lvl,tier:rd.tier,weapon:kind,sprite:Object.assign({},def.sprite||{},{weapon:kind}),talk:rd.talk,trade:o.trade||rd.trade||'petty',shop:o.shop||null,
  boss:o.boss||null,story:o.story||null,town:o.town||null,region:R?R.id:null,rng,stock:null,dead:false,deadT:0,fallDir:0,greetT:0,bob:0,female,important:!!o.important};
 if(S.dead[id])n.dead=true;NPCS.push(n);NPC_BY_ID.set(id,n);return n;}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function spawnWorldNpcs(){
 TOWNS.forEach(t=>{t.npcs.forEach((sl,i)=>{const id=t.id+'#'+i;makeNpc(id,sl.role,sl.x,sl.y,{town:t.id,shop:sl.shop||null});});});
 // roaming folk along roads: deterministic sampling of road tiles
 let n=0;for(let y=4;y<MAPH-4;y+=3)for(let x=4;x<MAPW-4;x+=3){const i=idx(x,y);if(OCC[i]!==1||TILES[i]===TILE.PLANK)continue;if(hash2(x,y,501)>0.018)continue;const r=ROAM_ROLES[Math.floor(hash2(x,y,502)*ROAM_ROLES.length)];makeNpc('roam#'+x+'_'+y,r,x*TS+8,y*TS+8,{wander:70});n++;}
 // wilderness bandits in forests / passes
 for(let y=4;y<MAPH-4;y+=4)for(let x=4;x<MAPW-4;x+=4){const i=idx(x,y);if(!ISL[i]||OCC[i]!==0)continue;const t=TILES[i];if(!(t===TILE.FOREST||t===TILE.FOREST2||t===TILE.BAMBOO||t===TILE.TALL))continue;if(hash2(x,y,503)>0.012)continue;const r=hash2(x,y,504)<0.6?'bandit':hash2(x,y,504)<0.85?'ronin':'hunter';makeNpc('wild#'+x+'_'+y,r,x*TS+8,y*TS+8,{wander:60,lvlAdj:1});}
 // treasure chests
 CHESTS.length=0;for(let y=6;y<MAPH-6;y+=4)for(let x=6;x<MAPW-6;x+=4){const i=idx(x,y);if(!ISL[i]||OCC[i]!==0||!WALKABLE.has(TILES[i]))continue;const t=TILES[i];const inWild=t===TILE.FOREST||t===TILE.FOREST2||t===TILE.BAMBOO||t===TILE.TALL||t===TILE.SNOW2;if(hash2(x,y,601)>(inWild?0.06:0.012))continue;CHESTS.push({id:'chest#'+x+'_'+y,x:x*TS+8,y:y*TS+12,rar:hash2(x,y,602)<0.5?'rare':hash2(x,y,602)<0.85?'epic':'legendary'});}
 // one hidden chest behind a building in every town
 TOWNS.forEach(t=>{const b=t.buildings[t.buildings.length-1];if(!b)return;const B=BUILD[b.k];const tx=b.tx+B.tw,ty=b.ty+B.th-1;if(inMap(tx,ty)&&!blocked(tx,ty))CHESTS.push({id:'chest#'+t.id,x:tx*TS+8,y:ty*TS+12,rar:hash2(tx,ty,603)<0.6?'rare':'epic'});});
}
function snapToFree(x,y){let tx=Math.floor(x/TS),ty=Math.floor(y/TS);if(!blocked(tx,ty))return {x,y};for(let r=1;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(!blocked(tx+dx,ty+dy))return {x:(tx+dx)*TS+8,y:(ty+dy)*TS+10};}return {x,y};}
function placeStoryNpc(id,charId,x,y,o){o=o||{};const def=CHARS[charId];const b=BOSSES[charId];const sp=snapToFree(x,y);x=sp.x;y=sp.y;const n=makeNpc(id,o.role||'samurai',x,y,Object.assign({char:charId,name:def.name,jp:def.jp,wander:o.wander==null?0:o.wander,story:o.story||charId,boss:b?charId:null,weapon:def.weapon||o.weapon,lvl:b?b.lvl:(o.lvl||5),important:1,speed:22},o));n.talk='story';n.trade=o.trade||null;n.dir=o.dir==null?0:o.dir;return n;}
/* ---------- NPC duel stats ---------- */
function npcDuelDef(n){const def=CHARS[n.char];const b=n.boss?BOSSES[n.boss]:null;const tierHp=[90,160,260,380,520,700,1500][Math.min(6,n.tier)];const tierDm=[5,8,10,12,14,15,19][Math.min(6,n.tier)];
 const lv=n.lvl;const hp=b?b.hp*(1+lv*0.02):tierHp*(1+lv*0.07);const dmg=b?b.dmg:tierDm*(1+lv*0.03);const aggr=b?b.aggr:[1300,1100,950,850,780,700,520][Math.min(6,n.tier)];
 const pat=b?b.pat:n.tier>=6?PW(3,4,3,2,3,4):n.tier>=5?PW(3,3,2,2,2,3):n.tier>=4?PW(3,3,2,1,1,2):n.tier>=3?PW(3,2,1,1,1,1):n.tier>=2?PW(3,1,1,0,0,0):PW(4,0,0,0,0,0);
 const look=n.sprite;const hat=look.hat||(look.hairStyle==='bald'?'shaven':'topknot');
 return {key:n.id,name:n.name,jp:n.jp,hp:Math.round(hp),dmg,aggr,pat,blk:b?b.blk:Math.min(0.45,0.05+n.tier*0.07),wpn:n.weapon,look:{hat,armor:!!look.armor,cloak:!!look.cape,bulk:look.big?1.3:1,female:!!look.female,skin:look.skin,hair:look.hair,bodyCol:look.bodyCol,armorCol:look.armorCol,capeCol:look.capeCol,hatCol:look.hatCol,trim:look.trim},boss:!!b,final:!!(b&&b.final),lord:!!(b&&b.lord),p2name:b?b.p2name:null,lvl:lv,bg:b?b.bg:null,char:n.char,drop:b?b.drop:null};}
/* ---------- merchant stock ---------- */
function npcStock(n){if(n.stock)return n.stock;const rng=RNG(hashStr(n.id+'stock')+S.eclipses*13);const st=[];const R=regionAt(Math.floor(n.x/TS),Math.floor(n.y/TS));const lv=Math.max(1,regionTier(R||REGIONS[0]));
 if(n.trade==='shop'){const bias=n.shop==='armory'?0.5:n.shop==='exotic'?0.75:n.shop==='shinobi'?0.6:0.35;const cnt=n.shop==='exotic'?7:6;
  for(let i=0;i<cnt;i++){let rar=rollRarity(rng,bias);if(RARITY_ORDER.indexOf(rar)<2&&rng()<0.6)rar=rng()<0.5?'epic':'legendary';if(i===0&&n.shop!=='general')rar=rng()<0.25?'mythic':'legendary';const kind=n.shop==='shinobi'?rng.pick(['tessen','kusarigama','wakizashi','tanto','bo']):undefined;st.push(genWeapon(rng,{rar,lvl:lv,kind}));}
  for(let i=0;i<3;i++)st.push(genGear(rng,rng.pick(['helm','body','charm']),{bias:0.5,lvl:lv}));
  st.push(genConsumable('onigiri'),genConsumable('mochi'),genConsumable('sake'));}
 else if(n.trade==='inn'){st.push(genConsumable('onigiri'),genConsumable('mochi'),genConsumable('tea'),genConsumable('sake'));}
 else if(n.trade==='horse'){st.push(genConsumable('onigiri'),genConsumable('mochi'));}
 else{ // petty trade: everyone carries something
  st.push(genConsumable(rng.pick(['onigiri','onigiri','mochi','sake','tea'])));if(rng()<0.5)st.push(genConsumable('onigiri'));
  if(rng()<0.55)st.push(genWeapon(rng,{kind:n.weapon,rar:rollRarity(rng,Math.min(0.5,n.tier*0.08)),lvl:lv}));
  if(rng()<0.35)st.push(genGear(rng,rng.pick(['helm','body','charm']),{bias:Math.min(0.4,n.tier*0.06),lvl:lv}));}
 n.stock=st;return st;}
/* ---------- collision & movement ---------- */
function passable(px,py,mounted,fromX,fromY){ // feet box 8×5 around (px,py); the Part-Two seal only stops ENTERING a sealed province
 const hw=4,hh=2;const corners=[[px-hw,py-hh],[px+hw,py-hh],[px-hw,py+hh],[px+hw,py+hh]];
 const fromSealed=S.part===1&&fromX!=null&&(()=>{const R=regionAt(Math.floor(fromX/TS),Math.floor(fromY/TS));return R&&R.part===2;})();
 for(const [x,y] of corners){const tx=Math.floor(x/TS),ty=Math.floor(y/TS);if(blocked(tx,ty))return false;
  if(S.part===1&&!fromSealed){const R=regionAt(tx,ty);if(R&&R.part===2)return false;}
  if(mounted){const t=tileAt(tx,ty);if(t===TILE.PLANK)continue;}}
 return true;}
function moveEntity(e,dx,dy,mounted){if(!dx&&!dy)return false;let moved=false;const fx=e.x,fy=e.y;
 if(dx&&passable(e.x+dx,e.y,mounted,fx,fy)){e.x+=dx;moved=true;}else if(dx&&Math.abs(dy)<0.01){ // slide along obstacles
  if(passable(e.x+dx,e.y-1.5,mounted,fx,fy)){e.y-=1.5;e.x+=dx*0.5;moved=true;}else if(passable(e.x+dx,e.y+1.5,mounted,fx,fy)){e.y+=1.5;e.x+=dx*0.5;moved=true;}}
 if(dy&&passable(e.x,e.y+dy,mounted,fx,fy)){e.y+=dy;moved=true;}else if(dy&&Math.abs(dx)<0.01){if(passable(e.x-1.5,e.y+dy,mounted,fx,fy)){e.x-=1.5;e.y+=dy*0.5;moved=true;}else if(passable(e.x+1.5,e.y+dy,mounted,fx,fy)){e.x+=1.5;e.y+=dy*0.5;moved=true;}}
 return moved;}
function dir4(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);}
/* ---------- player ---------- */
function initPlayer(){if(S.px&&S.py){PL.x=S.px;PL.y=S.py;}else{PL.x=LANDMARKS.start.x;PL.y=LANDMARKS.start.y;}const sp=snapToFree(PL.x,PL.y);PL.x=sp.x;PL.y=sp.y;
 PL.hp=S.hp||playerMaxHp();PL.mounted=!!S.mounted&&!!S.horse;HORSE.x=S.hx||PL.x+18;HORSE.y=S.hy||PL.y;CAM.x=PL.x-W/2;CAM.y=PL.y-H/2;CAM.tx=CAM.x;CAM.ty=CAM.y;}
function playerSpriteDef(){const base=Object.assign({},CHARS.kage.sprite);const h=eqItem('helm'),b=eqItem('body'),w=eqItem('weapon');
 if(h&&h.hat){base.hat=h.hat;if(h.hatCol)base.hatCol=h.hatCol;}if(b){base.bodyCol=b.bodyCol||base.bodyCol;base.armor=!!b.armor;base.armorCol=b.armorCol;}if(w)base.weapon=w.kind;base.weaponCol=w&&RARITY[w.rar]&&w.rar!=='common'?RARITY[w.rar].col:'#d8dde6';return base;}
function playerJump(){if(PL.jumpT>0||PL.jumpCd>0)return;const d=[[0,1],[0,-1],[-1,0],[1,0]][PL.dir];let dx=d[0],dy=d[1];if(IN.stick.mag>0.2){dx=IN.stick.dx/IN.stick.mag;dy=IN.stick.dy/IN.stick.mag;}
 const len=PL.mounted?44:30;PL.jx0=PL.x;PL.jy0=PL.y;PL.jx1=PL.x+dx*len;PL.jy1=PL.y+dy*len;PL.jumpT=0.0001;PL.jumpDur=PL.mounted?0.5:0.42;PL.jumpCd=0.35;PL.dir=dir4(dx,dy);whoosh(0.15,0.3,true);hap('tap');}
function updatePlayer(dt){const k=keyStick();let dx=IN.stick.dx,dy=IN.stick.dy,m=IN.stick.mag;if(k.mag){dx=k.dx;dy=k.dy;m=1;}
 PL.jumpCd=Math.max(0,PL.jumpCd-dt);PL.run=!!IN.hold.run||!!IN.keys.shift;
 if(PL.jumpT>0){ // mid-air: follow the arc, ignore collision, land on a free tile
  PL.jumpT+=dt;const q=Math.min(1,PL.jumpT/PL.jumpDur);PL.x=lerp(PL.jx0,PL.jx1,q);PL.y=lerp(PL.jy0,PL.jy1,q);PL.z=Math.sin(q*Math.PI)*(PL.mounted?14:11);PL.moving=true;PL.animT+=dt*6;PL.frame=1;
  if(q>=1){PL.jumpT=0;PL.z=0;let land=null;if(passable(PL.x,PL.y,PL.mounted,PL.jx0,PL.jy0))land={x:PL.x,y:PL.y};else{const sp=snapToFree(PL.x,PL.y);if(passable(sp.x,sp.y,PL.mounted,PL.jx0,PL.jy0)&&dist(sp.x,sp.y,PL.x,PL.y)<40)land=sp;}
   if(!land){PL.x=PL.jx0;PL.y=PL.jy0;toast('No footing there.','#ffb070');}else{PL.x=land.x;PL.y=land.y;}thud(0.25);if(PL.mounted)hoof(0.1);else step(0.08);for(let i=0;i<6;i++)PL.dust.push({x:PL.x+(Math.random()-0.5)*10,y:PL.y+(Math.random()-0.5)*4,t:0,l:0.4+Math.random()*0.3});}
  if(PL.mounted){HORSE.x=PL.x;HORSE.y=PL.y;HORSE.dir=PL.dir;}S.px=PL.x;S.py=PL.y;const kk=1-Math.pow(0.001,dt);CAM.tx=PL.x-W/2;CAM.ty=PL.y-H/2;CAM.x+=(CAM.tx-CAM.x)*kk;CAM.y+=(CAM.ty-CAM.y)*kk;CAM.x=clamp(CAM.x,0,MAPW*TS-W);CAM.y=clamp(CAM.y,0,MAPH*TS-H);return;}
 // auto-unstuck: never leave Kage standing inside a wall
 if(!passable(PL.x,PL.y,false,PL.x,PL.y)){const sp=snapToFree(PL.x,PL.y);if(passable(sp.x,sp.y,false,sp.x,sp.y)){PL.x=sp.x;PL.y=sp.y;}}
 for(let i=PL.dust.length-1;i>=0;i--){const d=PL.dust[i];d.t+=dt;if(d.t>d.l)PL.dust.splice(i,1);}
 const base=PL.mounted?118:58;const sp=base*PL.speedMul*(m>0.6?1:0.65)*(PL.run?(PL.mounted?1.35:1.75):1);PL.moving=m>0.08;
 if(PL.moving){const vx=dx/Math.max(0.0001,Math.hypot(dx,dy))*sp*dt,vy=dy/Math.max(0.0001,Math.hypot(dx,dy))*sp*dt;PL.dir=dir4(dx,dy);
  const moved=moveEntity(PL,vx,vy,PL.mounted);
  if(!moved&&S.part===1){const R=regionAt(Math.floor((PL.x+dx*12)/TS),Math.floor((PL.y+dy*12)/TS));if(R&&R.part===2&&T-(PL.sealT||0)>4){PL.sealT=T;toast('関所 · The border to '+R.name+' is sealed by Lord Satō’s edict.','#ffb070');hap('tick');}}PL.animT+=dt*(PL.mounted?9:7)*(PL.run?1.6:1);PL.frame=Math.floor(PL.animT)%4;
  if(moved&&PL.run&&Math.random()<0.35)PL.dust.push({x:PL.x+(Math.random()-0.5)*6,y:PL.y+1,t:0,l:0.35});
  if(moved){const now=T;if(now-PL.lastStep>(PL.mounted?0.16:0.28)/(PL.run?1.6:1)){PL.lastStep=now;const t=tileAt(Math.floor(PL.x/TS),Math.floor(PL.y/TS));if(PL.mounted)hoof(0.08);else step(0.05,t===TILE.SAND||t===TILE.SNOW||t===TILE.GRASS);}}}
 else{PL.frame=0;PL.animT=0;}
 if(PL.mounted){HORSE.x=PL.x;HORSE.y=PL.y;HORSE.dir=PL.dir;HORSE.frame=PL.frame;}
 else if(S.horse&&HORSE.state==='come'){const d=dist(HORSE.x,HORSE.y,PL.x,PL.y);if(d<14){HORSE.state='wait';}else{const sp=150*dt;HORSE.x+=(PL.x-HORSE.x)/d*sp;HORSE.y+=(PL.y-HORSE.y)/d*sp;HORSE.dir=dir4(PL.x-HORSE.x,PL.y-HORSE.y);HORSE.animT+=dt*10;HORSE.frame=Math.floor(HORSE.animT)%4;}}
 S.px=PL.x;S.py=PL.y;S.hx=HORSE.x;S.hy=HORSE.y;S.hp=PL.hp;S.mounted=PL.mounted;
 // camera
 const look=PL.mounted?28:16;CAM.tx=PL.x-W/2+dx*look*m;CAM.ty=PL.y-H/2+dy*look*m;const kk=1-Math.pow(0.001,dt);CAM.x+=(CAM.tx-CAM.x)*kk;CAM.y+=(CAM.ty-CAM.y)*kk;
 CAM.x=clamp(CAM.x,0,MAPW*TS-W);CAM.y=clamp(CAM.y,0,MAPH*TS-H);
 // region banner
 const R=regionAt(Math.floor(PL.x/TS),Math.floor(PL.y/TS));if(R&&R!==PL.region){PL.region=R;if(!S.visited[R.id]){S.visited[R.id]=1;addXp(25);}showBanner(R);if(window.onRegionEnter)onRegionEnter(R);}
 // waypoint discovery
 for(const wp of WAYPOINTS){if(S.wps[wp.id])continue;if(Math.abs(wp.x-PL.x)<28&&Math.abs(wp.y-PL.y)<28){if(wp.hidden&&!S.flags.secretMap)continue;if(S.part===1){const RW=REGIONS[regionIndex(wp.region)];if(RW&&RW.part===2)continue;}S.wps[wp.id]=1;save();chime(1046,0.14,2);hap('unlock');toast('風の社 · Wind Shrine discovered — '+wp.name,'#9fe3ff');FX.ring(wp.x-CAM.x,wp.y-CAM.y,4,60,'rgba(159,227,255,.9)',2,0.8);addXp(40);}}
 // chests & ground drops
 for(const c of CHESTS){if(S.flags['open_'+c.id])continue;if(Math.abs(c.x-PL.x)<12&&Math.abs(c.y-PL.y)<12){S.flags['open_'+c.id]=1;const rng=RNG(hashStr(c.id));const it=rng()<0.7?genWeapon(rng,{rar:c.rar,lvl:PL.region?regionTier(PL.region):1}):genGear(rng,rng.pick(['helm','body','charm']),{rar:c.rar});addItem(it);const coins=rng.int(20,120);S.coins+=coins;
   toast('Found '+it.name+' and '+coins+' mon','#ffd27a');coin(0.15);chime(1318,0.08,1);hap('buy');save();}}
 for(let i=DROPS.length-1;i>=0;i--){const d=DROPS[i];d.t+=dt;if(d.t>0.6&&Math.abs(d.x-PL.x)<11&&Math.abs(d.y-PL.y)<11){DROPS.splice(i,1);if(d.item){addItem(d.item);toast('Picked up '+d.item.name,RARITY[d.item.rar].col);}if(d.coins){S.coins+=d.coins;toast('+'+d.coins+' mon','#ffd27a');coin(0.12);}hap('equip');save();}}
}
function addXp(v){S.xp+=Math.round(v*gmul('xp'));while(S.xp>=xpFor(S.level)){S.xp-=xpFor(S.level);S.level++;PL.hp=playerMaxHp();toast('LEVEL '+S.level+' — 昇段','#ffe9c0');hap('levelUp');chime(1568,0.12,2.2);}}
/* ---------- NPC AI ---------- */
function updateNpcs(dt){const px=PL.x,py=PL.y;for(const n of NPCS){const d2=(n.x-px)**2+(n.y-py)**2;if(d2>900*900)continue;
 if(n.dead){n.deadT+=dt;continue;}
 n.bob+=dt;if(n.state==='talkto'){n.dir=dir4(px-n.x,py-n.y);n.frame=0;continue;}
 if(n.state==='cut'){n.frame=0;continue;} // cutscene-controlled
 if(n.wander===0){n.frame=0;if(d2<40*40){n.dir=dir4(px-n.x,py-n.y);}continue;}
 n.t-=dt;if(n.state==='idle'){n.frame=0;if(n.t<=0){const a=n.rng()*TAU,r=n.rng()*n.wander;n.tx=n.hx+Math.cos(a)*r;n.ty=n.hy+Math.sin(a)*r;n.state='walk';n.t=n.rng.range(1.5,4);}
  if(d2<30*30&&n.greetT<=0){n.dir=dir4(px-n.x,py-n.y);}}
 else if(n.state==='walk'){const dx=n.tx-n.x,dy=n.ty-n.y,dd=Math.hypot(dx,dy);if(dd<2||n.t<=0){n.state='idle';n.t=n.rng.range(1,4);n.frame=0;continue;}
  if(d2<22*22){n.state='idle';n.t=0.8;n.frame=0;continue;}  // don't walk into the player
  const sp=n.speed*dt;const moved=moveEntity(n,dx/dd*sp,dy/dd*sp,false);if(!moved){n.state='idle';n.t=n.rng.range(1,3);}n.dir=dir4(dx,dy);n.animT+=dt*6;n.frame=Math.floor(n.animT)%4;}
}}
function npcNear(){let best=null,bd=26*26;for(const n of NPCS){if(n.dead)continue;const d2=(n.x-PL.x)**2+(n.y-PL.y)**2;if(d2<bd){bd=d2;best=n;}}return best;}
function killNpc(n,fallDir){n.dead=true;n.deadT=0;n.state='idle';n.fallDir=fallDir||0;S.dead[n.id]=1;S.kills++;save();if(n.story&&window.onStoryDeath)try{onStoryDeath(n);}catch(e){reportError(e);}}
function reviveAll(){let c=0;for(const n of NPCS){if(n.dead&&!n.boss){n.dead=false;n.deadT=0;delete S.dead[n.id];n.x=n.hx;n.y=n.hy;n.stock=null;c++;}}save();return c;}
/* ---------- day / night / eclipse ---------- */
function updateDay(dt){DAY.t=(DAY.t+dt/DAY.len)%1;S.play+=dt;
 if(!ECLIPSE.on){S.eclipseT+=dt;if(S.eclipseT>ECLIPSE.every&&S.flags.firstDuel){startEclipse();}}
 else{ECLIPSE.t+=dt;if(Math.floor(ECLIPSE.t/7)!==Math.floor((ECLIPSE.t-dt)/7))hap('heartbeat');if(ECLIPSE.t>ECLIPSE.dur)endEclipse();}}
function startEclipse(){ECLIPSE.on=true;ECLIPSE.t=0;S.eclipseT=0;S.eclipses++;const c=reviveAll();showBanner({jp:'日蝕',name:'ECLIPSE',desc:c?'The sun is swallowed. '+c+' of the dead stand up again.':'The sun is swallowed. The dead stir.'},'#ff4d5a');hap('phase2');taiko(0.8,40);taiko(0.7,40,0.5);thud(0.6);MUSIC2.play('eclipse',{fallback:['boss_iki','duel']});save();}
function endEclipse(){ECLIPSE.on=false;toast('The light returns.','#ffe9c0');if(window.ambientMusic)ambientMusic(true);}
function nightAmount(){ // 0 day … 1 deep night
 const t=DAY.t;let n;if(t<0.2)n=1;else if(t<0.3)n=1-(t-0.2)/0.1;else if(t<0.72)n=0;else if(t<0.85)n=(t-0.72)/0.13;else n=1;return n;}
function drawDayTint(){const n=nightAmount();const t=DAY.t;
 if(ECLIPSE.on){const k=Math.min(1,ECLIPSE.t/4)*(ECLIPSE.t>ECLIPSE.dur-4?(ECLIPSE.dur-ECLIPSE.t)/4:1);G.globalCompositeOperation='multiply';G.fillStyle='rgba(120,20,30,'+(0.75*k)+')';G.fillRect(0,0,W,H);G.globalCompositeOperation='source-over';
  G.globalAlpha=0.35*k;G.fillStyle='#200008';G.fillRect(0,0,W,H);G.globalAlpha=1;return;}
 if(n>0){G.globalCompositeOperation='multiply';G.fillStyle='rgba(70,80,140,'+(0.78*n)+')';G.fillRect(0,0,W,H);G.globalCompositeOperation='source-over';}
 if(t>0.68&&t<0.8){const k=1-Math.abs(t-0.74)/0.06;G.globalCompositeOperation='multiply';G.fillStyle='rgba(255,170,110,'+(0.35*k)+')';G.fillRect(0,0,W,H);G.globalCompositeOperation='source-over';}
 if(t>0.22&&t<0.34){const k=1-Math.abs(t-0.28)/0.06;G.globalCompositeOperation='screen';G.fillStyle='rgba(255,190,150,'+(0.14*k)+')';G.fillRect(0,0,W,H);G.globalCompositeOperation='source-over';}}
function drawLights(props){const n=nightAmount();if(n<0.2&&!ECLIPSE.on)return;G.globalCompositeOperation='lighter';
 for(const p of props){const d=p.k[0]==='@'?null:PROPS[p.k];if(!d||!d.glow)continue;const x=p.x-CAM.x,y=p.y-CAM.y-(p.k==='lampost'?14:p.k==='campfire'?2:6);const r=p.k==='campfire'?26:18;const fl=0.8+0.2*Math.sin(T*9+p.x);
  G.globalAlpha=0.22*n*fl;G.fillStyle=p.k==='campfire'?'#ff9a3a':'#ffd27a';G.beginPath();G.arc(x,y,r,0,TAU);G.fill();G.globalAlpha=0.3*n*fl;G.beginPath();G.arc(x,y,r*0.45,0,TAU);G.fill();}
 G.globalAlpha=1;G.globalCompositeOperation='source-over';}
/* ---------- banners, toasts, wind ---------- */
function showBanner(R,col){BANNER={R,t:0,col:col||'#f3e6d0'};}
function toast(s,col){TOASTS.push({s,col:col||'#f3e6d0',t:0});if(TOASTS.length>4)TOASTS.shift();}
function updateWind(dt){const tg=window.questTarget?questTarget():null;const want=tg&&S.pinned&&!tg.reached;
 if(want&&WIND.length<(window.LITE?26:60)&&Math.random()<0.6){const a=Math.atan2(tg.y-PL.y,tg.x-PL.x);const ox=PL.x+(Math.random()-0.5)*W*0.9,oy=PL.y+(Math.random()-0.5)*H*0.9;WIND.push({x:ox,y:oy,a:a+(Math.random()-0.5)*0.5,v:70+Math.random()*60,t:0,l:1.2+Math.random()*1.2,leaf:Math.random()<0.18,ph:Math.random()*TAU});}
 for(let i=WIND.length-1;i>=0;i--){const w=WIND[i];w.t+=dt;if(w.t>w.l||!want&&w.t>0.4){WIND.splice(i,1);continue;}const s=Math.sin(w.t*3+w.ph)*0.35;w.x+=Math.cos(w.a+s)*w.v*dt;w.y+=Math.sin(w.a+s)*w.v*dt;}}
function drawWind(){if(!WIND.length)return;for(const w of WIND){const k=w.t/w.l,a=Math.sin(k*Math.PI);const x=w.x-CAM.x,y=w.y-CAM.y;if(w.leaf){G.globalAlpha=a;G.fillStyle=PL.region&&BIOME[PL.region.biome].snow?'#ffffff':PL.region&&PL.region.biome==='maple'?'#d2472f':PL.region&&PL.region.biome==='sakura'?'#f2b8c6':'#9ac86a';G.fillRect(Math.round(x),Math.round(y),2,2);}
  else{G.globalAlpha=0.8*a;G.strokeStyle='#ffffff';G.lineWidth=1.5;G.beginPath();G.moveTo(x,y);const s=Math.sin(w.t*3+w.ph)*0.35;G.lineTo(x-Math.cos(w.a+s)*18,y-Math.sin(w.a+s)*18);G.stroke();G.globalAlpha=0.35*a;G.beginPath();G.moveTo(x-Math.cos(w.a+s)*18,y-Math.sin(w.a+s)*18);G.lineTo(x-Math.cos(w.a+s)*30,y-Math.sin(w.a+s)*30);G.stroke();}}G.globalAlpha=1;}
/* ---------- ambient weather: snow, petals, leaves, embers, fireflies ---------- */
const WEATHER=[];
function updateWeather(dt){const R=PL.region;if(!R)return;const b=R.biome;const kind=BIOME[b].snow?'snow':b==='sakura'?'petal':b==='maple'?'leaf':b==='volcanic'?'ember':nightAmount()>0.5?'firefly':null;
 const cap=window.LITE?20:kind==='snow'?70:40;if(kind&&WEATHER.length<cap&&Math.random()<0.5){WEATHER.push({k:kind,x:CAM.x+Math.random()*W,y:kind==='ember'?CAM.y+H+4:CAM.y-4,vx:kind==='snow'?10:kind==='petal'?22:kind==='leaf'?16:0,vy:kind==='snow'?14:kind==='petal'?18:kind==='leaf'?22:kind==='ember'?-18:0,t:0,l:kind==='firefly'?3+Math.random()*3:8,ph:Math.random()*TAU});}
 for(let i=WEATHER.length-1;i>=0;i--){const p=WEATHER[i];p.t+=dt;if(p.k!==kind){WEATHER.splice(i,1);continue;}const sw=Math.sin(p.t*2+p.ph);p.x+=(p.vx+sw*12)*dt;p.y+=(p.vy+(p.k==='firefly'?sw*6:0))*dt;if(p.t>p.l||p.y>CAM.y+H+8||p.y<CAM.y-10||p.x<CAM.x-10||p.x>CAM.x+W+10)WEATHER.splice(i,1);}}
function drawWeather(){for(const p of WEATHER){const x=Math.round(p.x-CAM.x),y=Math.round(p.y-CAM.y);if(p.k==='snow'){G.fillStyle='#ffffff';G.fillRect(x,y,p.ph>3?2:1,p.ph>3?2:1);}else if(p.k==='petal'){G.fillStyle=p.ph>3?'#f6c8d4':'#eea7bb';G.fillRect(x,y,2,2);}else if(p.k==='leaf'){G.fillStyle=p.ph>3?'#d2472f':'#e07a3a';G.fillRect(x,y,2,2);}else if(p.k==='ember'){G.globalAlpha=0.5+0.5*Math.sin(p.t*9+p.ph);G.fillStyle=p.ph>3?'#ff9a3a':'#ffd27a';G.fillRect(x,y,1,1);G.globalAlpha=1;}else{G.globalAlpha=0.3+0.7*Math.abs(Math.sin(p.t*3+p.ph));G.fillStyle='#d8ff9a';G.fillRect(x,y,1,1);G.globalAlpha=1;}}}
/* ---------- drawing entities ---------- */
function drawSpriteFrame(sh,frame,dir,x,y,flipped){const col=frame,row=dir===3?2:dir;const sx=col*sh.fw,sy=row*sh.fh;const fl=dir===3||flipped;
 if(fl){G.save();G.translate(Math.round(x),Math.round(y));G.scale(-1,1);G.drawImage(sh.c,sx,sy,sh.fw,sh.fh,-Math.round(sh.fw/2),-sh.fh,sh.fw,sh.fh);G.restore();}
 else G.drawImage(sh.c,sx,sy,sh.fw,sh.fh,Math.round(x-sh.fw/2),Math.round(y-sh.fh),sh.fw,sh.fh);}
function drawShadow(x,y,w){G.fillStyle=PAL.shadow;G.fillRect(Math.round(x-w/2-CAM.x),Math.round(y-2-CAM.y),w,3);}
function drawNpc(n){const x=n.x-CAM.x,y=n.y-CAM.y;const sh=charSheet(n.sprite);
 if(n.dead){ // corpse + pool
  G.fillStyle='rgba(110,10,16,.75)';G.beginPath();G.ellipse(Math.round(x),Math.round(y-1),11+Math.min(6,n.deadT*3),4+Math.min(2,n.deadT),0,0,TAU);G.fill();
  drawSpriteFrame(sh,5,0,x,y+2,n.fallDir===1);return;}
 drawShadow(n.x,n.y,10);drawSpriteFrame(sh,n.frame,n.dir,x,y);
 if(n.important&&!n.boss){G.fillStyle='#ffd27a';G.fillRect(Math.round(x)-1,Math.round(y)-sh.fh-6+Math.round(Math.sin(T*4)*1.5),3,3);}
 if(n.boss){G.fillStyle='#ff4d5a';G.fillRect(Math.round(x)-2,Math.round(y)-sh.fh-7+Math.round(Math.sin(T*5)*1.5),5,2);G.fillRect(Math.round(x)-1,Math.round(y)-sh.fh-9+Math.round(Math.sin(T*5)*1.5),3,2);}}
function drawPlayer(){const x=PL.x-CAM.x,y=PL.y-CAM.y-PL.z;for(const d of PL.dust){G.globalAlpha=0.5*(1-d.t/d.l);G.fillStyle='#d8cdb0';G.fillRect(Math.round(d.x-CAM.x),Math.round(d.y-CAM.y-d.t*8),2,2);}G.globalAlpha=1;
 if(PL.mounted){const hs=horseSheet(HORSE.col);drawShadow(PL.x,PL.y,18-PL.z*0.4);drawSpriteFrame(hs,PL.frame,PL.dir,x,y);const sh=charSheet(playerSpriteDef());drawSpriteFrame(sh,0,PL.dir,x,y-9);}
 else{drawShadow(PL.x,PL.y,10-PL.z*0.3);const sh=charSheet(playerSpriteDef());drawSpriteFrame(sh,PL.frame,PL.dir,x,y);}}
function drawHorse(){if(!S.horse||PL.mounted)return;const hs=horseSheet(HORSE.col);drawShadow(HORSE.x,HORSE.y,18);drawSpriteFrame(hs,HORSE.state==='come'?HORSE.frame:0,HORSE.dir,HORSE.x-CAM.x,HORSE.y-CAM.y);}
function drawDrops(){for(const d of DROPS){const x=Math.round(d.x-CAM.x),y=Math.round(d.y-CAM.y)+Math.round(Math.sin(T*4+d.x)*1.5);if(d.item){const ic=itemIcon(d.item);G.drawImage(ic,x-8,y-14);G.fillStyle=RARITY[d.item.rar].col;G.globalAlpha=0.5+0.5*Math.sin(T*6);G.fillRect(x-1,y-1,2,2);G.globalAlpha=1;}else{G.fillStyle='#ffd27a';G.fillRect(x-2,y-6,4,4);G.fillStyle='#b8862a';G.fillRect(x-1,y-5,2,2);}}
 for(const c of CHESTS){if(S.flags['open_'+c.id])continue;const x=Math.round(c.x-CAM.x),y=Math.round(c.y-CAM.y);if(x<-20||y<-20||x>W+20||y>H+20)continue;G.fillStyle='#5a3a1a';G.fillRect(x-6,y-8,12,8);G.fillStyle='#8a6a3a';G.fillRect(x-6,y-9,12,3);G.fillStyle=RARITY[c.rar].col;G.fillRect(x-1,y-5,2,2);}}
function collectDrawables(out){for(const n of NPCS){const x=n.x-CAM.x,y=n.y-CAM.y;if(x<-30||x>W+30||y<-10||y>H+40)continue;out.push({y:n.dead?n.y-6:n.y,draw:()=>drawNpc(n)});}
 out.push({y:PL.y,draw:drawPlayer});if(S.horse&&!PL.mounted)out.push({y:HORSE.y,draw:drawHorse});}
