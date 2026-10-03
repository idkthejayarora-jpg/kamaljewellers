/* ============================================================
   KAMAL JEWELLERS — homepage
   Reads the same Studio content as always (/api/content), so every edit
   made in Studio shows up here. Sections with no content hide themselves.
   Motion is scroll-driven (one rAF loop) and deliberately quiet; all of it
   stands down for prefers-reduced-motion and Studio → Motion = Off.
   ============================================================ */
(function () {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const API = ((window.KAMAL_CONFIG || {}).API_BASE) || '/api';
let rm = matchMedia('(prefers-reduced-motion:reduce)').matches;   // also set when Studio → Motion is Off
let calm = false;                                                  // Studio → Motion: Calm = no smooth-scroll library
const touch = matchMedia('(hover:none)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const digits = s => String(s || '').replace(/[^0-9]/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// storefront.jpg-style relative paths in saved content are relative to the site root
const abs = u => (/^(https?:|\/)/.test(u) ? u : '/' + u);
const imgUrl = x => (x == null ? null : (typeof x === 'string' ? x : x.url || null));
const norm = u => (/^https?:\/\//.test(u || '') ? u : u ? 'https://' + u : '#');
if (rm) document.documentElement.classList.add('rm');

/* ---------- content ---------- */
const FALLBACK = {
  hero: { eyebrow: 'Est. in the heart of Old Delhi · since 20 years', title: 'Crafted with Elegance', titleEm: 'Backed by Trust.',
          sub: "From timeless traditions to modern trends, discover one of India's widest collections of handcrafted artificial jewellery, crafted for every style, every occasion, and every budget." },
  contact: { addressHtml: '132, Main Road, Sadar Bazar,<br/>Delhi — 110006', phone1: '+91 98119 07365', phone2: '+91 99999 25670',
             whatsapp: '+91 74285 26559', hours: '10 AM - 8 PM', instaLabel: '@jewellery_by_kamal', mapUrl: 'https://www.google.com/maps/search/Kamal+Jewellers+Sadar+Bazar+Delhi',
             footerBrand: "Where heritage craftsmanship meets the pieces everyone's saving on their feeds." },
  instagram: '', reviews: [], saleItems: [], saleHead: {}, linkTree: { links: [] }, storeImages: [], videoSection: {},
  catalogueBox: {}, leadPopup: { enabled: true, delaySec: 1, frequency: 'once' }, announcement: {}, seo: {}
};
function merge(base, over) {
  if (Array.isArray(over)) return over;
  if (over && typeof over === 'object') { const o = Object.assign({}, base); for (const k in over) o[k] = merge(base ? base[k] : undefined, over[k]); return o; }
  return over === undefined ? base : over;
}
async function load() {
  try {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(API + '/content?_=' + Date.now(), { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) { const { data } = await r.json(); if (data) return merge(FALLBACK, data); }
  } catch (e) { console.warn('content fetch failed — using built-in copy', e); }
  return FALLBACK;
}

let C = FALLBACK, links = [], lenis = null;

/* ---------- split words ---------- */
function split(el) {
  if (!el || el.dataset.sp) return;
  el.dataset.sp = '1';
  const ts = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) if (n.nodeValue.trim()) ts.push(n);
  ts.forEach(n => {
    const f = document.createDocumentFragment();
    n.nodeValue.split(/(\s+)/).forEach(p => {
      if (!p) return;
      if (/^\s+$/.test(p)) { f.append(p); return; }
      const w = document.createElement('span'), i = document.createElement('i');
      w.className = 'w'; i.textContent = p; w.append(i); f.append(w);
    });
    n.replaceWith(f);
  });
  let k = 0; $$('.w>i', el).forEach(i => i.style.setProperty('--i', k++));
  el.classList.add('split');
}

/* ---------- small helpers ---------- */
const waHref = msg => 'https://wa.me/' + (digits(C.contact.whatsapp) || digits(C.contact.phone1)) + '?text=' + encodeURIComponent(msg || 'Hi Kamal Jewellers, I have an enquiry.');
const mapHref = () => C.contact.mapUrl || 'https://www.google.com/maps/search/Kamal+Jewellers+Sadar+Bazar+Delhi';
function ytId(u) { const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : null; }
function shopStatus() {
  if (C.motion && C.motion.openNow === false) return null;
  const K = window.KJMotion; if (!K || !K.parseHours || !K.statusAt) return null;
  const h = K.parseHours(C.contact.hours); if (!h) return null;
  const n = K.shopNow(); return K.statusAt(h, n.day, n.mins);
}
function paintLive() {
  const s = shopStatus();
  [['#hLive', ' · Sadar Bazar'], ['#sLive', '']].forEach(([sel, tail]) => {
    const el = $(sel); if (!el) return;
    el.hidden = !s;
    if (s) { el.classList.toggle('closed', !s.open); el.lastElementChild.textContent = s.label + tail; }
  });
}

/* ---------- renderers ---------- */
function renderBasics() {
  const h = C.hero, c = C.contact;
  const seo = C.seo || {};
  if (seo.title) { document.title = seo.title; $('#ogTitle').content = seo.title; }
  if (seo.description) { $('#metaDesc').content = seo.description; $('#ogDesc').content = seo.description; }
  const ld = { '@context': 'https://schema.org', '@type': 'JewelryStore', name: 'Kamal Jewellers', description: seo.description || '',
    image: 'https://kamaljewellers.shop/storefront.jpg', logo: 'https://kamaljewellers.shop/logo.png', url: 'https://kamaljewellers.shop', telephone: c.phone1 || '',
    address: { '@type': 'PostalAddress', streetAddress: (c.addressHtml || '').replace(/<br\s*\/?>/gi, ', '), addressLocality: 'Delhi', postalCode: '110006', addressCountry: 'IN' },
    sameAs: [norm(C.instagram)].filter(u => u && u !== '#') };
  if ((c.hours || '').trim()) ld.openingHours = c.hours.trim();
  $('#ldJson').textContent = JSON.stringify(ld);

  $('#hEyebrow').textContent = h.eyebrow || '';
  $('#hT1').textContent = h.title || '';
  $('#hT2').textContent = h.titleEm || '';
  $('#hSub').textContent = h.sub || '';
  split($('#hTitle'));

  const wa = waHref();
  ['navWa', 'menuWa', 'heroWa', 'dkWa'].forEach(id => { const a = $('#' + id); if (a) a.href = wa; });
  $('#dkCall').href = 'tel:' + (c.phone1 || '').replace(/[^0-9+]/g, '');
  $('#dkMap').href = mapHref();

  // footer
  $('#fBrand').textContent = c.footerBrand || '';
  const tel = p => `<a href="tel:${esc(p.replace(/[^0-9+]/g, ''))}">${esc(p)}</a>`;
  $('#fPhones').innerHTML = [c.phone1, c.phone2].filter(Boolean).map(tel).join('') + (c.whatsapp ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp ${esc(c.whatsapp)}</a>` : '');
  $('#fAddr').innerHTML = c.addressHtml || '';
  $('#fHours').textContent = (c.hours || '').trim();
  const ig = $('#fInsta'); ig.href = norm(C.instagram) === '#' ? mapHref() : norm(C.instagram);
  ig.textContent = c.instaLabel || 'Instagram ↗';
  $('#yr').textContent = new Date().getFullYear();
  $('#enqPh').textContent = c.phone1 || '';

  const store = (C.storeImages || []).map(imgUrl).filter(Boolean);
  if (store[0]) $('#heroImg').src = abs(store[0]);

  // announcement bar (Studio → Settings)
  const a = C.announcement || {};
  if (a.enabled && a.text) { const el = $('#anno'); el.hidden = false; el.innerHTML = a.link ? `<a href="${esc(a.link)}">${esc(a.text)}</a>` : esc(a.text); }
  paintLive(); setInterval(paintLive, 60000);
}

function renderSale() {
  const items = (C.saleItems || []).filter(i => i && i.active !== false && (i.stock || 0) > 0);
  if (!items.length) return;
  const sec = $('#sale'); sec.hidden = false;
  const hd = C.saleHead || {};
  sec.innerHTML = `<div class="wrap"><p class="eyebrow" data-r>${esc(hd.eyebrow || 'Limited pieces · While stocks last')}</p>
    <h2 class="display" data-r>${esc(hd.title || 'Sale now on')}</h2></div>
    <div class="sale-row">${items.map(it => {
      const price = Math.round((it.originalPrice || 0) * (1 - (it.discountPct || 0) / 100));
      const im = imgUrl((it.images || [])[0]);
      return `<a class="sc" href="product.html?id=${encodeURIComponent(it.id)}" data-track="sale-item"><div class="ph" style="${im ? `background-image:url('${esc(abs(im))}')` : ''}"></div>${it.discountPct ? `<span class="off">${esc(it.discountPct)}% off</span>` : ''}
        <div class="bd"><div class="nm">${esc(it.name)}</div><div><s>₹${(it.originalPrice || 0).toLocaleString('en-IN')}</s> <b>₹${price.toLocaleString('en-IN')}</b></div></div></a>`;
    }).join('')}</div>`;
}

/* ---- pinned showcase ---- */
// barely-there warm tints, one per collection — the page colour shifts, it never changes mood
const TINTS = ['#171412', '#1B1613', '#191512', '#1D1814', '#18140F', '#1A1613', '#1C1713', '#161310'];
let SH = null;
function renderShowcase() {
  const items = links.filter(l => l.images.length).slice(0, 8);
  const sec = $('#showcase');
  if (rm || items.length < 2) { sec.hidden = true; return; }
  sec.hidden = false; sec.style.setProperty('--n', items.length);
  const pad = i => String(i + 1).padStart(2, '0'), total = pad(items.length - 1);
  sec.innerHTML = `<div class="show-pin" id="pin"><div class="show-bg" id="showBg"></div>
    <div class="show-grid">
      <div class="show-txt">
        <p class="eyebrow">The collections</p>
        <div class="tx-wrap">${items.map((l, i) => `<div class="tx${i ? '' : ' on'}" data-i="${i}">
          <div class="idx">${pad(i)} / ${total}</div><h3>${esc(l.label)}</h3>
          <p class="meta">${l.images.length} ${l.images.length === 1 ? 'look' : 'looks'} · see them on Instagram</p>
          <a class="btn solid" href="${esc(norm(l.url))}" target="_blank" rel="noopener" data-track="catalogue:${esc(l.label)}">Browse this collection</a></div>`).join('')}</div>
      </div>
      <div class="stage" aria-hidden="true">${items.map((l, i) => {
        const im = l.images;
        return `<div class="scene${i ? '' : ' on'}" data-i="${i}"><div class="pic"><img data-src="${esc(im[0])}" alt="" /></div>${im[1] ? `<div class="alt"><img data-src="${esc(im[1])}" alt="" /></div>` : ''}</div>`;
      }).join('')}</div>
      <ol class="show-dots">${items.map((l, i) => `<li><button type="button" data-go="${i}" class="${i ? '' : 'on'}" aria-label="Go to ${esc(l.label)}"></button></li>`).join('')}</ol>
    </div></div>`;
  $$('.tx h3', sec).forEach(split);
  SH = { sec, n: items.length, i: -1, pin: $('#pin'), bg: $('#showBg'), tx: $$('.tx', sec), sc: $$('.scene', sec), dots: $$('.show-dots button', sec) };
  $('.show-dots', sec).addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goScene(+b.dataset.go); });
  loadScene(0); loadScene(1); setScene(0);
}
function loadScene(i) {
  if (!SH || i < 0 || i >= SH.n) return;
  $$('img[data-src]', SH.sc[i]).forEach(im => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
}
function setScene(i) {
  if (!SH || i === SH.i) return;
  SH.i = i;
  SH.tx.forEach((t, k) => t.classList.toggle('on', k === i));
  SH.sc.forEach((s, k) => s.classList.toggle('on', k === i));
  SH.dots.forEach((d, k) => d.classList.toggle('on', k === i));
  SH.bg.style.setProperty('--tint', TINTS[i % TINTS.length]);
  SH.pin.style.setProperty('--tint', TINTS[i % TINTS.length]);   // the secondary photo's matte follows the page colour
  loadScene(i); loadScene(i + 1);
}
function goScene(i) {
  const r = SH.sec.getBoundingClientRect(), top = r.top + scrollY + ((i + .5) / SH.n) * (SH.sec.offsetHeight - innerHeight);
  lenis ? lenis.scrollTo(top, { duration: 1.4 }) : window.scrollTo({ top, behavior: 'smooth' });
}

/* ---- catalogue grid ---- */
function renderCatalogue() {
  const grid = $('#catGrid');
  const eb = C.catalogueBox || {};
  if (eb.eyebrow) $('#catEyebrow').textContent = eb.eyebrow;
  if (eb.cta) $('#catAll').textContent = eb.cta;
  if (eb.url) $('#catAll').href = eb.url;
  const pad = i => String(i + 1).padStart(2, '0');
  grid.innerHTML = links.map((l, i) => {
    const a = l.images[0], b = l.images[1];
    return `<a class="cc" href="${esc(norm(l.url))}" target="_blank" rel="noopener" data-r style="--d:${(i % 4) * 80}ms" data-track="catalogue:${esc(l.label)}">
      <div class="cc-in">${a ? `<img src="${esc(a)}" alt="${esc(l.label)}" loading="lazy" decoding="async" />` : ''}${b ? `<img src="${esc(b)}" alt="" loading="lazy" decoding="async" />` : ''}</div>
      <div class="cc-lab"><small>${pad(i)}</small><span>${esc(l.label)}</span><b aria-hidden="true">↗</b></div></a>`;
  }).join('') + `<a class="cc all" href="${esc($('#catAll').getAttribute('href'))}" data-r data-track="catalogue-pill"><div class="cc-in"><span class="t">See the full catalogue</span><span class="btn">Open</span></div></a>`;
  split($('#catTitle'));
}

/* ---- reel ---- */
function renderReel() {
  const v = C.videoSection || {}, yid = ytId(v.youtubeUrl);
  const hasReel = !!(v.reelClip || v.reelThumb || v.reelUrl);
  const sec = $('#reel');
  if (v.enabled === false || (!yid && !hasReel)) { $('#navReel').hidden = true; return; }
  sec.hidden = false;
  const screen = v.reelClip ? `<video src="${esc(v.reelClip)}" muted loop playsinline preload="none" disablepictureinpicture></video>`
    : v.reelThumb ? `<img src="${esc(v.reelThumb)}" alt="" loading="lazy" />`
    : `<div class="ph-ph"><img src="/logo.png" alt="" />Instagram reel</div>`;
  sec.innerHTML = `<div class="wrap reel-in">
    <div class="reel-txt">
      <p class="eyebrow" data-r>${esc(v.eyebrow || 'On screen')}</p>
      <h2 class="display" id="reelH">${esc(v.title || 'Latest from the studio')}</h2>
      ${v.reelCaption ? `<p class="cap" data-r>${esc(v.reelCaption)}</p>` : ''}
      ${v.reelUrl ? `<a class="btn solid" data-r href="${esc(v.reelUrl)}" target="_blank" rel="noopener" data-track="video:reel">Watch the reel</a>` : ''}
      ${yid ? `<a class="yt" data-r href="https://www.youtube.com/watch?v=${esc(yid)}" target="_blank" rel="noopener" data-track="video:youtube"><img src="https://i.ytimg.com/vi/${esc(yid)}/hqdefault.jpg" alt="" loading="lazy" /><span class="pl"></span><span class="t">${esc(v.youtubeCaption || 'Watch the film')}</span></a>` : ''}
    </div>
    ${hasReel ? `<div class="stagephone"><div class="phone" id="phone"><div class="scr">${screen}</div></div></div>` : ''}</div>`;
  split($('#reelH'));
  const vid = $('video', sec);
  if (vid) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { vid.play().catch(() => {}); } else vid.pause(); }), { threshold: .3 }).observe(vid);
}

/* ---- the shop, as a film ---- */
// A pinned widescreen frame: the camera tilts up the facade, then pans through the
// interiors, with dissolves, subtitles drawn from the real address/hours/phone, grain
// and a vignette. Scroll scrubs it; reduced-motion gets one still frame.
let CN = null;
const CAM = [{ y: 1 }, { x: 1, y: .25 }, { x: -1, y: -.2 }, { x: 1, y: .3 }, { x: -1 }];   // per shot: which way the camera drifts
function renderCine() {
  const c = C.contact, rows = [];
  rows.push(['Address', c.addressHtml || '']);
  if ((c.hours || '').trim()) rows.push(['Hours', esc(c.hours.trim())]);
  const tel = p => `<a href="tel:${esc(p.replace(/[^0-9+]/g, ''))}">${esc(p)}</a>`;
  rows.push(['Call', [c.phone1, c.phone2].filter(Boolean).map(tel).join('<br>')]);
  if (c.whatsapp) rows.push(['WhatsApp', `<a href="${esc(waHref())}" target="_blank" rel="noopener" data-track="whatsapp">${esc(c.whatsapp)}</a>`]);
  if (c.instaLabel) rows.push(['Instagram', `<a href="${esc(norm(C.instagram) === '#' ? mapHref() : norm(C.instagram))}" target="_blank" rel="noopener">${esc(c.instaLabel)}</a>`]);
  $('#rows').innerHTML = rows.map(([k, v]) => `<div class="row"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
  $('#mapCard').href = mapHref();
  split($('#cineTitle h2'));

  const imgs = (C.storeImages || []).filter(i => imgUrl(i)).slice(0, 5);
  const list = imgs.length ? imgs : [{ url: '/storefront.jpg', focal: { x: 50, y: 20 } }];
  const film = $('#cineFilm'), sec = $('#visit');
  film.style.setProperty('--n', list.length);
  const addr = (c.addressHtml || '').split(/<br\s*\/?>/i)[0].replace(/<[^>]+>/g, '').replace(/[,\s]+$/, '');
  const pool = [addr, (c.hours || '').trim() && 'Open ' + c.hours.trim(), c.phone1 && 'Call ' + c.phone1, 'Come in'].filter(Boolean);
  $('#cineShots').innerHTML = list.map((im, i) => `<div class="shot"><img src="${esc(abs(imgUrl(im)))}" alt="${i ? '' : 'The Kamal Jewellers shopfront on Main Road, Sadar Bazar'}" decoding="async" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} /></div>`).join('');
  $('#cineSubs').innerHTML = list.map((im, i) => `<span>${esc(im.caption || (i ? pool[(i - 1) % pool.length] : ''))}</span>`).join('');
  if (rm) return;
  CN = { sec, film, n: list.length, shots: $$('.shot', film), subs: $$('#cineSubs span'), frame: $('#cineFrame'), title: $('#cineTitle'), count: $('#cineCount'), k: -1, dim: [] };
  CN.shots.forEach((el, i) => {
    const im = $('img', el);
    el.style.setProperty('--o', i ? 0 : 1);
    const go = () => layoutShot(i);
    im.complete && im.naturalWidth ? go() : im.addEventListener('load', go, { once: true });
  });
  addEventListener('resize', () => CN && CN.shots.forEach((_, i) => layoutShot(i)), { passive: true });
}
// size each photo to cover the frame with overscan, remember how far the camera may travel
function layoutShot(i) {
  const im = $('img', CN.shots[i]); if (!im.naturalWidth) return;
  const fw = CN.frame.clientWidth, fh = CN.frame.clientHeight;
  const sc = Math.max(fw / im.naturalWidth, fh / im.naturalHeight) * 1.14, w = im.naturalWidth * sc, h = im.naturalHeight * sc;
  im.style.width = w + 'px'; im.style.height = h + 'px';
  CN.dim[i] = { sx: (w - fw) / 2, sy: (h - fh) / 2 };
  CN.sec.classList.add('cam');
  tick();   // photos load lazily — re-run the scrub so camera and subtitles never wait for the next scroll
}
function scrubCine(vh) {
  if (!CN) return;
  const r = CN.film.getBoundingClientRect();
  if (r.bottom < -vh || r.top > vh * 2) return;
  const total = CN.film.offsetHeight - vh, P = clamp(-r.top / total), t = P * CN.n, OV = .2;
  CN.shots.forEach((el, i) => {
    const a = Math.abs(t - (i + .5));
    let o = clamp((.5 + OV - a) / (2 * OV));
    if (i === 0 && t < .5) o = 1; if (i === CN.n - 1 && t > CN.n - .5) o = 1;   // hold the first and last frame
    el.style.setProperty('--o', o.toFixed(3));
    CN.subs[i].style.opacity = clamp((.42 - a) / .12).toFixed(2);
    const d = CN.dim[i], mv = CAM[i % CAM.length]; if (!d) return;
    const lp = clamp((t - (i - OV)) / (1 + 2 * OV)) * 2 - 1;      // -1 → 1 across the shot
    el.style.setProperty('--tx', ((mv.x || 0) * lp * d.sx).toFixed(1) + 'px');
    el.style.setProperty('--ty', ((mv.y || 0) * lp * d.sy).toFixed(1) + 'px');
  });
  CN.title.style.setProperty('--to', clamp(1 - (P - .12) / .26).toFixed(3));
  CN.frame.style.setProperty('--pp', P.toFixed(3));
  const k = Math.min(CN.n - 1, Math.floor(t));
  if (k !== CN.k) { CN.k = k; CN.count.textContent = 'Shot ' + String(k + 1).padStart(2, '0') + ' / ' + String(CN.n).padStart(2, '0'); }
}

/* ---- reviews ---- */
let ri = 0, rn = 0, rt = 0, rView = false;
function renderReviews() {
  const list = (C.reviews || []).filter(r => r && r.t);
  if (!list.length) { $('#navRev').hidden = true; return; }
  rn = list.length; $('#reviews').hidden = false;
  $('#quotes').innerHTML = list.map((r, i) => `<figure class="rq${i ? '' : ' on'}"><blockquote>${esc(r.t)}</blockquote><figcaption>${esc(r.w || '')}</figcaption></figure>`).join('');
  $$('.rq blockquote').forEach(split);
  if (rn < 2) $('.rev-ctl').hidden = true;
  $('#rPrev').onclick = () => setReview(ri - 1);
  $('#rNext').onclick = () => setReview(ri + 1);
  const q = $('#quotes');
  q.addEventListener('pointerenter', () => { clearTimeout(rt); $('#rBar').classList.remove('run'); });
  q.addEventListener('pointerleave', () => setReview(ri));
  new IntersectionObserver(es => es.forEach(e => { rView = e.isIntersecting; rView ? setReview(ri) : clearTimeout(rt); }), { threshold: .4 }).observe($('#reviews'));
}
function setReview(i) {
  if (!rn) return;
  ri = (i + rn) % rn;
  $$('.rq').forEach((q, k) => q.classList.toggle('on', k === ri));
  const bar = $('#rBar'); bar.classList.remove('run'); void bar.offsetWidth;
  clearTimeout(rt);
  if (!rm && rn > 1 && rView) { bar.classList.add('run'); rt = setTimeout(() => setReview(ri + 1), 7000); }
}

/* ---------- enquiry + welcome popup ---------- */
function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); }
function closeDlg(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
function wireDialogs() {
  const enq = $('#enq'), lead = $('#lead');
  $('#enqInt').innerHTML = '<option>General enquiry</option>' + links.map(l => `<option>${esc(l.label)}</option>`).join('') + '<option>Custom / bespoke piece</option>';
  $('#leadInt').innerHTML = '<option>Just browsing</option>' + links.map(l => `<option>${esc(l.label)}</option>`).join('') + '<option>Custom / bespoke piece</option>';
  [enq, lead].forEach(d => {
    d.addEventListener('close', () => { if (!$$('dialog[open]').length) { document.body.style.overflow = ''; if (lenis) lenis.start(); } });
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) closeDlg(d); });
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-enq]')) { document.body.classList.remove('menu-open'); openDlg(enq); } });
  async function post(payload) {
    const r = await fetch(API + '/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || r.statusText); }
  }
  $('#enqF').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, note = $('#enqNote'), btn = $('#enqGo');
    const p = { name: f.name.value.trim(), phone: f.phone.value.trim(), email: null, interest: f.interest.value, message: f.message.value.trim() };
    if (!p.name || !p.phone || !p.message) { note.textContent = 'Please add your name, phone and a message.'; return; }
    btn.disabled = true; note.textContent = 'Sending…';
    try { await post(p); $('#enqForm').hidden = true; $('#enqDone').hidden = false; }
    catch (err) { console.warn(err); note.textContent = 'Could not send right now. Please call ' + (C.contact.phone1 || 'us') + '.'; btn.disabled = false; }
  });
  $('#leadF').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, note = $('#leadNote'), btn = $('#leadGo');
    const name = f.name.value.trim(), contact = f.contact.value.trim(), interest = f.interest.value;
    if (!name || !contact) { note.textContent = 'Please add your name and an email or phone.'; return; }
    btn.disabled = true; note.textContent = 'Saving…';
    try {
      await post({ name, phone: contact, email: /@/.test(contact) ? contact : null, interest: 'Welcome popup · ' + interest,
                   message: `New lead from the welcome popup. Looking for: ${interest}. Reach them at: ${contact}.` });
      try { localStorage.setItem('kj_lead_done', '1'); } catch (x) {}
      $('#leadForm').hidden = true; $('#leadDone').hidden = false; setTimeout(() => closeDlg(lead), 2200);
    } catch (err) { console.warn(err); note.textContent = 'Could not save right now. Please try again.'; btn.disabled = false; }
  });
}
// same frequency rules as before: once | day | week | session | always
function maybeLead() {
  const cfg = C.leadPopup || {}; if (cfg.enabled === false) return;
  const freq = cfg.frequency || 'once';
  try {
    if (localStorage.getItem('kj_lead_done') === '1') return;
    if (freq === 'session' && sessionStorage.getItem('kj_lead_seen') === '1') return;
    if (freq === 'day' || freq === 'week') { const last = +localStorage.getItem('kj_lead_ts') || 0; if (Date.now() - last < (freq === 'week' ? 7 : 1) * 864e5) return; }
  } catch (e) {}
  setTimeout(() => {
    if ($$('dialog[open]').length) return;
    if (cfg.eyebrow) $('#leadEy').textContent = cfg.eyebrow;
    if (cfg.heading) $('#leadH').textContent = cfg.heading;
    if (cfg.intro) $('#leadIntro').textContent = cfg.intro;
    if (cfg.btnLabel) $('#leadGo').textContent = cfg.btnLabel;
    openDlg($('#lead'));
    try { if (freq === 'session') sessionStorage.setItem('kj_lead_seen', '1'); else if (freq === 'once') localStorage.setItem('kj_lead_done', '1'); else if (freq !== 'always') localStorage.setItem('kj_lead_ts', String(Date.now())); } catch (e) {}
  }, Math.max(0, (cfg.delaySec != null ? cfg.delaySec : 1) * 1000) + 600);
}

