'use strict';
/* ============================================================================
   WORLD — a Japan-shaped archipelago (MAPW×MAPH tiles), provinces, terrain,
   rivers, roads, towns (castles, shrines, temples, villages, ports, forts),
   wind-shrine waypoints, chunk-cached rendering, minimap.
   Deterministic: everything derives from WORLD_SEED so saves stay valid.
   ========================================================================== */
const MAPW=640,MAPH=640,WORLD_SEED=20260723;
const TILES=new Uint8Array(MAPW*MAPH);     // tile ids (TILE.*)
const OCC=new Uint8Array(MAPW*MAPH);       // 0 free · 1 road · 2 town ground · 3 solid (prop/building) · 4 water · 5 reserved
const REG=new Uint8Array(MAPW*MAPH);       // region index+1 (0 = sea)
const HGT=new Uint8Array(MAPW*MAPH);       // height 0..255 (for the map)
const ISL=new Uint8Array(MAPW*MAPH);       // island id (1 honshu 2 shikoku 3 kyushu 4 hokkaido 5+ small)
const idx=(x,y)=>y*MAPW+x;
const inMap=(x,y)=>x>=0&&y>=0&&x<MAPW&&y<MAPH;
const tileAt=(x,y)=>inMap(x,y)?TILES[idx(x,y)]:TILE.DEEP;
const isWater=(x,y)=>WATERY.has(tileAt(x,y));
function blocked(tx,ty){if(!inMap(tx,ty))return true;const i=idx(tx,ty);if(OCC[i]===3)return true;return !WALKABLE.has(TILES[i]);}
/* ---------- geography: islands as capsules/blobs ---------- */
// capsule: a→b with radius r; island id
const SHAPES=[
 // Honshu spine (SW → NE)
 {isl:1,a:[100,420],b:[160,398],r:[22,30]},{isl:1,a:[160,398],b:[225,385],r:[30,31]},{isl:1,a:[225,385],b:[290,368],r:[31,40]},
 {isl:1,a:[290,368],b:[345,352],r:[40,44]},{isl:1,a:[345,352],b:[400,318],r:[44,44]},{isl:1,a:[400,318],b:[440,262],r:[44,36]},
 {isl:1,a:[440,262],b:[458,200],r:[32,28]},{isl:1,a:[458,200],b:[470,150],r:[28,20]},
 {isl:1,a:[300,375],b:[315,425],r:[26,22]},  // Kii peninsula
 {isl:1,a:[360,318],b:[372,290],r:[14,10]},  // Noto
 {isl:1,a:[425,322],b:[440,338],r:[16,14]},  // Bōsō
 {isl:1,a:[388,340],b:[395,352],r:[9,7]},    // Izu
 // Shikoku
 {isl:2,a:[205,462],b:[275,448],r:[22,24]},
 // Kyushu
 {isl:3,a:[85,486],b:[105,556],r:[36,34]},{isl:3,a:[70,470],b:[90,486],r:[14,20]},
 // Hokkaido
 {isl:4,a:[520,92],b:[565,52],r:[40,34]},{isl:4,a:[535,70],b:[590,88],r:[30,20]},{isl:4,a:[520,92],b:[548,126],r:[34,18]},{isl:4,a:[505,118],b:[478,158],r:[20,14]},{isl:4,a:[565,52],b:[600,28],r:[26,14]},
 // small islands
 {isl:5,a:[415,232],b:[418,246],r:[8,6]},    // Sado
 {isl:6,a:[272,402],b:[274,410],r:[6,5]},    // Awaji
 {isl:7,a:[58,428],b:[60,436],r:[5,4]},      // Tsushima
 {isl:8,a:[190,352],b:[193,355],r:[5,4]},    // Oki
];
function capDist(px,py,s){const ax=s.a[0],ay=s.a[1],bx=s.b[0],by=s.b[1];const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;let t=((px-ax)*dx+(py-ay)*dy)/l2;t=clamp(t,0,1);const cx=ax+dx*t,cy=ay+dy*t;const r=s.r[0]+(s.r[1]-s.r[0])*t;return Math.hypot(px-cx,py-cy)/r;}
/* ---------- provinces ---------- */
// part 1 = open from the start; part 2 = sealed by Sato's edict until the secret map is found.
// biome: temperate | sakura | maple | bamboo | snow | volcanic | marsh | pine
const REGIONS=[
 {id:'yamashiro',name:'Yamashiro',jp:'山城',cx:300,cy:366,part:1,biome:'bamboo',capital:'Kyō',capJp:'京',desc:'The old capital. Lord Satō’s castle casts a long shadow.'},
 {id:'omi',name:'Ōmi',jp:'近江',cx:330,cy:340,part:1,biome:'temperate',capital:'Hikone',capJp:'彦根',desc:'Reeds, boats and the mirror of Lake Biwa.'},
 {id:'yamato',name:'Yamato',jp:'大和',cx:308,cy:404,part:1,biome:'sakura',capital:'Nara',capJp:'奈良',desc:'Temples older than the clans. Deer walk the roads.'},
 {id:'settsu',name:'Settsu',jp:'摂津',cx:276,cy:382,part:1,biome:'temperate',capital:'Naniwa',capJp:'難波',desc:'Merchant port. Everything has a price, including silence.'},
 {id:'tanba',name:'Tanba',jp:'丹波',cx:280,cy:344,part:1,biome:'pine',capital:'Kurowashi',capJp:'黒鷲',desc:'Fog-bound mountains. Shōgun Iki’s Black Eagle Castle.'},
 {id:'iga',name:'Iga',jp:'伊賀',cx:332,cy:376,part:1,biome:'bamboo',capital:'Ueno',capJp:'上野',desc:'Shinobi country. The roads here forget you.'},
 {id:'kii',name:'Kii',jp:'紀伊',cx:306,cy:420,part:1,biome:'maple',capital:'Kōya',capJp:'高野',desc:'Red forests and a mountain of monks.'},
 {id:'ise',name:'Ise',jp:'伊勢',cx:344,cy:386,part:1,biome:'temperate',capital:'Yamada',capJp:'山田',desc:'The Grand Shrine stands by the sea.'},
 {id:'mino',name:'Mino',jp:'美濃',cx:352,cy:342,part:1,biome:'temperate',capital:'Gifu',capJp:'岐阜',desc:'Wide plains where every army has bled.'},
 {id:'owari',name:'Owari',jp:'尾張',cx:362,cy:364,part:1,biome:'temperate',capital:'Kiyosu',capJp:'清洲',desc:'Rice, kilns and ambitious men.'},
 {id:'echizen',name:'Echizen',jp:'越前',cx:330,cy:312,part:1,biome:'snow',capital:'Fuchū',capJp:'府中',desc:'The north coast. Snow until the fourth month.'},
 {id:'harima',name:'Harima',jp:'播磨',cx:248,cy:384,part:1,biome:'sakura',capital:'Himeji',capJp:'姫路',desc:'The White Heron castle watches the western road.'},
 // ---- Part Two ----
 {id:'bitchu',name:'Bitchū',jp:'備中',cx:212,cy:392,part:2,biome:'temperate',capital:'Matsuyama',capJp:'松山',desc:'Terraced hills and quiet castles.'},
 {id:'aki',name:'Aki',jp:'安芸',cx:165,cy:398,part:2,biome:'temperate',capital:'Yoshida',capJp:'吉田',clan:'mori',desc:'Mōri country. The sea gate of the west.'},
 {id:'nagato',name:'Nagato',jp:'長門',cx:112,cy:420,part:2,biome:'pine',capital:'Hagi',capJp:'萩',desc:'Where Honshū ends and the strait begins.'},
 {id:'sanuki',name:'Sanuki',jp:'讃岐',cx:258,cy:450,part:2,biome:'temperate',capital:'Takamatsu',capJp:'高松',desc:'Salt fields and pilgrim roads.'},
 {id:'tosa',name:'Tosa',jp:'土佐',cx:222,cy:462,part:2,biome:'temperate',capital:'Okō',capJp:'岡豊',clan:'chosokabe',desc:'Chōsokabe country, facing the open ocean.'},
 {id:'chikuzen',name:'Chikuzen',jp:'筑前',cx:88,cy:486,part:2,biome:'temperate',capital:'Hakata',capJp:'博多',desc:'The gateway port of Kyūshū.'},
 {id:'higo',name:'Higo',jp:'肥後',cx:98,cy:520,part:2,biome:'volcanic',capital:'Kumamoto',capJp:'熊本',desc:'Ash fields beneath a smoking mountain.'},
 {id:'satsuma',name:'Satsuma',jp:'薩摩',cx:100,cy:552,part:2,biome:'volcanic',capital:'Kagoshima',capJp:'鹿児島',clan:'shimazu',desc:'Shimazu country. The southern edge of the world.'},
 {id:'shinano',name:'Shinano',jp:'信濃',cx:378,cy:320,part:2,biome:'pine',capital:'Matsumoto',capJp:'松本',desc:'High valleys, cold rivers.'},
 {id:'kai',name:'Kai',jp:'甲斐',cx:392,cy:334,part:2,biome:'pine',capital:'Kōfu',capJp:'甲府',clan:'takeyama',desc:'Takeyama country. The horse lords of the mountains.'},
 {id:'sagami',name:'Sagami',jp:'相模',cx:412,cy:340,part:2,biome:'temperate',capital:'Odawara',capJp:'小田原',clan:'hojo',desc:'Hōjō country. A castle too big to besiege.'},
 {id:'musashi',name:'Musashi',jp:'武蔵',cx:424,cy:312,part:2,biome:'temperate',capital:'Edo',capJp:'江戸',desc:'A fishing town on a great plain.'},
 {id:'echigo',name:'Echigo',jp:'越後',cx:400,cy:282,part:2,biome:'snow',capital:'Kasugayama',capJp:'春日山',clan:'nagao',desc:'Nagao country. Snow country.'},
 {id:'dewa',name:'Dewa',jp:'出羽',cx:432,cy:242,part:2,biome:'snow',capital:'Yamagata',capJp:'山形',desc:'Mountain monks and silent snow.'},
 {id:'mutsu',name:'Mutsu',jp:'陸奥',cx:456,cy:210,part:2,biome:'snow',capital:'Sendai',capJp:'仙台',clan:'date',desc:'Date country. The one-eyed dragon’s land.'},
 {id:'tsugaru',name:'Tsugaru',jp:'津軽',cx:468,cy:160,part:2,biome:'snow',capital:'Hirosaki',capJp:'弘前',desc:'The northern tip. Apples and wind.'},
 {id:'ezo',name:'Ezo',jp:'蝦夷',cx:520,cy:96,part:2,biome:'snow',capital:'Matsumae',capJp:'松前',clan:'matsumae',desc:'Matsumae country. Beyond the maps of most men.'},
 {id:'kitaezo',name:'Kita-Ezo',jp:'北蝦夷',cx:568,cy:60,part:2,biome:'snow',capital:'Ishikari',capJp:'石狩',desc:'The far north. Bears outnumber men.'},
];
const BIOME={
 temperate:{grass:[TILE.GRASS,TILE.GRASS2,TILE.GRASS3],tree:['tree0','tree1','tree2','pine0'],flower:0.05,snow:0},
 sakura:{grass:[TILE.GRASS2,TILE.GRASS3,TILE.GRASS4],tree:['sakura0','sakura1','tree1','tree2'],flower:0.1,snow:0},
 maple:{grass:[TILE.GRASS,TILE.GRASS4,TILE.FOREST2],tree:['maple0','maple1','cedar0','tree0'],flower:0.03,snow:0},
 bamboo:{grass:[TILE.GRASS2,TILE.GRASS3,TILE.BAMBOO],tree:['bamboo0','bamboo1','bamboo2','tree1','cedar1'],flower:0.04,snow:0},
 snow:{grass:[TILE.SNOW,TILE.SNOW2,TILE.SNOW],tree:['pine0','pine1','pine2','cedar0'],flower:0,snow:1},
 volcanic:{grass:[TILE.GRASS4,TILE.DARKROCK,TILE.GRASS],tree:['pine1','tree0','cedar1'],flower:0.02,snow:0},
 pine:{grass:[TILE.GRASS,TILE.GRASS4,TILE.FOREST],tree:['pine0','pine1','pine2','cedar0','cedar1'],flower:0.03,snow:0},
 marsh:{grass:[TILE.GRASS3,TILE.TALL,TILE.MOSS],tree:['willow','tree2','bamboo0'],flower:0.06,snow:0},
};
const TOWNS=[],WAYPOINTS=[],BUILDINGS=[],LANDMARKS={},RIVERS=[];
const PROPS_CHUNK=new Map();              // "cx,cy" -> [{k,x,y,...}]
const CH_T=32;                            // chunk size in tiles
const chunkKey=(x,y)=>x+','+y;
function addProp(k,px,py,o){const p=Object.assign({k,x:px,y:py},o||{});const key=chunkKey(Math.floor(px/TS/CH_T),Math.floor(py/TS/CH_T));let a=PROPS_CHUNK.get(key);if(!a){a=[];PROPS_CHUNK.set(key,a);}a.push(p);
 const def=PROPS[k];if(def&&def.solid&&!(o&&o.noSolid)){markSolid(px+def.solid.x,py+def.solid.y,def.solid.w,def.solid.h);}if(def&&def.solid2){markSolid(px+def.solid2.x,py+def.solid2.y,def.solid2.w,def.solid2.h);}return p;}
