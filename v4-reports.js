// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — REPORTS MODULE (Step 13)
//  All v3 keeper reports rebuilt: P&L · Z-Report · Tax ·
//  CRM · Marketing · Menu Engineering · Audit · Timesheets ·
//  Valuation · ERCA · Manual Invoice.
//  LAWS: UI-3 (one button + period chips in modal) · Lens for
//  hotels (Whole/Cafe/Rooms) · bounded queries (speed law) ·
//  TOT shops never show tax (law) · WhatsApp + print on all.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4re = { period:'month' };

// ── lens helpers (inherits dashboard lens) ──
function v4reIsHotel() {
  return (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel');
}
function v4reLens() { return (typeof v4lens !== 'undefined') ? v4lens : 'combined'; }
function v4reLensFilter(s) {
  if (!v4reIsHotel() || v4reLens() === 'combined') return true;
  var ot = s.order_type || '';
  if (v4reLens() === 'cafe') return ot !== 'Room Stay';
  if (v4reLens() === 'beds') return ot === 'Room Stay';
  return true;
}
function v4reLensLabel() {
  if (!v4reIsHotel() || v4reLens() === 'combined') return '';
  return ' (' + (v4reLens() === 'cafe' ? 'Cafe' : 'Rooms') + ')';
}

// ── period helpers ──
function v4rePeriodStart(p) {
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
function v4rePeriodLabel() {
  return { today:'Today', week:'This Week', month:'This Month', year:'This Year', all:'All Time' }[v4re.period] || 'This Month';
}

// ═══ UI ═══
function v4reEnsureUI() {
  var tab = document.getElementById('tab8');
  if (!tab || tab.dataset.reBuilt === '1') return;
  tab.dataset.reBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4reH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;transition:transform .15s;}' +
    '.v4reH:active{transform:scale(.96);}' +
    '.v4reH b{font-size:13px;display:block;word-break:break-word;line-height:1.25;}' +
    '.v4reH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4reH small{color:#94a3b8;}' +
    '.v4reBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4reBtn:active{transform:scale(.97);}' +
    '.v4reBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4reBtnTx{flex:1;min-width:0;}' +
    '.v4reBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4reBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4reBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4reGroupLbl{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:10px 0 6px;}' +
    'body.dark .v4reGroupLbl{color:#94a3b8;}' +
    '.v4reGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '.v4reRow{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px;}' +
    '.v4reRow b{text-align:right;}' +
    '</style>' +

    '<div class="card" style="padding:12px" id="v4reHealth"></div>' +

    '<div class="card" style="padding:12px">' +

    '<div class="v4reGroupLbl">📊 Financial Statements</div>' +
    '<div class="v4reGrid" style="margin-bottom:8px">' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#059669,#34d399)" onclick="v4reOpen(\'pnl\')"><span class="v4reBtnIc">📈</span><span class="v4reBtnTx"><b>P&amp;L Statement</b><small>Profit &amp; Loss — the truth of your business</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#0d64f0,#60a5fa)" onclick="v4reOpen(\'zreport\')"><span class="v4reBtnIc">🧾</span><span class="v4reBtnTx"><b>Z-Report</b><small>End of day — cash drawer check</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#b45309,#f59e0b)" onclick="v4reOpen(\'tax\')"><span class="v4reBtnIc">🏛️</span><span class="v4reBtnTx"><b>Tax Liability</b><small>What you owe the government</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#dc2626,#f87171)" onclick="v4reOpen(\'erca\')"><span class="v4reBtnIc">📜</span><span class="v4reBtnTx"><b>ERCA Report</b><small>Government fiscal — monthly receipts</small></span><span class="v4reBtnGo">›</span></button>' +
    '</div>' +

    '<div class="v4reGroupLbl">👥 Business Intelligence</div>' +
    '<div class="v4reGrid" style="margin-bottom:8px">' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)" onclick="v4reOpen(\'crm\')"><span class="v4reBtnIc">👥</span><span class="v4reBtnTx"><b>Customer CRM</b><small>Top customers, visits &amp; unpaid credit</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#25D366,#34d399)" onclick="v4reOpen(\'marketing\')"><span class="v4reBtnIc">📣</span><span class="v4reBtnTx"><b>Win Back Customers</b><small>WhatsApp promo to inactive customers</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#ea580c,#fb923c)" onclick="v4reOpen(\'menueng\')"><span class="v4reBtnIc">🍕</span><span class="v4reBtnTx"><b>Menu Engineering</b><small>Stars, dogs — what to keep or remove</small></span><span class="v4reBtnGo">›</span></button>' +
    '</div>' +

    '<div class="v4reGroupLbl">🛡️ Compliance &amp; Tools</div>' +
    '<div class="v4reGrid" style="margin-bottom:8px">' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#334155,#64748b)" onclick="v4reOpen(\'audit\')"><span class="v4reBtnIc">🛡️</span><span class="v4reBtnTx"><b>Audit Log</b><small>Security trail — voids &amp; sensitive actions</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#0284c7,#38bdf8)" onclick="v4reOpen(\'timesheet\')"><span class="v4reBtnIc">⏰</span><span class="v4reBtnTx"><b>Timesheets</b><small>Staff clock-ins with selfie &amp; GPS</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#059669,#10b981)" onclick="v4reOpen(\'valuation\')"><span class="v4reBtnIc">📦</span><span class="v4reBtnTx"><b>Inventory Valuation</b><small>Cost, retail &amp; potential profit</small></span><span class="v4reBtnGo">›</span></button>' +
      '<button class="v4reBtn" style="background:linear-gradient(135deg,#4f46e5,#818cf8)" onclick="v4reOpen(\'manualinv\')"><span class="v4reBtnIc">✍️</span><span class="v4reBtnTx"><b>Manual Invoice</b><small>Record sales made outside POS</small></span><span class="v4reBtnGo">›</span></button>' +
    '</div>' +
    '</div>';
}

// ── health strip ──
async function v4reHealth() {
  var el = document.getElementById('v4reHealth'); if (!el) return;
  var start = v4rePeriodStart('month');
  try {
    var rev = 0, exp = 0;
    try { if (typeof v4EnsureDaily === 'function') { await v4EnsureDaily(); } } catch(e) {}
    var key = start.toISOString().slice(0,7);
    (window._ssDailyAll || []).forEach(function(d){ if (String(d.date).slice(0,7) === key) rev += d.total; });
    try { const { data } = await supabaseClient.from('expenses').select('amount').eq('shop_id', getShopId()).gte('date', start.toISOString().slice(0,10)).limit(500); (data||[]).forEach(function(e){ exp += e.amount; }); } catch(e) {}
    function H(v,l,c,tap){ return '<div class="v4reH" onclick="v4reOpen(\'' + tap + '\')"><b style="color:' + c + '">' + v + '</b><small>' + l + '</small></div>'; }
    el.innerHTML = '<div style="display:flex;gap:8px">' +
      H(fmtMoney(rev), '💰 REVENUE (MO)', '#3b82f6', 'pnl') +
      H(fmtMoney(exp), '💸 EXPENSES (MO)', '#f97316', 'pnl') +
      H(fmtMoney(rev - exp), '📈 NET (MO)', (rev-exp) >= 0 ? '#10b981' : '#ef4444', 'pnl') +
      H('📊', 'ALL REPORTS', '#7c3aed', 'pnl') +
      '</div>';
  } catch(e) {}
}

// ── modal ──
function v4reModal(title, wide) {
  v4reCloseModal();
  var m = document.createElement('div');
  m.id = 'v4reToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:' + (wide ? '620px' : '540px') + ';margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4reCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4reToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4reCloseModal(); });
}
function v4reCloseModal() { var m = document.getElementById('v4reToolModal'); if (m) m.remove(); }

// ── period chips ──
function v4rePeriodChips() {
  var P = { today:'📅 Today', week:'📅 This Week', month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' + Object.keys(P).map(function(p){
    return '<button class="v4PChip' + (v4re.period === p ? ' active' : '') + '" onclick="v4reSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
  }).join('') + '</div>';
}
function v4reSetPeriod(p) {
  v4re.period = p;
  var chips = document.querySelector('#v4reToolModal .v4PChips');
  if (chips) chips.outerHTML = v4rePeriodChips();
  // re-run the currently open report
  var tool = window._v4reCurrent;
  if (tool) v4reFillBody(tool);
}
function v4reFillBody(tool) {
  window._v4reCurrent = tool;
  var body = document.getElementById('v4reToolBody');
  if (!body) return;
  if (tool === 'pnl') v4rePnL();
  else if (tool === 'zreport') v4reZReport();
  else if (tool === 'tax') v4reTax();
  else if (tool === 'valuation') body.innerHTML = v4reValuationHTML();
  else if (tool === 'menueng') v4reMenuEng();
  else if (tool === 'crm') v4reCRM();
  else if (tool === 'marketing') v4reMarketing();
  else if (tool === 'audit') v4reAudit();
  else if (tool === 'timesheet') v4reTimesheet();
  else if (tool === 'erca') v4reERCA();
  else if (tool === 'manualinv') body.innerHTML = v4reManualInvHTML();
}

