'use strict';
/* ============================================================================
   影ノ誓・弐  KAGE NO CHIKAI 2 — core: canvases, scaling, RNG, input, save.
   Two drawing contexts share the same logical coordinate system:
     G  — the pixel world canvas (integer-scaled, nearest-neighbour)
     X  — the crisp overlay canvas for text/UI (drawn at device resolution)
   ========================================================================== */
const cvG=document.getElementById('g'),cvX=document.getElementById('x');
let G=cvG.getContext('2d',{alpha:false});const X=cvX.getContext('2d');
let W=0,H=0,SC=1,DPR=1,CSSW=0,CSSH=0;           // W,H = logical size; SC = integer pixel scale
function resize(){DPR=Math.min(window.devicePixelRatio||1,3);CSSW=innerWidth;CSSH=innerHeight;
 const pw=Math.round(CSSW*DPR),ph=Math.round(CSSH*DPR);const target=(typeof S!=='undefined'&&S&&S.set&&S.set.pix==='large')?225:270;SC=Math.max(1,Math.round(ph/target));
 W=Math.ceil(pw/SC);H=Math.ceil(ph/SC);
 cvG.width=W;cvG.height=H;cvG.style.width=CSSW+'px';cvG.style.height=CSSH+'px';
 cvX.width=pw;cvX.height=ph;cvX.style.width=CSSW+'px';cvX.style.height=CSSH+'px';
 G.imageSmoothingEnabled=false;X.setTransform(SC,0,0,SC,0,0);X.imageSmoothingEnabled=false;if(window.onResized)try{onResized();}catch(e){}}
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,dist=(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay),sign=v=>v<0?-1:v>0?1:0;
const ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2,easeOut=t=>1-(1-t)*(1-t);
/* ---------- seeded RNG (mulberry32) ---------- */
function RNG(seed){let s=seed>>>0;const f=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 f.int=(a,b)=>a+Math.floor(f()*(b-a+1));f.pick=a=>a[Math.floor(f()*a.length)];f.range=(a,b)=>a+f()*(b-a);f.chance=p=>f()<p;return f;}
const hash2=(x,y,s=0)=>{let h=(x*374761393+y*668265263+s*1442695041)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
/* ---------- value noise ---------- */
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return lerp(lerp(a,b,u),lerp(c,d,u),v);}
function fbm(x,y,s,oct=4){let v=0,a=0.5,f=1,n=0;for(let i=0;i<oct;i++){v+=vnoise(x*f,y*f,s+i*7)*a;n+=a;a*=0.5;f*=2;}return v/n;}
/* ---------- fonts ---------- */
const FJ="'KageSerif','Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','Noto Serif CJK JP',serif";
const font=(px,b)=>(b?'bold ':'')+px+'px '+FJ;
const FP="'PixelJP','KageSerif',monospace";
/* ---------- haptics / sound helpers ---------- */
const hap=(n,m)=>{try{HAP.play(n,m)}catch(e){}};
/* ---------- settings + save ---------- */
const SAVE_KEY='kage2_save_v1';
function freshSave(){return{v:1,px:0,py:0,hp:100,level:1,xp:0,coins:0,inv:[],eq:{weapon:null,helm:null,body:null,charm:null},horse:false,mounted:false,
 flags:{},quest:0,questStep:0,pinned:true,dead:{},kills:0,wps:{},visited:{},part:1,ending:null,play:0,eclipseT:0,eclipses:0,seen:{},diff:'normal',
 set:{hap:2,vol:0.9,mus:0.8,ring:1,slow:1,fx:'auto',gore:1,stickSide:'left'},tot:{parries:0,perfect:0,dodges:0,wins:0,counters:0,exec:0},created:Date.now()};}
