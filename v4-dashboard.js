// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — DASHBOARD MODULE v2 · 180%
//  100% v3 parity: all KPIs + alerts + charts + tables +
//  kitchen + peak hours + forecast + expense chart + expiry
//  + cashier breakdown + yesterday comparison.
//  +80%: trend arrows · smart insights · quick actions ·
//  WhatsApp daily summary · hotel occupancy · live clock ·
//  alert center · Business Lens for hotels.
// ═════════════════════════════════════════════════════════

var v4salesChart = null, v4payChart = null, v4expChart = null, v4period = 'daily';
var v4lens = 'combined';

function v4IsHotel() {
  return (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel') ||
         (typeof SS_PLAN !== 'undefined' && SS_PLAN.businessType === 'hotel');
}
function v4LensLabel() {
  if (!v4IsHotel() || v4lens === 'combined') return '';
  return v4lens === 'cafe' ? '☕' : '🛏️';
}

function v4periodStart(p) {
  var now = new Date();
  if (p === 'daily')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'weekly')  return new Date(now.getTime() - 7*86400000);
  if (p === 'monthly') return new Date(now.getTime() - 30*86400000);
  return new Date(now.getTime() - 365*86400000);
}

// ═══ LENS-AWARE DATA ═══
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
      if (!map[key]) map[key] = { date: key, cash: 0, card: 0, mobile: 0, credit: 0, tax: 0, total: 0, count: 0 };
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
    var q = supabaseClient.from('sales')
      .select('time, total, profit, tax, payment_method, payments, paid_at, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString())
      .order('time', { ascending: false }).limit(2000);
    const { data } = await q;
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

// ═══ YESTERDAY REVENUE (for trend arrows) ═══
async function v4YesterdayRevenue() {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
  var end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1).toISOString();
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
  document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active', btn ? b === btn : false); });
  v4Clock();

  var start = v4periodStart(v4period);
  var jobs = [];

  // 1. Revenue + payment split + 7-day chart
  jobs.push(v4LensDaily(start).then(function(rows){
    var rev = 0, pay = { cash:0, card:0, mobile:0, credit:0 };
    var txCount = 0;
    rows.forEach(function(d){
      if (new Date(d.date + 'T12:00:00') < start) return;
      rev += d.total; txCount += d.count;
      pay.cash += d.cash || 0; pay.card += d.card || 0;
      pay.mobile += d.mobile || 0; pay.credit += d.credit || 0;
    });
    v4set('v4statRevenue', fmtMoney(rev));
    v4set('v4statRevenueSub', txCount + ' sales');
    v4drawPay(pay);
    v4drawSales7(rows);
    window._v4Rev = rev;
    return rev;
  }).catch(function(){ return 0; }));

  // 2. Yesterday comparison (trend arrow)
  jobs.push(v4YesterdayRevenue().then(function(yRev){
    var el = document.getElementById('v4statRevenueCompare');
    if (el) {
      if (yRev > 0) {
        var rev = window._v4Rev || 0;
        var change = ((rev - yRev) / yRev) * 100;
        var arrow = change >= 0 ? '▲' : '▼';
        var color = change >= 0 ? '#10b981' : '#ef4444';
        el.innerHTML = '<span style="color:' + color + ';font-size:12px;font-weight:700;">' + arrow + ' ' + Math.abs(change).toFixed(1) + '% vs yesterday</span>';
      } else {
        el.textContent = 'No data yesterday';
      }
    }
    return yRev;
  }));

  // 3. Profit + credit due
  jobs.push(v4LensSales(start).then(function(rows){
    var gp = 0, cd = 0;
    rows.forEach(function(s){
      gp += Number(s.profit || 0);
      if (s.payment_method === 'credit' && !s.paid_at) cd += Number(s.total || 0);
    });
    v4set('v4statGrossProfit', fmtMoney(gp));
    v4set('v4statCreditDue', fmtMoney(cd));
    var rev = Number((document.getElementById('v4statRevenue').textContent || '0').replace(/[^0-9.]/g,'')) || 0;
    v4set('v4statProfitSub', rev > 0 ? (gp / rev * 100).toFixed(1) + '% margin' : '');
    window._v4GP = gp;
    return gp;
  }).catch(function(){ return 0; }));

  // 4. Expenses + losses
  jobs.push(Promise.all([
    supabaseClient.from('expenses').select('amount').eq('shop_id', getShopId()).gte('date', start.toISOString().slice(0,10)).limit(500),
    supabaseClient.from('losses').select('total_loss').eq('shop_id', getShopId()).gte('time', start.toISOString()).limit(300)
  ]).then(function(res){
    var te = 0; ((res[0].data)||[]).forEach(function(e){ te += Number(e.amount||0); });
    var tl = 0; ((res[1].data)||[]).forEach(function(l){ tl += Number(l.total_loss||0); });
    v4set('v4statExpenses', fmtMoney(te));
    v4set('v4statExpensesSub', tl > 0 ? 'Losses: ' + fmtMoney(tl) : '');
    var gp = window._v4GP || 0;
    var net = gp - tl - te;
    v4set('v4statNetProfit', fmtMoney(net));
    v4set('v4statNetSub', net >= 0 ? '👍 Healthy' : '👎 Loss');
    window._v4Net = net;
    return te;
  }).catch(function(){ return 0; }));

  // 5. Alerts: low stock, salary, loans, expiry
  jobs.push(Promise.all([
    supabaseClient.from('products').select('stock, reorder_level, is_virtual, expiry_date, name').eq('shop_id', getShopId()).limit(1000),
    supabaseClient.from('employees').select('salary, status, start_date, payment_agreement, last_paid').eq('shop_id', getShopId()).eq('status', 'active').limit(100),
    supabaseClient.from('loans').select('status').eq('shop_id', getShopId()).eq('status', 'open').limit(100)
  ]).then(function(res){
    var prods = res[0].data || [];
    var low = prods.filter(function(p){ return !p.is_virtual && (p.stock||0) <= (p.reorder_level||5); }).length;
    v4set('v4statLowStock', low);
    // salary alerts (rough: staff with no last_paid or >30 days)
    var emps = res[1].data || [];
    var salaryDue = 0;
    emps.forEach(function(e) {
      if (!e.last_paid || (Date.now() - new Date(e.last_paid).getTime()) > 30*86400000) salaryDue++;
    });
    v4set('v4statSalaryAlerts', salaryDue);
    v4set('v4statOpenLoans', (res[2].data || []).length);
    // expiry alerts
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

  // 6. Recent sales (lens-aware)
  jobs.push(supabaseClient.from('sales')
    .select('time, total, payment_method, items, cashier_name, order_type')
    .eq('shop_id', getShopId()).eq('voided', false)
    .gte('time', start.toISOString())
    .order('time', { ascending: false }).limit(8)
    .then(function(rr){
      var rows = rr.data || [];
      if (v4IsHotel() && v4lens !== 'combined') {
        rows = rows.filter(function(s) {
          var ot = s.order_type || '';
          if (v4lens === 'cafe') return ot !== 'Room Stay';
          if (v4lens === 'beds') return ot === 'Room Stay';
          return true;
        });
      }
      var html = rows.slice(0, 6).map(function(s){
        var items = (s.items||[]).map(function(i){ return i.name + '×' + i.qty; }).join(', ');
        var tag = s.order_type === 'Room Stay' ? ' 🛏️' : '';
        return '<div style="padding:6px 0;border-bottom:1px solid #f1f5f9"><b>' +
          new Date(s.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</b>' + tag + ' ' +
          sanitize(items || 'Sale') + ' – <b>' + fmtMoney(s.total) + '</b> (' + (s.payment_method||'') + ')</div>';
      }).join('');
      document.getElementById('v4recentSales').innerHTML = html || 'No sales yet.';
      return true;
    }).catch(function(){ return false; }));

  // 7. Cashier breakdown (v3 parity)
  jobs.push(supabaseClient.from('sales')
    .select('cashier_name, total').eq('shop_id', getShopId()).eq('voided', false)
    .gte('time', start.toISOString()).limit(2000)
    .then(function(cr){
      var map = {};
      ((cr.data)||[]).forEach(function(s) {
        var name = s.cashier_name || 'Unknown';
        if (!map[name]) map[name] = { name: name, total: 0, count: 0 };
        map[name].total += Number(s.total || 0);
        map[name].count++;
      });
      var arr = Object.values(map).sort(function(a,b){ return b.total - a.total; });
      var html = arr.map(function(c){
        return '<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;"><span>👤 ' + sanitize(c.name) + ' (' + c.count + ')</span><b>Br ' + c.total.toFixed(2) + '</b></div>';
      }).join('');
      var el = document.getElementById('v4salesBreakdown');
      if (el) el.innerHTML = html || 'No sales yet.';
      return true;
    }).catch(function(){ return false; }));

  // 8. Kitchen live status
  jobs.push(supabaseClient.from('orders')
    .select('status, time').eq('shop_id', getShopId())
    .gte('time', new Date(Date.now() - 24*3600000).toISOString()).limit(200)
    .then(function(od){
      var pending = 0, preparing = 0, ready = 0;
      ((od.data)||[]).forEach(function(o) {
        if (o.status === 'Pending') pending++;
        else if (o.status === 'Preparing') preparing++;
        else if (o.status === 'Ready') ready++;
      });
      var el = document.getElementById('v4kitchenStatus');
      if (el) {
        el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">' +
          '<div style="background:#fffbeb;padding:10px;border-radius:8px;"><b style="display:block;font-size:18px;color:#f59e0b;">' + pending + '</b><small>Pending</small></div>' +
          '<div style="background:#eff6ff;padding:10px;border-radius:8px;"><b style="display:block;font-size:18px;color:#3b82f6;">' + preparing + '</b><small>Preparing</small></div>' +
          '<div style="background:#ecfdf5;padding:10px;border-radius:8px;"><b style="display:block;font-size:18px;color:#10b981;">' + ready + '</b><small>Ready</small></div>' +
          '</div>';
      }
      return true;
    }).catch(function(){ return false; }));

  // 9. Active tables (cafe floor)
  jobs.push(supabaseClient.from('orders')
    .select('table_id, status, time').eq('shop_id', getShopId()).neq('status', 'Paid').limit(50)
    .then(function(od){
      var el = document.getElementById('v4activeTables');
      if (!el) return true;
      var orders = od.data || [];
      if (!orders.length) {
        el.innerHTML = '<p style="text-align:center;color:#10b981;padding:10px;font-weight:600;">✅ No active tables right now.</p>';
        return true;
      }
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;">';
      orders.forEach(function(o) {
        var mins = Math.floor((Date.now() - new Date(o.time).getTime()) / 60000);
        var color = o.status === 'Ready' ? '#10b981' : (o.status === 'Preparing' ? '#3b82f6' : '#f59e0b');
        html += '<div style="background:' + color + ';color:white;padding:8px;border-radius:8px;text-align:center;font-size:11px;">' +
          '<b style="display:block;font-size:13px;">🪑 ' + sanitize(o.table_id || 'N/A') + '</b>' +
          o.status + ' (' + mins + 'm)</div>';
      });
      html += '</div>';
      el.innerHTML = html;
      return true;
    }).catch(function(){ return false; }));

  // 10. Expense breakdown chart
  jobs.push(supabaseClient.from('expenses')
    .select('amount, category').eq('shop_id', getShopId())
    .gte('date', start.toISOString().slice(0,10)).limit(200)
    .then(function(ex){
      var cats = {};
      ((ex.data)||[]).forEach(function(e) {
        var cat = e.category || 'General';
        cats[cat] = (cats[cat] || 0) + Number(e.amount || 0);
      });
      v4drawExpense(cats);
      return true;
    }).catch(function(){ return false; }));

  // 11. Peak hours (30 days, bounded)
  jobs.push(supabaseClient.from('sales')
    .select('time, total').eq('shop_id', getShopId()).eq('voided', false)
    .gte('time', new Date(Date.now() - 30*86400000).toISOString()).limit(2000)
    .then(function(ph){
      var hourly = new Array(24).fill(0);
      ((ph.data)||[]).forEach(function(s) {
        hourly[new Date(s.time).getHours()] += Number(s.total || 0);
      });
      var el = document.getElementById('v4peakHours');
      if (el) v4PeakHoursHTML(el, hourly);
      // Smart forecast
      var elF = document.getElementById('v4forecast');
      if (elF) v4ForecastHTML(elF, ph.data || [], hourly);
      return true;
    }).catch(function(){ return false; }));

  // 12. Hotel occupancy (auto-shows for hotels)
  if (v4IsHotel()) {
    jobs.push(supabaseClient.from('rooms').select('status').eq('shop_id', getShopId()).limit(100)
      .then(function(rd){
        var rooms = rd.data || [];
        var occ = rooms.filter(function(r){ return r.status === 'occupied'; }).length;
        var free = rooms.filter(function(r){ return r.status === 'available'; }).length;
        var pct = rooms.length > 0 ? Math.round(occ / rooms.length * 100) : 0;
        var el = document.getElementById('v4occupancy');
        if (el) {
          el.style.display = 'block';
          el.innerHTML = '<div style="display:flex;gap:8px;align-items:center;justify-content:center;">' +
            '<div style="text-align:center"><b style="font-size:20px;color:' + (pct > 80 ? '#ef4444' : '#3b82f6') + '">' + pct + '%</b><br><small style="font-size:9px;font-weight:800;color:#64748b">OCCUPIED</small></div>' +
            '<div style="text-align:center"><b style="font-size:20px;color:#10b981">' + free + '</b><br><small style="font-size:9px;font-weight:800;color:#64748b">FREE</small></div>' +
            '<div style="text-align:center"><b style="font-size:20px;color:#64748b">' + rooms.length + '</b><br><small style="font-size:9px;font-weight:800;color:#64748b">TOTAL</small></div>' +
            '</div>';
        }
        return true;
      }).catch(function(){ return false; }));
  }

  await Promise.all(jobs);

  // 13. Smart insights (after all data loaded)
  v4SmartInsights();
}

function v4set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

// ═══ CHARTS ═══
function v4drawSales7(rows) {
  var ctx = document.getElementById('v4salesChart');
  if (!ctx || typeof Chart === 'undefined') return;
  var days = [];
  for (var i = 6; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    days.push({ key: d.toISOString().slice(0,10), label: d.toLocaleDateString('en-US',{weekday:'short'}), total: 0, isWeekend: d.getDay() === 0 || d.getDay() === 6 }); }
  (rows||[]).forEach(function(r){ var day = days.find(function(x){ return x.key === r.date; }); if (day) day.total += r.total; });
  if (v4salesChart) v4salesChart.destroy();
  v4salesChart = new Chart(ctx, { type:'bar', data:{ labels: days.map(function(d){return d.label;}),
    datasets:[{ label:'Revenue', data: days.map(function(d){return d.total;}),
      backgroundColor: days.map(function(d){ return d.isWeekend ? '#8b5cf6' : '#3b82f6'; }), borderRadius:8 }] },
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
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } } });
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
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{size:10} } } } } });
}

