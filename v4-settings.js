// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — SETTINGS MODULE v2 (tab13 + tab14)
//  v2 fixes: shop name visible · instant save-refresh ·
//  VAT box auto-hides for TOT · password/PIN full flow with
//  visibility toggle · QR print-to-file · GPS capture ·
//  Device Link Center · KOT only for cafe/hotel · help text
//  on every section · trial → plan picker after expiry.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4se = { data: {} };

function v4seG(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function v4seN(id) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
function v4seC(id) { var el = document.getElementById(id); return el ? el.checked : false; }

async function v4seLoadSettings() {
  try {
    const { data, error } = await supabaseClient.from('settings').select('*').eq('shop_id', getShopId()).maybeSingle();
    if (error) throw error;
    v4se.data = data || {};
    return data;
  } catch(e) { console.warn('Settings load:', e.message); v4se.data = {}; return null; }
}

// ═══ UI (tab13 — Settings) ═══
function v4seEnsureUI() {
  var tab = document.getElementById('tab13');
  if (!tab || tab.dataset.seBuilt === '1') return;
  tab.dataset.seBuilt = '1';

  function cat(label, help) {
    return '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:16px 0 4px 0;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">' + label + '</div>' +
      (help ? '<p style="font-size:11px;color:#94a3b8;margin:2px 0 8px 0;">' + help + '</p>' : '');
  }
  function row(id, label, type, ph) {
    return '<div style="margin-bottom:6px"><label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-bottom:2px;">' + label + '</label>' +
      '<input type="' + (type || 'text') + '" class="v4-in" id="' + id + '" placeholder="' + (ph || '') + '" style="padding:9px 12px;font-size:13px"></div>';
  }
  function pwdRow(id, label, ph) {
    return '<div style="margin-bottom:6px;position:relative"><label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-bottom:2px;">' + label + '</label>' +
      '<input type="password" class="v4-in" id="' + id + '" placeholder="' + (ph || '') + '" style="padding:9px 40px 9px 12px;font-size:13px">' +
      '<button type="button" onclick="v4seTogglePwd(\'' + id + '\')" style="position:absolute;right:8px;top:28px;background:none;border:none;font-size:16px;cursor:pointer;">👁️</button></div>';
  }
  function toggle(id, label, checked) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9">' +
      '<span style="font-size:13px">' + label + '</span>' +
      '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + ' style="width:22px;height:22px;cursor:pointer;"></div>';
  }

  tab.innerHTML =
    '<style>' +
    '.v4seBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:60px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;width:100%;}' +
    '.v4seBtn:active{transform:scale(.97);}' +
    '.v4seBtnIc{font-size:24px;flex-shrink:0;width:34px;text-align:center;}' +
    '.v4seBtnTx{flex:1;min-width:0;}' +
    '.v4seBtnTx b{display:block;font-size:13px;line-height:1.2;}' +
    '.v4seBtnTx small{display:block;font-size:10px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.se-fold{cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;}' +
    '.se-fold .se-arrow{font-size:14px;transition:transform .2s;color:#94a3b8;flex-shrink:0;margin-left:8px;}' +
    '.se-fold .se-arrow.open{transform:rotate(90deg);}' +
    '.se-body{display:block;}' +
    '.se-body.folded{display:none;}' +
    '</style>' +

    // ═══ SHOP IDENTITY (name + ID visible — NOT foldable, always seen) ═══
    '<div class="card" style="padding:14px;background:#eff6ff;border:2px solid #2563eb;">' +
    '<div class="card-title">🏪 Your Shop</div>' +
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">' +
    '<div id="seShopNameDisplay" style="flex:1;font-size:22px;font-weight:800;color:#1e3a8a;">Loading…</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<div style="flex:1;font-size:13px;color:#64748b;">🔑 Shop ID: <b id="seShopIdDisplay" style="color:#2563eb;">—</b></div>' +
    '<button class="v4-chip" onclick="v4seCopyShopId()">📋 Copy ID</button>' +
    '</div>' +
    '<p style="font-size:11px;color:#64748b;margin-top:6px;">Use this ID when connecting POS/Kitchen devices — or just sign in with your email (auto-detected).</p>' +
    '</div>' +

    // ═══ BRANDING (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🏪 Shop Identity & Branding <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Your shop name appears on receipts, the customer menu, and the header above. Currency symbol shows on every price in the app.</p>' +
    row('seShopName', 'Shop Name *', 'text', 'e.g., Sagure Hotel') +
    row('seShopPhone', 'Phone (for receipts & WhatsApp)', 'text', '+251...') +
    row('seShopAddress', 'Address (printed on receipts)', 'text', 'City, area') +
    row('seCurrency', 'Currency Symbol', 'text', 'Br, $, €') +
    '<label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-bottom:2px;">📍 Shop GPS Location (for staff attendance geofencing)</label>' +
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">' +
    '<input type="text" class="v4-in" id="seShopLat" placeholder="Latitude" style="flex:1;padding:9px;font-size:13px">' +
    '<input type="text" class="v4-in" id="seShopLng" placeholder="Longitude" style="flex:1;padding:9px;font-size:13px">' +
    '<button type="button" class="v4-chip" onclick="v4seGetGPS()" style="flex-shrink:0;padding:10px 14px;">📍 Get GPS</button>' +
    '</div>' +
    '<p style="font-size:10px;color:#94a3b8;margin:-2px 0 8px 0;">GPS lets you verify staff clock-in location. Tap "Get GPS" while standing at your shop.</p>' +
    '<button class="v4-btn p" onclick="v4seSaveBranding()">💾 Save Branding</button>' +
    '</div>' +
    '</div>' +

    // ═══ TAX (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🏛️ Tax Configuration <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">TOT shops (small business) cannot charge VAT — the tax fields hide automatically. VAT-registered shops enter their TIN and VAT numbers.</p>' +
    '<select class="v4-in" id="seTaxType" onchange="v4seTaxTypeChange()" style="margin-bottom:8px">' +
    '<option value="TOT">TOT — Turnover Tax (small business)</option>' +
    '<option value="VAT">VAT — Value Added Tax (registered)</option>' +
    '</select>' +
    row('seTin', 'TIN — Tax Identification Number', 'text', 'e.g., 0001234567') +
    '<div id="seVatWrap" style="display:none">' +
    row('seVat', 'VAT Registration Number', 'text', 'e.g., 600123456') +
    '<div style="display:grid;grid-template-columns:2fr 1fr;gap:6px">' +
    '<div>' + row('seTaxName', 'Tax Name (on receipts)', 'text', 'VAT') + '</div>' +
    '<div>' + row('seTaxRate', 'Rate %', 'number', '15') + '</div>' +
    '</div>' +
    toggle('seEnableTax', '🧾 Charge tax on POS sales', false) +
    '</div>' +
    '<button class="v4-btn p" style="margin-top:8px" onclick="v4seSaveTax()">💾 Save Tax Configuration</button>' +
    '</div>' +
    '</div>' +

    // ═══ SHOP TYPE & POS FEATURES (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🔧 Shop Type & POS Features <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Your shop type determines which tools appear. Retail = simple selling. Cafe = kitchen + tables + waiters. Hotel = cafe + rooms + full service.</p>' +
    '<select class="v4-in" id="seShopType" onchange="v4seShopTypeChange()" style="margin-bottom:8px">' +
    '<option value="retail">🛒 Retail / Supermarket (Simple)</option>' +
    '<option value="cafe">☕ Cafe / Restaurant (Kitchen + Tables)</option>' +
    '<option value="hotel">🏨 Hotel (Cafe + Rooms + Full Service)</option>' +
    '</select>' +
    '<div id="seKotWrap" style="display:none">' +
    '<label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-bottom:2px;">🧾 Kitchen Ticket Mode (when waiter sends order)</label>' +
    '<select class="v4-in" id="seKotMode" style="margin-bottom:8px">' +
    '<option value="digital">🖥️ Digital only — Kitchen app on tablet (no paper)</option>' +
    '<option value="auto">🖨️ Print paper ticket — always</option>' +
    '<option value="ask">🤔 Ask waiter every order</option>' +
    '</select>' +
    '</div>' +
    toggle('seNegotiate', '✏️ Allow price negotiation on POS', true) +
    toggle('seBulk', '📦 Bulk pricing (quantity discounts)', true) +
    toggle('seDiscount', '🏷️ Enable discounts on POS', true) +
    '<button class="v4-btn p" style="margin-top:8px" onclick="v4seSavePos()">💾 Save POS Settings</button>' +
    '</div>' +
    '</div>' +

    // ═══ CALENDAR (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">📅 Calendar System <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Choose how dates display across the entire app.</p>' +
    '<select class="v4-in" id="seCalendar" onchange="v4seSaveCalendar()">' +
    '<option value="gregorian">Gregorian (Standard — Jan, Feb, Mar...)</option>' +
    '<option value="ethiopian">Ethiopian (ቆጸራ — መስከረም, ጥቅምት...)</option>' +
    '</select>' +
    '</div>' +
    '</div>' +

    // ═══ QR MENU CUSTOMIZER (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">📱 Customer QR Menu Design <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Your customers scan a QR code at their table and see this menu. Design it to match your brand.</p>' +
    row('seMenuWelcome', 'Welcome Message (top of menu)', 'text', 'Welcome to our cafe!') +
    row('seMenuPromo', 'Promotional Text (below welcome)', 'text', 'Try our new Summer Specials!') +
    row('seMenuVideo', 'Video URL (YouTube — plays on menu)', 'text', 'https://youtube.com/watch?v=...') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0">' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">🎨 Header Color</label><input type="color" class="v4-in" id="seMenuHeader" value="#1e3a8a" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">🌐 Background</label><input type="color" class="v4-in" id="seMenuBg" value="#f8fafc" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">🃏 Item Card</label><input type="color" class="v4-in" id="seMenuCard" value="#ffffff" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">💵 Price Color</label><input type="color" class="v4-in" id="seMenuPrice" value="#2563eb" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '</div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-top:6px">🖼️ Banner Image (top of menu)</label>' +
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">' +
    '<input class="v4-in" id="seMenuBanner" placeholder="Paste image URL or upload" style="flex:1;padding:9px 12px;font-size:13px" oninput="v4seBannerPreview()">' +
    '<button type="button" class="v4-chip" onclick="document.getElementById(\'seMenuBannerFile\').click()">📁 Upload</button>' +
    '</div>' +
    '<input type="file" id="seMenuBannerFile" accept="image/*" style="display:none" onchange="ssUploadProductImage(this, \'seMenuBanner\')">' +
    '<img id="seMenuBannerPreview" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;display:none;margin-bottom:6px">' +
    '<button class="v4-chip" id="seRemoveBanner" style="display:none;margin-bottom:6px" onclick="v4seRemoveBanner()">🗑️ Remove Image</button>' +
    '<button class="v4-btn p" onclick="v4seSaveMenu()">💾 Save Menu Design</button>' +
    '</div>' +
    '</div>' +

    // ═══ TABLES & QR (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🪑 Tables & QR Codes <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Add your tables, then generate QR codes. Customers scan the QR at their table to order — no waiter needed.</p>' +
    '<div id="seTableInputs"></div>' +
    '<div style="display:flex;gap:6px;margin-top:8px">' +
    '<button class="v4-chip" style="flex:1" onclick="v4seAddTableInput()">➕ Add Table</button>' +
    '<button class="v4-chip" style="flex:1" onclick="v4seSaveTables()">💾 Save Tables</button>' +
    '</div>' +
    '<button class="v4-btn p" style="margin-top:8px" onclick="v4seGenerateQR()">📱 Generate QR Codes</button>' +
    '<div id="seQRArea" style="text-align:center;margin-top:12px;display:none"></div>' +
    '<button class="v4-btn" style="background:#334155;margin-top:8px;display:none" id="seQRPrintBtn" onclick="v4sePrintQRSheet()">🖨️ Print QR Sheet (all tables on one page)</button>' +
    '</div>' +
    '</div>' +

    // ═══ DEVICE LINK CENTER (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🔗 Device Link Center <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Connect your POS, Kitchen, and Menu devices. Generate QR codes for each device type — staff scan and are connected instantly.</p>' +
    '<button class="v4-btn p" onclick="v4seDeviceLinks()">🔗 Open Device Link Center</button>' +
    '<div id="seDeviceArea" style="text-align:center;margin-top:12px;display:none"></div>' +
    '<button class="v4-btn" style="background:#334155;margin-top:8px;display:none" id="seDevicePrintBtn" onclick="v4sePrintDeviceSheet()">🖨️ Print Device QR Sheet</button>' +
    '</div>' +
    '</div>' +

    // ═══ SECURITY (foldable) ═══
    '<div class="card">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🔐 Account Security <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#94a3b8;margin:4px 0 8px 0;">Change your login password or your 4-digit App PIN. You will be asked to verify your current one first.</p>' +
    '<button class="v4-btn p" style="margin-bottom:6px" onclick="v4seChangePassword()">🔑 Change Password</button>' +
    '<button class="v4-btn" style="background:#f59e0b" onclick="v4seChangePin()">🔢 Change App PIN</button>' +
    '</div>' +
    '</div>' +

    // ═══ DANGER ZONE (foldable) ═══
    '<div class="card" style="border:2px solid #ef4444;">' +
    '<div class="card-title se-fold" onclick="v4seFold(this)">🚨 Danger Zone <span class="se-arrow open">▶</span></div>' +
    '<div class="se-body">' +
    '<p style="font-size:11px;color:#ef4444;margin:4px 0 8px 0;font-weight:600">These actions are permanent. Think before tapping.</p>' +
    '<button class="v4-btn" style="background:#dc2626;margin-bottom:6px" onclick="v4seSystemLock()">🔒 Lock All Staff Devices</button>' +
    '<button class="v4-btn" style="background:#7f1d1d" onclick="v4seResetShop()">🗑️ Delete ALL Shop Data</button>' +
    '</div>' +
    '</div>';
}

