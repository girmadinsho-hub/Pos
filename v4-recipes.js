// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — RECIPES MODULE v2 (Step 11) · 160%
//  v2 ORDERS: tappable health tiles (each opens its list) ·
//  virtual-first product picker (small, no price) · LIVE
//  formulation math (qty/yield→cost/suggested instantly) ·
//  image from phone gallery + video paste · day-of-week
//  production heatmap + cost watchlist + Chef's Standard
//  guide (WhatsApp/print) · ingredient Days-of-Cover
//  forecast with run-out list.
//  KEPT: batch scaler · auto-cost · sub-recipes · analytics.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4rc = { data:[], q:'', period:'month', batch:1 };

// ── units & conversion (v3 keeper) ──
var V4RC_UNITS = ['kg','gram','litre','ml','cup','glass','spoon','piece','bottle','dish','bundle','pack'];
function v4rcConv(from, to) {
  if (!from || !to) return 1;
  from = String(from).toLowerCase(); to = String(to).toLowerCase();
  if (from === to) return 1;
  var units = { mg:0.001, g:1, gram:1, kg:1000, ml:1, l:1000, litre:1000, liter:1000, cup:240, glass:200, piece:1, pc:1, dozen:12, spoon:15, bottle:1, dish:1, bundle:1, pack:1 };
  var groups = [['mg','g','gram','kg'], ['ml','l','liter','litre','cup','glass'], ['piece','pc','dozen','spoon','bottle','dish','bundle','pack']];
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].indexOf(from) !== -1 && groups[i].indexOf(to) !== -1) return units[from] / units[to];
  }
  return 1;
}

// ── period helpers ──
function v4rcPeriodStart(p) {
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
function v4rcPeriodLabel() {
  return { today:'Today', week:'This Week', month:'This Month', year:'This Year', all:'All Time' }[v4rc.period] || 'This Month';
}

// ── data ──
async function v4rcLoad() {
  try {
    const { data, error } = await supabaseClient.from('recipes').select('*').eq('shop_id', getShopId()).order('created_at', { ascending: false });
    if (error) throw error;
    v4rc.data = (data || []).map(function(r){
      var prod = v4products.find(function(p){ return p.id === r.product_id; });
      return { id: r.id, productId: r.product_id,
        productName: prod ? prod.name : (r.name || 'Unknown'),
        yield: Number(r.yield||1), items: r.items || [],
        instructions: r.instructions || '',
        imageUrls: Array.isArray(r.image_url) ? r.image_url : (r.image_url ? [r.image_url] : []),
        videoUrls: Array.isArray(r.video_url) ? r.video_url : (r.video_url ? [r.video_url] : []),
        overhead: Number(r.overhead||0), contingency: Number(r.contingency||0),
        targetMargin: Number(r.target_margin||0) };
    });
  } catch(e) { console.warn('Recipes load:', e.message); v4rc.data = []; }
  return v4rc.data;
}
async function v4rcRefresh(){ await v4rcLoad(); v4rcRender(); }
function v4rcProduct(id) { return v4products.find(function(p){ return p.id === id; }); }
function v4rcRecipe(id) { return v4rc.data.find(function(r){ return r.id === id; }); }
function v4rcRecipeForProduct(pid) { return v4rc.data.find(function(r){ return r.productId === pid; }); }

// ── cost engine ──
function v4rcIngredientCost(item) {
  var ing = v4rcProduct(item.ingredientId);
  if (!ing) return 0;
  return (item.qty||0) * (item.factor||1) * (ing.costPrice||0);
}
function v4rcCost(r) {
  var total = 0;
  (r.items || []).forEach(function(item){ total += v4rcIngredientCost(item); });
  return total;
}
function v4rcTrueCostPerPortion(r) {
  var y = r.yield || 1;
  var perPortion = y > 0 ? v4rcCost(r) / y : 0;
  return perPortion * (1 + ((r.overhead||0) + (r.contingency||0)) / 100);
}
function v4rcMargin(r) {
  var prod = v4rcProduct(r.productId);
  if (!prod || !prod.price) return null;
  var tc = v4rcTrueCostPerPortion(r);
  return (prod.price - tc) / prod.price * 100;
}
function v4rcMarginBadge(r) {
  var m = v4rcMargin(r);
  if (m === null) return '';
  var tm = (r.targetMargin||0) > 0 ? r.targetMargin : 40;
  if (m < 0) return '<span style="background:#fef2f2;color:#dc2626;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">🔻 LOSS ' + m.toFixed(0) + '%</span>';
  if (m < tm * 0.7) return '<span style="background:#fff7ed;color:#ea580c;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">⚠️ thin ' + m.toFixed(0) + '%</span>';
  return '<span style="background:#ecfdf5;color:#059669;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">✅ ' + m.toFixed(0) + '%</span>';
}

// ── availability ──
function v4rcMakeable(r) {
  var batches = Infinity, missing = [];
  (r.items || []).forEach(function(item){
    var ing = v4rcProduct(item.ingredientId);
    if (!ing) { missing.push({ name: item.ingredientName || '?', need: 0, have: 0 }); return; }
    var need = (item.qty||0) * (item.factor||1);
    var have = (ing.stock||0);
    if (need <= 0) return;
    var b = have / need;
    if (b < batches) batches = b;
    if (have < need) missing.push({ name: ing.name, need: need, have: have, unit: ing.unit||'' });
  });
  if (batches === Infinity) batches = 0;
  return { batches: Math.floor(batches), missing: missing };
}

// ── ⏳ ingredient velocity + days-of-cover (bounded) ──
function v4rcVelocity() {
  var cache = (typeof SS_PERF !== 'undefined' && SS_PERF.detailedCache) ? SS_PERF.detailedCache : [];
  if (!cache || cache.length < 8) return null;
  var newest = new Date(cache[0].time).getTime();
  var oldest = new Date(cache[cache.length - 1].time).getTime();
  var days = (newest - oldest) / 86400000;
  if (days < 0.5) days = 0.5;
  var eaten = {};   // ingredient name → total base-units consumed via recipes
  cache.forEach(function(s){
    (s.items || []).forEach(function(i){
      var r = v4rcRecipeForProduct(i.productId);
      if (!r) return;
      var perPortion = 1 / (r.yield || 1);
      (r.items || []).forEach(function(ing){
        var need = (ing.qty||0) * (ing.factor||1) * perPortion * (i.qty||0);
        eaten[ing.ingredientName] = (eaten[ing.ingredientName] || 0) + need;
      });
    });
  });
  var perName = {};
  Object.keys(eaten).forEach(function(n){ perName[n] = eaten[n] / days; });
  return { days: days, perName: perName };
}
function v4rcIngCover(name, vel) {
  if (!vel || !vel.perName) return null;
  var v = vel.perName[name];
  if (!v || v <= 0) return null;
  var ing = v4products.find(function(p){ return p.name === name; });
  if (!ing) return null;
  return { days: (ing.stock||0) / v, unit: ing.unit || '', stock: ing.stock||0, rate: v };
}

// ═══ UI ═══
function v4rcEnsureUI() {
  var tab = document.getElementById('tab18');
  if (!tab || tab.dataset.rcBuilt === '1') return;
  tab.dataset.rcBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4rcH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;transition:transform .15s;}' +
    '.v4rcH:active{transform:scale(.96);}' +
    '.v4rcH b{font-size:13px;display:block;word-break:break-word;line-height:1.25;}' +
    '.v4rcH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4rcH small{color:#94a3b8;}' +
    '.v4rcBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4rcBtn:active{transform:scale(.97);}' +
    '.v4rcBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4rcBtnTx{flex:1;min-width:0;}' +
    '.v4rcBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4rcBtnBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4rcBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4rcBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '.v4BChips{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin:8px 0;}' +
    '.v4BChip{padding:8px 14px;border-radius:12px;border:2px solid #cbd5e1;background:#fff;font-size:13px;font-weight:800;cursor:pointer;color:#64748b;}' +
    '.v4BChip.active{background:#ea580c;color:#fff;border-color:#ea580c;}' +
    'body.dark .v4BChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '</style>' +

    '<div class="card" style="padding:12px" id="v4rcHealth"></div>' +

    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">' +
        '<button class="v4rcBtn" style="background:linear-gradient(135deg,#059669,#34d399)" onclick="v4rcOpen(\'create\')"><span class="v4rcBtnIc">➕</span><span class="v4rcBtnTx"><b>New Recipe</b><small>Build a product — ingredients, costs, media</small></span><span class="v4rcBtnGo">›</span></button>' +
        '<button class="v4rcBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)" onclick="v4rcOpen(\'analytics\')"><span class="v4rcBtnIc">📊</span><span class="v4rcBtnTx"><b>Analytics</b><small>Production, consumption, cover &amp; forecast</small></span><span class="v4rcBtnGo">›</span></button>' +
        '<button class="v4rcBtn" style="background:linear-gradient(135deg,#ea580c,#fb923c)" onclick="v4rcOpen(\'cover\')"><span class="v4rcBtnIc">⏳</span><span class="v4rcBtnTx"><b>Raw Material Forecast</b><small>How many days your ingredients last</small></span><span class="v4rcBtnGo">›</span></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">🍳 Recipes <span class="v4-badge" id="v4rcCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip" onclick="v4rcRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<input class="v4-in" id="v4rcSearch" placeholder="🔍 Recipe or product name…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4rcSearchInput(this.value)">' +
      '<div id="v4rcList"></div>' +
    '</div>';
}

