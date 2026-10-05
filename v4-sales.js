// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — SALES MODULE
//  Summaries (4 periods × 3 views) · Detailed (filters+pagination)
//  Item Detail · Cashier Performance · Top Products — server-powered
// ═════════════════════════════════════════════════════════
var v4S = { period:'daily', view:'excel', lpage:1, gpage:1,
            sumTable:null, detTable:null, dview:'excel',
            ipage:1, cview:'excel', cperiod:'month', tview:'excel', tperiod:'month' };

var SS_SUM_COLS = [
  { title:'💵 Cash', field:'cash', align:'right', render:function(i,h){ return h?fmtMoney(i.cash):i.cash; }, total:true, totalValue:function(i){ return i.cash; }, totalFormat:function(s){ return fmtMoney(s); } },
  { title:'💳 Card', field:'card', align:'right', render:function(i,h){ return h?fmtMoney(i.card):i.card; }, total:true, totalValue:function(i){ return i.card; }, totalFormat:function(s){ return fmtMoney(s); } },
  { title:'📱 Mobile', field:'mobile', align:'right', render:function(i,h){ return h?fmtMoney(i.mobile):i.mobile; }, total:true, totalValue:function(i){ return i.mobile; }, totalFormat:function(s){ return fmtMoney(s); } },
  { title:'📝 Credit', field:'credit', align:'right', render:function(i,h){ return h?fmtMoney(i.credit):i.credit; }, total:true, totalValue:function(i){ return i.credit; }, totalFormat:function(s){ return fmtMoney(s); } },
  { title:'💰 Total', field:'total', align:'right', render:function(i,h){ return h?fmtMoney(i.total):i.total; }, total:true, totalValue:function(i){ return i.total; }, totalFormat:function(s){ return fmtMoney(s); } }
];

async function v4EnsureDaily() {
  if (!window._ssDailyAll || !window._ssDailyAll.length) {
    try { window._ssDailyAll = await ssFetchDailySummary(null, null); }
    catch(e) { window._ssDailyAll = []; }
  }
  return window._ssDailyAll;
}
function v4SumRows() {
  var all = window._ssDailyAll || [];
  if (v4S.period === 'all') return all;   // 🆕 ALL — every day ever
  if (v4S.period === 'daily') {
    var last30 = Date.now() - 30 * 86400000;
    return all.filter(function(d){ return new Date(d.date + 'T12:00:00').getTime() >= last30; });
  }
  return ssGroupDaily(all, v4S.period === 'weekly' ? 'week' : (v4S.period === 'monthly' ? 'month' : 'year'));
}
function v4SumLabel(r) {
  if (v4S.period === 'daily' || v4S.period === 'all') return formatDate(r.date);
  return formatDate(r.key);
}

function v4SumDetail(d) {
  return 'Cash: ' + fmtMoney(d.cash) + ' · Card: ' + fmtMoney(d.card) + ' · Mobile: ' + fmtMoney(d.mobile) + ' · Credit: ' + fmtMoney(d.credit);
}

// ── SUMMARIES (period chips × view chips) ──
async function v4RenderSummary() {
  await v4EnsureDaily();
  var rows = v4SumRows();
  var ex = document.getElementById('v4sumExcel'), li = document.getElementById('v4sumList'), gr = document.getElementById('v4sumGrid');
  if (!ex) return;
  ex.style.display = v4S.view === 'excel' ? 'block' : 'none';
  li.style.display = v4S.view === 'list' ? 'block' : 'none';
  gr.style.display = v4S.view === 'grid' ? 'grid' : 'none';

  if (v4S.view === 'excel') {
    var alive = ex.querySelector('.modern-sheet-table');   // 🛡️ self-heal: rebuild if bulldozed
    var lbl = { daily:'Date', all:'Date', weekly:'Week Starting', monthly:'Month', yearly:'Year' }[v4S.period];
    if (!v4S.sumTable || !alive || v4S.sumTable._period !== v4S.period) {
      ex.innerHTML = '';
      var cols = [{ title:lbl, width:'110px', render:function(i,h){ return h?v4SumLabel(i):v4SumLabel(i); } }].concat(SS_SUM_COLS);
      v4S.sumTable = new ModernSheet('v4sumExcel', { data:rows, columns:cols, emptyMessage:'No sales', showSearch:false, showFontSlider:true });
      v4S.sumTable._period = v4S.period;
    } else v4S.sumTable.setData(rows);
  } else if (v4S.view === 'list') {
    v4S.lpage = 1;
    v4PagList('v4sumList', rows.map(function(r){ return { label:v4SumLabel(r), detail:v4SumDetail(r), right:fmtMoney(r.total) }; }), 'lpage', 20, 'v4MoreSumList');
  } else {
    v4S.gpage = 1;
    v4PagGrid('v4sumGrid', rows.map(function(r){ return { label:v4SumLabel(r), detail:v4SumDetail(r), right:fmtMoney(r.total) }; }), 'gpage', 12, 'v4MoreSumGrid');
  }
}function v4MoreSumList(){ v4S.lpage++; v4PagList('v4sumList', v4SumRows().map(function(r){ return { label:v4SumLabel(r), detail:v4SumDetail(r), right:fmtMoney(r.total) }; }), 'lpage', 20, 'v4MoreSumList'); }
function v4MoreSumGrid(){ v4S.gpage++; v4PagGrid('v4sumGrid', v4SumRows().map(function(r){ return { label:v4SumLabel(r), detail:v4SumDetail(r), right:fmtMoney(r.total) }; }), 'gpage', 12, 'v4MoreSumGrid'); }

