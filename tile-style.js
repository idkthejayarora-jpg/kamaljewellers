/* ============================================================
   Tile appearance — the single source of truth.

   Shared by index.html, catalogue/index.html and studio.html. It used to
   be copy-pasted into each, which is how the copies drifted and how the
   catalogue page (where the tiles actually live now) ended up applying no
   Studio settings at all.

   Injects a <style id="tile-dyn"> so it layers over site.css without
   editing it, and can be re-run cheaply on every settings keystroke.
   ============================================================ */
(function () {
  window.applyTileStyle = function applyTileStyle(C) {
    var ts = (C && C.tileStyle) || {};

    // The tile sits ON a photograph, so most of its treatment is identical in
    // both themes — the heading, the number and the scrim all have to survive
    // an unpredictable image, not the page ground. Only the glass fill and the
    // border touch the page, and those are the only two that flip.
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';

    var hf = ts.headingFont || 'Cormorant Garamond';
    var hw = ts.headingWeight != null ? ts.headingWeight : 600;
    var hs = ts.headingSize || 'clamp(1.55rem,2vw,2.2rem)';
    var hc = ts.headingColor || '#f3ead7';
    var nc = ts.numColor || 'rgba(255,255,255,0.5)';
    var ec = ts.enterColor || '#f4d784';
    var bc = ts.borderColor || (dark ? 'rgba(255,255,255,0.12)' : 'rgba(169,123,10,0.28)');
    var bw = ts.borderWidth != null ? ts.borderWidth : 1;
    var br = ts.borderRadius != null ? ts.borderRadius : 20;
    // A 5%-white wash reads as frosted glass on black and as absolutely
    // nothing on pearl, so light mode needs a real fill to be a card at all.
    var go = ts.glassOpacity != null ? ts.glassOpacity : (dark ? 0.05 : 0.5);
    var os = ts.overlayStrength != null ? ts.overlayStrength : 0.82;
    // Gradient on by default (that's the look we shipped), but the heading
    // colour picker is meaningless while it's on — so it's a real switch.
    var grad = ts.headingGradient !== false;

    var shadow = 'drop-shadow(0 1px 2px rgba(0,0,0,.95)) '
               + 'drop-shadow(0 2px 6px rgba(0,0,0,.75)) '
               + 'drop-shadow(0 0 18px rgba(0,0,0,.55))';

    var heading = grad
      ? "background:linear-gradient(162deg,#fff8b0 0%,#f4d784 14%,#ffe87a 26%,#c8922a 40%,"
        + "#f0d070 54%,#fffbe0 66%,#e8c55a 78%,#c08a20 100%);"
        + "background-size:220% 220%;animation:goldShimmer 7s ease-in-out infinite;"
        + "-webkit-background-clip:text;background-clip:text;"
        + "-webkit-text-fill-color:transparent;filter:" + shadow + ";"
      // Reset every gradient property, or a stale one from the previous
      // render keeps the text transparent and the colour never shows.
      : "background:none;animation:none;-webkit-background-clip:border-box;"
        + "background-clip:border-box;-webkit-text-fill-color:" + hc + ";"
        + "color:" + hc + ";filter:" + shadow + ";";

    var css =
      '.tile{background:rgba(255,255,255,' + go + ');border:' + bw + 'px solid ' + bc
        + ';border-radius:' + br + 'px}'
      + '.tile::after{background:linear-gradient(0deg,rgba(0,0,0,' + os + ') 0%,rgba(0,0,0,'
        + (os * 0.61).toFixed(2) + ') 22%,rgba(0,0,0,' + (os * 0.12).toFixed(2)
        + ') 48%,transparent 70%)}'
      + ".tile h4{font-family:'" + hf + "',serif;font-weight:" + hw + ';font-size:' + hs + ';'
        + heading + '}'
      + '.tile .num{color:' + nc + '}'
      + '.tile .enter{color:' + ec
        + ';text-shadow:0 1px 2px rgba(0,0,0,.95),0 2px 8px rgba(0,0,0,.7)}';

    var s = document.getElementById('tile-dyn');
    if (!s) {
      s = document.createElement('style');
      s.id = 'tile-dyn';
      document.head.appendChild(s);
    }
    s.textContent = css;
    lastC = C;
  };

  // This block is generated once from whatever content the page loaded, so a
  // theme switch afterwards would leave the tiles carrying the other theme's
  // fill until the next reload. Replay the last call instead.
  var lastC = null;
  window.addEventListener('kj:theme', function () {
    if (lastC !== null) window.applyTileStyle(lastC);
  });
})();