// ── health strip (ALL tiles tappable → open their list) ──
function v4rcHealth() {
  var el = document.getElementById('v4rcHealth'); if (!el) return;
  var total = v4rc.data.length;
  var losing = v4rc.data.filter(function(r){ var m = v4rcMargin(r); return m !== null && m < 0; });
  var thin = v4rc.data.filter(function(r){ var m = v4rcMargin(r); return m !== null && m >= 0 && m < ((r.targetMargin||40) * 0.7); });
  var makeable = v4rc.data.filter(function(r){ return v4rcMakeable(r).batches > 0; });
  function H(v,l,c,tap){ return '<div class="v4rcH" onclick="v4rcOpen(\'' + tap + '\')"><b style="color:' + c + '">' + v + '</b><small>' + l + '</small></div>'; }
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    H(total, '🍳 RECIPES', '#3b82f6', 'listAll') +
    H(makeable.length, '✅ MAKEABLE NOW', '#10b981', 'listMakeable') +
    H(thin.length, '⚠️ THIN MARGIN', thin.length > 0 ? '#f97316' : '#94a3b8', 'listThin') +
    H(losing.length, '🔻 LOSING MONEY', losing.length > 0 ? '#ef4444' : '#10b981', 'listLosing') +
    '</div>';
}

// ── modal ──
function v4rcModal(title, wide) {
  v4rcCloseModal();
  var m = document.createElement('div');
  m.id = 'v4rcToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:' + (wide ? '640px' : '560px') + ';margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4rcCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4rcToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4rcCloseModal(); });
}
function v4rcCloseModal() { var m = document.getElementById('v4rcToolModal'); if (m) m.remove(); }

// ═══ TILE LIST MODALS (order #1) ═══
function v4rcListHTML(rows, emptyMsg) {
  if (!rows.length) return '<p style="text-align:center;padding:24px;font-weight:800;color:#10b981;font-size:14px">' + emptyMsg + '</p>';
  var html = '';
  rows.forEach(function(r){
    var prod = v4rcProduct(r.productId);
    var tc = v4rcTrueCostPerPortion(r);
    var m = v4rcMargin(r);
    var mk = v4rcMakeable(r);
    html += '<div style="padding:10px 0;border-bottom:1px solid #f1f5f9">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:14px">🍳 ' + sanitize(r.productName) + '</b><br>' +
        '<small style="color:#64748b">cost/portion ' + fmtMoney(tc) + (prod && prod.price ? ' · sells ' + fmtMoney(prod.price) : '') +
        ' · ' + (mk.batches > 0 ? '✅ ' + mk.batches + ' batch' + (mk.batches>1?'es':'') + ' makeable' : '⛔ stock missing') + '</small>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
        (m !== null ? '<b style="color:' + (m < 0 ? '#dc2626' : (m < 30 ? '#ea580c' : '#059669')) + ';font-size:15px">' + m.toFixed(0) + '%</b><br>' : '') +
        '<button class="btn-mini edit" onclick="v4rcOpen(\'edit\',\'' + r.id + '\')">✏️ Fix</button>' +
      '</div></div></div>';
  });
  return html;
}
function v4rcListModal(title, rows, emptyMsg) {
  v4rcModal(title);
  document.getElementById('v4rcToolBody').innerHTML = v4rcListHTML(rows, emptyMsg);
}

