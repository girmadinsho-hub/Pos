/* ═══════════════════════════════════════════════════════════════════
   BizMaster POS — zoom-fix.js · v2 PURE FINGERS (Round 24, 2026-11-04)
   ─────────────────────────────────────────────────────────────────
   WHAT THIS DOES (natural phone behaviour — no buttons, no extra UI):
     · TWO fingers pinch anywhere on the page → zoom in / zoom out;
     · ONE finger press and drag → move the screen in ANY direction
       (after you are zoomed in), exactly like any normal website;
     · double-tap-to-zoom stays OFF, so fast button tapping stays exact.

   HOW IT WORKS (invisible repairs, kept running every 2 seconds):
     1. the <meta name="viewport"> tag is forced to user-scalable=yes
        (old user-scalable=no / maximum-scale=1 twins are deleted);
     2. every touch-action rule — stylesheet AND inline style — is
        overridden so pinching and panning are allowed everywhere;
     3. iOS gesture killers (old libraries calling preventDefault())
        are blocked before they can see the gesture.

   It also REMOVES any leftovers from the old button version
   (A＋/A－/⟲ buttons, zoom level) — nothing of that remains.

   INSTALL: this file replaces the old zoom-fix.js completely
   (select all in the old file, delete, paste this). The line
        <script src="zoom-fix.js"></script>
   already in your pages stays exactly as it is — change nothing else.
   If the old buttons still appear after replacing the file, do one
   hard refresh / clear cache — phones cache JavaScript.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ZOOM_WANT = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes';

  /* erase every leftover of the old A± button version */
  function removeOldButtons() {
    try {
      var w = document.getElementById('slpZoomBtns');
      if (w && w.parentNode) w.parentNode.removeChild(w);
      var s2 = document.getElementById('slpZoomCss2');
      if (s2 && s2.parentNode) s2.parentNode.removeChild(s2);
      if (document.documentElement.style.zoom) document.documentElement.style.zoom = '';
      try { localStorage.removeItem('slp_zoom'); } catch (e) {}
    } catch (e) {}
  }

  /* ═══ THE ONE LAW: fingers rule the page ═══ */
  function zoomLaw() {
    try {
      var metas = document.querySelectorAll('meta[name="viewport"]');
      var m = metas.length ? metas[0] : null;
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'viewport');
        (document.head || document.documentElement).appendChild(m);
      }
      for (var i = 1; i < metas.length; i++) {   /* twins die — the LAST meta wins in Chrome */
        try { if (metas[i].parentNode) metas[i].parentNode.removeChild(metas[i]); } catch (e) {}
      }
      if (m.getAttribute('content') !== ZOOM_WANT) m.setAttribute('content', ZOOM_WANT);
      if (!document.getElementById('slpZoomCss')) {
        var st = document.createElement('style');
        st.id = 'slpZoomCss';
        /* universal: touch-action is checked on the element the finger
           lands on AND every ancestor — html/body alone is not enough.
           pan-x pan-y = one-finger drag moves the screen in ALL
           directions; pinch-zoom = two-finger zoom. !important beats
           stylesheet rules AND inline element.style. */
        st.textContent = '*,*::before,*::after{touch-action:pan-x pan-y pinch-zoom!important}';
        (document.head || document.documentElement).appendChild(st);
      }
    } catch (e) {}
    removeOldButtons();
  }

  /* enforcement loop — survives late meta rewrites & re-pasted twins */
  if (!window.__slpZoomTimer) {
    window.__slpZoomTimer = setInterval(zoomLaw, 2000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) zoomLaw(); });
    /* iOS shield — old libs kill the pinch with preventDefault() on
       gesturestart/gesturechange. This capture-phase listener runs
       BEFORE their bubble-phase handlers and stops the event cold. */
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.stopPropagation(); }, { capture: true, passive: true });
    });
  }

  /* ═══ boot ═══ */
  zoomLaw();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zoomLaw);
  window.addEventListener('load', zoomLaw);
})();
