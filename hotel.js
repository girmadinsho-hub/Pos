// ══════════════════════════════════════════════════════════════
//  🏨 SMARTSHOP HOTEL ENGINE — rooms, stays, folio, alerts
//  Used by: hotel.html (reception/cleaner/guard) + admin (owner tab)
// ══════════════════════════════════════════════════════════════
var HTL = { rooms: [], stays: [], myRole: null, alerts: [] };

function htlRole() {
    try {
        var p = localStorage.getItem('hotelPosition');
        return p || (localStorage.getItem('kitchenChefName') ? 'Chef' : null);
    } catch(e) { return null; }
}

// ═══ DATA LOADING ═══
async function htlLoad() {
    const { data: rooms } = await supabaseClient.from('rooms').select('*')
        .eq('shop_id', getShopId()).order('room_number');
    HTL.rooms = rooms || [];

    const { data: stays } = await supabaseClient.from('guest_stays').select('*')
        .eq('shop_id', getShopId()).in('status', ['active','reserved'])
        .order('check_in', { ascending: false });
    HTL.stays = stays || [];

    if (htlRole() === 'Guard') await htlLoadAlerts();
}

function htlStayFor(roomId) {
    return HTL.stays.find(function(s){ return s.room_id === roomId && s.status === 'active'; });
}

// ═══ STATS + BOARD ═══
function htlStats() {
    var total = HTL.rooms.length;
    var occ = HTL.rooms.filter(r => r.status === 'occupied').length;
    var avail = HTL.rooms.filter(r => r.status === 'available').length;
    var clean = HTL.rooms.filter(r => r.status === 'cleaning').length;
    var pct = total > 0 ? Math.round(occ / total * 100) : 0;
    return { total: total, occ: occ, avail: avail, clean: clean, pct: pct };
}