function markSolid(px,py,w,h){const x0=Math.floor(px/TS),y0=Math.floor(py/TS),x1=Math.floor((px+w-1)/TS),y1=Math.floor((py+h-1)/TS);for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inMap(x,y))OCC[idx(x,y)]=3;}
function regionAt(tx,ty){const r=REG[idx(clamp(tx,0,MAPW-1),clamp(ty,0,MAPH-1))];return r?REGIONS[r-1]:null;}
function regionIndex(id){return REGIONS.findIndex(r=>r.id===id);}
/* ---------- generation pipeline (runs in slices so the boot screen can show progress) ---------- */
function* genWorld(){
 const rng=RNG(WORLD_SEED);
 // 1. land mask + height + islands
 const H=new Float32Array(MAPW*MAPH);
 for(let y=0;y<MAPH;y++){for(let x=0;x<MAPW;x++){const i=idx(x,y);
   let best=9,isl=0,second=9,isl2=0;for(const s of SHAPES){const d=capDist(x,y,s);if(d<best){if(s.isl!==isl){second=best;isl2=isl;}best=d;isl=s.isl;}else if(s.isl!==isl&&d<second){second=d;isl2=s.isl;}}
   const n=fbm(x*0.045,y*0.045,11,4)-0.5;const coast=1-best+n*0.55;              // >0 land
   let land=coast>0.02;
   if(land&&isl2&&second<1.12&&isl2!==isl)land=false;                            // keep straits between islands open
   if(!land){TILES[i]=coast>-0.12?TILE.WATER:TILE.DEEP;H[i]=0;ISL[i]=0;continue;}
   ISL[i]=isl;const m=fbm(x*0.028,y*0.028,23,5),rg=Math.abs(fbm(x*0.05,y*0.05,37,3)-0.5)*2;let h=clamp(coast*2.2,0,1)*(0.04+m*0.88+rg*0.36);h=clamp(h,0,1);H[i]=h;}
  if(y%32===31)yield y/MAPH*0.35;}
 // Lake Biwa + a few mountain lakes
 const lakes=[[322,346,6,12],[386,328,3,3],[437,240,3,4],[545,82,4,3]];
 lakes.forEach(([lx,ly,rx,ry])=>{for(let y=ly-ry-1;y<=ly+ry+1;y++)for(let x=lx-rx-1;x<=lx+rx+1;x++){if(!inMap(x,y))continue;const d=((x-lx)/rx)**2+((y-ly)/ry)**2+(fbm(x*0.2,y*0.2,5,2)-0.5)*0.5;if(d<1){TILES[idx(x,y)]=TILE.LAKE;H[idx(x,y)]=0;}}});
 // 2. regions (voronoi over land, within same island when possible)
 for(let y=0;y<MAPH;y++){for(let x=0;x<MAPW;x++){const i=idx(x,y);if(!ISL[i]){REG[i]=0;continue;}
   let best=1e9,bi=0;for(let r=0;r<REGIONS.length;r++){const R=REGIONS[r];const d=(x-R.cx)**2+(y-R.cy)**2;if(d<best){best=d;bi=r;}}REG[i]=bi+1;}
  if(y%64===63)yield 0.35+y/MAPH*0.1;}
 // region island membership (for teleport logic)
 REGIONS.forEach(R=>{R.isl=ISL[idx(R.cx,R.cy)]||1;R.towns=[];R.wps=[];});
 // 3. terrain tiles from height/biome
 for(let y=0;y<MAPH;y++){for(let x=0;x<MAPW;x++){const i=idx(x,y);if(!ISL[i]){OCC[i]=4;continue;}
   const R=REGIONS[REG[i]-1],B=BIOME[R.biome],h=H[i];HGT[i]=Math.round(h*255);
   // coast: sand where a water tile is adjacent
   let nearW=false;for(let dy=-1;dy<=1&&!nearW;dy++)for(let dx=-1;dx<=1;dx++){if(inMap(x+dx,y+dy)&&!ISL[idx(x+dx,y+dy)]){nearW=true;break;}}
   const v=hash2(x,y,77);
   if(nearW&&h<0.45){TILES[i]=v<0.6?TILE.SAND:TILE.SAND2;continue;}
   if(h>0.84){TILES[i]=B.snow||h>0.93?TILE.SNOWROCK:TILE.ROCK;continue;}
   if(h>0.72){TILES[i]=v<0.5?TILE.ROCK:TILE.ROCK2;continue;}
   if(h>0.62&&v<0.6){TILES[i]=B.snow?TILE.SNOW2:(v<0.3?TILE.FOREST:TILE.FOREST2);continue;}
   if(B.snow){TILES[i]=v<0.5?TILE.SNOW:TILE.SNOW2;continue;}
   if(R.biome==='volcanic'&&h>0.5&&v<0.35){TILES[i]=TILE.DARKROCK;continue;}
   if(v<0.12&&h<0.5){TILES[i]=TILE.TALL;continue;}
   const gv=fbm(x*0.09,y*0.09,78,2);TILES[i]=B.grass[Math.min(B.grass.length-1,Math.floor(gv*gv*B.grass.length*1.3))];}
  if(y%64===63)yield 0.45+y/MAPH*0.1;}
 // 4. towns, castles, shrines, forts: planned per region (before rivers, so rivers flow around them)
 planTowns(rng);
 yield 0.56;
 // 5. rivers: from high points, descend to the sea
 const riverSrc=[[300,352],[335,336],[282,352],[310,410],[360,350],[392,322],[404,290],[450,222],[170,406],[100,500],[530,88],[236,452],[254,380]];
 riverSrc.forEach((s,ri)=>{let x=s[0],y=s[1];if(!ISL[idx(x,y)])return;const path=[];let n=0;const seen=new Set();
  while(n++<400&&inMap(x,y)&&ISL[idx(x,y)]){path.push([x,y]);seen.add(idx(x,y));let bx=x,by=y,bh=1e9;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(!inMap(nx,ny)||seen.has(idx(nx,ny)))continue;const hh=(ISL[idx(nx,ny)]?H[idx(nx,ny)]:-1)+hash2(nx,ny,ri+5)*0.06-(TILES[idx(nx,ny)]===TILE.LAKE?2:0)+(OCC[idx(nx,ny)]===5?3:0);if(hh<bh){bh=hh;bx=nx;by=ny;}}
   if(bx===x&&by===y)break;x=bx;y=by;}
  if(path.length<12)return;RIVERS.push(path);
  path.forEach(([px,py],k)=>{if(OCC[idx(px,py)]===5)return;TILES[idx(px,py)]=TILE.WATER;OCC[idx(px,py)]=4;if(k>path.length*0.4&&inMap(px+1,py)&&ISL[idx(px+1,py)]&&OCC[idx(px+1,py)]!==5){TILES[idx(px+1,py)]=TILE.WATER;OCC[idx(px+1,py)]=4;}});});
 yield 0.58;
 yield 0.6;
 for(let t=0;t<TOWNS.length;t++){buildTown(TOWNS[t],rng);if(t%4===3)yield 0.62+t/TOWNS.length*0.14;}
 // 6. roads between towns
 buildRoads();yield 0.8;
 // 7. nature props
 for(let y=0;y<MAPH;y++){for(let x=0;x<MAPW;x++){const i=idx(x,y);if(OCC[i]!==0||!ISL[i])continue;const t=TILES[i],R=REGIONS[REG[i]-1],B=BIOME[R.biome];const v=hash2(x,y,91),u=hash2(x,y,92);
   const px=x*TS+8+Math.floor((hash2(x,y,93)-0.5)*8),py=y*TS+14;
   if(t===TILE.FOREST||t===TILE.FOREST2){if(v<0.55)addProp(B.tree[Math.floor(u*B.tree.length)],px,py);else if(v<0.62)addProp('bush',px,py);}
   else if(t===TILE.BAMBOO){if(v<0.5)addProp('bamboo'+Math.floor(u*3),px,py);}
   else if(t===TILE.ROCK||t===TILE.ROCK2||t===TILE.SNOWROCK||t===TILE.DARKROCK||t===TILE.CLIFF){if(v<0.08)addProp(u<0.5?'boulder':'rock',px,py);}
   else if(t===TILE.SAND||t===TILE.SAND2){if(v<0.03)addProp('rock2',px,py);else if(v<0.045)addProp('boat',px,py);}
   else if(t===TILE.TALL){if(v<0.1)addProp('bush2',px,py);}
   else{ // grass / snow
    if(v<0.055)addProp(B.tree[Math.floor(u*B.tree.length)],px,py);
    else if(v<0.075)addProp(u<0.5?'bush':'bush2',px,py);
    else if(v<0.075+B.flower)addProp('flowers',px,py,{noSolid:1});
    else if(v<0.1+B.flower&&!B.snow)addProp('rock2',px,py);}}
  if(y%64===63)yield 0.8+y/MAPH*0.15;}
 // 8. waypoints list is filled by planTowns; landmarks by buildTown
 buildMinimap();yield 1;}
