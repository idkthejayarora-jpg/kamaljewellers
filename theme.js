/* ============================================================
   Theme — white gold (default) ⇄ black gold
   ------------------------------------------------------------
   Loaded SYNCHRONOUSLY from <head>, before the stylesheet paints. That is
   the whole reason this isn't deferred: the stored theme has to land on
   <html> in the same tick the document starts rendering, or a dark-mode
   visitor gets a white flash on every single navigation.

   White gold is the default, so light is represented by the ABSENCE of the
   attribute. Nothing to set, nothing to get wrong on a first visit.

   Deliberately does NOT follow prefers-color-scheme. The owner asked for
   white by default; honouring the OS would hand roughly half of all
   visitors a dark site that was never chosen.
   ============================================================ */
(function () {
  var KEY = 'kj-theme';
  var root = document.documentElement;

  function stored() {
    // Private browsing and blocked site-data both throw on access rather
    // than returning null, so this can't be a bare read.
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    // Browser chrome (iOS status bar, Android address bar) should match the
    // page, otherwise the site reads as floating in someone else's colour.
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', theme === 'dark' ? '#0a0807' : '#faf7f1');

    var sw = document.querySelectorAll('.theme-sw');
    for (var i = 0; i < sw.length; i++) {
      sw[i].setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      sw[i].setAttribute('aria-label', theme === 'dark' ? 'Dark mode' : 'Light mode');
    }

    // The WebGL hero paints its own palette and can't see CSS, so it gets told.
    try {
      window.dispatchEvent(new CustomEvent('kj:theme', { detail: { theme: theme } }));
    } catch (e) {}
  }

  // Run immediately — before first paint.
  var current = stored() === 'dark' ? 'dark' : 'light';
  apply(current);

  var KJTheme = {
    get: function () { return current; },
    set: function (theme) {
      current = theme === 'dark' ? 'dark' : 'light';
      apply(current);
      try { localStorage.setItem(KEY, current); } catch (e) {}
    },
    toggle: function () { KJTheme.set(current === 'dark' ? 'light' : 'dark'); }
  };
  window.KJTheme = KJTheme;

  function wire() {
    // re-apply: the switches and the meta tag don't exist at head time
    apply(current);
    var sw = document.querySelectorAll('.theme-sw');
    for (var i = 0; i < sw.length; i++) {
      sw[i].addEventListener('click', function (e) {
        e.preventDefault();
        KJTheme.toggle();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