function htlBoardHtml() {
    var colors = { available:'#10b981', occupied:'#ef4444', cleaning:'#f59e0b', maintenance:'#64748b', reserved:'#3b82f6' };
    var html = '';
    HTL.rooms.forEach(function(room) {
        var c = colors[room.status] || '#64748b';
        var stay = htlStayFor(room.id);
        var sub = (room.status === 'occupied' && stay)
            ? stay.guest_name + ' · ' + (stay.planned_checkout ? new Date(stay.planned_checkout).toLocaleDateString() : 'open')
            : (room.room_type + ' · ' + htlMoney(room.base_rate));
        html += '<div onclick="htlOpenRoom(\'' + room.id + '\')" style="background:' + c + ';color:#fff;border-radius:12px;padding:10px;cursor:pointer;min-height:82px;display:flex;flex-direction:column;justify-content:center;">' +
            '<b style="font-size:17px;">' + room.room_number + '</b>' +
            '<small style="opacity:.92;font-size:10px;line-height:1.35;margin-top:3px;">' + htlEscape(sub) + '</small></div>';
    });
    return html || '<p style="color:#94a3b8;grid-column:1/-1;text-align:center;padding:20px;">No rooms yet — ask the owner to add rooms in Admin.</p>';
}
function htlMoney(v) { return (typeof fmtMoney === 'function' ? fmtMoney : function(x){ return 'Br ' + Number(x||0).toFixed(2); })(v); }
function htlEscape(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ═══ ROOM ACTIONS MODAL (reception heart) ═══
function htlOpenRoom(roomId) {
    if (htlRole() !== 'Reception') return;
    var room = HTL.rooms.find(r => r.id === roomId);
    if (!room) return;
    var stay = htlStayFor(roomId);
    htlCloseModal('roomActionsModal');

    var body = '<h3 style="margin-bottom:8px;">🛏️ Room ' + htlEscape(room.room_number) + ' <small style="color:#64748b;">(' + htlEscape(room.room_type) + ' · ' + htlMoney(room.base_rate) + '/night)</small></h3>';

    if (room.status === 'available' || room.status === 'cleaning') {
        body += '<p style="font-size:12px;color:#10b981;font-weight:700;margin-bottom:8px;">✅ Ready for guests</p>' +
            '<input class="htl-input" id="ciName" placeholder="Guest name *">' +
            '<input class="htl-input" id="ciPhone" placeholder="Phone">' +
            '<input class="htl-input" id="ciDoc" placeholder="Passport / ID number">' +
            '<input class="htl-input" id="ciNationality" placeholder="Nationality">' +
            '<div style="display:flex;gap:6px;">' +
            '<input type="number" class="htl-input" id="ciNights" placeholder="Nights *" style="flex:1;">' +
            '<input type="number" class="htl-input" id="ciRate" value="' + room.base_rate + '" placeholder="Rate/night" style="flex:1;">' +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
            '<input type="number" class="htl-input" id="ciGuests" placeholder="Guests" value="1" style="flex:1;">' +
            '<input type="number" class="htl-input" id="ciDeposit" placeholder="Deposit now (optional)" style="flex:1;">' +
            '</div>' +
            '<button class="htl-btn success" onclick="htlCheckIn(\'' + roomId + '\')">🚪 Check In</button>';
    } else if (room.status === 'occupied' && stay) {
        body += '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:10px;font-size:13px;">' +
            '👤 <b>' + htlEscape(stay.guest_name) + '</b><br>' +
            '📞 ' + htlEscape(stay.guest_phone || '—') + ' · 🌍 ' + htlEscape(stay.guest_nationality || '—') + '<br>' +
            '🚪 In: ' + new Date(stay.check_in).toLocaleDateString() + ' → Out: ' + (stay.planned_checkout ? new Date(stay.planned_checkout).toLocaleDateString() : 'open') + '<br>' +
            '💰 ' + htlMoney(stay.nightly_rate) + '/night · Deposit: ' + htlMoney(stay.deposit || 0) + '</div>' +
            '<button class="htl-btn primary" onclick="htlOpenFolio(\'' + stay.id + '\')">📋 View Folio & Checkout</button>' +
            '<button class="htl-btn outline" onclick="htlQuickCharge(\'' + stay.id + '\')">➕ Add Charge (minibar/laundry)</button>' +
            '<button class="htl-btn outline" onclick="htlExtendStay(\'' + stay.id + '\')">🌙 Extend Stay</button>';
    } else if (room.status === 'reserved') {
        body += '<p style="color:#3b82f6;">📅 Reserved</p>' +
            '<button class="htl-btn success" onclick="htlSetRoomStatus(\'' + roomId + '\',\'available\')">🚪 Guest Arrived — Check In</button>' +
            '<button class="htl-btn outline" onclick="htlSetRoomStatus(\'' + roomId + '\',\'available\')">❌ Cancel Reservation</button>';
    } else if (room.status === 'maintenance') {
        body += '<p style="color:#64748b;">🔧 Under maintenance</p>' +
            '<button class="htl-btn success" onclick="htlSetRoomStatus(\'' + roomId + '\',\'cleaning\')">✅ Fixed → Cleaning</button>';
    }

    if (room.status !== 'occupied') {
        body += '<div style="display:flex;gap:6px;margin-top:8px;">' +
            (room.status !== 'maintenance' ? '<button class="htl-btn outline" style="flex:1;" onclick="htlSetRoomStatus(\'' + roomId + '\',\'maintenance\')">🔧</button>' : '') +
            (room.status === 'cleaning' ? '<button class="htl-btn success" style="flex:1;" onclick="htlSetRoomStatus(\'' + roomId + '\',\'available\')">✅ Cleaned</button>' : '') +
            '</div>';
    }
    body += '<button class="htl-btn outline" onclick="htlCloseModal(\'roomActionsModal\')">Close</button>';
    htlModal('roomActionsModal', body);
}

function htlModal(id, bodyHtml) {
    var m = document.createElement('div');
    m.className = 'htl-modal'; m.id = id;
    m.innerHTML = '<div class="htl-modal-content">' + bodyHtml + '</div>';
    m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
    document.body.appendChild(m);
}
function htlCloseModal(id) { var m = document.getElementById(id); if (m) m.remove(); }

// ═══ CHECK-IN ═══
async function htlCheckIn(roomId) {
    var room = HTL.rooms.find(r => r.id === roomId);
    var name = document.getElementById('ciName').value.trim();
    var nights = parseInt(document.getElementById('ciNights').value) || 0;
    var rate = parseFloat(document.getElementById('ciRate').value) || room.base_rate;
    if (!name || nights <= 0) { alert('Guest name and nights are required.'); return; }
    var checkout = new Date(Date.now() + nights * 86400000).toISOString().slice(0,10);
    try {
        const { data: stay, error } = await supabaseClient.from('guest_stays').insert([{
            shop_id: getShopId(), room_id: roomId, guest_name: name,
            guest_phone: document.getElementById('ciPhone').value.trim(),
            guest_id_doc: document.getElementById('ciDoc').value.trim(),
            guest_nationality: document.getElementById('ciNationality').value.trim(),
            guests_count: parseInt(document.getElementById('ciGuests').value) || 1,
            check_in: new Date().toISOString(), planned_checkout: checkout,
            nightly_rate: rate, deposit: parseFloat(document.getElementById('ciDeposit').value) || 0,
            status: 'active'
        }]).select().single();
        if (error) throw error;
        await supabaseClient.from('rooms').update({ status: 'occupied' }).eq('id', roomId);
        await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stay.id,
            charge_type: 'room_night', description: 'Room ' + room.room_number + ' — night 1', amount: rate }]);
        htlCloseModal('roomActionsModal');
        await htlLoad(); htlRenderReception();
        alert('✅ ' + name + ' checked in to Room ' + room.room_number + '!\n\nCheckout: ' + new Date(checkout).toLocaleDateString() + '\nRate: ' + htlMoney(rate) + '/night');
    } catch(e) { alert('❌ ' + e.message); }
}