/* ---------- scroll engine: one rAF loop ---------- */
let lastY = 0, ticking = false, annoH = 0;
const nav = $('#nav'), prog = $('#prog'), dock = $('#dock');
function frame() {
  ticking = false;
  const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
  prog.style.transform = `scaleX(${max > 0 ? clamp(y / max).toFixed(4) : 0})`;
  nav.classList.toggle('solid', y > 40);
  nav.classList.toggle('hide', y > lastY + 4 && y > 240 && !document.body.classList.contains('menu-open'));
  if (y < lastY - 4) nav.classList.remove('hide');
  nav.style.top = Math.max(0, annoH - y) + 'px';
  lastY = y;
  dock.classList.toggle('on', y > vh * .6);

  if (y < vh * 1.3) $('#heroArt').style.setProperty('--sy', (y / vh).toFixed(3));

  if (SH) {
    const r = SH.sec.getBoundingClientRect();
    if (r.bottom > -vh && r.top < vh * 2) {
      const total = SH.sec.offsetHeight - vh, p = clamp(-r.top / total), f = p * SH.n;
      const i = Math.min(SH.n - 1, Math.floor(f));
      SH.pin.style.setProperty('--lp', (f - i).toFixed(3));
      setScene(i);
    }
  }
  const phone = $('#phone');
  if (phone) { const r = $('#reel').getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) phone.style.setProperty('--rp', clamp((vh - r.top) / (vh + r.height)).toFixed(3)); }
  scrubCine(vh);
}
const tick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', tick, { passive: true });
addEventListener('resize', tick, { passive: true });