let S=null;try{S=JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){}
const HAS_SAVE=!!(S&&S.v===1);
const WORLD_VERSION=1;
if(!HAS_SAVE)S=freshSave();else{const d=freshSave();S.set=Object.assign(d.set,S.set||{});S.tot=Object.assign(d.tot,S.tot||{});for(const k in d)if(S[k]===undefined)S[k]=d[k];if(S.wv!==WORLD_VERSION){S.px=0;S.py=0;S.mounted=false;}}
S.wv=WORLD_VERSION;
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function wipeSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}S=freshSave();}
try{HAP.set({on:S.set.hap>0,strength:[0,0.6,1,1.4][S.set.hap]||1});if(window.setQuality)setQuality(S.set.fx||'auto');}catch(e){}
/* ---------- input: pointers, floating stick, buttons, swipes ---------- */
const IN={stick:{active:false,id:-1,ox:0,oy:0,x:0,y:0,dx:0,dy:0,mag:0},btns:{},taps:[],swipes:[],ptr:{},hold:{},anyDown:false,lastTap:0,keys:{}};
const BTN_DEFS=[];                       // filled by ui: {id,x,y,r,label,icon,visible:fn,down:fn,up:fn}
function toLogical(e){return{x:e.clientX*DPR/SC,y:e.clientY*DPR/SC};}
function btnAt(p){for(let i=BTN_DEFS.length-1;i>=0;i--){const b=BTN_DEFS[i];if(b.visible&&!b.visible())continue;if((p.x-b.x)**2+(p.y-b.y)**2<=(b.r*1.2)**2)return b;}return null;}
let inputMode='world';                   // 'world' | 'duel' | 'ui' — decides how pointers are interpreted
cvX.addEventListener('pointerdown',e=>{e.preventDefault();try{audioInit();}catch(x){}
 const p=toLogical(e);IN.anyDown=true;const q={id:e.pointerId,x0:p.x,y0:p.y,x:p.x,y:p.y,t0:performance.now(),btn:null,fired:false,stick:false};IN.ptr[e.pointerId]=q;
 const b=btnAt(p);if(b){q.btn=b;b.held=true;IN.hold[b.id]=true;if(b.down)b.down(p);return;}
 if(inputMode==='world'){const left=S.set.stickSide==='left'?p.x<W*0.5:p.x>W*0.5;if(left&&!IN.stick.active){IN.stick.active=true;IN.stick.id=e.pointerId;IN.stick.ox=p.x;IN.stick.oy=p.y;IN.stick.x=p.x;IN.stick.y=p.y;IN.stick.dx=0;IN.stick.dy=0;IN.stick.mag=0;q.stick=true;return;}}
},{passive:false});
cvX.addEventListener('pointermove',e=>{const q=IN.ptr[e.pointerId];if(!q)return;const p=toLogical(e);q.x=p.x;q.y=p.y;
 if(q.stick){const dx=p.x-IN.stick.ox,dy=p.y-IN.stick.oy,d=Math.hypot(dx,dy),R=34;const m=Math.min(1,d/R);IN.stick.x=p.x;IN.stick.y=p.y;IN.stick.dx=d>0?dx/d*m:0;IN.stick.dy=d>0?dy/d*m:0;IN.stick.mag=m;
  if(d>R){IN.stick.ox=p.x-dx/d*R;IN.stick.oy=p.y-dy/d*R;}return;}
 if(q.btn)return;
 if(inputMode==='duel'&&!q.fired){const dx=p.x-q.x0,dy=p.y-q.y0;if(Math.hypot(dx,dy)>22){q.fired=true;IN.swipes.push({dx,dy});}}
});
function pointerUp(e){const q=IN.ptr[e.pointerId];delete IN.ptr[e.pointerId];IN.anyDown=Object.keys(IN.ptr).length>0;if(!q)return;const p=toLogical(e);
 if(q.stick){IN.stick.active=false;IN.stick.id=-1;IN.stick.dx=0;IN.stick.dy=0;IN.stick.mag=0;return;}
 if(q.btn){q.btn.held=Object.values(IN.ptr).some(o=>o.btn===q.btn);IN.hold[q.btn.id]=q.btn.held;if(q.btn.up)q.btn.up(p);return;}
 const dx=p.x-q.x0,dy=p.y-q.y0,len=Math.hypot(dx,dy);
 if(inputMode==='duel'){if(!q.fired&&len>12)IN.swipes.push({dx,dy});else if(len<10)IN.taps.push(p);return;}
 if(len<10&&performance.now()-q.t0<600)IN.taps.push(p);}
cvX.addEventListener('pointerup',pointerUp);cvX.addEventListener('pointercancel',pointerUp);
addEventListener('keydown',e=>{IN.keys[e.key.toLowerCase()]=true;if(e.key==='Escape')IN.taps.push({x:-1,y:-1,esc:true});});addEventListener('keyup',e=>{IN.keys[e.key.toLowerCase()]=false;});
function keyStick(){const k=IN.keys;let dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);const m=Math.hypot(dx,dy);if(m>0){dx/=m;dy/=m;}return{dx,dy,mag:m>0?1:0};}
function consumeTaps(){const t=IN.taps;IN.taps=[];return t;}
function consumeSwipes(){const s=IN.swipes;IN.swipes=[];return s;}
/* ---------- direction helpers for the duel (8 swipe directions, screen space) ---------- */
const DV=[...Array(8)].map((_,i)=>[Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)]);
const dirOf=(dx,dy)=>((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;
/* ---------- time ---------- */
let T=0;                                  // global time (s), real
const SCENE={cur:'boot',t:0};
function goScene(s){SCENE.cur=s;SCENE.t=0;BTN_DEFS.length=0;IN.taps=[];IN.swipes=[];inputMode=s==='duel'?'duel':s==='world'?'world':'ui';}
addEventListener('resize',resize);resize();
