// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — STOCK MODULE 180% · UI-2 (Step 5)
//  Design: Health strip (4 tappable numbers) + Big button
//  grid (grouped: Daily Actions / Shop Tools / Insights)
//  + All Stock table. Every analysis opens as a modal —
//  one screen, zero scroll-mountains, fast tab open.
//  Laws: one home (data=v4products) · bounded queries ·
//  both themes · self-injecting UI · no cross-file edits.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4st = { view:'excel', lowOnly:false, sort:'critical', q:'', cat:'', status:'', _vel:null, _abc:null };

// ── row helpers ──
function v4stStatus(p) {
  var limit = p.reorderLevel || 5, s = p.stock || 0;
  if (s === 0) return { t:'OUT', c:'#ef4444' };
  if (s <= limit) return { t:'LOW', c:'#f97316' };
  return { t:'OK', c:'#10b981' };
}
function v4stExpiry(p) {
  if (!p.expiryDate) return null;
  var d = new Date(p.expiryDate); if (isNaN(d.getTime())) return null;
  return { date: p.expiryDate, days: Math.ceil((d - new Date()) / 86400000) };
}

// ── velocity (bounded) ──
function v4stVelocity() {
  var cache = (typeof SS_PERF !== 'undefined' && SS_PERF.detailedCache) ? SS_PERF.detailedCache : [];
  if (!cache || cache.length < 8) return null;
  var newest = new Date(cache[0].time).getTime();
  var oldest = new Date(cache[cache.length - 1].time).getTime();
  var days = (newest - oldest) / 86400000;
  if (days < 0.5) days = 0.5;
  var qty = {};
  cache.forEach(function(s){
    (s.items || []).forEach(function(i){ qty[i.name] = (qty[i.name] || 0) + (i.qty || 0); });
  });
  var perName = {};
  Object.keys(qty).forEach(function(n){ perName[n] = qty[n] / days; });
  return { days: days, perName: perName };
}
function v4stCover(p, vel) {
  if (!vel || !vel.perName) return null;
  var v = vel.perName[p.name];
  if (!v || v <= 0) return null;
  return (p.stock || 0) / v;
}

// ── ABC analysis ──
function v4stABC() {
  var items = v4products.filter(function(p){ return !p.isVirtual && (p.stock||0) > 0; })
    .map(function(p){ return { id:p.id, v:(p.stock||0)*(p.costPrice||0) }; })
    .sort(function(a,b){ return b.v - a.v; });
  var total = items.reduce(function(s,i){ return s + i.v; }, 0);
  var cls = {}, cum = 0;
  items.forEach(function(it){
    if (total <= 0) { cls[it.id] = 'C'; return; }
    cum += it.v;
    var share = cum / total;
    cls[it.id] = share <= 0.80 ? 'A' : (share <= 0.95 ? 'B' : 'C');
  });
  return cls;
}
function v4stAbcBadge(i, html) {
  var c = (v4st._abc || {})[i.id];
  if (!html) return c || '';
  if (!c) return '<span style="color:#94a3b8">—</span>';
  var m = { A:['#10b981','rgba(16,185,129,.15)'], B:['#3b82f6','rgba(59,130,246,.15)'], C:['#94a3b8','rgba(148,163,184,.15)'] }[c];
  return '<b style="color:' + m[0] + ';background:' + m[1] + ';padding:2px 7px;border-radius:6px;font-size:10px">' + c + '</b>';
}

// ── sleeping stock ──
function v4stDead() {
  var vel = v4st._vel;
  if (!vel || !vel.perName) return { rows:[], value:0 };
  var rows = [];
  v4products.forEach(function(p){
    if (p.isVirtual) return;
    if ((p.stock||0) <= 0) return;
    if (vel.perName[p.name]) return;
    var v = (p.stock||0)*(p.costPrice||0);
    if (v <= 0) return;
    rows.push({ p:p, value:v });
  });
  rows.sort(function(a,b){ return b.value - a.value; });
  return { rows:rows, value: rows.reduce(function(s,r){ return s + r.value; }, 0) };
}

// ── filters + sorts ──
function v4stRows() {
  var q = (v4st.q || '').toLowerCase();
  var rows = v4products.filter(function(p){
    if (p.isVirtual) return false;
    if (q && p.name.toLowerCase().indexOf(q) === -1 &&
        !(p.barcode && p.barcode.toLowerCase().indexOf(q) !== -1)) return false;
    if (v4st.cat && (p.category || 'General') !== v4st.cat) return false;
    if (v4st.status && v4stStatus(p).t !== v4st.status) return false;
    if (v4st.lowOnly && (p.stock||0) > (p.reorderLevel||5)) return false;
    return true;
  });
  if (v4st.sort === 'critical') rows.sort(function(a,b){ return (a.stock/(a.reorderLevel||5)) - (b.stock/(b.reorderLevel||5)); });
  else if (v4st.sort === 'name') rows.sort(function(a,b){ return a.name.localeCompare(b.name); });
  else if (v4st.sort === 'value') rows.sort(function(a,b){ return ((b.stock||0)*(b.costPrice||0)) - ((a.stock||0)*(a.costPrice||0)); });
  else if (v4st.sort === 'expiry') rows.sort(function(a,b){
      var ea = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      var eb = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return ea - eb;
    });
  else if (v4st.sort === 'cover') rows.sort(function(a,b){
      var ca = v4stCover(a, v4st._vel), cb = v4stCover(b, v4st._vel);
      if (ca === null && cb === null) return 0;
      if (ca === null) return 1;
      if (cb === null) return -1;
      return ca - cb;
    });
  else if (v4st.sort === 'abc') {
    var cls = v4st._abc || {}, rank = { A:0, B:1, C:2 };
    rows.sort(function(a,b){
      var ra = cls[a.id] !== undefined ? rank[cls[a.id]] : 3;
      var rb = cls[b.id] !== undefined ? rank[cls[b.id]] : 3;
      if (ra !== rb) return ra - rb;
      return ((b.stock||0)*(b.costPrice||0)) - ((a.stock||0)*(a.costPrice||0));
    });
  }
  return rows;
}

