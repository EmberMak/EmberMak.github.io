'use strict';
/* ============================================================================
   GUARD — device-side diagnostics and safety net (loaded first).
   - Any uncaught error is shown on screen (red strip) instead of silently freezing the game.
   - PERF: frame-time monitor. If the device cannot hold ~35 fps, LITE effects mode is enabled
     automatically (no canvas shadow blur, no camera zoom, fewer particles) and remembered.
   - window.LITE is read by the drawing code; shadowBlur is neutralised globally in LITE mode.
   ========================================================================== */
window.__ERR=[];window.LITE=false;window.PERF={avg:16,frames:0,t:0,fps:60,auto:true,locked:false};
(function(){
 const box=document.createElement('div');box.id='errbox';box.style.cssText='position:fixed;left:0;right:0;top:0;z-index:50;background:rgba(120,10,10,.92);color:#fff;font:12px/1.3 monospace;padding:6px 10px;display:none;pointer-events:none;white-space:pre-wrap;max-height:40vh;overflow:hidden';
 function show(){if(!document.body){setTimeout(show,50);return;}document.body.appendChild(box);}
 show();
 let hideT=null;
 window.reportError=function(e){try{const msg=(e&&e.stack)?String(e.stack).split('\n').slice(0,3).join(' | '):String(e);window.__ERR.push(msg);
  box.textContent='⚠ '+window.__ERR.length+' error(s) — latest: '+msg.slice(0,400);box.style.display='block';clearTimeout(hideT);hideT=setTimeout(()=>{box.style.display='none';},15000);
  if(window.console&&console.error)console.error(e);}catch(x){}};
 window.addEventListener('error',ev=>{window.reportError(ev.error||ev.message);});
 window.addEventListener('unhandledrejection',ev=>{window.reportError(ev.reason||'unhandled promise rejection');});
 // LITE mode: make every shadowBlur assignment a no-op (blur is the single most expensive canvas op on phones)
 try{const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'shadowBlur');if(d&&d.set){Object.defineProperty(CanvasRenderingContext2D.prototype,'shadowBlur',{get:d.get,set:function(v){d.set.call(this,window.LITE?0:v);},configurable:true});}}catch(e){}
})();
/** call once per frame with the real delta (seconds). Returns nothing; flips LITE on if needed. */
window.perfTick=function(dt,busy){const P=window.PERF;if(dt<=0||dt>0.5)return;P.avg=P.avg*0.95+dt*1000*0.05;P.frames++;P.t+=dt;P.fps=1000/P.avg;
 if(P.auto&&!P.locked&&busy&&P.t>5&&P.frames>120&&P.avg>29){window.LITE=true;P.locked=true;if(window.onLiteSwitch)try{window.onLiteSwitch();}catch(e){}}};
window.setQuality=function(mode){const P=window.PERF;if(mode==='lite'){window.LITE=true;P.auto=false;P.locked=true;}else if(mode==='full'){window.LITE=false;P.auto=false;P.locked=true;}else{window.LITE=false;P.auto=true;P.locked=false;P.t=0;P.frames=0;}};
