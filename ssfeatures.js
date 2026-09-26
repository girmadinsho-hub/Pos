// ══════════════════════════════════════════════════════════════
//  SMARTSHOP FEATURE ENGINE — plan-based visibility matrix
//  Trial = everything | Free = core | Paid tiers unlock more
// ══════════════════════════════════════════════════════════════
var SS_FEATURES = {
    // CORE — every plan
    dashboard: ['free','trial','basic','standard','premium','enterprise'],
    products:  ['free','trial','basic','standard','premium','enterprise'],
    sales:     ['free','trial','basic','standard','premium','enterprise'],
    stock:     ['free','trial','basic','standard','premium','enterprise'],
    staff:     ['free','trial','basic','standard','premium','enterprise'],
    notebook:  ['free','trial','basic','standard','premium','enterprise'],
    settings:  ['free','trial','basic','standard','premium','enterprise'],
    devices:   ['free','trial','basic','standard','premium','enterprise'],
    license:   ['free','trial','basic','standard','premium','enterprise'],
    reports:   ['trial','basic','standard','premium','enterprise'],

    // GROWTH — Basic+
    expenses:  ['trial','basic','standard','premium','enterprise'],
    losses:    ['trial','basic','standard','premium','enterprise'],
    credits:   ['trial','basic','standard','premium','enterprise'],
    kitchen:   ['trial','basic','standard','premium','enterprise'],

    // PROFIT — Standard+
    loyalty:   ['trial','standard','premium','enterprise'],
    suppliers: ['trial','standard','premium','enterprise'],
    loans:     ['trial','standard','premium','enterprise'],
    bank:      ['trial','standard','premium','enterprise'],
    taxReports:['trial','standard','premium','enterprise'],
    intercom:  ['trial','standard','premium','enterprise'],

    // PREMIUM+
    crm:        ['trial','premium','enterprise'],
    marketing:  ['trial','premium','enterprise'],
    menuEng:    ['trial','premium','enterprise'],
    timesheets: ['trial','premium','enterprise'],
    forecast:   ['trial','premium','enterprise'],
    valuation:  ['trial','premium','enterprise'],

    // ENTERPRISE
    branches:  ['trial','enterprise']
};

// Tab number → feature key (admin.html sidebar)
var SS_TAB_FEATURES = {
    0:'dashboard', 1:'products', 2:'sales', 3:'stock', 4:'credits',
    5:'losses', 6:'staff', 7:'expenses', 8:'reports', 9:'suppliers',
    10:'loyalty', 11:'loans', 12:'bank', 13:'settings', 14:'license',
    15:'notebook', 16:'branches', 18:'kitchen', 19:'intercom', 20:'devices'
};

function ssGetPlan() {
    try {
        var row = window.__currentShopRow;
        if (row && row.plan === 'trial' && row.trial_expires && new Date(row.trial_expires) > new Date()) return 'trial';
        var licStr = localStorage.getItem('smartshop_license');
        if (licStr) {
            var lic = JSON.parse(licStr);
            if (lic.expiryDate && new Date(lic.expiryDate) > new Date()) return (lic.plan || 'basic');
        }
    } catch (e) {}
    return 'free';
}

function ssHasFeature(f) {
    var allowed = SS_FEATURES[f];
    if (!allowed) return true;
    return allowed.indexOf(ssGetPlan()) !== -1;
}

function ssPlanLabel() {
    return { free:'🆓 Free', trial:'🎁 Trial', basic:'🔹 Basic', standard:'🔸 Standard',
             premium:'🔷 Premium', enterprise:'🏢 Enterprise' }[ssGetPlan()] || ssGetPlan();
}

// 🔒 Guard: is this tab allowed for the current plan?
function ssTabAllowed(tabNum) {
    var feature = SS_TAB_FEATURES[tabNum];
    if (!feature) return true;
    return ssHasFeature(feature);
}

