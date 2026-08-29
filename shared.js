// ===== GLOBAL CURRENCY FORMATTER =====
var appCurrencySymbol = localStorage.getItem('appCurrencySymbol') || 'Br ';
function fmtMoney(amount) {
    return appCurrencySymbol + Number(amount || 0).toFixed(2);
}

// ==================== STANDARD DIALOG BOX SYSTEM ====================

// Alert (OK button only)
function showAlert(message, title, callback) {
    title = title || 'SmartShop Pro';
    var overlay = document.createElement('div');
    overlay.className = 'standard-dialog-overlay';
    overlay.innerHTML = 
        '<div class="standard-dialog-box">' +
            '<div class="standard-dialog-icon">⚠️</div>' +
            '<div class="standard-dialog-title">' + title + '</div>' +
            '<div class="standard-dialog-message">' + message + '</div>' +
            '<div class="standard-dialog-buttons">' +
                '<button class="standard-dialog-btn standard-dialog-btn-primary" id="dialogOkBtn">OK</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    document.getElementById('dialogOkBtn').onclick = function() {
        document.body.removeChild(overlay);
        if (callback) callback();
    };

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            if (callback) callback();
        }
    });
}

// Confirm (OK + Cancel buttons)
function showConfirm(message, title, callback) {
    title = title || 'Confirm';
    var overlay = document.createElement('div');
    overlay.className = 'standard-dialog-overlay';
    overlay.innerHTML = 
        '<div class="standard-dialog-box">' +
            '<div class="standard-dialog-icon">❓</div>' +
            '<div class="standard-dialog-title">' + title + '</div>' +
            '<div class="standard-dialog-message">' + message + '</div>' +
            '<div class="standard-dialog-buttons">' +
                '<button class="standard-dialog-btn standard-dialog-btn-secondary" id="dialogCancelBtn">Cancel</button>' +
                '<button class="standard-dialog-btn standard-dialog-btn-primary" id="dialogOkBtn">OK</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    document.getElementById('dialogOkBtn').onclick = function() {
        document.body.removeChild(overlay);
        if (callback) callback(true);
    };
    document.getElementById('dialogCancelBtn').onclick = function() {
        document.body.removeChild(overlay);
        if (callback) callback(false);
    };
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            if (callback) callback(false);
        }
    });
}

// Prompt (Input + OK + Cancel)
function showPrompt(message, defaultValue, title, callback) {
    title = title || 'Input Required';
    defaultValue = (defaultValue === null || defaultValue === undefined) ? '' : String(defaultValue);    var overlay = document.createElement('div');
    overlay.className = 'standard-dialog-overlay';
    overlay.innerHTML = 
        '<div class="standard-dialog-box">' +
            '<div class="standard-dialog-icon">✏️</div>' +
            '<div class="standard-dialog-title">' + title + '</div>' +
            '<div class="standard-dialog-message">' + message + '</div>' +
            '<input type="text" class="standard-dialog-input" id="dialogInput" value="' + defaultValue.replace(/"/g, '&quot;') + '" placeholder="Type here...">' +
            '<div class="standard-dialog-buttons">' +
                '<button class="standard-dialog-btn standard-dialog-btn-secondary" id="dialogCancelBtn">Cancel</button>' +
                '<button class="standard-dialog-btn standard-dialog-btn-primary" id="dialogOkBtn">OK</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById('dialogInput');
    input.focus();
    input.select();

    document.getElementById('dialogOkBtn').onclick = function() {
        var value = input.value;
        document.body.removeChild(overlay);
        if (callback) callback(value);
    };
    document.getElementById('dialogCancelBtn').onclick = function() {
        document.body.removeChild(overlay);
        if (callback) callback(null);
    };
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            if (callback) callback(null);
        }
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            var value = input.value;
            document.body.removeChild(overlay);
            if (callback) callback(value);
        }
    });
}

// ===== OVERRIDE BROWSER FUNCTIONS =====
window.alert = function(message) {
    showAlert(message, 'SmartShop Pro', null);
};

window.confirm = function(message) {
    return new Promise(function(resolve) {
        showConfirm(message, 'Confirm', function(ok) {
            resolve(ok);
        });
    });
};

window.prompt = function(message, defaultValue) {
    return new Promise(function(resolve) {
        showPrompt(message, defaultValue, 'Input', function(value) {
            resolve(value);
        });
    });
};

// Firebase is officially removed. We use Supabase 100%.
let db = null;
let auth = null;

// ===== UNIVERSAL HELPERS =====
function getShopId(){return localStorage.getItem('shopId')||'default';}
function saveShopId(id){localStorage.setItem('shopId',id);}
function saveOfflineSale(sale){const off=JSON.parse(localStorage.getItem('offlineSales')||'[]');off.push(sale);localStorage.setItem('offlineSales',JSON.stringify(off));}
function getOfflineSales(){return JSON.parse(localStorage.getItem('offlineSales')||'[]');}
function clearOfflineSales(){localStorage.removeItem('offlineSales');}
function sanitize(str){var d=document.createElement('div');d.textContent=str;return d.innerHTML;}
function formatDateTime(ds){ if(!ds)return''; var d=new Date(ds); if(isNaN(d.getTime()))return ds; return d.toLocaleString(); }

