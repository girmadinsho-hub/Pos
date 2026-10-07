// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — LOSSES MODULE v3 (Step 7) · UI-3
//  LAWS: ONE analytics button + period switcher (Today/Week/
//  Month/Year/All) · DELETE = user choice (restore stock or
//  clear record only) · EDIT = dropdown dialog.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4lo = { view:'excel', q:'', data:[], period:'month' };

// ── reasons (one home) ──
var V4LO_REASONS = {
  expired:   { icon:'📅', label:'Expired',         color:'#dc2626' },
  damaged:   { icon:'💥', label:'Damaged',         color:'#f97316' },
  lost:      { icon:'❓', label:'Lost',            color:'#f59e0b' },
  theft:     { icon:'🕵️', label:'Possible theft', color:'#7c3aed' },
  stocktake: { icon:'🧮', label:'Stock-take',      color:'#64748b' },
  other:     { icon:'➖', label:'Other',           color:'#94a3b8' }
};
function v4loReason(r) { return V4LO_REASONS[r] || V4LO_REASONS.other; }

// ── period helpers ──
function v4loPeriodStart(p) {
  var now = new Date();
  if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'week') {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day = d.getDay();                                   // 0=Sun
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);    // Monday start
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }
  if (p === 'month')  return new Date(now.getFullYear(), now.getMonth(), 1);
  if (p === 'year')   return new Date(now.getFullYear(), 0, 1);
  return new Date(0);
}
function v4loInPeriod(l) {
  return new Date(l.time) >= v4loPeriodStart(v4lo.period);
}
function v4loPeriodLabel() {
  return { today:'Today', week:'This Week', month:'This Month', year:'This Year', all:'All Time' }[v4lo.period] || 'This Month';
}

// ── data ──
async function v4loLoad() {
  try {
    const { data, error } = await supabaseClient.from('losses')
      .select('*').eq('shop_id', getShopId())
      .order('time', { ascending: false }).limit(1000);
    if (error) throw error;
    v4lo.data = (data || []).map(function(l){
      return { id:l.id, productId:l.product_id, productName:l.product_name || 'Unknown',
        quantity:Number(l.quantity||0), reason:l.reason || 'other', totalLoss:Number(l.total_loss||0),
        time:l.time };
    });
  } catch(e) {
    console.warn('Losses load:', e.message);
    v4lo.data = [];
  }
  return v4lo.data;
}
function v4loRefresh(){ return v4loLoad().then(v4loRender); }

// ── analytics (period-aware — the ONE brain) ──
function v4loAnalytics() {
  var rows = v4lo.data.filter(v4loInPeriod);
  var byReason = {}, byProduct = {}, byDay = {};
  var total = 0;
  var today = new Date(); today.setHours(0,0,0,0);
  var days = [];
  for (var i = 13; i >= 0; i--) { var d = new Date(today); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0,10)); byDay[d.toISOString().slice(0,10)] = 0; }
  rows.forEach(function(l){
    total += l.totalLoss;
    byReason[l.reason] = (byReason[l.reason] || 0) + l.totalLoss;
    byProduct[l.productName] = (byProduct[l.productName] || 0) + l.totalLoss;
    var key = new Date(l.time).toISOString().slice(0,10);
    if (byDay[key] !== undefined) byDay[key] += l.totalLoss;
  });
  var last7 = 0, prev7 = 0;
  days.slice(7).forEach(function(k){ last7 += byDay[k]; });
  days.slice(0,7).forEach(function(k){ prev7 += byDay[k]; });
  return { rows:rows, total:total, count:rows.length, byReason:byReason, byProduct:byProduct,
    byDay:byDay, days:days, last7:last7, prev7:prev7, rising: last7 > prev7 && last7 > 0 };
}

