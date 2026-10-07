// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — HOTEL MODULE (Step 12) · 100%+70%
//  KEPT (v3 engine): room board · check-in (guest/ID/deposit)
//  · folio AUTO-BILLS missing nights · quick charges · extend
//  · checkout (deposit>charges guard · sale record · guard
//  alert · room→cleaning) · cleaner & guard modes · realtime.
//  NEW: reservations · arrivals/departures + OVERDUE ·
//  occupancy forecast 7d · night audit (WA/print) · analytics
//  (period chips, nationality mix, folio breakdown) · guest
//  WhatsApp confirm+receipt · searchable history · quick
//  maintenance toggle.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }
var v4ht = { rooms:[], stays:[], alerts:[], history:[], period:'month', q:'' };

// ── helpers ──
function v4htEscape(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function v4htToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function v4htPeriodStart(p) {
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
function v4htPeriodLabel() {
  return { today:'Today', week:'This Week', month:'This Month', year:'This Year', all:'All Time' }[v4ht.period] || 'This Month';
}

// ── data ──
async function v4htLoad() {
  try {
    const { data: rooms } = await supabaseClient.from('rooms').select('*').eq('shop_id', getShopId()).order('room_number');
    v4ht.rooms = rooms || [];
    const { data: stays } = await supabaseClient.from('guest_stays').select('*').eq('shop_id', getShopId()).in('status', ['active','reserved']).order('check_in', { ascending: false });
    v4ht.stays = stays || [];
    const { data: alerts } = await supabaseClient.from('hotel_alerts').select('*').eq('shop_id', getShopId()).eq('status', 'pending').order('created_at', { ascending: false });
    v4ht.alerts = alerts || [];
  } catch(e) { console.warn('Hotel load:', e.message); }
  return v4ht.rooms;
}
async function v4htRefresh(){ await v4htLoad(); v4htRender(); }

// ═══ PAY STATUS (the Captain's law: pay 3 days → asked after 3 days) ═══
function v4htPayStatus(stay) {
  var today = v4htToday();
  var checkout = stay.planned_checkout ? String(stay.planned_checkout).slice(0,10) : '';
  var rate = Number(stay.nightly_rate || 0);
  var deposit = Number(stay.deposit || 0);
  // ⏰ Overdue — past checkout date
  if (checkout && checkout < today) return { t:'⏰ OVERDUE', c:'#ef4444', overdue:true };
  // Deposit covers nights → compute paid-until date
  if (rate > 0 && deposit > 0) {
    var nightsPaid = Math.floor(deposit / rate);
    if (nightsPaid > 0) {
      var pu = new Date(new Date(stay.check_in).getTime() + nightsPaid * 86400000);
      var puStr = pu.getFullYear() + '-' + String(pu.getMonth()+1).padStart(2,'0') + '-' + String(pu.getDate()).padStart(2,'0');
      if (puStr >= today) return { t:'✅ paid til ' + puStr.slice(5,10), c:'#10b981' };
      // Deposit ran out but guest still inside → renewal time
      if (checkout >= today) return { t:'💰 RENEWAL', c:'#f59e0b', renewal:true };
    }
  }
  // No deposit — standard pay-at-checkout
  return { t:'💳 at checkout', c:'#94a3b8' };
}
// ═══ STAFF AUTO-DETECT (Face 1 ↔ Face 2 architecture) ═══
var v4htStaff = [];
async function v4htStaffDetect() {
  try {
    const { data } = await supabaseClient.from('employees').select('name, position')
      .eq('shop_id', getShopId()).eq('status', 'active')
      .in('position', ['Reception','Cleaner','Guard']);
    v4htStaff = data || [];
  } catch(e) { v4htStaff = []; }
  return v4htStaff;
}

function v4htStayFor(roomId) { return v4ht.stays.find(function(s){ return s.room_id === roomId && s.status === 'active'; }); }
function v4htRoom(id) { return v4ht.rooms.find(function(r){ return r.id === id; }); }

// ── stats ──
function v4htStats() {
  var total = v4ht.rooms.length;
  var occ = v4ht.rooms.filter(function(r){ return r.status === 'occupied'; }).length;
  var free = v4ht.rooms.filter(function(r){ return r.status === 'available'; }).length;
  var clean = v4ht.rooms.filter(function(r){ return r.status === 'cleaning'; }).length;
  var resv = v4ht.rooms.filter(function(r){ return r.status === 'reserved'; }).length;
  var maint = v4ht.rooms.filter(function(r){ return r.status === 'maintenance'; }).length;
  return { total:total, occ:occ, free:free, clean:clean, resv:resv, maint:maint, pct: total > 0 ? Math.round(occ/total*100) : 0 };
}
function v4htDeparturesToday() {
  var t = v4htToday();
  return v4ht.stays.filter(function(s){ return s.status === 'active' && String(s.planned_checkout || '').slice(0,10) === t; });
}
function v4htOverdue() {
  var t = v4htToday();
  return v4ht.stays.filter(function(s){ return s.status === 'active' && s.planned_checkout && String(s.planned_checkout).slice(0,10) < t; });
}
async function v4htRevenue(period) {
  // bounded: hotel sales only (checkout settlements)
  var start = v4htPeriodStart(period || v4ht.period).toISOString();
  try {
    const { data, error } = await supabaseClient.from('sales').select('total, time')
      .eq('shop_id', getShopId()).eq('order_type', 'Room Stay')
      .gte('time', start).order('time', { ascending: false }).limit(500);
    if (error) throw error;
    return (data || []).reduce(function(s,x){ return s + Number(x.total||0); }, 0);
  } catch(e) { return 0; }
}

// ═══ UI ═══
function v4htEnsureUI() {
  var tab = document.getElementById('tab21');
  if (!tab || tab.dataset.htBuilt === '1') return;
  tab.dataset.htBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4htH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;cursor:pointer;transition:transform .15s;}' +
    '.v4htH:active{transform:scale(.96);}' +
    '.v4htH b{font-size:13px;display:block;word-break:break-word;line-height:1.25;}' +
    '.v4htH small{font-size:9px;font-weight:800;color:#64748b;}' +
    'body.dark .v4htH small{color:#94a3b8;}' +
    '.v4htBtn{display:flex;align-items:center;gap:10px;text-align:left;border:none;border-radius:14px;padding:12px;color:#fff;cursor:pointer;min-height:64px;box-shadow:0 4px 10px rgba(0,0,0,.15);transition:transform .15s;}' +
    '.v4htBtn:active{transform:scale(.97);}' +
    '.v4htBtnIc{font-size:26px;flex-shrink:0;width:38px;text-align:center;}' +
    '.v4htBtnTx{flex:1;min-width:0;}' +
    '.v4htBtnTx b{display:block;font-size:14px;line-height:1.2;}' +
    '.v4htBtnTx small{display:block;font-size:10.5px;opacity:.9;line-height:1.3;margin-top:2px;}' +
    '.v4htBtnGo{font-size:22px;opacity:.6;flex-shrink:0;}' +
    '.v4htRoom{border-radius:12px;padding:8px;cursor:pointer;min-height:78px;display:flex;flex-direction:column;justify-content:center;color:#fff;transition:transform .15s;border:2px solid rgba(0,0,0,.08);}' +
    '.v4htRoom:active{transform:scale(.95);}' +
    '.v4PChips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.v4PChip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4PChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4PChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '</style>' +

    '<div class="card" style="padding:12px" id="v4htHealth"></div>' +

    '<div class="card" style="padding:12px">' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px">' +
        '<button class="v4htBtn" style="background:linear-gradient(135deg,#059669,#34d399)" onclick="v4htOpen(\'movements\')"><span class="v4htBtnIc">🚪</span><span class="v4htBtnTx"><b>Arrivals &amp; Departures</b><small>Who leaves today — and overdue guests</small></span><span class="v4htBtnGo">›</span></button>' +
        '<button class="v4htBtn" style="background:linear-gradient(135deg,#0d64f0,#60a5fa)" onclick="v4htOpen(\'analytics\')"><span class="v4htBtnIc">📊</span><span class="v4htBtnTx"><b>Analytics</b><small>Revenue, occupancy, guests — period switcher</small></span><span class="v4htBtnGo">›</span></button>' +
        '<button class="v4htBtn" style="background:linear-gradient(135deg,#f59e0b,#fbbf24)" onclick="v4htOpen(\'forecast\')"><span class="v4htBtnIc">🌅</span><span class="v4htBtnTx"><b>Forecast</b><small>Room availability — next 7 days</small></span><span class="v4htBtnGo">›</span></button>' +
        '<button class="v4htBtn" style="background:linear-gradient(135deg,#334155,#64748b)" onclick="v4htOpen(\'audit\')"><span class="v4htBtnIc">🌙</span><span class="v4htBtnTx"><b>Night Audit</b><small>Tonight\'s snapshot — WhatsApp/print</small></span><span class="v4htBtnGo">›</span></button>' +
        '<button class="v4htBtn" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)" onclick="v4htOpen(\'history\')"><span class="v4htBtnIc">📜</span><span class="v4htBtnTx"><b>Guest History</b><small>All past stays — searchable</small></span><span class="v4htBtnGo">›</span></button>' +
        '<button class="v4htBtn" style="background:linear-gradient(135deg,#ea580c,#fb923c)" onclick="v4htOpen(\'reserve\')"><span class="v4htBtnIc">📅</span><span class="v4htBtnTx"><b>Add Reservation</b><small>Book a future guest into a room</small></span><span class="v4htBtnGo">›</span></button>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">🛏️ Room Board <small style="font-size:11px;color:#64748b">(tap a room)</small>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip" onclick="v4htOpen(\'housekeeping\')">🧹 Cleaning</button>' +
          '<button class="v4-chip" onclick="v4htOpen(\'security\')">💂 Security</button>' +
          '<button class="v4-chip" onclick="v4htAddRoom()">➕ Room</button>' +
          '<button class="v4-chip" onclick="v4htRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<div id="v4htBoard" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px"></div>' +
    '</div>';
}

// ── health strip (tappable) ──
function v4htHealth() {
  var el = document.getElementById('v4htHealth'); if (!el) return;
  var s = v4htStats();
  var dep = v4htDeparturesToday();
  var over = v4htOverdue();
  v4htRevenue('month').then(function(rev){
    function H(v,l,c,tap){ return '<div class="v4htH" onclick="v4htOpen(\'' + tap + '\')"><b style="color:' + c + '">' + v + '</b><small>' + l + '</small></div>'; }
    el.innerHTML = '<div style="display:flex;gap:8px">' +
      H(s.pct + '%', '👥 OCCUPIED (' + s.occ + '/' + s.total + ')', s.pct > 80 ? '#dc2626' : '#3b82f6', 'analytics') +
      H(s.free, '✅ FREE ROOMS', '#10b981', 'board') +
      H(dep.length + (over.length ? ' ⚠️' + over.length : ''), '🚪 DEPART TODAY', over.length > 0 ? '#dc2626' : (dep.length > 0 ? '#f97316' : '#94a3b8'), 'movements') +
      H(fmtMoney(rev), '💰 REVENUE (MO)', '#059669', 'analytics') +
      '</div>' +
    (over.length > 0 ? '<div style="margin-top:8px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:8px;text-align:center;font-size:12px;font-weight:700;color:#dc2626">⚠️ ' + over.length + ' guest(s) OVERDUE — past checkout date. Tap Departures to act.</div>' : '') +
    // 🛎️ STAFF MODE BANNER (auto-detected)
    (v4htStaff.length > 0
      ? '<div style="margin-top:8px;background:rgba(13,100,240,.10);border:1px solid rgba(13,100,240,.25);border-radius:10px;padding:8px;text-align:center;font-size:11px;font-weight:700;color:#0d64f0">🛎️ Staff mode: ' +
        v4htStaff.map(function(s){ return s.name; }).join(', ') +
        ' work from the Hotel Desk app — you see everything live, tap any room to override</div>'
      : '');
  });
}

// ── room board (v3 keeper + maintenance toggle) ──
var V4HT_COLORS = { available:'#10b981', occupied:'#ef4444', cleaning:'#f59e0b', maintenance:'#64748b', reserved:'#3b82f6' };
function v4htBoard() {
  var box = document.getElementById('v4htBoard'); if (!box) return;
  if (!v4ht.rooms.length) {
    box.innerHTML = '<div class="placeholder" style="grid-column:1/-1">No rooms yet — tap ➕ Room to add your first one.</div>';
    return;
  }
  var html = '';
  v4ht.rooms.forEach(function(room){
  var c = V4HT_COLORS[room.status] || '#64748b';
  // 🎨 payment status overrides base color for occupied rooms
  if (room.status === 'occupied' && stay) {
    var ps2 = v4htPayStatus(stay);
    if (ps2.overdue) c = '#7f1d1d';           // dark red — overdue
    else if (ps2.renewal) c = '#b45309';      // amber — renewal due
  }    var stay = v4htStayFor(room.id);
    var sub;
    if (room.status === 'occupied' && stay) {
      var ps = v4htPayStatus(stay);
      sub = v4htEscape(stay.guest_name) + ' · ' + ps.t;    } else if (room.status === 'reserved') {
      var rs = v4ht.stays.find(function(s){ return s.room_id === room.id && s.status === 'reserved'; });
      sub = rs ? '📅 ' + String(rs.planned_checkout || rs.check_in || '').slice(5,10) : 'Reserved';
    } else if (room.status === 'cleaning') { sub = 'needs cleaning'; }
    else if (room.status === 'maintenance') { sub = '🔧 under fix'; }
    else { sub = v4htEscape(room.room_type) + ' · ' + fmtMoney(room.base_rate); }
    var maintBtn = (room.status !== 'maintenance' && room.status !== 'occupied')
      ? '<span onclick="event.stopPropagation();v4htMaint(\'' + room.id + '\')" style="position:absolute;top:4px;right:5px;font-size:11px;opacity:.75">🔧</span>' : '';
    html += '<div class="v4htRoom" style="background:' + c + ';position:relative" onclick="v4htOpenRoom(\'' + room.id + '\')">' +
      maintBtn +
      '<b style="font-size:16px">🛏️ ' + v4htEscape(room.room_number) + '</b>' +
      '<small style="opacity:.92;font-size:10px;line-height:1.3;margin-top:3px">' + sub + '</small></div>';
  });
  box.innerHTML = html;
}
async function v4htMaint(roomId) {
  var room = v4htRoom(roomId); if (!room) return;
  if (!await confirm('🔧 Put Room ' + room.room_number + ' under maintenance?\nIt leaves the board until fixed.')) return;
  try {
    await supabaseClient.from('rooms').update({ status: 'maintenance' }).eq('id', roomId);
    room.status = 'maintenance';
    v4htRender();
    alert('🔧 Room ' + room.room_number + ' under maintenance.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4htAddRoom() {
  var num = await prompt('Room number:');
  if (!num) return;
  var rate = parseFloat(await prompt('Nightly rate (Br):'));
  if (isNaN(rate) || rate <= 0) { alert('Rate required.'); return; }
  var type = await prompt('Type (Standard/Deluxe/Suite/Family):', 'Standard') || 'Standard';
  try {
    await supabaseClient.from('rooms').insert([{ shop_id: getShopId(),
      room_number: num.trim(), room_type: type, base_rate: rate, capacity: 2, status: 'available' }]);
    await v4htRefresh();
    alert('✅ Room ' + num + ' added!');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── modal system ──
function v4htModal(title, wide) {
  v4htCloseModal();
  var m = document.createElement('div');
  m.id = 'v4htToolModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px';
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:' + (wide ? '620px' : '540px') + ';margin:10px auto;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + title + '</b>' +
    '<button onclick="v4htCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<div id="v4htToolBody"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4htCloseModal(); });
}
function v4htCloseModal() { var m = document.getElementById('v4htToolModal'); if (m) m.remove(); }

// ═══ ROOM ACTIONS (v3 keeper heart) ═══
function v4htOpenRoom(roomId) {
  var room = v4htRoom(roomId); if (!room) return;
  var stay = v4htStayFor(roomId);
  var body;
  if (room.status === 'available' || room.status === 'cleaning') {
    body = '<p style="font-size:12px;color:#10b981;font-weight:700;margin-bottom:8px">✅ Ready for guests</p>' +
      '<label style="font-size:11px;font-weight:800;color:#475569">Guest name *</label>' +
      '<input class="v4-in" id="ciName" placeholder="Full name">' +
      '<div style="display:flex;gap:6px">' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone (WhatsApp!)</label><input class="v4-in" id="ciPhone" placeholder="Phone"></div>' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">ID / Passport</label><input class="v4-in" id="ciDoc" placeholder="ID number"></div>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Nationality</label><input class="v4-in" id="ciNat" placeholder="e.g., Ethiopian"></div>' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Guests</label><input type="number" class="v4-in" id="ciGuests" value="1" min="1"></div>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Nights *</label><input type="number" class="v4-in" id="ciNights" placeholder="1" min="1"></div>' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Rate/night</label><input type="number" class="v4-in" id="ciRate" value="' + room.base_rate + '"></div>' +
      '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Deposit now</label><input type="number" class="v4-in" id="ciDeposit" placeholder="0"></div>' +
      '</div>' +
      '<button class="v4-btn g" onclick="v4htCheckIn(\'' + roomId + '\')">🚪 Check In</button>';
  } else if (room.status === 'occupied' && stay) {
    body = '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:10px;font-size:13px">' +
      '👤 <b>' + v4htEscape(stay.guest_name) + '</b><br>' +
      '📞 ' + v4htEscape(stay.guest_phone || '—') + ' · 🌍 ' + v4htEscape(stay.guest_nationality || '—') + '<br>' +
      '🚪 In: ' + new Date(stay.check_in).toLocaleDateString() + ' → Out: ' + (stay.planned_checkout ? new Date(stay.planned_checkout).toLocaleDateString() : 'open') + '<br>' +
      '💰 ' + fmtMoney(stay.nightly_rate) + '/night · Deposit: ' + fmtMoney(stay.deposit || 0) + '</div>' +
      '<button class="v4-btn p" onclick="v4htFolio(\'' + stay.id + '\')">📋 View Folio &amp; Checkout</button>' +
      '<button class="v4-btn" style="background:#8b5cf6;margin-top:6px" onclick="v4htQuickCharge(\'' + stay.id + '\')">➕ Add Charge (minibar/laundry)</button>' +
      '<button class="v4-btn o" style="margin-top:6px" onclick="v4htExtend(\'' + stay.id + '\')">🌙 Extend Stay</button>' +
      (stay.guest_phone ? '<button class="v4-btn" style="background:#25D366;margin-top:6px" onclick="v4htGuestWA(\'' + stay.id + '\')">📤 Message Guest (WhatsApp)</button>' : '');
  } else if (room.status === 'reserved') {
    var rs = v4ht.stays.find(function(s){ return s.room_id === roomId && s.status === 'reserved'; });
    body = (rs ? '<div style="background:#eff6ff;border-radius:10px;padding:10px;margin-bottom:10px;font-size:13px">📅 <b>' + v4htEscape(rs.guest_name) + '</b> — expected ' + String(rs.planned_checkout || rs.check_in).slice(0,10) + (rs.guest_phone ? ' · ' + v4htEscape(rs.guest_phone) : '') + '</div>' : '<p style="color:#3b82f6">📅 Reserved</p>') +
      '<button class="v4-btn g" onclick="v4htReserveArrive(\'' + roomId + '\')">🚪 Guest Arrived — Check In</button>' +
      '<button class="v4-btn o" style="margin-top:6px" onclick="v4htCancelResv(\'' + roomId + '\')">❌ Cancel Reservation</button>';
  } else if (room.status === 'maintenance') {
    body = '<p style="color:#64748b">🔧 Under maintenance</p>' +
      '<button class="v4-btn g" onclick="v4htFixed(\'' + roomId + '\')">✅ Fixed → send to Cleaning</button>';
  } else {
    body = '<p>Unknown room state.</p>';
  }
  v4htModal('🛏️ Room ' + v4htEscape(room.room_number) + ' <small style="color:#64748b">(' + v4htEscape(room.room_type) + ' · ' + fmtMoney(room.base_rate) + '/night)</small>', true);
  document.getElementById('v4htToolBody').innerHTML = body;
}

// ═══ CHECK-IN (v3 keeper + WhatsApp confirm) ═══
async function v4htCheckIn(roomId) {
  var room = v4htRoom(roomId); if (!room) return;
  var name = document.getElementById('ciName').value.trim();
  var nights = parseInt(document.getElementById('ciNights').value) || 0;
  var rate = parseFloat(document.getElementById('ciRate').value) || room.base_rate;
  if (!name || nights <= 0) { alert('Guest name and nights are required.'); return; }
  var checkout = new Date(Date.now() + nights * 86400000).toISOString().slice(0,10);
  var phone = document.getElementById('ciPhone').value.trim();
  try {
    const { data: stay, error } = await supabaseClient.from('guest_stays').insert([{
      shop_id: getShopId(), room_id: roomId, guest_name: name,
      guest_phone: phone, guest_id_doc: document.getElementById('ciDoc').value.trim(),
      guest_nationality: document.getElementById('ciNat').value.trim(),
      guests_count: parseInt(document.getElementById('ciGuests').value) || 1,
      check_in: new Date().toISOString(), planned_checkout: checkout,
      nightly_rate: rate, deposit: parseFloat(document.getElementById('ciDeposit').value) || 0,
      status: 'active'
    }]).select().single();
    if (error) throw error;
    await supabaseClient.from('rooms').update({ status: 'occupied' }).eq('id', roomId);
    await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stay.id,
      charge_type: 'room_night', description: 'Room ' + room.room_number + ' — night 1', amount: rate }]);
    v4htCloseModal();
    await v4htRefresh();
    var msg = '✅ Checked in ' + name + ' to Room ' + room.room_number + '!\n\nCheckout: ' + new Date(checkout).toLocaleDateString() + '\nRate: ' + fmtMoney(rate) + '/night';
    // 📤 WhatsApp confirmation (bonus)
    if (phone && await confirm(msg + '\n\n📤 Send booking confirmation to the guest on WhatsApp?')) {
      var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
      var wa = '🏨 ' + shop + '\nHello ' + name + ', welcome!\n\nYour room: ' + room.room_number + ' (' + room.room_type + ')\nRate: ' + fmtMoney(rate) + '/night\nCheck-out: ' + new Date(checkout).toLocaleDateString() + '\n\nEnjoy your stay!';
      window.open('https://wa.me/' + phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(wa), '_blank');
    } else alert(msg);
  } catch(e) { alert('❌ ' + e.message); }
}
function v4htGuestWA(stayId) {
  var stay = v4ht.stays.find(function(s){ return s.id === stayId; }); if (!stay) return;
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var room = v4htRoom(stay.room_id);
  var msg = '🏨 ' + shop + '\nHello ' + stay.guest_name + ',\n\nYour room: ' + (room ? room.room_number : '') +
    '\nRate: ' + fmtMoney(stay.nightly_rate) + '/night\nCheck-out: ' + (stay.planned_checkout ? new Date(stay.planned_checkout).toLocaleDateString() : 'open') +
    '\n\nNeed anything? Reply here!';
  window.open('https://wa.me/' + String(stay.guest_phone || '').replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(msg), '_blank');
}

// ═══ FOLIO (v3 keeper: AUTO-BILLS missing nights!) ═══
async function v4htFolio(stayId) {
  const { data: stay } = await supabaseClient.from('guest_stays').select('*').eq('id', stayId).single();
  if (!stay) return;
  // 🔑 AUTO-BILL missing nights (never undercharge — v3 law)
  const { data: charges } = await supabaseClient.from('folio_charges').select('*').eq('stay_id', stayId).order('charge_date');
  var nightsStayed = Math.max(1, Math.ceil((Date.now() - new Date(stay.check_in)) / 86400000));
  var roomNights = (charges || []).filter(function(c){ return c.charge_type === 'room_night'; }).length;
  if (nightsStayed > roomNights) {
    for (var n = roomNights + 1; n <= nightsStayed; n++) {
      await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stayId,
        charge_type: 'room_night', description: 'Room — night ' + n, amount: stay.nightly_rate }]);
    }
  }
  const { data: list } = await supabaseClient.from('folio_charges').select('*').eq('stay_id', stayId).order('charge_date');
  var icons = { room_night:'🛏️', food:'🍽️', minibar:'🥤', laundry:'👕', spa:'💆', other:'➕' };
  var total = 0, rows = '';
  (list || []).forEach(function(c){
    total += Number(c.amount);
    rows += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px">' +
      '<span>' + (icons[c.charge_type] || '➕') + ' ' + v4htEscape(c.description || c.charge_type) + '</span><b>' + fmtMoney(c.amount) + '</b></div>';
  });
  var due = total - (stay.deposit || 0);
  v4htModal('📋 Folio — ' + v4htEscape(stay.guest_name));
  window._v4htFolio = { stay: stay, total: total, due: due };
  document.getElementById('v4htToolBody').innerHTML =
    '<div style="max-height:35vh;overflow-y:auto">' + (rows || '<p style="color:#94a3b8">No charges.</p>') + '</div>' +
    '<div style="border-top:2px solid #e2e8f0;margin-top:10px;padding-top:10px">' +
    '<div style="display:flex;justify-content:space-between;font-size:13px"><span>Total</span><b>' + fmtMoney(total) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;color:#10b981;font-size:13px"><span>Deposit</span><b>−' + fmtMoney(stay.deposit || 0) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:18px;color:#ef4444"><span><b>BALANCE DUE</b></span><b>' + fmtMoney(due) + '</b></div></div>' +
    '<button class="v4-btn g" style="margin-top:10px" onclick="v4htPayModal(\'' + stayId + '\',' + due + ')">💳 Pay ' + fmtMoney(due) + ' &amp; Check Out</button>';
}
async function v4htQuickCharge(stayId) {
  var amt = parseFloat(await prompt('Charge amount:'));
  if (isNaN(amt) || amt <= 0) return;
  var desc = await prompt('Description (e.g., Minibar — 2 beers):', 'Extra charge');
  if (!desc) return;
  await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stayId,
    charge_type: 'other', description: desc, amount: amt }]);
  v4htCloseModal();
  v4htFolio(stayId);
}
async function v4htExtend(stayId) {
  var extra = parseInt(await prompt('Extend by how many nights?', '1'));
  if (isNaN(extra) || extra <= 0) return;
  const { data: stay } = await supabaseClient.from('guest_stays').select('planned_checkout').eq('id', stayId).single();
  var nd = new Date(new Date(stay.planned_checkout).getTime() + extra * 86400000).toISOString().slice(0,10);
  await supabaseClient.from('guest_stays').update({ planned_checkout: nd }).eq('id', stayId);
  v4htCloseModal();
  alert('✅ New checkout: ' + new Date(nd).toLocaleDateString());
  await v4htRefresh();
}