/* ---------- town planning ---------- */
function findSite(cx,cy,rad,minW,need,frac,ri){frac=frac||0.9; // search outward from (cx,cy): all land within minW, mostly land within need, nothing reserved
 let best=null,bd=1e9;for(let r=0;r<=rad;r+=2)for(let a=0;a<16;a++){const x=Math.round(cx+Math.cos(a/16*TAU)*r),y=Math.round(cy+Math.sin(a/16*TAU)*r);if(!inMap(x,y))continue;if(ri!=null&&REG[idx(x,y)]!==ri+1)continue;
  let ok=true,land=0,tot=0;for(let dy=-need;dy<=need&&ok;dy++)for(let dx=-need;dx<=need;dx++){const xx=x+dx,yy=y+dy;tot++;if(!inMap(xx,yy)){ok=false;break;}const i=idx(xx,yy);if(OCC[i]===5||OCC[i]===3||OCC[i]===2){ok=false;break;}
   const isLand=ISL[i]&&WALKABLE.has(TILES[i]);if(isLand)land++;else if(Math.max(Math.abs(dx),Math.abs(dy))<=minW){ok=false;break;}}
  if(!ok||land<tot*frac)continue;const d=(x-cx)**2+(y-cy)**2;if(d<bd){bd=d;best=[x,y];if(r===0)return best;}}return best;}
function reserve(tx,ty,rx,ry){ry=ry==null?rx:ry;for(let y=ty-ry;y<=ty+ry;y++)for(let x=tx-rx;x<=tx+rx;x++)if(inMap(x,y)&&OCC[idx(x,y)]===0)OCC[idx(x,y)]=5;}
function addTown(o){const ri=regionIndex(o.region);const off=o.kind==='castle'?4:o.kind==='fort'?2:0;let site=findSite(o.tx,o.ty+off,o.search||44,o.minW||4,o.need||8,0.9,ri)||findSite(o.tx,o.ty+off,(o.search||44)+16,Math.max(1,(o.minW||4)-1),o.need||8,0.78,ri)||findSite(o.tx,o.ty+off,(o.search||44)+30,1,Math.max(3,(o.need||8)-2),0.66,ri)||findSite(o.tx,o.ty+off,(o.search||44)+40,1,Math.max(3,(o.need||8)-3),0.55,ri);if(!site){console.warn('no site for',o.id);return null;}o.tx=site[0];o.ty=site[1]-off;o.x=o.tx*TS;o.y=o.ty*TS;o.buildings=[];o.npcs=[];o.spots={};TOWNS.push(o);if(o.kind==='castle')reserve(o.tx,o.ty,11,16);else if(o.kind==='fort')reserve(o.tx,o.ty,11,13);else reserve(o.tx,o.ty,(o.need||8)+1);const R=REGIONS[regionIndex(o.region)];if(R)R.towns.push(o);return o;}
function planTowns(rng){
 // story sites
 addTown({id:'kyoto_castle',name:'Kyō — Nijō Castle',jp:'京・二条城',kind:'castle',region:'yamashiro',tx:296,ty:354,need:14,minW:4,story:1,capital:1,wp:1});
 addTown({id:'sato_estate',name:'Satō’s Shadow Estate',jp:'佐藤の影屋敷',kind:'estate',region:'yamashiro',tx:310,ty:366,need:7,minW:3,story:1});
 addTown({id:'start_village',name:'Fushimi',jp:'伏見',kind:'village',region:'yamashiro',tx:298,ty:378,need:6,minW:3,story:1,wp:1});
 addTown({id:'iki_fortress',name:'Black Eagle Castle',jp:'黒鷲城',kind:'fort',region:'tanba',tx:280,ty:338,need:13,minW:3,story:1,capital:1,wp:1});
 addTown({id:'biwa_dock',name:'Biwa Ferry',jp:'琵琶の渡し',kind:'port',region:'omi',tx:332,ty:352,need:6,minW:2,story:1});
 addTown({id:'koya_temple',name:'Mount Kōya Temple',jp:'高野山',kind:'temple',region:'kii',tx:308,ty:428,need:7,minW:3,story:1,wp:1});
 addTown({id:'sekigahara',name:'Sekigahara Camp',jp:'関ヶ原の陣',kind:'camp',region:'mino',tx:344,ty:346,need:6,minW:3,story:1});
 addTown({id:'ise_shrine',name:'Grand Shrine of Ise',jp:'伊勢神宮',kind:'temple',region:'ise',tx:346,ty:392,need:7,minW:3,story:1,wp:1});
 addTown({id:'secret_cove',name:'Hidden Cove',jp:'隠れ江',kind:'cove',region:'settsu',tx:268,ty:392,need:5,minW:1,story:1,wp:1,sea:1});
 // sea-waypoint harbours for the islands
 addTown({id:'tosa_harbor',name:'Urado Harbour',jp:'浦戸の港',kind:'port',region:'tosa',tx:228,ty:470,need:5,minW:1,wp:1,sea:1});
 addTown({id:'hakata_harbor',name:'Hakata Harbour',jp:'博多の港',kind:'port',region:'chikuzen',tx:84,ty:478,need:5,minW:1,wp:1,sea:1});
 addTown({id:'ezo_harbor',name:'Hakodate Harbour',jp:'箱館の港',kind:'port',region:'ezo',tx:490,ty:140,need:5,minW:1,wp:1,sea:1});
 addTown({id:'sado_shrine',name:'Sado Gold Shrine',jp:'佐渡金山神社',kind:'shrine',region:'echigo',tx:416,ty:238,need:2,minW:1,wp:1,sea:1,search:12});

 // every region: a capital (castle town or town), a shrine (waypoint), a village — unless a story site already plays that role
 REGIONS.forEach((R,ri)=>{const big=!!R.clan||R.id==='yamashiro'||R.id==='harima'||R.id==='omi'||R.id==='mino'||R.id==='owari';
  const has=k=>R.towns.some(t=>t.story&&k.includes(t.kind));const ang=rng()*TAU;
  if(!has(['castle','fort'])){const kind=R.id==='settsu'||R.id==='chikuzen'||R.id==='musashi'||R.id==='nagato'?'port':R.id==='iga'?'hideout':big?'castle':'town';let t=addTown({id:R.id+'_cap',name:R.capital,jp:R.capJp,kind,region:R.id,tx:R.cx,ty:R.cy,need:big?14:8,minW:big?4:3,capital:1,wp:1});if(!t)t=addTown({id:R.id+'_cap',name:R.capital,jp:R.capJp,kind:'town',region:R.id,tx:R.cx,ty:R.cy,need:8,minW:2,capital:1,wp:1});if(!t)addTown({id:R.id+'_cap',name:R.capital,jp:R.capJp,kind:'village',region:R.id,tx:R.cx,ty:R.cy,need:5,minW:1,capital:1,wp:1,search:80});}
  if(!has(['shrine','temple']))addTown({id:R.id+'_shrine',name:R.name+' Shrine',jp:R.jp+'神社',kind:R.id==='yamato'||R.id==='dewa'?'temple':'shrine',region:R.id,tx:Math.round(R.cx+Math.cos(ang)*16),ty:Math.round(R.cy+Math.sin(ang)*12),need:6,minW:3,wp:1});
  addTown({id:R.id+'_vil',name:villageName(ri),jp:villageJp(ri),kind:'village',region:R.id,tx:Math.round(R.cx+Math.cos(ang+2.4)*17),ty:Math.round(R.cy+Math.sin(ang+2.4)*13),need:6,minW:2,search:70});
  if((big||R.part===1)&&!has(['village']))addTown({id:R.id+'_vil2',name:villageName(ri+40),jp:villageJp(ri+40),kind:rng()<0.4?'hamlet':'village',region:R.id,tx:Math.round(R.cx+Math.cos(ang+4.4)*18),ty:Math.round(R.cy+Math.sin(ang+4.4)*14),need:5,minW:2});
 });
}
const VN=['Kuromatsu','Shirakawa','Ōtani','Kamiyama','Hosokawa','Tanaka','Mizusawa','Akiba','Nagahama','Sugimoto','Hinode','Kiyomizu','Tsukigase','Aoyagi','Fukuro','Umegae','Yanagi','Isobe','Sakurai','Takeda','Hagiwara','Komatsu','Ogawa','Sugano','Minakami','Kurihara','Nishino','Harada','Yasumi','Kagetsu','Shiozaki','Fujino','Imai','Toda','Araki','Kuwabara','Hoshi','Namiki','Kaneko','Oribe','Hayama','Sakai','Tomoe','Ushio','Wakaba','Yagi','Iwata','Noda','Chiba','Date','Mori','Ōta','Kai','Fuji','Gōda','Hino','Ishii','Kido','Maki','Nozaki'];
const VJ=['黒松','白川','大谷','神山','細川','田中','水沢','秋葉','長浜','杉本','日の出','清水','月ヶ瀬','青柳','袋','梅ヶ枝','柳','磯部','桜井','竹田','萩原','小松','小川','菅野','水上','栗原','西野','原田','安見','花月','塩崎','藤野','今井','戸田','荒木','桑原','星','並木','金子','織部','葉山','酒井','巴','潮','若葉','八木','岩田','野田','千葉','伊達','森','太田','甲斐','富士','合田','日野','石井','木戸','牧','野崎'];
const villageName=i=>VN[i%VN.length];const villageJp=i=>VJ[i%VJ.length];
/* ---------- town building ---------- */
function flatArea(cx,cy,rx,ry,tile,alt){for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){if(!inMap(x,y))continue;const i=idx(x,y);if(!ISL[i]||OCC[i]===3||OCC[i]===4)continue;const d=Math.max(Math.abs(x-cx)/rx,Math.abs(y-cy)/ry);const v=hash2(x,y,66);
  if(d<0.62||v<(1-d)*1.9){TILES[i]=(alt&&v<0.3)?alt:tile;OCC[i]=2;}}}