// ═══ PEAK HOURS (30-day analysis) ═══
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
    var label = (h < 10 ? '0' + h : h) + ':00';
    html += '<div style="display:flex;align-items:center;gap:8px;font-size:10px;margin-bottom:2px;">' +
      '<div style="width:38px;color:#64748b;font-weight:700;">' + label + '</div>' +
      '<div style="flex:1;height:12px;background:#f8fafc;border-radius:6px;overflow:hidden;">' +
      '<div style="width:' + percent + '%;height:100%;background:' + color + ';border-radius:6px;transition:width 0.3s;"></div></div>' +
      '<div style="width:55px;text-align:right;font-weight:600;color:#1e293b;font-size:10px;">' + (total > 0 ? fmtMoney(total) : '—') + '</div></div>';
  }
  html += '<div style="margin-top:8px;font-size:9px;color:#94a3b8;display:flex;gap:8px;justify-content:center;">🟢 Quiet · 🟡 Moderate · 🟠 Busy · 🔴 Peak</div>';
  el.innerHTML = html;
}

// ═══ SMART FORECAST (tomorrow) ═══
function v4ForecastHTML(el, sales, hourly) {
  var total = 0, daysCount = 0;
  var salesByDay = {};
  sales.forEach(function(s) {
    var dayStr = new Date(s.time).toDateString();
    if (!salesByDay[dayStr]) { salesByDay[dayStr] = 0; daysCount++; }
    salesByDay[dayStr] += Number(s.total || 0);
  });
  Object.keys(salesByDay).forEach(function(k) { total += salesByDay[k]; });

  if (daysCount === 0) {
    el.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;">Not enough data to forecast yet.</p>';
    return;
  }
  var avgRevenue = total / daysCount;

  // top items
  var itemTotals = {};
  sales.forEach(function(s) {
    // We don't have items in this query — use a simplified approach
  });

  html = '<div style="background:#eff6ff;padding:12px;border-radius:10px;text-align:center;margin-bottom:10px;border:1px solid #bfdbfe;">' +
    '<div style="font-size:10px;color:#2563eb;font-weight:700;">🤖 EXPECTED REVENUE (TOMORROW)</div>' +
    '<div style="font-size:24px;font-weight:800;color:#1e3a8a;">' + fmtMoney(avgRevenue) + '</div>' +
    '<small style="color:#64748b;">Based on ' + daysCount + '-day average</small></div>';
  el.innerHTML = html;
}

