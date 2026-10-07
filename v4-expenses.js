// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — EXPENSES MODULE v2 (Step 8) · UI-3
//  FIXES: robust date parsing (no more hidden records) ·
//  tappable health tiles with FULL amounts + breakdown
//  dialogs · editable/removable budget · NEW recurring
//  bills engine (due reminders + record & advance + skip).
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4ex = { view:'excel', q:'', cat:'', data:[], period:'month' };

// ── categories (one home) ──
var V4EX_CATS = {
  rent:       { icon:'🏠', label:'Rent',             color:'#dc2626' },
  utilities:  { icon:'💡', label:'Utilities',        color:'#f97316' },
  salaries:   { icon:'👥', label:'Salaries & Wages', color:'#7c3aed' },
  supplies:   { icon:'📦', label:'Supplies',         color:'#0284c7' },
  marketing:  { icon:'📣', label:'Marketing',        color:'#db2777' },
  maintenance:{ icon:'🔧', label:'Maintenance',      color:'#f59e0b' },
  transport:  { icon:'🛵', label:'Transport',        color:'#059669' },
  tax:        { icon:'🏛️', label:'Tax / Government', color:'#b45309' },
  education:  { icon:'🎓', label:'School / Education', color:'#4f46e5' },
  general:    { icon:'➖', label:'General',          color:'#64748b' }
};
function v4exCat(c) {
  var k = Object.keys(V4EX_CATS).find(function(x){ return V4EX_CATS[x].label === c; });
  return V4EX_CATS[k] || V4EX_CATS.general;
}

