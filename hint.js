/* ══════════════════════════════════════════════════════════════════
   SSHint v1 · SMART BUTTON TOOLTIPS + TOUCH FEEDBACK ENGINE
   ─────────────────────────────────────────────────────────────────
   Every button in the app gets, with ZERO per-button edits:
     · a hover tooltip  — button NAME + a short explanation
     · a long-press tooltip on touch (430 ms) with a tiny vibration;
       releasing after a peek does NOT fire the button by accident
     · a visible "touched" pulse on every tap (blue ring + brighten)
     · a hover lift on desktop and a keyboard focus ring + tooltip
   Content is resolved automatically, in this order:
     data-hint / data-hint-info attrs → element id → onclick function
     name (+ first argument) → icon dictionary (icon-only buttons) →
     title attribute → text patterns → gentle generic fallback.
   Works inside dense v4 "excel" tables: the tooltip is position:fixed
   on <body>, so table overflow / scrolling can never clip it.
   Trilingual: reads the live language from window.LANG (EN / አማርኛ /
   Oromoo). Toggle from console: SSHint.toggle()  ·  SSHint.off()
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.SSHint) return;                       // double-load guard

  var VER = '1.0';
  var OFF = false;
  try { OFF = String(localStorage.getItem('ssHintOff')) === '1'; } catch (e) {}

  /* ── interactive-element selector (tooltips + feedback) ── */
  var SEL = 'button,[role="button"],input[type="button"],input[type="submit"],' +
            '.btn,.btn-mini,.v4-chip,.v4-btn,.payment-btn,.period-btn,.qty-btn,' +
            '.hbtn,.login-btn,.key-btn-num,.key-btn-enter,.key-btn-clear,' +
            '.floor-table-btn,.station-tab,.mpv-paid-pill,[onclick]';

  /* ══════════════ 1 · LANGUAGE ══════════════ */
  function cur() {
    try { var l = window.LANG && window.LANG.currentLang(); return (l === 'am' || l === 'om') ? l : 'en'; }
    catch (e) { return 'en'; }
  }
  function idx() { return cur() === 'am' ? 2 : (cur() === 'om' ? 4 : 0); }
  function pack(e) { var i = idx(); return { n: e[i], i: e[i + 1] }; }

  /* ══════════════ 2 · DICTIONARIES (see block below) ══════════════ */
  var BY_ID = {}, BY_FN = {}, BY_ICON = {}, BY_TEXT = [], GENERIC = null, DIS = null;

  /* ══════════════ 3 · STYLES ══════════════ */
  var CSS = [
    '/* SSHint v' + VER + ' — tooltip + touch feedback */',
    '#sshint-tip{position:fixed;z-index:2147483000;pointer-events:none;opacity:0;visibility:hidden;',
    ' transform:translateY(4px);transition:opacity .15s ease,transform .15s ease,visibility .15s;',
    ' max-width:min(280px,86vw);background:rgba(15,23,42,.97);color:#f1f5f9;',
    ' border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:9px 12px;',
    ' box-shadow:0 10px 30px rgba(2,6,23,.5);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);',
    " font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans Ethiopic',sans-serif;",
    ' line-height:1.32;letter-spacing:.1px;}',
    '#sshint-tip.ssh-on{opacity:1;visibility:visible;transform:translateY(0);}',
    '#sshint-tip .ssh-n{font-size:13px;font-weight:700;color:#fff;}',
    '#sshint-tip .ssh-i{font-size:12px;color:#c7d2e2;margin-top:3px;}',
    '#sshint-tip .ssh-d{font-size:11px;color:#94a3b8;margin-top:3px;font-style:italic;}',
    '#sshint-tip.ssh-touch .ssh-i{color:#e2e8f0;}',
    '/* — hover lift: classic small controls — */',
    'button:not([disabled]):hover,[role="button"]:hover,input[type="button"]:not([disabled]):hover,',
    'input[type="submit"]:not([disabled]):hover,.btn:hover,.btn-mini:hover,.v4-chip:not([disabled]):hover,',
    '.v4-btn:hover,.payment-btn:not([disabled]):hover,.period-btn:hover,.qty-btn:hover,.hbtn:hover,',
    '.login-btn:hover,.key-btn-num:hover,.key-btn-enter:hover,.key-btn-clear:hover,.station-tab:hover,',
    '.mpv-paid-pill:not([disabled]):hover{filter:brightness(1.08);transform:translateY(-1px);',
    ' box-shadow:0 4px 14px rgba(2,6,23,.25);transition:transform .13s ease,filter .13s ease,box-shadow .13s ease;}',
    '/* — press-in on mouse down — */',
    'button:not([disabled]):active,[role="button"]:active,input[type="button"]:not([disabled]):active,',
    'input[type="submit"]:not([disabled]):active,.btn:active,.btn-mini:active,.v4-chip:active,',
    '.v4-btn:active,.payment-btn:active,.period-btn:active,.qty-btn:active,.hbtn:active,',
    '.login-btn:active,.key-btn-num:active,.key-btn-enter:active,.key-btn-clear:active,',
    '.station-tab:active,.mpv-paid-pill:active{transform:translateY(0) scale(.97);filter:brightness(.93);}',
    '/* — big clickable cards (tables, floor cells, grid cards): gentle only — */',
    '[onclick]:hover{filter:brightness(1.04);}',
    '/* — touch pulse: the visible "you touched it" sign — */',
    '.ssh-tap{filter:brightness(1.16) !important;box-shadow:0 0 0 3px rgba(13,100,240,.30) !important;}',
    '.ssh-tap2{transform:scale(.97);}',
    '/* — keyboard accessibility — */',
    'button:focus-visible,[role="button"]:focus-visible,[onclick]:focus-visible,',
    'input[type="button"]:focus-visible,input[type="submit"]:focus-visible{outline:3px solid rgba(13,100,240,.55);outline-offset:2px;}',
    '/* — stop the grey iOS/Android tap flash + long-press callout so our pulse is THE feedback — */',
    'button,[role="button"],input[type="button"],input[type="submit"],.btn,.btn-mini,.v4-chip,.v4-btn,',
    '.payment-btn,.period-btn,.qty-btn,.hbtn,.login-btn,.key-btn-num,.key-btn-enter,.key-btn-clear,',
    '.floor-table-btn,.station-tab,.mpv-paid-pill,[onclick]{-webkit-tap-highlight-color:transparent;',
    ' -webkit-touch-callout:none;-webkit-user-select:none;user-select:none;}'
  ].join('\n');

  function injectCss() {
    try {
      if (document.getElementById('sshint-css')) return;
      var st = document.createElement('style');
      st.id = 'sshint-css';
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  /* ══════════════ 4 · CONTENT RESOLUTION ══════════════ */
  var EMOJI_LEAD = /^((?:[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u20E3\u2705\u274C\u2714\u2716\u2764]|[\uD800-\uDBFF][\uDC00-\uDFFF])+)()(\s*)/;
  function iconKey(s) { return String(s || '').replace(/[\uFE0F\s]/g, ''); }
  function txtOf(el) {
    var t = '';
    try { t = el.textContent || ''; } catch (e) {}
    return String(t).replace(/\s+/g, ' ').trim();
  }

  /* parse every function call in the onclick attribute with its arguments,
     then try compound keys fn|arg (any argument) before plain fn */
  function fnEntry(oc) {
    var reCall = /([a-zA-Z_$][\w$]*)\s*\(/g, m, calls = [];
    while ((m = reCall.exec(oc))) {
      var fn = m[1];
      var rest = oc.slice(m.index + m[0].length);
      var depth = 1, args = [], cur = '', q = null;
      for (var i = 0; i < rest.length && depth > 0; i++) {
        var ch = rest[i];
        if (q) { if (ch === q) q = null; else cur += ch; continue; }
        if (ch === '\'' || ch === '"') { q = ch; continue; }
        if (ch === '(') { depth++; continue; }
        if (ch === ')') { depth--; if (depth === 0) { args.push(cur.trim()); break; } }
        if (ch === ',' && depth === 1) { args.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      calls.push({ fn: fn, args: args });
    }
    for (var c = 0; c < calls.length; c++) {
      for (var a = 0; a < calls[c].args.length; a++) {
        var arg = calls[c].args[a];
        if (arg === '' || arg.length > 40) continue;
        var comp = calls[c].fn + '|' + arg;
        if (BY_FN[comp]) return BY_FN[comp];
      }
    }
    for (var c2 = 0; c2 < calls.length; c2++) {
      if (BY_FN[calls[c2].fn]) return BY_FN[calls[c2].fn];
    }
    return null;
  }

  function resolve(el) {
    if (!el || !el.getAttribute) return null;
    try {
      /* 1 · explicit author hints win */
      var dh = el.getAttribute('data-hint');
      if (dh) return { n: dh, i: el.getAttribute('data-hint-info') || '', src: 'attr' };

      /* 2 · known element ids (floating buttons etc.) */
      var eid = el.id || '';
      if (eid && BY_ID[eid]) return pack(BY_ID[eid]);

      /* 3 · onclick function dictionary (compound with first argument) */
      var oc = el.getAttribute('onclick') || '';
      var e = oc ? fnEntry(oc) : null;
      if (e) return pack(e);

      /* 4 · gather what the button shows */
      var aria = el.getAttribute('aria-label') || '';
      var ttl = el.getAttribute('title') || '';
      var t = txtOf(el);
      if ((el.tagName || '') === 'INPUT') { var v = el.getAttribute('value') || ''; if (v && !t) t = v; }
      var em = t.match(EMOJI_LEAD);
      var icon = em ? iconKey(em[1]) : '';
      var label = em ? t.slice(em[0].length).trim() : t;

      /* 5 · icon-only button → icon dictionary */
      if (!label && icon) {
        var ie = BY_ICON[icon];
        if (ie) return { n: ie[idx()], i: ttl || ie[idx() + 1], src: 'icon' };
        if (ttl) return { n: ttl, i: GENERIC[idx() + 1], src: 'title' };
        return { n: GENERIC[idx()], i: GENERIC[idx() + 1], src: 'gen' };
      }

      /* 6 · known name/label text patterns */
      var srcTxt = label || t || aria;
      if (srcTxt) {
        for (var k = 0; k < BY_TEXT.length; k++) {
          if (BY_TEXT[k][0].test(srcTxt)) {
            var pe = BY_TEXT[k][1];
            return { n: label || aria || ttl || srcTxt, i: pe[idx() + 1], src: 'pat' };
          }
        }
      }

      /* 7 · graceful generic: named button, icon wisdom when we have it */
      var nm = label || aria || (ttl && !icon ? ttl : '');
      if (nm) {
        var extra = icon && BY_ICON[icon] ? BY_ICON[icon][idx() + 1] : '';
        return { n: nm, i: extra || GENERIC[idx() + 1], src: 'gen' };
      }
      return null;
    } catch (e2) { return null; }
  }

  /* ══════════════ 5 · TOOLTIP ══════════════ */
  var tipEl = null, curTipEl = null;

  function ensureTip() {
    if (tipEl && tipEl.isConnected !== false) return tipEl;
    tipEl = document.createElement('div');
    tipEl.id = 'sshint-tip';
    tipEl.setAttribute('role', 'tooltip');
    tipEl.setAttribute('aria-hidden', 'true');
    (document.body || document.documentElement).appendChild(tipEl);
    return tipEl;
  }

  function place(el, tip) {
    var r = el.getBoundingClientRect();
    tip.style.left = '0px'; tip.style.top = '0px';
    var tw = tip.offsetWidth || 200, th = tip.offsetHeight || 40;
    var vw = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 360;
    var vh = window.innerHeight || 640;
    var x = r.left + r.width / 2 - tw / 2;
    if (x < 8) x = 8;
    if (x + tw > vw - 8) x = vw - tw - 8;
    if (x < 0) x = 0;
    var y = r.top - th - 9;                      /* prefer above */
    if (y < 6) y = r.bottom + 9;                 /* flip below */
    if (y + th > vh - 6) y = Math.max(6, vh - th - 6);
    tip.style.left = Math.round(x) + 'px';
    tip.style.top = Math.round(y) + 'px';
  }

  function show(el, mode) {
    if (OFF) return false;
    var r = resolve(el);
    if (!r || (!r.n && !r.i)) return false;
    try {
      var tip = ensureTip();
      tip.className = mode === 'touch' ? 'ssh-touch' : '';
      while (tip.firstChild) tip.removeChild(tip.firstChild);
      if (r.n) {
        var n = document.createElement('div'); n.className = 'ssh-n'; n.textContent = r.n; tip.appendChild(n);
      }
      if (r.i && r.i !== r.n) {
        var d = document.createElement('div'); d.className = 'ssh-i'; d.textContent = r.i; tip.appendChild(d);
      }
      if (el.disabled) {
        var dd = document.createElement('div'); dd.className = 'ssh-d'; dd.textContent = DIS[idx()]; tip.appendChild(dd);
      }
      place(el, tip);
      tip.classList.add('ssh-on');
      curTipEl = el;
      var t = el.getAttribute('title');          /* suppress the slow native tooltip */
      if (t) { el.__sshT = t; el.removeAttribute('title'); }
      try { el.setAttribute('aria-describedby', 'sshint-tip'); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }

  function hide() {
    if (curTipEl) {
      if (curTipEl.__sshT) { try { curTipEl.setAttribute('title', curTipEl.__sshT); } catch (e) {} }
      try { delete curTipEl.__sshT; } catch (e) { curTipEl.__sshT = null; }
      try { curTipEl.removeAttribute('aria-describedby'); } catch (e) {}
    }
    if (tipEl) { try { tipEl.classList.remove('ssh-on'); } catch (e) {} }
    curTipEl = null;
  }

  /* ══════════════ 6 · EVENTS ══════════════ */
  var curEl = null, showT = null, hideT = null;

  function clearTimers() { if (showT) { clearTimeout(showT); showT = null; } if (hideT) { clearTimeout(hideT); hideT = null; } }
  function hideSoon(ms) { if (hideT) clearTimeout(hideT); hideT = setTimeout(hide, ms); }

  function tooBig(el) {
    try {
      var r = el.getBoundingClientRect();
      var vw = window.innerWidth || 360, vh = window.innerHeight || 640;
      return (r.width * r.height) > (vw * vh * 0.55);
    } catch (e) { return false; }
  }
  function skipEl(el) {
    try { return !!(el.closest && el.closest('[data-hint-off]')); } catch (e) { return false; }
  }

  function enter(el) {
    if (hideT) { clearTimeout(hideT); hideT = null; }
    if (curEl === el) return;
    curEl = el;
    if (showT) clearTimeout(showT);
    showT = setTimeout(function () {
      showT = null;
      if (curEl !== el || !el.isConnected) return;
      if (!show(el, 'hover')) curEl = null;   /* failed show (OFF / nothing to say) → allow retry */
    }, 260);
  }
  function leave() {
    if (showT) { clearTimeout(showT); showT = null; }
    curEl = null;
    hideSoon(90);
  }

  /* — pointer (mouse / pen) — */
  function overH(e) {
    if (e.pointerType === 'touch') return;
    if (!window.PointerEvent && Date.now() - lastTouch < 3500) return;  /* legacy fallback path guard */
    var t = e.target;
    if (!t || !t.closest) return;
    if (tipEl && tipEl.contains(t)) return;
    var el = t.closest(SEL);
    if (el && !skipEl(el)) enter(el); else leave();
  }
  function outH(e) {
    if (e.pointerType === 'touch') return;
    var rt = e.relatedTarget;
    if (curEl && (!rt || !rt.closest || !curEl.contains(rt))) leave();
  }

  /* — touch: pulse + long-press peek — */
  var LP = { el: null, x: 0, y: 0, timer: null, shown: false };
  var tapEl = null, tapT = null, lastTouch = 0;

  function removeTap() {
    if (tapT) { clearTimeout(tapT); tapT = null; }
    if (tapEl) {
      try { tapEl.classList.remove('ssh-tap'); tapEl.classList.remove('ssh-tap2'); } catch (e) {}
      tapEl = null;
    }
  }
  function addTap(el) {
    if (OFF) return;
    var tr = 'none';
    try { tr = window.getComputedStyle(el).transform || 'none'; } catch (e) {}
    try {
      el.classList.add('ssh-tap');
      if (!tr || tr === 'none') el.classList.add('ssh-tap2');   /* never fight a positioned transform */
    } catch (e) {}
    tapEl = el;
    tapT = setTimeout(removeTap, 700);                          /* safety if touchend never fires */
  }
  function lpCancel() { if (LP.timer) { clearTimeout(LP.timer); LP.timer = null; } }

  function tsH(e) {
    lastTouch = Date.now();
    removeTap();
    if (e.touches && e.touches.length !== 1) { lpCancel(); LP.shown = false; LP.el = null; return; }
    var tch = e.touches[0], t = e.target;
    var el = (t && t.closest) ? t.closest(SEL) : null;
    LP.x = tch.clientX; LP.y = tch.clientY; LP.el = el; LP.shown = false;
    if (el && !skipEl(el)) {
      addTap(el);
      if (!tooBig(el)) {
        LP.timer = setTimeout(function () {
          LP.timer = null;
          if (!LP.el || !LP.el.isConnected) return;
          if (show(LP.el, 'touch')) {
            LP.shown = true;
            try { if (navigator.vibrate) navigator.vibrate(12); } catch (e2) {}
          }
        }, 430);
      }
    }
  }
  function tmH(e) {
    var tch = e.touches && e.touches[0];
    if (!tch) return;
    var dx = tch.clientX - LP.x, dy = tch.clientY - LP.y;
    if (dx * dx + dy * dy > 144) { lpCancel(); removeTap(); }   /* 12 px — it's a scroll */
  }
  function teH() {
    lpCancel();
    removeTap();
    if (LP.shown && LP.el) {
      blockClick(LP.el);                                        /* peek ≠ press */
      hideSoon(2600);
    } else {
      hide();
    }
    LP.shown = false; LP.el = null;
  }
  function blockClick(el) {
    function fx(ev) {
      try { if (el.contains(ev.target)) { ev.preventDefault(); ev.stopPropagation(); } } catch (e) {}
      document.removeEventListener('click', fx, true);
    }
    document.addEventListener('click', fx, true);
    setTimeout(function () { document.removeEventListener('click', fx, true); }, 900);
  }

  /* — keyboard — */
  function finH(e) {
    var t = e.target;
    var el = (t && t.closest) ? t.closest(SEL) : null;
    if (el && !skipEl(el) && !tooBig(el)) { clearTimers(); show(el, 'hover'); }
  }
  function foutH() { hideSoon(60); }

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    if (window.PointerEvent) {
      document.addEventListener('pointerover', overH);
      document.addEventListener('pointerout', outH);
    } else {
      document.addEventListener('mouseover', overH);
      document.addEventListener('mouseout', outH);
    }
    document.addEventListener('touchstart', tsH, { passive: true });
    document.addEventListener('touchmove', tmH, { passive: true });
    document.addEventListener('touchend', teH, { passive: true });
    document.addEventListener('touchcancel', function () { lpCancel(); removeTap(); hide(); LP.shown = false; LP.el = null; }, { passive: true });
    document.addEventListener('contextmenu', function (e) { if (LP.shown) { try { e.preventDefault(); } catch (e2) {} } });
    document.addEventListener('focusin', finH);
    document.addEventListener('focusout', foutH);
    window.addEventListener('scroll', function () { clearTimers(); hide(); }, { passive: true, capture: true });
    window.addEventListener('resize', function () { clearTimers(); hide(); }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { clearTimers(); hide(); } });
  }

  /* entry format: [ nameEN, infoEN, nameAM, infoAM, nameOM, infoOM ] */
  GENERIC = ['Button', 'Tap to use this button.',
             'አዝራር', 'ይህን አዝራር ለመጠቀም ይንኩ።',
             'Baqula', 'Baqula kana faayyadhuuf tuqaadhu.'];
  DIS = ['(not available right now)', '(unavailable)',
         '(በአሁኑ ጊዜ አይሠራም)', '(አይሠራም)',
         '(yeroo ammaa hin hojjetu)', '(hin hojjetu)'];

  /* ── floating buttons (created in code, identified by id) ── */
  BY_ID = {
    mpvConfFab: ['📱 Waiter-confirmed payments', 'Mobile bills confirmed by waiters. Tap to open the list, load a bill into the cart and print the receipt.',
      '📱 የኋላሽኖች ማረጋገጫ', 'በኋላሽኖች የተረጋገጡ የሞባይል ሂሳቦች። ዝርዝሩን ለመክፈት ይንኩ፣ ሂሳቡን ወደ ጋሪ ጫነው ደረሰኝ ያትሙ።',
      '📱 Mirkaneessa tajaajiltootaa', 'Biilota moobiilaa tajaajiltoonni mirkaneessan. Tarreessi banaa, biila kaartiiitti fe\u2019i, rasiishii maxxansi.'],
    mpvPendFab: ['⏳ Awaiting owner verification', 'Mobile payments recorded but not yet verified by the owner (Admin). Read-only list.',
      '⏳ የባለቤት ማረጋገጫ በመጠበቅ ላይ', 'የተመዘገቡ ግን እስካሁን በባለቤት (Admin) ያልተረጋገጡ የሞባይል ክፍያዎች። ለማንበብ ብቻ።',
      '⏳ Mirkaneessa abbaa bittaa eegata', 'Kaffaltii moobiilaa galmeeffame garuu abbaa bittiin (Admin) hin mirkaneessine. Qofa dubbisuuf.'],
    v4mpvFab: ['📱 Mobile bills to check', 'Pending mobile payments. Tap to open the Mobile Pay tab and verify each bill against your account history.',
      '📱 የሚመረመሩ የሞባይል ሂሳቦች', 'በመጠበቅ ላይ ያሉ የሞባይል ክፍያዎች። የሞባይል ክፍያ ሜኑ ለመክፈት ይንኩና እያንዳንዱን ሂሳብ ከአካውንት ታሪክዎ ጋር ያወዳድሩ።',
      '📱 Biilota moobiilaa mirkanaa', 'Kaffaltii moobiilaa eegaman. Mobile Pay banaa, biilaa tokko tokko seenaa akkaawuntii kee waliin biraansi.']
  };

  /* ── onclick function dictionary ("fn" or "fn|firstArgument") ── */
  BY_FN = {
    /* — POS · payment & cart — */
    'selectPayment|cash': ['💵 Cash payment', 'Customer pays with physical cash. Enter the amount received — the change is calculated.',
      '💵 በጥሬ ገንዘብ ክፍያ', 'ደንበኛ በጥሬ ገንዘብ ይከፍላል። የተቀበሉትን መጠን ያስገቡ — ትክክለኛው ለውጭ ራሱ ይሰላል።',
      '💵 Kaffaltii qashii', 'Mindaa qashii waliin kaffala. Minda fudhatte barreessi — deebiin ofiin shallagama.'],
    'selectPayment|card': ['💳 Card payment', 'Customer pays by card. Run the card machine, then Complete.',
      '💳 በካርድ ክፍያ', 'ደንበኛ በካርድ ይከፍላል። የካርድ መሣሪያውን ያሂዱ፣ ከዚያ Complete ይንኩ።',
      '💳 Kaffaltii kaardii', 'Kaardiin kaffala. Maashini kaardii hojjeedhu, sana booda Complete tuqaadhu.'],
    'selectPayment|mobile': ['📱 Mobile payment', 'TeleBirr / CBE Birr / bank app. Pick the account, TXN reference and the waiter who saw it — the owner verifies later.',
      '📱 በሞባይል ክፍያ', 'TeleBirr / CBE Birr / የባንክ መተግበሪያ። አካውንቱን፣ የTXN ቁጥሩንና የተመለከተውን ኋላሽን ይምረጡ — ባለቤት በኋላ ያረጋግጣል።',
      '📱 Kaffaltii moobiilaa', 'TeleBirr / CBE Birr / appii baankii. Akkaawuntii, TXN fi tajaajiltaa mul\u2019ate filadhu — abbaa bittiin booda mirkaneessa.'],
    'selectPayment|credit': ['📝 Credit (unpaid)', 'Record the sale as credit for a registered customer — pays later.',
      '📝 ብድር (ያልተከፈለ)', 'ሽያጩ ለተመዘገበ ደንበኛ ብድር ሆኖ ይመዘገባል — በኋላ ይከፈላል።',
      '📝 Kaffaltii boodaa (hin kaffalamne)', 'Gurguricha miseenta galmeeffameef kaffaltii boodaa ta\u2019ee galmeeffama — booda kaffala.'],
    checkout: ['🧾 Checkout', 'Open the payment screen and finish this sale.',
      '🧾 Checkout', 'የክፍያ ማዕከልን ይክፈትና ይህን ሽያጭ ይጨርስ።',
      '🧾 Checkout', 'Iddoo kaffaltii banaa, gurgurtaa kana xummuri.'],
    completePayment: ['✅ Complete payment', 'Save the sale, print the receipt and clear the cart.',
      '✅ ክፍያን አጠናቅቅ', 'ሽያጩ ይቀመጣል፣ ደረሰኝ ይታተማል፣ ጋሪው ይባድራል።',
      '✅ Kaffaltii xumuri', 'Gurgurkaa galmeessi, rasiishii maxxansi, kaartii duubsi.'],
    clearCart: ['🗑 Clear cart', 'Remove every item from the cart. Asks first.',
      '🗑 ጋሪ አጽዳ', 'ሁሉንም እቃዎች ከጋሪ ያስወግዳል። መጀመሪያ ይጠይቃል።',
      '🗑 Kaartii haqi', 'Wantoota hunda kaartii irraa haqa. Jalqabaa gaafata.'],
    holdOrder: ['⏸ Hold order', 'Park this cart aside and take the next customer.',
      '⏸ ትዕዛዝ ተይዝ', 'ይህን ጋሪ አንድ በኩል ያስቀምጡና ቀጣዩን ደንበኛ ይያዙ።',
      '⏸ Ajajaa eegadhu', 'Kaartii kana raawwatti kaa\u2019i, miseenti itti aanu fudhadhu.'],
    recallOrder: ['↩ Recall held order', 'Bring a parked order back into the cart.',
      '↩ የተያዘ ትዕዛዝ መልስ', 'የተቀመጠ ትዕዛዝ ወደ ጋሪ ይመለሳል።',
      '↩ Ajajaa eegame deebisi', 'Ajajaa raawwatame deebisi kaartii keessatti.'],
    deleteHeldOrder: ['🗑 Delete held order', 'Remove a parked order for good. Asks first.',
      '🗑 የተያዘ ትዕዛዝ አጥፋ', 'የተቀመጠ ትዕዛዝ ለዘላለም ይጠፋል። መጀመሪያ ይጠይቃል።',
      '🗑 Ajajaa eegame haqi', 'Ajajaa raawwatame haqi ofumaan. Jalqabaa gaafata.'],
    'updateCartQty|1': ['➕ Increase quantity', 'Add one more of this item to the cart.',
      '➕ ብዛት ጨምር', 'ከዚህ እቃ አንድ ተጨማሪ ወደ ጋሪ ይጨምራል።',
      '➕ Lakkoofsa dabali', 'Wantoota kana tokko kaartii keessatti dabalisi.'],
    'updateCartQty|-1': ['➖ Decrease quantity', 'Take one of this item out of the cart.',
      '➖ ብዛት ቀንስ', 'ከዚህ እቃ አንድ ከጋሪ ይቀነሳል።',
      '➖ Lakkoofsa hir\u2019isuu', 'Wantoota kana tokko kaartii irraa baasi.'],
    editCartPrice: ['✏️ Edit line price', 'Change the price or discount of this cart line.',
      '✏️ የመስመር ዋጋ አስተካክል', 'የዚህ የጋሪ መስመር ዋጋ ወይም ቅናሽ ይለወጣል።',
      '✏️ Gatii sararaa sirreessi', 'Gatii ykn gatii lakkawsii sarara kaartii kana jijjiiri.'],
    toggleSplitMode: ['🔀 Split payment', 'Divide one bill across several payment methods.',
      '🔀 የተከፋፈለ ክፍያ', 'አንድ ሂሳብ በበርካች የክፍያ ዘዴዎች ይከፈላል።',
      '🔀 Kaffaltii qoodu', 'Biila tokko kaffaltii adda addaatiin qoodi.'],
    'setOrderType|Dine-In': ['🍽️ Dine-In', 'Order served at the table.',
      '🍽️ በሠንጠረዥ አገልግሎት', 'በሠንጠረዥ ላይ የሚቀርብ ትዕዛዝ።',
      '🍽️ Dine-In', 'Ajaja taabala irratti kennama.'],
    'setOrderType|Takeaway': ['🛍️ Takeaway', 'Customer takes the order away.',
      '🛍️ Takeaway', 'ደንበኛ ትዕዛዙን ይወስዳል።',
      '🛍️ Takeaway', 'Miseenti ajaja fudhachaa deema.'],
    'setOrderType|Delivery': ['🛵 Delivery', 'Order taken to the customer\u2019s address.',
      '🛵 Delivery', 'ትዕዛዙ ወደ ደንበኛው አድራሻ ይደርሳል።',
      '🛵 Delivery', 'Ajaja teessoo miseentiitti geeffama.'],
    openKeypad: ['⌨ Quick-code keypad', 'Add a product by typing its code.',
      '⌨ የፈጣን ኮድ ሰሌዳ', 'እቃን በኮዱ በመጻፍ ያክሉ።',
      '⌨ Banaan koodii saffisaa', 'Oomishuu koodii barreessuun dabalisi.'],
    addByBarcode: ['📷 Add by barcode', 'Scan or type a barcode to add the item.',
      '📷 በባርኮድ ጨምር', 'እቃውን ለመጨምር ባርኮድ ይቃኙ ወይም ይጻፉ።',
      '📷 Baarkoodiin dabali', 'Wantoo dabalachuuf baarkoodii scaan barreessi.'],
    startBarcodeScanner: ['📷 Start scanner', 'Point the camera at the barcode.',
      '📷 መቃኛ አስጀምር', 'ካሜራውን ወደ ባርኮዱ ያክብቡ።',
      '📷 Scaaner banali', 'Kaameraa baarkoodiitti faanaa.'],
    stopBarcodeScanner: ['📷 Stop scanner', 'Close the camera scanner.',
      '📷 መቃኛ አቁም', 'የካሜራውን መቃኛ ዝጋ።',
      '📷 Scaaner cufi', 'Scaanera kaameraa cufi.'],
    toggleFavourite: ['⭐ Favourite', 'Pin or unpin this product for one-tap access.',
      '⭐ ተወዳጅ', 'ይህን ምርት ለፈጣን መዳረሻ ይተኩሉ ወይም ያንሱት።',
      '⭐ Kan jaallatame', 'Oomishuu kana qooduuf ykn haquuf mallatteessi.'],
    /* — POS · screens & tools — */
    toggleSidebar: ['☰ Side menu', 'Open or close the side menu.',
      '☰ የጎን ሜኑ', 'የጎን ሜኑውን ይክፈቱ ወይም ይዝጉ።',
      '☰ Menee cinaa', 'Menee cinaa banaa ykn cufi.'],
    closeSidebar: ['✖ Close menu', 'Close the side menu.',
      '✖ ሜኑ ዝጋ', 'የጎን ሜኑውን ዝጋ።',
      '✖ Menee cufi', 'Menee cinaa cufi.'],
    toggleDarkMode: ['🌙 Dark mode', 'Switch between light and dark look.',
      '🌙 ጨለማ ሁነታ', 'በቀላልና በጨለማ መልክ ይቀያይሩ።',
      '🌙 Haala dukkana', 'Bifa ifaa fi dukkanaa gidduu jijjiiri.'],
    openTablesModal: ['🪑 Tables', 'Floor map: open tables, table bills and mobile-pay pills.',
      '🪑 ሠንጠረዦች', 'የፎቅ ካርታ፦ የተከፈቱ ሠንጠረዦች፣ የሠንጠረዥ ሂሳቦችና የሞባይል ክፍያ አዝራሮች።',
      '🪑 Taabalota', 'Kaartaa saffisa: taabala banaa, biilota taabulaa fi riibbii kaffaltii moobiilaa.'],
    openTableBillsModal: ['🧾 Table bills', 'All bills of one table.',
      '🧾 የሠንጠረዥ ሂሳቦች', 'ሁሉም የአንድ ሠንጠረዥ ሂሳቦች።',
      '🧾 Biilota taabulaa', 'Biilota taabala tokkoo hunda.'],
    selectTable: ['🪑 Select table', 'Start an order for this table.',
      '🪑 ሠንጠረዥ ምረጥ', 'ለዚህ ሠንጠረዥ ትዕዛዝ ጀምር።',
      '🪑 Taabala filadhu', 'Ajaja taabala kanaaf banali.'],
    maximizeTable: ['🔍 Enlarge table', 'Show this table full-screen.',
      '🔍 ሠንጠረዥ አሳድግ', 'ይህን ሠንጠረዥ በሙሉ መስኮት አሳይ።',
      '🔍 Taabala guddisi', 'Taabala kana agarsiisa guutuu agarsiisi.'],
    exitMaximize: ['✖ Exit full-screen', 'Back to the normal view.',
      '✖ ከሙሉ መስኮት ውጣ', 'ወደ ቀጣዩ መመልከቻ ተመለስ።',
      '✖ Guutuu agarsiisaa ba\u2019i', 'Gara agarsiisa idilee deebi\u2019i.'],
    loadTableBillToCart: ['🛒 Load table bill', 'Bring this table\u2019s unpaid orders into the cart.',
      '🛒 የሠንጠረዥ ሂሳብ ጫን', 'የዚህ ሠንጠረዥ ያልተከፈሉ ትዕዛዞች ወደ ጋሪ ይመጣሉ።',
      '🛒 Biila taabulaa fe\u2019i', 'Ajajota hin kaffalamne taabala kanaa kaartii keessatti fida.'],
    loadSelectedRounds: ['🛒 Load selected rounds', 'Load the ticked order rounds into the cart.',
      '🛒 የተመረጡ ዙሮችን ጫን', 'የተመረጡ የትዕዛዝ ዙሮች ወደ ጋሪ ይጫናሉ።',
      '🛒 Dargaggawwan filaman fe\u2019i', 'Dargaggaa ajajaa filaman kaartii keessatti fida.'],
    openWaiterStatus: ['📋 Order status', 'Live orders: unpaid bills, kitchen progress and mobile-pay confirmations.',
      '📋 የትዕዛዝ ሁኔታ', 'በቀጥታ ትዕዛዞች፦ ያልተከፈሉ ሂሳቦች፣ የምግብ ቤት ሂደትና የሞባይል ክፍያ ማረጋገጫዎች።',
      '📋 Haala ajajaa', 'Ajajota jiraawaa: biilota hin kaffalamne, sochii kichenii fi mirkaneessa kaffaltii moobiilaa.'],
    closeWaiterStatus: ['✖ Close', 'Close the order status screen.',
      '✖ ዝጋ', 'የትዕዛዝ ሁኔታ ማዕከልን ዝጋ።',
      '✖ Cufi', 'Iddoo haala ajajaa cufi.'],
    mpvWaiterPaid: ['📱 Paid by mobile', 'The customer paid by phone at this table — send the confirmation to the cashier.',
      '📱 በሞባይል ተከፍሏል', 'ደንበኛ በሠንጠረዹ በስልክ አስተከፈለ — ማረጋገጫውን ለካሺሩ ላክ።',
      '📱 Moobiilaan kaffale', 'Miseenti moobiilaan taabala kana irratti kaffale — mirkaneessa gara keeshiyaratti ergi.'],
    mpvWaiterPaidOrder: ['📱 Paid by mobile', 'This order was paid by phone — send the confirmation to the cashier.',
      '📱 በሞባይል ተከፍሏል', 'ይህ ትዕዛዝ በስልክ ተከፍሏል — ማረጋገጫውን ለካሺሩ ላክ።',
      '📱 Moobiilaan kaffale', 'Ajajni kuni moobiilaan kaffale — mirkaneessa gara keeshiyaratti ergi.'],
    mpvConfAccept: ['🛒 Load to cart & pay', 'Load this waiter-confirmed bill into the cart and finish the payment.',
      '🛒 ወደ ጋሪ ጫንና ክፈል', 'ይህን የኋላሽን የተረጋገጠ ሂሳብ ወደ ጋሪ ጫነው ክፍያውን አጠናቅቅ።',
      '🛒 Kaartii fe\u2019i kaffali', 'Biila tajaajiltoon mirkaneesse kaartii fe\u2019i, kaffaltii xumuri.'],
    mpvConfDismiss: ['✖ Remove confirmation', 'Remove a spent or duplicate confirmation. Asks first.',
      '✖ ማረጋገጫ አስወግድ', 'የተጠቀሙ ወይም የተደገሙ ማረጋገጫዎችን ያስወግዱ። መጀመሪያ ይጠይቃል።',
      '✖ Mirkaneessa haqi', 'Mirkaneessa malame ykn lamaa haqi. Jalqabaa gaafata.'],
    openCashDrawer: ['💵 Cash drawer', 'Open the drawer or record cash movements.',
      '💵 የጥሬ ገንዘብ ስስቲ', 'ስስቲውን ክፈት ወይም የገንዘብ እንቅስቃሴ መዝግብ።',
      '💵 Sistii qashii', 'Sistii banaa ykn sochii mindaa galmeessi.'],
    openShift: ['🕐 Open shift', 'Start the cashier shift.',
      '🕐 ሽፍት ክፈት', 'የካሺሩን ሽፍት ጀምር።',
      '🕐 Jijjiirama banaa', 'Jijjiirama keeshiyaraa banali.'],
    closeShift: ['🕐 Close shift', 'Close the shift and get the day summary.',
      '🕐 ሽፍት ዝጋ', 'ሽፍቱን ዝጋና የቀኑን ማጠቃለያ አግኝ።',
      '🕐 Jijjiirama cufi', 'Jijjiirama cufi, walakaa guyyaa argadhu.'],
    openClockModal: ['🕐 Staff clock', 'Clock in / out and attendance.',
      '🕐 የሠራተኛ ሰዓት', 'ግባ / ውጣ እና ስራ ላይ መቆያ።',
      '🕰 Sa\u2019aa hojjetaa', 'Seeni / ba\u2019i fi galmeessa hojii.'],
    clockInStaff: ['🕐 Clock in / out', 'Record this staff member\u2019s time.',
      '🕐 ግባ / ውጣ', 'የዚህ ሠራተኛ ጊዜ መዝግብ።',
      '🕐 Seeni / ba\u2019i', 'Sa\u2019aa hojjetaa kanaa galmeessi.'],
    printSmart: ['🖨 Print', 'Print the current receipt or view.',
      '🖨 አትም', 'የአሁኑን ደረሰኝ ወይም መመልከቻ አትም።',
      '🖨 Maxxansi', 'Rasiishii ykn agarsiisa ammaa maxxansi.'],
    printProformaBill: ['🖨 Proforma bill', 'Print the bill before payment.',
      '🖨 የቅድሚያ ሂሳብ', 'ከክፍያ በፊት ሂሳቡን አትም።',
      '🖨 Biila ogeessaa', 'Kaffaltii dura biila maxxansi.'],
    sendWhatsAppReceipt: ['📤 WhatsApp receipt', 'Send the receipt as a WhatsApp message.',
      '📤 የWhatsApp ደረሰኝ', 'ደረሰኙን በWhatsApp ይላኩ።',
      '📤 Rasiishii WhatsApp', 'Rasiishii ergaa WhatsAppTiin ergi.'],
    sendWaiterOrderToKitchen: ['📤 Send to kitchen', 'Push this order to the kitchen screen.',
      '📤 ወደ ምግብ ቤት ላክ', 'ይህን ትዕዛዝ ወደ ምግብ ቤት ማዕከል ላክ።',
      '📤 Gara kicheniitti ergi', 'Ajaja kana agarsiisa kicheniitti ergi.'],
    kotChoicePrint: ['🖨 Print kitchen ticket', 'Also print the kitchen ticket (KOT).',
      '🖨 የምግብ ቤት ትኬት አትም', 'የምግብ ቤቱን ትኬትም አትም።',
      '🖥 Tiikitii kichenii maxxansi', 'Tiikitii kicheniis maxxansi.'],
    kotChoiceSkip: ['⏭ Skip kitchen ticket', 'Send without printing a KOT.',
      '⏭ የምግብ ቤት ትኬት ዘልል', 'ያለ KOT ላክ።',
      '⏭ Tiikitii kichenii darbi', 'KOT malee ergi.'],
    voidSale: ['↩ Void sale', 'Cancel a finished sale — kept for audit.',
      '↩ ሽያጭ ሰርዝ', 'የተጠናቀቀ ሽያጭ ይሰረዛል — ለኦዲት ይቆያል።',
      '↩ Gurguraa haqi', 'Gurguraa xumuraa haqi — galmeessaaf eegama.'],
    redeemLoyaltyPoints: ['🎁 Redeem points', 'Turn loyalty points into a discount.',
      '🎁 ነጥብ ለውጭ', 'የታማኝነት ነጥቦችን ወደ ቅናሽ ቀይር።',
      '🎁 Qabxii jijjiiri', 'Qabxii usoo gatii lakkawsii jijjiiri.'],
    lookupCustomer: ['🔍 Find customer', 'Search the customer list.',
      '🔍 ደንበኛ ፈልግ', 'የደንበኞች ዝርዝር ፈልግ።',
      '🔍 Miseenta barbaadi', 'Tarreessa miseentotaa barbaadi.'],
    syncNow: ['🔄 Sync now', 'Push offline sales to the server.',
      '🔄 አሁን አስተናግድ', 'ከመስመር ውጪ የተቀመጡ ሽያጮችን ወደ ሰርቨሩ ላክ።',
      '🔄 Amma waliin qabadhu', 'Gurgurta offline sarviiratti ergi.'],
    sendChatMessage: ['➤ Send message', 'Send this staff chat message.',
      '➤ መልእክት ላክ', 'ይህን የሠራተኛ መልእክት ላክ።',
      '➤ Ergaa ergi', 'Ergaa hojjetaa kana ergi.'],
    toggleChat: ['💬 Staff chat', 'Talk to kitchen / admin in real time.',
      '💬 የሠራተኛ ውይይት', 'ከምግብ ቤት / ከአስተዳዳሪ ጋር በቀጥታ ውይይት።',
      '💬 Yaaddoo hojjetaa', 'Kichen / admin waliin yeroo ammaa dubbadhu.'],
    activateDevice: ['🔓 Activate device', 'Link this phone to your licence.',
      '🔓 መሣሪያ አግብር', 'ይህን ስልክ ከፈቃድዎ ጋር አገናኝ።',
      '🔓 Meeshaa kaa\u2019adhu', 'Bilbila kana laayisansii kee waliin kaa\u2019adhu.'],
    unlinkDevice: ['🔓 Unlink device', 'Remove this phone from the licence.',
      '🔓 መሣሪያ ሰርዝ', 'ይህን ስልክ ከፈቃድዎ አስወግድ።',
      '🔓 Meeshaa haqi', 'Bilbila kana laayisansii irraa haqi.'],
    /* — ADMIN · products & stock — */
    v4EditProduct: ['✏️ Edit product', 'Name, category, price, cost, stock — and 📥 add new arrivals (cost moves to weighted average).',
      '✏️ ምርት አስተካክል', 'ስም፣ ምድብ፣ ዋጋ፣ ወጪ፣ ክምችት — እና 📥 አዲስ እቃ ግባ (ወጪው ወደ ክብደት መካከለኛ ይሸጋገራል)።',
      '✏️ Oomishuu sirreessi', 'Maqaa, ramaddii, gatii, baasii, kuusaa — fi 📥 galchi haaromaa (baasiin giddu-gala ulfaatinaa seena).'],
    v4DeleteProduct: ['🗑 Delete product', 'Remove this product permanently. Asks first.',
      '🗑 ምርት አጥፋ', 'ይህን ምርት ለዘላለም ያስወግዳል። መጀመሪያ ይጠይቃል።',
      '🗑 Oomishuu haqi', 'Oomishuu kana ofumaan haqi. Jalqabaa gaafata.'],
    v4ProductDetail: ['📋 Product details', 'Full card: price, cost, stock and sales history.',
      '📋 የምርት ዝርዝር', 'ሙሉ ካርታ፦ ዋጋ፣ ወጪ፣ ክምችትና የሽያጭ ታሪክ።',
      '📋 Ibsa oomishuu', 'Kaardaa guutuu: gatii, baasii, kuusaa fi seenaa gurguraa.'],
    v4ToggleMenu: ['👁 QR-menu visibility', 'Show or hide this product on the customer phone menu.',
      '👁 በQR ሜኑ ታይቶ', 'ይህ ምርት በደንበኛ ስልክ ሜኑ ላይ ይታይ ወይም ይደበቅ።',
      '👁 Mul\u2019achuu menee QR', 'Oomishuu kana menee bilbila miseenaa agarsiisi ykn dhoksi.'],
    v4BinCard: ['📋 Bin card', 'Stock in / out history of this product.',
      '📋 የBin ካርድ', 'የዚህ ምርት የእቃ መግቢያ / መውጫ ታሪክ።',
      '📋 Kaardii bin', 'Seenaa galmeessaa / baafamaa kuusaa oomishuu kanaa.'],
    v4SaveEditProduct: ['💾 Save all changes', 'Save the product. A new arrival with a new cost moves Cost Price to the weighted average.',
      '💾 ሁሉንም ለውጦች አስቀምጥ', 'ምርቱን አስቀምጥ። አዲስ ወጪ ያለው አዲስ እቃ የወጪ ዋጋን ወደ ክብደት መካከለኛ ያዛውራል።',
      '💾 Jijjiirama hunda olkaa\u2019i', 'Oomishuu olkaa\u2019i. Galchi haaromaa baasii haaraa qabu gatii baasii gara giddu-gala ulfaatinaa geessa.'],
    v4RefreshProducts: ['🔄 Refresh list', 'Reload products from the server.',
      '🔄 ዝርዝር አድስ', 'ምርቶችን ከሰርቨሩ አድስ።',
      '🔄 Tarreessa haaromsi', 'Oomishoota sarviiraa irraa haaromsi.'],
    v4ProductExport: ['📤 Export Excel', 'Download the product list as an Excel file.',
      '📤 ወደ Excel ላክ', 'የምርቶች ዝርዝርን እንደ Excel ፋይል አውርድ።',
      '📤 Excel baadi', 'Tarreessa oomishuu faayilii ExcelTiin gadii.'],
    v4ProductPrint: ['🖨 Print list', 'Print the product list.',
      '🖨 ዝርዝር አትም', 'የምርቶች ዝርዝር አትም።',
      '🖨 Tarreessa maxxansi', 'Tarreessa oomishuu maxxansi.'],
    v4OpenTransfer: ['🚚 Stock transfer', 'Move stock between shops.',
      '🚚 ክምችት ዝውውር', 'ክምችትን በመደብሮች መካከል አንቀሳቅስ።',
      '🚚 Sochii kuusaa', 'Kuusaa dukaalee gidduu sochiisi.'],
    v4DoTransfer: ['🚚 Transfer now', 'Send the entered stock quantities.',
      '🚚 አሁን አንቀሳቅስ', 'የገቡን የክምችት መጠኖች ላክ።',
      '🚚 Amma sochiisi', 'Dheerina kuusaa galmee ergi.'],
    v4DoStockCount: ['💾 Save & adjust stock', 'Save the physical count and fix the differences.',
      '💾 አስቀምጥና ክምችት አስተካክል', 'የተቆጠረውን አስቀምጥና ልዩነቶችን አስተካክል።',
      '💾 Olkaa\u2019i kuusaa sirreessi', 'Lakkoofsa qaamaa olkaa\u2019i, addatti sirreessi.'],
    v4PrintRestock: ['🖨 Print restock list', 'Print the low-stock shopping list.',
      '🖨 የመተኪያ ዝርዝር አትም', 'የዝቅተኛ ክምችት የግዢ ዝርዝር አትም።',
      '🖨 Tarreessa kuusaa guutuu maxxansi', 'Tarreessa bitaa kuusaa xiqqaa maxxansi.'],
    v4StartScanner: ['📷 Start scanner', 'Point the camera at the barcode.',
      '📷 መቃኛ ጀምር', 'ካሜራውን ወደ ባርኮዱ ያክብቡ።',
      '📷 Scaaner banali', 'Kaameraa baarkoodiitti faanaa.'],
    v4StopScanner: ['📷 Stop scanner', 'Close the camera scanner.',
      '📷 መቃኛ አቁም', 'የካሜራውን መቃኛ ዝጋ።',
      '📷 Scaaner cufi', 'Scaanera kaameraa cufi.'],
    v4Fold: ['▾ Fold card', 'Show or hide the card\u2019s details.',
      '▾ ካርድ ተዘፍቅ', 'የካርዱን ዝርዝር አሳይ ወይም ደብቅ።',
      '▾ Kaardaa laacci', 'Ibsa kaardaa agarsiisi ykn dhoksi.'],
    v4CashDetail: ['🏆 Cashier performance', 'Open this cashier\u2019s performance details.',
      '🏆 የካሺር አፈጻጸም', 'የዚህ ካሺር የአፈጻጸም ዝርዝር ክፈት።',
      '🏆 Hojii keeshiyaraa', 'Ibsa hojii keeshiyaraa kanaa banaa.'],
    v4mpvVerify: ['✓ Confirm received', 'Mark this mobile payment as received — the deposit goes to the Bank tab and it leaves the cashier list.',
      '✓ ደርሷል አረጋግጥ', 'ይህ የሞባይል ክፍያ ደርሷል ምልክት አድርገው አረጋግጥ — ግብይቱ ወደ ባንክ ሜኑ ይገባል፣ ከካሺር ዝርዝርም ይወጣል።',
      '✓ Ga\u2019eeraa mirkaneessi', 'Kaffaltii moobiilaa kana ga\u2019eeraa jedhii mirkaneessi — galchiin gara Baankii, biilis tarreessa keeshiyaraa irraa ba\u2019a.'],
    v4mpvLost: ['❌ Not received', 'Mark not received — record a loss (or just mark lost).',
      '❌ አልደረሰም', 'አልደረሰም ምልክት — ኪሳራ መዝግብ (ወይም ምልክት ብቻ)።',
      '❌ Hin geenyamne', 'Hin geenyamne jedhii — kasaara galmeessi (ykn mallatteessa qofa).'],
    v4mpvShare: ['📤 Share summary', 'Send today\u2019s pending-payment summary on WhatsApp.',
      '📤 ማጠቃለያ አጋራ', 'የዛሬን የተጠበቀ ክፍያ ማጠቃለያ በWhatsApp ላክ።',
      '📤 Walakkaa qoodi', 'Walakkaa kaffaltii eegamaa har\u2019aa WhatsAppTiin ergi.'],
    v4mpvToggleOpts: ['⚙ Options', 'Open the mobile-pay options.',
      '⚙ ምርጫዎች', 'የሞባይል ክፍያ ምርጫዎችን ክፈት።',
      '⚙ Filannoo', 'Filannoo kaffaltii moobiilaa banaa.'],
    v4mpvLoad: ['🔄 Reload payments', 'Fetch the mobile-payment list again.',
      '🔄 ክፍያዎችን አድስ', 'የሞባይል ክፍያ ዝርዝርን እንደገና አስገባ።',
      '🔄 Kaffaltii haaromsi', 'Tarreessa kaffaltii moobiilaa irra deebi\u2019i fudhachiisi.'],
    v4ToggleCard: ['▾ Fold card', 'Show or hide the card\u2019s details.',
      '▾ ካርድ ተዘፍቅ', 'የካርዱን ዝርዝር አሳይ ወይም ደብቅ።',
      '▾ Kaardaa laacci', 'Ibsa kaardaa agarsiisi ykn dhoksi.'],
    v4ToggleLow: ['⚠ Low-stock fold', 'Show or hide the low-stock list.',
      '⚠ የዝቅተኛ ክምችት ተዘፍቅ', 'የዝቅተኛ ክምችት ዝርዝር አሳይ ወይም ደብቅ።',
      '⚠ Kuusaa xiqqaa laacci', 'Tarreessa kuusaa xiqqaa agarsiisi ykn dhoksi.'],
    loadDashboardV4: ['🔄 Refresh dashboard', 'Reload the dashboard numbers.',
      '🔄 ዳሽቦርድ አድስ', 'የዳሽቦርዱን ቁጥሮች አድስ።',
      '🔄 Dashboordii haaromsi', 'Lakkoofsa dashboordii haaromsi.'],
    /* — KITCHEN — */
    'updateStatus|Preparing': ['▶ Start cooking', 'Tell everyone this ticket is being prepared.',
      '▶ እየተዘጋጀ አስጀምር', 'ይህ ትኬት እየተዘጋጀ መሆኑን አሳውቅ።',
      '▶ Qopheessuu banali', 'Tiikitiin kana qopheessaa jira jedhii beeksisi.'],
    'updateStatus|Ready': ['✅ Mark ready', 'Ticket done — the waiter is notified.',
      '✅ ዝግጁ ምልክት', 'ትኬቱ ተጠናቋል — ለኋላሽኑ ይፈቀዃል።',
      '✅ Qophaa\u2019e mallatteessi', 'Tiikitii xumure — tajaajiltootatti beeksama.'],
    undoReady: ['↩ Undo ready', 'Put this ticket back to preparing.',
      '↩ ዝግጁነት መልስ', 'ይህን ትኬት ወደ እየተዘጋጀ መልስ።',
      '↩ Qophaa\u2019insa deebisi', 'Tiikita kana deebi\u2019i qopheessuu keessa kaa\u2019i.'],
    filterStation: ['🍳 Station filter', 'Show only one station\u2019s tickets.',
      '🍳 የጣቢያ ማጣሪያ', 'የአንድ ጣቢያ ትኬቶች ብቻ አሳይ።',
      '🍳 Cuqaasa filadhu', 'Tiikitii cuqaa tokko qofa agarsiisi.'],
    openKitAlerts: ['🔔 Alert settings', 'Sound, vibration and voice for new orders.',
      '🔔 የማንቂያ ቅንብሮች', 'ለአዲስ ትዕዛዞች ድምፅ፣ ማረብ እና ድምፅ ሰጪ።',
      '🔔 Qindaa\u2019ina yaadannoo', 'Sagalee, rukuttaa fi dereera ajajota haaraaaf.'],
    closeKitAlerts: ['✖ Close', 'Close the alert settings.',
      '✖ ዝጋ', 'የማንቂያ ቅንብሮችን ዝጋ።',
      '✖ Cufi', 'Qindaa\u2019ina yaadannoo cufi.'],
    /* — MENU (customer QR) — */
    placeOrder: ['📤 Place order', 'Send your order to the kitchen.',
      '📤 ትዕዛዝ ላክ', 'ትዕዛዝህን ወደ ምግብ ቤት ላክ።',
      '📤 Ajaja ergi', 'Ajaja kee gara kicheniitti ergi.'],
    openCart: ['🛒 Your order', 'Review the items and send the order.',
      '🛒 ትዕዛዝህ', 'እቃዎቹን መልከትና ትዕዛዙን ላክ።',
      '🛒 Ajaja kee', 'Wantoota ilaali, ajaja ergi.'],
    'changeCartQty|1': ['➕ Increase quantity', 'Add one more of this item.',
      '➕ ብዛት ጨምር', 'ከዚህ እቃ አንድ ተጨማሪ ጨምር።',
      '➕ Lakkoofsa dabali', 'Wantoota kana tokko dabalisi.'],
    'changeCartQty|-1': ['➖ Decrease quantity', 'Take one of this item away.',
      '➖ ብዛት ቀንስ', 'ከዚህ እቃ አንድ ቀንስ።',
      '➖ Lakkoofsa hir\u2019isuu', 'Wantoota kana tokko hir\u2019isi.'],
    checkModifiersBeforeAdd: ['➕ Add to order', 'Choose the options, then add to your order.',
      '➕ ወደ ትዕዛዝ ጨምር', 'አማራጮችን ምረጥ፣ ከዚያ ወደ ትዕዛዝህ ጨምር።',
      '➕ Ajajaatti dabali', 'Filannoo filadhu, sana booda ajaja keetti dabali.'],
    addModifiedItemToCart: ['➕ Add to order', 'Add this item with the chosen options.',
      '➕ ወደ ትዕዛዝ ጨምር', 'ይህን እቃ ከተመረጡ አማራጮች ጋር ጨምር።',
      '➕ Ajajaatti dabali', 'Wantoo kana filannoo filameen dabali.'],
    callWaiter: ['🙋 Call waiter', 'Ask a waiter to come to your table.',
      '🙋 ኋላሽን ጥራ', 'ኋላሽን ወደ ሠንጠረዥህ ጥራ።',
      '🙋 Tajaajiltaa waamichi', 'Tajaajiltaa gara taabala keetti waami.'],
    closeLightbox: ['✖ Close', 'Close the picture.',
      '✖ ዝጋ', 'ስዕሉን ዝጋ።',
      '✖ Cufi', 'Fakkii cufi.'],
    /* — HOTEL — */
    htlCheckout: ['🧾 Check out', 'Close the folio and take payment.',
      '🧾 Check out', 'ሂሳቡን ዝጋና ክፍያ ውሰድ።',
      '🧾 Check out', 'Folio cufi, kaffalii fudhadhu.'],
    htlSetRoomStatus: ['🧹 Room status', 'Mark the room clean or dirty.',
      '🧹 የክፍል ሁኔታ', 'ክፍሉ ንጹህ ወይም መረባቢ ምልክት አድርግ።',
      '🧹 Haala kuta', 'Kutaa qulqulleessaa ykn qulqulleessaa mallatteessi.'],
    htlOpenRoom: ['🚪 Open room', 'Open this room\u2019s details.',
      '🚪 ክፍል ክፈት', 'የዚህ ክፍል ዝርዝር ክፈት።',
      '🚪 Kutaa banaa', 'Ibsa kutaa kanaa banaa.'],
    htlOpenFolio: ['📋 Folio', 'All charges of this room.',
      '📋 ሂሳብ', 'ሁሉም የዚህ ክፍል ክፍያዎች።',
      '📋 Folio', 'Kaffaltii kuta kanaa hunda.'],
    htlPayModal: ['💳 Take payment', 'Take the room payment.',
      '💳 ክፍያ ውሰድ', 'የክፍሉን ክፍያ ውሰድ።',
      '💳 Kaffalii fudhadhu', 'Kaffaltii kutaa fudhadhu.'],
    htlReserveArrive: ['📥 Walk-in check-in', 'Check a walk-in guest in now.',
      '📥 በመጣ ጊዜ ግባ', 'ያለቅድሚያ የመጣ እንግዳ አሁን ግባ።',
      '📥 Seensa mana', 'Bakka bu\u2019aa yeroo ammaa seenisi.'],
    htlReportMaintenance: ['🔧 Report maintenance', 'Report a problem with this room.',
      '🔧 ጥገና ሪፖርት', 'የዚህ ክፍል ችግር ሪፖርት አድርግ።',
      '🔧 Hojii teeccuuu beeksi', 'Rakkoo kutaa kanaa beeksi.'],
    htlQuickCharge: ['⚡ Quick charge', 'Add a quick charge to the folio.',
      '⚡ ፈጣን ክፍያ', 'ፈጣን ክፍያ ወደ ሂሳቡ ጨምር።',
      '⚡ Kaffaltii saffisaa', 'Kaffaltii saffisaa foliootti dabalisi.'],
    htlCloseModal: ['✖ Close', 'Close this window.',
      '✖ ዝጋ', 'ይህን መስኮት ዝጋ።',
      '✖ Cufi', 'Akkaana kana cufi.'],
    /* — LOGIN / INDEX / MASTER / STAFF / QR — */
    doOwnerSignIn: ['🔓 Owner sign-in', 'Open your shop admin.',
      '🔓 የባለቤት መግቢያ', 'የመደብር አስተዳዳሪህን ክፈት።',
      '🔓 Seensa abbaa bittaa', 'Admin dukaantaa banaa.'],
    login: ['🔓 Login', 'Sign in with your name and password.',
      '🔓 ግባ', 'በስምህና በይለፍ ቃል ግባ።',
      '🔓 Seeni', 'Maqaa fi jecha icciitii keetiin seeni.'],
    kitchenLogin: ['🔓 Kitchen login', 'Sign in to the kitchen screen.',
      '🔓 የምግብ ቤት መግቢያ', 'ወደ ምግብ ቤት ማዕከል ግባ።',
      '🔓 Seensa kichenii', 'Agarsiisa kicheniitti seeni.'],
    htlStaffLogin: ['🔓 Staff login', 'Sign in to the hotel screen.',
      '🔓 የሠራተኛ መግቢያ', 'ወደ ሆቴል ማዕከል ግባ።',
      '🔓 Seensa hojjetaa', 'Agarsiisa hotelaatti seeni.'],
    masterLogin: ['🔓 Master login', 'Sign in as the master controller.',
      '🔓 የማስተር መግቢያ', 'እንደ ማስተር መቆጣጠሪያ ግባ።',
      '🔓 Seensa masitaraa', 'Akka too\u2019ataa masitaraa seeni.'],
    doSignIn: ['🔓 Sign in', 'Enter with your account.',
      '🔓 ግባ', 'በመለያህ ግባ።',
      '🔓 Seeni', 'Herrega keetiin seeni.'],
    logout: ['🚪 Logout', 'Leave this screen.',
      '🚪 ውጣ', 'ከዚህ ማዕከል ውጣ።',
      '🚪 Ba\u2019i', 'Iddoo kana irraa ba\u2019i.'],
    adminLogout: ['🚪 Logout', 'Leave the admin screen.',
      '🚪 ውጣ', 'ከአስተዳዳሪ ማዕከል ውጣ።',
      '🚪 Ba\u2019i', 'Admin irraa ba\u2019i.'],
    kitchenLogout: ['🚪 Logout', 'Leave the kitchen screen.',
      '🚪 ውጣ', 'ከምግብ ቤት ማዕከል ውጣ።',
      '🚪 Ba\u2019i', 'Kichenii irraa ba\u2019i.'],
    htlLogout: ['🚪 Logout', 'Leave the hotel screen.',
      '🚪 ውጣ', 'ከሆቴል ማዕከል ውጣ።',
      '🚪 Ba\u2019i', 'Hotela irraa ba\u2019i.'],
    masterLogout: ['🚪 Logout', 'Leave the master screen.',
      '🚪 ውጣ', 'ከማስተር ማዕከል ውጣ።',
      '🚪 Ba\u2019i', 'Masitaraa irraa ba\u2019i.'],
    ownerSignOut: ['🚪 Sign out', 'Leave your account.',
      '🚪 ውጣ', 'ከመለያህ ውጣ።',
      '🚪 Ba\u2019i', 'Herrega kee irraa ba\u2019i.'],
    verifyMasterPin: ['🔐 Verify PIN', 'Check the master PIN.',
      '🔐 PIN አረጋግጥ', 'የማስተር PIN አረጋግጥ።',
      '🔐 PIN mirkaneessi', 'PIN masitaraa mirkaneessi.'],
    verifyAppPin: ['🔐 Verify PIN', 'Check the app PIN.',
      '🔐 PIN አረጋግጥ', 'የመተግበሪያውን PIN አረጋግጥ።',
      '🔐 PIN mirkaneessi', 'PIN app kanaa mirkaneessi.'],
    verifyExitCode: ['🔐 Exit verification', 'Enter the exit code to leave.',
      '🔐 የመውጫ ማረጋገጫ', 'ለመውጣት የመውጫ ኮዱን አስገባ።',
      '🔐 Mirkaneessa ba\u2019insaa', 'Koodii ba\u2019insaa galchi.'],
    regTogglePwd: ['👁 Show password', 'Show or hide the typed password.',
      '👁 ይለፍ ቃል አሳይ', 'የተጻፈውን ይለፍ ቃል አሳይ ወይም ደብቅ።',
      '👁 Jecha icciitii agarsiisi', 'Jecha icciitii barreeffame agarsiisi ykn dhoksi.'],
    wzGo: ['➡ Next', 'Next step of the setup wizard.',
      '➡ ቀጣይ', 'የማዋቀሪያው ቀጣይ ደረጃ።',
      '➡ Itti aanu', 'Hatkee tokko itti aanu qindeessaa.'],
    wzCreate: ['🚀 Create shop(s)', 'Create the shop(s) from the wizard.',
      '🚀 መደብር ፍጠር', 'መደብሮችን ከማዋቀሪያው ፍጠር።',
      '🚀 Dukaan uumi', 'Dukaanota qindeessaa irraa uumi.'],
    wzConfirmAndCreate: ['🚀 Create shop(s)', 'Finish the wizard and create.',
      '🚀 ፍጠር', 'ማዋቀሪያውን ጨርስና ፍጠር።',
      '🚀 Uumi', 'Qindeessaa xumuri, uumi.'],
    createTrialShops: ['🎁 Create trial', 'Create a trial shop to try the system.',
      '🎁 ሙከራ ፍጠር', 'ስርዓቱን ለመሞከር የሙከራ መደብር ፍጠር።',
      '🎁 Yaalii uumi', 'Sirna yaaluuf dukaan yaalii uumi.'],
    launchTab: ['🚀 Launch', 'Open this app screen.',
      '🚀 አስጀምር', 'ይህን የመተግበሪያ ማዕከል ክፈት።',
      '🚀 Banali', 'Agarsiisa app kanaa banaa.'],
    copyInvite: ['📋 Copy invite', 'Copy the invite code / link.',
      '📋 ግብዣ ቅዳ', 'የግብዣ ኮዱን / አገናኙን ቅዳ።',
      '📋 Ergaa walqabatee copy godhi', 'Koodii / linkii ergaaa copy godhi.'],
    setPricingCycle: ['💳 Billing cycle', 'Monthly or yearly billing.',
      '💳 የክፍያ ዑደት', 'ወርሃዊ ወይም ዓመታዊ ክፍያ።',
      '💳 Naannoo kaffalaa', 'Kaffaltii ji\u2019aa ykn waggaa.'],
    doForgot: ['🔑 Forgot password', 'Reset your password.',
      '🔑 ይለፍ ቃል ረሳህ?', 'ይለፍ ቃልህን ዳግም አስቀምጥ።',
      '🔑 Jecha icciitii irraanfate', 'Jecha icciitii haaromsi.'],
    generateLicenseFor: ['🔑 Generate licence', 'Create a licence key for this shop.',
      '🔑 ፈቃድ ፍጠር', 'ለዚህ መደብር የፈቃድ ቁልፍ ፍጠር።',
      '🔑 Laayisansii uumi', 'Saamicha laayisansii dukaana kanaaaf uumi.'],
    masterBlockShop: ['⛔ Block shop', 'Block this shop from the system.',
      '⛔ መደብር አግድ', 'ይህን መደብር ከስርዓቱ አግድ።',
      '⛔ Dukaan cufi', 'Dukaana kana sirna irraa cufi.'],
    saveAllPlans: ['💾 Save plans', 'Save all pricing plans.',
      '💾 ዕቅዶች አስቀምጥ', 'ሁሉንም የዋጋ ዕቅዶች አስቀምጥ።',
      '💾 Qorqooddu olkaa\u2019i', 'Qorqooddu hunda olkaa\u2019i.'],
    saveSupportContacts: ['💾 Save contacts', 'Save the support phone numbers.',
      '💾 እውቂያዎች አስቀምጥ', 'የድጋፍ ስልክ ቁጥሮችን አስቀምጥ።',
      '💾 Quunnamtii olkaa\u2019i', 'Lakkoofsa bilbila deeggarsaa olkaa\u2019i.'],
    saveGlobalTrialDays: ['💾 Save trial days', 'Save the default trial length.',
      '💾 የሙከራ ቀናት አስቀምጥ', 'የመደበኛውን የሙከራ ጊዜ አስቀምጥ።',
      '💾 Guyyoota yaalii olkaa\u2019i', 'Dheerina yaalii durtii olkaa\u2019i.'],
    doUnlock: ['🔓 Unlock', 'Unlock the staff door.',
      '🔓 ክፈት', 'የሠራተኛ በር ክፈት።',
      '🔓 Banaa', 'Balbala hojjetaa banaa.'],
    lockDoor: ['🔒 Lock door', 'Lock the staff door.',
      '🔒 በር ቁልፍ', 'የሠራተኛ በር ቁልፍ።',
      '🔒 Balbala cufi', 'Balbala hojjetaa cufi.'],
    doorRetry: ['🔄 Retry', 'Try connecting again.',
      '🔄 እንደገና ሞክር', 'እንደገና ሞክር።',
      '🔄 Irra deebi\u2019i yaali', 'Irra deebi\u2019i yaali.'],
    refreshLists: ['🔄 Refresh', 'Reload both lists.',
      '🔄 አድስ', 'ሁለቱን ዝርዝሮች አድስ።',
      '🔄 Haaromsi', 'Tarreessa lamaan haaromsi.'],
    generate: ['🔄 Generate QR codes', 'Make the table QR codes.',
      '🔄 QR ኮዶች ፍጠር', 'የሠንጠረዥ QR ኮዶችን ፍጠር።',
      '🔄 Koodii QR uumi', 'Koodii QR taabalaa uumi.'],
    resetAll: ['🗑 Reset all', 'Clear every entry. Asks first.',
      '🗑 ሁሉን አጽዳ', 'ሁሉንም ማስገቢያ አጽዳ። መጀመሪያ ይጠይቃል።',
      '🗑 Hunda haqi', 'Galmeessa hunda haqi. Jalqabaa gaafata.'],
    fillGenerated: ['📋 Use generated code', 'Fill the code field with the generated one.',
      '📋 ኮድ መልስ', 'የኮድ ሳጥኑን በተፈጠረው ሙላ።',
      '📋 Koodii guutuu', 'Iddoo koodii koodii uumamaatiin guutuu.']
  };

  /* ── icon-only buttons (dictionary by normalized icon) ── */
  BY_ICON = {
    '✏': ['✏️ Edit', 'Change this row.',
      '✏️ አስተካክል', 'ይህን ረድፍ አስተካክል።', '✏️ Sirreessi', 'Sarara kana sirreessi.'],
    '🗑': ['🗑 Delete', 'Remove this row. Asks first.',
      '🗑 አጥፋ', 'ይህን ረድፍ ያስወግዳል። መጀመሪያ ይጠይቃል።', '🗑 Haqi', 'Sarara kana haqi. Jalqabaa gaafata.'],
    '📋': ['📋 Details', 'Open the full details card.',
      '📋 ዝርዝር', 'ሙሉ ዝርዝሩን ክፈት።', '📋 Ibsa', 'Ibsa guutuu banaa.'],
    '👁': ['👁 Show on menu', 'This product is visible on the customer phone menu.',
      '👁 በሜኑ ላይ ይታያል', 'ይህ ምርት በደንበኛ ስልክ ሜኑ ላይ ይታያል።', '👁 Menee keessatti mul\u2019ata', 'Oomishuu kuni menee miseenaa keessatti mul\u2019ata.'],
    '🚫': ['🚫 Hidden from menu', 'This product is hidden from the customer phone menu.',
      '🚫 ከሜኑ የተደበቀ', 'ይህ ምርት ከደንበኛ ስልክ ሜኑ ተደብቋል።', '🚫 Menee irraa dhokate', 'Oomishuu kuni menee miseenaa irraa dhokateera.'],
    '🏆': ['🏆 Performance', 'Open the performance details.',
      '🏆 አፈጻጸም', 'የአፈጻጸም ዝርዝር ክፈት።', '🏆 Hojii', 'Ibsa hojii banaa.'],
    '✖': ['✖ Close', 'Close this window.',
      '✖ ዝጋ', 'ይህን መስኮት ዝጋ።', '✖ Cufi', 'Akkaana kana cufi.'],
    '➕': ['➕ Add', 'Add one more.',
      '➕ ጨምር', 'አንድ ተጨማሪ ጨምር።', '➕ Dabali', 'Tokko dabalisi.'],
    '➖': ['➖ Remove one', 'Take one out.',
      '➖ አንድ ቀንስ', 'አንድ አውጣ።', '➖ Tokko baasi', 'Tokko baasi.'],
    '📤': ['📤 Share', 'Send as a WhatsApp message.',
      '📤 አጋራ', 'እንደ WhatsApp መልእክት ላክ።', '📤 Qoodi', 'Ergaa WhatsAppTiin ergi.'],
    '💾': ['💾 Save', 'Save the changes.',
      '💾 አስቀምጥ', 'ለውጦችን አስቀምጥ።', '💾 Olkaa\u2019i', 'Jijjiirama olkaa\u2019i.'],
    '🖨': ['🖨 Print', 'Send to the printer.',
      '🖨 አትም', 'ወደ ማተሚያው ላክ።', '🖨 Maxxansi', 'Maxxansaa ergi.'],
    '🔄': ['🔄 Refresh', 'Reload the data.',
      '🔄 አድስ', 'መረጃውን አድስ።', '🔄 Haaromsi', 'Deetaa haaromsi.'],
    '⬇': ['⬇ Load more', 'Show older rows.',
      '⬇ ተጨማሪ አሳይ', 'ያሧፊ ረድፎችን አሳይ።', '⬇ Dabalata agarsiisi', 'Sararree duraa agarsiisi.'],
    '◀': ['◀ Previous page', 'Go to the previous page.',
      '◀ ያለፈ ገጽ', 'ወደ ያለፈው ገጽ ሂድ።', '◀ Fuulla duraa', 'Fuulla duraatti deemi.'],
    '▶': ['▶ Next page', 'Go to the next page.',
      '▶ ቀጣይ ገጽ', 'ወደ ቀጣዩ ገጽ ሂድ።', '▶ Fuulla itti aanu', 'Fuulla itti aanuutti deemi.'],
    '🔍': ['🔍 Search', 'Find by name.',
      '🔍 ፈልግ', 'በስም ፈልግ።', '🔍 Barbaadi', 'Maqaaiban barbaadi.'],
    '✓': ['✓ Confirm', 'Yes — go ahead.',
      '✓ አረጋግጥ', 'አዎ — ቀጥል።', '✓ Mirkaneessi', 'Eeyyee — itti fufi.'],
    '❌': ['❌ No', 'Reject / not received.',
      '❌ አይደለም', 'አትቀበል / አልደረሰም።', '❌ Lakkii', 'Fudhadduu / hin geenyamne.'],
    '🚚': ['🚚 Transfer', 'Move stock.',
      '🚚 ዝውውር', 'ክምችት አንቀሳቅስ።', '🚚 Sochii', 'Kuusaa sochiisi.'],
    '⏳': ['⏳ Waiting verification', 'Recorded, waiting for the owner\u2019s check.',
      '⏳ ማረጋገጫ በመጠበቅ', 'ተመዝግቧል፣ የባለቤት ፍተሻ በመጠበቅ ላይ።', '⏳ Mirkaneessa eegata', 'Galmeeffame, yaadannoo abbaa bittaa eegata.'],
    '🔔': ['🔔 Alerts', 'Sound and vibration settings.',
      '🔔 ማንቂያዎች', 'የድምፅና ማረብ ቅንብሮች።', '🔔 Yaadannoo', 'Qindaa\u2019ina sagalee fi rukuttaa.'],
    '🙋': ['🙋 Call waiter', 'Ask a waiter to come.',
      '🙋 ኋላሽን ጥራ', 'ኋላሽን ጥራ።', '🙋 Tajaajiltaa waami', 'Tajaajiltaa waami.'],
    '🔓': ['🔓 Unlock / login', 'Enter or unlock.',
      '🔓 ክፈት / ግባ', 'ግባ ወይም ክፈት።', '🔓 Banaa / seeni', 'Seeni ykn banaa.'],
    '↩': ['↩ Undo / back', 'Go back one step.',
      '↩ መልስ', 'አንድ ደረጃ ተመለስ።', '↩ Deebi\u2019i', 'Hatkee tokko deebi\u2019i.'],
    '➤': ['➤ Send', 'Send the message.',
      '➤ ላክ', 'መልእክቱን ላክ።', '➤ Ergi', 'Ergaa ergi.'],
    '⭐': ['⭐ Favourite', 'Pin for one-tap access.',
      '⭐ ተወዳጅ', 'ለፈጣን መዳረሻ ተከትል።', '⭐ Kan jaallatame', 'Qooduuf mallatteessi.'],
    '🛒': ['🛒 Cart / order', 'Open the order cart.',
      '🛒 ጋሪ / ትዕዛዝ', 'የትዕዛዝ ጋሪውን ክፈት።', '🛒 Kaartii ajajaa', 'Kaartii ajajaa banaa.'],
    '☰': ['☰ Menu', 'Open the menu.',
      '☰ ሜኑ', 'ሜኑውን ክፈት።', '☰ Menee', 'Menee banaa.']
  };
  (function () {                                   /* alias close/search icons */
    var CLOSE = BY_ICON['✖'];
    if (CLOSE) { BY_ICON['✕'] = CLOSE; BY_ICON['×'] = CLOSE; }
    if (BY_ICON['🔍']) BY_ICON['🔎'] = BY_ICON['🔍'];
  })();

  /* ── text patterns (first match wins; also match am/om labels) ── */
  BY_TEXT = [
    [/^(save|💾|አስቀምጥ)/i, ['Save', 'Save the changes now.',
      'አስቀምጥ', 'ለውጦችን አሁን አስቀምጥ።', 'Olkaa\u2019i', 'Jijjiirama amma olkaa\u2019i.']],
    [/cancel|ሰርዝ|haqi\s*dabali/i, ['Cancel', 'Discard changes and close.',
      'ሰርዝ', 'ለውጦችን ተወና ዝጋ።', 'Haqi', 'Jijjiirama dhiisi, cufi.']],
    [/(delete|remove|🗑|አጥፋ|አጽዳ|haqi|balleessi)/i, ['Delete', 'Remove this — asks for confirmation first.',
      'አጥፋ', 'ይህን ያስወግዳል — መጀመሪያ ይጠይቃል።', 'Haqi', 'Kana haqi — jalqabaa gaafata.']],
    [/^(close|✖|×|✕|back|↩|ዝጋ|cufi)/i, ['Close', 'Close this and go back.',
      'ዝጋ', 'ዝግና ተመለስ።', 'Cufi', 'Cufi, deebi\u2019i.']],
    [/(share|📤|whatsapp|አጋራ|qoodi)/i, ['Share', 'Send as a WhatsApp message.',
      'አጋራ', 'እንደ WhatsApp መልእክት ላክ።', 'Qoodi', 'Ergaa WhatsAppTiin ergi.']],
    [/(print|🖨|አትም|maxxansi)/i, ['Print', 'Send to the receipt printer.',
      'አትም', 'ወደ ደረሰኝ ማተሚያ ላክ።', 'Maxxansi', 'Maxxansaa rasiishiitti ergi.']],
    [/(refresh|reload|retry|🔄|try again|አድስ|haaromsi)/i, ['Refresh', 'Load the data again.',
      'አድስ', 'መረጃውን እንደገና ጫን።', 'Haaromsi', 'Deetaa irra deebi\u2019i fudhachiisi.']],
    [/(load more|show more|⬇|more\b)/i, ['Load more', 'Show older rows.',
      'ተጨማሪ አሳይ', 'ያሧፊ ረድፎችን አሳይ።', 'Dabalata agarsiisi', 'Sararree duraa agargisi.']],
    [/^(prev|◀|previous|ያለፈ)/i, ['Previous page', 'Go to the previous page.',
      'ያለፈ ገጽ', 'ወደ ያለፈው ገጽ ሂድ።', 'Fuulla duraa', 'Fuulla duraatti deemi.']],
    [/^(next|▶|ቀጣይ|itti aanu)/i, ['Next page', 'Go to the next page.',
      'ቀጣይ ገጽ', 'ወደ ቀጣዩ ገጽ ሂድ።', 'Fuulla itti aanu', 'Fuulla itti aanuutti deemi.']],
    [/^(add|\+|new|➕|create|ጨምር|uumi|dabali)/i, ['Add', 'Add a new one.',
      'ጨምር', 'አዲስ ጨምር።', 'Dabali', 'Haaraa tokko dabalisi.']],
    [/(search|🔍|🔎|find|filter|ፈልግ|barbaadi)/i, ['Search', 'Type to narrow the list.',
      'ፈልግ', 'ዝርዝሩን ለማሳጠር ጻፍ።', 'Barbaadi', 'Tarreessa dhipheessuuf barreessi.']],
    [/(export|csv|excel|xls|ላክ.*excel|excel.*baadi)/i, ['Export', 'Download as an Excel file.',
      'ወደ ውጭ ላክ', 'እንደ Excel ፋይል አውርድ።', 'Baadi', 'Faayilii ExcelTiin gadii.']],
    [/^(edit|✏|አስተካክል|sirreessi)/i, ['Edit', 'Change the details.',
      'አስተካክል', 'ዝርዝሮችን ለውጥ።', 'Sirreessi', 'Ibsa jijjiiri.']],
    [/(log\s?in|sign\s?in|login|ግባ|seeni)/i, ['Sign in', 'Enter with your name and password.',
      'ግባ', 'በስምህና በይለፍ ቃል ግባ።', 'Seeni', 'Maqaa fi jecha icciitii keetiin seeni.']],
    [/(log\s?out|sign\s?out|logout|ውጣ|ba\u2019i)/i, ['Sign out', 'Leave this screen.',
      'ውጣ', 'ከዚህ ማዕከል ውጣ።', 'Ba\u2019i', 'Iddoo kana irraa ba\u2019i.']],
    [/(verify|confirm|✓|activate|አረጋግጥ|mirkaneessi|kaa\u2019adhu)/i, ['Confirm', 'Yes — go ahead with this action.',
      'አረጋግጥ', 'አዎ — ይህን ተግባር ቀጥል።', 'Mirkaneessi', 'Eeyyee — tarkaanfi kana itti fufi.']],
    [/^(test|▶\s?test)/i, ['Test', 'Play a sample alert with your settings.',
      'ሙከራ', 'በቅንብሮችህ ናሙና ማንቂያ አጫውት።', 'Yaalii', 'Yaadannoo qoodaa qindaa\u2019ina keesaan taphisi.']],
    [/^(clear|empty|reset|አጽዳ)/i, ['Clear', 'Start over — asks first.',
      'አጽዳ', 'እንደገና ጀምር — መጀመሪያ ይጠይቃል።', 'Haqi', 'Irra deebi\u2019i eegali — jalqabaa gaafata.']],
    [/(open|show|view|details?|📋|ክፈት|banaa|agarsiisi)/i, ['Open', 'Open the details.',
      'ክፈት', 'ዝርዝሩን ክፈት።', 'Banaa', 'Ibsa banaa.']],
    [/(send|submit|place order|➤|ላክ|ergi)/i, ['Send', 'Send it on its way.',
      'ላክ', 'ላከው።', 'Ergi', 'Ergi isa.']]
  ];

  /* ══════════════ 8 · BOOT ══════════════ */
  function boot() {
    injectCss();
    if (!OFF) wire();
  }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(boot);

  /* ── public API ── */
  window.SSHint = {
    version: VER,
    isOn: function () { return !OFF; },
    off: function () { OFF = true; try { localStorage.setItem('ssHintOff', '1'); } catch (e) {} hide(); return 'SSHint OFF — button hints disabled on this device'; },
    on: function () { OFF = false; try { localStorage.removeItem('ssHintOff'); } catch (e) {} wire(); return 'SSHint ON'; },
    toggle: function () { return OFF ? this.on() : this.off(); },
    hide: hide,
    /* test hooks */
    _resolve: resolve, _pack: pack, _idx: idx, _place: place, _fnEntry: fnEntry, _iconKey: iconKey,
    _state: function () { return { visible: !!(tipEl && curTipEl), el: curTipEl, off: OFF }; },
    _dicts: function () { return { BY_ID: BY_ID, BY_FN: BY_FN, BY_ICON: BY_ICON, BY_TEXT: BY_TEXT, GENERIC: GENERIC, DIS: DIS }; }
  };
})();