// ===== UNIVERSAL LANGUAGE DICTIONARY (MERGED) =====
var langText = {
  en: {
    // Admin Specific
    dashboard: "Dashboard", products: "Products", sales: "Sales", stock: "Stock",
    credits: "Credits", losses: "Losses", staff: "Staff", expenses: "Expenses",
    reports: "Reports", suppliers: "Suppliers", loyalty: "Loyalty", loans: "Loans",
    bank: "Bank", settings: "Settings", license: "License",
    owner: "Owner", manager: "Manager", signIn: "Sign In", password: "Password",
    today: "Today", week: "Week", month: "Month", all: "All",
    thisWeek: "This Week", thisMonth: "This Month",
    revenue: "Revenue", grossProfit: "Gross Profit", netProfit: "Net Profit",
    creditDue: "Credit Due", salesForecast: "Sales Forecast",
    salaryAlerts: "Salary Alerts", salesBreakdown: "Sales Breakdown by Cashier",
    salesChart7: "Sales Chart (7 Days)", paymentMethods: "Payment Methods",
    addProduct: "Add Product", editProduct: "Edit Product", deleteProduct: "Delete Product",
    productName: "Product Name", unit: "Unit", costPrice: "Cost Price",
    sellingPrice: "Selling Price", category: "Category", barcode: "Barcode",
    scan: "Scan", enableBulkPricing: "Enable Bulk Pricing", search: "Search...",
    list: "List", grid: "Grid", exportCSV: "Export CSV", importCSV: "Import CSV",
    lowStock: "Low Stock", allStock: "All Stock", unpaidCredits: "Unpaid Credits",
    settleCredit: "Settle Credit", recordLoss: "Record Loss", lossHistory: "Loss History",
    qty: "Qty", reason: "Reason", record: "Record", editLoss: "Edit Loss",
    deleteLoss: "Delete Loss", registerStaff: "Register Staff", staffList: "Staff List",
    fullName: "Full Name", salary: "Salary", phone: "Phone", address: "Address",
    register: "Register", cancel: "Cancel", update: "Update", disableStaff: "Disable",
    paySalary: "Pay Salary", paid: "Paid", unpaid: "Unpaid", recordExpense: "Record Expense",
    expenseHistory: "Expense History", description: "Description", amount: "Amount",
    date: "Date", actions: "Actions", total: "Total",
    salesSummary: "Sales Summary", cashierSales7: "Cashier Sales (7 Days)",
    expenseSummary: "Expense Summary", top5Products: "Top 5 Selling Products",
    dailyExpenses: "Daily Expenses (7 Days)", addSupplier: "Add Supplier",
    supplierName: "Supplier Name", add: "Add", selectSupplier: "Select Supplier",
    purchaseOrders: "Purchase Orders", createOrder: "Create Order",
    orderHistory: "Order History", receive: "Receive", cancelOrder: "Cancel Order",
    deleteOrder: "Delete Order", loyaltyPoints: "Loyalty Points",
    loyaltyDesc: "1 point per Br 10 spent. 100 points = Br 1 off.",
    lookUp: "Look Up", redeemPoints: "Redeem Points", newLoan: "New Loan Record",
    receivable: "Receivable", payable: "Payable", personName: "Person/Business Name",
    recordLoan: "Record Loan", loanSummary: "Loan Summary", loanHistory: "Loan History",
    settle: "Settle", deleteLoan: "Delete Loan", status: "Status", type: "Type",
    balance: "Balance", account: "Account", newBankTransaction: "New Bank Transaction",
    deposit: "Deposit", withdraw: "Withdraw", selectAccount: "Select Account",
    addBankAccount: "Add Bank Account", createAccount: "Create Account",
    transactions: "Transactions", editTransaction: "Edit Transaction",
    deleteTransaction: "Delete Transaction", passwordManagement: "Password Management",
    save: "Save", posFeatures: "POS Features",
    posFeaturesDesc: "Enable or disable features on the cashier screen.",
    enableTax: "Enable Tax", negotiatePrice: "Negotiate Price", bulkPricing: "Bulk Pricing",
    enableDiscount: "Enable Discount", shopLevel: "Shop Level",
    calendarSystem: "Calendar System", gregorian: "Gregorian", ethiopian: "Ethiopian",
    shopBranding: "Shop Branding", shopName: "Shop Name", resetShop: "Reset Shop",
    resetWarning: "Delete all data permanently.", reset: "Reset Everything",
    enterEmail: "Enter your email to confirm", enterLicenseKey: "Enter License Key",
    activate: "Activate", contactProvider: "Contact Provider", close: "Close",
    confirm: "Confirm", ok: "OK", error: "Error", wrongPassword: "❌ Wrong password!",
    noData: "No data", noProducts: "No products", noSales: "No sales",
    noCredits: "No unpaid credits", noLosses: "No losses recorded",
    noExpenses: "No expenses", noStaff: "No staff registered",
    noLoans: "No loan records", noBankTransactions: "No transactions",
    day: "Day", time: "Time", payment: "Payment", items: "Items",
    cashier: "Cashier", shift: "Shift", detailedSales: "Detailed Sales",
    netCashToOwner: "Net Cash to Owner", dailySales: "Daily Sales",
    weeklySales: "Weekly Sales", monthlySales: "Monthly Sales",
    schedule: "Schedule", startDate: "Start Date", lastPaid: "Last Paid",
    salaryPaid: "Salary paid", salaryDue: "Salary Due",
    exportCSVBtn: "Export CSV", exportTextBtn: "Export Text",
    forceReload: "Force Reload", refresh: "Refresh", edit: "Edit", delete: "Delete",
    disable: "Disable", pay: "Pay", receiveOrder: "Receive Order",
    insufficientFunds: "Insufficient funds", productExists: "Product already exists!",
    barcodeExists: "Barcode already used!", fillRequired: "Fill Name, Price, Stock!",
    fillNameAndSalary: "Fill Name and Salary!", cashierPasswordRequired: "Cashiers need a password!",
    cashierLimitReached: "Cashier limit reached!", productLimitReached: "Product limit reached for your license plan.",
    supplierNameRequired: "Supplier name required!", noItemsSelected: "No items selected!",
    fillNameAndAmount: "Fill Name and Amount!", enterAccountName: "Enter account name",
    fillAllFields: "Fill all fields", transactionRecorded: "Transaction recorded",
    passwordsSaved: "Passwords saved securely!", brandingSaved: "Branding saved!",
    posSettingsSaved: "POS settings saved!", invalidKey: "Invalid key!",
    licenseActivated: "License activated!", licenseExpired: "License expired!",
    licenseExpiring: "License expiring in", shopLevelUpdated: "Shop level updated",
    calendarUpdated: "Calendar updated", saved: "Saved",
    noDataToExport: "No data to export", print: "Print",
    excelExport: "Excel", fitColumns: "Fit", resetFilters: "Reset",
    
    // POS Specific
    loginSubtitle: "Cashier Login",
    selectName: "-- Select Name --",
    refreshList: "🔄 Refresh List",
    passwordPlaceholder: "Password",
    changePwd: "🔑 Change Password",
    oldPwd: "Old Password",
    newPwd: "New Password",
    licenseMissing: "❌ License is missing or expired.",
    authFailed: "Authentication failed.",
    sessionError: "Session error",
    loginError: "❌ Unexpected login error",
    sellReport: "Sell Report",
    sellHistory: "Sell History",
    notebook: "Notebook",
    customerLookup: "Customer Lookup",
    priceCheck: "Price Check",
    syncNow: "🔄 Sync Now",
    heldOrders: "Held Orders",
    voidRefund: "Void / Refund",
    openShift: "Open Shift",
    closeShift: "Close Shift",
    logout: "Logout",
    offline: "OFFLINE",
    cartTitle: "CART",
    negotiate: "Negotiate Price",
    discountLabel: "Discount:",
    discountPercent: "%",
    discountAmount: "or Br",
    redeem: "🎁 Redeem",
    taxLabel: "Tax",
    taxRate: "Rate:",
    subtotal: "Subtotal:",
    discountLine: "Discount:",
    taxLine: "Tax:",
    total: "TOTAL:",
    clear: "🗑️ Clear",
    hold: "📌 Hold",
    payNow: "💰 PAY NOW",
    outOfStock: "Out of stock!",
    notEnoughStock: "Not enough stock!",
    lowStockAlert: "⚠️ Low stock! Only ",
    remaining: " remaining.",
    searchPlaceholder: "🔍 Search...",
    sortAZ: "A-Z",
    sortZA: "Z-A",
    sortPriceUp: "Price ↑",
    sortPriceDown: "Price ↓",
    sortPopular: "Popular",
    listView: "☰ List",
    gridView: "⊞ Grid",
    barcodePlaceholder: "🏷️ Scan or type barcode...",
    camera: "📷",
    paymentMethod: "Payment Method",
    cash: "💵 Cash",
    card: "💳 Card",
    mobile: "📱 Mobile",
    credit: "📝 Credit",
    split: "🧾 Split",
    single: "🔙 Single",
    complete: "✅ Complete",
    cancelPayment: "Cancel",
    notePlaceholder: "📝 Add a note (optional)",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    remainingAmount: "Remaining:",
    splitMismatch: "❌ The split amounts do not equal the total.",
    creditFieldsRequired: "Please enter customer name and phone for credit sales.",
    saleComplete: "🧾 Sale Complete",
    thanks: "😊 Thanks for coming!",
    invoice: "Invoice",
    totalSales: "Total Sales",
    cashSales: "Cash",
    cardSales: "Card",
    mobileSales: "Mobile",
    creditSales: "Credit",
    netCash: "Net Cash to Owner",
    itemsSold: "Items Sold",
    allTime: "All Time",
    allPayments: "All Payments",
    allShifts: "All Shifts",
    morning: "☀️ Morning",
    afternoon: "🌤 Afternoon",
    evening: "🌙 Evening",
    dailySalesSummary: "📅 Daily Sales Summary",
    detailedSales: "📋 Detailed Sales",
    noSales: "No sales in this period.",
    loadMore: "⬇ Load More",
    excelView: "📊 Excel",
    listView2: "📋 List",
    gridView2: "⊞ Grid",
    writeNote: "Write a note... (Enter to save)",
    noCategory: "📂 No Category",
    categoryWork: "💼 Work",
    categoryPersonal: "👤 Personal",
    categoryImportant: "⭐ Important",
    categoryIdea: "💡 Idea",
    categoryMeeting: "🤝 Meeting",
    categoryFinance: "💰 Finance",
    searchNotes: "🔍 Search notes...",
    noNotes: "📭 No notes yet.",
    deleteNote: "Delete this note?",
    phonePlaceholder: "Customer Phone",
    searching: "🔍 Searching...",
    phoneLabel: "Phone:",
    worth: "worth",
    unpaidCredit: "Unpaid Credit",
    priceCheckBarcode: "Scan or type barcode",
    checkPrice: "🔍 Check",
    notFound: "❌ Product not found.",
    sellingPrice: "Selling Price",
    soundOnSale: "🔊 Sound on sale",
    vibrateOnSale: "📳 Vibrate on sale",
    closeSettings: "Close",
    noHeldOrders: "No held orders.",
    heldAt: "Held:",
    recall: "🔄 Recall",
    deleteHeld: "🗑️ Delete",
    heldOrderName: "Name this held order (e.g., customer name, table number):",
    orderHeld: "✅ Order held as",
    recallOrder: "🔄 Order recalled.",
    deleteHeldConfirm: "Delete this held order?",
    voidTitle: "↩️ Void / Refund",
    voidInstructions: "Recent sales are shown below. Click Void to undo a sale and restore stock.",
    voidButton: "↩️ Void",
    voidPassword: "🔐 Enter manager password to void this sale:",
    voidConfirm: "⚠️ Void this sale? Stock will be restored. This cannot be undone.",
    voidSuccess: "✅ Sale voided and stock restored.",
    incorrectPassword: "❌ Incorrect manager password. Void cancelled.",
    shiftOpenConfirm: "Open shift now?",
    shiftCloseConfirm: "Close shift now?",
    shiftOpened: "✅ Shift opened at",
    shiftClosed: "🧾 Shift Summary",
    emptyCart: "Cart is empty!",
    confirmDelete: "Delete this note?",
    loading: "Loading...",
    excelExportFailed: "XLSX export failed. Make sure SheetJS is loaded.",
    syncSuccess: "✅ All synced",
    syncCount: "✅ Synced {count} offline sale(s)",
    sessionSaved: "✅ Session saved for shop:",
    sessionNotSaved: "⚠️ Session could not be saved:",
    cameraNotSupported: "Camera not supported on this device.",
    cameraPermission: "Camera permission denied.",
    productNotFound: "Product not found!",
    enterPhone: "Enter phone number.",
    noCashiers: "-- No cashiers found --"
  },
  am: {
    // Admin Specific
    dashboard: "ዳሽቦርድ", products: "ምርቶች", sales: "ሽያጮች", stock: "ክምችት",
    credits: "ዱቤዎች", losses: "ኪሳራዎች", staff: "ሰራተኞች", expenses: "ወጪዎች",
    reports: "ሪፖርቶች", suppliers: "አቅራቢዎች", loyalty: "ታማኝነት", loans: "ብድሮች",
    bank: "ባንክ", settings: "ቅንብሮች", license: "ፈቃድ",
    owner: "ባለቤት", manager: "አስተዳዳሪ", signIn: "ግባ", password: "የይለፍ ቃል",
    today: "ዛሬ", week: "ሳምንት", month: "ወር", all: "ሁሉም",
    thisWeek: "በዚህ ሳምንት", thisMonth: "በዚህ ወር",
    revenue: "ገቢ", grossProfit: "ጠቅላላ ትርፍ", netProfit: "ንጹህ ትርፍ",
    creditDue: "ያልተከፈለ ዱቤ", salesForecast: "የሽያጭ ትንበያ",
    salaryAlerts: "የደመወዝ ማስጠንቀቂያዎች", salesBreakdown: "በካሺር የሽያጭ ዝርዝር",
    salesChart7: "የ7 ቀን ሽያጭ ግራፍ", paymentMethods: "የክፍያ ዘዴዎች",
    addProduct: "ምርት ጨምር", editProduct: "ምርት አስተካክል", deleteProduct: "ምርት አስወግድ",
    productName: "የምርት ስም", unit: "አሀድ", costPrice: "ዋጋ (ወጪ)", sellingPrice: "የሽያጭ ዋጋ",
    category: "ምድብ", barcode: "ባርኮድ", scan: "ቃኝ", enableBulkPricing: "የጅምላ ዋጋ አንቀሳቅስ",
    search: "ፈልግ...", list: "ዝርዝር", grid: "ፍርግርግ", exportCSV: "CSV ላክ", importCSV: "CSV አስገባ",
    lowStock: "ዝቅተኛ ክምችት", allStock: "ሁሉም ክምችት", unpaidCredits: "ያልተከፈለ ዱቤ",
    settleCredit: "ዱቤ ክፈል", recordLoss: "ኪሳራ መዝግብ", lossHistory: "የኪሳራ ታሪክ",
    qty: "ብዛት", reason: "ምክንያት", record: "መዝግብ", editLoss: "ኪሳራ አስተካክል", deleteLoss: "ኪሳራ አስወግድ",
    registerStaff: "ሰራተኛ መዝግብ", staffList: "የሰራተኞች ዝርዝር",
    fullName: "ሙሉ ስም", salary: "ደመወዝ", phone: "ስልክ", address: "አድራሻ",
    register: "ይመዝገቡ", cancel: "ይቅር", update: "አዘምን", disableStaff: "አሰናክል",
    paySalary: "ደመወዝ ክፈል", paid: "ተከፍሏል", unpaid: "አልተከፈለም",
    recordExpense: "ወጪ መዝግብ", expenseHistory: "የወጪ ታሪክ",
    description: "መግለጫ", amount: "መጠን", date: "ቀን", actions: "ተግባራት", total: "ጠቅላላ",
    salesSummary: "የሽያጭ ማጠቃለያ", cashierSales7: "የካሺር ሽያጭ (7 ቀናት)",
    expenseSummary: "የወጪ ማጠቃለያ", top5Products: "ምርጥ 5 ምርቶች",
    dailyExpenses: "ዕለታዊ ወጪዎች (7 ቀናት)", addSupplier: "አቅራቢ ጨምር",
    supplierName: "የአቅራቢ ስም", add: "ጨምር", selectSupplier: "አቅራቢ ይምረጡ",
    purchaseOrders: "የግዢ ትዛዞች", createOrder: "ትዛዝ ፍጠር",
    orderHistory: "የትዛዝ ታሪክ", receive: "ተቀበል", cancelOrder: "ትዛዝ ሰርዝ", deleteOrder: "ትዛዝ አስወግድ",
    loyaltyPoints: "የታማኝነት ነጥቦች",
    loyaltyDesc: "በ10 ብር 1 ነጥብ ያገኛሉ። 100 ነጥብ = 1 ብር ቅናሽ",
    lookUp: "ፈልግ", redeemPoints: "ነጥቦችን ተጠቀም", newLoan: "አዲስ ብድር",
    receivable: "ተበዳሪ", payable: "ተዋሽ", personName: "የሰው/የንግድ ስም",
    recordLoan: "ብድር መዝግብ", loanSummary: "የብድር ማጠቃለያ", loanHistory: "የብድር ታሪክ",
    settle: "ክፈል", deleteLoan: "ብድር አስወግድ", status: "ሁኔታ", type: "አይነት",
    balance: "ቀሪ", account: "አካውንት", newBankTransaction: "አዲስ የባንክ ዝውውር",
    deposit: "ተቀማጭ", withdraw: "መውጣት", selectAccount: "አካውንት ይምረጡ",
    addBankAccount: "አካውንት ጨምር", createAccount: "አካውንት ፍጠር",
    transactions: "ዝውውሮች", editTransaction: "ዝውውር አስተካክል", deleteTransaction: "ዝውውር አስወግድ",
    passwordManagement: "የይለፍ ቃል አስተዳደር", save: "አስቀምጥ",
    posFeatures: "POS ባህሪያት", posFeaturesDesc: "በካሺር ማያ ላይ ባህሪያትን አንቀሳቅስ/አሰናክል።",
    enableTax: "ታክስ አንቀሳቅስ", negotiatePrice: "ዋጋ መደራደር", bulkPricing: "የጅምላ ዋጋ",
    enableDiscount: "ቅናሽ አንቀሳቅስ", shopLevel: "የሱቅ ደረጃ",
    calendarSystem: "የቀን አቆጣጠር", gregorian: "ጎርጎርያን", ethiopian: "ኢትዮጵያዊ",
    shopBranding: "የሱቅ ብራንድ", shopName: "የሱቅ ስም", resetShop: "ሱቅ ዳግም አስጀምር",
    resetWarning: "ሁሉንም ውሂብ በቋሚነት አጥፋ።", reset: "ሁሉንም ዳግም አስጀምር",
    enterEmail: "ለማረጋገጫ ኢሜይል ያስገቡ", enterLicenseKey: "የፈቃድ ቁልፍ ያስገቡ",
    activate: "አንቀሳቅስ", contactProvider: "አገልግሎት ሰጪውን ያግኙ", close: "ዝጋ",
    confirm: "አረጋግጥ", ok: "እሺ", error: "ስህተት", wrongPassword: "❌ የተሳሳተ የይለፍ ቃል!",
    noData: "ምንም ውሂብ የለም", noProducts: "ምርቶች የሉም", noSales: "ሽያጮች የሉም",
    noCredits: "ያልተከፈለ ዱቤ የለም", noLosses: "የተመዘገበ ኪሳራ የለም",
    noExpenses: "ወጪዎች የሉም", noStaff: "የተመዘገበ ሰራተኛ የለም",
    noLoans: "የብድር መዝገብ የለም", noBankTransactions: "ምንም ዝውውር የለም",
    day: "ቀን", time: "ሰዓት", payment: "ክፍያ", items: "ዕቃዎች",
    cashier: "ካሺር", shift: "ሽፍት", detailedSales: "ዝርዝር ሽያጮች",
    netCashToOwner: "ለባለቤቱ የተጣራ ጥሬ ገንዘብ",
    dailySales: "ዕለታዊ ሽያጮች", weeklySales: "ሳምንታዊ ሽያጮች", monthlySales: "ወርሃዊ ሽያጮች",
    schedule: "መርሃግብር", startDate: "የመጀመሪያ ቀን", lastPaid: "መጨረሻ የተከፈለ",
    salaryPaid: "ደመወዝ ተከፍሏል", salaryDue: "የሚከፈለው ደመወዝ",
    exportCSVBtn: "CSV ላክ", exportTextBtn: "ጽሑፍ ላክ",
    forceReload: "እንደገና ጫን", refresh: "አድስ", edit: "አስተካክል", delete: "አስወግድ",
    disable: "አሰናክል", pay: "ክፈል", receiveOrder: "ትዛዝ ተቀበል",
    insufficientFunds: "በቂ ገንዘብ የለም", productExists: "ምርቱ አስቀድሞ አለ!",
    barcodeExists: "ባርኮዱ አስቀድሞ ጥቅም ላይ ውሏል!",
    fillRequired: "ስም፣ ዋጋ እና ክምችት ይሙሉ!",
    fillNameAndSalary: "ስም እና ደመወዝ ይሙሉ!",
    cashierPasswordRequired: "ካሺሮች የይለፍ ቃል ያስፈልጋቸዋል!",
    cashierLimitReached: "የካሺር ገደብ ደርሷል!",
    productLimitReached: "ለእርስዎ ፈቃድ ዕቅድ የምርት ገደብ ደርሷል።",
    supplierNameRequired: "የአቅራቢ ስም ያስፈልጋል!",
    noItemsSelected: "ምንም ዕቃ አልተመረጠም!",
    fillNameAndAmount: "ስም እና መጠን ይሙሉ!",
    enterAccountName: "የአካውንት ስም ያስገቡ",
    fillAllFields: "ሁሉንም መስኮች ይሙሉ",
    transactionRecorded: "ዝውውሩ ተመዝግቧል",
    passwordsSaved: "የይለፍ ቃሎች ደህንነቱ በተጠበቀ ሁኔታ ተቀምጠዋል!",
    brandingSaved: "ብራንዲንግ ተቀምጧል!",
    posSettingsSaved: "POS ቅንብሮች ተቀምጠዋል!",
    invalidKey: "ልክ ያልሆነ ቁልፍ!",
    licenseActivated: "ፈቃዱ ገባቢ ሆኗል!",
    licenseExpired: "ፈቃዱ አልፏል!",
    licenseExpiring: "ፈቃዱ በ... ውስጥ ያበቃል",
    shopLevelUpdated: "የሱቅ ደረጃ ተዘምኗል",
    calendarUpdated: "የቀን አቆጣጠር ተዘምኗል",
    saved: "ተቀምጧል",
    noDataToExport: "ለመላክ ምንም ውሂብ የለም",
    print: "አትም",
    excelExport: "ኤክሴል",
    fitColumns: "አስማማ",
    resetFilters: "እንደገና አስጀምር",

    // POS Specific
    loginSubtitle: "የካሺር መግቢያ",
    selectName: "-- ስም ይምረጡ --",
    refreshList: "🔄 ዝርዝር አድስ",
    passwordPlaceholder: "የይለፍ ቃል",
    changePwd: "🔑 የይለፍ ቃል ቀይር",
    oldPwd: "የቀድሞ የይለፍ ቃል",
    newPwd: "አዲስ የይለፍ ቃል",
    licenseMissing: "❌ ፈቃድ የለም ወይም አብቅቷል።",
    authFailed: "ማረጋገጥ አልተሳካም።",
    sessionError: "የክፍለ ጊዜ ስህተት",
    loginError: "❌ ያልተጠበቀ የመግቢያ ስህተት",
    sellReport: "የሽያጭ ሪፖርት",
    sellHistory: "የሽያጭ ታሪክ",
    notebook: "ማስታወሻ ደብተር",
    customerLookup: "ደንበኛ ፍለጋ",
    priceCheck: "ዋጋ ማረጋገጫ",
    syncNow: "🔄 አመሳስል",
    heldOrders: "የተያዙ ትዕዛዞች",
    voidRefund: "መልስ / ተመላሽ",
    openShift: "ሽፍት ክፈት",
    closeShift: "ሽፍት ዝጋ",
    logout: "ውጣ",
    offline: "ከመስመር ውጪ",
    cartTitle: "ጋሪ",
    negotiate: "ዋጋ መደራደር",
    discountLabel: "ቅናሽ:",
    discountPercent: "%",
    discountAmount: "ወይም Br",
    redeem: "🎁 ማስመለስ",
    taxLabel: "ታክስ",
    taxRate: "መጠን:",
    subtotal: "ንዑስ ድምር:",
    discountLine: "ቅናሽ:",
    taxLine: "ታክስ:",
    total: "ጠቅላላ:",
    clear: "🗑️ አጽዳ",
    hold: "📌 ያዝ",
    payNow: "💰 ክፈል",
    outOfStock: "ክምችት አልቋል!",
    notEnoughStock: "በቂ ክምችት የለም!",
    lowStockAlert: "⚠️ ዝቅተኛ ክምችት! የቀረው ",
    remaining: " ብቻ።",
    searchPlaceholder: "🔍 ፈልግ...",
    sortAZ: "ሀ-ፐ",
    sortZA: "ፐ-ሀ",
    sortPriceUp: "ዋጋ ↑",
    sortPriceDown: "ዋጋ ↓",
    sortPopular: "ተወዳጅ",
    listView: "☰ ዝርዝር",
    gridView: "⊞ ፍርግርግ",
    barcodePlaceholder: "🏷️ ባርኮድ ይተይቡ...",
    camera: "📷",
    paymentMethod: "የክፍያ ዘዴ",
    cash: "💵 ጥሬ",
    card: "💳 ካርድ",
    mobile: "📱 ሞባይል",
    credit: "📝 ዱቤ",
    split: "🧾 ከፋፍል",
    single: "🔙 ነጠላ",
    complete: "✅ ጨርስ",
    cancelPayment: "ሰርዝ",
    notePlaceholder: "📝 ማስታወሻ ያክሉ (አማራጭ)",
    customerName: "የደንበኛ ስም",
    customerPhone: "የደንበኛ ስልክ",
    remainingAmount: "ቀሪ:",
    splitMismatch: "❌ የተከፋፈለው መጠን ከጠቅላላው ጋር አይጣጣምም።",
    creditFieldsRequired: "እባክዎ ለዱቤ ሽያጭ የደንበኛ ስም እና ስልክ ያስገቡ።",
    saleComplete: "🧾 ሽያጭ ተጠናቋል",
    thanks: "😊 ስለመጡ እናመሰግናለን!",
    invoice: "ደረሰኝ",
    totalSales: "ጠቅላላ ሽያጭ",
    cashSales: "ጥሬ",
    cardSales: "ካርድ",
    mobileSales: "ሞባይል",
    creditSales: "ዱቤ",
    netCash: "ለባለቤቱ የተጣራ ጥሬ",
    itemsSold: "የተሸጡ እቃዎች",
    allTime: "ሁሉም ጊዜ",
    allPayments: "ሁሉም ክፍያዎች",
    allShifts: "ሁሉም ሽፍቶች",
    morning: "☀️ ጠዋት",
    afternoon: "🌤 ከሰዓት",
    evening: "🌙 ማታ",
    dailySalesSummary: "📅 ዕለታዊ የሽያጭ ማጠቃለያ",
    detailedSales: "📋 ዝርዝር ሽያጮች",
    noSales: "በዚህ ወቅት ምንም ሽያጭ የለም።",
    loadMore: "⬇ ተጨማሪ ጫን",
    excelView: "📊 ኤክሴል",
    listView2: "📋 ዝርዝር",
    gridView2: "⊞ ፍርግርግ",
    writeNote: "ማስታወሻ ይጻፉ... (ለማስቀመጥ Enter)",
    noCategory: "📂 ምድብ የለም",
    categoryWork: "💼 ሥራ",
    categoryPersonal: "👤 ግላዊ",
    categoryImportant: "⭐ አስፈላጊ",
    categoryIdea: "💡 ሀሳብ",
    categoryMeeting: "🤝 ስብሰባ",
    categoryFinance: "💰 ፋይናንስ",
    searchNotes: "🔍 ማስታወሻዎችን ይፈልጉ...",
    noNotes: "📭 እስካሁን ምንም ማስታወሻ የለም።",
    deleteNote: "ይህን ማስታወሻ መሰረዝ?",
    phonePlaceholder: "የደንበኛ ስልክ",
    searching: "🔍 በመፈለግ ላይ...",
    phoneLabel: "ስልክ:",
    worth: "ዋጋ",
    unpaidCredit: "ያልተከፈለ ዱቤ",
    priceCheckBarcode: "ባርኮድ ይተይቡ ወይም ይቃኙ",
    checkPrice: "🔍 አረጋግጥ",
    notFound: "❌ ምርቱ አልተገኘም።",
    sellingPrice: "የሽያጭ ዋጋ",
    soundOnSale: "🔊 በሽያጭ ላይ ድምጽ",
    vibrateOnSale: "📳 በሽያጭ ላይ ንዝረት",
    closeSettings: "ዝጋ",
    noHeldOrders: "ምንም የተያዘ ትዕዛዝ የለም።",
    heldAt: "የተያዘበት ጊዜ:",
    recall: "🔄 መልስ",
    deleteHeld: "🗑️ ሰርዝ",
    heldOrderName: "ለተያዘው ትዕዛዝ ስም ይስጡ (ለምሳሌ የደንበኛ ስም፣ የጠረጴዛ ቁጥር):",
    orderHeld: "✅ ትዕዛዝ እንደ",
    recallOrder: "🔄 ትዕዛዝ ተመልሷል።",
    deleteHeldConfirm: "ይህን የተያዘ ትዕዛዝ መሰረዝ?",
    voidTitle: "↩️ መልስ / ተመላሽ",
    voidInstructions: "የቅርብ ጊዜ ሽያጮች ከዚህ በታች ይታያሉ። ሽያጩን ለመሰረዝ እና ክምችት ለመመለስ መልስ የሚለውን ጠቅ ያድርጉ።",
    voidButton: "↩️ መልስ",
    voidPassword: "🔐 ይህን ሽያጭ ለመሰረዝ የአስተዳዳሪ የይለፍ ቃል ያስገቡ:",
    voidConfirm: "⚠️ ይህን ሽያጭ መሰረዝ? ክምችት ይመለሳል። ይህ ሊቀለበስ አይችልም።",
    voidSuccess: "✅ ሽያጩ ተሰርዟል እና ክምችት ተመልሷል።",
    incorrectPassword: "❌ የተሳሳተ የአስተዳዳሪ የይለፍ ቃል። መሰረዝ ተሰርዟል።",
    shiftOpenConfirm: "ሽፍት ይከፈት?",
    shiftCloseConfirm: "ሽፍት ይዘጋ?",
    shiftOpened: "✅ ሽፍት ተከፍቷል በ",
    shiftClosed: "🧾 የሽፍት ማጠቃለያ",
    emptyCart: "ጋሪው ባዶ ነው!",
    confirmDelete: "ይህን ማስታወሻ መሰረዝ?",
    loading: "በመጫን ላይ...",
    excelExportFailed: "XLSX ኤክስፖርት አልተሳካም። SheetJS መጫኑን ያረጋግጡ።",
    syncSuccess: "✅ ሁሉም ተመሳስሏል",
    syncCount: "✅ {count} ከመስመር ውጪ ሽያጮች ተመሳስለዋል",
    sessionSaved: "✅ ክፍለ ጊዜ ተቀምጧል ለሱቅ:",
    sessionNotSaved: "⚠️ ክፍለ ጊዜ ማስቀመጥ አልተቻለም:",
    cameraNotSupported: "ካሜራ በዚህ መሳሪያ ላይ አይደገፍም።",
    cameraPermission: "የካሜራ ፍቃድ ተከልክሏል።",
    productNotFound: "ምርቱ አልተገኘም!",
    enterPhone: "ስልክ ቁጥር ያስገቡ።",
    noCashiers: "-- ምንም ካሺሮች አልተገኙም --"
  },
  om: {
    // Admin Specific
    dashboard: "Daashboordii", products: "Oomishawwan", sales: "Gurgurtaa", stock: "Kuusaa",
    credits: "Liqiiwwan", losses: "Kasaaraa", staff: "Hojjattoota", expenses: "Baasiiwwan",
    reports: "Gabaasota", suppliers: "Dhiyeessitoota", loyalty: "Amanamummaa", loans: "Liiziiwwan",
    bank: "Baankii", settings: "Qindaa'ina", license: "Eeyyama",
    owner: "Abbaa", manager: "Hogganaa", signIn: "Galii", password: "Jecha iccitii",
    today: "Har'a", week: "Torban", month: "Ji'a", all: "Hundaa",
    thisWeek: "Torban kana", thisMonth: "Ji'a kana",
    revenue: "Galii", grossProfit: "Bu'aa waliigalaa", netProfit: "Bu'aa qulqulluu",
    creditDue: "Liqii hin kaffalamne", salesForecast: "Tilmaama gurgurtaa",
    salaryAlerts: "Akeekkachiisa miindaa", salesBreakdown: "Qoodama gurgurtaa cashier",
    salesChart7: "Giraafii gurgurtaa (Guyyaa 7)", paymentMethods: "Mala kaffaltii",
    addProduct: "Oomisha dabali", editProduct: "Oomisha sirreessi", deleteProduct: "Oomisha balleessi",
    productName: "Maqaa oomishaa", unit: "Waliigala", costPrice: "Gatii (baasii)", sellingPrice: "Gatii gurgurtaa",
    category: "Ramaddii", barcode: "Baarkoodii", scan: "Illeessa", enableBulkPricing: "Gatii guddaa dalagu",
    search: "Barbaadi...", list: "Tarree", grid: "Mandi'aa", exportCSV: "CSV ergi", importCSV: "CSV galchi",
    lowStock: "Kuusaa xiqqaa", allStock: "Kuusaa hundaa", unpaidCredits: "Liqii hin kaffalamne",
    settleCredit: "Liqii kaffali", recordLoss: "Kasaaraa galmeessi", lossHistory: "Seenaa kasaaraa",
    qty: "Baay'ina", reason: "Sababa", record: "Galmeessi", editLoss: "Kasaaraa sirreessi", deleteLoss: "Kasaaraa balleessi",
    registerStaff: "Hojjataa galmeessi", staffList: "Tarree hojjattoota",
    fullName: "Maqaa guutuu", salary: "Miindaa", phone: "Bilbila", address: "Teessoo",
    register: "Galmeessi", cancel: "Haqu", update: "Odeeffannoo haaromsi", disableStaff: "Akka hin hojjanne godhi",
    paySalary: "Miindaa kaffali", paid: "Kaffalamera", unpaid: "Hin kaffalamne",
    recordExpense: "Baasii galmeessi", expenseHistory: "Seenaa baasii",
    description: "Ibsa", amount: "Hamma", date: "Guyyaa", actions: "Gochaalee", total: "Waliigala",
    salesSummary: "Guduunfaa gurgurtaa", cashierSales7: "Gurgurtaa cashier (guyyaa 7)",
    expenseSummary: "Guduunfaa baasii", top5Products: "Oomishawwan beekamoo 5",
    dailyExpenses: "Baasii guyyaa (guyyaa 7)", addSupplier: "Dhiyeessaa dabali",
    supplierName: "Maqaa dhiyeessaa", add: "Dabali", selectSupplier: "Dhiyeessaa filadhu",
    purchaseOrders: "Ajaja bittaa", createOrder: "Ajaja uumi",
    orderHistory: "Seenaa ajaja", receive: "Fudhadhu", cancelOrder: "Ajaja haqi", deleteOrder: "Ajaja balleessi",
    loyaltyPoints: "Poyintii amanamummaa",
    loyaltyDesc: "Qarshii 10 tokkoon poyintii 1 argatta. Poyintii 100 = qarshii 1 hir'isa.",
    lookUp: "Barbaadi", redeemPoints: "Poyintii fayyadami", newLoan: "Liizii haaraa",
    receivable: "Nama liqeesse", payable: "Nama liqeeffate", personName: "Maqaa namaa/ daldalaa",
    recordLoan: "Liizii galmeessi", loanSummary: "Guduunfaa liizii", loanHistory: "Seenaa liizii",
    settle: "Kaffali", deleteLoan: "Liizii balleessi", status: "Sadarkaa", type: "Gosa",
    balance: "Hambaa", account: "Akkaawuntii", newBankTransaction: "Sochii baankii haaraa",
    deposit: "Galchaa", withdraw: "Baasuu", selectAccount: "Akkaawuntii filadhu",
    addBankAccount: "Akkaawuntii dabali", createAccount: "Akkaawuntii uumi",
    transactions: "Sochiiwwan", editTransaction: "Sochii sirreessi", deleteTransaction: "Sochii balleessi",
    passwordManagement: "Bulchiinsa jecha iccitii", save: "Olkaa'i",
    posFeatures: "Amaloota POS", posFeaturesDesc: "Amaloota fuula cashier irratti dalagi/dhaabi.",
    enableTax: "Taksii dalagi", negotiatePrice: "Gatii walitti qabaa", bulkPricing: "Gatii guddaa",
    enableDiscount: "Hir'isa dalagi", shopLevel: "Sadarkaa suuqii",
    calendarSystem: "Sirna dhahaa", gregorian: "Gregorian", ethiopian: "Itoophiyaa",
    shopBranding: "Faayaa suuqii", shopName: "Maqaa suuqii", resetShop: "Suuqii irra deebi'i",
    resetWarning: "Daataa hunda dhaabbataan balleessi.", reset: "Hunda irra deebi'i",
    enterEmail: "Email kee galchi mirkaneessuuf", enterLicenseKey: "Furtuu eeyyama galchi",
    activate: "Dalagi", contactProvider: "Dhiyeessaa qunnami", close: "Cufi",
    confirm: "Mirkaneessi", ok: "Eeyyee", error: "Dogoggora", wrongPassword: "❌ Jecha iccitii dogoggora!",
    noData: "Daataan hin jiru", noProducts: "Oomishni hin jiru", noSales: "Gurgurtaan hin jiru",
    noCredits: "Liqii hin kaffalamne hin jiru", noLosses: "Kasaaraan hin jiru",
    noExpenses: "Baasiin hin jiru", noStaff: "Hojjataan hin jiru",
    noLoans: "Liiziin hin jiru", noBankTransactions: "Sochiin baankii hin jiru",
    day: "Guyyaa", time: "Sa'aa", payment: "Kaffaltii", items: "Meeshaalee",
    cashier: "Cashier", shift: "Shift", detailedSales: "Gurgurtaa bal'aa",
    netCashToOwner: "Qarshii qulqulluu abbaaf",
    dailySales: "Gurgurtaa guyyaa", weeklySales: "Gurgurtaa torbanii", monthlySales: "Gurgurtaa ji'aa",
    schedule: "Sagantaa", startDate: "Guyyaa jalqabaa", lastPaid: "Dhumarratti kaffalame",
    salaryPaid: "Miindaan kaffalame", salaryDue: "Miindaa kaffalamu",
    exportCSVBtn: "CSV ergi", exportTextBtn: "Barreeffama ergi",
    forceReload: "Irra deebi'i", refresh: "Haaromsi", edit: "Sirreessi", delete: "Balleessi",
    disable: "Dhaabi", pay: "Kaffali", receiveOrder: "Ajaja fudhadhu",
    insufficientFunds: "Qarshii gahaa hin qabu", productExists: "Oomishni kun duraan jira!",
    barcodeExists: "Baarkoodiin kun duraan fayyadamaa jira!",
    fillRequired: "Maqaa, Gatii, Kuusaa guuti!",
    fillNameAndSalary: "Maqaa fi Miindaa guuti!",
    cashierPasswordRequired: "Cashiers jecha iccitii barbaadu!",
    cashierLimitReached: "Daangaan cashier gaheera!",
    productLimitReached: "Daangaan oomishaa fi eeyyama kee gaheera.",
    supplierNameRequired: "Maqaan dhiyeessaa barbaachisa!",
    noItemsSelected: "Meeshaalee hin filanne!",
    fillNameAndAmount: "Maqaa fi hamma guuti!",
    enterAccountName: "Maqaa akkaawuntii galchi",
    fillAllFields: "Dirree hunda guuti",
    transactionRecorded: "Sochiin galmeeffame",
    passwordsSaved: "Jechi iccitii nageenyaan olkaa'ame!",
    brandingSaved: "Faayaan olkaa'ame!",
    posSettingsSaved: "Qindaa'inni POS olkaa'ame!",
    invalidKey: "Furtuu sirrii hin taane!",
    licenseActivated: "Eeyyamni dalagaa jira!",
    licenseExpired: "Eeyyamni dhumera!",
    licenseExpiring: "Eeyyamni ni dhumaa",
    shopLevelUpdated: "Sadarkaan suuqii haaromsame",
    calendarUpdated: "Sirni dhahaa haaromsame",
    saved: "Olkaa'ame",
    noDataToExport: "Daataa ergamu hin qabu",
    print: "Maxxansi",
    excelExport: "Excel",
    fitColumns: "Mijji",
    resetFilters: "Irra deebi'i",

    // POS Specific
    loginSubtitle: "Kaashirii Galfata",
    selectName: "-- Maqaa Filadhu --",
    refreshList: "🔄 Tarreeffama Haaromsi",
    passwordPlaceholder: "Jecha Darbii",
    changePwd: "🔑 Jecha Darbii Jijjiira",
    oldPwd: "Jecha Darbii Duraa",
    newPwd: "Jecha Darbii Haaraa",
    licenseMissing: "❌ Hayyamaan jiraachuu dhabe ykn yeroon isaa darbe.",
    authFailed: "Mirkaneessi hin milkoofne.",
    sessionError: "Dogoggora sa'atii hojii",
    loginError: "❌ Dogoggora galfataa hin eegamne",
    sellReport: "Gabaasa Gurgurtaa",
    sellHistory: "Seenaa Gurgurtaa",
    notebook: "Yaadannoo",
    customerLookup: "Maamiltoota Barbaadi",
    priceCheck: "Gatii Mirkaneeffadhu",
    syncNow: "🔄 Walitti fidi",
    heldOrders: "Ajajawwan Qabaman",
    voidRefund: "Deebi'ii / Dursa",
    openShift: "Shifta Bani",
    closeShift: "Shifta Cufi",
    logout: "Ba'i",
    offline: "OFFLINE",
    cartTitle: "Garii",
    negotiate: "Gatii Irratti Waligaltee",
    discountLabel: "Hir'ina:",
    discountPercent: "%",
    discountAmount: "ykn Br",
    redeem: "🎁 Furii",
    taxLabel: "Taksii",
    taxRate: "Hammamtaa:",
    subtotal: "Walittiqaba:",
    discountLine: "Hir'ina:",
    taxLine: "Taksii:",
    total: "Ida'ama:",
    clear: "🗑️ Haqu",
    hold: "📌 Qabi",
    payNow: "💰 Kaffali",
    outOfStock: "Kuusaan dhumee!",
    notEnoughStock: "Kuusaan gahaa miti!",
    lowStockAlert: "⚠️ Kuusaan xiqqaa! Kan hafe ",
    remaining: " qofa.",
    searchPlaceholder: "🔍 Barbaadi...",
    sortAZ: "A-Z",
    sortZA: "Z-A",
    sortPriceUp: "Gatii ↑",
    sortPriceDown: "Gatii ↓",
    sortPopular: "Beekamaa",
    listView: "☰ Tarree",
    gridView: "⊞ Girdii",
    barcodePlaceholder: "🏷️ Baarkoodii barreessi...",
    camera: "📷",
    paymentMethod: "Mala Kaffaltii",
    cash: "💵 Qarshii",
    card: "💳 Kaardii",
    mobile: "📱 Mobayilii",
    credit: "📝 Liqii",
    split: "🧾 Qoodi",
    single: "🔙 Tokko",
    complete: "✅ Xumuri",
    cancelPayment: "Dhiisi",
    notePlaceholder: "📝 Yaadannoo dabali (dirqama miti)",
    customerName: "Maqaa Maamilaa",
    customerPhone: "Bilbila Maamilaa",
    remainingAmount: "Hafe:",
    splitMismatch: "❌ Qoodni ida'ama waliin wal hin simu.",
    creditFieldsRequired: "Maaloo liqiidhaaf maqaa fi bilbila maamilaa galchaa.",
    saleComplete: "🧾 Gurgurtaan Xumurame",
    thanks: "😊 Galatoomi!",
    invoice: "Raashida",
    totalSales: "Gurgurtaa Waliigalaa",
    cashSales: "Qarshii",
    cardSales: "Kaardii",
    mobileSales: "Mobayilii",
    creditSales: "Liqii",
    netCash: "Qarshii Qulqulluu Abbaa Dhaabbataaf",
    itemsSold: "Oomishawwan Gurguraman",
    allTime: "Yeroo Hunda",
    allPayments: "Kaffaltii Hunda",
    allShifts: "Shiftota Hunda",
    morning: "☀️ Ganama",
    afternoon: "🌤 Waaree",
    evening: "🌙 Galgala",
    dailySalesSummary: "📅 Gabaasa Gurgurtaa Guyyaa",
    detailedSales: "📋 Gurgurtaa Bal'aa",
    noSales: "Yeroo kana keessa gurgurtaa hin jiru.",
    loadMore: "⬇ Dabalataa Fe'i",
    excelView: "📊 Ekselii",
    listView2: "📋 Tarree",
    gridView2: "⊞ Girdii",
    writeNote: "Yaadannoo barreessi... (Enter cuqaasi olkaa'uuf)",
    noCategory: "📂 Gosa hin qabu",
    categoryWork: "💼 Hojii",
    categoryPersonal: "👤 Dhuunfaa",
    categoryImportant: "⭐ Barbaachisaa",
    categoryIdea: "💡 Yaada",
    categoryMeeting: "🤝 Walgahii",
    categoryFinance: "💰 Maallaqa",
    searchNotes: "🔍 Yaadannoolee barbaadi...",
    noNotes: "📭 Ammallee yaadannoo hin jiru.",
    deleteNote: "Yaadannoo kana haquu?",
    phonePlaceholder: "Bilbila Maamilaa",
    searching: "🔍 Barbaadaa jira...",
    phoneLabel: "Bilbila:",
    worth: "gatii",
    unpaidCredit: "Liqii Hinkaffalamne",
    priceCheckBarcode: "Baarkoodii barreessi ykn scani",
    checkPrice: "🔍 Mirkaneeffadhu",
    notFound: "❌ Oomishni hin argamne.",
    sellingPrice: "Gatii Gurgurtaa",
    soundOnSale: "🔊 Sagalee gurgurtaa irratti",
    vibrateOnSale: "📳 Gurgurtaa irratti socho'a",
    closeSettings: "Cufi",
    noHeldOrders: "Ajajawwan qabaman hin jiran.",
    heldAt: "Qabame:",
    recall: "🔄 Deebisi",
    deleteHeld: "🗑️ Haqu",
    heldOrderName: "Ajaja qabameef maqaa kenni (fkn, maqaa maamilaa, lakkoofsa minjaala):",
    orderHeld: "✅ Ajajni akka",
    recallOrder: "🔄 Ajajni deebi'ame.",
    deleteHeldConfirm: "Ajaja qabame kana haquu?",
    voidTitle: "↩️ Deebi'ii / Dursa",
    voidInstructions: "Gurgurtaan dhiyoo as gaditti argama. Gurgurtaa haquufi kuusaa deebisuuf Deebi'ii cuqaasi.",
    voidButton: "↩️ Deebi'ii",
    voidPassword: "🔐 Gurgurtaa kana haquuf jecha darbii maaneeyjaraa galchi:",
    voidConfirm: "⚠️ Gurgurtaa kana haquu? Kuusaan ni deebi'a. Kun hin deebi'u.",
    voidSuccess: "✅ Gurgurtaan haqamee kuusaan deebi'ee.",
    incorrectPassword: "❌ Jecha darbii maaneeyjaraa dogoggora. Haquun dhaabbate.",
    shiftOpenConfirm: "Shifta bani?",
    shiftCloseConfirm: "Shifta cufi?",
    shiftOpened: "✅ Shifta baname sa'aa",
    shiftClosed: "🧾 Gabaasa Shiftaa",
    emptyCart: "Gariin duwwaa!",
    confirmDelete: "Yaadannoo kana haquu?",
    loading: "Fe'aa jira...",
    excelExportFailed: "XLSX export hin milkoofne. SheetJS fe'amuu isaa mirkaneeffadhu.",
    syncSuccess: "✅ Hundinuu walitti dhufe",
    syncCount: "✅ {count} gurgurtaa offline walitti dhufan",
    sessionSaved: "✅ Sa'atiin hojii olkaa'ame dhaabbataaf:",
    sessionNotSaved: "⚠️ Sa'atii hojii olkaa'uu hin dandeenye:",
    cameraNotSupported: "Kaameeraan meeshaa kana irratti hin deeggaramu.",
    cameraPermission: "Hayyami kaameeraa dhowwame.",
    productNotFound: "Oomishni hin argamne!",
    enterPhone: "Lakkoofsa bilbilaa galchi.",
    noCashiers: "-- Kaashiroonni hin argamne --"
  }
};


