/* ================================================================
   ☢️ NUCLEAR RESCUE — Tables + Order Status + Send to Kitchen
   Standalone file. Native dialogs. Zero dependencies.
   Loaded FIRST — before any broken code exists.
   ================================================================ */
alert('☢️ RESCUE.JS IS LOADED AND ACTIVE');
// Wait for page, then take over the three functions FOREVER
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try { nuclearRescue(); } catch(e) { console.error('Nuclear rescue failed:', e); }
    }, 1500);
});
// Backup: also run if DOMContentLoaded already passed
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        try { nuclearRescue(); } catch(e) { console.error('Nuclear rescue failed:', e); }
    }, 1500);
}

function nuclearRescue() {

    // ============ HELPER: get shopId safely ============
    function getShop() {
        try { if (typeof getShopId === 'function') return getShopId(); } catch(e) {}
        return localStorage.getItem('shopId') || 'default';
    }

    // ============ HELPER: get supabase safely ============
    function sb() { return (typeof supabaseClient !== 'undefined') ? supabaseClient : null; }

    // ============ HELPER: native confirm (NOT shared.js override!) ============
    function nativeConfirm(msg) {
        return window.nativeConfirm_real ? window.nativeConfirm_real(msg) : confirm(msg);
    }

    // ================================================================
    // 🪑 TABLES — completely rebuilt
    // ================================================================
    window.openTablesModal = async function() {
        var modal = document.getElementById('tablesModal');
        var grid = document.getElementById('tablesGrid');
        if (!modal || !grid) { alert('NUCLEAR: tablesModal/tablesGrid HTML missing!'); return; }

        modal.classList.add('active');
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;">Loading tables...</p>';

        var s = sb();
        if (!s) { grid.innerHTML = '<p style="color:red;">No database connection.</p>'; return; }

        // Load tables
        var tables = [];
        try {
            var r = await s.from('settings').select('table_names').eq('shop_id', getShop()).maybeSingle();
            if (r.data && r.data.table_names) {
                tables = r.data.table_names.split(',').map(function(t){return t.trim();}).filter(function(t){return t!=='';});
            }
        } catch(e) { grid.innerHTML = '<p style="color:red;">Tables load error: ' + e.message + '</p>'; return; }

        if (!tables.length) {
            grid.innerHTML = '<p style="color:#94a3b8;">No tables found. Add them in Admin → Settings → Table Setup.</p>';
            return;
        }

        // Load busy orders
        var orders = {};
        try {
            var r2 = await s.from('orders').select('*').eq('shop_id', getShop()).neq('status', 'Paid');
            (r2.data || []).forEach(function(o) { if (o.table_id) orders[o.table_id] = o; });
        } catch(e) { /* show as free */ }

        var html = '';
        tables.forEach(function(name) {
            var o = orders[name];
            var cls = 'table-free', txt = 'Free';
            if (o) {
                if (o.status === 'Ready') { cls = 'table-ready'; txt = 'Ready to Pay'; }
                else { cls = 'table-preparing'; txt = 'Busy'; }
            }
            html += '<button onclick="window.selectTable(\'' + name + '\',' + (o ? 1 : 0) + ')" ' +
                    'style="aspect-ratio:1;border-radius:12px;border:none;cursor:pointer;color:white;font-weight:bold;font-size:15px;padding:10px;' +
                    'background:' + (cls === 'table-free' ? '#10b981' : cls === 'table-ready' ? '#f59e0b' : '#3b82f6') + ';">' +
                    '🪑<br>' + name + '<br><small>' + txt + '</small></button>';
        });
        grid.innerHTML = html;
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '10px';
    };

    // ================================================================
    // 🪑 SELECT TABLE
    // ================================================================
    window.selectTable = function(tableName, isBusy) {
        if (isBusy) {
            if (!nativeConfirm('Table ' + tableName + ' has an UNPAID bill. Start new order anyway?')) return;
        }
        try {
            cart = [];
            currentTableName = tableName;
            var t = document.getElementById('cartTitle');
            if (t) t.innerText = 'CART - ' + tableName;
            if (typeof updateCart === 'function') updateCart();
        } catch(e) { /* cart not ready — ignore */ }
        var m = document.getElementById('tablesModal');
        if (m) m.classList.remove('active');
    };

    // ================================================================
    // 🚦 ORDER STATUS — completely rebuilt
    // ================================================================
    window.openWaiterStatus = async function() {
        var modal = document.getElementById('waiterStatusModal');
        var list = document.getElementById('waiterStatusList');
        if (!modal || !list) { alert('NUCLEAR: waiterStatusModal HTML missing!'); return; }

        modal.classList.add('active');
        list.innerHTML = '<p style="text-align:center;color:#94a3b8;">Loading orders...</p>';

        var s = sb();
        if (!s) { list.innerHTML = '<p style="color:red;">No database connection.</p>'; return; }

        try {
            var r = await s.from('orders').select('*').eq('shop_id', getShop()).neq('status', 'Paid');
            var os = (r.data || []).sort(function(a,b){ return new Date(a.time) - new Date(b.time); });

            if (!os.length) {
                list.innerHTML = '<p style="text-align:center;color:#94a3b8;">No active orders right now. ✅</p>';
                return;
            }

            var html = '';
            os.forEach(function(o) {
                var color = o.status === 'Ready' ? '#10b981' : (o.status === 'Preparing' ? '#3b82f6' : '#f59e0b');
                var txt = o.status === 'Ready' ? '✅ Ready to Serve' : (o.status === 'Preparing' ? '🔵 Preparing' : '🟡 Pending');
                html += '<div style="background:#f1f5f9;border-left:5px solid ' + color + ';padding:12px;margin-bottom:10px;border-radius:8px;">' +
                        '<b>🪑 ' + (o.table_id || 'Takeaway') + '</b> — <span style="color:' + color + ';font-weight:bold;">' + txt + '</span><br>' +
                        '<div style="font-size:13px;color:#475569;margin:6px 0;">';
                (o.items || []).forEach(function(it) { html += it.qty + 'x ' + it.name + '<br>'; });
                html += '</div><b>Total: ' + (o.total || 0) + '</b> — <span style="color:#ef4444;">UNPAID</span></div>';
            });
            list.innerHTML = html;
        } catch(e) {
            list.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
        }
    };

    // ================================================================
    // 🔔 SEND TO KITCHEN — completely rebuilt
    // ================================================================
    window.sendWaiterOrderToKitchen = async function() {
        // 1. Cart check
        var c = (typeof cart !== 'undefined') ? cart : [];
        if (!c || !c.length) { alert('Cart is empty. Add items first.'); return; }

        // 2. Table check (native dialog — ALWAYS visible)
        var tableName = (typeof currentTableName !== 'undefined' && currentTableName) ? currentTableName : '';
        if (!tableName) {
            if (!nativeConfirm('No table selected.\n\nOK = Send as Walk-in order\nCancel = Choose a table first')) return;
            tableName = 'Walk-in';
        }

        // 3. Build the order
        var items = c.map(function(i) {
            return {
                productId: i.id, name: i.name, qty: i.qty, price: i.price,
                modifiers: i.modifiers || [], note: i.note || '',
                station: i.station || 'Kitchen'
            };
        });
        var stationStatus = {};
        items.forEach(function(it) { stationStatus[it.station] = false; });
        var total = 0; items.forEach(function(it) { total += it.price * it.qty; });
        var waiter = 'Waiter';
        try { if (typeof currentCashier !== 'undefined' && currentCashier) waiter = currentCashier.name; } catch(e) {}

        // 4. Insert — with FULL error display
        var s = sb();
        if (!s) { alert('No database connection!'); return; }

        var btn = document.getElementById('btnSendKitchen');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Sending...'; }

        try {
            var r = await s.from('orders').insert([{
                firebase_id: 'order_' + Date.now(),
                shop_id: getShop(),
                table_id: tableName,
                items: items,
                station_status: stationStatus,
                total: total,
                status: 'Pending',
                order_type: 'Waiter Dine-In',
                waiter_name: waiter,
                time: new Date().toISOString()
            }]);
            if (r.error) throw new Error(r.error.message);

            alert('✅ Order sent to Kitchen for ' + tableName + '!');

            // 5. Clear cart
            try {
                cart = [];
                currentTableName = '';
                var t = document.getElementById('cartTitle');
                if (t) t.innerText = 'CART';
                if (typeof updateCart === 'function') updateCart();
            } catch(e) {}

        } catch(e) {
            alert('💥 SEND FAILED — the real reason:\n\n' + e.message + '\n\n📸 Send this message to your engineer!');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔔 Send to Kitchen'; }
        }
    };

    console.log('☢️ NUCLEAR RESCUE ACTIVE — all three functions taken over');
}
