// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — STAFF & PAYROLL v3 (Step 9) · UI-3
//  v3: EVERY bracket bound editable (From AND To, all rows)
//  · 3-column scale [[from,to,rate]] with auto-migration ·
//  live salary tester · add/delete brackets freely.
//  v2 kept: bank account · pay-day modes + next-pay dates ·
//  login block · optional tax/pension ON-OFF · customs ·
//  payslip WhatsApp · analytics · LAW: salary→Expenses.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4stf = { data:[], ledger:[], period:'month' };

// ═══ RULES STORAGE (all editable, all optional) ═══
// Format: [[from, to, rate%], ...] — EVERY value user-editable.
// Old 2-column saves auto-migrate. To=99999999 means "and above".
function v4stfTaxTable() {
  try {
    var t = JSON.parse(localStorage.getItem('v4stfTax_' + getShopId()));
    if (t && t.length) {
      if (t[0].length === 2) {                     // 🔁 old [[to,rate]] → new [[from,to,rate]]
        var prev = 0, nt = [];
        t.forEach(function(b){ nt.push([prev + 1, b[0], b[1]]); prev = b[0]; });
        v4stfTaxTableSet(nt);
        return nt;
      }
      return t;
    }
  } catch(e) {}
  return [[1,600,0],[601,1659,10],[1660,3199,15],[3200,5279,20],[5280,7799,25],[7800,10899,30],[10900,99999999,35]];
}
function v4stfTaxTableSet(t) { localStorage.setItem('v4stfTax_' + getShopId(), JSON.stringify(t)); }
function v4stfTaxOn()   { return localStorage.getItem('v4stfTaxOn_' + getShopId()) !== '0'; }
function v4stfTaxOnSet(v){ localStorage.setItem('v4stfTaxOn_' + getShopId(), v ? '1' : '0'); }
function v4stfPenOn()   { return localStorage.getItem('v4stfPenOn_' + getShopId()) !== '0'; }
function v4stfPenOnSet(v){ localStorage.setItem('v4stfPenOn_' + getShopId(), v ? '1' : '0'); }
function v4stfPensionRate() { return parseFloat(localStorage.getItem('v4stfPen_' + getShopId()) || '7'); }
function v4stfPensionEmployer() { return parseFloat(localStorage.getItem('v4stfPenE_' + getShopId()) || '11'); }
function v4stfTax(income) {
  if (!v4stfTaxOn()) return 0;                    // 🏛️ optional — private institutions
  var t = v4stfTaxTable(), tax = 0;
  for (var i = 0; i < t.length; i++) {
    var from = Number(t[i][0]), to = Number(t[i][1]), rate = Number(t[i][2]) || 0;
    if (income > to) tax += (to - from + 1) * rate / 100;          // whole bracket applies
    else if (income >= from) { tax += (income - from + 1) * rate / 100; break; }  // partial
    else break;                                                    // below this bracket
  }
  return Math.round(tax * 100) / 100;
}
function v4stfPension(income) {
  if (!v4stfPenOn()) return 0;
  return Math.round(income * v4stfPensionRate()) / 100;
}

// custom recurring deductions per employee: [{name, amount}]
function v4stfDedGet(id) { try { return JSON.parse(localStorage.getItem('v4stfDed_' + getShopId() + '_' + id) || '[]'); } catch(e) { return []; } }
function v4stfDedSet(id, list) { localStorage.setItem('v4stfDed_' + getShopId() + '_' + id, JSON.stringify(list)); }
function v4stfPaysGet() { try { return JSON.parse(localStorage.getItem('v4stfPays_' + getShopId()) || '[]'); } catch(e) { return []; } }
function v4stfPaysPush(p) { var l = v4stfPaysGet(); l.push(p); localStorage.setItem('v4stfPays_' + getShopId(), JSON.stringify(l)); }