// ═══ UI: HEALTH STRIP + BIG BUTTONS + TABLE ═══
function v4stEnsureUI() {
  var tab = document.getElementById('tab3');
  if (!tab || tab.dataset.stBuilt === '1') return;
  tab.dataset.stBuilt = '1';

  function btn(icon, title, desc, bg, fn, big) {
    return '<button class="v4stBtn" style="background:' + bg + ';' + (big ? 'grid-column:1/-1;' : '') + '" onclick="' + fn + '">' +
      '<span class="v4stBtnIc">' + icon + '</span>' +
      '<span class="v4stBtnTx"><b>' + title + '</b><small>' + desc + '</small></span>' +
      '<span class="v4stBtnGo">›</span></button>';
  }
  function group(label) {
    return '<div class="v4stGroupLbl">' + label + '</div>';
  }

  tab.innerHTML =
    '<style>' +
    '.v4stBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4stBtn:active{transform:scale(.97);}' +
    '.v4stBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4stBtnTx{flex:1;min-width:0;}' +
    '.v4stBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4stBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4stBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4stGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;}' +
    '.v4stGroupLbl{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:10px 0 6px;}' +
    'body.dark .v4stGroupLbl{color:#94a3b8;}' +
    '.v4stH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;transition:transform .15s;}' +
    '.v4stH:active{transform:scale(.96);}' +
    '.v4stH b{font-size:16px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.v4stH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4stH small{color:#94a3b8;}' +
    '</style>' +

    // 1️⃣ HEALTH STRIP — 4 tappable numbers
    '<div class="card" style="padding:12px" id="v4stHealth"></div>' +

    // 2️⃣ BIG BUTTON GRID
    '<div class="card" style="padding:12px">' +
      group('🔴 Daily Actions') +
      '<div class="v4stGrid">' +
        btn('🧠','Smart Restock','What to order today — from your sales speed','linear-gradient(135deg,#dc2626,#f87171)','v4stRestock()') +
        btn('🚨','Stock Alerts','Low & finished items — need attention now','linear-gradient(135deg,#ea580c,#fb923c)','v4stOpen(\'alerts\')') +
        btn('📅','Expiry Manager','Items expiring — remove or discount in time','linear-gradient(135deg,#d97706,#fbbf24)','v4stOpen(\'expiry\')') +
      '</div>' +
      group('🟣 Shop Tools') +
      '<div class="v4stGrid">' +
        btn('🧮','Stock Count','Count real stock — system fixes the rest','linear-gradient(135deg,#7c3aed,#a78bfa)','v4OpenStockCount()') +
        btn('🚚','Transfer','Move stock to another branch','linear-gradient(135deg,#0d64f0,#60a5fa)','v4OpenTransfer()') +
      '</div>' +
      group('📊 Insights — know your money') +
      '<div class="v4stGrid">' +
        btn('💰','Stock Value','How much money sits on your shelves','linear-gradient(135deg,#059669,#34d399)','v4stOpen(\'val\')') +
        btn('📆','This Month','In · Out · Lost — this month only','linear-gradient(135deg,#0284c7,#38bdf8)','v4stOpen(\'month\')') +
        btn('🧠','A B C Items','Your most valuable items, ranked','linear-gradient(135deg,#6d28d9,#8b5cf6)','v4stOpen(\'abc\')') +
        btn('💤','Sleeping Stock','Stock that never sells — money frozen','linear-gradient(135deg,#475569,#64748b)','v4stOpen(\'dead\')') +
      '</div>' +
    '</div>' +

    // 3️⃣ ALL STOCK TABLE
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">📊 All Stock <span class="v4-badge" id="v4stCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip active" id="v4stvExcel" onclick="v4stView(\'excel\')">📊 Excel</button>' +
          '<button class="v4-chip" id="v4stvList" onclick="v4stView(\'list\')">📋 List</button>' +
          '<button class="v4-chip" id="v4stvGrid" onclick="v4stView(\'grid\')">⊞ Grid</button>' +
          '<button class="v4-chip" id="v4stLow" onclick="v4stToggleLow()">🚨 Low</button>' +
          '<button class="v4-chip" onclick="v4stPrint()" title="Print report">🖨️</button>' +
          '<button class="v4-chip" onclick="v4stCSV()" title="Export CSV">📄⬇</button>' +
          '<button class="v4-chip" onclick="v4stRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;margin-bottom:8px">' +
        '<button class="v4-chip" style="flex:0 0 auto;height:34px" onclick="v4stScan()" title="Scan barcode to find item">📷</button>' +
        '<input class="v4-in" id="v4stSearch" placeholder="🔍 Name / barcode…" style="flex:2;min-width:110px;max-width:170px;padding:7px 10px;margin:0;font-size:12px;height:34px;box-sizing:border-box" oninput="v4stSearchInput(this.value)">' +
        '<select class="v4-in" id="v4stCat" style="flex:0 0 auto;width:auto;max-width:130px;padding:7px 6px;margin:0;font-size:12px;height:34px" onchange="v4stSetCat(this.value)"><option value="">All Categories</option></select>' +
        '<select class="v4-in" id="v4stStatus" style="flex:0 0 auto;width:auto;max-width:110px;padding:7px 6px;margin:0;font-size:12px;height:34px" onchange="v4stSetStatus(this.value)">' +
          '<option value="">All Status</option><option value="OUT">⛔ Out</option><option value="LOW">⚠️ Low</option><option value="OK">✅ OK</option>' +
        '</select>' +
        '<select class="v4-in" id="v4stSort" style="flex:0 0 auto;width:auto;max-width:150px;padding:7px 6px;margin:0;font-size:12px;height:34px" onchange="v4stSetSort(this.value)">' +
          '<option value="critical">🚨 Critical first</option><option value="name">A-Z</option><option value="value">💰 Value ↓</option><option value="expiry">📅 Expiring soon</option><option value="cover">⏳ Cover lowest</option><option value="abc">🧠 ABC (A first)</option>' +
        '</select>' +
      '</div>' +
      '<div id="v4stExcel"></div>' +
      '<div id="v4stList" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
      '<div id="v4stGrid" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
    '</div>';
}

// ── HEALTH STRIP (fast, local, tappable) ──
function v4stHealth() {
  var el = document.getElementById('v4stHealth'); if (!el) return;
  var all = v4products.filter(function(p){ return !p.isVirtual; });
  var low = 0, out = 0, value = 0, exp = 0;
  all.forEach(function(p){
    value += (p.stock||0) * (p.costPrice||0);
    if ((p.stock||0) === 0) out++;
    else if ((p.stock||0) <= (p.reorderLevel||5)) low++;
    var e = v4stExpiry(p);
    if (e && e.days <= 7) exp++;
  });
  var need = low + out;
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    '<div class="v4stH" onclick="v4stOpen(\'alerts\')">' +
      (need > 0 ? '<b style="color:#ef4444">🚨 ' + need + '</b>' : '<b style="color:#10b981">✅ 0</b>') +
      '<small>NEED ATTENTION</small></div>' +
    '<div class="v4stH" onclick="v4stOpen(\'val\')"><b style="color:#10b981">💰 ' + fmtMoney(value) + '</b><small>STOCK VALUE</small></div>' +
    '<div class="v4stH" onclick="v4stOpen(\'abc\')"><b style="color:#3b82f6">📦 ' + all.length + '</b><small>ITEMS</small></div>' +
    '<div class="v4stH" onclick="v4stOpen(\'expiry\')">' +
      (exp > 0 ? '<b style="color:#f97316">📅 ' + exp + '</b>' : '<b style="color:#94a3b8">📅 —</b>') +
      '<small>EXPIRING ≤7D</small></div>' +
    '</div>';
}

// ═══ MODAL SYSTEM (own closer — safe) ═══
function v4stModal(title) {
  v4stCloseModal();
  var m = document.createElement('div');
  m.id = 'v4stToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4stCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4stToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4stCloseModal(); });
}
function v4stCloseModal() {
  var m = document.getElementById('v4stToolModal');
  if (m) m.remove();
}

// ═══ CARD BUILDERS (return HTML strings) ═══
function v4stValuationHTML() {
  var cost = 0, retail = 0, units = 0;
  v4products.forEach(function(p){
    if (p.isVirtual) return;
    var s = p.stock || 0; if (s <= 0) return;
    units += s; cost += s * (p.costPrice || 0); retail += s * (p.price || 0);
  });
  function big(v, l, c) {
    return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:14px 6px;text-align:center">' +
      '<b style="font-size:18px;display:block;color:' + c + '">' + v + '</b>' +
      '<small style="font-size:10px;font-weight:800;color:#64748b">' + l + '</small></div>';
  }
  return '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
    big(fmtMoney(cost), '💰 COST VALUE (what you paid)', '#3b82f6') +
    big(fmtMoney(retail), '🏷️ RETAIL VALUE (if all sold)', '#10b981') +
    big(fmtMoney(retail - cost), '📈 POTENTIAL PROFIT', '#8b5cf6') +
    big(units, '📦 UNITS IN STOCK', '#64748b') +
    '</div>' +
    '<p style="font-size:11px;color:#64748b;text-align:center;margin-top:10px">If you sold every item today, you would collect ' + fmtMoney(retail) + '.</p>';
}

function v4stAlertsHTML() {
  var all = v4products.filter(function(p){ return !p.isVirtual; });
  var out = [], low = [];
  all.forEach(function(p){
    if ((p.stock||0) === 0) out.push(p);
    else if ((p.stock||0) <= (p.reorderLevel||5)) low.push(p);
  });
  var html = '';
  if (!out.length && !low.length) {
    return '<p style="text-align:center;padding:26px;font-weight:800;color:#10b981;font-size:16px">✅ All stock levels are healthy!<br><small style="font-weight:400;color:#64748b">Nothing needs your attention today.</small></p>';
  }
  if (out.length) {
    html += '<b style="color:#ef4444;font-size:13px">⛔ FINISHED — reorder now (' + out.length + ')</b>';
    out.forEach(function(p){
      html += '<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px">⛔ <b>' + sanitize(p.name) + '</b> — completely finished!</div>';
    });
    html += '<div style="height:10px"></div>';
  }
  if (low.length) {
    html += '<b style="color:#f97316;font-size:13px">⚠️ RUNNING LOW (' + low.length + ')</b>';
    low.forEach(function(p){
      var suggest = (p.reorderLevel||5) * 2;
      html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px">' +
        '<span>⚠️ <b>' + sanitize(p.name) + '</b> — order ~' + suggest + ' ' + (p.unit||'') + '</span>' +
        '<b style="color:#f97316">' + p.stock + ' left</b></div>';
    });
  }
  html += '<button class="v4-btn g" style="margin-top:12px" onclick="v4stCloseModal();v4stRestock()">🧠 Open Smart Restock</button>';
  return html;
}

function v4stExpiryHTML() {
  var buckets = { expired:[], d7:[], d30:[], d90:[] };
  v4products.forEach(function(p){
    if (p.isVirtual) return;
    var e = v4stExpiry(p); if (!e) return;
    if (e.days < 0) buckets.expired.push({ p:p, e:e });
    else if (e.days <= 7) buckets.d7.push({ p:p, e:e });
    else if (e.days <= 30) buckets.d30.push({ p:p, e:e });
    else if (e.days <= 90) buckets.d90.push({ p:p, e:e });
  });
  var total = buckets.expired.length + buckets.d7.length + buckets.d30.length + buckets.d90.length;
  if (!total) return '<p style="text-align:center;padding:26px;color:#64748b;font-size:14px">No expiry dates tracked.<br><small>Add an expiry date on products to unlock this tool.</small></p>';
  function bucket(arr, title, color, icon, allowLoss) {
    if (!arr.length) return '';
    var h = '<div style="margin-top:10px;border-left:3px solid ' + color + ';padding:6px 10px;background:rgba(148,163,184,.08);border-radius:8px">' +
      '<b style="color:' + color + ';font-size:12px">' + icon + ' ' + title + ' (' + arr.length + ')</b>';
    arr.sort(function(a,b){ return a.e.days - b.e.days; });
    arr.forEach(function(x){
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(148,163,184,.15);font-size:12px">' +
        '<span>' + sanitize(x.p.name) + ' <small style="color:#64748b">(' + (x.p.stock||0) + ' ' + (x.p.unit||'') + ')</small></span>' +
        '<span style="display:flex;gap:6px;align-items:center">' +
        (x.e.days < 0 ? '<b style="color:#ef4444">' + Math.abs(x.e.days) + 'd ago</b>' : '<b style="color:' + color + '">' + x.e.days + 'd</b>') +
        (allowLoss && (x.p.stock||0) > 0 ? '<button class="btn-mini" style="background:#ef4444;color:#fff" onclick="v4stExpireLoss(\'' + x.p.id + '\')">🗑️ Remove</button>' : '') +
        '</span></div>';
    });
    return h + '</div>';
  }
  return bucket(buckets.expired, 'EXPIRED — remove now', '#ef4444', '🚨', true) +
    bucket(buckets.d7, 'This week — discount fast', '#f97316', '⚠️', false) +
    bucket(buckets.d30, 'This month', '#f59e0b', '📅', false) +
    bucket(buckets.d90, 'Next 3 months', '#94a3b8', '👁️', false);
}

function v4stAbcHTML() {
  var cls = v4st._abc || {};
  var counts = { A:0, B:0, C:0 }, values = { A:0, B:0, C:0 };
  v4products.forEach(function(p){
    if (p.isVirtual) return;
    var c = cls[p.id]; if (!c) return;
    counts[c]++; values[c] += (p.stock||0)*(p.costPrice||0);
  });
  function row(k, color, name, desc) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(148,163,184,.08);border-radius:10px;margin-bottom:8px">' +
      '<b style="width:34px;height:34px;border-radius:8px;background:' + color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + k + '</b>' +
      '<div style="flex:1"><b style="font-size:13px">' + name + ' — ' + counts[k] + ' items · ' + fmtMoney(values[k]) + '</b>' +
      '<br><small style="font-size:10.5px;color:#64748b">' + desc + '</small></div></div>';
  }
  return row('A', '#10b981', 'Most valuable', 'These few items hold most of your money — count them often, never run out.') +
    row('B', '#3b82f6', 'Medium value', 'Normal items — check them weekly.') +
    row('C', '#94a3b8', 'Small value', 'Many cheap items — check monthly is enough.') +
    '<p style="font-size:11px;color:#64748b;text-align:center">Based on total stock value. See the ABC column in the table below.</p>';
}

