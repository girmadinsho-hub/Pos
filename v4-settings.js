// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — SETTINGS MODULE (tab13 + tab14)
//  Shop branding · Tax (TOT/VAT law) · POS features · QR
//  menu customizer · Tables · Calendar · Security · License
//  activation · Reset · Device lock. UI-3 throughout.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4se = {};

// ── helpers ──
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

  function cat(label) { return '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:14px 0 6px 0;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">' + label + '</div>'; }
  function row(id, label, val, type, ph) {
    type = type || 'text';
    return '<div style="margin-bottom:6px"><label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-bottom:2px;">' + label + '</label>' +
      '<input type="' + type + '" class="v4-in" id="' + id + '" value="' + (val === undefined || val === null ? '' : String(val).replace(/"/g, '&quot;')) + '" placeholder="' + (ph || '') + '" style="padding:9px 12px;font-size:13px"></div>';
  }
  function toggle(id, label, checked) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9">' +
      '<span style="font-size:13px">' + label + '</span>' +
      '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + ' style="width:22px;height:22px;cursor:pointer;"></div>';
  }

  tab.innerHTML =
    '<style>' +
    '.v4seBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;width:100%;}' +
    '.v4seBtn:active{transform:scale(.97);}' +
    '.v4seBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4seBtnTx{flex:1;min-width:0;}' +
    '.v4seBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4seBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '</style>' +

    '<div class="card" style="padding:14px;background:#eff6ff;border:2px solid #2563eb;">' +
    '<div class="card-title">🔑 Your Shop ID</div>' +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<div id="seShopIdDisplay" style="flex:1;font-size:20px;font-weight:800;color:#2563eb;word-break:break-all;">—</div>' +
    '<button class="v4-chip" onclick="v4seCopyShopId()">📋 Copy</button>' +
    '</div>' +
    '<p style="font-size:11px;color:#64748b;margin-top:6px;">Use this ID when connecting POS/Kitchen devices (or just sign in with your email — auto-detected).</p>' +
    '</div>' +

    '<div class="card">' +
    cat('🏪 Shop Identity & Branding') +
    row('seShopName', 'Shop Name', '', 'text', 'e.g., Sagure Hotel') +
    row('seShopPhone', 'Phone', '', 'text', '+251...') +
    row('seShopAddress', 'Address', '', 'text', 'City, area') +
    row('seCurrency', 'Currency Symbol', '', 'text', 'Br, $, €') +
    '<button class="v4-btn p" style="margin-top:6px" onclick="v4seSaveBranding()">💾 Save Branding</button>' +
    '</div>' +

    '<div class="card">' +
    cat('🏛️ Tax Configuration') +
    '<p style="font-size:11px;color:#64748b;margin-bottom:6px">🔒 Law: TOT shops cannot charge tax. Only VAT-registered shops can enable it.</p>' +
    '<select class="v4-in" id="seTaxType" onchange="v4seTaxTypeChange()" style="margin-bottom:6px">' +
    '<option value="TOT">TOT — Turnover Tax (small business)</option>' +
    '<option value="VAT">VAT — Value Added Tax (registered)</option>' +
    '</select>' +
    row('seTin', 'TIN (Tax Identification Number)', '', 'text', 'e.g., 0001234567') +
    row('seVat', 'VAT Registration Number', '', 'text', 'e.g., 600123456') +
    '<div style="display:grid;grid-template-columns:2fr 1fr;gap:6px">' +
    '<div>' + row('seTaxName', 'Tax Name (on receipts)', '', 'text', 'VAT') + '</div>' +
    '<div>' + row('seTaxRate', 'Rate %', '', 'number', '15') + '</div>' +
    '</div>' +
    toggle('seEnableTax', '🧾 Charge tax on POS sales', false) +
    '<button class="v4-btn p" style="margin-top:8px" onclick="v4seSaveTax()">💾 Save Tax Configuration</button>' +
    '</div>' +

    '<div class="card">' +
    cat('🔧 Shop Type & POS Features') +
    '<select class="v4-in" id="seShopType" style="margin-bottom:6px">' +
    '<option value="retail">🛒 Retail / Supermarket (Simple)</option>' +
    '<option value="cafe">☕ Cafe / Restaurant (Advanced)</option>' +
    '<option value="hotel">🏨 Hotel (Cafe + Rooms + Full Service)</option>' +
    '</select>' +
    '<select class="v4-in" id="seKotMode" style="margin-bottom:6px">' +
    '<option value="digital">🖥️ Digital only — Kitchen app on tablet (no paper)</option>' +
    '<option value="auto">🖨️ Print paper ticket — always</option>' +
    '<option value="ask">🤔 Ask waiter every order</option>' +
    '</select>' +
    toggle('seNegotiate', '✏️ Negotiate Price', true) +
    toggle('seBulk', '📦 Bulk Pricing', true) +
    toggle('seDiscount', '🏷️ Enable Discount', true) +
    '<button class="v4-btn p" style="margin-top:8px" onclick="v4seSavePos()">💾 Save POS Settings</button>' +
    '</div>' +

    '<div class="card">' +
    cat('📅 Calendar System') +
    '<select class="v4-in" id="seCalendar" onchange="v4seSaveCalendar()">' +
    '<option value="gregorian">Gregorian (Standard)</option>' +
    '<option value="ethiopian">Ethiopian (ቆጸራ)</option>' +
    '</select>' +
    '<p style="font-size:11px;color:#64748b;margin-top:6px;">Dates display in your chosen format across the entire app.</p>' +
    '</div>' +

    '<div class="card">' +
    cat('📱 Customer QR Menu Design') +
    row('seMenuWelcome', 'Welcome Message', '', 'text', 'Welcome to our cafe!') +
    row('seMenuPromo', 'Promotional Text', '', 'text', 'Try our new specials!') +
    row('seMenuVideo', 'Video URL (YouTube)', '', 'text', 'https://youtube.com/watch?v=...') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0">' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">🎨 Header Color</label><input type="color" class="v4-in" id="seMenuHeader" value="#1e3a8a" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">🌐 Background</label><input type="color" class="v4-in" id="seMenuBg" value="#f8fafc" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">🃏 Item Card</label><input type="color" class="v4-in" id="seMenuCard" value="#ffffff" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '<div><label style="font-size:10px;font-weight:700;color:#475569">💵 Price Color</label><input type="color" class="v4-in" id="seMenuPrice" value="#2563eb" style="height:40px;padding:4px;cursor:pointer"></div>' +
    '</div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569;display:block;margin-top:6px">🖼️ Banner Image</label>' +
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">' +
    '<input class="v4-in" id="seMenuBanner" placeholder="Paste image URL or upload" style="flex:1;padding:9px 12px;font-size:13px">' +
    '<button type="button" class="v4-chip" onclick="document.getElementById(\'seMenuBannerFile\').click()">📁 Upload</button>' +
    '</div>' +
    '<input type="file" id="seMenuBannerFile" accept="image/*" style="display:none" onchange="ssUploadProductImage(this, \'seMenuBanner\')">' +
    '<img id="seMenuBannerPreview" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;display:none;margin-bottom:6px">' +
    '<button class="v4-chip" id="seRemoveBanner" style="display:none;margin-bottom:6px" onclick="v4seRemoveBanner()">🗑️ Remove Image</button>' +
    '<button class="v4-btn p" onclick="v4seSaveMenu()">💾 Save Menu Design</button>' +
    '</div>' +

    '<div class="card">' +
    cat('🪑 Tables & QR Codes') +
    '<div id="seTableInputs"></div>' +
    '<div style="display:flex;gap:6px;margin-top:8px">' +
    '<button class="v4-chip" style="flex:1" onclick="v4seAddTableInput()">➕ Add Table</button>' +
    '<button class="v4-chip" style="flex:1" onclick="v4seSaveTables()">💾 Save Tables</button>' +
    '</div>' +
    '<button class="v4-btn p" style="margin-top:8px" onclick="v4seGenerateQR()">📱 Generate QR Codes</button>' +
    '<div id="seQRArea" style="text-align:center;margin-top:12px;display:none"></div>' +
    '</div>' +

    '<div class="card">' +
    cat('🔐 Account Security') +
    '<button class="v4-btn p" style="margin-bottom:6px" onclick="v4seChangePassword()">🔑 Change Password</button>' +
    '<button class="v4-btn p" style="background:#f59e0b" onclick="v4seChangePin()">🔢 Change App PIN</button>' +
    '</div>' +

    '<div class="card" style="border:2px solid #ef4444;">' +
    cat('🚨 Danger Zone') +
    '<p style="font-size:12px;color:#ef4444;font-weight:700;margin-bottom:8px">⚠️ These actions are permanent and cannot be undone.</p>' +
    '<button class="v4-btn" style="background:#dc2626;margin-bottom:6px" onclick="v4seSystemLock()">🔒 Lock All Staff Devices</button>' +
    '<button class="v4-btn" style="background:#7f1d1d" onclick="v4seResetShop()">🗑️ Delete ALL Shop Data</button>' +
    '</div>';
}