// ═══ FOLIO (auto-bills missing nights!) ═══
async function htlOpenFolio(stayId) {
    const { data: stay } = await supabaseClient.from('guest_stays').select('*').eq('id', stayId).single();
    if (!stay) return;
    const { data: charges } = await supabaseClient.from('folio_charges').select('*').eq('stay_id', stayId).order('charge_date');

    var nightsStayed = Math.max(1, Math.ceil((Date.now() - new Date(stay.check_in)) / 86400000));
    var roomNights = (charges || []).filter(c => c.charge_type === 'room_night').length;
    if (nightsStayed > roomNights) {
        for (var n = roomNights + 1; n <= nightsStayed; n++) {
            await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stayId,
                charge_type: 'room_night', description: 'Room — night ' + n, amount: stay.nightly_rate }]);
        }
    }
    const { data: chargesFinal } = await supabaseClient.from('folio_charges').select('*').eq('stay_id', stayId).order('charge_date');
    var list = chargesFinal || [];

    var icons = { room_night:'🛏️', food:'🍽️', minibar:'🥤', laundry:'👕', spa:'💆', other:'➕' };
    var total = 0, rows = '';
    list.forEach(function(c) {
        total += Number(c.amount);
        rows += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px;">' +
            '<span>' + (icons[c.charge_type] || '➕') + ' ' + htlEscape(c.description || c.charge_type) + '</span><b>' + htlMoney(c.amount) + '</b></div>';
    });
    var due = total - (stay.deposit || 0);

    htlCloseModal('folioModal');
    htlModal('folioModal',
        '<h3>📋 Folio — ' + htlEscape(stay.guest_name) + '</h3>' +
        '<div style="max-height:38vh;overflow-y:auto;">' + (rows || '<p style="color:#94a3b8;">No charges.</p>') + '</div>' +
        '<div style="border-top:2px solid #e2e8f0;margin-top:10px;padding-top:10px;">' +
        '<div style="display:flex;justify-content:space-between;"><span>Total</span><b>' + htlMoney(total) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;color:#10b981;"><span>Deposit</span><b>−' + htlMoney(stay.deposit || 0) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:18px;color:#ef4444;"><span><b>BALANCE DUE</b></span><b>' + htlMoney(due) + '</b></div></div>' +
        '<button class="htl-btn success" onclick="htlPayModal(\'' + stayId + '\',' + due + ')">💳 Pay ' + htlMoney(due) + ' & Check Out</button>' +
        '<button class="htl-btn outline" onclick="htlCloseModal(\'folioModal\')">Close</button>');
}

// ═══ PAYMENT (reception collects — cash/card/mobile) ═══
function htlPayModal(stayId, due) {
    htlCloseModal('folioModal');
    htlModal('payModal',
        '<h3>💳 Collect Payment — ' + htlMoney(due) + '</h3>' +
        '<p style="font-size:12px;color:#64748b;">How is the guest paying?</p>' +
        '<button class="htl-btn success" onclick="htlCheckout(\'' + stayId + '\',\'' + due + '\',\'cash\')">💵 Cash</button>' +
        '<button class="htl-btn primary" onclick="htlCheckout(\'' + stayId + '\',\'' + due + '\',\'card\')">💳 Card</button>' +
        '<button class="htl-btn primary" onclick="htlCheckout(\'' + stayId + '\',\'' + due + '\',\'mobile\')">📱 Mobile (Telebirr/CBE)</button>' +
        '<button class="htl-btn outline" onclick="htlCloseModal(\'payModal\')">Cancel</button>');
}

