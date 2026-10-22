'use strict';
/* ============================================================================
   DLG — visual-novel style dialogue scenes with pixel portraits.
   Line types:
     {who:'kage', mood:'calm', text:'…', side:'L'|'R'}   spoken line (portrait + name plate + typewriter)
     {narr:'…'}                                         narration card (no portrait)
     {title:'…', sub:'…'}                               chapter title card
     {choice:[{t:'label', fn:()=>{}, next:[lines]}]}    branching choice
     {fx:'shake'|'flash', sfx:'name', hap:'pattern'}    one-shot effects (merged into the next line or stand-alone)
   The game supplies a style object: {chars, hero, font(px,bold), paper(ctx,x,y,w,h), colors…, play(sfx), hap(name)}.
   ========================================================================== */
const DLG=(()=>{
 let S=null,style=null,T=0;
 const SPEED=46;                                   // chars per second
 const pause=ch=>/[.!?…」』]/.test(ch)?0.16:/[,、;:—]/.test(ch)?0.07:0;
 function start(lines,onDone,opts){opts=opts||{};style=opts.style||style;
  S={lines:flatten(lines),i:0,shown:0,acc:0,done:false,onDone:onDone||(()=>{}),t:0,enter:0,left:null,right:null,lastWho:null,choiceSel:-1,skipR:null,choiceR:[],ended:false,cb:opts};
  prep();}
 function flatten(ls){const out=[];ls.forEach(l=>{if(typeof l==='string')out.push({narr:l});else out.push(l);});return out;}
 function cur(){return S?S.lines[S.i]:null;}
 function prep(){const l=cur();if(!l){end();return;}S.shown=0;S.acc=0;S.done=false;S.t=0;S.choiceSel=-1;
  if(l.fx||l.sfx||l.hap){if(l.fx&&style.fx)style.fx(l.fx);if(l.sfx&&style.play)style.play(l.sfx);if(l.hap&&style.hap)style.hap(l.hap);if(!l.text&&!l.narr&&!l.title&&!l.choice){S.i++;prep();return;}}
  if(l.who){const side=l.side||(l.who===style.hero||(style.heroes||[]).includes(l.who)?'L':'R');
   const ent={who:l.who,mood:l.mood||'neutral',side,t:0};
   if(side==='L'){if(!S.left||S.left.who!==l.who)ent.t=0;else ent.t=S.left.t;S.left=ent;}else{if(!S.right||S.right.who!==l.who)ent.t=0;else ent.t=S.right.t;S.right=ent;}
   S.lastWho=l.who;if(l.clear==='R')S.right=null;if(l.clear==='L')S.left=null;}
  if(l.leave){if(l.leave==='L')S.left=null;if(l.leave==='R')S.right=null;}
  if(l.narr||l.title)S.done=false;
  if(l.choice){S.done=true;}
  if(style.hap)style.hap('page');}
 function textOf(l){return l.text||l.narr||l.title||'';}
 function end(){if(!S||S.ended)return;S.ended=true;const cb=S.onDone;S=null;cb();}
 function skip(){if(!S)return;const l=cur();if(l&&l.choice){return;}end();}
 /** tap: returns true if the dialogue consumed the tap */
 function tap(p){if(!S)return false;const l=cur();if(!l)return true;
  if(S.skipR&&inR(p,S.skipR)){skip();return true;}
  if(l.choice){for(let i=0;i<S.choiceR.length;i++){if(inR(p,S.choiceR[i])){const c=l.choice[i];if(style.hap)style.hap('choice');if(style.play)style.play('block',0.4,1.5);
    if(c.fn)c.fn();if(c.next&&c.next.length){S.lines.splice(S.i+1,0,...flatten(c.next));}S.i++;prep();return true;}}return true;}
  if(S.enter<0.25)return true;
  if(!S.done){S.shown=textOf(l).length;S.done=true;return true;}
  S.i++;prep();return true;}
 const inR=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
 function update(dt){if(!S)return;T+=dt;S.t+=dt;S.enter=Math.min(1,S.enter+dt*4);const l=cur();if(!l)return;
  if(S.left)S.left.t+=dt;if(S.right)S.right.t+=dt;
  if(!S.done&&(l.text||l.narr||l.title)){const txt=textOf(l);S.acc+=dt*SPEED*(l.title?0.8:1);
   while(S.acc>=1&&S.shown<txt.length){S.acc-=1;const ch=txt[S.shown];S.shown++;const pz=pause(ch);if(pz)S.acc-=pz*SPEED;if(style.blip&&S.shown%2===0&&ch!==' ')style.blip(ch);}
   if(S.shown>=txt.length&&S.acc>=0)S.done=true;}}
 function wrap(ctx,s,x,y,maxW,lh,maxLines){const words=s.split(' ');let line='',n=0;for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,y);y+=lh;line=w;n++;if(maxLines&&n>=maxLines)return y;}else line=t;}ctx.fillText(line,x,y);return y+lh;}
 /** draw: ctx, W,H,U (scale unit). Expects the game already drew its background. */
 function draw(ctx,W,H,U){if(!S||!style)return;const l=cur();if(!l)return;const st=style,e=easeOut(S.enter);
  const land=W>H,bx=W*0.04,bw=W*0.92,bh=land?H*0.36:H*0.3,by=H-bh-10*U+(1-e)*40*U;
  // dim + letterbox
  ctx.fillStyle='rgba(0,0,0,'+(0.35*e)+')';ctx.fillRect(0,0,W,H);
  ctx.fillStyle=st.bar||'#000';ctx.fillRect(0,0,W,Math.max(0,(land?H*0.06:H*0.04)*e));
  if(l.title){ // chapter title card
   ctx.save();ctx.globalAlpha=e;ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,H*0.3,W,H*0.4);
   if(st.titleDeco)st.titleDeco(ctx,W,H,U,S.t);
   ctx.fillStyle=st.titleCol||'#f3e6d0';ctx.font=st.font(26*U,1);ctx.fillText(l.title.slice(0,Math.ceil(S.shown)),W/2,H*0.47);
   if(l.sub){ctx.font=st.font(12*U);ctx.fillStyle=st.subCol||'#d8c4ac';ctx.fillText(l.sub,W/2,H*0.47+22*U);}
   if(S.done)hint(ctx,W,H,U,st);ctx.restore();drawSkip(ctx,W,H,U);return;}
  if(l.narr){ // narration card
   ctx.save();ctx.globalAlpha=e;const nw=Math.min(W*0.78,560*U);ctx.textAlign='center';
   if(st.narrBox)st.narrBox(ctx,W/2-nw/2-16*U,H*0.28,nw+32*U,H*0.44);else{ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(W/2-nw/2-16*U,H*0.28,nw+32*U,H*0.44);}
   ctx.fillStyle=st.narrCol||'#f3e6d0';ctx.font='italic '+st.font(14*U);wrap(ctx,l.narr.slice(0,S.shown),W/2,H*0.4,nw,20*U);
   if(S.done)hint(ctx,W,H,U,st);ctx.restore();drawSkip(ctx,W,H,U);return;}
  // portraits
  const ps=Math.max(3,Math.min(8,Math.round((land?H*0.5:H*0.3)/32)))*32;
  const drawP=(ent,active)=>{if(!ent)return;const def=st.chars[ent.who];if(!def)return;const a=active?1:0.55,yoff=active?0:6*U,bob=(active&&!S.done)?(Math.floor(S.t*8)%2)*2*U:0;
   const x=ent.side==='L'?W*0.05:W*0.95-ps,y=by-ps+14*U+yoff-bob+(1-Math.min(1,ent.t*3))*20*U;
   ctx.save();ctx.globalAlpha=Math.min(1,ent.t*3)*e*a;
   if(st.portraitBack)st.portraitBack(ctx,x,y,ps,ent.side,active);
   PIX.draw(ctx,def,active?ent.mood:(def.restMood||'neutral'),x,y,ps,ent.side==='R');ctx.restore();};
  const activeSide=l.who?(S.left&&S.left.who===l.who?'L':'R'):null;
  drawP(S.left,activeSide==='L');drawP(S.right,activeSide==='R');
  // text box
  ctx.save();ctx.globalAlpha=e;if(st.paper)st.paper(ctx,bx,by,bw,bh);else{ctx.fillStyle='rgba(10,8,8,.9)';ctx.fillRect(bx,by,bw,bh);}
  // name plate
  if(l.who){const def=st.chars[l.who]||{name:l.who};const nm=(def.jp?def.jp+'  ':'')+(def.name||l.who);ctx.font=st.font(12*U,1);const nw=ctx.measureText(nm).width+22*U;
   const nx=activeSide==='R'?bx+bw-nw-12*U:bx+12*U,ny=by-13*U;
   if(st.plate)st.plate(ctx,nx,ny,nw,22*U,activeSide);else{ctx.fillStyle='#1a1010';ctx.fillRect(nx,ny,nw,22*U);}
   ctx.fillStyle=st.plateCol||'#f3e6d0';ctx.textAlign='left';ctx.fillText(nm,nx+11*U,ny+15.5*U);}
  // text
  ctx.fillStyle=st.textCol||'#2a1a12';ctx.font=st.font(15*U);ctx.textAlign='left';
  const txt=textOf(l).slice(0,S.shown);wrap(ctx,txt,bx+22*U,by+32*U,bw-44*U,21*U,5);
  if(S.done&&!l.choice)hint(ctx,W,H,U,st,bx+bw-18*U,by+bh-12*U);
  ctx.restore();
  // choices
  S.choiceR=[];if(l.choice){const n=l.choice.length,cw=Math.min(W*0.5,300*U),ch=30*U;const y0=by-(n*(ch+8*U))-6*U;
   l.choice.forEach((c,i)=>{const x=W/2-cw/2,y=y0+i*(ch+8*U);S.choiceR.push({x,y,w:cw,h:ch});
    if(st.choiceBtn)st.choiceBtn(ctx,x,y,cw,ch,c.t,i);else{ctx.fillStyle='#1a1010';ctx.fillRect(x,y,cw,ch);ctx.fillStyle='#f3e6d0';ctx.font=st.font(13*U,1);ctx.textAlign='center';ctx.fillText(c.t,x+cw/2,y+ch*0.66);}});}
  drawSkip(ctx,W,H,U);}
 function hint(ctx,W,H,U,st,x,y){const a=0.5+0.5*Math.sin(T*6);ctx.save();ctx.globalAlpha=a;ctx.fillStyle=st.hintCol||'#b8242a';ctx.font=st.font(12*U,1);ctx.textAlign='center';ctx.fillText('▼',x||W/2,y||H*0.68);ctx.restore();}
 function drawSkip(ctx,W,H,U){const w=64*U,h=22*U,x=W-w-10*U,y=8*U;S.skipR={x,y,w,h};ctx.save();ctx.globalAlpha=0.85;
  if(style.skipBtn)style.skipBtn(ctx,x,y,w,h);else{ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(255,255,255,.4)';ctx.strokeRect(x,y,w,h);ctx.fillStyle='#fff';ctx.font=style.font(10*U,1);ctx.textAlign='center';ctx.fillText('SKIP ▶▶',x+w/2,y+h*0.68);}
  ctx.restore();}
 const easeOut=t=>1-(1-t)*(1-t);
 return {start,tap,update,draw,skip,active:()=>!!S,setStyle:s=>style=s,get state(){return S}};
})();