function flat(tx,ty,w,h,tile,occ){for(let y=ty;y<ty+h;y++)for(let x=tx;x<tx+w;x++){if(!inMap(x,y))continue;const i=idx(x,y);if(!ISL[i])continue;TILES[i]=typeof tile==='function'?tile(x,y):tile;if(OCC[i]!==3&&OCC[i]!==4)OCC[i]=occ==null?2:occ;}}
function placeBuilding(town,k,tx,ty,o){const B=BUILD[k];if(!B)return null;const offs=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[1,1],[-1,1],[0,2],[2,1],[-2,1]];
 for(const [ox,oy] of offs){const b=placeBuildingAt(town,k,tx+ox,ty+oy,o);if(b)return b;}return null;}
function placeBuildingAt(town,k,tx,ty,o){const B=BUILD[k];const b={k,tx,ty,x:tx*TS,y:ty*TS,town:town.id,region:town.region,id:town.id+'_'+k+'_'+town.buildings.length};
 // footprint check: everything free and land
 for(let y=0;y<B.th;y++)for(let x=0;x<B.tw;x++){const xx=tx+x,yy=ty+y;if(!inMap(xx,yy)||!ISL[idx(xx,yy)]||OCC[idx(xx,yy)]===3||WATERY.has(TILES[idx(xx,yy)]))return null;}
 flat(tx,ty,B.tw,B.th,o&&o.ground!=null?o.ground:TILE.DIRT,2);
 const st=B.solidTiles;for(let y=st.y;y<st.y+st.h;y++)for(let x=st.x;x<st.x+st.w;x++){if(B.pass&&x>=B.pass.x&&x<B.pass.x+B.pass.w)continue;if(inMap(tx+x,ty+y))OCC[idx(tx+x,ty+y)]=3;}
 b.doorX=(tx+B.door.x)*TS+TS/2;b.doorY=(ty+B.door.y+1)*TS+4;b.kind=B.kind;Object.assign(b,o||{});town.buildings.push(b);BUILDINGS.push(b);
 const key=chunkKey(Math.floor(b.x/TS/CH_T),Math.floor((b.y+B.th*TS)/TS/CH_T));let a=PROPS_CHUNK.get(key);if(!a){a=[];PROPS_CHUNK.set(key,a);}a.push({k:'@'+k,x:b.x,y:b.y+B.th*TS,b});return b;}
