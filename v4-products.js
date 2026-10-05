// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — PRODUCTS MODULE
//  4-type law · plan limits · ModernSheet · full edit modal (P1+)
// ═════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════
//  PRODUCTS v4 — 4-type law · plan limits · ModernSheet
// ═════════════════════════════════════════════════════════
var v4products = [];
var v4curType = 'sell';
var v4productTable = null;

function v4PickType(t) {
  v4curType = t;
  document.querySelectorAll('.v4-type').forEach(function(c){ c.classList.toggle('active', c.dataset.t === t); });
  // 🎯 THE CAPTAIN'S LAW: hide what the type doesn't need
  var price = document.getElementById('v4prodPrice');
  var costW = document.getElementById('v4costWrap');
  var stockW = document.getElementById('v4stockWrap');
  var extraW = document.getElementById('v4extraWrap');
  var stationW = document.getElementById('v4stationWrap');
  var cost = document.getElementById('v4prodCost');
  var stock = document.getElementById('v4prodStock');
  // sell: everything. raw: cost+stock, NO sell price needed visible but keep for future; virtual: price+station ONLY. dual: everything.
  stockW.style.display = (t === 'virtual') ? 'none' : 'grid';
  extraW.style.display = (t === 'virtual') ? 'none' : 'grid';
  stationW.style.display = (t === 'sell' || t === 'dual') ? 'none' : (t === 'virtual' ? 'block' : 'none');
  if (t === 'virtual') { costW.style.display = 'none'; stock.value = 0; }
  else { costW.style.display = 'block'; }
  if (t === 'raw') { price.parentElement.style.display = 'none'; }
  else { price.parentElement.style.display = 'block'; }
}

