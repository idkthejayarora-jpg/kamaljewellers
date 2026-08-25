/* ============================================================
   Kamal Jewellers — lightweight visit tracking
   Feeds Studio → Stats. Deliberately minimal:

   - No cookies, no ad networks, no third party. Data goes only to
     our own Worker.
   - The session id is random, lives in sessionStorage, and dies with
     the tab. It separates one visit from two; it cannot follow anyone
     around the web.
   - Location is never requested from the browser. Cloudflare already
     knows the city the request came from, so the server records that
     and no visitor ever sees a permission prompt.
   - Sent with sendBeacon so it never delays a tap or a page load, and
     every failure is swallowed — analytics must never break the site.
   ============================================================ */
(function () {
  var API = ((window.KAMAL_CONFIG || {}).API_BASE) || '/api';

  var sid;
  try {
    sid = sessionStorage.getItem('kj_sid');
    if (!sid) {
      sid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).slice(0, 36);
      sessionStorage.setItem('kj_sid', sid);
    }
  } catch (e) { sid = 'nostore'; }

  var device = matchMedia('(hover:none)').matches ? 'mobile' : 'desktop';

  function send(type, label) {
    var body = JSON.stringify({
      type: type,
      label: label || null,
      path: location.pathname,
      session: sid,
      device: device
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API + '/track', new Blob([body], { type: 'application/json' }));
      } else {
        fetch(API + '/track', {
          method: 'POST', body: body, keepalive: true,
          headers: { 'Content-Type': 'application/json' }
        }).catch(function () {});
      }
    } catch (e) { /* tracking must never throw into the page */ }
  }

  window.kjTrack = send;
  send('view');

  // One delegated listener rather than wiring every element, so new
  // buttons are covered automatically and nothing needs re-binding
  // when the page re-renders.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var open = t.closest('[data-open]');
    if (open) { send('tap', 'collection:' + open.dataset.open); return; }

    var tile = t.closest('#ltGrid .tile, .cat-box');
    if (tile) {
      var h = tile.querySelector('h4, h2');
      send('tap', 'catalogue:' + ((h && h.textContent.trim()) || 'box'));
      return;
    }

    if (t.closest('.vid-main')) { send('tap', 'video:youtube'); return; }
    if (t.closest('.vid-reel')) { send('tap', 'video:reel'); return; }
    if (t.closest('.wa-btn, .sm-wa')) { send('tap', 'whatsapp'); return; }
    if (t.closest('.enq-btn')) { send('tap', 'enquire'); return; }
    if (t.closest('.catalogue-pill')) { send('tap', 'catalogue-pill'); return; }
    if (t.closest('#menuList a')) {
      send('tap', 'menu:' + t.closest('a').textContent.trim().slice(0, 60));
      return;
    }
    if (t.closest('.sale-card')) { send('tap', 'sale-item'); return; }
  }, { passive: true, capture: true });
})();
