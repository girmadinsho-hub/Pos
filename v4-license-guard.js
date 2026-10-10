// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — LICENSE GUARD
//  Master's law: everything from the plans table, nothing
//  hardcoded. Never blocks hard — always shows upgrade path.
// ═════════════════════════════════════════════════════════

// ── PLAN CHECK ──
function v4lgCan(feature) {
  if (typeof ssHasFeature !== 'function') return true;
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

// ── UPGRADE MESSAGE (self-contained — never crashes) ──
function v4lgDeny(action, current, limit) {
  var plan = 'your plan';
  try { if (typeof ssPlanLabel === 'function') plan = ssPlanLabel(); } catch(e) {}
  var msg = '✨ ' + action + ' needs a higher plan.\n\nYour plan: ' + plan + '\nLimit: ' + (limit || '—') + '\n\nUpgrade: License tab → Activate a new key.';
  try {
    if (typeof v4shUpgradeDialog === 'function') {
      v4shUpgradeDialog(action + ' needs a higher plan.\n\nYour limit: ' + (limit || '—'));
      return;
    }
  } catch(e) {}
  alert(msg);
}

// ── FEATURE-GATED TOOL OPENER ──
var V4LG_FEATURE_MAP = {
  'pnl': 'taxReports', 'zreport': 'taxReports', 'tax': 'taxReports',
  'erca': 'taxReports', 'audit': 'taxReports', 'timesheet': 'timesheets',
  'menueng': 'menuEng', 'crm': 'crm', 'marketing': 'marketing',
  'valuation': 'valuation', 'recipes_tab': 'recipes', 'hotel_tab': 'rooms',
  'intercom_tab': 'intercom', 'loyalty_tab': 'loyalty', 'loans_tab': 'loans',
  'bank_tab': 'bank', 'suppliers_tab': 'suppliers', 'branches_tab': 'branches'
};

function v4lgGate(tool) {
  var feature = V4LG_FEATURE_MAP[tool];
  if (!feature) return true;
  if (v4lgCan(feature)) return true;
  v4lgDeny(tool.replace('_tab','').replace(/^\w/, function(c){ return c.toUpperCase(); }));
  return false;
}

// ── PLAN AWARE SIDEBAR ──
function v4lgApplySidebar() {
  if (typeof TABS === 'undefined' || !document.getElementById('sideTabs')) return;
  TABS.forEach(function(t) {
    var el = document.getElementById('stab' + t.n);
    if (!el) return;
    var show = true;
    try {
      if (t.n === 13 || t.n === 14) { show = true; }
      else if (t.n === 21) { show = v4lgCan('rooms'); }
      else if (t.n === 18) {
        var biz = (window.__currentShopRow && window.__currentShopRow.business_type) || 'retail';
        show = (biz === 'cafe' || biz === 'hotel') || v4lgCan('recipes');
      }
      else if (t.ent) {
        var lic = (typeof getLicense === 'function') ? getLicense() : null;
        show = !!(lic && lic.plan === 'enterprise');
      }
      else if (typeof ssTabAllowed === 'function') { show = ssTabAllowed(t.n); }
    } catch(e) { show = true; }
    el.style.display = show ? 'flex' : 'none';
  });
  var b = document.getElementById('planBadge');
  if (b) {
    var lbl = (typeof ssPlanLabel === 'function') ? ssPlanLabel() : '…';
    var ico = '🛒';
    try { ico = (typeof ssIsCafe === 'function' && (ssIsCafe() || (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel'))) ? '🏨' : '🛒'; } catch(e) {}
    b.textContent = ico + ' ' + lbl;
    b.title = 'Shop ID: ' + getShopId();
  }
  var sidBadge = document.getElementById('shopIdBadge');
  if (!sidBadge) {
    var foot = document.querySelector('.sidebar div:first-child');
    if (foot) {
      sidBadge = document.createElement('span');
      sidBadge.id = 'shopIdBadge';
      sidBadge.style.cssText = 'display:block;font-size:9px;font-weight:700;color:#94a3b8;margin-top:2px;letter-spacing:.5px;';
      foot.appendChild(sidBadge);
    }
  }
  if (sidBadge) sidBadge.textContent = '🔑 ' + getShopId();
}

// ── TRIAL EXPIRY WATCHDOG ──
function v4lgTrialWatch() {
  if (!window.__currentShopRow) return;
  var shop = window.__currentShopRow;
  if (shop.plan === 'trial' && shop.trial_expires) {
    var days = Math.ceil((new Date(shop.trial_expires) - new Date()) / 86400000);
    if (days <= 0) { v4lgShowPlanPicker(); }
    else if (days <= 7) { v4lgTrialBanner(days); }
  }
  try {
    var lic = JSON.parse(localStorage.getItem('smartshop_license') || 'null');
    if (lic && lic.expiryDate) {
      var ldays = Math.ceil((new Date(lic.expiryDate) - new Date()) / 86400000);
      if (ldays <= 0) { v4lgShowLockout(); }
      else if (ldays <= 7) { v4lgLicenseBanner(ldays); }
    }
  } catch(e) {}
}

function v4lgTrialBanner(days) {
  var old = document.getElementById('v4lgTrialWarn'); if (old) return;
  var b = document.createElement('div');
  b.id = 'v4lgTrialWarn';
  b.style.cssText = 'position:fixed;top:52px;left:0;right:0;z-index:500;background:#fef3c7;color:#92400e;padding:8px;text-align:center;font-size:12px;font-weight:700;cursor:pointer;';
  b.innerHTML = '⏰ Trial ends in ' + days + ' day(s) — tap to choose your plan';
  b.onclick = function() { v4lgShowPlanPicker(); };
  document.body.appendChild(b);
}

function v4lgLicenseBanner(days) {
  var old = document.getElementById('v4lgLicWarn'); if (old) return;
  var b = document.createElement('div');
  b.id = 'v4lgLicWarn';
  b.style.cssText = 'position:fixed;top:52px;left:0;right:0;z-index:500;background:#fee2e2;color:#991b1b;padding:8px;text-align:center;font-size:12px;font-weight:700;cursor:pointer;';
  b.innerHTML = '⚠️ License expires in ' + days + ' day(s) — tap to renew';
  b.onclick = function() { selectTab(14, document.getElementById('stab14')); };
  document.body.appendChild(b);
}

function v4lgShowLockout() {
  var old = document.getElementById('v4lgLockout'); if (old) return;
  var m = document.createElement('div');
  m.id = 'v4lgLockout';
  m.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#ef4444,#b91c1c);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;';
  m.innerHTML = '<div style="font-size:50px;margin-bottom:10px">🔒</div>' +
    '<h1 style="color:#fff;font-size:24px;margin-bottom:10px">License Expired</h1>' +
    '<p style="color:#fecaca;font-size:14px;margin-bottom:20px">Your plan has ended. Activate a new license to continue.</p>' +
    '<button onclick="document.getElementById(\'v4lgLockout\').remove(); selectTab(14, document.getElementById(\'stab14\'))" style="padding:14px 30px;background:#fff;color:#dc2626;border:none;border-radius:12px;font-size:16px;font-weight:800;cursor:pointer;margin-bottom:10px;">🔑 Activate License</button>' +
    '<button onclick="supabaseClient.auth.signOut()" style="padding:12px 24px;background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">Logout</button>';
  document.body.appendChild(m);
}

async function v4lgShowPlanPicker() {
  var old = document.getElementById('v4lgPicker'); if (old) return;
  try {
    if (typeof loadSupportContactsUniversal === 'function') { try { await loadSupportContactsUniversal(); } catch(e2) {} }
    var sup = window.SUPPORT || { whatsapp: '251973316100', phone: '+251973316100' };
    const { data: plans } = await supabaseClient.from('plans').select('*').eq('active', true).order('display_order');
    var plansHtml = '';
    (plans || []).forEach(function(pl) {
      plansHtml += '<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:14px;margin-bottom:10px;text-align:left;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div><b style="font-size:15px;color:#fff">' + pl.name + '</b> <small style="opacity:.6;">(' + pl.line + ')</small><br>' +
        '<small style="opacity:.7;">' + (pl.max_products < 999999 ? pl.max_products + ' products' : 'Unlimited') + ' · ' + (pl.max_cashiers < 999 ? pl.max_cashiers + ' staff' : 'Unlimited') + (pl.max_tables > 0 ? ' · ' + pl.max_tables + ' tables' : '') + '</small></div>' +
        '<div style="text-align:right"><b style="color:#fbbf24;font-size:16px;">' + (pl.price_monthly > 0 ? pl.price_monthly + ' Br/mo' : 'Call us') + '</b></div></div>' +
        '<a href="https://wa.me/' + sup.whatsapp + '?text=' + encodeURIComponent('Hello! I want the ' + pl.name + ' plan. My Shop ID: ' + getShopId()) + '" target="_blank" style="display:block;margin-top:8px;padding:8px;background:#25D366;color:white;text-align:center;border-radius:8px;text-decoration:none;font-weight:bold;font-size:12px;">💬 Choose ' + pl.name + '</a></div>';
    });
    var m = document.createElement('div');
    m.id = 'v4lgPicker';
    m.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#0f172a,#1e3a8a);z-index:99999;overflow-y:auto;color:white;padding:20px;';
    m.innerHTML = '<div style="max-width:400px;margin:0 auto;text-align:center;padding-top:20px;">' +
      '<div style="font-size:40px;margin-bottom:8px">⏰</div>' +
      '<h2 style="margin-bottom:5px">Your Trial Has Ended</h2>' +
      '<p style="color:#94a3b8;font-size:13px;margin-bottom:15px">Choose your plan to continue:</p>' +
      plansHtml +
      '<div style="margin-top:10px;padding:10px;background:rgba(255,255,255,.1);border-radius:10px;font-size:11px;color:#cbd5e1;">' +
      'After payment, send your transaction ID on WhatsApp:<br><b>' + sup.phone + '</b></div>' +
      '</div>';
    document.body.appendChild(m);
  } catch(e) {
    alert('⏰ Trial ended. Contact your provider to activate a plan.');
  }
}

// ── START WATCHDOG ──
setInterval(v4lgTrialWatch, 5 * 60 * 1000);
setTimeout(v4lgTrialWatch, 3000);

// ── EXPORT ──
window.v4lgCan = v4lgCan;
window.v4lgLimit = v4lgLimit;
window.v4lgDeny = v4lgDeny;
window.v4lgGate = v4lgGate;
window.v4lgApplySidebar = v4lgApplySidebar;