// ═══ APPLY TO SIDEBAR + REPORT TOOLS ═══
function ssApplyPlanVisibility() {
    // 1. Sidebar tabs — hide locked ones (never un-hide: manager rules stay)
    document.querySelectorAll('.sidebar-tab').forEach(function(tab) {
        var m = (tab.getAttribute('onclick') || '').match(/selectTab\((\d+)/);
        if (m && !ssTabAllowed(parseInt(m[1]))) tab.style.display = 'none';
    });

    // 2. Reports submenu items + tab8 tool buttons (match by onclick)
    var toolMap = [
        ['openPnLModal','taxReports'], ['openZReportModal','taxReports'],
        ['openTaxReportModal','taxReports'], ['openAuditLogModal','taxReports'],
        ['openManualInvoiceModal','taxReports'], ['openExpenseReportModal','expenses'],
        ['openTimesheetModal','timesheets'], ['openMenuEngModal','menuEng'],
        ['openCrmModal','crm'], ['openMarketingModal','marketing'],
        ['openInventoryValuationModal','valuation'], ['openFiscalReport','taxReports']
    ];
    document.querySelectorAll('#tab8 button, .submenu-item').forEach(function(el) {
        var oc = el.getAttribute('onclick') || '';
        for (var i = 0; i < toolMap.length; i++) {
            if (oc.indexOf(toolMap[i][0]) !== -1) {
                if (!ssHasFeature(toolMap[i][1])) el.style.display = 'none';
                return;
            }
        }
    });

    // 3. Plan badge in sidebar header
    var oldBadge = document.getElementById('ssPlanBadge');
    if (oldBadge) oldBadge.remove();
    var head = document.querySelector('.sidebar div:first-child');
    if (head) {
        var b = document.createElement('span');
        b.id = 'ssPlanBadge';
        b.style.cssText = 'float:right;font-size:10px;font-weight:800;background:#2563eb;color:#fff;padding:2px 8px;border-radius:8px;';
        b.textContent = ssPlanLabel();
        head.appendChild(b);
    }

    ssRenderUnlockCard();
}

// ✨ The Unlock Card — locked features become a salesman
function ssRenderUnlockCard() {
    var old = document.getElementById('ssUnlockCard');
    if (old) old.remove();
    var plan = ssGetPlan();
    if (plan === 'trial' || plan === 'enterprise') return;

    var locked = [];
    if (!ssHasFeature('credits'))    locked.push('Credit customers');
    if (!ssHasFeature('expenses'))   locked.push('Expense tracking');
    if (!ssHasFeature('loyalty'))    locked.push('Loyalty points');
    if (!ssHasFeature('suppliers'))  locked.push('Supplier orders');
    if (!ssHasFeature('bank'))       locked.push('Bank & loans');
    if (!ssHasFeature('taxReports')) locked.push('Tax reports (P&L, Z-Report)');
    if (!ssHasFeature('crm'))        locked.push('Customer CRM');
    if (!ssHasFeature('marketing'))  locked.push('WhatsApp marketing');
    if (!ssHasFeature('timesheets')) locked.push('Staff timesheets');
    if (!ssHasFeature('valuation'))  locked.push('Inventory valuation');
    if (!ssHasFeature('branches'))   locked.push('Multi-branch');
    if (locked.length === 0) return;

    var card = document.createElement('div');
    card.id = 'ssUnlockCard';
    card.style.cssText = 'margin:14px;padding:14px;background:linear-gradient(135deg,#1e3a8a,#7c3aed);border-radius:14px;color:#fff;';
    card.innerHTML =
        '<div style="font-weight:800;font-size:14px;margin-bottom:6px;">✨ Unlock More Tools</div>' +
        '<div style="font-size:11px;opacity:.85;line-height:1.7;margin-bottom:10px;">' +
            locked.slice(0, 4).map(function(f){ return '• ' + f; }).join('<br>') +
            (locked.length > 4 ? '<br>+' + (locked.length - 4) + ' more…' : '') +
        '</div>' +
        '<button onclick="closeSidebar();selectTab(14)" style="width:100%;padding:10px;border:none;border-radius:9px;background:#fbbf24;color:#1e293b;font-weight:800;font-size:13px;cursor:pointer;">🚀 Upgrade Now</button>';
    document.getElementById('sidebar').appendChild(card);
}