// ── UI ──
function v4loEnsureUI() {
  var tab = document.getElementById('tab5');
  if (!tab || tab.dataset.loBuilt === '1') return;
  tab.dataset.loBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4loH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4loH b{font-size:16px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.v4loH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4loH small{color:#94a3b8;}' +
    '.v4loBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4loBtn:active{transform:scale(.97);}' +
    '.v4loBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4loBtnTx{flex:1;min-width:0;}' +
    '.v4loBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4loBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4loBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '</style>' +

    // 1️⃣ HEALTH STRIP — information only (no duplicate taps)
    '<div class="card" style="padding:12px" id="v4loHealth"></div>' +

    // 2️⃣ TWO BIG BUTTONS ONLY
    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:12px">' +
        '<button class="v4loBtn" style="background:linear-gradient(135deg,#dc2626,#f87171)" onclick="v4loOpen(\'record\')"><span class="v4loBtnIc">⚡</span><span class="v4loBtnTx"><b>Record a Loss</b><small>Something expired, broke, or disappeared? Tap here — 10 seconds</small></span><span class="v4loBtnGo">›</span></button>' +
        '<button class="v4loBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)" onclick="v4loOpen(\'analytics\')"><span class="v4loBtnIc">📊</span><span class="v4loBtnTx"><b>Analytics</b><small>Losses by reason & product — switch Today / Week / Month / Year inside</small></span><span class="v4loBtnGo">›</span></button>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4loWhatsApp()">📤 Share Report</button>' +
        '<button class="v4-btn p" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4loPrint()">🖨️</button>' +
        '<button class="v4-btn p" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4loCSV()">📄⬇</button>' +
        '<button class="v4-btn o" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4loRefresh()">🔄</button>' +
      '</div>' +
    '</div>' +

    // 3️⃣ TABLE (follows the chosen period)
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">📉 Loss History <span class="v4-badge" id="v4loCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip active" id="v4lovExcel" onclick="v4loView(\'excel\')">📊 Excel</button>' +
          '<button class="v4-chip" id="v4lovList" onclick="v4loView(\'list\')">📋 List</button>' +
          '<button class="v4-chip" id="v4lovGrid" onclick="v4loView(\'grid\')">⊞ Grid</button>' +
        '</span>' +
      '</div>' +
      '<input class="v4-in" id="v4loSearch" placeholder="🔍 Product name…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4loSearchInput(this.value)">' +
      '<div id="v4loExcel"></div>' +
      '<div id="v4loList" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
      '<div id="v4loGrid" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
    '</div>';
}

// ── health strip (information only) ──
function v4loHealth() {
  var el = document.getElementById('v4loHealth'); if (!el) return;
  var a = v4loAnalytics();
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    '<div class="v4loH"><b style="color:#ef4444">💸 ' + fmtMoney(a.total) + '</b><small>LOST (' + v4loPeriodLabel().toUpperCase() + ')</small></div>' +
    '<div class="v4loH"><b style="color:#f97316">📋 ' + a.count + '</b><small>RECORDS</small></div>' +
    '<div class="v4loH"><b style="color:#3b82f6">📈 ' + fmtMoney(a.last7) + '</b><small>LAST 7 DAYS</small></div>' +
    '</div>' +
    (a.rising ? '<div style="margin-top:8px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:8px;text-align:center;font-size:12px;font-weight:700;color:#dc2626">⚠️ Losses RISING — last 7 days (' + fmtMoney(a.last7) + ') higher than the week before (' + fmtMoney(a.prev7) + ')</div>' : '');
}

// ── modal system ──
function v4loModal(title) {
  v4loCloseModal();
  var m = document.createElement('div');
  m.id = 'v4loToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4loCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4loToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4loCloseModal(); });
}
function v4loCloseModal() { var m = document.getElementById('v4loToolModal'); if (m) m.remove(); }

// ── period chips (the ONE switcher) ──
function v4loPeriodChips() {
  var P = { today:'📅 Today', week:'📅 This Week', month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' +
    Object.keys(P).map(function(p){
      return '<button class="v4PChip' + (v4lo.period === p ? ' active' : '') + '" onclick="v4loSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
    }).join('') + '</div>';
}
function v4loSetPeriod(p) {
  v4lo.period = p;
  // refresh chips + analytics body (modal stays open)
  var chips = document.querySelector('#v4loToolModal .v4PChips');
  if (chips) chips.outerHTML = v4loPeriodChips();
  var body = document.getElementById('v4loAnalyticsBody');
  if (body) body.innerHTML = v4loAnalyticsHTML();
  // page behind follows the period too
  v4loRender();
}

// ── analytics HTML (ONE view: reasons + products + trend) ──
function v4loAnalyticsHTML() {
  var a = v4loAnalytics();
  var html = '';
  // by reason — bars
  var reasons = Object.keys(a.byReason).map(function(r){ return { r:r, v:a.byReason[r] }; }).sort(function(x,y){ return y.v - x.v; });
  var rMax = reasons.length ? reasons[0].v : 1;
  html += '<b style="font-size:13px">💸 Where the money goes — by reason</b>';
  if (!reasons.length) html += '<p style="color:#64748b;text-align:center;padding:14px">✅ No losses in ' + v4loPeriodLabel() + '. Lucky shop!</p>';
  reasons.forEach(function(x){
    var R = v4loReason(x.r);
    var pct = Math.round(x.v / rMax * 100);
    html += '<div style="margin:8px 0">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
      '<span>' + R.icon + ' ' + R.label + '</span><b style="color:' + R.color + '">' + fmtMoney(x.v) + '</b></div>' +
      '<div style="height:10px;background:rgba(148,163,184,.15);border-radius:5px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + R.color + ';border-radius:5px"></div></div></div>';
  });
  // top products
  var prods = Object.keys(a.byProduct).map(function(n){ return { n:n, v:a.byProduct[n] }; }).sort(function(x,y){ return y.v - x.v; }).slice(0, 10);
  if (prods.length) {
    html += '<div style="height:10px"></div><b style="font-size:13px">📦 Top loss products</b>';
    prods.forEach(function(x, i){
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + (i+1) + '. ' + sanitize(x.n) + '</span><b style="color:#ef4444">' + fmtMoney(x.v) + '</b></div>';
    });
  }
  // 14-day trend
  html += '<div style="height:10px"></div><b style="font-size:13px">📈 Last 14 days</b>';
  var dMax = 0; a.days.forEach(function(k){ if (a.byDay[k] > dMax) dMax = a.byDay[k]; });
  html += '<div style="display:flex;align-items:flex-end;gap:2px;height:60px;margin-top:6px">';
  a.days.forEach(function(k){
    var v = a.byDay[k];
    var h = dMax > 0 ? Math.max(3, Math.round(v / dMax * 55)) : 3;
    html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="' + k + ': ' + fmtMoney(v) + '">' +
      '<div style="width:100%;height:' + h + 'px;background:' + (v > 0 ? '#ef4444' : 'rgba(148,163,184,.25)') + ';border-radius:3px 3px 0 0"></div></div>';
  });
  html += '</div><p style="font-size:10px;color:#64748b;text-align:center;margin-top:4px">worst day: ' + fmtMoney(dMax) + '</p>';
  return html;
}

// ── record loss modal ──
function v4loRecordHTML() {
  var opts = '';
  Object.keys(V4LO_REASONS).forEach(function(k){
    if (k === 'stocktake') return;
    var R = V4LO_REASONS[k];
    opts += '<option value="' + k + '">' + R.icon + ' ' + R.label + '</option>';
  });
  var prods = v4products.filter(function(p){ return !p.isVirtual && (p.stock||0) > 0; });
  var pOpts = prods.map(function(p){
    return '<option value="' + p.id + '">' + sanitize(p.name) + ' (' + p.stock + ' ' + (p.unit||'') + ' · cost ' + fmtMoney(p.costPrice) + ')</option>';
  }).join('');
  return '<p style="font-size:12px;color:#64748b;margin-bottom:10px">Pick the item, quantity, and reason — everything else is automatic.</p>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">📦 Item</label>' +
    '<select class="v4-in" id="v4loProd" onchange="v4loCalc()">' + (pOpts || '<option value="">— no stocked products —</option>') + '</select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Quantity</label>' +
    '<input type="number" class="v4-in" id="v4loQty" value="1" min="1" oninput="v4loCalc()">' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Reason</label>' +
    '<select class="v4-in" id="v4loReason">' + opts + '</select>' +
    '<div id="v4loCalcBox" style="background:#fef2f2;border-radius:10px;padding:10px;text-align:center;margin:10px 0;font-weight:800;color:#dc2626"></div>' +
    '<button class="v4-btn" style="background:#dc2626" onclick="v4loSave()">📉 Record Loss</button>';
}
function v4loCalc() {
  var p = v4products.find(function(x){ return x.id === document.getElementById('v4loProd').value; });
  var qty = parseFloat(document.getElementById('v4loQty').value) || 0;
  var box = document.getElementById('v4loCalcBox');
  if (!p || qty <= 0) { box.textContent = '—'; return; }
  if (qty > (p.stock||0)) { box.innerHTML = '⚠️ Only ' + p.stock + ' ' + (p.unit||'') + ' in stock!'; box.style.color = '#f97316'; return; }
  box.style.color = '#dc2626';
  box.textContent = '💸 Loss value: ' + fmtMoney(qty * (p.costPrice||0));
}
async function v4loSave() {
  var pid = document.getElementById('v4loProd').value;
  var qty = parseFloat(document.getElementById('v4loQty').value) || 0;
  var reason = document.getElementById('v4loReason').value;
  if (!pid || qty <= 0) { alert('Pick an item and quantity.'); return; }
  var p = v4products.find(function(x){ return x.id === pid; });
  if (!p) return;
  if (qty > (p.stock||0)) { alert('Not enough stock! Current: ' + p.stock); return; }
  var value = qty * (p.costPrice||0);
  if (!await confirm('Record this loss?\n\n' + p.name + ' — ' + qty + ' ' + (p.unit||'') + '\nReason: ' + v4loReason(reason).label + '\nValue: ' + fmtMoney(value))) return;
  try {
    const { error: lErr } = await supabaseClient.from('losses').insert([{
      firebase_id: 'loss_' + Date.now(),
      shop_id: getShopId(), product_id: pid, product_name: p.name,
      quantity: qty, reason: reason, total_loss: value,
      time: new Date().toISOString()
    }]);
    if (lErr) throw lErr;
    const { error: pErr } = await v4ById(supabaseClient.from('products').update({ stock: (p.stock||0) - qty }), pid);
    if (pErr) throw pErr;
    p.stock = (p.stock||0) - qty;
    v4loCloseModal();
    v4loRefresh();
    alert('✅ Loss recorded: ' + p.name + ' — ' + fmtMoney(value));
  } catch(e) { alert('❌ ' + e.message); }
}

// ── EDIT DIALOG (dropdowns only) ──
function v4loEditDialog(id) {
  var l = v4lo.data.find(function(x){ return x.id === id; });
  if (!l) return;
  v4loModal('✏️ Edit Loss — ' + sanitize(l.productName));
  var p = v4products.find(function(x){ return x.id === l.productId; });
  var maxQty = (p ? (p.stock||0) : 0) + l.quantity;
  var qtyOpts = '';
  for (var q = 1; q <= Math.min(maxQty, 200); q++) {
    qtyOpts += '<option value="' + q + '"' + (q === l.quantity ? ' selected' : '') + '>' + q + '</option>';
  }
  var rOpts = '';
  Object.keys(V4LO_REASONS).forEach(function(k){
    var R = V4LO_REASONS[k];
    rOpts += '<option value="' + k + '"' + (k === l.reason ? ' selected' : '') + '>' + R.icon + ' ' + R.label + '</option>';
  });
  var cost = p ? (p.costPrice||0) : (l.totalLoss / (l.quantity||1));
  document.getElementById('v4loToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">📦 Item (fixed)</label>' +
    '<input class="v4-in" value="' + sanitize(l.productName) + '" disabled style="background:#f1f5f9;color:#64748b">' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Quantity</label>' +
    '<select class="v4-in" id="v4loEditQty" onchange="v4loEditCalc(' + cost + ')">' + qtyOpts + '</select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Reason</label>' +
    '<select class="v4-in" id="v4loEditReason">' + rOpts + '</select>' +
    '<div id="v4loEditCalcBox" style="background:#fef2f2;border-radius:10px;padding:10px;text-align:center;margin:10px 0;font-weight:800;color:#dc2626">💸 Loss value: ' + fmtMoney(l.totalLoss) + '</div>' +
    '<button class="v4-btn g" onclick="v4loEditSave(\'' + id + '\',' + l.quantity + ',' + cost + ')">💾 Save Changes</button>';
  window._v4loEdit = { id:id, oldQty:l.quantity, cost:cost };
}
function v4loEditCalc(cost) {
  var qty = parseFloat(document.getElementById('v4loEditQty').value) || 0;
  var box = document.getElementById('v4loEditCalcBox');
  if (box) box.textContent = '💸 Loss value: ' + fmtMoney(qty * cost);
}
async function v4loEditSave(id, oldQty, cost) {
  var e = window._v4loEdit; if (!e) return;
  var newQty = parseInt(document.getElementById('v4loEditQty').value) || 0;
  var newReason = document.getElementById('v4loEditReason').value;
  var l = v4lo.data.find(function(x){ return x.id === id; });
  if (l && newQty === e.oldQty && newReason === l.reason) { v4loCloseModal(); return; }
  var newValue = newQty * e.cost;
  if (!await confirm('Save changes?\n\nQuantity: ' + e.oldQty + ' → ' + newQty + '\nValue: ' + fmtMoney(newValue))) return;
  try {
    var p = v4products.find(function(x){ return x.id === (l || {}).productId; });
    if (p) {
      var newStock = (p.stock||0) + e.oldQty - newQty;
      if (newStock < 0) { alert('Not enough stock to increase the loss!'); return; }
      const { error } = await v4ById(supabaseClient.from('products').update({ stock: newStock }), p.id);
      if (error) throw error;
      p.stock = newStock;
    }
    const { error } = await supabaseClient.from('losses')
      .update({ quantity: newQty, reason: newReason, total_loss: newValue }).eq('id', id);
    if (error) throw error;
    v4loCloseModal();
    v4loRefresh();
    alert('✅ Loss updated. Stock adjusted.');
  } catch(er) { alert('❌ ' + er.message); }
}

// ═══ DELETE — THE CAPTAIN'S CHOICE DIALOG ═══
function v4loDeleteDialog(id) {
  var l = v4lo.data.find(function(x){ return x.id === id; });
  if (!l) return;
  v4loModal('🗑️ Delete Loss Record');
  document.getElementById('v4loToolBody').innerHTML =
    '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:12px;font-size:13px;text-align:center">' +
      '<b>' + sanitize(l.productName) + '</b> — ' + l.quantity + ' × · ' + fmtMoney(l.totalLoss) +
    '</div>' +
    '<p style="font-size:12px;color:#64748b;margin-bottom:12px">Was this loss a <b>mistake</b>, or <b>real</b>? Choose what happens to the stock:</p>' +
    '<button class="v4-btn" style="background:#059669;margin-bottom:8px" onclick="v4loDeleteRestore(\'' + id + '\')">↩️ Mistake — Delete & RESTORE Stock<br><small style="font-weight:400;font-size:11px;opacity:.9">+' + l.quantity + ' goes back to your stock</small></button>' +
    '<button class="v4-btn" style="background:#dc2626;margin-bottom:8px" onclick="v4loDeleteOnly(\'' + id + '\')">🗑️ Real loss — Delete record only<br><small style="font-weight:400;font-size:11px;opacity:.9">Stock stays deducted (the items are truly gone)</small></button>' +
    '<button class="v4-btn o" onclick="v4loCloseModal()">✖ Cancel</button>';
}
async function v4loDeleteRestore(id) {
  var l = v4lo.data.find(function(x){ return x.id === id; });
  if (!l) return;
  try {
    var p = v4products.find(function(x){ return x.id === l.productId; });
    if (p) {
      const { error } = await v4ById(supabaseClient.from('products').update({ stock: (p.stock||0) + l.quantity }), l.productId);
      if (error) throw error;
      p.stock = (p.stock||0) + l.quantity;
    }
    const { error: dErr } = await supabaseClient.from('losses').delete().eq('id', id);
    if (dErr) throw dErr;
    v4loCloseModal();
    v4loRefresh();
    alert('✅ Record deleted — stock restored (+' + l.quantity + ').');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4loDeleteOnly(id) {
  var l = v4lo.data.find(function(x){ return x.id === id; });
  if (!l) return;
  try {
    const { error: dErr } = await supabaseClient.from('losses').delete().eq('id', id);
    if (dErr) throw dErr;
    v4loCloseModal();
    v4loRefresh();
    alert('✅ Record deleted — stock stays as it is (real loss).');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── modal opener ──
function v4loOpen(tool) {
  if (tool === 'analytics') {
    v4loModal('📊 Loss Analytics');
    document.getElementById('v4loToolBody').innerHTML =
      v4loPeriodChips() +
      '<div id="v4loAnalyticsBody">' + v4loAnalyticsHTML() + '</div>';
  }
  else if (tool === 'record') { v4loModal('⚡ Record a Loss'); document.getElementById('v4loToolBody').innerHTML = v4loRecordHTML(); v4loCalc(); }
}

// ── table ──
function v4loRows() {
  var q = (v4lo.q || '').toLowerCase();
  return v4lo.data.filter(function(l){
    if (q && l.productName.toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
function v4loTable(rows) {
  var ex = document.getElementById('v4loExcel'); if (!ex) return;
  if (!rows.length) {
    ex.innerHTML = '<div class="placeholder">' + (v4lo.data.length ? 'No losses in ' + v4loPeriodLabel() + ' (or no search matches).' : 'No losses recorded — lucky shop!') + '</div>';
    window.v4lossTable = null; return;
  }
  var alive = ex.querySelector('.modern-sheet-table');
  if (!window.v4lossTable || !alive) {
    ex.innerHTML = '';
    window.v4lossTable = new ModernSheet('v4loExcel', { data: rows, columns: [
      { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
      { title:'Product', field:'productName', width:'160px', render:function(i,h){ return h?'<b>'+sanitize(i.productName)+'</b>':i.productName; } },
      { title:'Qty', field:'quantity', width:'54px', align:'center' },
      { title:'Reason', width:'100px', render:function(i,h){
          var R = v4loReason(i.reason);
          return h ? '<span style="color:' + R.color + ';font-weight:700">' + R.icon + ' ' + R.label + '</span>' : R.label;
        }, filterable:true },
      { title:'Loss', field:'totalLoss', width:'95px', align:'right',
        render:function(i,h){ return h?'<b style="color:#ef4444">-'+fmtMoney(i.totalLoss)+'</b>':i.totalLoss; },
        total:true, totalValue:function(i){ return i.totalLoss; }, totalFormat:function(s){ return '-' + fmtMoney(s); } },
      { title:'Date', field:'time', width:'105px', render:function(i,h){ return h?formatDate(i.time):i.time; } },
      { title:'Actions', width:'110px', render:function(i,h){
          if (!h) return '';
          return '<button class="btn-mini edit" onclick="v4loEditDialog(\'' + i.id + '\')">✏️</button> ' +
                 '<button class="btn-mini delete" onclick="v4loDeleteDialog(\'' + i.id + '\')">🗑️</button>';
        }, filterable:false }
    ], emptyMessage:'No losses', showSearch:false, showFontSlider:true });
  } else window.v4lossTable.setData(rows);
}

// ── search / views ──
var v4loSearchT = null;
function v4loSearchInput(v) {
  v4lo.q = v;
  clearTimeout(v4loSearchT);
  v4loSearchT = setTimeout(function(){ v4S.lolpage = 1; v4S.logpage = 1; v4loRenderView(); }, 300);
}
function v4loView(v) {
  v4lo.view = v; v4S.lolpage = 1; v4S.logpage = 1;
  var ids = { excel:'v4lovExcel', list:'v4lovList', grid:'v4lovGrid' };
  Object.keys(ids).forEach(function(k){ var el = document.getElementById(ids[k]); if (el) el.classList.toggle('active', k === v); });
  var ex = document.getElementById('v4loExcel'), li = document.getElementById('v4loList'), gr = document.getElementById('v4loGrid');
  if (ex) ex.style.display = v === 'excel' ? 'block' : 'none';
  if (li) li.style.display = v === 'list' ? 'block' : 'none';
  if (gr) gr.style.display = v === 'grid' ? 'grid' : 'none';
  v4loRenderView();
}
function v4loMoreList(){ v4S.lolpage = (v4S.lolpage||1) + 1; v4loRenderView(); }
function v4loMoreGrid(){ v4S.logpage = (v4S.logpage||1) + 1; v4loRenderView(); }
function v4loListRows(rows) {
  return rows.map(function(l){
    var R = v4loReason(l.reason);
    return { label: R.icon + ' ' + sanitize(l.productName),
             detail: 'Qty: ' + l.quantity + ' · ' + R.label + ' · ' + formatDate(l.time),
             right: '-' + fmtMoney(l.totalLoss) };
  });
}

// ── WhatsApp / print / CSV (period-aware) ──
function v4loWhatsApp() {
  var a = v4loAnalytics();
  if (!a.count) { alert('No losses in ' + v4loPeriodLabel() + '.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var reasons = Object.keys(a.byReason).map(function(r){ return v4loReason(r).label + ': ' + fmtMoney(a.byReason[r]); }).join('\n');
  var msg = '📉 LOSS REPORT — ' + shop + '\n' + v4loPeriodLabel() + '\n\n' +
    'Total lost: ' + fmtMoney(a.total) + ' (' + a.count + ' records)\n\nBy reason:\n' + reasons + '\n\n— SmartShop Pro';
  var phone = prompt('Send to which WhatsApp number?\n(Leave empty to just copy the report)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else {
    if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Report copied to clipboard!'); });
    else alert(msg);
  }
}
function v4loPrint() {
  var rows = v4loAnalytics().rows;
  if (!rows.length) { alert('Nothing to print in ' + v4loPeriodLabel() + '.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var total = rows.reduce(function(s,l){ return s + l.totalLoss; }, 0);
  var body = rows.map(function(l, i){
    var R = v4loReason(l.reason);
    return '<tr><td>' + (i+1) + '</td><td><b>' + sanitize(l.productName) + '</b></td><td style="text-align:center">' + l.quantity + '</td><td>' + R.label + '</td><td style="text-align:right">' + fmtMoney(l.totalLoss) + '</td><td>' + formatDate(l.time) + '</td></tr>';
  }).join('');
  w.document.write('<html><head><title>Loss Report</title><style>body{font-family:monospace;padding:14px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">' + sanitize(shop) + ' — Loss Report</h3>' +
    '<p style="text-align:center;font-size:11px">' + v4loPeriodLabel() + ' · ' + rows.length + ' records · total ' + fmtMoney(total) + '</p>' +
    '<table><tr><th>#</th><th>Product</th><th>Qty</th><th>Reason</th><th>Value</th><th>Date</th></tr>' + body + '</table>' +
    '<p style="text-align:right;font-weight:bold;margin-top:8px">TOTAL LOST: ' + fmtMoney(total) + '</p></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}
function v4loCSV() {
  var rows = v4loAnalytics().rows;
  if (!rows.length) { alert('Nothing to export.'); return; }
  var csv = '\uFEFFProduct,Quantity,Reason,Value,Date\n' + rows.map(function(l){
    return '"' + l.productName + '",' + l.quantity + ',"' + v4loReason(l.reason).label + '",' + l.totalLoss.toFixed(2) + ',"' + formatDate(l.time) + '"';
  }).join('\n');
  var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'losses_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

// ── render pipeline ──
function v4loRenderView() {
  var rows = v4loRows().filter(v4loInPeriod);
  var cnt = document.getElementById('v4loCount'); if (cnt) cnt.textContent = rows.length;
  if (v4lo.view === 'excel') v4loTable(rows);
  else if (v4lo.view === 'list') v4PagList('v4loList', v4loListRows(rows), 'lolpage', 20, 'v4loMoreList');
  else v4PagGrid('v4loGrid', v4loListRows(rows), 'logpage', 12, 'v4loMoreGrid');
}
function v4loRender() {
  v4loHealth();
  v4loRenderView();
}

// ── tab loader ──
V4_TAB_LOADERS[5] = function() {
  v4loEnsureUI();
  v4loLoad().then(v4loRender);
};