// ═══ P&L STATEMENT (lens-aware — the flagship) ═══
async function v4rePnL() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = v4rePeriodChips() + '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Calculating…</p>';
  var start = v4rePeriodStart(v4re.period);
  var startISO = start.toISOString();
  var revenue = 0, cogs = 0, grossProfit = 0, expTotal = 0, lossTotal = 0, taxTotal = 0;
  var paySplit = { cash: 0, card: 0, mobile: 0, credit: 0 };
  try {
    // sales — lens-aware, bounded
    const { data: sales } = await supabaseClient.from('sales')
      .select('total, profit, tax, payment_method, payments, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', startISO).order('time', { ascending: false }).limit(2000);
    (sales || []).filter(v4reLensFilter).forEach(function(s){
      revenue += Number(s.total || 0);
      grossProfit += Number(s.profit || 0);
      taxTotal += Number(s.tax || 0);
      if (s.payment_method === 'split' && Array.isArray(s.payments)) {
        s.payments.forEach(function(p){ var m = p.method || 'cash'; if (paySplit[m] !== undefined) paySplit[m] += Number(p.amount || 0); });
      } else { var m2 = s.payment_method || 'cash'; if (paySplit[m2] !== undefined) paySplit[m2] += Number(s.total || 0); }
    });
    cogs = revenue - grossProfit;
    // expenses
    try { const { data: exps } = await supabaseClient.from('expenses').select('amount, date').eq('shop_id', getShopId()).gte('date', startISO.slice(0,10)).limit(1000); (exps||[]).forEach(function(e){ expTotal += e.amount; }); } catch(e) {}
    // losses
    try { const { data: los } = await supabaseClient.from('losses').select('total_loss').eq('shop_id', getShopId()).gte('time', startISO).limit(500); (los||[]).forEach(function(l){ lossTotal += l.total_loss; }); } catch(e) {}
  } catch(e) {}
  var netProfit = grossProfit - expTotal - lossTotal;
  var margin = revenue > 0 ? (netProfit / revenue * 100).toFixed(1) : '0';
  window._v4rePnL = { revenue:revenue, cogs:cogs, grossProfit:grossProfit, expTotal:expTotal, lossTotal:lossTotal, netProfit:netProfit, margin:margin, taxTotal:taxTotal, paySplit:paySplit };
  body.innerHTML = v4rePeriodChips() + v4rePnLHTML();
}
function v4rePnLHTML() {
  var d = window._v4rePnL;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var html = '<div style="border:2px solid #1e293b;padding:14px;border-radius:10px">' +
    '<h3 style="text-align:center;margin-bottom:4px;font-size:15px">Profit &amp; Loss Statement' + v4reLensLabel() + '</h3>' +
    '<p style="text-align:center;font-size:11px;color:#64748b;margin-bottom:12px">' + sanitize(shop) + ' · ' + v4rePeriodLabel() + '</p>' +
    '<div style="border-bottom:1px solid #ccc;padding-bottom:4px;font-weight:800;font-size:12px">REVENUE</div>' +
    '<div class="v4reRow"><span>Gross Sales</span><b>' + fmtMoney(d.revenue) + '</b></div>' +
    '<div style="border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:8px;font-weight:800;font-size:12px;color:#ef4444">COST OF GOODS SOLD</div>' +
    '<div class="v4reRow" style="color:#ef4444"><span>Cost of Items Sold</span><b>(' + fmtMoney(d.cogs) + ')</b></div>' +
    '<div class="v4reRow" style="border-top:2px solid #1e293b;font-weight:800;margin-top:6px"><span>GROSS PROFIT</span><b>' + fmtMoney(d.grossProfit) + '</b></div>' +
    '<div style="border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:8px;font-weight:800;font-size:12px;color:#ef4444">OPERATING EXPENSES &amp; LOSSES</div>' +
    '<div class="v4reRow" style="color:#ef4444"><span>Total Expenses</span><b>(' + fmtMoney(d.expTotal) + ')</b></div>' +
    '<div class="v4reRow" style="color:#ef4444"><span>Inventory Losses</span><b>(' + fmtMoney(d.lossTotal) + ')</b></div>' +
    '<div class="v4reRow" style="font-size:16px;color:' + (d.netProfit >= 0 ? '#10b981' : '#ef4444') + ';border-top:2px solid #1e293b;border-bottom:2px solid #1e293b;margin-top:6px;padding:8px 0"><span><b>NET PROFIT</b></span><b>' + fmtMoney(d.netProfit) + '</b></div>' +
    '<div class="v4reRow"><span>Net Margin</span><b>' + d.margin + '%</b></div>';
  if (d.taxTotal > 0) {
    html += '<div class="v4reRow" style="color:#f59e0b"><span>Tax collected (payable)</span><b>' + fmtMoney(d.taxTotal) + '</b></div>';
  }
  html += '</div>' +
    '<p style="font-size:10px;color:#64748b;text-align:center;margin:8px 0">' + v4reLensLabel().replace(/[()]/g,'') + ' Payments: 💵' + fmtMoney(d.paySplit.cash) + ' · 💳' + fmtMoney(d.paySplit.card) + ' · 📱' + fmtMoney(d.paySplit.mobile) + ' · 📝' + fmtMoney(d.paySplit.credit) + '</p>' +
    '<div style="display:flex;gap:6px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4rePnLWA()">📤 WhatsApp</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4rePnLPrint()">🖨️ Print</button>' +
    '</div>';
  return html;
}
function v4rePnLText() {
  var d = window._v4rePnL;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  return '📈 P&L STATEMENT — ' + shop + v4reLensLabel() + '\n' + v4rePeriodLabel() + '\n\n' +
    'Revenue: ' + fmtMoney(d.revenue) + '\nCOGS: -' + fmtMoney(d.cogs) + '\nGross Profit: ' + fmtMoney(d.grossProfit) +
    '\nExpenses: -' + fmtMoney(d.expTotal) + '\nLosses: -' + fmtMoney(d.lossTotal) +
    '\n\nNET PROFIT: ' + fmtMoney(d.netProfit) + ' (' + d.margin + '% margin)' +
    (d.taxTotal > 0 ? '\nTax payable: ' + fmtMoney(d.taxTotal) : '') + '\n\n— SmartShop Pro';
}
function v4rePnLWA() {
  var phone = prompt('Send P&L to which WhatsApp number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(v4rePnLText()), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(v4rePnLText()).then(function(){ alert('📋 P&L copied!'); });
}
function v4rePnLPrint() {
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups to print.'); return; }
  w.document.write('<html><head><title>P&L</title><style>body{font-family:monospace;padding:14px;font-size:12px}pre{white-space:pre-wrap}</style></head><body><pre>' + sanitize(v4rePnLText()) + '</pre></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// ═══ Z-REPORT (end of day) ═══
async function v4reZReport() {
  var body = document.getElementById('v4reToolBody');
  var dateStr = v4rePeriodStart('today');
  var startOfDay = dateStr.toISOString();
  var endOfDay = new Date(dateStr.getTime() + 86400000).toISOString();
  body.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Calculating today…</p>';
  var cash = 0, card = 0, mobile = 0, credit = 0, total = 0, txCount = 0;
  try {
    const { data } = await supabaseClient.from('sales')
      .select('total, payment_method, payments, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', startOfDay).lt('time', endOfDay)
      .order('time', { ascending: false }).limit(1000);
    (data || []).filter(v4reLensFilter).forEach(function(s){
      var t = Number(s.total || 0);
      total += t; txCount++;
      if (s.payment_method === 'split' && Array.isArray(s.payments)) {
        s.payments.forEach(function(p){
          var m = p.method || 'cash';
          if (m === 'cash') cash += Number(p.amount||0);
          else if (m === 'card') card += Number(p.amount||0);
          else if (m === 'mobile') mobile += Number(p.amount||0);
          else if (m === 'credit') credit += Number(p.amount||0);
        });
      } else {
        var m2 = s.payment_method || 'cash';
        if (m2 === 'cash') cash += t;
        else if (m2 === 'card') card += t;
        else if (m2 === 'mobile') mobile += t;
        else if (m2 === 'credit') credit += t;
      }
    });
  } catch(e) {}
  window._v4reZ = { cash:cash, card:card, mobile:mobile, credit:credit, total:total, txCount:txCount };
  body.innerHTML = v4reZHTML();
}
function v4reZHTML() {
  var d = window._v4reZ;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  return '<div style="border:2px dashed #1e293b;padding:14px;border-radius:10px">' +
    '<h3 style="text-align:center;margin-bottom:4px;font-size:15px">🧾 Z-Report (End of Day)' + v4reLensLabel() + '</h3>' +
    '<p style="text-align:center;font-size:11px;color:#64748b;margin-bottom:12px">' + sanitize(shop) + ' · ' + new Date().toLocaleDateString() + '</p>' +
    '<div class="v4reRow"><span>Total Transactions</span><b>' + d.txCount + '</b></div>' +
    '<div class="v4reRow" style="border-bottom:1px solid #ccc"><span>Gross Sales</span><b>' + fmtMoney(d.total) + '</b></div>' +
    '<div class="v4reRow"><span>💵 Cash Expected</span><b style="color:#10b981">' + fmtMoney(d.cash) + '</b></div>' +
    '<div class="v4reRow"><span>💳 Card</span><b>' + fmtMoney(d.card) + '</b></div>' +
    '<div class="v4reRow"><span>📱 Mobile</span><b>' + fmtMoney(d.mobile) + '</b></div>' +
    '<div class="v4reRow" style="border-bottom:1px solid #ccc"><span>📝 Credit/Unpaid</span><b style="color:#ef4444">' + fmtMoney(d.credit) + '</b></div>' +
    '<p style="text-align:center;font-size:11px;color:#64748b;margin-top:10px">⚠️ Count physical cash in drawer and compare to Cash Expected.</p></div>' +
    '<div style="display:flex;gap:6px;margin-top:10px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4reZWA()">📤 WhatsApp</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4reZPrint()">🖨️ Print</button></div>';
}
function v4reZText() {
  var d = window._v4reZ;
  return '🧾 Z-REPORT — ' + new Date().toLocaleDateString() + v4reLensLabel() + '\n\n' +
    'Transactions: ' + d.txCount + '\nGross: ' + fmtMoney(d.total) + '\n' +
    '💵 Cash expected: ' + fmtMoney(d.cash) + '\n💳 Card: ' + fmtMoney(d.card) + '\n' +
    '📱 Mobile: ' + fmtMoney(d.mobile) + '\n📝 Credit: ' + fmtMoney(d.credit) + '\n\n— SmartShop Pro';
}
function v4reZWA() {
  var phone = prompt('Send Z-Report to which number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(v4reZText()), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(v4reZText()).then(function(){ alert('📋 Z-Report copied!'); });
}
function v4reZPrint() {
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups.'); return; }
  w.document.write('<html><head><title>Z-Report</title><style>body{font-family:monospace;padding:14px;font-size:12px}pre{white-space:pre-wrap}</style></head><body><pre>' + sanitize(v4reZText()) + '</pre></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// ═══ TAX LIABILITY (TOT law: never shows tax for TOT shops) ═══
async function v4reTax() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = v4rePeriodChips() + '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Loading tax data…</p>';
  var taxName = 'Tax', taxRate = 0, taxType = 'TOT';
  try {
    const { data: set } = await supabaseClient.from('settings').select('tax_name, tax_rate, tax_type, enable_tax').eq('shop_id', getShopId()).maybeSingle();
    if (set) { taxName = set.tax_name || 'Tax'; taxRate = set.tax_rate || 0; taxType = set.tax_type || 'TOT'; }
  } catch(e) {}
  var start = v4rePeriodStart(v4re.period);
  var gross = 0, taxCollected = 0, net = 0, txCount = 0;
  try {
    const { data } = await supabaseClient.from('sales')
      .select('subtotal, tax, total, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString()).limit(2000);
    (data || []).filter(v4reLensFilter).forEach(function(s){
      txCount++;
      gross += Number(s.subtotal || 0);
      taxCollected += Number(s.tax || 0);
      net += Number(s.total || 0);
    });
  } catch(e) {}
  window._v4reTax = { taxName:taxName, taxRate:taxRate, taxType:taxType, gross:gross, taxCollected:taxCollected, net:net, txCount:txCount };
  body.innerHTML = v4rePeriodChips() + v4reTaxHTML();
}
function v4reTaxHTML() {
  var d = window._v4reTax;
  var isTOT = d.taxType === 'TOT';
  var html = '<div style="border:2px solid #1e293b;padding:14px;border-radius:10px">' +
    '<h3 style="text-align:center;margin-bottom:4px;font-size:15px">🏛️ Tax Liability Report</h3>' +
    '<p style="text-align:center;font-size:11px;color:#64748b;margin-bottom:12px">' + d.taxName + ' · ' + (isTOT ? 'TOT (no VAT charged)' : 'VAT ' + d.taxRate + '%') + ' · ' + v4rePeriodLabel() + '</p>' +
    '<div class="v4reRow"><span>Total Transactions</span><b>' + d.txCount + '</b></div>' +
    '<div class="v4reRow"><span>Gross Sales (before tax)</span><b>' + fmtMoney(d.gross) + '</b></div>' +
    '<div class="v4reRow" style="border-bottom:1px solid #ccc"><span>Total Sales (incl. tax)</span><b>' + fmtMoney(d.net) + '</b></div>';
  if (isTOT) {
    html += '<div style="text-align:center;padding:14px;background:#fef3c7;border-radius:8px;margin-top:10px;font-size:12px;color:#92400e;font-weight:700">🔒 TOT SHOP — no VAT charged (law).\nYour TOT is included in your expenses/revenue, not collected separately.</div>'.replace('\n','<br>');
  } else {
    html += '<div class="v4reRow" style="font-size:18px;color:#ef4444;font-weight:800;border-top:2px solid #1e293b;margin-top:8px;padding:8px 0"><span>' + d.taxName.toUpperCase() + ' COLLECTED</span><b>' + fmtMoney(d.taxCollected) + '</b></div>' +
      '<p style="text-align:center;font-size:11px;color:#64748b;margin-top:8px">This is the amount you need to remit to the tax authority.</p>';
  }
  html += '</div>' +
    '<div style="display:flex;gap:6px;margin-top:10px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4reTaxWA()">📤 WhatsApp</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4reTaxPrint()">🖨️ Print</button></div>';
  return html;
}
function v4reTaxText() {
  var d = window._v4reTax;
  var isTOT = d.taxType === 'TOT';
  return '🏛️ TAX REPORT — ' + v4rePeriodLabel() + '\n\n' +
    'Type: ' + (isTOT ? 'TOT (no VAT)' : 'VAT ' + d.taxRate + '%') + '\n' +
    'Transactions: ' + d.txCount + '\nGross: ' + fmtMoney(d.gross) + '\n' +
    (isTOT ? 'No VAT collected (TOT shop)' : d.taxName + ' collected: ' + fmtMoney(d.taxCollected) + ' — PAYABLE') + '\n\n— SmartShop Pro';
}
function v4reTaxWA() {
  var phone = prompt('Send tax report to which number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(v4reTaxText()), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(v4reTaxText()).then(function(){ alert('📋 Copied!'); });
}
function v4reTaxPrint() {
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups.'); return; }
  w.document.write('<html><head><title>Tax Report</title><style>body{font-family:monospace;padding:14px;font-size:12px}pre{white-space:pre-wrap}</style></head><body><pre>' + sanitize(v4reTaxText()) + '</pre></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// ═══ INVENTORY VALUATION ═══
function v4reValuationHTML() {
  var cost = 0, retail = 0, items = 0;
  v4products.forEach(function(p){
    if (p.isVirtual) return;
    var stock = p.stock || 0;
    if (stock <= 0) return;
    items += stock;
    cost += stock * (p.costPrice || 0);
    retail += stock * (p.price || 0);
  });
  function big(v,l,c){ return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:14px 6px;text-align:center"><b style="font-size:18px;display:block;color:' + c + '">' + v + '</b><small style="font-size:9px;font-weight:800;color:#64748b">' + l + '</small></div>'; }
  return '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">' +
    big(fmtMoney(cost), '💰 COST VALUE (what you paid)', '#3b82f6') +
    big(fmtMoney(retail), '🏷️ RETAIL VALUE (if all sold)', '#10b981') +
    big(fmtMoney(retial = retail - cost), '📈 POTENTIAL PROFIT', '#8b5cf6') +
    big(items, '📦 UNITS IN STOCK', '#64748b') +
    '</div>' +
    '<p style="text-align:center;font-size:12px;color:#64748b">If you sold every item today, you would collect ' + fmtMoney(retail) + '.</p>';
}
var retial = 0; // scope fix

// ═══ MENU ENGINEERING (Stars/Plowhorses/Puzzles/Dogs — bounded) ═══
async function v4reMenuEng() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = v4rePeriodChips() + '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Analyzing menu…</p>';
  var start = v4rePeriodStart(v4re.period);
  var itemData = {};
  try {
    const { data } = await supabaseClient.from('sales')
      .select('items, order_type')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString()).limit(2000);
    (data || []).filter(v4reLensFilter).forEach(function(sale){
      (sale.items || []).forEach(function(item){
        if (!itemData[item.name]) itemData[item.name] = { qty: 0, revenue: 0 };
        itemData[item.name].qty += item.qty || 0;
        itemData[item.name].revenue += (item.price || 0) * (item.qty || 0);
      });
    });
  } catch(e) {}
  var items = Object.keys(itemData).map(function(n){ return { name:n, qty:itemData[n].qty, revenue:itemData[n].revenue }; });
  if (!items.length) {
    body.innerHTML = v4rePeriodChips() + '<p style="text-align:center;padding:24px;color:#64748b;font-size:13px">No sales data to analyze yet in ' + v4rePeriodLabel() + '.</p>';
    return;
  }
  var totalQty = items.reduce(function(s,i){ return s + i.qty; }, 0);
  var avgQty = totalQty / items.length;
  var avgRev = items.reduce(function(s,i){ return s + i.revenue; }, 0) / items.length;
  var stars = [], plowhorses = [], puzzles = [], dogs = [];
  items.forEach(function(item){
    if (item.qty >= avgQty && item.revenue >= avgRev) stars.push(item);
    else if (item.qty >= avgQty && item.revenue < avgRev) plowhorses.push(item);
    else if (item.qty < avgQty && item.revenue >= avgRev) puzzles.push(item);
    else dogs.push(item);
  });
  function sortByRev(a,b){ return b.revenue - a.revenue; }
  stars.sort(sortByRev); plowhorses.sort(sortByRev); puzzles.sort(sortByRev); dogs.sort(sortByRev);
  function group(arr, title, color, emoji, advice) {
    if (!arr.length) return '';
    var h = '<div style="margin-bottom:12px">' +
      '<div style="background:' + color + ';color:white;padding:8px 12px;border-radius:8px 8px 0 0;font-weight:bold;font-size:13px">' + emoji + ' ' + title + ' (' + arr.length + ')</div>' +
      '<div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:8px">' +
      '<small style="color:#64748b;display:block;margin-bottom:6px">' + advice + '</small>';
    arr.forEach(function(i){
      h += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span><b>' + sanitize(i.name) + '</b><br><small style="color:#64748b">sold ' + i.qty + '</small></span>' +
        '<span style="text-align:right;color:' + color + '"><b>' + fmtMoney(i.revenue) + '</b></span></div>';
    });
    return h + '</div></div>';
  }
  window._v4reMenuEng = { stars:stars.length, plowhorses:plowhorses.length, puzzles:puzzles.length, dogs:dogs.length };
  body.innerHTML = v4rePeriodChips() +
    group(stars, 'STARS', '#10b981', '⭐', 'High profit & popular. Keep these!') +
    group(plowhorses, 'PLOWHORSES', '#f59e0b', '🐴', 'Popular but low revenue. Consider raising the price.') +
    group(puzzles, 'PUZZLES', '#3b82f6', '🧩', 'High revenue but not selling much. Promote better!') +
    group(dogs, 'DOGS', '#ef4444', '🐶', 'Low revenue & not selling. Remove from menu.') +
    '<button class="v4-btn g" onclick="v4reMenuEngWA()">📤 Share Analysis</button>';
}
function v4reMenuEngWA() {
  var d = window._v4reMenuEng || {};
  var msg = '🍕 MENU ENGINEERING — ' + v4rePeriodLabel() + '\n\n⭐ Stars: ' + (d.stars||0) + ' (keep!)\n🐴 Plowhorses: ' + (d.plowhorses||0) + ' (raise price)\n🧩 Puzzles: ' + (d.puzzles||0) + ' (promote)\n🐶 Dogs: ' + (d.dogs||0) + ' (remove)\n\n— SmartShop Pro';
  var phone = prompt('Send to which number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Copied!'); });
}

// ═══ CUSTOMER CRM (bounded) ═══
async function v4reCRM() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = v4rePeriodChips() + '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Building profiles…</p>';
  var start = v4rePeriodStart(v4re.period);
  var customers = {};
  try {
    const { data } = await supabaseClient.from('sales')
      .select('customer_name, customer_phone, total, paid_at, time')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', start.toISOString()).limit(2000);
    (data || []).forEach(function(s){
      if (!s.customer_name && !s.customer_phone) return;
      var key = s.customer_phone || s.customer_name;
      if (!customers[key]) customers[key] = { name:s.customer_name||'Unknown', phone:s.customer_phone||'', spend:0, visits:0, credit:0, last:'' };
      customers[key].spend += Number(s.total || 0);
      customers[key].visits++;
      if (!s.paid_at) customers[key].credit += Number(s.total || 0);
      if (!customers[key].last || s.time > customers[key].last) customers[key].last = s.time;
    });
  } catch(e) {}
  var arr = Object.values(customers).sort(function(a,b){ return b.spend - a.spend; }).slice(0, 50);
  if (!arr.length) {
    body.innerHTML = v4rePeriodChips() + '<p style="text-align:center;padding:24px;color:#64748b;font-size:13px">No customer data yet. Add customer names/phones on credit sales or receipts!</p>';
    return;
  }
  var html = v4rePeriodChips() + '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th style="text-align:left;padding:8px">Customer</th><th style="text-align:center;padding:8px">Visits</th><th style="text-align:right;padding:8px">Spend</th><th style="text-align:right;padding:8px">Credit</th></tr></thead><tbody>';
  arr.forEach(function(c){
    var creditColor = c.credit > 0 ? '#ef4444' : '#10b981';
    html += '<tr style="border-bottom:1px solid #f1f5f9">' +
      '<td style="padding:8px"><b>' + sanitize(c.name) + '</b><br><small style="color:#64748b">' + (c.phone ? '📞 ' + sanitize(c.phone) : 'no phone') + '</small></td>' +
      '<td style="text-align:center;padding:8px">' + c.visits + '</td>' +
      '<td style="text-align:right;padding:8px;font-weight:bold;color:#2563eb">' + fmtMoney(c.spend) + '</td>' +
      '<td style="text-align:right;padding:8px;font-weight:bold;color:' + creditColor + '">' + (c.credit > 0 ? fmtMoney(c.credit) : '✅') + '</td></tr>';
  });
  html += '</tbody></table>';
  body.innerHTML = html;
}

// ═══ WHATSAPP MARKETING (inactive customers — bounded) ═══
async function v4reMarketing() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Finding inactive customers…</p>';
  var thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  var customers = {};
  try {
    const { data } = await supabaseClient.from('sales')
      .select('customer_name, customer_phone, time')
      .eq('shop_id', getShopId()).eq('voided', false)
      .gte('time', new Date(Date.now() - 365*86400000).toISOString()).limit(3000);
    (data || []).forEach(function(s){
      if (!s.customer_phone) return;
      if (!customers[s.customer_phone]) customers[s.customer_phone] = { name:s.customer_name||'Customer', phone:s.customer_phone, last:'' };
      if (!customers[s.customer_phone].last || s.time > customers[s.customer_phone].last) customers[s.customer_phone].last = s.time;
    });
  } catch(e) {}
  var all = Object.values(customers);
  if (!all.length) {
    body.innerHTML = '<p style="text-align:center;padding:24px;color:#f59e0b;font-weight:bold;font-size:14px">📭 No customer phone numbers yet</p><p style="font-size:13px;color:#64748b;text-align:center;padding:0 15px">Phone numbers are collected on credit sales. Once you have them, this tool finds everyone who hasn\'t visited in 30+ days and sends them a WhatsApp promo!</p>';
    return;
  }
  var inactive = all.filter(function(c){ return new Date(c.last) < new Date(thirtyAgo); });
  if (!inactive.length) {
    body.innerHTML = '<p style="text-align:center;padding:24px;color:#10b981;font-weight:bold;font-size:14px">✅ All ' + all.length + ' customer(s) visited in the last 30 days! Great job.</p>';
    return;
  }
  var promo = encodeURIComponent('Hello! We miss you at our shop. Come back this week and get a 10% discount! Show this message to the cashier.');
  var html = '<p style="font-size:12px;color:#64748b;margin-bottom:12px">' + inactive.length + ' customer(s) haven\'t visited in 30+ days. Tap "Send Promo" to message them.</p>';
  inactive.forEach(function(c){
    var days = Math.floor((Date.now() - new Date(c.last)) / 86400000);
    html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">' +
      '<div><b>' + sanitize(c.name) + '</b><br><small style="color:#64748b">Last visit: ' + days + ' days ago</small></div>' +
      '<a href="https://wa.me/' + c.phone.replace(/[^0-9]/g,'') + '?text=' + promo + '" target="_blank" style="background:#25D366;color:white;text-decoration:none;padding:8px 15px;border-radius:8px;font-weight:bold;font-size:12px">💬 Send</a></div>';
  });
  body.innerHTML = html;
}

// ═══ AUDIT LOG ═══
async function v4reAudit() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Loading security logs…</p>';
  var html = '';
  try {
    const { data } = await supabaseClient.from('audit_logs')
      .select('*').eq('shop_id', getShopId())
      .order('timestamp', { ascending: false }).limit(50);
    if (!data || !data.length) {
      html = '<p style="text-align:center;padding:24px;color:#94a3b8">No actions logged yet.</p>';
    } else {
      data.forEach(function(log){
        var time = new Date(log.timestamp).toLocaleString();
        var color = log.action === 'SALE_VOIDED' ? '#ef4444' : '#3b82f6';
        html += '<div style="background:' + (log.action === 'SALE_VOIDED' ? '#fef2f2' : '#f8fafc') + ';border-left:4px solid ' + color + ';padding:10px;margin-bottom:8px;border-radius:6px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
          '<b style="font-size:13px;color:' + color + '">' + String(log.action || 'UNKNOWN').replace(/_/g, ' ') + '</b>' +
          '<small style="color:#64748b">' + time + '</small></div>' +
          '<div style="font-size:12px;color:#334155">' + sanitize(log.details || '') + '</div>' +
          '<div style="font-size:11px;color:#64748b;margin-top:4px">👤 ' + sanitize(log.cashier_name || 'Unknown') + '</div></div>';
      });
    }
  } catch(e) {
    html = '<p style="color:#ef4444;padding:10px">Error: ' + e.message + '</p>';
  }
  body.innerHTML = html;
}

// ═══ TIMESHEETS ═══
async function v4reTimesheet() {
  var body = document.getElementById('v4reToolBody');
  body.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Loading timesheets…</p>';
  var html = '<p style="font-size:11px;color:#64748b;margin-bottom:10px">Last 50 clock-in/out records (with selfie &amp; GPS).</p>';
  try {
    const { data } = await supabaseClient.from('timecards')
      .select('*').eq('shop_id', getShopId())
      .order('clock_in_time', { ascending: false }).limit(50);
    if (!data || !data.length) {
      html += '<p style="text-align:center;padding:24px;color:#94a3b8">No staff clock-ins recorded yet.</p>';
    } else {
      html += '<table style="width:100%;font-size:11px;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th style="text-align:left;padding:6px">Selfie</th><th style="text-align:left;padding:6px">Staff</th><th style="text-align:left;padding:6px">In</th><th style="text-align:left;padding:6px">Out</th><th style="text-align:right;padding:6px">Dur.</th></tr></thead><tbody>';
      data.forEach(function(log){
        var inTime = new Date(log.clock_in_time);
        var outTime = log.clock_out_time ? new Date(log.clock_out_time) : null;
        var inStr = inTime.toLocaleDateString() + ' ' + inTime.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        var outStr = outTime ? outTime.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '<span style="color:#f59e0b;">Active</span>';
        if (log.clock_in_gps && log.clock_in_gps !== 'No GPS') inStr += '<br><a href="' + log.clock_in_gps + '" target="_blank" style="color:#2563eb;font-size:9px;">📍</a>';
        var duration = '-';
        if (outTime) {
          var diffMs = outTime - inTime;
          duration = Math.floor(diffMs / 3600000) + 'h ' + Math.round((diffMs % 3600000) / 60000) + 'm';
        }
        var selfie = log.clock_in_selfie ? '<img src="' + log.clock_in_selfie + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="window.open(this.src,\'_blank\')">' : '-';
        html += '<tr style="border-bottom:1px solid #f1f5f9">' +
          '<td style="padding:6px">' + selfie + '</td>' +
          '<td style="padding:6px;font-weight:600">' + sanitize(log.employee_name || '?') + '</td>' +
          '<td style="padding:6px">' + inStr + '</td>' +
          '<td style="padding:6px">' + outStr + '</td>' +
          '<td style="padding:6px;text-align:right;font-weight:600">' + duration + '</td></tr>';
      });
      html += '</tbody></table>';
    }
  } catch(e) { html += '<p style="color:#ef4444">Error: ' + e.message + '</p>'; }
  body.innerHTML = html;
}

// ═══ ERCA GOVERNMENT REPORT (uses existing ssFiscalMonthlyReport) ═══
async function v4reERCA() {
  var body = document.getElementById('v4reToolBody');
  var m = await prompt('Month (1-12):', String(new Date().getMonth() + 1));
  if (!m) return;
  var y = await prompt('Year:', String(new Date().getFullYear()));
  if (!y) return;
  body.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Generating fiscal report…</p>';
  try {
    var rep = await ssFiscalMonthlyReport(parseInt(y), parseInt(m));
    window._v4reERCA = rep;
    var summary = '🏛️ MONTHLY TAX REPORT\nPeriod: ' + y + ' / ' + m + '\n\n' +
      'Receipts issued: ' + rep.issued + '\n' +
      'Receipts voided: ' + rep.voided + '\n' +
      'First receipt: ' + (rep.firstNo || '—') + '\n' +
      'Last receipt: ' + (rep.lastNo || '—') + '\n' +
      'Total sales: ' + fmtMoney(rep.totalSales) + '\n' +
      'VAT collected: ' + fmtMoney(rep.totalVat) + '\n\n' +
      'Keep this for your monthly tax declaration.';
    body.innerHTML = '<div style="border:2px solid #1e293b;padding:14px;border-radius:10px;font-size:13px;line-height:1.8">' +
      '<h3 style="text-align:center;margin-bottom:8px">🏛️ ERCA Monthly Report</h3>' +
      '<div class="v4reRow"><span>Receipts issued</span><b>' + rep.issued + '</b></div>' +
      '<div class="v4reRow"><span>Receipts voided (kept for audit)</span><b>' + rep.voided + '</b></div>' +
      '<div class="v4reRow"><span>First → Last receipt</span><b>' + (rep.firstNo || '—') + ' → ' + (rep.lastNo || '—') + '</b></div>' +
      '<div class="v4reRow" style="font-weight:800;font-size:15px"><span>Total sales</span><b>' + fmtMoney(rep.totalSales) + '</b></div>' +
      '<div class="v4reRow" style="font-weight:800;font-size:15px;color:#ef4444"><span>VAT collected</span><b>' + fmtMoney(rep.totalVat) + '</b></div></div>' +
      '<p style="font-size:11px;color:#64748b;text-align:center;margin-top:8px">Keep this for your monthly tax declaration.</p>' +
      '<div style="display:flex;gap:6px;margin-top:8px">' +
      '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4reERCAWA()">📤 WhatsApp</button>' +
      '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4reERCAPrint()">🖨️ Print</button></div>';
  } catch(e) {
    body.innerHTML = '<p style="color:#ef4444;padding:14px">Error: ' + e.message + '</p>';
  }
}
function v4reERCAText() {
  var rep = window._v4reERCA;
  if (!rep) return '';
  return '🏛️ ERCA MONTHLY REPORT\n\nReceipts: ' + rep.issued + ' issued, ' + rep.voided + ' voided\n' +
    'Sales: ' + fmtMoney(rep.totalSales) + '\nVAT: ' + fmtMoney(rep.totalVat) + '\n\n— SmartShop Pro';
}
function v4reERCAWA() {
  var phone = prompt('Send ERCA report to which number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(v4reERCAText()), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(v4reERCAText()).then(function(){ alert('📋 Copied!'); });
}
function v4reERCAPrint() {
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups.'); return; }
  w.document.write('<html><head><title>ERCA Report</title><style>body{font-family:monospace;padding:14px;font-size:12px}pre{white-space:pre-wrap}</style></head><body><pre>' + sanitize(v4reERCAText()) + '</pre></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// ═══ MANUAL INVOICE ═══
function v4reManualInvHTML() {
  var sellable = v4products.filter(function(p){ return p.sellDirectly !== false; });
  var pOpts = sellable.map(function(p){
    return '<option value="' + p.id + '" data-price="' + p.price + '">' + sanitize(p.name) + ' (Stock: ' + p.stock + ')</option>';
  }).join('');
  return '<p style="font-size:12px;color:#64748b;margin-bottom:10px">Record a sale made outside the POS (wholesale, catering, special order) — stock is deducted automatically.</p>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Product</label>' +
    '<select class="v4-in" id="miProd">' + (pOpts || '<option value="">— no products —</option>') + '</select>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Quantity</label><input type="number" class="v4-in" id="miQty" value="1" min="1" oninput="v4reMICalc()"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Unit Price</label><input type="number" class="v4-in" id="miPrice" value="0" min="0" oninput="v4reMICalc()"></div>' +
    '</div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Payment</label>' +
    '<select class="v4-in" id="miPay"><option value="cash">💵 Cash</option><option value="card">💳 Card</option><option value="mobile">📱 Mobile</option><option value="credit">📝 Credit</option></select>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Note (optional)</label>' +
    '<input class="v4-in" id="miNote" placeholder="e.g., Wholesale bulk order">' +
    '<div id="miTotal" style="background:#ecfdf5;border-radius:10px;padding:12px;text-align:center;margin:10px 0;font-weight:800;color:#059669;font-size:16px">Total: Br 0.00</div>' +
    '<button class="v4-btn g" onclick="v4reMISave()">💾 Save Invoice &amp; Deduct Stock</button>';
}
function v4reMICalc() {
  var qty = parseFloat(document.getElementById('miQty').value) || 0;
  var price = parseFloat(document.getElementById('miPrice').value) || 0;
  document.getElementById('miTotal').textContent = 'Total: ' + fmtMoney(qty * price);
}
async function v4reMISave() {
  var prodId = document.getElementById('miProd').value;
  var qty = parseFloat(document.getElementById('miQty').value) || 0;
  var price = parseFloat(document.getElementById('miPrice').value) || 0;
  var pay = document.getElementById('miPay').value;
  var note = document.getElementById('miNote').value.trim();
  if (!prodId || qty <= 0 || price <= 0) { alert('Fill product, quantity and price.'); return; }
  var p = v4products.find(function(x){ return x.id === prodId; });
  if (!p) return;
  if (!p.isVirtual && qty > (p.stock||0)) {
    if (!await confirm('Warning: Stock is low (' + p.stock + '). Proceed anyway?')) return;
  }
  var total = qty * price;
  var profit = (price - (p.costPrice||0)) * qty;
  var invoiceNo = 'INV-' + Date.now().toString().slice(-8);
  if (!await confirm('Save manual invoice?\n\n' + p.name + ' × ' + qty + ' = ' + fmtMoney(total))) return;
  try {
    await supabaseClient.from('sales').insert([{
      items: [{ productId: prodId, name: p.name, qty: qty, price: price, subtotal: total }],
      subtotal: total, discount: 0, tax: 0, total: total, profit: profit,
      payment_method: pay, payments: [{ method: pay, amount: total }],
      shop_id: getShopId(), cashier_id: 'admin_manual', cashier_name: 'Admin',
      shift_id: 'manual', time: new Date().toISOString(),
      note: note || 'Manual Invoice', invoice_no: invoiceNo, order_type: 'Manual'
    }]);
    if (!p.isVirtual) {
      const { error } = await v4ById(supabaseClient.from('products').update({ stock: (p.stock||0) - qty }), prodId);
      if (error) throw error;
      p.stock = (p.stock||0) - qty;
    }
    v4reCloseModal();
    alert('✅ Manual invoice saved & stock updated! ' + fmtMoney(total));
    if (typeof v4LoadProducts === 'function') v4LoadProducts();
  } catch(e) { alert('❌ ' + e.message); }
}

// ── modal opener ──
function v4reOpen(tool) {
  var titles = { pnl:'📈 P&L Statement', zreport:'🧾 Z-Report (End of Day)', tax:'🏛️ Tax Liability',
    erca:'📜 ERCA Government Report', crm:'👥 Customer CRM', marketing:'📣 Win Back Customers',
    menueng:'🍕 Menu Engineering', audit:'🛡️ Security Audit Log', timesheet:'⏰ Staff Timesheets',
    valuation:'📦 Inventory Valuation', manualinv:'✍️ Manual Invoice' };
  v4reModal(titles[tool] || 'Report', true);
  v4reFillBody(tool);
}

// ── tab loader ──
V4_TAB_LOADERS[8] = function() {
  v4reEnsureUI();
  v4reHealth();
};
