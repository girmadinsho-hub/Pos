// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — CREDITS MODULE v2 (Step 6)
//  LAW: Settle keeps the record visible (✅ PAID badge) —
//  proof of collection. Delete = the ONLY removal.
//  BONUS: Collected today/this-month counter + settle date.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4cr = { view:'excel', q:'', data:[], _cache:null, showPaid:true };

// ── data: ALL credit sales (unpaid + settled) — one query ──
async function v4crLoad(force) {
  if (v4cr._cache && !force) return v4cr._cache;
  try {
    const { data, error } = await supabaseClient.from('sales')
      .select('id, time, total, customer_name, customer_phone, paid_at, invoice_no, cashier_name')
      .eq('shop_id', getShopId())
      .eq('voided', false)
      .eq('payment_method', 'credit')
      .order('time', { ascending: false })
      .limit(500);
    if (error) throw error;
    v4cr._cache = (data || []).map(function(s){
      return { id:s.id, time:s.time, total:Number(s.total||0),
        customerName:s.customer_name || 'Unknown', customerPhone:s.customer_phone || '',
        paidAt:s.paid_at || null, invoiceNo:s.invoice_no || '', cashierName:s.cashier_name || '' };
    });
  } catch(e) {
    console.warn('Credits load:', e.message);
    v4cr._cache = [];
  }
  v4cr.data = v4cr._cache;
  return v4cr._cache;
}
function v4crRefresh(){ v4cr._cache = null; return v4crLoad(true).then(v4crRender); }