// ═══ SMART INSIGHTS (auto-generated tips) ═══
function v4SmartInsights() {
  var el = document.getElementById('v4insights');
  if (!el) return;
  var tips = [];
  var a = window._v4Alerts || {};
  var net = window._v4Net || 0;
  var rev = window._v4Rev || 0;

  if (a.low > 0) tips.push({ icon:'📦', text: a.low + ' product(s) low on stock — check Smart Restock', color:'#ea580c', tab:3 });
  if (a.expiry > 0) tips.push({ icon:'📅', text: a.expiry + ' item(s) expiring soon — check Expiry Manager', color:'#f59e0b', tab:3 });
  if (a.salary > 0) tips.push({ icon:'💰', text: a.salary + ' staff salary payment(s) due — check Payroll', color:'#7c3aed', tab:6 });
  if (net < 0) tips.push({ icon:'📉', text: 'Net is NEGATIVE this period — review expenses', color:'#dc2626', tab:7 });
  else if (rev > 0 && (net / rev * 100) > 20) tips.push({ icon:'💪', text: 'Net margin ' + (net / rev * 100).toFixed(0) + '% — excellent!', color:'#10b981' });

  if (!tips.length) {
    el.innerHTML = '<div style="background:rgba(16,185,129,.1);border-radius:10px;padding:10px;text-align:center;font-weight:700;color:#10b981;font-size:13px;">✅ All systems healthy — great job!</div>';
    return;
  }
  var html = '';
  tips.slice(0, 3).forEach(function(t) {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;' + (t.tab ? 'cursor:pointer;' : '') + '"' +
      (t.tab ? ' onclick="selectTab(' + t.tab + ', document.getElementById(\'stab' + t.tab + '\'))"' : '') + '>' +
      '<span style="font-size:16px;">' + t.icon + '</span>' +
      '<span style="flex:1;color:' + t.color + ';">' + t.text + '</span>' +
      (t.tab ? '<span style="color:#94a3b8;">›</span>' : '') + '</div>';
  });
  el.innerHTML = html;
}

