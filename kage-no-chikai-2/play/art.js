'use strict';
/* ============================================================================
   ART — procedural pixel art: tile atlas, nature props, Japanese buildings, UI bits.
   Every sprite is drawn into an offscreen canvas once at boot (deterministic hash noise).
   ========================================================================== */
const TS=16;                                                   // tile size (logical px)
const PAL={
 grass:['#649c4d','#689f52','#6ea356','#60984a'],grassD:'#538a42',grassL:'#86b464',
 dirt:['#a0845a','#a88c62','#9a7e55'],dirtD:'#7e6540',
 road:['#b4a68c','#aa9d85','#bdb096'],roadD:'#8c8068',
 sand:['#e3d3a2','#d9c998','#e8d9ab'],sandD:'#c2b283',
 water:['#2e6fa6','#2f74ad','#2d6a9f'],waterL:'#4d8fc4',waterD:'#235a88',shallow:'#5d9fcf',foam:'#dbeefc',
 paddy:'#5c8dbf',paddyL:'#7fb3d8',seedling:'#6cbf5a',paddyBank:'#8a7250',
 snow:['#eef2f6','#e6ecf2','#f4f7fa'],snowD:'#c9d4de',
 rock:['#7d7f84','#76787d','#86888d'],rockD:'#55575c',rockL:'#a3a5a9',
 forest:'#3f7334',forestD:'#2f5a28',bamboo:'#7fb24c',bambooD:'#4d7a2f',
 plank:'#a67c4a',plankD:'#7d5a33',
 wood:'#5b3f28',woodL:'#7a5536',woodD:'#3d2a1a',plaster:'#efe6d2',plasterD:'#cfc3aa',
 tile:'#4a5566',tileL:'#6a7686',tileD:'#2f3744',thatch:'#b89a5c',thatchD:'#8f7440',thatchL:'#d0b472',
 vermilion:'#c8402a',vermilionD:'#8f2a1b',lacquer:'#1c1a1e',gold:'#d9b24e',
 sakura:'#f2b8c6',sakuraD:'#d98aa0',maple:'#d2472f',mapleD:'#9c2f1e',pine:'#2f6b3a',pineD:'#1f4a28',pineL:'#4a8a4e',
 trunk:'#5a3d26',trunkD:'#3a2617',leaf:'#4f8f3f',leafD:'#376a2a',leafL:'#72b35a',
 shadow:'rgba(0,0,0,.28)',outline:'#1a1612',
 skin:['#f1d4b8','#e8c39f','#d8ad84','#c99a6f'],hair:['#1a1416','#2b1d16','#4a3222','#6b4a2e','#9a8a80','#d8d0c8'],
 blood:'#8e1119',bloodL:'#c41b26',
};
/* ---------- tiny pixel API ---------- */
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');q.imageSmoothingEnabled=false;return [c,q];}
const px=(q,x,y,c)=>{q.fillStyle=c;q.fillRect(x|0,y|0,1,1);};
const rect=(q,x,y,w,h,c)=>{q.fillStyle=c;q.fillRect(x|0,y|0,w|0,h|0);};
function hline(q,x0,x1,y,c){rect(q,Math.min(x0,x1),y,Math.abs(x1-x0)+1,1,c);}
function vline(q,x,y0,y1,c){rect(q,x,Math.min(y0,y1),1,Math.abs(y1-y0)+1,c);}
function line(q,x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)px(q,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c);}
function ell(q,cx,cy,rx,ry,c){for(let y=Math.ceil(cy-ry);y<=Math.floor(cy+ry);y++){const t=(y-cy)/ry,w=rx*Math.sqrt(Math.max(0,1-t*t));rect(q,Math.ceil(cx-w),y,Math.floor(cx+w)-Math.ceil(cx-w)+1,1,c);}}
function tri(q,x0,y0,x1,y1,x2,y2,c){const miny=Math.min(y0,y1,y2),maxy=Math.max(y0,y1,y2);for(let y=miny;y<=maxy;y++){const xs=[];const e=(ax,ay,bx,by)=>{if((y>=ay&&y<=by)||(y>=by&&y<=ay)){if(ay===by)xs.push(ax,bx);else xs.push(ax+(bx-ax)*(y-ay)/(by-ay));}};e(x0,y0,x1,y1);e(x1,y1,x2,y2);e(x2,y2,x0,y0);if(xs.length)hline(q,Math.round(Math.min(...xs)),Math.round(Math.max(...xs)),y,c);}}
function speckle(q,x,y,w,h,c,p,seed){for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(hash2(x+i,y+j,seed)<p)px(q,x+i,y+j,c);}
const shade=(hex,k)=>{const c=hex.replace('#','');const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v*k))).toString(16).padStart(2,'0')).join('');};
const mixc=(a,b,t)=>{const A=a.replace('#',''),B=b.replace('#','');const f=(s,i)=>parseInt(s.slice(i,i+2),16);return '#'+[0,2,4].map(i=>Math.round(f(A,i)+(f(B,i)-f(A,i))*t).toString(16).padStart(2,'0')).join('');};