// ── generic paginated list/grid (module helpers) ──
function v4PagList(cid, items, pageVar, per, moreFn) {
  var c = document.getElementById(cid); if (!c) return;
  var totalPages = Math.ceil(items.length / per) || 1;
  var page = v4S[pageVar]; if (page > totalPages) page = totalPages;
  var slice = items.slice((page-1)*per, page*per);
  var html = slice.map(function(it) {
    return '<div class="product-row" style="padding:8px;border-bottom:1px solid #f1f5f9"><div style="flex:1"><b style="font-size:14px">' + it.label + '</b><br><small style="color:#64748b">' + it.detail + '</small></div><b style="color:#2563eb;min-width:80px;text-align:right">' + it.right + '</b></div>';
  }).join('');
  if (page < totalPages) html += '<div style="text-align:center;padding:10px"><button class="v4-chip" onclick="' + moreFn + '()">⬇ Load More (' + (totalPages - page) + ' left)</button></div>';
  c.innerHTML = html || '<div class="placeholder">No sales in this period.</div>';
}
function v4PagGrid(cid, items, pageVar, per, moreFn) {
  var c = document.getElementById(cid); if (!c) return;
  var totalPages = Math.ceil(items.length / per) || 1;
  var page = v4S[pageVar]; if (page > totalPages) page = totalPages;
  var slice = items.slice((page-1)*per, page*per);
  var html = slice.map(function(it) {
    return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px"><b style="font-size:13px">' + it.label + '</b><div style="color:#2563eb;font-weight:800;font-size:17px;margin:3px 0">' + it.right + '</div><small style="color:#64748b">' + it.detail + '</small></div>';
  }).join('');
  if (page < totalPages) html += '<div style="grid-column:1/-1;text-align:center;padding:10px"><button class="v4-chip" onclick="' + moreFn + '()">⬇ Load More</button></div>';
  c.style.display = 'grid'; c.style.gridTemplateColumns = 'repeat(2,1fr)'; c.style.gap = '10px';
  c.innerHTML = html || '<div class="placeholder" style="grid-column:1/-1">No sales in this period.</div>';
}