// ===== UNIVERSAL LANGUAGE SYSTEM =====
var appLang = localStorage.getItem('appLang') || 'en';

// Helper function
function t(key) {
  return (langText[appLang] && langText[appLang][key]) || langText['en'][key] || key;
}

function changeLanguage(lc) {
  if (!lc) {
    lc = (typeof appLang !== 'undefined') ? appLang : 'en';
  }
  appLang = lc;
  localStorage.setItem('appLang', lc);

  // 1. Update all elements with data-lang-key (textContent)
  var all = document.querySelectorAll('[data-lang-key]');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var key = el.getAttribute('data-lang-key');
    el.textContent = t(key);
  }

  // 2. Update placeholders with data-lang-key-placeholder
  var placeholders = document.querySelectorAll('[data-lang-key-placeholder]');
  for (var j = 0; j < placeholders.length; j++) {
    var elP = placeholders[j];
    var keyP = elP.getAttribute('data-lang-key-placeholder');
    if (elP.nodeName === 'INPUT' || elP.nodeName === 'TEXTAREA') {
      elP.placeholder = t(keyP);
    }
  }

  // 3. Update the language dropdowns
  var langSelects = document.querySelectorAll('#langSelect');
  for (var k = 0; k < langSelects.length; k++) {
    langSelects[k].value = lc;
  }
}

