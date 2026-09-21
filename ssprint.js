// ══════════════════════════════════════════════════════════════
//  SMARTSHOP SMART PRINT ENGINE — universal printer support
//  BLE thermal + USB thermal + System print (all printers)
// ══════════════════════════════════════════════════════════════
var SS_PRINT = { method: null, paper: '58' };   // method: 'ble'|'usb'|'system'

(function(){ try { var s = JSON.parse(localStorage.getItem('ss_printer') || 'null'); if (s) SS_PRINT = s; } catch(e){} })();
function ssPrintSave() { localStorage.setItem('ss_printer', JSON.stringify(SS_PRINT)); }
function ssCharWidth() { return SS_PRINT.paper === '80' ? 46 : 31; }

// ---------- ESC/POS byte helpers ----------
function prCat(parts) {
    var t = 0; parts.forEach(function(p){ t += p.length; });
    var o = new Uint8Array(t), pos = 0;
    parts.forEach(function(p){ o.set(p, pos); pos += p.length; });
    return o;
}
function prInit() { return new Uint8Array([0x1B, 0x40]); }
function prAlign(a) { return new Uint8Array([0x1B, 0x61, a]); }
function prBold(on) { return new Uint8Array([0x1B, 0x45, on ? 1 : 0]); }
function prBig(on) { return new Uint8Array([0x1D, 0x21, on ? 0x11 : 0x00]); }
function prFeed(n) { return new Uint8Array([0x1B, 0x64, n]); }
function prCut() { return new Uint8Array([0x1D, 0x56, 0x00]); }
function prLine() { return new TextEncoder().encode('-'.repeat(ssCharWidth()) + '\n'); }
function prRow(l, r) {
    var w = ssCharWidth();
    l = String(l); r = String(r);
    var sp = w - l.length - r.length;
    if (sp < 1) { l = l.substring(0, Math.max(1, w - r.length - 1)); sp = Math.max(1, w - l.length - r.length); }
    return new TextEncoder().encode(l + ' '.repeat(sp) + r + '\n');
}

// ---------- Build the receipt (from _lastSaleForPrint) ----------
function prBuildReceipt() {
    var s = window._lastSaleForPrint;
    if (!s) return null;
    var n2 = function(v){ return Number(v || 0).toFixed(2); };
    var p = [prInit(), prAlign(1)];
    if (s.brand && s.brand.name) p.push(prBig(true), prBold(true), new TextEncoder().encode(s.brand.name + '\n'), prBig(false), prBold(false));
    if (s.brand && s.brand.address) p.push(new TextEncoder().encode(s.brand.address + '\n'));
    if (s.brand && s.brand.phone) p.push(new TextEncoder().encode('Tel: ' + s.brand.phone + '\n'));
    if (s.brand && s.brand.tinNumber) p.push(new TextEncoder().encode('TIN: ' + s.brand.tinNumber + '\n'));
    p.push(prAlign(0), prLine(),
        prRow('Date: ' + s.dateStr + ' ' + s.timeStr, ''),
        prRow('Invoice: ' + s.invoiceNo, ''));
    if (s.cashier) p.push(prRow('Cashier: ' + s.cashier, ''));
    if (s.orderType) p.push(prRow('Order: ' + s.orderType, ''));
    p.push(prLine());
    s.items.forEach(function(it) {
        p.push(new TextEncoder().encode(String(it.name).substring(0, ssCharWidth()) + '\n'));
        p.push(prRow('  ' + it.qty + ' x ' + n2(it.price), n2(it.price * it.qty)));
        if (it.modifiers && it.modifiers.length) p.push(new TextEncoder().encode('  + ' + it.modifiers.join(', ').substring(0, ssCharWidth() - 2) + '\n'));
    });
    p.push(prLine(), prRow('Subtotal', n2(s.subtotal)));
    if (s.discount > 0) p.push(prRow('Discount', '-' + n2(s.discount)));
    if (s.tax > 0) p.push(prRow('Tax ' + (s.taxRate || 0) + '%', n2(s.tax)));
    p.push(prBold(true), prBig(true), prRow('TOTAL', n2(s.total)), prBig(false), prBold(false));
    var pay = s.splitMode ? s.payments.map(function(x){ return x.method + ' ' + n2(x.amount); }).join(' + ') : (s.payments && s.payments[0] ? s.payments[0].method : 'cash');
    p.push(prRow('Payment', pay), prLine(), prAlign(1),
        new TextEncoder().encode(((s.brand && s.brand.receiptFooter) || 'Thank you for coming!') + '\n'),
        prFeed(3), prCut());
    return prCat(p);
}

