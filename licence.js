/* ═══════════════════════════════════════════════════════════════════
   BizMaster · LICENCE & TRIAL ENGINE v2  (Ctrl+F "BIZ-LIC-2")
   ─────────────────────────────────────────────────────────────────
   THE ONE RULE THAT CHANGED EVERYTHING (v2):
     The MASTER panel owns every number. This file invents NOTHING.
       · Plans, prices (Br), limits, features  → `plans` table
       · Trial days, warning days, shops/type  → `global_settings`
         (id='globalConfig': default_trial_days, trial_warning_days,
          trial_shops_per_type, support_phone, support_email, …)
       · Licence keys (SMART-…-SHOPID-XXXX)    → `licenses` table,
         generated ONLY by master.html. The customer side never
         generates, guesses or prices a key — it can only enter one.
     Currency is Br (Ethiopian Birr) because that is what the Master
     panel charges in.

   NOTIFICATION RULES (from global_settings, defaults in brackets):
     · Trial, day 1 … (T−W)   → totally SILENT. Nothing anywhere.
     · Trial, last W days     → full information: countdown + the
                                licence window with live plans and
                                support contacts.
     · After trial            → 3-day read-only grace, then locked.
                                Data is never deleted by this file.
     · Licensed & healthy     → the licence system is INVISIBLE.
     · Licence ends in ≤ W d  → owner-only blue renewal note.
     · Blocked by the Master  → red screen with support contacts.

   HOW A PAGE USES IT (one line, unchanged from v1):
     <script src="licence.js" data-spp-app="pos"></script>
     data-spp-app    pos | kitchen | hotel | menu | admin | index | staff
     data-spp-mode   staff (default) | customer  (customer = gentle
                     lock for the public QR menu — no licence talk)
     data-spp-silent "1" = compute status, show no banner / lock
   Manual:   SPP.init({ app:'pos', shopId:'…', onReady: fn })
   Helpers:  SPP.computeStatus(shopRow, licensesRows)
             SPP.dayInfo(trialStartIso) · SPP.getStatus()
             SPP.openLicence(shopId)  → the licence window
             SPP.activateKey(shopId, key) · SPP.claimShopByKey(key, email)
             SPP.plans() · SPP.cfg  (live from the Master)
   REMOVED on purpose: SPP.genKey / every hardcoded plan & price.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── constants that are NOT the Master's business ── */
  var GRACE_DAYS = 3;          // read-only days after trial/licence ends
  var CACHE_MS = 10 * 60 * 1000; // status cache so staff apps open fast

  /* ── live configuration (filled from global_settings + plans) ── */
  var CFG = {
    trialDays: 30, warnDays: 5, perType: 1,
    currency: 'Br',
    support: { phone: '', email: '', telegram: '', facebook: '', instagram: '', website: '' }
  };
  var PLANS = [];              // live `plans` rows
  var MODE = { app: 'pos', mode: 'staff', silent: false, shopId: null, onReady: null };
  var READY = false, booting = null;

  /* ── Supabase: reuse the page's client when it has one ── */
  function sb() {
    if (window.SPP_SB) return window.SPP_SB;
    if (window.sb) return window.sb;
        if (window.supabaseClient) return window.supabaseClient;   // reuse the admin app's client
    return null;
  }
  function makeSb() {
    if (!window.supabase || !window.supabase.createClient) return null;
    var url = '', key = '';
    try { if (typeof SS_CONFIG !== 'undefined') { url = SS_CONFIG.SUPABASE_URL; key = SS_CONFIG.SUPABASE_KEY; } } catch (e) {}
    if (!url) return null;
    try { return window.supabase.createClient(url, key, { auth: { flowType: 'implicit' } }); } catch (e) { return null; }
  }
  function client() { var c = sb(); if (c) return c; c = makeSb(); if (c) window.SPP_SB = c; return c; }

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('TIMEOUT')); }, ms); })]);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(key, vars) { try { return window.LANG ? LANG.t(key, vars) : key; } catch (e) { return key; } }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(iso || '').slice(0, 10); } }

  /* ═══════════ 1. LIVE CONFIG + PLANS (the Master's numbers) ═══════════ */

  async function loadGlobalSettings() {
    var c = client(); if (!c) return;
    try {
      var r = await withTimeout(c.from('global_settings')
        .select('default_trial_days,trial_warning_days,trial_shops_per_type,support_phone,support_email,support_telegram,support_facebook,support_instagram,support_website')
        .eq('id', 'globalConfig').maybeSingle(), 8000);
      var d = r && r.data;
      if (d) {
        if (d.default_trial_days > 0) CFG.trialDays = d.default_trial_days;
        if (d.trial_warning_days != null && d.trial_warning_days >= 0) CFG.warnDays = d.trial_warning_days;
        if (d.trial_shops_per_type > 0) CFG.perType = d.trial_shops_per_type;
        CFG.support = {
          phone: d.support_phone || '', email: d.support_email || '',
          telegram: d.support_telegram || '', facebook: d.support_facebook || '',
          instagram: d.support_instagram || '', website: d.support_website || ''
        };
      }
    } catch (e) { /* defaults stay — the panel was never opened */ }
  }

  async function loadPlans() {
    var c = client(); if (!c) return;
    try {
      var r = await withTimeout(c.from('plans').select('*').eq('active', true).order('display_order'), 8000);
      PLANS = (r && r.data) || [];
    } catch (e) { PLANS = []; }
  }

  function plans() { return PLANS; }
  function planById(id) {                      // compat: v1 passed ids; keys carry names
    for (var i = 0; i < PLANS.length; i++) {
      if (PLANS[i].name === id || String(PLANS[i].id) === String(id)) return PLANS[i];
    }
    return null;
  }

  /* ═══════════ 2. TRIAL / LICENCE MATH ═══════════ */

  function dayInfo(startIso) {
    var start = startIso ? new Date(startIso).getTime() : NaN;
    if (!isFinite(start)) return { dayNum: 0, daysLeft: 0, trialActive: false, warn: false, grace: false, expired: true, valid: false };
    var now = Date.now();
    var daysLeft = Math.ceil((start + CFG.trialDays * 86400000 - now) / 86400000);
    var dayNum = CFG.trialDays - daysLeft + 1;
    return {
      dayNum: dayNum, daysLeft: daysLeft,
      trialActive: daysLeft >= 0,
      warn: daysLeft >= 0 && daysLeft <= CFG.warnDays,
      grace: daysLeft < 0 && daysLeft >= -GRACE_DAYS,
      expired: daysLeft < -GRACE_DAYS,
      valid: true
    };
  }

  function trialEndOf(sh) {
    if (sh && sh.trial_expires) return new Date(sh.trial_expires);
    var start = (sh && (sh.trial_started_at || sh.created_at)) ? new Date(sh.trial_started_at || sh.created_at) : null;
    if (!start || !isFinite(start)) return null;
    return new Date(start.getTime() + CFG.trialDays * 86400000);
  }

  /* statusOfLicence: newest ACTIVE row for this shop in `licenses` */
  function bestLicence(shopId, licensesRows) {
    if (!licensesRows || !licensesRows.length) return null;
    var best = null;
    for (var i = 0; i < licensesRows.length; i++) {
      var l = licensesRows[i];
      if (l.shop_id !== shopId) continue;
      if (l.status && l.status !== 'active') continue;
      if (!best || new Date(l.created_at || 0) > new Date(best.created_at || 0)) best = l;
    }
    return best;
  }

  function computeStatus(sh, licensesRows) {
    var g = typeGroup(sh && sh.business_type);
    var base = {
      typeName: g === 'hotel' ? t('tl.hotel') : g === 'cafe' ? t('tl.cafe') : t('tl.retail'),
      typeIcon: g === 'hotel' ? '🏨' : g === 'cafe' ? '☕' : '🛒',
      group: g, licence: null
    };
    if (!sh || !sh.shop_id) return mix(base, { code: 'unknown' });

    if (sh.blocked) return mix(base, { code: 'blocked' });

    var lic = bestLicence(sh.shop_id, licensesRows);
    if (lic) {
      var lEnd = new Date(lic.expiry_date);
      if (isFinite(lEnd)) {
        var lLeft = Math.ceil((lEnd - Date.now()) / 86400000);
        if (lLeft >= 0) {
          return mix(base, {
            code: 'licensed', licensed: true, plan: lic.plan || lic.plan_name || 'Licence',
            daysLeft: lLeft, licenceExpiresAt: lEnd.toISOString(),
            renewWarn: lLeft <= CFG.warnDays, licence: lic
          });
        }
        if (lLeft >= -GRACE_DAYS) return mix(base, { code: 'grace', daysLeft: lLeft, licence: lic });
        return mix(base, { code: 'expired', daysLeft: lLeft, licence: lic });
      }
    }

    var end = trialEndOf(sh);
    if (!end) return mix(base, { code: 'unknown' });
    var left = Math.ceil((end - Date.now()) / 86400000);
    if (left >= 0) {
      return mix(base, {
        code: 'trial', licensed: false, daysLeft: left, dayNum: CFG.trialDays - left + 1,
        warn: left <= CFG.warnDays, trialEndsAt: end.toISOString()
      });
    }
    if (left >= -GRACE_DAYS) return mix(base, { code: 'grace', daysLeft: left });
    return mix(base, { code: 'expired', daysLeft: left });
  }

  function mix(a, b) { var o = {}; for (var k in a) o[k] = a[k]; for (var k2 in b) o[k2] = b[k2]; return o; }

  function typeGroup(x) {
    x = String(x || '').toLowerCase().trim();
    if (['hotel', 'guest house', 'guesthouse', 'lodge', 'resort', 'pension', 'bnb', 'hostel'].indexOf(x) > -1) return 'hotel';
    if (['cafe', 'café', 'restaurant', 'coffee', 'bar', 'bakery', 'cafeteria', 'fast food', 'fastfood', 'food', 'juice', 'burger', 'pizza'].indexOf(x) > -1) return 'cafe';
    return 'retail';
  }

  /* ═══════════ 3. BANNERS & LOCKS (staff / customer modes) ═══════════ */

  function shopIdFor(app) {
    try {
      if (app === 'kitchen') return localStorage.getItem('kitchenShopId');
      if (app === 'hotel') return localStorage.getItem('hotelShopId');
      return localStorage.getItem('shopId');
    } catch (e) { return null; }
  }

  async function currentStatus() {
    var c = client(); if (!c) return null;
    var sid = MODE.shopId || shopIdFor(MODE.app);
    if (!sid) return null;
    try {
      var r = await withTimeout(c.rpc('license_status', { p_shop: sid }), 9000);
      var d = r && r.data;
      if (!d || !d.shop) return null;
      return computeStatus(d.shop, d.licenses || []);
    } catch (e) { return null; }
  }

  function supportHTML() {
    var s = CFG.support, out = '';
    if (s.phone) out += '<a href="tel:' + esc(s.phone) + '">📱 ' + esc(s.phone) + '</a>';
    if (/wa\.me|whatsapp/i.test(s.phone)) out += ' <a href="' + esc(s.phone) + '">💬 WhatsApp</a>';
    if (s.email) out += '<a href="mailto:' + esc(s.email) + '">✉️ ' + esc(s.email) + '</a>';
    if (s.telegram) out += '<span>✈️ ' + esc(s.telegram) + '</span>';
    if (s.website) out += '<a href="' + esc(s.website) + '" target="_blank" rel="noopener">🌐 ' + esc(s.website) + '</a>';
    return out ? '<div class="spp-sup"><b>' + t('sup.h') + '</b>' + out + '</div>'
               : '<div class="spp-sup"><b>' + t('sup.h') + '</b><span>📱 +251 97 331 6100</span></div>';
  }

  function css() {
    if (document.getElementById('spp-css')) return;
    var s = document.createElement('style'); s.id = 'spp-css';
    s.textContent =
      '.spp-banner{position:sticky;top:0;z-index:9000;display:flex;gap:10px;align-items:center;justify-content:center;'
      + 'flex-wrap:wrap;padding:10px 14px;font:600 13px/1.4 Inter,system-ui,sans-serif;color:#fff;background:#b45309;'
      + 'box-shadow:0 2px 12px rgba(0,0,0,.25)}'
      + '.spp-banner.blue{background:#1d4ed8}.spp-banner.red{background:#b91c1c}'
      + '.spp-banner button{padding:7px 14px;border:0;border-radius:8px;background:#fff;color:#78350f;'
      + 'font-weight:700;cursor:pointer}'
      + '.spp-lock{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.96);display:flex;'
      + 'align-items:center;justify-content:center;padding:20px;text-align:center}'
      + '.spp-lock .box{max-width:430px;width:100%;background:#fff;border-radius:18px;padding:28px 22px;'
      + 'font-family:Inter,system-ui,sans-serif;color:#0f172a}'
      + '.spp-lock .box h3{margin:6px 0 8px;font-size:19px}'
      + '.spp-lock .box p{font-size:14px;color:#475569;line-height:1.6;margin:0 0 10px}'
      + '.spp-sup{margin-top:12px;display:flex;flex-direction:column;gap:6px;font-size:14px;align-items:center}'
      + '.spp-sup b{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em}'
      + '.spp-sup a,.spp-sup span{color:#1d4ed8;text-decoration:none;font-weight:600}';
    document.head.appendChild(s);
  }

  function banner(kind, html, btnLabel, shopId) {
    css();
    var b = document.createElement('div');
    b.className = 'spp-banner ' + (kind || '');
    b.innerHTML = html + (btnLabel ? ' <button type="button">' + esc(btnLabel) + '</button>' : '');
    if (btnLabel) b.querySelector('button').onclick = function () { openLicence(shopId); };
    (document.body || document.documentElement).appendChild(b);
  }

  function lock(titleKey, bodyHtml) {
    css();
    var d = document.createElement('div');
    d.className = 'spp-lock';
    d.innerHTML = '<div class="box"><div style="font-size:40px">🔒</div><h3>' + esc(t(titleKey)) + '</h3>'
      + bodyHtml + supportHTML()
      + '<p style="margin-top:12px;font-size:12px;color:#94a3b8">' + esc(t('lk.data')) + '</p></div>';
    document.body.appendChild(d);
  }

  async function applyUi(st) {
    if (MODE.silent || !st) return;
    if (st.code === 'blocked') { lock('lk.blocked', '<p>' + esc(t('lk.blockedp')) + '</p>'); return; }
    if (MODE.mode === 'customer') {
      if (st.code === 'expired') lock('lk.menudown', '<p>' + esc(t('lk.menudownp')) + '</p>');
      return;                                   // trial/licensed customers see nothing at all
    }
    if (st.code === 'expired') { lock('lk.expired', '<p>' + esc(t('lk.expiredp')) + '</p>'); return; }
    if (st.code === 'grace') {
      banner('', '⚠️ ' + esc(t('bn.ro')), t('b.getlic'), MODE.shopId || st.shopId);
      return;
    }
    if (st.code === 'trial' && st.warn) {
      banner('', '⏳ ' + esc(t('st.left', { n: st.daysLeft })) + (st.trialEndsAt ? ' · ' + esc(fmtDate(st.trialEndsAt)) : ''), t('b.getlic'), MODE.shopId);
      return;
    }
    if (st.code === 'licensed' && st.renewWarn && MODE.app !== 'index') {
      banner('blue', '🔵 ' + esc(t('st.renewleft', { n: st.daysLeft })) + (st.licenceExpiresAt ? ' · ' + esc(fmtDate(st.licenceExpiresAt)) : ''), t('b.renew'), MODE.shopId);
    }
    // trial-silent & licensed-healthy → nothing. Exactly nothing.
  }

  /* ═══════════ 4. THE LICENCE WINDOW (live plans from the Master) ═══════════ */

  var CYCLE = 'M';
  function setCycle(c) { CYCLE = c; var w = document.getElementById('spp-modal'); if (w) { w.remove(); openLicence(LAST_SHOP); } }

  function planCard(p) {
    var cur = CFG.currency;
    var price = (CYCLE === 'M') ? p.price_monthly : (p.price_yearly || p.price_monthly * 12);
    var per = (CYCLE === 'M') ? t('pl.mon') : t('pl.yr');
    var isEnt = /enterprise/i.test(p.name || '');
    var feats = Array.isArray(p.features) ? p.features : [];
    var chips = '';
    for (var i = 0; i < feats.length && i < 8; i++) chips += '<span class="fchip">✓ ' + esc(featName(feats[i])) + '</span>';
    var lims = [];
    if (p.max_products) lims.push(p.max_products + ' ' + t('pl.prod'));
    if (p.max_cashiers) lims.push(p.max_cashiers + ' ' + t('pl.staff'));
    if (p.max_tables) lims.push(p.max_tables + ' ' + t('pl.tables'));
    if (p.max_menu_items) lims.push(p.max_menu_items + ' ' + t('pl.menu'));
    if ((p.max_branches || 1) > 1) lims.push(p.max_branches + ' ' + t('pl.br'));
    return '<div class="pcard' + (isEnt ? ' ent' : '') + '">'
      + '<div class="pname">' + esc(p.name || '') + (p.line ? '<small>' + esc(p.line) + '</small>' : '') + '</div>'
      + (isEnt
          ? '<div class="pprice">' + esc(t('pl.custom')) + '</div><div class="plim">' + esc(t('pl.entnote')) + '</div>'
          : '<div class="pprice">' + esc(cur + ' ' + (price || 0)) + '<small>' + esc(per) + '</small></div>'
            + (lims.length ? '<div class="plim">' + esc(lims.join(' · ')) + '</div>' : ''))
      + '<div class="pfeats">' + chips + '</div></div>';
  }

  function featName(f) {
    var NAMES = { dashboard:'Dashboard', products:'Products', sales:'Sales', stock:'Stock', staff:'Staff', notebook:'Notebook',
      settings:'Settings', devices:'Devices', license:'License', expenses:'Expenses', losses:'Losses', credits:'Credit customers',
      reports:'Reports', kitchen:'Kitchen display', recipes:'Recipes', qrMenu:'QR customer menu', receipts:'Fiscal receipts',
      intercom:'Staff intercom', loyalty:'Loyalty points', suppliers:'Suppliers/orders', loans:'Loans', bank:'Bank',
      taxReports:'Tax reports', crm:'Customer CRM', marketing:'WhatsApp marketing', menuEng:'Menu engineering',
      timesheets:'Timesheets', forecast:'Sales forecast', valuation:'Inventory valuation', branches:'Multi-branch', rooms:'Hotel rooms' };
    return NAMES[f] || f;
  }

  var LAST_SHOP = null;
  function openLicence(shopId) {
    LAST_SHOP = shopId || MODE.shopId || null;
    css();
    modalCSS();
    var groups = [
      ['retail', '🛒 ' + t('types.retail.h')],
      ['cafe', '☕ ' + t('types.cafe.h')],
      ['hotel', '🏨 ' + t('types.hotel.h')]
    ];
    var grid = '';
    for (var g = 0; g < groups.length; g++) {
      var gp = PLANS.filter(function (p) { return typeGroup(p.business_type) === groups[g][0] && !p.is_default_free; });
      if (!gp.length) continue;
      grid += '<h4 class="pgrp">' + esc(groups[g][1]) + '</h4><div class="pgrid">'
        + gp.map(planCard).join('') + '</div>';
    }
    if (!grid) grid = '<p class="pempty">' + esc(t('pl.empty')) + '</p>';

    var d = document.createElement('div');
    d.id = 'spp-modal';
    d.innerHTML =
      '<div class="pmask" data-close="1"></div>'
      + '<div class="pbox">'
      + '<button class="pclose" data-close="1">✕</button>'
      + '<h3>' + esc(t('lw.h')) + '</h3>'
      + '<p class="psub">' + esc(t('lw.sub')) + '</p>'
      + '<div class="pcyc"><button type="button" id="sppCycM" class="' + (CYCLE === 'M' ? 'on' : '') + '">' + esc(t('cyc.m')) + '</button>'
      + '<button type="button" id="sppCycY" class="' + (CYCLE === 'Y' ? 'on' : '') + '">' + esc(t('cyc.y')) + '</button></div>'
      + grid
      + '<div class="pact"><h4>' + esc(t('ak.h')) + '</h4>'
      + '<input id="sppKey" placeholder="' + esc(t('ak.ph')) + '" autocomplete="off" spellcheck="false">'
      + '<button type="button" id="sppKeyBtn">' + esc(t('ak.btn')) + '</button>'
      + '<div id="sppKeyMsg"></div></div>'
      + supportHTML()
      + '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-close')) d.remove(); });
    d.querySelector('#sppCycM').onclick = function () { if (CYCLE !== 'M') setCycle('M'); };
    d.querySelector('#sppCycY').onclick = function () { if (CYCLE !== 'Y') setCycle('Y'); };
    d.querySelector('#sppKeyBtn').onclick = function () { doActivate(); };
    d.querySelector('#sppKey').addEventListener('keydown', function (e) { if (e.key === 'Enter') doActivate(); });
    function doActivate() {
      var k = d.querySelector('#sppKey').value.trim();
      var m = d.querySelector('#sppKeyMsg');
      if (!k) { m.className = 'err'; m.textContent = t('ak.bad'); return; }
      m.className = ''; m.textContent = t('si.btn.checking');
      activateKey(LAST_SHOP, k).then(function (r) {
        m.className = r.ok ? 'ok' : 'err';
        m.textContent = r.ok ? t('ak.ok') : t(r.msgKey || 'ak.bad');
        if (r.ok) { setTimeout(function () { d.remove(); window.location.reload(); }, 900); }
      }, function () { m.className = 'err'; m.textContent = t('msg.net', { err: 'network' }); });
    }
  }

  function modalCSS() {
    if (document.getElementById('spp-modal-css')) return;
    var s = document.createElement('style'); s.id = 'spp-modal-css';
    s.textContent =
      '#spp-modal{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;'
      + 'font-family:Inter,system-ui,sans-serif}'
      + '#spp-modal .pmask{position:absolute;inset:0;background:rgba(15,23,42,.62)}'
      + '#spp-modal .pbox{position:relative;background:#fff;border-radius:20px;max-width:640px;width:100%;'
      + 'max-height:88vh;overflow-y:auto;padding:24px 20px;color:#0f172a;box-shadow:0 24px 70px rgba(0,0,0,.35)}'
      + '#spp-modal h3{margin:0 0 4px;font-size:21px}'
      + '#spp-modal .psub{margin:0 0 14px;font-size:13px;color:#64748b}'
      + '#spp-modal .pclose{position:absolute;top:10px;right:12px;border:0;background:#f1f5f9;width:34px;height:34px;'
      + 'border-radius:50%;font-size:16px;cursor:pointer;color:#475569}'
      + '#spp-modal .pcyc{display:flex;gap:8px;margin-bottom:14px}'
      + '#spp-modal .pcyc button{flex:1;padding:9px;border:1.5px solid #e2e8f0;background:#f8fafc;border-radius:10px;'
      + 'font-weight:700;font-size:13px;color:#475569;cursor:pointer}'
      + '#spp-modal .pcyc button.on{border-color:#4f46e5;background:#eef2ff;color:#4338ca}'
      + '#spp-modal .pgrp{margin:16px 0 8px;font-size:14px;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:6px}'
      + '#spp-modal .pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}'
      + '#spp-modal .pcard{border:1.5px solid #e2e8f0;border-radius:14px;padding:14px 12px;background:#fcfcfd}'
      + '#spp-modal .pcard.ent{border-color:#8b5cf6;background:#f5f3ff}'
      + '#spp-modal .pname{font-weight:800;font-size:15px}'
      + '#spp-modal .pname small{display:block;font-weight:500;font-size:11px;color:#64748b;margin-top:2px}'
      + '#spp-modal .pprice{font-size:22px;font-weight:800;margin:8px 0 2px;color:#1d4ed8}'
      + '#spp-modal .pcard.ent .pprice{color:#6d28d9;font-size:16px}'
      + '#spp-modal .pprice small{font-size:11px;font-weight:600;color:#64748b}'
      + '#spp-modal .plim{font-size:11px;color:#64748b;margin:2px 0 6px}'
      + '#spp-modal .pfeats{display:flex;flex-wrap:wrap;gap:4px}'
      + '#spp-modal .fchip{font-size:10px;background:#eef2ff;color:#4338ca;border-radius:20px;padding:3px 8px;font-weight:600}'
      + '#spp-modal .pempty{font-size:13px;color:#64748b}'
      + '#spp-modal .pact{margin-top:18px;border-top:1px dashed #e2e8f0;padding-top:14px}'
      + '#spp-modal .pact h4{margin:0 0 8px;font-size:14px}'
      + '#spp-modal .pact input{width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;'
      + 'text-align:center;letter-spacing:.5px;box-sizing:border-box}'
      + '#spp-modal .pact button{width:100%;margin-top:8px;padding:12px;border:0;border-radius:10px;background:#4f46e5;'
      + 'color:#fff;font-weight:700;font-size:14px;cursor:pointer}'
      + '#spp-modal .pact #sppKeyMsg{font-size:12px;margin-top:8px;text-align:center;min-height:16px}'
      + '#spp-modal .pact #sppKeyMsg.ok{color:#059669;font-weight:700}'
      + '#spp-modal .pact #sppKeyMsg.err{color:#dc2626;font-weight:600}';
    document.head.appendChild(s);
  }

  /* ═══════════ 5. KEY ACTIVATION (keys exist only if the Master made them) ═══════════ */

  async function findKey(key) {
    var c = client(); if (!c) throw new Error('nosb');
    var r = await withTimeout(c.from('licenses').select('*').ilike('key', key.trim()).limit(5), 10000);
    if (r.error) throw r.error;
    var rows = (r.data || []).filter(function (l) { return String(l.key || '').toUpperCase() === key.trim().toUpperCase(); });
    return rows[0] || null;
  }

  async function activateKey(shopId, key) {
    try {
      var lic = await findKey(key);
      if (!lic) return { ok: false, msgKey: 'ak.bad' };
      if (lic.status && lic.status !== 'active') return { ok: false, msgKey: 'ak.bad' };
      var left = Math.ceil((new Date(lic.expiry_date) - Date.now()) / 86400000);
      if (!(left >= 0)) return { ok: false, msgKey: 'ak.expired' };
      if (shopId && lic.shop_id !== shopId) return { ok: false, msgKey: 'ak.other' };
      if (!shopId) return { ok: true, licence: lic };      // claim flow handled by caller
      /* plan/owner are Master-only now (shops_guard) — the key already carries them */
      return { ok: true, licence: lic };
    } catch (e) { return { ok: false, msgKey: 'msg.net' }; }
  }

  /* Post-trial shop creation: the Master already created the shop row +
     key together — claiming just attaches it to this owner's account. */
  async function claimShopByKey(key, email) {
    try {
      var c = client();
      var r = await withTimeout(c.rpc('claim_license', { p_key: key.trim() }), 10000);
      var d = r && r.data;
      if (!d) return { ok: false, msgKey: 'msg.net' };
      if (!d.ok) return { ok: false, msgKey: d.msg || 'ak.bad' };
      return { ok: true, shop: d.shop, licence: d.licence };
    } catch (e) { return { ok: false, msgKey: 'msg.net' }; }
  }

  /* ═══════════ 6. PUBLIC API + BOOT ═══════════ */

  async function boot(opts) {
    if (opts) for (var k in opts) if (k in MODE) MODE[k] = opts[k];
    if (booting) return booting;
    booting = (async function () {
      await Promise.all([loadGlobalSettings(), loadPlans()]);
      READY = true;
      if (MODE.onReady) { try { MODE.onReady(SPP); } catch (e) {} }
      if (!MODE.silent) {
        var st = await currentStatus();
        await applyUi(st);
      }
      return SPP;
    })();
    return booting;
  }

  /* help.html compatibility: account-level status */
  async function getStatus() {
    var c = client(); if (!c) return { code: 'unknown' };
    try {
      var s = await withTimeout(c.auth.getSession(), 6000);
      var u = s && s.data && s.data.session && s.data.session.user;
      var email = u && u.email;
      if (!email) return { code: 'unknown' };
      var r = await withTimeout(c.from('shops').select('*').ilike('owner_email', email).limit(12), 9000);
      var shops = (r && r.data) || [];
      if (!shops.length) return { code: 'unknown' };
      var l = await withTimeout(c.from('licenses').select('*').in('shop_id', shops.map(function (s) { return s.shop_id; })).order('created_at', { ascending: false }).limit(60), 9000);
      var worst = { rank: -1 };
      for (var i = 0; i < shops.length; i++) {
        var st = computeStatus(shops[i], (l && l.data) || []);
        var rank = { licensed: 5, trial: 4, unknown: 3, grace: 2, expired: 1, blocked: 0 }[st.code] || 3;
        if (rank < (worst.rank == null ? 99 : 5) && rank <= 3) { if (worst.rank === -1 || rank < worst.rank) worst = { rank: rank, code: st.code, st: st }; }
        if (worst.rank === -1) worst = { rank: rank, code: st.code, st: st };
      }
      return worst.st || { code: 'unknown' };
    } catch (e) { return { code: 'unknown' }; }
  }

  var SPP = {
    version: '2.0-bizmaster',
    cfg: CFG,
    plans: plans,
    planById: planById,
    dayInfo: dayInfo,
    computeStatus: computeStatus,
    currentStatus: currentStatus,
    getStatus: getStatus,
    openLicence: openLicence,
    activateKey: activateKey,
    claimShopByKey: claimShopByKey,
    setCycle: setCycle,
    init: boot,
    boot: boot
  };
  window.SPP = SPP;

  /* auto-boot from the script tag */
  var tag = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) if (/licence\.js/.test(all[i].src || '')) return all[i];
    return null;
  })();
  if (tag && tag.getAttribute) {
    var a = tag.getAttribute('data-spp-app'); if (a) MODE.app = a;
    var m = tag.getAttribute('data-spp-mode'); if (m) MODE.mode = m;
    if (tag.getAttribute('data-spp-silent') === '1') MODE.silent = true;
    var sid = tag.getAttribute('data-spp-shop'); if (sid) MODE.shopId = sid;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); });
    else boot();
  }
})();
