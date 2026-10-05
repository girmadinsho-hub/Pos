// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — DASHBOARD MODULE
//  Lives here alone. One home per function. Law respected.
// ═════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════
//  DASHBOARD v4 — clean, server-powered, split-payment aware
// ═════════════════════════════════════════════════════════
var v4salesChart = null, v4payChart = null, v4period = 'daily';

function v4periodStart(p) {
  var now = new Date();
  if (p === 'daily')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'weekly')  return new Date(now.getTime() - 7*86400000);
  if (p === 'monthly') return new Date(now.getTime() - 30*86400000);
  return new Date(now.getTime() - 365*86400000);
}

async function loadDashboardV4(period, btn) {
  v4period = period || v4period;
  document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active', btn ? b === btn : false); });

  var start = v4periodStart(v4period);
  var jobs = [];

  // 1. Revenue + payment split (server summary — Package 4)
  jobs.push(ssFetchDailySummary(start, null).then(function(rows){
    var rev = 0, pay = { cash:0, card:0, mobile:0, credit:0 };
    rows.forEach(function(d){
      if (new Date(d.date + 'T12:00:00') < start) return;
      rev += d.total; pay.cash += d.cash; pay.card += d.card; pay.mobile += d.mobile; pay.credit += d.credit;
    });
    v4set('v4statRevenue', fmtMoney(rev));
    v4drawPay(pay);
    v4drawSales7(rows);
    return rev;
  }).catch(function(){ return 0; }));

  // 2. Profit + credit due (small targeted query)
  jobs.push(supabaseClient.from('sales')
    .select('profit, total, payment_method, paid_at')
    .eq('shop_id', getShopId()).eq('voided', false)
    .gte('time', start.toISOString())
    .then(function(pr){
      var gp = 0, cd = 0;
      (pr.data || []).forEach(function(s){
        gp += Number(s.profit || 0);
        if (s.payment_method === 'credit' && !s.paid_at) cd += Number(s.total || 0);
      });
      v4set('v4statGrossProfit', fmtMoney(gp));
      v4set('v4statCreditDue', fmtMoney(cd));
      var rev = Number(document.getElementById('v4statRevenue').textContent.replace(/[^0-9.]/g,'')) || 0;
      v4set('v4statProfitSub', rev > 0 ? (gp / rev * 100).toFixed(1) + '% margin' : '');
      return gp;
    }).catch(function(){ return 0; }));

  // 3. Expenses + losses (cache-independent, direct)
  jobs.push(Promise.all([
    supabaseClient.from('expenses').select('amount').eq('shop_id', getShopId()).gte('date', start.toISOString().slice(0,10)),
    supabaseClient.from('losses').select('total_loss').eq('shop_id', getShopId()).gte('time', start.toISOString())
  ]).then(function(res){
    var te = 0; ((res[0].data)||[]).forEach(function(e){ te += Number(e.amount||0); });
    var tl = 0; ((res[1].data)||[]).forEach(function(l){ tl += Number(l.total_loss||0); });
    v4set('v4statExpenses', fmtMoney(te));
    v4set('v4statExpensesSub', tl > 0 ? 'Losses: ' + fmtMoney(tl) : '');
    var gp = Number(document.getElementById('v4statGrossProfit').textContent.replace(/[^0-9.]/g,'')) || 0;
    v4set('v4statNetProfit', fmtMoney(gp - tl - te));
    v4set('v4statNetSub', (gp - tl - te) >= 0 ? '👍 Healthy' : '👎 Loss');
    return te;
  }).catch(function(){ return 0; }));

  // 4. Alerts: low stock / salary / loans
  jobs.push(Promise.all([
    supabaseClient.from('products').select('stock, reorder_level, is_virtual').eq('shop_id', getShopId()),
    supabaseClient.from('employees').select('salary, status').eq('shop_id', getShopId()).eq('status', 'active'),
    supabaseClient.from('loans').select('status').eq('shop_id', getShopId()).eq('status', 'open')
  ]).then(function(res){
    var low = ((res[0].data)||[]).filter(function(p){ return !p.is_virtual && (p.stock||0) <= (p.reorder_level||5); }).length;
    var monthlySalary = ((res[1].data)||[]).reduce(function(s,e){ return s + (e.salary||0); }, 0);
    v4set('v4statLowStock', low);
    v4set('v4statSalaryAlerts', ((res[1].data)||[]).length ? Math.ceil(monthlySalary / Math.max(1,((res[1].data)||[]).length)) > 0 ? '📅' : '✅' : '✅');
    v4set('v4statOpenLoans', ((res[2].data)||[]).length);
    return true;
  }).catch(function(){ return false; }));

  // 5. Recent sales
  jobs.push(supabaseClient.from('sales')
    .select('time, total, payment_method, items, cashier_name')
    .eq('shop_id', getShopId()).eq('voided', false)
    .order('time', { ascending: false }).limit(8)
    .then(function(rr){
      var html = ((rr.data)||[]).map(function(s){
        var items = (s.items||[]).map(function(i){ return i.name + '×' + i.qty; }).join(', ');
        return '<div style="padding:6px 0;border-bottom:1px solid #f1f5f9"><b>' +
          new Date(s.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</b> ' +
          sanitize(items || 'Sale') + ' – <b>' + fmtMoney(s.total) + '</b> (' + (s.payment_method||'') + ')</div>';
      }).join('');
      document.getElementById('v4recentSales').innerHTML = html || 'No sales yet.';
      return true;
    }).catch(function(){ return false; }));

  await Promise.all(jobs);   // 🚀 all at once — no sleep hacks in v4
}

function v4set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

function v4drawSales7(rows) {
  var ctx = document.getElementById('v4salesChart');
  if (!ctx || typeof Chart === 'undefined') return;
  var days = [];
  for (var i = 6; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    days.push({ key: d.toISOString().slice(0,10), label: d.toLocaleDateString('en-US',{weekday:'short'}), total: 0 }); }
  (rows||[]).forEach(function(r){ var day = days.find(function(x){ return x.key === r.date; }); if (day) day.total += r.total; });
  if (v4salesChart) v4salesChart.destroy();
  v4salesChart = new Chart(ctx, { type:'bar', data:{ labels: days.map(function(d){return d.label;}),
    datasets:[{ label:'Revenue', data: days.map(function(d){return d.total;}), backgroundColor:'#3b82f6', borderRadius:8 }] },
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

// ── register my tab loader ──
V4_TAB_LOADERS[0] = function() {
    loadDashboardV4(v4period, document.querySelector('.period-btn.active'));
};