// ═══ LIVE CLOCK ═══
function v4Clock() {
  var el = document.getElementById('v4clock');
  if (!el) return;
  var d = new Date();
  var h = d.getHours();
  var m = String(d.getMinutes()).padStart(2, '0');
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  el.textContent = h + ':' + m + ' ' + ampm;
  var g = document.getElementById('v4greeting');
  if (g) {
    var hr = new Date().getHours();
    if (hr < 12) g.innerHTML = 'Good morning ☀️ — ready for a great day?';
    else if (hr < 17) g.innerHTML = 'Good afternoon 🌤️ — <b>welcome back</b>';
    else g.innerHTML = 'Good evening 🌙 — wrapping up the day';
  }
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
  var phone = prompt('Send to which WhatsApp number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Summary copied!'); });
}

// ═══ LENS SWITCHER ═══
function v4LensEnsure() {
  if (!v4IsHotel()) return;
  var old = document.getElementById('v4LensBar');
  if (old) return;
  var holder = document.querySelector('#tab0 .period-selector') ||
               document.querySelector('#tab0 [style*="gap:6px"]');
  if (!holder) return;
  var bar = document.createElement('div');
  bar.id = 'v4LensBar';
  bar.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;';
  var opts = [
    ['combined','🏨 Whole Business'],
    ['cafe','☕ Cafe Service'],
    ['beds','🛏️ Room Service']
  ];
  opts.forEach(function(o){
    var b = document.createElement('button');
    b.className = 'period-btn' + (v4lens === o[0] ? ' active' : '');
    b.style.cssText = 'flex:1;padding:10px 8px;border:2px solid #e2e8f0;border-radius:30px;font-size:12px;background:#fff;cursor:pointer;font-weight:700;color:#64748b;';
    b.textContent = o[1];
    b.onclick = function() {
      v4lens = o[0];
      bar.querySelectorAll('.period-btn').forEach(function(x){ x.style.background = '#fff'; x.style.color = '#64748b'; x.style.borderColor = '#e2e8f0'; });
      b.style.background = '#3b82f6'; b.style.color = '#fff'; b.style.borderColor = '#3b82f6';
      loadDashboardV4(v4period, document.querySelector('.period-btn.active'));
    };
    if (v4lens === o[0]) { b.style.background = '#3b82f6'; b.style.color = '#fff'; b.style.borderColor = '#3b82f6'; }
    bar.appendChild(b);
  });
  holder.parentNode.insertBefore(bar, holder.nextSibling);
}

