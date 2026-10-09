// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — SHOPS MODULE (Settings → My Shops)
//  My Shops card · creation wizard (type-aware limits) ·
//  type switching during trial · plan limit engine ·
//  quick stats across all shops · self-explanatory UI.
//  CAFE LAW: cafes limited by TABLES (not menu items).
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4sh = { myShops: [], currentType: 'retail' };

// ── helpers ──
function v4shEscape(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function v4shLoadMyShops() {
  try {
    var email = '';
    try { const { data: { user } } = await supabaseClient.auth.getUser(); if (user) email = user.email; } catch(e) {}
    if (!email) return [];
    const { data } = await supabaseClient.from('shops').select('*').eq('owner_email', email).eq('active', true).order('created_at');
    v4sh.myShops = data || [];
    return v4sh.myShops;
  } catch(e) { v4sh.myShops = []; return []; }
}

// ═══ LIMIT ENGINE (reads from plans table LIVE — Master's truth) ═══
async function v4shCheckLimit(newType) {
  // Count current shops
  var count = v4sh.myShops.length;

  // Trial: 1 shop only
  if (window.__currentShopRow && window.__currentShopRow.plan === 'trial') {
    return { can: count < 1, reason: 'Trial allows 1 shop. Activate a plan to add more.' };
  }

  // Free plan: 1 shop only
  var lic = (typeof getLicense === 'function') ? getLicense() : null;
  if (!lic) {
    return { can: count < 1, reason: 'Free plan allows 1 shop. Activate a plan to add more.' };
  }

  // Paid plan: check max_branches
  var planName = lic.plan;
  try {
    const { data: plan } = await supabaseClient.from('plans').select('max_branches, business_type').ilike('name', planName).maybeSingle();
    if (!plan) return { can: false, reason: 'Plan "' + planName + '" not found. Contact your provider.' };

    // Type check: does this plan cover this business type?
    if (plan.business_type !== 'retail' && plan.business_type !== newType) {
      // Enterprise (retail line) covers all types
      if (planName.toLowerCase().indexOf('enterprise') === -1) {
        return { can: false, reason: 'Plan "' + planName + '" covers ' + plan.business_type + ' shops only. Activate an Enterprise plan for ' + newType + '.' };
      }
    }

    // Count check
    var maxBranches = plan.max_branches || 1;
    if (lic.maxShops && lic.maxShops < maxBranches) maxBranches = lic.maxShops;  // most restrictive
    if (count >= maxBranches) {
      return { can: false, reason: 'Plan limit: ' + count + '/' + maxBranches + ' shops used. Upgrade for more.' };
    }
    return { can: true, remaining: maxBranches - count };
  } catch(e) {
    return { can: false, reason: 'Could not check plan limits: ' + e.message };
  }
}

// ═══ UI — inject "My Shops" card into Settings tab ═══
function v4shEnsureUI() {
  var settingsTab = document.getElementById('tab13');
  if (!settingsTab || document.getElementById('v4shCard')) return;

  // Insert AFTER the Shop ID card (first card)
  var firstCard = settingsTab.querySelector('.card');
  if (!firstCard) return;

  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'v4shCard';
  card.style.cssText = 'margin-bottom:14px;';
  firstCard.parentNode.insertBefore(card, firstCard.nextSibling);
  v4shRender();
}

function v4shRender() {
  var card = document.getElementById('v4shCard');
  if (!card) return;
  var shops = v4sh.myShops;
  var cur = getShopId();

  var html = '<div class="card-title">🏪 My Shops</div>' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 10px 0;">All shops under your account. Tap any shop to switch to it — your data in each shop is separate and safe.</p>';

  if (!shops.length) {
    html += '<p style="font-size:12px;color:#94a3b8;padding:10px;text-align:center">No shops found.</p>';
  } else {
    shops.forEach(function(s) {
      var isCur = s.shop_id === cur;
      var typeIcon = { retail:'🛒', cafe:'☕', hotel:'🏨' }[s.business_type] || '🏪';
      var plan = s.plan || 'trial';
      var daysLeft = '';
      if (s.trial_expires) {
        var d = Math.ceil((new Date(s.trial_expires) - new Date()) / 86400000);
        daysLeft = d > 0 ? d + 'd left' : 'expired';
      }
      html += '<div style="display:flex;align-items:center;gap:8px;padding:10px;margin-bottom:8px;border-radius:12px;border:2px solid ' + (isCur ? '#2563eb' : '#e2e8f0') + ';background:' + (isCur ? '#eff6ff' : '#f8fafc') + ';cursor:' + (isCur ? 'default' : 'pointer') + ';"' +
        (isCur ? '' : ' onclick="v4shSwitchTo(\'' + s.shop_id + '\')"') + '>' +
        '<span style="font-size:24px">' + typeIcon + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<b style="font-size:14px;color:#1e293b">' + v4shEscape(s.name || s.shop_id) + '</b>' +
          '<br><small style="font-size:11px;color:#64748b">🔑 ' + s.shop_id + ' · ' + plan + (daysLeft ? ' · ' + daysLeft : '') + '</small>' +
        '</div>' +
        (isCur
          ? '<span style="background:#2563eb;color:#fff;font-size:10px;font-weight:800;padding:4px 10px;border-radius:8px;flex-shrink:0">📍 HERE</span>'
          : '<span style="color:#2563eb;font-size:12px;font-weight:700;flex-shrink:0">Switch →</span>') +
        '</div>';
    });
  }

  // Create button (with live limit check)
  html += '<div style="display:flex;gap:6px;margin-top:10px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4shOpenWizard()">➕ Create New Shop</button>' +
    '</div>' +
    '<div id="v4shLimitInfo" style="font-size:11px;color:#64748b;margin-top:6px;text-align:center"></div>';

  // Quick stats (if 2+ shops)
  if (shops.length >= 2) {
    html += '<div style="margin-top:12px;padding:10px;background:rgba(148,163,184,.08);border-radius:10px;text-align:center;font-size:11px;color:#64748b"><b>📊 Across all ' + shops.length + ' shops:</b> switching shows individual shop data. Master panel sees combined.</div>';
  }

  card.innerHTML = html;

  // Async limit info
  v4shCheckLimit('retail').then(function(r) {
    var el = document.getElementById('v4shLimitInfo');
    if (el) {
      el.textContent = r.can ? '✅ You can create ' + (r.remaining || 1) + ' more shop(s)' : 'ℹ️ ' + r.reason;
      el.style.color = r.can ? '#10b981' : '#64748b';
    }
  });
}

function v4shSwitchTo(shopId) {
  if (shopId === getShopId()) return;
  var s = v4sh.myShops.find(function(x){ return x.shop_id === shopId; });
  if (!confirm('🔄 Switch to "' + (s.name || shopId) + '"?\n\nThe page reloads with that shop\'s data.')) return;
  localStorage.setItem('shopId', shopId);
  location.reload();
}

// ═══ CREATION WIZARD ═══
function v4shOpenWizard() {
  v4shCheckLimit('any').then(function(r) {
    if (!r.can) {
      alert('✨ ' + r.reason + '\n\nUpgrade: License tab → Activate a new key, or contact your provider.');
      return;
    }
    v4shWizardStep1();
  });
}

function v4shWizardStep1() {
  var m = document.createElement('div');
  m.id = 'v4shWizard';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px;display:flex;align-items:center;justify-content:center;';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:480px;width:100%;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">➕ Create New Shop — Step 1 of 3</b>' +
    '<button onclick="v4shWizardClose()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<p style="font-size:12px;color:#64748b;margin-bottom:12px">What type of shop is this? Each type has different tools.</p>' +
    '<div style="display:grid;grid-template-columns:1fr;gap:8px">' +
    '<button class="v4shTypeBtn" data-type="retail" style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer;text-align:left">' +
      '<span style="font-size:28px">🛒</span><span><b style="display:block;font-size:14px">Retail Shop</b><small style="color:#64748b;font-size:11px">Simple selling — no kitchen, no tables</small></span></button>' +
    '<button class="v4shTypeBtn" data-type="cafe" style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer;text-align:left">' +
      '<span style="font-size:28px">☕</span><span><b style="display:block;font-size:14px">Cafe / Restaurant</b><small style="color:#64748b;font-size:11px">Kitchen, tables, waiters, QR menu</small></span></button>' +
    '<button class="v4shTypeBtn" data-type="hotel" style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer;text-align:left">' +
      '<span style="font-size:28px">🏨</span><span><b style="display:block;font-size:14px">Hotel</b><small style="color:#64748b;font-size:11px">Cafe + guest rooms + full service</small></span></button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4shWizardClose(); });
  m.querySelectorAll('.v4shTypeBtn').forEach(function(btn) {
    btn.onclick = function() {
      v4sh.currentType = btn.dataset.type;
      v4shWizardStep2();
    };
  });
}

function v4shWizardStep2() {
  var m = document.getElementById('v4shWizard');
  if (!m) return;
  var typeIcon = { retail:'🛒', cafe:'☕', hotel:'🏨' }[v4sh.currentType];
  var autoId = 'shop' + Date.now().toString(36);
  m.querySelector('div').innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + typeIcon + ' Create ' + v4sh.currentType + ' — Step 2 of 3</b>' +
    '<button onclick="v4shWizardClose()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Shop Name *</label>' +
    '<input class="v4-in" id="v4shName" placeholder="e.g., Sagure Guest House 2" style="margin-bottom:8px">' +
    '<div style="display:flex;gap:6px;margin-bottom:8px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone</label><input class="v4-in" id="v4shPhone" placeholder="+251..."></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Address</label><input class="v4-in" id="v4shAddr" placeholder="City"></div>' +
    '</div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Shop ID (auto from name — editable)</label>' +
    '<input class="v4-in" id="v4shId" placeholder="' + autoId + '" style="margin-bottom:6px">' +
    '<small id="v4shIdStatus" style="font-size:11px;display:block;margin-bottom:10px;color:#64748b">This ID connects your POS/Kitchen devices.</small>' +
    '<button class="v4-btn g" onclick="v4shWizardStep3()">Next →</button>';
  document.getElementById('v4shName').addEventListener('input', function() {
    var auto = this.value.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || autoId;
    document.getElementById('v4shId').value = auto;
  });
}

async function v4shWizardStep3() {
  var name = document.getElementById('v4shName').value.trim();
  var sid = document.getElementById('v4shId').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  var phone = document.getElementById('v4shPhone').value.trim();
  var addr = document.getElementById('v4shAddr').value.trim();
  if (!name) { alert('Shop name is required.'); return; }
  if (!sid || sid.length < 3) { alert('Shop ID must be at least 3 characters.'); return; }

  // Check availability
  try {
    const { data: existing } = await supababaseClient.from('shops').select('shop_id').eq('shop_id', sid).limit(1);
    if (existing && existing.length > 0) { alert('❌ Shop ID "' + sid + '" is taken. Try another.'); return; }
  } catch(e) {}

  var typeIcon = { retail:'🛒', cafe:'☕', hotel:'🏨' }[v4sh.currentType];
  var m = document.getElementById('v4shWizard');
  if (!m) return;
  m.querySelector('div').innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + typeIcon + ' Confirm — Step 3 of 3</b>' +
    '<button onclick="v4shWizardClose()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div style="background:#eff6ff;border-radius:12px;padding:14px;margin-bottom:12px">' +
    '<b style="font-size:16px">' + v4shEscape(name) + '</b><br>' +
    '<small style="color:#64748b">🔑 ' + sid + ' · Type: ' + v4sh.currentType + '</small><br>' +
    '<small style="color:#64748b">' + (phone ? '📞 ' + phone : '') + (addr ? ' · ' + addr : '') + '</small>' +
    '</div>' +
    '<p style="font-size:11px;color:#64748b;margin-bottom:12px">This shop starts fresh (no products, no staff). You\'ll set it up like a new registration. Switch between your shops anytime from here.</p>' +
    '<button class="v4-btn g" onclick="v4shWizardCreate(\'' + name.replace(/'/g, "\\'") + '\',\'' + sid + '\')">✅ Create Shop</button>';
}

async function v4shWizardCreate(name, sid) {
  var phone = (document.getElementById('v4shPhone') || {}).value || '';
  var addr = (document.getElementById('v4shAddr') || {}).value || '';
  try {
    var email = '';
    try { const { data: { user } } = await supabaseClient.auth.getUser(); if (user) email = user.email; } catch(e) {}

    await supabaseClient.from('shops').insert([{
      shop_id: sid, name: name, phone: phone, address: addr,
      owner_email: email, plan: 'trial', active: true,
      business_type: v4sh.currentType,
      trial_expires: new Date(Date.now() + 30 * 86400000).toISOString(),
      registered_at: new Date().toISOString()
    }]);
    await supabaseClient.from('settings').insert([{ shop_id: sid, name: name, currency: 'Br ', shop_type: v4sh.currentType === 'hotel' ? 'cafe' : v4sh.currentType }]);

    v4shWizardClose();
    await v4shLoadMyShops();
    v4shRender();
    alert('✅ Shop created!\n\n🏪 ' + name + '\n🔑 ' + sid + '\n📋 Type: ' + v4sh.currentType + '\n\nSwitch to it from the My Shops card above.');
  } catch(e) { alert('❌ ' + e.message); }
}

function v4shWizardClose() { var m = document.getElementById('v4shWizard'); if (m) m.remove(); }

// ═══ TYPE SWITCH (trial only — unlimited, data preserved) ═══
async function v4shSwitchType(newType) {
  var shop = window.__currentShopRow;
  if (!shop) return;
  if (shop.plan !== 'trial') {
    alert('🔒 Type switching is available during trial only.\n\nYour plan "' + shop.plan + '" is locked to ' + shop.business_type + '.\nActivate a different plan or create a new shop to change type.');
    return;
  }
  var typeIcon = { retail:'🛒', cafe:'☕', hotel:'🏨' }[newType];
  if (!await confirm(typeIcon + ' Switch your shop to ' + newType + ' type?\n\n✅ Your products, sales, and all data are PRESERVED\n✅ Only the tools change (kitchen/tables appear or disappear)\n✅ You can switch again anytime during trial')) return;
  try {
    await supabaseClient.from('shops').update({ business_type: newType }).eq('shop_id', getShopId());
    await supabaseClient.from('settings').update({ shop_type: newType === 'hotel' ? 'cafe' : newType }).eq('shop_id', getShopId());
    if (window.__currentShopRow) window.__currentShopRow.business_type = newType;
    alert('✅ Switched to ' + newType + '!\n\nYour data is safe. The tools for ' + newType + ' are now active.');
    location.reload();
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ TAB LOADER (runs when Settings opens) ═══
var v4shOrigSettingsLoader = V4_TAB_LOADERS[13];
V4_TAB_LOADERS[13] = function() {
  if (v4shOrigSettingsLoader) v4shOrigSettingsLoader();
  v4shLoadMyShops().then(function() {
    v4shEnsureUI();
    // Also update the header switcher
    if (typeof v4InitSwitcher === 'function') {
      window.__v4MyShops = v4sh.myShops;
      v4InitSwitcher();
    }
  });
};