// ═══ FOLD / UNFOLD ═══
function v4seFold(titleEl) {
  var body = titleEl.nextElementSibling;
  var arrow = titleEl.querySelector('.se-arrow');
  if (!body) return;
  body.classList.toggle('folded');
  if (arrow) arrow.classList.toggle('open');
}
// ═══ PASSWORD VISIBILITY TOGGLE ═══
function v4seTogglePwd(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
  var btn = el.parentElement.querySelector('button');
  if (btn) btn.textContent = el.type === 'password' ? '👁️' : '🙈';
}

// ═══ TAX TYPE CHANGE (hides VAT box for TOT) ═══
function v4seTaxTypeChange() {
  var type = v4seG('seTaxType');
  var vatWrap = document.getElementById('seVatWrap');
  if (vatWrap) vatWrap.style.display = type === 'VAT' ? 'block' : 'none';
}

// ═══ SHOP TYPE CHANGE (KOT only for cafe/hotel) ═══
function v4seShopTypeChange() {
  var type = v4seG('seShopType');
  var kotWrap = document.getElementById('seKotWrap');
  if (kotWrap) kotWrap.style.display = (type === 'cafe' || type === 'hotel') ? 'block' : 'none';
}

// ═══ LOAD & FILL (with instant name display) ═══
async function v4seLoad() {
  await v4seLoadSettings();
  var d = v4se.data || {};
  var g = function(id, v) { var el = document.getElementById(id); if (el && v !== undefined && v !== null && v !== '') el.value = v; };
  var c = function(id, v) { var el = document.getElementById(id); if (el) el.checked = !!v; };

  // Shop name (from settings OR shop row)
  var shopName = d.name || (window.__currentShopRow && window.__currentShopRow.name) || 'My Shop';
  var nameEl = document.getElementById('seShopNameDisplay');
  if (nameEl) nameEl.textContent = '🏪 ' + shopName;
  g('seShopName', shopName);
  g('seShopIdDisplay', getShopId());

  g('seShopPhone', d.phone); g('seShopAddress', d.address);
  g('seCurrency', d.currency || 'Br ');
  g('seShopLat', d.shop_lat); g('seShopLng', d.shop_lng);

  g('seTaxType', d.tax_type || 'TOT'); g('seTin', d.tin_number); g('seVat', d.vat_number);
  g('seTaxName', d.tax_name); g('seTaxRate', d.tax_rate);
  c('seEnableTax', d.enable_tax);
  v4seTaxTypeChange();

  // Shop type (from business_type or settings)
  var bizType = (window.__currentShopRow && window.__currentShopRow.business_type) || d.shop_type || 'retail';
  g('seShopType', bizType === 'hotel' ? 'hotel' : (bizType === 'cafe' ? 'cafe' : 'retail'));
  g('seKotMode', d.kot_print_mode || 'digital');
  c('seNegotiate', d.negotiate_price !== false); c('seBulk', d.bulk_pricing !== false); c('seDiscount', d.enable_discount !== false);
  v4seShopTypeChange();

  g('seCalendar', localStorage.getItem('calendarSystem') || 'gregorian');
  g('seMenuWelcome', d.welcome_msg); g('seMenuPromo', d.promo_text); g('seMenuVideo', d.video_url);
  g('seMenuHeader', d.header_color || '#1e3a8a'); g('seMenuBg', d.bg_color || '#f8fafc');
  g('seMenuCard', d.card_color || '#ffffff'); g('seMenuPrice', d.price_color || '#2563eb');
  if (d.banner_url) {
    g('seMenuBanner', d.banner_url);
    v4seBannerPreview();
  }

  // Update header title with shop name
  var ht = document.getElementById('headerTitle');
  if (ht && shopName && shopName !== 'My Shop') ht.textContent = shopName;

  v4seLoadTables();
}

