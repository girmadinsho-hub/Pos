// ══════════════════════════════════════════════════════════════
//  🏨 SMARTSHOP HOTEL MODULE — complete hotel domain
//  Rooms • Check-in/out • Folio billing • Housekeeping • History
//  Loaded lazily (only for hotel shops, only when Hotel tab opens)
// ══════════════════════════════════════════════════════════════

// ─── Loader guard: make sure shared dependencies exist ───
if (typeof getShopId !== 'function' || typeof supabaseClient === 'undefined') {
    console.warn('HOTEL: shared.js not loaded yet — functions will work once page finishes loading');
}

// ═══ HOTEL STATE ═══
var hotelRooms = [], hotelStays = [];
var chargesNow = [];

// ═══ MAIN BOARD ═══
async function loadHotelBoard() {
    // ... (paste EVERYTHING from my previous hotel message:
    //      loadHotelBoard, statCard, openRoomEditor, saveRoom, deleteRoom,
    //      openRoomActions, checkIn, openFolio, checkOut, addQuickCharge,
    //      extendStay, setRoomStatus, checkInReserved, loadArrivalsList,
    //      loadStayHistory)
    //      — the complete functions exactly as I gave them)
}

// ═══ LAZY SELF-START: if the Hotel tab is open when this file loads, render now ═══
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var tab = document.getElementById('tab21');
        if (tab && tab.style.display !== 'none') loadHotelBoard();
    }, 800);
});

var hotelRooms = [], hotelStays = [];

async function loadHotelBoard() {
    // Load rooms + active stays
    const { data: rooms } = await supabaseClient.from('rooms').select('*').eq('shop_id', getShopId()).order('room_number');
    hotelRooms = rooms || [];
    const { data: stays } = await supabaseClient.from('guest_stays').select('*')
        .eq('shop_id', getShopId()).in('status', ['active', 'reserved']).order('check_in', { ascending: false });
    hotelStays = stays || [];

    // Stats
    var total = hotelRooms.length;
    var occupied = hotelRooms.filter(r => r.status === 'occupied').length;
    var available = hotelRooms.filter(r => r.status === 'available').length;
    var cleaning = hotelRooms.filter(r => r.status === 'cleaning').length;
    var reserved = hotelRooms.filter(r => r.status === 'reserved').length;
    var occupancy = total > 0 ? Math.round(occupied / total * 100) : 0;
    document.getElementById('hotelStatsRow').innerHTML =
        statCard('🛏️ Total', total, '#2563eb') + statCard('✅ Available', available, '#10b981') +
        statCard('👥 Occupied', occupied + ' (' + occupancy + '%)', '#f59e0b') +
        statCard('🧹 Cleaning', cleaning, '#8b5cf6');

    // Room board
    var html = '';
    hotelRooms.forEach(function(room) {
        var colors = { available:'#10b981', occupied:'#ef4444', cleaning:'#f59e0b', maintenance:'#64748b', reserved:'#3b82f6' };
        var c = colors[room.status] || '#64748b';
        var stay = hotelStays.find(s => s.room_id === room.id && s.status === 'active');
        var sub = room.status === 'occupied' && stay
            ? stay.guest_name + ' · out ' + (stay.planned_checkout ? new Date(stay.planned_checkout).toLocaleDateString() : '—')
            : (room.room_type + ' · ' + fmtMoney(room.base_rate) + '/night');
        html += '<div onclick="openRoomActions(\'' + room.id + '\')" style="background:' + c + '; color:white; border-radius:12px; padding:10px; cursor:pointer; min-height:80px; display:flex; flex-direction:column; justify-content:center;">' +
            '<b style="font-size:17px;">' + room.room_number + '</b>' +
            '<small style="opacity:.9; font-size:10px; line-height:1.3; margin-top:3px;">' + sanitize(sub) + '</small></div>';
    });
    document.getElementById('roomBoard').innerHTML = html || '<p style="color:#94a3b8;">No rooms yet — tap "➕ Add Room" to build your hotel.</p>';

    loadArrivalsList();
    loadStayHistory();
}
function statCard(label, val, color) {
    return '<div class="stat-card" style="border-left-color:' + color + ';"><div class="stat-label">' + label + '</div><div class="stat-value" style="font-size:18px;">' + val + '</div></div>';
}