function spot(town,name,tx,ty){town.spots[name]={x:tx*TS+8,y:ty*TS+8};return town.spots[name];}
function npcSlot(town,role,tx,ty,o){const s=Object.assign({role,x:tx*TS+8,y:ty*TS+10,town:town.id,region:town.region},o||{});town.npcs.push(s);return s;}
function pathTiles(x0,y0,x1,y1,tile){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);if(inMap(x,y)&&ISL[idx(x,y)]&&OCC[idx(x,y)]!==3){TILES[idx(x,y)]=tile;if(OCC[idx(x,y)]!==4)OCC[idx(x,y)]=2;}}}
function lanternRow(x0,y,x1,step){for(let x=x0;x<=x1;x+=step)addProp('lantern',x*TS+8,y*TS+14);}
function buildTown(t,rng){const r=RNG(WORLD_SEED+TOWNS.indexOf(t)*7919);const cx=t.tx,cy=t.ty;const R=REGIONS[regionIndex(t.region)];const snow=BIOME[R.biome].snow;
 const ground=snow?TILE.SNOW2:TILE.DIRT2,street=TILE.ROAD,plaza=TILE.STONE;
 const variant=(a)=>a[Math.floor(r()*a.length)];
 switch(t.kind){
  case 'castle':{ // moat ring, walls, gate south, keep north with a courtyard; inner town south of the gate
   flat(cx-10,cy-11,21,18,plaza,2);
   // moat (rows cy-11 and cy+6, cols cx-10 / cx+10) with a bridge gap at the bottom centre
   for(let y=cy-11;y<=cy+6;y++)for(let x=cx-10;x<=cx+10;x++){const edge=x===cx-10||x===cx+10||y===cy-11||y===cy+6;if(edge&&!(y===cy+6&&Math.abs(x-cx)<=1)){TILES[idx(x,y)]=TILE.LAKE;OCC[idx(x,y)]=4;}}
   for(let x=cx-9;x<=cx+9;x++){placeBuildingAt(t,'wallH',x,cy-10);if(Math.abs(x-cx)>2)placeBuildingAt(t,'wallH',x,cy+4);}
   for(let y=cy-9;y<=cy+3;y++){placeBuildingAt(t,'wallV',cx-9,y);placeBuildingAt(t,'wallV',cx+9,y);}
   placeBuildingAt(t,'tower',cx-9,cy-11);placeBuildingAt(t,'tower',cx+8,cy-11);
   placeBuildingAt(t,'castle',cx-3,cy-9,{name:t.name,important:1});
   placeBuildingAt(t,'gate',cx-2,cy+3,{name:t.name+' Gate'});
   flat(cx-7,cy-1,15,4,TILE.STONE2,2);for(let y=cy+5;y<=cy+9;y++)flat(cx-1,y,3,1,street,1);
   lanternRow(cx-6,cy+1,cx+6,4);addProp('sakura0',(cx-6)*TS+8,(cy-1)*TS+10);addProp('sakura1',(cx+6)*TS+8,(cy-1)*TS+10);
   {const clan=R.clan||(t.region==='yamashiro'?'sato':null);if(clan&&PROPS['nobori_'+clan]){[-7,-5,5,7].forEach(dx=>addProp('nobori_'+clan,(cx+dx)*TS+8,(cy+2)*TS+12));[-3,3].forEach(dx=>addProp('nobori_'+clan,(cx+dx)*TS+8,(cy+7)*TS+12));}}
   spot(t,'keep',cx,cy-1);spot(t,'throne',cx,cy-1);spot(t,'court',cx,cy+1);spot(t,'gate',cx,cy+6);
   npcSlot(t,'guard',cx-2,cy+6);npcSlot(t,'guard',cx+2,cy+6);npcSlot(t,'samurai',cx-4,cy+1);npcSlot(t,'samurai',cx+4,cy+1);
   // town below the gate
   const row=cy+9;flatArea(cx,row+2,10,5,ground,TILE.GRAVEL);flat(cx-9,row+1,19,1,street,1);flat(cx-9,row+5,19,1,street,1);
   [-8,-4,4].forEach((dx,i)=>placeBuilding(t,variant(['machiya0','machiya1','machiya2']),cx+dx,row-3));
   placeBuilding(t,'merchant',cx-8,row+2,{shop:'armory'});placeBuilding(t,'inn',cx-2,row+2);placeBuilding(t,'dojo',cx+4,row+2);
   addProp('well',(cx-3)*TS+8,(row+4)*TS+14);addProp('stall',(cx+7)*TS,(row+1)*TS+10);addProp('stall',(cx-5)*TS,(row+6)*TS+10);lanternRow(cx-9,row+1,cx+9,6);
   npcSlot(t,'merchant',cx-6,row+5,{shop:'armory'});npcSlot(t,'innkeeper',cx,row+5);npcSlot(t,'sensei',cx+6,row+5);npcSlot(t,'townsman',cx-7,row+1);npcSlot(t,'townswoman',cx+5,row+1);npcSlot(t,'ronin',cx+8,row+5);npcSlot(t,'child',cx+2,row+1);
   spot(t,'plaza',cx,row+1);spot(t,'entry',cx,row+7);
   if(t.wp)addWaypoint(t,cx-7,row+6);
   if(t.id==='kyoto_castle'){LANDMARKS.kyotoThrone=t.spots.throne;LANDMARKS.kyotoGate=t.spots.gate;LANDMARKS.kyotoCourt=t.spots.court;}
   break;}
  case 'fort':{ // Iki's black fortress: dark stone, no moat, gate south, barracks in the yard
   flat(cx-10,cy-11,21,19,TILE.DARKROCK,2);flat(cx-8,cy-9,17,15,TILE.STONE2,2);
   for(let x=cx-9;x<=cx+9;x++){placeBuildingAt(t,'wallH',x,cy-10);if(Math.abs(x-cx)>2)placeBuildingAt(t,'wallH',x,cy+5);}
   for(let y=cy-9;y<=cy+4;y++){placeBuildingAt(t,'wallV',cx-9,y);placeBuildingAt(t,'wallV',cx+9,y);}
   placeBuildingAt(t,'tower',cx-9,cy-11);placeBuildingAt(t,'tower',cx+8,cy-11);placeBuildingAt(t,'tower',cx-9,cy+4);placeBuildingAt(t,'tower',cx+8,cy+4);
   placeBuildingAt(t,'fortress',cx-3,cy-8,{name:t.name,important:1});placeBuildingAt(t,'gate',cx-2,cy+4,{name:t.name+' Gate'});
   placeBuildingAt(t,'stable',cx-8,cy-4);placeBuildingAt(t,'dojo',cx+4,cy-4);
   for(let y=cy+6;y<=cy+10;y++)flat(cx-1,y,3,1,street,1);
   [-6,-2,2,6].forEach(dx=>addProp('campfire',(cx+dx)*TS+8,(cy+2)*TS+12));[-8,-4,4,8].forEach(dx=>addProp('nobori_iki',(cx+dx)*TS+8,(cy+1)*TS+12));[-3,3].forEach(dx=>addProp('nobori_iki',(cx+dx)*TS+8,(cy+8)*TS+12));
   spot(t,'keep',cx,cy);spot(t,'throne',cx,cy);spot(t,'court',cx,cy+2);spot(t,'gate',cx,cy+7);spot(t,'entry',cx,cy+10);
   npcSlot(t,'ashigaru',cx-3,cy+7);npcSlot(t,'ashigaru',cx+3,cy+7);npcSlot(t,'ashigaru',cx-5,cy+2);npcSlot(t,'ashigaru',cx+5,cy+2);npcSlot(t,'samurai',cx-2,cy);
   if(t.wp)addWaypoint(t,cx+7,cy+9);
   if(t.id==='iki_fortress'){LANDMARKS.ikiThrone=t.spots.throne;LANDMARKS.ikiGate=t.spots.gate;LANDMARKS.ikiCourt=t.spots.court;}
   break;}
  case 'town':{ // crossroads town
   flatArea(cx,cy,10,7,ground,TILE.GRAVEL);flat(cx-9,cy,19,1,street,1);flat(cx,cy-6,1,13,street,1);flat(cx-2,cy-1,5,3,plaza,2);
   const kinds=['machiya0','machiya1','machiya2','minka0','minka1'];
   placeBuilding(t,'inn',cx-8,cy-4);placeBuilding(t,'merchant',cx+2,cy-4,{shop:'general'});placeBuilding(t,variant(kinds),cx-8,cy+2);placeBuilding(t,variant(kinds),cx-4,cy+2);placeBuilding(t,'dojo',cx+2,cy+2);placeBuilding(t,variant(kinds),cx+7,cy+2);placeBuilding(t,variant(kinds),cx-3,cy-4);placeBuilding(t,variant(kinds),cx+7,cy-4);
   addProp('well',cx*TS+8,(cy)*TS+14);addProp('stall',(cx-5)*TS,(cy-1)*TS+10);addProp('stall',(cx+5)*TS,(cy+1)*TS+12);lanternRow(cx-8,cy-1,cx+8,4);addProp('signpost',(cx+1)*TS+8,(cy+6)*TS+12);addProp('horsePost',(cx-6)*TS+8,(cy+1)*TS+12);
   npcSlot(t,'merchant',cx+4,cy-1,{shop:'general'});npcSlot(t,'innkeeper',cx-6,cy-1);npcSlot(t,'sensei',cx+4,cy+1);npcSlot(t,'townsman',cx-3,cy+1);npcSlot(t,'townswoman',cx+2,cy-1);npcSlot(t,'ronin',cx+8,cy);npcSlot(t,'monk',cx-8,cy);npcSlot(t,'child',cx-1,cy+1);npcSlot(t,'horsekeeper',cx-6,cy+1);
   spot(t,'plaza',cx,cy);spot(t,'entry',cx,cy+6);if(t.wp)addWaypoint(t,cx+8,cy-6);break;}
  case 'port':{ // harbour: docks into the water, boats, fish stalls
   // find water direction
   let dir=null;for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){for(let k=3;k<14;k++){const x=cx+dx*k,y=cy+dy*k;if(inMap(x,y)&&!ISL[idx(x,y)]){dir=[dx,dy,k];break;}}if(dir)break;}
   flatArea(cx,cy,8,6,ground,TILE.GRAVEL);flat(cx-7,cy,15,1,street,1);
   placeBuilding(t,'merchant',cx-7,cy-4,{shop:'exotic'});placeBuilding(t,'inn',cx-1,cy-4);placeBuilding(t,'machiya2',cx+5,cy-4);placeBuilding(t,'minka1',cx-6,cy+2);placeBuilding(t,'minka2',cx+2,cy+2);
   addProp('stall',(cx-3)*TS,(cy+1)*TS+12);addProp('crate',(cx+5)*TS+8,(cy+1)*TS+10);addProp('barrel',(cx+6)*TS+8,(cy+2)*TS+10);addProp('crate',(cx+7)*TS+4,(cy+1)*TS+10);lanternRow(cx-7,cy-1,cx+7,7);
   if(dir){const [dx,dy,k]=dir;for(let j=0;j<k+5;j++){const x=cx+dx*j,y=cy+dy*j;if(!inMap(x,y))break;TILES[idx(x,y)]=TILE.PLANK;OCC[idx(x,y)]=1;if(j>k){addProp('dock',x*TS,y*TS+TS,{noSolid:1});}}
    const ex=cx+dx*(k+5),ey=cy+dy*(k+5);if(inMap(ex,ey)){addProp('boat',ex*TS+8+dy*18,ey*TS+14+dx*6);spot(t,'pier',cx+dx*(k+4),cy+dy*(k+4));}}
   npcSlot(t,'merchant',cx-5,cy+1,{shop:'exotic'});npcSlot(t,'fisher',cx+3,cy+1);npcSlot(t,'fisher',cx+(dir?dir[0]*2:0),cy+(dir?dir[1]*2:0)+1);npcSlot(t,'innkeeper',cx+1,cy-1);npcSlot(t,'sailor',cx-2,cy-1);npcSlot(t,'ronin',cx+7,cy);
   spot(t,'plaza',cx,cy);spot(t,'entry',cx,cy-6);if(t.wp)addWaypoint(t,cx-7,cy+5,{sea:t.sea});break;}
  case 'village':case 'hamlet':{ // minka houses around paddies
   const n=t.kind==='hamlet'?3:5;flatArea(cx,cy,6,5,ground,TILE.DIRT);
   const spots=[[-5,-4],[1,-4],[-5,2],[2,2],[-1,-1]];for(let i=0;i<n;i++){const [dx,dy]=spots[i];placeBuilding(t,'minka'+Math.floor(r()*3),cx+dx,cy+dy);}
   // paddies to the side
   const side=r()<0.5?1:-1;for(let y=cy-3;y<=cy+3;y++)for(let x=cx+side*6;x!==cx+side*10;x+=side){if(inMap(x,y)&&ISL[idx(x,y)]&&(OCC[idx(x,y)]===0||OCC[idx(x,y)]===5)&&Math.abs(x-cx)<=(t.need||6)+2){const i=idx(x,y);if(WATERY.has(TILES[i]))continue;TILES[i]=((x-cx)%3===0||(y-cy)%4===0)?TILE.DIRT:(snow?TILE.SNOW2:TILE.PADDY);OCC[i]=2;}}
   addProp('well',cx*TS+8,(cy+1)*TS+14);addProp('scarecrow',(cx+side*8)*TS+8,(cy)*TS+12);addProp('hay',(cx+side*5)*TS+8,(cy+4)*TS+12);addProp('fence',(cx+side*5)*TS+8,(cy-4)*TS+8);addProp('jizo',(cx-6)*TS+8,(cy+5)*TS+12);
   npcSlot(t,'farmer',cx+side*7,cy+1);npcSlot(t,'farmer',cx+side*8,cy-2);npcSlot(t,'villager',cx-2,cy+1);npcSlot(t,'elder',cx+3,cy+1);if(n>3){npcSlot(t,'child',cx-3,cy-2);npcSlot(t,'hunter',cx+5,cy+4);}
   if(t.id==='start_village'){placeBuilding(t,'stable',cx+5,cy-1);npcSlot(t,'horsekeeper',cx+6,cy+3);LANDMARKS.start={x:(cx)*TS+8,y:(cy+2)*TS+8};LANDMARKS.startHome=t.buildings[0];}
   spot(t,'plaza',cx,cy+1);spot(t,'entry',cx,cy+6);if(t.wp)addWaypoint(t,cx-5,cy+6);break;}
  case 'shrine':{ // torii, stone path north, honden, lanterns, bell, komainu(jizo)
   flatArea(cx,cy,5,6,snow?TILE.SNOW:TILE.GRAVEL);flat(cx-1,cy-2,3,8,TILE.STONE,2);
   const h=placeBuilding(t,'shrine',cx-2,cy-6,{name:t.name,important:1});
   addProp('torii',cx*TS+8,(cy+5)*TS+14);addProp('lantern',(cx-2)*TS+8,(cy+1)*TS+14);addProp('lantern',(cx+2)*TS+8,(cy+1)*TS+14);addProp('lantern',(cx-2)*TS+8,(cy-2)*TS+14);addProp('lantern',(cx+2)*TS+8,(cy-2)*TS+14);addProp('bell',(cx+4)*TS+8,(cy-3)*TS+14);addProp('shrineBox',(cx-4)*TS+8,(cy-3)*TS+14);addProp('jizo',(cx-1)*TS+8,(cy+4)*TS+12);addProp('jizo',(cx+1)*TS+8,(cy+4)*TS+12);
   for(let i=0;i<4;i++)addProp(BIOME[R.biome].tree[i%BIOME[R.biome].tree.length],(cx-5+i*3+(i%2))*TS+8,(cy-7)*TS+10);
   for(let k=0;k<3;k++){const yy=cy+8+k*3;if(inMap(cx,yy)&&ISL[idx(cx,yy)]&&OCC[idx(cx,yy)]!==3&&!WATERY.has(TILES[idx(cx,yy)])){addProp('torii2',cx*TS+8,yy*TS+14,{noSolid:1});flat(cx-1,yy-2,3,3,TILE.STONE,2);}}
   addProp('nobori_shrine',(cx-3)*TS+8,(cy+5)*TS+12);addProp('nobori_shrine',(cx+3)*TS+8,(cy+5)*TS+12);
   npcSlot(t,'miko',cx+1,cy-1);npcSlot(t,'monk',cx-3,cy+2);npcSlot(t,'pilgrim',cx+3,cy+3);
   spot(t,'altar',cx,cy-1);spot(t,'plaza',cx,cy+2);spot(t,'entry',cx,cy+7);if(t.wp)addWaypoint(t,cx+3,cy+0);break;}
  case 'temple':{ // temple hall, pagoda, bell, graves, cedar avenue
   flatArea(cx,cy,8,8,TILE.GRAVEL,TILE.MOSS);flat(cx-1,cy-3,3,10,TILE.STONE,2);
   placeBuilding(t,'temple',cx-3,cy-8,{name:t.name,important:1});placeBuilding(t,'pagoda',cx+4,cy-8);placeBuilding(t,'minka2',cx-7,cy-4,{name:'Monks’ quarters'});
   addProp('bell',(cx-5)*TS+8,(cy+1)*TS+14);addProp('torii2',cx*TS+8,(cy+7)*TS+14);for(let i=0;i<5;i++){addProp('grave',(cx+4+(i%3))*TS+6,(cy+1+Math.floor(i/3)*2)*TS+12);}
   addProp('lantern',(cx-2)*TS+8,(cy+3)*TS+14);addProp('lantern',(cx+2)*TS+8,(cy+3)*TS+14);for(let i=0;i<6;i++)addProp('cedar'+(i%2),(cx-8+(i%2)*17)*TS+8,(cy-6+Math.floor(i/2)*5)*TS+10);
   npcSlot(t,'monk',cx-2,cy);npcSlot(t,'monk',cx+2,cy-1);npcSlot(t,'abbot',cx,cy-4);npcSlot(t,'pilgrim',cx+1,cy+4);
   spot(t,'altar',cx,cy-3);spot(t,'plaza',cx,cy+2);spot(t,'entry',cx,cy+8);if(t.wp)addWaypoint(t,cx-6,cy+5);
   if(t.id==='koya_temple')LANDMARKS.koyaAltar=t.spots.altar;if(t.id==='ise_shrine')LANDMARKS.iseAltar=t.spots.altar;break;}
  case 'hideout':{ // Iga: houses hidden in bamboo
   flat(cx-7,cy-6,15,13,TILE.BAMBOO,2);flat(cx-1,cy-6,3,13,TILE.DIRT,1);
   placeBuilding(t,'minka0',cx-7,cy-5);placeBuilding(t,'minka1',cx+3,cy-5);placeBuilding(t,'dojo',cx-7,cy+1,{name:'Shinobi Hall'});placeBuilding(t,'merchant',cx+2,cy+1,{shop:'shinobi'});
   for(let i=0;i<14;i++){const x=cx-8+((i*5)%17),y=cy-7+Math.floor(i/4)*4+(i%2);if(inMap(x,y)&&OCC[idx(x,y)]!==3&&OCC[idx(x,y)]!==1)addProp('bamboo'+(i%3),x*TS+8,y*TS+14);}
   addProp('lampost',(cx+1)*TS+8,(cy-1)*TS+12);addProp('well',(cx-3)*TS+8,(cy-1)*TS+14);
   npcSlot(t,'shinobi',cx-2,cy+5);npcSlot(t,'shinobi',cx+3,cy-1);npcSlot(t,'merchant',cx+4,cy+5,{shop:'shinobi'});npcSlot(t,'elder',cx-4,cy-1);
   spot(t,'plaza',cx,cy);spot(t,'entry',cx,cy+7);if(t.wp)addWaypoint(t,cx+6,cy+6);break;}
  case 'estate':{ // Sato's shadow estate: walled compound, one hall
   flat(cx-6,cy-5,13,11,TILE.GRAVEL,2);for(let x=cx-6;x<=cx+6;x++){placeBuilding(t,'wallH',x,cy-5);if(Math.abs(x-cx)>1)placeBuilding(t,'wallH',x,cy+4);}
   for(let y=cy-4;y<=cy+3;y++){placeBuilding(t,'wallV',cx-6,y);placeBuilding(t,'wallV',cx+6,y);}
   placeBuilding(t,'inn',cx-2,cy-4,{name:'Shadow Hall',important:1});addProp('sakura0',(cx-4)*TS+8,(cy+2)*TS+10);addProp('sakura1',(cx+4)*TS+8,(cy+2)*TS+10);addProp('lantern',(cx-1)*TS+8,(cy+2)*TS+14);addProp('lantern',(cx+1)*TS+8,(cy+2)*TS+14);
   for(let y=cy+5;y<=cy+7;y++)flat(cx-1,y,3,1,TILE.ROAD,1);
   npcSlot(t,'guard',cx-1,cy+5);npcSlot(t,'guard',cx+1,cy+5);spot(t,'hall',cx,cy+1);spot(t,'plaza',cx,cy+2);spot(t,'entry',cx,cy+7);LANDMARKS.estateHall=t.spots.hall;LANDMARKS.estateGate=t.spots.entry;break;}
  case 'camp':{ // war camp: tents (hay), campfires, banners (lamposts), fences
   flatArea(cx,cy,7,5,TILE.DIRT2,TILE.DIRT);for(let i=0;i<6;i++)addProp('hay',(cx-5+(i%3)*4)*TS+8,(cy-3+Math.floor(i/3)*5)*TS+12);addProp('campfire',cx*TS+8,cy*TS+12);addProp('campfire',(cx+4)*TS+8,(cy+1)*TS+12);
   for(let x=cx-6;x<=cx+6;x+=1)addProp('fence',x*TS+8,(cy-5)*TS+8);addProp('lampost',(cx-6)*TS+8,(cy+4)*TS+12);addProp('lampost',(cx+6)*TS+8,(cy+4)*TS+12);addProp('horsePost',(cx+6)*TS+8,(cy-1)*TS+12);
   npcSlot(t,'ashigaru',cx-3,cy+1);npcSlot(t,'ashigaru',cx+2,cy-1);npcSlot(t,'samurai',cx,cy+2);npcSlot(t,'ronin',cx+5,cy+3);
   spot(t,'plaza',cx,cy+1);spot(t,'entry',cx,cy+5);LANDMARKS.sekigahara=t.spots.plaza;break;}
  case 'cove':{ // hidden cove: a boat, a cave-ish rock ring, the secret sea waypoint
   flat(cx-4,cy-3,9,7,TILE.SAND,2);for(let i=0;i<7;i++)addProp(i%2?'boulder':'rock',(cx-5+i*1.6)*TS+8,(cy-4)*TS+12);addProp('boat',cx*TS+8,(cy+4)*TS+12);addProp('campfire',(cx-2)*TS+8,(cy+1)*TS+12);
   npcSlot(t,'sailor',cx+2,cy+1);spot(t,'plaza',cx,cy);spot(t,'entry',cx,cy-4);if(t.wp)addWaypoint(t,cx+3,cy-1,{sea:1,hidden:1});LANDMARKS.cove=t.spots.plaza;break;}
 }
 if(t.wp&&!t.waypoint){addWaypoint(t,cx+6,cy+6);}
}
function addWaypoint(t,tx,ty,o){ // a Wind Shrine (風の社) — small torii + shrine box + lantern, glowing when unlocked
 // nudge to a free, land tile
 let fx=tx,fy=ty;for(let k=0;k<30&&(!inMap(fx,fy)||!ISL[idx(fx,fy)]||OCC[idx(fx,fy)]===3||WATERY.has(TILES[idx(fx,fy)]));k++){fx=tx+((k*3)%7)-3;fy=ty+Math.floor(k/7)-2;}
 flat(fx-1,fy-1,3,3,TILE.STONE,2);const rAt=regionAt(fx,fy);const wp=Object.assign({id:t.id+'_wp',name:t.name,jp:t.jp,tx:fx,ty:fy,x:fx*TS+8,y:fy*TS+8,region:rAt?rAt.id:t.region,town:t.id,sea:!!(o&&o.sea),hidden:!!(o&&o.hidden)},o||{});
 addProp('torii2',fx*TS+8,(fy+1)*TS+14,{wp:wp.id});addProp('shrineBox',fx*TS+8,(fy-1)*TS+10,{wp:wp.id,noSolid:1});WAYPOINTS.push(wp);t.waypoint=wp;const R=REGIONS[regionIndex(t.region)];if(R)R.wps.push(wp);return wp;}