/* ============================ TILE ATLAS ============================ */
const TILE={GRASS:0,GRASS2:1,GRASS3:2,GRASS4:3,TALL:4,DIRT:5,DIRT2:6,ROAD:7,ROAD2:8,SAND:9,SAND2:10,WATER:11,DEEP:12,SHALLOW:13,PADDY:14,SNOW:15,SNOW2:16,ROCK:17,ROCK2:18,FOREST:19,FOREST2:20,BAMBOO:21,PLANK:22,LAKE:23,SNOWROCK:24,STONE:25,STONE2:26,MOSS:27,GRAVEL:28,CLIFF:29,DARKROCK:30,COUNT:31};
const WALKABLE=new Set([TILE.GRASS,TILE.GRASS2,TILE.GRASS3,TILE.GRASS4,TILE.TALL,TILE.DIRT,TILE.DIRT2,TILE.ROAD,TILE.ROAD2,TILE.SAND,TILE.SAND2,TILE.SHALLOW,TILE.PADDY,TILE.SNOW,TILE.SNOW2,TILE.FOREST,TILE.FOREST2,TILE.BAMBOO,TILE.PLANK,TILE.STONE,TILE.STONE2,TILE.MOSS,TILE.GRAVEL]);
const WATERY=new Set([TILE.WATER,TILE.DEEP,TILE.LAKE,TILE.SHALLOW]);
let ATLAS=null,ATLASQ=null,ACOLS=16;
function tileXY(id){return [(id%ACOLS)*TS,Math.floor(id/ACOLS)*TS];}
function buildTiles(){const [c,q]=mkCanvas(ACOLS*TS,Math.ceil((TILE.COUNT+16)/ACOLS)*TS);ATLAS=c;ATLASQ=q;
 const at=(id,fn)=>{const [x,y]=tileXY(id);fn(q,x,y,id);};
 const grass=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);speckle(q,x,y,TS,TS,PAL.grassD,0.13,id*3+1);speckle(q,x,y,TS,TS,PAL.grassL,0.08,id*3+2);for(let i=0;i<3;i++){const gx=x+((id*7+i*5)%14)+1,gy=y+((id*5+i*9)%13)+1;vline(q,gx,gy,gy-1,PAL.grassD);}};
 at(TILE.GRASS,(q,x,y,id)=>grass(q,x,y,id,PAL.grass[0]));at(TILE.GRASS2,(q,x,y,id)=>grass(q,x,y,id,PAL.grass[1]));at(TILE.GRASS3,(q,x,y,id)=>grass(q,x,y,id,PAL.grass[2]));at(TILE.GRASS4,(q,x,y,id)=>grass(q,x,y,id,PAL.grass[3]));
 at(TILE.TALL,(q,x,y,id)=>{grass(q,x,y,id,PAL.grass[1]);for(let i=0;i<7;i++){const gx=x+(i*2+1),gy=y+8+((i*5)%6);vline(q,gx,gy,gy-4,PAL.grassD);px(q,gx,gy-5,PAL.grassL);}});
 const dirt=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);speckle(q,x,y,TS,TS,PAL.dirtD,0.1,id*3+5);speckle(q,x,y,TS,TS,shade(base,1.1),0.08,id*3+6);};
 at(TILE.DIRT,(q,x,y,id)=>dirt(q,x,y,id,PAL.dirt[0]));at(TILE.DIRT2,(q,x,y,id)=>dirt(q,x,y,id,PAL.dirt[1]));
 const road=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);for(let j=0;j<4;j++)for(let i=0;i<4;i++){if(hash2(i,j,id)<0.5)continue;const sx=x+i*4+(j%2?2:0),sy=y+j*4;rect(q,sx,sy,3,3,shade(base,0.93+hash2(i,j,id+9)*0.12));px(q,sx,sy,shade(base,1.08));}speckle(q,x,y,TS,TS,PAL.roadD,0.05,id);};
 at(TILE.ROAD,(q,x,y,id)=>road(q,x,y,id,PAL.road[0]));at(TILE.ROAD2,(q,x,y,id)=>road(q,x,y,id,PAL.road[1]));
 at(TILE.GRAVEL,(q,x,y,id)=>{rect(q,x,y,TS,TS,'#b9b3a4');speckle(q,x,y,TS,TS,'#9a9486',0.2,id);speckle(q,x,y,TS,TS,'#d2ccbd',0.12,id+1);});
 const sand=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);speckle(q,x,y,TS,TS,PAL.sandD,0.08,id*3+7);speckle(q,x,y,TS,TS,'#f1e5bd',0.08,id*3+8);};
 at(TILE.SAND,(q,x,y,id)=>sand(q,x,y,id,PAL.sand[0]));at(TILE.SAND2,(q,x,y,id)=>sand(q,x,y,id,PAL.sand[1]));
 at(TILE.WATER,(q,x,y)=>{rect(q,x,y,TS,TS,PAL.water[0]);speckle(q,x,y,TS,TS,PAL.water[1],0.3,41);});
 at(TILE.DEEP,(q,x,y)=>{rect(q,x,y,TS,TS,PAL.waterD);speckle(q,x,y,TS,TS,PAL.water[0],0.25,42);});
 at(TILE.LAKE,(q,x,y)=>{rect(q,x,y,TS,TS,'#3a7fb3');speckle(q,x,y,TS,TS,'#3f86ba',0.3,43);});
 at(TILE.SHALLOW,(q,x,y)=>{rect(q,x,y,TS,TS,PAL.shallow);speckle(q,x,y,TS,TS,'#79b4dc',0.25,44);speckle(q,x,y,TS,TS,PAL.sand[0],0.06,45);});
 at(TILE.PADDY,(q,x,y)=>{rect(q,x,y,TS,TS,PAL.paddy);speckle(q,x,y,TS,TS,PAL.paddyL,0.18,46);for(let j=1;j<TS;j+=4)for(let i=1;i<TS;i+=4){rect(q,x+i,y+j,2,2,PAL.seedling);px(q,x+i,y+j+1,'#4f9a42');}});
 const snow=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);speckle(q,x,y,TS,TS,PAL.snowD,0.07,id*3+11);speckle(q,x,y,TS,TS,'#ffffff',0.1,id*3+12);};
 at(TILE.SNOW,(q,x,y,id)=>snow(q,x,y,id,PAL.snow[0]));at(TILE.SNOW2,(q,x,y,id)=>snow(q,x,y,id,PAL.snow[1]));
 const rock=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);speckle(q,x,y,TS,TS,shade(base,0.88),0.25,id*5+1);speckle(q,x,y,TS,TS,shade(base,1.1),0.12,id*5+2);for(let k=0;k<3;k++){const rx=x+(k*6+id*3)%13,ry=y+(k*5+id*7)%13;line(q,rx,ry,rx+2,ry+2,PAL.rockD);px(q,rx+1,ry,PAL.rockL);}};
 at(TILE.ROCK,(q,x,y,id)=>rock(q,x,y,id,PAL.rock[0]));at(TILE.ROCK2,(q,x,y,id)=>rock(q,x,y,id,PAL.rock[1]));
 at(TILE.DARKROCK,(q,x,y,id)=>{rect(q,x,y,TS,TS,'#5e6064');speckle(q,x,y,TS,TS,'#4a4c50',0.3,id+3);speckle(q,x,y,TS,TS,'#767980',0.1,id+4);});
 at(TILE.CLIFF,(q,x,y,id)=>{rect(q,x,y,TS,TS,PAL.rockD);for(let j=0;j<TS;j+=3)hline(q,x,x+TS-1,y+j,'#6c6e72');speckle(q,x,y,TS,TS,'#45474b',0.2,id+5);});
 at(TILE.SNOWROCK,(q,x,y,id)=>{rock(q,x,y,id,PAL.rock[2]);rect(q,x,y,TS,6,PAL.snow[0]);speckle(q,x,y+5,TS,3,PAL.snow[0],0.5,id);});
 const forest=(q,x,y,id,base)=>{rect(q,x,y,TS,TS,base);speckle(q,x,y,TS,TS,PAL.forestD,0.2,id*3+13);speckle(q,x,y,TS,TS,'#4f8a40',0.1,id*3+14);};
 at(TILE.FOREST,(q,x,y,id)=>forest(q,x,y,id,PAL.forest));at(TILE.FOREST2,(q,x,y,id)=>forest(q,x,y,id,'#467c3a'));
 at(TILE.BAMBOO,(q,x,y,id)=>{rect(q,x,y,TS,TS,'#6f9a4a');speckle(q,x,y,TS,TS,PAL.bambooD,0.15,id);speckle(q,x,y,TS,TS,'#9ac86a',0.1,id+1);});
 at(TILE.PLANK,(q,x,y)=>{rect(q,x,y,TS,TS,PAL.plank);for(let j=0;j<TS;j+=4)hline(q,x,x+TS-1,y+j,PAL.plankD);speckle(q,x,y,TS,TS,shade(PAL.plank,0.9),0.08,51);});
 at(TILE.STONE,(q,x,y,id)=>{rect(q,x,y,TS,TS,'#9c9a92');for(let j=0;j<TS;j+=8){hline(q,x,x+TS-1,y+j,'#7a786f');for(let i=((j/8)%2)*4;i<TS;i+=8)vline(q,x+i,y+j,y+j+7,'#7a786f');}speckle(q,x,y,TS,TS,'#aeaca3',0.1,id);});
 at(TILE.STONE2,(q,x,y,id)=>{rect(q,x,y,TS,TS,'#a39f95');for(let j=0;j<TS;j+=8){hline(q,x,x+TS-1,y+j,'#7e7a70');for(let i=((j/8)%2)*4;i<TS;i+=8)vline(q,x+i,y+j,y+j+7,'#7e7a70');}speckle(q,x,y,TS,TS,'#8c887e',0.08,id);});
 at(TILE.MOSS,(q,x,y,id)=>{rect(q,x,y,TS,TS,'#6f8e45');speckle(q,x,y,TS,TS,'#5a7636',0.2,id);speckle(q,x,y,TS,TS,'#8aa858',0.1,id+2);});
 // water animation frames (4) and foam edge overlays (16 masks) in rows after COUNT
 WATER_FRAMES.length=0;for(let f=0;f<4;f++){const id=TILE.COUNT+f;const [x,y]=tileXY(id);rect(q,x,y,TS,TS,'rgba(0,0,0,0)');q.clearRect(x,y,TS,TS);for(let k=0;k<5;k++){const wx=x+((k*6+f*2)%15),wy=y+((k*4+f)%15);hline(q,wx,wx+2,wy,'rgba(220,240,255,.45)');}WATER_FRAMES.push(id);}
 FOAM_BASE=TILE.COUNT+4;for(let m=0;m<16;m++){const id=FOAM_BASE+m;const [x,y]=tileXY(id);q.clearRect(x,y,TS,TS);
  if(m&1){hline(q,x,x+TS-1,y,PAL.foam);hline(q,x,x+TS-1,y+1,'rgba(219,238,252,.6)');}if(m&2){vline(q,x+TS-1,y,y+TS-1,PAL.foam);vline(q,x+TS-2,y,y+TS-1,'rgba(219,238,252,.6)');}
  if(m&4){hline(q,x,x+TS-1,y+TS-1,PAL.foam);hline(q,x,x+TS-1,y+TS-2,'rgba(219,238,252,.6)');}if(m&8){vline(q,x,y,y+TS-1,PAL.foam);vline(q,x+1,y,y+TS-1,'rgba(219,238,252,.6)');}}
}
const WATER_FRAMES=[];let FOAM_BASE=0;