function v4stDeadHTML() {
  var d = v4stDead();
  if (!d.rows.length) {
    return '<p style="text-align:center;padding:26px;font-weight:800;color:#10b981;font-size:15px">✅ No sleeping stock!<br><small style="font-weight:400;color:#64748b">Everything with value is selling. (Or not enough sales data yet.)</small></p>';
  }
  var html = '<div style="text-align:center;background:rgba(245,158,11,.12);border-radius:12px;padding:12px;margin-bottom:10px">' +
    '<b style="color:#f59e0b;font-size:18px">' + fmtMoney(d.value) + '</b><br><small style="font-size:11px;color:#64748b;font-weight:700">FROZEN IN ' + d.rows.length + ' NON-SELLING ITEMS</small></div>' +
    '<p style="font-size:11px;color:#64748b">These have stock but no recent sales. Try discounts, bundles, or featuring them.</p>';
  d.rows.slice(0, 15).forEach(function(r){
    html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
      '<span>💤 ' + sanitize(r.p.name) + ' <small style="color:#64748b">(' + r.p.stock + ' ' + (r.p.unit||'') + ')</small></span>' +
      '<b style="color:#f59e0b">' + fmtMoney(r.value) + '</b></div>';
  });
  if (d.rows.length > 15) html += '<div style="text-align:center;font-size:11px;color:#94a3b8;padding:6px">+' + (d.rows.length - 15) + ' more…</div>';
  return html;
}