// ---------- METHOD 1: Bluetooth LE thermal ----------
var prBtChar = null, prBtDevice = null;

async function prConnectBLE() {
    if (prBtChar && prBtDevice && prBtDevice.gatt.connected) return prBtChar;
    // Auto-reconnect to previously granted device (Chrome)
    try {
        if (navigator.bluetooth.getDevices) {
            var known = await navigator.bluetooth.getDevices();
            for (var i = 0; i < known.length; i++) {
                try {
                    var s1 = await known[i].gatt.connect();
                    var c1 = await prFindWriteChar(s1);
                    if (c1) { prBtDevice = known[i]; prBtChar = c1; return c1; }
                } catch(e) {}
            }
        }
    } catch(e) {}
    var device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb',
                           '000018f0-0000-1000-8000-00805f9b34fb',
                           'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
                           '49535343-fe7d-4ae5-8fa9-9fafd205e455',
                           '0000fee9-0000-1000-8000-00805f9b34fb']
    });
    prBtDevice = device;
    device.addEventListener('gattserverdisconnected', function(){ prBtChar = null; prBtDevice = null; });
    var server = await device.gatt.connect();
    var ch = await prFindWriteChar(server);
    if (!ch) throw new Error('No print channel found on this device.');
    prBtChar = ch;
    return ch;
}
async function prFindWriteChar(server) {
    var services = await server.getPrimaryServices();
    for (var i = 0; i < services.length; i++) {
        var chars = await services[i].getCharacteristics();
        for (var j = 0; j < chars.length; j++) {
            if (chars[j].properties.write || chars[j].properties.writeWithoutResponse) return chars[j];
        }
    }
    return null;
}
async function prSendBLE(data) {
    var CHUNK = 160;
    for (var i = 0; i < data.length; i += CHUNK) {
        var slice = data.slice(i, i + CHUNK);
        if (prBtChar.properties.write) await prBtChar.writeValue(slice);
        else await prBtChar.writeValueWithoutResponse(slice);
        await new Promise(function(r){ setTimeout(r, 45); });
    }
}

// ---------- METHOD 2: USB thermal (WebUSB) ----------
var prUsbDev = null, prUsbEp = null;

async function prConnectUSB() {
    if (!navigator.usb) throw new Error('USB printing not supported in this browser. Use Chrome.');
    if (prUsbDev && prUsbEp && prUsbDev.opened) return;
    // Reconnect to previously granted device
    var dev = null;
    try {
        var known = await navigator.usb.getDevices();
        if (known.length) dev = known[0];
    } catch(e) {}
    if (!dev) dev = await navigator.usb.requestDevice({ filters: [{ classCode: 7 }] }); // 7 = printer class
    prUsbDev = dev;
    await dev.open();
    if (dev.configuration === null) await dev.selectConfiguration(1);
    // find bulk OUT endpoint on any interface
    var conf = dev.configuration;
    outer:
    for (var i = 0; i < conf.interfaces.length; i++) {
        try {
            await dev.claimInterface(i);
        } catch(e) { continue; }
        var eps = conf.interfaces[i].alternate.endpoints;
        for (var j = 0; j < eps.length; j++) {
            if (eps[j].direction === 'out' && eps[j].type === 'bulk') { prUsbEp = eps[j]; break outer; }
        }
    }
    if (!prUsbEp) throw new Error('USB printer found but no print endpoint. Try System Print instead.');
}
async function prSendUSB(data) {
    var CHUNK = 512;
    for (var i = 0; i < data.length; i += CHUNK) {
        await prUsbDev.transferOut(prUsbEp.endpointNumber, data.slice(i, i + CHUNK));
    }
}