// ═══ ROOM EDITOR (add/edit rooms) ═══
function openRoomEditor(roomId) {
    var room = roomId ? hotelRooms.find(r => r.id === roomId) : null;
    var num = room ? room.room_number : '';
    var type = room ? room.room_type : 'Standard';
    var rate = room ? room.base_rate : '';
    var cap = room ? room.capacity : 2;

    var old = document.getElementById('roomEditorModal'); if (old) old.remove();
    var m = document.createElement('div'); m.className = 'modal active'; m.id = 'roomEditorModal';
    m.innerHTML = '<div class="modal-content"><h3>' + (room ? '✏️ Edit Room ' + num : '➕ Add Room') + '</h3>' +
        '<input class="form-input" id="reNum" placeholder="Room number *" value="' + num + '">' +
        '<select class="form-select" id="reType">' +
        ['Standard','Deluxe','Suite','Family','Single','Double'].map(function(t){ return '<option ' + (t===type?'selected':'') + '>' + t + '</option>'; }).join('') + '</select>' +
        '<input type="number" class="form-input" id="reRate" placeholder="Nightly rate *" value="' + rate + '">' +
        '<input type="number" class="form-input" id="reCap" placeholder="Capacity (guests)" value="' + cap + '">' +
        '<div class="flex-row"><button class="btn btn-success" onclick="saveRoom(\'' + (roomId || '') + '\')">💾 Save</button>' +
        (room ? '<button class="btn btn-danger" onclick="deleteRoom(\'' + roomId + '\')">🗑️</button>' : '') +
        '<button class="btn btn-outline" onclick="document.getElementById(\'roomEditorModal\').classList.remove(\'active\')">Cancel</button></div></div>';
    document.body.appendChild(m);
}
async function saveRoom(roomId) {
    var num = document.getElementById('reNum').value.trim();
    var rate = parseFloat(document.getElementById('reRate').value) || 0;
    if (!num || rate <= 0) { alert('Room number and rate are required.'); return; }
    try {
        if (roomId) {
            await supabaseClient.from('rooms').update({
                room_number: num, room_type: document.getElementById('reType').value,
                base_rate: rate, capacity: parseInt(document.getElementById('reCap').value) || 2
            }).eq('id', roomId);
        } else {
            await supabaseClient.from('rooms').insert([{ shop_id: getShopId(), room_number: num,
                room_type: document.getElementById('reType').value, base_rate: rate,
                capacity: parseInt(document.getElementById('reCap').value) || 2, status: 'available' }]);
        }
        document.getElementById('roomEditorModal').classList.remove('active');
        loadHotelBoard();
    } catch(e) { alert('❌ ' + e.message); }
}
async function deleteRoom(roomId) {
    if (!await confirm('Delete this room permanently?')) return;
    await supabaseClient.from('rooms').delete().eq('id', roomId);
    document.getElementById('roomEditorModal').classList.remove('active');
    loadHotelBoard();
}

