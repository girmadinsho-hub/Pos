// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — SALES MODULE
//  Summaries (4 periods × 3 views) · Detailed (filters+pagination)
//  Item Detail · Cashier Performance · Top Products — server-powered
// ═════════════════════════════════════════════════════════
var v4S = { period:'daily', view:'excel', lpage:1, gpage:1, dpage:1, cpage:1, tpage:1,            sumTable:null, detTable:null, dview:'excel',iview:'excel',
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

// 🔧 LOAD MORE LAW: pages APPEND (cumulative) — v3 behavior restored
function v4PagList(cid, items, pageVar, per, moreFn) {
  var c = document.getElementById(cid); if (!c) return;
  var totalPages = Math.ceil(items.length / per) || 1;
  var page = v4S[pageVar] || 1; if (page > totalPages) page = totalPages;
  var slice = items.slice(0, page * per);   // ✅ cumulative: rows 1..page
  var html = slice.map(function(it) {
    return '<div class="product-row" style="padding:8px;border-bottom:1px solid #f1f5f9"><div style="flex:1"><b style="font-size:14px">' + it.label + '</b><br><small style="color:#64748b">' + it.detail + '</small></div><b style="color:#2563eb;min-width:80px;text-align:right">' + it.right + '</b></div>';
  }).join('');
  if (page < totalPages) html += '<div style="text-align:center;padding:10px"><button class="v4-chip" onclick="' + moreFn + '()">⬇ Load More (' + (totalPages - page) + ' left)</button></div>';
  c.innerHTML = html || '<div class="placeholder">No sales in this period.</div>';
}
function v4PagGrid(cid, items, pageVar, per, moreFn) {
  var c = document.getElementById(cid); if (!c) return;
  var totalPages = Math.ceil(items.length / per) || 1;
  var page = v4S[pageVar] || 1; if (page > totalPages) page = totalPages;
  var slice = items.slice(0, page * per);   // ✅ cumulative: rows 1..page
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
  if (reset) { v4S.ipage = 1; }
  // 🚀 Build the flattened pool ONCE (from server-paginated cache), then page it
  if (!v4S.itemPool) {
    if (!SS_PERF.detailedCache.length) { try { await ssFetchDetailedPage(false); } catch(e) {} }
    var pool = [];
    SS_PERF.detailedCache.forEach(function(s) {
      var h = new Date(s.time).getHours();
      var shift = h >= 6 && h < 12 ? 'Morning' : (h >= 12 && h < 18 ? 'Afternoon' : 'Evening');
      var cashier = s.cashierName || 'Unknown';
      (s.items || []).forEach(function(i) {
        pool.push({ date:s.time, shift:shift, cashier:cashier, name:i.name, qty:i.qty || 0,
          price:i.price || 0, total:(i.price || 0) * (i.qty || 0) });
      });
    });
    pool.sort(function(a, b){ return new Date(b.date) - new Date(a.date); });
    v4S.itemPool = pool;
  }
  // filters re-slice the pool (no new queries)
  var sf = (document.getElementById('v4iShift') || {value:''}).value;
  var cf = (document.getElementById('v4iCashier') || {value:''}).value;
  var rows = v4S.itemPool.filter(function(r) {
    if (sf && r.shift !== sf) return false;
    if (cf && r.cashier !== cf) return false;
    return true;
  });

  var per = 30;                                        // 🚀 30 rows per page
  var totalPages = Math.ceil(rows.length / per) || 1;
  if (v4S.ipage > totalPages) v4S.ipage = totalPages;
  var slice = rows.slice((v4S.ipage - 1) * per, v4S.ipage * per);

  var ex = document.getElementById('v4itemExcel'), li = document.getElementById('v4itemList'), gr = document.getElementById('v4itemGrid');
  if (!ex) return;
  ex.style.display = v4S.iview === 'excel' ? 'block' : 'none';
  li.style.display = v4S.iview === 'list' ? 'block' : 'none';
  gr.style.display = v4S.iview === 'grid' ? 'grid' : 'none';

  if (v4S.iview === 'excel') {
    var alive = ex.querySelector('.modern-sheet-table');
    if (!window.v4itemTable || !alive) {
      ex.innerHTML = '';
      window.v4itemTable = new ModernSheet('v4itemExcel', { data: slice, columns: [
        { title:'#', width:'36px', render:function(i,h,x){ return ((v4S.ipage-1)*per) + x + 1; } },
        { title:'Date', width:'92px', render:function(i,h){ return h?formatDate(i.date):i.date; } },
        { title:'Shift', field:'shift', width:'82px', filterable:true },
        { title:'Cashier', field:'cashier', width:'95px', filterable:true },
        { title:'Item', field:'name', width:'130px' },
        { title:'Qty', width:'52px', align:'center', render:function(i,h){ return h?'<b>'+i.qty+'</b>':i.qty; } },
        { title:'Price', width:'80px', align:'right', render:function(i,h){ return h?fmtMoney(i.price):i.price; } },
        { title:'Total', width:'92px', align:'right', render:function(i,h){ return h?'<b>'+fmtMoney(i.total)+'</b>':i.total; } }
      ], emptyMessage:'No items for these filters.', showSearch:false, showFontSlider:true });
    } else window.v4itemTable.setData(slice);
  } else if (v4S.iview === 'list') {
    v4PagList('v4itemList', slice.map(function(r){ return { label:sanitize(r.name), detail:formatDate(r.date) + ' · ' + r.shift + ' · ' + r.cashier, right:fmtMoney(r.total) }; }), 'ipage', 30, 'v4MoreItem');
  } else {
    v4PagGrid('v4itemGrid', slice.map(function(r){ return { label:sanitize(r.name), detail:r.shift + ' · ' + r.cashier + ' · Qty ' + r.qty, right:fmtMoney(r.total) }; }), 'ipage', 12, 'v4MoreItem');
  }
  // pager bar
  var bar = document.getElementById('v4itemPager');
  if (bar) bar.innerHTML = rows.length ?
    '<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:8px">' +
      '<button class="v4-chip" onclick="v4ItemPage(-1)" ' + (v4S.ipage <= 1 ? 'disabled style="opacity:.4"' : '') + '>◀ Prev</button>' +
      '<small style="color:#64748b">Page ' + v4S.ipage + ' / ' + totalPages + ' · ' + rows.length + ' items</small>' +
      '<button class="v4-chip" onclick="v4ItemPage(1)" ' + (v4S.ipage >= totalPages ? 'disabled style="opacity:.4"' : '') + '>Next ▶</button>' +
    '</div>' : '';
}
function v4ItemPage(dir) { v4S.ipage += dir; v4RenderItemDetail(); }
function v4MoreItem(){ v4S.ipage++; v4RenderItemDetail(); }function v4ItemView(v, btn) {
  v4S.iview = v; v4S.ipage = 1;
  document.querySelectorAll('#v4itemViews .v4-chip').forEach(function(b){ b.classList.toggle('active', b === btn); });
  v4RenderItemDetail();
}
function v4MoreItem(){ v4S.ipage++; v4RenderItemDetail(); }
// ── period helper (one home: this file — Round 10 crash fix) ──
function v4PeriodStart(p) {
  var now = new Date();
  if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'week') {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (p === 'year') return new Date(now.getFullYear(), 0, 1);
  return new Date(0);
}
async function v4CashierData() {
  var start = v4PeriodStart(v4S.cperiod);
  var from = start.toISOString();
  var map = {};
  var PAGE = 200, guard = 0, loaded = 0;
  while (guard < 10) {   // 10 × 200 = 2000 sales ceiling — speed law
    guard++;
    var res = await supabaseClient.from('sales')
      .select('cashier_name, total, payment_method, payments, time')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', from).order('time', { ascending: false })
      .range(guard * PAGE - PAGE, guard * PAGE - 1);
    if (res.error) break;
    var rows = res.data || [];
    rows.forEach(function(s) {
      var name = s.cashier_name || 'Unknown';
      if (!map[name]) map[name] = { name:name, cash:0, card:0, mobile:0, credit:0, total:0, count:0, hours:new Array(24).fill(0), first:null, last:null };
      var c = map[name];
      if (s.payment_method === 'split' && Array.isArray(s.payments)) {
        s.payments.forEach(function(p) { var m = p.method || 'cash'; if (c[m] !== undefined) c[m] += Number(p.amount || 0); });
      } else { var m2 = s.payment_method || 'cash'; if (c[m2] !== undefined) c[m2] += Number(s.total || 0); }
      c.total += Number(s.total || 0);
      c.count++;
      c.hours[new Date(s.time).getHours()]++;
      if (!c.first || s.time < c.first) c.first = s.time;
      if (!c.last || s.time > c.last) c.last = s.time;
    });
    loaded += rows.length;
    if (rows.length < PAGE) break;
  }
  window._v4CashN = loaded;
  return Object.values(map).sort(function(a, b){ return b.total - a.total; });
}


// ── TOP PRODUCTS (server) ──
async function v4TopData() {
  // 🎯 Round 10 truth fix: rank from THIS period's own sales (bounded 2000),
  // not the recent-sales cache — "Year" now really means the year.
  var start = v4PeriodStart(v4S.tperiod);
  var map = {}, loaded = 0;
  var PAGE = 200, guard = 0;
  while (guard < 10) {
    guard++;
    var res = await supabaseClient.from('sales')
      .select('items, total')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString()).order('time', { ascending: false })
      .range(guard * PAGE - PAGE, guard * PAGE - 1);
    if (res.error) break;
    var rows = res.data || [];
    rows.forEach(function(s) {
      (s.items || []).forEach(function(i) {
        if (!map[i.name]) map[i.name] = { name:i.name, qty:0, revenue:0 };
        map[i.name].qty += i.qty || 0;
        map[i.name].revenue += (i.price || 0) * (i.qty || 0);
      });
    });
    loaded += rows.length;
    if (rows.length < PAGE) break;
  }
  window._v4TopN = loaded;
  return Object.values(map).sort(function(a, b){ return b.revenue - a.revenue; });
}