// ═══ LOAD & FILL ═══
async function v4seLoad() {
  await v4seLoadSettings();
  var d = v4se.data || {};
  var g = function(id, v) { var el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; };
  var c = function(id, v) { var el = document.getElementById(id); if (el) el.checked = !!v; };
  g('seShopIdDisplay', getShopId());
  g('seShopName', d.name); g('seShopPhone', d.phone); g('seShopAddress', d.address);
  g('seCurrency', d.currency || 'Br ');
  g('seTaxType', d.tax_type || 'TOT'); g('seTin', d.tin_number); g('seVat', d.vat_number);
  g('seTaxName', d.tax_name); g('seTaxRate', d.tax_rate);
  c('seEnableTax', d.enable_tax);
  g('seShopType', d.shop_type || 'retail'); g('seKotMode', d.kot_print_mode || 'digital');
  c('seNegotiate', d.negotiate_price !== false); c('seBulk', d.bulk_pricing !== false); c('seDiscount', d.enable_discount !== false);
  g('seCalendar', localStorage.getItem('calendarSystem') || 'gregorian');
  g('seMenuWelcome', d.welcome_msg); g('seMenuPromo', d.promo_text); g('seMenuVideo', d.video_url);
  g('seMenuHeader', d.header_color || '#1e3a8a'); g('seMenuBg', d.bg_color || '#f8fafc');
  g('seMenuCard', d.card_color || '#ffffff'); g('seMenuPrice', d.price_color || '#2563eb');
  if (d.banner_url) {
    g('seMenuBanner', d.banner_url);
    var pv = document.getElementById('seMenuBannerPreview');
    if (pv) { pv.src = d.banner_url; pv.style.display = 'block'; }
    var rb = document.getElementById('seRemoveBanner');
    if (rb) rb.style.display = 'inline-block';
  }
  v4seTaxTypeChange();
  v4seLoadTables();
}