// ═══ CHECKOUT (v3 keeper: deposit guard + sale + guard alert + WhatsApp receipt) ═══
function v4htPayModal(stayId, due) {
  v4htCloseModal();
  v4htModal('💳 Collect Payment — ' + fmtMoney(due));
  document.getElementById('v4htToolBody').innerHTML =
    '<button class="v4-btn g" onclick="v4htCheckout(\'' + stayId + '\',' + due + ',\'cash\')">💵 Cash</button>' +
    '<button class="v4-btn p" onclick="v4htCheckout(\'' + stayId + '\',' + due + ',\'card\')">💳 Card</button>' +
    '<button class="v4-btn p" onclick="v4htCheckout(\'' + stayId + '\',' + due + ',\'mobile\')">📱 Mobile (Telebirr/CBE)</button>' +
    '<button class="v4-btn o" onclick="v4htCloseModal()">Cancel</button>';
}
async function v4htCheckout(stayId, due, method) {
  due = Number(due) || 0;
  if (due < 0) {
    // 🛡️ v3 keeper guard: deposit exceeds charges (the -1000 quirk family)
    if (!await confirm('💰 Deposit EXCEEDS charges by ' + fmtMoney(Math.abs(due)) + '.\n\nCheckout WITHOUT recording a sale?\n(Refund ' + fmtMoney(Math.abs(due)) + ' to the guest in cash.)')) return;
  } else {
    if (!await confirm('Collect ' + fmtMoney(due) + ' (' + method + ') and check out?')) return;
  }
  try {
    if (due > 0) {
      await supabaseClient.from('sales').insert([{
        items: [{ name: 'Hotel room settlement', qty: 1, price: due, subtotal: due }],
        subtotal: due, discount: 0, tax: 0, total: due, profit: 0,
        payment_method: method, payments: [{ method: method, amount: due }],
        shop_id: getShopId(),
        cashier_id: 'admin', cashier_name: 'Admin',
        shift_id: 'hotel', time: new Date().toISOString(),
        note: 'Hotel checkout', invoice_no: 'HTL-' + Date.now().toString().slice(-8),
        order_type: 'Room Stay'
      }]);
    }
    const { data: stay } = await supabaseClient.from('guest_stays').select('room_id, guest_name, guest_phone').eq('id', stayId).single();
    await supabaseClient.from('guest_stays').update({ status: 'checked_out', actual_checkout: new Date().toISOString() }).eq('id', stayId);
    var room = v4htRoom(stay.room_id);
    await supabaseClient.from('rooms').update({ status: 'cleaning' }).eq('id', stay.room_id);
    await supabaseClient.from('hotel_alerts').insert([{
      shop_id: getShopId(), alert_type: 'checkout',
      room_number: room ? room.room_number : '?', guest_name: stay.guest_name,
      message: 'Guest checked out — verify room property at gate'
    }]);
    v4htCloseModal();
    await v4htRefresh();
    var msg = '✅ Checked out!' + (due <= 0 ? '\n💰 Deposit covered all charges — no sale recorded.' : '\nPayment recorded.') + '\nRoom → 🧹 Cleaning · Guard notified 🔔';
    // 📤 WhatsApp receipt (bonus)
    var f = window._v4htFolio;
    if (stay.guest_phone && f && await confirm(msg + '\n\n📤 Send the folio receipt to the guest on WhatsApp?')) {
      var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
      var wa = '🧾 ' + shop + ' — FOLIO RECEIPT\nGuest: ' + stay.guest_name + '\nDate: ' + new Date().toLocaleDateString() + '\n\nTotal charges: ' + fmtMoney(f.total) + '\nDeposit: -' + fmtMoney(f.stay.deposit || 0) + '\nPaid: ' + fmtMoney(Math.max(0, due)) + '\n\nThank you for staying with us!';
      window.open('https://wa.me/' + String(stay.guest_phone).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(wa), '_blank');
    } else alert(msg);
  } catch(e) { alert('❌ ' + e.message); }
}