// ═══ LEDGER ENGINE (pay-day modes honored) ═══
function v4stfDateStr(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
async function v4stfLedgerLoad(force) {
  if (v4stf.ledger.length && !force) return v4stf.ledger;
  const { data, error } = await supabaseClient.from('salary_ledger')
    .select('*').eq('shop_id', getShopId()).order('created_at', { ascending: true });
  if (error) { console.warn('Ledger load:', error.message); return []; }
  v4stf.ledger = data || [];
  return v4stf.ledger;
}
function v4stfLedgerFor(id) { return v4stf.ledger.filter(function(l){ return l.employee_id === id; }); }
function v4stfBalance(id) {
  var bal = 0;
  v4stfLedgerFor(id).forEach(function(e){ bal += Number(e.amount); });
  return Math.round(bal * 100) / 100;
}
async function v4stfSyncEarnings(emp) {
  await v4stfLedgerLoad();
  var entries = v4stfLedgerFor(emp.id), lastEnd = null;
  entries.forEach(function(e){ if (e.entry_type === 'earned' && e.period_end && (!lastEnd || e.period_end > lastEnd)) lastEnd = e.period_end; });
  var agr = emp.paymentAgreement || 'monthly', sch = emp.paySchedule || 'end';
  var today = new Date(); today.setHours(0,0,0,0);
  var toInsert = [];
  if (agr === 'daily') {
    var cur = new Date(emp.startDate ? new Date(emp.startDate) : new Date()); cur.setHours(0,0,0,0);
    if (lastEnd) { cur = new Date(lastEnd + 'T00:00:00'); cur.setDate(cur.getDate() + 1); }
    while (cur <= today) { toInsert.push({ employee_id: emp.id, entry_type:'earned', period_start: v4stfDateStr(cur), period_end: v4stfDateStr(cur), amount: emp.salary || 0 }); cur.setDate(cur.getDate() + 1); }
  } else if (agr === 'weekly') {
    var c = new Date(emp.startDate ? new Date(emp.startDate) : new Date()); c.setHours(0,0,0,0);
    if (lastEnd) { c = new Date(lastEnd + 'T00:00:00'); c.setDate(c.getDate() + 1); }
    while (true) {
      var pe;
      if (sch === 'end') { pe = new Date(c); var dow = pe.getDay(); pe.setDate(pe.getDate() + (6 - dow)); }
      else { pe = new Date(c); pe.setDate(pe.getDate() + 6); }
      if (pe > today) break;
      toInsert.push({ employee_id: emp.id, entry_type:'earned', period_start: v4stfDateStr(c), period_end: v4stfDateStr(pe), amount: emp.salary || 0 });
      c = new Date(pe); c.setDate(c.getDate() + 1);
    }
  } else {
    var m = new Date(emp.startDate ? new Date(emp.startDate) : new Date()); m.setHours(0,0,0,0);
    if (lastEnd) { m = new Date(lastEnd + 'T00:00:00'); m.setDate(m.getDate() + 1); }
    while (true) {
      var pEnd;
      if (sch === 'end') pEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
      else { pEnd = new Date(m); pEnd.setMonth(pEnd.getMonth() + 1); pEnd.setDate(pEnd.getDate() - 1); }
      if (pEnd > today) break;
      var amount = emp.salary || 0;
      if (sch === 'end') {
        var dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
        var days = Math.floor((pEnd - m) / 86400000) + 1;
        if (days < dim) amount = Math.round(((emp.salary || 0) * days / dim) * 100) / 100;
      }
      toInsert.push({ employee_id: emp.id, entry_type:'earned', period_start: v4stfDateStr(m), period_end: v4stfDateStr(pEnd), amount: amount });
      m = new Date(pEnd); m.setDate(m.getDate() + 1);
    }
  }
  if (toInsert.length) {
    const { error } = await supabaseClient.from('salary_ledger').insert(
      toInsert.map(function(t){ return Object.assign({ shop_id: getShopId(), created_by:'auto', created_at: new Date().toISOString() }, t); })
    );
    if (!error) v4stf.ledger = v4stf.ledger.concat(toInsert);
  }
  return toInsert.length;
}
async function v4stfSyncAll() {
  await v4stfLedgerLoad(true);
  for (var i = 0; i < v4stf.data.length; i++) {
    if (v4stf.data[i].status === 'active') await v4stfSyncEarnings(v4stf.data[i]);
  }
}

// ═══ NEXT PAYDAY ═══
function v4stfNextPayday(emp) {
  var agr = emp.paymentAgreement || 'monthly', sch = emp.paySchedule || 'end';
  var today = new Date(); today.setHours(0,0,0,0);
  if (agr === 'daily') return { date: v4stfDateStr(today), label: 'Daily — today' };
  if (agr === 'weekly') {
    if (sch === 'completion' && emp.startDate) {
      var s = new Date(emp.startDate); s.setHours(0,0,0,0);
      var n = new Date(s);
      while (n <= today) n.setDate(n.getDate() + 7);
      return { date: v4stfDateStr(n), label: 'Every 7 days from hire' };
    }
    var d = new Date(today); var dow = d.getDay(); d.setDate(d.getDate() + (6 - dow));
    return { date: v4stfDateStr(d), label: dow === 6 ? 'Saturday (today!)' : 'Saturday (week end)' };
  }
  if (sch === 'completion' && emp.startDate) {
    var st = new Date(emp.startDate); st.setHours(0,0,0,0);
    var a = new Date(st);
    while (a <= today) a.setMonth(a.getMonth() + 1);
    return { date: v4stfDateStr(a), label: 'Hire-date anniversary' };
  }
  var eom = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { date: v4stfDateStr(eom), label: today.getDate() === eom.getDate() ? 'End of month (TODAY!)' : 'End of month (' + eom.getDate() + 'th)' };
}

// ═══ DATA ═══
async function v4stfLoad() {
  try {
    const { data, error } = await supabaseClient.from('employees').select('*').eq('shop_id', getShopId());
    if (error) throw error;
    v4stf.data = (data || []).map(function(e){
      return { id: e.firebase_id || e.id, name: e.name, position: e.position || 'Cashier',
        salary: Number(e.salary||0), status: e.status || 'active',
        paymentAgreement: e.payment_agreement || 'monthly', paySchedule: e.pay_schedule || 'end',
        tip: Number(e.tip||0), bonus: Number(e.bonus||0), penalty: Number(e.penalty||0), overtime: Number(e.overtime||0),
        phone: e.phone || '', address: e.address || '', startDate: e.start_date || '',
        accountNo: e.account_no || '', pinLocked: !!e.pin_locked, lastPaid: e.last_paid || '' };
    }).sort(function(a,b){ return a.name.localeCompare(b.name); });
  } catch(e) { console.warn('Staff load:', e.message); v4stf.data = []; }
  return v4stf.data;
}
async function v4stfRefresh(){ await v4stfLoad(); await v4stfSyncAll(); v4stfRender(); }
function v4stfPositions() {
  var biz = (window.__currentShopRow && window.__currentShopRow.business_type) || 'retail';
  if (biz === 'hotel') return ['Reception','Waiter','Chef','Cashier','Manager','Owner','Cleaner','Guard','Laborer','Other'];
  return ['Cashier','Waiter','Chef','Manager','Owner','Guard','Cleaner','Laborer','Other'];
}

// ═══ PAYSLIP ENGINE ═══
function v4stfPayslip(emp, extras, dedList) {
  var gross = v4stfBalance(emp.id);
  extras.forEach(function(x){ gross += x.amount; });
  var tax = v4stfTax(gross);
  var pension = v4stfPension(gross);
  var custom = dedList || v4stfDedGet(emp.id);
  var customTotal = custom.reduce(function(s,d){ return s + d.amount; }, 0);
  var net = Math.round((gross - tax - pension - customTotal) * 100) / 100;
  return { gross: gross, extras: extras, tax: tax, pension: pension,
    custom: custom, customTotal: customTotal, net: net,
    employerPension: v4stfPenOn() ? Math.round(gross * v4stfPensionEmployer()) / 100 : 0 };
}

// ═══ UI ═══
function v4stfEnsureUI() {
  var tab = document.getElementById('tab6');
  if (!tab || tab.dataset.stfBuilt === '1') return;
  tab.dataset.stfBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4stfH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4stfH b{font-size:13px;display:block;word-break:break-word;line-height:1.25;}' +
    '.v4stfH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4stfH small{color:#94a3b8;}' +
    '.v4stfBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4stfBtn:active{transform:scale(.97);}' +
    '.v4stfBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4stfBtnTx{flex:1;min-width:0;}' +
    '.v4stfBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4stfBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4stfBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '</style>' +
    '<div class="card" style="padding:12px" id="v4stfHealth"></div>' +
    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">' +
        '<button class="v4stfBtn" style="background:linear-gradient(135deg,#059669,#34d399)" onclick="v4stfRegister()"><span class="v4stfBtnIc">➕</span><span class="v4stfBtnTx"><b>Register Staff</b><small>Team member, salary, PIN, bank account</small></span><span class="v4stfBtnGo">›</span></button>' +
        '<button class="v4stfBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)" onclick="v4stfOpen(\'analytics\')"><span class="v4stfBtnIc">📊</span><span class="v4stfBtnTx"><b>Payroll Analytics</b><small>Cost, tax, pension — period switcher</small></span><span class="v4stfBtnGo">›</span></button>' +
        '<button class="v4stfBtn" style="background:linear-gradient(135deg,#0d64f0,#60a5fa)" onclick="v4stfOpen(\'rules\')"><span class="v4stfBtnIc">🏛️</span><span class="v4stfBtnTx"><b>Deduction Rules</b><small>Optional · fully editable scale & rates</small></span><span class="v4stfBtnGo">›</span></button>' +
        '<button class="v4stfBtn" style="background:linear-gradient(135deg,#f59e0b,#fbbf24)" onclick="v4stfOpen(\'alerts\')"><span class="v4stfBtnIc">🔔</span><span class="v4stfBtnTx"><b>Salary Alerts</b><small>Who is owed + next pay dates</small></span><span class="v4stfBtnGo">›</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">👥 Staff <span class="v4-badge" id="v4stfCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip active" id="v4stfvExcel" onclick="v4stfView(\'excel\')">📊 Excel</button>' +
          '<button class="v4-chip" id="v4stfvList" onclick="v4stfView(\'list\')">📋 List</button>' +
          '<button class="v4-chip" id="v4stfvGrid" onclick="v4stfView(\'grid\')">⊞ Grid</button>' +
          '<button class="v4-chip" onclick="v4stfRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<input class="v4-in" id="v4stfSearch" placeholder="🔍 Name or position…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4stfSearchInput(this.value)">' +
      '<div id="v4stfExcel"></div>' +
      '<div id="v4stfList" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
      '<div id="v4stfGrid" style="display:none;max-height:60vh;overflow-y:auto"></div>' +
    '</div>';
}

function v4stfHealth() {
  var el = document.getElementById('v4stfHealth'); if (!el) return;
  var active = v4stf.data.filter(function(e){ return e.status === 'active'; });
  var owed = 0, owedCount = 0;
  active.forEach(function(e){ var b = v4stfBalance(e.id); if (b > 0) { owed += b; owedCount++; } });
  var pays = v4stfPaysGet();
  var today = new Date().toISOString().slice(0,10);
  var mNet = 0, mTax = 0, mPen = 0;
  pays.forEach(function(p){
    if (String(p.date).slice(0,7) === today.slice(0,7)) { mNet += p.actualPaid; mTax += p.tax; mPen += p.pension; }
  });
  function H(v,l,c){ return '<div class="v4stfH"><b style="color:' + c + '">' + v + '</b><small>' + l + '</small></div>'; }
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    H(active.length, '👥 ACTIVE STAFF', '#3b82f6') +
    H(fmtMoney(owed), '💰 OWED (' + owedCount + ')', owed > 0 ? '#ef4444' : '#10b981') +
    H(fmtMoney(mNet), '💸 NET PAID (MO)', '#059669') +
    H(fmtMoney(mTax + mPen), '🏛️ WITHHELD (MO)', '#f59e0b') +
    '</div>' +
    ((mTax + mPen) > 0 ? '<div style="text-align:center;margin-top:8px;font-size:11px;color:#64748b">🏛️ ' + fmtMoney(mTax) + ' tax + ' + fmtMoney(mPen) + ' pension withheld this month — payable to government</div>' : '');
}

function v4stfModal(title) {
  v4stfCloseModal();
  var m = document.createElement('div');
  m.id = 'v4stfToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:560px;margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4stfCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4stfToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4stfCloseModal(); });
}
function v4stfCloseModal() { var m = document.getElementById('v4stfToolModal'); if (m) m.remove(); }

// ═══ REGISTER ═══
function v4stfRegister() {
  v4stfModal('➕ Register Staff');
  var posOpts = v4stfPositions().map(function(p){ return '<option>' + p + '</option>'; }).join('');
  document.getElementById('v4stfToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Full Name *</label>' +
    '<input class="v4-in" id="v4stfRName" placeholder="e.g., Abebe Kebede">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Position</label><select class="v4-in" id="v4stfRPos">' + posOpts + '</select></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Salary (Br) *</label><input type="number" class="v4-in" id="v4stfRSal" placeholder="0"></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Pay Period</label><select class="v4-in" id="v4stfRAgr"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="daily">Daily</option></select></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Pay Day Mode</label><select class="v4-in" id="v4stfRMode">' +
      '<option value="end">📅 End of month/week (e.g., 30th)</option>' +
      '<option value="completion">📅 From hire date (anniversary)</option>' +
    '</select></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Start Date</label><input type="date" class="v4-in" id="v4stfRStart"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Bank Account (optional)</label><input class="v4-in" id="v4stfRAcct" placeholder="Account number"></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone</label><input class="v4-in" id="v4stfRPhone" placeholder="Phone"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Login PIN (4 digits)</label><input class="v4-in" id="v4stfRPin" maxlength="4" placeholder="e.g., 1234"></div>' +
    '</div>' +
    '<label style="display:flex;align-items:center;gap:8px;margin:6px 0;font-size:12px;cursor:pointer"><input type="checkbox" id="v4stfRLock"> 🔒 Lock PIN (staff cannot change it themselves)</label>' +
    '<button class="v4-btn g" onclick="v4stfRegisterSave()">✅ Register</button>';
}
async function v4stfRegisterSave() {
  var name = document.getElementById('v4stfRName').value.trim();
  var salary = parseFloat(document.getElementById('v4stfRSal').value) || 0;
  if (!name) { alert('Name is required.'); return; }
  if (salary <= 0) { alert('Salary is required.'); return; }
  if (typeof ssCanAddStaff === 'function' && !ssCanAddStaff(v4stf.data.length)) {
    alert('⚠️ Staff limit reached for your plan.\nUpgrade: License tab.'); return;
  }
  if (v4stf.data.some(function(e){ return e.name.toLowerCase() === name.toLowerCase(); })) { alert('⚠️ An employee with this name already exists.'); return; }
  var pin = document.getElementById('v4stfRPin').value.trim();
  var hashedPin = null, pinSalt = null;
  if (pin) { pinSalt = ssRandomSalt(); hashedPin = await ssHashPin(pin, pinSalt); }
  var empId = 'emp_' + Date.now();
  try {
    const { error } = await supabaseClient.from('employees').insert([{
      firebase_id: empId, shop_id: getShopId(), name: name,
      position: document.getElementById('v4stfRPos').value,
      salary: salary,
      payment_agreement: document.getElementById('v4stfRAgr').value,
      pay_schedule: document.getElementById('v4stfRMode').value,
      phone: document.getElementById('v4stfRPhone').value.trim(),
      account_no: document.getElementById('v4stfRAcct').value.trim(),
      start_date: document.getElementById('v4stfRStart').value || null,
      status: 'active', hashed_password: hashedPin, pin_salt: pinSalt,
      pin_locked: document.getElementById('v4stfRLock').checked
    }]);
    if (error) throw error;
    v4stfCloseModal();
    await v4stfRefresh();
    alert('✅ ' + name + ' registered!' + (pin ? '\n🔑 PIN set — they can now log in to POS/Kitchen/Hotel.' : ''));
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ PAY DIALOG ═══
async function v4stfPay(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!emp) return;
  await v4stfSyncEarnings(emp);
  await v4stfLedgerLoad();
  var extras = [];
  if (emp.tip) extras.push({ name:'Tips', amount: emp.tip });
  if (emp.bonus) extras.push({ name:'Bonus', amount: emp.bonus });
  if (emp.overtime) extras.push({ name:'Overtime', amount: emp.overtime });
  var slip = v4stfPayslip(emp, extras, null);
  v4stfModal('💰 Pay Salary — ' + sanitize(emp.name));
  window._v4stfPay = { emp: emp, slip: slip };
  var html =
    '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:10px;font-size:13px">' +
    '<b>👤 ' + sanitize(emp.name) + '</b> · ' + emp.position + '<br>' +
    '<small style="color:#64748b">' + (emp.paymentAgreement||'monthly') + ' · salary ' + fmtMoney(emp.salary) + (emp.accountNo ? ' · 🏦 ' + sanitize(emp.accountNo) : '') + '</small></div>' +
    '<b style="font-size:12px">🧾 PAYSLIP</b>' +
    '<div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin:6px 0;font-size:13px">' +
    '<div style="display:flex;justify-content:space-between"><span>Base earned (ledger)</span><b>' + fmtMoney(v4stfBalance(emp.id) - extras.reduce(function(s,x){return s+x.amount;},0)) + '</b></div>';
  extras.forEach(function(x){
    html += '<div style="display:flex;justify-content:space-between"><span>+ ' + sanitize(x.name) + '</span><b>' + fmtMoney(x.amount) + '</b></div>';
  });
  html += '<div style="display:flex;justify-content:space-between;border-top:1px dashed #cbd5e1;margin-top:6px;padding-top:6px"><span><b>GROSS</b></span><b>' + fmtMoney(slip.gross) + '</b></div>';
  if (v4stfTaxOn()) html += '<div style="display:flex;justify-content:space-between;color:#dc2626"><span>- Income tax (your scale)</span><b>-' + fmtMoney(slip.tax) + '</b></div>';
  if (v4stfPenOn()) html += '<div style="display:flex;justify-content:space-between;color:#dc2626"><span>- Pension (' + v4stfPensionRate() + '%)</span><b>-' + fmtMoney(slip.pension) + '</b></div>';
  slip.custom.forEach(function(d){
    html += '<div style="display:flex;justify-content:space-between;color:#dc2626"><span>- ' + sanitize(d.name) + '</span><b>-' + fmtMoney(d.amount) + '</b></div>';
  });
  if (!v4stfTaxOn() && !v4stfPenOn() && !slip.custom.length) {
    html += '<div style="text-align:center;font-size:11px;color:#64748b;margin-top:4px">ℹ️ No deductions — private setup (switch in Deduction Rules)</div>';
  }
  html += '<div style="display:flex;justify-content:space-between;font-size:16px;border-top:2px solid #e2e8f0;margin-top:6px;padding-top:6px"><span><b>NET PAYABLE</b></span><b style="color:#059669">' + fmtMoney(slip.net) + '</b></div></div>';
  if (slip.employerPension > 0) {
    html += '<p style="font-size:10px;color:#64748b;text-align:center;margin:4px 0 8px">Employer adds ' + v4stfPensionEmployer() + '% pension (' + fmtMoney(slip.employerPension) + ') — your true cost: ' + fmtMoney(slip.gross + slip.employerPension) + '</p>';
  }
  html += '<label style="font-size:11px;font-weight:800;color:#475569">Extra allowance now (optional, Br)</label>' +
    '<input type="number" class="v4-in" id="v4stfPayExtra" value="0" min="0" oninput="v4stfPayRecalc()">' +
    '<div id="v4stfPayRecalcBox" style="background:rgba(5,150,105,.12);border-radius:10px;padding:10px;text-align:center;margin:8px 0;font-weight:800;color:#059669">Pay: ' + fmtMoney(slip.net) + '</div>' +
    '<button class="v4-btn g" onclick="v4stfPaySave()">💰 Pay Now & Record</button>' +
    '<button class="v4-btn p" style="margin-top:6px" onclick="v4stfPayslipShare()">📤 Send Payslip (WhatsApp)</button>';
  document.getElementById('v4stfToolBody').innerHTML = html;
}
function v4stfPayRecalc() {
  var p = window._v4stfPay; if (!p) return;
  var extra = parseFloat(document.getElementById('v4stfPayExtra').value) || 0;
  var extras = p.slip.extras.slice();
  if (extra > 0) extras.push({ name:'Allowance', amount: extra });
  p.slip = v4stfPayslip(p.emp, extras, null);
  var box = document.getElementById('v4stfPayRecalcBox');
  if (box) box.textContent = 'Pay: ' + fmtMoney(p.slip.net);
}
async function v4stfPaySave() {
  var p = window._v4stfPay; if (!p) return;
  var emp = p.emp, slip = p.slip;
  var net = slip.net;
  if (!await confirm('Pay ' + emp.name + '?\n\nGross: ' + fmtMoney(slip.gross) +
      '\nDeductions: ' + fmtMoney(slip.tax + slip.pension + slip.customTotal) +
      '\nNET PAID: ' + fmtMoney(net) +
      '\n\n✅ Recorded under Expenses → Salaries & Wages')) return;
  try {
    const { data: expData, error: expErr } = await supabaseClient.from('expenses').insert([{
      type: 'salary', employee_id: emp.id, name: 'Salary: ' + emp.name,
      amount: net, date: new Date().toISOString().slice(0,10), shop_id: getShopId(),
      category: 'Salaries & Wages' }]).select('id').single();
    if (expErr) throw expErr;
    const { error: lErr } = await supabaseClient.from('salary_ledger').insert([{
      shop_id: getShopId(), employee_id: emp.id, entry_type: 'paid',
      amount: -slip.gross, note: 'Salary payment (net ' + fmtMoney(net) + ')',
      created_by: 'Admin', ref_expense_id: expData.id, created_at: new Date().toISOString() }]);
    if (lErr) throw lErr;
    await v4ById(supabaseClient.from('employees').update({ last_paid: new Date().toISOString() }), emp.id);
    emp.lastPaid = new Date().toISOString();
    v4stfPaysPush({ empId: emp.id, name: emp.name, date: new Date().toISOString(),
      gross: slip.gross, tax: slip.tax, pension: slip.pension,
      custom: slip.custom, extras: slip.extras, net: net, actualPaid: net });
    v4stfCloseModal();
    await v4stfRefresh();
    alert('✅ ' + emp.name + ' paid ' + fmtMoney(net) + ' (net).' + ((slip.tax + slip.pension + slip.customTotal) > 0 ? '\n🏛️ Withheld: ' + fmtMoney(slip.tax + slip.pension + slip.customTotal) + ' — see Analytics.' : ''));
  } catch(e) { alert('❌ ' + e.message); }
}
function v4stfPayslipShare() {
  var p = window._v4stfPay; if (!p) return;
  var emp = p.emp, s = p.slip;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = '🧾 PAYSLIP — ' + shop + '\n👤 ' + emp.name + ' · ' + new Date().toLocaleDateString() + '\n\n' +
    'Gross: ' + fmtMoney(s.gross) + '\n';
  if (v4stfTaxOn()) msg += '- Income tax: ' + fmtMoney(s.tax) + '\n';
  if (v4stfPenOn()) msg += '- Pension (' + v4stfPensionRate() + '%): ' + fmtMoney(s.pension) + '\n';
  s.custom.forEach(function(d){ msg += '- ' + d.name + ': ' + fmtMoney(d.amount) + '\n'; });
  msg += 'NET PAY: ' + fmtMoney(s.net) + '\n\n— ' + shop;
  var phone = prompt('Send payslip to which WhatsApp number?\n(Leave empty to copy)', emp.phone || '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Payslip copied!'); });
}

// ═══ ADVANCE ═══
async function v4stfAdvance(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!emp) return;
  await v4stfSyncEarnings(emp);
  var bal = v4stfBalance(id);
  var maxAdv = Math.max(0, (emp.salary||0) - bal);
  var amt = parseFloat(await prompt('➖ Salary Advance — ' + emp.name + '\n\nOwed now: ' + fmtMoney(bal) + '\nMax advance (1 month salary limit): ' + fmtMoney(maxAdv) + '\n\nAmount:', ''));
  if (isNaN(amt) || amt <= 0) return;
  if (amt + bal > (emp.salary||0)) { alert('❌ Over limit.\nAdvance + balance cannot exceed 1 month salary (' + fmtMoney(emp.salary) + ').'); return; }
  var note = await prompt('Note (optional):', 'Advance') || 'Advance';
  try {
    const { data: expData, error: expErr } = await supabaseClient.from('expenses').insert([{
      type: 'salary', employee_id: id, name: 'Advance: ' + emp.name,
      amount: amt, date: new Date().toISOString().slice(0,10), shop_id: getShopId(),
      category: 'Salaries & Wages' }]).select('id').single();
    if (expErr) throw expErr;
    const { error } = await supabaseClient.from('salary_ledger').insert([{
      shop_id: getShopId(), employee_id: id, entry_type: 'advance',
      amount: -amt, note: note, created_by: 'Admin',
      ref_expense_id: expData.id, created_at: new Date().toISOString() }]);
    if (error) throw error;
    await v4stfRefresh();
    alert('✅ Advance of ' + fmtMoney(amt) + ' recorded (also in Expenses).');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ LEDGER VIEW ═══
async function v4stfLedgerView(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!emp) return;
  await v4stfSyncEarnings(emp);
  var entries = v4stfLedgerFor(id);
  v4stfModal('📖 Salary Ledger — ' + sanitize(emp.name));
  var earned = 0, paid = 0;
  entries.forEach(function(e){ if (e.entry_type === 'earned') earned += Number(e.amount); else paid += Math.abs(Number(e.amount)); });
  var bal = v4stfBalance(id);
  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;text-align:center">' +
    '<div style="background:rgba(16,185,129,.12);border-radius:10px;padding:8px"><b style="color:#059669;font-size:14px;display:block">' + fmtMoney(earned) + '</b><small style="font-size:9px;font-weight:800;color:#64748b">EARNED</small></div>' +
    '<div style="background:rgba(37,99,235,.12);border-radius:10px;padding:8px"><b style="color:#2563eb;font-size:14px;display:block">' + fmtMoney(paid) + '</b><small style="font-size:9px;font-weight:800;color:#64748b">PAID+ADV</small></div>' +
    '<div style="background:rgba(234,88,12,.12);border-radius:10px;padding:8px"><b style="color:#ea580c;font-size:14px;display:block">' + fmtMoney(bal) + '</b><small style="font-size:9px;font-weight:800;color:#64748b">BALANCE OWED</small></div></div>' +
    '<p style="font-size:11px;color:#64748b;text-align:center;margin-bottom:8px">' + v4stfNextPayday(emp).label + ' — next: ' + formatDate(v4stfNextPayday(emp).date) + '</p>';
  if (!entries.length) html += '<p style="text-align:center;color:#94a3b8;padding:16px">No entries yet.</p>';
  entries.slice().reverse().forEach(function(e){
    var icon = e.entry_type === 'earned' ? '📈' : (e.entry_type === 'advance' ? '➖' : (e.entry_type === 'adjust' ? '⚖️' : '💵'));
    var col = Number(e.amount) >= 0 ? '#059669' : '#2563eb';
    var period = e.period_start ? (String(e.period_start).slice(5,10).replace('-','/') + '→' + String(e.period_end).slice(5,10).replace('-','/')) : '—';
    html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
      '<span>' + icon + ' ' + (new Date(e.created_at).toLocaleDateString()) + ' <small style="color:#94a3b8">' + period + '</small></span>' +
      '<b style="color:' + col + '">' + (Number(e.amount) >= 0 ? '+' : '') + fmtMoney(e.amount) + '</b></div>';
  });
  document.getElementById('v4stfToolBody').innerHTML = html;
}

// ═══ ALERTS ═══
function v4stfAlertsHTML() {
  var active = v4stf.data.filter(function(e){ return e.status === 'active'; });
  var owed = active.filter(function(e){ return v4stfBalance(e.id) > 0; })
    .sort(function(a,b){ return v4stfBalance(b.id) - v4stfBalance(a.id); });
  var html = '';
  if (owed.length) {
    html += '<b style="font-size:13px;color:#ef4444">💰 Owed right now (' + owed.length + ')</b>';
    owed.forEach(function(e){
      var np = v4stfNextPayday(e);
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #f1f5f9">' +
        '<span>⚠️ <b>' + sanitize(e.name) + '</b><br><small style="color:#64748b">' + e.position + ' · ' + np.label + ' — next payday: <b style="color:#2563eb">' + formatDate(np.date) + '</b></small></span>' +
        '<span style="text-align:right"><b style="color:#ef4444">' + fmtMoney(v4stfBalance(e.id)) + '</b><br>' +
        '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4stfPay(\'' + e.id + '\')">💰 Pay</button></span></div>';
    });
  } else {
    html += '<p style="text-align:center;padding:16px;font-weight:800;color:#10b981;font-size:15px">✅ All salaries settled!</p>';
  }
  var upcoming = active.filter(function(e){ return v4stfBalance(e.id) <= 0; })
    .map(function(e){ return { e:e, np:v4stfNextPayday(e) }; })
    .sort(function(a,b){ return a.np.date < b.np.date ? -1 : 1; });
  if (upcoming.length) {
    html += '<div style="height:10px"></div><b style="font-size:13px;color:#2563eb">📅 Upcoming paydays</b>';
    upcoming.forEach(function(x){
      html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>👤 ' + sanitize(x.e.name) + ' <small style="color:#94a3b8">' + x.np.label + '</small></span>' +
        '<b style="color:#2563eb">' + formatDate(x.np.date) + '</b></div>';
    });
  }
  return html;
}

// ═══ ANALYTICS ═══
function v4stfPeriodChips() {
  var P = { month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' + Object.keys(P).map(function(p){
    return '<button class="v4PChip' + (v4stf.period === p ? ' active' : '') + '" onclick="v4stfSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
  }).join('') + '</div>';
}
function v4stfSetPeriod(p) {
  v4stf.period = p;
  var chips = document.querySelector('#v4stfToolModal .v4PChips');
  if (chips) chips.outerHTML = v4stfPeriodChips();
  var body = document.getElementById('v4stfAnalyticsBody');
  if (body) body.innerHTML = v4stfAnalyticsHTML();
}
function v4stfAnalyticsHTML() {
  var pays = v4stfPaysGet().filter(function(p){
    if (v4stf.period === 'month') return String(p.date).slice(0,7) === new Date().toISOString().slice(0,7);
    if (v4stf.period === 'year') return String(p.date).slice(0,4) === String(new Date().getFullYear());
    return true;
  });
  var gross = 0, net = 0, tax = 0, pen = 0, empPen = 0;
  var byEmp = {}, byExtra = {};
  pays.forEach(function(p){
    gross += p.gross; net += p.actualPaid; tax += p.tax; pen += p.pension;
    if (v4stfPenOn()) empPen += Math.round(p.gross * v4stfPensionEmployer()) / 100;
    if (!byEmp[p.name]) byEmp[p.name] = { g:0, n:0, count:0 };
    byEmp[p.name].g += p.gross; byEmp[p.name].n += p.actualPaid; byEmp[p.name].count++;
    (p.extras || []).forEach(function(x){ byExtra[x.name] = (byExtra[x.name]||0) + x.amount; });
  });
  function big(v,l,c){ return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:12px 6px;text-align:center"><b style="font-size:16px;display:block;color:' + c + '">' + v + '</b><small style="font-size:9px;font-weight:800;color:#64748b">' + l + '</small></div>'; }
  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
    big(fmtMoney(gross), '💰 TOTAL GROSS', '#3b82f6') +
    big(fmtMoney(net), '💸 NET PAID OUT', '#059669') +
    big(fmtMoney(tax), '🏛️ INCOME TAX (PAYABLE)', '#dc2626') +
    big(fmtMoney(pen), '🏛️ PENSION EMPLOYEE (PAYABLE)', '#ea580c') +
    '</div>';
  if (!v4stfTaxOn() && !v4stfPenOn()) {
    html += '<p style="text-align:center;font-size:11px;color:#64748b;margin-top:6px">ℹ️ Deductions disabled for this institution — gross = net. (Switch in Deduction Rules.)</p>';
  }
  if (empPen > 0) {
    html += '<div style="background:rgba(124,58,237,.1);border-radius:12px;padding:10px;margin-top:8px;text-align:center;font-size:12px">' +
      '🏢 Employer pension (' + v4stfPensionEmployer() + '%): <b>' + fmtMoney(empPen) + '</b> — your true employment cost: <b>' + fmtMoney(gross + empPen) + '</b></div>';
  }
  var emps = Object.keys(byEmp).map(function(n){ return { n:n, v:byEmp[n] }; }).sort(function(a,b){ return b.v.g - a.v.g; });
  if (emps.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px">👤 Per employee</b>';
    emps.forEach(function(x){
      html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
        '<span>' + sanitize(x.n) + ' <small style="color:#94a3b8">×' + x.v.count + '</small></span>' +
        '<span><b>' + fmtMoney(x.v.n) + '</b> <small style="color:#64748b">net / ' + fmtMoney(x.v.g) + ' gross</small></span></div>';
    });
  }
  var extras = Object.keys(byExtra);
  if (extras.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px">🎁 Allowances paid</b>';
    extras.forEach(function(n){
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px"><span>' + sanitize(n) + '</span><b>' + fmtMoney(byExtra[n]) + '</b></div>';
    });
  }
  var months = {};
  v4stfPaysGet().forEach(function(p){ var k = String(p.date).slice(0,7); months[k] = (months[k]||0) + p.gross; });
  var keys = Object.keys(months).sort().slice(-6);
  if (keys.length > 1) {
    html += '<div style="height:8px"></div><b style="font-size:13px">📈 Salary cost — last months</b>';
    var mx = Math.max.apply(null, keys.map(function(k){ return months[k]; }));
    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:60px;margin-top:6px">';
    keys.forEach(function(k){
      var h = mx > 0 ? Math.max(4, Math.round(months[k]/mx*55)) : 4;
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="' + k + ': ' + fmtMoney(months[k]) + '">' +
        '<div style="width:100%;height:' + h + 'px;background:#7c3aed;border-radius:4px 4px 0 0"></div>' +
        '<small style="font-size:8px;color:#64748b">' + k.slice(5) + '</small></div>';
    });
    html += '</div>';
  }
  return html;
}

// ═══ DEDUCTION RULES — every bound editable + live tester ═══
function v4stfRulesHTML() {
  window._v4stfTaxRows = v4stfTaxTable().map(function(b){ return { from: Number(b[0]), to: Number(b[1]), r: Number(b[2]) }; });
  var html = '<b style="font-size:14px">🏛️ Deductions — optional per institution</b>' +
    '<p style="font-size:11px;color:#64748b">Private institution with no tax/pension? Switch them OFF — payslip becomes gross = net.</p>' +
    '<div style="display:flex;gap:6px;margin-bottom:10px">' +
    '<button class="v4-chip' + (v4stfTaxOn() ? ' active' : '') + '" style="flex:1" onclick="v4stfToggleTax()">' + (v4stfTaxOn() ? '🏛️ Income Tax: ON' : '🏛️ Income Tax: OFF') + '</button>' +
    '<button class="v4-chip' + (v4stfPenOn() ? ' active' : '') + '" style="flex:1" onclick="v4stfTogglePen()">' + (v4stfPenOn() ? '🏛️ Pension: ON' : '🏛️ Pension: OFF') + '</button>' +
    '</div>' +
    '<b style="font-size:13px">📋 Income Tax scale — every value editable</b>' +
    '<p style="font-size:11px;color:#64748b">Set each interval exactly as your law says — e.g. 1 → 2000, 2001 → 4000… Any country, any change, any number of rows.</p>' +
    '<div style="display:flex;gap:4px;font-size:9px;font-weight:800;color:#64748b;margin-bottom:3px">' +
    '<span style="flex:1">FROM (Br)</span><span style="width:12px"></span><span style="flex:1">TO (Br)</span><span style="flex:0.7">RATE</span><span style="width:30px"></span></div>' +
    '<div id="v4stfTaxRowsBox"></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    '<button class="v4-chip" onclick="v4stfTaxRowAdd()">➕ Add Bracket</button>' +
    '<button class="v4-chip" onclick="v4stfTaxSave()">💾 Save Scale</button>' +
    '<button class="v4-chip" onclick="v4stfTaxReset()">↩️ Reset Default</button>' +
    '</div>' +
    '<p style="font-size:10px;color:#94a3b8;margin-top:4px">Tip: last bracket To = 99999999 means "and above". Gaps between brackets are untaxed.</p>' +
    '<div style="height:12px"></div>' +
    '<b style="font-size:13px">🧮 Test your scale</b>' +
    '<input type="number" class="v4-in" id="v4stfTaxTest" placeholder="Type any salary to test…" oninput="v4stfTaxTestCalc()">' +
    '<div id="v4stfTaxTestBox" style="background:rgba(37,99,235,.1);border-radius:10px;padding:9px;text-align:center;font-size:12px;font-weight:700;color:#2563eb;margin-top:6px">—</div>' +
    '<div style="height:12px"></div>' +
    '<b style="font-size:13px">🏛️ Pension (%)</b>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Employee (from salary)</label><input type="number" class="v4-in" id="v4stfPenR" value="' + v4stfPensionRate() + '" min="0" max="100"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Employer (you add)</label><input type="number" class="v4-in" id="v4stfPenE" value="' + v4stfPensionEmployer() + '" min="0" max="100"></div>' +
    '</div>' +
    '<button class="v4-chip" onclick="v4stfPenSave()">💾 Save Pension Rates</button>' +
    '<div style="height:12px"></div>' +
    '<b style="font-size:13px">➖ Custom deductions</b>' +
    '<p style="font-size:11px;color:#64748b">Union dues, cost sharing, loans — set per employee in their ✏️ Edit dialog.</p>';
  return html;
}
function v4stfTaxRowsRender() {
  var box = document.getElementById('v4stfTaxRowsBox'); if (!box) return;
  var rows = window._v4stfTaxRows;
  var html = '';
  rows.forEach(function(row, i){
    html += '<div style="display:flex;gap:4px;align-items:center;margin-bottom:5px">' +
      '<input type="number" class="v4-in" style="flex:1;margin:0;padding:7px;font-size:13px" value="' + row.from + '" min="0" oninput="window._v4stfTaxRows[' + i + '].from=parseFloat(this.value)||0">' +
      '<span style="font-size:12px;color:#94a3b8">→</span>' +
      '<input type="number" class="v4-in" style="flex:1;margin:0;padding:7px;font-size:13px" value="' + row.to + '" min="1" oninput="window._v4stfTaxRows[' + i + '].to=parseFloat(this.value)||0">' +
      '<input type="number" class="v4-in" style="flex:0.7;margin:0;padding:7px;font-size:13px" value="' + row.r + '" min="0" max="100" oninput="window._v4stfTaxRows[' + i + '].r=parseFloat(this.value)||0">%' +
      '<button class="btn-mini delete" ' + (rows.length <= 1 ? 'disabled style="opacity:.3"' : '') + ' onclick="v4stfTaxRowDel(' + i + ')">✖</button>' +
      '</div>';
  });
  box.innerHTML = html;
}
function v4stfTaxRowAdd() {
  var rows = window._v4stfTaxRows;
  var last = rows[rows.length - 1];
  if (last.to >= 9999999 && rows.length >= 2) {
    // insert BEFORE the "and above" bracket so it stays last
    var prevTo = rows[rows.length - 2].to;
    rows.splice(rows.length - 1, 0, { from: prevTo + 1, to: prevTo + 1000, r: last.r });
  } else if (last.to >= 9999999) {
    rows.push({ from: 1, to: 1000, r: last.r });
  } else {
    rows.push({ from: last.to + 1, to: last.to + 1000, r: last.r });
  }
  v4stfTaxRowsRender();
}
function v4stfTaxRowDel(i) {
  window._v4stfTaxRows.splice(i, 1);
  v4stfTaxRowsRender();
}
function v4stfTaxSave() {
  var rows = window._v4stfTaxRows.slice();
  var ok = true;
  for (var i = 0; i < rows.length; i++) {
    if (!(rows[i].from >= 0) || !(rows[i].to > rows[i].from) || rows[i].r < 0 || rows[i].r > 100) ok = false;
  }
  rows.sort(function(a,b){ return a.from - b.from; });
  for (var j = 1; j < rows.length; j++) {
    if (rows[j].from <= rows[j-1].to) ok = false;   // overlap check
  }
  if (!ok) { alert('Bracket rules:\n• From must be SMALLER than To\n• Rate between 0 and 100\n• No overlapping intervals\n\nExample: 1 → 2000 · 2001 → 4000 · 4001 → 99999999'); return; }
  v4stfTaxTableSet(rows.map(function(x){ return [x.from, x.to, x.r]; }));
  alert('✅ ' + rows.length + ' brackets saved — payslips recalculate instantly.');
}
function v4stfTaxReset() {
  localStorage.removeItem('v4stfTax_' + getShopId());
  document.getElementById('v4stfToolBody').innerHTML = v4stfRulesHTML();
  v4stfTaxRowsRender();
  alert('✅ Reset to Ethiopian default scale (7 brackets).');
}
function v4stfTaxTestCalc() {
  var inc = parseFloat(document.getElementById('v4stfTaxTest').value) || 0;
  var rows = window._v4stfTaxRows || [];
  var tax = 0;
  for (var i = 0; i < rows.length; i++) {
    if (inc > rows[i].to) tax += (rows[i].to - rows[i].from + 1) * rows[i].r / 100;
    else if (inc >= rows[i].from) { tax += (inc - rows[i].from + 1) * rows[i].r / 100; break; }
    else break;
  }
  tax = Math.round(tax * 100) / 100;
  var box = document.getElementById('v4stfTaxTestBox');
  if (box) box.textContent = inc > 0 ? 'Salary ' + fmtMoney(inc) + ' → tax ' + fmtMoney(tax) + ' → net ' + fmtMoney(inc - tax) : '—';
}
function v4stfToggleTax() {
  v4stfTaxOnSet(!v4stfTaxOn());
  document.getElementById('v4stfToolBody').innerHTML = v4stfRulesHTML();
  v4stfTaxRowsRender();
}
function v4stfTogglePen() {
  v4stfPenOnSet(!v4stfPenOn());
  document.getElementById('v4stfToolBody').innerHTML = v4stfRulesHTML();
  v4stfTaxRowsRender();
}
function v4stfPenSave() {
  var r = parseFloat(document.getElementById('v4stfPenR').value) || 0;
  var e = parseFloat(document.getElementById('v4stfPenE').value) || 0;
  localStorage.setItem('v4stfPen_' + getShopId(), String(r));
  localStorage.setItem('v4stfPenE_' + getShopId(), String(e));
  alert('✅ Pension saved: employee ' + r + '% · employer ' + e + '%.');
}

// ═══ EDIT ═══
function v4stfEdit(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!emp) return;
  v4stfModal('✏️ Edit — ' + sanitize(emp.name));
  var posOpts = v4stfPositions().map(function(p){ return '<option' + (p === emp.position ? ' selected' : '') + '>' + p + '</option>'; }).join('');
  window._v4stfEdit = { id: id, ded: v4stfDedGet(id) };
  document.getElementById('v4stfToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Name</label>' +
    '<input class="v4-in" id="v4stfEName" value="' + sanitize(emp.name).replace(/"/g,'&quot;') + '">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Position</label><select class="v4-in" id="v4stfEPos">' + posOpts + '</select></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Salary (Br)</label><input type="number" class="v4-in" id="v4stfESal" value="' + emp.salary + '"></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Pay Period</label><select class="v4-in" id="v4stfEAgr">' +
    ['monthly','weekly','daily'].map(function(a){ return '<option value="' + a + '"' + (a === emp.paymentAgreement ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Pay Day Mode</label><select class="v4-in" id="v4stfEMode">' +
      '<option value="end"' + ((emp.paySchedule||'end') === 'end' ? ' selected' : '') + '>📅 End of month/week (e.g., 30th)</option>' +
      '<option value="completion"' + (emp.paySchedule === 'completion' ? ' selected' : '') + '>📅 From hire date (anniversary)</option>' +
    '</select></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Start Date</label><input type="date" class="v4-in" id="v4stfEStart" value="' + (emp.startDate||'') + '"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Bank Account</label><input class="v4-in" id="v4stfEAcct" value="' + sanitize(emp.accountNo) + '"></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone</label><input class="v4-in" id="v4stfEPhone" value="' + sanitize(emp.phone) + '"></div>' +
    '</div>' +
    '<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin:4px 0"><input type="checkbox" id="v4stfELock"' + (emp.pinLocked ? ' checked' : '') + '> 🔒 Lock PIN (staff cannot change it)</label>' +
    '<div style="height:8px"></div><b style="font-size:12px">➖ Custom deductions (monthly)</b>' +
    '<div id="v4stfDedList"></div>' +
    '<button class="v4-chip" onclick="v4stfDedAdd()">+ Add Deduction</button>' +
    '<div style="height:10px"></div>' +
    '<button class="v4-btn g" onclick="v4stfEditSave()">💾 Save All</button>';
  v4stfDedRender();
}
function v4stfDedRender() {
  var box = document.getElementById('v4stfDedList'); if (!box) return;
  var d = window._v4stfEdit.ded;
  box.innerHTML = d.map(function(x, i){
    return '<div style="display:flex;gap:6px;margin-bottom:6px">' +
      '<input class="v4-in" style="flex:2;margin:0;padding:7px" placeholder="Name (e.g., Union dues)" value="' + sanitize(x.name).replace(/"/g,'&quot;') + '" oninput="window._v4stfEdit.ded[' + i + '].name=this.value">' +
      '<input type="number" class="v4-in" style="flex:1;margin:0;padding:7px" placeholder="Br" value="' + x.amount + '" oninput="window._v4stfEdit.ded[' + i + '].amount=parseFloat(this.value)||0">' +
      '<button class="btn-mini delete" onclick="window._v4stfEdit.ded.splice(' + i + ',1);v4stfDedRender()">✖</button></div>';
  }).join('') || '<p style="font-size:11px;color:#94a3b8;margin:4px 0">None — add if the rules require (union, loans, cost sharing…)</p>';
}
function v4stfDedAdd() { window._v4stfEdit.ded.push({ name:'', amount:0 }); v4stfDedRender(); }
async function v4stfEditSave() {
  var e = window._v4stfEdit; if (!e) return;
  var name = document.getElementById('v4stfEName').value.trim();
  var salary = parseFloat(document.getElementById('v4stfESal').value) || 0;
  if (!name || salary <= 0) { alert('Name and salary are required.'); return; }
  try {
    const { error } = await v4ById(supabaseClient.from('employees').update({
      name: name, position: document.getElementById('v4stfEPos').value,
      salary: salary, payment_agreement: document.getElementById('v4stfEAgr').value,
      pay_schedule: document.getElementById('v4stfEMode').value,
      phone: document.getElementById('v4stfEPhone').value.trim(),
      start_date: document.getElementById('v4stfEStart').value || null,
      account_no: document.getElementById('v4stfEAcct').value.trim(),
      pin_locked: document.getElementById('v4stfELock').checked
    }), e.id);
    if (error) throw error;
    v4stfDedSet(e.id, e.ded.filter(function(d){ return d.name && d.amount > 0; }));
    v4stfCloseModal();
    await v4stfRefresh();
    alert('✅ ' + name + ' updated.');
  } catch(er) { alert('❌ ' + er.message); }
}

// ═══ LOGIN BLOCK ═══
async function v4stfToggleLogin(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!emp) return;
  if (emp.status === 'active') {
    if (!await confirm('🔒 Block ' + emp.name + ' from logging in?\n\nThey cannot sign into POS, Kitchen, or Hotel until you allow again.\nTheir records, salary and ledger stay untouched.')) return;
    try {
      const { error } = await v4ById(supabaseClient.from('employees').update({ status: 'inactive' }), id);
      if (error) throw error;
      emp.status = 'inactive';
      v4stfRender();
      alert('🔒 ' + emp.name + ' blocked from login.');
    } catch(e) { alert('❌ ' + e.message); }
  } else {
    if (!await confirm('👤 Allow ' + emp.name + ' to log in again?')) return;
    try {
      const { error } = await v4ById(supabaseClient.from('employees').update({ status: 'active' }), id);
      if (error) throw error;
      emp.status = 'active';
      v4stfRender();
      alert('👤 ' + emp.name + ' can log in again.');
    } catch(e) { alert('❌ ' + e.message); }
  }
}

// ═══ DELETE-CHOICE ═══
function v4stfDelete(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!emp) return;
  v4stfModal('🗑️ Remove — ' + sanitize(emp.name));
  document.getElementById('v4stfToolBody').innerHTML =
    '<p style="font-size:12px;color:#64748b;margin-bottom:12px">Is ' + sanitize(emp.name) + ' leaving, or just blocked temporarily?</p>' +
    '<button class="v4-btn" style="background:#f59e0b;margin-bottom:8px" onclick="v4stfDeactivate(\'' + id + '\')">🔒 Deactivate (block login)<br><small style="font-weight:400;font-size:11px;opacity:.9">Records & ledger kept. Reactivate anytime.</small></button>' +
    '<button class="v4-btn" style="background:#dc2626;margin-bottom:8px" onclick="v4stfDeleteForever(\'' + id + '\')">💣 Delete permanently<br><small style="font-weight:400;font-size:11px;opacity:.9">All records gone. Cannot be undone.</small></button>' +
    '<button class="v4-btn o" onclick="v4stfCloseModal()">✖ Cancel</button>';
}
async function v4stfDeactivate(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  try {
    const { error } = await v4ById(supabaseClient.from('employees').update({ status: 'inactive' }), id);
    if (error) throw error;
    v4stfCloseModal(); await v4stfRefresh();
    alert('✅ ' + emp.name + ' deactivated (reactivate anytime via 👤 button or Edit).');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4stfDeleteForever(id) {
  var emp = v4stf.data.find(function(x){ return x.id === id; });
  if (!await confirm('⚠️ PERMANENTLY DELETE ' + emp.name + '?\n\nLedger, PIN — all gone.\nRecorded salary expenses stay in Expenses.')) return;
  if (!await confirm('🚨 FINAL WARNING — this cannot be undone.')) return;
  try {
    await supabaseClient.from('salary_ledger').delete().eq('employee_id', id);
    const { error } = await v4ById(supabaseClient.from('employees').delete(), id);
    if (error) throw error;
    v4stfCloseModal(); await v4stfRefresh();
    alert('✅ ' + emp.name + ' permanently deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── modal opener ──
function v4stfOpen(tool) {
  if (tool === 'analytics') {
    v4stfModal('📊 Payroll Analytics');
    document.getElementById('v4stfToolBody').innerHTML = v4stfPeriodChips() + '<div id="v4stfAnalyticsBody">' + v4stfAnalyticsHTML() + '</div>';
  } else if (tool === 'rules') {
    v4stfModal('🏛️ Deduction Rules');
    document.getElementById('v4stfToolBody').innerHTML = v4stfRulesHTML();
    v4stfTaxRowsRender();
  } else if (tool === 'alerts') {
    v4stfModal('🔔 Salary Alerts & Pay Days');
    document.getElementById('v4stfToolBody').innerHTML = v4stfAlertsHTML();
  }
}

// ═══ TABLE ═══
function v4stfRows() {
  var q = (v4S.stfq || '').toLowerCase();
  return v4stf.data.filter(function(e){
    if (q && e.name.toLowerCase().indexOf(q) === -1 && (e.position||'').toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
function v4stfTable(rows) {
  var ex = document.getElementById('v4stfExcel'); if (!ex) return;
  if (!rows.length) { ex.innerHTML = '<div class="placeholder">No staff yet — register your first team member.</div>'; window.v4staffTable = null; return; }
  var alive = ex.querySelector('.modern-sheet-table');
  if (!window.v4staffTable || !alive) {
    ex.innerHTML = '';
    window.v4staffTable = new ModernSheet('v4stfExcel', { data: rows, columns: [
      { title:'#', width:'34px', render:function(i,h,x){ return x+1; } },
      { title:'Name', field:'name', width:'125px', render:function(i,h){
          var bal = v4stfBalance(i.id);
          return h ? '<b>' + sanitize(i.name) + '</b>' + (i.status === 'inactive' ? ' <span style="color:#ef4444;font-size:10px;font-weight:800">(BLOCKED)</span>' : (bal > 0 ? ' <span style="color:#f59e0b;font-size:10px;font-weight:800">💰 owes</span>' : '')) : i.name;
        } },
      { title:'Position', field:'position', width:'85px', filterable:true },
      { title:'Salary', field:'salary', width:'85px', align:'right', render:function(i,h){ return h?fmtMoney(i.salary):i.salary; },
        total:true, totalValue:function(i){ return i.status === 'active' ? i.salary : 0; }, totalFormat:function(s){ return fmtMoney(s) + '/mo'; } },
      { title:'Pay', width:'72px', render:function(i){
          var m = { monthly: i.paySchedule === 'completion' ? '📅 hire' : '📅 30th', weekly: i.paySchedule === 'completion' ? '📅 7d' : '📅 Sat', daily: '📅 day' };
          return m[i.paymentAgreement || 'monthly'] || '📅 30th';
        } },
      { title:'Owes (live)', width:'95px', align:'right', render:function(i,h){
          var bal = v4stfBalance(i.id);
          if (!h) return String(bal);
          return bal > 0 ? '<b style="color:#ef4444">' + fmtMoney(bal) + '</b>' : '<span style="color:#10b981;font-weight:700">✅ settled</span>';
        } },
      { title:'Last Paid', width:'85px', render:function(i,h){
          return h ? (i.lastPaid ? new Date(i.lastPaid).toLocaleDateString() : '—') : (i.lastPaid||'');
        } },
      { title:'Actions', width:'210px', render:function(i,h){
          if (!h) return '';
          var b = '';
          if (i.status === 'active') {
            b += '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4stfPay(\'' + i.id + '\')" title="Pay salary">💰</button> ';
            b += '<button class="btn-mini" style="background:#f59e0b;color:#fff" onclick="v4stfAdvance(\'' + i.id + '\')" title="Advance">➖</button> ';
            b += '<button class="btn-mini" style="background:#334155;color:#fff" onclick="v4stfToggleLogin(\'' + i.id + '\')" title="Block login">🔒</button> ';
          } else {
            b += '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4stfToggleLogin(\'' + i.id + '\')" title="Allow login">👤</button> ';
          }
          b += '<button class="btn-mini" style="background:#8b5cf6;color:#fff" onclick="v4stfLedgerView(\'' + i.id + '\')" title="Ledger">📖</button> ';
          b += '<button class="btn-mini edit" onclick="v4stfEdit(\'' + i.id + '\')">✏️</button> ';
          b += '<button class="btn-mini delete" onclick="v4stfDelete(\'' + i.id + '\')">🗑️</button>';
          return b;
        }, filterable:false }
    ], emptyMessage:'No staff', showSearch:false, showFontSlider:true });
  } else window.v4staffTable.setData(rows);
}

// ── search / views ──
var v4stfSearchT = null;
function v4stfSearchInput(v) {
  v4S.stfq = v;
  clearTimeout(v4stfSearchT);
  v4stfSearchT = setTimeout(function(){ v4S.stflpage = 1; v4S.stfgpage = 1; v4stfRenderView(); }, 300);
}
function v4stfView(v) {
  v4S.stfview = v; v4S.stflpage = 1; v4S.stfgpage = 1;
  var ids = { excel:'v4stfvExcel', list:'v4stfvList', grid:'v4stfvGrid' };
  Object.keys(ids).forEach(function(k){ var el = document.getElementById(ids[k]); if (el) el.classList.toggle('active', k === v); });
  var ex = document.getElementById('v4stfExcel'), li = document.getElementById('v4stfList'), gr = document.getElementById('v4stfGrid');
  if (ex) ex.style.display = v === 'excel' ? 'block' : 'none';
  if (li) li.style.display = v === 'list' ? 'block' : 'none';
  if (gr) gr.style.display = v === 'grid' ? 'grid' : 'none';
  v4stfRenderView();
}
function v4stfMoreList(){ v4S.stflpage = (v4S.stflpage||1) + 1; v4stfRenderView(); }
function v4stfMoreGrid(){ v4S.stfgpage = (v4S.stfgpage||1) + 1; v4stfRenderView(); }
function v4stfListRows(rows) {
  return rows.map(function(e){
    var bal = v4stfBalance(e.id);
    var np = v4stfNextPayday(e);
    return { label: (e.status === 'inactive' ? '🔒 ' : (bal > 0 ? '⚠️ ' : '✅ ')) + sanitize(e.name),
             detail: e.position + ' · ' + fmtMoney(e.salary) + (bal > 0 ? ' · owes ' + fmtMoney(bal) : '') + ' · next pay ' + formatDate(np.date),
             right: bal > 0 ? fmtMoney(bal) : 'settled' };
  });
}

// ── render pipeline ──
function v4stfRenderView() {
  var rows = v4stfRows();
  var cnt = document.getElementById('v4stfCount'); if (cnt) cnt.textContent = rows.length;
  var v = v4S.stfview || 'excel';
  if (v === 'excel') v4stfTable(rows);
  else if (v === 'list') v4PagList('v4stfList', v4stfListRows(rows), 'stflpage', 20, 'v4stfMoreList');
  else v4PagGrid('v4stfGrid', v4stfListRows(rows), 'stfgpage', 12, 'v4stfMoreGrid');
}
function v4stfRender() {
  v4stfHealth();
  v4stfRenderView();
}

// ── tab loader ──
V4_TAB_LOADERS[6] = function() {
  v4stfEnsureUI();
  v4stfLoad().then(function(){ return v4stfSyncAll(); }).then(v4stfRender);
};