// ===== SUPABASE INITIALIZATION =====
const SUPABASE_URL = "https://mtwcdvmdoxzcejzgypdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FkTC2_MtgqDkDPuZmjDsag_2uOmsnq8";

let supabaseClient = null; 
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase Connected!");
} else {
    console.error("❌ Supabase library not loaded.");
}


// ===== ENTERPRISE MULTI-SHOP MODULE (GLOBAL SUPABASE) =====
function canManageShops() {
    var lic = getLicense();
    if (!lic) return false;
    return lic.plan === 'enterprise';
}

async function switchShop(newShopId) {
    if (!newShopId || newShopId === getShopId()) return;
    if (!await confirm('Switch to branch "' + newShopId + '"? The page will reload with the new branch data.')) {
        var select = document.getElementById('shopSwitcher');
        if (select) select.value = getShopId();
        return;
    }
    saveShopId(newShopId);
    location.reload();
}

async function loadShopList() {
    var select = document.getElementById('shopSwitcher');
    if (!select) return;
    select.innerHTML = '<option value="">Loading shops…</option>';
    if (!supabaseClient) { select.innerHTML = '<option value="">DB not connected</option>'; return; }
    try {
        const { data, error } = await supabaseClient.from('shops').select('*').eq('active', true);
        if (error) throw error;
        var html = '';
        if (!data || data.length === 0) { html = '<option value="">No branches found</option>'; }
        else {
            data.forEach(function(shop) {
                var selected = (shop.shop_id === getShopId()) ? ' selected' : '';
                html += '<option value="' + shop.shop_id + '"' + selected + '>' + sanitize(shop.name) + '</option>';
            });
        }
        select.innerHTML = html;
        select.style.display = 'inline-block';
    } catch(e) { select.innerHTML = '<option value="">Error loading shops</option>'; }
}