// ── 🔧 ROBUST DATE HANDLING (the hidden-records fix) ──
function v4exTodayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function v4exDateKey(e) {
  var s = String(e.date || e.time || '');
  if (s.indexOf('T') !== -1) s = s.split('T')[0];   // full timestamp → date part
  if (s.length > 10) s = s.slice(0, 10);
  return s;                                          // '' if missing
}
function v4exPeriodStart(p) {
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
// string comparison — YYYY-MM-DD sorts perfectly, immune to timezones
function v4exInPeriod(e, periodOverride) {
  var p = periodOverride || v4ex.period;
  var k = v4exDateKey(e);
  if (!k) return p === 'all';                       // missing date → only in All Time
  var start = v4exPeriodStart(p);
  var startKey = start.getFullYear() + '-' + String(start.getMonth()+1).padStart(2,'0') + '-' + String(start.getDate()).padStart(2,'0');
  return k >= startKey;
}
function v4exPeriodLabel(p) {
  var x = p || v4ex.period;
  return { today:'Today', week:'This Week', month:'This Month', year:'This Year', all:'All Time' }[x] || 'This Month';
}

// ── data ──
async function v4exLoad() {
  try {
    const { data, error } = await supabaseClient.from('expenses')
      .select('*').eq('shop_id', getShopId())
      .order('date', { ascending: false }).limit(1000);
    if (error) throw error;
    v4ex.data = (data || []).map(function(e){
      return { id:e.id, name:e.name || 'Expense', amount:Number(e.amount||0),
        category:e.category || 'General', date:e.date || (e.created_at || ''), type:e.type || '' };
    });
  } catch(e) {
    console.warn('Expenses load:', e.message);
    v4ex.data = [];
  }
  return v4ex.data;
}
function v4exRefresh(){ return v4exLoad().then(v4exRender); }

// ── budget ──
function v4exBudgetGet() { return parseFloat(localStorage.getItem('v4exBudget_' + getShopId()) || '0'); }
function v4exBudgetSet(v) { localStorage.setItem('v4exBudget_' + getShopId(), String(v)); }
function v4exMonthTotal() {
  return v4ex.data.filter(function(e){ return v4exInPeriod(e, 'month'); })
    .reduce(function(s,e){ return s + e.amount; }, 0);
}

// ═══ RECURRING BILLS ENGINE (new) ═══
var V4EX_FREQ = { daily:'📅 Daily', weekly:'📅 Weekly', monthly:'📆 Monthly', yearly:'🗓️ Yearly' };
function v4exRecurGet() {
  try { return JSON.parse(localStorage.getItem('v4exRecur_' + getShopId()) || '[]'); } catch(e) { return []; }
}
function v4exRecurSet(list) { localStorage.setItem('v4exRecur_' + getShopId(), JSON.stringify(list)); }
function v4exNextDate(dateStr, freq) {
  var d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return dateStr;
  if (freq === 'daily')   d.setDate(d.getDate() + 1);
  else if (freq === 'weekly')  d.setDate(d.getDate() + 7);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (freq === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function v4exDueInfo(next) {
  var t = v4exTodayStr();
  if (next < t) {
    var days = Math.round((new Date(t + 'T12:00:00') - new Date(next + 'T12:00:00')) / 86400000);
    return { status:'overdue', label: days + 'd OVERDUE', color:'#ef4444', urgent:true };
  }
  if (next === t) return { status:'today', label:'Due TODAY', color:'#f97316', urgent:true };
  var d2 = Math.round((new Date(next + 'T12:00:00') - new Date(t + 'T12:00:00')) / 86400000);
  if (d2 <= 7) return { status:'soon', label:'in ' + d2 + 'd', color:'#f59e0b', urgent:false };
  return { status:'later', label:'in ' + d2 + 'd', color:'#94a3b8', urgent:false };
}
function v4exRecurUrgentCount() {
  return v4exRecurGet().filter(function(r){ return v4exDueInfo(r.next).urgent; }).length;
}

// ── analytics (period-aware) ──
function v4exAnalytics() {
  var rows = v4ex.data.filter(function(e){ return v4exInPeriod(e); });
  var byCat = {}, byDay = {};
  var total = 0;
  var days = [];
  var today = new Date(); today.setHours(0,0,0,0);
  for (var i = 13; i >= 0; i--) { var d = new Date(today); d.setDate(d.getDate() - i); days.push(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')); byDay[days[days.length-1]] = 0; }
  rows.forEach(function(e){
    total += e.amount;
    var catKey = Object.keys(V4EX_CATS).find(function(k){ return V4EX_CATS[k].label === e.category; }) || 'general';
    byCat[catKey] = (byCat[catKey] || 0) + e.amount;
    var k = v4exDateKey(e);
    if (byDay[k] !== undefined) byDay[k] += e.amount;
  });
  return { rows:rows, total:total, count:rows.length, byCat:byCat, byDay:byDay, days:days };
}

// ── UI ──
function v4exEnsureUI() {
  var tab = document.getElementById('tab7');
  if (!tab || tab.dataset.exBuilt === '1') return;
  tab.dataset.exBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4exH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;transition:transform .15s;}' +
    '.v4exH:active{transform:scale(.96);}' +
    '.v4exH b{font-size:13px;display:block;word-break:break-word;line-height:1.25;}' +
    '.v4exH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4exH small{color:#94a3b8;}' +
    '.v4exBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4exBtn:active{transform:scale(.97);}' +
    '.v4exBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4exBtnTx{flex:1;min-width:0;}' +
    '.v4exBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4exBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4exBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '.v4RRow{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;}' +
    '</style>' +

    // 1️⃣ HEALTH STRIP — tappable tiles, FULL amounts
    '<div class="card" style="padding:12px" id="v4exHealth"></div>' +

    // 2️⃣ THREE BIG BUTTONS
    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:12px">' +
        '<button class="v4exBtn" style="background:linear-gradient(135deg,#dc2626,#f87171)" onclick="v4exOpen(\'record\')"><span class="v4exBtnIc">⚡</span><span class="v4exBtnTx"><b>Record an Expense</b><small>Rent, electricity, supplies — track where money goes out</small></span><span class="v4exBtnGo">›</span></button>' +
        '<button class="v4exBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)" onclick="v4exOpen(\'analytics\')"><span class="v4exBtnIc">📊</span><span class="v4exBtnTx"><b>Analytics</b><small>Expenses by category — switch Today / Week / Month / Year inside</small></span><span class="v4exBtnGo">›</span></button>' +
        '<button class="v4exBtn" style="background:linear-gradient(135deg,#0d64f0,#60a5fa)" onclick="v4exOpen(\'recurring\')"><span class="v4exBtnIc">🔁</span><span class="v4exBtnTx"><b>Recurring Bills</b><small>Rent, tax, school fees — scheduled reminders, never forget a payment</small></span><span class="v4exBtnGo">›</span></button>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4exWhatsApp()">📤 Share Report</button>' +
        '<button class="v4-btn p" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4exPrint()">🖨️</button>' +
        '<button class="v4-btn p" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4exCSV()">📄⬇</button>' +
        '<button class="v4-btn o" style="margin:0;flex:0 0 auto;width:auto;padding:12px 16px" onclick="v4exRefresh()">🔄</button>' +
      '</div>' +
    '</div>' +

    // 3️⃣ TABLE
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">💸 Expense History <span class="v4-badge" id="v4exCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip active" id="v4exvExcel" onclick="v4exView(\'excel\')">📊 Excel</button>' +
          '<button class="v4-chip" id="v4exvList" onclick="v4exView(\'list\')">📋 List</button>' +
          '<button class="v4-chip" id="v4exvGrid" onclick="v4exView(\'grid\')">⊞ Grid</button>' +
        '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;margin-bottom:8px">' +
        '<input class="v4-in" id="v4exSearch" placeholder="🔍 Description…" style="flex:2;min-width:110px;max-width:170px;padding:7px 10px;margin:0;font-size:12px;height:34px;box-sizing:border-box" oninput="v4exSearchInput(this.value)">' +
        '<select class="v4-in" id="v4exCatFilter" style="flex:0 0 auto;width:auto;max-width:140px;padding:7px 6px;margin:0;font-size:12px;height:34px" onchange="v4exSetCat(this.value)"><option value="">All Categories</option></select>' +
      '</div>' +
      '<div id="v4exExcel"></div>' +
      '<div id="v4exList" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
      '<div id="v4exGrid" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
    '</div>';
}

// ── health strip (tappable, full amounts, budget, reminders) ──
function v4exHealth() {
  var el = document.getElementById('v4exHealth'); if (!el) return;
  function tile(period, color) {
    var rows = v4ex.data.filter(function(e){ return v4exInPeriod(e, period); });
    var total = rows.reduce(function(s,e){ return s + e.amount; }, 0);
    return '<div class="v4exH" onclick="v4exOpenPeriod(\'' + period + '\')">' +
      '<b style="color:' + color + '">' + fmtMoney(total) + '</b>' +
      '<small>' + v4exPeriodLabel(period).toUpperCase() + ' · ' + rows.length + ' 📋</small></div>';
  }
  var html = '<div style="display:flex;gap:8px">' +
    tile('today', '#ef4444') +
    tile('week', '#f97316') +
    tile('month', '#3b82f6') +
    '</div>';

  // 🎯 BUDGET BAR (tappable → edit/remove)
  var monthTotal = v4exMonthTotal();
  var budget = v4exBudgetGet();
  if (budget > 0) {
    var pct = Math.min(100, Math.round(monthTotal / budget * 100));
    var over = monthTotal > budget;
    var col = over ? '#ef4444' : (pct > 80 ? '#f97316' : '#10b981');
    html += '<div style="margin-top:10px;cursor:pointer" onclick="v4exBudgetDialog()">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:4px">' +
      '<span style="color:#64748b">🎯 Monthly Budget — tap to change</span>' +
      '<span style="color:' + col + '">' + fmtMoney(monthTotal) + ' / ' + fmtMoney(budget) + '</span></div>' +
      '<div style="height:12px;background:rgba(148,163,184,.15);border-radius:6px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + col + ';border-radius:6px;transition:width .3s"></div></div>' +
      (over ? '<div style="text-align:center;font-size:11px;font-weight:700;color:#ef4444;margin-top:4px">⚠️ OVER BUDGET by ' + fmtMoney(monthTotal - budget) + '!</div>' : '') +
      '</div>';
  } else {
    html += '<div style="text-align:center;margin-top:8px"><button class="v4-chip" onclick="v4exBudgetDialog()">🎯 Set Monthly Budget</button></div>';
  }

  // 🔔 RECURRING REMINDER STRIP
  var urgent = v4exRecurUrgentCount();
  if (urgent > 0) {
    html += '<div style="margin-top:10px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);border-radius:10px;padding:9px;text-align:center;font-size:12px;font-weight:700;color:#dc2626;cursor:pointer" onclick="v4exOpen(\'recurring\')">🔔 ' + urgent + ' recurring bill' + (urgent>1?'s':'') + ' need payment — tap to open</div>';
  }
  el.innerHTML = html;
}

// ── budget dialog (edit / remove / cancel) ──
function v4exBudgetDialog() {
  v4exModal('🎯 Monthly Budget');
  var current = v4exBudgetGet();
  document.getElementById('v4exToolBody').innerHTML =
    '<p style="font-size:12px;color:#64748b;margin-bottom:12px">Your "This Month" spending is measured against this budget.</p>' +
    (current > 0 ? '<div style="text-align:center;background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:12px"><b style="font-size:18px;color:#2563eb">' + fmtMoney(current) + '</b><br><small style="color:#64748b">current budget / month</small></div>' : '') +
    '<button class="v4-btn g" style="margin-bottom:8px" onclick="v4exBudgetEdit()">' + (current > 0 ? '✏️ Change Amount' : '➕ Set Budget') + '</button>' +
    (current > 0 ? '<button class="v4-btn" style="background:#dc2626;margin-bottom:8px" onclick="v4exBudgetRemove()">🗑️ Remove Budget</button>' : '') +
    '<button class="v4-btn o" onclick="v4exCloseModal()">✖ Cancel</button>';
}
async function v4exBudgetEdit() {
  var v = await prompt('🎯 Monthly budget (Br):\n\nExample: 5000', v4exBudgetGet() || '');
  if (v === null) return;
  var n = parseFloat(v) || 0;
  if (n < 0) n = 0;
  v4exBudgetSet(n);
  v4exCloseModal();
  v4exHealth();
  alert(n > 0 ? '✅ Budget set: ' + fmtMoney(n) + '/month' : '✅ Budget removed.');
}
async function v4exBudgetRemove() {
  if (!await confirm('Remove the monthly budget?\nThe progress bar disappears — spending keeps being recorded normally.')) return;
  v4exBudgetSet(0);
  v4exCloseModal();
  v4exHealth();
  alert('✅ Budget removed.');
}

// ── modal system ──
function v4exModal(title) {
  v4exCloseModal();
  var m = document.createElement('div');
  m.id = 'v4exToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4exCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4exToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4exCloseModal(); });
}
function v4exCloseModal() { var m = document.getElementById('v4exToolModal'); if (m) m.remove(); }

// ── BREAKDOWN DIALOG (tappable tiles) ──
function v4exOpenPeriod(p) {
  var rows = v4ex.data.filter(function(e){ return v4exInPeriod(e, p); })
    .sort(function(a,b){ return b.amount - a.amount; });
  var total = rows.reduce(function(s,e){ return s + e.amount; }, 0);
  v4exModal('💸 Expenses — ' + v4exPeriodLabel(p));
  var html = '<div style="text-align:center;background:rgba(249,115,22,.12);border-radius:12px;padding:12px;margin-bottom:12px">' +
    '<b style="font-size:22px;color:#f97316">' + fmtMoney(total) + '</b><br>' +
    '<small style="font-size:11px;color:#64748b;font-weight:700">' + rows.length + ' expense record' + (rows.length!==1?'s':'') + '</small></div>';
  if (!rows.length) {
    html += '<p style="text-align:center;padding:20px;color:#10b981;font-weight:800">✅ Nothing spent ' + v4exPeriodLabel(p).toLowerCase() + '!</p>';
  } else {
    rows.forEach(function(e){
      var C = v4exCat(e.category);
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">' +
        '<span>' + C.icon + ' <b>' + sanitize(e.name) + '</b><br><small style="color:#64748b">' + C.label + ' · ' + formatDate(v4exDateKey(e)) + '</small></span>' +
        '<b style="color:' + C.color + '">' + fmtMoney(e.amount) + '</b></div>';
    });
  }
  html += '<button class="v4-btn o" style="margin-top:12px" onclick="v4exCloseModal()">✖ Close</button>';
  document.getElementById('v4exToolBody').innerHTML = html;
}

// ── period chips ──
function v4exPeriodChips() {
  var P = { today:'📅 Today', week:'📅 This Week', month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' +
    Object.keys(P).map(function(p){
      return '<button class="v4PChip' + (v4ex.period === p ? ' active' : '') + '" onclick="v4exSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
    }).join('') + '</div>';
}
function v4exSetPeriod(p) {
  v4ex.period = p;
  var chips = document.querySelector('#v4exToolModal .v4PChips');
  if (chips) chips.outerHTML = v4exPeriodChips();
  var body = document.getElementById('v4exAnalyticsBody');
  if (body) body.innerHTML = v4exAnalyticsHTML();
  v4exRender();
}

// ── analytics HTML ──
function v4exAnalyticsHTML() {
  var a = v4exAnalytics();
  var html = '';
  var cats = Object.keys(a.byCat).map(function(k){ return { k:k, v:a.byCat[k] }; }).sort(function(x,y){ return y.v - x.v; });
  var cMax = cats.length ? cats[0].v : 1;
  html += '<b style="font-size:13px">💸 Where the money goes — by category</b>';
  if (!cats.length) html += '<p style="color:#64748b;text-align:center;padding:14px">No expenses in ' + v4exPeriodLabel() + '.</p>';
  cats.forEach(function(x){
    var C = V4EX_CATS[x.k];
    var pct = Math.round(x.v / cMax * 100);
    html += '<div style="margin:8px 0">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
      '<span>' + C.icon + ' ' + C.label + '</span><b style="color:' + C.color + '">' + fmtMoney(x.v) + '</b></div>' +
      '<div style="height:10px;background:rgba(148,163,184,.15);border-radius:5px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + C.color + ';border-radius:5px"></div></div></div>';
  });
  var top = a.rows.slice().sort(function(x,y){ return y.amount - x.amount; }).slice(0, 8);
  if (top.length) {
    html += '<div style="height:10px"></div><b style="font-size:13px">💰 Biggest single expenses</b>';
    top.forEach(function(e, i){
      var C = v4exCat(e.category);
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + (i+1) + '. ' + C.icon + ' ' + sanitize(e.name) + '</span><b style="color:' + C.color + '">' + fmtMoney(e.amount) + '</b></div>';
    });
  }
  html += '<div style="height:10px"></div><b style="font-size:13px">📈 Last 14 days</b>';
  var dMax = 0; a.days.forEach(function(k){ if (a.byDay[k] > dMax) dMax = a.byDay[k]; });
  html += '<div style="display:flex;align-items:flex-end;gap:2px;height:60px;margin-top:6px">';
  a.days.forEach(function(k){
    var v = a.byDay[k];
    var h = dMax > 0 ? Math.max(3, Math.round(v / dMax * 55)) : 3;
    html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="' + k + ': ' + fmtMoney(v) + '">' +
      '<div style="width:100%;height:' + h + 'px;background:' + (v > 0 ? '#f97316' : 'rgba(148,163,184,.25)') + ';border-radius:3px 3px 0 0"></div></div>';
  });
  html += '</div><p style="font-size:10px;color:#64748b;text-align:center;margin-top:4px">worst day: ' + fmtMoney(dMax) + '</p>';
  return html;
}

// ═══ RECURRING BILLS MODAL ═══
function v4exRecurringHTML() {
  var list = v4exRecurGet();
  var html = '<p style="font-size:12px;color:#64748b;margin-bottom:10px">Bills that repeat: rent, tax, school fees, salaries… The app reminds you when due — one tap records the payment and jumps to the next date.</p>';
  if (!list.length) {
    html += '<p style="text-align:center;padding:18px;color:#64748b">No recurring bills yet. Add your first below 👇</p>';
  } else {
    // sort: urgent first
    list.sort(function(a,b){ return a.next < b.next ? -1 : 1; });
    list.forEach(function(r){
      var C = v4exCat(r.cat);
      var D = v4exDueInfo(r.next);
      html += '<div class="v4RRow" style="border-left:3px solid ' + D.color + '">' +
        '<div style="flex:1;min-width:0">' +
        '<b style="font-size:13px">' + C.icon + ' ' + sanitize(r.desc) + '</b><br>' +
        '<small style="color:#64748b">' + V4EX_FREQ[r.freq].replace('📅 ','').replace('📆 ','').replace('🗓️ ','') + ' · ' + fmtMoney(r.amount) + ' · next: ' + formatDate(r.next) + '</small></div>' +
        '<div style="text-align:right;flex-shrink:0">' +
        '<b style="color:' + D.color + ';font-size:11px;display:block;margin-bottom:4px">' + D.label + '</b>' +
        '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4exRecurRecord(\'' + r.id + '\')">✅ Record</button> ' +
        '<button class="btn-mini" style="background:#f59e0b;color:#fff" onclick="v4exRecurSkip(\'' + r.id + '\')">⏭</button> ' +
        '<button class="btn-mini delete" onclick="v4exRecurDelete(\'' + r.id + '\')">🗑️</button></div></div>';
    });
  }
  // add form
  var catOpts = '';
  Object.keys(V4EX_CATS).forEach(function(k){
    var C = V4EX_CATS[k];
    catOpts += '<option value="' + C.label + '">' + C.icon + ' ' + C.label + '</option>';
  });
  var freqOpts = '';
  Object.keys(V4EX_FREQ).forEach(function(k){
    freqOpts += '<option value="' + k + '"' + (k === 'monthly' ? ' selected' : '') + '>' + V4EX_FREQ[k] + '</option>';
  });
  html += '<div style="border-top:2px dashed #e2e8f0;padding-top:12px;margin-top:12px">' +
    '<b style="font-size:13px">➕ Add recurring bill</b>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Description</label>' +
    '<input class="v4-in" id="v4exRDesc" placeholder="e.g., Shop rent, Tax, School fee…">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Amount (Br)</label><input type="number" class="v4-in" id="v4exRAmt" placeholder="0" min="0"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Next due</label><input type="date" class="v4-in" id="v4exRNext" value="' + v4exTodayStr() + '"></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Category</label><select class="v4-in" id="v4exRCat">' + catOpts + '</select></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Repeats</label><select class="v4-in" id="v4exRFreq">' + freqOpts + '</select></div>' +
    '</div>' +
    '<button class="v4-btn g" onclick="v4exRecurAdd()">➕ Add Bill</button></div>';
  return html;
}
function v4exRecurAdd() {
  var desc = document.getElementById('v4exRDesc').value.trim();
  var amt = parseFloat(document.getElementById('v4exRAmt').value) || 0;
  var next = document.getElementById('v4exRNext').value || v4exTodayStr();
  var cat = document.getElementById('v4exRCat').value;
  var freq = document.getElementById('v4exRFreq').value;
  if (!desc) { alert('Enter a description.'); return; }
  if (amt <= 0) { alert('Enter a valid amount.'); return; }
  var list = v4exRecurGet();
  list.push({ id:'rec_' + Date.now(), desc:desc, amount:amt, cat:cat, freq:freq, next:next });
  v4exRecurSet(list);
  document.getElementById('v4exToolBody').innerHTML = v4exRecurringHTML();
  v4exHealth();
  alert('✅ Recurring bill added: ' + desc + ' · ' + fmtMoney(amt) + ' · ' + V4EX_FREQ[freq]);
}
async function v4exRecurRecord(id) {
  var list = v4exRecurGet();
  var r = list.find(function(x){ return x.id === id; });
  if (!r) return;
  if (!await confirm('✅ Record this payment now?\n\n' + r.desc + ' — ' + fmtMoney(r.amount) + '\n\nThe expense is logged and the next due date moves forward.')) return;
  try {
    const { error } = await supabaseClient.from('expenses').insert([{
      shop_id: getShopId(), name: r.desc, amount: r.amount,
      category: r.cat, date: v4exTodayStr()
    }]);
    if (error) throw error;
    r.next = v4exNextDate(r.next, r.freq);
    v4exRecurSet(list);
    document.getElementById('v4exToolBody').innerHTML = v4exRecurringHTML();
    v4exRefresh();
    alert('✅ Recorded: ' + r.desc + ' — ' + fmtMoney(r.amount) + '\nNext due: ' + formatDate(r.next));
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4exRecurSkip(id) {
  var list = v4exRecurGet();
  var r = list.find(function(x){ return x.id === id; });
  if (!r) return;
  if (!await confirm('⏭ Skip this occurrence?\n\nNo expense is recorded — the next due date simply moves forward.\n(Use when a payment was waived or already paid elsewhere.)')) return;
  r.next = v4exNextDate(r.next, r.freq);
  v4exRecurSet(list);
  document.getElementById('v4exToolBody').innerHTML = v4exRecurringHTML();
  v4exHealth();
  alert('⏭ Skipped. Next due: ' + formatDate(r.next));
}
async function v4exRecurDelete(id) {
  var list = v4exRecurGet();
  var r = list.find(function(x){ return x.id === id; });
  if (!r) return;
  if (!await confirm('🗑️ Delete this recurring bill?\n\n' + r.desc + ' — ' + fmtMoney(r.amount) + '\n\nRecorded expenses stay in your history.')) return;
  v4exRecurSet(list.filter(function(x){ return x.id !== id; }));
  document.getElementById('v4exToolBody').innerHTML = v4exRecurringHTML();
  v4exHealth();
}

// ── record expense modal ──
function v4exRecordHTML() {
  var catOpts = '';
  Object.keys(V4EX_CATS).forEach(function(k){
    var C = V4EX_CATS[k];
    catOpts += '<option value="' + C.label + '">' + C.icon + ' ' + C.label + '</option>';
  });
  return '<p style="font-size:12px;color:#64748b;margin-bottom:10px">What did you spend money on? Pick category, describe it, enter amount.</p>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Category</label>' +
    '<select class="v4-in" id="v4exCat">' + catOpts + '</select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Description</label>' +
    '<input class="v4-in" id="v4exDesc" placeholder="e.g., Electricity bill, October rent…">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Amount (Br)</label><input type="number" class="v4-in" id="v4exAmt" placeholder="0" min="0" oninput="v4exCalc()"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Date</label><input type="date" class="v4-in" id="v4exDate" value="' + v4exTodayStr() + '"></div>' +
    '</div>' +
    '<div id="v4exCalcBox" style="background:#fff7ed;border-radius:10px;padding:10px;text-align:center;margin:10px 0;font-weight:800;color:#f97316">—</div>' +
    '<button class="v4-btn" style="background:#dc2626" onclick="v4exSave()">💸 Record Expense</button>';
}
function v4exCalc() {
  var amt = parseFloat(document.getElementById('v4exAmt').value) || 0;
  var box = document.getElementById('v4exCalcBox');
  box.textContent = amt > 0 ? '💸 Expense: ' + fmtMoney(amt) : '—';
}
async function v4exSave() {
  var cat = document.getElementById('v4exCat').value;
  var desc = document.getElementById('v4exDesc').value.trim();
  var amt = parseFloat(document.getElementById('v4exAmt').value) || 0;
  var date = document.getElementById('v4exDate').value || v4exTodayStr();
  if (!desc) { alert('Enter a description.'); return; }
  if (amt <= 0) { alert('Enter a valid amount.'); return; }
  if (!await confirm('Record this expense?\n\n' + cat + ' · ' + desc + '\n' + fmtMoney(amt))) return;
  try {
    const { error } = await supabaseClient.from('expenses').insert([{
      shop_id: getShopId(), name: desc, amount: amt,
      category: cat, date: date
    }]);
    if (error) throw error;
    v4exCloseModal();
    v4exRefresh();
    alert('✅ Expense recorded: ' + fmtMoney(amt));
  } catch(e) { alert('❌ ' + e.message); }
}

// ── EDIT DIALOG (dropdowns) ──
function v4exEditDialog(id) {
  var e = v4ex.data.find(function(x){ return x.id === id; });
  if (!e) return;
  v4exModal('✏️ Edit Expense');
  var catOpts = '';
  Object.keys(V4EX_CATS).forEach(function(k){
    var C = V4EX_CATS[k];
    catOpts += '<option value="' + C.label + '"' + (C.label === e.category ? ' selected' : '') + '>' + C.icon + ' ' + C.label + '</option>';
  });
  var dateKey = v4exDateKey(e) || v4exTodayStr();
  document.getElementById('v4exToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Category</label>' +
    '<select class="v4-in" id="v4exEditCat">' + catOpts + '</select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Description</label>' +
    '<input class="v4-in" id="v4exEditDesc" value="' + sanitize(e.name).replace(/"/g, '&quot;') + '">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Amount (Br)</label><input type="number" class="v4-in" id="v4exEditAmt" value="' + e.amount + '" min="0" oninput="v4exEditCalc()"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Date</label><input type="date" class="v4-in" id="v4exEditDate" value="' + dateKey + '"></div>' +
    '</div>' +
    '<div id="v4exEditCalcBox" style="background:#fff7ed;border-radius:10px;padding:10px;text-align:center;margin:10px 0;font-weight:800;color:#f97316">💸 ' + fmtMoney(e.amount) + '</div>' +
    '<button class="v4-btn g" onclick="v4exEditSave(\'' + id + '\')">💾 Save Changes</button>';
  window._v4exEdit = { id:id, oldAmt:e.amount };
}
function v4exEditCalc() {
  var amt = parseFloat(document.getElementById('v4exEditAmt').value) || 0;
  var box = document.getElementById('v4exEditCalcBox');
  if (box) box.textContent = amt > 0 ? '💸 ' + fmtMoney(amt) : '—';
}
async function v4exEditSave(id) {
  var e = window._v4exEdit; if (!e) return;
  var cat = document.getElementById('v4exEditCat').value;
  var desc = document.getElementById('v4exEditDesc').value.trim();
  var amt = parseFloat(document.getElementById('v4exEditAmt').value) || 0;
  var date = document.getElementById('v4exEditDate').value;
  if (!desc || amt <= 0) { alert('Fill description and amount.'); return; }
  if (!await confirm('Save changes?\n\n' + cat + ' · ' + desc + '\n' + fmtMoney(amt) + (amt !== e.oldAmt ? ' (was ' + fmtMoney(e.oldAmt) + ')' : ''))) return;
  try {
    const { error } = await supabaseClient.from('expenses')
      .update({ category: cat, name: desc, amount: amt, date: date })
      .eq('id', id);
    if (error) throw error;
    v4exCloseModal();
    v4exRefresh();
    alert('✅ Expense updated.');
  } catch(er) { alert('❌ ' + er.message); }
}

// ── DELETE DIALOG ──
function v4exDeleteDialog(id) {
  var e = v4ex.data.find(function(x){ return x.id === id; });
  if (!e) return;
  v4exModal('🗑️ Delete Expense');
  var C = v4exCat(e.category);
  document.getElementById('v4exToolBody').innerHTML =
    '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:12px;font-size:13px;text-align:center">' +
      C.icon + ' <b>' + sanitize(e.name) + '</b> — ' + fmtMoney(e.amount) +
    '</div>' +
    '<p style="font-size:12px;color:#64748b;margin-bottom:12px">Deleting an expense removes it from your records — your profit reports will change.</p>' +
    '<button class="v4-btn" style="background:#dc2626;margin-bottom:8px" onclick="v4exDeleteGo(\'' + id + '\')">🗑️ Delete permanently<br><small style="font-weight:400;font-size:11px;opacity:.9">' + sanitize(e.name) + ' · ' + fmtMoney(e.amount) + ' disappears from records</small></button>' +
    '<button class="v4-btn o" onclick="v4exCloseModal()">✖ Cancel</button>';
}
async function v4exDeleteGo(id) {
  try {
    const { error } = await supabaseClient.from('expenses').delete().eq('id', id);
    if (error) throw error;
    v4exCloseModal();
    v4exRefresh();
    alert('✅ Expense deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── modal opener ──
function v4exOpen(tool) {
  if (tool === 'analytics') {
    v4exModal('📊 Expense Analytics');
    document.getElementById('v4exToolBody').innerHTML =
      v4exPeriodChips() +
      '<div id="v4exAnalyticsBody">' + v4exAnalyticsHTML() + '</div>';
  }
  else if (tool === 'record') { v4exModal('⚡ Record an Expense'); document.getElementById('v4exToolBody').innerHTML = v4exRecordHTML(); }
  else if (tool === 'recurring') { v4exModal('🔁 Recurring Bills'); document.getElementById('v4exToolBody').innerHTML = v4exRecurringHTML(); }
}

// ── table ──
function v4exRows() {
  var q = (v4ex.q || '').toLowerCase();
  return v4ex.data.filter(function(e){
    if (q && e.name.toLowerCase().indexOf(q) === -1) return false;
    if (v4ex.cat && e.category !== v4ex.cat) return false;
    return v4exInPeriod(e);
  });
}
function v4exTable(rows) {
  var ex = document.getElementById('v4exExcel'); if (!ex) return;
  if (!rows.length) {
    ex.innerHTML = '<div class="placeholder">' + (v4ex.data.length ? 'No expenses in ' + v4exPeriodLabel() + ' (or filters too narrow).' : 'No expenses recorded yet.') + '</div>';
    window.v4expTable = null; return;
  }
  var alive = ex.querySelector('.modern-sheet-table');
  if (!window.v4expTable || !alive) {
    ex.innerHTML = '';
    window.v4expTable = new ModernSheet('v4exExcel', { data: rows, columns: [
      { title:'#', width:'36px', render:function(i,h,x){ return x+1; } },
      { title:'Description', field:'name', width:'170px', render:function(i,h){ return h?'<b>'+sanitize(i.name)+'</b>':i.name; } },
      { title:'Category', width:'110px', render:function(i,h){
          var C = v4exCat(i.category);
          return h ? '<span style="color:' + C.color + ';font-weight:700">' + C.icon + ' ' + C.label + '</span>' : C.label;
        }, filterable:true },
      { title:'Amount', field:'amount', width:'95px', align:'right',
        render:function(i,h){ return h?'<b style="color:#f97316">-'+fmtMoney(i.amount)+'</b>':i.amount; },
        total:true, totalValue:function(i){ return i.amount; }, totalFormat:function(s){ return '-' + fmtMoney(s); } },
      { title:'Date', width:'100px', render:function(i,h){
          var k = v4exDateKey(i);
          return h ? (k ? formatDate(k) : '—') : k;
        } },
      { title:'Actions', width:'110px', render:function(i,h){
          if (!h) return '';
          return '<button class="btn-mini edit" onclick="v4exEditDialog(\'' + i.id + '\')">✏️</button> ' +
                 '<button class="btn-mini delete" onclick="v4exDeleteDialog(\'' + i.id + '\')">🗑️</button>';
        }, filterable:false }
    ], emptyMessage:'No expenses', showSearch:false, showFontSlider:true });
  } else window.v4expTable.setData(rows);
}

// ── search / filters / views ──
var v4exSearchT = null;
function v4exSearchInput(v) {
  v4ex.q = v;
  clearTimeout(v4exSearchT);
  v4exSearchT = setTimeout(function(){ v4S.exlpage = 1; v4S.exgpage = 1; v4exRenderView(); }, 300);
}
function v4exSetCat(v){ v4ex.cat = v; v4S.exlpage = 1; v4S.exgpage = 1; v4exRenderView(); }
function v4exFillCats() {
  var sel = document.getElementById('v4exCatFilter'); if (!sel) return;
  var keep = v4ex.cat || '';
  sel.innerHTML = '<option value="">All Categories</option>' +
    Object.keys(V4EX_CATS).map(function(k){
      var C = V4EX_CATS[k];
      return '<option value="' + C.label + '"' + (C.label === keep ? ' selected' : '') + '>' + C.icon + ' ' + C.label + '</option>';
    }).join('');
}
function v4exView(v) {
  v4ex.view = v; v4S.exlpage = 1; v4S.exgpage = 1;
  var ids = { excel:'v4exvExcel', list:'v4exvList', grid:'v4exvGrid' };
  Object.keys(ids).forEach(function(k){ var el = document.getElementById(ids[k]); if (el) el.classList.toggle('active', k === v); });
  var ex = document.getElementById('v4exExcel'), li = document.getElementById('v4exList'), gr = document.getElementById('v4exGrid');
  if (ex) ex.style.display = v === 'excel' ? 'block' : 'none';
  if (li) li.style.display = v === 'list' ? 'block' : 'none';
  if (gr) gr.style.display = v === 'grid' ? 'grid' : 'none';
  v4exRenderView();
}
function v4exMoreList(){ v4S.exlpage = (v4S.exlpage||1) + 1; v4exRenderView(); }
function v4exMoreGrid(){ v4S.exgpage = (v4S.exgpage||1) + 1; v4exRenderView(); }
function v4exListRows(rows) {
  return rows.map(function(e){
    var C = v4exCat(e.category);
    return { label: C.icon + ' ' + sanitize(e.name),
             detail: C.label + ' · ' + (v4exDateKey(e) ? formatDate(v4exDateKey(e)) : '—'),
             right: '-' + fmtMoney(e.amount) };
  });
}

// ── WhatsApp / print / CSV ──
function v4exWhatsApp() {
  var a = v4exAnalytics();
  if (!a.count) { alert('No expenses in ' + v4exPeriodLabel() + '.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var cats = Object.keys(a.byCat).map(function(k){ return v4exCat(V4EX_CATS[k].label).label + ': ' + fmtMoney(a.byCat[k]); }).join('\n');
  var msg = '💸 EXPENSE REPORT — ' + shop + '\n' + v4exPeriodLabel() + '\n\n' +
    'Total spent: ' + fmtMoney(a.total) + ' (' + a.count + ' records)\n\nBy category:\n' + cats + '\n\n— SmartShop Pro';
  var phone = prompt('Send to which WhatsApp number?\n(Leave empty to just copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else {
    if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Report copied!'); });
    else alert(msg);
  }
}
function v4exPrint() {
  var rows = v4exAnalytics().rows;
  if (!rows.length) { alert('Nothing to print.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var total = rows.reduce(function(s,e){ return s + e.amount; }, 0);
  var body = rows.map(function(e, i){
    return '<tr><td>' + (i+1) + '</td><td><b>' + sanitize(e.name) + '</b></td><td>' + (e.category||'General') + '</td><td style="text-align:right">' + fmtMoney(e.amount) + '</td><td>' + (v4exDateKey(e) ? formatDate(v4exDateKey(e)) : '—') + '</td></tr>';
  }).join('');
  w.document.write('<html><head><title>Expense Report</title><style>body{font-family:monospace;padding:14px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">' + sanitize(shop) + ' — Expense Report</h3>' +
    '<p style="text-align:center;font-size:11px">' + v4exPeriodLabel() + ' · ' + rows.length + ' records · total ' + fmtMoney(total) + '</p>' +
    '<table><tr><th>#</th><th>Description</th><th>Category</th><th>Amount</th><th>Date</th></tr>' + body + '</table>' +
    '<p style="text-align:right;font-weight:bold;margin-top:8px">TOTAL SPENT: ' + fmtMoney(total) + '</p></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}
function v4exCSV() {
  var rows = v4exAnalytics().rows;
  if (!rows.length) { alert('Nothing to export.'); return; }
  var csv = '\uFEFFDescription,Category,Amount,Date\n' + rows.map(function(e){
    return '"' + e.name + '","' + (e.category||'General') + '",' + e.amount.toFixed(2) + ',"' + (v4exDateKey(e) || '') + '"';
  }).join('\n');
  var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'expenses_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

// ── render pipeline ──
function v4exRenderView() {
  var rows = v4exRows();
  var cnt = document.getElementById('v4exCount'); if (cnt) cnt.textContent = rows.length;
  if (v4ex.view === 'excel') v4exTable(rows);
  else if (v4ex.view === 'list') v4PagList('v4exList', v4exListRows(rows), 'exlpage', 20, 'v4exMoreList');
  else v4PagGrid('v4exGrid', v4exListRows(rows), 'exgpage', 12, 'v4exMoreGrid');
}
function v4exRender() {
  v4exFillCats();
  v4exHealth();
  v4exRenderView();
}

// ── tab loader ──
V4_TAB_LOADERS[7] = function() {
  v4exEnsureUI();
  v4exLoad().then(v4exRender);
};
