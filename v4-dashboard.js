// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — DASHBOARD MODULE v3 · 150%
//  ALL v3 widgets: KPIs + alerts + charts + tables + kitchen
//  + peak hours + forecast + expense chart + expiry + cashier
//  + Smart Insights + Quick Actions + WhatsApp summary +
//  Business Lens for hotels. Period: Day/Week/Month/Year.
// ═════════════════════════════════════════════════════════

var v4salesChart = null, v4payChart = null, v4expChart = null, v4period = 'daily';
var v4lens = 'combined';

function v4IsHotel() {
  return (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel') ||
         (typeof SS_PLAN !== 'undefined' && SS_PLAN.businessType === 'hotel');
}

function v4periodStart(p) {
  var now = new Date();
  if (p === 'daily')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'weekly')  return new Date(now.getTime() - 7*86400000);
  if (p === 'monthly') return new Date(now.getTime() - 30*86400000);
  return new Date(now.getTime() - 365*86400000);
}

// ═══ LENS-AWARE: daily buckets ═══
async function v4LensDaily(start) {
  if (!v4IsHotel() || v4lens === 'combined') {
    return ssFetchDailySummary(start, null);
  }
  try {
    const { data, error } = await supabaseClient.from('sales')
      .select('time, total, payment_method, payments, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString())
      .order('time', { ascending: true }).limit(2000);
    if (error) throw error;
    var filtered = (data || []).filter(function(s) {
      var ot = s.order_type || '';
      if (v4lens === 'cafe') return ot !== 'Room Stay';
      if (v4lens === 'beds') return ot === 'Room Stay';
      return true;
    });
    var map = {};
    filtered.forEach(function(s) {
      var key = String(s.time).slice(0, 10);
      if (!map[key]) map[key] = { date: key, cash:0, card:0, mobile:0, credit:0, tax:0, total:0, count:0 };
      var m = map[key];
      if (s.payment_method === 'split' && Array.isArray(s.payments)) {
        s.payments.forEach(function(p) {
          var pm = p.method || 'cash';
          if (m[pm] !== undefined) m[pm] += Number(p.amount || 0);
        });
      } else {
        var pm2 = s.payment_method || 'cash';
        if (m[pm2] !== undefined) m[pm2] += Number(s.total || 0);
      }
      m.total += Number(s.total || 0);
      m.count++;
    });
    return Object.values(map).sort(function(a,b) { return a.date < b.date ? -1 : 1; });
  } catch(e) { return []; }
}

async function v4LensSales(start) {
  try {
    const { data } = await supabaseClient.from('sales')
      .select('time, total, profit, tax, payment_method, payments, paid_at, order_type, cashier_name, items')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString())
      .order('time', { ascending: false }).limit(2000);
    var rows = data || [];
    if (v4IsHotel() && v4lens !== 'combined') {
      rows = rows.filter(function(s) {
        var ot = s.order_type || '';
        if (v4lens === 'cafe') return ot !== 'Room Stay';
        if (v4lens === 'beds') return ot === 'Room Stay';
        return true;
      });
    }
    return rows;
  } catch(e) { return []; }
}

async function v4YesterdayRevenue() {
  var y = new Date(); y.setDate(y.getDate() - 1);
  var start = new Date(y.getFullYear(), y.getMonth(), y.getDate()).toISOString();
  var end = new Date(y.getFullYear(), y.getMonth(), y.getDate() + 1).toISOString();
  try {
    const { data } = await supabaseClient.from('sales')
      .select('total').eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start).lt('time', end);
    return (data || []).reduce(function(s, x) { return s + Number(x.total || 0); }, 0);
  } catch(e) { return 0; }
}