// ═══ SAVE FUNCTIONS ═══
async function v4seSaveBranding() {
  var name = v4seG('seShopName');
  var currency = v4seG('seCurrency') || 'Br ';
  var payload = { shop_id: getShopId(), name: name, phone: v4seG('seShopPhone'),
    address: v4seG('seShopAddress'), currency: currency };
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id', returning: 'minimal' });
    if (error) throw error;
    localStorage.setItem('appCurrencySymbol', currency);
    if (typeof appCurrencySymbol !== 'undefined') appCurrencySymbol = currency;
    var ht = document.getElementById('headerTitle');
    if (ht && name) ht.textContent = name;
    alert('✅ Branding saved!');
  } catch(e) { alert('❌ ' + e.message); }
}

function v4seTaxTypeChange() {
  var type = v4seG('seTaxType');
  var taxSection = document.getElementById('seEnableTax');
  if (taxSection && type === 'TOT') {
    taxSection.checked = false;
    taxSection.disabled = true;
    taxSection.parentElement.style.opacity = '.5';
  } else if (taxSection) {
    taxSection.disabled = false;
    taxSection.parentElement.style.opacity = '1';
  }
}

async function v4seSaveTax() {
  var type = v4seG('seTaxType');
  var isVat = type === 'VAT';
  var payload = { shop_id: getShopId(), tax_type: type,
    tin_number: v4seG('seTin'), vat_number: v4seG('seVat'),
    enable_tax: isVat && v4seC('seEnableTax'),
    tax_name: isVat ? (v4seG('seTaxName') || 'VAT') : 'TOT',
    tax_rate: isVat ? v4seN('seTaxRate') : 0 };
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id', returning: 'minimal' });
    if (error) throw error;
    alert('✅ Tax saved!' + (isVat ? '\nVAT ' + payload.tax_rate + '% — POS will charge it.' : '\nTOT shop: tax stays OFF (law).'));
  } catch(e) { alert('❌ ' + e.message); }
}

