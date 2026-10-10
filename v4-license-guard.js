// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — LICENSE GUARD
//  Master's law: everything from the plans table, nothing
//  hardcoded. This guard checks EVERY gated action and
//  shows a friendly upgrade message — never blocks hard.
//  Laws: exit-door (Settings+License always open) · trial=
//  top-plan · RLS on server · limits from SS_PLAN only.
// ═════════════════════════════════════════════════════════

// ── PLAN CHECK (call before any gated action) ──
function v4lgCan(feature) {
  if (typeof ssHasFeature !== 'function') return true;   // engine not loaded → don't block
  return ssHasFeature(feature);
}

function v4lgLimit(currentCount, limitType) {
  if (typeof SS_PLAN === 'undefined' || SS_PLAN.name === 'Trial') return true;
  var limits = {
    products: SS_PLAN.maxProducts,
    staff: SS_PLAN.maxCashiers,
    tables: SS_PLAN.maxTables,
    menuItems: SS_PLAN.maxMenuItems || SS_PLAN.maxProducts,
    branches: SS_PLAN.maxBranches
  };
  var max = limits[limitType] || 999999;
  return currentCount < max;
}

async function v4seContactProvider() {
  try {
    if (typeof loadSupportContactsUniversal === 'function') {
      try { await loadSupportContactsUniversal(); } catch(e2) {}
    }
    var s = window.SUPPORT || { phone: '+251973316100', whatsapp: '251973316100', email: 'girmadinsho@gmail.com' };
    var old = document.getElementById('seSupportModal'); if (old) old.remove();
    var m = document.createElement('div');
    m.id = 'seSupportModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8500;display:flex;align-items:center;justify-content:center;padding:16px;';
    var html = '<div style="background:#fff;border-radius:18px;max-width:380px;width:100%;padding:20px;color:#0f172a;text-align:center;">' +
      '<h3 style="margin-bottom:14px;font-size:17px">📞 Contact Your Provider</h3>';
    if (s.whatsapp) {
      var waMsg = encodeURIComponent('Hello! I need help with my SmartShop Pro. My Shop ID: ' + getShopId());
      html += '<a href="https://wa.me/' + s.whatsapp + '?text=' + waMsg + '" target="_blank" style="display:block;background:#25D366;color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;margin-bottom:10px;font-size:15px;">💬 WhatsApp: ' + s.phone + '</a>';
    }
    if (s.email) {
      html += '<a href="mailto:' + s.email + '?subject=SmartShop Help — Shop ' + getShopId() + '" style="display:block;background:#ef4444;color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;margin-bottom:10px;font-size:15px;">📧 ' + s.email + '</a>';
    }
    if (!s.whatsapp && s.phone) {
      html += '<a href="tel:' + s.phone + '" style="display:block;background:#2563eb;color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;margin-bottom:10px;font-size:15px;">📞 Call: ' + s.phone + '</a>';
    }
    html += '<button class="v4-btn o" onclick="document.getElementById(\'seSupportModal\').remove()" style="margin-top:4px">✖ Close</button></div>';
    m.innerHTML = html;
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
  } catch(e) {
    // 🛟 fallback — always shows something
    alert('📞 Contact Your Provider:\n\n💬 WhatsApp: +251973316100\n📧 girmadinsho@gmail.com');
  }
}
// ── FEATURE-GATED TOOL OPENER (wrap around v4reOpen, v4stOpen, etc.) ──
var V4LG_FEATURE_MAP = {
  // Reports
  'pnl': 'taxReports', 'zreport': 'taxReports', 'tax': 'taxReports',
  'erca': 'taxReports', 'audit': 'taxReports', 'timesheet': 'timesheets',
  'menueng': 'menuEng', 'crm': 'crm', 'marketing': 'marketing',
  'valuation': 'valuation',
  // Modules
  'recipes_tab': 'recipes', 'hotel_tab': 'rooms', 'intercom_tab': 'intercom',
  'loyalty_tab': 'loyalty', 'loans_tab': 'loans', 'bank_tab': 'bank',
  'suppliers_tab': 'suppliers', 'branches_tab': 'branches'
};