// ═══ MAIN LOAD ═══
async function loadDashboardV4(period, btn) {
  v4period = period || v4period;
  document.querySelectorAll('#tab0 .period-btn').forEach(function(b){ b.classList.toggle('active', btn ? b === btn : false); });

  var start = v4periodStart(v4period);
  var jobs = [];
  var rev = 0, gp = 0, cd = 0, txCount = 0;
  var pay = { cash:0, card:0, mobile:0, credit:0 };
  var te = 0, tl = 0;

  // 1+2+3: Revenue, payment split, profit, credit — all from ONE query set
  var dataPromise = Promise.all([
    v4LensDaily(start),
    v4LensSales(start),
    v4YesterdayRevenue()
  ]).then(function(results) {
    var daily = results[0], sales = results[1], yRev = results[2];

    // revenue + payments
    daily.forEach(function(d){
      if (new Date(d.date + 'T12:00:00') < start) return;
      rev += d.total; txCount += d.count;
      pay.cash += d.cash || 0; pay.card += d.card || 0;
      pay.mobile += d.mobile || 0; pay.credit += d.credit || 0;
    });
    v4set('v4statRevenue', fmtMoney(rev));
    v4set('v4statRevenueSub', txCount + ' sales');
    v4drawPay(pay);
    v4drawSales7(daily);

    // yesterday comparison
    var el = document.getElementById('v4statRevenueCompare');
    if (el) {
      if (yRev > 0) {
        var change = ((rev - yRev) / yRev) * 100;
        var arrow = change >= 0 ? '▲' : '▼';
        var color = change >= 0 ? '#10b981' : '#ef4444';
        el.innerHTML = '<span style="color:' + color + ';font-size:11px;font-weight:700;">' + arrow + ' ' + Math.abs(change).toFixed(1) + '% vs yesterday</span>';
      } else { el.textContent = ''; }
    }

    // profit + credit
    sales.forEach(function(s){
      gp += Number(s.profit || 0);
      if (s.payment_method === 'credit' && !s.paid_at) cd += Number(s.total || 0);
    });
    v4set('v4statGrossProfit', fmtMoney(gp));
    v4set('v4statCreditDue', fmtMoney(cd));
    v4set('v4statProfitSub', rev > 0 ? (gp / rev * 100).toFixed(1) + '% margin' : '');

    // recent sales (lens-aware)
    var html = sales.slice(0, 6).map(function(s){
      var items = (s.items||[]).map(function(i){ return i.name + '×' + i.qty; }).join(', ');
      var tag = s.order_type === 'Room Stay' ? ' 🛏️' : '';
      return '<div style="padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px"><b>' +
        new Date(s.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</b>' + tag + ' ' +
        sanitize(items || 'Sale') + ' – <b>' + fmtMoney(s.total) + '</b> <small>(' + (s.payment_method||'') + ')</small></div>';
    }).join('');
    var rsEl = document.getElementById('v4recentSales');
    if (rsEl) rsEl.innerHTML = html || 'No sales yet.';

    // cashier breakdown
    var cmap = {};
    sales.forEach(function(s) {
      var name = s.cashier_name || 'Unknown';
      if (!cmap[name]) cmap[name] = { total: 0, count: 0 };
      cmap[name].total += Number(s.total || 0);
      cmap[name].count++;
    });
    var cArr = Object.keys(cmap).map(function(n){ return { n:n, v:cmap[n] }; }).sort(function(a,b){ return b.v.total - a.v.total; });
    var cHtml = cArr.map(function(c){
      return '<div style="padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px;display:flex;justify-content:space-between"><span>👤 ' + sanitize(c.n) + ' <small>(' + c.v.count + ')</small></span><b>' + fmtMoney(c.v.total) + '</b></div>';
    }).join('');
    var cbEl = document.getElementById('v4salesBreakdown');
    if (cbEl) cbEl.innerHTML = cHtml || 'No sales yet.';

    // peak hours (from the same sales data)
    var hourly = new Array(24).fill(0);
    sales.forEach(function(s) {
      hourly[new Date(s.time).getHours()] += Number(s.total || 0);
    });
    var phEl = document.getElementById('v4peakHours');
    if (phEl) v4PeakHoursHTML(phEl, hourly);

    // forecast
    var fEl = document.getElementById('v4forecast');
    if (fEl) v4ForecastHTML(fEl, sales);

    return { rev: rev, gp: gp };
  });
  jobs.push(dataPromise);

  // 4: Expenses + losses
  jobs.push(Promise.all([
    supabaseClient.from('expenses').select('amount, category').eq('shop_id', getShopId()).gte('date', start.toISOString().slice(0,10)).limit(500),
    supabaseClient.from('losses').select('total_loss').eq('shop_id', getShopId()).gte('time', start.toISOString()).limit(300)
  ]).then(function(res){
    var expData = res[0].data || [];
    expData.forEach(function(e){ te += Number(e.amount||0); });
    (res[1].data||[]).forEach(function(l){ tl += Number(l.total_loss||0); });
    v4set('v4statExpenses', fmtMoney(te));
    v4set('v4statExpensesSub', tl > 0 ? 'Losses: ' + fmtMoney(tl) : '');
    // expense chart
    var cats = {};
    expData.forEach(function(e) { var c = e.category || 'General'; cats[c] = (cats[c] || 0) + Number(e.amount || 0); });
    v4drawExpense(cats);
    return te;
  }).catch(function(){ return 0; }));

  // 5: Alerts (low stock, salary, loans, expiry)
  jobs.push(Promise.all([
    supabaseClient.from('products').select('stock, reorder_level, is_virtual, expiry_date, name').eq('shop_id', getShopId()).limit(1000),
    supabaseClient.from('employees').select('salary, status, last_paid').eq('shop_id', getShopId()).eq('status', 'active').limit(100),
    supabaseClient.from('loans').select('status').eq('shop_id', getShopId()).eq('status', 'open').limit(100)
  ]).then(function(res){
    var prods = res[0].data || [];
    var low = prods.filter(function(p){ return !p.is_virtual && (p.stock||0) <= (p.reorder_level||5); }).length;
    v4set('v4statLowStock', low);
    var emps = res[1].data || [];
    var salaryDue = 0;
    emps.forEach(function(e) {
      if (!e.last_paid || (Date.now() - new Date(e.last_paid).getTime()) > 30*86400000) salaryDue++;
    });
    v4set('v4statSalaryAlerts', salaryDue);
    v4set('v4statOpenLoans', (res[2].data || []).length);
    var expSoon = 0, expExpired = 0;
    prods.forEach(function(p) {
      if (!p.expiry_date || p.is_virtual) return;
      var days = Math.ceil((new Date(p.expiry_date) - new Date()) / 86400000);
      if (days < 0) expExpired++;
      else if (days <= 7) expSoon++;
    });
    v4set('v4statExpiring', expSoon + expExpired);
    window._v4Alerts = { low: low, salary: salaryDue, expiry: expSoon + expExpired };
    return true;
  }).catch(function(){ return false; }));

  // 6: Active tables + kitchen
  jobs.push(Promise.all([
    supabaseClient.from('orders').select('table_id, status, time').eq('shop_id', getShopId()).neq('status', 'Paid').limit(50),
    supabaseClient.from('orders').select('status, time').eq('shop_id', getShopId()).gte('time', new Date(Date.now() - 24*3600000).toISOString()).limit(200)
  ]).then(function(res){
    // active tables
    var tEl = document.getElementById('v4activeTables');
    if (tEl) {
      var orders = res[0].data || [];
      if (!orders.length) {
        tEl.innerHTML = '<p style="text-align:center;color:#10b981;padding:10px;font-weight:600;font-size:12px;">✅ No active tables</p>';
      } else {
        var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(75px,1fr));gap:6px">';
        orders.forEach(function(o) {
          var mins = Math.floor((Date.now() - new Date(o.time).getTime()) / 60000);
          var color = o.status === 'Ready' ? '#10b981' : (o.status === 'Preparing' ? '#3b82f6' : '#f59e0b');
          html += '<div style="background:' + color + ';color:white;padding:6px;border-radius:8px;text-align:center;font-size:10px"><b style="display:block;font-size:12px">🪑 ' + sanitize(o.table_id || 'N/A') + '</b>' + o.status + ' (' + mins + 'm)</div>';
        });
        tEl.innerHTML = html + '</div>';
      }
    }
    // kitchen
    var kEl = document.getElementById('v4kitchenStatus');
    if (kEl) {
      var pending = 0, preparing = 0, ready = 0;
      (res[1].data || []).forEach(function(o) {
        if (o.status === 'Pending') pending++;
        else if (o.status === 'Preparing') preparing++;
        else if (o.status === 'Ready') ready++;
      });
      kEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center">' +
        '<div style="background:#fffbeb;padding:8px;border-radius:8px"><b style="display:block;font-size:16px;color:#f59e0b">' + pending + '</b><small style="font-size:10px">Pending</small></div>' +
        '<div style="background:#eff6ff;padding:8px;border-radius:8px"><b style="display:block;font-size:16px;color:#3b82f6">' + preparing + '</b><small style="font-size:10px">Preparing</small></div>' +
        '<div style="background:#ecfdf5;padding:8px;border-radius:8px"><b style="display:block;font-size:16px;color:#10b981">' + ready + '</b><small style="font-size:10px">Ready</small></div></div>';
    }
    return true;
  }).catch(function(){ return false; }));

  // 7: Hotel occupancy (hotels only)
  if (v4IsHotel()) {
    jobs.push(supabaseClient.from('rooms').select('status').eq('shop_id', getShopId()).limit(100)
      .then(function(rd){
        var rooms = rd.data || [];
        var occ = rooms.filter(function(r){ return r.status === 'occupied'; }).length;
        var free = rooms.filter(function(r){ return r.status === 'available'; }).length;
        var pct = rooms.length > 0 ? Math.round(occ / rooms.length * 100) : 0;
        var card = document.getElementById('v4occupancyCard');
        var el = document.getElementById('v4occupancy');
        if (card) card.style.display = 'block';
        if (el) {
          el.innerHTML = '<div style="display:flex;gap:10px;align-items:center;justify-content:center">' +
            '<div style="text-align:center"><b style="font-size:22px;color:' + (pct > 80 ? '#ef4444' : '#3b82f6') + '">' + pct + '%</b><br><small style="font-size:9px;font-weight:800;color:#64748b">OCCUPIED</small></div>' +
            '<div style="text-align:center"><b style="font-size:22px;color:#10b981">' + free + '</b><br><small style="font-size:9px;font-weight:800;color:#64748b">FREE</small></div>' +
            '<div style="text-align:center"><b style="font-size:22px;color:#64748b">' + rooms.length + '</b><br><small style="font-size:9px;font-weight:800;color:#64748b">TOTAL</small></div></div>';
        }
        return true;
      }).catch(function(){ return false; }));
  }

  await Promise.all(jobs);

  // compute net + insights (after all data)
  var net = gp - tl - te;
  v4set('v4statNetProfit', fmtMoney(net));
  v4set('v4statNetSub', net >= 0 ? '👍 Healthy' : '👎 Loss');
  window._v4Rev = rev;
  window._v4Net = net;
  v4SmartInsights();
}