async function v4stMonthHTML() {
  var body = document.getElementById('v4stToolBody');
  if (!body) return;
  try {
    var now = new Date();
    var mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    var mDay = mStart.slice(0,10);
    var rec = 0, lost = 0, sold = 0;
    try { const { data: pur } = await supabaseClient.from('purchases').select('qty,cost_per_unit').eq('shop_id', getShopId()).gte('date', mDay).limit(500); (pur||[]).forEach(function(x){ rec += (x.qty||0)*(x.cost_per_unit||0); }); } catch(e) {}
    try { const { data: los } = await supabaseClient.from('losses').select('total_loss').eq('shop_id', getShopId()).gte('time', mStart).limit(300); (los||[]).forEach(function(x){ lost += x.total_loss||0; }); } catch(e) {}
    try { if (typeof v4EnsureDaily === 'function') await v4EnsureDaily(); } catch(e) {}
    var key = mStart.slice(0,7);
    (window._ssDailyAll || []).forEach(function(d){ if (String(d.date).slice(0,7) === key) sold += d.total||0; });
    function big(v, l, c) {
      return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:14px 6px;text-align:center">' +
        '<b style="font-size:17px;display:block;color:' + c + '">' + v + '</b>' +
        '<small style="font-size:10px;font-weight:800;color:#64748b">' + l + '</small></div>';
    }
    body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
      big(fmtMoney(rec), '📥 STOCK BOUGHT IN', '#3b82f6') +
      big(fmtMoney(sold), '📤 SOLD (revenue)', '#10b981') +
      big(fmtMoney(lost), '🗑️ LOST / EXPIRED', '#ef4444') +
      '</div>' +
      '<p style="font-size:11px;color:#64748b;text-align:center;margin-top:10px">' + new Date().toLocaleDateString(undefined,{month:'long', year:'numeric'}) + ' so far</p>';
  } catch(e) {
    body.innerHTML = '<p style="color:#ef4444;text-align:center;padding:14px">Could not load: ' + sanitize(e.message) + '</p>';
  }
}