// ═══ BANNER PREVIEW ═══
function v4seBannerPreview() {
  var url = v4seG('seMenuBanner');
  var pv = document.getElementById('seMenuBannerPreview');
  var rb = document.getElementById('seRemoveBanner');
  if (url && pv) { pv.src = url; pv.style.display = 'block'; if (rb) rb.style.display = 'inline-block'; }
  else if (pv) { pv.style.display = 'none'; if (rb) rb.style.display = 'none'; }
}
function v4seRemoveBanner() {
  var b = document.getElementById('seMenuBanner');
  if (b) b.value = '';
  v4seBannerPreview();
}

// ═══ GPS CAPTURE ═══
function v4seGetGPS() {
  if (!navigator.geolocation) { alert('GPS not supported on this device.'); return; }
  alert('📍 Getting your location…\nPlease allow location access.\n\nStand at your shop entrance for the best accuracy.');
  navigator.geolocation.getCurrentPosition(function(pos) {
    document.getElementById('seShopLat').value = pos.coords.latitude.toFixed(6);
    document.getElementById('seShopLng').value = pos.coords.longitude.toFixed(6);
    alert('✅ GPS captured! Tap "Save Branding" to lock your shop location.');
  }, function(err) {
    alert('❌ Location access denied. Allow location in your browser settings.');
  }, { timeout: 10000, enableHighAccuracy: true });
}