/* ---------- reveals, anchors, menu, tracking ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
function watch() {
  $$('[data-r],.split').forEach(el => {
    if (el.dataset.w || el.closest('.hero') || el.closest('.tx') || el.closest('.rq')) return;
    el.dataset.w = '1'; io.observe(el);
  });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-track]'); if (t && window.kjTrack) window.kjTrack('tap', t.dataset.track);
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute('href').length > 1) {
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); document.body.classList.remove('menu-open'); $('#burger').setAttribute('aria-expanded', 'false');
    lenis ? lenis.scrollTo(el, { offset: -56, duration: 1.4 }) : el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
  }
}, true);
$('#burger').addEventListener('click', () => {
  const o = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', o); $('#burger').setAttribute('aria-expanded', String(o));
  nav.classList.remove('hide');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { document.body.classList.remove('menu-open'); $('#burger').setAttribute('aria-expanded', 'false'); } });

function initLenis() {
  if (touch || rm || calm) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
  s.onload = () => {
    lenis = new Lenis({ duration: 1.35, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  };
  document.head.appendChild(s);
}

/* ---------- intro: the mark, then the page ---------- */
function lit() {
  $$('.hero [data-r]').forEach(el => el.classList.add('in'));
  $('#hTitle').classList.add('in');
}
function intro() {
  const sh = $('#shutter');
  let seen = null; try { seen = sessionStorage.getItem('kn_intro'); } catch (e) {}
  const done = () => { sh.remove(); document.body.classList.remove('is-loading'); maybeLead(); tick(); };
  if (rm || seen) { lit(); done(); return; }
  try { sessionStorage.setItem('kn_intro', '1'); } catch (e) {}
  sh.classList.add('up');
  setTimeout(lit, 350);
  setTimeout(done, 1500);
}

/* ---------- boot ---------- */
(async function boot() {
  const t0 = performance.now();
  C = await load();
  links = ((C.linkTree && C.linkTree.links) || []).filter(l => l && l.label).map(l => ({ ...l, images: (l.images || []).filter(Boolean) }));
  annoH = (C.announcement && C.announcement.enabled && C.announcement.text) ? 38 : 0;
  const ml = (C.motion && C.motion.level) || 'full';
  if (ml === 'off' && !rm) { rm = true; document.documentElement.classList.add('rm'); }
  calm = ml === 'calm';
  const safe = f => { try { f(); } catch (e) { console.warn('section failed', f.name, e); } };
  [renderBasics, renderSale, renderShowcase, renderCatalogue, renderReel, renderCine, renderReviews, wireDialogs].forEach(safe);
  watch(); initLenis(); tick();
  await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), sleep(2000)]);
  await sleep(Math.max(0, 900 - (performance.now() - t0)));
  intro();
})();
})();