function v4set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

// ═══ CHARTS ═══
function v4drawSales7(rows) {
  var ctx = document.getElementById('v4salesChart');
  if (!ctx || typeof Chart === 'undefined') return;
  var days = [];
  for (var i = 6; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    days.push({ key: d.toISOString().slice(0,10), label: d.toLocaleDateString('en-US',{weekday:'short'}), total: 0 }); }
  (rows||[]).forEach(function(r){ var day = days.find(function(x){ return x.key === r.date; }); if (day) day.total += r.total; });
  if (v4salesChart) v4salesChart.destroy();
  v4salesChart = new Chart(ctx, { type:'bar', data:{ labels: days.map(function(d){return d.label;}),
    datasets:[{ label:'Revenue', data: days.map(function(d){return d.total;}), backgroundColor:'#3b82f6', borderRadius:6 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } } });
}

function v4drawPay(pay) {
  var ctx = document.getElementById('v4payChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (v4payChart) v4payChart.destroy();
  v4payChart = new Chart(ctx, { type:'doughnut',
    data:{ labels:['Cash','Card','Mobile','Credit'],
      datasets:[{ data:[pay.cash, pay.card, pay.mobile, pay.credit],
        backgroundColor:['#10b981','#3b82f6','#f59e0b','#ef4444'], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{size:10} } } } } });
}

function v4drawExpense(cats) {
  var ctx = document.getElementById('v4expenseChart');
  if (!ctx || typeof Chart === 'undefined') return;
  var labels = Object.keys(cats);
  var values = labels.map(function(k){ return cats[k]; });
  if (!labels.length) { labels = ['No expenses']; values = [0]; }
  var colors = ['#ef4444','#f97316','#facc15','#10b981','#3b82f6','#8b5cf6','#ec4899','#64748b'];
  if (v4expChart) v4expChart.destroy();
  v4expChart = new Chart(ctx, { type:'doughnut',
    data:{ labels: labels, datasets:[{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{size:9} } } } } });
}