// ═══ SAVE BRANDING (instant refresh — no reload) ═══
async function v4seSaveBranding() {
  var name = v4seG('seShopName');
  if (!name) { alert('Shop name is required.'); return; }
  var currency = v4seG('seCurrency') || 'Br ';
  var payload = { shop_id: getShopId(), name: name, phone: v4seG('seShopPhone'),
    address: v4seG('seShopAddress'), currency: currency,
    shop_lat: v4seG('seShopLat') || null, shop_lng: v4seG('seShopLng') || null };
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id', returning: 'minimal' });
    if (error) throw error;
    // ⚡ INSTANT REFRESH — no reload needed
    localStorage.setItem('appCurrencySymbol', currency);
    if (typeof appCurrencySymbol !== 'undefined') appCurrencySymbol = currency;
    // Update header
    var ht = document.getElementById('headerTitle');
    if (ht) ht.textContent = name;
    // Update shop name display
    var nd = document.getElementById('seShopNameDisplay');
    if (nd) nd.textContent = '🏪 ' + name;
    // Update v4se data
    v4se.data = Object.assign(v4se.data, payload);
    alert('✅ Branding saved!\n\nName, phone, address, currency' + (payload.shop_lat ? ' and GPS' : '') + ' updated everywhere.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ SAVE TAX ═══
async function v4seSaveTax() {
  var type = v4seG('seTaxType');
  var isVat = type === 'VAT';
  var payload = { shop_id: getShopId(), tax_type: type,
    tin_number: v4seG('seTin'),
    enable_tax: isVat && v4seC('seEnableTax'),
    tax_name: isVat ? (v4seG('seTaxName') || 'VAT') : 'TOT',
    tax_rate: isVat ? v4seN('seTaxRate') : 0 };
  if (isVat) payload.vat_number = v4seG('seVat');
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id', returning: 'minimal' });
    if (error) throw error;
    v4se.data = Object.assign(v4se.data, payload);
    alert('✅ Tax saved!' + (isVat ? '\nVAT ' + payload.tax_rate + '% — POS will charge it.' : '\nTOT shop: tax stays OFF (law).'));
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ SAVE POS SETTINGS ═══
async function v4seSavePos() {
  var shopType = v4seG('seShopType');
  var payload = { shop_id: getShopId(),
    shop_type: shopType === 'hotel' ? 'cafe' : shopType,
    negotiate_price: v4seC('seNegotiate'), bulk_pricing: v4seC('seBulk'),
    enable_discount: v4seC('seDiscount') };
  var kotEl = document.getElementById('seKotMode');
  if (kotEl) payload.kot_print_mode = kotEl.value;
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id', returning: 'minimal' });
    if (error) throw error;
    var bizType = shopType === 'hotel' ? 'hotel' : shopType;
    await supabaseClient.from('shops').update({ business_type: bizType }).eq('shop_id', getShopId());
    if (window.__currentShopRow) window.__currentShopRow.business_type = bizType;
    v4se.data = Object.assign(v4se.data, payload);
    alert('✅ POS settings saved!\nShop type: ' + bizType);
    // Refresh sidebar visibility
    if (typeof v4lgApplySidebar === 'function') v4lgApplySidebar();
    else if (typeof applyPlanVisibility === 'function') applyPlanVisibility();
  } catch(e) { alert('❌ ' + e.message); }
}

async function v4seSaveCalendar() {
  var cal = v4seG('seCalendar');
  localStorage.setItem('calendarSystem', cal);
  try { await supabaseClient.from('settings').update({ calendar_system: cal }).eq('shop_id', getShopId()); } catch(e) {}
  alert('✅ Calendar: ' + (cal === 'ethiopian' ? 'Ethiopian (ቆጸራ)' : 'Gregorian'));
}

async function v4seSaveMenu() {
  var payload = { shop_id: getShopId(),
    welcome_msg: v4seG('seMenuWelcome'), promo_text: v4seG('seMenuPromo'),
    video_url: v4seG('seMenuVideo'), banner_url: v4seG('seMenuBanner'),
    header_color: v4seG('seMenuHeader'), bg_color: v4seG('seMenuBg'),
    card_color: v4seG('seMenuCard'), price_color: v4seG('seMenuPrice') };
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id' });
    if (error) throw error;
    v4se.data = Object.assign(v4se.data, payload);
    alert('✅ Menu design saved!');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ TABLES ═══
var v4seTables = [];
function v4seLoadTables() {
  var d = v4se.data || {};
  if (d.table_names) {
    v4seTables = d.table_names.split(',').map(function(t){ return t.trim(); }).filter(function(t){ return t; });
  }
  v4seRenderTableInputs();
}
function v4seRenderTableInputs() {
  var box = document.getElementById('seTableInputs'); if (!box) return;
  if (!v4seTables.length) {
    box.innerHTML = '<p style="font-size:11px;color:#94a3b8;">No tables yet. Tap "Add Table" to create your first.</p>';
    return;
  }
  var html = '';
  v4seTables.forEach(function(name, i) {
    html += '<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">' +
      '<input class="v4-in" value="' + name.replace(/"/g, '&quot;') + '" style="flex:1;padding:9px;font-size:13px" oninput="v4seTables[' + i + ']=this.value">' +
      '<button class="btn-mini delete" onclick="v4seTables.splice(' + i + ',1);v4seRenderTableInputs()">🗑️</button></div>';
  });
  box.innerHTML = html;
}
function v4seAddTableInput() {
  v4seTables.push('Table ' + (v4seTables.length + 1));
  v4seRenderTableInputs();
}
async function v4seSaveTables() {
  var cleaned = v4seTables.map(function(t){ return t.trim(); }).filter(function(t){ return t; });
  if (!cleaned.length) { alert('Add at least one table!'); return; }
  try {
    const { error } = await supabaseClient.from('settings').upsert({ shop_id: getShopId(), table_names: cleaned.join(', ') }, { onConflict: 'shop_id' });
    if (error) throw error;
    alert('✅ Tables saved!');
  } catch(e) { alert('❌ ' + e.message); }
}
function v4seGenerateQR() {
  if (!v4seTables.length) { alert('Add tables first.'); return; }
  var area = document.getElementById('seQRArea');
  var path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  var baseURL = window.location.origin + path + 'menu.html';
  var html = '<h4 style="margin-bottom:10px;">Scan to Order</h4><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">';
  v4seTables.forEach(function(t) {
    var url = baseURL + '?shop=' + getShopId() + '&table=' + encodeURIComponent(t.trim());
    var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(url);
    html += '<div style="margin-bottom:10px;padding:8px;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;">' +
      '<b style="display:block;margin-bottom:5px;font-size:13px;">' + t.trim() + '</b>' +
      '<img src="' + qrApi + '" style="width:100px;height:100px;">' +
      '<br><a href="' + url + '" target="_blank" style="font-size:8px;color:#2563eb;word-break:break-all;">Open Menu</a></div>';
  });
  html += '</div>';
  area.innerHTML = html;
  area.style.display = 'block';
  var pb = document.getElementById('seQRPrintBtn');
  if (pb) pb.style.display = 'block';
}

// ═══ QR PRINT TO FILE ═══
function v4sePrintQRSheet() {
  var w = window.open('', '_blank', 'width=800,height=1000');
  if (!w) { alert('Allow popups to print.'); return; }
  var path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  var baseURL = window.location.origin + path + 'menu.html';
  var shopName = v4seG('seShopName') || 'SmartShop Pro';
  var html = '<html><head><title>Table QR Codes</title><style>' +
    'body{font-family:Arial,sans-serif;padding:20px;text-align:center}' +
    '.qr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:15px}' +
    '.qr-item{border:2px solid #1e293b;border-radius:12px;padding:15px;text-align:center}' +
    '.qr-item h3{margin:0 0 8px;font-size:18px;color:#1e293b}' +
    '.qr-item img{width:140px;height:140px}' +
    '.qr-item small{display:block;margin-top:5px;font-size:9px;color:#64748b;word-break:break-all}' +
    '</style></head><body>' +
    '<h1 style="color:#1e3a8a;margin-bottom:2px">🏪 ' + sanitize(shopName) + '</h1>' +
    '<h2 style="font-size:14px;color:#64748b;margin-top:0">📱 Table QR Codes — Scan to Order</h2>' +
    '<p style="font-size:11px;color:#94a3b8">Print this sheet, cut out each QR code, and place on the matching table.</p>' +
    '<div class="qr-grid">';
  v4seTables.forEach(function(t) {
    var url = baseURL + '?shop=' + getShopId() + '&table=' + encodeURIComponent(t.trim());
    var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
    html += '<div class="qr-item"><h3>🪑 ' + t.trim() + '</h3><img src="' + qrApi + '"><small>' + url + '</small></div>';
  });
  html += '</div></body></html>';
  w.document.write(html);
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 500);
}

// ═══ DEVICE LINK CENTER ═══
function v4seDeviceLinks() {
  var shop = getShopId();
  if (!shop || shop === 'default') { alert('Shop ID not found. Activate a license first.'); return; }
  var area = document.getElementById('seDeviceArea');
  var path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  var baseURL = window.location.origin + path;
  var devices = [
    { name: 'POS Terminal', icon: '💰', url: baseURL + 'pos.html?shop=' + shop, color: '#10b981', desc: 'Cashier device — for selling' },
    { name: 'Kitchen Display', icon: '👨‍🍳', url: baseURL + 'kitchen.html?shop=' + shop, color: '#f59e0b', desc: 'Chef device — for order tickets' },
    { name: 'Customer Menu', icon: '📱', url: baseURL + 'menu.html?shop=' + shop, color: '#7c3aed', desc: 'QR menu — for customer tables' }
  ];
  var html = '<h4 style="margin-bottom:10px;">Device Link Center</h4>' +
    '<p style="font-size:11px;color:#64748b;margin-bottom:12px;">Scan the QR code or tap the link to open on each device. The device connects to your shop automatically.</p>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
  devices.forEach(function(d) {
    var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(d.url);
    html += '<div style="background:#f8fafc;padding:12px;border-radius:12px;text-align:center;min-width:130px;border:2px solid ' + d.color + ';">' +
      '<b style="display:block;margin-bottom:5px;font-size:13px;">' + d.icon + ' ' + d.name + '</b>' +
      '<img src="' + qrApi + '" style="width:110px;height:110px;">' +
      '<br><small style="font-size:9px;color:' + d.color + ';font-weight:700;">' + d.desc + '</small>' +
      '<br><a href="' + d.url + '" target="_blank" style="font-size:9px;color:#2563eb;">🔗 Open Link</a></div>';
  });
  html += '</div>';
  area.innerHTML = html;
  area.style.display = 'block';
  var pb = document.getElementById('seDevicePrintBtn');
  if (pb) pb.style.display = 'block';
}

function v4sePrintDeviceSheet() {
  var w = window.open('', '_blank', 'width=800,height=1000');
  if (!w) { alert('Allow popups.'); return; }
  var path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  var baseURL = window.location.origin + path;
  var shopName = v4seG('seShopName') || 'SmartShop Pro';
  var devices = [
    { name: 'POS Terminal', icon: '💰', url: baseURL + 'pos.html?shop=' + getShopId(), desc: 'Cashier device — for selling' },
    { name: 'Kitchen Display', icon: '👨‍🍳', url: baseURL + 'kitchen.html?shop=' + getShopId(), desc: 'Chef device — for order tickets' },
    { name: 'Customer Menu', icon: '📱', url: baseURL + 'menu.html?shop=' + getShopId(), desc: 'QR menu — for customer tables' }
  ];
  var html = '<html><head><title>Device QR Codes</title><style>' +
    'body{font-family:Arial,sans-serif;padding:20px;text-align:center}' +
    '.dev{display:inline-block;margin:10px;padding:15px;border:2px solid #1e293b;border-radius:12px;text-align:center;width:200px}' +
    '.dev h3{margin:0 0 8px;font-size:16px}' +
    '.dev img{width:130px;height:130px}' +
    '.dev small{display:block;margin-top:5px;font-size:10px;color:#64748b}' +
    '</style></head><body>' +
    '<h1 style="color:#1e3a8a">🏪 ' + sanitize(shopName) + '</h1>' +
    '<h2 style="font-size:14px;color:#64748b">🔗 Device Link Center — Scan to Connect</h2>' +
    '<p style="font-size:11px;color:#94a3b8">Print this and keep it near your devices. Staff scan their QR code and are connected instantly.</p>';
  devices.forEach(function(d) {
    var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(d.url);
    html += '<div class="dev"><h3>' + d.icon + ' ' + d.name + '</h3><img src="' + qrApi + '"><small>' + d.desc + '</small></div>';
  });
  html += '</body></html>';
  w.document.write(html);
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 500);
}

// ═══ SECURITY (full flow: old → verify → new → confirm → changed) ═══
async function v4seChangePassword() {
  // STEP 1: Ask for current password
  var oldPass = await prompt('🔐 STEP 1 of 3\n\nEnter your CURRENT password:');
  if (!oldPass) return;

  // Verify current password
  try {
    var { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { alert('Session expired. Please login again.'); return; }
    const { error } = await supabaseClient.auth.signInWithPassword({ email: user.email, password: oldPass });
    if (error) { alert('❌ Current password is incorrect.'); return; }
  } catch(e) { alert('Error: ' + e.message); return; }

  // STEP 2: Ask for new password
  var newPass = await prompt('🔐 STEP 2 of 3\n\nEnter your NEW password (min 6 characters):');
  if (!newPass) return;
  if (newPass.length < 6) { alert('Password must be at least 6 characters.'); return; }

  // STEP 3: Confirm new password
  var confirmPass = await prompt('🔐 STEP 3 of 3\n\nConfirm your new password (type it again):');
  if (!confirmPass) return;
  if (newPass !== confirmPass) { alert('❌ Passwords do not match. Try again.'); return; }

  // Save
  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });
    if (error) throw error;
    alert('✅ Password changed successfully!');
  } catch(e) { alert('❌ ' + e.message); }
}