// ═══ ROOM ACTIONS (the heart — tap any room) ═══
function openRoomActions(roomId) {
    var room = hotelRooms.find(r => r.id === roomId);
    if (!room) return;
    var stay = hotelStays.find(s => s.room_id === roomId && s.status === 'active');

    var old = document.getElementById('roomActionsModal'); if (old) old.remove();
    var m = document.createElement('div'); m.className = 'modal active'; m.id = 'roomActionsModal';
    var body = '<h3>🛏️ Room ' + room.room_number + ' <small style="color:#64748b;">(' + room.room_type + ')</small></h3>';

    if (room.status === 'available' || room.status === 'cleaning') {
        // CHECK-IN form
        body += '<p style="font-size:12px;color:#10b981;font-weight:700;">✅ Available — ready for guests</p>' +
            '<input class="form-input" id="ciName" placeholder="Guest name *">' +
            '<input class="form-input" id="ciPhone" placeholder="Phone">' +
            '<input class="form-input" id="ciDoc" placeholder="Passport / ID number">' +
            '<input class="form-input" id="ciNationality" placeholder="Nationality">' +
            '<div style="display:flex;gap:6px;">' +
            '<input type="number" class="form-input" id="ciNights" placeholder="Nights *" style="flex:1;">' +
            '<input type="number" class="form-input" id="ciRate" value="' + room.base_rate + '" placeholder="Rate/night" style="flex:1;">' +
            '</div>' +
            '<input type="number" class="form-input" id="ciGuests" placeholder="Number of guests" value="1">' +
            '<input type="number" class="form-input" id="ciDeposit" placeholder="Deposit paid now (optional)">' +
            '<button class="btn btn-success" onclick="checkIn(\'' + roomId + '\')">🚪 Check In</button>';
    } else if (room.status === 'occupied' && stay) {
        // OCCUPIED — view folio, add charges, check out
        body += '<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:10px;">' +
            '👤 <b>' + sanitize(stay.guest_name) + '</b><br>' +
            '📞 ' + sanitize(stay.guest_phone || '—') + ' · 🌍 ' + sanitize(stay.guest_nationality || '—') + '<br>' +
            '🚪 In: ' + new Date(stay.check_in).toLocaleDateString() + ' → Out: ' + (stay.planned_checkout ? new Date(stay.planned_checkout).toLocaleDateString() : 'open') + '<br>' +
            '💰 Rate: ' + fmtMoney(stay.nightly_rate) + '/night · Deposit: ' + fmtMoney(stay.deposit || 0) + '</div>' +
            '<button class="btn btn-primary" onclick="openFolio(\'' + stay.id + '\')">📋 View Folio & Checkout</button>' +
            '<button class="btn btn-outline" onclick="addQuickCharge(\'' + stay.id + '\')">➕ Add Charge (minibar/laundry)</button>' +
            '<button class="btn btn-outline" onclick="extendStay(\'' + stay.id + '\')">🌙 Extend Stay</button>';
    } else if (room.status === 'maintenance') {
        body += '<p style="color:#64748b;">🔧 Under maintenance</p>' +
            '<button class="btn btn-success" onclick="setRoomStatus(\'' + roomId + '\',\'cleaning\')">✅ Fixed → Send to Cleaning</button>';
    } else if (room.status === 'reserved') {
        body += '<p style="color:#3b82f6;">📅 Reserved</p>' +
            '<button class="btn btn-success" onclick="checkInReserved(\'' + roomId + '\')">🚪 Guest Arrived — Check In</button>' +
            '<button class="btn btn-outline" onclick="setRoomStatus(\'' + roomId + '\',\'available\')">❌ Cancel Reservation</button>';
    }

    // Housekeeping + maintenance always available (when not occupied)
    if (room.status !== 'occupied') {
        body += '<div style="display:flex;gap:6px;margin-top:8px;">' +
            (room.status !== 'maintenance' ? '<button class="btn btn-outline" style="flex:1;" onclick="setRoomStatus(\'' + roomId + '\',\'maintenance\')">🔧 Maintenance</button>' : '') +
            (room.status === 'cleaning' ? '<button class="btn btn-success" style="flex:1;" onclick="setRoomStatus(\'' + roomId + '\',\'available\')">✅ Cleaned → Available</button>' : '') +
            '</div>';
    }
    body += '<button class="btn btn-outline" onclick="openRoomEditor(\'' + roomId + '\')">✏️ Edit Room</button>';
    body += '<button class="btn btn-outline" onclick="document.getElementById(\'roomActionsModal\').classList.remove(\'active\')">Close</button>';
    m.innerHTML = '<div class="modal-content" style="max-height:85vh;overflow-y:auto;">' + body + '</div>';
    document.body.appendChild(m);
}

// ═══ CHECK-IN ═══
async function checkIn(roomId) {
    var room = hotelRooms.find(r => r.id === roomId);
    var name = document.getElementById('ciName').value.trim();
    var nights = parseInt(document.getElementById('ciNights').value) || 0;
    var rate = parseFloat(document.getElementById('ciRate').value) || room.base_rate;
    if (!name || nights <= 0) { alert('Guest name and nights are required.'); return; }
    var checkout = new Date(Date.now() + nights * 86400000).toISOString().slice(0, 10);
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
        // First night charged immediately to folio
        await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stay.id,
            charge_type: 'room_night', description: 'Room ' + room.room_number + ' — night 1', amount: rate }]);
        document.getElementById('roomActionsModal').classList.remove('active');
        alert('✅ ' + name + ' checked in to Room ' + room.room_number + '!\n\nCheckout: ' + new Date(checkout).toLocaleDateString() + '\nRate: ' + fmtMoney(rate) + '/night');
        loadHotelBoard();
    } catch(e) { alert('❌ ' + e.message); }
}

