// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — MONEY MODULE (Step 14a)
//  Loyalty (tab10) · Loans (tab11) · Bank (tab12)
//  UI-3: health strips · big buttons · tables · settle
//  dialogs · WhatsApp · period-aware where meaningful.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }

// ═════════════════════════════════════════════════════════
//  🎁 LOYALTY (tab10)
// ═════════════════════════════════════════════════════════
var v4ly = { data:[], q:'' };

async function v4lyLoad() {
  try {
    const { data } = await supabaseClient.from('loyalty').select('*').eq('shop_id', getShopId());
    v4ly.data = (data || []).map(function(l){
      return { id: l.firebase_id || l.id, phone: l.phone, points: Number(l.points||0) };
    }).sort(function(a,b){ return b.points - a.points; });
  } catch(e) { v4ly.data = []; }
  return v4ly.data;
}
async function v4lyRefresh(){ await v4lyLoad(); v4lyRender(); }
function v4lyValue(pts) { return Math.floor(pts / 100); }   // 100 pts = Br 1

function v4lyEnsureUI() {
  var tab = document.getElementById('tab10');
  if (!tab || tab.dataset.lyBuilt === '1') return;
  tab.dataset.lyBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4lyH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4lyH b{font-size:13px;display:block;word-break:break-word;}' +
    '.v4lyH small{font-size:9px;font-weight:800;color:#64748b;}' +
    '</style>' +
    '<div class="card" style="padding:12px" id="v4lyHealth"></div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">🎁 Loyalty Customers <span class="v4-badge" id="v4lyCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip" onclick="v4lyRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<p style="font-size:11px;color:#64748b;margin-bottom:8px">1 point per Br 1 spent · 100 points = Br 1 discount. Customers earn automatically on every sale with a phone number.</p>' +
      '<input class="v4-in" id="v4lySearch" placeholder="🔍 Phone number…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4lySearchInput(this.value)">' +
      '<div id="v4lyList"></div>' +
    '</div>';
}
function v4lyHealth() {
  var el = document.getElementById('v4lyHealth'); if (!el) return;
  var total = v4ly.data.reduce(function(s,l){ return s + l.points; }, 0);
  var totalVal = v4ly.data.reduce(function(s,l){ return s + v4lyValue(l.points); }, 0);
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    '<div class="v4lyH"><b style="color:#3b82f6">' + v4ly.data.length + '</b><small>👥 MEMBERS</small></div>' +
    '<div class="v4lyH"><b style="color:#f59e0b">' + total.toLocaleString() + '</b><small>⭐ TOTAL POINTS</small></div>' +
    '<div class="v4lyH"><b style="color:#ef4444">' + fmtMoney(totalVal) + '</b><small>💳 POTENTIAL DISCOUNTS</small></div>' +
    '</div>';
}
function v4lyRender() {
  v4lyHealth();
  var box = document.getElementById('v4lyList'); if (!box) return;
  var q = (v4ly.q || '').toLowerCase();
  var rows = v4ly.data.filter(function(l){ return !q || (l.phone||'').indexOf(q) !== -1; });
  var cnt = document.getElementById('v4lyCount'); if (cnt) cnt.textContent = rows.length;
  if (!rows.length) {
    box.innerHTML = '<div class="placeholder">' + (v4ly.data.length ? 'No matches.' : 'No loyalty customers yet — they appear when customers with phone numbers buy.') + '</div>';
    return;
  }
  var html = '';
  rows.forEach(function(l){
    var val = v4lyValue(l.points);
    html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f1f5f9">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:14px">📱 ' + sanitize(l.phone || 'No phone') + '</b>' +
        '<br><small style="color:#64748b">⭐ ' + l.points.toLocaleString() + ' points · worth ' + fmtMoney(val) + '</small>' +
      '</div>' +
      '<div style="display:flex;gap:5px;flex-shrink:0">' +
        '<button class="btn-mini edit" onclick="v4lyEdit(\'' + l.id + '\')">✏️</button>' +
        '<button class="btn-mini delete" onclick="v4lyDelete(\'' + l.id + '\')">🗑️</button>' +
      '</div></div>';
  });
  box.innerHTML = html;
}
var v4lySearchT = null;
function v4lySearchInput(v) {
  v4ly.q = v;
  clearTimeout(v4lySearchT);
  v4lySearchT = setTimeout(v4lyRender, 300);
}
async function v4lyEdit(id) {
  var l = v4ly.data.find(function(x){ return x.id === id; }); if (!l) return;
  var pts = parseInt(await prompt('New points balance for ' + l.phone + ':', l.points));
  if (isNaN(pts) || pts < 0) return;
  if (!await confirm('Update ' + l.phone + ' to ' + pts + ' points (worth ' + fmtMoney(v4lyValue(pts)) + ')?')) return;
  try {
    const { error } = await v4ById(supabaseClient.from('loyalty').update({ points: pts }), id);
    if (error) throw error;
    await v4lyRefresh();
    alert('✅ Points updated.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4lyDelete(id) {
  var l = v4ly.data.find(function(x){ return x.id === id; }); if (!l) return;
  if (!await confirm('🗑️ Delete loyalty record for ' + l.phone + '?\n(' + l.points + ' points · ' + fmtMoney(v4lyValue(l.points)) + ')')) return;
  try {
    const { error } = await v4ById(supabaseClient.from('loyalty').delete(), id);
    if (error) throw error;
    await v4lyRefresh();
    alert('✅ Record deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═════════════════════════════════════════════════════════
//  💸 LOANS (tab11)
// ═════════════════════════════════════════════════════════
var v4ln = { data:[], q:'', typeF:'', statusF:'' };

async function v4lnLoad() {
  try {
    const { data } = await supabaseClient.from('loans').select('*').eq('shop_id', getShopId()).order('date', { ascending: false });
    v4ln.data = (data || []).map(function(l){
      return { id: l.firebase_id || l.id, name: l.name, phone: l.phone || '',
        amount: Number(l.amount||0), type: l.type || 'receivable', status: l.status || 'open',
        date: l.date, description: l.description || '' };
    });
  } catch(e) { v4ln.data = []; }
  return v4ln.data;
}
async function v4lnRefresh(){ await v4lnLoad(); v4lnRender(); }

function v4lnEnsureUI() {
  var tab = document.getElementById('tab11');
  if (!tab || tab.dataset.lnBuilt === '1') return;
  tab.dataset.lnBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4lnH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4lnH b{font-size:13px;display:block;word-break:break-word;}' +
    '.v4lnH small{font-size:9px;font-weight:800;color:#64748b;}' +
    '</style>' +
    '<div class="card" style="padding:12px" id="v4lnHealth"></div>' +
    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:10px">' +
        '<button class="v4-btn g" style="margin:0" onclick="v4lnAdd()">➕ Record Loan</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">💸 Loan History <span class="v4-badge" id="v4lnCount">0</span></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">' +
        '<select class="v4-in" id="v4lnTypeF" style="flex:1;min-width:100px;height:34px;padding:6px;font-size:12px" onchange="v4ln.typeF=this.value;v4lnRender()">' +
          '<option value="">All Types</option><option value="receivable">📥 Receivable</option><option value="payable">📤 Payable</option>' +
        '</select>' +
        '<select class="v4-in" id="v4lnStatusF" style="flex:1;min-width:100px;height:34px;padding:6px;font-size:12px" onchange="v4ln.statusF=this.value;v4lnRender()">' +
          '<option value="">All Status</option><option value="open">⏳ Open</option><option value="settled">✅ Settled</option>' +
        '</select>' +
        '<input class="v4-in" id="v4lnSearch" placeholder="🔍 Name…" style="flex:2;min-width:100px;height:34px;padding:6px;font-size:12px" oninput="v4ln.q=this.value.toLowerCase();clearTimeout(v4lnST);v4lnST=setTimeout(v4lnRender,300)">' +
      '</div>' +
      '<div id="v4lnList"></div>' +
    '</div>';
}
var v4lnST = null;
function v4lnHealth() {
  var el = document.getElementById('v4lnHealth'); if (!el) return;
  var rec = 0, pay = 0, recCount = 0, payCount = 0;
  v4ln.data.forEach(function(l){
    if (l.status !== 'open') return;
    if (l.type === 'receivable') { rec += l.amount; recCount++; }
    else { pay += l.amount; payCount++; }
  });
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    '<div class="v4lnH"><b style="color:#10b981">' + fmtMoney(rec) + '</b><small>📥 TO RECEIVE (' + recCount + ')</small></div>' +
    '<div class="v4lnH"><b style="color:#ef4444">' + fmtMoney(pay) + '</b><small>📤 TO PAY (' + payCount + ')</small></div>' +
    '<div class="v4lnH"><b style="color:' + (rec - pay >= 0 ? '#10b981' : '#ef4444') + '">' + fmtMoney(rec - pay) + '</b><small>💰 NET POSITION</small></div>' +
    '</div>';
}
function v4lnRender() {
  v4lnHealth();
  var box = document.getElementById('v4lnList'); if (!box) return;
  var rows = v4ln.data.filter(function(l){
    if (v4ln.typeF && l.type !== v4ln.typeF) return false;
    if (v4ln.statusF && l.status !== v4ln.statusF) return false;
    if (v4ln.q && l.name.toLowerCase().indexOf(v4ln.q) === -1) return false;
    return true;
  });
  var cnt = document.getElementById('v4lnCount'); if (cnt) cnt.textContent = rows.length;
  if (!rows.length) { box.innerHTML = '<div class="placeholder">No loans match.</div>'; return; }
  var html = '';
  rows.forEach(function(l){
    var isRec = l.type === 'receivable';
    var isSettled = l.status === 'settled';
    var col = isSettled ? '#94a3b8' : (isRec ? '#10b981' : '#ef4444');
    html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f1f5f9;' + (isSettled ? 'opacity:.6;' : '') + '">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:14px">' + (isRec ? '📥' : '📤') + ' ' + sanitize(l.name) + (isSettled ? ' ✅' : '') + '</b>' +
        '<br><small style="color:#64748b">' + (isRec ? 'they owe you' : 'you owe them') + ' · ' + formatDate(l.date) + (l.phone ? ' · 📞 ' + sanitize(l.phone) : '') + '</small>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
        '<b style="color:' + col + ';font-size:15px">' + fmtMoney(l.amount) + '</b><br>' +
        '<div style="display:flex;gap:4px;margin-top:3px">' +
        (!isSettled ? '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4lnSettle(\'' + l.id + '\')">💰 Settle</button>' : '') +
        '<button class="btn-mini edit" onclick="v4lnEdit(\'' + l.id + '\')">✏️</button>' +
        '<button class="btn-mini delete" onclick="v4lnDelete(\'' + l.id + '\')">🗑️</button>' +
        '</div></div></div>';
  });
  box.innerHTML = html;
}
async function v4lnAdd() {
  var name = await prompt('Person / business name:');
  if (!name) return;
  var type = await prompt('Type (receivable = they owe you / payable = you owe them):', 'receivable');
  if (type !== 'receivable' && type !== 'payable') type = 'receivable';
  var amt = parseFloat(await prompt('Amount:'));
  if (isNaN(amt) || amt <= 0) { alert('Invalid amount.'); return; }
  var phone = await prompt('Phone (optional):', '') || '';
  var desc = await prompt('Description (optional):', '') || '';
  try {
    const { error } = await supabaseClient.from('loans').insert([{
      firebase_id: 'loan_' + Date.now(), shop_id: getShopId(),
      name: name, phone: phone, amount: amt, type: type, status: 'open',
      date: new Date().toISOString().slice(0,10), description: desc
    }]);
    if (error) throw error;
    await v4lnRefresh();
    alert('✅ Loan recorded: ' + name + ' — ' + fmtMoney(amt));
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4lnSettle(id) {
  var l = v4ln.data.find(function(x){ return x.id === id; }); if (!l) return;
  if (!await confirm((l.type === 'receivable' ? '💰 Mark as received from ' : '📤 Mark as paid to ') + l.name + '?\n\n' + fmtMoney(l.amount))) return;
  try {
    const { error } = await v4ById(supabaseClient.from('loans').update({ status: 'settled', settled_at: new Date().toISOString() }), id);
    if (error) throw error;
    await v4lnRefresh();
    alert('✅ Settled.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4lnEdit(id) {
  var l = v4ln.data.find(function(x){ return x.id === id; }); if (!l) return;
  var name = await prompt('Name:', l.name); if (!name) return;
  var amt = parseFloat(await prompt('Amount:', l.amount)); if (isNaN(amt) || amt <= 0) return;
  try {
    const { error } = await v4ById(supabaseClient.from('loans').update({ name: name, amount: amt }), id);
    if (error) throw error;
    await v4lnRefresh();
    alert('✅ Updated.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4lnDelete(id) {
  var l = v4ln.data.find(function(x){ return x.id === id; }); if (!l) return;
  if (!await confirm('🗑️ Delete this loan record?\n\n' + l.name + ' — ' + fmtMoney(l.amount))) return;
  try {
    const { error } = await v4ById(supabaseClient.from('loans').delete(), id);
    if (error) throw error;
    await v4lnRefresh();
    alert('✅ Deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ═════════════════════════════════════════════════════════
//  🏦 BANK (tab12)
// ═════════════════════════════════════════════════════════
var v4bk = { accounts:[], txns:[], accF:'', typeF:'' };

async function v4bkLoad() {
  try {
    const { data: accs } = await supabaseClient.from('bank_accounts').select('*').eq('shop_id', getShopId());
    v4bk.accounts = (accs || []).map(function(a){
      return { id: a.firebase_id || a.id, name: a.name, balance: Number(a.balance||0) };
    });
    const { data: txns } = await supabaseClient.from('bank_transactions').select('*').eq('shop_id', getShopId()).order('date', { ascending: false }).limit(500);
    v4bk.txns = (txns || []).map(function(t){
      return { id: t.firebase_id || t.id, accountId: t.account_id, accountName: t.account_name || '',
        description: t.description || '', amount: Number(t.amount||0), balance: Number(t.balance||0), date: t.date };
    });
  } catch(e) { v4bk.accounts = []; v4bk.txns = []; }
}
async function v4bkRefresh(){ await v4bkLoad(); v4bkRender(); }

function v4bkEnsureUI() {
  var tab = document.getElementById('tab12');
  if (!tab || tab.dataset.bkBuilt === '1') return;
  tab.dataset.bkBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4bkH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;}' +
    '.v4bkH b{font-size:13px;display:block;word-break:break-word;}' +
    '.v4bkH small{font-size:9px;font-weight:800;color:#64748b;}' +
    '</style>' +
    '<div class="card" style="padding:12px" id="v4bkHealth"></div>' +
    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">' +
        '<button class="v4-btn g" style="margin:0" onclick="v4bkTxn(\'deposit\')">💰 Deposit</button>' +
        '<button class="v4-btn" style="margin:0;background:#ef4444" onclick="v4bkTxn(\'withdraw\')">📤 Withdraw</button>' +
        '<button class="v4-btn p" style="margin:0" onclick="v4bkAddAccount()">➕ Add Account</button>' +
        '<button class="v4-btn p" style="margin:0" onclick="v4bkStatement()">🖨️ Statement</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">🏦 Accounts</div>' +
      '<div id="v4bkAccounts"></div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">📋 Transactions <span class="v4-badge" id="v4bkCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip" onclick="v4bkRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">' +
        '<select class="v4-in" id="v4bkAccF" style="flex:1;min-width:100px;height:34px;padding:6px;font-size:12px" onchange="v4bk.accF=this.value;v4bkRenderTxns()"><option value="">All Accounts</option></select>' +
        '<select class="v4-in" id="v4bkTypeF" style="flex:1;min-width:90px;height:34px;padding:6px;font-size:12px" onchange="v4bk.typeF=this.value;v4bkRenderTxns()">' +
          '<option value="">All Types</option><option value="deposit">💰 Deposit</option><option value="withdrawal">📤 Withdrawal</option>' +
        '</select>' +
      '</div>' +
      '<div id="v4bkTxns"></div>' +
    '</div>';
}
function v4bkHealth() {
  var el = document.getElementById('v4bkHealth'); if (!el) return;
  var total = v4bk.accounts.reduce(function(s,a){ return s + a.balance; }, 0);
  el.innerHTML = '<div style="display:flex;gap:8px">' +
    '<div class="v4bkH"><b style="color:#3b82f6">' + v4bk.accounts.length + '</b><small>🏦 ACCOUNTS</small></div>' +
    '<div class="v4bkH"><b style="color:#10b981">' + fmtMoney(total) + '</b><small>💰 TOTAL BALANCE</small></div>' +
    '</div>' +
    (v4bk.accounts.length === 0 ? '<p style="text-align:center;font-size:11px;color:#64748b;margin-top:6px">No accounts yet — add your first bank account above.</p>' : '');
}
function v4bkRender() {
  v4bkHealth();
  // accounts list
  var box = document.getElementById('v4bkAccounts'); if (box) {
    if (!v4bk.accounts.length) { box.innerHTML = '<div class="placeholder">No bank accounts yet.</div>'; }
    else {
      var html = '';
      v4bk.accounts.forEach(function(a){
        html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f1f5f9">' +
          '<div style="flex:1"><b style="font-size:14px">🏦 ' + sanitize(a.name) + '</b></div>' +
          '<b style="color:' + (a.balance >= 0 ? '#10b981' : '#ef4444') + ';font-size:15px">' + fmtMoney(a.balance) + '</b>' +
          '<div style="display:flex;gap:4px">' +
          '<button class="btn-mini edit" onclick="v4bkEditAccount(\'' + a.id + '\')">✏️</button>' +
          '<button class="btn-mini delete" onclick="v4bkDeleteAccount(\'' + a.id + '\')">🗑️</button>' +
          '</div></div>';
      });
      box.innerHTML = html;
    }
  }
  // account filter dropdown
  var sel = document.getElementById('v4bkAccF');
  if (sel) {
    var keep = v4bk.accF;
    sel.innerHTML = '<option value="">All Accounts</option>' +
      v4bk.accounts.map(function(a){ return '<option value="' + a.id + '"' + (a.id === keep ? ' selected' : '') + '>' + sanitize(a.name) + '</option>'; }).join('');
  }
  v4bkRenderTxns();
}
function v4bkRenderTxns() {
  var box = document.getElementById('v4bkTxns'); if (!box) return;
  var rows = v4bk.txns.filter(function(t){
    if (v4bk.accF && t.accountId !== v4bk.accF) return false;
    if (v4bk.typeF === 'deposit' && t.amount < 0) return false;
    if (v4bk.typeF === 'withdrawal' && t.amount >= 0) return false;
    return true;
  });
  var cnt = document.getElementById('v4bkCount'); if (cnt) cnt.textContent = rows.length;
  if (!rows.length) { box.innerHTML = '<div class="placeholder">No transactions.</div>'; return; }
  var html = '';
  rows.slice(0, 50).forEach(function(t){
    var isDep = t.amount >= 0;
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">' +
      '<div style="flex:1;min-width:0">' +
        '<b>' + (isDep ? '💰' : '📤') + ' ' + sanitize(t.accountName || 'Account') + '</b>' +
        '<br><small style="color:#64748b">' + sanitize(t.description || '') + ' · ' + formatDate(t.date) + '</small>' +
      '</div>' +
      '<b style="color:' + (isDep ? '#10b981' : '#ef4444') + ';flex-shrink:0">' + (isDep ? '+' : '') + fmtMoney(Math.abs(t.amount)) + '</b>' +
      '</div>';
  });
  box.innerHTML = html;
}
async function v4bkAddAccount() {
  var name = await prompt('Account name (e.g., CBE Main, Awash):');
  if (!name) return;
  var bal = parseFloat(await prompt('Opening balance:', '0')) || 0;
  try {
    const { error } = await supabaseClient.from('bank_accounts').insert([{
      firebase_id: 'bank_' + Date.now(), shop_id: getShopId(), name: name, balance: bal
    }]);
    if (error) throw error;
    await v4bkRefresh();
    alert('✅ Account created.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4bkEditAccount(id) {
  var a = v4bk.accounts.find(function(x){ return x.id === id; }); if (!a) return;
  var name = await prompt('Account name:', a.name); if (!name) return;
  var bal = parseFloat(await prompt('Balance:', a.balance)); if (isNaN(bal)) return;
  try {
    const { error } = await v4ById(supabaseClient.from('bank_accounts').update({ name: name, balance: bal }), id);
    if (error) throw error;
    await v4bkRefresh();
    alert('✅ Updated.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4bkDeleteAccount(id) {
  var a = v4bk.accounts.find(function(x){ return x.id === id; }); if (!a) return;
  if (!await confirm('🗑️ Delete "' + a.name + '" and ALL its transactions?')) return;
  try {
    await supabaseClient.from('bank_transactions').delete().eq('account_id', id);
    const { error } = await v4ById(supabaseClient.from('bank_accounts').delete(), id);
    if (error) throw error;
    await v4bkRefresh();
    alert('✅ Deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4bkTxn(mode) {
  if (!v4bk.accounts.length) { alert('Add a bank account first.'); return; }
  var isDep = mode === 'deposit';
  var accId = await prompt('Account:\n' + v4bk.accounts.map(function(a,i){ return (i+1) + '. ' + a.name + ' (' + fmtMoney(a.balance) + ')'; }).join('\n') + '\n\nEnter account number (1-' + v4bk.accounts.length + '):', '1');
  var idx = parseInt(accId) - 1;
  if (isNaN(idx) || idx < 0 || idx >= v4bk.accounts.length) { alert('Invalid account.'); return; }
  var acc = v4bk.accounts[idx];
  var amt = parseFloat(await prompt((isDep ? '💰 Deposit' : '📤 Withdraw') + ' amount for ' + acc.name + ':'));
  if (isNaN(amt) || amt <= 0) { alert('Invalid amount.'); return; }
  var desc = await prompt('Description:', isDep ? 'Cash deposit' : 'Cash withdrawal') || '';
  var signed = isDep ? Math.abs(amt) : -Math.abs(amt);
  var newBal = acc.balance + signed;
  if (newBal < 0) { alert('❌ Insufficient funds! Balance: ' + fmtMoney(acc.balance)); return; }
  if (!await confirm((isDep ? 'Deposit' : 'Withdraw') + ' ' + fmtMoney(amt) + (isDep ? ' to ' : ' from ') + acc.name + '?\nNew balance: ' + fmtMoney(newBal))) return;
  try {
    await supabaseClient.from('bank_transactions').insert([{
      firebase_id: 'bt_' + Date.now(), shop_id: getShopId(),
      account_id: acc.id, account_name: acc.name,
      description: desc, amount: signed, balance: newBal,
      date: new Date().toISOString().slice(0,10)
    }]);
    await v4ById(supabaseClient.from('bank_accounts').update({ balance: newBal }), acc.id);
    await v4bkRefresh();
    alert('✅ Recorded. New balance: ' + fmtMoney(newBal));
  } catch(e) { alert('❌ ' + e.message); }
}
function v4bkStatement() {
  var rows = v4bk.txns.slice(0, 100);
  if (!rows.length) { alert('No transactions to print.'); return; }
  var w = window.open('', '_blank', 'width=420,height=650');
  if (!w) { alert('Allow popups.'); return; }
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var body = rows.map(function(t){
    return '<tr><td>' + formatDate(t.date) + '</td><td>' + sanitize(t.accountName||'') + '</td><td>' + sanitize(t.description||'') + '</td><td style="text-align:right;color:' + (t.amount >= 0 ? '#10b981' : '#ef4444') + '">' + fmtMoney(t.amount) + '</td><td style="text-align:right">' + fmtMoney(t.balance) + '</td></tr>';
  }).join('');
  w.document.write('<html><head><title>Bank Statement</title><style>body{font-family:monospace;padding:14px;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:4px}th{background:#eee}</style></head><body>' +
    '<h3 style="text-align:center">' + sanitize(shop) + ' — Bank Statement</h3>' +
    '<table><tr><th>Date</th><th>Account</th><th>Description</th><th>Amount</th><th>Balance</th></tr>' + body + '</table></body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

// ── tab loaders ──
V4_TAB_LOADERS[10] = function() { v4lyEnsureUI(); v4lyLoad().then(v4lyRender); };
V4_TAB_LOADERS[11] = function() { v4lnEnsureUI(); v4lnLoad().then(v4lnRender); };
V4_TAB_LOADERS[12] = function() { v4bkEnsureUI(); v4bkLoad().then(v4bkRender); };