// ═══ PEAK HOURS ═══
function v4PeakHoursHTML(el, hourly) {
  var maxSale = Math.max.apply(null, hourly);
  var html = '';
  for (var h = 6; h < 24; h++) {
    var total = hourly[h];
    if (total === 0 && h > 22) continue;
    var percent = maxSale > 0 ? (total / maxSale * 100) : 0;
    var color = '#f1f5f9';
    if (total > 0) {
      if (percent > 75) color = '#dc2626';
      else if (percent > 50) color = '#f97316';
      else if (percent > 25) color = '#facc15';
      else color = '#86efac';
    }
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:10px;margin-bottom:2px">' +
      '<div style="width:34px;color:#64748b;font-weight:700">' + (h < 10 ? '0' + h : h) + ':00</div>' +
      '<div style="flex:1;height:10px;background:#f8fafc;border-radius:5px;overflow:hidden">' +
      '<div style="width:' + percent + '%;height:100%;background:' + color + ';border-radius:5px"></div></div>' +
      '<div style="width:50px;text-align:right;font-weight:600;font-size:10px;color:#1e293b">' + (total > 0 ? fmtMoney(total) : '—') + '</div></div>';
  }
  html += '<div style="margin-top:6px;font-size:9px;color:#94a3b8;text-align:center">🟢 Quiet · 🟡 Moderate · 🟠 Busy · 🔴 Peak</div>';
  el.innerHTML = html;
}

