'use strict';
/* boot: save migration for players who finished Part One before Part Two existed, and exported test hooks */
(function(){if(S.ch===5&&S.node>=PATH[5].length&&CHAPTERS.length>6){S.ch=6;S.node=0;S.maxCh=Math.max(S.maxCh,6);save();}
 if(S.maxCh<S.ch)S.maxCh=S.ch;mapView=Math.min(S.ch,CHAPTERS.length-1);
 // hash test hooks: #shot=map|inv|shop|fight&n=<enemy index>
 const h=location.hash.slice(1);if(!h)return;const q=Object.fromEntries(h.split('&').map(s=>s.split('=')));
 if(q.gold)S.gold=+q.gold;if(q.cl){for(let i=0;i<+q.cl&&i<EN.length;i++)S.cleared[EN[i].id]=1;S.ch=Math.min(CHAPTERS.length-1,Math.floor(+q.cl/4));S.maxCh=S.ch;S.node=0;}
 if(q.shot==='map'){go('map');sceneT=1;}
 if(q.shot==='fight'){const i=+(q.n||5);const e=EN[i];startNode(e.ch,PATH[e.ch].indexOf(e.id));go('fight');sceneT=2;}
})();
window.__ash=Object.assign(window.__ash||{},{get DLG(){return DLG},get ED(){return ED},EN,CHAPTERS,PATH,afterPost,startNode,toFight:()=>toFight()});
/* ---- self-test: #shot=selftest — an AI fights every enemy with chapter-appropriate gear ---- */
(function(){const q=Object.fromEntries(location.hash.slice(1).split('&').map(s=>s.split('=')));if(q.shot!=='selftest')return;
 const sk=+(q.sk||0.85);const res=[];let wins=0,n=0,errs=[];
 function loadout(ch){S.xp=900*(ch*2);const best={};SLOTS.forEach(sl=>{const cands=ITEMS.filter(i=>i.s===sl&&(i.ch==null||i.ch<=ch)&&(i.p>0||i.ch==null)&&!(i.p===0&&i.ch==null&&!['w_tide','a_coat','s_none','h_none','r_none'].includes(i.id)));
   // include drops from chapters < ch
   const drops=ITEMS.filter(i=>i.s===sl&&i.p===0&&EN.some(e=>DROP[e.id]===i.id&&e.ch<ch));const all=cands.concat(drops);let b=all[0];all.forEach(i=>{const v=x=>(x.st.atk||0)*3+(x.st.hp||0)/10+(x.st.def||0)*2+(x.st.blk||0)*5+(x.st.crit||0)+(x.st.pw||0)*100;if(v(i)>v(b))b=i;});if(b){S.eq[sl]=b.id;if(!S.inv.includes(b.id))S.inv.push(b.id);}});}
 function run(e){const chI=e.ch;loadout(chI);curNode={ch:chI,i:PATH[chI].indexOf(e.id)};newDuel(e.id);scene='fight';sceneT=2;let t=0,tgt=-1,nextAtk=0;
  while(!E.dead&&P.hp>0&&t<400){const dt=0.016;t+=dt;enemyUpdate(dt);P.dodge=Math.max(0,P.dodge-dt);P.swing=Math.max(0,P.swing-dt*4);
   if(!P.blocking){P.blockRegen+=dt;if(P.blockRegen>5&&P.blockDur<P.blockMax){P.blockDur++;P.blockRegen=0;}}
   if(E.state!=='windup')tgt=-1;
   if(E.state==='windup'){const rem=E.wind-E.windT,a=E.atk;
    if(a.unblock){if(rem<0.3&&P.dodge<=0&&Math.random()<sk*0.25)dodge(a.side==='L'?1:a.side==='R'?-1:(Math.random()<.5?1:-1));}
    else{if(E.windT<0.02||tgt<0)tgt=Math.random()*0.85-0.12;if(!(a.feint&&!E.feinted)&&rem<tgt){playerSwipe(Math.random()<sk?E.dir:(E.dir+1)%8);tgt=-9;}}}
   else if(E.state==='open'&&t-nextAtk>0.22){nextAtk=t;playerSwipe([0,1,7,0][Math.floor(Math.random()*4)]);}
   if(scene!=='fight')break;}
  return {won:E.dead,t,hp:Math.round(P.hp),max:P.max};}
 try{EN.forEach((e,i)=>{const r=run(e);n++;if(r.won)wins++;res.push(i+':'+e.id+'(ch'+(e.ch+1)+'):'+(r.won?'W':'L')+':'+r.t.toFixed(0)+'s:'+r.hp+'/'+r.max);});}catch(err){errs.push(err.stack);}
 document.body.innerHTML='<pre id=res>WINS '+wins+'/'+n+'\nERRS '+errs.length+'\n'+errs.join('\n')+'\n'+res.join('\n')+'</pre>';})();