async function htlCheckout(stayId, due, method) {
    if (!await confirm('Collect ' + htlMoney(due) + ' (' + method + ') and check out?')) return;
    try {
        // 1. Record as SALE (dashboards + reports + fiscal all see it!)
        await supabaseClient.from('sales').insert([{
            items: [{ name: 'Hotel room settlement', qty: 1, price: Number(due), subtotal: Number(due) }],
            subtotal: Number(due), discount: 0, tax: 0, total: Number(due), profit: 0,
            payment_method: method, payments: [{ method: method, amount: Number(due) }],
            shop_id: getShopId(),
            cashier_id: localStorage.getItem('hotelStaffId') || 'reception',
            cashier_name: localStorage.getItem('hotelStaffName') || 'Reception',
            shift_id: 'hotel', time: new Date().toISOString(),
            note: 'Hotel checkout', invoice_no: 'HTL-' + Date.now().toString().slice(-8),
            order_type: 'Room Stay'
        }]);
        // 2. Close the stay + room → cleaning
        const { data: stay } = await supabaseClient.from('guest_stays').select('room_id, guest_name').eq('id', stayId).single();
        await supabaseClient.from('guest_stays').update({ status: 'checked_out', actual_checkout: new Date().toISOString() }).eq('id', stayId);
        var room = HTL.rooms.find(r => r.id === stay.room_id);
        await supabaseClient.from('rooms').update({ status: 'cleaning' }).eq('id', stay.room_id);
        // 3. 🔔 GUARD ALERT — guest leaving
        await supabaseClient.from('hotel_alerts').insert([{
            shop_id: getShopId(), alert_type: 'checkout',
            room_number: room ? room.room_number : '?', guest_name: stay.guest_name,
            message: 'Guest checked out — verify room property at gate'
        }]);
        htlCloseModal('payModal');
        await htlLoad(); htlRenderReception();
        alert('✅ Checked out! Payment recorded.\nRoom → 🧹 Cleaning · Guard notified 🔔');
    } catch(e) { alert('❌ ' + e.message); }
}

// ═══ QUICK CHARGE / EXTEND ═══
async function htlQuickCharge(stayId) {
    var amt = parseFloat(await prompt('Charge amount:'));
    if (isNaN(amt) || amt <= 0) return;
    var desc = await prompt('Description (e.g., Minibar — 2 beers):', 'Extra charge');
    if (!desc) return;
    await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stayId,
        charge_type: 'other', description: desc, amount: amt }]);
    htlCloseModal('roomActionsModal');
    htlOpenFolio(stayId);
}
async function htlExtendStay(stayId) {
    var extra = parseInt(await prompt('Extend by how many nights?', '1'));
    if (isNaN(extra) || extra <= 0) return;
    const { data: stay } = await supabaseClient.from('guest_stays').select('planned_checkout').eq('id', stayId).single();
    var nd = new Date(new Date(stay.planned_checkout).getTime() + extra * 86400000).toISOString().slice(0,10);
    await supabaseClient.from('guest_stays').update({ planned_checkout: nd }).eq('id', stayId);
    htlCloseModal('roomActionsModal');
    alert('✅ New checkout: ' + new Date(nd).toLocaleDateString());
    await htlLoad(); htlRenderReception();
}

// ═══ CLEANER MODE ═══
async function htlRenderCleaner() {
    var s = htlStats();
    document.getElementById('htlContent').innerHTML =
        '<h2>🧹 My Cleaning Tasks</h2>' +
        '<p style="color:#94a3b8;font-size:13px;">Rooms waiting for you:</p><div style="margin-top:12px;">';
    var tasks = HTL.rooms.filter(r => r.status === 'cleaning');
    if (tasks.length === 0) {
        document.getElementById('htlContent').innerHTML += '<p style="color:#10b981;font-weight:bold;padding:20px;text-align:center;">✨ All rooms clean — great job!</p>';
    } else {
        tasks.forEach(function(room) {
            document.getElementById('htlContent').innerHTML +=
                '<div style="background:#fff7ed;border:2px solid #f59e0b;border-radius:14px;padding:16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">' +
                '<div><b style="font-size:20px;">🛏️ ' + htlEscape(room.room_number) + '</b><br><small style="color:#64748b;">' + htlEscape(room.room_type) + '</small></div>' +
                '<button onclick="htlCleaned(\'' + room.id + '\')" style="background:#10b981;color:#fff;border:none;padding:14px 22px;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;">✅ Cleaned</button></div>';
        });
    }
    document.getElementById('htlContent').innerHTML += '</div>';
}
async function htlCleaned(roomId) {
    await supabaseClient.from('rooms').update({ status: 'available' }).eq('id', roomId);
    if (navigator.vibrate) navigator.vibrate(100);
    await htlLoad(); htlRenderCleaner();
}