async function v4seSavePos() {
  var payload = { shop_id: getShopId(),
    shop_type: v4seG('seShopType') === 'hotel' ? 'cafe' : v4seG('seShopType'),
    kot_print_mode: v4seG('seKotMode'),
    negotiate_price: v4seC('seNegotiate'), bulk_pricing: v4seC('seBulk'),
    enable_discount: v4seC('seDiscount') };
  try {
    const { error } = await supabaseClient.from('settings').upsert(payload, { onConflict: 'shop_id', returning: 'minimal' });
    if (error) throw error;
    // sync business type
    var bizType = v4seG('seShopType') === 'hotel' ? 'hotel' : v4seG('seShopType');
    await supabaseClient.from('shops').update({ business_type: bizType }).eq('shop_id', getShopId());
    alert('✅ POS settings saved!\nShop type: ' + bizType);
    if (typeof ssApplyPlanVisibility === 'function') ssApplyPlanVisibility();
    else if (typeof applyPlanVisibility === 'function') applyPlanVisibility();
  } catch(e) { alert('❌ ' + e.message); }
}

async function v4seSaveCalendar() {
  var cal = v4seG('seCalendar');
  localStorage.setItem('calendarSystem', cal);
  try {
    await supabaseClient.from('settings').update({ calendar_system: cal }).eq('shop_id', getShopId());
  } catch(e) {}
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
    alert('✅ Menu design saved permanently!');
  } catch(e) { alert('❌ ' + e.message); }
}
function v4seRemoveBanner() {
  var pv = document.getElementById('seMenuBannerPreview');
  if (pv) { pv.style.display = 'none'; pv.src = ''; }
  var b = document.getElementById('seMenuBanner');
  if (b) b.value = '';
  var rb = document.getElementById('seRemoveBanner');
  if (rb) rb.style.display = 'none';
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
    box.innerHTML = '<p style="font-size:12px;color:#94a3b8;">No tables yet. Tap "Add Table".</p>';
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
    alert('✅ Tables saved permanently!');
  } catch(e) { alert('❌ ' + e.message); }
}
function v4seGenerateQR() {
  if (!v4seTables.length) { alert('Add tables first.'); return; }
  var area = document.getElementById('seQRArea');
  var path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  var baseURL = window.location.origin + path + 'menu.html';
  var html = '<h4 style="margin-bottom:10px;">Scan to Order</h4>';
  v4seTables.forEach(function(t) {
    var url = baseURL + '?shop=' + getShopId() + '&table=' + encodeURIComponent(t.trim());
    var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
    html += '<div style="margin-bottom:16px;padding:10px;border:1px dashed #cbd5e1;border-radius:8px;display:inline-block;width:45%;vertical-align:top;">' +
      '<b style="display:block;margin-bottom:5px;">' + t.trim() + '</b>' +
      '<img src="' + qrApi + '" style="width:120px;height:120px;">' +
      '<br><a href="' + url + '" target="_blank" style="font-size:9px;color:#2563eb;word-break:break-all;">Open Menu</a></div>';
  });
  area.innerHTML = html;
  area.style.display = 'block';
}