async function v4seChangePin() {
  // STEP 1: Ask for current PIN
  var oldPin = await prompt('🔢 STEP 1 of 3\n\nEnter your CURRENT 4-digit PIN:');
  if (!oldPin) return;
  if (sha256(oldPin) !== localStorage.getItem('appPinHash')) { alert('❌ Current PIN is incorrect.'); return; }

  // STEP 2: Ask for new PIN
  var newPin = await prompt('🔢 STEP 2 of 3\n\nEnter your NEW 4-digit PIN:');
  if (!newPin) return;
  if (newPin.length !== 4) { alert('PIN must be exactly 4 digits.'); return; }

  // STEP 3: Confirm
  var confirmPin = await prompt('🔢 STEP 3 of 3\n\nConfirm your new PIN (type it again):');
  if (!confirmPin) return;
  if (newPin !== confirmPin) { alert('❌ PINs do not match.'); return; }

  localStorage.setItem('appPinHash', sha256(newPin));
  alert('✅ PIN changed successfully!');
}

// ═══ DANGER ZONE ═══
async function v4seSystemLock() {
  if (!await confirm('🔒 Lock ALL staff devices NOW?\nEvery POS, Kitchen, and Hotel terminal will be disabled instantly.\n\nUse when: device stolen, after closing time, or suspected misuse.')) return;
  try {
    const { error } = await supabaseClient.from('settings').upsert({ shop_id: getShopId(), system_locked: true }, { onConflict: 'shop_id' });
    if (error) throw error;
    alert('🔒 All devices locked!');
  } catch(e) { alert('❌ ' + e.message); }
}

