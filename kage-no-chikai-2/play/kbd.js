/* PC keyboard layer for the web build — maps every touch control to keys. Touch/mouse input is untouched. */
(function(){
const WORLD={e:'act',enter:'act',h:'horse',' ':'jump',i:'bag',tab:'bag',m:'map'};
const DUEL={' ':'block',j:'block',q:'dodgeL',e:'dodgeR',f:'magic',r:'super'};
const ARW={arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
const held={};let pend=null;
function btn(id){return BTN_DEFS.find(b=>b.id===id&&(!b.visible||b.visible()));}
function press(id){const b=btn(id);if(!b)return false;b.held=true;IN.hold[id]=true;try{audioInit();}catch(x){}if(b.down)b.down({x:b.x,y:b.y});held[id]=b;return true;}
function release(id){const b=held[id];IN.hold[id]=false;delete held[id];if(b){b.held=false;if(b.up)b.up({x:b.x,y:b.y});}}
function fighting(){return SCENE.cur==='duel'&&!UI.open&&typeof D!=='undefined'&&D.phase==='fight';}
function flushSwipe(){if(!pend)return;const s=pend;pend=null;if(s.dx||s.dy)IN.swipes.push({dx:s.dx*40,dy:s.dy*40});}
function advanceTap(){IN.taps.push({x:W/2,y:H*0.62,kbd:1});}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='?'||k==='/'){toggleLegend();e.preventDefault();return;}
 if(['tab',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
 if(e.repeat)return;hideLegendSoft();
 if(fighting()){
  if(ARW[k]){const v=ARW[k];if(!pend){pend={dx:0,dy:0};setTimeout(flushSwipe,70);}pend.dx=Math.sign(pend.dx+v[0]);pend.dy=Math.sign(pend.dy+v[1]);return;}
  if(DUEL[k]){press(DUEL[k]);return;}return;}
 if(SCENE.cur==='world'&&!UI.open&&!(typeof DLG!=='undefined'&&DLG.active())&&!(typeof CUT!=='undefined'&&CUT.on)){if(WORLD[k]){press(WORLD[k]);return;}}
 if(k==='enter'||k===' '||k==='e'){
  if(SCENE.cur==='duel'&&!UI.open&&D.phase==='loot'){IN.taps.push({x:-1,y:-1,esc:true});return;}
  if((typeof DLG!=='undefined'&&DLG.active())||(typeof CUT!=='undefined'&&CUT.on)||SCENE.cur==='duel'&&!UI.open)advanceTap();}
});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();for(const m of [WORLD,DUEL])if(m[k]&&held[m[k]])release(m[k]);});
addEventListener('blur',()=>{for(const id in held)release(id);for(const k in IN.keys)IN.keys[k]=false;});
/* legend */
const L=document.createElement('div');L.id='kbdLegend';
L.innerHTML=`<div class="kl-box"><div class="kl-h">影 KEYBOARD CONTROLS <span>— PC web build</span></div>
<div class="kl-cols"><div><b>EXPLORING</b>
<p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>←↑↓→</kbd> walk / ride</p>
<p><kbd>Shift</kbd> hold to run 走</p><p><kbd>E</kbd> / <kbd>Enter</kbd> talk · act 話</p>
<p><kbd>H</kbd> call / mount horse 馬</p><p><kbd>Space</kbd> jump 跳</p>
<p><kbd>I</kbd> / <kbd>Tab</kbd> inventory 袋</p><p><kbd>M</kbd> map & travel 図</p><p><kbd>Esc</kbd> pause ≡ / back</p></div>
<div><b>DUELLING</b>
<p><kbd>←↑↓→</kbd> (or WASD) = the swipe. Press the foe's arrow direction to <em>parry</em>; two keys together for diagonals.</p>
<p>After a parry the foe is open — press any direction to strike (alternate for bonus).</p>
<p><kbd>Space</kbd> / <kbd>J</kbd> hold to block 受</p><p><kbd>Q</kbd> step back 退 · <kbd>E</kbd> jump 跳 (red unblockables)</p>
<p><kbd>F</kbd> Foxfire 狐 · <kbd>R</kbd> Kage-giri 奥</p><p><kbd>Enter</kbd> continue / take loot</p></div></div>
<div class="kl-f">Mouse works too: click menus, drag to swipe. Press <kbd>?</kbd> any time to show this. <button id="klGo">START ▶</button></div></div>`;
const css=document.createElement('style');css.textContent=`#kbdLegend{position:fixed;inset:0;z-index:5;display:none;align-items:center;justify-content:center;background:rgba(6,4,5,.82);font:13px/1.45 'KageSerif',Georgia,serif;color:#f3e6d0}
#kbdLegend.on{display:flex}.kl-box{max-width:760px;width:92%;border:1px solid #b8242a;background:linear-gradient(#160c0e,#0a0708);padding:18px 22px;box-shadow:0 0 40px #b8242a55}
.kl-h{font-weight:700;letter-spacing:.2em;color:#e8c37a;margin-bottom:10px}.kl-h span{opacity:.6;letter-spacing:.05em;font-weight:400}
.kl-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}.kl-cols b{color:#ff5a52;letter-spacing:.2em;font-size:12px}.kl-cols p{margin:6px 0}
kbd{display:inline-block;min-width:16px;padding:1px 6px;margin:0 2px;border:1px solid #e8c37a88;border-bottom-width:3px;border-radius:4px;background:#241417;color:#fff;font:12px monospace;text-align:center}
.kl-f{margin-top:12px;opacity:.85;font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:10px}
#klGo{background:#b8242a;color:#fff;border:0;padding:8px 18px;font:700 13px 'KageSerif',serif;letter-spacing:.2em;cursor:pointer}
#kbdBtn{position:fixed;left:calc(50% - 160px);top:10px;z-index:4;background:rgba(20,10,12,.7);color:#e8c37a;border:1px solid #e8c37a66;font:12px monospace;padding:4px 8px;cursor:pointer;display:none}
@media (max-width:640px){.kl-cols{grid-template-columns:1fr}}`;
document.head.appendChild(css);document.body.appendChild(L);
const B=document.createElement('button');B.id='kbdBtn';B.textContent='⌨ Controls [?]';document.body.appendChild(B);
const q=new URLSearchParams(location.search).get('mode');
const pc=q==='pc'||(q!=='mobile'&&matchMedia('(pointer:fine)').matches);
let soft=false;
function toggleLegend(){L.classList.toggle('on');soft=false;}
function hideLegendSoft(){if(soft&&L.classList.contains('on')){L.classList.remove('on');soft=false;}}
B.onclick=e=>{e.stopPropagation();toggleLegend();};
L.addEventListener('pointerdown',e=>{e.stopPropagation();if(e.target.id==='klGo'||e.target===L){L.classList.remove('on');try{audioInit();}catch(x){}}});
if(pc){B.style.display='block';L.classList.add('on');soft=true;}
window.__KBD={toggleLegend,get pending(){return pend;}};
})();