// ═══ MODAL OPENER ═══
function v4stOpen(tool) {
  if (tool === 'alerts') { v4stModal('🚨 Stock Alerts'); document.getElementById('v4stToolBody').innerHTML = v4stAlertsHTML(); }
  else if (tool === 'expiry') { v4stModal('📅 Expiry Manager'); document.getElementById('v4stToolBody').innerHTML = v4stExpiryHTML(); }
  else if (tool === 'val') { v4stModal('💰 Stock Value'); document.getElementById('v4stToolBody').innerHTML = v4stValuationHTML(); }
  else if (tool === 'abc') { v4stModal('🧠 ABC — Your Most Valuable Items'); document.getElementById('v4stToolBody').innerHTML = v4stAbcHTML(); }
  else if (tool === 'dead') { v4stModal('💤 Sleeping Stock'); document.getElementById('v4stToolBody').innerHTML = v4stDeadHTML(); }
  else if (tool === 'month') { v4stModal('📆 This Month'); document.getElementById('v4stToolBody').innerHTML = '<p style="text-align:center;color:#64748b;padding:14px">Loading…</p>'; v4stMonthHTML(); }
}

// ── one-tap expired removal ──
async function v4stExpireLoss(pid) {
  var p = v4products.find(function(x){ return x.id === pid; });
  if (!p) return;
  var qty = p.stock || 0;
  if (qty <= 0) { alert('"' + p.name + '" has no stock to remove.'); return; }
  if (!await confirm('🗑️ Remove EXPIRED stock?\n\n' + p.name + ' — ' + qty + ' ' + (p.unit||'') +
      '\nLoss value: ' + fmtMoney(qty * (p.costPrice||0)) +
      '\n\nStock goes to 0 and a loss is recorded.')) return;
  try {
    const { error: lErr } = await supabaseClient.from('losses').insert([{
      firebase_id: 'loss_' + Date.now(),
      shop_id: getShopId(), product_id: p.id, product_name: p.name,
      quantity: qty, reason: 'Expired', total_loss: qty * (p.costPrice||0),
      time: new Date().toISOString()
    }]);
    if (lErr) throw lErr;
    const { error: pErr } = await v4ById(supabaseClient.from('products').update({ stock: 0 }), p.id);
    if (pErr) throw pErr;
    p.stock = 0;
    v4stCloseModal();
    v4stRender();
    alert('✅ Expired stock removed and logged as loss (' + fmtMoney(qty * (p.costPrice||0)) + ').');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── EXCEL TABLE ──
function v4stTable(rows) {
  var ex = document.getElementById('v4stExcel'); if (!ex) return;
  if (!rows.length) {
    var filtering = v4st.q || v4st.cat || v4st.status || v4st.lowOnly;
    ex.innerHTML = '<div class="placeholder">' +
      (filtering ? 'No products match the current filters.<br><button class="v4-chip" style="margin-top:8px" onclick="v4stClearFilters()">✖ Clear filters</button>'
                 : 'No countable products yet — add products first.') + '</div>';
    window.v4stockTable = null;
    return;
  }
  var alive = ex.querySelector('.modern-sheet-table');
  if (!window.v4stockTable || !alive) {
    ex.innerHTML = '';
    window.v4stockTable = new ModernSheet('v4stExcel', { data: rows, columns: [
      { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
      { title:'Product', field:'name', width:'170px', render:function(i,h){ return h?'<b>'+sanitize(i.name)+'</b>':i.name; } },
      { title:'ABC', width:'48px', align:'center', render:function(i,h){ return v4stAbcBadge(i, h); }, filterable:false },
      { title:'Stock', width:'64px', align:'center', render:function(i,h){ var c=v4stStatus(i).c; return h?'<b style="color:'+c+'">'+i.stock+'</b>':i.stock; },
        total:true, totalValue:function(i){ return i.stock||0; }, totalFormat:function(s){ return s+' units'; } },
      { title:'Unit', field:'unit', width:'66px' },
      { title:'Limit', width:'52px', align:'center', render:function(i){ return i.reorderLevel||5; } },
      { title:'Status', width:'70px', render:function(i,h){ var s=v4stStatus(i); return h?'<span style="color:'+s.c+';font-weight:800">'+s.t+'</span>':s.t; }, filterable:true },
      { title:'Cost', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.costPrice):i.costPrice; } },
      { title:'Value', width:'94px', align:'right', render:function(i,h){ var v=(i.stock||0)*(i.costPrice||0); return h?fmtMoney(v):v; },
        total:true, totalValue:function(i){ return (i.stock||0)*(i.costPrice||0); }, totalFormat:function(s){ return fmtMoney(s); } },
      { title:'Sold', width:'54px', align:'center', render:function(i){ return i.soldCount||0; } },
      { title:'⏳ Cover', width:'64px', align:'center', render:function(i,h){
          var c = v4stCover(i, v4st._vel);
          if (c === null || c === undefined) return h ? '<span style="color:#94a3b8">—</span>' : '';
          var col = c < 7 ? '#ef4444' : (c < 14 ? '#f97316' : '#059669');
          var label = c > 90 ? '90+' : Math.round(c);
          return h ? '<b style="color:'+col+'">~'+label+'d</b>' : '~'+label+'d';
        }, filterable:false },
      { title:'Expiry', width:'86px', render:function(i,h){
          var e = v4stExpiry(i);
          if (!e) return h?'<span style="color:#94a3b8">—</span>':'';
          if (!h) return i.expiryDate;
          var c = e.days < 0 ? '#ef4444' : (e.days <= 7 ? '#f97316' : '#94a3b8');
          return '<span style="color:'+c+'">'+formatDate(i.expiryDate)+'</span>';
        } },
      { title:'Bin', width:'60px', render:function(i,h){
          return h ? '<button class="btn-mini" style="background:#e0f2fe;color:#1565c0" onclick="v4BinCard(\''+i.id+'\')" title="Stock ledger">📋</button>' : '';
        }, filterable:false }
    ], emptyMessage:'No products', showSearch:false, showFontSlider:true });
  } else window.v4stockTable.setData(rows);
}

// ── LIST/GRID rows ──
function v4stListRows(rows) {
  return rows.map(function(p){
    var c = v4stCover(p, v4st._vel);
    var coverTxt = (c !== null && c !== undefined) ? ' · ~' + (c > 90 ? '90+' : Math.round(c)) + 'd cover' : '';
    var abc = (v4st._abc || {})[p.id];
    return { label: (abc ? '[' + abc + '] ' : '') + sanitize(p.name),
             detail: 'Stock: ' + p.stock + ' ' + (p.unit||'') + ' · Limit: ' + (p.reorderLevel||5) + ' · Cost: ' + fmtMoney(p.costPrice) + coverTxt,
             right: p.stock + ' ' + (p.unit||'') };
  });
}

// ── filter/sort handlers ──
var v4stSearchT = null;
function v4stSearchInput(v) {
  v4st.q = v;
  clearTimeout(v4stSearchT);
  v4stSearchT = setTimeout(function(){ v4S.stlpage = 1; v4S.stgpage = 1; v4stRenderView(); }, 300);
}
function v4stSetCat(v){ v4st.cat = v; v4S.stlpage = 1; v4S.stgpage = 1; v4stRenderView(); }
function v4stSetStatus(v){ v4st.status = v; v4S.stlpage = 1; v4S.stgpage = 1; v4stRenderView(); }
function v4stSetSort(v){ v4st.sort = v; v4S.stlpage = 1; v4S.stgpage = 1; v4stRenderView(); }
function v4stClearFilters() {
  v4st.q = ''; v4st.cat = ''; v4st.status = ''; v4st.lowOnly = false;
  var s = document.getElementById('v4stSearch'); if (s) s.value = '';
  var c = document.getElementById('v4stCat'); if (c) c.value = '';
  var st = document.getElementById('v4stStatus'); if (st) st.value = '';
  var lc = document.getElementById('v4stLow'); if (lc) lc.classList.remove('active');
  v4S.stlpage = 1; v4S.stgpage = 1;
  v4stRenderView();
}
function v4stFillCats() {
  var sel = document.getElementById('v4stCat'); if (!sel) return;
  var keep = v4st.cat || '';
  var cats = [];
  v4products.forEach(function(p){ if (p.isVirtual) return; var c = p.category || 'General'; if (cats.indexOf(c) === -1) cats.push(c); });
  cats.sort();
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(function(c){ return '<option value="' + c + '"' + (c === keep ? ' selected' : '') + '>' + c + '</option>'; }).join('');
}

// ── scan-to-locate ──
function v4stScan() {
  if (typeof v4StartScanner !== 'function') { alert('Scanner not loaded.'); return; }
  v4StartScanner('v4stSearch');
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var el = document.getElementById('v4stSearch');
    if (el && el.value) { clearInterval(iv); v4stSearchInput(el.value); }
    else if (tries > 60) clearInterval(iv);
  }, 500);
}