/* ============================ PROPS (anchor: bottom centre) ============================ */
// each prop: {c:canvas, ax:anchorX, ay:anchorY, w,h, solid:{x,y,w,h} relative to anchor (footprint), shadow}
const PROPS={};
function defProp(name,w,h,draw,opt={}){const [c,q]=mkCanvas(w,h);draw(q,w,h);PROPS[name]=Object.assign({c,w,h,ax:Math.floor(w/2),ay:h-(opt.ay||0),solid:opt.solid||null,shadow:opt.shadow!==undefined?opt.shadow:true,tall:opt.tall||0},opt);}
function treeRound(q,w,h,crown,crownD,crownL,trunk,seed){const cx=w/2,ty=h-2;rect(q,cx-1.5,ty-6,3,7,PAL.trunk);px(q,cx-2,ty,PAL.trunkD);
 ell(q,cx,h*0.42,w*0.44,h*0.34,crownD);ell(q,cx-1,h*0.38,w*0.38,h*0.28,crown);ell(q,cx-2,h*0.3,w*0.2,h*0.14,crownL);speckle(q,0,0,w,h*0.7,crownD,0.08,seed);speckle(q,2,2,w-4,h*0.5,crownL,0.06,seed+1);}
function buildProps(){
 for(let v=0;v<3;v++)defProp('tree'+v,22,30,(q,w,h)=>treeRound(q,w,h,PAL.leaf,PAL.leafD,PAL.leafL,PAL.trunk,10+v),{solid:{x:-3,y:-4,w:6,h:4}});
 for(let v=0;v<2;v++)defProp('sakura'+v,24,30,(q,w,h)=>treeRound(q,w,h,PAL.sakura,PAL.sakuraD,'#fbe3ea',PAL.trunk,20+v),{solid:{x:-3,y:-4,w:6,h:4}});
 for(let v=0;v<2;v++)defProp('maple'+v,22,28,(q,w,h)=>treeRound(q,w,h,PAL.maple,PAL.mapleD,'#ef7a4a',PAL.trunk,30+v),{solid:{x:-3,y:-4,w:6,h:4}});
 for(let v=0;v<3;v++)defProp('pine'+v,20,36,(q,w,h)=>{const cx=w/2;rect(q,cx-1,h-10,3,10,PAL.trunk);for(let k=0;k<4;k++){const yy=h-8-k*7,ww=9-k*2;tri(q,cx-ww,yy,cx+ww,yy,cx,yy-10,PAL.pineD);tri(q,cx-ww+2,yy-1,cx+ww-1,yy-1,cx,yy-9,PAL.pine);px(q,cx-1,yy-5,PAL.pineL);}speckle(q,2,0,w-4,h-10,PAL.pineL,0.05,40+v);},{solid:{x:-2,y:-3,w:5,h:3}});
 for(let v=0;v<2;v++)defProp('cedar'+v,16,42,(q,w,h)=>{const cx=w/2;rect(q,cx-1,h-8,3,8,PAL.trunkD);for(let k=0;k<6;k++){const yy=h-7-k*6,ww=7-k;tri(q,cx-ww,yy,cx+ww,yy,cx,yy-9,k%2?PAL.pineD:'#255a30');}px(q,cx,2,PAL.pineL);},{solid:{x:-2,y:-3,w:4,h:3}});
 defProp('willow',26,34,(q,w,h)=>{const cx=w/2;rect(q,cx-1,h-12,3,12,PAL.trunk);ell(q,cx,h*0.35,11,8,PAL.leafD);ell(q,cx,h*0.33,9,6,PAL.leaf);for(let i=0;i<9;i++){const x=cx-10+i*2.5;vline(q,x,h*0.45,h*0.45+6+(i*3)%7,i%2?PAL.leafD:PAL.leaf);}},{solid:{x:-2,y:-3,w:5,h:3}});
 for(let v=0;v<3;v++)defProp('bamboo'+v,18,40,(q,w,h)=>{for(let k=0;k<5;k++){const x=2+k*3+(v+k)%2,top=4+((k*7+v*3)%9);vline(q,x,top,h-1,PAL.bamboo);vline(q,x+1,top,h-1,PAL.bambooD);for(let y=top+4;y<h;y+=6)hline(q,x,x+1,y,'#d9e8a0');for(let y=top;y<h-10;y+=9){line(q,x,y,x-3,y-3,PAL.leafD);line(q,x+1,y+2,x+4,y-1,PAL.leaf);}}},{solid:{x:-5,y:-2,w:10,h:2},shadow:false});
 defProp('bush',14,10,(q,w,h)=>{ell(q,7,6,6.5,3.5,PAL.leafD);ell(q,6,5,5,2.5,PAL.leaf);px(q,4,3,PAL.leafL);px(q,8,4,PAL.leafL);},{solid:null});
 defProp('bush2',12,9,(q,w,h)=>{ell(q,6,5,5.5,3,'#3f7a46');ell(q,5,4,4,2,'#4f9452');px(q,4,3,'#7ab86a');},{solid:null});
 defProp('flowers',12,8,(q,w,h)=>{for(let i=0;i<5;i++){const x=1+i*2.3,y=3+(i*3)%4;vline(q,x,y,y+3,PAL.grassD);px(q,x,y-1,['#f2d35a','#ef8fb0','#ffffff','#f26b5a','#b48ee0'][i]);}},{solid:null,shadow:false});
 defProp('rock',14,10,(q,w,h)=>{ell(q,7,6,6,3.5,PAL.rockD);ell(q,6,5,5,3,PAL.rock[0]);px(q,4,3,PAL.rockL);px(q,5,3,PAL.rockL);},{solid:{x:-5,y:-2,w:10,h:2}});
 defProp('rock2',10,8,(q,w,h)=>{ell(q,5,5,4.5,2.5,PAL.rockD);ell(q,4.5,4,3.5,2,PAL.rock[1]);px(q,3,3,PAL.rockLplanted||PAL.rockL);},{solid:{x:-4,y:-2,w:8,h:2}});
 defProp('boulder',22,16,(q,w,h)=>{ell(q,11,10,10,5.5,PAL.rockD);ell(q,10,8,9,5,PAL.rock[0]);ell(q,8,6,5,2.5,PAL.rockL);speckle(q,2,2,18,10,PAL.rockD,0.08,61);},{solid:{x:-9,y:-4,w:18,h:4}});
 defProp('lantern',10,20,(q,w,h)=>{rect(q,3,16,4,4,'#6d6a62');rect(q,4,8,2,8,'#6d6a62');rect(q,1,6,8,3,'#7e7b72');rect(q,2,3,6,3,'#5c5a53');rect(q,3,4,4,1,'#f2c56a');tri(q,0,3,10,3,5,0,'#6d6a62');px(q,5,1,'#8c8980');},{solid:{x:-2,y:-2,w:5,h:2},glow:0.5});
 defProp('torii',40,34,(q,w,h)=>{rect(q,6,8,4,26,PAL.vermilion);rect(q,30,8,4,26,PAL.vermilion);rect(q,6,8,1,26,PAL.vermilionD);rect(q,30,8,1,26,PAL.vermilionD);rect(q,8,13,24,3,PAL.vermilion);rect(q,2,5,36,3,PAL.vermilion);rect(q,0,2,40,3,PAL.lacquer);hline(q,0,39,4,PAL.vermilionD);rect(q,19,8,2,5,PAL.vermilion);rect(q,4,32,8,2,'#5a5a56');rect(q,28,32,8,2,'#5a5a56');},{solid:{x:-15,y:-2,w:6,h:2},tall:1});
 defProp('torii2',24,22,(q,w,h)=>{rect(q,4,5,2,17,PAL.vermilion);rect(q,18,5,2,17,PAL.vermilion);rect(q,5,9,14,2,PAL.vermilion);rect(q,1,3,22,2,PAL.vermilion);rect(q,0,1,24,2,PAL.lacquer);},{solid:{x:-9,y:-1,w:4,h:1},tall:1});
 defProp('jizo',8,12,(q,w,h)=>{rect(q,2,4,4,8,'#8b8780');ell(q,4,3,2.5,2.5,'#9a968f');rect(q,2,5,4,2,PAL.vermilion);px(q,3,2,'#6b6760');},{solid:{x:-2,y:-1,w:4,h:1}});
 defProp('well',16,16,(q,w,h)=>{rect(q,2,9,12,7,'#8a877f');hline(q,2,13,9,'#a6a39b');rect(q,4,11,8,3,'#2f3a44');rect(q,3,2,2,8,PAL.wood);rect(q,11,2,2,8,PAL.wood);rect(q,1,1,14,2,PAL.tile);tri(q,1,1,15,1,8,-2,PAL.tile);rect(q,7,3,2,5,'#6d6a62');},{solid:{x:-6,y:-3,w:12,h:3}});
 defProp('fence',16,8,(q,w,h)=>{rect(q,0,3,16,1,PAL.wood);rect(q,0,6,16,1,PAL.wood);for(let x=1;x<16;x+=5){rect(q,x,1,2,7,PAL.woodL);px(q,x,1,PAL.woodD);}},{solid:{x:-8,y:-1,w:16,h:1},shadow:false});
 defProp('fenceV',6,16,(q,w,h)=>{rect(q,2,0,1,16,PAL.wood);rect(q,4,0,1,16,PAL.wood);for(let y=1;y<16;y+=5){rect(q,1,y,5,2,PAL.woodL);}},{solid:{x:-2,y:-16,w:4,h:16},shadow:false});
 defProp('signpost',10,16,(q,w,h)=>{rect(q,4,4,2,12,PAL.wood);rect(q,1,2,8,5,PAL.plank);hline(q,1,8,2,PAL.woodL);px(q,3,4,PAL.woodD);px(q,5,4,PAL.woodD);},{solid:{x:-1,y:-1,w:3,h:1}});
 defProp('lampost',8,22,(q,w,h)=>{rect(q,3,6,2,16,PAL.woodD);rect(q,1,2,6,5,'#f3d58a');rect(q,2,3,4,3,'#ffe9b0');rect(q,0,1,8,1,PAL.lacquer);rect(q,0,7,8,1,PAL.lacquer);},{solid:{x:-1,y:-1,w:3,h:1},glow:1});
 defProp('stall',28,22,(q,w,h)=>{rect(q,2,8,24,14,PAL.wood);rect(q,4,12,20,8,PAL.plank);rect(q,0,2,28,6,PAL.vermilion);for(let x=0;x<28;x+=4)rect(q,x,2,2,6,'#efe6d2');rect(q,2,8,1,14,PAL.woodD);rect(q,25,8,1,14,PAL.woodD);for(let i=0;i<5;i++)rect(q,5+i*4,13,3,3,['#e07a2f','#f2d35a','#6cbf5a','#ef8fb0','#c8402a'][i]);},{solid:{x:-13,y:-5,w:26,h:5}});
 defProp('crate',10,9,(q,w,h)=>{rect(q,0,1,10,8,PAL.plank);rect(q,0,1,10,1,PAL.woodL);vline(q,0,1,8,PAL.woodD);vline(q,9,1,8,PAL.woodD);line(q,1,2,8,7,PAL.woodD);},{solid:{x:-5,y:-3,w:10,h:3}});
 defProp('barrel',10,12,(q,w,h)=>{ell(q,5,6,4.5,5.5,PAL.wood);rect(q,1,3,8,1,'#8a8780');rect(q,1,8,8,1,'#8a8780');vline(q,3,2,10,PAL.woodL);},{solid:{x:-4,y:-3,w:8,h:3}});
 defProp('hay',16,12,(q,w,h)=>{ell(q,8,7,7.5,4.5,PAL.thatchD);ell(q,7,6,6,3.5,PAL.thatch);speckle(q,2,2,12,8,PAL.thatchL,0.15,70);},{solid:{x:-6,y:-3,w:12,h:3}});
 defProp('grave',10,14,(q,w,h)=>{rect(q,3,2,4,12,'#8b8780');rect(q,1,12,8,2,'#6d6a62');hline(q,3,6,2,'#a6a39b');rect(q,4,5,2,1,'#5c5a53');rect(q,4,8,2,1,'#5c5a53');},{solid:{x:-3,y:-1,w:6,h:1}});
 defProp('boat',26,12,(q,w,h)=>{rect(q,2,5,22,5,PAL.wood);tri(q,0,5,2,5,2,10,PAL.wood);tri(q,24,5,26,5,24,10,PAL.wood);hline(q,2,23,5,PAL.woodL);rect(q,12,0,1,6,PAL.woodD);},{solid:{x:-11,y:-3,w:22,h:3}});
 defProp('scarecrow',12,20,(q,w,h)=>{rect(q,5,6,2,14,PAL.wood);rect(q,1,8,10,1,PAL.wood);rect(q,3,7,6,5,'#6b5a7a');ell(q,6,4,3,3,PAL.thatch);tri(q,1,3,11,3,6,-1,PAL.thatchD);},{solid:null});
 defProp('bridgeH',16,16,(q,w,h)=>{rect(q,0,0,16,16,PAL.plank);for(let j=0;j<16;j+=4)hline(q,0,15,j,PAL.plankD);rect(q,0,0,16,2,PAL.vermilion);rect(q,0,14,16,2,PAL.vermilion);},{solid:null,shadow:false});
 defProp('bridgeV',16,16,(q,w,h)=>{rect(q,0,0,16,16,PAL.plank);for(let i=0;i<16;i+=4)vline(q,i,0,15,PAL.plankD);rect(q,0,0,2,16,PAL.vermilion);rect(q,14,0,2,16,PAL.vermilion);},{solid:null,shadow:false});
 defProp('dock',16,16,(q,w,h)=>{rect(q,0,0,16,16,PAL.plankD);for(let j=0;j<16;j+=4)hline(q,0,15,j,PAL.plank);px(q,2,13,PAL.woodD);px(q,13,13,PAL.woodD);},{solid:null,shadow:false});
 defProp('campfire',12,10,(q,w,h)=>{rect(q,1,8,10,2,'#4a4038');rect(q,3,6,6,2,PAL.wood);tri(q,3,7,9,7,6,1,'#f29a2f');tri(q,4,7,8,7,6,3,'#ffd35a');},{solid:{x:-4,y:-2,w:8,h:2},glow:1});
 defProp('shrineBox',14,14,(q,w,h)=>{rect(q,2,4,10,10,PAL.wood);rect(q,0,2,14,3,PAL.tile);tri(q,0,2,14,2,7,-1,PAL.tile);rect(q,4,8,6,4,PAL.lacquer);rect(q,5,9,4,1,PAL.gold);},{solid:{x:-5,y:-2,w:10,h:2}});
 defProp('bell',14,20,(q,w,h)=>{rect(q,1,2,2,18,PAL.wood);rect(q,11,2,2,18,PAL.wood);rect(q,0,0,14,3,PAL.tile);ell(q,7,10,4,5,'#6d5f3a');rect(q,3,14,8,2,'#5b4f30');px(q,7,16,'#3d3420');},{solid:{x:-5,y:-2,w:10,h:2}});
 defProp('horsePost',8,14,(q,w,h)=>{rect(q,3,2,2,12,PAL.wood);rect(q,1,3,6,2,PAL.woodL);rect(q,2,0,4,3,PAL.thatchD);},{solid:{x:-1,y:-1,w:3,h:1}});
 defProp('mapleLeaf',4,4,(q)=>{px(q,1,1,PAL.maple);px(q,2,2,PAL.maple);},{solid:null,shadow:false});
 // nobori banners (clan colours)
 const NOBORI={sato:['#4a2a5a','#d9b24e'],iki:['#1a1a1e','#c8402a'],mori:['#2a6a3a','#f3e6d0'],chosokabe:['#8a7a2a','#1a1a1e'],shimazu:['#2a2a4a','#f0f0f0'],takeyama:['#9a2a2a','#d9b24e'],hojo:['#2a4a8a','#f3e6d0'],nagao:['#c8d0e0','#2a3a5a'],date:['#d9b24e','#1a1a1e'],matsumae:['#e8e8f0','#2a4a5a'],shrine:['#c8402a','#f3e6d0']};
 for(const k in NOBORI){const [bg,fg]=NOBORI[k];defProp('nobori_'+k,10,30,(q,w,h)=>{rect(q,1,2,1,28,PAL.wood);rect(q,0,1,8,1,PAL.wood);rect(q,2,2,7,18,bg);rect(q,3,3,5,16,shade(bg,1.08));rect(q,4,8,3,3,fg);rect(q,4,13,3,1,fg);rect(q,5,5,1,1,fg);},{solid:{x:-1,y:-1,w:3,h:1},shadow:false});}
}