// ═══ SECURITY ═══
async function v4seChangePassword() {
  var newPass = await prompt('Enter your NEW password (min 6 chars):');
  if (!newPass || newPass.length < 6) { alert('Password too short.'); return; }
  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });
    if (error) throw error;
    alert('✅ Password changed successfully!');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4seChangePin() {
  var oldPin = await prompt('Enter your CURRENT 4-digit PIN:');
  if (sha256(oldPin) !== localStorage.getItem('appPinHash')) { alert('❌ Incorrect PIN.'); return; }
  var newPin = await prompt('Enter your NEW 4-digit PIN:');
  if (newPin && newPin.length === 4) {
    localStorage.setItem('appPinHash', sha256(newPin));
    alert('✅ PIN changed!');
  } else { alert('PIN must be exactly 4 digits.'); }
}

async function v4seSystemLock() {
  if (!await confirm('🔒 Lock ALL staff devices NOW?\nEvery POS, Kitchen, and Hotel terminal will be disabled instantly.')) return;
  try {
    const { error } = await supabaseClient.from('settings').upsert({ shop_id: getShopId(), system_locked: true }, { onConflict: 'shop_id' });
    if (error) throw error;
    alert('🔒 All devices locked!');
  } catch(e) { alert('❌ ' + e.message); }
}

async function v4seResetShop() {
  var email = await prompt('⚠️ DELETE ALL DATA PERMANENTLY.\n\nEnter your email to confirm:');
  if (!email) return;
  if (!await confirm('🚨 FINAL WARNING: This deletes EVERYTHING. Cannot be undone.')) return;
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
  } else {
    alert('Shop ID: ' + sid);
  }
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
    // DB-first license (the truth)
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
      html += '<span style="font-size:18px;font-weight:800;color:#2563eb;">' + getShopId() + '</span>';
      html += '</div>';
      el.innerHTML = html;
    } else {
      // trial or free
      try {
        const { data: shopRow } = await supabaseClient.from('shops').select('plan, trial_expires').eq('shop_id', getShopId()).maybeSingle();
        if (shopRow && shopRow.plan === 'trial') {
          var tdays = Math.ceil((new Date(shopRow.trial_expires) - new Date()) / 86400000);
          el.innerHTML = '<div style="padding:14px;border-radius:12px;background:#eff6ff;color:#1d4ed8;font-weight:700;">' +
            '🎁 Trial Plan<br>⏳ ' + (tdays > 0 ? tdays + ' days left' : 'EXPIRED') + '</div>';
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
    if (lic.status !== 'active') { alert('❌ This license was revoked. Contact your provider.'); return; }
    var days = Math.ceil((new Date(lic.expiry_date) - new Date()) / 86400000);
    if (days <= 0) { alert('❌ This license expired. Contact your provider.'); return; }
    if (lic.shop_id !== getShopId()) {
      if (!await confirm('This key belongs to shop "' + (lic.shop_name || lic.shop_id) + '".\nSwitch this device to that shop?')) return;
      localStorage.setItem('shopId', lic.shop_id);
    }
    if (lic.business_type) {
      await supabaseClient.from('shops').update({ business_type: lic.business_type }).eq('shop_id', lic.shop_id);
    }
    // save locally
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
    else if (typeof applyPlanVisibility === 'function') applyPlanVisibility();
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