// ═══ FOLIO & CHECKOUT ═══
async function openFolio(stayId) {
    const { data: charges } = await supabaseClient.from('folio_charges').select('*').eq('stay_id', stayId).order('charge_date');
    const { data: stayR } = await supabaseClient.from('guest_stays').select('*').eq('id', stayId).single();
    var stay = stayR;
    if (!stay) return;

    // Add any missing nights (auto-billing!)
    var nightsStayed = Math.max(1, Math.ceil((Date.now() - new Date(stay.check_in)) / 86400000));
    var roomNights = (charges || []).filter(c => c.charge_type === 'room_night').length;
    if (nightsStayed > roomNights) {
        for (var n = roomNights + 1; n <= nightsStayed; n++) {
            await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stayId,
                charge_type: 'room_night', description: 'Room — night ' + n, amount: stay.nightly_rate }]);
        }
        const { data: charges2 } = await supabaseClient.from('folio_charges').select('*').eq('stay_id', stayId).order('charge_date');
        chargesNow = charges2 || [];
    } else { chargesNow = charges || []; }

    var icons = { room_night:'🛏️', food:'🍽️', minibar:'🥤', laundry:'👕', spa:'💆', other:'➕' };
    var total = 0, html = '';
    chargesNow.forEach(function(c) {
        total += Number(c.amount);
        html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px;">' +
            '<span>' + (icons[c.charge_type] || '➕') + ' ' + sanitize(c.description || c.charge_type) + '</span><b>' + fmtMoney(c.amount) + '</b></div>';
    });
    var due = total - (stay.deposit || 0);

    var old = document.getElementById('folioModal'); if (old) old.remove();
    var m = document.createElement('div'); m.className = 'modal active'; m.id = 'folioModal';
    m.innerHTML = '<div class="modal-content" style="max-height:85vh;overflow-y:auto;"><h3>📋 Folio — ' + sanitize(stay.guest_name) + '</h3>' +
        '<div style="max-height:40vh;overflow-y:auto;">' + (html || '<p style="color:#94a3b8;">No charges yet.</p>') + '</div>' +
        '<div style="border-top:2px solid #e2e8f0;margin-top:10px;padding-top:10px;">' +
        '<div style="display:flex;justify-content:space-between;"><span>Total charges</span><b>' + fmtMoney(total) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;color:#10b981;"><span>Deposit paid</span><b>−' + fmtMoney(stay.deposit || 0) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:18px;color:#ef4444;"><span><b>BALANCE DUE</b></span><b>' + fmtMoney(due) + '</b></div></div>' +
        '<button class="btn btn-success" onclick="checkOut(\'' + stayId + '\',' + due + ')">💳 Pay ' + fmtMoney(due) + ' & Check Out</button>' +
        '<button class="btn btn-outline" onclick="document.getElementById(\'folioModal\').classList.remove(\'active\')">Close</button></div>';
    document.body.appendChild(m);
}
var chargesNow = [];

async function checkOut(stayId, due) {
    if (!await confirm('Collect ' + fmtMoney(due) + ' and check out this guest?')) return;
    try {
        // Record payment as a sale (enters your sales reports + dashboards!)
        await supabaseClient.from('sales').insert([{
            items: [{ name: 'Hotel stay settlement', qty: 1, price: due, subtotal: due }],
            subtotal: due, discount: 0, tax: 0, total: due, profit: 0,
            payment_method: 'cash', payments: [{ method: 'cash', amount: due }],
            shop_id: getShopId(), cashier_id: 'hotel', cashier_name: 'Hotel Desk',
            shift_id: 'hotel', time: new Date().toISOString(),
            note: 'Hotel checkout', invoice_no: 'HTL-' + Date.now().toString().slice(-8), order_type: 'Hotel'
        }]);
        const { data: stayR } = await supabaseClient.from('guest_stays').select('room_id').eq('id', stayId).single();
        await supabaseClient.from('guest_stays').update({ status: 'checked_out', actual_checkout: new Date().toISOString() }).eq('id', stayId);
        await supabaseClient.from('rooms').update({ status: 'cleaning' }).eq('id', stayR.room_id);
        document.getElementById('folioModal').classList.remove('active');
        alert('✅ Guest checked out! Room sent to 🧹 Cleaning.\nPayment recorded in Sales.');
        loadHotelBoard();
    } catch(e) { alert('❌ ' + e.message); }
}