/* ============================ BUILDINGS ============================ */
// Building sprite with footprint (tiles). Drawn facing south; door at bottom centre.
const BUILD={};
function roofTiles(q,x,y,w,h,col,colL,colD){rect(q,x,y,w,h,col);for(let j=0;j<h;j+=3){hline(q,x,x+w-1,y+j,colD);for(let i=((j/3)%2)*3;i<w;i+=6)px(q,x+i,y+j+1,colL);}hline(q,x,x+w-1,y,colL);}
function roofThatch(q,x,y,w,h,col,colL,colD){rect(q,x,y,w,h,col);speckle(q,x,y,w,h,colD,0.22,5);speckle(q,x,y,w,h,colL,0.12,6);for(let j=0;j<h;j+=4)hline(q,x,x+w-1,y+j,colD);hline(q,x,x+w-1,y+h-1,colD);}
function wallPlaster(q,x,y,w,h){rect(q,x,y,w,h,PAL.plaster);speckle(q,x,y,w,h,PAL.plasterD,0.06,8);rect(q,x,y+h-2,w,2,PAL.woodD);for(let i=0;i<w;i+=8)vline(q,x+i,y,y+h-1,PAL.woodD);hline(q,x,x+w-1,y,PAL.woodD);}
function wallWood(q,x,y,w,h){rect(q,x,y,w,h,PAL.wood);for(let j=0;j<h;j+=3)hline(q,x,x+w-1,y+j,PAL.woodD);speckle(q,x,y,w,h,PAL.woodL,0.05,9);}
function shoji(q,x,y,w,h,lit){rect(q,x,y,w,h,lit?'#f6e3a8':'#e8dcc0');for(let i=0;i<w;i+=3)vline(q,x+i,y,y+h-1,PAL.woodD);for(let j=0;j<h;j+=4)hline(q,x,x+w-1,y+j,PAL.woodD);}
function door(q,x,y,w,h){rect(q,x,y,w,h,'#2a2120');rect(q,x+1,y+1,w-2,h-1,'#3b2f2a');vline(q,x+Math.floor(w/2),y+1,y+h-1,'#2a2120');}
function defBuild(name,tw,th,draw,opt={}){const w=tw*TS,h=th*TS+(opt.extra||0);const [c,q]=mkCanvas(w+8,h);draw(q,w+8,h,tw,th);BUILD[name]=Object.assign({c,w:w+8,h,tw,th,ax:4,ay:h,solidTiles:opt.solidTiles||{x:0,y:1,w:tw,h:th-1},door:opt.door||{x:Math.floor(tw/2),y:th-1},kind:opt.kind||name,lit:!!opt.lit,glow:opt.glow||[]},opt);}
function buildBuildings(){
 // small farmhouse (thatched), 3x3
 for(let v=0;v<3;v++)defBuild('minka'+v,3,3,(q,w,h,tw,th)=>{const W0=w,R=Math.floor(h*0.52);const col=[PAL.thatch,'#a88f56','#c0a468'][v];
  roofThatch(q,0,0,W0,R,col,PAL.thatchL,PAL.thatchD);tri(q,0,0,W0-1,0,W0/2,-0,col);rect(q,W0/2-1,0,2,R,PAL.thatchD);
  wallPlaster(q,6,R,W0-12,h-R);door(q,W0/2-4,h-12,8,12);shoji(q,10,R+4,8,7,v===1);shoji(q,W0-18,R+4,8,7,false);rect(q,4,h-3,W0-8,3,PAL.woodD);},{extra:10,kind:'house'});
 // townhouse (tiled roof), 4x3
 for(let v=0;v<3;v++)defBuild('machiya'+v,4,3,(q,w,h)=>{const R=Math.floor(h*0.45);roofTiles(q,0,0,w,R,PAL.tile,PAL.tileL,PAL.tileD);rect(q,0,R-2,w,2,PAL.tileD);
  if(v===2)wallWood(q,4,R,w-8,h-R);else wallPlaster(q,4,R,w-8,h-R);door(q,w/2-5,h-13,10,13);shoji(q,8,R+4,12,8,v===0);shoji(q,w-20,R+4,12,8,true);
  rect(q,2,R,2,h-R,PAL.woodD);rect(q,w-4,R,2,h-R,PAL.woodD);if(v===1){rect(q,w/2-12,R-7,24,7,'#2c2a3a');rect(q,w/2-10,R-5,20,3,'#efe6d2');}},{extra:12,kind:'house',lit:true});
 // long merchant house 5x3 with noren
 defBuild('merchant',5,3,(q,w,h)=>{const R=Math.floor(h*0.42);roofTiles(q,0,0,w,R,PAL.tile,PAL.tileL,PAL.tileD);wallWood(q,4,R,w-8,h-R);rect(q,w/2-14,R+2,28,12,'#2f3b6b');for(let i=0;i<4;i++)vline(q,w/2-14+i*8,R+2,R+13,'#efe6d2');door(q,w/2-5,h-12,10,12);shoji(q,8,R+4,10,8,true);shoji(q,w-18,R+4,10,8,true);rect(q,w/2-10,h-5,4,5,PAL.vermilion);},{extra:12,kind:'shop',lit:true});
 // inn 5x4
 defBuild('inn',5,4,(q,w,h)=>{const R=Math.floor(h*0.4);roofTiles(q,0,0,w,R,PAL.tile,PAL.tileL,PAL.tileD);wallPlaster(q,4,R,w-8,h-R);for(let i=0;i<3;i++)shoji(q,8+i*24,R+4,16,10,i!==1);door(q,w/2-6,h-14,12,14);rect(q,w/2-16,R-8,32,8,PAL.lacquer);rect(q,w/2-14,R-6,28,4,'#efe6d2');rect(q,6,h-3,w-12,3,PAL.woodD);rect(q,w-14,h-18,5,10,'#f3d58a');},{extra:14,kind:'inn',lit:true});
 // shrine hall (honden) 4x3 with vermilion pillars
 defBuild('shrine',4,3,(q,w,h)=>{const R=Math.floor(h*0.46);roofTiles(q,0,2,w,R-2,'#3a3d44','#5a5e68',PAL.tileD);tri(q,0,2,w-1,2,w/2,-2,'#3a3d44');rect(q,w/2-1,0,2,R,PAL.gold);
  rect(q,6,R,w-12,h-R,'#efe6d2');for(let i=0;i<4;i++)rect(q,8+i*((w-18)/3),R,3,h-R,PAL.vermilion);rect(q,6,R,w-12,2,PAL.vermilion);door(q,w/2-6,h-11,12,11);rect(q,4,h-3,w-8,3,'#8a877f');rect(q,w/2-2,R+3,4,3,PAL.gold);},{extra:12,kind:'shrine'});
 // temple 6x4 big curved roof
 defBuild('temple',6,4,(q,w,h)=>{const R=Math.floor(h*0.48);roofTiles(q,0,6,w,R-6,'#3b3f48','#5d6270',PAL.tileD);tri(q,0,8,10,8,0,2,'#3b3f48');tri(q,w-1,8,w-11,8,w-1,2,'#3b3f48');rect(q,12,0,w-24,8,'#3b3f48');rect(q,w/2-3,0,6,3,PAL.gold);
  wallWood(q,8,R,w-16,h-R);for(let i=0;i<5;i++)rect(q,10+i*((w-22)/4),R,3,h-R,PAL.vermilion);door(q,w/2-7,h-13,14,13);rect(q,6,h-4,w-12,4,'#8a877f');shoji(q,14,R+3,12,8,true);shoji(q,w-26,R+3,12,8,true);},{extra:14,kind:'temple'});
 // pagoda 3 tiles wide, 5 tiers tall
 defBuild('pagoda',3,5,(q,w,h)=>{const tiers=5,base=h-6;rect(q,6,base,w-12,6,'#8a877f');for(let t=0;t<tiers;t++){const y=base-t*15,ww=w-4-t*4,x=(w-ww)/2;rect(q,x+4,y-12,ww-8,12,'#efe6d2');rect(q,x+4,y-12,ww-8,2,PAL.vermilion);rect(q,x+ww/2-3,y-10,6,8,'#2a2120');roofTiles(q,x,y-16,ww,5,'#3b3f48','#5d6270',PAL.tileD);tri(q,x,y-14,x+6,y-14,x,y-18,'#3b3f48');tri(q,x+ww-1,y-14,x+ww-7,y-14,x+ww-1,y-18,'#3b3f48');}rect(q,w/2-1,0,2,base-tiers*15-10,PAL.gold);px(q,w/2,0,PAL.gold);},{extra:0,kind:'pagoda',solidTiles:{x:0,y:3,w:3,h:2},door:{x:1,y:4}});
 // castle keep (tenshu) 7 wide, 8 tall
 defBuild('castle',7,8,(q,w,h)=>{const base=h;rect(q,0,base-30,w,30,'#7f7a70');for(let j=0;j<30;j+=6){hline(q,0,w-1,base-30+j,'#5d594f');for(let i=(j/6%2)*8;i<w;i+=16)vline(q,i,base-30+j,base-30+j+5,'#5d594f');}
  const tiers=[[w-16,base-30,24],[w-30,base-54,22],[w-44,base-76,20],[w-56,base-96,18]];
  tiers.forEach(([ww,yb,hh],t)=>{const x=(w-ww)/2;rect(q,x,yb-hh,ww,hh,'#efe6d2');speckle(q,x,yb-hh,ww,hh,PAL.plasterD,0.05,t);rect(q,x,yb-2,ww,2,PAL.woodD);for(let i=0;i<Math.floor(ww/14);i++)rect(q,x+6+i*14,yb-hh+6,6,7,'#2a2120');
   roofTiles(q,x-5,yb-hh-8,ww+10,8,PAL.tile,PAL.tileL,PAL.tileD);tri(q,x-5,yb-hh-6,x+2,yb-hh-6,x-5,yb-hh-12,PAL.tile);tri(q,x+ww+4,yb-hh-6,x+ww-3,yb-hh-6,x+ww+4,yb-hh-12,PAL.tile);});
  const top=tiers[3][1]-tiers[3][2]-8;tri(q,w/2-9,top,w/2+9,top,w/2,top-10,PAL.tile);px(q,w/2-2,top-10,PAL.gold);px(q,w/2+2,top-10,PAL.gold);rect(q,w/2-1,top-13,2,4,PAL.gold);
  door(q,w/2-7,base-14,14,14);rect(q,w/2-9,base-16,18,2,PAL.woodD);},{extra:20,kind:'castle',solidTiles:{x:0,y:4,w:7,h:4},door:{x:3,y:7}});
 // gatehouse (yagura gate) 5x2
 defBuild('gate',5,2,(q,w,h)=>{rect(q,0,h-14,w,14,'#7f7a70');rect(q,w/2-12,h-14,24,14,'#1c1a1e');rect(q,w/2-10,h-12,20,12,'#3b2f2a');roofTiles(q,0,h-26,w,8,PAL.tile,PAL.tileL,PAL.tileD);rect(q,4,h-20,w-8,6,'#efe6d2');rect(q,4,h-20,w-8,1,PAL.woodD);roofTiles(q,-2,h-34,w+4,8,PAL.tile,PAL.tileL,PAL.tileD);},{extra:14,kind:'gate',solidTiles:{x:0,y:0,w:5,h:2},door:{x:2,y:1},pass:{x:2,w:1}});
 // watchtower 2x2 tall
 defBuild('tower',2,2,(q,w,h)=>{rect(q,4,h-40,w-8,40,'#7f7a70');for(let j=0;j<40;j+=6)hline(q,4,w-5,h-40+j,'#5d594f');rect(q,2,h-52,w-4,12,'#efe6d2');rect(q,6,h-48,6,6,'#2a2120');roofTiles(q,0,h-60,w,8,PAL.tile,PAL.tileL,PAL.tileD);},{extra:34,kind:'tower'});
 // wall segments horizontal / vertical (1 tile)
 defBuild('wallH',1,1,(q,w,h)=>{rect(q,4,0,TS,h,'#7f7a70');hline(q,4,4+TS-1,0,'#9a958a');for(let j=0;j<h;j+=5)hline(q,4,4+TS-1,j,'#5d594f');roofTiles(q,2,0,TS+4,5,PAL.tile,PAL.tileL,PAL.tileD);},{extra:8,kind:'wall',solidTiles:{x:0,y:0,w:1,h:1}});
 defBuild('wallV',1,1,(q,w,h)=>{rect(q,6,0,TS-4,h,'#7f7a70');for(let j=0;j<h;j+=5)hline(q,6,6+TS-5,j,'#5d594f');rect(q,5,0,TS-2,3,PAL.tile);},{extra:8,kind:'wall',solidTiles:{x:0,y:0,w:1,h:1}});
 // stable 4x3
 defBuild('stable',4,3,(q,w,h)=>{const R=Math.floor(h*0.42);roofThatch(q,0,0,w,R,PAL.thatch,PAL.thatchL,PAL.thatchD);wallWood(q,4,R,w-8,h-R);rect(q,8,R+6,w-16,h-R-9,'#2a2120');for(let i=0;i<3;i++)rect(q,10+i*((w-22)/2),R+6,2,h-R-9,PAL.woodL);rect(q,w/2-8,h-8,16,2,PAL.thatchD);},{extra:10,kind:'stable'});
 // dojo 5x3
 defBuild('dojo',5,3,(q,w,h)=>{const R=Math.floor(h*0.44);roofTiles(q,0,0,w,R,'#3b3f48','#5d6270',PAL.tileD);wallWood(q,4,R,w-8,h-R);shoji(q,8,R+4,w-16,10,true);door(q,w/2-6,h-12,12,12);rect(q,w/2-10,R-6,20,6,PAL.lacquer);rect(q,w/2-8,R-4,16,2,'#efe6d2');},{extra:12,kind:'dojo',lit:true});
 // ruined house 3x3
 defBuild('ruin',3,3,(q,w,h)=>{const R=Math.floor(h*0.5);rect(q,2,R,w-4,h-R,'#8a8276');speckle(q,2,R,w-4,h-R,'#5f584e',0.2,77);roofThatch(q,0,2,w*0.6,R-2,'#6e6040','#8a7a52','#4d4330');rect(q,w/2-4,h-10,8,10,'#2a2120');},{extra:8,kind:'ruin'});
 // fortress keep (Iki) 7x7 dark
 defBuild('fortress',7,7,(q,w,h)=>{const base=h;rect(q,0,base-34,w,34,'#4a4b4f');for(let j=0;j<34;j+=6){hline(q,0,w-1,base-34+j,'#33343a');}
  const tiers=[[w-14,base-34,26],[w-30,base-60,22],[w-46,base-82,18]];tiers.forEach(([ww,yb,hh],t)=>{const x=(w-ww)/2;rect(q,x,yb-hh,ww,hh,'#2c2c33');for(let i=0;i<Math.floor(ww/14);i++)rect(q,x+6+i*14,yb-hh+6,6,7,'#f29a2f');roofTiles(q,x-5,yb-hh-8,ww+10,8,'#1f2026','#3a3b44','#101014');});
  const top=tiers[2][1]-tiers[2][2]-8;tri(q,w/2-9,top,w/2+9,top,w/2,top-10,'#1f2026');rect(q,w/2-1,top-14,2,5,'#c8402a');door(q,w/2-7,base-14,14,14);},{extra:16,kind:'fortress',solidTiles:{x:0,y:3,w:7,h:4},door:{x:3,y:6}});
}