function loadShopsList() {
    var container = document.getElementById('shopsListContainer');
    if (!container) return;
    container.innerHTML = '<p style="color:#94a3b8;">Loading branches…</p>';
    supabaseClient.from('shops').select('*').eq('active', true).then(({data, error}) => {
        if (error) { container.innerHTML = '<p style="color:#f44336;">Error loading branches.</p>'; return; }
        var html = '';
        if (!data || data.length === 0) { html = '<p style="color:#94a3b8;">No branches yet.</p>'; }
        else {
            data.forEach(function(shop) {
                html += '<div style="background:#fff; border-radius:12px; padding:14px; margin-bottom:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center;">' +
                    '<div><b>' + sanitize(shop.name) + '</b>' +
                    (shop.address ? '<br><small>' + sanitize(shop.address) + '</small>' : '') +
                    (shop.phone ? '<br><small>📱 ' + sanitize(shop.phone) + '</small>' : '') +
                    '<br><small style="color:#94a3b8;">ID: ' + shop.shop_id + '</small></div>' +
                    '<div style="display:flex;gap:4px;">' +
                    '<button class="btn-mini" onclick="editShop(\'' + shop.id + '\')">✏️</button>' +
                    '<button class="btn-mini delete" onclick="deleteShop(\'' + shop.id + '\')">🗑️</button>' +
                    '</div></div>';
            });
        }
        container.innerHTML = html;
    });
}

