const V='ash-v3';
const F=['./','index.html','game.js','boot.js','guard.js','haptics.js','music.js','pix.js','fx.js','dialogue.js','chars.js','story2.js','manifest.webmanifest','icon.svg','fonts/Lora.ttf','fonts/Lora-Italic.ttf',...['hit1.ogg','hit2.ogg','hurt.ogg','block.ogg','parry.ogg','perfect.ogg','swish1.wav','swish2.wav','windup.wav','pain1.wav','pain2.wav','die.wav','fire.wav','super.ogg','victory.ogg','dodge.ogg'].map(f=>'sfx/'+f)];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{const cl=res.clone();caches.open(V).then(c=>c.put(e.request,cl));return res})))});
