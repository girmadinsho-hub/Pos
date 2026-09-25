// ══════════════════════════════════════════════════════════════
//  SMARTSHOP FISCAL ENGINE — ERCA-ready receipt system
//  Gapless numbering • VAT breakdown • void tracking •
//  offline-first • signature placeholders • audit archive
// ══════════════════════════════════════════════════════════════

// Get the next gapless receipt number (server-side, atomic)
async function ssNextReceiptNo() {
    try {
        const { data, error } = await supabaseClient.rpc('next_fiscal_receipt', { p_shop: getShopId() });
        if (error) throw error;
        return data;
    } catch (e) {
        // Offline fallback: local sequence (marked offline, syncs later)
        var localSeq = parseInt(localStorage.getItem('fiscal_offline_seq_' + getShopId()) || '0') + 1;
        localStorage.setItem('fiscal_offline_seq_' + getShopId(), String(localSeq));
        var y = new Date().getFullYear();
        return 'RCP-' + y + '-OFF' + String(localSeq).padStart(4, '0');
    }
}

// 🧾 CREATE FISCAL RECEIPT — called after every completed sale
async function ssCreateFiscalReceipt(saleData) {
    try {
        // Shop settings: tax type, TIN
        var taxType = (window.shopBranding && window.shopBranding.taxType) || 'TOT';
        var tin = (window.shopBranding && window.shopBranding.tinNumber) || '';
        var vatNo = (window.shopBranding && window.shopBranding.vatNumber) || '';
        var vatRate = (taxType === 'VAT') ? ((window.posSettings && window.posSettings.taxRate) || 15) : 0;

        // Math: from the completed sale
        var total = Number(saleData.total || 0);
        var vatAmount = Number(saleData.tax || 0);
        var taxable = total - vatAmount;

        var receiptNo = await ssNextReceiptNo();
        var isOffline = !navigator.onLine;

        const { error } = await supabaseClient.from('fiscal_receipts').insert([{
            shop_id: getShopId(),
            receipt_no: receiptNo,
            invoice_no: saleData.invoiceNo || '',
            shop_name: (window.shopBranding && window.shopBranding.name) || '',
            tin_number: tin,
            vat_number: vatNo,
            tax_type: taxType,
            taxable_amount: taxable,
            vat_rate: vatRate,
            vat_amount: vatAmount,
            total: total,
            items: saleData.items || [],
            status: 'issued',
            is_offline: isOffline,
            // ERCA Phase 2 placeholders — empty until certification
            erca_signature: null,
            erca_qr_data: null
        }]);
        if (error) throw error;
        return receiptNo;
    } catch (e) {
        console.warn('Fiscal receipt issue:', e.message);
        return null;   // never block a sale because of fiscal recording
    }
}

// ❌ VOID — keeps the number, marks VOIDED (gapless law)
async function ssVoidFiscalReceipt(invoiceNo) {
    try {
        const { error } = await supabaseClient.from('fiscal_receipts')
            .update({ status: 'voided' })
            .eq('shop_id', getShopId())
            .eq('invoice_no', invoiceNo);
        if (error) throw error;
    } catch (e) { console.warn('Fiscal void issue:', e.message); }
}

// 🖨️ FISCAL FOOTER for printed receipts (works TODAY, ready for Phase 2)
function ssFiscalReceiptFooter(receiptNo) {
    var taxType = (window.shopBranding && window.shopBranding.taxType) || 'TOT';
    var line = '\n─────\n';
    line += 'Receipt No: ' + (receiptNo || '-') + '\n';
    line += (taxType === 'VAT' ? 'VAT Receipt' : 'TOT Receipt') + '\n';
    // Phase 2 placeholders — printed when ERCA certifies:
    // line += 'ERCA Sign: ' + signature + '\n';
    // line += '[QR: verify.erca.gov.et/' + code + ']\n';
    return line;
}

// 📊 GOVERNMENT REPORT — monthly (what ERCA will ask for)
async function ssFiscalMonthlyReport(year, month) {
    var start = new Date(year, month - 1, 1).toISOString();
    var end = new Date(year, month, 1).toISOString();
    try {
        const { data, error } = await supabaseClient.from('fiscal_receipts')
            .select('receipt_no, receipt_date, total, taxable_amount, vat_amount, tax_type, status, is_offline')
            .eq('shop_id', getShopId())
            .gte('receipt_date', start)
            .lt('receipt_date', end)
            .order('receipt_no');
        if (error) throw error;
        var rep = { issued: 0, voided: 0, totalSales: 0, totalVat: 0, firstNo: '', lastNo: '', receipts: data || [] };
        (data || []).forEach(function(r) {
            if (r.status === 'voided') rep.voided++;
            else { rep.issued++; rep.totalSales += Number(r.total || 0); rep.totalVat += Number(r.vat_amount || 0); }
        });
        if (data && data.length) { rep.firstNo = data[0].receipt_no; rep.lastNo = data[data.length - 1].receipt_no; }
        return rep;
    } catch (e) { return { issued: 0, voided: 0, totalSales: 0, totalVat: 0, firstNo: '', lastNo: '', receipts: [] }; }
}