function v4g(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function v4n(id){ var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }

async function v4AddProduct() {
  var name = v4g('v4prodName');
  if (!name) { alert('Product name is required.'); return; }

  // 🛡️ PLAN LIMIT (Master's law)
  if (typeof ssCanAddProduct === 'function' && !ssCanAddProduct(v4products.length)) {
    alert('⚠️ Product limit reached for your plan (' + (typeof ssPlanLabel === 'function' ? ssPlanLabel() : '') + ').\n\nUpgrade: License tab.');
    return;
  }

  var dup = v4products.some(function(p){ return (p.name||'').toLowerCase() === name.toLowerCase(); });
  if (dup) { alert('⚠️ A product with this name already exists.'); return; }

  var t = v4curType;
  var price = v4n('v4prodPrice'), cost = v4n('v4prodCost'), stock = v4n('v4prodStock');

  // Type validations
  if ((t === 'sell' || t === 'dual' || t === 'virtual') && price <= 0) { alert('Selling price is required for this type.'); return; }
  if (t === 'raw' && cost <= 0) { alert('Cost price is required for raw materials.'); return; }
  if ((t === 'sell' || t === 'raw' || t === 'dual') && stock <= 0 && t !== 'dual') { if (t !== 'dual') { alert('Stock quantity is required for this type.'); return; } }
  if (t === 'dual' && cost <= 0) { alert('Dual-use needs cost price (it is also an ingredient).'); return; }
  if (t === 'virtual') { stock = 0; }

  // 🗺️ Map UI type → DB flags (same columns as v3 — bridge law respected)
  var isVirtual = (t === 'virtual');
  var sellDirectly = (t === 'sell' || t === 'dual' || t === 'virtual');
  var useBulk = (document.getElementById('v4bulkChk') || {checked:false}).checked && v4n('v4bulkQty1') > 0;
  var bulkQty1 = v4n('v4bulkQty1'), bulkPrice1 = v4n('v4bulkPrice1');
  var bulkQty2 = v4n('v4bulkQty2'), bulkPrice2 = v4n('v4bulkPrice2');
  var bulkQty3 = v4n('v4bulkQty3'), bulkPrice3 = v4n('v4bulkPrice3');
  var rec = {
    firebase_id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
    shop_id: getShopId(), name: name,
    price: price, cost_price: cost, stock: stock,
    unit: v4g('v4prodUnit') || 'piece',
    barcode: v4g('v4prodBarcode'),
    category: v4g('v4prodCategory') || 'General',
    is_virtual: isVirtual, sell_directly: sellDirectly,
    is_available_on_menu: (t !== 'raw'),
    reorder_level: v4n('v4prodReorder') || 5,
    expiry_date: v4g('v4prodExpiry') || null,
    image_url: v4g('v4prodImage'),
    station: v4g('v4prodStation') || 'Kitchen',
    sold_count: 0,
    is_available_on_menu: (function(){ var cb = document.getElementById('v4prodMenu'); return cb ? cb.checked : true; })(),
    modifiers: v4naCleanMods(),
    bulk_qty_1: useBulk ? bulkQty1 : null, bulk_price_1: useBulk ? bulkPrice1 : null,
    bulk_qty_2: useBulk && bulkQty2 > 0 ? bulkQty2 : null, bulk_price_2: useBulk && bulkQty2 > 0 ? bulkPrice2 : null,
    bulk_qty_3: useBulk && bulkQty3 > 0 ? bulkQty3 : null, bulk_price_3: useBulk && bulkQty3 > 0 ? bulkPrice3 : null
  };

  try {
    const { error } = await supabaseClient.from('products').insert([rec]);
    if (error) throw error;
    v4products.push(v4MapProduct(rec));
    v4RenderProductTable(); v4FillCatFilter();
    // reset form
    ['v4prodName','v4prodPrice','v4prodCost','v4prodStock','v4prodCategory','v4prodBarcode','v4prodImage','v4prodExpiry'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value=''; });
    var rl = document.getElementById('v4prodReorder'); if (rl) rl.value = '5';
    v4PickType('sell');
        var bchk = document.getElementById('v4bulkChk'); if (bchk) bchk.checked = false;
    var bf = document.getElementById('v4bulkF'); if (bf) bf.style.display = 'none';
    ['v4bulkQty1','v4bulkPrice1','v4bulkQty2','v4bulkPrice2','v4bulkQty3','v4bulkPrice3'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
    var mcb = document.getElementById('v4prodMenu'); if (mcb) mcb.checked = true;
    v4addMods = []; v4naRenderMods();
    alert('✅ "' + name + '" added!');
  } catch(e) { alert('❌ ' + e.message); }
}

function v4MapProduct(p) {
  var t = 'sell';
  if (p.is_virtual) t = 'virtual';
  else if (p.sell_directly === false) t = 'raw';
  return {
    id: p.firebase_id || p.id, name: p.name, price: Number(p.price)||0, costPrice: Number(p.cost_price)||0,
    stock: Number(p.stock)||0, unit: p.unit||'piece', barcode: p.barcode||'', category: p.category||'General',
    isVirtual: !!p.is_virtual, sellDirectly: p.sell_directly !== false,
    reorderLevel: Number(p.reorder_level)||5, expiryDate: p.expiry_date||'', imageUrl: p.image_url||'',
    station: p.station||'Kitchen', soldCount: Number(p.sold_count)||0,
    type: t, menuVisible: p.is_available_on_menu !== false,
    modifiers: p.modifiers || [],
    bulkQty1: Number(p.bulk_qty_1)||0, bulkPrice1: Number(p.bulk_price_1)||0,
    bulkQty2: Number(p.bulk_qty_2)||0, bulkPrice2: Number(p.bulk_price_2)||0,
    bulkQty3: Number(p.bulk_qty_3)||0, bulkPrice3: Number(p.bulk_price_3)||0
  };
}

function v4TypeBadge(t) {
  var m = { sell:['🛒 Sell','#eff6ff','#1d4ed8'], raw:['🧪 Raw','#fef3c7','#92400e'],
            virtual:['🍔 Prepared','#ede9fe','#5b21b6'], dual:['🥚 Dual','#d1fae5','#065f46'] };
  var x = m[t] || m.sell;
  return '<span style="background:' + x[1] + ';color:' + x[2] + ';font-size:10px;font-weight:800;padding:3px 8px;border-radius:8px;white-space:nowrap">' + x[0] + '</span>';
}

async function v4LoadProducts() {
  try {
    const { data, error } = await supabaseClient.from('products').select('*').eq('shop_id', getShopId());
    if (error) throw error;
    v4products = (data || []).map(v4MapProduct);
    v4FillCatFilter(); v4RenderProductTable();
  } catch(e) { console.warn('Products load:', e.message); }
}
function v4RefreshProducts(){ v4LoadProducts(); }

function v4FillCatFilter() {
  var sel = document.getElementById('v4prodCatFilter');
  if (!sel) return;
  var cats = [];
  v4products.forEach(function(p){ if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
  cats.sort();
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(function(c){ return '<option>' + c + '</option>'; }).join('');
    var usel = document.getElementById('v4prodUnitFilter');
  if (usel) { var us = []; v4products.forEach(function(p){ if (p.unit && us.indexOf(p.unit) === -1) us.push(p.unit); }); us.sort();
    usel.innerHTML = '<option value="">All Units</option>' + us.map(function(u){ return '<option>' + u + '</option>'; }).join(''); }
}

function v4FilteredProducts() {
  // ── FILTERS ──
  var q  = (document.getElementById('v4prodSearch')    || {value:''}).value.toLowerCase();
  var cf = (document.getElementById('v4prodCatFilter') || {value:''}).value;
  var tf = (document.getElementById('v4prodTypeFilter')|| {value:''}).value;
  var uf = (document.getElementById('v4prodUnitFilter')|| {value:''}).value;

  var out = v4products.filter(function(p) {
    // search: name OR barcode
    if (q && p.name.toLowerCase().indexOf(q) === -1 &&
        !(p.barcode && p.barcode.toLowerCase().indexOf(q) !== -1)) return false;
    // category
    if (cf && p.category !== cf) return false;
    // type
    if (tf && p.type !== tf) return false;
    // unit (P4)
    if (uf && p.unit !== uf) return false;
    return true;
  });

  // ── SORT SELECTOR (P4) ──
  var s = (document.getElementById('v4prodSort') || {value:'name-asc'}).value;
  if (s === 'name-asc')       out.sort(function(a, b){ return a.name.localeCompare(b.name); });
  else if (s === 'name-desc') out.sort(function(a, b){ return b.name.localeCompare(a.name); });
  else if (s === 'price-asc') out.sort(function(a, b){ return a.price - b.price; });
  else if (s === 'price-desc')out.sort(function(a, b){ return b.price - a.price; });
  else if (s === 'popular')   out.sort(function(a, b){ return (b.soldCount || 0) - (a.soldCount || 0); });

  return out;
}
async function v4CellEdit(item, col, newVal) {
  var dbCol = { name:'name', stock:'stock', price:'price', costPrice:'cost_price', unit:'unit', category:'category' }[col];  var val = (col === 'name') ? String(newVal).trim() : (parseFloat(newVal) || 0);
  if (col === 'name' && !val) return;
  try {
    var upd = {}; upd[dbCol] = val;
    const { error } = await supabaseClient.from('products').update(upd).eq('firebase_id', item.id);
    if (error) throw error;
    item[col] = val;
    if (col === 'stock' || col === 'price') { if (window.v4productTable) window.v4productTable.render(); }
  } catch(e) { alert('❌ ' + e.message); }
}

function v4RenderProductTable() {
  var filtered = v4FilteredProducts();
  var cnt = document.getElementById('v4prodCount'); if (cnt) cnt.textContent = filtered.length;

  if (!window.v4productTable) {
    window.v4productTable = new ModernSheet('v4productExcel', {
      data: filtered,
      columns: [
        { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
        { title:'Product', field:'name', width:'150px', render:function(i,h){ return h ? '<b>'+sanitize(i.name)+'</b>' : i.name; },
          editable:true, inputType:'text', onEdit:function(i,v){ return v4CellEdit(i,'name',v); } },
        { title:'Type', width:'92px', render:function(i,h){ return v4TypeBadge(i.type); }, filterable:true },
        { title:'Stock', width:'64px', align:'center', render:function(i,h){
            if (i.isVirtual) return h ? '<span style="color:#94a3b8">—</span>' : '';
            var c = i.stock === 0 ? '#dc2626' : (i.stock <= i.reorderLevel ? '#ea580c' : '#059669');
            return h ? '<b style="color:'+c+'">'+i.stock+'</b>' : i.stock;
          }, total:true, totalValue:function(i){ return i.isVirtual?0:i.stock; }, totalFormat:function(s){ return s+' units'; },
          editable:function(i){ return !i.isVirtual; }, inputType:'number', onEdit:function(i,v){ return v4CellEdit(i,'stock',v); } },
        { title:'Cost', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.costPrice):i.costPrice; },
          editable:true, inputType:'number', onEdit:function(i,v){ return v4CellEdit(i,'costPrice',v); } },
        { title:'Price', width:'94px', align:'right', render:function(i,h){ return h?'<b>'+fmtMoney(i.price)+'</b>':i.price; },
          total:true, totalValue:function(i){ return i.price * (i.isVirtual?1:i.stock); }, totalFormat:function(s){ return fmtMoney(s); },
          editable:true, inputType:'number', onEdit:function(i,v){ return v4CellEdit(i,'price',v); } },
                { title:'Bulk', width:'120px', render:function(i,h){
            if (!i.bulkQty1) return h ? '<span style="color:#cbd5e1">—</span>' : '';
            var tiers = [];
            if (i.bulkQty1) tiers.push(i.bulkQty1+'+ @ '+fmtMoney(i.bulkPrice1));
            if (i.bulkQty2) tiers.push(i.bulkQty2+'+ @ '+fmtMoney(i.bulkPrice2));
            if (i.bulkQty3) tiers.push(i.bulkQty3+'+ @ '+fmtMoney(i.bulkPrice3));
            return h ? '<small style="color:#92400e;background:#fef3c7;padding:3px 7px;border-radius:6px;white-space:normal;display:inline-block;line-height:1.5">'+tiers.join('<br>')+'</small>' : tiers.join(', ');
          }, filterable:false },
        { title:'Unit', field:'unit', width:'70px', editable:true, inputType:'select',
          options:['kg','gram','litre','ml','piece','packet','dozen','box','bottle','can','pair','set','roll','bundle','meter','cup','glass','spoon','dish'],
          onEdit:function(i,v){ return v4CellEdit(i,'unit',v); } },        
        { title:'Category', field:'category', width:'95px', editable:true, inputType:'text', onEdit:function(i,v){ return v4CellEdit(i,'category',v); }, filterable:true },        { title:'Actions', width:'140px', render:function(i,h){
            if (!h) return '';
           return '<button class="btn-mini" style="background:#e0f2fe;color:#1565c0" onclick="v4ProductDetail(\''+i.id+'\')">📋</button> ' +
                   '<button class="btn-mini edit" onclick="v4EditProduct(\''+i.id+'\')">✏️</button> ' +
                   '<button class="btn-mini" style="background:'+(i.menuVisible?'#0d64f0':'#94a3b8')+';color:#fff" title="Menu on/off" onclick="v4ToggleMenu(\''+i.id+'\')">'+(i.menuVisible?'👁️':'🚫')+'</button> ' +
                   '<button class="btn-mini delete" onclick="v4DeleteProduct(\''+i.id+'\')">🗑️</button>';
          }, filterable:false }
      ],
      emptyMessage: 'No products yet — add your first one above!',
      showSearch: false, showFontSlider: true
    });
    v4InitPinch();
  } else {
    window.v4productTable.setData(filtered);
  }
}

// 🤏 PINCH-TO-ZOOM — two fingers apart/closer on the table
function v4InitPinch() {
  var wrap = document.querySelector('#v4productExcel .modern-sheet-table-wrapper');
  if (!wrap || wrap.dataset.pinch) return;
  wrap.dataset.pinch = '1';
  var d0 = 0, f0 = 14;
  wrap.addEventListener('touchstart', function(e){
    if (e.touches.length === 2) {
      d0 = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      f0 = (window.v4productTable && window.v4productTable.currentFontSize) || 14;
    }
  }, {passive:true});
  wrap.addEventListener('touchmove', function(e){
    if (e.touches.length === 2 && window.v4productTable && d0 > 0) {
      e.preventDefault();
      var d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      window.v4productTable.currentFontSize = Math.max(10, Math.min(24, Math.round(f0 * d / d0)));
      window.v4productTable.render();
    }
  }, {passive:false});
}

// 📋 LIST VIEW
function v4RenderProductList(reset) {
  var c = document.getElementById('v4productList'); if (!c) return;
  var data = v4FilteredProducts();
  var per = 20, page = reset ? 1 : (v4ListPage || 1);
  var totalPages = Math.ceil(data.length / per) || 1;
  if (page > totalPages) page = totalPages;
  var items = data.slice((page-1)*per, page*per);
  var html = items.map(function(p){
    return '<div class="product-row" style="padding:10px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      '<div style="flex:1"><b>' + sanitize(p.name) + '</b> ' + v4TypeBadge(p.type) +
      '<br><small style="color:#64748b">Stock: ' + (p.isVirtual?'—':p.stock) + ' ' + p.unit + ' | Cost: ' + fmtMoney(p.costPrice) + '</small></div>' +
      '<b style="color:#2563eb;font-size:16px">' + fmtMoney(p.price) + '</b>' +
      '<button class="btn-mini" style="background:#e0f2fe;color:#1565c0" onclick="v4ProductDetail(\''+p.id+'\')">📋</button>' +
      '<button class="btn-mini edit" onclick="v4EditProduct(\''+p.id+'\')">✏️</button></div>';
  }).join('');
  if (page < totalPages) html += '<div style="text-align:center;padding:10px"><button class="v4-chip" onclick="v4ListPage++;v4RenderProductList(false)">⬇ Load More</button></div>';
  c.innerHTML = html || '<div class="placeholder">No products found.</div>';
}

// ⊞ GRID VIEW
function v4RenderProductGrid(reset) {
  var c = document.getElementById('v4productGrid'); if (!c) return;
  var data = v4FilteredProducts();
  var per = 12, page = reset ? 1 : (v4GridPage || 1);
  var totalPages = Math.ceil(data.length / per) || 1;
  if (page > totalPages) page = totalPages;
  var items = data.slice((page-1)*per, page*per);
  var html = items.map(function(p){
    return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px">' +
      '<b style="font-size:14px">' + sanitize(p.name) + '</b> ' + v4TypeBadge(p.type) +
      '<div style="color:#2563eb;font-weight:800;font-size:18px;margin:4px 0">' + fmtMoney(p.price) + '</div>' +
      '<small style="color:#64748b">Stock: ' + (p.isVirtual?'—':p.stock) + ' ' + p.unit + ' | Cost: ' + fmtMoney(p.costPrice) + '</small>' +
      '<div style="margin-top:8px;display:flex;gap:6px"><button class="btn-mini edit" style="flex:1" onclick="v4EditProduct(\''+p.id+'\')">✏️</button>' +
      '<button class="btn-mini delete" style="flex:1" onclick="v4DeleteProduct(\''+p.id+'\')">🗑️</button></div></div>';
  }).join('');
  if (page < totalPages) html += '<div style="grid-column:1/-1;text-align:center;padding:10px"><button class="v4-chip" onclick="v4GridPage++;v4RenderProductGrid(false)">⬇ Load More</button></div>';
  c.style.display = 'grid'; c.style.gridTemplateColumns = 'repeat(2,1fr)'; c.style.gap = '10px';
  c.innerHTML = html || '<div class="placeholder" style="grid-column:1/-1">No products found.</div>';
}

// 🖨️ PRINT — the current filtered list, clean paper layout
function v4ProductPrint() {
  var data = v4FilteredProducts();
  if (!data.length) { alert('Nothing to print.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  var rows = data.map(function(p,i){
    return '<tr><td>'+(i+1)+'</td><td><b>'+sanitize(p.name)+'</b></td><td>'+p.type+'</td><td style="text-align:right">'+(p.isVirtual?'—':p.stock)+'</td><td style="text-align:right">'+fmtMoney(p.costPrice)+'</td><td style="text-align:right">'+fmtMoney(p.price)+'</td></tr>';
  }).join('');
  w.document.write('<html><head><title>Product List</title><style>body{font-family:monospace;padding:14px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">📦 Product List — ' + data.length + ' items</h3><table><tr><th>#</th><th>Product</th><th>Type</th><th>Stock</th><th>Cost</th><th>Price</th></tr>' + rows + '</table></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// view switcher
var v4prodView = 'excel', v4ListPage = 1, v4GridPage = 1;
function v4ProductView(view) {
  try {
    v4prodView = view;
    var map = { excel:'v4pvExcel', list:'v4pvList', grid:'v4pvGrid' };
    Object.keys(map).forEach(function(k){ var el = document.getElementById(map[k]); if (el) el.classList.toggle('active', k === view); });
    var ex = document.getElementById('v4productExcel'), li = document.getElementById('v4productList'), gr = document.getElementById('v4productGrid');
    if (!ex || !li || !gr) { alert('View containers missing — report this to your engineer.'); return; }
    ex.style.display = view === 'excel' ? 'block' : 'none';
    li.style.display = view === 'list' ? 'block' : 'none';
    gr.style.display = view === 'grid' ? 'grid' : 'none';
    v4ListPage = 1; v4GridPage = 1;
    if (view === 'excel') {
      // force a fresh render every time — never trust a stale table
      if (window.v4productTable) window.v4productTable.setData(v4FilteredProducts());
      else v4RenderProductTable();
    }
    else if (view === 'list') v4RenderProductList(true);
    else v4RenderProductGrid(true);
  } catch(e) {
    alert('⚠️ View switch error: ' + e.message);   // no more silent failures — we SEE it
  }
}function v4ProductExport(){ if (window.v4productTable) window.v4productTable.exportXLSX(); }

async function v4DeleteProduct(id) {
  if (!await confirm('Delete this product permanently?')) return;
  try {
    const { error } = await supabaseClient.from('products').delete().eq('firebase_id', id);
    if (error) throw error;
    v4products = v4products.filter(function(p){ return p.id !== id; });
    v4RenderProductTable(); v4FillCatFilter();
    alert('✅ Product deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═════════════════════════════════════════════════════════
//  P1: FULL EDIT MODAL — all fields · 4-type · bulk · modifiers · add-stock
// ═════════════════════════════════════════════════════════
var v4emId = null, v4emType = 'sell', v4emMods = [];

function v4ById(query, id) {
  id = String(id || '');
  var isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  return isUuid ? query.eq('id', id) : query.eq('firebase_id', id);
}

function v4EditProduct(id) {
  var p = v4products.find(function(x){ return x.id === id; });
  if (!p) return;
  v4emId = id;
  v4emType = p.isVirtual ? 'virtual' : (p.sellDirectly === false ? 'raw' : (p.type === 'dual' ? 'dual' : 'sell'));
  v4emMods = JSON.parse(JSON.stringify(p.modifiers || []));
  v4BuildEditModal(p);
}

function v4BuildEditModal(p) {
  var old = document.getElementById('v4emModal'); if (old) old.remove();
  var units = ['kg','gram','litre','ml','piece','packet','dozen','box','bottle','can','pair','set','roll','bundle','meter','cup','glass','spoon','dish'];
  var uOpts = units.map(function(u){ return '<option ' + (p.unit === u ? 'selected' : '') + '>' + u + '</option>'; }).join('');
  var m = document.createElement('div');
  m.id = 'v4emModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8000;overflow-y:auto;padding:14px';
  m.innerHTML =
  '<div style="background:#fff;border-radius:18px;max-width:520px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<b style="font-size:17px">✏️ Edit Product</b>' +
      '<button onclick="v4CloseEditModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button>' +
    '</div>' +
    '<label>📦 Name</label><input class="v4-in" id="v4emName" value="' + sanitize(p.name).replace(/"/g,'&quot;') + '">' +
    '<label>📏 Unit</label><select class="v4-in" id="v4emUnit">' + uOpts + '</select>' +
    '<label>🏷️ Type</label>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px" id="v4emTypes">' +
      ['sell','raw','virtual','dual'].map(function(t){
        var lbl = {sell:'🛒 Sell',raw:'🧪 Raw',virtual:'🍔 Prepared',dual:'🥚 Dual'}[t];
        return '<div class="v4-type' + (v4emType === t ? ' active' : '') + '" data-t="' + t + '" onclick="v4emPickType(\'' + t + '\')"><b>' + lbl + '</b></div>';
      }).join('') +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div id="v4emPriceW"><label>💵 Selling Price</label><input type="number" class="v4-in" id="v4emPrice" value="' + p.price + '"></div>' +
      '<div id="v4emCostW"><label>💰 Cost Price</label><input type="number" class="v4-in" id="v4emCost" value="' + p.costPrice + '"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="v4emStockW">' +
      '<div><label>📊 Stock</label><input type="number" class="v4-in" id="v4emStock" value="' + p.stock + '"></div>' +
      '<div><label>⚠️ Low Alert</label><input type="number" class="v4-in" id="v4emReorder" value="' + p.reorderLevel + '"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="v4emExtraW">' +
      '<div><label>📂 Category</label><input class="v4-in" id="v4emCategory" value="' + sanitize(p.category) + '"></div>' +
      '<div><label>📅 Expiry</label><input type="date" class="v4-in" id="v4emExpiry" value="' + (p.expiryDate || '') + '"></div>' +
    '</div>' +
    '<div id="v4emStationW"><label>🍳 Prep Station</label><select class="v4-in" id="v4emStation">' +
      ['Kitchen','Bar','Coffee'].map(function(s){ return '<option ' + (p.station === s ? 'selected' : '') + '>' + s + '</option>'; }).join('') +
    '</select></div>' +
    '<label>🏷️ Barcode</label><input class="v4-in" id="v4emBarcode" value="' + sanitize(p.barcode) + '">' +
    '<label>🖼️ Image URL</label><input class="v4-in" id="v4emImage" value="' + sanitize(p.imageUrl) + '">' +
    '<label style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" id="v4emMenu" ' + (p.menuVisible ? 'checked' : '') + '> 📱 Visible on Customer QR Menu</label>' +
    // BULK
    '<label style="margin-top:10px"><input type="checkbox" id="v4emBulk" ' + (p.bulkQty1 > 0 ? 'checked' : '') + ' onchange="document.getElementById(\'v4emBulkF\').style.display=this.checked?\'block\':\'none\'"> 📦 Bulk Pricing</label>' +
    '<div id="v4emBulkF" style="display:' + (p.bulkQty1 > 0 ? 'block' : 'none') + ';background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;padding:10px">' +
      [1,2,3].map(function(i){ return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
        '<input type="number" class="v4-in" id="v4emBQ' + i + '" placeholder="Min Qty ' + i + '" value="' + (p['bulkQty'+i] || '') + '">' +
        '<input type="number" class="v4-in" id="v4emBP' + i + '" placeholder="Price ' + i + '" value="' + (p['bulkPrice'+i] || '') + '"></div>'; }).join('') +
    '</div>' +
    // MODIFIERS
    '<label style="margin-top:10px">🛠️ Modifiers & Add-ons (cafe)</label>' +
    '<div id="v4emModBox"></div>' +
    '<button class="v4-chip" style="width:100%;margin-top:4px" onclick="v4emAddGroup()">+ Add Modifier Group</button>' +
    // ADD STOCK
    '<div style="background:#fff3e0;border-radius:10px;padding:10px;margin-top:12px" id="v4emAddStockW">' +
      '<b style="font-size:13px">📥 Add New Stock (purchase)</b>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">' +
        '<input type="number" class="v4-in" id="v4emAddQty" placeholder="New qty arrived" style="margin:0">' +
        '<input type="number" class="v4-in" id="v4emAddCost" placeholder="Cost per unit" style="margin:0">' +
      '</div>' +
      '<small style="color:#64748b">Stock increases + purchase is logged (bin card history).</small>' +
    '</div>' +
    '<button class="v4-btn g" onclick="v4SaveEditProduct()">💾 Save All Changes</button>' +
    '<button class="v4-btn o" onclick="v4CloseEditModal()">Cancel</button>' +
  '</div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4CloseEditModal(); });
  v4emRenderMods();
  v4emApplyType();
}

function v4CloseEditModal(){ var m = document.getElementById('v4emModal'); if (m) m.remove(); }

function v4emPickType(t) {
  v4emType = t;
  document.querySelectorAll('#v4emTypes .v4-type').forEach(function(c){ c.classList.toggle('active', c.dataset.t === t); });
  v4emApplyType();
}

function v4emApplyType() {
  var t = v4emType;
  var show = function(id, v){ var el = document.getElementById(id); if (el) el.style.display = v; };
  show('v4emStockW', t === 'virtual' ? 'none' : 'grid');
  show('v4emExtraW', t === 'virtual' ? 'none' : 'grid');
  show('v4emStationW', (t === 'raw' || t === 'virtual') ? 'block' : 'none');
  show('v4emPriceW', t === 'raw' ? 'none' : 'block');
  show('v4emCostW', t === 'virtual' ? 'none' : 'block');
  show('v4emAddStockW', t === 'virtual' ? 'none' : 'block');
  if (t === 'virtual') { var s = document.getElementById('v4emStock'); if (s) s.value = 0; }
}

// — modifiers builder (edit) —
function v4emAddGroup(){ v4emMods.push({ id: 'mod_' + Date.now(), name: '', required: false, multiSelect: false, options: [{ name: '', price: 0 }] }); v4emRenderMods(); }
function v4emDelGroup(gid){ v4emMods = v4emMods.filter(function(g){ return g.id !== gid; }); v4emRenderMods(); }
function v4emAddOpt(gid){ var g = v4emMods.find(function(x){ return x.id === gid; }); if (g) { g.options.push({ name: '', price: 0 }); v4emRenderMods(); } }
function v4emUpd(gid, field, value, oi) {
  var g = v4emMods.find(function(x){ return x.id === gid; }); if (!g) return;
  if (oi === undefined) { g[field] = (field === 'required' || field === 'multiSelect') ? value.checked : value; }
  else { g.options[oi][field] = (field === 'price') ? (parseFloat(value) || 0) : value; }
}
function v4emRenderMods() {
  var box = document.getElementById('v4emModBox'); if (!box) return;
  box.innerHTML = v4emMods.map(function(g, gi) {
    return '<div style="border:1px solid #14b8a6;border-radius:10px;padding:8px;margin-bottom:6px;background:#f0fdfa">' +
      '<div style="display:flex;gap:6px"><input class="v4-in" style="margin:0;flex:1" placeholder="Group name (e.g., Extras)" value="' + sanitize(g.name) + '" oninput="v4emUpd(\'' + g.id + '\',\'name\',this.value)">' +
      '<button class="btn-mini delete" onclick="v4emDelGroup(\'' + g.id + '\')">✖</button></div>' +
      '<div style="font-size:11px;margin:4px 0"><label><input type="checkbox" ' + (g.required ? 'checked' : '') + ' onchange="v4emUpd(\'' + g.id + '\',\'required\',this)"> Required</label> ' +
      '<label style="margin-left:10px"><input type="checkbox" ' + (g.multiSelect ? 'checked' : '') + ' onchange="v4emUpd(\'' + g.id + '\',\'multiSelect\',this)"> Multi-select</label></div>' +
      g.options.map(function(o, oi) {
        return '<div style="display:flex;gap:6px;margin-bottom:4px">' +
          '<input class="v4-in" style="margin:0;flex:2" placeholder="Option (e.g., Oat Milk)" value="' + sanitize(o.name) + '" oninput="v4emUpd(\'' + g.id + '\',\'name\',this.value,' + oi + ')">' +
          '<input type="number" class="v4-in" style="margin:0;flex:1" placeholder="Price" value="' + (o.price || 0) + '" oninput="v4emUpd(\'' + g.id + '\',\'price\',this.value,' + oi + ')"></div>';
      }).join('') +
      '<button class="v4-chip" style="width:auto" onclick="v4emAddOpt(\'' + g.id + '\')">+ Option</button></div>';
  }).join('');
}
function v4emCleanMods() {
  return (v4emMods || []).filter(function(g){ return g.name && g.name.trim() && (g.options || []).some(function(o){ return o.name && o.name.trim(); }); })
    .map(function(g){ return { id: g.id, name: g.name.trim(), required: !!g.required, multiSelect: !!g.multiSelect,
      options: g.options.filter(function(o){ return o.name && o.name.trim(); }).map(function(o){ return { name: o.name.trim(), price: parseFloat(o.price) || 0 }; }) }; });
}

// — SAVE —
async function v4SaveEditProduct() {
  var p = v4products.find(function(x){ return x.id === v4emId; });
  if (!p) return;
  var g = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; };
  var n = function(id){ var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; };
  var newName = g('v4emName');
  if (!newName) { alert('Name is required.'); return; }
  var dup = v4products.some(function(x){ return x.id !== v4emId && (x.name||'').toLowerCase() === newName.toLowerCase(); });
  if (dup) { alert('⚠️ Another product already has this name.'); return; }

  var t = v4emType;
  var price = n('v4emPrice'), cost = n('v4emCost');
  if ((t === 'sell' || t === 'dual' || t === 'virtual') && price <= 0) { alert('Selling price required for this type.'); return; }
  if ((t === 'raw' || t === 'dual') && cost <= 0) { alert('Cost price required for this type (it is an ingredient).'); return; }

  var isVirtual = (t === 'virtual'), sellDirectly = (t !== 'raw');
  var useBulk = document.getElementById('v4emBulk').checked && n('v4emBQ1') > 0;
  var menuCb = document.getElementById('v4emMenu');

  var upd = {
    name: newName, unit: g('v4emUnit'), price: price, cost_price: cost,
    category: g('v4emCategory') || 'General', barcode: g('v4emBarcode'),
    image_url: g('v4emImage'), station: g('v4emStation') || 'Kitchen',
    reorder_level: n('v4emReorder') || 5, expiry_date: g('v4emExpiry') || null,
    is_virtual: isVirtual, sell_directly: sellDirectly,
    is_available_on_menu: menuCb ? menuCb.checked : true,
    modifiers: v4emCleanMods(),
    bulk_qty_1: useBulk ? n('v4emBQ1') : null, bulk_price_1: useBulk ? n('v4emBP1') : null,
    bulk_qty_2: useBulk && n('v4emBQ2') > 0 ? n('v4emBQ2') : null, bulk_price_2: useBulk && n('v4emBQ2') > 0 ? n('v4emBP2') : null,
    bulk_qty_3: useBulk && n('v4emBQ3') > 0 ? n('v4emBQ3') : null, bulk_price_3: useBulk && n('v4emBQ3') > 0 ? n('v4emBP3') : null
  };

  // stock: edited value OR add-new-stock
  var editedStock = n('v4emStock');
  var addQty = n('v4emAddQty'), addCost = n('v4emAddCost');
  if (!isVirtual && !(addQty > 0)) upd.stock = editedStock;

  try {
    const { error } = await v4ById(supabaseClient.from('products').update(upd), v4emId);
    if (error) throw error;

    if (!isVirtual && addQty > 0) {
      const { error: rpcErr } = await supabaseClient.rpc('add_stock', { pid: v4emId, qty: addQty });
      if (rpcErr) throw rpcErr;
      try {
        await supabaseClient.from('purchases').insert([{ shop_id: getShopId(), product_id: v4emId,
          date: new Date().toISOString().slice(0,10), qty: addQty, cost_per_unit: addCost || cost, reason: 'Manual Restock (Edit)' }]);
      } catch(e) { console.warn('Purchase log:', e.message); }
    }

    // local refresh
    Object.assign(p, { name: newName, price: price, costPrice: cost, unit: upd.unit, barcode: upd.barcode,
      category: upd.category, isVirtual: isVirtual, sellDirectly: sellDirectly, station: upd.station,
      reorderLevel: upd.reorder_level, expiryDate: upd.expiry_date || '', imageUrl: upd.image_url,
      menuVisible: upd.is_available_on_menu, modifiers: upd.modifiers,
      bulkQty1: upd.bulk_qty_1 || 0, bulkPrice1: upd.bulk_price_1 || 0,
      bulkQty2: upd.bulk_qty_2 || 0, bulkPrice2: upd.bulk_price_2 || 0,
      bulkQty3: upd.bulk_qty_3 || 0, bulkPrice3: upd.bulk_price_3 || 0 });
    p.type = isVirtual ? 'virtual' : (sellDirectly === false ? 'raw' : p.type);
    if (addQty > 0) p.stock = Math.round(((p.stock || 0) + addQty) * 1000) / 1000;
    else if (!isVirtual) p.stock = editedStock;

    v4CloseEditModal(); v4RenderProductTable(); v4FillCatFilter();
    alert('✅ "' + newName + '" updated!' + (addQty > 0 ? '\n📥 +' + addQty + ' stock added & purchase logged.' : ''));
  } catch(e) { alert('❌ ' + e.message); }
}
// ═════════════════════════════════════════════════════════
//  P2: ADD-FORM — modifiers builder (mirrors edit-modal engine)
// ═════════════════════════════════════════════════════════
var v4addMods = [];
function v4naAddGroup(){ v4addMods.push({ id: 'mod_' + Date.now(), name: '', required: false, multiSelect: false, options: [{ name: '', price: 0 }] }); v4naRenderMods(); }
function v4naDelGroup(gid){ v4addMods = v4addMods.filter(function(g){ return g.id !== gid; }); v4naRenderMods(); }
function v4naAddOpt(gid){ var g = v4addMods.find(function(x){ return x.id === gid; }); if (g) { g.options.push({ name: '', price: 0 }); v4naRenderMods(); } }
function v4naUpd(gid, field, value, oi) {
  var g = v4addMods.find(function(x){ return x.id === gid; }); if (!g) return;
  if (oi === undefined) { g[field] = (field === 'required' || field === 'multiSelect') ? value.checked : value; }
  else { g.options[oi][field] = (field === 'price') ? (parseFloat(value) || 0) : value; }
}
function v4naRenderMods() {
  var box = document.getElementById('v4addModBox'); if (!box) return;
  box.innerHTML = v4addMods.map(function(g) {
    return '<div style="border:1px solid #14b8a6;border-radius:10px;padding:8px;margin-bottom:6px;background:#f0fdfa">' +
      '<div style="display:flex;gap:6px"><input class="v4-in" style="margin:0;flex:1" placeholder="Group name" value="' + sanitize(g.name) + '" oninput="v4naUpd(\'' + g.id + '\',\'name\',this.value)">' +
      '<button class="btn-mini delete" onclick="v4naDelGroup(\'' + g.id + '\')">✖</button></div>' +
      '<div style="font-size:11px;margin:4px 0"><label><input type="checkbox" ' + (g.required ? 'checked' : '') + ' onchange="v4naUpd(\'' + g.id + '\',\'required\',this)"> Required</label> ' +
      '<label style="margin-left:10px"><input type="checkbox" ' + (g.multiSelect ? 'checked' : '') + ' onchange="v4naUpd(\'' + g.id + '\',\'multiSelect\',this)"> Multi-select</label></div>' +
      g.options.map(function(o, oi) {
        return '<div style="display:flex;gap:6px;margin-bottom:4px">' +
          '<input class="v4-in" style="margin:0;flex:2" placeholder="Option (e.g., Cheese)" value="' + sanitize(o.name) + '" oninput="v4naUpd(\'' + g.id + '\',\'name\',this.value,' + oi + ')">' +
          '<input type="number" class="v4-in" style="margin:0;flex:1" placeholder="Price" value="' + (o.price || 0) + '" oninput="v4naUpd(\'' + g.id + '\',\'price\',this.value,' + oi + ')"></div>';
      }).join('') +
      '<button class="v4-chip" style="width:auto" onclick="v4naAddOpt(\'' + g.id + '\')">+ Option</button></div>';
  }).join('');
}
function v4naCleanMods() {
  return (v4addMods || []).filter(function(g){ return g.name && g.name.trim() && (g.options || []).some(function(o){ return o.name && o.name.trim(); }); })
    .map(function(g){ return { id: g.id, name: g.name.trim(), required: !!g.required, multiSelect: !!g.multiSelect,
      options: g.options.filter(function(o){ return o.name && o.name.trim(); }).map(function(o){ return { name: o.name.trim(), price: parseFloat(o.price) || 0 }; }) }; });
}

// ═════════════════════════════════════════════════════════
//  P3: PRODUCT DETAIL + BIN CARD (stock ledger)
// ═════════════════════════════════════════════════════════
function v4ProductDetail(id) {
  var p = v4products.find(function(x){ return x.id === id; });
  if (!p) return;
  var old = document.getElementById('v4detailModal'); if (old) old.remove();
  var m = document.createElement('div');
  m.id = 'v4detailModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8100;overflow-y:auto;padding:14px';
  m.innerHTML =
  '<div style="background:#fff;border-radius:18px;max-width:520px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<b style="font-size:17px">📋 ' + sanitize(p.name) + '</b>' +
      '<button onclick="this.closest(\'#v4detailModal\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button>' +
    '</div>' +
    (p.imageUrl ? '<img src="' + sanitize(p.imageUrl) + '" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-bottom:10px" onerror="this.style.display=\'none\'">' : '') +
    v4TypeBadge(p.type) +
    '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:10px">' +
      '<tr><td style="padding:6px;color:#64748b">💰 Cost</td><td style="text-align:right"><b>' + fmtMoney(p.costPrice) + '</b></td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">💵 Price</td><td style="text-align:right"><b>' + fmtMoney(p.price) + '</b></td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">📊 Stock</td><td style="text-align:right"><b>' + (p.isVirtual ? '— (prepared)' : p.stock + ' ' + p.unit) + '</b></td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">⚠️ Low alert at</td><td style="text-align:right">' + p.reorderLevel + '</td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">🏷️ Barcode</td><td style="text-align:right">' + (p.barcode || '—') + '</td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">📂 Category</td><td style="text-align:right">' + sanitize(p.category) + '</td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">📅 Expiry</td><td style="text-align:right">' + (p.expiryDate || '—') + '</td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">🍳 Station</td><td style="text-align:right">' + p.station + '</td></tr>' +
      '<tr><td style="padding:6px;color:#64748b">📈 Sold (lifetime)</td><td style="text-align:right"><b>' + p.soldCount + '</b></td></tr>' +
      (p.isVirtual ? '<tr><td style="padding:6px;color:#64748b">💰 Cost basis</td><td style="text-align:right">from recipe</td></tr>' : '') +
    '</table>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button class="v4-btn p" style="margin:0" onclick="v4CloseDetail();v4EditProduct(\'' + p.id + '\')">✏️ Edit</button>' +
      (!p.isVirtual ? '<button class="v4-btn g" style="margin:0;background:#0d64f0" onclick="v4BinCard(\'' + p.id + '\')">📋 Bin Card</button>' : '') +
    '</div>' +
  '</div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4CloseDetail(); });
}
function v4CloseDetail(){ var m = document.getElementById('v4detailModal'); if (m) m.remove(); }

async function v4BinCard(id) {
  var p = v4products.find(function(x){ return x.id === id; });
  if (!p) return;
  v4CloseDetail();
  var old = document.getElementById('v4binModal'); if (old) old.remove();
  var m = document.createElement('div');
  m.id = 'v4binModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8100;overflow-y:auto;padding:14px';
  m.innerHTML =
  '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<b style="font-size:16px">📋 Bin Card — ' + sanitize(p.name) + '</b>' +
      '<button onclick="this.closest(\'#v4binModal\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-bottom:10px">' +
      '<div style="background:#eff6ff;border-radius:10px;padding:8px"><b id="v4binNow" style="font-size:16px">…</b><br><small style="color:#64748b">Current</small></div>' +
      '<div style="background:#ecfdf5;border-radius:10px;padding:8px"><b id="v4binIn" style="font-size:16px;color:#059669">…</b><br><small style="color:#64748b">📥 Received</small></div>' +
      '<div style="background:#fef2f2;border-radius:10px;padding:8px"><b id="v4binOut" style="font-size:16px;color:#dc2626">…</b><br><small style="color:#64748b">📤 Out</small></div>' +
    '</div>' +
    '<div id="v4binList" style="max-height:50vh;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:8px"><p style="text-align:center;color:#94a3b8;padding:14px">Loading history…</p></div>' +
  '</div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });

  var tx = [];
  try {
    // 1. stock movements (sales + offline syncs)
    const { data: moves } = await supabaseClient.from('stock_movements')
      .select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(100);
    (moves || []).forEach(function(mv){
      tx.push({ date: mv.created_at, type: (mv.reason === 'sale' || mv.reason === 'offline_sync') ? '📤 Sale' : '⚖️ Adjust',
        qty: -Math.abs(mv.qty_out || 0), note: (mv.invoice_no || '') + ' ' + (mv.reason || '') });
    });
    // 2. older sales (pre-movement era) — dedupe by invoice
    var seen = {};
    (moves || []).forEach(function(mv){ if (mv.invoice_no) seen[mv.invoice_no] = true; });
    const { data: sales } = await supabaseClient.from('sales')
      .select('time, items, invoice_no').eq('shop_id', getShopId())
      .order('time', { ascending: false }).limit(200);
    (sales || []).forEach(function(s){
      if (s.invoice_no && seen[s.invoice_no]) return;
      var hit = (s.items || []).find(function(i){ return i.productId === id; });
      if (hit) tx.push({ date: s.time, type: '📤 Sale', qty: -(hit.qty || 0), note: s.invoice_no || '' });
    });
    // 3. losses
    const { data: losses } = await supabaseClient.from('losses')
      .select('*').eq('product_id', id).order('time', { ascending: false }).limit(50);
    (losses || []).forEach(function(l){ tx.push({ date: l.time, type: '🗑️ Loss', qty: -Math.abs(l.quantity || 0), note: l.reason || '' }); });
    // 4. purchases (received stock)
    const { data: purch } = await supabaseClient.from('purchases')
      .select('*').eq('product_id', id).order('date', { ascending: false }).limit(50);
    (purch || []).forEach(function(pc){ tx.push({ date: pc.date, type: '📥 Received', qty: Math.abs(pc.qty || 0), note: (pc.reason || '') + ' @ ' + fmtMoney(pc.cost_per_unit || 0) }); });
  } catch(e) { console.warn('Bin card:', e.message); }

  tx.sort(function(a, b){ return new Date(b.date) - new Date(a.date); });
  var tin = 0, tout = 0;
  tx.forEach(function(t){ if (t.qty > 0) tin += t.qty; else tout += Math.abs(t.qty); });
  document.getElementById('v4binNow').textContent = p.isVirtual ? '—' : p.stock + ' ' + p.unit;
  document.getElementById('v4binIn').textContent = '+' + tin;
  document.getElementById('v4binOut').textContent = '-' + tout;

  var html = tx.length ? tx.map(function(t) {
    var c = t.qty > 0 ? '#059669' : '#dc2626';
    return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
      '<span>' + t.type + ' <small style="color:#64748b">' + new Date(t.date).toLocaleDateString() + ' ' + sanitize(t.note) + '</small></span>' +
      '<b style="color:' + c + '">' + (t.qty > 0 ? '+' : '') + t.qty + '</b></div>';
  }).join('') : '<p style="text-align:center;color:#94a3b8;padding:20px">No stock movements recorded yet.</p>';
  document.getElementById('v4binList').innerHTML = html;
}

// ═════════════════════════════════════════════════════════
//  P4: BARCODE CAMERA SCANNER (Quagga) · CSV · filters · maximize · menu toggle
// ═════════════════════════════════════════════════════════
var v4ScannerActive = false;
function v4StartScanner(targetId) {
  if (typeof Quagga === 'undefined') { alert('Scanner library not loaded.'); return; }
  if (v4ScannerActive) return;
  v4ScannerActive = true;
  var cont = document.getElementById('v4scanContainer');
  cont.style.display = 'flex';
  Quagga.init({ inputStream: { name: 'Live', type: 'LiveStream', target: document.getElementById('v4scanVideo'),
      constraints: { facingMode: 'environment' } },
    decoder: { readers: ['ean_reader','ean_8_reader','code_128_reader','code_39_reader','upc_reader','upc_e_reader'] } },
    function(err) { if (err) { alert('Camera error: ' + (err.message || err)); v4StopScanner(); return; } Quagga.start(); });
  Quagga.onDetected(function(data) {
    var el = document.getElementById(targetId);
    if (el) el.value = data.codeResult.code;
    v4StopScanner();
  });
}
function v4StopScanner() {
  if (v4ScannerActive) { try { Quagga.stop(); } catch(e) {} }
  v4ScannerActive = false;
  var cont = document.getElementById('v4scanContainer');
  if (cont) cont.style.display = 'none';
}

// CSV import (same columns as v3: name, unit, stock, cost price, selling price)
function v4ImportCSV() {
  var input = document.createElement('input'); input.type = 'file'; input.accept = '.csv';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(ev) {
      var lines = ev.target.result.split('\n').filter(function(l){ return l.trim(); });
      if (lines.length < 2) { alert('CSV must have a header row + at least one product row.'); return; }
      var headers = lines[0].split(',').map(function(h){ return h.trim().toLowerCase(); });
      var ni = headers.indexOf('name'), ui = headers.indexOf('unit'), si = headers.indexOf('stock'),
          ci = headers.indexOf('cost price'), pi = headers.indexOf('selling price');
      if (ni === -1 || pi === -1) { alert('Header must include: name, unit, stock, cost price, selling price'); return; }
      var rows = [];
      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',');
        var nm = cols[ni] ? cols[ni].replace(/"/g,'').trim() : '';
        var pr = parseFloat(cols[pi]) || 0;
        if (nm && pr > 0) rows.push({
          firebase_id: 'prod_' + Date.now() + '_' + i, shop_id: getShopId(),
          name: nm, unit: (ui !== -1 ? (cols[ui]||'').replace(/"/g,'').trim() : 'piece'),
          stock: si !== -1 ? (parseFloat(cols[si]) || 0) : 0,
          cost_price: ci !== -1 ? (parseFloat(cols[ci]) || 0) : 0,
          price: pr, category: 'General', sell_directly: true, is_virtual: false, sold_count: 0
        });
      }
      if (!rows.length) { alert('No valid rows found.'); return; }
      if (!await confirm('Import ' + rows.length + ' product(s)?')) return;
      try {
        const { error } = await supabaseClient.from('products').insert(rows);
        if (error) throw error;
        alert('✅ ' + rows.length + ' products imported!');
        v4LoadProducts();
      } catch(err) { alert('❌ Import failed: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function v4ExportCSV() {
  var data = v4FilteredProducts();
  var csv = '\uFEFFName,Unit,Stock,Cost Price,Selling Price,Type,Category,Barcode\n' + data.map(function(p) {
    return '"' + p.name + '",' + p.unit + ',' + (p.isVirtual?0:p.stock) + ',' + p.costPrice + ',' + p.price + ',' + p.type + ',"' + p.category + '","' + p.barcode + '"';
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'products_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

// menu show/hide toggle
async function v4ToggleMenu(id) {
  var p = v4products.find(function(x){ return x.id === id; });
  if (!p) return;
  var newVal = !p.menuVisible;
  if (!await confirm(newVal ? '👁️ Show "' + p.name + '" on the customer QR menu?' : '🚫 Hide "' + p.name + '" from the customer QR menu?')) return;
  try {
    const { error } = await supabaseClient.from('products').update({ is_available_on_menu: newVal }).eq('firebase_id', id);
    if (error) throw error;
    p.menuVisible = newVal;
    v4RenderProductTable();
    alert(newVal ? '✅ Visible on menu.' : '🚫 Hidden from menu.');
  } catch(e) { alert('❌ ' + e.message); }
}

// maximize table
function v4ToggleProductMaximize() {
  var card = document.getElementById('v4prodTableCard');
  if (!card) return;
  card.classList.toggle('maximized-card');
  if (window.v4productTable) { try { window.v4productTable.render(); } catch(e) {} }
}



// ── register my tab loader ──
V4_TAB_LOADERS[1] = function() {
    if (v4prodView === 'excel') v4RenderProductTable();
    else if (v4prodView === 'list') v4RenderProductList(true);
    else v4RenderProductGrid(true);
};