/* ---------- roads (A* on a coarse 2-tile grid) ---------- */
function buildRoads(){
 const G=2,GW=Math.ceil(MAPW/G),GH=Math.ceil(MAPH/G);
 const cost=new Float32Array(GW*GH);for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const x=gx*G,y=gy*G,i=idx(x,y);let c;
  if(!ISL[i])c=60;else{const h=HGT[i]/255;c=1+h*h*14;if(OCC[i]===3)c=400;else if(OCC[i]===1)c=0.4;else if(OCC[i]===2)c=0.8;else if(OCC[i]===4)c=18;}cost[gy*GW+gx]=c;}
 const edges=[];
 // connect towns within a region (star from capital) and capitals of neighbouring regions on the same island
 REGIONS.forEach(R=>{const cap=R.towns.find(t=>t.capital);if(!cap)return;R.towns.forEach(t=>{if(t!==cap&&!t.sea)edges.push([cap,t]);});});
 REGIONS.forEach((R,i)=>{const cap=R.towns.find(t=>t.capital);if(!cap)return;const near=REGIONS.map((Q,j)=>({Q,j,d:(Q.cx-R.cx)**2+(Q.cy-R.cy)**2})).filter(o=>o.j!==i&&o.Q.isl===R.isl).sort((a,b)=>a.d-b.d).slice(0,3);
  near.forEach(o=>{if(o.j<i)return;const c2=o.Q.towns.find(t=>t.capital);if(c2)edges.push([cap,c2]);});});
 // story towns connect to their region capital too (done above since they are in R.towns)
 const came=new Int32Array(GW*GH),gsc=new Float32Array(GW*GH);
 const heap=[];const hpush=(f,n)=>{heap.push([f,n]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
 const hpop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){let l=i*2+1,r=l+1,m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
 function astar(sx,sy,tx,ty){gsc.fill(1e9);came.fill(-1);const s=sy*GW+sx,t=ty*GW+tx;gsc[s]=0;heap.length=0;hpush(0,s);const closed=new Uint8Array(GW*GH);let pops=0;
  while(heap.length){const [f,n]=hpop();if(n===t)break;if(closed[n])continue;closed[n]=1;if(++pops>250000)break;
   const nx=n%GW,ny=(n/GW)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const mx=nx+dx,my=ny+dy;if(mx<0||my<0||mx>=GW||my>=GH)continue;const m=my*GW+mx;if(closed[m])continue;const c=cost[m]*(dx&&dy?1.41:1);const g=gsc[n]+c;if(g<gsc[m]){gsc[m]=g;came[m]=n;hpush(g+Math.hypot(tx-mx,ty-my),m);}}}
  if(came[t]<0&&t!==s)return null;const path=[];let n=t;while(n>=0&&n!==s){path.push([n%GW,(n/GW)|0]);n=came[n];}path.push([sx,sy]);return path.reverse();}
 function carve(p){for(let i=0;i<p.length;i++){const [gx,gy]=p[i];const x=gx*G,y=gy*G;for(let dy=0;dy<G;dy++)for(let dx=0;dx<G;dx++){const xx=x+dx,yy=y+dy;if(!inMap(xx,yy))continue;const k=idx(xx,yy);if(OCC[k]===3)continue;
    if(!ISL[k]||WATERY.has(TILES[k])){ // bridge over water (rivers / narrow straits)
     if(ISL[k]||i>0&&i<p.length-1){TILES[k]=TILE.PLANK;OCC[k]=1;const horiz=i>0&&Math.abs(p[i][0]-p[i-1][0])>=Math.abs(p[i][1]-p[i-1][1]);addProp(horiz?'bridgeH':'bridgeV',xx*TS,yy*TS+TS,{noSolid:1,bake:1});}}
    else{if(OCC[k]===2&&TILES[k]!==TILE.DIRT&&TILES[k]!==TILE.DIRT2&&TILES[k]!==TILE.GRAVEL)continue;TILES[k]=hash2(xx,yy,3)<0.5?TILE.ROAD:TILE.ROAD2;OCC[k]=1;cost[gy*GW+gx]=0.4;}}}
  for(let i=14;i<p.length;i+=28){const [gx,gy]=p[i];const x=gx*G-1,y=gy*G;if(inMap(x,y)&&ISL[idx(x,y)]&&OCC[idx(x,y)]===0)addProp(hash2(x,y,4)<0.5?'signpost':'jizo',x*TS+8,y*TS+12);}}
 edges.forEach(([a,b])=>{const ea=a.spots.entry||{x:a.x,y:a.y},eb=b.spots.entry||{x:b.x,y:b.y};const p=astar(Math.floor(ea.x/TS/G),Math.floor(ea.y/TS/G),Math.floor(eb.x/TS/G),Math.floor(eb.y/TS/G));if(p)carve(p);});
 // connectivity repair: every town must be walkable from its island's capital (or from the start on Honshū)
 const byIsl={};TOWNS.forEach(t=>{const i=ISL[idx(t.tx,t.ty)]||1;(byIsl[i]=byIsl[i]||[]).push(t);});
 for(const isl in byIsl){const ts=byIsl[isl];const src=isl==='1'?{x:LANDMARKS.start.x,y:LANDMARKS.start.y}:(ts.find(t=>t.capital)||ts[0]).spots.entry||ts[0];
  for(let round=0;round<3;round++){const seen=floodWalk(Math.floor(src.x/TS),Math.floor(src.y/TS));let fixed=0;
   for(const t of ts){const e=t.spots.entry||{x:t.x,y:t.y};const ex=Math.floor(e.x/TS),ey=Math.floor(e.y/TS);if(seen[idx(ex,ey)])continue;
    // nearest reached tile
    let best=null,bd=1e9;for(let y=Math.max(0,ey-60);y<Math.min(MAPH,ey+60);y+=2)for(let x=Math.max(0,ex-60);x<Math.min(MAPW,ex+60);x+=2){const k=idx(x,y);if(!seen[k])continue;const d=(x-ex)**2+(y-ey)**2;if(d<bd){bd=d;best=[x,y];}}
    if(!best)continue;const p=astar(Math.floor(ex/G),Math.floor(ey/G),Math.floor(best[0]/G),Math.floor(best[1]/G));if(p){carve(p);fixed++;}}
   if(!fixed)break;}}
}
function floodWalk(sx,sy){const seen=new Uint8Array(MAPW*MAPH);const q=new Int32Array(MAPW*MAPH);let h=0,n=0;if(blocked(sx,sy)){ // nudge to a free tile
  let f=null;for(let r=1;r<8&&!f;r++)for(let dy=-r;dy<=r&&!f;dy++)for(let dx=-r;dx<=r;dx++){if(!blocked(sx+dx,sy+dy)){f=[sx+dx,sy+dy];break;}}if(!f)return seen;sx=f[0];sy=f[1];}
 q[n++]=idx(sx,sy);seen[idx(sx,sy)]=1;while(h<n){const c=q[h++];const x=c%MAPW,y=(c/MAPW)|0;
  if(x>0&&!seen[c-1]&&!blocked(x-1,y)){seen[c-1]=1;q[n++]=c-1;}if(x<MAPW-1&&!seen[c+1]&&!blocked(x+1,y)){seen[c+1]=1;q[n++]=c+1;}
  if(y>0&&!seen[c-MAPW]&&!blocked(x,y-1)){seen[c-MAPW]=1;q[n++]=c-MAPW;}if(y<MAPH-1&&!seen[c+MAPW]&&!blocked(x,y+1)){seen[c+MAPW]=1;q[n++]=c+MAPW;}}
 return seen;}