async function v4seResetShop() {
  var email = await prompt('⚠️ DELETE ALL DATA PERMANENTLY.\n\nThis removes products, sales, staff, expenses — EVERYTHING.\n\nEnter your email to confirm:');
  if (!email) return;
  if (!await confirm('🚨 FINAL WARNING: This CANNOT be undone.')) return;
  try {
    var cols = ['products','sales','losses','expenses','employees','suppliers','purchase_orders','loyalty','loans','bank_accounts','bank_transactions','notes','orders','recipes','salary_ledger','stock_movements','timecards','chat_messages'];
    for (var i = 0; i < cols.length; i++) {
      await supabaseClient.from(cols[i]).delete().eq('shop_id', getShopId());
    }
    alert('Shop reset complete.');
    location.reload();
  } catch(e) { alert('Error: ' + e.message); }
}

function v4seCopyShopId() {
  var sid = getShopId();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(sid).then(function() { alert('📋 Shop ID copied:\n' + sid); });
  } else { alert('Shop ID: ' + sid); }
}

// ═══ LICENSE (tab14) ═══
function v4seEnsureLicenseUI() {
  var tab = document.getElementById('tab14');
  if (!tab || tab.dataset.liBuilt === '1') return;
  tab.dataset.liBuilt = '1';
  tab.innerHTML =
    '<div class="card">' +
    '<div class="card-title">🔑 License</div>' +
    '<div id="liInfo" style="margin-bottom:12px"><p style="color:#94a3b8;">Loading…</p></div>' +
    '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:12px;font-size:12px;line-height:1.6;">' +
    '<b>ℹ️ How to upgrade or renew:</b><br>' +
    '1. Contact your provider to obtain a new license key.<br>' +
    '2. Enter the key below and tap Activate.' +
    '</div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">License Key</label>' +
    '<input class="v4-in" id="liKey" placeholder="Enter license key" style="margin-bottom:8px">' +
    '<button class="v4-btn g" onclick="v4seActivateLicense()">🔓 Activate</button>' +
    '<button class="v4-btn p" style="background:#f59e0b;margin-top:6px" onclick="v4seContactProvider()">📞 Contact Provider</button>' +
    '<hr style="margin:14px 0;border-color:#e2e8f0;">' +
    '<p style="font-size:12px;color:#64748b;">⚠️ <b>Remove Licence &amp; Use Free Plan</b><br>This limits your shop to <b>15 products</b> and <b>1 cashier</b>.</p>' +
    '<button class="v4-btn" style="background:#fff;color:#ef4444;border:2px solid #ef4444;" onclick="v4seRemoveLicense()">🗑️ Remove Licence (Free Plan)</button>' +
    '</div>';
}