function v4lgGate(tool) {
  var feature = V4LG_FEATURE_MAP[tool];
  if (!feature) return true;   // not gated → allow
  if (v4lgCan(feature)) return true;
  v4lgDeny(tool.replace('_tab','').replace(/^\w/, c => c.toUpperCase()));
  return false;
}

// ── PLAN AWARE SIDEBAR (runs after applyPlanVisibility) ──
function v4lgApplySidebar() {
  if (typeof TABS === 'undefined' || !document.getElementById('sideTabs')) return;

  TABS.forEach(function(t) {
    var el = document.getElementById('stab' + t.n);
    if (!el) return;
    var show = true;

    try {
      // Exit-door law: Settings(13) + License(14) = always visible
      if (t.n === 13 || t.n === 14) { show = true; }
      // Hotel tab: needs 'rooms' feature
      else if (t.n === 21) { show = v4lgCan('rooms'); }
      // Recipes: cafe/hotel business or has feature
      else if (t.n === 18) {
        var biz = (window.__currentShopRow && window.__currentShopRow.business_type) || 'retail';
        show = (biz === 'cafe' || biz === 'hotel') || v4lgCan('recipes');
      }
      // Branches: enterprise only
      else if (t.ent) {
        var lic = (typeof getLicense === 'function') ? getLicense() : null;
        show = !!(lic && lic.plan === 'enterprise');
      }
      // Everything else: check the feature map
      else if (typeof ssTabAllowed === 'function') {
        show = ssTabAllowed(t.n);
      }
    } catch(e) { /* fail-open for business continuity */ }

    el.style.display = show ? 'flex' : 'none';
  });

  // Update plan badge
  var b = document.getElementById('planBadge');
  if (b) {
    var lbl = (typeof ssPlanLabel === 'function') ? ssPlanLabel() : '…';
    var ico = '🛒';
    try { ico = (typeof ssIsCafe === 'function' && (ssIsCafe() || (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel'))) ? '🏨' : '🛒'; } catch(e) {}
    b.textContent = ico + ' ' + lbl;
  }
}

// ── TRIAL EXPIRY WATCHDOG (runs every 5 min) ──
function v4lgTrialWatch() {
  if (!window.__currentShopRow) return;
  var shop = window.__currentShopRow;
  if (shop.plan === 'trial' && shop.trial_expires) {
    var days = Math.ceil((new Date(shop.trial_expires) - new Date()) / 86400000);
    if (days <= 0) {
      // trial expired → show plan picker
      v4lgShowPlanPicker();
    } else if (days <= 7) {
      // warning banner
      v4lgTrialBanner(days);
    }
  }
  // license expiry check
  try {
    var lic = JSON.parse(localStorage.getItem('smartshop_license') || 'null');
    if (lic && lic.expiryDate) {
      var ldays = Math.ceil((new Date(lic.expiryDate) - new Date()) / 86400000);
      if (ldays <= 0) {
        v4lgShowLockout();
      } else if (ldays <= 7) {
        v4lgLicenseBanner(ldays);
      }
    }
  } catch(e) {}
}

function v4lgTrialBanner(days) {
  var old = document.getElementById('v4lgTrialWarn');
  if (old) return;
  var b = document.createElement('div');
  b.id = 'v4lgTrialWarn';
  b.style.cssText = 'position:fixed;top:52px;left:0;right:0;z-index:500;background:#fef3c7;color:#92400e;padding:8px;text-align:center;font-size:12px;font-weight:700;cursor:pointer;';
  b.innerHTML = '⏰ Trial ends in ' + days + ' day(s) — tap to choose your plan';
  b.onclick = function() { v4lgShowPlanPicker(); };
  document.body.appendChild(b);
}

function v4lgLicenseBanner(days) {
  var old = document.getElementById('v4lgLicWarn');
  if (old) return;
  var b = document.createElement('div');
  b.id = 'v4lgLicWarn';
  b.style.cssText = 'position:fixed;top:52px;left:0;right:0;z-index:500;background:#fee2e2;color:#991b1b;padding:8px;text-align:center;font-size:12px;font-weight:700;cursor:pointer;';
  b.innerHTML = '⚠️ License expires in ' + days + ' day(s) — tap to renew';
  b.onclick = function() { selectTab(14, document.getElementById('stab14')); };
  document.body.appendChild(b);
}

function v4lgShowLockout() {
  var old = document.getElementById('v4lgLockout');
  if (old) return;
  var m = document.createElement('div');
  m.id = 'v4lgLockout';
  m.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#ef4444,#b91c1c);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;';
  m.innerHTML = '<div style="font-size:50px;margin-bottom:10px">🔒</div>' +
    '<h1 style="color:#fff;font-size:24px;margin-bottom:10px">License Expired</h1>' +
    '<p style="color:#fecaca;font-size:14px;margin-bottom:20px">Your plan has ended. To continue accessing your shop data, activate a new license.</p>' +
    '<button onclick="document.getElementById(\'v4lgLockout\').remove(); selectTab(14, document.getElementById(\'stab14\'))" style="padding:14px 30px;background:#fff;color:#dc2626;border:none;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;margin-bottom:10px;">🔑 Activate License</button>' +
    '<button onclick="supabaseClient.auth.signOut()" style="padding:12px 24px;background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">Logout</button>';
  document.body.appendChild(m);
}

async function v4lgShowPlanPicker() {
  var old = document.getElementById('v4lgPicker');
  if (old) return;
  try {
    await loadSupportContactsUniversal();
    const { data: shopRow } = await supabaseClient.from('shops').select('business_type').eq('shop_id', getShopId()).maybeSingle();
    var myBiz = (shopRow && shopRow.business_type) || 'retail';
    const { data: plans } = await supabaseClient.from('plans').select('*').eq('active', true).eq('business_type', myBiz).order('display_order');
    var plansHtml = '';
    (plans || []).forEach(function(pl) {
      plansHtml += '<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:14px;margin-bottom:10px;text-align:left;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div><b style="font-size:15px;color:#fff">' + pl.name + '</b> <small style="opacity:.6;">(' + pl.line + ')</small><br>' +
        '<small style="opacity:.7;">' + (pl.max_products < 999999 ? pl.max_products + ' products' : 'Unlimited') + ' · ' + (pl.max_cashiers < 999 ? pl.max_cashiers + ' staff' : 'Unlimited') + '</small></div>' +
        '<div style="text-align:right"><b style="color:#fbbf24;font-size:16px;">' + (pl.price_monthly > 0 ? pl.price_monthly + ' Br/mo' : 'Call us') + '</b></div></div>' +
        '<a href="https://wa.me/' + window.SUPPORT.whatsapp + '?text=' + encodeURIComponent('Hello! I want the ' + pl.name + ' plan. My Shop ID: ' + getShopId()) + '" target="_blank" style="display:block;margin-top:8px;padding:8px;background:#25D366;color:white;text-align:center;border-radius:8px;text-decoration:none;font-weight:bold;font-size:12px;">💬 Choose ' + pl.name + '</a></div>';
    });
    var m = document.createElement('div');
    m.id = 'v4lgPicker';
    m.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#0f172a,#1e3a8a);z-index:99999;overflow-y:auto;color:white;padding:20px;';
    m.innerHTML = '<div style="max-width:400px;margin:0 auto;text-align:center;padding-top:20px;">' +
      '<div style="font-size:40px;margin-bottom:8px">' + '⏰' + '</div>' +
      '<h2 style="margin-bottom:5px">Your Trial Has Ended</h2>' +
      '<p style="color:#94a3b8;font-size:13px;margin-bottom:15px">Choose your plan to continue:</p>' +
      plansHtml +
      '<div style="margin-top:10px;padding:10px;background:rgba(255,255,255,.1);border-radius:10px;font-size:11px;color:#cbd5e1;">' +
      'After payment, send your transaction ID on WhatsApp:<br><b>' + window.SUPPORT.phone + '</b></div>' +
      '</div>';
    document.body.appendChild(m);
  } catch(e) {}
}

// ── START WATCHDOG ──
setInterval(v4lgTrialWatch, 5 * 60 * 1000);   // every 5 minutes
setTimeout(v4lgTrialWatch, 3000);               // once on load

// ── EXPORT for other modules ──
window.v4lgCan = v4lgCan;
window.v4lgLimit = v4lgLimit;
window.v4lgDeny = v4lgDeny;
window.v4lgGate = v4lgGate;
window.v4lgApplySidebar = v4lgApplySidebar;
