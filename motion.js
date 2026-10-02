/* KJMotion — luxe, restrained motion for the public site (Studio never loads it).
   Split-word headings, cursor glints, soft drift, collection ribbon, scroll
   hairline, and the living storefront (Ken Burns, sheen, autoplay, "open now").

   Studio → Motion writes C.motion { level: full|calm|off, ribbon, openNow }.
   apply(C) runs from buildAll — TWICE per load (defaults, then saved content) —
   so everything below is idempotent. Text inside gradient-clipped <em>s is never
   split: transforming a child of a background-clip:text parent makes it vanish,
   so an <em> animates as one unit instead. */
(function(){
'use strict';
/* ---------- opening hours → live status (pure; see motion.test.js) ---------- */
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const to24=(h,m,ap)=>((+h%12)+(/pm/i.test(ap)?12:0))*60+(+m||0);
const fmt=m=>{ const h=Math.floor(m/60), mm=m%60; return ((h%12)||12)+(mm?':'+String(mm).padStart(2,'0'):'')+(h<12?' AM':' PM'); };
// "Mon – Sat · 11 AM – 8 PM" → {days:[1..6], open, close}; null when it can't be read.
function parseHours(txt){
  const t=String(txt||'');
  const tm=t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–—-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if(!tm) return null;
  const open=to24(tm[1],tm[2],tm[3]), close=to24(tm[4],tm[5],tm[6]);
  let days=[0,1,2,3,4,5,6];
  const dm=t.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*[–—-]\s*(mon|tue|wed|thu|fri|sat|sun)/i);
  if(dm){ const a=DAYS.indexOf(dm[1].toLowerCase()), b=DAYS.indexOf(dm[2].toLowerCase()); days=[]; for(let d=a;;d=(d+1)%7){ days.push(d); if(d===b) break; } }
  // no days written (e.g. "10 AM - 8 PM") = every day; closing a day means saying so ("Mon – Sat")
  return close>open ? {days,open,close} : null;
}
// day = 0..6, mins = minutes since midnight, in the shop's clock (IST).
function statusAt(h,day,mins){
  if(h.days.includes(day) && mins>=h.open && mins<h.close) return {open:true,label:'Open now · till '+fmt(h.close)};
  for(let o=0;o<8;o++){
    const d=(day+o)%7;
    if(h.days.includes(d) && (o>0||mins<h.open)) return {open:false,label:'Opens '+(o===0?'today':o===1?'tomorrow':DAYS[d][0].toUpperCase()+DAYS[d].slice(1))+' · '+fmt(h.open)};
  }
  return null;
}
function shopNow(){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  return {day:DAYS.indexOf(p.weekday.toLowerCase()),mins:(+p.hour%24)*60+ +p.minute};
}

if(typeof document==='undefined'){ module.exports={parseHours,statusAt}; return; }   // node: motion.test.js

const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const touch=matchMedia('(hover:none)').matches;
const weak=(navigator.deviceMemory||8)<=2||(navigator.hardwareConcurrency||8)<=2;

const HEADINGS='.hero h1,.vid-head h2,#saleTitle,#catTitle,.visit h3,.reviews h3';
const GLINT='.tile,.vid-card,.cat-box,.store-card';
const DRIFT={'.tile':[34,12,52,22],'.vid-card':[24],'.cat-box':[18],'.map-card':[34],'.store-slide img':[-30]};

let cfg={level:'full',ribbon:true,openNow:true}, CC={}, lvl='full';

/* ---------- headings: split words, mask-rise ---------- */
const spIO=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('sp-in'); spIO.unobserve(e.target); } }),{threshold:.35});
function split(host){
  const texts=[], walk=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
  for(let n;(n=walk.nextNode());){
    const el=n.parentElement;
    if(n.nodeValue.trim() && !el.closest('.w') && !el.closest('em')) texts.push(n);
  }
  texts.forEach(n=>{
    const f=document.createDocumentFragment();
    n.nodeValue.split(/(\s+)/).forEach(p=>{
      if(!p) return;
      if(/^\s+$/.test(p)){ f.appendChild(document.createTextNode(p)); return; }
      const w=document.createElement('span'), i=document.createElement('i');
      w.className='w'; i.textContent=p; w.appendChild(i); f.appendChild(w);
    });
    n.replaceWith(f);
  });
  host.querySelectorAll('em').forEach(e=>e.classList.add('sp-unit'));
  let k=0; host.querySelectorAll('.w>i,em.sp-unit').forEach(e=>e.style.setProperty('--i',k++));
  host.classList.add('sp');
  if(!host.closest('.hero')) spIO.observe(host);   // hero waits for boot's .reveal.in instead
}

/* ---------- drift (scroll-linked depth) — `translate`, so hover transforms survive ---------- */
const near=new Set();
const dIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting) near.add(e.target); else { near.delete(e.target); e.target.style.translate=''; }
}),{rootMargin:'40% 0px'});

/* ---------- ribbon ---------- */
function ribbon(){
  const rb=document.getElementById('ribbon'), tr=document.getElementById('rbTrack');
  if(!rb||!tr) return;
  let names=(CC.collections||[]).map(c=>c.name).filter(Boolean);
  if(!names.length) names=String(cfg.ribbonWords||'').split(',').map(w=>w.trim()).filter(Boolean);   // no collections → Studio's ribbon words
  const on=lvl==='full' && cfg.ribbon!==false && names.length;
  rb.hidden=!on;
  if(!on){ tr.innerHTML=''; return; }
  const one=names.map(n=>`<span>${n.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</span><b></b>`).join('');
  tr.innerHTML=one+one;   // two copies → translateX(-50%) loops seamlessly
}