// ---------- METHOD 3: System print (ALL other printers) ----------
function prSystemPrint() {
    var s = window._lastSaleForPrint;
    if (!s) { alert('No receipt to print.'); return; }
    var mm = SS_PRINT.paper === '80' ? '80' : '58';
    var widthMM = mm === '80' ? 72 : 48;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) { alert('Popup blocked! Allow popups for this site to print.'); return; }
    var n2 = function(v){ return Number(v || 0).toFixed(2); };
    var html = '<!DOCTYPE html><html><head><title>Receipt ' + s.invoiceNo + '</title><style>' +
        '@page { margin: 0; size: ' + mm + 'mm auto; }' +
        'body { font-family: "Courier New", monospace; width: ' + widthMM + 'mm; margin: 2mm auto; font-size: 11px; color:#000; }' +
        'h1 { font-size: 15px; text-align: center; margin: 2px 0; }' +
        '.c { text-align: center; } .line { border-top: 1px dashed #000; margin: 5px 0; }' +
        '.item { display: flex; justify-content: space-between; margin: 1px 0; }' +
        '.total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 3px 0; margin: 4px 0; }' +
        '.r { display: flex; justify-content: space-between; margin: 2px 0; }' +
        '</style></head><body>';
    var b = s.brand || {};
    html += '<h1>' + (b.name || 'SmartShop Pro') + '</h1>';
    if (b.address) html += '<p class="c">' + b.address + '</p>';
    if (b.phone) html += '<p class="c">Tel: ' + b.phone + '</p>';
    if (b.tinNumber) html += '<p class="c">TIN: ' + b.tinNumber + '</p>';
    html += '<div class="line"></div>';
    html += '<div class="r"><span>Date: ' + s.dateStr + ' ' + s.timeStr + '</span></div>';
    html += '<div class="r"><span>Invoice: ' + s.invoiceNo + '</span></div>';
    if (s.cashier) html += '<div class="r"><span>Cashier: ' + s.cashier + '</span></div>';
    if (s.orderType) html += '<div class="r"><span>Order: ' + s.orderType + '</span></div>';
    html += '<div class="line"></div>';
    s.items.forEach(function(it) {
        html += '<div>' + String(it.name) + '</div>';
        html += '<div class="item"><span>' + it.qty + ' x ' + n2(it.price) + '</span><span>' + n2(it.price * it.qty) + '</span></div>';
        if (it.modifiers && it.modifiers.length) html += '<div style="font-size:10px;">+ ' + it.modifiers.join(', ') + '</div>';
    });
    html += '<div class="line"></div>';
    html += '<div class="r"><span>Subtotal</span><span>' + n2(s.subtotal) + '</span></div>';
    if (s.discount > 0) html += '<div class="r"><span>Discount</span><span>-' + n2(s.discount) + '</span></div>';
    if (s.tax > 0) html += '<div class="r"><span>Tax ' + (s.taxRate || 0) + '%</span><span>' + n2(s.tax) + '</span></div>';
    html += '<div class="total"><span>TOTAL</span><span>' + n2(s.total) + '</span></div>';
    var pay = s.splitMode ? s.payments.map(function(x){ return x.method + ' ' + n2(x.amount); }).join(' + ') : (s.payments && s.payments[0] ? s.payments[0].method : 'cash');
    html += '<div class="r"><span>Payment</span><span>' + pay + '</span></div>';
    html += '<div class="line"></div>';
    html += '<p class="c" style="font-weight:bold;">' + (b.receiptFooter || 'Thank you for coming!') + '</p>';
    html += '</body></html>';
    printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
    printWindow.focus();
    setTimeout(function(){ printWindow.print(); setTimeout(function(){ printWindow.close(); }, 600); }, 400);
}