// ═══ RESERVATIONS (NEW) ═══
async function v4htReserve() {
  var free = v4ht.rooms.filter(function(r){ return r.status === 'available'; });
  if (!free.length) { alert('No free rooms to reserve.\nFree a room first (or add more rooms).'); return; }
  v4htModal('📅 Add Reservation');
  document.getElementById('v4htToolBody').innerHTML =
    '<label style="font-size:11px;font-weight:800;color:#475569">Guest name *</label>' +
    '<input class="v4-in" id="rvName" placeholder="Full name">' +
    '<div style="display:flex;gap:6px">' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Phone (WhatsApp!)</label><input class="v4-in" id="rvPhone" placeholder="Phone"></div>' +
    '<div style="flex:1"><label style="font-size:11px;font-weight:800;color:#475569">Nights *</label><input type="number" class="v4-in" id="rvNights" value="1" min="1"></div>' +
    '</div>' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Arrival date *</label>' +
    '<input type="date" class="v4-in" id="rvDate" value="' + v4htToday() + '">' +
    '<label style="font-size:11px;font-weight:800;color:#475569">Room</label>' +
    '<select class="v4-in" id="rvRoom">' + free.map(function(r){
      return '<option value="' + r.id + '">' + v4htEscape(r.room_number) + ' — ' + v4htEscape(r.room_type) + ' (' + fmtMoney(r.base_rate) + ')</option>';
    }).join('') + '</select>' +
    '<button class="v4-btn g" onclick="v4htReserveSave()">📅 Reserve</button>';
}
async function v4htReserveSave() {
  var name = document.getElementById('rvName').value.trim();
  var nights = parseInt(document.getElementById('rvNights').value) || 0;
  var date = document.getElementById('rvDate').value;
  var roomId = document.getElementById('rvRoom').value;
  var phone = document.getElementById('rvPhone').value.trim();
  if (!name || nights <= 0 || !date) { alert('Name, date and nights required.'); return; }
  if (date < v4htToday()) { alert('Arrival date cannot be in the past.'); return; }
  var room = v4htRoom(roomId);
  var checkout = new Date(new Date(date + 'T12:00:00').getTime() + nights * 86400000).toISOString().slice(0,10);
  try {
    await supabaseClient.from('guest_stays').insert([{
      shop_id: getShopId(), room_id: roomId, guest_name: name, guest_phone: phone,
      check_in: date + 'T12:00:00', planned_checkout: checkout,
      nightly_rate: room ? room.base_rate : 0, deposit: 0, status: 'reserved'
    }]);
    await supabaseClient.from('rooms').update({ status: 'reserved' }).eq('id', roomId);
    v4htCloseModal();
    await v4htRefresh();
    var msg = '📅 Reserved: ' + name + ' — Room ' + (room ? room.room_number : '?') + ', arriving ' + new Date(date).toLocaleDateString() + ' for ' + nights + ' night(s)';
    if (phone && await confirm(msg + '\n\n📤 Send reservation confirmation on WhatsApp?')) {
      var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
      var wa = '🏨 ' + shop + ' — RESERVATION CONFIRMED\n\nGuest: ' + name + '\nRoom: ' + (room ? room.room_number + ' (' + room.room_type + ')' : '') + '\nArrival: ' + new Date(date).toLocaleDateString() + '\nNights: ' + nights + '\nRate: ' + fmtMoney(room ? room.base_rate : 0) + '/night\n\nSee you soon!';
      window.open('https://wa.me/' + phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(wa), '_blank');
    } else alert(msg);
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4htReserveArrive(roomId) {
  var room = v4htRoom(roomId); if (!room) return;
  var rs = v4ht.stays.find(function(s){ return s.room_id === roomId && s.status === 'reserved'; });
  if (!rs) { alert('No reservation found.'); return; }
  if (!await confirm('🚪 ' + rs.guest_name + ' has arrived — check them in now?\n\nCheck-in date becomes today; planned checkout stays ' + String(rs.planned_checkout).slice(0,10) + '.')) return;
  try {
    await supabaseClient.from('guest_stays').update({ status: 'active', check_in: new Date().toISOString() }).eq('id', rs.id);
    await supabaseClient.from('rooms').update({ status: 'occupied' }).eq('id', roomId);
    await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: rs.id,
      charge_type: 'room_night', description: 'Room ' + room.room_number + ' — night 1', amount: rs.nightly_rate || room.base_rate }]);
    v4htCloseModal();
    await v4htRefresh();
    alert('✅ ' + rs.guest_name + ' checked in to Room ' + room.room_number + '!');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4htCancelResv(roomId) {
  var room = v4htRoom(roomId); if (!room) return;
  if (!await confirm('❌ Cancel the reservation for Room ' + room.room_number + '?\nThe room becomes free.')) return;
  try {
    await supabaseClient.from('guest_stays').update({ status: 'cancelled' }).eq('room_id', roomId).eq('status', 'reserved');
    await supabaseClient.from('rooms').update({ status: 'available' }).eq('id', roomId);
    v4htCloseModal();
    await v4htRefresh();
    alert('✅ Reservation cancelled — room free.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4htFixed(roomId) {
  var room = v4htRoom(roomId); if (!room) return;
  await supabaseClient.from('rooms').update({ status: 'cleaning' }).eq('id', roomId);
  v4htCloseModal();
  await v4htRefresh();
  alert('✅ Room ' + room.room_number + ' fixed → needs cleaning.');
}

// ═══ HOUSEKEEPING ═══
function v4htHousekeepingHTML() {
  var tasks = v4ht.rooms.filter(function(r){ return r.status === 'cleaning'; });
  if (!tasks.length) return '<p style="text-align:center;padding:24px;font-weight:800;color:#10b981;font-size:15px">✨ All rooms clean — great job!</p>';
  var html = '<p style="font-size:12px;color:#64748b;margin-bottom:10px">' + tasks.length + ' room(s) waiting for cleaning:</p>';
  tasks.forEach(function(room){
    html += '<div style="background:#fff7ed;border:2px solid #f59e0b;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">' +
      '<div><b style="font-size:18px">🛏️ ' + v4htEscape(room.room_number) + '</b><br><small style="color:#64748b">' + v4htEscape(room.room_type) + '</small></div>' +
      '<button class="btn-mini" style="background:#10b981;color:#fff;padding:14px 22px;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer" onclick="v4htCleaned(\'' + room.id + '\')">✅ Cleaned</button></div>';
  });
  return html;
}
async function v4htCleaned(roomId) {
  var room = v4htRoom(roomId);
  await supabaseClient.from('rooms').update({ status: 'available' }).eq('id', roomId);
  if (navigator.vibrate) navigator.vibrate(100);
  document.getElementById('v4htToolBody').innerHTML = v4htHousekeepingHTML();
  await v4htRefresh();
  if (room) alert('✅ Room ' + room.room_number + ' clean & ready!');
}

// ═══ SECURITY (v3 keeper) ═══
function v4htSecurityHTML() {
  if (!v4ht.alerts.length) return '<p style="text-align:center;padding:24px;font-weight:800;color:#10b981;font-size:15px">✅ No active alerts. All calm.</p>';
  var html = '<p style="font-size:12px;color:#64748b;margin-bottom:8px">Watch for guests leaving — verify room property at the gate:</p>';
  v4ht.alerts.forEach(function(a){
    html += '<div style="background:#fef2f2;border:2px solid #ef4444;border-radius:14px;padding:14px;margin-bottom:10px">' +
      '<b style="font-size:15px">🔔 ' + v4htEscape(a.message) + '</b><br>' +
      '<span style="font-size:12px">🛏️ Room ' + v4htEscape(a.room_number || '?') + ' · 👤 ' + v4htEscape(a.guest_name || '') + '</span><br>' +
      '<small style="color:#94a3b8">' + new Date(a.created_at).toLocaleString() + '</small><br>' +
      '<button class="btn-mini" style="background:#334155;color:#fff;margin-top:8px;cursor:pointer" onclick="v4htAck(\'' + a.id + '\')">✓ Acknowledged</button></div>';
  });
  return html;
}
async function v4htAck(id) {
  await supabaseClient.from('hotel_alerts').update({ status: 'acknowledged' }).eq('id', id);
  await v4htLoad();
  document.getElementById('v4htToolBody').innerHTML = v4htSecurityHTML();
}

// ═══ ARRIVALS & DEPARTURES (NEW + overdue) ═══
function v4htMovementsHTML() {
  var t = v4htToday();
  var over = v4htOverdue();
  var dep = v4htDeparturesToday();
  var arrivals = v4ht.stays.filter(function(s){ return s.status === 'reserved' && String(s.check_in).slice(0,10) <= t; });
  var html = '';
  if (over.length) {
    html += '<b style="font-size:13px;color:#dc2626">⚠️ OVERDUE — past checkout date (' + over.length + ')</b>';
    over.forEach(function(s){
      var room = v4htRoom(s.room_id);
      var days = Math.floor((new Date(t) - new Date(String(s.planned_checkout).slice(0,10))) / 86400000);
      html += '<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:10px;padding:9px;margin:6px 0;font-size:13px;display:flex;justify-content:space-between;align-items:center">' +
        '<span>⚠️ <b>' + v4htEscape(s.guest_name) + '</b> — Room ' + (room ? room.room_number : '?') + ' <b style="color:#dc2626">(' + days + 'd over!)</b><br><small style="color:#64748b">planned out ' + String(s.planned_checkout).slice(0,10) + ' · ' + fmtMoney(s.nightly_rate) + '/night keeps running</small></span>' +
        '<span style="flex-shrink:0"><button class="btn-mini edit" onclick="v4htExtend(\'' + s.id + '\')">🌙 Extend</button> <button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4htFolio(\'' + s.id + '\')">💳 Check out</button></span></div>';
    });
  }
  html += '<b style="font-size:13px;color:#f97316;display:block;margin-top:8px">🚪 Departing today (' + dep.length + ')</b>';
  if (!dep.length) html += '<p style="font-size:12px;color:#94a3b8;padding:6px 0">Nobody leaves today.</p>';
  dep.forEach(function(s){
    var room = v4htRoom(s.room_id);
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:13px">' +
      '<span>👤 <b>' + v4htEscape(s.guest_name) + '</b> — Room ' + (room ? room.room_number : '?') + '</span>' +
      '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4htFolio(\'' + s.id + '\')">💳 Folio &amp; Check out</button></div>';
  });
  html += '<b style="font-size:13px;color:#3b82f6;display:block;margin-top:10px">📅 Expected arrivals (' + arrivals.length + ')</b>';
  if (!arrivals.length) html += '<p style="font-size:12px;color:#94a3b8;padding:6px 0">No reservations arriving.</p>';
  arrivals.forEach(function(s){
    var room = v4htRoom(s.room_id);
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:13px">' +
      '<span>📅 <b>' + v4htEscape(s.guest_name) + '</b> — Room ' + (room ? room.room_number : '?') + ' <small style="color:#64748b">' + String(s.check_in).slice(0,10) + ' → ' + String(s.planned_checkout).slice(0,10) + '</small></span>' +
      '<button class="btn-mini" style="background:#3b82f6;color:#fff" onclick="v4htReserveArrive(\'' + s.room_id + '\')">🚪 Arrived</button></div>';
  });
  return html;
}

// ═══ FORECAST (NEW: 7-day availability) ═══
function v4htForecastHTML() {
  var s = v4htStats();
  var html = '<p style="font-size:12px;color:#64748b;margin-bottom:8px">Expected free rooms per day — based on planned checkouts. Book walk-ins with confidence!</p>';
  var base = s.free + s.clean + s.maint;   // potentially free today (after cleaning/fix)
  for (var d = 0; d < 7; d++) {
    var day = new Date(); day.setDate(day.getDate() + d);
    var dayKey = day.getFullYear() + '-' + String(day.getMonth()+1).padStart(2,'0') + '-' + String(day.getDate()).padStart(2,'0');
    var freeing = v4ht.stays.filter(function(st){ return st.status === 'active' && String(st.planned_checkout || '').slice(0,10) === dayKey; }).length;
    var free = base + (d === 0 ? 0 : 0);
    // cumulative freeing up to this day
    for (var k = 0; k <= d; k++) {
      var kd = new Date(); kd.setDate(kd.getDate() + k);
      var kdKey = kd.getFullYear() + '-' + String(kd.getMonth()+1).padStart(2,'0') + '-' + String(kd.getDate()).padStart(2,'0');
      if (k > 0 || d === 0) {
        // avoid double count for d=0 handled by base
      }
      if (k > 0 || (d === 0 && k === 0 && false)) {}
    }
    // simpler: recompute cumulative
    var cum = base;
    for (var k2 = 0; k2 <= d; k2++) {
      var kd2 = new Date(); kd2.setDate(kd2.getDate() + k2);
      var kdKey2 = kd2.getFullYear() + '-' + String(kd2.getMonth()+1).padStart(2,'0') + '-' + String(kd2.getDate()).padStart(2,'0');
      var fr = v4ht.stays.filter(function(st){ return st.status === 'active' && String(st.planned_checkout || '').slice(0,10) === kdKey2; }).length;
      if (k2 > 0 || d === 0) cum += fr;
    }
    var taken = v4ht.stays.filter(function(st){ return st.status === 'reserved' && String(st.check_in).slice(0,10) <= dayKey && String(st.planned_checkout || '').slice(0,10) > dayKey; }).length;
    var net = Math.max(0, cum - taken);
    var col = net === 0 ? '#ef4444' : (net <= 1 ? '#f97316' : '#10b981');
    var bar = Math.min(100, Math.round(net / Math.max(1, s.total) * 100));
    var label = d === 0 ? 'Today' : day.toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short' });
    html += '<div style="margin:8px 0">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
      '<span>' + label + (freeing > 0 ? ' <small style="color:#059669">(+' + freeing + ' freeing)</small>' : '') + (taken > 0 ? ' <small style="color:#3b82f6">(' + taken + ' reserved)</small>' : '') + '</span>' +
      '<b style="color:' + col + '">' + net + ' free</b></div>' +
      '<div style="height:8px;background:rgba(148,163,184,.15);border-radius:4px;overflow:hidden">' +
      '<div style="width:' + bar + '%;height:100%;background:' + col + ';border-radius:4px"></div></div></div>';
  }
  return html;
}

// ═══ NIGHT AUDIT (NEW: industry standard) ═══
function v4htAuditText() {
  var s = v4htStats();
  var dep = v4htDeparturesToday();
  var over = v4htOverdue();
  var arrivals = v4ht.stays.filter(function(st){ return st.status === 'reserved' && String(st.check_in).slice(0,10) <= v4htToday(); });
  var shop = (window.__currentShopRow && window.__currentShopRow.name) || 'SmartShop Pro';
  var msg = '🌙 NIGHT AUDIT — ' + shop + '\n' + new Date().toLocaleDateString() + '\n\n' +
    '🏨 Occupancy: ' + s.occ + '/' + s.total + ' (' + s.pct + '%)\n' +
    '✅ Free: ' + s.free + ' · 🧹 Cleaning: ' + s.clean + ' · 📅 Reserved: ' + s.resv + '\n' +
    '🚪 Departed today: ' + dep.length + '\n' +
    '📅 Arrived/arriving: ' + arrivals.length + '\n' +
    (over.length ? '⚠️ OVERDUE guests: ' + over.length + ' — ACTION NEEDED\n' : '') +
    '💰 Est. tonight room value: ' + fmtMoney(v4ht.stays.filter(function(st){ return st.status === 'active'; }).reduce(function(sum, st){ return sum + Number(st.nightly_rate||0); }, 0)) + '\n\n— SmartShop Pro';
  return msg;
}
function v4htAuditHTML() {
  var s = v4htStats();
  var over = v4htOverdue();
  var est = v4ht.stays.filter(function(st){ return st.status === 'active'; }).reduce(function(sum, st){ return sum + Number(st.nightly_rate||0); }, 0);
  function big(v,l,c){ return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:12px 6px;text-align:center"><b style="font-size:16px;display:block;color:' + c + '">' + v + '</b><small style="font-size:9px;font-weight:800;color:#64748b">' + l + '</small></div>'; }
  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
    big(s.pct + '% (' + s.occ + ')', '🏨 OCCUPIED TONIGHT', '#3b82f6') +
    big(fmtMoney(est), '💰 ROOM VALUE TONIGHT', '#059669') +
    big(s.clean, '🧹 TO CLEAN', s.clean > 0 ? '#f97316' : '#94a3b8') +
    big(over.length, '⚠️ OVERDUE', over.length > 0 ? '#ef4444' : '#10b981') +
    '</div>' +
    (over.length ? '<div style="margin-top:8px;background:rgba(239,68,68,.12);border-radius:10px;padding:8px;text-align:center;font-size:12px;font-weight:700;color:#dc2626">⚠️ ' + over.length + ' overdue guest(s) — extend or check out</div>' : '') +
    '<div style="display:flex;gap:6px;margin-top:10px">' +
    '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4htAuditWA()">📤 Send Audit</button>' +
    '<button class="v4-btn p" style="margin:0;flex:1" onclick="v4htAuditPrint()">🖨️ Print</button>' +
    '</div>';
  return html;
}
function v4htAuditWA() {
  var msg = v4htAuditText();
  var phone = prompt('Send night audit to which WhatsApp number?\n(Leave empty to copy)', '');
  if (phone === null) return;
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone) window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function(){ alert('📋 Night audit copied!'); });
}
function v4htAuditPrint() {
  var win = window.open('', '_blank', 'width=420,height=650');
  if (!win) { alert('Allow popups to print.'); return; }
  var msg = v4htAuditText();
  win.document.write('<html><head><title>Night Audit</title><style>body{font-family:monospace;padding:14px;font-size:12px;white-space:pre-wrap}</style></head><body>' + v4htEscape(msg) + '</body></html>');
  win.document.close(); win.focus();
  setTimeout(function(){ win.print(); }, 400);
}

// ═══ GUEST HISTORY (searchable — NEW) ═══
async function v4htHistoryHTML() {
  if (!v4ht.history.length) {
    try {
      const { data } = await supabaseClient.from('guest_stays').select('*').eq('shop_id', getShopId()).eq('status', 'checked_out').order('actual_checkout', { ascending: false }).limit(300);
      v4ht.history = data || [];
    } catch(e) { v4ht.history = []; }
  }
  if (!v4ht.history.length) return '<p style="text-align:center;padding:24px;color:#64748b">No past stays yet — they appear after checkouts.</p>';
  var q = (v4ht.q || '').toLowerCase();
  var rows = v4ht.history.filter(function(s){
    if (!q) return true;
    return (s.guest_name || '').toLowerCase().indexOf(q) !== -1 || (s.guest_phone || '').indexOf(q) !== -1;
  }).slice(0, 100);
  var html = '<input class="v4-in" id="v4htHistQ" placeholder="🔍 Guest name or phone…" style="padding:9px 12px;margin:0 0 8px 0;font-size:13px" value="' + v4htEscape(v4ht.q) + '" oninput="v4ht.q=this.value;document.getElementById(\'v4htHistList\').innerHTML=v4htHistoryList()">' +
    '<div id="v4htHistList">' + v4htHistoryList() + '</div>';
  return html;
}
function v4htHistoryList() {
  var q = (v4ht.q || '').toLowerCase();
  var rows = v4ht.history.filter(function(s){
    if (!q) return true;
    return (s.guest_name || '').toLowerCase().indexOf(q) !== -1 || (s.guest_phone || '').indexOf(q) !== -1;
  }).slice(0, 100);
  if (!rows.length) return '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">No matches.</p>';
  var html = '';
  rows.forEach(function(s){
    var room = v4htRoom(s.room_id);
    var nights = Math.max(1, Math.round((new Date(s.actual_checkout || s.planned_checkout) - new Date(s.check_in)) / 86400000));
    html += '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:12px">' +
      '<span>👤 <b>' + v4htEscape(s.guest_name) + '</b> <small style="color:#64748b">· R' + (room ? room.room_number : '?') + ' · ' + nights + 'n · ' + String(s.check_in).slice(0,10) + '→' + String(s.actual_checkout || s.planned_checkout).slice(0,10) + (s.guest_phone ? ' · ' + v4htEscape(s.guest_phone) : '') + '</small></span>' +
      '<span style="display:flex;gap:4px;flex-shrink:0">' +
      (s.guest_phone ? '<a href="https://wa.me/' + String(s.guest_phone).replace(/[^0-9]/g, '') + '" target="_blank" class="btn-mini" style="background:#25D366;color:#fff;text-decoration:none">📤</a>' : '') +
      '</span></div>';
  });
  return html;
}

// ═══ ANALYTICS (period chips) ═══
function v4htPeriodChips() {
  var P = { today:'📅 Today', week:'📅 This Week', month:'📆 This Month', year:'🗓️ This Year', all:'♾️ All Time' };
  return '<div class="v4PChips">' + Object.keys(P).map(function(p){
    return '<button class="v4PChip' + (v4ht.period === p ? ' active' : '') + '" onclick="v4htSetPeriod(\'' + p + '\')">' + P[p] + '</button>';
  }).join('') + '</div>';
}
function v4htSetPeriod(p) {
  v4ht.period = p;
  var chips = document.querySelector('#v4htToolModal .v4PChips');
  if (chips) chips.outerHTML = v4htPeriodChips();
  var body = document.getElementById('v4htAnalyticsBody');
  if (body) v4htAnalyticsFill();
}
async function v4htAnalyticsFill() {
  var body = document.getElementById('v4htAnalyticsBody'); if (!body) return;
  body.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:14px;font-size:12px">Loading…</p>';
  var start = v4htPeriodStart(v4ht.period).toISOString();
  // stays in period (bounded)
  var stays = [];
  try {
    const { data } = await supabaseClient.from('guest_stays').select('*').eq('shop_id', getShopId()).gte('check_in', start).limit(500);
    stays = data || [];
  } catch(e) {}
  var rev = await v4htRevenue(v4ht.period);
  var totalNights = 0, totalValue = 0, nats = {}, folioBy = {};
  stays.forEach(function(s){
    var nights = Math.max(1, Math.round((new Date(s.actual_checkout || s.planned_checkout || Date.now()) - new Date(s.check_in)) / 86400000));
    totalNights += nights;
    totalValue += nights * Number(s.nightly_rate || 0);
    var n = s.guest_nationality || 'Unknown';
    nats[n] = (nats[n] || 0) + 1;
  });
  // folio breakdown (bounded)
  try {
    const { data: fc } = await supabaseClient.from('folio_charges').select('charge_type, amount').eq('shop_id', getShopId()).gte('charge_date', start.slice(0,10)).limit(500);
    (fc || []).forEach(function(c){ folioBy[c.charge_type] = (folioBy[c.chargeBy = c.charge_type] || 0) + Number(c.amount || 0); });
  } catch(e) {}
  function big(v,l,c){ return '<div style="background:rgba(148,163,184,.08);border-radius:12px;padding:12px 6px;text-align:center"><b style="font-size:16px;display:block;color:' + c + '">' + v + '</b><small style="font-size:9px;font-weight:800;color:#64748b">' + l + '</small></div>'; }
  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
    big(fmtMoney(rev), '💰 REVENUE (' + v4htPeriodLabel() + ')', '#059669') +
    big(stays.length, '🧳 GUEST STAYS', '#3b82f6') +
    big(totalNights ? fmtMoney(totalValue / totalNights) : '—', '📊 AVG NIGHTLY RATE', '#7c3aed') +
    big(stays.length ? (totalNights / stays.length).toFixed(1) + 'n' : '—', '🌙 AVG STAY LENGTH', '#f97316') +
    '</div>';
  // nationality mix
  var natList = Object.keys(nats).map(function(n){ return { n:n, c:nats[n] }; }).sort(function(a,b){ return b.c - a.c; }).slice(0, 8);
  if (natList.length > 1) {
    var nMax = natList[0].c;
    html += '<div style="height:8px"></div><b style="font-size:13px">🌍 Guest nationalities</b>';
    natList.forEach(function(x){
      var pct = Math.round(x.c / nMax * 100);
      html += '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>' + v4htEscape(x.n) + '</span><b>' + x.c + '</b></div>' +
        '<div style="height:8px;background:rgba(148,163,184,.15);border-radius:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:#0d64f0;border-radius:4px"></div></div></div>';
    });
  }
  // folio breakdown
  var folioList = Object.keys(folioBy).filter(function(k){ return folioBy[k] > 0; });
  if (folioList.length) {
    html += '<div style="height:8px"></div><b style="font-size:13px">🧾 Where the money comes from</b>';
    var icons = { room_night:'🛏️ Rooms', food:'🍽️ Food', minibar:'🥤 Minibar', laundry:'👕 Laundry', spa:'💆 Spa', other:'➕ Other' };
    folioList.forEach(function(k){
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:12px"><span>' + (icons[k] || k) + '</span><b>' + fmtMoney(folioBy[k]) + '</b></div>';
    });
  }
  body.innerHTML = html;
}

// ── modal opener ──
async function v4htOpen(tool) {
  if (tool === 'board') { v4htCloseModal(); var b = document.getElementById('v4htBoard'); if (b) b.scrollIntoView({ behavior:'smooth' }); return; }
  if (tool === 'movements') { v4htModal('🚪 Arrivals & Departures'); document.getElementById('v4htToolBody').innerHTML = v4htMovementsHTML(); }
  else if (tool === 'housekeeping') { v4htModal('🧹 Housekeeping Tasks'); document.getElementById('v4htToolBody').innerHTML = v4htHousekeepingHTML(); }
  else if (tool === 'security') { v4htModal('💂 Security Alerts'); document.getElementById('v4htToolBody').innerHTML = v4htSecurityHTML(); }
  else if (tool === 'forecast') { v4htModal('🌅 7-Day Availability Forecast'); document.getElementById('v4htToolBody').innerHTML = v4htForecastHTML(); }
  else if (tool === 'audit') { v4htModal('🌙 Night Audit — ' + new Date().toLocaleDateString()); document.getElementById('v4htToolBody').innerHTML = v4htAuditHTML(); }
  else if (tool === 'history') { v4htModal('📜 Guest History'); document.getElementById('v4htToolBody').innerHTML = '<div id="v4htHistWrap">' + await v4htHistoryHTML() + '</div>'; }
  else if (tool === 'reserve') { v4htReserve(); }
  else if (tool === 'analytics') {
    v4htModal('📊 Hotel Analytics');
    document.getElementById('v4htToolBody').innerHTML = v4htPeriodChips() + '<div id="v4htAnalyticsBody"></div>';
    v4htAnalyticsFill();
  }
}

// ── realtime (v3 keeper) ──
function v4htRealtime() {
  if (window.__v4htChannel) { try { supabaseClient.removeChannel(window.__v4htChannel); } catch(e) {} }
  window.__v4htChannel = supabaseClient.channel('v4-hotel-' + getShopId())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'shop_id=eq.' + getShopId() }, function() {
      v4htLoad().then(v4htRender);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hotel_alerts', filter: 'shop_id=eq.' + getShopId() }, function() {
      v4htLoad().then(function(){
        v4htRender();
        var sec = document.getElementById('v4htToolModal');
        if (sec && document.getElementById('v4htToolBody') && document.getElementById('v4htToolBody').innerHTML.indexOf('Security Alerts') === -1) {
          // only auto-open if security modal already open
        }
      });
    })
    .subscribe();
}

// ── render pipeline ──
function v4htRender() {
  v4htHealth();
  v4htBoard();
}

// ── tab loader ──
V4_TAB_LOADERS[21] = function() {
  v4htEnsureUI();
  v4htLoad().then(function(){
    v4htStaffDetect().then(function(){
      v4htRender();
    });
    v4htRealtime();
  });
};