/* ============================ CHARACTER SPRITES (overworld) ============================ */
// 16x24 paper-doll. dir: 0 down,1 up,2 left,3 right(mirror of left). frame 0..3 walk. extra poses: 'kneel','fall','attack'
const SPRITE_CACHE=new Map();
function charKey(c){return [c.skin,c.hair,c.hairStyle,c.hat,c.hatCol,c.body,c.bodyCol,c.trim,c.weapon,c.armor,c.cape,c.capeCol,c.female?1:0,c.big?1:0].join('|');}
function charSheet(c){const key=charKey(c);let sh=SPRITE_CACHE.get(key);if(sh)return sh;
 const FW=18,FH=26,dirs=3,frames=6;const [cv,q]=mkCanvas(FW*frames,FH*dirs);
 for(let d=0;d<dirs;d++)for(let f=0;f<frames;f++)drawChar(q,f*FW,d*FH,c,d,f);
 sh={c:cv,fw:FW,fh:FH};SPRITE_CACHE.set(key,sh);return sh;}
function drawChar(q,ox,oy,c,dir,frame){ // frame 0-3 walk cycle, 4 = kneel, 5 = fallen
 const skin=c.skin||PAL.skin[1],skinD=shade(skin,0.78),hair=c.hair||PAL.hair[0],body=c.bodyCol||'#3a4a6a',bodyD=shade(body,0.72),bodyL=shade(body,1.18),trim=c.trim||'#e8dcc0';
 const cx=ox+9,legA=frame<4?[0,1,0,-1][frame]:0,bob=frame<4?[0,-1,0,-1][frame]:0,fallen=frame===5,kneel=frame===4;
 const base=oy+25;
 if(fallen){ // lying on the ground facing down
  rect(q,ox+2,base-7,13,5,body);rect(q,ox+2,base-6,13,1,bodyD);ell(q,ox+15,base-5,3,3,skin);rect(q,ox+13,base-8,5,3,hair);rect(q,ox+1,base-3,4,2,skinD);rect(q,ox+3,base-9,3,2,skin);return;}
 if(kneel){const by=base-2;rect(q,cx-4,by-6,8,6,body);rect(q,cx-4,by-1,8,1,bodyD);rect(q,cx-5,by-11,10,6,body);rect(q,cx-3,by-17,6,6,skin);rect(q,cx-3,by-18,6,3,hair);rect(q,cx-2,by-14,1,1,'#222');rect(q,cx+1,by-14,1,1,'#222');return;}
 const facing=dir;// 0 down 1 up 2 left
 const hy=base-23+bob;
 // shadow handled by renderer. legs
 const legCol=c.legs||bodyD;
 if(facing===2){rect(q,cx-3+legA,base-7,3,7,legCol);rect(q,cx-legA,base-7,3,7,legCol);rect(q,cx-3+legA,base-1,3,1,PAL.lacquer);rect(q,cx-legA,base-1,3,1,PAL.lacquer);}
 else{rect(q,cx-4,base-7+ (legA>0?1:0),3,7-(legA>0?1:0),legCol);rect(q,cx+1,base-7+(legA<0?1:0),3,7-(legA<0?1:0),legCol);rect(q,cx-4,base-1,3,1,PAL.lacquer);rect(q,cx+1,base-1,3,1,PAL.lacquer);}
 // torso (kimono / armour)
 const ty=base-15+bob;rect(q,cx-5,ty,10,9,body);rect(q,cx-5,ty+8,10,1,bodyD);
 if(c.armor){rect(q,cx-5,ty+1,10,5,c.armorCol||'#4a4a52');for(let k=0;k<3;k++)hline(q,cx-4,cx+3,ty+1+k*2,shade(c.armorCol||'#4a4a52',0.7));rect(q,cx-6,ty,2,4,c.armorCol||'#4a4a52');rect(q,cx+4,ty,2,4,c.armorCol||'#4a4a52');}
 else if(facing!==1){line(q,cx-3,ty,cx,ty+4,trim);line(q,cx+2,ty,cx,ty+4,trim);rect(q,cx-5,ty+5,10,1,c.obi||'#2b2130');}
 if(c.cape&&facing!==0){rect(q,cx-6,ty-1,12,10,c.capeCol||'#5a1a24');}
 // arms
 if(facing===2){rect(q,cx-2,ty+1,2,6,body);rect(q,cx-2,ty+7,2,2,skin);}
 else{rect(q,cx-7,ty+1,2,6,body);rect(q,cx+5,ty+1,2,6,body);rect(q,cx-7,ty+7,2,2,skin);rect(q,cx+5,ty+7,2,2,skin);}
 // head
 const hx=cx-3;rect(q,hx,hy,7,8,skin);rect(q,hx,hy+7,7,1,skinD);
 if(facing===0){rect(q,hx+1,hy+3,1,2,'#1a1416');rect(q,hx+5,hy+3,1,2,'#1a1416');if(c.beard)rect(q,hx+1,hy+6,5,2,hair);}
 else if(facing===2){rect(q,hx+1,hy+3,1,2,'#1a1416');}
 // hair / headwear
 const hs=c.hairStyle||'short';
 if(facing===1)rect(q,hx,hy,7,6,hair);
 else if(hs==='short'||hs==='topknot'){rect(q,hx,hy-1,7,3,hair);rect(q,hx,hy+2,1,3,hair);rect(q,hx+6,hy+2,1,3,hair);if(hs==='topknot')rect(q,hx+2,hy-3,3,3,hair);}
 else if(hs==='long'){rect(q,hx-1,hy-1,9,3,hair);rect(q,hx-1,hy+2,2,8,hair);rect(q,hx+6,hy+2,2,8,hair);}
 else if(hs==='bald'){}
 else if(hs==='bun'){rect(q,hx,hy-1,7,3,hair);rect(q,hx+2,hy-3,3,2,hair);}
 const hat=c.hat;
 if(hat==='kasa'){tri(q,hx-4,hy+1,hx+11,hy+1,hx+3,hy-5,'#c9a66e');hline(q,hx-4,hx+10,hy+1,'#8a6a40');}
 else if(hat==='jingasa'){tri(q,hx-3,hy+1,hx+10,hy+1,hx+3,hy-3,'#3a3b40');hline(q,hx-3,hx+9,hy+1,'#1e1f22');}
 else if(hat==='kabuto'){rect(q,hx-1,hy-2,9,5,c.hatCol||'#2a2e36');rect(q,hx-2,hy+3,11,2,shade(c.hatCol||'#2a2e36',0.7));rect(q,hx+2,hy-4,3,2,PAL.gold);line(q,hx,hy-2,hx-2,hy-5,PAL.gold);line(q,hx+6,hy-2,hx+8,hy-5,PAL.gold);}
 else if(hat==='hood'){rect(q,hx-1,hy-2,9,7,c.hatCol||'#2a2622');rect(q,hx+1,hy+2,5,4,skin);if(facing===0){rect(q,hx+2,hy+3,1,1,'#1a1416');rect(q,hx+4,hy+3,1,1,'#1a1416');}}
 else if(hat==='band'){rect(q,hx-1,hy+1,9,2,c.hatCol||'#efe6d2');}
 else if(hat==='eboshi'){rect(q,hx+1,hy-6,5,6,'#111014');}
 else if(hat==='oni'){rect(q,hx,hy,7,8,'#b8242a');rect(q,hx+1,hy+3,2,1,'#ffd27a');rect(q,hx+4,hy+3,2,1,'#ffd27a');line(q,hx+1,hy-1,hx,hy-4,'#efe6d2');line(q,hx+5,hy-1,hx+6,hy-4,'#efe6d2');}
 else if(hat==='crown'){rect(q,hx,hy-2,7,2,PAL.gold);px(q,hx+1,hy-3,PAL.gold);px(q,hx+3,hy-4,PAL.gold);px(q,hx+5,hy-3,PAL.gold);}
 else if(hat==='tengai'){rect(q,hx-1,hy-3,9,10,'#c9a66e');for(let j=0;j<10;j+=2)hline(q,hx-1,hx+7,hy-3+j,'#a98756');}
 else if(hat==='fur'){rect(q,hx-1,hy-3,9,5,'#5a4a3a');speckle(q,hx-1,hy-3,9,5,'#7a6a5a',0.3,3);}
 else if(hat==='mask'){rect(q,hx,hy+4,7,4,c.hatCol||'#1a1a1e');}
 else if(hat==='headcloth'){rect(q,hx-1,hy-2,9,4,c.hatCol||'#4a5a8a');}
 // weapon on back / in hand (small)
 if(c.weapon&&!fallen){const wc=c.weaponCol||'#d8dde6';if(facing===1){line(q,cx+3,ty-2,cx-4,ty+8,wc);}else if(c.weapon==='yari'||c.weapon==='naginata'){vline(q,cx+7,ty-9,ty+9,PAL.wood);px(q,cx+7,ty-10,wc);}else{line(q,cx-6,ty-4,cx+2,ty+2,wc);px(q,cx+2,ty+2,PAL.lacquer);}}
}
// horse sprite (facing left/down/up) with optional rider
function horseSheet(col){const key='horse|'+col;let sh=SPRITE_CACHE.get(key);if(sh)return sh;const FW=30,FH=28;const [cv,q]=mkCanvas(FW*4,FH*3);
 for(let d=0;d<3;d++)for(let f=0;f<4;f++){const ox=f*FW,oy=d*FH,base=oy+27,leg=[0,2,0,-2][f];
  if(d===2){ // side
   rect(q,ox+5,base-14,18,8,col);rect(q,ox+5,base-7,18,1,shade(col,0.7));rect(q,ox+20,base-19,6,8,col);rect(q,ox+23,base-21,5,5,col);rect(q,ox+27,base-19,2,2,shade(col,0.7));px(q,ox+25,base-20,'#111');
   rect(q,ox+19,base-21,2,5,shade(col,0.6));rect(q,ox+3,base-13,2,6,shade(col,0.6));
   rect(q,ox+6+leg,base-6,3,6,shade(col,0.85));rect(q,ox+11-leg,base-6,3,6,shade(col,0.85));rect(q,ox+16+leg,base-6,3,6,shade(col,0.85));rect(q,ox+21-leg,base-6,3,6,shade(col,0.85));
   rect(q,ox+9,base-15,8,2,'#6b3a2a');}
  else{ // down / up
   rect(q,ox+9,base-16,12,10,col);rect(q,ox+9,base-7,12,1,shade(col,0.7));rect(q,ox+11,d===0?base-22:base-20,8,7,col);if(d===0){px(q,ox+12,base-19,'#111');px(q,ox+17,base-19,'#111');rect(q,ox+13,base-16,4,2,shade(col,0.7));}
   rect(q,ox+10,base-6,3,6,shade(col,0.85));rect(q,ox+17,base-6,3,6,shade(col,0.85));rect(q,ox+10+leg,base-4,3,4,shade(col,0.85));rect(q,ox+17-leg,base-4,3,4,shade(col,0.85));rect(q,ox+12,base-23,6,2,shade(col,0.6));}}
 sh={c:cv,fw:FW,fh:FH};SPRITE_CACHE.set(key,sh);return sh;}

/* ============================ UI BITS ============================ */
function panel9(q,x,y,w,h,style){ // ink-paper frame
 q.fillStyle=style==='dark'?'rgba(12,10,12,.92)':style==='paper'?'#ece0c8':'rgba(14,10,10,.86)';q.fillRect(x,y,w,h);
 q.strokeStyle=style==='paper'?'#3a2416':'#b8935a';q.lineWidth=1;q.strokeRect(x+0.5,y+0.5,w-1,h-1);
 q.strokeStyle=style==='paper'?'rgba(58,36,22,.35)':'rgba(184,147,90,.35)';q.strokeRect(x+2.5,y+2.5,w-5,h-5);
 q.fillStyle='#b8242a';q.fillRect(x,y,3,h);}
function buildArt(){buildTiles();buildProps();buildBuildings();}
