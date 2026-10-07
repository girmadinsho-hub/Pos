// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — SUPPLIERS & PURCHASE ORDERS v2 (Step 10)
//  v2: PARTIAL CANCEL engine — every item gets a destiny:
//  📥 delivered (stock+) · 🚫 cancelled (no stock) · ⏳ pending.
//  One-tap Cancel-Remaining-&-Close. Cancelled history in
//  order card + analytics. WhatsApp PO · dropdown edits.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4sp = { suppliers:[], orders:[], q:'', period:'month' };

// ── period helpers ──
function v4spPeriodStart(p) {
  var now = new Date();
  if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'week') {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }
  if (p === 'month')  return new Date(now.getFullYear(), now.getMonth(), 1);
  if (p === 'year')   return new Date(now.getFullYear(), 0, 1);
  return new Date(0);
}
function v4spInPeriod(o) { return new Date((o.date || '') + 'T12:00:00') >= v4spPeriodStart(v4sp.period); }
function v4spPeriodLabel() {
  return { today:'Today', week:'This Week', month:'This Month', year:'This Year', all:'All Time' }[v4sp.period] || 'This Month';
}

// ── data ──
async function v4spLoad() {
  try {
    const { data: sups } = await supabaseClient.from('suppliers').select('*').eq('shop_id', getShopId());
    v4sp.suppliers = (sups || []).map(function(s){
      return { id: s.firebase_id || s.id, name: s.name, phone: s.phone || '', address: s.address || '' };
    }).sort(function(a,b){ return a.name.localeCompare(b.name); });
  } catch(e) { console.warn('Suppliers load:', e.message); v4sp.suppliers = []; }
  try {
    const { data: pos } = await supabaseClient.from('purchase_orders').select('*').eq('shop_id', getShopId()).order('date', { ascending: false });
    v4sp.orders = (pos || []).map(function(p){
      return { id: p.firebase_id || p.id, orderNo: p.order_no || ('#' + String(p.id).slice(-5)),
        supplierId: p.supplier_id, items: p.items || [], receivedItems: p.received_items || [],
        cancelledItems: p.cancelled_items || [],
        total: Number(p.total||0), status: p.status || 'pending', date: p.date };
    });
  } catch(e) { console.warn('Orders load:', e.message); v4sp.orders = []; }
}
async function v4spRefresh(){ await v4spLoad(); v4spRender(); }
function v4spSupplier(id) { return v4sp.suppliers.find(function(s){ return s.id === id; }); }
function v4spOrder(id) { return v4sp.orders.find(function(o){ return o.id === id; }); }

// ── UI ──
function v4spEnsureUI() {
  var tab = document.getElementById('tab9');
  if (!tab || tab.dataset.spBuilt === '1') return;
  tab.dataset.spBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4spH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4spH b{font-size:13px;display:block;word-break:break-word;line-height:1.25;}' +
    '.v4spH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4spH small{color:#94a3b8;}' +
    '.v4spBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4spBtn:active{transform:scale(.97);}' +
    '.v4spBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4spBtnTx{flex:1;min-width:0;}' +
    '.v4spBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4spBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4spBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '</style>' +

    '<div class="card" style="padding:12px" id="v4spHealth"></div>' +

    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">' +
        '<button class="v4spBtn" style="background:linear-gradient(135deg,#059669,#34d399)" onclick="v4spRegister()"><span class="v4spBtnIc">➕</span><span class="v4spBtnTx"><b>Register Supplier</b><small>Who you buy your goods from</small></span><span class="v4spBtnGo">›</span></button>' +
        '<button class="v4spBtn" style="background:linear-gradient(135deg,#0d64f0,#60a5fa)" onclick="v4spCreatePO()"><span class="v4spBtnIc">📦</span><span class="v4spBtnTx"><b>Create Order</b><small>Build a purchase order — send via WhatsApp</small></span><span class="v4spBtnGo">›</span></button>' +
        '<button class="v4spBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa);grid-column:1/-1" onclick="v4spOpen(\'analytics\')"><span class="v4spBtnIc">📊</span><span class="v4spBtnTx"><b>Order Analytics</b><small>Received vs pending vs cancelled — period switcher</small></span><span class="v4spBtnGo">›</span></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">🚚 Open Orders <span class="v4-badge" id="v4spOrdCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip" onclick="v4spShowDone = !v4spShowDone; v4spRenderOrders()">🕐 History</button>' +
          '<button class="v4-chip" onclick="v4spRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<div id="v4spOrders"></div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">🏭 Suppliers <span class="v4-badge" id="v4spSupCount">0</span></div>' +
      '<input class="v4-in" id="v4spSearch" placeholder="🔍 Supplier name…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4spSearchInput(this.value)">' +
      '<div id="v4spSuppliers"></div>' +
    '</div>';
}
var v4spShowDone = false;

