// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — DASHBOARD MODULE v2 · BUSINESS LENS
//  Hotel shops: 🏨 All / ☕ Cafe / 🛏️ Rooms — one tap flips
//  every number. Retail/cafe shops: no switcher (unchanged).
//  LAW: sales split by order_type='Room Stay' — the line
//  already exists in the database. Expenses = shop-wide.
// ═════════════════════════════════════════════════════════

var v4salesChart = null, v4payChart = null, v4period = 'daily';
var v4lens = 'combined';   // 'combined' | 'cafe' | 'beds'

function v4IsHotel() {
  return (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel') ||
         (typeof SS_PLAN !== 'undefined' && SS_PLAN.businessType === 'hotel');
}
function v4LensLabel() {
  if (!v4IsHotel() || v4lens === 'combined') return '';
  return v4lens === 'cafe' ? '☕ Cafe' : '🛏️ Rooms';
}
function v4LensTag() {
  var l = v4LensLabel();
  return l ? ' <small style="font-size:9px;opacity:.7">' + l + '</small>' : '';
}

function v4periodStart(p) {
  var now = new Date();
  if (p === 'daily')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'weekly')  return new Date(now.getTime() - 7*86400000);
  if (p === 'monthly') return new Date(now.getTime() - 30*86400000);
  return new Date(now.getTime() - 365*86400000);
}

