/* ============================================================
   KAMAL JEWELLERS — homepage
   Reads the same Studio content as always (/api/content), so every edit
   made in Studio shows up here. Sections with no content hide themselves.
   ============================================================ */
(function () {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const API = ((window.KAMAL_CONFIG || {}).API_BASE) || '/api';
const digits = s => String(s || '').replace(/[^0-9]/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// storefront.jpg-style relative paths in saved content are relative to the site root
const abs = u => (/^(https?:|\/)/.test(u) ? u : '/' + u);
const imgUrl = x => (x == null ? null : (typeof x === 'string' ? x : x.url || null));
const norm = u => (/^https?:\/\//.test(u || '') ? u : u ? 'https://' + u : '#');

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
    // index.html starts this request from <head>, before the stylesheet and scripts have run
    const early = API === '/api' && window.__kc;
    const j = await Promise.race([early || fetch(API + '/content?_=' + Date.now()).then(r => (r.ok ? r.json() : null)), sleep(3500).then(() => null)]);
    if (j && j.data) return merge(FALLBACK, j.data);
  } catch (e) { console.warn('content fetch failed — using built-in copy', e); }
  return FALLBACK;
}

let C = FALLBACK, links = [];

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
  const el = $('#sLive');
  el.hidden = !s;
  if (s) el.lastElementChild.textContent = s.label;
}

/* ---------- renderers ---------- */
function renderBasics() {
  const h = { eyebrow: 'Sadar Bazar, Delhi', title: 'Jewellery for', titleEm: 'every occasion.', sub: 'Discover handcrafted artificial jewellery for celebrations and everyday wear.' }, c = C.contact;
  const seo = C.seo || {};
  if (seo.title) { document.title = seo.title; $('#ogTitle').content = seo.title; }
  if (seo.description) { $('#metaDesc').content = seo.description; $('#ogDesc').content = seo.description; }
  const ld = { '@context': 'https://schema.org', '@type': 'JewelryStore', name: 'Kamal Jewellers', description: seo.description || '',
    image: 'https://kamaljewellers.shop/storefront.jpg', logo: 'https://kamaljewellers.shop/logo.png', url: 'https://kamaljewellers.shop', telephone: c.phone1 || '',
    address: { '@type': 'PostalAddress', streetAddress: (c.addressHtml || '').replace(/<br\s*\/?>/gi, ', '), addressLocality: 'Delhi', postalCode: '110006', addressCountry: 'IN' },
    sameAs: [norm(C.instagram)].filter(u => u && u !== '#') };
  if ((c.hours || '').trim()) ld.openingHours = c.hours.trim();
  $('#ldJson').textContent = JSON.stringify(ld);

  const active = nextFestival();
  if (active) {
    const [date, name, theme, picks] = active;
    $('#top').dataset.festival = theme;
    const label = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(date));
    Object.assign(h, { eyebrow: 'Festival jewellery · ' + label, titleEm: name + '.',
      sub: 'Discover ' + picks.toLowerCase() + ' for the celebration.' });
  }
  $('#hEyebrow').textContent = h.eyebrow || '';
  $('#hT1').textContent = h.title || '';
  $('#hT2').textContent = h.titleEm || '';
  $('#hSub').textContent = h.sub || '';

  const wa = waHref();
  ['navWa', 'menuWa', 'dkWa'].forEach(id => { const a = $('#' + id); if (a) a.href = wa; });
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

/* ---- catalogue grid ---- */
function renderCatalogue() {
  const grid = $('#catGrid');
  const eb = C.catalogueBox || {};
  if (eb.eyebrow) $('#catEyebrow').textContent = eb.eyebrow;
  if (eb.cta) $('#catAll').textContent = eb.cta;
  if (eb.url) $('#catAll').href = eb.url;
  grid.innerHTML = links.map(l => {
    const a = l.images[0], b = l.images[1];
    return `<a class="cc" href="${esc(norm(l.url))}" target="_blank" rel="noopener" data-track="catalogue:${esc(l.label)}">
      <div class="cc-in">${a ? `<img src="${esc(a)}" alt="${esc(l.label)}" loading="lazy" decoding="async" />` : ''}${b ? `<img src="${esc(b)}" alt="" loading="lazy" decoding="async" />` : ''}</div>
      <div class="cc-lab"><span>${esc(l.label)}</span><b aria-hidden="true">↗</b></div></a>`;
  }).join('');
}

/* ---- reel ---- */
function renderReel() {
  const v = C.videoSection || {}, yid = ytId(v.youtubeUrl);
  const reelUrl = /^https?:\/\//i.test(v.reelUrl || '') ? v.reelUrl : '';
  const hasFilm = !!(yid || v.youtubeClip);
  const hasReel = !!(v.reelClip || reelUrl);
  if (v.enabled === false || (!hasFilm && !hasReel)) return;

  const sec = $('#reel');
  const youtube = yid ? 'https://www.youtube.com/watch?v=' + yid : '';
  const thumbnail = yid ? 'https://i.ytimg.com/vi/' + yid + '/hqdefault.jpg' : '';
  const link = (url, label, channel) => url ? `<a class="video-link" href="${esc(url)}" target="_blank" rel="noopener" data-track="video:${channel}">${label} ↗</a>` : '';
  const player = (src, poster, title) => `<video src="${esc(src)}" ${poster ? `poster="${esc(poster)}"` : ''} aria-label="${esc(title)}" controls playsinline preload="metadata"></video>`;
  const filmTitle = v.youtubeCaption || 'Collection video';
  const reelTitle = v.reelCaption || 'Instagram reel';
  const film = hasFilm ? `<figure class="video-card">
    ${v.youtubeClip ? player(v.youtubeClip, thumbnail, filmTitle) :
      `<a class="yt" href="${youtube}" target="_blank" rel="noopener" data-track="video:youtube" aria-label="Watch the collection video on YouTube"><img src="${thumbnail}" alt="" loading="lazy" /><span class="pl" aria-hidden="true">▶</span></a>`}
    <figcaption><span>${esc(filmTitle)}</span>${link(youtube, 'YouTube', 'youtube')}</figcaption>
  </figure>` : '';
  const reel = hasReel ? `<figure class="video-card video-portrait">
    ${v.reelClip ? player(v.reelClip, v.reelThumb, reelTitle) :
      v.reelThumb ? `<a class="reel-thumb" href="${esc(reelUrl)}" target="_blank" rel="noopener" data-track="video:reel"><img src="${esc(v.reelThumb)}" alt="Watch the reel on Instagram" loading="lazy" /><span class="pl" aria-hidden="true">▶</span></a>` : ''}
    <figcaption><span>${esc(reelTitle)}</span>${link(reelUrl, 'Instagram', 'reel')}</figcaption>
  </figure>` : '';
  sec.innerHTML = `<div class="wrap"><h2 class="display" id="reelH">Videos</h2>
    <div class="video-grid${hasFilm && hasReel ? ' pair' : ''}">${film}${reel}</div></div>`;
  sec.hidden = false;
  $$('a[href="#reel"]').forEach(a => { a.hidden = false; });
  $$('video', sec).forEach(video => {
    video.addEventListener('play', () => window.kjTrack?.('tap', 'video:play'));
  });
}

function renderVisit() {
  const c = C.contact, rows = [];
  rows.push(['Address', c.addressHtml || '']);
  if ((c.hours || '').trim()) rows.push(['Hours', esc(c.hours.trim())]);
  const tel = p => `<a href="tel:${esc(p.replace(/[^0-9+]/g, ''))}">${esc(p)}</a>`;
  rows.push(['Call', [c.phone1, c.phone2].filter(Boolean).map(tel).join('<br>')]);
  if (c.whatsapp) rows.push(['WhatsApp', `<a href="${esc(waHref())}" target="_blank" rel="noopener" data-track="whatsapp">${esc(c.whatsapp)}</a>`]);
  if (c.instaLabel) rows.push(['Instagram', `<a href="${esc(norm(C.instagram) === '#' ? mapHref() : norm(C.instagram))}" target="_blank" rel="noopener">${esc(c.instaLabel)}</a>`]);
  $('#rows').innerHTML = rows.map(([k, v]) => `<div class="row"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
  $('#mapCard').href = mapHref();
}

/* ---- reviews ---- */
function renderReviews() {
  const list = (C.reviews || []).filter(r => r && r.t);
  if (!list.length) return;
  $('#reviews').hidden = false;
  $$('a[href="#reviews"]').forEach(a => { a.hidden = false; });
  let index = 0;
  function show(offset) {
    index = (index + offset + list.length) % list.length;
    const review = list[index];
    $('#quotes blockquote').textContent = review.t;
    $('#quotes figcaption').textContent = review.w || '';
  }
  $('.rev-ctl').hidden = list.length < 2;
  $('#rPrev').onclick = () => show(-1);
  $('#rNext').onclick = () => show(1);
  show(0);
}

/* ---------- enquiry + welcome popup ---------- */
function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); document.body.style.overflow = 'hidden'; }
function closeDlg(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
function wireDialogs() {
  const enq = $('#enq'), lead = $('#lead');
  $('#enqInt').innerHTML = '<option>General enquiry</option>' + links.map(l => `<option>${esc(l.label)}</option>`).join('') + '<option>Custom / bespoke piece</option>';
  $('#leadInt').innerHTML = '<option>Just browsing</option>' + links.map(l => `<option>${esc(l.label)}</option>`).join('') + '<option>Custom / bespoke piece</option>';
  [enq, lead].forEach(d => {
    d.addEventListener('close', () => { if (!$$('dialog[open]').length) { document.body.style.overflow = ''; } });
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
    const p = { name: f.name.value.trim(), phone: f.phone.value.trim(), interest: f.interest.value, message: f.message.value.trim() };
    if (!p.name || !p.phone || !p.message) { note.textContent = 'Please add your name, phone and a message.'; return; }
    btn.disabled = true; note.textContent = 'Sending…';
    try { await post(p); $('#enqForm').hidden = true; $('#enqDone').hidden = false; }
    catch (err) { console.warn(err); note.textContent = 'Could not send right now. Please call ' + (C.contact.phone1 || 'us') + '.'; btn.disabled = false; }
  });
  $('#leadF').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, note = $('#leadNote'), btn = $('#leadGo');
    const name = f.name.value.trim(), contact = f.contact.value.trim(), interest = f.interest.value;
    if (!name || !contact) { note.textContent = 'Please add your name and a phone number.'; return; }
    btn.disabled = true; note.textContent = 'Saving…';
    try {
      await post({ name, phone: contact, interest: 'Welcome popup · ' + interest,
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

document.addEventListener('click', e => {
  const t = e.target.closest('[data-track]'); if (t && window.kjTrack) window.kjTrack('tap', t.dataset.track);
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute('href').length > 1) {
    const el = $(a.getAttribute('href')); if (!el) return;
    document.body.classList.remove('menu-open'); $('#burger').setAttribute('aria-expanded', 'false');
  }
}, true);
$('#burger').addEventListener('click', () => {
  const o = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', o); $('#burger').setAttribute('aria-expanded', String(o));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { document.body.classList.remove('menu-open'); $('#burger').setAttribute('aria-expanded', 'false'); } });

/* ---------- boot ---------- */
(async function boot() {
  C = await load();
  links = ((C.linkTree && C.linkTree.links) || []).filter(l => l && l.label).map(l => ({ ...l, images: (l.images || []).filter(Boolean) }));
  const safe = f => { try { f(); } catch (e) { console.warn('section failed', f.name, e); } };
  [renderBasics, renderReel, renderCatalogue, renderSale, renderVisit, renderReviews, wireDialogs].forEach(safe);
  new IntersectionObserver(([entry]) => {
    $('#dock').classList.toggle('on', !entry.isIntersecting);
  }).observe($('#top'));
  maybeLead();
})();
})();
