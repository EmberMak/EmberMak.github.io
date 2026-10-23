'use strict';
/* ============================================================================
   PIX — procedural 32×32 pixel-art bust portraits for dialogue scenes.
   A portrait is described by a small parameter object (skin, hair style/colour,
   eyes, brows, mouth, beard, headwear, clothing, marks…) and a mood. Features are
   painted into a colour grid in layers, outlined, then cached on an offscreen
   canvas and drawn with nearest-neighbour scaling so pixels stay crisp.
   ========================================================================== */
const PIX=(()=>{
 const SZ=32;
 /* ---------- colour helpers ---------- */
 const hex=c=>{c=c.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];};
 const rgb=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
 const shade=(c,k)=>{const [r,g,b]=hex(c);return rgb(r*k,g*k,b*k);};
 const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return rgb(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);};
 /* ---------- grid ---------- */
 class Grid{
  constructor(){this.d=new Array(SZ*SZ).fill(null);}
  set(x,y,c){x|=0;y|=0;if(x<0||y<0||x>=SZ||y>=SZ||!c)return;this.d[y*SZ+x]=c;}
  get(x,y){if(x<0||y<0||x>=SZ||y>=SZ)return null;return this.d[y*SZ+x];}
  rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c);}
  hl(x0,x1,y,c){for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)this.set(x,y,c);}
  vl(x,y0,y1,c){for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)this.set(x,y,c);}
  line(x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)this.set(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c);}
  ell(cx,cy,rx,ry,c){for(let y=Math.ceil(cy-ry);y<=Math.floor(cy+ry);y++){const t=(y-cy)/ry,w=rx*Math.sqrt(Math.max(0,1-t*t));for(let x=Math.ceil(cx-w);x<=Math.floor(cx+w);x++)this.set(x,y,c);}}
  tri(x0,y0,x1,y1,x2,y2,c){ // filled triangle via scanline
   const ys=[y0,y1,y2],miny=Math.min(...ys),maxy=Math.max(...ys);
   for(let y=miny;y<=maxy;y++){const xs=[];const e=(ax,ay,bx,by)=>{if((y>=ay&&y<=by)||(y>=by&&y<=ay)){if(ay===by){xs.push(ax,bx);}else xs.push(ax+(bx-ax)*(y-ay)/(by-ay));}};e(x0,y0,x1,y1);e(x1,y1,x2,y2);e(x2,y2,x0,y0);if(xs.length){this.hl(Math.round(Math.min(...xs)),Math.round(Math.max(...xs)),y,c);}}}
  each(fn){for(let y=0;y<SZ;y++)for(let x=0;x<SZ;x++){const c=this.d[y*SZ+x];if(c)fn(x,y,c);}}
  outline(col){const add=[];for(let y=0;y<SZ;y++)for(let x=0;x<SZ;x++){if(this.d[y*SZ+x])continue;if(this.get(x-1,y)||this.get(x+1,y)||this.get(x,y-1)||this.get(x,y+1))add.push([x,y]);}add.forEach(([x,y])=>this.set(x,y,col));}
  dither(x,y,w,h,c,ph=0){for(let j=0;j<h;j++)for(let i=0;i<w;i++)if((i+j+ph)%2===0)this.set(x+i,y+j,c);}
 }
 /* ---------- moods ---------- */
 const MOOD={
  neutral:{eye:'open',brow:0,mouth:'flat'},
  calm:{eye:'half',brow:0,mouth:'flat'},
  angry:{eye:'open',brow:-1,mouth:'frown'},
  grim:{eye:'half',brow:-1,mouth:'flat'},
  shout:{eye:'wide',brow:-1,mouth:'shout'},
  smile:{eye:'half',brow:0,mouth:'smile'},
  smirk:{eye:'half',brow:0,mouth:'smirk'},
  sad:{eye:'open',brow:1,mouth:'frown'},
  pain:{eye:'squint',brow:-1,mouth:'grit'},
  surprised:{eye:'wide',brow:2,mouth:'o'},
  dead:{eye:'closed',brow:0,mouth:'flat'},
  laugh:{eye:'closed',brow:0,mouth:'laugh'},
  sly:{eye:'half',brow:-1,mouth:'smirk'},
  warm:{eye:'open',brow:0,mouth:'smile'},
 };
 /* ---------- painting ---------- */
 function paint(p,moodName){
  const g=new Grid(),m=Object.assign({},MOOD[moodName]||MOOD.neutral,p.moodOverride||{});
  const skin=p.skin||'#e6c3a0',skinS=shade(skin,0.76),skinD=shade(skin,0.58),skinH=mix(skin,'#ffffff',0.18);
  const hair=p.hair||'#1b1718',hairH=mix(hair,'#ffffff',0.16),hairS=shade(hair,0.7);
  const cloth=p.cloth||'#2a2226',clothS=shade(cloth,0.7),clothH=mix(cloth,'#ffffff',0.12);
  const eyeC=p.eye||'#2b2a30',eyeW=p.eyeWhite||'#efe9df',lip=p.lip||shade(skin,0.62);
  const cx=16,shape=p.face||'oval';
  const rx=shape==='round'?7:shape==='wide'?7:shape==='long'?6:6, ry=shape==='long'?10:shape==='round'?8:9, cy=14;
  const top=cy-ry,chin=cy+ry,old=p.age==='old',scale=p.big||1;
  /* back hair */
  const hs=p.hairStyle||'short';
  if(!p.bald&&!p.helm){
   if(hs==='long'||hs==='wild'||hs==='kunoichi'){g.rect(cx-rx-2,top+3,rx*2+5,chin-top+4,hairS);if(hs==='wild')for(let i=0;i<7;i++)g.vl(cx-rx-3+i*2+(i%2),top+1+(i%3),top+4,hairS);}
   if(hs==='ponytail'){g.rect(cx-2,chin-2,5,8,hairS);g.rect(cx-1,chin+6,3,3,hairS);}
   if(hs==='bob'){g.rect(cx-rx-2,top+2,rx*2+5,ry+8,hairS);}
  }
  /* clothing / shoulders */
  const ct=p.collar||'kimono';
  g.rect(2,25,28,7,cloth);
  if(ct==='kimono'){g.tri(cx-9,25,cx,31,cx-1,25,clothH);g.tri(cx+9,25,cx,31,cx+1,25,clothS);g.line(cx-7,25,cx,31,p.collar2||'#efe6d2');g.line(cx+7,25,cx+1,31,p.collar2||'#efe6d2');}
  else if(ct==='armor'){g.rect(2,25,28,7,p.armor||'#3a3a40');for(let y=26;y<32;y+=2)g.hl(2,29,y,shade(p.armor||'#3a3a40',0.75));g.rect(cx-5,25,11,7,cloth);g.rect(3,24,7,3,p.armor||'#3a3a40');g.rect(22,24,7,3,p.armor||'#3a3a40');for(let x=4;x<28;x+=3)g.set(x,27,p.lace||'#b8242a');}
  else if(ct==='robe'){g.rect(2,25,28,7,cloth);g.rect(cx-6,25,12,7,clothH);g.vl(cx-6,25,31,clothS);g.vl(cx+5,25,31,clothS);}
  else if(ct==='rags'){g.rect(2,25,28,7,cloth);g.dither(2,25,28,7,clothS,1);g.rect(cx-3,25,6,7,clothS);}
  else if(ct==='coat'){g.rect(2,25,28,7,cloth);g.rect(cx-1,25,2,7,clothS);g.rect(cx-8,25,2,4,clothH);g.rect(cx+6,25,2,4,clothH);if(p.trim){g.hl(cx-9,cx+9,25,p.trim);}}
  else if(ct==='plate'){g.rect(2,25,28,7,p.armor||'#6a7074');g.hl(2,29,27,shade(p.armor||'#6a7074',0.7));g.hl(2,29,30,shade(p.armor||'#6a7074',0.7));g.rect(cx-4,25,9,7,cloth);g.rect(2,24,8,2,shade(p.armor||'#6a7074',1.15));g.rect(22,24,8,2,shade(p.armor||'#6a7074',1.15));}
  else if(ct==='none'){g.rect(2,25,28,7,skinS);}
  /* neck */
  g.rect(cx-3,chin-3,7,5,skin);g.rect(cx-3,chin-3,2,5,skinS);g.hl(cx-3,cx+3,chin+1,skinS);
  /* head */
  if(shape==='square'){g.rect(cx-rx,top+2,rx*2+1,ry*2-3,skin);g.ell(cx,top+3,rx,3,skin);g.ell(cx,chin-3,rx-1,3,skin);}
  else g.ell(cx,cy,rx,ry,skin);
  if(p.jaw==='heavy'){g.rect(cx-rx+1,cy+3,rx*2-1,ry-3,skin);g.ell(cx,chin-2,rx-1,3,skin);}
  // ears
  g.rect(cx-rx-1,cy-1,2,3,skin);g.rect(cx+rx,cy-1,2,3,skin);g.set(cx-rx-1,cy,skinS);g.set(cx+rx+1,cy,skinS);
  // shading (light from upper right)
  for(let y=top+1;y<=chin;y++){const t=(y-cy)/ry,w=rx*Math.sqrt(Math.max(0,1-t*t));g.set(Math.ceil(cx-w),y,skinS);if(y>cy+2)g.set(Math.ceil(cx-w)+1,y,skinS);}
  g.hl(cx-2,cx+2,chin,skinS);g.hl(cx-1,cx+1,chin-1,skinS);
  if(old){g.set(cx-4,cy+4,skinS);g.set(cx+4,cy+4,skinS);g.hl(cx-5,cx-4,cy+6,skinS);g.hl(cx+4,cx+5,cy+6,skinS);g.set(cx-2,cy-1,skinS);g.set(cx+2,cy-1,skinS);}
  if(p.gaunt){g.vl(cx-4,cy+2,cy+5,skinS);g.vl(cx+4,cy+2,cy+5,skinS);}
  if(p.blush){g.set(cx-4,cy+2,mix(skin,'#ff6a6a',0.35));g.set(cx+4,cy+2,mix(skin,'#ff6a6a',0.35));}
  /* eyes */
  const ey=cy,ex=[cx-4,cx+4];
  const eyeStyle=p.eyeStyle||'normal';
  ex.forEach((x,i)=>{
   if(m.eye==='closed'){g.hl(x-1,x+1,ey,skinD);if(m.mouth==='laugh'){g.set(x-1,ey-1,skinD);g.set(x+1,ey-1,skinD);g.set(x,ey,skin);}return;}
   if(m.eye==='squint'){g.hl(x-1,x+1,ey,skinD);g.set(x+(i?1:-1),ey-1,skinD);g.set(x-(i?1:-1),ey+1,skinD);return;}
   const h=m.eye==='wide'?3:m.eye==='half'?1:2,y0=m.eye==='wide'?ey-1:ey;
   if(p.glowEyes){g.rect(x-1,y0,3,h,p.glowEyes);g.set(x,y0,mix(p.glowEyes,'#fff',0.5));return;}
   g.rect(x-1,y0,3,h,eyeW);g.rect(x+(i?0:-1)+(eyeStyle==='sharp'?(i?0:1):0),y0,h===1?2:2,h,eyeC);
   if(h>=2)g.set(x+(i?1:-1),y0,mix(eyeC,'#fff',0.55));
   if(m.eye==='half'){g.hl(x-1,x+1,ey-1,skinD);}
   if(eyeStyle==='sharp'){g.set(x+(i?2:-2),y0,skinD);}
   if(p.shadowEyes){g.hl(x-1,x+1,y0+h,skinS);}
  });
  /* brows */
  const by=cy-2-(m.brow===2?1:0),bc=p.browColor||hairS;
  ex.forEach((x,i)=>{const d=i?-1:1;// inner side direction
   if(m.brow===-1){g.hl(x-1,x+1,by,bc);g.set(x+d,by+1,bc);g.set(x-d,by-1,bc);}
   else if(m.brow===1){g.hl(x-1,x+1,by,bc);g.set(x+d,by-1,bc);g.set(x-d,by+1,bc);}
   else g.hl(x-1,x+1,by,bc);
   if(p.thickBrow)g.hl(x-1,x+1,by-1,bc);});
  /* nose */
  g.set(cx,cy+2,skinS);g.set(cx,cy+3,skinS);g.set(cx+1,cy+3,skinD);g.set(cx-1,cy+3,skinS);
  /* mouth */
  const my=cy+6;
  const mo=m.mouth;
  if(mo==='flat'){g.hl(cx-2,cx+2,my,lip);}
  else if(mo==='smile'){g.hl(cx-2,cx+2,my,lip);g.set(cx-3,my-1,lip);g.set(cx+3,my-1,lip);}
  else if(mo==='smirk'){g.hl(cx-2,cx+2,my,lip);g.set(cx+3,my-1,lip);}
  else if(mo==='frown'){g.hl(cx-2,cx+2,my,lip);g.set(cx-3,my+1,lip);g.set(cx+3,my+1,lip);}
  else if(mo==='o'){g.rect(cx-1,my-1,3,3,skinD);g.set(cx,my,'#3a1a1a');}
  else if(mo==='shout'){g.rect(cx-3,my-1,7,4,'#3a1216');g.hl(cx-2,cx+2,my-1,'#f1ebe0');g.hl(cx-2,cx+2,my+2,skinD);}
  else if(mo==='grit'){g.rect(cx-3,my-1,7,2,'#3a1216');g.hl(cx-2,cx+2,my-1,'#efe8dc');for(let x=cx-2;x<=cx+2;x+=2)g.set(x,my,'#efe8dc');}
  else if(mo==='laugh'){g.rect(cx-3,my-1,7,3,'#3a1216');g.hl(cx-2,cx+2,my-1,'#f1ebe0');g.set(cx-4,my-1,lip);g.set(cx+4,my-1,lip);}
  /* facial hair */
  if(p.beard){const bcl=p.beardColor||hair;
   if(p.beard==='stubble'){g.dither(cx-5,cy+4,11,5,skinD);}
   if(p.beard==='goatee'){g.rect(cx-2,my+1,5,3,bcl);g.rect(cx-1,chin-1,3,3,bcl);}
   if(p.beard==='full'){g.rect(cx-6,cy+3,2,6,bcl);g.rect(cx+5,cy+3,2,6,bcl);g.rect(cx-5,my+1,11,2,bcl);g.rect(cx-4,my+3,9,3,bcl);g.rect(cx-2,chin+1,5,2,bcl);g.hl(cx-2,cx+2,my,lip);}
   if(p.beard==='long'){g.rect(cx-6,cy+3,2,7,bcl);g.rect(cx+5,cy+3,2,7,bcl);g.rect(cx-5,my+1,11,3,bcl);g.rect(cx-4,my+4,9,4,bcl);g.rect(cx-3,chin+3,7,3,bcl);g.rect(cx-2,chin+6,5,2,bcl);g.hl(cx-2,cx+2,my,lip);g.vl(cx,my+3,chin+4,shade(bcl,0.8));}
   if(p.moustache){g.hl(cx-3,cx+3,my-1,bcl);g.set(cx-4,my,bcl);g.set(cx+4,my,bcl);}
  } else if(p.moustache){const bcl=p.beardColor||hair;g.hl(cx-3,cx+3,my-1,bcl);g.set(cx-4,my,bcl);g.set(cx+4,my,bcl);}
  /* marks */
  if(p.scar==='cheek'){g.line(cx+3,cy-1,cx+5,cy+4,'#8a4a4a');}
  if(p.scar==='eye'){g.line(cx-5,cy-4,cx-3,cy+3,'#8a4a4a');}
  if(p.scar==='brow'){g.line(cx+2,cy-4,cx+6,cy-3,'#8a4a4a');}
  if(p.scar==='lip'){g.vl(cx+2,my-2,my+1,'#8a4a4a');}
  if(p.patch){g.rect(cx+2,cy-1,5,3,'#120e0f');g.line(cx-rx,cy-3,cx+7,cy-2,'#120e0f');}
  if(p.paint){g.hl(cx-6,cx-2,cy+1,p.paint);g.hl(cx+2,cx+6,cy+1,p.paint);}
  if(p.tattoo){g.line(cx-6,cy+3,cx-4,cy+7,p.tattoo);g.line(cx-6,cy+5,cx-4,cy+8,p.tattoo);}
  /* front hair */
  const hl=top+2;// hairline
  if(!p.bald&&!p.helm){
   if(hs==='short'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-1,top+1,2,6,hair);g.rect(cx+rx,top+1,2,6,hair);g.hl(cx-rx+1,cx-1,top+5,hair);g.hl(cx-3,cx+rx-1,top+4,hair);g.set(cx-rx+2,top+6,hair);g.set(cx+3,top+6,hair);g.hl(cx-2,cx+1,top+2,hairH);}
   else if(hs==='topknot'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-1,top+2,2,5,hair);g.rect(cx+rx,top+2,2,5,hair);g.hl(cx-rx+1,cx+rx-1,top+4,hair);g.rect(cx-2,top-3,5,4,hair);g.rect(cx-1,top-4,3,1,hair);g.hl(cx-1,cx+1,top-2,hairH);g.hl(cx-2,cx+2,top+1,hairH);}
   else if(hs==='chonmage'){g.ell(cx,top+2,rx+1,3,hair);g.rect(cx-rx-1,top+2,2,6,hair);g.rect(cx+rx,top+2,2,6,hair);g.rect(cx-4,top+1,9,2,skin);g.rect(cx-1,top-2,3,5,hair);g.hl(cx-2,cx+2,top-3,hair);g.set(cx,top-1,hairH);}
   else if(hs==='long'||hs==='kunoichi'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-2,top+1,3,ry+6,hair);g.rect(cx+rx,top+1,3,ry+6,hair);g.hl(cx-rx+1,cx+2,top+5,hair);g.hl(cx-1,cx+rx-1,top+4,hair);g.hl(cx-2,cx+2,top+2,hairH);if(hs==='kunoichi'){g.rect(cx-2,top-4,5,4,hair);g.rect(cx-1,top-6,3,2,hair);}}
   else if(hs==='wild'){g.ell(cx,top+2,rx+1,4,hair);for(let i=-rx-1;i<=rx+1;i+=2){g.vl(cx+i,top-1-(Math.abs(i)%3),top+3,hair);}g.rect(cx-rx-2,top+1,3,8,hair);g.rect(cx+rx,top+1,3,8,hair);g.hl(cx-rx+1,cx+rx-1,top+5,hair);g.set(cx-2,top+6,hair);g.set(cx+2,top+6,hair);}
   else if(hs==='bob'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-2,top+1,3,ry+2,hair);g.rect(cx+rx,top+1,3,ry+2,hair);g.hl(cx-rx+1,cx+rx-1,top+5,hair);g.hl(cx-rx+1,cx-2,top+6,hair);g.hl(cx-2,cx+2,top+2,hairH);}
   else if(hs==='fringe'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-1,top+1,2,7,hair);g.rect(cx+rx,top+1,2,7,hair);g.hl(cx-rx+1,cx+rx-1,top+5,hair);g.hl(cx-rx+1,cx+rx-1,top+6,hair);g.set(cx-4,top+7,hair);g.set(cx,top+7,hair);g.set(cx+3,top+7,hair);g.hl(cx-2,cx+2,top+2,hairH);}
   else if(hs==='ponytail'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-1,top+1,2,6,hair);g.rect(cx+rx,top+1,2,6,hair);g.hl(cx-rx+1,cx+rx-1,top+4,hair);g.hl(cx-2,cx+2,top+2,hairH);}
   else if(hs==='slick'){g.ell(cx,top+2,rx+1,3,hair);g.rect(cx-rx-1,top+2,2,6,hair);g.rect(cx+rx,top+2,2,6,hair);g.hl(cx-rx+1,cx+rx-1,top+4,hair);g.hl(cx-1,cx+3,top+1,hairH);}
   else if(hs==='receding'){g.ell(cx,top+3,rx+1,3,hair);g.rect(cx-5,top+1,11,3,skin);g.rect(cx-rx-1,top+3,2,6,hair);g.rect(cx+rx,top+3,2,6,hair);}
   else if(hs==='braid'){g.ell(cx,top+2,rx+1,4,hair);g.rect(cx-rx-1,top+1,2,6,hair);g.rect(cx+rx,top+1,2,6,hair);g.hl(cx-rx+1,cx+rx-1,top+4,hair);for(let y=chin-4;y<32;y+=2){g.rect(cx+rx-1+(y%4?1:0),y,3,2,hair);}}
  }
  if(p.bald&&!p.helm){g.hl(cx-3,cx+3,top+2,skinH);}
  /* headwear */
  const hat=p.hat||'none';const hc=p.hatColor||'#2a2420',hcS=shade(hc,0.7),hcH=mix(hc,'#fff',0.15);
  if(hat==='kasa'){g.tri(cx,top-5,cx-13,top+6,cx+13,top+6,'#b89560');g.tri(cx,top-4,cx-10,top+5,cx+10,top+5,'#c9a66e');g.hl(cx-13,cx+13,top+6,'#8a6a40');g.hl(cx-12,cx+12,top+7,shade(skin,0.6));for(let i=-8;i<=8;i+=4)g.line(cx+i*0.3,top-2,cx+i,top+5,'#a98756');}
  else if(hat==='jingasa'){g.tri(cx,top-2,cx-11,top+6,cx+11,top+6,'#3a3b40');g.hl(cx-11,cx+11,top+6,'#1e1f22');g.hl(cx-10,cx+10,top+7,shade(skin,0.6));g.set(cx,top-1,'#8a8a90');g.set(cx-1,top+1,'#5a5b60');}
  else if(hat==='kabuto'){g.ell(cx,top+3,rx+2,5,hc);g.rect(cx-rx-2,top+3,rx*2+5,4,hc);g.rect(cx-rx-3,top+7,rx*2+7,2,hcS);g.rect(cx-rx-3,top+9,2,3,hcS);g.rect(cx+rx+2,top+9,2,3,hcS);g.hl(cx-rx-1,cx+rx+1,top+6,hcH);g.line(cx-2,top-1,cx-7,top-7,p.crest||'#d9b65a');g.line(cx+2,top-1,cx+7,top-7,p.crest||'#d9b65a');g.line(cx-1,top-1,cx-6,top-7,p.crest||'#d9b65a');g.line(cx+1,top-1,cx+6,top-7,p.crest||'#d9b65a');g.rect(cx-1,top-2,3,2,p.crest||'#d9b65a');}
  else if(hat==='hood'){g.ell(cx,top+4,rx+3,7,hc);g.rect(cx-rx-3,top+4,3,ry*2-2,hc);g.rect(cx+rx+1,top+4,3,ry*2-2,hc);g.rect(2,chin-1,28,3,hc);g.rect(cx-rx-3,chin-4,4,6,hc);g.rect(cx+rx,chin-4,4,6,hc);g.hl(cx-rx+1,cx+rx-1,top+6,hcS);g.ell(cx,top+2,rx-1,2,hcH);g.hl(cx-rx+1,cx+rx-1,top+7,shade(skin,0.62));}
  else if(hat==='band'){g.hl(cx-rx-1,cx+rx+1,top+5,p.bandColor||'#efe6d2');g.hl(cx-rx-1,cx+rx+1,top+6,p.bandColor||'#efe6d2');g.line(cx-rx-2,top+6,cx-rx-5,top+11,p.bandColor||'#efe6d2');g.line(cx-rx-2,top+7,cx-rx-4,top+12,shade(p.bandColor||'#efe6d2',0.8));if(p.bandMark)g.set(cx,top+5,p.bandMark);}
  else if(hat==='fur'){g.ell(cx,top+2,rx+2,5,hc);g.rect(cx-rx-3,top+2,rx*2+7,5,hc);for(let i=-rx-3;i<=rx+3;i+=2)g.set(cx+i,top-1-(Math.abs(i)%2),hcH);g.hl(cx-rx-2,cx+rx+2,top+6,hcS);g.rect(cx-rx-3,top+6,2,4,hc);g.rect(cx+rx+2,top+6,2,4,hc);}
  else if(hat==='oni'){const oc=p.hatColor||'#b8242a',oS=shade(oc,0.7);g.ell(cx,cy,rx+1,ry+1,oc);g.rect(cx-rx-1,top+2,rx*2+3,2,oS);g.tri(cx-5,top+1,cx-8,top-6,cx-2,top+1,'#efe6d2');g.tri(cx+5,top+1,cx+8,top-6,cx+2,top+1,'#efe6d2');g.rect(cx-5,cy-1,3,2,p.glowEyes||'#ffd27a');g.rect(cx+3,cy-1,3,2,p.glowEyes||'#ffd27a');g.rect(cx-5,cy+5,11,3,'#1a0c0c');g.hl(cx-4,cx+4,cy+5,'#efe6d2');for(let x=cx-4;x<=cx+4;x+=2)g.set(x,cy+6,'#efe6d2');g.set(cx-5,cy+4,'#efe6d2');g.set(cx+5,cy+4,'#efe6d2');g.hl(cx-2,cx+2,cy+2,oS);g.ell(cx,top+4,3,2,oS);}
  else if(hat==='mask'){g.rect(cx-rx,cy+2,rx*2+1,ry-1,hc);g.hl(cx-rx,cx+rx,cy+2,hcH);g.rect(cx-rx-2,cy+3,2,3,hc);g.rect(cx+rx+1,cy+3,2,3,hc);}
  else if(hat==='menpo'){g.rect(cx-rx,cy+2,rx*2+1,ry-1,'#3a3b40');g.hl(cx-rx,cx+rx,cy+2,'#5a5b60');g.hl(cx-3,cx+3,cy+5,'#1a1b1e');g.rect(cx-4,cy+4,2,1,'#8a8a90');g.rect(cx+3,cy+4,2,1,'#8a8a90');for(let x=cx-3;x<=cx+3;x+=2)g.set(x,cy+6,'#e8e2d6');g.set(cx,cy+3,'#5a5b60');}
  else if(hat==='tengai'){g.ell(cx,top+6,rx+3,8,'#c9a66e');g.rect(cx-rx-3,top+6,rx*2+7,ry+5,'#c9a66e');for(let y=top;y<=cy+6;y+=2)g.hl(cx-rx-3,cx+rx+3,y,'#a98756');for(let x=cx-rx-2;x<=cx+rx+3;x+=3)g.vl(x,top+1,cy+5,'#a98756');g.hl(cx-rx-3,cx+rx+3,cy+6,'#8a6a40');}
  else if(hat==='eboshi'){g.rect(cx-5,top-7,11,9,'#111014');g.rect(cx-4,top-9,8,3,'#111014');g.hl(cx-4,cx+3,top-8,'#2a2a30');g.hl(cx-rx+1,cx+rx-1,top+2,'#111014');}
  else if(hat==='kitsune'){g.ell(cx,cy-1,rx+1,ry,'#f3ede2');g.tri(cx-6,top+1,cx-8,top-5,cx-2,top+1,'#f3ede2');g.tri(cx+6,top+1,cx+8,top-5,cx+2,top+1,'#f3ede2');g.set(cx-6,top-2,'#c94a4a');g.set(cx+6,top-2,'#c94a4a');g.line(cx-5,cy-2,cx-2,cy,'#c94a4a');g.line(cx+5,cy-2,cx+2,cy,'#c94a4a');g.rect(cx-5,cy-1,3,1,'#111');g.rect(cx+3,cy-1,3,1,'#111');g.line(cx-3,cy+4,cx-1,cy+6,'#c94a4a');g.line(cx+3,cy+4,cx+1,cy+6,'#c94a4a');g.set(cx,cy+3,'#c94a4a');}
  else if(hat==='hachigane'){g.rect(cx-5,top+3,11,3,'#4a4b50');g.hl(cx-4,cx+4,top+3,'#8a8a90');g.hl(cx-rx-1,cx+rx+1,top+6,'#2a2420');}
  else if(hat==='crown'){const cc=p.hatColor||'#d9a640';g.rect(cx-rx+1,top+1,rx*2-1,3,cc);for(let i=-rx+1;i<=rx-1;i+=3)g.rect(cx+i,top-2,2,3,cc);g.set(cx,top-3,'#ff7a3a');g.hl(cx-rx+2,cx+rx-2,top+2,mix(cc,'#fff',0.3));}
  else if(hat==='great'){const mc=p.hatColor||'#5a6066',mS=shade(mc,0.7),mH=mix(mc,'#fff',0.15);g.rect(cx-rx-1,top-1,rx*2+3,ry*2+2,mc);g.ell(cx,top+1,rx+1,3,mc);g.rect(cx-rx-1,top+1,2,ry*2,mS);g.hl(cx-rx,cx+rx,top+1,mH);g.rect(cx-rx,cy-1,rx*2+1,2,'#0a0a0c');g.hl(cx-rx+1,cx+rx-1,cy-1,p.glowEyes||'#ff9a50');g.vl(cx,cy+1,chin-1,mS);for(let y=cy+3;y<chin;y+=2){g.set(cx-2,y,'#0a0a0c');g.set(cx+2,y,'#0a0a0c');}if(p.crest){g.rect(cx-1,top-6,3,6,p.crest);g.set(cx,top-7,p.crest);}if(p.horns){g.line(cx-rx,top+1,cx-rx-4,top-6,'#d8d0b8');g.line(cx+rx,top+1,cx+rx+4,top-6,'#d8d0b8');g.line(cx-rx-1,top+1,cx-rx-5,top-5,'#d8d0b8');g.line(cx+rx+1,top+1,cx+rx+5,top-5,'#d8d0b8');}}
  else if(hat==='sallet'){const mc=p.hatColor||'#6a7076',mS=shade(mc,0.7),mH=mix(mc,'#fff',0.15);g.ell(cx,top+3,rx+2,5,mc);g.rect(cx-rx-2,top+3,rx*2+5,5,mc);g.rect(cx-rx-2,top+8,rx*2+5,2,mS);g.hl(cx-rx,cx+rx,top+2,mH);g.rect(cx-rx-3,top+8,2,4,mc);g.rect(cx+rx+2,top+8,2,4,mc);if(p.crest){g.line(cx,top-1,cx-3,top-7,p.crest);g.line(cx,top-1,cx+3,top-7,p.crest);}if(p.horns){g.line(cx-rx-1,top+3,cx-rx-5,top-5,'#d8d0b8');g.line(cx+rx+1,top+3,cx+rx+5,top-5,'#d8d0b8');}}
  else if(hat==='veil'){g.rect(cx-rx-2,top+2,rx*2+5,ry*2+6,p.hatColor||'#aab4c0');for(let y=top+3;y<chin+6;y+=2)g.dither(cx-rx-2,y,rx*2+5,1,mix(p.hatColor||'#aab4c0','#000',0.2));g.rect(cx-rx-2,top+1,rx*2+5,2,shade(p.hatColor||'#aab4c0',0.8));}
  else if(hat==='circlet'){g.hl(cx-rx,cx+rx,top+3,p.hatColor||'#d9a640');g.set(cx,top+2,'#ff7a3a');}
  else if(hat==='porcelain'){g.ell(cx,cy-1,rx,ry-1,'#eee8dc');g.rect(cx-5,cy-1,3,2,'#111');g.rect(cx+3,cy-1,3,2,'#111');g.line(cx-1,cy+4,cx+1,cy+4,'#8a6a6a');g.line(cx+2,cy-4,cx+5,cy+2,'#b89a9a');}
  if(p.hatFn)p.hatFn(g,{cx,cy,rx,ry,top,chin,skin,skinS,hair,cloth,shade,mix});
  /* neck cloth */
  if(p.scarf){const sc=p.scarf===true?'#2a1e24':p.scarf;g.rect(cx-6,chin-1,13,4,sc);g.hl(cx-6,cx+6,chin+1,shade(sc,0.75));g.rect(cx+5,chin+2,3,6,sc);g.rect(cx+6,chin+7,2,3,shade(sc,0.8));}
  if(p.barnacle){[[cx-5,cy+7],[cx+6,cy-6],[cx-7,top+6],[cx+4,chin+3]].forEach(([x,y],i)=>{g.rect(x,y,2,2,'#b9b29a');g.set(x,y,'#d8d2bc');});}
  if(p.ash){g.dither(cx-rx,top,rx*2+1,ry*2+1,mix(skin,'#9a9a9a',0.5),1);}
  g.outline(p.outline||'#0c0809');
  return g;
 }
 /* ---------- cache + draw ---------- */
 const cache=new Map();
 function canvasFor(def,mood){const k=def.id+'|'+mood;let c=cache.get(k);if(c)return c;
  const g=paint(def,mood);c=document.createElement('canvas');c.width=SZ;c.height=SZ;const q=c.getContext('2d');const img=q.createImageData(SZ,SZ);
  g.each((x,y,col)=>{const [r,gg,b]=hex(col),i=(y*SZ+x)*4;img.data[i]=r;img.data[i+1]=gg;img.data[i+2]=b;img.data[i+3]=255;});q.putImageData(img,0,0);cache.set(k,c);return c;}
 /** draw portrait: x,y = top-left, size = target px (snapped to integer scale), flip = face the other way, alpha */
 function draw(ctx,def,mood,x,y,size,flip,alpha){const c=canvasFor(def,mood||'neutral');const sc=Math.max(1,Math.round(size/SZ)),s=SZ*sc;
  ctx.save();ctx.imageSmoothingEnabled=false;if(alpha!=null)ctx.globalAlpha=alpha;if(flip){ctx.translate(x+s,y);ctx.scale(-1,1);ctx.drawImage(c,0,0,s,s);}else ctx.drawImage(c,x,y,s,s);ctx.restore();return s;}
 return {draw,canvasFor,paint,MOOD,shade,mix,SZ};
})();