// ── view switcher / low / more / refresh ──
function v4stView(v) {
  v4st.view = v; v4S.stlpage = 1; v4S.stgpage = 1;
  var ids = { excel:'v4stvExcel', list:'v4stvList', grid:'v4stvGrid' };
  Object.keys(ids).forEach(function(k){ var el = document.getElementById(ids[k]); if (el) el.classList.toggle('active', k === v); });
  var ex = document.getElementById('v4stExcel'), li = document.getElementById('v4stList'), gr = document.getElementById('v4stGrid');
  if (ex) ex.style.display = v === 'excel' ? 'block' : 'none';
  if (li) li.style.display = v === 'list' ? 'block' : 'none';
  if (gr) gr.style.display = v === 'grid' ? 'grid' : 'none';
  v4stRenderView();
}
function v4stToggleLow() {
  v4st.lowOnly = !v4st.lowOnly;
  var chip = document.getElementById('v4stLow'); if (chip) chip.classList.toggle('active', v4st.lowOnly);
  v4S.stlpage = 1; v4S.stgpage = 1;
  v4stRenderView();
}
function v4stMoreList(){ v4S.stlpage = (v4S.stlpage||1) + 1; v4stRenderView(); }
function v4stMoreGrid(){ v4S.stgpage = (v4S.stgpage||1) + 1; v4stRenderView(); }
async function v4stRefresh(){ await v4LoadProducts(); v4stRender(); }