/* ---------- storefront ---------- */
let pillT=0, autoT=0;
function openPill(){
  const card=document.getElementById('storeCard'); if(!card) return;
  let pill=document.getElementById('openPill');
  const h=cfg.openNow!==false && lvl!=='off' ? parseHours(CC.contact&&CC.contact.hours) : null;
  if(!h){ if(pill) pill.remove(); clearInterval(pillT); return; }
  if(!pill){ pill=document.createElement('div'); pill.id='openPill'; pill.className='open-pill'; pill.innerHTML='<i></i><span></span>'; card.appendChild(pill); }
  const paint=()=>{ const s=statusAt(h,shopNow().day,shopNow().mins); pill.hidden=!s; if(s){ pill.classList.toggle('closed',!s.open); pill.lastChild.textContent=s.label; } };
  paint(); clearInterval(pillT); pillT=setInterval(paint,60000);
}
let paused=0, inView=false;
const cardIO=new IntersectionObserver(es=>es.forEach(e=>{ inView=e.isIntersecting; }),{threshold:.3});
function autoplay(){
  clearInterval(autoT);
  const card=document.getElementById('storeCard'), track=document.getElementById('storeTrack');
  if(!card||!track||lvl!=='full') return;
  cardIO.observe(card);
  if(!card.dataset.auto){
    card.dataset.auto='1';
    const hold=()=>{ paused=Date.now()+9000; };
    ['pointerdown','pointerenter','focusin','wheel'].forEach(ev=>card.addEventListener(ev,hold,{passive:true}));
  }
  autoT=setInterval(()=>{
    const n=track.children.length;
    if(n<2||!inView||document.hidden||Date.now()<paused) return;
    const w=track.firstElementChild.offsetWidth||1, i=Math.round(track.scrollLeft/w);
    track.scrollTo({left:i>=n-1?0:(i+1)*w,behavior:'smooth'});
  },5200);
}

/* ---------- glints ---------- */
function decorate(){
  document.querySelectorAll(GLINT).forEach(c=>{
    if(c.dataset.glint) return;
    c.dataset.glint='1';
    const g=document.createElement('i'); g.className='glint-fx'; g.setAttribute('aria-hidden','true'); c.appendChild(g);
  });
  for(const sel in DRIFT){
    const amps=DRIFT[sel];
    document.querySelectorAll(sel).forEach((el,i)=>{
      if(el.dataset.drift) return;
      el.dataset.drift=amps[i%amps.length]; dIO.observe(el);
    });
  }
}

/* ---------- one scroll frame: progress hairline + drift ---------- */
let bar, raf=0;
function frame(){
  raf=0;
  const max=root.scrollHeight-innerHeight;
  if(bar) bar.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;
  if(lvl!=='full'||touch) return;
  const vh=innerHeight, hits=[...near].map(el=>[el,el.getBoundingClientRect()]);
  for(const [el,r] of hits){
    const off=Math.max(-1,Math.min(1,((r.top+r.height/2)-vh/2)/vh));
    el.style.translate=`0 ${(-off*el.dataset.drift).toFixed(1)}px`;
  }
}

/* ---------- pointer: card glints + hero parallax ---------- */
let gEl=null, hx=0,hy=0,tx=0,ty=0,hraf=0;
function heroStep(){
  hx+=(tx-hx)*.07; hy+=(ty-hy)*.07;
  const h=document.querySelector('.hero');
  if(h){ h.querySelector('h1').style.translate=`${(-hx*16).toFixed(1)}px ${(-hy*9).toFixed(1)}px`;
         const s=h.querySelector('.sub'); if(s) s.style.translate=`${(-hx*7).toFixed(1)}px ${(-hy*4).toFixed(1)}px`; }
  hraf=(Math.abs(tx-hx)>.002||Math.abs(ty-hy)>.002)?requestAnimationFrame(heroStep):0;
}
function onPointer(e){
  if(lvl!=='full'||touch||e.pointerType==='touch') return;
  const c=e.target.closest&&e.target.closest('[data-glint]');
  if(gEl&&gEl!==c) gEl.style.setProperty('--go',0);
  gEl=c||null;
  if(c){ const r=c.getBoundingClientRect();
    c.style.setProperty('--gx',(e.clientX-r.left)+'px'); c.style.setProperty('--gy',(e.clientY-r.top)+'px'); c.style.setProperty('--go',1); }
  if(scrollY<innerHeight){ tx=e.clientX/innerWidth-.5; ty=e.clientY/innerHeight-.5; if(!hraf) hraf=requestAnimationFrame(heroStep); }
}

/* ---------- public ---------- */
function apply(C){
  CC=C||CC;
  cfg=Object.assign({level:'full',ribbon:true,openNow:true},CC.motion);
  lvl=(reduce||cfg.level==='off') ? 'off' : (cfg.level==='calm'||weak) ? 'calm' : 'full';
  root.dataset.motion=lvl;
  if(!bar){
    bar=document.createElement('div'); bar.className='kj-progress'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
    addEventListener('scroll',()=>{ if(!raf) raf=requestAnimationFrame(frame); },{passive:true});
    addEventListener('resize',()=>{ if(!raf) raf=requestAnimationFrame(frame); },{passive:true});
    addEventListener('pointermove',onPointer,{passive:true});
  }
  openPill();
  if(lvl==='off'){ clearInterval(autoT); return; }
  document.querySelectorAll(HEADINGS).forEach(split);
  decorate(); ribbon(); autoplay(); frame();
}

window.KJMotion={apply,split,parseHours,statusAt,shopNow};   // split + parseHours: Studio's Motion panel; statusAt/shopNow: next/
})();
