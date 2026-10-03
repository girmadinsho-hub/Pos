// ══════════════════════════════════════════════════════════════
//  FEATURE ENGINE v3 — Two-Branch, Master-Controlled
//  Branch (retail/cafe) × Plan → what the shop sees
//  ALL numbers come from the plans table (Master-edited)
// ══════════════════════════════════════════════════════════════
var SS_PLAN = { name:'Free', businessType:'retail', features:[], maxProducts:10,
                maxCashiers:1, maxTables:0, maxMenuItems:0, hasStockMgmt:true,
                maxBranches:1, loaded:false };

var SS_TAB_FEATURES = {
    0:'dashboard', 1:'products', 2:'sales', 3:'stock', 4:'credits',
    5:'losses', 6:'staff', 7:'expenses', 8:'reports', 9:'suppliers',
    10:'loyalty', 11:'loans', 12:'bank', 13:'settings', 14:'license',
    15:'notebook', 16:'branches', 18:'kitchen', 19:'intercom', 20:'devices'
};

async function ssLoadPlan() {
    try {
        // 1. Which plan is this shop on?
        var planName = null;
        var row = window.__currentShopRow;
        if (row && row.plan === 'trial' && row.trial_expires && new Date(row.trial_expires) > new Date()) {
            planName = '__TRIAL__';
        } else {
            var licStr = localStorage.getItem('smartshop_license');
            if (licStr) {
                var lic = JSON.parse(licStr);
                if (lic.expiryDate && new Date(lic.expiryDate) > new Date()) planName = lic.plan;
            }
        }

        // 2. Business type (from the shop row)
        var bizType = (row && row.business_type) || 'retail';

        // 3. Fetch plan definition from the DATABASE (Master's rules)
        var def = null;
        if (planName === '__TRIAL__') {
            // Trial = the TOP plan of the shop's branch (full experience)
            const { data } = await supabaseClient.from('plans').select('*')
                .eq('business_type', bizType).eq('active', true)
                .order('display_order', { ascending: false }).limit(1).maybeSingle();
            def = data;
            SS_PLAN.name = 'Trial';
        } else if (planName) {
            const { data } = await supabaseClient.from('plans').select('*')
                .eq('business_type', bizType).ilike('name', planName).maybeSingle();
            def = data;
            SS_PLAN.name = planName;
        } else {
            const { data } = await supabaseClient.from('plans').select('*')
                .eq('business_type', bizType).eq('is_default_free', true).maybeSingle();
            def = data;
            SS_PLAN.name = 'Free';
        }

        if (def) {
            SS_PLAN.businessType = bizType;
            SS_PLAN.features = def.features || [];
            SS_PLAN.maxProducts = def.max_products;
            SS_PLAN.maxCashiers = def.max_cashiers;
            SS_PLAN.maxTables = def.max_tables || 0;
            SS_PLAN.maxMenuItems = def.max_menu_items || 0;
            SS_PLAN.hasStockMgmt = def.has_stock_mgmt !== false;
            SS_PLAN.maxBranches = def.max_branches || 1;
        }
        SS_PLAN.loaded = true;
    } catch (e) { SS_PLAN.loaded = true; }
    return SS_PLAN;
}

function ssHasFeature(f) {
    if (SS_PLAN.name === 'Trial') return true;
    // Branch law: café tools belong to café shops only (any café tier)
    if (SS_PLAN.businessType === 'cafe' && ['kitchen','recipes','qrMenu'].indexOf(f) !== -1) return true;
    if (SS_PLAN.businessType !== 'cafe' && ['kitchen','recipes','qrMenu'].indexOf(f) !== -1) return false;
    return SS_PLAN.features.indexOf(f) !== -1;
}

function ssGetPlan() { return SS_PLAN.name; }
function ssPlanLabel() { return SS_PLAN.name === 'Trial' ? '🎁 Trial' : SS_PLAN.name; }
function ssIsCafe() { return SS_PLAN.businessType === 'cafe'; }
function ssHasStockMgmt() { return SS_PLAN.name === 'Trial' ? true : SS_PLAN.hasStockMgmt; }