// ── Dashboard template update (injects new widgets) ──
function v4DashboardEnhance() {
  var tab = document.getElementById('tab0');
  if (!tab || tab.dataset.dashBuilt === '1') return;
  tab.dataset.dashBuilt = '1';

  // Find the template and inject new sections after the charts
  var template = document.getElementById('tab0HTML');
  if (template) {
    var html = template.innerHTML;
    // Add new widgets after the "Recent Sales" card's closing
    var newWidgets =
    '<!-- ⚡ QUICK ACTIONS -->' +
    '<div class="card" style="padding:10px">' +
      '<div class="card-title" style="font-size:13px;">⚡ Quick Actions</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' +
        '<button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#10b981;color:#fff;font-weight:800;font-size:10px;" onclick="selectTab(1, document.getElementById(\'stab1\'))">📦 Add<br>Product</button>' +
        '<button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#ef4444;color:#fff;font-weight:800;font-size:10px;" onclick="selectTab(7, document.getElementById(\'stab7\'))">💸 Record<br>Expense</button>' +
        '<button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#7c3aed;color:#fff;font-weight:800;font-size:10px;" onclick="selectTab(6, document.getElementById(\'stab6\'))">💰 Pay<br>Salary</button>' +
        '<button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#f59e0b;color:#fff;font-weight:800;font-size:10px;" onclick="selectTab(5, document.getElementById(\'stab5\'))">📉 Record<br>Loss</button>' +
      '</div>' +
    '</div>' +

    '<!-- 🧠 SMART INSIGHTS -->' +
    '<div class="card" style="padding:12px">' +
      '<div class="card-title" style="font-size:13px;">🧠 Smart Insights <small style="font-size:10px;color:#94a3b8;">— tap to act</small></div>' +
      '<div id="v4insights"></div>' +
    '</div>' +

    '<!-- 🏨 HOTEL OCCUPANCY (hotels only) -->' +
    '<div class="card" id="v4occupancyCard" style="display:none;padding:12px">' +
      '<div class="card-title" style="font-size:13px;">🏨 Room Occupancy (Live)</div>' +
      '<div id="v4occupancy"></div>' +
    '</div>' +

    '<!-- 🪑 ACTIVE TABLES -->' +
    '<div class="card">' +
      '<div class="card-title" style="font-size:13px;">🪑 Active Tables (Cafe Floor)</div>' +
      '<div id="v4activeTables" style="max-height:180px;overflow-y:auto;"></div>' +
    '</div>' +

    '<!-- 🍳 KITCHEN STATUS -->' +
    '<div class="card">' +
      '<div class="card-title" style="font-size:13px;">🍳 Kitchen Live Status</div>' +
      '<div id="v4kitchenStatus" style="font-size:13px;"></div>' +
    '</div>' +

    '<!-- ⏰ PEAK HOURS -->' +
    '<div class="card">' +
      '<div class="card-title" style="font-size:13px;">⏰ Peak Hour Analysis (Last 30 Days)</div>' +
      '<div id="v4peakHours" style="max-height:220px;overflow-y:auto;font-size:12px;"></div>' +
    '</div>' +

    '<!-- 🤖 FORECAST -->' +
    '<div class="card">' +
      '<div class="card-title" style="font-size:13px;">🤖 Smart Sales Forecast</div>' +
      '<div id="v4forecast" style="font-size:13px;"></div>' +
    '</div>' +

    '<!-- 💸 EXPENSE CHART -->' +
    '<div class="card">' +
      '<div class="card-title" style="font-size:13px;">💸 Expense Breakdown</div>' +
      '<div style="height:220px;position:relative;"><canvas id="v4expenseChart"></canvas></div>' +
    '</div>' +

    '<!-- 👥 CASHIER BREAKDOWN -->' +
    '<div class="card">' +
      '<div class="card-title" style="font-size:13px;">👥 Cashier Breakdown</div>' +
      '<div id="v4salesBreakdown" style="max-height:200px;overflow-y:auto;font-size:13px;"></div>' +
    '</div>';

    // Inject before the closing of the template's tab0 div
    html = html.replace('</div>\n</template>', newWidgets + '</div>\n</template>');
    template.innerHTML = html;
  }

  // Add clock + greeting to header area
  var header = document.querySelector('.header span[style*="font-weight:800"]');
  if (header && !document.getElementById('v4clock')) {
    var clockEl = document.createElement('span');
    clockEl.id = 'v4clock';
    clockEl.style.cssText = 'font-size:11px;font-weight:400;opacity:.8;margin-left:8px;';
    clockEl.textContent = '';
    header.appendChild(clockEl);
  }

  // Add daily summary button after Recent Sales card title
  var rsTitle = document.querySelector('#v4recentSales');
  if (rsTitle && !document.getElementById('v4DailySummaryBtn')) {
    var parent = rsTitle.closest('.card');
    if (parent) {
      var btn = document.createElement('button');
      btn.id = 'v4DailySummaryBtn';
      btn.className = 'v4-chip';
      btn.style.cssText = 'float:right;font-size:10px;padding:5px 10px;';
      btn.textContent = '📤 Share';
      btn.onclick = v4DailySummaryWA;
      var title = parent.querySelector('.card-title');
      if (title) title.appendChild(btn);
    }
  }
}

// ── register my tab loader ──
V4_TAB_LOADERS[0] = function() {
  v4DashboardEnhance();
  v4LensEnsure();
  loadDashboardV4(v4period, document.querySelector('.period-btn.active'));
  setInterval(v4Clock, 30000);   // update clock every 30s
};