// ═══ GUARD MODE ═══
async function htlLoadAlerts() {
    const { data } = await supabaseClient.from('hotel_alerts').select('*')
        .eq('shop_id', getShopId()).eq('status', 'pending').order('created_at', { ascending: false });
    HTL.alerts = data || [];
}
async function htlRenderGuard() {
    await htlLoadAlerts();
    var html = '<h2>💂 Security Alerts</h2><p style="color:#94a3b8;font-size:13px;">Watch for guests leaving:</p><div style="margin-top:12px;">';
    if (HTL.alerts.length === 0) {
        html += '<p style="color:#10b981;padding:20px;text-align:center;">✅ No active alerts. All calm.</p>';
    } else {
        HTL.alerts.forEach(function(a) {
            html += '<div style="background:#fef2f2;border:2px solid #ef4444;border-radius:14px;padding:16px;margin-bottom:10px;">' +
                '<b style="font-size:16px;">🔔 ' + htlEscape(a.message) + '</b><br>' +
                '<span style="font-size:13px;">🛏️ Room ' + htlEscape(a.room_number || '?') + ' · 👤 ' + htlEscape(a.guest_name || '') + '</span><br>' +
                '<small style="color:#94a3b8;">' + new Date(a.created_at).toLocaleTimeString() + '</small><br>' +
                '<button onclick="htlAckAlert(\'' + a.id + '\')" style="background:#334155;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:700;margin-top:8px;cursor:pointer;">✓ Acknowledged</button></div>';
        });
    }
    document.getElementById('htlContent').innerHTML = html + '</div>';
}
async function htlAckAlert(id) {
    await supabaseClient.from('hotel_alerts').update({ status: 'acknowledged' }).eq('id', id);
    htlRenderGuard();
}

// ═══ RECEPTION RENDER ═══
function htlRenderReception() {
    var s = htlStats();
    document.getElementById('htlContent').innerHTML =
        '<div class="htl-stats">' +
        '<div class="htl-stat"><b>' + s.total + '</b><small>🛏️ Total</small></div>' +
        '<div class="htl-stat" style="background:#ecfdf5;"><b>' + s.avail + '</b><small>✅ Free</small></div>' +
        '<div class="htl-stat" style="background:#fef2f2;"><b>' + s.occ + ' (' + s.pct + '%)</b><small>👥 Occupied</small></div>' +
        '<div class="htl-stat" style="background:#fff7ed;"><b>' + s.clean + '</b><small>🧹 Cleaning</small></div>' +
        '</div>' +
        '<h2 style="margin-top:16px;">🛏️ Room Board <small style="font-size:11px;color:#94a3b8;">(tap a room)</small></h2>' +
        '<div class="htl-board">' + htlBoardHtml() + '</div>';
}

// ═══ REALTIME (all screens live) ═══
function htlRealtime() {
    window.__htlChannel = supabaseClient.channel('hotel-' + getShopId())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'shop_id=eq.' + getShopId() }, function() {
            htlLoad().then(function(){ htlRenderMyMode(); });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hotel_alerts', filter: 'shop_id=eq.' + getShopId() }, function(payload) {
            var a = payload.new || {};
            if (htlRole() === 'Guard') {
                try { navigator.vibrate([300,150,300]); } catch(e) {}
                try { htlBeep(); } catch(e) {}
                htlRenderGuard();
            }
        })
        .subscribe();
}
function htlBeep() {
    try {
        var ctx = window.__htlAudio || new (window.AudioContext || window.webkitAudioContext)();
        window.__htlAudio = ctx;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; g.gain.value = 0.3;
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}
function htlRenderMyMode() {
    var r = htlRole();
    if (r === 'Reception') htlRenderReception();
    else if (r === 'Cleaner') htlRenderCleaner();
    else if (r === 'Guard') htlRenderGuard();
}