// ═══ RECIPE CARDS ═══
function v4rcRows() {
  var q = (v4rc.q || '').toLowerCase();
  return v4rc.data.filter(function(r){
    if (q && r.productName.toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
function v4rcRender() {
  v4rcHealth();
  var box = document.getElementById('v4rcList'); if (!box) return;
  var rows = v4rcRows();
  var cnt = document.getElementById('v4rcCount'); if (cnt) cnt.textContent = rows.length;
  if (!rows.length) {
    box.innerHTML = '<div class="placeholder">🍳 No recipes yet — create your first one above.<br><small>Recipes turn raw materials into finished products with honest costs.</small></div>';
    return;
  }
  var html = '';
  rows.forEach(function(r){
    var prod = v4rcProduct(r.productId);
    var cost = v4rcCost(r);
    var tc = v4rcTrueCostPerPortion(r);
    var mk = v4rcMakeable(r);
    var isSub = v4rc.data.some(function(x){ return x.id !== r.id && (x.items||[]).some(function(i){ return i.ingredientId === r.productId; }); });
    html += '<div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:15px">🍳 ' + sanitize(r.productName) + '</b>' +
        (isSub ? ' <span style="background:#ede9fe;color:#5b21b6;font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px">🧪 SUB-RECIPE</span>' : '') +
        '<br><small style="color:#64748b">' + (r.items||[]).length + ' ingredients · yield ' + (r.yield||1) + ' · cost/batch ' + fmtMoney(cost) + ' · true cost/portion ' + fmtMoney(tc) + '</small>' +
        '<br>' + v4rcMarginBadge(r) +
        (mk.batches > 0
          ? ' <span style="background:#ecfdf5;color:#059669;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">✅ ' + mk.batches + ' batch' + (mk.batches>1?'es':'') + ' makeable now</span>'
          : ' <span style="background:#fef2f2;color:#dc2626;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px">⛔ stock missing</span>') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">' +
        '<button class="btn-mini" style="background:#0d64f0;color:#fff" onclick="v4rcOpenView(\'' + r.id + '\')" title="Chef standard + guide">📖 Chef</button>' +
        '<button class="btn-mini" style="background:#ea580c;color:#fff" onclick="v4rcOpenBatch(\'' + r.id + '\')">🧮 Batch</button>' +
        '<button class="btn-mini edit" onclick="v4rcOpen(\'edit\',\'' + r.id + '\')">✏️</button>' +
        '<button class="btn-mini delete" onclick="v4rcDelete(\'' + r.id + '\')">🗑️</button>' +
      '</div></div></div>';
  });
  box.innerHTML = html;
}

// ═══ BATCH SCALER ═══
function v4rcOpenBatch(id) {
  var r = v4rcRecipe(id); if (!r) return;
  v4rc.batch = 1;
  window._v4rcBatch = { id: id };
  v4rcModal('🧮 Batch Scaler — ' + sanitize(r.productName), true);
  v4rcBatchRender();
}
function v4rcBatchRender() {
  var w = window._v4rcBatch; if (!w) return;
  var r = v4rcRecipe(w.id); if (!r) return;
  var b = v4rc.batch || 1;
  var html =
    '<div class="v4BChips">' +
    [1,2,3,5,10].map(function(x){
      return '<button class="v4BChip' + (b === x ? ' active' : '') + '" onclick="v4rcSetBatch(' + x + ')">' + x + '×</button>';
    }).join('') +
    '<input type="number" class="v4-in" style="width:80px;margin:0;padding:8px;text-align:center;font-weight:800;font-size:14px" value="' + (b % 1 === 0 ? b : '') + '" placeholder="×?" min="0.1" step="0.5" oninput="if(parseFloat(this.value)>0){v4rc.batch=parseFloat(this.value);v4rcBatchRenderBody();}">' +
    '<span style="font-size:12px;color:#64748b;font-weight:700">batches → ' + (b * (r.yield||1)) + ' portions</span>' +
    '</div>' +
    '<div id="v4rcBatchBody">' + v4rcBatchBodyHTML(r, b) + '</div>';
  document.getElementById('v4rcToolBody').innerHTML = html;
}
function v4rcSetBatch(x) { v4rc.batch = x; v4rcBatchRender(); }
function v4rcBatchRenderBody() {
  var w = window._v4rcBatch; if (!w) return;
  var r = v4rcRecipe(w.id); if (!r) return;
  var body = document.getElementById('v4rcBatchBody');
  if (body) body.innerHTML = v4rcBatchBodyHTML(r, v4rc.batch || 1);
}
function v4rcBatchBodyHTML(r, b) {
  var html = '<table style="width:100%;font-size:13px;border-collapse:collapse">' +
    '<thead><tr style="background:#f8fafc"><th style="text-align:left;padding:7px">Ingredient</th><th style="text-align:right;padding:7px">For ' + b + ' batch' + (b!==1?'es':'') + '</th><th style="text-align:right;padding:7px">Cost</th><th style="text-align:center;padding:7px">Stock ✔</th></tr></thead><tbody>';
  var total = 0, allOk = true;
  (r.items || []).forEach(function(item){
    var ing = v4rcProduct(item.ingredientId);
    var need = (item.qty||0) * (item.factor||1) * b;
    var cost = v4rcIngredientCost(item) * b;
    total += cost;
    var ok = ing ? ((ing.stock||0) >= need) : false;
    if (!ok) allOk = false;
    var needStr = need >= 10 ? Math.round(need) : Math.round(need * 100) / 100;
    html += '<tr style="border-bottom:1px solid #f1f5f9">' +
      '<td style="padding:7px"><b>' + sanitize(item.ingredientName || (ing ? ing.name : '?')) + '</b>' +
      (item.unit && ing && String(item.unit).toLowerCase() !== String(ing.unit||'').toLowerCase() ? '<br><small style="color:#94a3b8">base: ' + ing.unit + '</small>' : '') + '</td>' +
      '<td style="text-align:right;padding:7px;font-weight:800">' + needStr + ' ' + (item.unit||'') + '</td>' +
      '<td style="text-align:right;padding:7px;color:#ef4444">' + fmtMoney(cost) + '</td>' +
      '<td style="text-align:center;padding:7px">' + (ok ? '✅' : '⛔ <small style="color:#dc2626">' + (ing ? (ing.stock||0) + ' left' : '—') + '</small>') + '</td>' +
      '</tr>';
  });
  var tcPortion = v4rcTrueCostPerPortion(r);
  var trueTotal = tcPortion * (r.yield||1) * b;
  html += '</tbody></table>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px"><span><b>Total ingredient cost</b></span><b>' + fmtMoney(total) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#7c3aed"><span><b>True cost (+' + (r.overhead||0) + '% ovh +' + (r.contingency||0) + '% cont)</b></span><b>' + fmtMoney(trueTotal) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#059669"><span><b>Cost per portion</b></span><b>' + fmtMoney(tcPortion) + '</b></div>' +
    '<div style="text-align:center;margin:6px 0;font-size:12px;font-weight:700;color:' + (allOk ? '#059669' : '#dc2626') + '">' + (allOk ? '✅ Your stock covers this batch' : '⛔ Some ingredients are short — see ✔ column') + '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4rcBatchWA()">📤 Send to Kitchen</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4rcBatchPrint()">🖨️ Print</button>' +
    '</div>';
  return html;
}
function v4rcBatchText() {
  var w = window._v4rcBatch; if (!w) return '';
  var r = v4rcRecipe(w.id); if (!r) return '';
  var b = v4rc.batch || 1;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = '🍳 BATCH SHEET — ' + r.productName + ' × ' + b + ' (' + (b * (r.yield||1)) + ' portions)\n' + shop + ' · ' + new Date().toLocaleDateString() + '\n\n';
  (r.items || []).forEach(function(item){
    var need = (item.qty||0) * (item.factor||1) * b;
    var needStr = need >= 10 ? Math.round(need) : Math.round(need * 100) / 100;
    msg += '• ' + (item.ingredientName || '?') + ' — ' + needStr + ' ' + (item.unit||'') + '\n';
  });
  msg += '\nTrue cost: ' + fmtMoney(v4rcTrueCostPerPortion(r) * (r.yield||1) * b) + ' · per portion ' + fmtMoney(v4rcTrueCostPerPortion(r)) + '\n— SmartShop Pro';
  return msg;
}
function v4rcBatchWA() {
  var msg = v4rcBatchText(); if (!msg) return;
  var phone = prompt('Send batch sheet to which WhatsApp number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Batch sheet copied!'); });
}
function v4rcBatchPrint() {
  var w = window._v4rcBatch; if (!w) return;
  var r = v4rcRecipe(w.id); if (!r) return;
  var b = v4rc.batch || 1;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var win = window.open('', '_blank', 'width=420,height=650');
  if (!win) { alert('Allow popups to print.'); return; }
  var body = (r.items || []).map(function(item){
    var need = (item.qty||0) * (item.factor||1) * b;
    var needStr = need >= 10 ? Math.round(need) : Math.round(need * 100) / 100;
    return '<tr><td><b>' + sanitize(item.ingredientName||'?') + '</b></td><td style="text-align:right;font-weight:bold">' + needStr + ' ' + (item.unit||'') + '</td></tr>';
  }).join('');
  win.document.write('<html><head><title>Batch Sheet</title><style>body{font-family:monospace;padding:14px;font-size:14px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:7px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center;margin-bottom:2px">' + sanitize(shop) + '</h3>' +
    '<h2 style="text-align:center;margin:0 0 4px">🍳 ' + sanitize(r.productName) + ' — ×' + b + ' BATCH</h2>' +
    '<p style="text-align:center;font-size:11px;margin:0 0 10px">' + (b*(r.yield||1)) + ' portions · ' + new Date().toLocaleDateString() + '</p>' +
    '<table><tr><th>Ingredient</th><th style="text-align:right">Amount</th></tr>' + body + '</table>' +
    '<p style="text-align:center;font-size:11px;color:#666;margin-top:10px">True cost: ' + fmtMoney(v4rcTrueCostPerPortion(r) * (r.yield||1) * b) + ' · per portion ' + fmtMoney(v4rcTrueCostPerPortion(r)) + '</p></body></html>');
  win.document.close(); win.focus();
  setTimeout(function(){ win.print(); }, 400);
}

// ═══ CHEF'S STANDARD (guide + formulation — order #5) ═══
function v4rcChefText(r) {
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = '👨‍🍳 CHEF STANDARD — ' + r.productName + '\n' + shop + '\n\n🧪 FORMULATION (per 1 portion):\n';
  (r.items || []).forEach(function(item){
    var ing = v4rcProduct(item.ingredientId);
    var baseUnit = ing ? (ing.unit||'') : '';
    var kitchenQty = Math.round(((item.qty||0) / (r.yield||1)) * 10000) / 10000;
    var baseQty = Math.round((((item.qty||0) * (item.factor||1)) / (r.yield||1)) * 10000) / 10000;
    var line = '• ' + (item.ingredientName||'?') + ' — ' + kitchenQty + ' ' + (item.unit||'');
    if (baseUnit && Math.abs(baseQty - kitchenQty) > 0.000001) line += ' (= ' + baseQty + ' ' + baseUnit + ')';
    msg += line + '\n';
  });
  msg += '\nYield: ' + (r.yield||1) + ' portion(s) · True cost/portion: ' + fmtMoney(v4rcTrueCostPerPortion(r)) + '\n';
  if (r.instructions) msg += '\n📝 INSTRUCTIONS:\n' + r.instructions + '\n';
  msg += '\n— SmartShop Pro Kitchen Standard';
  return msg;
}
function v4rcOpenView(id) {
  var r = v4rcRecipe(id); if (!r) return;
  v4rcModal('👨‍🍳 Chef Standard — ' + sanitize(r.productName), true);
  window._v4rcChef = { id: id };
  var html = '';
  if ((r.items||[]).length) {
    html += '<b style="font-size:13px">🧪 Formulation (per 1 portion — the standard)</b><div style="background:#f8fafc;padding:10px;border-radius:8px;margin:6px 0 12px;font-size:13px">';
    r.items.forEach(function(item){
      var ing = v4rcProduct(item.ingredientId);
      var baseUnit = ing ? (ing.unit||'') : '';
      var kitchenQty = Math.round(((item.qty||0) / (r.yield||1)) * 10000) / 10000;
      var baseQty = Math.round((((item.qty||0) * (item.factor||1)) / (r.yield||1)) * 10000) / 10000;
      var label = kitchenQty + ' ' + (item.unit||'');
      if (baseUnit && Math.abs(baseQty - kitchenQty) > 0.000001) label += '  (= ' + baseQty + ' ' + baseUnit + ')';
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee">' +
        '<span>' + sanitize(item.ingredientName||'?') + (item.critical === false ? ' <small style="color:#94a3b8">(optional)</small>' : '') + '</span><b style="color:#475569">' + label + '</b></div>';
    });
    html += '</div>';
  }
  if (r.instructions) {
    html += '<b style="font-size:13px">📝 Instructions</b>' +
      '<div style="white-space:pre-wrap;background:#fef3c7;padding:10px;border-radius:8px;margin:6px 0 12px;font-size:13px;line-height:1.5">' + sanitize(r.instructions) + '</div>';
  }
  if (r.imageUrls.length) {
    html += '<b style="font-size:13px">🖼️ Standard photos</b>';
    r.imageUrls.forEach(function(url){
      var u = String(url).trim();
      if (u.indexOf('data:image') === 0 || u.indexOf('http') === 0) {
        html += '<img src="' + u + '" style="width:100%;border-radius:8px;margin:5px 0" onerror="this.style.display=\'none\'">';
      }
    });
    html += '<div style="height:8px"></div>';
  }
  if (r.videoUrls.length) {
    html += '<b style="font-size:13px">🎥 Training videos</b>';
    r.videoUrls.forEach(function(url){
      var u = String(url).trim();
      var embed = u;
      if (u.indexOf('watch?v=') !== -1) embed = u.replace('watch?v=', 'embed/');
      if (u.indexOf('youtu.be/') !== -1) embed = u.replace('youtu.be/', 'youtube.com/embed/');
      if (embed.indexOf('youtube.com/embed/') !== -1) {
        html += '<iframe src="' + embed + '" style="width:100%;height:220px;border:none;border-radius:8px;margin:5px 0" allowfullscreen></iframe>';
      } else {
        html += '<a href="' + u + '" target="_blank" style="display:block;margin:5px 0;color:#2563eb;font-size:13px">▶ Watch Video Here</a>';
      }
    });
  }
  if (!html) html = '<p style="text-align:center;color:#94a3b8;padding:20px">No formulation, guide, or media provided.</p>';
  html += '<div style="display:flex;gap:6px;margin-top:10px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4rcChefWA()">📤 Send to Chef</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4rcChefPrint()">🖨️ Print Standard</button>' +
    '</div>';
  document.getElementById('v4rcToolBody').innerHTML = html;
}
function v4rcChefWA() {
  var w = window._v4rcChef; if (!w) return;
  var r = v4rcRecipe(w.id); if (!r) return;
  var msg = v4rcChefText(r);
  var phone = prompt('Send the chef standard to which WhatsApp number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Chef standard copied!'); });
}
function v4rcChefPrint() {
  var w = window._v4rcChef; if (!w) return;
  var r = v4rcRecipe(w.id); if (!r) return;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var win = window.open('', '_blank', 'width=420,height=650');
  if (!win) { alert('Allow popups to print.'); return; }
  var body = (r.items || []).map(function(item){
    var kitchenQty = Math.round(((item.qty||0) / (r.yield||1)) * 10000) / 10000;
    return '<tr><td>' + sanitize(item.ingredientName||'?') + '</td><td style="text-align:right;font-weight:bold">' + kitchenQty + ' ' + (item.unit||'') + '</td></tr>';
  }).join('');
  win.document.write('<html><head><title>Chef Standard</title><style>body{font-family:monospace;padding:14px;font-size:14px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:7px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center;margin-bottom:2px">' + sanitize(shop) + '</h3>' +
    '<h2 style="text-align:center;margin:0 0 4px">👨‍🍳 ' + sanitize(r.productName) + ' — STANDARD</h2>' +
    '<p style="text-align:center;font-size:11px;margin:0 0 10px">per 1 portion · yield ' + (r.yield||1) + '</p>' +
    '<table><tr><th>Ingredient</th><th style="text-align:right">Amount</th></tr>' + body + '</table>' +
    (r.instructions ? '<div style="white-space:pre-wrap;font-size:12px;margin-top:10px;border-top:1px dashed #999;padding-top:8px">' + sanitize(r.instructions) + '</div>' : '') +
    '<p style="text-align:center;font-size:11px;color:#666;margin-top:10px">True cost/portion: ' + fmtMoney(v4rcTrueCostPerPortion(r)) + '</p></body></html>');
  win.document.close(); win.focus();
  setTimeout(function(){ win.print(); }, 400);
}