// ═══ LENS-AWARE DATA: daily buckets respecting the lens ═══
async function v4LensDaily(start) {
  // Fast path: non-hotel or combined → use the RPC (server-side, fast)
  if (!v4IsHotel() || v4lens === 'combined') {
    return ssFetchDailySummary(start, null);
  }
  // Lens path: direct query, split by order_type client-side (bounded)
  try {
    const { data, error } = await supabaseClient.from('sales')
      .select('time, total, payment_method, payments, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString())
      .order('time', { ascending: true })
      .limit(2000);
    if (error) throw error;
    var filtered = (data || []).filter(function(s) {
      var ot = s.order_type || '';
      if (v4lens === 'cafe') return ot !== 'Room Stay';
      if (v4lens === 'beds') return ot === 'Room Stay';
      return true;
    });
    // Aggregate into daily buckets (same format as RPC)
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

// ═══ LENS-AWARE profit + credit query ═══
async function v4LensProfit(start) {
  try {
    var q = supabaseClient.from('sales')
      .select('profit, total, payment_method, paid_at, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString());
    const { data } = await q;
    var filtered = (data || []);
    if (v4IsHotel() && v4lens !== 'combined') {
      filtered = filtered.filter(function(s) {
        var ot = s.order_type || '';
        if (v4lens === 'cafe') return ot !== 'Room Stay';
        if (v4lens === 'beds') return ot === 'Room Stay';
        return true;
      });
    }
    var gp = 0, cd = 0;
    filtered.forEach(function(s) {
      gp += Number(s.profit || 0);
      if (s.payment_method === 'credit' && !s.paid_at) cd += Number(s.total || 0);
    });
    return { gp: gp, cd: cd };
  } catch(e) { return { gp: 0, cd: 0 }; }
}

async function loadDashboardV4(period, btn) {
  v4period = period || v4period;
  document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active', btn ? b === btn : false); });

  var start = v4periodStart(v4period);
  var jobs = [];

  // 1. Revenue + payment split (lens-aware)
  jobs.push(v4LensDaily(start).then(function(rows){
    var rev = 0, pay = { cash:0, card:0, mobile:0, credit:0 };
    rows.forEach(function(d){
      if (new Date(d.date + 'T12:00:00') < start) return;
      rev += d.total;
      pay.cash += d.cash || 0; pay.card += d.card || 0;
      pay.mobile += d.mobile || 0; pay.credit += d.credit || 0;
    });
    v4set('v4statRevenue', fmtMoney(rev));
    v4drawPay(pay);
    v4drawSales7(rows);
    return rev;
  }).catch(function(){ return 0; }));

  // 2. Profit + credit due (lens-aware)
  jobs.push(v4LensProfit(start).then(function(r){
    v4set('v4statGrossProfit', fmtMoney(r.gp));
    v4set('v4statCreditDue', fmtMoney(r.cd));
    var rev = Number(document.getElementById('v4statRevenue').textContent.replace(/[^0-9.]/g,'')) || 0;
    v4set('v4statProfitSub', rev > 0 ? (r.gp / rev * 100).toFixed(1) + '% margin' : '');
    return r.gp;
  }).catch(function(){ return 0; }));

  // 3. Expenses + losses (shop-wide — NOT lensed)
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

  // 4. Alerts (shop-wide — NOT lensed)
  jobs.push(Promise.all([
    supabaseClient.from('products').select('stock, reorder_level, is_virtual').eq('shop_id', getShopId()),
    supabaseClient.from('employees').select('salary, status').eq('shop_id', getShopId()).eq('status', 'active'),
    supabaseClient.from('loans').select('status').eq('shop_id', getShopId()).eq('status', 'open')
  ]).then(function(res){
    var low = ((res[0].data)||[]).filter(function(p){ return !p.is_virtual && (p.stock||0) <= (p.reorder_level||5); }).length;
    v4set('v4statLowStock', low);
    v4set('v4statSalaryAlerts', ((res[1].data)||[]).length > 0 ? '📅' : '✅');
    v4set('v4statOpenLoans', ((res[2].data)||[]).length);
    return true;
  }).catch(function(){ return false; }));

  // 5. Recent sales (lens-aware)
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

  await Promise.all(jobs);
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

// ═══ LENS SWITCHER (injects into the dashboard template) ═══
function v4LensEnsure() {
  if (!v4IsHotel()) return;   // retail/cafe → no switcher, unchanged
  var old = document.getElementById('v4LensBar');
  if (old) return;             // already built
  var holder = document.querySelector('#tab0 .period-selector') ||
               document.querySelector('#tab0 [style*="gap:6px"]');
  if (!holder) return;
  var bar = document.createElement('div');
  bar.id = 'v4LensBar';
  bar.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;';
  var opts = [
    ['combined','🏨 Whole Business','Show everything — cafe + rooms together'],
    ['cafe','☕ Cafe Service','Food, drinks, kitchen sales only'],
    ['beds','🛏️ Room Service','Guest rooms, bed revenue only']
  ];
  opts.forEach(function(o){
    var b = document.createElement('button');
    b.className = 'period-btn' + (v4lens === o[0] ? ' active' : '');
    b.style.cssText = 'flex:1;padding:10px 8px;border:2px solid #e2e8f0;border-radius:30px;font-size:12px;background:#fff;cursor:pointer;font-weight:700;color:#64748b;';
    b.textContent = o[1];
    b.title = o[2];
    b.onclick = function() {
      v4lens = o[0];
      // update active states
      bar.querySelectorAll('.period-btn').forEach(function(x){ x.classList.remove('active'); x.style.background = '#fff'; x.style.color = '#64748b'; x.style.borderColor = '#e2e8f0'; });
      b.classList.add('active'); b.style.background = '#3b82f6'; b.style.color = '#fff'; b.style.borderColor = '#3b82f6';
      loadDashboardV4(v4period, document.querySelector('.period-btn.active'));
    };
    if (v4lens === o[0]) { b.style.background = '#3b82f6'; b.style.color = '#fff'; b.style.borderColor = '#3b82f6'; }
    bar.appendChild(b);
  });
  holder.parentNode.insertBefore(bar, holder.nextSibling);
}

// ── register my tab loader ──
V4_TAB_LOADERS[0] = function() {
  v4LensEnsure();
  loadDashboardV4(v4period, document.querySelector('.period-btn.active'));
};