// ── DETAILED SALES (filters + pagination) ──
function v4DetFiltered() {
  var pf = (document.getElementById('v4dPay') || {value:''}).value;
  var sf = (document.getElementById('v4dShift') || {value:''}).value;
  var cf = (document.getElementById('v4dCashier') || {value:''}).value;
  var rows = SS_PERF.detailedCache.length ? SS_PERF.detailedCache.slice() : [];
  if (pf) rows = rows.filter(function(s){ return s.paymentMethod === pf; });
  if (cf) rows = rows.filter(function(s){ return (s.cashierName || '') === cf; });
  if (sf) rows = rows.filter(function(s){
    var h = new Date(s.time).getHours();
    var shift = h >= 6 && h < 12 ? '☀️ Morning' : (h >= 12 && h < 18 ? '🌤 Afternoon' : '🌙 Evening');
    return shift === sf;
  });
  return rows;
}
async function v4RenderDetailed(reset) {
  if (reset) v4S.dpage = 1;
  if (!SS_PERF.detailedCache.length) { try { await ssFetchDetailedPage(false); } catch(e) {} }
  v4UpdateDetBtn(); v4PopCashiers();
  var mapped = v4DetFiltered().map(function(s) {
    var h = new Date(s.time).getHours();
    return { date:s.time, time:s.time, invoiceNo:s.invoiceNo, paymentMethod:s.paymentMethod,
      cashierName:s.cashierName || 'Unknown', subtotal:s.subtotal, discount:s.discount, tax:s.tax, total:s.total,
      itemsStr:(s.items || []).map(function(i){ return i.name + '×' + i.qty; }).join(', ') };
  });
  var c = document.getElementById('v4detCount'); if (c) c.textContent = mapped.length;
  var ex = document.getElementById('v4detExcel'), li = document.getElementById('v4detList'), gr = document.getElementById('v4detGrid');
  if (!ex) return;
  ex.style.display = v4S.dview === 'excel' ? 'block' : 'none';
  li.style.display = v4S.dview === 'list' ? 'block' : 'none';
  gr.style.display = v4S.dview === 'grid' ? 'grid' : 'none';

  if (v4S.dview === 'excel') {
    var alive = ex.querySelector('.modern-sheet-table');
    if (!v4S.detTable || !alive) {
      ex.innerHTML = '';
      v4S.detTable = new ModernSheet('v4detExcel', {
        data: mapped,
        columns: [
          { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
          { title:'Date', width:'92px', render:function(i,h){ return h?formatDate(i.date):i.date; } },
          { title:'Time', width:'62px', render:function(i,h){ return h?new Date(i.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):i.time; } },
          { title:'Invoice', field:'invoiceNo', width:'84px' },
          { title:'Pay', field:'paymentMethod', width:'64px', filterable:true },
          { title:'Cashier', field:'cashierName', width:'95px', filterable:true },
          { title:'Subtotal', width:'86px', align:'right', render:function(i,h){ return h?fmtMoney(i.subtotal):i.subtotal; }, total:true, totalValue:function(i){ return i.subtotal; }, totalFormat:function(s){ return fmtMoney(s); } },
          { title:'Disc', width:'74px', align:'right', render:function(i,h){ return h?fmtMoney(i.discount):i.discount; }, total:true, totalValue:function(i){ return i.discount; }, totalFormat:function(s){ return fmtMoney(s); } },
          { title:'Tax', width:'74px', align:'right', render:function(i,h){ return h?fmtMoney(i.tax):i.tax; }, total:true, totalValue:function(i){ return i.tax; }, totalFormat:function(s){ return fmtMoney(s); } },
          { title:'💰 Total', width:'92px', align:'right', render:function(i,h){ return h?'<b>'+fmtMoney(i.total)+'</b>':i.total; }, total:true, totalValue:function(i){ return i.total; }, totalFormat:function(s){ return fmtMoney(s); } },
          { title:'Items', width:'190px', render:function(i,h){ return h?'<small>'+sanitize(i.itemsStr)+'</small>':i.itemsStr; } }
        ],
        emptyMessage:'No sales', showSearch:false, showFontSlider:true
      });
    } else v4S.detTable.setData(mapped);
  } else if (v4S.dview === 'list') {
    v4PagList('v4detList', mapped.map(function(s) {
      return { label:formatDate(s.date) + ' ' + new Date(s.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
        detail:'Pay: ' + s.paymentMethod + ' · ' + s.cashierName + ' · ' + s.itemsStr, right:fmtMoney(s.total) };
    }), 'dpage', 20, 'v4MoreDet');
  } else {
    v4PagGrid('v4detGrid', mapped.map(function(s) {
      return { label:formatDate(s.date), detail:'Pay: ' + s.paymentMethod + ' · ' + s.itemsStr, right:fmtMoney(s.total) };
    }), 'dpage', 12, 'v4MoreDet');
  }
}
function v4DetView(v, btn) {
  v4S.dview = v; v4S.dpage = 1;
  document.querySelectorAll('#v4detViews .v4-chip').forEach(function(b){ b.classList.toggle('active', b === btn); });
  v4RenderDetailed();
}
function v4MoreDet(){ v4S.dpage++; v4RenderDetailed(); }function v4UpdateDetBtn() {
  var b = document.getElementById('v4detMore');
  if (b) b.style.display = SS_PERF.detailedHasMore ? 'inline-block' : 'none';
}
async function v4LoadMoreDetailed() {
  try { await ssFetchDetailedPage(true); v4RenderDetailed(); }
  catch(e) { alert('Load failed: ' + e.message); }
}
function v4PopCashiers() {
  var seen = [];
  SS_PERF.detailedCache.forEach(function(s){ var c = s.cashierName || 'Unknown'; if (seen.indexOf(c) === -1) seen.push(c); });
  ['v4dCashier','v4iCashier'].forEach(function(id) {
    var sel = document.getElementById(id); if (!sel) return;
    var keep = sel.value;
    sel.innerHTML = '<option value="">All Cashiers</option>' + seen.map(function(c){ return '<option>' + c + '</option>'; }).join('');
    sel.value = keep;
  });
}

// ── ITEM DETAIL (flattened) ──
async function v4RenderItemDetail(reset) {
  if (reset) v4S.ipage = 1;
  if (!SS_PERF.detailedCache.length) await ssFetchDetailedPage(false);
  var sf = (document.getElementById('v4iShift') || {value:''}).value;
  var cf = (document.getElementById('v4iCashier') || {value:''}).value;
  var out = [];
  SS_PERF.detailedCache.forEach(function(s) {
    var h = new Date(s.time).getHours();
    var shift = h >= 6 && h < 12 ? 'Morning' : (h >= 12 && h < 18 ? 'Afternoon' : 'Evening');
    var cashier = s.cashierName || 'Unknown';
    if (sf && shift !== sf) return;
    if (cf && cashier !== cf) return;
    (s.items || []).forEach(function(i) {
      out.push({ date:s.time, shift:shift, cashier:cashier, name:i.name, qty:i.qty || 0,
        price:i.price || 0, total:(i.price || 0) * (i.qty || 0) });
    });
  });
  out.sort(function(a, b){ return new Date(b.date) - new Date(a.date); });
  var per = 20, totalPages = Math.ceil(out.length / per) || 1;
  if (v4S.ipage > totalPages) v4S.ipage = totalPages;
  var slice = out.slice((v4S.ipage-1)*per, v4S.ipage*per);
  var c = document.getElementById('v4itemDetail'); if (!c) return;
  var html = '<table class="excel-table" style="width:100%"><thead><tr><th>Date</th><th>Shift</th><th>Cashier</th><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>';
  if (!slice.length) html += '<tr><td colspan="7" style="text-align:center;padding:18px;color:#94a3b8">No items for these filters.</td></tr>';
  else slice.forEach(function(r) {
    html += '<tr><td>' + formatDate(r.date) + '</td><td>' + r.shift + '</td><td>' + sanitize(r.cashier) + '</td><td>' + sanitize(r.name) + '</td><td style="text-align:center">' + r.qty + '</td><td style="text-align:right">' + fmtMoney(r.price) + '</td><td style="text-align:right"><b>' + fmtMoney(r.total) + '</b></td></tr>';
  });
  html += '</tbody></table>';
  if (v4S.ipage < totalPages) html += '<div style="text-align:center;padding:10px"><button class="v4-chip" onclick="v4S.ipage++;v4RenderItemDetail(false)">⬇ Load More</button></div>';
  c.innerHTML = html;
}

// ── CASHIER PERFORMANCE (server, split-aware) ──
async function v4CashierData() {
  var start = v4PeriodStart(v4S.cperiod);
  try {
    const { data, error } = await supabaseClient.from('sales')
      .select('cashier_name, total, payment_method, payments')
      .eq('shop_id', getShopId()).eq('voided', false).gte('time', start.toISOString());
    if (error) throw error;
    var map = {};
    (data || []).forEach(function(s) {
      var name = s.cashier_name || 'Unknown';
      if (!map[name]) map[name] = { name:name, cash:0, card:0, mobile:0, credit:0, total:0 };
      if (s.payment_method === 'split' && Array.isArray(s.payments)) {
        s.payments.forEach(function(p) { var m = p.method || 'cash'; if (map[name][m] !== undefined) map[name][m] += Number(p.amount || 0); });
      } else { var m2 = s.payment_method || 'cash'; if (map[name][m2] !== undefined) map[name][m2] += Number(s.total || 0); }
      map[name].total += Number(s.total || 0);
    });
    return Object.values(map).sort(function(a, b){ return b.total - a.total; });
  } catch(e) { return []; }
}
function v4MoreCashier(){ if (v4S.cview === 'list') { v4S.cpage++; v4CashierData().then(function(d){ v4PagList('v4cashExcel', d.map(function(c){ return { label:c.name, detail:'Cash ' + fmtMoney(c.cash) + ' · ' + fmtMoney(c.total), right:fmtMoney(c.total) }; }), 'cpage', 20, 'v4MoreCashier'); }); } }

// ── TOP PRODUCTS (server) ──
async function v4TopData() {
  var start = v4PeriodStart(v4S.tperiod);
  try {
    const { data, error } = await supabaseClient.from('sales')
      .select('items').eq('shop_id', getShopId()).eq('voided', false).gte('time', start.toISOString());
    if (error) throw error;
    var map = {};
    (data || []).forEach(function(s) {
      (s.items || []).forEach(function(i) {
        if (!map[i.name]) map[i.name] = { name:i.name, qty:0, revenue:0 };
        map[i.name].qty += i.qty || 0;
        map[i.name].revenue += (i.price || 0) * (i.qty || 0);
      });
    });
    return Object.values(map).sort(function(a, b){ return b.revenue - a.revenue; });
  } catch(e) { return []; }
}

function v4MoreTop(){ if (v4S.tview === 'list') { v4S.tpage++; v4TopData().then(function(d){ v4PagList('v4topExcel', d.map(function(p){ return { label:sanitize(p.name), detail:'Sold: ' + p.qty, right:fmtMoney(p.revenue) }; }), 'tpage', 20, 'v4MoreTop'); }); } }
async function v4RenderCashier() {
  var data = await v4CashierData();
  var mapped = data.map(function(c){ return { label:c.name, detail:'Cash ' + fmtMoney(c.cash) + ' · Card ' + fmtMoney(c.card) + ' · Mobile ' + fmtMoney(c.mobile) + ' · Credit ' + fmtMoney(c.credit), right:fmtMoney(c.total) }; });
  var ex = document.getElementById('v4cashExcel'), li = document.getElementById('v4cashList'), gr = document.getElementById('v4cashGrid');
  if (!ex) return;
  ex.style.display = v4S.cview === 'excel' ? 'block' : 'none';
  li.style.display = v4S.cview === 'list' ? 'block' : 'none';
  gr.style.display = v4S.cview === 'grid' ? 'grid' : 'none';
  if (v4S.cview === 'excel') {
    var alive = ex.querySelector('.modern-sheet-table');
    if (!window.v4cashTable || !alive) {
      ex.innerHTML = '';
      window.v4cashTable = new ModernSheet('v4cashExcel', { data:data, columns:[
        { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
        { title:'Cashier', field:'name', width:'110px' },
        { title:'💵 Cash', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.cash):i.cash; } },
        { title:'💳 Card', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.card):i.card; } },
        { title:'📱 Mobile', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.mobile):i.mobile; } },
        { title:'📝 Credit', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.credit):i.credit; } },
        { title:'Total', width:'92px', align:'right', render:function(i,h){ return h?'<b>'+fmtMoney(i.total)+'</b>':i.total; }, total:true, totalValue:function(i){ return i.total; }, totalFormat:function(s){ return fmtMoney(s); } }
      ], emptyMessage:'No sales in this period', showSearch:false, showFontSlider:true });
    } else window.v4cashTable.setData(data);
  } else if (v4S.cview === 'list') { v4S.cpage = 1; v4PagList('v4cashList', mapped, 'cpage', 20, 'v4MoreCash'); }
  else { v4S.cpage = 1; v4PagGrid('v4cashGrid', mapped, 'cpage', 12, 'v4MoreCash'); }
}
function v4MoreCash(){ v4S.cpage++; v4RenderCashier(); }
// ── view/period chip handlers ──
function v4SumPeriod(p, btn) {
  v4S.period = p;
  document.querySelectorAll('#v4sumPeriods .period-btn').forEach(function(b){ b.classList.toggle('active', b === btn); });
  v4RenderSummary();
}
function v4SumView(v, btn) {
  v4S.view = v;
  document.querySelectorAll('#v4sumViews .v4-chip').forEach(function(b){ b.classList.toggle('active', b === btn); });
  v4RenderSummary();
}
function v4CashView(v, btn) { v4S.cview = v; document.querySelectorAll('#v4cashViews .v4-chip').forEach(function(b){ b.classList.toggle('active', b === btn); }); v4RenderCashier(); }
function v4TopView(v, btn) { v4S.tview = v; document.querySelectorAll('#v4topViews .v4-chip').forEach(function(b){ b.classList.toggle('active', b === btn); }); v4RenderTop(); }

// ── register my tab loader ──
V4_TAB_LOADERS[2] = function() {
  v4RenderSummary();
  v4RenderDetailed();
  v4RenderItemDetail(true);
  v4RenderCashier();
  v4RenderTop();
};