// ═══ FORECAST ═══
function v4ForecastHTML(el, sales) {
  var total = 0, daysCount = 0;
  var byDay = {};
  sales.forEach(function(s) {
    var ds = new Date(s.time).toDateString();
    if (!byDay[ds]) { byDay[ds] = 0; daysCount++; }
    byDay[ds] += Number(s.total || 0);
  });
  Object.keys(byDay).forEach(function(k) { total += byDay[k]; });

  if (daysCount === 0) {
    el.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:10px">Not enough data to forecast yet.</p>';
    return;
  }
  var avg = total / daysCount;
  // top items
  var items = {};
  sales.forEach(function(s) {
    (s.items || []).forEach(function(i) {
      items[i.name] = (items[i.name] || 0) + (i.qty || 0);
    });
  });
  var topItems = Object.keys(items).map(function(n){ return { n:n, q:items[n] }; }).sort(function(a,b){ return b.q - a.q; }).slice(0, 4);

  var html = '<div style="background:#eff6ff;padding:10px;border-radius:10px;text-align:center;margin-bottom:8px;border:1px solid #bfdbfe">' +
    '<div style="font-size:10px;color:#2563eb;font-weight:800">EXPECTED REVENUE (TOMORROW)</div>' +
    '<div style="font-size:22px;font-weight:800;color:#1e3a8a">' + fmtMoney(avg) + '</div>' +
    '<small style="color:#64748b;font-size:10px">Based on ' + daysCount + '-day average</small></div>';
  if (topItems.length) {
    html += '<div style="font-size:10px;font-weight:800;color:#64748b;margin-bottom:4px">🛒 SMART PREP LIST (avg daily qty)</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px">';
    topItems.forEach(function(x) {
      html += '<div style="background:#f8fafc;padding:6px;border-radius:6px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px">' +
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px">' + sanitize(x.n) + '</span>' +
        '<b style="color:#f59e0b">~' + Math.ceil(x.q / Math.max(1, daysCount)) + '</b></div>';
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

// ═══ SMART INSIGHTS ═══
function v4SmartInsights() {
  var el = document.getElementById('v4insights');
  if (!el) return;
  var tips = [];
  var a = window._v4Alerts || {};
  var net = window._v4Net || 0;
  var rev = window._v4Rev || 0;

  if (a.low > 0) tips.push({ icon:'📦', text: a.low + ' product(s) low — check Smart Restock', color:'#ea580c', tab:3 });
  if (a.expiry > 0) tips.push({ icon:'📅', text: a.expiry + ' item(s) expiring — check Expiry Manager', color:'#f59e0b', tab:3 });
  if (a.salary > 0) tips.push({ icon:'💰', text: a.salary + ' salary payment(s) due — check Payroll', color:'#7c3aed', tab:6 });
  if (net < 0) tips.push({ icon:'📉', text: 'Net is NEGATIVE — review expenses', color:'#dc2626', tab:7 });
  else if (rev > 0 && (net / rev * 100) > 20) tips.push({ icon:'💪', text: 'Net margin ' + (net / rev * 100).toFixed(0) + '% — excellent!', color:'#10b981' });

  if (!tips.length) {
    el.innerHTML = '<div style="background:rgba(16,185,129,.1);border-radius:10px;padding:8px;text-align:center;font-weight:700;color:#10b981;font-size:12px">✅ All systems healthy!</div>';
    return;
  }
  var html = '';
  tips.slice(0, 3).forEach(function(t) {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px;' + (t.tab ? 'cursor:pointer;' : '') + '"' +
      (t.tab ? ' onclick="selectTab(' + t.tab + ', document.getElementById(\'stab' + t.tab + '\'))"' : '') + '>' +
      '<span style="font-size:15px">' + t.icon + '</span>' +
      '<span style="flex:1;color:' + t.color + ';">' + t.text + '</span>' +
      (t.tab ? '<span style="color:#94a3b8">›</span>' : '') + '</div>';
  });
  el.innerHTML = html;
}

// ═══ WHATSAPP DAILY SUMMARY ═══
function v4DailySummaryWA() {
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var rev = document.getElementById('v4statRevenue').textContent;
  var gp = document.getElementById('v4statGrossProfit').textContent;
  var exp = document.getElementById('v4statExpenses').textContent;
  var net = document.getElementById('v4statNetProfit').textContent;
  var msg = '📊 DAILY SUMMARY — ' + shop + '\n' + new Date().toLocaleDateString() + '\n\n' +
    '💰 Revenue: ' + rev + '\n📈 Gross Profit: ' + gp + '\n💸 Expenses: ' + exp + '\n💎 Net: ' + net + '\n\n— SmartShop Pro';
  ssShareTo(msg, { title: '📊 Daily Summary — ' + shop });
}
// ═══ LENS SWITCHER ═══
function v4LensEnsure() {
  if (!v4IsHotel()) return;
  var bar = document.getElementById('v4LensBar');
  if (!bar) return;
  bar.style.display = 'flex';
  if (bar.children.length > 0) return;   // already built
  var opts = [
    ['combined','🏨 Whole Business'],
    ['cafe','☕ Cafe Service'],
    ['beds','🛏️ Room Service']
  ];
  opts.forEach(function(o){
    var b = document.createElement('button');
    b.className = 'period-btn' + (v4lens === o[0] ? ' active' : '');
    b.style.cssText = 'flex:1;padding:9px 6px;border:2px solid #e2e8f0;border-radius:24px;font-size:11px;background:#fff;cursor:pointer;font-weight:700;color:#64748b;';
    b.textContent = o[1];
    b.onclick = function() {
      v4lens = o[0];
      bar.querySelectorAll('.period-btn').forEach(function(x){ x.style.background = '#fff'; x.style.color = '#64748b'; x.style.borderColor = '#e2e8f0'; });
      b.style.background = '#3b82f6'; b.style.color = '#fff'; b.style.borderColor = '#3b82f6';
      loadDashboardV4(v4period, document.querySelector('#tab0 .period-btn.active'));
    };
    if (v4lens === o[0]) { b.style.background = '#3b82f6'; b.style.color = '#fff'; b.style.borderColor = '#3b82f6'; }
    bar.appendChild(b);
  });
}

// ── register my tab loader ──
V4_TAB_LOADERS[0] = function() {
    v4DashboardTypeAware();
    v4LensEnsure();
    loadDashboardV4(v4period, document.querySelector('.period-btn.active'));
};

// ═══ TYPE-AWARE DASHBOARD — show/hide widgets based on shop type ═══
function v4DashboardTypeAware() {
    var bizType = (window.__currentShopRow && window.__currentShopRow.business_type) ||
                  (typeof SS_PLAN !== 'undefined' ? SS_PLAN.businessType : 'retail');

    // Widget elements
    var tablesCard = document.getElementById('v4activeTables') ? document.getElementById('v4activeTables').closest('.card') : null;
    var kitchenCard = document.getElementById('v4kitchenStatus') ? document.getElementById('v4kitchenStatus').closest('.card') : null;
    var occupancyCard = document.getElementById('v4occupancyCard');
    var peakCard = document.getElementById('v4peakHours') ? document.getElementById('v4peakHours').closest('.card') : null;
    var forecastCard = document.getElementById('v4forecast') ? document.getElementById('v4forecast').closest('.card') : null;

    if (bizType === 'hotel') {
        // 🏨 HOTEL: show everything (lens + occupancy + tables + kitchen + peak + forecast)
        if (occupancyCard) occupancyCard.style.display = 'block';
        if (tablesCard) tablesCard.style.display = 'block';
        if (kitchenCard) kitchenCard.style.display = 'block';
        if (peakCard) peakCard.style.display = 'block';
        if (forecastCard) forecastCard.style.display = 'block';
        // Business Lens (3 buttons)
        var lensBar = document.getElementById('v4LensBar');
        if (lensBar) lensBar.style.display = 'flex';
    } else if (bizType === 'cafe') {
        // ☕ CAFE: show tables + kitchen + peak + forecast, hide occupancy and lens
        if (occupancyCard) occupancyCard.style.display = 'none';
        if (tablesCard) tablesCard.style.display = 'block';
        if (kitchenCard) kitchenCard.style.display = 'block';
        if (peakCard) peakCard.style.display = 'block';
        if (forecastCard) forecastCard.style.display = 'block';
        // No lens (not hotel)
        var lensBar2 = document.getElementById('v4LensBar');
        if (lensBar2) lensBar2.style.display = 'none';
    } else {
        // 🛒 RETAIL: hide cafe/hotel widgets, show only peak + forecast
        if (occupancyCard) occupancyCard.style.display = 'none';
        if (tablesCard) tablesCard.style.display = 'none';
        if (kitchenCard) kitchenCard.style.display = 'none';
        if (peakCard) peakCard.style.display = 'block';
        if (forecastCard) forecastCard.style.display = 'block';
        // No lens
        var lensBar3 = document.getElementById('v4LensBar');
        if (lensBar3) lensBar3.style.display = 'none';
    }
}