// ---------- MAIN ENTRY: one-tap smart print ----------
async function printSmart() {
    if (!window._lastSaleForPrint) { alert('No receipt to print. Complete a sale first.'); return; }

    if (SS_PRINT.method === 'ble') { try { return await prDoBLE(); } catch(e){ return prPrintError(e); } }
    if (SS_PRINT.method === 'usb') { try { return await prDoUSB(); } catch(e){ return prPrintError(e); } }
    if (SS_PRINT.method === 'system') { return prSystemPrint(); }

    prOpenChooser(); // no method saved yet → chooser
}
function prPrintError(e) {
    if (e && (e.name === 'NotFoundError' || e.name === 'AbortError')) return;
    alert('❌ Print failed: ' + (e.message || e) + '\n\nYou can change the printer in Printer Settings.');
    prOpenChooser();
}
async function prDoBLE() { await prConnectBLE(); await prSendBLE(prBuildReceipt()); alert('✅ Printed (Bluetooth thermal).'); }
async function prDoUSB() { await prConnectUSB(); await prSendUSB(prBuildReceipt()); alert('✅ Printed (USB thermal).'); }
async function prTestPrint() {
    var old = window._lastSaleForPrint;
    window._lastSaleForPrint = { brand:{name:'PRINTER TEST'}, items:[{name:'Test item', qty:1, price:10, subtotal:10}],
        subtotal:10, discount:0, tax:0, taxRate:0, total:10, payments:[{method:'cash', amount:10}], splitMode:false,
        invoiceNo:'TEST', cashier:'', orderType:'', dateStr:'', timeStr:'' };
    try { await printSmart(); } finally { window._lastSaleForPrint = old; }
}

// ---------- Printer chooser / settings UI (self-injected) ----------
function prOpenChooser() {
    var old = document.getElementById('ssPrintModal'); if (old) old.remove();
    var m = document.createElement('div');
    m.className = 'modal active'; m.id = 'ssPrintModal';
    m.innerHTML =
    '<div class="modal-content" style="max-width:420px;">' +
    '<h3 style="margin-bottom:4px;">🖨️ Choose Printer</h3>' +
    '<p style="font-size:11px;color:#64748b;margin-bottom:12px;">Works with every printer type. Pick how this device prints — you will not be asked again (change it anytime in Settings).</p>' +

    '<label style="font-size:12px;font-weight:700;color:#475569;">Paper size</label>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
    '<label style="flex:1;border:2px solid ' + (SS_PRINT.paper === '58' ? '#2563eb' : '#e2e8f0') + ';border-radius:10px;padding:10px;text-align:center;font-weight:bold;" id="prP58" onclick="SS_PRINT.paper=\'58\';prOpenChooser();">📄 58mm<br><small style="font-weight:400;">P58E &amp; pocket printers</small></label>' +
    '<label style="flex:1;border:2px solid ' + (SS_PRINT.paper === '80' ? '#2563eb' : '#e2e8f0') + ';border-radius:10px;padding:10px;text-align:center;font-weight:bold;" id="prP80" onclick="SS_PRINT.paper=\'80\';prOpenChooser();">📄 80mm<br><small style="font-weight:400;">Standard POS printers</small></label>' +
    '</div>' +

    '<button class="btn btn-primary" style="background:#0f766e;margin-bottom:6px;" onclick="prChoose(\'ble\')">🔵 Bluetooth Thermal Printer<br><small>Portable 58/80mm thermal — fast &amp; auto-cut</small></button>' +
    '<button class="btn btn-primary" style="background:#7c3aed;margin-bottom:6px;" onclick="prChoose(\'usb\')">🔌 USB Thermal Printer<br><small>Thermal printer connected by cable</small></button>' +
    '<button class="btn btn-primary" style="background:#2563eb;margin-bottom:10px;" onclick="prChoose(\'system\')">📄 All Other Printers (WiFi, HP, Epson...)<br><small>Uses the phone\'s print system — works with everything</small></button>' +

    '<div class="flex-row">' +
    '<button class="btn btn-outline" style="flex:1;" onclick="prTestCurrent()">🧪 Test Print</button>' +
    '<button class="btn btn-outline" style="flex:1;" onclick="document.getElementById(\'ssPrintModal\').classList.remove(\'active\')">Cancel</button>' +
    '</div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if (e.target === m) m.classList.remove('active'); });
}
async function prChoose(method) {
    SS_PRINT.method = method; ssPrintSave();
    document.getElementById('ssPrintModal').classList.remove('active');
    if (method === 'system') { alert('✅ Saved: System print.\nChoose your printer in the print preview.'); prSystemPrint(); }
    else { alert('✅ Saved! Now select your printer...'); try { await printSmart(); } catch(e){ prPrintError(e); } }
}
async function prTestCurrent() {
    if (!SS_PRINT.method) { alert('Choose a printer type first.'); return; }
    await prTestPrint();
}