async function addShop() {
    if (!canManageShops()) { alert('Only available for Enterprise plans.'); return; }
    var name = document.getElementById('newShopName').value.trim();
    if (!name) { alert('Enter branch name!'); return; }
    
    var lic = getLicense();
    const { data: existing } = await supabaseClient.from('shops').select('*', { count: 'exact' }).eq('active', true);
    
    var maxShops = lic.maxShops || 5;
    if (existing && existing.length >= maxShops) { 
        alert('⚠️ You have reached the maximum number of branches (' + maxShops + ').'); 
        return; 
    }
    
    var shopId = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 14) + '-' + Math.random().toString(36).substr(2, 4);
    var address = document.getElementById('newShopAddress').value.trim();
    var phone = document.getElementById('newShopPhone').value.trim();
    
    try {
        const { error } = await supabaseClient.from('shops').insert([{
            name: name, shop_id: shopId, address: address, phone: phone,
            plan: lic.plan, active: true, created_at: new Date().toISOString()
        }]);
        if (error) throw error;
        
        alert('✅ Branch "' + name + '" created!');
        document.getElementById('newShopName').value = '';
        document.getElementById('newShopAddress').value = '';
        document.getElementById('newShopPhone').value = '';
        loadShopsList();
        loadShopList(); 
    } catch(e) {
        alert('❌ Add shop failed: ' + e.message);
    }
}

