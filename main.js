const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
// cursor
const dot=$('#cursor .dot'),ring=$('#cursor .ring');let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform=`translate(${mx-3}px,${my-3}px)`});
(function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(loop)})();
$$('a,button,.tilt,figure').forEach(el=>{el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'))});
// katana slash fx
const cv=$('#fx'),cx=cv.getContext('2d');let W,H;const fit=()=>{W=cv.width=innerWidth*devicePixelRatio;H=cv.height=innerHeight*devicePixelRatio;cx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)};fit();addEventListener('resize',fit);
const slashes=[],sparks=[];
let actx;function swish(){try{actx=actx||new AudioContext();const n=actx.sampleRate*.18,b=actx.createBuffer(1,n,actx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=actx.createBufferSource(),f=actx.createBiquadFilter(),g=actx.createGain();f.type='bandpass';f.frequency.setValueAtTime(5000,actx.currentTime);f.frequency.exponentialRampToValueAtTime(600,actx.currentTime+.18);g.gain.value=.12;s.buffer=b;s.connect(f).connect(g).connect(actx.destination);s.start()}catch(e){}}
let snd=false;const sb=$('#snd');sb.onclick=e=>{e.stopPropagation();snd=!snd;sb.textContent=(snd?'🔊':'🔇')+' Sound';sb.setAttribute('aria-pressed',snd)};
addEventListener('click',e=>{if(reduce||e.target.closest('a,button,figure,.filmstrip img'))return;const a=(-.35+Math.random()*.25)*Math.PI,L=160+Math.random()*80;slashes.push({x:e.clientX,y:e.clientY,a,L,t:0});
 for(let i=0;i<18;i++){const sa=a+(Math.random()-.5)*.6+(Math.random()<.5?Math.PI:0),v=2+Math.random()*6;sparks.push({x:e.clientX,y:e.clientY,vx:Math.cos(sa)*v,vy:Math.sin(sa)*v,l:1,c:Math.random()<.5?'#ff4d6d':'#ffc46b'})}
 if(snd)swish();document.body.animate([{transform:'translate(2px,-1px)'},{transform:'translate(-2px,1px)'},{transform:'none'}],{duration:120})});
(function draw(){cx.clearRect(0,0,innerWidth,innerHeight);
 for(let i=slashes.length-1;i>=0;i--){const s=slashes[i];s.t+=.06;const p=Math.min(1,s.t*2.2),fade=1-Math.max(0,(s.t-.45)/.55);if(fade<=0){slashes.splice(i,1);continue}
  const dx=Math.cos(s.a)*s.L,dy=Math.sin(s.a)*s.L,x0=s.x-dx,y0=s.y-dy,x1=x0+dx*2*p,y1=y0+dy*2*p;
  const g=cx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.8,`rgba(255,240,240,${fade})`);g.addColorStop(1,`rgba(255,255,255,${fade})`);
  cx.save();cx.shadowColor='#ff4d6d';cx.shadowBlur=25;cx.strokeStyle=g;cx.lineCap='round';cx.lineWidth=4*fade+1;cx.beginPath();cx.moveTo(x0,y0);cx.quadraticCurveTo(s.x+dy*.12,s.y-dx*.12,x1,y1);cx.stroke();cx.restore()}
 for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.l-=.03;if(p.l<=0){sparks.splice(i,1);continue}cx.fillStyle=p.c;cx.globalAlpha=p.l;cx.fillRect(p.x,p.y,3,3);cx.globalAlpha=1}
 requestAnimationFrame(draw)})();
// progress + parallax + nav
const bar=$('#progress span'),flame=$('#flame'),bg=$('.hero-bg'),links=$$('#nav ol a');
addEventListener('scroll',()=>{const h=document.documentElement,p=h.scrollTop/(h.scrollHeight-innerHeight);bar.style.width=p*100+'%';flame.style.left=`calc(${p*100}% - 5px)`;
 if(!reduce)bg.style.transform=`scale(1.1) translateY(${h.scrollTop*.3}px)`;
 let cur;$$('section').forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.4)cur=s.id});links.forEach(a=>a.classList.toggle('on',a.hash==='#'+cur))},{passive:true});
// reveal + counters
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');$$('[data-count]',e.target).forEach(c=>{const n=+c.dataset.count,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1400);c.textContent=Math.round(n*(1-Math.pow(1-k,3))).toLocaleString();if(k<1)requestAnimationFrame(f)})(t0)});io.unobserve(e.target)}),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));
// tilt
$$('.tilt').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(700px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-4px)`});el.addEventListener('mouseleave',()=>el.style.transform='')});
// magnetic
$$('.mag').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`});el.addEventListener('mouseleave',()=>el.style.transform='')});
// word swap
const sw=$('.swap');if(sw){const words=sw.dataset.words.split(',');let wi=0;setInterval(()=>{wi=(wi+1)%words.length;sw.animate([{opacity:1},{opacity:0,transform:'translateY(-8px)'}],{duration:200}).onfinish=()=>{sw.textContent=words[wi];sw.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1}],{duration:250})}},2200);}
// tabs
$$('.tab-btns button').forEach(b=>b.onclick=()=>{$$('.tab-btns button').forEach(x=>x.classList.toggle('on',x===b));$$('.tab').forEach(t=>t.classList.toggle('on',t.id===b.dataset.t))});
// lightbox
const lb=$('#lightbox');$$('.masonry figure,.filmstrip img,.iaido-grid figure').forEach(f=>f.addEventListener('click',()=>{const img=f.tagName==='IMG'?f:$('img',f);$('img',lb).src=img.src;$('p',lb).textContent=img.alt;lb.classList.add('on')}));lb.onclick=()=>lb.classList.remove('on');addEventListener('keydown',e=>e.key==='Escape'&&lb.classList.remove('on'));

// cert flip cards
function slashAt(x,y){if(reduce)return;const a=(-.35+Math.random()*.25)*Math.PI;slashes.push({x,y,a,L:120,t:0});for(let i=0;i<14;i++){const sa=Math.random()*Math.PI*2,v=2+Math.random()*5;sparks.push({x,y,vx:Math.cos(sa)*v,vy:Math.sin(sa)*v,l:1,c:Math.random()<.5?'#4de3ff':'#ffc46b'})}if(snd)swish()}
$$('.cert[data-cert]').forEach(card=>{const back=$('.back',card),src=card.dataset.cert,title=$('h3',card).textContent;
 const im=new Image();im.onload=()=>{back.innerHTML='';im.alt=title+' certificate';back.appendChild(im);im.addEventListener('click',e=>{if(!card.classList.contains('flipped'))return;e.stopPropagation();$('img',lb).src=im.src;$('p',lb).textContent=im.alt;lb.classList.add('on')})};im.src=src;
 const flip=kb=>{const on=card.classList.toggle('flipped');card.setAttribute('aria-pressed',on);card.style.transform='';if(!reduce){card.classList.remove('burst');void card.offsetWidth;card.classList.add('burst')}if(kb){const r=card.getBoundingClientRect();slashAt(r.left+r.width/2,r.top+r.height/2)}};
 card.addEventListener('click',()=>flip(false));
 card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(true)}})});

// game filters
$$('.filters button').forEach(b=>b.addEventListener('click',()=>{$$('.filters button').forEach(x=>x.classList.toggle('on',x===b));const f=b.dataset.f;$$('.gcard').forEach(c=>c.classList.toggle('hide',f!=='all'&&!c.dataset.f.split(' ').includes(f)))}));