async function v4seLoadLicense() {
  var el = document.getElementById('liInfo'); if (!el) return;
  try {
    const { data: lic } = await supabaseClient.from('licenses').select('*').eq('shop_id', getShopId()).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (lic && (!lic.status || lic.status === 'active')) {
      var days = Math.ceil((new Date(lic.expiry_date) - new Date()) / 86400000);
      var cls = days > 7 ? 'background:#ecfdf5;color:#065f46' : (days > 0 ? 'background:#fef3c7;color:#92400e' : 'background:#fef2f2;color:#991b1b');
      var html = '<div style="padding:14px;border-radius:12px;font-weight:700;' + cls + '">';
      html += '🏪 ' + sanitize(lic.shop_name || 'Shop') + '<br>';
      html += '📋 Plan: ' + lic.plan + '<br>';
      html += '📅 Expires: ' + new Date(lic.expiry_date).toLocaleDateString() + '<br>';
      html += '⏳ ' + days + ' days left';
      html += '</div>';
      html += '<div style="background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:8px;padding:12px;text-align:center;margin-top:10px;">';
      html += '<small style="font-size:10px;color:#64748b;font-weight:800;">🔑 YOUR SHOP ID</small><br>';
      html += '<span style="font-size:18px;font-weight:800;color:#2563eb;">' + getShopId() + '</span></div>';
      el.innerHTML = html;
    } else {
      try {
        const { data: shopRow } = await supabaseClient.from('shops').select('plan, trial_expires').eq('shop_id', getShopId()).maybeSingle();
        if (shopRow && shopRow.plan === 'trial') {
          var tdays = Math.ceil((new Date(shopRow.trial_expires) - new Date()) / 86400000);
          el.innerHTML = '<div style="padding:14px;border-radius:12px;background:#eff6ff;color:#1d4ed8;font-weight:700;">' +
            '🎁 Trial Plan<br>⏳ ' + (tdays > 0 ? tdays + ' days left' : 'EXPIRED — activate a plan') + '</div>';
        } else {
          el.innerHTML = '<div style="padding:14px;border-radius:12px;background:#f1f5f9;color:#64748b;">Free Plan — 15 products, 1 cashier</div>';
        }
      } catch(e2) {
        el.innerHTML = '<p style="color:#94a3b8;">No license found</p>';
      }
    }
  } catch(e) {
    el.innerHTML = '<p style="color:#94a3b8;">Could not load license.</p>';
  }
}