// ═══ QUICK CHARGE (minibar, laundry...) ═══
async function addQuickCharge(stayId) {
    var amt = parseFloat(await prompt('Charge amount:'));
    if (isNaN(amt) || amt <= 0) return;
    var desc = await prompt('Description (e.g., Minibar — 2 beers):', 'Extra charge');
    if (!desc) return;
    await supabaseClient.from('folio_charges').insert([{ shop_id: getShopId(), stay_id: stayId,
        charge_type: 'other', description: desc, amount: amt }]);
    document.getElementById('roomActionsModal').classList.remove('active');
    alert('✅ Charged to room folio.');
    openFolio(stayId);
}

// ═══ EXTEND STAY ═══
async function extendStay(stayId) {
    var extra = parseInt(await prompt('Extend by how many nights?', '1'));
    if (isNaN(extra) || extra <= 0) return;
    const { data: stay } = await supabaseClient.from('guest_stays').select('planned_checkout').eq('id', stayId).single();
    var newDate = new Date(new Date(stay.planned_checkout).getTime() + extra * 86400000).toISOString().slice(0, 10);
    await supabaseClient.from('guest_stays').update({ planned_checkout: newDate }).eq('id', stayId);
    alert('✅ Extended! New checkout: ' + new Date(newDate).toLocaleDateString());
    document.getElementById('roomActionsModal').classList.remove('active');
    loadHotelBoard();
}

// ═══ HELPERS ═══
async function setRoomStatus(roomId, status) {
    await supabaseClient.from('rooms').update({ status: status }).eq('id', roomId);
    document.getElementById('roomActionsModal').classList.remove('active');
    loadHotelBoard();
}
async function checkInReserved(roomId) { openRoomActions(roomId); setRoomStatus(roomId, 'available').then(function(){ openRoomActions(roomId); }); }

async function loadArrivalsList() {
    var el = document.getElementById('arrivalsList'); if (!el) return;
    var today = new Date().toISOString().slice(0, 10);
    var html = '';
    hotelStays.forEach(function(s) {
        var room = hotelRooms.find(r => r.id === s.room_id);
        var d = new Date(s.check_in).toISOString().slice(0, 10);
        var out = s.planned_checkout ? new Date(s.planned_checkout).toISOString().slice(0, 10) : '';
        if (d === today) html += '<div style="padding:8px;border-bottom:1px solid #f1f5f9;">🟢 <b>' + sanitize(s.guest_name) + '</b> — Room ' + (room ? room.room_number : '?') + ' · IN today' + (s.status === 'reserved' ? ' (RESERVED — not yet arrived)' : ' ✅ arrived') + '</div>';
        if (out === today) html += '<div style="padding:8px;border-bottom:1px solid #f1f5f9;">🔴 <b>' + sanitize(s.guest_name) + '</b> — Room ' + (room ? room.room_number : '?') + ' · OUT today</div>';
    });
    el.innerHTML = html || '<p style="color:#94a3b8;">No arrivals or departures today.</p>';
}
async function loadStayHistory() {
    var el = document.getElementById('stayHistoryList'); if (!el) return;
    const { data } = await supabaseClient.from('guest_stays').select('*')
        .eq('shop_id', getShopId()).eq('status', 'checked_out').order('actual_checkout', { ascending: false }).limit(30);
    var html = '';
    (data || []).forEach(function(s) {
        var room = hotelRooms.find(r => r.id === s.room_id);
        html += '<div style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px;">' +
            '<b>' + sanitize(s.guest_name) + '</b> — Room ' + (room ? room.room_number : '?') +
            ' · ' + new Date(s.check_in).toLocaleDateString() + ' → ' + new Date(s.actual_checkout).toLocaleDateString() + '</div>';
    });
    el.innerHTML = html || '<p style="color:#94a3b8;">No completed stays yet.</p>';
}