/* ---------- minimap (1 px per tile) ---------- */
let MINI=null,MINIQ=null;
const TILE_COL={};
function buildMinimap(){const [c,q]=mkCanvas(MAPW,MAPH);MINI=c;MINIQ=q;const img=q.createImageData(MAPW,MAPH),d=img.data;
 const col=(t)=>{switch(t){case TILE.WATER:return [46,111,166];case TILE.DEEP:return [35,90,136];case TILE.LAKE:return [58,127,179];case TILE.SHALLOW:return [93,159,207];case TILE.SAND:case TILE.SAND2:return [227,211,162];
  case TILE.ROAD:case TILE.ROAD2:return [196,180,150];case TILE.GRAVEL:case TILE.STONE:case TILE.STONE2:return [170,166,154];case TILE.ROCK:case TILE.ROCK2:case TILE.CLIFF:case TILE.DARKROCK:return [120,122,126];case TILE.SNOWROCK:case TILE.SNOW:case TILE.SNOW2:return [230,236,242];
  case TILE.FOREST:case TILE.FOREST2:return [63,115,52];case TILE.BAMBOO:return [111,154,74];case TILE.PADDY:return [92,141,191];case TILE.PLANK:return [166,124,74];case TILE.DIRT:case TILE.DIRT2:return [160,132,90];case TILE.MOSS:return [111,142,69];default:return [104,159,82];}};
 for(let y=0;y<MAPH;y++)for(let x=0;x<MAPW;x++){const i=idx(x,y);const c=col(TILES[i]);const h=HGT[i]/255;const k=ISL[i]?0.8+h*0.45:1;const o=i*4;d[o]=clamp(c[0]*k,0,255);d[o+1]=clamp(c[1]*k,0,255);d[o+2]=clamp(c[2]*k,0,255);d[o+3]=255;}
 q.putImageData(img,0,0);
 // towns as dots
 TOWNS.forEach(t=>{q.fillStyle=t.kind==='castle'||t.kind==='fort'?'#f3e6d0':'#e8c48a';q.fillRect(t.tx-1,t.ty-1,3,3);});}