// ── 🧠 SMART RESTOCK — PURCHASE ADVISOR ──
async function v4stRestock() {
  v4stCloseModal();
  var vel = v4st._vel;
  var low = v4products.filter(function(p){ return !p.isVirtual && (p.stock||0) <= (p.reorderLevel||5); });
  if (!low.length) { alert('✅ All stock levels are healthy! Nothing to reorder.'); return; }
  var sups = [];
  try { const { data } = await supabaseClient.from('suppliers').select('name,phone').eq('shop_id', getShopId()).limit(50); sups = data || []; } catch(e) {}
  var rows = low.map(function(p){
    var cover = v4stCover(p, vel);
    var sug;
    if (cover !== null && cover !== undefined && cover > 0) {
      var rate = (p.stock||0) / cover;
      sug = Math.ceil(rate * 14) + (p.reorderLevel||5);
    } else sug = (p.reorderLevel||5) * 2;
    return { p:p, sug:sug, cover:cover };
  });
  window._v4stRestock = rows;
  v4stModal('🧠 Smart Restock — What to Order');
  var est = 0; rows.forEach(function(r){ est += r.sug * (r.p.costPrice||0); });
  var html = '<p style="font-size:12px;color:#64748b">Suggestions come from your real sales speed: order enough for <b>14 days</b> + safety. (New items with no sales yet → 2× alert level.)</p>' +
    '<div style="max-height:38vh;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:8px">' +
    '<table style="width:100%;font-size:12px;border-collapse:collapse">' +
    '<thead><tr style="background:#f8fafc"><th style="text-align:left;padding:6px">Item</th><th style="padding:6px">Have</th><th style="padding:6px">Runs out in</th><th style="padding:6px">ORDER</th><th style="text-align:right;padding:6px">Est. Cost</th></tr></thead><tbody>';
  rows.forEach(function(r){
    html += '<tr style="border-bottom:1px solid #f1f5f9">' +
      '<td style="padding:6px"><b>' + sanitize(r.p.name) + '</b></td>' +
      '<td style="text-align:center;color:' + v4stStatus(r.p).c + ';font-weight:700">' + r.p.stock + '</td>' +
      '<td style="text-align:center;color:#64748b">' + ((r.cover !== null && r.cover !== undefined) ? '~' + Math.round(r.cover) + 'd' : '—') + '</td>' +
      '<td style="text-align:center;color:#2563eb;font-weight:800;font-size:14px">' + r.sug + '</td>' +
      '<td style="text-align:right">' + fmtMoney(r.sug * (r.p.costPrice||0)) + '</td></tr>';
  });
  html += '</tbody></table></div>' +
    '<div style="text-align:right;font-weight:800;margin:8px 0;font-size:14px">Estimated total: ' + fmtMoney(est) + '</div>';
  if (sups.length) {
    html += '<label style="font-size:11px;font-weight:800;color:#475569">🏭 Send to supplier</label>' +
      '<select class="v4-in" id="v4stSup" style="margin-bottom:6px"><option value="">— Choose supplier (or skip) —</option>' +
      sups.map(function(s){ return '<option value="' + (s.phone||'') + '">' + sanitize(s.name) + (s.phone ? ' · ' + sanitize(s.phone) : '') + '</option>'; }).join('') + '</select>';
  }
  html += '<div style="display:flex;gap:6px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4stRestockWA()">📤 WhatsApp Order</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4stRestockPrint()">🖨️ Print</button></div>';
  document.getElementById('v4stToolBody').innerHTML = html;
}
function v4stRestockWA() {
  var rows = window._v4stRestock || [];
  if (!rows.length) return;
  var sel = document.getElementById('v4stSup');
  var phone = sel ? String(sel.value || '').replace(/[^0-9]/g, '') : '';
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = '🛒 RESTOCK ORDER — ' + shop + '\n' + new Date().toLocaleDateString() + '\n\n';
  rows.forEach(function(r){
    msg += '• ' + r.p.name + ' — order ' + r.sug + ' ' + (r.p.unit||'') + ' (have ' + (r.p.stock||0) + ')\n';
  });
  msg += '\nEstimated total: ' + fmtMoney(rows.reduce(function(s,r){ return s + r.sug*(r.p.costPrice||0); }, 0)) + '\n\n— Sent from SmartShop Pro';
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
}
function v4stRestockPrint() {
  var rows = window._v4stRestock || [];
  if (!rows.length) { alert('Nothing to print.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var body = rows.map(function(r){
    return '<tr><td><b>' + sanitize(r.p.name) + '</b></td><td style="text-align:center">' + r.p.stock + '</td><td style="text-align:center">' + ((r.cover !== null && r.cover !== undefined) ? '~' + Math.round(r.cover) + 'd' : '—') + '</td><td style="text-align:center;font-weight:bold;color:#2563eb">' + r.sug + '</td><td style="text-align:right">' + fmtMoney(r.sug*(r.p.costPrice||0)) + '</td></tr>';
  }).join('');
  var est = rows.reduce(function(s,r){ return s + r.sug*(r.p.costPrice||0); }, 0);
  w.document.write('<html><head><title>Restock Order</title><style>body{font-family:monospace;padding:14px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">' + sanitize(shop) + ' — Smart Restock Order</h3>' +
    '<p style="text-align:center;font-size:11px">' + rows.length + ' items · est. ' + fmtMoney(est) + ' · ' + new Date().toLocaleString() + '</p>' +
    '<table><tr><th>Item</th><th>Have</th><th>Runs out in</th><th>ORDER</th><th>Est. Cost</th></tr>' + body + '</table></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// ── print / CSV ──
function v4stPrint() {
  var rows = v4stRows();
  if (!rows.length) { alert('Nothing to print.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var body = rows.map(function(p, i){
    return '<tr><td>' + (i+1) + '</td><td><b>' + sanitize(p.name) + '</b></td><td style="text-align:center">' + ((v4st._abc||{})[p.id]||'') + '</td><td style="text-align:center">' + p.stock + ' ' + (p.unit||'') + '</td><td style="text-align:center">' + (p.reorderLevel||5) + '</td><td style="text-align:center;font-weight:bold;">' + v4stStatus(p).t + '</td><td style="text-align:right">' + fmtMoney((p.stock||0)*(p.costPrice||0)) + '</td></tr>';
  }).join('');
  var low = rows.filter(function(p){ return (p.stock||0) <= (p.reorderLevel||5); }).length;
  w.document.write('<html><head><title>Stock Report</title><style>body{font-family:monospace;padding:14px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">' + sanitize(shop) + ' — Stock Report</h3>' +
    '<p style="text-align:center;font-size:11px">' + rows.length + ' items · ' + low + ' need reorder · ' + new Date().toLocaleString() + '</p>' +
    '<table><tr><th>#</th><th>Product</th><th>ABC</th><th>Stock</th><th>Limit</th><th>Status</th><th>Value</th></tr>' + body + '</table></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}
function v4stCSV() {
  var rows = v4stRows();
  if (!rows.length) { alert('Nothing to export.'); return; }
  var csv = '\uFEFFName,ABC,Category,Stock,Unit,Limit,Status,Cost,Stock Value,Sold,Expiry\n' + rows.map(function(p){
    return '"' + p.name + '","' + ((v4st._abc||{})[p.id]||'') + '","' + (p.category||'General') + '",' + (p.stock||0) + ',' + (p.unit||'') + ',' + (p.reorderLevel||5) + ',' + v4stStatus(p).t + ',' + (p.costPrice||0) + ',' + ((p.stock||0)*(p.costPrice||0)).toFixed(2) + ',' + (p.soldCount||0) + ',"' + (p.expiryDate||'') + '"';
  }).join('\n');
  var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'stock_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

// ── render pipeline ──
function v4stRenderView() {
  var rows = v4stRows();
  var cnt = document.getElementById('v4stCount'); if (cnt) cnt.textContent = rows.length;
  if (v4st.view === 'excel') v4stTable(rows);
  else if (v4st.view === 'list') v4PagList('v4stList', v4stListRows(rows), 'stlpage', 20, 'v4stMoreList');
  else v4PagGrid('v4stGrid', v4stListRows(rows), 'stgpage', 12, 'v4stMoreGrid');
}
function v4stRender() {
  v4st._vel = v4stVelocity();
  v4st._abc = v4stABC();
  v4stFillCats();
  v4stHealth();
  v4stRenderView();
}

// ── tab loader ──
V4_TAB_LOADERS[3] = function() {
  v4stEnsureUI();
  if (typeof SS_PERF !== 'undefined' && !SS_PERF.detailedCache.length) {
    try { ssFetchDetailedPage(false).then(function(){ v4stRender(); }).catch(function(){}); } catch(e) {}
  }
  v4stRender();
};