// ═══ RECIPE EDITOR (v2: virtual-first picker, LIVE math, phone images) ═══
var v4rce = { id:null, productId:null, items:[], filter:'all', q:'', virtualOnly:true };
function v4rcOpen(mode, id) {
  if (mode === 'analytics') { v4rcAnalyticsOpen(); return; }
  if (mode === 'cover') { v4rcCoverOpen(); return; }
  if (mode === 'listAll')     { v4rcListModal('🍳 All Recipes (' + v4rc.data.length + ')', v4rc.data.slice(), 'No recipes yet.'); return; }
  if (mode === 'listMakeable'){ v4rcListModal('✅ Makeable Now', v4rc.data.filter(function(r){ return v4rcMakeable(r).batches > 0; }), 'Nothing makeable — check ingredient stock.'); return; }
  if (mode === 'listThin')    { v4rcListModal('⚠️ Thin Margin', v4rc.data.filter(function(r){ var m = v4rcMargin(r); return m !== null && m >= 0 && m < ((r.targetMargin||40) * 0.7); }), 'No thin-margin recipes — healthy!'); return; }
  if (mode === 'listLosing')  { v4rcListModal('🔻 Losing Money — fix prices!', v4rc.data.filter(function(r){ var m = v4rcMargin(r); return m !== null && m < 0; }), 'No recipes losing money!'); return; }
  var r = id ? v4rcRecipe(id) : null;
  v4rce.id = r ? r.id : null;
  v4rce.productId = r ? r.productId : null;
  v4rce.items = r ? JSON.parse(JSON.stringify(r.items || [])) : [];
  v4rce.filter = 'all'; v4rce.q = '';
  v4rce.virtualOnly = true;
  v4rcModal((r ? '✏️ Edit Recipe — ' + sanitize(r.productName) : '➕ New Recipe'), true);
  v4rceRender(r);
}
function v4rceRender(r) {
  // 2️⃣ ORDER: virtual-first toggle + plain small names (no price)
  var virtuals = v4products.filter(function(p){ return p.isVirtual && p.sellDirectly !== false; });
  var others = v4products.filter(function(p){ return !p.isVirtual && p.sellDirectly !== false; });
  var prodOpts = '';
  if (virtuals.length) {
    prodOpts += '<optgroup label="🧪 Virtual (made by recipe)">';
    virtuals.forEach(function(p){
      prodOpts += '<option value="' + p.id + '"' + (v4rce.productId === p.id ? ' selected' : '') + ' style="font-size:13px">' + sanitize(p.name) + '</option>';
    });
    prodOpts += '</optgroup>';
  }
  if (!v4rce.virtualOnly && others.length) {
    prodOpts += '<optgroup label="🛒 Other sellable">';
    others.forEach(function(p){
      prodOpts += '<option value="' + p.id + '"' + (v4rce.productId === p.id ? ' selected' : '') + ' style="font-size:13px">' + sanitize(p.name) + '</option>';
    });
    prodOpts += '</optgroup>';
  }
  if (!prodOpts) prodOpts = '<option value="">— no products yet —</option>';
  var html =
    '<label style="font-size:11px;font-weight:800;color:#475569">This recipe makes which product? <small>(🧪 virtual first)</small></label>' +
    '<select class="v4-in" style="font-size:13px" id="v4rceProd" onchange="v4rcePick()">' +
      (v4rce.productId ? '' : '<option value="">— select a product —</option>') + prodOpts + '</select>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b;cursor:pointer;margin:4px 0 2px"><input type="checkbox"' + (!v4rce.virtualOnly ? ' checked' : '') + ' onchange="v4rce.virtualOnly=!this.checked;v4rceRenderDialog()"> 🛒 also show non-virtual sellable products</label>' +
    '<div id="v4rcePickInfo"></div>' +
    '<div style="display:flex;gap:5px;margin:8px 0">' +
      ['all','raw','sellable'].map(function(f){
        var lbl = { all:'📋 All', raw:'🧪 Raw', sellable:'🛒 Sellable' }[f];
        return '<button class="v4PChip' + (v4rce.filter === f ? ' active' : '') + '" style="flex:1" onclick="v4rceSetFilter(\'' + f + '\')">' + lbl + '</button>';
      }).join('') +
    '</div>' +
    '<input class="v4-in" id="v4rceSearch" placeholder="🔍 Search ingredient…" style="padding:8px 12px;margin:0 0 6px 0;font-size:13px;height:36px" oninput="v4rce.q=this.value.toLowerCase();v4rceRenderIngList()">' +
    '<div id="v4rceIngList" style="max-height:25vh;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:6px"></div>' +
    '<div style="height:10px"></div>' +
    '<div style="display:flex;gap:6px;align-items:flex-end">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Yield (portions)</label><input type="number" class="v4-in" id="v4rceYield" value="' + (r ? r.yield : 1) + '" min="1" oninput="v4rceRenderItems()"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Overhead %</label><input type="number" class="v4-in" id="v4rceOvh" value="' + (r ? r.overhead : 0) + '" min="0" oninput="v4rceCostBox()"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Conting. %</label><input type="number" class="v4-in" id="v4rceCont" value="' + (r ? r.contingency : 0) + '" min="0" oninput="v4rceCostBox()"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Target margin %</label><input type="number" class="v4-in" id="v4rceMarg" value="' + (r ? r.targetMargin : 40) + '" min="0" max="99" oninput="v4rceCostBox()"></div>' +
    '</div>' +
    '<b style="font-size:13px;display:block;margin-top:8px">🧪 Current formulation <small style="color:#64748b">(live math — watch costs change as you type)</small></b>' +
    '<div id="v4rceItems"></div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">📝 Instructions</label>' +
    '<textarea class="v4-in" id="v4rceInstr" rows="4" placeholder="Step by step preparation…">' + sanitize(r ? r.instructions : '') + '</textarea>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">🖼️ Images — paste links or pick from phone</label>' +
    '<div style="display:flex;gap:6px">' +
      '<textarea class="v4-in" id="v4rceImgs" rows="2" style="flex:1" placeholder="https://… (one per line)">' + sanitize((r ? r.imageUrls : []).join('\n')) + '</textarea>' +
      '<button type="button" class="v4-chip" style="flex:0 0 auto;height:38px" onclick="document.getElementById(\'v4rceImgFile\').click()">📁 Phone</button>' +
    '</div>' +
    '<input type="file" id="v4rceImgFile" accept="image/*" style="display:none" onchange="v4rceImgPick(this)">' +
    '<label style="font-size:11px;font-weight:800;color:#475569;margin-top:6px">🎥 Video — paste link</label>' +
    '<textarea class="v4-in" id="v4rceVids" rows="2" placeholder="https://youtube.com/… (one per line)">' + sanitize((r ? r.videoUrls : []).join('\n')) + '</textarea>' +
    '<div id="v4rceCostBox" style="background:#f8fafc;border-radius:10px;padding:10px;margin:8px 0;font-size:12px"></div>' +
    '<button class="v4-btn g" onclick="v4rceSave()">💾 Save Recipe</button>';
  document.getElementById('v4rcToolBody').innerHTML = html;
  if (v4rce.productId) v4rcePickInfo();
  v4rceRenderIngList();
  v4rceRenderItems();
}
function v4rceRenderDialog() {
  // re-render the whole editor while keeping current input values
  var keep = {
    yield: (document.getElementById('v4rceYield') || {}).value,
    ovh: (document.getElementById('v4rceOvh') || {}).value,
    cont: (document.getElementById('v4rceCont') || {}).value,
    marg: (document.getElementById('v4rceMarg') || {}).value,
    instr: (document.getElementById('v4rceInstr') || {}).value,
    imgs: (document.getElementById('v4rceImgs') || {}).value,
    vids: (document.getElementById('v4rceVids') || {}).value
  };
  v4rceRender(null);
  if (keep.yield) document.getElementById('v4rceYield').value = keep.yield;
  if (keep.ovh) document.getElementById('v4rceOvh').value = keep.ovh;
  if (keep.cont) document.getElementById('v4rceCont').value = keep.cont;
  if (keep.marg) document.getElementById('v4rceMarg').value = keep.marg;
  if (keep.instr) document.getElementById('v4rceInstr').value = keep.instr;
  if (keep.imgs) document.getElementById('v4rceImgs').value = keep.imgs;
  if (keep.vids) document.getElementById('v4rceVids').value = keep.vids;
  v4rceRenderItems();
}
function v4rceImgPick(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    // compress to data URL (v3-trusted method — offline-friendly)
    var img = new Image();
    img.onload = function() {
      var cv = document.createElement('canvas');
      var sc = Math.min(1, 420 / img.width);
      cv.width = img.width * sc; cv.height = img.height * sc;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var b64 = cv.toDataURL('image/jpeg', 0.62);
      var ta = document.getElementById('v4rceImgs');
      if (ta) {
        ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + b64;
        alert('✅ Image added from phone (compressed). Save to attach it.');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}
function v4rcePick() {
  v4rce.productId = document.getElementById('v4rceProd').value || null;
  v4rcePickInfo();
  v4rceCostBox();
}
function v4rcePickInfo() {
  var box = document.getElementById('v4rcePickInfo'); if (!box) return;
  var p = v4rcProduct(v4rce.productId);
  if (!p) { box.innerHTML = ''; return; }
  box.innerHTML = '<div style="background:#eff6ff;border-radius:8px;padding:8px;margin:6px 0;font-size:12px">💡 <b>' + sanitize(p.name) + '</b> — ' + (p.isVirtual ? 'virtual product (stock made by recipe — cost will auto-update)' : 'sellable (has own stock)') + '</div>';
}
function v4rceSetFilter(f) { v4rce.filter = f; v4rceRenderIngList(); }
function v4rceRenderIngList() {
  var box = document.getElementById('v4rceIngList'); if (!box) return;
  var rows = v4products.filter(function(p){
    if (p.id === v4rce.productId) return false;
    if (v4rce.filter === 'raw' && p.sellDirectly !== false) return false;
    if (v4rce.filter === 'sellable' && p.sellDirectly === false) return false;
    if (v4rce.q && p.name.toLowerCase().indexOf(v4rce.q) === -1) return false;
    return true;
  });
  if (!rows.length) { box.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:10px;font-size:12px">No ingredients found.</p>'; return; }
  var html = '';
  rows.forEach(function(p){
    var isSub = v4rcRecipeForProduct(p.id);
    html += '<div style="display:flex;align-items:center;gap:6px;padding:6px 4px;border-bottom:1px solid #f1f5f9">' +
      '<div style="flex:1;min-width:0"><b style="font-size:12px">' + sanitize(p.name) + '</b>' +
      (isSub ? ' <span style="background:#ede9fe;color:#5b21b6;font-size:8px;font-weight:800;padding:1px 5px;border-radius:4px">SUB-RECIPE</span>' : '') +
      '<br><small style="color:#64748b;font-size:11px">Stock: ' + (p.stock||0) + ' ' + (p.unit||'') + ' · cost ' + fmtMoney(p.costPrice) + '</small></div>' +
      '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4rceAddIng(\'' + p.id + '\')">+ Add</button></div>';
  });
  box.innerHTML = html;
}
function v4rceAddIng(pid) {
  var p = v4rcProduct(pid); if (!p) return;
  if (v4rce.items.some(function(i){ return i.ingredientId === pid; })) { alert('Already added!'); return; }
  v4rce.items.push({ ingredientId: pid, ingredientName: p.name, qty: 1, unit: p.unit || 'piece', factor: 1, critical: true });
  v4rceRenderItems();
}
// 3️⃣ LIVE MATH: every keystroke updates row costs + summary
function v4rceRenderItems() {
  var box = document.getElementById('v4rceItems'); if (!box) return;
  if (!v4rce.items.length) { box.innerHTML = '<p style="font-size:11px;color:#94a3b8;margin:4px 0">No ingredients yet — add from the list above.</p>'; v4rceCostBox(); return; }
  var html = '<table style="width:100%;font-size:12px;border-collapse:collapse">' +
    '<thead><tr style="background:#f8fafc"><th style="text-align:left;padding:5px">Ingredient</th><th style="text-align:center;padding:5px">Must</th><th style="text-align:center;padding:5px">Qty &amp; Unit</th><th style="text-align:right;padding:5px">Cost</th><th></th></tr></thead><tbody>';
  v4rce.items.forEach(function(item, idx){
    var ing = v4rcProduct(item.ingredientId);
    var baseUnit = ing ? (ing.unit || 'unit') : 'unit';
    var unitOpts = '';
    if (V4RC_UNITS.indexOf(baseUnit) === -1) V4RC_UNITS.push(baseUnit);
    V4RC_UNITS.forEach(function(u){
      unitOpts += '<option value="' + u + '"' + (item.unit === u ? ' selected' : '') + '>' + u + '</option>';
    });
    var convHtml = '';
    if (item.unit && item.unit !== baseUnit) {
      convHtml = '<div style="margin-top:3px;font-size:10px;color:#64748b">1 ' + item.unit + ' = ' +
        '<input type="number" step="0.0001" value="' + (item.factor||1) + '" style="width:52px;padding:3px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;font-size:10px" oninput="v4rceUpd(' + idx + ')"> ' + baseUnit + '</div>';
    }
    html += '<tr style="border-bottom:1px solid #f1f5f9;vertical-align:top">' +
      '<td style="padding:5px"><b>' + sanitize(item.ingredientName) + '</b><br><small style="color:#94a3b8;font-size:10px">base: ' + baseUnit + '</small></td>' +
      '<td style="padding:5px;text-align:center"><input type="checkbox" ' + (item.critical === false ? '' : 'checked') + ' onchange="v4rce.items[' + idx + '].critical=this.checked"></td>' +
      '<td style="padding:5px"><div style="display:flex;gap:4px">' +
      '<input type="number" value="' + item.qty + '" step="0.001" min="0" style="width:54px;padding:5px;border:1px solid #cbd5e1;border-radius:6px;text-align:center;font-size:12px" oninput="v4rceUpd(' + idx + ', this.value)">' +
      '<select onchange="v4rce.items[' + idx + '].unit=this.value;v4rceRenderItems()" style="width:70px;padding:5px;border:1px solid #cbd5e1;border-radius:6px;font-size:11px">' + unitOpts + '</select>' +
      '</div>' + convHtml + '</td>' +
      '<td style="padding:5px;text-align:right;font-weight:700;color:#ef4444" id="rceCost' + idx + '">—</td>' +
      '<td style="padding:5px"><button class="btn-mini delete" onclick="v4rce.items.splice(' + idx + ',1);v4rceRenderItems()">✖</button></td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
  v4rceCostBox();
}
function v4rceUpd(idx, newQty) {
  // live update of the model + row cost + summary (order #3)
  var item = v4rce.items[idx]; if (!item) return;
  if (newQty !== undefined) item.qty = parseFloat(newQty) || 0;
  // factor input writes directly into the model via its own oninput closure? no — read from DOM:
  var row = document.getElementById('rceCost' + idx);
  if (row) {
    var ing = v4rcProduct(item.ingredientId);
    var cost = (item.qty||0) * (item.factor||1) * (ing ? (ing.costPrice||0) : 0);
    row.textContent = fmtMoney(cost);
  }
  v4rceCostBox();
}
function v4rceCostBox() {
  var box = document.getElementById('v4rceCostBox'); if (!box) return;
  var total = 0;
  v4rce.items.forEach(function(item){
    var ing = v4rcProduct(item.ingredientId);
    total += (item.qty||0) * (item.factor||1) * (ing ? (ing.costPrice||0) : 0);
  });
  var y = parseInt(document.getElementById('v4rceYield').value) || 1;
  var ovh = parseFloat(document.getElementById('v4rceOvh').value) || 0;
  var cont = parseFloat(document.getElementById('v4rceCont').value) || 0;
  var marg = parseFloat(document.getElementById('v4rceMarg').value) || 40;
  var per = y > 0 ? total / y : 0;
  var trueCost = per * (1 + (ovh + cont) / 100);
  var suggested = marg > 0 && marg < 100 ? trueCost / (1 - marg/100) : trueCost;
  var p = v4rcProduct(v4rce.productId);
  var marginLine = '';
  if (p && p.price > 0) {
    var actual = (p.price - trueCost) / p.price * 100;
    marginLine = '<div style="display:flex;justify-content:space-between"><span>Actual margin at ' + fmtMoney(p.price) + '</span><b style="color:' + (actual >= marg ? '#059669' : '#dc2626') + '">' + actual.toFixed(1) + '%</b></div>';
  }
  // update ALL row costs too (full live sync)
  v4rce.items.forEach(function(item, idx){
    var row = document.getElementById('rceCost' + idx);
    if (row) {
      var ing = v4rcProduct(item.ingredientId);
      row.textContent = fmtMoney((item.qty||0) * (item.factor||1) * (ing ? (ing.costPrice||0) : 0));
    }
  });
  box.innerHTML =
    '<div style="display:flex;justify-content:space-between"><span>Ingredient cost (batch of ' + y + ')</span><b>' + fmtMoney(total) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between"><span>True cost / portion</span><b style="color:#7c3aed">' + fmtMoney(trueCost) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between"><span>Suggested price @ ' + marg + '% margin</span><b style="color:#ea580c">' + fmtMoney(suggested) + '</b></div>' +
    marginLine;
}
async function v4rceSave() {
  var productId = v4rce.productId || document.getElementById('v4rceProd').value;
  if (!productId) { alert('Select the product this recipe makes.'); return; }
  var y = parseInt(document.getElementById('v4rceYield').value) || 1;
  var ovh = parseFloat(document.getElementById('v4rceOvh').value) || 0;
  var cont = parseFloat(document.getElementById('v4rceCont').value) || 0;
  var marg = parseFloat(document.getElementById('v4rceMarg').value) || 0;
  var instr = document.getElementById('v4rceInstr').value.trim();
  var imgs = document.getElementById('v4rceImgs').value.trim().split('\n').map(function(u){ return u.trim(); }).filter(function(u){ return u; });
  var vids = document.getElementById('v4rceVids').value.trim().split('\n').map(function(u){ return u.trim(); }).filter(function(u){ return u; });
  var items = v4rce.items.filter(function(i){ return (i.qty||0) > 0; });
  if (!items.length) { alert('Add at least one ingredient with quantity.'); return; }
  var p = v4rcProduct(productId);
  var payload = { shop_id: getShopId(), product_id: productId,
    name: p ? p.name : 'Standard', yield: y, items: items,
    instructions: instr, image_url: imgs, video_url: vids,
    overhead: ovh, contingency: cont, target_margin: marg };
  try {
    if (v4rce.id) {
      const { error } = await supabaseClient.from('recipes').update(payload).eq('id', v4rce.id);
      if (error) throw error;
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await supabaseClient.from('recipes').insert([payload]);
      if (error) throw error;
    }
    var costMsg = '';
    if (p && p.isVirtual) {
      var total = 0, missing = [];
      items.forEach(function(item){
        var ing = v4rcProduct(item.ingredientId);
        if (ing) total += (item.qty||0) * (item.factor||1) * (ing.costPrice||0);
        else missing.push(item.ingredientName);
      });
      var trueCost = Math.round((total / y) * (1 + (ovh + cont) / 100) * 1000) / 1000;
      if (trueCost > 0) {
        const { error: costErr } = await v4ById(supabaseClient.from('products').update({ cost_price: trueCost }), productId);
        if (costErr) throw new Error('Cost update FAILED: ' + costErr.message);
        p.costPrice = trueCost;
        costMsg = '\n\n💰 Product cost auto-updated to ' + fmtMoney(trueCost) + '/portion — honest profit on every sale.';
      } else {
        costMsg = '\n\n⚠️ Cost NOT updated — computed 0.' + (missing.length ? '\nMissing ingredients: ' + missing.join(', ') : '');
      }
    }
    v4rcCloseModal();
    await v4rcRefresh();
    alert('✅ Recipe saved!' + costMsg);
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ DELETE ═══
async function v4rcDelete(id) {
  var r = v4rcRecipe(id); if (!r) return;
  if (!await confirm('🗑️ Delete the recipe for "' + r.productName + '"?\n\nThe product itself is NOT deleted — only its recipe.\nAfter deletion, selling this product will NOT deduct ingredient stock.')) return;
  try {
    const { error } = await supabaseClient.from('recipes').delete().eq('id', id);
    if (error) throw error;
    await v4rcRefresh();
    alert('✅ Recipe deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ RAW MATERIAL FORECAST (order #6) ═══
function v4rcCoverOpen() {
  v4rcModal('⏳ Raw Material Forecast');
  var vel = v4rcVelocity();
  document.getElementById('v4rcToolBody').innerHTML = v4rcCoverHTML(vel);
}
function v4rcCoverHTML(vel) {
  if (!vel) {
    return '<p style="text-align:center;color:#64748b;padding:20px;font-size:13px">📈 Not enough sales data yet to forecast (need a few days of sales).\nOnce your kitchen sells recipe items, this shows exactly how many days each raw material lasts — and what to reorder.</p>'.replace('\n','<br>');
  }
  // collect all ingredients used by recipes
  var ingNames = [];
  v4rc.data.forEach(function(r){
    (r.items || []).forEach(function(item){
      if (ingNames.indexOf(item.ingredientName) === -1) ingNames.push(item.ingredientName);
    });
  });
  var rows = [];
  ingNames.forEach(function(n){
    var c = v4rcIngCover(n, vel);
    if (c) rows.push({ name:n, c:c });
  });
  rows.sort(function(a,b){ return a.c.days - b.c.days; });
  if (!rows.length) {
    return '<p style="text-align:center;color:#64748b;padding:20px;font-size:13px">No consumption recorded yet — forecast activates after your first recipe-based sales.</p>';
  }
  var html = '<p style="font-size:11px;color:#64748b;margin-bottom:8px">Based on your average daily consumption (' + vel.days.toFixed(1) + ' days of sales analyzed). Reorder before the red ones run out!</p>';
  var critical = rows.filter(function(x){ return x.c.days <= 7; });
  if (critical.length) {
    html += '<div style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:8px;margin-bottom:8px;text-align:center;font-size:12px;font-weight:700;color:#dc2626">🚨 ' + critical.length + ' ingredient(s) run out within 7 days — reorder now</div>';
  }
  rows.forEach(function(x){
    var d = x.c.days;
    var col = d <= 3 ? '#dc2626' : (d <= 7 ? '#f97316' : (d <= 14 ? '#f59e0b' : '#059669'));
    var bar = Math.min(100, Math.round(d / 30 * 100));
    html += '<div style="margin:8px 0">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
      '<span>🧪 ' + sanitize(x.name) + ' <small style="color:#94a3b8">(' + x.c.stock + ' ' + x.c.unit + ' · uses ~' + (Math.round(x.c.rate*100)/100) + '/day)</small></span>' +
      '<b style="color:' + col + '">' + (d > 90 ? '90+' : Math.round(d)) + ' days</b></div>' +
      '<div style="height:8px;background:rgba(148,163,184,.15);border-radius:4px;overflow:hidden">' +
      '<div style="width:' + bar + '%;height:100%;background:' + col + ';border-radius:4px"></div></div></div>';
  });
  return html;
}

// ═══ ANALYTICS (order #5 + heatmap + watchlist) ═══
function v4rcPeriodChips() {
  var P = { today:'📅 Today', week:'📅 This Week', month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' + Object.keys(P).map(function(p){
    return '<button class="v4PChip' + (v4rc.period === p ? ' active' : '') + '" onclick="v4rcSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
  }).join('') + '</div>';
}
function v4rcSetPeriod(p) {
  v4rc.period = p;
  var chips = document.querySelector('#v4rcToolModal .v4PChips');
  if (chips) chips.outerHTML = v4rcPeriodChips();
  var body = document.getElementById('v4rcAnalyticsBody');
  if (body) body.innerHTML = v4rcAnalyticsHTML();
}
function v4rcAnalyticsOpen() {
  v4rcModal('📊 Recipe Analytics');
  document.getElementById('v4rcToolBody').innerHTML = v4rcPeriodChips() + '<div id="v4rcAnalyticsBody">' + v4rcAnalyticsHTML() + '</div>';
}
function v4rcAnalyticsHTML() {
  var cache = (typeof SS_PERF !== 'undefined' && SS_PERF.detailedCache) ? SS_PERF.detailedCache : [];
  var start = v4rcPeriodStart(v4rc.period);
  var rows = cache.filter(function(s){ return new Date(s.time) >= start; });
  var madeQty = {}, ingEaten = {}, byDow = [0,0,0,0,0,0,0];
  rows.forEach(function(s){
    var dow = new Date(s.time).getDay();
    (s.items || []).forEach(function(i){
      var r = v4rcRecipeForProduct(i.productId);
      if (!r) return;
      madeQty[r.productName] = (madeQty[r.productName] || 0) + (i.qty || 0);
      byDow[dow] += (i.qty || 0);
      var perPortion = 1 / (r.yield || 1);
      (r.items || []).forEach(function(ing){
        var need = (ing.qty||0) * (ing.factor||1) * perPortion * (i.qty||0);
        ingEaten[ing.ingredientName] = (ingEaten[ing.ingredientName] || 0) + need;
      });
    });
  });
  function big(v,l,c){ return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:12px 6px;text-align:center"><b style="font-size:16px;display:block;color:' + c + '">' + v + '</b><small style="font-size:9px;font-weight:800;color:#64748b">' + l + '</small></div>'; }
  var producedCount = Object.keys(madeQty).reduce(function(s,n){ return s + madeQty[n]; }, 0);
  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
    big(v4rc.data.length, '🍳 RECIPES TOTAL', '#3b82f6') +
    big(producedCount, '📦 PORTIONS MADE (' + v4rcPeriodLabel() + ')', '#059669') +
    '</div>';
  // 📅 day-of-week production heatmap (bonus)
  var dMax = Math.max.apply(null, byDow);
  if (dMax > 0) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    html += '<div style="height:10px"></div><b style="font-size:13px">📅 Production by day of week — plan your prep</b><div style="display:flex;gap:3px;margin-top:6px;height:70px;align-items:flex-end">';
    for (var d = 0; d < 7; d++) {
      var h = dMax > 0 ? Math.max(4, Math.round(byDow[d] / dMax * 60)) : 4;
      var col = byDow[d] === dMax ? '#ea580c' : (byDow[d] > dMax * 0.6 ? '#f59e0b' : '#94a3b8');
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="' + days[d] + ': ' + byDow[d] + ' portions">' +
        '<div style="width:100%;height:' + h + 'px;background:' + col + ';border-radius:4px 4px 0 0"></div>' +
        '<small style="font-size:9px;color:#64748b;font-weight:700">' + days[d] + '</small></div>';
    }
    html += '</div><p style="font-size:10px;color:#64748b;text-align:center;margin-top:2px"> busiest: ' + ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][byDow.indexOf(dMax)] + ' — prep big batches that morning</p>';
  }
  var made = Object.keys(madeQty).map(function(n){ return { n:n, q:madeQty[n] }; }).sort(function(a,b){ return b.q - a.q; });
  if (made.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px">🏆 Most produced (' + v4rcPeriodLabel() + ')</b>';
    made.slice(0, 10).forEach(function(x, i){
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + (i+1) + '. ' + sanitize(x.n) + '</span><b>' + x.q + ' portions</b></div>';
    });
  } else {
    html += '<p style="text-align:center;color:#64748b;font-size:12px;padding:10px">No recipe-based sales recorded in ' + v4rcPeriodLabel() + ' yet.</p>';
  }
  var eaten = Object.keys(ingEaten).map(function(n){ return { n:n, q:ingEaten[n] }; }).sort(function(a,b){ return b.q - a.q; });
  if (eaten.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px">🧪 Ingredients consumed by kitchen</b>';
    eaten.slice(0, 12).forEach(function(x){
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + sanitize(x.n) + '</span><b>' + (Math.round(x.q * 100) / 100) + '</b></div>';
    });
  }
  var watch = v4rc.data.map(function(r){ return { r:r, m:v4rcMargin(r) }; }).filter(function(x){ return x.m !== null && x.m < ((x.r.targetMargin||40) * 0.7); }).sort(function(a,b){ return a.m - b.m; });
  if (watch.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px;color:#ea580c">⚠️ Margin watchlist — prices to review</b>';
    watch.forEach(function(x){
      html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + sanitize(x.r.productName) + ' <small style="color:#94a3b8">cost ' + fmtMoney(v4rcTrueCostPerPortion(x.r)) + ' · suggest ' + fmtMoney(v4rcSuggestedPrice(x.r)) + '</small></span>' +
        '<b style="color:' + (x.m < 0 ? '#dc2626' : '#ea580c') + '">' + x.m.toFixed(0) + '%</b></div>';
    });
  }
  return html;
}
function v4rcSuggestedPrice(r) {
  var tc = v4rcTrueCostPerPortion(r);
  var m = (r.targetMargin||0) > 0 ? r.targetMargin : 40;
  return m > 0 && m < 100 ? tc / (1 - m/100) : tc;
}

// ── search ──
var v4rcSearchT = null;
function v4rcSearchInput(v) {
  v4rc.q = v;
  clearTimeout(v4rcSearchT);
  v4rcSearchT = setTimeout(v4rcRender, 300);
}

// ── tab loader ──
V4_TAB_LOADERS[18] = function() {
  v4rcEnsureUI();
  v4rcLoad().then(v4rcRender);
};
