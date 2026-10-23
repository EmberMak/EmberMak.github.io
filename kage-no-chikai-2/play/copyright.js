/* Ownership notice on title/credits + F11 fullscreen toggle. Does not touch gameplay. */
(function(){
const c=document.createElement('div');c.id='kcCopy';
c.textContent='© 2026 Kei Cheong Mai (EmberMak) · All rights reserved · embermak.github.io';
c.style.cssText="position:fixed;right:10px;top:10px;z-index:3;text-align:right;font:11px Georgia,serif;color:#e8c37a;opacity:.75;pointer-events:none;display:none;text-shadow:0 1px 2px #000";
document.body.appendChild(c);
setInterval(()=>{const s=typeof SCENE!=='undefined'&&SCENE.cur;c.style.display=(s==='title'||s==='credits')?'block':'none';},400);
addEventListener('keydown',e=>{if(e.key==='F11'){e.preventDefault();try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch(x){}}});
})();