// ── health strip ──
function v4spHealth() {
  var el = document.getElementById('v4spHealth'); if (!el) return;
  var open = v4sp.orders.filter(function(o){ return o.status === 'pending' || o.status === 'partially_received'; });
  var openVal = open.reduce(function(s,o){ return s + o.total; }, 0);
  var partial = open.filter(function(o){ return o.status === 'partially_received'; }).length;
  function H(v,l,c){ return '<div class="v4spH"><b style="color:' + c + '">' + v + '</b><small>' + l + '</small></div>'; }
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    H(v4sp.suppliers.length, '🏭 SUPPLIERS', '#3b82f6') +
    H(open.length, '🚚 OPEN ORDERS', open.length > 0 ? '#f97316' : '#10b981') +
    H(partial, '↩️ PARTIAL', partial > 0 ? '#f59e0b' : '#94a3b8') +
    H(fmtMoney(openVal), '💰 PENDING VALUE', '#7c3aed') +
    '</div>';
}

// ── modal ──
function v4spModal(title) {
  v4spCloseModal();
  var m = document.createElement('div');
  m.id = 'v4spToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4spCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4spToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4spCloseModal(); });
}
function v4spCloseModal() { var m = document.getElementById('v4spToolModal'); if (m) m.remove(); }

// ═══ REGISTER SUPPLIER ═══
function v4spRegister() {
  v4spModal('➕ Register Supplier');
  document.getElementById('v4spToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Supplier Name *</label>' +
    '<input class="v4-in" id="v4spRName" placeholder="e.g., EthioBev Distribution">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone (WhatsApp!)</label><input class="v4-in" id="v4spRPhone" placeholder="e.g., 0912345678"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Address</label><input class="v4-in" id="v4spRAddr" placeholder="City / area"></div>' +
    '</div>' +
    '<button class="v4-btn g" onclick="v4spRegisterSave()">✅ Register</button>';
}
async function v4spRegisterSave() {
  var name = document.getElementById('v4spRName').value.trim();
  var phone = document.getElementById('v4spRPhone').value.trim();
  var addr = document.getElementById('v4spRAddr').value.trim();
  if (!name) { alert('Name is required.'); return; }
  if (v4sp.suppliers.some(function(s){ return s.name.toLowerCase() === name.toLowerCase(); })) { alert('⚠️ This supplier already exists.'); return; }
  try {
    const { error } = await supabaseClient.from('suppliers').insert([{
      firebase_id: 'sup_' + Date.now(), shop_id: getShopId(),
      name: name, phone: phone, address: addr
    }]);
    if (error) throw error;
    v4spCloseModal();
    await v4spRefresh();
    alert('✅ ' + name + ' registered!' + (phone ? '\n📤 You can now send purchase orders to their WhatsApp.' : ''));
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ EDIT / DELETE / WHATSAPP SUPPLIER ═══
function v4spEditSup(id) {
  var s = v4spSupplier(id); if (!s) return;
  v4spModal('✏️ Edit Supplier — ' + sanitize(s.name));
  document.getElementById('v4spToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Name</label>' +
    '<input class="v4-in" id="v4spEName" value="' + sanitize(s.name).replace(/"/g,'&quot;') + '">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone</label><input class="v4-in" id="v4spEPhone" value="' + sanitize(s.phone) + '"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Address</label><input class="v4-in" id="v4spEAddr" value="' + sanitize(s.address).replace(/"/g,'&quot;') + '"></div>' +
    '</div>' +
    '<button class="v4-btn g" onclick="v4spEditSupSave(\'' + id + '\')">💾 Save</button>';
}
async function v4spEditSupSave(id) {
  try {
    const { error } = await v4ById(supabaseClient.from('suppliers').update({
      name: document.getElementById('v4spEName').value.trim(),
      phone: document.getElementById('v4spEPhone').value.trim(),
      address: document.getElementById('v4spEAddr').value.trim()
    }), id);
    if (error) throw error;
    v4spCloseModal();
    await v4spRefresh();
    alert('✅ Supplier updated.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4spDeleteSup(id) {
  var s = v4spSupplier(id); if (!s) return;
  var orderCount = v4sp.orders.filter(function(o){ return o.supplierId === id; }).length;
  if (!await confirm('🗑️ Delete supplier "' + s.name + '"?' + (orderCount ? '\n\nTheir ' + orderCount + ' order record(s) stay in history.' : ''))) return;
  try {
    const { error } = await v4ById(supabaseClient.from('suppliers').delete(), id);
    if (error) throw error;
    await v4spRefresh();
    alert('✅ Supplier deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}
function v4spWhatsAppSup(id) {
  var s = v4spSupplier(id); if (!s) return;
  if (!s.phone) { alert('No phone number for this supplier.\nEdit them to add one (then WhatsApp orders work).'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = 'Hello ' + s.name + ', this is ' + shop + '.\n\nWe would like to place an order. Could you please share current prices and availability?\n\nThank you!';
  window.open('https://wa.me/' + s.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(msg), '_blank');
}

// ═══ CREATE PURCHASE ORDER ═══
var v4po = { filter:'all', q:'' };
function v4spCreatePO() {
  if (!v4sp.suppliers.length) { alert('Register a supplier first — then you can create orders.'); return; }
  v4spModal('📦 Create Purchase Order');
  var supOpts = v4sp.suppliers.map(function(s){ return '<option value="' + s.id + '">' + sanitize(s.name) + '</option>'; }).join('');
  document.getElementById('v4spToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Supplier</label>' +
    '<select class="v4-in" id="v4poSupplier">' + supOpts + '</select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Reference (optional — auto: PO-0001)</label>' +
    '<input class="v4-in" id="v4poRef" placeholder="e.g., October restock">' +
    '<div style="display:flex;gap:5px;margin:6px 0 8px">' +
      ['all','sellable','raw'].map(function(f){
        var lbl = { all:'📋 All', sellable:'🛒 Sellable', raw:'🧪 Raw Material' }[f];
        return '<button class="v4PChip' + (v4po.filter === f ? ' active' : '') + '" style="flex:1" onclick="v4poSetFilter(\'' + f + '\')">' + lbl + '</button>';
      }).join('') +
    '</div>' +
    '<input class="v4-in" id="v4poSearch" placeholder="🔍 Search product…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px" oninput="v4po.q=this.value.toLowerCase();v4poRenderList()">' +
    '<div id="v4poList" style="max-height:35vh;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:8px"></div>' +
    '<div id="v4poSummary" style="font-size:13px;font-weight:700;color:#2563eb;text-align:center;padding:8px"></div>' +
    '<button class="v4-btn g" onclick="v4poSave()">📝 Create Order</button>';
  v4poRenderList();
}
function v4poSetFilter(f) { v4po.filter = f; v4poRenderList(); }
function v4poRenderList() {
  var box = document.getElementById('v4poList'); if (!box) return;
  var rows = v4products.filter(function(p){
    if (p.isVirtual) return false;
    if (v4po.filter === 'sellable' && p.sellDirectly === false) return false;
    if (v4po.filter === 'raw' && p.sellDirectly !== false) return false;
    if (v4po.q && p.name.toLowerCase().indexOf(v4po.q) === -1) return false;
    return true;
  });
  if (!rows.length) { box.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px">No products found.</p>'; v4poSummary(); return; }
  var html = '';
  rows.forEach(function(p){
    var low = (!p.isVirtual && p.stock <= (p.reorderLevel || 5));
    html += '<div style="display:flex;align-items:center;gap:6px;padding:7px 4px;border-bottom:1px solid #f1f5f9">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:600;font-size:13px">' + sanitize(p.name) + (low ? ' <span style="color:#ef4444">⚠️</span>' : '') + '</div>' +
        '<small style="color:#64748b">Stock: ' + p.stock + ' ' + (p.unit||'') + ' · cost ' + fmtMoney(p.costPrice) + '</small>' +
      '</div>' +
      '<input type="number" id="poQty_' + p.id + '" value="" placeholder="0" min="0" style="width:70px;padding:7px;border:1px solid #cbd5e1;border-radius:8px;text-align:center;font-size:13px" oninput="v4poSummary()">' +
      '</div>';
  });
  box.innerHTML = html;
  v4poSummary();
}
function v4poSelected() {
  var items = [];
  v4products.forEach(function(p){
    if (p.isVirtual) return;
    var el = document.getElementById('poQty_' + p.id);
    if (el) {
      var q = parseFloat(el.value) || 0;
      if (q > 0) items.push({ productId: p.id, name: p.name, unit: p.unit||'', qty: q, unitCost: p.costPrice || 0 });
    }
  });
  return items;
}
function v4poSummary() {
  var el = document.getElementById('v4poSummary'); if (!el) return;
  var items = v4poSelected();
  if (!items.length) { el.textContent = ''; return; }
  var total = items.reduce(function(s,i){ return s + i.qty * i.unitCost; }, 0);
  el.textContent = '🛒 ' + items.length + ' item(s) — Estimated total: ' + fmtMoney(total);
}
async function v4poSave() {
  var supId = document.getElementById('v4poSupplier').value;
  var items = v4poSelected();
  if (!supId) { alert('Select a supplier.'); return; }
  if (!items.length) { alert('Enter a quantity for at least one product.'); return; }
  var total = items.reduce(function(s,i){ return s + i.qty * i.unitCost; }, 0);
  var customRef = document.getElementById('v4poRef').value.trim();
  var orderNo = customRef || ('PO-' + String(v4sp.orders.length + 1).padStart(4, '0'));
  if (!await confirm('Create order ' + orderNo + '?\n\n' + items.length + ' items · estimated ' + fmtMoney(total))) return;
  try {
    const { error } = await supabaseClient.from('purchase_orders').insert([{
      firebase_id: 'po_' + Date.now(), shop_id: getShopId(), supplier_id: supId,
      items: items, received_items: [], cancelled_items: [],
      total: total, status: 'pending',
      date: new Date().toISOString().slice(0,10), order_no: orderNo
    }]);
    if (error) throw error;
    await v4spRefresh();
    var s = v4spSupplier(supId);
    if (s && s.phone) {
      var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
      var msg = '📦 PURCHASE ORDER ' + orderNo + ' — ' + shop + '\n' + new Date().toLocaleDateString() + '\n\n';
      items.forEach(function(i){ msg += '• ' + i.name + ' — ' + i.qty + ' ' + (i.unit||'') + '\n'; });
      msg += '\nEstimated total: ' + fmtMoney(total) + '\nPlease confirm availability and delivery date.\n\n— ' + shop;
      if (await confirm('✅ Order created!\n\n📤 Send it to ' + s.name + ' on WhatsApp now?')) {
        window.open('https://wa.me/' + s.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(msg), '_blank');
      }
    } else {
      alert('✅ Order ' + orderNo + ' created!');
    }
    v4spCloseModal();
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ RECEIVE / CANCEL DIALOG — every item gets a destiny ═══
function v4spReceive(id) {
  var o = v4spOrder(id); if (!o) return;
  if (o.status !== 'pending' && o.status !== 'partially_received') { alert('This order is closed.'); return; }
  v4spModal('📥 Receive / Cancel — ' + sanitize(o.orderNo));
  window._v4spRecvCxl = {};
  var html = '<p style="font-size:12px;color:#64748b;margin-bottom:8px">For each item choose: <b>type delivered quantity</b> (📥 stock added) · tap <b>🚫</b> to cancel that item (no stock) · or leave at 0 (⏳ stays pending for next delivery).</p>';
  (o.items || []).forEach(function(item, idx){
    html += '<div id="recvRow_' + idx + '" style="display:flex;align-items:center;gap:6px;padding:8px 4px;border-bottom:1px solid #f1f5f9;border-radius:8px">' +
      '<div style="flex:1;min-width:0"><b style="font-size:13px">' + sanitize(item.name) + '</b><br>' +
      '<small style="color:#64748b">Ordered: ' + item.qty + ' ' + (item.unit||'') + ' @ ' + fmtMoney(item.unitCost||0) + '</small></div>' +
      '<div style="text-align:center;flex-shrink:0"><small style="color:#64748b;font-size:9px;font-weight:800">DELIVERED</small><br>' +
      '<input type="number" id="recvQty_' + idx + '" value="' + item.qty + '" min="0" max="' + item.qty + '" style="width:64px;padding:7px;border:1px solid #cbd5e1;border-radius:8px;text-align:center;font-size:13px" oninput="v4spRecvTotal(\'' + id + '\')"></div>' +
      '<button type="button" id="recvCxl_' + idx + '" class="btn-mini" style="background:#ef4444;color:#fff;flex-shrink:0" title="Cancel this item" onclick="v4spRecvToggle(' + idx + ',\'' + id + '\')">🚫</button>' +
      '</div>';
  });
  html += '<div id="v4spRecvTotalBox" style="text-align:right;font-weight:700;color:#2563eb;margin:10px 0;font-size:14px"></div>' +
    '<button class="v4-btn g" onclick="v4spRecvGo(\'' + id + '\', false)">📥 Save — Receive &amp; Cancel Selected<br><small style="font-weight:400;font-size:11px;opacity:.9">items at 0 stay PENDING for next delivery</small></button>' +
    '<button class="v4-btn" style="background:#dc2626;margin-top:6px" onclick="v4spRecvGo(\'' + id + '\', true)">🚫 Cancel ALL Remaining &amp; Close Order<br><small style="font-weight:400;font-size:11px;opacity:.9">delivered items get stock · everything else cancelled — order closes</small></button>';
  document.getElementById('v4spToolBody').innerHTML = html;
  v4spRecvTotal(id);
}
function v4spRecvToggle(idx, id) {
  var w = window._v4spRecvCxl;
  w[idx] = !w[idx];
  var row = document.getElementById('recvRow_' + idx);
  var input = document.getElementById('recvQty_' + idx);
  var btn = document.getElementById('recvCxl_' + idx);
  if (w[idx]) {
    row.style.background = 'rgba(239,68,68,.12)';
    input.disabled = true; input.value = '0';
    btn.textContent = '↩️';
    btn.title = 'Undo cancel — item stays pending';
  } else {
    row.style.background = '';
    input.disabled = false;
    var o = v4spOrder(id);
    if (o && o.items[idx]) input.value = o.items[idx].qty;
    btn.textContent = '🚫';
    btn.title = 'Cancel this item';
  }
  v4spRecvTotal(id);
}
function v4spRecvTotal(id) {
  var o = v4spOrder(id); if (!o) return;
  var total = 0, any = false, cxlCount = 0;
  (o.items || []).forEach(function(item, idx){
    var el = document.getElementById('recvQty_' + idx); if (!el) return;
    var q = parseFloat(el.value) || 0;
    if (window._v4spRecvCxl[idx]) { cxlCount++; return; }
    if (q > 0) { total += q * (item.unitCost||0); any = true; }
  });
  var box = document.getElementById('v4spRecvTotalBox');
  if (box) box.innerHTML = (any ? '📥 Delivery value: <span style="color:#059669">' + fmtMoney(total) + '</span>' : '📥 Nothing selected to receive') +
    (cxlCount > 0 ? ' · 🚫 ' + cxlCount + ' cancelled' : '');
}
async function v4spRecvGo(id, cancelRemaining) {
  var o = v4spOrder(id); if (!o) return;
  var delivered = [], remaining = [], cancelledNow = [];
  (o.items || []).forEach(function(item, idx){
    var cxl = !!window._v4spRecvCxl[idx];
    var el = document.getElementById('recvQty_' + idx);
    var q = (el && !el.disabled) ? (parseFloat(el.value) || 0) : 0;
    if (q > 0) delivered.push({ item: item, qty: q });
    else if (cxl) cancelledNow.push(item);
    else remaining.push(item);
  });
  if (cancelRemaining) { cancelledNow = cancelledNow.concat(remaining); remaining = []; }
  if (!delivered.length && !cancelledNow.length) {
    alert('Nothing chosen yet.\n\n• Type a delivered quantity, and/or\n• tap 🚫 on items to cancel them.');
    return;
  }
  var msg = '';
  if (delivered.length) msg += '📥 RECEIVE ' + delivered.length + ' item(s) — stock added\n';
  if (cancelledNow.length) msg += '🚫 CANCEL ' + cancelledNow.length + ' item(s) — no stock change\n';
  if (remaining.length) msg += '⏳ ' + remaining.length + ' item(s) stay PENDING';
  else msg += '📦 Order closes';
  if (!await confirm('Save this delivery?\n\n' + msg)) return;
  try {
    // 1. stock + purchase log for delivered items only
    for (var i = 0; i < delivered.length; i++) {
      var d = delivered[i];
      var product = v4products.find(function(p){ return p.id === d.item.productId; });
      if (product) {
        const { error: prodErr } = await v4ById(supabaseClient.from('products').update({ stock: (product.stock||0) + d.qty }), d.item.productId);
        if (prodErr) console.warn('Stock update failed:', prodErr.message);
        product.stock = (product.stock||0) + d.qty;
      }
      try {
        await supabaseClient.from('purchases').insert([{
          shop_id: getShopId(), product_id: d.item.productId,
          date: new Date().toISOString().slice(0,10),
          qty: d.qty, cost_per_unit: d.item.unitCost || 0,
          reason: 'Supplier Delivery (' + o.orderNo + ')'
        }]);
      } catch(e) {}
    }
    // 2. remember the full story
    if (!o.receivedItems) o.receivedItems = [];
    if (!o.cancelledItems) o.cancelledItems = [];
    delivered.forEach(function(d){
      o.receivedItems.push({ productId: d.item.productId, name: d.item.name, unit: d.item.unit||'', qty: d.qty, unitCost: d.item.unitCost||0 });
    });
    cancelledNow.forEach(function(item){
      o.cancelledItems.push({ productId: item.productId, name: item.name, unit: item.unit||'', qty: item.qty, unitCost: item.unitCost||0, cancelled_at: new Date().toISOString() });
    });
    o.items = remaining;
    // 3. status: open if pending items remain; else received (or cancelled if nothing was ever received)
    o.status = remaining.length > 0 ? 'partially_received'
             : (o.receivedItems.length > 0 ? 'received' : 'cancelled');
    var remainingTotal = remaining.reduce(function(s,x){ return s + (x.qty * (x.unitCost||0)); }, 0);
    o.total = remainingTotal;
    await supabaseClient.from('purchase_orders')
      .update({ items: remaining, received_items: o.receivedItems, cancelled_items: o.cancelledItems,
                status: o.status, total: remainingTotal })
      .eq('firebase_id', id);
    v4spCloseModal();
    await v4spRefresh();
    if (typeof v4LoadProducts === 'function') await v4LoadProducts();
    var result = '';
    if (delivered.length) result += '✅ Received ' + delivered.length + ' item(s).';
    if (cancelledNow.length) result += '\n🚫 Cancelled ' + cancelledNow.length + ' item(s).';
    if (remaining.length) result += '\n📦 ' + remaining.length + ' item(s) still pending.';
    alert(result);
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ WHOLE-ORDER CANCEL (emergency) ═══
async function v4spCancelOrder(id) {
  var o = v4spOrder(id); if (!o) return;
  if (!await confirm('Cancel the WHOLE order ' + o.orderNo + '?\n\nAll ' + (o.items||[]).length + ' pending item(s) cancelled — no stock change.\n(Tip: to cancel only SOME items, use 📥 Receive and tap 🚫 on them.)')) return;
  try {
    if (!o.cancelledItems) o.cancelledItems = [];
    (o.items || []).forEach(function(item){
      o.cancelledItems.push({ productId: item.productId, name: item.name, unit: item.unit||'', qty: item.qty, unitCost: item.unitCost||0, cancelled_at: new Date().toISOString() });
    });
    const { error } = await supabaseClient.from('purchase_orders')
      .update({ status: 'cancelled', items: [], cancelled_items: o.cancelledItems, total: 0 })
      .eq('firebase_id', id);
    if (error) throw error;
    await v4spRefresh();
    alert('✅ Order cancelled (items recorded in history).');
  } catch(e) { alert('❌ ' + e.message); }
}
function v4spDeleteOrder(id) {
  var o = v4spOrder(id); if (!o) return;
  v4spModal('🗑️ Delete Order — ' + sanitize(o.orderNo));
  document.getElementById('v4spToolBody').innerHTML =
    '<p style="font-size:12px;color:#64748b;margin-bottom:12px">Deleting removes the order record completely. Stock already received stays received.</p>' +
    '<button class="v4-btn" style="background:#dc2626;margin-bottom:8px" onclick="v4spDeleteOrderGo(\'' + id + '\')">🗑️ Delete permanently</button>' +
    '<button class="v4-btn o" onclick="v4spCloseModal()">✖ Cancel</button>';
}
async function v4spDeleteOrderGo(id) {
  try {
    const { error } = await supabaseClient.from('purchase_orders').delete().eq('firebase_id', id);
    if (error) throw error;
    v4spCloseModal();
    await v4spRefresh();
    alert('✅ Order deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ EDIT ORDER ═══
function v4spEditOrder(id) {
  var o = v4spOrder(id); if (!o) return;
  if (o.status !== 'pending' && o.status !== 'partially_received') { alert('Closed orders cannot be edited (history is protected).'); return; }
  v4spModal('✏️ Edit Order — ' + sanitize(o.orderNo));
  var html = '<label style="font-size:11px;font-weight:800;color:#475569">Status</label>' +
    '<select class="v4-in" id="v4spEStatus">' +
    ['pending','partially_received'].map(function(s){
      return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' +
        { pending:'⏳ Pending', partially_received:'↩️ Partially received' }[s] + '</option>';
    }).join('') + '</select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Pending items — edit qty &amp; cost</label>' +
    '<div style="max-height:35vh;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:8px">';
  (o.items || []).forEach(function(item, idx){
    html += '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #f1f5f9">' +
      '<span style="flex:1.5;font-size:12px;font-weight:600;min-width:0">' + sanitize(item.name) + '</span>' +
      '<input type="number" id="eoQty_' + idx + '" value="' + item.qty + '" min="0" style="width:62px;padding:6px;border:1px solid #cbd5e1;border-radius:6px;text-align:center;font-size:12px" oninput="v4spEOCalc()">' +
      '<input type="number" id="eoCost_' + idx + '" value="' + (item.unitCost||0) + '" min="0" style="width:80px;padding:6px;border:1px solid #cbd5e1;border-radius:6px;text-align:center;font-size:12px" oninput="v4spEOCalc()">' +
      '</div>';
  });
  html += '</div><div id="v4spEOTotal" style="text-align:right;font-weight:700;color:#2563eb;margin:8px 0"></div>' +
    '<button class="v4-btn g" onclick="v4spEditOrderSave(\'' + id + '\')">💾 Save Changes</button>';
  document.getElementById('v4spToolBody').innerHTML = html;
  window._v4spEO = { id: id };
  v4spEOCalc();
}
function v4spEOCalc() {
  var o = v4spOrder(window._v4spEO ? window._v4spEO.id : null); if (!o) return;
  var total = 0;
  (o.items || []).forEach(function(item, idx){
    var qEl = document.getElementById('eoQty_' + idx); if (!qEl) return;
    var q = parseFloat(qEl.value) || 0;
    var c = parseFloat(document.getElementById('eoCost_' + idx).value) || 0;
    total += q * c;
  });
  var box = document.getElementById('v4spEOTotal');
  if (box) box.textContent = 'Pending total: ' + fmtMoney(total);
}
async function v4spEditOrderSave(id) {
  var o = v4spOrder(id); if (!o) return;
  var updated = [], newTotal = 0;
  (o.items || []).forEach(function(item, idx){
    var q = parseFloat(document.getElementById('eoQty_' + idx).value) || 0;
    var c = parseFloat(document.getElementById('eoCost_' + idx).value) || 0;
    if (q > 0) {
      updated.push({ productId: item.productId, name: item.name, unit: item.unit||'', qty: q, unitCost: c });
      newTotal += q * c;
    }
  });
  try {
    const { error } = await supabaseClient.from('purchase_orders')
      .update({ status: document.getElementById('v4spEStatus').value, items: updated, total: newTotal })
      .eq('firebase_id', id);
    if (error) throw error;
    v4spCloseModal();
    await v4spRefresh();
    alert('✅ Order updated.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ ANALYTICS ═══
function v4spPeriodChips() {
  var P = { today:'📅 Today', week:'📅 This Week', month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' + Object.keys(P).map(function(p){
    return '<button class="v4PChip' + (v4sp.period === p ? ' active' : '') + '" onclick="v4spSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
  }).join('') + '</div>';
}
function v4spSetPeriod(p) {
  v4sp.period = p;
  var chips = document.querySelector('#v4spToolModal .v4PChips');
  if (chips) chips.outerHTML = v4spPeriodChips();
  var body = document.getElementById('v4spAnalyticsBody');
  if (body) body.innerHTML = v4spAnalyticsHTML();
}
function v4spAnalyticsHTML() {
  var orders = v4sp.orders.filter(v4spInPeriod);
  var receivedVal = 0, pendingVal = 0, cancelledVal = 0;
  var openCount = 0, doneCount = 0, cancelledOrders = 0;
  orders.forEach(function(o){
    (o.receivedItems || []).forEach(function(i){ receivedVal += i.qty * (i.unitCost||0); });
    (o.cancelledItems || []).forEach(function(i){ cancelledVal += i.qty * (i.unitCost||0); });
    if (o.status === 'pending' || o.status === 'partially_received') { openCount++; pendingVal += o.total; }
    else if (o.status === 'received') doneCount++;
    else if (o.status === 'cancelled') cancelledOrders++;
  });
  function big(v,l,c){ return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:12px 6px;text-align:center"><b style="font-size:15px;display:block;color:' + c + '">' + v + '</b><small style="font-size:9px;font-weight:800;color:#64748b">' + l + '</small></div>'; }
  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
    big(orders.length, '📦 ORDERS (' + v4spPeriodLabel().toUpperCase() + ')', '#3b82f6') +
    big(fmtMoney(receivedVal), '📥 GOODS RECEIVED', '#059669') +
    big(fmtMoney(pendingVal), '⏳ STILL PENDING', '#f97316') +
    big(fmtMoney(cancelledVal), '🚫 CANCELLED', '#94a3b8') +
    '</div>' +
    '<p style="text-align:center;font-size:11px;color:#64748b;margin-top:6px">' + openCount + ' open · ' + doneCount + ' completed · ' + cancelledOrders + ' fully cancelled</p>';
  var bySup = {};
  orders.forEach(function(o){
    var s = v4spSupplier(o.supplierId);
    var n = s ? s.name : 'Unknown supplier';
    if (!bySup[n]) bySup[n] = { count:0, value:0 };
    bySup[n].count++;
    bySup[n].value += (o.receivedItems || []).reduce(function(s2,i){ return s2 + i.qty*(i.unitCost||0); }, 0) +
                      (o.cancelledItems || []).reduce(function(s2,i){ return s2 + i.qty*(i.unitCost||0); }, 0) + o.total;
  });
  var sups = Object.keys(bySup).map(function(n){ return { n:n, v:bySup[n] }; }).sort(function(a,b){ return b.v.value - a.v.value; });
  if (sups.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px">🏭 Order value by supplier</b>';
    sups.forEach(function(x){
      html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + sanitize(x.n) + ' <small style="color:#94a3b8">×' + x.v.count + '</small></span>' +
        '<b>' + fmtMoney(x.v.value) + '</b></div>';
    });
  }
  return html;
}
function v4spOpen(tool) {
  if (tool === 'analytics') {
    v4spModal('📊 Order Analytics');
    document.getElementById('v4spToolBody').innerHTML = v4spPeriodChips() + '<div id="v4spAnalyticsBody">' + v4spAnalyticsHTML() + '</div>';
  }
}

// ═══ ORDERS LIST (open orders + optional history) ═══
function v4spRenderOrders() {
  var box = document.getElementById('v4spOrders'); if (!box) return;
  var orders = v4sp.orders.filter(function(o){
    var open = o.status === 'pending' || o.status === 'partially_received';
    return v4spShowDone ? true : open;
  }).sort(function(a,b){ return (b.date||'') > (a.date||'') ? 1 : -1; });
  var cnt = document.getElementById('v4spOrdCount');
  if (cnt) cnt.textContent = v4sp.orders.filter(function(o){ return o.status === 'pending' || o.status === 'partially_received'; }).length;
  if (!orders.length) {
    box.innerHTML = '<div class="placeholder">' + (v4spShowDone ? 'No orders at all yet.' : '✅ No open orders — everything received or cancelled!') + '</div>';
    return;
  }
  var html = '';
  orders.forEach(function(o){
    var s = v4spSupplier(o.supplierId);
    var supName = s ? s.name : 'Unknown';
    var open = o.status === 'pending' || o.status === 'partially_received';
    var partial = o.status === 'partially_received';
    var borderCol = open ? (partial ? '#f59e0b' : '#0d64f0') : (o.status === 'received' ? '#10b981' : (o.status === 'cancelled' ? '#94a3b8' : '#94a3b8'));
    var statusChip = {
      pending:'<span style="background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">⏳ PENDING</span>',
      partially_received:'<span style="background:#fef3c7;color:#92400e;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">↩️ PARTIAL</span>',
      received:'<span style="background:#d1fae5;color:#065f46;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">✅ RECEIVED</span>',
      cancelled:'<span style="background:#f1f5f9;color:#64748b;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">🚫 CANCELLED</span>'
    }[o.status] || '';
    var itemsStr = (o.items || []).map(function(i){ return i.name + ' ×' + i.qty; }).join(', ');
    html += '<div style="border:1px solid #e2e8f0;border-left:4px solid ' + borderCol + ';border-radius:12px;padding:12px;margin-bottom:10px;' + (open ? '' : 'opacity:.75') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:14px">' + sanitize(o.orderNo) + '</b> ' + statusChip +
        '<span style="font-size:11px;color:#64748b">· ' + sanitize(supName) + ' · ' + (o.date||'') + '</span>';
    if (itemsStr) html += '<br><small style="color:#64748b;font-size:12px">⏳ ' + sanitize(itemsStr) + '</small>';
    if (o.items && o.items.length && (o.receivedItems||[]).length + (o.cancelledItems||[]).length > 0) {
      html += '<br><b style="color:#2563eb;font-size:13px">' + fmtMoney(o.total) + ' pending</b>';
    } else if (!itemsStr) {
      html += '<br><b style="color:#2563eb;font-size:13px">' + fmtMoney(0) + ' pending</b>';
    } else {
      html += '<br><b style="color:#2563eb;font-size:13px">' + fmtMoney(o.total) + '</b>';
    }
    // history lines
    if ((o.receivedItems||[]).length) {
      var rStr = o.receivedItems.map(function(i){ return '✅ ' + i.name + ' ×' + i.qty; }).join(' · ');
      html += '<br><small style="color:#059669;font-size:11px">' + sanitize(rStr) + '</small>';
    }
    if ((o.cancelledItems||[]).length) {
      var cStr = o.cancelledItems.map(function(i){ return '🚫 ' + i.name + ' ×' + i.qty; }).join(' · ');
      html += '<br><small style="color:#94a3b8;font-size:11px;text-decoration:line-through">' + sanitize(cStr) + '</small>';
    }
    html += '</div>' +
      '<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">';
    if (open) {
      html += '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4spReceive(\'' + o.id + '\')">📥 Receive / 🚫 Cancel</button>';
      if (s && s.phone) html += '<button class="btn-mini" style="background:#25D366;color:#fff" onclick="v4spOrderWA(\'' + o.id + '\')">📤 WhatsApp</button>';
      html += '<button class="btn-mini edit" onclick="v4spEditOrder(\'' + o.id + '\')">✏️</button>' +
              '<button class="btn-mini" style="background:#dc2626;color:#fff" onclick="v4spCancelOrder(\'' + o.id + '\')" title="Cancel whole order">❌ All</button>';
    }
    html += '<button class="btn-mini delete" onclick="v4spDeleteOrder(\'' + o.id + '\')">🗑️</button>' +
      '</div></div></div>';
  });
  box.innerHTML = html;
}
function v4spOrderWA(id) {
  var o = v4spOrder(id); if (!o) return;
  var s = v4spSupplier(o.supplierId);
  if (!s || !s.phone) return;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = '📦 PURCHASE ORDER ' + o.orderNo + ' — ' + shop + '\n\n';
  (o.items || []).forEach(function(i){ msg += '• ' + i.name + ' — ' + i.qty + ' ' + (i.unit||'') + '\n'; });
  msg += '\nTotal: ' + fmtMoney(o.total) + '\nPlease confirm availability and delivery date.\n\n— ' + shop;
  window.open('https://wa.me/' + s.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(msg), '_blank');
}

// ═══ SUPPLIERS LIST ═══
function v4spRenderSuppliers() {
  var box = document.getElementById('v4spSuppliers'); if (!box) return;
  var q = (v4sp.q || '').toLowerCase();
  var rows = v4sp.suppliers.filter(function(s){
    if (q && s.name.toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  var cnt = document.getElementById('v4spSupCount'); if (cnt) cnt.textContent = rows.length;
  if (!rows.length) {
    box.innerHTML = '<div class="placeholder">' + (v4sp.suppliers.length ? 'No matches.' : 'No suppliers yet — register your first one above.') + '</div>';
    return;
  }
  var html = '';
  rows.forEach(function(s){
    var orderCount = v4sp.orders.filter(function(o){ return o.supplierId === s.id; }).length;
    html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f1f5f9">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:14px">🏭 ' + sanitize(s.name) + '</b>' +
        '<br><small style="color:#64748b">' + (s.phone ? '📞 ' + sanitize(s.phone) : 'no phone') + (s.address ? ' · ' + sanitize(s.address) : '') + ' · ' + orderCount + ' order' + (orderCount!==1?'s':'') + '</small>' +
      '</div>' +
      '<div style="display:flex;gap:5px;flex-shrink:0">' +
        (s.phone ? '<button class="btn-mini" style="background:#25D366;color:#fff" onclick="v4spWhatsAppSup(\'' + s.id + '\')" title="Message on WhatsApp">📤</button>' : '') +
        '<button class="btn-mini edit" onclick="v4spEditSup(\'' + s.id + '\')">✏️</button>' +
        '<button class="btn-mini delete" onclick="v4spDeleteSup(\'' + s.id + '\')">🗑️</button>' +
      '</div></div>';
  });
  box.innerHTML = html;
}

// ── search / render ──
var v4spSearchT = null;
function v4spSearchInput(v) {
  v4sp.q = v;
  clearTimeout(v4spSearchT);
  v4spSearchT = setTimeout(v4spRenderSuppliers, 300);
}
function v4spRender() {
  v4spHealth();
  v4spRenderOrders();
  v4spRenderSuppliers();
}

// ── tab loader ──
V4_TAB_LOADERS[9] = function() {
  v4spEnsureUI();
  v4spLoad().then(v4spRender);
};