function ssTabAllowed(tabNum) {
    // 🚪 EXIT DOOR LAW: Settings (13) + License (14) are NEVER plan-locked.
    // Locking them traps paying customers outside their own upgrade path.
    if (tabNum === 13 || tabNum === 14) return true;
    var feature = SS_TAB_FEATURES[tabNum];
    if (!feature) return true;
    return ssHasFeature(feature);
}
// ═══ APPLY ═══
async function ssApplyPlanVisibility() {
    await ssLoadPlan();

    document.querySelectorAll('.sidebar-tab').forEach(function(tab) {
        var m = (tab.getAttribute('onclick') || '').match(/selectTab\((\d+)/);
        if (m) tab.style.display = ssTabAllowed(parseInt(m[1])) ? '' : 'none';
    });

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
                el.style.display = ssHasFeature(toolMap[i][1]) ? '' : 'none';
                return;
            }
        }
    });

    var oldBadge = document.getElementById('ssPlanBadge');
    if (oldBadge) oldBadge.remove();
    var head = document.querySelector('.sidebar div:first-child');
    if (head) {
        var b = document.createElement('span');
        b.id = 'ssPlanBadge';
        b.style.cssText = 'float:right;font-size:10px;font-weight:800;background:#2563eb;color:#fff;padding:2px 8px;border-radius:8px;';
        b.textContent = (ssIsCafe() ? '☕ ' : '🛒 ') + ssPlanLabel();
        head.appendChild(b);
    }

    ssRenderUnlockCard();
}

function ssRenderUnlockCard() {
    var old = document.getElementById('ssUnlockCard');
    if (old) old.remove();
    if (SS_PLAN.name === 'Trial') return;

    var allKnown = ssIsCafe()
        ? ['recipes','qrMenu','receipts','intercom','loyalty','suppliers','loans','bank','taxReports','crm','marketing','timesheets','forecast','valuation','branches']
        : ['credits','expenses','losses','reports','loyalty','suppliers','loans','bank','taxReports','intercom','crm','marketing','menuEng','timesheets','forecast','valuation','branches'];
    var pretty = { credits:'Credit customers', expenses:'Expense tracking', losses:'Loss records', reports:'Full reports', loyalty:'Loyalty points', suppliers:'Supplier orders', loans:'Loans', bank:'Bank accounts', taxReports:'Tax reports', intercom:'Staff intercom', recipes:'Recipes & sub-recipes', qrMenu:'QR customer menu', receipts:'Fiscal receipts', crm:'Customer CRM', marketing:'WhatsApp marketing', menuEng:'Menu engineering', timesheets:'Timesheets', forecast:'Sales forecast', valuation:'Inventory valuation', branches:'Multi-branch' };
    var locked = allKnown.filter(function(f){ return !ssHasFeature(f); });
    if (locked.length === 0) return;

    var card = document.createElement('div');
    card.id = 'ssUnlockCard';
    card.style.cssText = 'margin:14px;padding:14px;background:linear-gradient(135deg,#1e3a8a,#7c3aed);border-radius:14px;color:#fff;';
    card.innerHTML =
        '<div style="font-weight:800;font-size:14px;margin-bottom:6px;">✨ Unlock More Tools</div>' +
        '<div style="font-size:11px;opacity:.85;line-height:1.7;margin-bottom:10px;">' +
            locked.slice(0, 4).map(function(f){ return '• ' + (pretty[f] || f); }).join('<br>') +
            (locked.length > 4 ? '<br>+' + (locked.length - 4) + ' more…' : '') +
        '</div>' +
        '<button onclick="closeSidebar();selectTab(14)" style="width:100%;padding:10px;border:none;border-radius:9px;background:#fbbf24;color:#1e293b;font-weight:800;font-size:13px;cursor:pointer;">🚀 Upgrade Now</button>';
    document.getElementById('sidebar').appendChild(card);
}

// ═══ LIMITS (all Master-controlled) ═══
function ssCanAddProduct(count) {
    if (SS_PLAN.name === 'Trial') return true;
    return count < (SS_PLAN.maxProducts || 999999);
}
function ssCanAddMenuItems(count) {
    if (SS_PLAN.name === 'Trial') return true;
    if (!ssIsCafe()) return ssCanAddProduct(count);
    return count < (SS_PLAN.maxMenuItems || SS_PLAN.maxProducts || 999999);
}
function ssCanAddStaff(count) {
    if (SS_PLAN.name === 'Trial') return true;
    return count < (SS_PLAN.maxCashiers || 999);
}
function ssCanAddTables(count) {
    if (SS_PLAN.name === 'Trial') return true;
    return count < (SS_PLAN.maxTables || 999999);
}
function ssMaxBranches() { return SS_PLAN.name === 'Trial' ? 999 : (SS_PLAN.maxBranches || 1); }