// ── grouping by customer (UNPAID only — who still owes) ──
function v4crCustomers() {
  var map = {};
  v4cr.data.filter(function(c){ return !c.paidAt; }).forEach(function(c){
    var key = c.customerPhone || c.customerName;
    if (!map[key]) map[key] = { name:c.customerName, phone:c.customerPhone, total:0, count:0, newest:c.time, oldest:c.time };
    map[key].total += c.total;
    map[key].count++;
    if (c.time > map[key].newest) map[key].newest = c.time;
    if (c.time < map[key].oldest) map[key].oldest = c.time;
  });
  return Object.values(map).sort(function(a,b){ return b.total - a.total; });
}
function v4crAge(timeStr) {
  var days = Math.floor((Date.now() - new Date(timeStr).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day';
  if (days > 30) return Math.floor(days/30) + 'mo ' + (days%30) + 'd';
  return days + ' days';
}

// ── UI ──
function v4crEnsureUI() {
  var tab = document.getElementById('tab4');
  if (!tab || tab.dataset.crBuilt === '1') return;
  tab.dataset.crBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4crH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;transition:transform .15s;}' +
    '.v4crH:active{transform:scale(.96);}' +
    '.v4crH b{font-size:16px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.v4crH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4crH small{color:#94a3b8;}' +
    '.v4crBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4crBtn:active{transform:scale(.97);}' +
    '.v4crBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4crBtnTx{flex:1;min-width:0;}' +
    '.v4crBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4crBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4crBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4crGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;}' +
    '.v4crPaid{background:rgba(16,185,129,.12);color:#059669;font-size:9px;font-weight:800;padding:2px 7px;border-radius:6px;white-space:nowrap;}' +
    '</style>' +

    '<div class="card" style="padding:12px" id="v4crHealth"></div>' +

    '<div class="card" style="padding:12px">' +
      '<div class="v4crGrid">' +
        '<button class="v4crBtn" style="background:linear-gradient(135deg,#dc2626,#f87171)" onclick="v4crOpen(\'customers\')"><span class="v4crBtnIc">👥</span><span class="v4crBtnTx"><b>Who Owes You</b><small>Unpaid only — total per customer, remind</small></span><span class="v4crBtnGo">›</span></button>' +
        '<button class="v4crBtn" style="background:linear-gradient(135deg,#059669,#34d399)" onclick="v4crOpen(\'collected\')"><span class="v4crBtnIc">✅</span><span class="v4crBtnTx"><b>Collected</b><small>Money you received from credits — proof</small></span><span class="v4crBtnGo">›</span></button>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4crRemindAll()">📤 Remind All — WhatsApp</button>' +
        '<button class="v4-btn p" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4crPrint()">🖨️</button>' +
        '<button class="v4-btn p" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4crCSV()">📄⬇</button>' +
        '<button class="v4-btn o" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4crRefresh()">🔄</button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">💳 Credits <span class="v4-badge" id="v4crCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip active" id="v4crShowPaid" onclick="v4crTogglePaid()">👁️ Show Paid</button>' +
          '<button class="v4-chip active" id="v4crvExcel" onclick="v4crView(\'excel\')">📊 Excel</button>' +
          '<button class="v4-chip" id="v4crvList" onclick="v4crView(\'list\')">📋 List</button>' +
          '<button class="v4-chip" id="v4crvGrid" onclick="v4crView(\'grid\')">⊞ Grid</button>' +
        '</span>' +
      '</div>' +
      '<input class="v4-in" id="v4crSearch" placeholder="🔍 Customer name or phone…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4crSearchInput(this.value)">' +
      '<div id="v4crExcel"></div>' +
      '<div id="v4crList" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
      '<div id="v4crGrid" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
    '</div>';
}

// ── health strip ──
function v4crHealth() {
  var el = document.getElementById('v4crHealth'); if (!el) return;
  var owed = 0, countUnpaid = 0, collectedToday = 0, collectedMonth = 0;
  var today = new Date(); today.setHours(0,0,0,0);
  var mStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  v4cr.data.forEach(function(c){
    if (!c.paidAt) { owed += c.total; countUnpaid++; }
    else {
      var pt = new Date(c.paidAt).getTime();
      if (pt >= today.getTime()) collectedToday += c.total;
      if (pt >= mStart) collectedMonth += c.total;
    }
  });
  var customers = v4crCustomers();
  var old = v4cr.data.filter(function(c){ return !c.paidAt && (Date.now() - new Date(c.time).getTime()) > 30*86400000; });
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    '<div class="v4crH" onclick="v4crOpen(\'customers\')">' +
      (owed > 0 ? '<b style="color:#ef4444">💰 ' + fmtMoney(owed) + '</b>' : '<b style="color:#10b981">✅ ' + fmtMoney(0) + '</b>') +
      '<small>OWED (' + countUnpaid + ')</small></div>' +
    '<div class="v4crH" onclick="v4crOpen(\'collected\')"><b style="color:#10b981">✅ ' + fmtMoney(collectedMonth) + '</b><small>COLLECTED (mo)</small></div>' +
    '<div class="v4crH" onclick="v4crOpen(\'customers\')"><b style="color:#3b82f6">👥 ' + customers.length + '</b><small>OWE YOU</small></div>' +
    '<div class="v4crH" onclick="v4crTogglePaid()">' +
      (old.length > 0 ? '<b style="color:#dc2626">⏰ ' + old.length + '</b>' : '<b style="color:#10b981">⏰ 0</b>') +
      '<small>OVER 30 DAYS</small></div>' +
    '</div>' +
    (collectedToday > 0 ? '<div style="text-align:center;margin-top:8px;font-size:12px;font-weight:700;color:#059669">✅ Collected today: ' + fmtMoney(collectedToday) + '</div>' : '');
}

// ── modal system ──
function v4crModal(title) {
  v4crCloseModal();
  var m = document.createElement('div');
  m.id = 'v4crToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4crCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4crToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4crCloseModal(); });
}
function v4crCloseModal() { var m = document.getElementById('v4crToolModal'); if (m) m.remove(); }

// ── who owes you (unpaid grouped) ──
function v4crCustomersHTML() {
  var custs = v4crCustomers();
  if (!custs.length) return '<p style="text-align:center;padding:26px;font-weight:800;color:#10b981;font-size:15px">✅ Nobody owes you anything!</p>';
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var html = '';
  custs.forEach(function(c){
    var old = (Date.now() - new Date(c.oldest).getTime()) > 30*86400000;
    var col = old ? '#dc2626' : '#f97316';
    html += '<div style="padding:10px;border-bottom:1px solid #f1f5f9">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div><b style="font-size:14px">👤 ' + sanitize(c.name) + '</b>' +
      (c.phone ? '<br><small style="color:#64748b">📞 ' + sanitize(c.phone) + ' · ' + c.count + ' credit sale' + (c.count>1?'s':'') + ' · oldest ' + v4crAge(c.oldest) + '</small>' : '') +
      '</div>' +
      '<div style="text-align:right">' +
      '<b style="color:' + col + ';font-size:16px">' + fmtMoney(c.total) + '</b><br>' +
      (c.phone ? '<a href="https://wa.me/' + c.phone.replace(/[^0-9]/g,'') + '?text=' + encodeURIComponent('Hello ' + c.name + ', friendly reminder: your credit balance is ' + fmtMoney(c.total) + '. Thank you! — ' + shop) + '" target="_blank" style="background:#25D366;color:#fff;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:11px;font-weight:800">📤 Remind</a>' : '') +
      '</div></div></div>';
  });
  return html;
}

// ── collected history (settled records = proof) ──
function v4crCollectedHTML() {
  var paid = v4cr.data.filter(function(c){ return c.paidAt; })
    .sort(function(a,b){ return new Date(b.paidAt) - new Date(a.paidAt); });
  if (!paid.length) return '<p style="text-align:center;padding:26px;color:#64748b;font-size:14px">No credits settled yet.\nWhen you tap 💰 Settle, the record appears here as proof of collection.</p>'.replace('\n','<br>');
  var today = new Date(); today.setHours(0,0,0,0);
  var tTotal = 0, mTotal = 0;
  paid.forEach(function(c){
    var pt = new Date(c.paidAt).getTime();
    if (pt >= today.getTime()) tTotal += c.total;
    if (pt >= new Date(today.getFullYear(), today.getMonth(), 1).getTime()) mTotal += c.total;
  });
  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">' +
    '<div style="background:rgba(16,185,129,.12);border-radius:10px;padding:10px;text-align:center"><b style="font-size:17px;color:#059669;display:block">' + fmtMoney(tTotal) + '</b><small style="font-size:10px;font-weight:800;color:#64748b">COLLECTED TODAY</small></div>' +
    '<div style="background:rgba(16,185,129,.12);border-radius:10px;padding:10px;text-align:center"><b style="font-size:17px;color:#059669;display:block">' + fmtMoney(mTotal) + '</b><small style="font-size:10px;font-weight:800;color:#64748b">THIS MONTH</small></div></div>';
  paid.slice(0, 50).forEach(function(c){
    html += '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
      '<span>✅ <b>' + sanitize(c.customerName) + '</b> <small style="color:#64748b">paid ' + new Date(c.paidAt).toLocaleDateString() + '</small></span>' +
      '<b style="color:#059669">' + fmtMoney(c.total) + '</b></div>';
  });
  return html;
}

// ── modal opener ──
function v4crOpen(tool) {
  if (tool === 'customers') {
    v4crModal('👥 Who Owes You — Unpaid');
    document.getElementById('v4crToolBody').innerHTML = v4crCustomersHTML();
  } else if (tool === 'collected') {
    v4crModal('✅ Collected — Your Proof');
    document.getElementById('v4crToolBody').innerHTML = v4crCollectedHTML();
  }
}

// ── remind all (unpaid customers with phone) ──
async function v4crRemindAll() {
  var custs = v4crCustomers().filter(function(c){ return c.phone; });
  if (!custs.length) { alert('No phone numbers on your unpaid credit sales.\nAdd customer phone when selling on credit — then reminders work.'); return; }
  if (!await confirm('📤 Send payment reminders?\n\n' + custs.length + ' customer(s) will get a friendly WhatsApp message.\nEach message opens in WhatsApp — you tap send there.')) return;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  custs.forEach(function(c, i){
    var msg = 'Hello ' + c.name + ', friendly reminder: your credit balance is ' + fmtMoney(c.total) + '. Thank you! — ' + shop;
    setTimeout(function(){
      window.open('https://wa.me/' + c.phone.replace(/[^0-9]/g,'') + '?text=' + encodeURIComponent(msg), '_blank');
    }, i * 1200);
  });
}

// ── rows (respect showPaid toggle + search) ──
function v4crRows() {
  var q = (v4cr.q || '').toLowerCase();
  return v4cr.data.filter(function(c){
    if (!v4cr.showPaid && c.paidAt) return false;
    if (!q) return true;
    return (c.customerName || '').toLowerCase().indexOf(q) !== -1 ||
           (c.customerPhone || '').indexOf(q) !== -1;
  });
}
function v4crTogglePaid() {
  v4cr.showPaid = !v4cr.showPaid;
  var chip = document.getElementById('v4crShowPaid');
  if (chip) { chip.classList.toggle('active', v4cr.showPaid); chip.textContent = v4cr.showPaid ? '👁️ Show Paid' : '🙈 Paid hidden'; }
  v4crRenderView();
}

// ── table ──
function v4crTable(rows) {
  var ex = document.getElementById('v4crExcel'); if (!ex) return;
  if (!rows.length) {
    ex.innerHTML = '<div class="placeholder">' +
      (v4cr.data.length ? 'No records match (paid records hidden — tap 👁️ Show Paid).' : 'No credit sales yet.') + '</div>';
    window.v4creditTable = null; return;
  }
  var alive = ex.querySelector('.modern-sheet-table');
  if (!window.v4creditTable || !alive) {
    ex.innerHTML = '';
    window.v4creditTable = new ModernSheet('v4crExcel', { data: rows, columns: [
      { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
      { title:'Customer', width:'125px', render:function(i,h){
          if (!h) return i.customerName + (i.paidAt ? ' ✅' : '');
          return '<b>' + sanitize(i.customerName) + '</b>' + (i.paidAt ? ' <span class="v4crPaid">✅ PAID</span>' : '');
        } },
      { title:'Phone', field:'customerPhone', width:'100px' },
      { title:'Status', width:'82px', render:function(i,h){
          if (!h) return i.paidAt ? 'Paid' : 'Unpaid';
          return i.paidAt
            ? '<span style="color:#059669;font-weight:800">✅ Paid ' + new Date(i.paidAt).toLocaleDateString() + '</span>'
            : '<span style="color:#ef4444;font-weight:800">⏳ Unpaid</span>';
        }, filterable:true },
      { title:'Amount', field:'total', width:'92px', align:'right',
        render:function(i,h){ return h?'<b style="color:'+(i.paidAt?'#059669':'#ef4444')+'">'+fmtMoney(i.total)+'</b>':i.total; } },
      { title:'Age', width:'72px', render:function(i,h){
          if (i.paidAt) return h ? '<span style="color:#94a3b8">—</span>' : '';
          var d = Math.floor((Date.now() - new Date(i.time).getTime())/86400000);
          var col = d > 30 ? '#dc2626' : (d > 7 ? '#f97316' : '#64748b');
          return h?'<span style="color:'+col+';font-weight:700">'+v4crAge(i.time)+'</span>':v4crAge(i.time);
        } },
      { title:'Date', field:'time', width:'100px', render:function(i,h){ return h?formatDate(i.time):i.time; } },
      { title:'Actions', width:'165px', render:function(i,h){
          if (!h) return i.paidAt ? 'delete' : 'settle,edit,delete';
          if (i.paidAt) {
            return '<button class="btn-mini delete" onclick="v4crDelete(\'' + i.id + '\')">🗑️ Remove</button>';
          }
          return '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4crSettle(\'' + i.id + '\')">💰 Settle</button> ' +
                 '<button class="btn-mini edit" onclick="v4crEdit(\'' + i.id + '\')">✏️</button> ' +
                 '<button class="btn-mini delete" onclick="v4crDelete(\'' + i.id + '\')">🗑️</button>';
        }, filterable:false }
    ], emptyMessage:'No credits', showSearch:false, showFontSlider:true });
  } else window.v4creditTable.setData(rows);
}

// ── settle: STAYS VISIBLE with ✅ PAID (the Captain's law) ──
async function v4crSettle(id) {
  var c = v4cr.data.find(function(x){ return x.id === id; });
  if (!c) return;
  if (!await confirm('💰 Mark as FULLY PAID?\n\n' + c.customerName + ' — ' + fmtMoney(c.total) +
      '\n\nThe record STAYS in the list with a ✅ PAID badge (your proof of collection).\nRemove it later with 🗑️ when you no longer need it.')) return;
  try {
    const { error } = await supabaseClient.from('sales').update({ paid_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    c.paidAt = new Date().toISOString();
    v4crRender();
    alert('✅ ' + c.customerName + ' settled — ' + fmtMoney(c.total) + ' collected!\nThe record stays as ✅ PAID (proof).');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── undo settle (bonus: mistakes happen) ──
async function v4crUnsettle(id) {
  var c = v4cr.data.find(function(x){ return x.id === id; });
  if (!c) return;
  if (!await confirm('↩️ Undo — mark as UNPAID again?\n\n' + c.customerName + ' — ' + fmtMoney(c.total))) return;
  try {
    const { error } = await supabaseClient.from('sales').update({ paid_at: null }).eq('id', id);
    if (error) throw error;
    c.paidAt = null;
    v4crRender();
    alert('✅ Back to unpaid.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── edit ──
async function v4crEdit(id) {
  var c = v4cr.data.find(function(x){ return x.id === id; });
  if (!c) return;
  var name = await prompt('Customer name:', c.customerName);
  if (name === null) return;
  var phone = await prompt('Customer phone:', c.customerPhone);
  if (phone === null) return;
  var amt = parseFloat(await prompt('Total amount:', c.total));
  if (isNaN(amt) || amt <= 0) { alert('Invalid amount.'); return; }
  if (!await confirm('Save changes?\n' + name + ' · ' + phone + ' · ' + fmtMoney(amt))) return;
  try {
    const { error } = await supabaseClient.from('sales')
      .update({ customer_name: name.trim(), customer_phone: phone.trim(), total: amt })
      .eq('id', id);
    if (error) throw error;
    v4crRefresh();
    alert('✅ Credit updated.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── delete = the ONLY removal ──
async function v4crDelete(id) {
  var c = v4cr.data.find(function(x){ return x.id === id; });
  if (!c) return;
  if (!await confirm('Remove this credit record from the list?\n\n' + c.customerName + ' — ' + fmtMoney(c.total) + (c.paidAt ? ' (✅ paid)' : '') +
      '\n\nThe sale stays in your Sales records as income. Stock is not changed.')) return;
  try {
    const { error } = await supabaseClient.from('sales').update({ paid_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    v4crRefresh();
    alert('✅ Record removed from the list.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── search / views ──
var v4crSearchT = null;
function v4crSearchInput(v) {
  v4cr.q = v;
  clearTimeout(v4crSearchT);
  v4crSearchT = setTimeout(function(){ v4S.crlpage = 1; v4S.crgpage = 1; v4crRenderView(); }, 300);
}
function v4crView(v) {
  v4cr.view = v; v4S.crlpage = 1; v4S.crgpage = 1;
  var ids = { excel:'v4crvExcel', list:'v4crvList', grid:'v4crvGrid' };
  Object.keys(ids).forEach(function(k){ var el = document.getElementById(ids[k]); if (el) el.classList.toggle('active', k === v); });
  var ex = document.getElementById('v4crExcel'), li = document.getElementById('v4crList'), gr = document.getElementById('v4crGrid');
  if (ex) ex.style.display = v === 'excel' ? 'block' : 'none';
  if (li) li.style.display = v === 'list' ? 'block' : 'none';
  if (gr) gr.style.display = v === 'grid' ? 'grid' : 'none';
  v4crRenderView();
}
function v4crMoreList(){ v4S.crlpage = (v4S.crlpage||1) + 1; v4crRenderView(); }
function v4crMoreGrid(){ v4S.crgpage = (v4S.crgpage||1) + 1; v4crRenderView(); }
function v4crListRows(rows) {
  return rows.map(function(c){
    return { label: (c.paidAt ? '✅ ' : '👤 ') + sanitize(c.customerName),
             detail: (c.customerPhone ? '📞 ' + sanitize(c.customerPhone) + ' · ' : '') + formatDate(c.time) +
               (c.paidAt ? ' · PAID ' + new Date(c.paidAt).toLocaleDateString() : ' · ' + v4crAge(c.time)),
             right: fmtMoney(c.total) };
  });
}

// ── print / csv (UNPAID only — the collection list) ──
function v4crPrint() {
  var rows = v4crRows().filter(function(c){ return !c.paidAt; });
  if (!rows.length) { alert('No unpaid credits to print.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var total = rows.reduce(function(s,c){ return s + c.total; }, 0);
  var body = rows.map(function(c, i){
    return '<tr><td>' + (i+1) + '</td><td><b>' + sanitize(c.customerName) + '</b>' + (c.customerPhone ? '<br><small>' + sanitize(c.customerPhone) + '</small>' : '') + '</td><td style="text-align:right">' + fmtMoney(c.total) + '</td><td>' + v4crAge(c.time) + '</td></tr>';
  }).join('');
  w.document.write('<html><head><title>Credit List</title><style>body{font-family:monospace;padding:14px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">' + sanitize(shop) + ' — Unpaid Credit List</h3>' +
    '<p style="text-align:center;font-size:11px">' + rows.length + ' unpaid · total ' + fmtMoney(total) + ' · ' + new Date().toLocaleDateString() + '</p>' +
    '<table><tr><th>#</th><th>Customer</th><th>Amount</th><th>Age</th></tr>' + body + '</table>' +
    '<p style="text-align:right;font-weight:bold;margin-top:8px">TOTAL TO COLLECT: ' + fmtMoney(total) + '</p></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}
function v4crCSV() {
  var rows = v4crRows();
  if (!rows.length) { alert('Nothing to export.'); return; }
  var csv = '\uFEFFCustomer,Phone,Amount,Status,Settled Date,Original Date,Age,Cashier,Invoice\n' + rows.map(function(c){
    return '"' + c.customerName + '","' + c.customerPhone + '",' + c.total.toFixed(2) + ',"' + (c.paidAt ? 'PAID' : 'UNPAID') + '","' + (c.paidAt ? new Date(c.paidAt).toLocaleDateString() : '') + '","' + formatDate(c.time) + '","' + v4crAge(c.time) + '","' + (c.cashierName||'') + '","' + c.invoiceNo + '"';
  }).join('\n');
  var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'credits_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

// ── render pipeline ──
function v4crRenderView() {
  var rows = v4crRows();
  var cnt = document.getElementById('v4crCount'); if (cnt) cnt.textContent = rows.length;
  if (v4cr.view === 'excel') v4crTable(rows);
  else if (v4cr.view === 'list') v4PagList('v4crList', v4crListRows(rows), 'crlpage', 20, 'v4crMoreList');
  else v4PagGrid('v4crGrid', v4crListRows(rows), 'crgpage', 12, 'v4crMoreGrid');
}
async function v4crRender() {
  await v4crLoad();
  v4crHealth();
  v4crRenderView();
}

// ── tab loader ──
V4_TAB_LOADERS[4] = function() {
  v4crEnsureUI();
  v4crRender();
};