async function editShop(docId) {
    try {
        const { data: shop, error } = await supabaseClient.from('shops').select('*').eq('id', docId).single();
        if (error) throw error;
        
        var newName = await prompt('Branch name:', shop.name); 
        if (!newName) return;
        
        var newAddress = await prompt('Address:', shop.address || '');
        var newPhone = await prompt('Phone:', shop.phone || '');
        
        const { error: updateError } = await supabaseClient.from('shops')
            .update({ name: newName, address: newAddress, phone: newPhone })
            .eq('id', docId);
            
        if (updateError) throw updateError;
        
        alert('✅ Branch updated!');
        loadShopsList();
        loadShopList(); 
    } catch(e) {
        alert('❌ Edit shop failed: ' + e.message);
    }
}

async function deleteShop(docId) {
    try {
        if (!await confirm('Deactivate this branch? Products and sales will not be deleted.')) return;
        
        const { error } = await supabaseClient.from('shops')
            .update({ active: false })
            .eq('id', docId);
            
        if (error) throw error;
        
        alert('✅ Branch deactivated.');
        loadShopsList();
        loadShopList(); 
    } catch(e) {
        alert('❌ Delete shop failed: ' + e.message);
    }
}

function initShopsTab() {
    if (!canManageShops()) {
        var container = document.getElementById('shopsListContainer');
        if (container) container.innerHTML = '<p style="color:#f44336;">⚠️ This feature requires an Enterprise licence.</p>';
        return;
    }
    loadShopsList();
}