async function v4seActivateLicense() {
  var key = v4seG('liKey').toUpperCase();
  if (!key) { alert('Enter your license key.'); return; }
  try {
    const { data: lic, error } = await supabaseClient.from('licenses').select('*').eq('key', key).limit(1).maybeSingle();
    if (error) throw error;
    if (!lic) { alert('❌ Invalid key! Copy-paste the key exactly as provided.'); return; }
    if (lic.status !== 'active') { alert('❌ This license was revoked.'); return; }
    var days = Math.ceil((new Date(lic.expiry_date) - new Date()) / 86400000);
    if (days <= 0) { alert('❌ This license expired.'); return; }
    if (lic.shop_id !== getShopId()) {
      if (!await confirm('This key belongs to shop "' + (lic.shop_name || lic.shop_id) + '".\nSwitch this device to that shop?')) return;
      localStorage.setItem('shopId', lic.shop_id);
    }
    if (lic.business_type) {
      await supabaseClient.from('shops').update({ business_type: lic.business_type }).eq('shop_id', lic.shop_id);
    }
    localStorage.setItem('smartshop_license', JSON.stringify({
      plan: lic.plan, startDate: lic.start_date, expiryDate: lic.expiry_date,
      shopId: lic.shop_id, shopName: lic.shop_name || '',
      maxShops: Number(lic.max_shops) || 1, maxCashiersPerShop: Number(lic.max_cashiers_per_shop) || 2,
      maxProducts: Number(lic.max_products) || 999999
    }));
    try { await supabaseClient.from('licenses').update({ activated_at: new Date().toISOString() }).eq('id', lic.id); } catch(e) {}
    alert('✅ License activated!\n\n📋 Plan: ' + lic.plan + '\n📅 Expires: ' + new Date(lic.expiry_date).toLocaleDateString() + ' (' + days + ' days left)');
    await v4seLoadLicense();
    if (typeof ssApplyPlanVisibility === 'function') ssApplyPlanVisibility();
    else if (typeof v4lgApplySidebar === 'function') v4lgApplySidebar();
  } catch(e) { alert('❌ Activation failed: ' + e.message); }
}

async function v4seRemoveLicense() {
  var reason = await prompt('🗑️ Remove Licence & switch to free plan?\n\nWhy are you removing it?');
  if (reason === null) return;
  if (!await confirm('⚠️ You will lose: unlimited products, multiple cashiers, enterprise features.\n\nYour data will NOT be deleted.')) return;
  localStorage.removeItem('smartshop_license');
  alert('✅ Licence removed. You are on the free Starter plan.');
  await v4seLoadLicense();
  location.reload();
}

async function v4seContactProvider() {
  await loadSupportContactsUniversal();
  var s = window.SUPPORT;
  var old = document.getElementById('seSupportModal'); if (old) old.remove();
  var m = document.createElement('div');
  m.className = 'modal active'; m.id = 'seSupportModal';
  var html = '<div class="modal-content" style="text-align:center;">';
  if (s.whatsapp) html += '<a href="https://wa.me/' + s.whatsapp + '" target="_blank" style="display:block;background:#25D366;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:bold;margin-bottom:8px;">💬 WhatsApp: ' + s.phone + '</a>';
  if (s.email) html += '<a href="mailto:' + s.email + '" style="display:block;background:#ef4444;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:bold;margin-bottom:8px;">📧 ' + s.email + '</a>';
  html += '<button class="v4-btn o" onclick="document.getElementById(\'seSupportModal\').classList.remove(\'active\')">Close</button></div>';
  m.innerHTML = html;
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
}

// ── tab loaders ──
V4_TAB_LOADERS[13] = function() {
  v4seEnsureUI();
  v4seLoad();
};
V4_TAB_LOADERS[14] = function() {
  v4seEnsureLicenseUI();
  v4seLoadLicense();
};