/* ---------- chunk renderer ---------- */
const CHUNKS=new Map();let chunkBudget=0;const ROCKY=new Set([TILE.ROCK,TILE.ROCK2,TILE.SNOWROCK,TILE.CLIFF,TILE.DARKROCK]);
function chunkCanvas(cx,cy){const key=chunkKey(cx,cy);let c=CHUNKS.get(key);if(c){c.t=T;return c.c;}
 const [cv,q]=mkCanvas(CH_T*TS,CH_T*TS);const x0=cx*CH_T,y0=cy*CH_T;
 for(let y=0;y<CH_T;y++)for(let x=0;x<CH_T;x++){const tx=x0+x,ty=y0+y;const t=tileAt(tx,ty);const [ax,ay]=tileXY(t);q.drawImage(ATLAS,ax,ay,TS,TS,x*TS,y*TS,TS,TS);
  if(WATERY.has(t)&&t!==TILE.SHALLOW){ // foam where land touches
   let m=0;if(!isWater(tx,ty-1)&&inMap(tx,ty-1))m|=1;if(!isWater(tx+1,ty)&&inMap(tx+1,ty))m|=2;if(!isWater(tx,ty+1)&&inMap(tx,ty+1))m|=4;if(!isWater(tx-1,ty)&&inMap(tx-1,ty))m|=8;
   if(m){const [fx,fy]=tileXY(FOAM_BASE+m);q.drawImage(ATLAS,fx,fy,TS,TS,x*TS,y*TS,TS,TS);}}
  else if(ROCKY.has(t)){const b=tileAt(tx,ty+1);if(!ROCKY.has(b)){q.fillStyle='rgba(30,28,32,.55)';q.fillRect(x*TS,y*TS+10,TS,6);q.fillStyle='rgba(255,255,255,.12)';q.fillRect(x*TS,y*TS,TS,1);for(let k=0;k<4;k++)q.fillRect(x*TS+k*4+1,y*TS+11+(k%2),2,1);}
   if(!ROCKY.has(tileAt(tx,ty-1))){q.fillStyle='rgba(255,255,255,.14)';q.fillRect(x*TS,y*TS,TS,2);}}
  else if(!WATERY.has(t)){ // soft shadow where land meets water below (cliff feel)
   if(isWater(tx,ty+1)&&t!==TILE.SAND&&t!==TILE.SAND2&&t!==TILE.PLANK){q.fillStyle='rgba(0,0,0,.18)';q.fillRect(x*TS,y*TS+TS-2,TS,2);}}}
 // baked props (flowers, bridges)
 const ps=PROPS_CHUNK.get(key);if(ps)for(const p of ps){if(p.k[0]==='@')continue;const d=PROPS[p.k];if(!d)continue;if(p.bake||p.k==='flowers'||p.k==='mapleLeaf'||p.k==='bridgeH'||p.k==='bridgeV'||p.k==='dock'){q.drawImage(d.c,p.x-d.ax-x0*TS,p.y-d.ay-y0*TS);}}
 CHUNKS.set(key,{c:cv,t:T});if(CHUNKS.size>28){let ok=null,ot=1e18;for(const [k,v] of CHUNKS)if(v.t<ot){ot=v.t;ok=k;}CHUNKS.delete(ok);}return cv;}
const isBaked=p=>p.bake||p.k==='flowers'||p.k==='mapleLeaf'||p.k==='bridgeH'||p.k==='bridgeV'||p.k==='dock';
/* draw the ground for a camera rect (logical px); returns nothing */
function drawGround(cam){const x0=Math.floor(cam.x/TS/CH_T),y0=Math.floor(cam.y/TS/CH_T),x1=Math.floor((cam.x+W)/TS/CH_T),y1=Math.floor((cam.y+H)/TS/CH_T);
 for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const c=chunkCanvas(cx,cy);G.drawImage(c,Math.round(cx*CH_T*TS-cam.x),Math.round(cy*CH_T*TS-cam.y));}
 // animated water sparkle
 if(!window.LITE){const f=WATER_FRAMES[Math.floor(T*3)%4];const [fx,fy]=tileXY(f);const tx0=Math.floor(cam.x/TS),ty0=Math.floor(cam.y/TS),tx1=Math.ceil((cam.x+W)/TS),ty1=Math.ceil((cam.y+H)/TS);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(((tx*7+ty*13)&3)!==(Math.floor(T*2)&3))continue;const t=tileAt(tx,ty);if(WATERY.has(t))G.drawImage(ATLAS,fx,fy,TS,TS,Math.round(tx*TS-cam.x),Math.round(ty*TS-cam.y),TS,TS);}}}
/* gather visible props (non-baked) as drawables */
function visibleProps(cam,out){const x0=Math.floor((cam.x-64)/TS/CH_T),y0=Math.floor((cam.y-64)/TS/CH_T),x1=Math.floor((cam.x+W+64)/TS/CH_T),y1=Math.floor((cam.y+H+160)/TS/CH_T);
 for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const ps=PROPS_CHUNK.get(chunkKey(cx,cy));if(!ps)continue;for(const p of ps){if(p.k[0]!=='@'&&isBaked(p))continue;
  if(p.x<cam.x-80||p.x>cam.x+W+80||p.y<cam.y-20||p.y>cam.y+H+150)continue;out.push(p);}}}
function drawProp(p,cam,night){if(p.k[0]==='@'){const B=BUILD[p.k.slice(1)];if(!B)return;const x=Math.round(p.b.x-B.ax-cam.x),y=Math.round(p.y-B.h-cam.y);
  G.drawImage(B.c,x,y);if(night>0.25&&B.lit){G.globalAlpha=Math.min(0.75,night)*(0.75+0.25*Math.sin(T*3+p.x));G.fillStyle='#ffd27a';
   // shoji glow approximation: little lit squares along the wall band
   for(let i=0;i<Math.floor(B.tw*0.6);i++)G.fillRect(x+10+i*22,y+Math.floor(B.h*0.5),10,6);G.globalAlpha=1;}return;}
 const d=PROPS[p.k];if(!d)return;const x=Math.round(p.x-d.ax-cam.x),y=Math.round(p.y-d.ay-cam.y);
 if(d.shadow){G.fillStyle=PAL.shadow;G.fillRect(Math.round(p.x-cam.x-d.w*0.3),Math.round(p.y-cam.y-2),Math.round(d.w*0.6),3);}
 G.drawImage(d.c,x,y);
 if(p.wp){const wp=WAYPOINTS.find(w=>w.id===p.wp);if(wp&&S.wps[wp.id]&&p.k==='shrineBox'){G.globalAlpha=0.6+0.4*Math.sin(T*4);G.fillStyle='#9fe3ff';G.fillRect(x+5,y+8,4,2);G.globalAlpha=1;}}}
function nearestTown(px,py){let b=null,bd=1e18;for(const t of TOWNS){const d=(t.x-px)**2+(t.y-py)**2;if(d<bd){bd=d;b=t;}}return {t:b,d:Math.sqrt(bd)};}