// ===== OFFLINE SALE SYNC (Supabase — snake_case + stock deduction + audit) =====
async function syncOfflineSales() {
    var offlineSales = getOfflineSales();
    if (offlineSales.length === 0) return 0;
    if (!navigator.onLine || !supabaseClient) return 0;

    var synced = 0;
    var remaining = [];

    for (var i = 0; i < offlineSales.length; i++) {
        var s = offlineSales[i];
        try {
            var shopId = s.shopId || getShopId();
            var inv = s.invoiceNo || '';

            // 1. Duplicate guard (if a previous sync crashed mid-way, don't insert twice)
            if (inv) {
                const { data: dupe, error: dupeErr } = await supabaseClient.from('sales')
                    .select('id').eq('invoice_no', inv).eq('shop_id', shopId).limit(1);
                if (dupeErr) throw dupeErr;
                if (dupe && dupe.length > 0) { synced++; continue; } // already uploaded
            }

            // 2. Insert sale (snake_case — matches your real columns)
            const { error } = await supabaseClient.from('sales').insert([{
                items: s.items || [],
                subtotal: s.subtotal || 0,
                discount: s.discount || 0,
                tax: s.tax || 0,
                total: s.total || 0,
                profit: s.profit || 0,
                payment_method: s.paymentMethod || 'cash',
                payments: s.payments || [],
                customer_name: s.customerName || '',
                customer_phone: s.customerPhone || '',
                shop_id: shopId,
                cashier_id: s.cashierId || '',
                cashier_name: s.cashierName || '',
                shift_id: s.shiftId || 'unknown',
                time: s.time || new Date().toISOString(),
                note: s.note || '',
                invoice_no: inv,
                order_type: s.orderType || ''
            }]);
            if (error) throw error;

            // 3. Deduct stock in the database (products + recipe ingredients)
            await syncDeductStockForSale(s.items || [], inv, shopId, s.cashierId);

            synced++;
        } catch (e) {
            console.warn('Offline sync failed for ' + (s.invoiceNo || 'sale') + ':', e.message);
            remaining.push(s);
        }
    }

    if (remaining.length === 0) clearOfflineSales();
    else localStorage.setItem('offlineSales', JSON.stringify(remaining));

    // 4. Refresh product list so stock display is correct (POS)
    if (synced > 0) {
        try { if (typeof loadProducts === 'function') loadProducts(); } catch (e) {}
    }
    return synced;
}

// Self-contained stock deduction for synced sales (dual-ID safe)
async function syncDeductStockForSale(items, invoiceNo, shopId, cashierId) {
    if (!items.length) return;
    try {
        // Fetch this shop's products once (for is_virtual + unit lookups)
        const { data: prods, error: pErr } = await supabaseClient.from('products')
            .select('id, firebase_id, is_virtual, unit, name')
            .eq('shop_id', shopId);
        if (pErr) throw pErr;

        var byId = {};
        (prods || []).forEach(function (p) {
            byId[String(p.id)] = p;
            if (p.firebase_id) byId[p.firebase_id] = p;
        });

        var plan = {}, soldAdd = {}, names = {};

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var prod = byId[item.productId];

            // A. Main product (skip virtual — they deduct via recipe)
            if (prod && !prod.is_virtual) {
                plan[item.productId] = (plan[item.productId] || 0) + (item.qty || 0);
                soldAdd[item.productId] = true;
                names[item.productId] = item.name || prod.name;
            }

            // B. Recipe ingredients (with unit conversion when available)
            const { data: recipe } = await supabaseClient.from('recipes')
                .select('yield, items').eq('product_id', item.productId).limit(1).maybeSingle();
            if (recipe && recipe.items && recipe.items.length) {
                var y = recipe.yield || 1;
                for (var j = 0; j < recipe.items.length; j++) {
                    var ing = recipe.items[j];
                    var need = ((ing.qty || 0) / y) * (item.qty || 0);
                    var ingProd = byId[ing.ingredientId];
                    if (ingProd && typeof getConversionFactor === 'function') {
                        need = need * getConversionFactor(ing.unit, ingProd.unit);
                    }
                    plan[ing.ingredientId] = (plan[ing.ingredientId] || 0) + need;
                    if (ingProd) names[ing.ingredientId] = ingProd.name;
                }
            }
        }

        var pids = Object.keys(plan);
        if (!pids.length) return;

        // C. Atomic deduction (RPC matches UUID and firebase_id)
        var moves = pids.map(function (pid) {
            return { product_id: pid, qty: plan[pid], is_sale_item: !!soldAdd[pid] };
        });
        var rpc = await supabaseClient.rpc('deduct_stock', { moves: moves });
        if (rpc.error) throw rpc.error;

        // D. Audit trail
        try {
            var logs = pids.map(function (pid) {
                return {
                    shop_id: shopId, product_id: pid, product_name: names[pid] || '',
                    qty_out: plan[pid], reason: 'offline_sync',
                    invoice_no: invoiceNo || '', cashier_id: cashierId || '',
                    created_at: new Date().toISOString()
                };
            });
            await supabaseClient.from('stock_movements').insert(logs);
        } catch (e) {}
    } catch (e) {
        console.warn('Offline stock deduction failed:', e.message);
    }
}