function v4MoreTop(){
  v4S.tpage++;
  v4TopData().then(function(d){
    var mapped = d.map(function(p){ return { label:sanitize(p.name), detail:'Sold: ' + p.qty, right:fmtMoney(p.revenue) }; });
    if (v4S.tview === 'list') v4PagList('v4topList', mapped, 'tpage', 20, 'v4MoreTop');
    else v4PagGrid('v4topGrid', mapped, 'tpage', 12, 'v4MoreTop');
  });
}

async function v4RenderCashier() {
  var data = await v4CashierData();
  window._v4CashData = data;
  var periodLbl = { all:'All Time', today:'Today', week:'This Week', month:'This Month', year:'This Year' }[v4S.cperiod] || 'This Month';
  // toolbar: honest coverage + share (Round 10 bonus)
  var tb = document.getElementById('v4cashTools');
  if (!tb && document.getElementById('v4cashExcel')) {
    tb = document.createElement('div'); tb.id = 'v4cashTools';
    document.getElementById('v4cashExcel').parentNode.insertBefore(tb, document.getElementById('v4cashExcel'));
  }
  if (tb) tb.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
    '<small style="font-size:11px;color:#64748b">👥 ' + data.length + ' cashier(s) · ' + periodLbl + ' · based on ' + (window._v4CashN||0) + ' sales</small>' +
    '<button class="v4-chip" onclick="v4CashWA()">📤 Share</button></div>';
  var mapped = data.map(function(c){ return { label:c.name, detail:'Cash ' + fmtMoney(c.cash) + ' · Card ' + fmtMoney(c.card) + ' · Mobile ' + fmtMoney(c.mobile) + ' · Credit ' + fmtMoney(c.credit) + ' · ' + c.count + ' sales', right:fmtMoney(c.total) }; });
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
        { title:'Cashier', field:'name', width:'110px', render:function(i,h){ return h?'<b>'+sanitize(i.name)+'</b>':i.name; } },
        { title:'💵 Cash', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.cash):i.cash; } },
        { title:'💳 Card', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.card):i.card; } },
        { title:'📱 Mobile', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.mobile):i.mobile; } },
        { title:'📝 Credit', width:'84px', align:'right', render:function(i,h){ return h?fmtMoney(i.credit):i.credit; } },
        { title:'Total', width:'92px', align:'right', render:function(i,h){ return h?'<b>'+fmtMoney(i.total)+'</b>':i.total; }, total:true, totalValue:function(i){ return i.total; }, totalFormat:function(s){ return fmtMoney(s); } },
        { title:'Avg/Sale', width:'84px', align:'right', render:function(i,h){ var a=i.count?i.total/i.count:0; return h?fmtMoney(a):a; } },
        { title:'Tx', width:'46px', align:'center', field:'count', total:true, totalValue:function(i){ return i.count; }, totalFormat:function(s){ return s+' sales'; } },
        { title:'', width:'56px', render:function(i,h){
            if (!h) return '';
            var nm = String(i.name).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
            return '<button class="btn-mini" style="background:#7c3aed;color:#fff" title="Performance details" onclick="v4CashDetail(\'' + nm + '\')">🏆</button>';
          }, filterable:false }
      ], emptyMessage:'No sales in this period', showSearch:false, showFontSlider:true });
    } else window.v4cashTable.setData(data);
  } else if (v4S.cview === 'list') { v4S.cpage = 1; v4PagList('v4cashList', mapped, 'cpage', 20, 'v4MoreCash'); }
  else { v4S.cpage = 1; v4PagGrid('v4cashGrid', mapped, 'cpage', 12, 'v4MoreCash'); }
}
// 🏆 Round 10 bonus — cashier drill-down: split, share of shop, busiest hour
function v4CashDetail(name) {
  var d = (window._v4CashData || []).find(function(c){ return c.name === name; });
  if (!d) return;
  var shopTotal = (window._v4CashData || []).reduce(function(s,c){ return s + c.total; }, 0);
  var share = shopTotal > 0 ? (d.total / shopTotal * 100) : 0;
  var peak = 0, peakH = 0;
  d.hours.forEach(function(n,h){ if (n > peak) { peak = n; peakH = h; } });
  function bar(v,l,c){ var pct = d.total>0?Math.round(v/d.total*100):0; return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>'+l+'</span><b style="color:'+c+'">'+fmtMoney(v)+' · '+pct+'%</b></div><div style="height:8px;background:rgba(148,163,184,.15);border-radius:4px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+c+'"></div></div></div>'; }
  var m = document.createElement('div');
  m.id = 'v4cashDetailModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:520px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<b style="font-size:17px">👤 ' + sanitize(name) + '</b>' +
    '<button onclick="document.getElementById(\'v4cashDetailModal\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-bottom:10px">' +
    '<div style="background:rgba(16,185,129,.12);border-radius:10px;padding:10px"><b style="color:#059669;font-size:16px;display:block">' + fmtMoney(d.total) + '</b><small style="font-size:9px;font-weight:800;color:#64748b">TOTAL</small></div>' +
    '<div style="background:rgba(37,99,235,.12);border-radius:10px;padding:10px"><b style="color:#2563eb;font-size:16px;display:block">' + d.count + '</b><small style="font-size:9px;font-weight:800;color:#64748b">SALES</small></div>' +
    '<div style="background:rgba(124,58,237,.12);border-radius:10px;padding:10px"><b style="color:#7c3aed;font-size:16px;display:block">' + fmtMoney(d.count ? d.total/d.count : 0) + '</b><small style="font-size:9px;font-weight:800;color:#64748b">AVG / SALE</small></div></div>' +
    '<b style="font-size:13px">💳 Payment split</b>' +
    bar(d.cash,'💵 Cash','#10b981') + bar(d.card,'💳 Card','#3b82f6') + bar(d.mobile,'📱 Mobile','#f59e0b') + bar(d.credit,'📝 Credit','#ef4444') +
    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed #cbd5e1;margin-top:6px;font-size:12px"><span>🏪 Share of shop revenue</span><b>' + share.toFixed(1) + '%</b></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px"><span>⏰ Busiest hour</span><b>' + (peak > 0 ? String(peakH).padStart(2,'0') + ':00 (' + peak + ' sales)' : '—') + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px"><span>🕒 Active</span><b>' + (d.first ? new Date(d.first).toLocaleDateString() : '—') + ' → ' + (d.last ? new Date(d.last).toLocaleDateString() : '—') + '</b></div>' +
    '<button class="v4-btn p" style="margin-top:10px" onclick="v4CashWA()">📤 Share Performance</button></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
}
function v4CashWA() {
  var d = window._v4CashData || [];
  if (!d.length) { alert('No cashier data to share.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var lbl = { all:'All Time', today:'Today', week:'This Week', month:'This Month', year:'This Year' }[v4S.cperiod] || 'This Month';
  var msg = '👥 CASHIER PERFORMANCE — ' + shop + '\n' + lbl + '\n\n';
  d.slice(0, 10).forEach(function(c, i){
    msg += (i+1) + '. ' + c.name + ' — ' + fmtMoney(c.total) + ' (' + c.count + ' sales, avg ' + fmtMoney(c.count ? c.total/c.count : 0) + ')\n';
  });
  msg += '\n— SmartShop Pro';
  ssShareTo(msg, { title: '👥 Cashier Performance — ' + shop });
}function v4MoreCash(){
  v4S.cpage++;
  v4CashierData().then(function(d){
    var mapped = d.map(function(c){ return { label:c.name, detail:'Cash ' + fmtMoney(c.cash) + ' · Card ' + fmtMoney(c.card) + ' · Mobile ' + fmtMoney(c.mobile) + ' · Credit ' + fmtMoney(c.credit), right:fmtMoney(c.total) }; });
    if (v4S.cview === 'list') v4PagList('v4cashList', mapped, 'cpage', 20, 'v4MoreCash');
    else v4PagGrid('v4cashGrid', mapped, 'cpage', 12, 'v4MoreCash');
  });
}

async function v4RenderTop() {
  var data = await v4TopData();
  window._v4TopDataCache = data;
  if (!v4S.trank) v4S.trank = 'revenue';
  if (v4S.trank === 'qty') data.sort(function(a,b){ return b.qty - a.qty || b.revenue - a.revenue; });
  var periodLbl = { all:'All Time', today:'Today', week:'This Week', month:'This Month', year:'This Year' }[v4S.tperiod] || 'This Month';
  var itemTotal = data.reduce(function(s,p){ return s + p.revenue; }, 0);
  window._v4TopItemTotal = itemTotal;
  var top3 = data.slice(0, 3).reduce(function(s,p){ return s + p.revenue; }, 0);
  var conc = itemTotal > 0 ? Math.round(top3 / itemTotal * 100) : 0;
  // toolbar: rank chips + concentration insight + share (Round 10 bonus)
  var tb = document.getElementById('v4topTools');
  if (!tb && document.getElementById('v4topExcel')) {
    tb = document.createElement('div'); tb.id = 'v4topTools';
    document.getElementById('v4topExcel').parentNode.insertBefore(tb, document.getElementById('v4topExcel'));
  }
  if (tb) tb.innerHTML =
    '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
    '<button class="v4-chip' + (v4S.trank === 'revenue' ? ' active' : '') + '" onclick="v4S.trank=\'revenue\';v4RenderTop()">💰 By Revenue</button>' +
    '<button class="v4-chip' + (v4S.trank === 'qty' ? ' active' : '') + '" onclick="v4S.trank=\'qty\';v4RenderTop()">📦 By Quantity</button>' +
    '<button class="v4-chip" style="margin-left:auto" onclick="v4TopWA()">📤 Share</button></div>' +
    '<small style="display:block;font-size:11px;color:#64748b;margin-bottom:8px">⭐ Top 3 = ' + conc + '% of item revenue · ' + periodLbl + ' · based on ' + (window._v4TopN||0) + ' sales analyzed</small>';
  var mapped = data.map(function(p){
    var prod = v4products.find(function(x){ return x.name === p.name; });
    return { label:sanitize(p.name), detail:'Sold: ' + p.qty + (prod && !prod.isVirtual ? ' · stock ' + prod.stock : ''), right:fmtMoney(p.revenue) };
  });
  var ex = document.getElementById('v4topExcel'), li = document.getElementById('v4topList'), gr = document.getElementById('v4topGrid');
  if (!ex) return;
  ex.style.display = v4S.tview === 'excel' ? 'block' : 'none';
  li.style.display = v4S.tview === 'list' ? 'block' : 'none';
  gr.style.display = v4S.tview === 'grid' ? 'grid' : 'none';
  if (v4S.tview === 'excel') {
    var alive = ex.querySelector('.modern-sheet-table');
    if (!window.v4topTable || !alive) {
      ex.innerHTML = '';
      window.v4topTable = new ModernSheet('v4topExcel', { data:data, columns:[
        { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
        { title:'Product', field:'name', width:'150px', render:function(i,h){ return h?'<b>'+sanitize(i.name)+'</b>':i.name; } },
        { title:'Qty Sold', width:'70px', align:'center', render:function(i,h){ return h?'<b>'+i.qty+'</b>':i.qty; }, total:true, totalValue:function(i){ return i.qty; }, totalFormat:function(s){ return s+' sold'; } },
        { title:'Revenue', width:'100px', align:'right', render:function(i,h){ return h?fmtMoney(i.revenue):i.revenue; }, total:true, totalValue:function(i){ return i.revenue; }, totalFormat:function(s){ return fmtMoney(s); } },
        { title:'Share', width:'64px', align:'center', render:function(i,h){
            var p = window._v4TopItemTotal > 0 ? (i.revenue / window._v4TopItemTotal * 100) : 0;
            return h ? '<b style="color:' + (p >= 10 ? '#059669' : (p >= 3 ? '#f59e0b' : '#94a3b8')) + '">' + p.toFixed(1) + '%</b>' : p;
          }, filterable:false },
        { title:'Est. Margin', width:'92px', align:'right', render:function(i,h){
            var prod = v4products.find(function(x){ return x.name === i.name; });
            if (!prod || !prod.costPrice || !prod.price) return h ? '<span style="color:#94a3b8">—</span>' : '';
            var est = (prod.price - prod.costPrice) * i.qty;
            var mg = prod.price > 0 ? ((prod.price - prod.costPrice) / prod.price * 100) : 0;
            return h ? '<b style="color:' + (mg >= 40 ? '#059669' : (mg >= 20 ? '#f59e0b' : '#ef4444')) + '">' + fmtMoney(est) + '</b><br><small style="color:#64748b">' + mg.toFixed(0) + '%</small>' : est;
          }, filterable:false },
        { title:'', width:'52px', render:function(i,h){
            if (!h) return '';
            var prod = v4products.find(function(x){ return x.name === i.name; });
            return prod ? '<button class="btn-mini" style="background:#e0f2fe;color:#1565c0" title="Open product" onclick="v4ProductDetail(\'' + prod.id + '\')">📋</button>' : '';
          }, filterable:false }
      ], emptyMessage:'No sales in this period', showSearch:false, showFontSlider:true });
    } else window.v4topTable.setData(data);
  } else if (v4S.tview === 'list') { v4S.tpage = 1; v4PagList('v4topList', mapped, 'tpage', 20, 'v4MoreTop'); }
  else { v4S.tpage = 1; v4PagGrid('v4topGrid', mapped, 'tpage', 12, 'v4MoreTop'); }
}
function v4TopWA() {
  var d = window._v4TopDataCache || [];
  if (!d.length) { alert('No top products data to share.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var lbl = { all:'All Time', today:'Today', week:'This Week', month:'This Month', year:'This Year' }[v4S.tperiod] || 'This Month';
  var msg = '🏆 TOP PRODUCTS — ' + shop + '\n' + lbl + '\n\n';
  d.slice(0, 10).forEach(function(p, i){
    msg += (i+1) + '. ' + p.name + ' — ' + fmtMoney(p.revenue) + ' (' + p.qty + ' sold)\n';
  });
  msg += '\n— SmartShop Pro';
  ssShareTo(msg, { title: '🏆 Top Products — ' + shop });
}// ── view/period chip handlers ──
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

// ═══════ FOLD + LAZY — space saver + speed law (100+10) ═══════
var v4lazyDone = {};
function v4Fold(bodyId, arrowId) {
  var body = document.getElementById(bodyId);
  var arrow = document.getElementById(arrowId);
  if (!body) return;
  var opening = (body.style.display === 'none');
  body.style.display = opening ? 'block' : 'none';
  if (arrow) arrow.textContent = opening ? '▾' : '▸';
  if (opening && !v4lazyDone[bodyId]) {          // 🚀 first expand = render now
    // 🛡️ Round 10: mark done ONLY on success — a network blip stays unmarked,
    // so the next expand retries. No more permanently-empty cards.
    var markOk = function(){ v4lazyDone[bodyId] = true; };
    if (bodyId === 'v4detBody') Promise.resolve(v4RenderDetailed()).then(markOk);
    else if (bodyId === 'v4itemBody') Promise.resolve(v4RenderItemDetail(true)).then(markOk);
    else if (bodyId === 'v4cashBody') Promise.resolve(v4RenderCashier()).then(markOk);
    else if (bodyId === 'v4topBody') Promise.resolve(v4RenderTop()).then(markOk);
  }
}
function v4ItemFilterChange() { v4S.itemPool = null; v4S.ipage = 1; v4RenderItemDetail(); }
// ── register my tab loader — LAZY: only the open card renders ──
V4_TAB_LOADERS[2] = function() {
  v4RenderSummary();   // Summaries card is open by default
  // Detailed / Item / Cashier / Top render on first expand (v4Fold) — speed law
};
