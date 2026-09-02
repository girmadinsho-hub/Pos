// ==========================================
// SMARTBIZ PRO - ADVANCED FEATURES MODULE
// ==========================================



// ===== FEATURE 1: PROFIT & LOSS STATEMENT =====
function openPnLModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var pnlStart = document.getElementById('pnlStartDate');
    var pnlEnd = document.getElementById('pnlEndDate');
    if (pnlStart) pnlStart.value = firstDay;
    if (pnlEnd) pnlEnd.value = today;
    
    var pnlRes = document.getElementById('pnlResult');
    if (pnlRes) pnlRes.style.display = 'none';
    
    var pnlModal = document.getElementById('pnLModal');
    if (pnlModal) pnlModal.classList.add('active');
}

function openZReportModal() {
    var now = new Date();
    var today = now.toISOString().slice(0,10);
    var zDate = document.getElementById('zReportDate');
    if (zDate) zDate.value = today;
    
    var zRes = document.getElementById('zReportResult');
    if (zRes) zRes.style.display = 'none';
    
    var zModal = document.getElementById('zReportModal');
    if (zModal) zModal.classList.add('active');
}

function openTaxReportModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var tStart = document.getElementById('taxStartDate');
    var tEnd = document.getElementById('taxEndDate');
    if (tStart) tStart.value = firstDay;
    if (tEnd) tEnd.value = today;
    
    var tRes = document.getElementById('taxResult');
    if (tRes) tRes.style.display = 'none';
    
    var tModal = document.getElementById('taxReportModal');
    if (tModal) tModal.classList.add('active');
}

function openExpenseReportModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var eStart = document.getElementById('expRptStartDate');
    var eEnd = document.getElementById('expRptEndDate');
    if (eStart) eStart.value = firstDay;
    if (eEnd) eEnd.value = today;
    
    var eRes = document.getElementById('expRptResult');
    if (eRes) eRes.style.display = 'none';
    
    var eModal = document.getElementById('expenseReportModal');
    if (eModal) eModal.classList.add('active');
}

async function generatePnL() {
    var startDate = document.getElementById('pnlStartDate').value;
    var endDate = document.getElementById('pnlEndDate').value;
    
    if (!startDate || !endDate) { alert('Please select dates'); return; }
    
    var resultDiv = document.getElementById('pnlResult');
    resultDiv.innerHTML = '<p style="text-align:center;">Calculating...</p>';
    resultDiv.style.display = 'block';

    try {
        var startDateTime = startDate + "T00:00:00";
        var endDateTime = endDate + "T23:59:59";
        
        var revenue = 0;
        var grossProfit = 0;
        var totalExpenses = 0;
        var totalLosses = 0;

        if (supabaseClient) {
            // 1. FETCH SALES
            const { data: salesData, error: salesError } = await supabaseClient.from('sales').select('total, profit').eq('shop_id', getShopId()).gte('time', startDateTime).lte('time', endDateTime);
            if (salesError) throw salesError;
            if (salesData) salesData.forEach(function(sale) { revenue += sale.total || 0; grossProfit += sale.profit || 0; });

            // 2. FETCH EXPENSES
            const { data: expData, error: expError } = await supabaseClient.from('expenses').select('amount, date').eq('shop_id', getShopId()).gte('date', startDate).lte('date', endDate);
            if (expError) throw expError;
            if (expData) expData.forEach(function(e) { totalExpenses += e.amount || 0; });

            // 3. FETCH LOSSES
            const { data: lossData, error: lossError } = await supabaseClient.from('losses').select('total_loss, time').eq('shop_id', getShopId()).gte('time', startDateTime).lte('time', endDateTime);
            if (lossError) throw lossError;
            if (lossData) lossData.forEach(function(l) { totalLosses += l.total_loss || 0; });
        }

        var cogs = revenue - grossProfit;
        var netProfit = grossProfit - totalExpenses - totalLosses;
        var margin = revenue > 0 ? (netProfit / revenue * 100).toFixed(1) : 0;

        var html = '<div style="border:2px solid #1e293b; padding:15px; border-radius:8px;">';
        html += '<h3 style="text-align:center; margin-bottom:15px;">Profit and Loss Statement</h3>';
        html += '<p style="text-align:center; font-size:12px; margin-bottom:15px;">For the period: ' + startDate + ' to ' + endDate + '</p>';
        
        html += '<div style="border-bottom:1px solid #ccc; padding-bottom:5px;"><b>REVENUE</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Gross Sales</span><span>' + fmtMoney(revenue) + '</span></div>';
        
        html += '<div style="border-bottom:1px solid #ccc; padding-bottom:5px; margin-top:10px;"><b>COST OF GOODS SOLD (COGS)</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; color:#ef4444;"><span>Cost of Items Sold</span><span>(' + fmtMoney(cogs) + ')</span></div>';
        
        html += '<div style="display:flex; justify-content:space-between; padding:10px 0; font-weight:bold; border-bottom:2px solid #1e293b;"><span>GROSS PROFIT</span><span>' + fmtMoney(grossProfit) + '</span></div>';
        
        html += '<div style="border-bottom:1px solid #ccc; padding-bottom:5px; margin-top:10px;"><b>OPERATING EXPENSES and LOSSES</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; color:#ef4444;"><span>Total Expenses</span><span>(' + fmtMoney(totalExpenses) + ')</span></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; color:#ef4444;"><span>Inventory Losses</span><span>(' + fmtMoney(totalLosses) + ')</span></div>';
        
        html += '<div style="display:flex; justify-content:space-between; padding:10px 0; font-size:18px; font-weight:bold; color:' + (netProfit >= 0 ? '#10b981' : '#ef4444') + ';"><span>NET PROFIT</span><span>' + fmtMoney(netProfit) + '</span></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#64748b;"><span>Net Profit Margin</span><span>' + margin + '%</span></div>';
        html += '</div>';
        
        html += '<button class="btn btn-primary" onclick="printPnL()" style="width:100%; margin-top:15px;">Print Statement</button>';

        resultDiv.innerHTML = html;
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}



function printPnL() {
    var content = document.getElementById('pnlResult').innerHTML;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>P and L Statement</title><style>body{font-family:monospace;padding:20px;width:280px;margin:auto;}</style></head><body>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}

// ===== FEATURE 2: END OF DAY Z-REPORT =====
function openZReportModal() {
    var now = new Date();
    var today = now.toISOString().slice(0,10);
    var zDate = document.getElementById('zDate');
    if (zDate) zDate.value = today;
    
    var zRes = document.getElementById('zResult');
    if (zRes) zRes.style.display = 'none';
    
    var zModal = document.getElementById('zReportModal');
    if (zModal) zModal.classList.add('active');
}

async function generateZReport() {
    var reportDate = document.getElementById('zReportDate').value;
    if (!reportDate) { alert('Please select a date'); return; }
    
    var resultDiv = document.getElementById('zReportResult');
    if (!resultDiv) return alert('Result div not found!');
    
    resultDiv.innerHTML = '<p style="text-align:center;">Calculating shift...</p>';
    resultDiv.style.display = 'block';

    try {
        // Fetch directly from Supabase (Lightning Fast!)
        var startOfDay = reportDate + "T00:00:00";
        var endOfDay = reportDate + "T23:59:59";
        
        const { data, error } = await supabaseClient
            .from('sales')
            .select('total, payment_method, items')
            .eq('shop_id', getShopId())
            .gte('time', startOfDay)
            .lte('time', endOfDay);

        if (error) throw error;

        var cash = 0, card = 0, mobile = 0, credit = 0, totalSales = 0, txCount = 0;
        
        if (data && data.length > 0) {
            txCount = data.length;
            data.forEach(function(sale) {
                var saleTotal = sale.total || 0;
                totalSales += saleTotal;
                
                if (sale.payment_method === 'cash') cash += saleTotal;
                else if (sale.payment_method === 'card') card += saleTotal;
                else if (sale.payment_method === 'mobile') mobile += saleTotal;
                else if (sale.payment_method === 'credit') credit += saleTotal;
            });
        }

        var html = '<div style="border:2px dashed #1e293b; padding:15px; border-radius:8px;">';
        html += '<h3 style="text-align:center; margin-bottom:5px;">Z-REPORT (End of Day)</h3>';
        html += '<p style="text-align:center; font-size:12px; margin-bottom:15px;">Date: ' + reportDate + '</p>';
        
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Total Transactions:</span><b>' + txCount + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #ccc; margin-bottom:10px;"><span>Gross Sales:</span><b>' + fmtMoney(totalSales) + '</b></div>';
        
        html += '<div style="display:flex; justify-content:space-between; padding:8px 0;"><span>💵 Cash Expected:</span><b style="color:#10b981;">' + fmtMoney(cash) + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:8px 0;"><span>💳 Card:</span><b>' + fmtMoney(card) + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:8px 0;"><span>📱 Mobile:</span><b>' + fmtMoney(mobile) + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #ccc; margin-bottom:10px;"><span>📝 Credit/Unpaid:</span><b style="color:#ef4444;">' + fmtMoney(credit) + '</b></div>';
        
        html += '<p style="text-align:center; font-size:12px; margin-top:10px;">⚠️ Count physical cash in drawer and compare to Cash Expected.</p>';
        html += '</div>';
        
        html += '<button class="btn btn-primary" onclick="printZReport()" style="width:100%; margin-top:15px;">🖨️ Print Z-Report</button>';

        resultDiv.innerHTML = html;
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}

function printZReport() {
    var content = document.getElementById('zReportResult').innerHTML;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>Z-Report</title><style>body{font-family:monospace;padding:20px;width:280px;margin:auto;}</style></head><body>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}



// ===== FEATURE 3: TAX LIABILITY REPORT =====
function openTaxReportModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var tStart = document.getElementById('taxStartDate');
    var tEnd = document.getElementById('taxEndDate');
    if (tStart) tStart.value = firstDay;
    if (tEnd) tEnd.value = today;
    
    var tRes = document.getElementById('taxResult');
    if (tRes) tRes.style.display = 'none';
    
    var tModal = document.getElementById('taxReportModal');
    if (tModal) tModal.classList.add('active');
}

async function generateTaxReport() {
    var startDate = document.getElementById('taxStartDate').value;
    var endDate = document.getElementById('taxEndDate').value;
    if (!startDate || !endDate) { alert('Please select dates'); return; }

    var resultDiv = document.getElementById('taxResult');
    resultDiv.innerHTML = '<p style="text-align:center;">Calculating tax...</p>';
    resultDiv.style.display = 'block';

    try {
        // Load tax config from settings
        var taxName = 'Tax';
        var taxRate = 0;
        const { data: settingData } = await supabaseClient.from('settings')
            .select('tax_name, tax_rate').eq('shop_id', getShopId()).maybeSingle();
        if (settingData) {
            taxName = settingData.tax_name || 'Tax';
            taxRate = settingData.tax_rate || 0;
        }

        var startDateTime = startDate + 'T00:00:00';
        var endDateTime = endDate + 'T23:59:59';

        const { data, error } = await supabaseClient.from('sales')
            .select('subtotal, tax, total, time')
            .eq('shop_id', getShopId())
            .gte('time', startDateTime)
            .lte('time', endDateTime);
        if (error) throw error;

        var grossSales = 0, totalTaxCollected = 0, netSales = 0, txCount = 0;
        (data || []).forEach(function(s) {
            txCount++;
            grossSales += s.subtotal || 0;
            totalTaxCollected += s.tax || 0;
            netSales += s.total || 0;
        });

        var html = '<div style="border:2px solid #1e293b; padding:15px; border-radius:8px;">';
        html += '<h3 style="text-align:center; margin-bottom:5px;">Tax Liability Report</h3>';
        html += '<p style="text-align:center; font-size:12px; margin-bottom:15px;">' + taxName + ' (' + taxRate + '%) | ' + startDate + ' to ' + endDate + '</p>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Total Transactions:</span><b>' + txCount + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Gross Sales (Before Tax):</span><b>' + fmtMoney(grossSales) + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #ccc; margin-bottom:10px;"><span>Total Sales (Including Tax):</span><b>' + fmtMoney(netSales) + '</b></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:10px 0; font-size:18px; font-weight:bold; color:#ef4444;"><span>' + taxName + ' COLLECTED:</span><span>' + fmtMoney(totalTaxCollected) + '</span></div>';
        html += '<p style="text-align:center; font-size:12px; margin-top:15px;">This is the amount you need to remit to the tax authority.</p>';
        html += '</div>';
        html += '<button class="btn btn-primary" onclick="printTaxReport()" style="width:100%; margin-top:15px;">🖨️ Print Tax Report</button>';
        resultDiv.innerHTML = html;
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}
function printTaxReport() {
    var content = document.getElementById('taxResult').innerHTML;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>Tax Report</title><style>body{font-family:monospace;padding:20px;width:280px;margin:auto;}</style></head><body>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}

// ===== FEATURE 4: EXPENSE BREAKDOWN REPORT =====
function openExpenseReportModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var eStart = document.getElementById('expRptStartDate');
    var eEnd = document.getElementById('expRptEndDate');
    if (eStart) eStart.value = firstDay;
    if (eEnd) eEnd.value = today;
    
    var eRes = document.getElementById('expRptResult');
    if (eRes) eRes.style.display = 'none';
    
    var eModal = document.getElementById('expenseReportModal');
    if (eModal) eModal.classList.add('active');
}


async function generateExpenseReport() {
    var startDate = document.getElementById('expRptStartDate').value;
    var endDate = document.getElementById('expRptEndDate').value;
    if (!startDate || !endDate) { alert('Please select dates'); return; }
    
    var resultDiv = document.getElementById('expRptResult');
    resultDiv.innerHTML = '<p style="text-align:center;">Calculating expenses...</p>';
    resultDiv.style.display = 'block';

    try {
        const { data: expData, error } = await supabaseClient.from('expenses').select('amount, date, category').eq('shop_id', getShopId()).gte('date', startDate).lte('date', endDate);
        if (error) throw error;

        var categoryTotals = {};
        var grandTotal = 0;
        
        if (expData) {
            expData.forEach(function(e) {
                var cat = e.category || 'General';
                if (!categoryTotals[cat]) categoryTotals[cat] = 0;
                categoryTotals[cat] += e.amount || 0;
                grandTotal += e.amount || 0;
            });
        }

        var html = '<div style="border:2px solid #1e293b; padding:15px; border-radius:8px;">';
        html += '<h3 style="text-align:center; margin-bottom:5px;">Expense Breakdown Report</h3>';
        html += '<p style="text-align:center; font-size:12px; margin-bottom:15px;">' + startDate + ' to ' + endDate + '</p>';
        
        if (grandTotal === 0) {
            html += '<p style="text-align:center; color:#64748b;">No expenses recorded in this period.</p>';
        } else {
            var sortedCats = Object.keys(categoryTotals).sort(function(a, b) { return categoryTotals[b] - categoryTotals[a]; });
            
            sortedCats.forEach(function(cat) {
                var amount = categoryTotals[cat];
                var percent = (amount / grandTotal * 100).toFixed(1);
                
                html += '<div style="margin-bottom:12px;">';
                html += '<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><b>' + cat + '</b><b>' + fmtMoney(amount) + '</b></div>';
                html += '<div style="width:100%; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">';
                html += '<div style="width:' + percent + '%; height:100%; background:#ef4444;"></div>';
                html += '</div>';
                html += '<div style="text-align:right; font-size:11px; color:#64748b; margin-top:2px;">' + percent + '%</div>';
                html += '</div>';
            });
            
            html += '<div style="display:flex; justify-content:space-between; padding:10px 0; margin-top:10px; border-top:2px solid #1e293b; font-size:18px; font-weight:bold; color:#ef4444;"><span>TOTAL EXPENSES</span><span>' + fmtMoney(grandTotal) + '</span></div>';
        }
        
        html += '</div>';
        html += '<button class="btn btn-primary" onclick="printExpenseReport()" style="width:100%; margin-top:15px;">🖨️ Print Report</button>';

        resultDiv.innerHTML = html;
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}





function printExpenseReport() {
    var content = document.getElementById('expRptResult').innerHTML;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>Expense Report</title><style>body{font-family:monospace;padding:20px;width:280px;margin:auto;}</style></head><body>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}

// ===== FEATURE 9: SMART REORDER REPORT =====
function openRestockModal() {
    var rModal = document.getElementById('restockModal');
    if (!rModal) return;
    
    var listDiv = document.getElementById('restockList');
    var lowStockItems = products.filter(function(p) { 
        return !p.isVirtual && p.stock <= (p.reorderLevel || 5); 
    });

    if (lowStockItems.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#10b981; padding:20px;">✅ All stock levels are healthy! Nothing to reorder.</p>';
    } else {
        var html = '<table class="excel-table" style="width:100%; font-size:13px;"><thead><tr><th>Item</th><th>In Stock</th><th>Reorder Lvl</th><th>Suggested Qty</th></tr></thead><tbody>';
        lowStockItems.forEach(function(p) {
            var suggestedQty = (p.reorderLevel || 5) * 2; 
            html += '<tr>' +
                '<td style="padding:8px; font-weight:600;">' + p.name + '</td>' +
                '<td style="padding:8px; color:#ef4444; text-align:center;">' + p.stock + ' ' + (p.unit||'') + '</td>' +
                '<td style="padding:8px; text-align:center;">' + (p.reorderLevel || 5) + '</td>' +
                '<td style="padding:8px; text-align:center; font-weight:bold; color:#2563eb;">' + suggestedQty + '</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        listDiv.innerHTML = html;
    }
    
    rModal.classList.add('active');
}

function printRestockList() {
    var content = document.getElementById('restockList').innerHTML;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>Restock List</title><style>body{font-family:monospace;padding:20px;width:280px;margin:auto;} table{width:100%; border-collapse:collapse;} th, td{border:1px solid #ccc; padding:5px; font-size:12px;}</style></head><body><h3 style="text-align:center;">🛒 Restock List</h3>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}

async function loadSmartForecast() {
    var container = document.getElementById('forecastAnalytics');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center; color:#94a3b8;">Calculating forecast...</p>';

    try {
        var now = new Date();
        var startDate = new Date(now.getTime() - 30 * 86400000);
        var startStr = startDate.toISOString();
        
        const { data: salesData, error } = await supabaseClient.from('sales').select('total, time, items').eq('shop_id', getShopId()).gte('time', startStr);
        if (error) throw error;
        
        var totalRevenue = 0;
        var daysCount = 0;
        var itemTotals = {};
        var salesByDay = {};
        
        if (salesData) {
            salesData.forEach(function(s) {
                var saleDate = new Date(s.time);
                totalRevenue += s.total || 0;
                
                var dayStr = saleDate.toDateString();
                if (!salesByDay[dayStr]) {
                    salesByDay[dayStr] = 0;
                    daysCount++;
                }
                salesByDay[dayStr] += s.total || 0;
                
                (s.items || []).forEach(function(item) {
                    if (!itemTotals[item.name]) itemTotals[item.name] = 0;
                    itemTotals[item.name] += item.qty || 0;
                });
            });
        }

        if (daysCount === 0) {
            container.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:13px; padding:10px;">Not enough data to forecast. Need at least 1 day of sales.</p>';
            return;
        }

        var avgRevenue = totalRevenue / daysCount;
        
        var itemArr = Object.keys(itemTotals).map(function(name) {
            return { name: name, totalQty: itemTotals[name], avgQty: Math.ceil(itemTotals[name] / daysCount) };
        }).sort(function(a, b) { return b.totalQty - a.totalQty; });

        var html = '<div style="background:#eff6ff; padding:15px; border-radius:8px; text-align:center; margin-bottom:15px; border:1px solid #bfdbfe;">';
        html += '<div style="font-size:12px; color:#2563eb; font-weight:600;">🤖 EXPECTED REVENUE (TOMORROW)</div>';
        html += '<div style="font-size:28px; font-weight:800; color:#1e3a8a; margin-top:5px;">' + fmtMoney(avgRevenue) + '</div>';
        html += '<small style="color:#64748b;">Based on ' + daysCount + '-day average</small>';
        html += '</div>';

        html += '<h4 style="font-size:14px; color:#1e293b; margin-bottom:10px;">🛒 Smart Prep List (Avg Daily Qty)</h4>';
        
        if (itemArr.length === 0) {
            html += '<p style="font-size:13px; color:#64748b;">No items sold in the last 30 days.</p>';
        } else {
            html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">';
            itemArr.slice(0, 6).forEach(function(item) {
                html += '<div style="background:#f8fafc; padding:10px; border-radius:6px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">';
                html += '<span style="font-size:12px; font-weight:600; color:#334155; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + item.name + '</span>';
                html += '<span style="font-size:16px; font-weight:800; color:#f59e0b; margin-left:5px;">~' + item.avgQty + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }
        
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<p style="color:red; font-size:12px;">Error loading forecast.</p>';
    }
}


// ===== FEATURE 29: SECURITY AUDIT LOG VIEWER =====
async function openAuditLogModal() {
    var aModal = document.getElementById('auditLogModal');
    if (!aModal) return;
    
    var listDiv = document.getElementById('auditLogList');
    listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Loading security logs...</p>';
    
    aModal.classList.add('active');

    try {
        const { data, error } = await supabaseClient.from('audit_logs')
            .select('*')
            .eq('shop_id', getShopId())
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No actions logged yet.</p>';
            return;
        }

        var html = '';
        data.forEach(function(log) {
            var time = new Date(log.timestamp).toLocaleString();
            var color = '#ef4444';
            if (log.action === 'LOGIN') color = '#3b82f6';
            
            html += '<div style="background:#fef2f2; border-left:4px solid ' + color + '; padding:10px; margin-bottom:8px; border-radius:6px;">';
            html += '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">';
            html += '<b style="font-size:14px; color:#1e293b;">' + (log.action || 'UNKNOWN').replace(/_/g, ' ') + '</b>';
            html += '<small style="color:#64748b;">' + time + '</small>';
            html += '</div>';
            html += '<div style="font-size:13px; color:#334155;">' + (log.details || '') + '</div>';
            html += '<div style="font-size:12px; color:#64748b; margin-top:4px;">👤 Staff: ' + (log.cashier_name || 'Unknown') + '</div>';
            html += '</div>';
        });

        listDiv.innerHTML = html;
    } catch(e) {
        listDiv.innerHTML = '<p style="color:red;">Error loading logs: ' + e.message + '</p>';
    }
}


// ===== FEATURE 17: MENU ENGINEERING REPORT =====
function openMenuEngModal() {
    var mModal = document.getElementById('menuEngModal');
    if (!mModal) return;
    
    var listDiv = document.getElementById('menuEngList');
    listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Analyzing menu...</p>';
    
    mModal.classList.add('active');

    setTimeout(async function() {
        try {
            const { data, error } = await supabaseClient.from('sales').select('items').eq('shop_id', getShopId());
            if (error) throw error;

            var itemData = {};
            
            if (data) {
                data.forEach(function(sale) {
                    var items = sale.items || [];
                    items.forEach(function(item) {
                        if (!itemData[item.name]) {
                            itemData[item.name] = { qty: 0, profit: 0, revenue: 0 };
                        }
                        var itemProfit = (item.price || 0) - (item.costPrice || 0);
                        itemData[item.name].qty += item.qty || 0;
                        itemData[item.name].profit += itemProfit * (item.qty || 0);
                        itemData[item.name].revenue += (item.price || 0) * (item.qty || 0);
                    });
                });
            }

            var items = Object.keys(itemData).map(function(name) {
                return { name: name, qty: itemData[name].qty, profit: itemData[name].profit, revenue: itemData[name].revenue };
            });

            if (items.length === 0) {
                listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No sales data to analyze yet.</p>';
                return;
            }

            var totalQty = items.reduce(function(s, i) { return s + i.qty; }, 0);
            var totalProfit = items.reduce(function(s, i) { return s + i.profit; }, 0);
            var avgQty = totalQty / items.length;
            var avgProfit = totalProfit / items.length;

            var stars = [], plowhorses = [], puzzles = [], dogs = [];
            
            items.forEach(function(item) {
                if (item.qty >= avgQty && item.profit >= avgProfit) stars.push(item);
                else if (item.qty >= avgQty && item.profit < avgProfit) plowhorses.push(item);
                else if (item.qty < avgQty && item.profit >= avgProfit) puzzles.push(item);
                else dogs.push(item);
            });

            var sortFn = function(a, b) { return b.profit - a.profit; };
            stars.sort(sortFn); plowhorses.sort(sortFn); puzzles.sort(sortFn); dogs.sort(sortFn);

            var html = '';
            
            function renderGroup(arr, title, color, emoji, advice) {
                if (arr.length === 0) return '';
                var h = '<div style="margin-bottom:15px;">';
                h += '<div style="background:'+color+'; color:white; padding:8px 12px; border-radius:8px 8px 0 0; font-weight:bold;">'+emoji+' '+title+' ('+arr.length+')</div>';
                h += '<div style="border:1px solid #e2e8f0; border-top:none; border-radius:0 0 8px 8px; padding:8px;">';
                h += '<small style="color:#64748b; display:block; margin-bottom:8px;">'+advice+'</small>';
                
                arr.forEach(function(i) {
                    h += '<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f1f5f9; font-size:13px;">';
                    h += '<span><b>'+i.name+'</b><br><small style="color:#64748b;">Sold: '+i.qty+'</small></span>';
                    h += '<span style="text-align:right; color:'+color+';"><b>'+fmtMoney(i.profit)+'</b><br><small style="color:#64748b;">Profit</small></span>';
                    h += '</div>';
                });
                h += '</div></div>';
                return h;
            }

            html += renderGroup(stars, 'STARS', '#10b981', '⭐', 'High profit & popular. Keep these on the menu!');
            html += renderGroup(plowhorses, 'PLOWHORSES', '#f59e0b', '🐴', 'Popular but low profit. Consider raising the price.');
            html += renderGroup(puzzles, 'PUZZLES', '#3b82f6', '🧩', 'High profit but not selling. Promote these better!');
            html += renderGroup(dogs, 'DOGS', '#ef4444', '🐶', 'Low profit & not selling. Remove from menu.');

            listDiv.innerHTML = html;
        } catch(e) {
            listDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
        }
    }, 100);
}


// ===== FEATURE 6: CUSTOMER CRM PROFILES =====
async function openCrmModal() {
    var cModal = document.getElementById('crmModal');
    if (!cModal) return;
    
    var listDiv = document.getElementById('crmList');
    listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Building customer profiles...</p>';
    
    cModal.classList.add('active');

    try {
        const { data, error } = await supabaseClient.from('sales').select('customer_name, customer_phone, total, payment_method, paid_at, time').eq('shop_id', getShopId());
        if (error) throw error;

        var customers = {};
        
        if (data) {
            data.forEach(function(s) {
                if (s.customer_name || s.customer_phone) {
                    var key = s.customer_phone || s.customer_name;
                    if (!customers[key]) {
                        customers[key] = { name: s.customer_name || 'Unknown', phone: s.customer_phone || '-', totalSpend: 0, visitCount: 0, creditDue: 0, lastVisit: '' };
                    }
                    
                    customers[key].totalSpend += s.total || 0;
                    customers[key].visitCount++;
                    if (s.payment_method === 'credit' && !s.paid_at) {
                        customers[key].creditDue += s.total || 0;
                    }
                    
                    if (!customers[key].lastVisit || s.time > customers[key].lastVisit) {
                        customers[key].lastVisit = s.time;
                    }
                }
            });
        }

        var arr = Object.values(customers).sort(function(a, b) { return b.totalSpend - a.totalSpend; });

        if (arr.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No customer data yet. Add customer names/phones to your credit sales!</p>';
            return;
        }

        var html = '<table class="excel-table" style="width:100%; font-size:12px;"><thead><tr><th>Name</th><th>Visits</th><th>Total Spend</th><th>Credit Due</th></tr></thead><tbody>';
        
        arr.forEach(function(c) {
            var creditColor = c.creditDue > 0 ? '#ef4444' : '#10b981';
            html += '<tr>' +
                '<td style="padding:8px;"><b>' + sanitize(c.name) + '</b><br><small style="color:#64748b;">' + c.phone + '</small></td>' +
                '<td style="padding:8px; text-align:center;">' + c.visitCount + '</td>' +
                '<td style="padding:8px; text-align:right; font-weight:bold; color:#2563eb;">' + fmtMoney(c.totalSpend) + '</td>' +
                '<td style="padding:8px; text-align:right; font-weight:bold; color:' + creditColor + ';">' + fmtMoney(c.creditDue) + '</td>' +
            '</tr>';
        });
        
        html += '</tbody></table>';
        listDiv.innerHTML = html;
    } catch(e) {
        listDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}










// ===== FEATURE 7: WHATSAPP MARKETING CAMPAIGNS =====
async function openMarketingModal() {
    var mModal = document.getElementById('marketingModal');
    if (!mModal) return;
    
    var listDiv = document.getElementById('marketingList');
    listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Finding inactive customers...</p>';
    
    mModal.classList.add('active');

    try {
        const { data, error } = await supabaseClient.from('sales').select('customer_name, customer_phone, time').eq('shop_id', getShopId());
        if (error) throw error;

        var customers = {};
        
        if (data) {
            data.forEach(function(s) {
                if (s.customer_phone) {
                    if (!customers[s.customer_phone]) {
                        customers[s.customer_phone] = { name: s.customer_name || 'Customer', phone: s.customer_phone, lastVisit: '' };
                    }
                    if (!customers[s.customer_phone].lastVisit || s.time > customers[s.customer_phone].lastVisit) {
                        customers[s.customer_phone].lastVisit = s.time;
                    }
                }
            });
        }

        var now = new Date();
        var thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
        var inactiveCustomers = [];

        Object.values(customers).forEach(function(c) {
            if (new Date(c.lastVisit) < thirtyDaysAgo) {
                inactiveCustomers.push(c);
            }
        });

        if (inactiveCustomers.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#10b981; padding:20px;">✅ All your customers have visited in the last 30 days! Great job.</p>';
            return;
        }

        var promoMsg = encodeURIComponent("Hello! We miss you at our shop. Come back this week and get a 10% discount on your order! Show this message to the cashier.");
        
        var html = '<p style="font-size:12px; color:#64748b; margin-bottom:15px;">These customers haven\'t visited in over 30 days. Click "Send Promo" to message them on WhatsApp.</p>';
        
        inactiveCustomers.forEach(function(c) {
            var cleanPhone = c.phone.replace(/[^0-9]/g, '');
            var daysSince = Math.floor((now - new Date(c.lastVisit)) / 86400000);
            
            html += '<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">';
            html += '<div><b>' + sanitize(c.name) + '</b><br><small style="color:#64748b;">Last visit: ' + daysSince + ' days ago</small></div>';
            html += '<a href="https://wa.me/' + cleanPhone + '?text=' + promoMsg + '" target="_blank" class="btn btn-success btn-sm" style="background:#25D366; color:white; text-decoration:none; padding:8px 15px;">💬 Send Promo</a>';
            html += '</div>';
        });

        listDiv.innerHTML = html;
    } catch(e) {
        listDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}


// ===== FEATURE 14: SALES COMMISSION TRACKING =====
function openCommissionModal() {
    var cModal = document.getElementById('commissionModal');
    if (!cModal) return;
    
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var cStart = document.getElementById('commStartDate');
    var cEnd = document.getElementById('commEndDate');
    if (cStart) cStart.value = firstDay;
    if (cEnd) cEnd.value = today;
    
    var cRes = document.getElementById('commResult');
    if (cRes) cRes.style.display = 'none';
    
    cModal.classList.add('active');
}

async function generateCommissionReport() {
    var startDate = document.getElementById('commStartDate').value;
    var endDate = document.getElementById('commEndDate').value;
    var rate = parseFloat(document.getElementById('commRate').value) || 0;

    if (!startDate || !endDate) { alert('Please select dates'); return; }
    if (rate <= 0) { alert('Please enter a commission rate (e.g., 2 for 2%)'); return; }

    var resultDiv = document.getElementById('commResult');
    resultDiv.innerHTML = '<p style="text-align:center;">Calculating commissions...</p>';
    resultDiv.style.display = 'block';

    try {
        var startDateTime = startDate + 'T00:00:00';
        var endDateTime = endDate + 'T23:59:59';

        const { data, error } = await supabaseClient.from('sales')
            .select('cashier_name, total')
            .eq('shop_id', getShopId())
            .gte('time', startDateTime)
            .lte('time', endDateTime);
        if (error) throw error;

        var staffData = {};
        var totalShopSales = 0;
        var txCount = 0;

        (data || []).forEach(function(s) {
            var name = s.cashier_name || 'Unknown';
            if (!staffData[name]) staffData[name] = { sales: 0, txCount: 0 };
            staffData[name].sales += s.total || 0;
            staffData[name].txCount++;
            totalShopSales += s.total || 0;
            txCount++;
        });

        var arr = Object.keys(staffData).map(function(name) {
            return { name: name, sales: staffData[name].sales, txCount: staffData[name].txCount, commission: staffData[name].sales * (rate / 100) };
        });
        arr.sort(function(a, b) { return b.sales - a.sales; });

        var html = '<div style="border:2px solid #1e293b; padding:15px; border-radius:8px;">';
        html += '<h3 style="text-align:center; margin-bottom:5px;">Sales Commission Report</h3>';
        html += '<p style="text-align:center; font-size:12px; margin-bottom:15px;">Rate: ' + rate + '% | ' + startDate + ' to ' + endDate + ' | ' + txCount + ' transactions</p>';
        html += '<table class="excel-table" style="width:100%; font-size:13px;"><thead><tr><th>Staff</th><th>Tx</th><th>Sales</th><th>Comm.</th></tr></thead><tbody>';
        arr.forEach(function(staff) {
            html += '<tr><td style="padding:8px; font-weight:600;">' + sanitize(staff.name) + '</td>' +
                '<td style="padding:8px; text-align:center;">' + staff.txCount + '</td>' +
                '<td style="padding:8px; text-align:right;">' + fmtMoney(staff.sales) + '</td>' +
                '<td style="padding:8px; text-align:right; font-weight:bold; color:#10b981;">' + fmtMoney(staff.commission) + '</td></tr>';
        });
        html += '</tbody></table>';
        var totalCommission = totalShopSales * (rate / 100);
        html += '<div style="display:flex; justify-content:space-between; padding:15px 0 5px; font-size:18px; font-weight:bold;"><span>Total Shop Sales:</span><span>' + fmtMoney(totalShopSales) + '</span></div>';
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; font-size:18px; font-weight:bold; color:#ef4444;"><span>Total Commission to Pay:</span><span>' + fmtMoney(totalCommission) + '</span></div>';
        html += '</div>';
        html += '<button class="btn btn-primary" onclick="printCommissionReport()" style="width:100%; margin-top:15px;">🖨️ Print Report</button>';
        resultDiv.innerHTML = html;
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>';
    }
}
function printCommissionReport() {
    var content = document.getElementById('commResult').innerHTML;
    var printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>Commission Report</title><style>body{font-family:monospace;padding:20px;width:280px;margin:auto;} table{width:100%; border-collapse:collapse;} th, td{border:1px solid #ccc; padding:5px;}</style></head><body>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}



// ===== FEATURE 13: TIMESHEET VIEWER (WITH GPS & SELFIE) =====
async function openTimesheetModal() {
    var tModal = document.getElementById('timesheetModal');
    if (!tModal) return;
    
    var listDiv = document.getElementById('timesheetList');
    listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Loading timesheets...</p>';
    
    tModal.classList.add('active');

    try {
        const { data, error } = await supabaseClient.from('timecards')
            .select('*')
            .eq('shop_id', getShopId())
            .order('clock_in_time', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No staff clock-ins recorded yet.</p>';
            return;
        }

        var html = '<table class="excel-table" style="width:100%; font-size:12px;"><thead><tr><th>Selfie</th><th>Staff</th><th>Clock In</th><th>Clock Out</th><th>Duration</th></tr></thead><tbody>';
        
        data.forEach(function(log) {
            var inTime = new Date(log.clock_in_time);
            var outTime = log.clock_out_time ? new Date(log.clock_out_time) : null;
            
            var inStr = inTime.toLocaleDateString() + ' ' + inTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            var outStr = outTime ? outTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '<span style="color:#f59e0b;">Active</span>';
            
            if (log.clock_in_gps && log.clock_in_gps !== 'No GPS') {
                inStr += '<br><a href="' + log.clock_in_gps + '" target="_blank" style="color:#2563eb; font-size:10px;">📍 Map</a>';
            }
            if (outTime && log.clock_out_gps && log.clock_out_gps !== 'No GPS') {
                outStr += '<br><a href="' + log.clock_out_gps + '" target="_blank" style="color:#2563eb; font-size:10px;">📍 Map</a>';
            }

            var duration = '-';
            if (outTime) {
                var diffMs = outTime - inTime;
                var diffHrs = Math.floor(diffMs / 3600000);
                var diffMins = Math.round((diffMs % 3600000) / 60000);
                duration = diffHrs + 'h ' + diffMins + 'm';
            }

            var selfieHtml = '-';
            if (log.clock_in_selfie) {
                selfieHtml = '<img src="' + log.clock_in_selfie + '" style="width:50px; height:50px; object-fit:cover; border-radius:4px; cursor:pointer;" onclick="window.open(this.src, \'_blank\')">';
            }

            html += '<tr>' +
                '<td style="padding:8px; text-align:center;">' + selfieHtml + '</td>' +
                '<td style="padding:8px; font-weight:600;">' + log.employee_name + '</td>' +
                '<td style="padding:8px;">' + inStr + '</td>' +
                '<td style="padding:8px;">' + outStr + '</td>' +
                '<td style="padding:8px; text-align:right; font-weight:600;">' + duration + '</td>' +
            '</tr>';
        });
        
        html += '</tbody></table>';
        listDiv.innerHTML = html;
    } catch(e) {
        listDiv.innerHTML = '<p style="color:red;">Error loading logs: ' + e.message + '</p>';
    }
}



// ===== DEVICE LINK CENTER (CLEAN QR UI + CLICKABLE LINKS) =====
function generateDeviceLinks() {
    var shop = getShopId();
    if (!shop || shop === 'default') { 
        alert('Shop ID not found. Please activate a license first.'); 
        return; 
    }
    
    var area = document.getElementById('deviceLinkArea');
    var path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    var baseURL = window.location.origin + path;
    
    var posUrl = baseURL + 'pos.html?shop=' + shop;
    var kitchenUrl = baseURL + 'kitchen.html?shop=' + shop;
    var menuUrl = baseURL + 'menu.html?shop=' + shop;
    
    var html = '<h4 style="text-align:center; margin-bottom:15px;">Device Link Center</h4>';
    html += '<p style="font-size:12px; color:#64748b; text-align:center; margin-bottom:20px;">Scan the QR code or click the link below to open the app.</p>';
    
    html += '<div style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center;">';
    
    // POS Section
    html += '<div style="background:#f8fafc; padding:15px; border-radius:12px; text-align:center; min-width:140px;">';
    html += '<b style="display:block; margin-bottom:10px;">💻 POS</b>';
    html += '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(posUrl) + '" style="width:120px; height:120px;"><br>';
    html += '<a href="' + posUrl + '" target="_blank" style="display:inline-block; margin-top:8px; color:#2563eb; font-size:12px; font-weight:bold; word-break:break-all;">🔗 Open Link</a>';
    html += '</div>';
    
    // Kitchen Section
    html += '<div style="background:#f8fafc; padding:15px; border-radius:12px; text-align:center; min-width:140px;">';
    html += '<b style="display:block; margin-bottom:10px;">👨‍🍳 Kitchen</b>';
    html += '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(kitchenUrl) + '" style="width:120px; height:120px;"><br>';
    html += '<a href="' + kitchenUrl + '" target="_blank" style="display:inline-block; margin-top:8px; color:#2563eb; font-size:12px; font-weight:bold; word-break:break-all;">🔗 Open Link</a>';
    html += '</div>';

    // Menu Section
    html += '<div style="background:#f8fafc; padding:15px; border-radius:12px; text-align:center; min-width:140px;">';
    html += '<b style="display:block; margin-bottom:10px;">📱 Menu</b>';
    html += '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(menuUrl) + '" style="width:120px; height:120px;"><br>';
    html += '<a href="' + menuUrl + '" target="_blank" style="display:inline-block; margin-top:8px; color:#2563eb; font-size:12px; font-weight:bold; word-break:break-all;">🔗 Open Link</a>';
    html += '</div>';
    
    html += '</div>';
    
    // TABLE QR SECTION
    var namesStr = document.getElementById('brandTables') ? document.getElementById('brandTables').value.trim() : '';
    if (namesStr) {
        var tables = namesStr.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t !== ''; });
        if (tables.length > 0) {
            html += '<hr style="margin: 25px 0; border-color: #cbd5e1;">';
            html += '<h4 style="text-align:center; margin-bottom:15px;">🪑 Table QR Codes</h4>';
            html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;">';
            tables.forEach(function(t) {
                var tableUrl = menuUrl + '&table=' + encodeURIComponent(t);
                html += '<div style="text-align:center; background:#fff; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">';
                html += '<b style="display:block; margin-bottom:5px; font-size:14px;">' + t + '</b>';
                html += '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(tableUrl) + '" style="width:100px; height:100px; margin:0 auto;">';
                html += '<a href="' + tableUrl + '" target="_blank" style="display:inline-block; margin-top:5px; color:#2563eb; font-size:10px; font-weight:bold; word-break:break-all;">🔗 Open</a>';
                html += '</div>';
            });
            html += '</div>';
        }
    } else {
         html += '<p style="font-size:12px; color:#dc2626; text-align:center; margin-top:20px;">⚠️ No tables found. Add table names in the "Table Setup" card above.</p>';
    }
    
    area.innerHTML = html;
    area.style.display = 'block';
}


function goToDeviceLinkCenter() {
    // 1. Click the Settings tab exactly
    var settingsTab = document.getElementById('sidebarSettingsTab');
    if (settingsTab) {
        selectTab(13, settingsTab);
    }
    
    // 2. Scroll down to the Device Link Center button after a short delay
    setTimeout(function() {
        var deviceBtn = document.querySelector('button[onclick="generateDeviceLinks()"]');
        if (deviceBtn) {
            deviceBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

function dismissSetupCard() {
    if (confirm('Hide this setup guide? You can always find the Device Link Center in Settings.')) {
        localStorage.setItem('hideSetupCard', '1');
        var card = document.getElementById('setupWelcomeCard');
        if (card) card.style.display = 'none';
    }
}







async function loadCalendarSetting() {
    var cal = localStorage.getItem('calendarSystem') || 'gregorian';
    var sel = document.getElementById('calendarSelect');
    if (sel) sel.value = cal;
    
    // Also load from DB if available
    if (db) {
        try {
            var doc = await db.collection('settings').doc('pos').get();
            if (doc.exists && doc.data().calendarSystem) {
                localStorage.setItem('calendarSystem', doc.data().calendarSystem);
                if (sel) sel.value = doc.data().calendarSystem;
            }
        } catch(e) {}
    }
}



// ===== MANUAL INVOICE ENTRY =====
function openManualInvoiceModal() {
    var sel = document.getElementById('manualInvProduct');
    sel.innerHTML = '<option value="">-- Select Product --</option>';
    products.forEach(function(p) {
        sel.innerHTML += '<option value="' + p.id + '" data-price="' + p.price + '">' + p.name + ' (Stock: ' + p.stock + ')</option>';
    });
    document.getElementById('manualInvQty').value = 1;
    document.getElementById('manualInvPrice').value = 0;
    document.getElementById('manualInvNote').value = '';
    calcManualInvTotal();
    document.getElementById('manualInvoiceModal').classList.add('active');
}

function updateManualInvPrice() {
    var sel = document.getElementById('manualInvProduct');
    var selectedOption = sel.options[sel.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        document.getElementById('manualInvPrice').value = selectedOption.dataset.price;
    }
    calcManualInvTotal();
}

function calcManualInvTotal() {
    var qty = parseFloat(document.getElementById('manualInvQty').value) || 0;
    var price = parseFloat(document.getElementById('manualInvPrice').value) || 0;
    var total = qty * price;
    document.getElementById('manualInvTotal').textContent = fmtMoney(total);
}

async function saveManualInvoice() {
    var prodId = document.getElementById('manualInvProduct').value;
    var qty = parseFloat(document.getElementById('manualInvQty').value) || 0;
    var price = parseFloat(document.getElementById('manualInvPrice').value) || 0;
    var payment = document.getElementById('manualInvPayment').value;
    var note = document.getElementById('manualInvNote').value.trim();

    if (!prodId || qty <= 0) { alert('Please select a product and enter a valid quantity.'); return; }

    var product = products.find(function(p) { return p.id === prodId; });
    if (!product) return;

    if (product.stock < qty && !product.isVirtual) {
        if (!await confirm('Warning: Stock is low (' + product.stock + '). Do you still want to proceed?')) return;
    }

    var total = qty * price;
    var profit = (price - (product.costPrice || 0)) * qty;
    var invoiceNo = 'INV-' + Date.now().toString().slice(-8);

    try {
        // 1. Save the Sale (snake_case for Supabase)
        const { error: saleError } = await supabaseClient.from('sales').insert([{
            items: [{ productId: prodId, name: product.name, qty: qty, price: price, subtotal: total }],
            subtotal: total, discount: 0, tax: 0, total: total, profit: profit,
            payment_method: payment, payments: [{ method: payment, amount: total }],
            customer_name: '', customer_phone: '',
            shop_id: getShopId(), cashier_id: 'admin_manual', cashier_name: 'Admin',
            shift_id: 'manual', time: new Date().toISOString(),
            note: note || 'Manual Invoice', invoice_no: invoiceNo, order_type: 'Manual'
        }]);
        if (saleError) throw saleError;

        // 2. Deduct stock (atomic, matches both id types)
        if (!product.isVirtual) {
            const { error: rpcError } = await supabaseClient.rpc('deduct_stock', {
                moves: [{ product_id: prodId, qty: qty, is_sale_item: true }]
            });
            if (rpcError) throw rpcError;
            product.stock = Math.round((product.stock - qty) * 1000) / 1000; // update local UI
        }

        alert('✅ Manual invoice saved and stock updated!');
        document.getElementById('manualInvoiceModal').classList.remove('active');
        if (typeof loadAllCaches === 'function') loadAllCaches(); // refresh dashboards
    } catch(e) {
        alert('❌ Error: ' + e.message);
    }
}


// ===== INVENTORY VALUATION REPORT =====
function openInventoryValuationModal() {
    var totalCostValue = 0;
    var totalRetailValue = 0;
    var totalItems = 0;

    products.forEach(function(p) {
        var stock = parseFloat(p.stock) || 0;
        var cost = parseFloat(p.costPrice) || 0;
        var price = parseFloat(p.price) || 0;

        if (!p.isVirtual && stock > 0) {
            totalCostValue += (stock * cost);
            totalRetailValue += (stock * price);
            totalItems += stock;
        }
    });

    var potentialProfit = totalRetailValue - totalCostValue;

    var html = `
        <div style="text-align:center; margin-bottom:20px;">
            <p style="font-size:12px; color:#64748b;">Based on current stock levels</p>
        </div>
        <div style="display:grid; grid-template-columns:1fr; gap:10px;">
            <div style="background:#eff6ff; padding:15px; border-radius:8px; text-align:center;">
                <div style="font-size:12px; color:#64748b;">TOTAL COST VALUE</div>
                <div style="font-size:22px; font-weight:800; color:#2563eb;">${fmtMoney(totalCostValue)}</div>
            </div>
            <div style="background:#ecfdf5; padding:15px; border-radius:8px; text-align:center;">
                <div style="font-size:12px; color:#64748b;">TOTAL RETAIL VALUE</div>
                <div style="font-size:22px; font-weight:800; color:#10b981;">${fmtMoney(totalRetailValue)}</div>
            </div>
            <div style="background:#fef3c7; padding:15px; border-radius:8px; text-align:center;">
                <div style="font-size:12px; color:#64748b;">POTENTIAL GROSS PROFIT</div>
                <div style="font-size:22px; font-weight:800; color:#f59e0b;">${fmtMoney(potentialProfit)}</div>
            </div>
            <div style="background:#f8fafc; padding:15px; border-radius:8px; text-align:center;">
                <div style="font-size:12px; color:#64748b;">TOTAL UNITS IN STOCK</div>
                <div style="font-size:22px; font-weight:800; color:#1e293b;">${totalItems}</div>
            </div>
        </div>
    `;
    document.getElementById('invValResult').innerHTML = html;
    document.getElementById('invValModal').classList.add('active');
}



// ===== PHYSICAL STOCK COUNT (STOCK TAKE) =====
function openStockTakeModal() {
    var listDiv = document.getElementById('stockTakeList');
    if (products.length === 0) { listDiv.innerHTML = '<p>No products found.</p>'; return; }
    
    var html = '<table style="width:100%; font-size:13px;"><thead><tr><th style="text-align:left; padding:5px;">Product</th><th style="text-align:center; padding:5px;">System</th><th style="text-align:center; padding:5px;">Counted</th></tr></thead><tbody>';
    
    products.forEach(function(p) {
        if (p.isVirtual) return; // Skip virtual products
        html += '<tr style="border-bottom:1px solid #f1f5f9;">' +
            '<td style="padding:8px 5px;">' + p.name + '<br><small style="color:#94a3b8;">' + (p.unit || '') + '</small></td>' +
            '<td style="text-align:center; padding:5px;">' + p.stock + '</td>' +
            '<td style="text-align:center; padding:5px;"><input type="number" id="counted_' + p.id + '" value="' + p.stock + '" style="width:70px; padding:5px; border:1px solid #cbd5e1; border-radius:4px; text-align:center;"></td>' +
        '</tr>';
    });
    
    html += '</tbody></table>';
    listDiv.innerHTML = html;
    document.getElementById('stockTakeModal').classList.add('active');
}

async function processStockTake() {
    if (!await confirm('Are you sure you want to adjust the stock? Missing items will be logged as losses.')) return;
    
    var adjustments = [];
    var lossesToInsert = [];
    var productsToUpdate = [];
    
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        if (p.isVirtual) continue;
        
        var countedInput = document.getElementById('counted_' + p.id);
        if (!countedInput) continue;
        
        var countedQty = parseFloat(countedInput.value);
        if (isNaN(countedQty)) continue;
        
        var systemQty = p.stock || 0;
        var diff = countedQty - systemQty;
        
        if (diff !== 0) {
            // Prepare product update
            productsToUpdate.push({ id: p.id, newStock: countedQty });
            
            // If it's a loss (negative difference), prepare to log it
            if (diff < 0) {
                var lossAmount = Math.abs(diff) * (p.costPrice || 0);
                lossesToInsert.push({
                    firebase_id: 'loss_' + Date.now() + '_' + i,
                    shop_id: getShopId(),
                    product_id: p.id,
                    product_name: p.name,
                    quantity: Math.abs(diff),
                    reason: 'Stock Take Adjustment',
                    total_loss: lossAmount,
                    time: new Date().toISOString()
                });
            }
            
            adjustments.push({ name: p.name, diff: diff });
        }
    }
    
    if (adjustments.length === 0) {
        alert('No changes detected. Stock counts match the system.');
        return;
    }
    
    try {
        // 1. Update products in Supabase
        for (const update of productsToUpdate) {
            await supabaseClient.from('products').update({ stock: update.newStock }).eq('firebase_id', update.id);
            // Update local cache instantly
            var prod = products.find(p => p.id === update.id);
            if (prod) prod.stock = update.newStock;
        }
        
        // 2. Insert losses in Supabase
        if (lossesToInsert.length > 0) {
            await supabaseClient.from('losses').insert(lossesToInsert);
            // Update local cache instantly
            lossesToInsert.forEach(loss => {
                lossesCache.push({
                    id: loss.firebase_id, shopId: loss.shop_id, productId: loss.product_id,
                    productName: loss.product_name, quantity: loss.quantity,
                    reason: loss.reason, totalLoss: loss.total_loss, time: loss.time
                });
            });
            if (window.lossTable) window.lossTable.setData(lossesCache);
        }
        
        
        alert('✅ Stock adjusted successfully! ' + adjustments.length + ' items updated.');
        document.getElementById('stockTakeModal').classList.remove('active');
        
        // 3. Refresh UI
        if (typeof filterProductView === 'function') filterProductView();
        if (window.productTable) window.productTable.setData(products);
        if (window.stockTable) window.stockTable.setData(products);                    // 🆕 stock table too
        if (typeof renderStockAlertCenter === 'function') renderStockAlertCenter();    // 🆕 refresh alerts
        
    } catch(e) {
        alert('❌ Error adjusting stock: ' + e.message);
    }
}









// ===== BIN CARD (STOCK LEDGER) =====
async function viewBinCard(productId) {
    var product = products.find(function(p) { return p.id === productId; });
    if (!product) return;

    document.getElementById('binCardProductName').textContent = product.name;
    document.getElementById('binCardCurrentStock').textContent = product.stock + ' ' + (product.unit || '');
    document.getElementById('binCardList').innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8;">Loading history...</p>';
    document.getElementById('binCardModal').classList.add('active');

    var transactions = [];

    try {
        // 1. Stock movements (sales + offline syncs — recorded since your upgrade)
        const { data: moves } = await supabaseClient.from('stock_movements')
            .select('*').eq('product_id', productId)
            .order('created_at', { ascending: false }).limit(100);
        (moves || []).forEach(function(m) {
            transactions.push({
                date: m.created_at,
                type: (m.reason === 'sale' || m.reason === 'offline_sync') ? 'Sale' : 'Adjustment',
                qty: -Math.abs(m.qty_out || 0),
                details: 'Invoice: ' + (m.invoice_no || '') + ' | ' + (m.reason || '')
            });
        });

        // 2. Sales items (covers sales made before the movement log existed)
        const { data: sales, error: sErr } = await supabaseClient.from('sales')
            .select('time, items, invoice_no')
            .eq('shop_id', getShopId())
            .order('time', { ascending: false }).limit(200);
        if (sErr) throw sErr;
        var seenInvoice = {};
        (moves || []).forEach(function(m) { if (m.invoice_no) seenInvoice[m.invoice_no] = true; });
        (sales || []).forEach(function(sale) {
            if (seenInvoice[sale.invoice_no]) return; // already counted above
            var item = (sale.items || []).find(function(i) { return i.productId === productId; });
            if (item) {
                transactions.push({
                    date: sale.time, type: 'Sale', qty: -item.qty,
                    details: 'Invoice: ' + (sale.invoice_no || '')
                });
            }
        });

        // 3. Losses
        const { data: losses } = await supabaseClient.from('losses')
            .select('*').eq('product_id', productId)
            .order('time', { ascending: false }).limit(50);
        (losses || []).forEach(function(l) {
            transactions.push({
                date: l.time, type: 'Loss / Damage', qty: -Math.abs(l.quantity || 0),
                details: 'Reason: ' + (l.reason || 'N/A')
            });
        });

        // 4. Purchases (Goods Received)
        const { data: purchases } = await supabaseClient.from('purchases')
            .select('*').eq('product_id', productId)
            .order('date', { ascending: false }).limit(50);
        (purchases || []).forEach(function(p) {
            transactions.push({
                date: p.date, type: 'Goods Received', qty: Math.abs(p.qty || 0),
                details: 'Cost: ' + fmtMoney(p.cost_per_unit || 0)
            });
        });

        // Sort newest first
        transactions.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

        var totalReceived = transactions.filter(function(t) { return t.qty > 0; }).reduce(function(s, t) { return s + t.qty; }, 0);
        var totalSold = Math.abs(transactions.filter(function(t) { return t.qty < 0; }).reduce(function(s, t) { return s + t.qty; }, 0));

        document.getElementById('binCardReceived').textContent = totalReceived + ' ' + (product.unit || '');
        document.getElementById('binCardSold').textContent = totalSold + ' ' + (product.unit || '');

        if (transactions.length === 0) {
            document.getElementById('binCardList').innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8;">No stock movements recorded yet.</p>';
            return;
        }

        var html = '<table style="width:100%; font-size:12px; border-collapse:collapse;">';
        html += '<thead style="background:#f1f5f9; position:sticky; top:0;"><tr><th style="padding:8px; text-align:left;">Date</th><th style="padding:8px; text-align:left;">Type</th><th style="padding:8px; text-align:right;">Qty</th></tr></thead><tbody>';
        transactions.forEach(function(t) {
            var color = t.qty > 0 ? '#10b981' : '#ef4444';
            var typeIcon = t.qty > 0 ? '📥' : '📤';
            if (t.type === 'Loss / Damage') typeIcon = '🗑️';
            html += '<tr style="border-bottom:1px solid #f1f5f9;" title="' + (t.details || '') + '">';
            html += '<td style="padding:8px;">' + new Date(t.date).toLocaleDateString() + ' ' + new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + '</td>';
            html += '<td style="padding:8px;">' + typeIcon + ' ' + t.type + '</td>';
            html += '<td style="padding:8px; text-align:right; font-weight:bold; color:' + color + ';">' + (t.qty > 0 ? '+' : '') + t.qty + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('binCardList').innerHTML = html;

    } catch(e) {
        document.getElementById('binCardList').innerHTML = '<p style="color:red; padding:10px;">Error loading history: ' + e.message + '</p>';
    }
}
// ===== STORE TO STORE STOCK TRANSFER =====
async function openTransferModal() {
    // 1. Load Destination Branches
    var destSel = document.getElementById('transferDestShop');
    if (!destSel) return;
    destSel.innerHTML = '<option value="">Loading branches...</option>';
    
    try {
        const { data, error } = await supabaseClient.from('shops').select('shop_id, name').eq('active', true);
        if (error) throw error;
        
        var html = '<option value="">-- Select Branch --</option>';
        if (data) {
            data.forEach(function(shop) {
                if (shop.shop_id !== getShopId()) { // Don't show current shop
                    html += '<option value="' + shop.shop_id + '">' + sanitize(shop.name) + '</option>';
                }
            });
        }
        destSel.innerHTML = html;
    } catch(e) { 
        alert("Error loading branches: " + e.message); 
    }

    // 2. Load Products
    var prodSel = document.getElementById('transferProduct');
    if (!prodSel) return;
    prodSel.innerHTML = '<option value="">-- Select Product --</option>';
    products.forEach(function(p) {
        if (!p.isVirtual) {
            prodSel.innerHTML += '<option value="' + p.id + '">' + sanitize(p.name) + ' (Available: ' + p.stock + ' ' + (p.unit||'') + ')</option>';
        }
    });

    document.getElementById('transferQty').value = 1;
    document.getElementById('transferModal').classList.add('active');
}

async function processStockTransfer() {
    var destShopId = document.getElementById('transferDestShop').value;
    var prodId = document.getElementById('transferProduct').value;
    var qty = parseFloat(document.getElementById('transferQty').value) || 0;

    if (!destShopId || !prodId || qty <= 0) {
        alert('Please select a branch, product, and enter a valid quantity.');
        return;
    }

    var product = products.find(function(p) { return p.id === prodId; });
    if (!product) return;

    if (product.stock < qty) {
        alert('Not enough stock available! Current stock: ' + product.stock);
        return;
    }

    if (!await confirm('Transfer ' + qty + ' ' + (product.unit||'') + ' of ' + product.name + ' to the selected branch?')) return;

    var btn = event ? event.target : null;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Transferring...'; }

    try {
        // 1. Deduct from current branch
        var newSourceStock = (product.stock || 0) - qty;
        const { error: sourceErr } = await supabaseClient.from('products').update({ stock: newSourceStock }).eq('firebase_id', prodId);
        if (sourceErr) throw sourceErr;

        // 2. Find the same product in the destination branch by name
        const { data: destProducts, error: destErr } = await supabaseClient.from('products').select('*').eq('shop_id', destShopId).eq('name', product.name);
        if (destErr) throw destErr;

        if (destProducts && destProducts.length > 0) {
            // Product exists in destination, increment stock
            var destProd = destProducts[0];
            var newDestStock = (destProd.stock || 0) + qty;
            const { error: updateDestErr } = await supabaseClient.from('products').update({ stock: newDestStock }).eq('id', destProd.id);
            if (updateDestErr) throw updateDestErr;
        } else {
            // Product doesn't exist in destination, create it
            var newProdData = {
                firebase_id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                shop_id: destShopId,
                name: product.name,
                price: product.price,
                cost_price: product.costPrice,
                stock: qty,
                barcode: product.barcode,
                category: product.category,
                is_virtual: false,
                unit: product.unit,
                sold_count: 0,
                reorder_level: product.reorderLevel || 5,
                sell_directly: true,
                is_available_on_menu: product.isAvailableOnMenu !== false
            };
            const { error: insertDestErr } = await supabaseClient.from('products').insert([newProdData]);
            if (insertDestErr) throw insertDestErr;
        }

        // 3. Show Success Message FIRST!
        alert('✅ Transfer Successful!\n\n' + qty + ' ' + (product.unit||'') + ' of ' + product.name + ' was transferred.\n\nYour updated stock here is: ' + newSourceStock + ' ' + (product.unit||'') + '.');

        // 4. Close Modal
        document.getElementById('transferModal').classList.remove('active');

        // 5. Update local cache and UI safely
        product.stock = newSourceStock;
        
        if (typeof filterProductView === 'function') {
            try { filterProductView(); } catch(e){ console.log(e); }
        }
        if (window.productTable && typeof window.productTable.setData === 'function') {
            try { window.productTable.setData(products); } catch(e){ console.log(e); }
        }

    } catch(e) {
        console.error("Transfer Error:", e);
        alert('❌ Error transferring stock: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚚 Transfer Now'; }
    }
}



// ===== IMAGE COMPRESSION & DATABASE SAVE (100% FREE) =====
async function uploadImage(inputElement, targetInputId) {
    var file = inputElement.files[0];
    if (!file) return;

    var targetInput = document.getElementById(targetInputId);
    targetInput.value = "Compressing image... please wait";
    targetInput.disabled = true;

    try {
        // 1. Read the file from the phone
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                // 2. Shrink the image using a Canvas
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                
                var MAX_WIDTH = 400; // Perfect size for mobile
                var scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 3. Convert to compressed Base64 string
                var dataURL = canvas.toDataURL('image/jpeg', 0.7);
                
                // 4. Put the compressed image directly into the text box
                // It will be saved in Firestore when you click "Save Product"
                targetInput.value = dataURL;
                targetInput.disabled = false;
                alert("✅ Image compressed and ready! Click 'Save' to finish.");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } catch(e) {
        targetInput.value = "";
        targetInput.disabled = false;
        alert("❌ Upload failed: " + e.message);
    }
}

// ===== QUICK TOGGLE MENU AVAILABILITY =====
async function toggleMenuAvailability(prodId) {
    var p = products.find(x => x.id === prodId);
    if(!p) return;
    
    var newVal = p.isAvailableOnMenu === false ? true : false;
    
    try {
               await supabaseClient.from('products').update({ is_available_on_menu: newVal }).eq('firebase_id', prodId);
        // Refresh table
        if (typeof filterProductView === 'function') filterProductView();
        alert(newVal ? '✅ Product is now VISIBLE on the Menu.' : '🚫 Product is now HIDDEN from the Menu.');
    } catch(e) {
        alert('❌ Error: ' + e.message);
    }
}


// ===== UPDATE STAFF POSITIONS BASED ON SHOP TYPE =====
function updateStaffPositions() {
    var empPosSelect = document.getElementById('empPosition');
    if (!empPosSelect) return; // Stop if dropdown isn't on the screen
    
    var shopType = posSettings.shopType || 'retail';
    
    if (shopType === 'cafe') {
        empPosSelect.innerHTML = `
            <option value="Cashier">Cashier</option>
            <option value="Waiter">Waiter</option>
            <option value="Chef">Chef / Kitchen Staff</option>
            <option value="Manager">Manager</option>
            <option value="Owner">Owner</option>
            <option value="Guard">Guard</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Other">Other</option>
        `;
    } else {
        // RETAIL MODE: No Waiters or Chefs!
        empPosSelect.innerHTML = `
            <option value="Cashier">Cashier</option>
            <option value="Manager">Manager</option>
            <option value="Owner">Owner</option>
            <option value="Guard">Guard</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Laborer">Laborer</option>
            <option value="Other">Other</option>
        `;
    }
}



// ===== UNIFIED STAFF MANAGEMENT MODULE (BULLETPROOF) =====

var currentStaffView = 'excel';
var currentEditEmpId = null;

function getActiveStaff() { 
    return employeesCache; 
}

function switchStaffView(view) {
    currentStaffView = view;
    document.querySelectorAll('.staff-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.getElementById('staffExcelContainer').style.display = view === 'excel' ? 'block' : 'none';
    document.getElementById('staffListContainer').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('staffGridContainer').style.display = view === 'grid' ? 'block' : 'none';

    if (view === 'excel') {
        if (!window.staffTable) initStaffExcelTable();
        else window.staffTable.setData(getActiveStaff());
    } else if (view === 'list') {
        staffListPage = 1; 
        if (typeof buildStaffListView === 'function') buildStaffListView();
    } else if (view === 'grid') {
        staffGridPage = 1; 
        if (typeof buildStaffGridView === 'function') buildStaffGridView();
    }
}

function initStaffExcelTable() {
    if (window.staffTable) return;
    window.staffTable = new ModernSheet('staffExcelContainer', {
        data: getActiveStaff(),
        columns: [
            { title: '#', width:'40px', render: function(item,html,idx){ return idx+1; } },
            { title: 'Name', field:'name', render: function(item,html){ return html ? sanitize(item.name) : item.name; } },
            { title: 'Position', field:'position' },
            { title: 'Base Salary', field:'salary', align:'right', render: function(item,html){ return html ? appCurrencySymbol + (item.salary||0).toFixed(2) : item.salary; } },
            { title: 'Schedule', field:'paymentAgreement' },
            { title: 'Status', field:'status', render: function(item, html) {
                if (item.status === 'inactive') return html ? '<span style="color:#ef4444; font-weight:bold;">🔴 Inactive</span>' : 'Inactive';
                return html ? '<span style="color:#10b981; font-weight:bold;">🟢 Active</span>' : 'Active';
            }},
            { title: 'Actions', width:'240px', render: function(item, html) {
                if (!html) return '';
                var buttons = '<button class="btn-mini" onclick="editEmployee(\''+item.id+'\')">✏️</button> ';
                
                if (item.status === 'inactive') {
                    buttons += '<button class="btn-mini" onclick="toggleEmployeeStatus(\''+item.id+'\',\'active\')" style="background:#10b981; color:white;">🔓 Activate</button> ';
                } else {
                    buttons += '<button class="btn-mini" onclick="toggleEmployeeStatus(\''+item.id+'\',\'inactive\')" style="background:#f59e0b; color:white;">🔒 Deactivate</button> ';
                }
                
                buttons += '<button class="btn-mini" onclick="paySalary(\''+item.id+'\')" style="background:#3b82f6;color:white;">💰</button> ';
                buttons += '<button class="btn-mini delete" onclick="deleteEmployee(\''+item.id+'\')" style="background:#ef4444; color:white;">🗑️</button>';
                return buttons;
            }, editable: false, filterable: false }
        ],
        emptyMessage: 'No staff found', 
        showSearch: false, 
        showFontSlider: true
    });
}



function editEmployee(empId) {
    var emp = employeesCache.find(e => e.id === empId);
    if (!emp) return;
    
    currentEditEmpId = empId;
    
    document.getElementById('editEmpName').value = emp.name || '';
    document.getElementById('editEmpSalary').value = emp.salary || 0;
    document.getElementById('editEmpSchedule').value = emp.paymentAgreement || 'monthly';
    document.getElementById('editEmpTip').value = emp.tip || 0;
    document.getElementById('editEmpBonus').value = emp.bonus || 0;
    document.getElementById('editEmpPenalty').value = emp.penalty || 0;
    document.getElementById('editEmpOvertime').value = emp.overtime || 0;
    document.getElementById('editEmpPhone').value = emp.phone || '';
    document.getElementById('editEmpAddress').value = emp.address || '';
    document.getElementById('editEmpStartDate').value = emp.startDate || '';
    document.getElementById('editEmpAccountNo').value = emp.accountNo || '';
    document.getElementById('editEmpPinLocked').checked = emp.pinLocked || false;
    
    document.getElementById('editEmployeeModal').classList.add('active');
}

async function saveEditedEmployee() {
    if (!currentEditEmpId) return;

    var newName = document.getElementById('editEmpName').value.trim();
    var newSalary = parseFloat(document.getElementById('editEmpSalary').value) || 0;

    if (!newName) { alert('Name is required!'); return; }

    var updateData = {
        name: newName,
        salary: newSalary,
        payment_agreement: document.getElementById('editEmpSchedule').value,
        tip: parseFloat(document.getElementById('editEmpTip').value) || 0,
        bonus: parseFloat(document.getElementById('editEmpBonus').value) || 0,
        penalty: parseFloat(document.getElementById('editEmpPenalty').value) || 0,
        overtime: parseFloat(document.getElementById('editEmpOvertime').value) || 0,
        phone: document.getElementById('editEmpPhone').value.trim(),
        address: document.getElementById('editEmpAddress').value.trim(),
        start_date: document.getElementById('editEmpStartDate').value || null,
        account_no: document.getElementById('editEmpAccountNo').value.trim(),
        pin_locked: document.getElementById('editEmpPinLocked').checked
    };

    try {
        const { error } = await supabaseClient.from('employees')
            .update(updateData).eq('firebase_id', currentEditEmpId);
        if (error) throw error;

        // Update local cache instantly
        var emp = employeesCache.find(e => e.id === currentEditEmpId);
        if (emp) Object.assign(emp, {
            name: newName, salary: newSalary,
            paymentAgreement: updateData.payment_agreement,
            tip: updateData.tip, bonus: updateData.bonus,
            penalty: updateData.penalty, overtime: updateData.overtime,
            phone: updateData.phone, address: updateData.address,
            startDate: updateData.start_date, accountNo: updateData.account_no,
            pinLocked: updateData.pin_locked
        });

        alert('✅ Employee updated!');
        document.getElementById('editEmployeeModal').classList.remove('active');
        currentEditEmpId = null;
        switchStaffView(currentStaffView);
    } catch(e) {
        alert('❌ Error: ' + e.message);
    }
}
async function toggleEmployeeStatus(empId, newStatus) {
    var emp = employeesCache.find(e => e.id === empId);
    if (!emp) return;
    var action = newStatus === 'inactive' ? 'Deactivate' : 'Activate';
    
    if (!await confirm(action + ' ' + emp.name + '?')) return;
    try {
        // UPDATE SUPABASE ONLY
        if (supabaseClient) {
            const { error } = await supabaseClient.from('employees')
                .update({ status: newStatus })
                .eq('firebase_id', empId);
            if (error) console.error("Supabase toggle error:", error.message);
        }

        // Update local cache instantly
        emp.status = newStatus;
        if (typeof switchStaffView === 'function') switchStaffView(currentStaffView);
        alert('✅ ' + emp.name + ' ' + (newStatus==='inactive'?'deactivated':'activated') + '.');
    } catch(e) { alert('❌ ' + e.message); }
}

async function deleteEmployee(empId) {
    var emp = employeesCache.find(e => e.id === empId);
    if (!emp) return;
    
    if (!await confirm('⚠️ PERMANENTLY DELETE ' + emp.name + '?\n\nThis cannot be undone.')) return;
    
    try {
        // DELETE FROM SUPABASE ONLY
        if (supabaseClient) {
            const { error } = await supabaseClient.from('employees').delete().eq('firebase_id', empId);
            if (error) console.error("Supabase delete error:", error.message);
        }

        // Remove from local cache instantly
        var index = employeesCache.findIndex(e => e.id === empId);
        if (index > -1) employeesCache.splice(index, 1);
        
        if (typeof switchStaffView === 'function') switchStaffView(currentStaffView);
        alert('✅ ' + emp.name + ' permanently deleted.');
    } catch(e) { 
        alert('❌ Error: ' + e.message); 
    }
}

function cancelEditEmployee() {
    ['empName','empSalary','empPhone','empAddress','empStartDate','empAccountNo','empPassword'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('empTip').value = '0';
    document.getElementById('empBonus').value = '0';
    document.getElementById('empPenalty').value = '0';
    document.getElementById('empOvertime').value = '0';
    document.getElementById('empPinLocked').checked = false;
    if (typeof toggleCashierFields === 'function') toggleCashierFields();
}


// ===== EXPENSE REPORT VIEW MANAGEMENT =====
var currentExpenseRepView = 'excel';
var expenseRepListPage = 1, expenseRepGridPage = 1;

function getExpenseReportData() {
    return expensesCache.slice().sort(function(a,b) { return new Date(b.date) - new Date(a.date); });
}

function switchExpenseReportView(view) {
    currentExpenseRepView = view;
    var btns = document.querySelectorAll('.expense-rep-view-btn');
    if(!btns || btns.length === 0) {
        // Fallback if class name is slightly different
        btns = document.querySelectorAll('.expense-view-btn');
    }
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].dataset.view === view);
    }
    
    var excel = document.getElementById('expenseReportExcelContainer');
    var list = document.getElementById('expenseReportListContainer');
    var grid = document.getElementById('expenseReportGridContainer');
    
    if (excel) excel.style.display = view === 'excel' ? 'block' : 'none';
    if (list) list.style.display = view === 'list' ? 'block' : 'none';
    if (grid) grid.style.display = view === 'grid' ? 'block' : 'none';

    if (view === 'excel') {
        if (!window.expenseRepTable) initExpenseReportExcel();
        else window.expenseRepTable.setData(getExpenseReportData());
    } else if (view === 'list') {
        expenseRepListPage = 1; buildExpenseReportList();
    } else if (view === 'grid') {
        expenseRepGridPage = 1; buildExpenseReportGrid();
    }
}

function initExpenseReportExcel() {
    if (window.expenseRepTable) return;
    window.expenseRepTable = new ModernSheet('expenseReportExcelContainer', {
        data: getExpenseReportData(),
        columns: [
            { title: '#', width:'40px', render: function(item,html,idx){ return idx+1; } },
            { title: 'Date', width:'100px', render: function(item,html){ return html ? formatDate(item.date) : item.date; } },
            { title: 'Description', field:'name', render: function(item,html){ return html ? sanitize(item.name) : item.name; } },
            { title: 'Category', field:'category', render: function(item,html){ return html ? (item.category || 'General') : (item.category || 'General'); } },
            { title: 'Amount', field:'amount', align:'right', render: function(item,html){ return html ? appCurrencySymbol + (item.amount||0).toFixed(2) : item.amount; }, total:true, totalValue:function(i){ return i.amount||0; }, totalFormat:function(s){ return appCurrencySymbol + s.toFixed(2); } }
        ],
        emptyMessage:'No expenses in this period', showSearch:false, showFontSlider:true
    });
}

function buildExpenseReportList() {
    var data = getExpenseReportData().map(function(e) {
        return {
            label: sanitize(e.name),
            detail: 'Date: ' + formatDate(e.date) + ' | Cat: ' + (e.category || 'General'),
            right: appCurrencySymbol + (e.amount || 0).toFixed(2)
        };
    });
    renderList('expenseReportListContainer', data, expenseRepListPage, 20, 'loadMoreExpenseRepList');
}

function loadMoreExpenseRepList() { 
    expenseRepListPage++; 
    buildExpenseReportList(); 
}

function buildExpenseReportGrid() {
    var data = getExpenseReportData().map(function(e) {
        return {
            label: sanitize(e.name),
            detail: 'Date: ' + formatDate(e.date) + ' | Cat: ' + (e.category || 'General'),
            right: appCurrencySymbol + (e.amount || 0).toFixed(2)
        };
    });
    renderGrid('expenseReportGridContainer', data, expenseRepGridPage, 12, 'loadMoreExpenseRepGrid');
}

function loadMoreExpenseRepGrid() { 
    expenseRepGridPage++; 
    buildExpenseReportGrid(); 
}

// ===== MODAL OPENERS =====
function openPnLModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var pnlStart = document.getElementById('pnlStartDate');
    var pnlEnd = document.getElementById('pnlEndDate');
    if (pnlStart) pnlStart.value = firstDay;
    if (pnlEnd) pnlEnd.value = today;
    
    var pnlRes = document.getElementById('pnlResult');
    if (pnlRes) pnlRes.style.display = 'none';
    
    var pnlModal = document.getElementById('pnLModal');
    if (pnlModal) pnlModal.classList.add('active');
}

function openZReportModal() {
    var now = new Date();
    var today = now.toISOString().slice(0,10);
    var zDate = document.getElementById('zReportDate');
    if (zDate) zDate.value = today;
    
    var zRes = document.getElementById('zReportResult');
    if (zRes) zRes.style.display = 'none';
    
    var zModal = document.getElementById('zReportModal');
    if (zModal) zModal.classList.add('active');
}

function openTaxReportModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var tStart = document.getElementById('taxStartDate');
    var tEnd = document.getElementById('taxEndDate');
    if (tStart) tStart.value = firstDay;
    if (tEnd) tEnd.value = today;
    
    var tRes = document.getElementById('taxResult');
    if (tRes) tRes.style.display = 'none';
    
    var tModal = document.getElementById('taxReportModal');
    if (tModal) tModal.classList.add('active');
}

function openExpenseReportModal() {
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    var today = now.toISOString().slice(0,10);
    
    var eStart = document.getElementById('expRptStartDate');
    var eEnd = document.getElementById('expRptEndDate');
    if (eStart) eStart.value = firstDay;
    if (eEnd) eEnd.value = today;
    
    var eRes = document.getElementById('expRptResult');
    if (eRes) eRes.style.display = 'none';
    
    var eModal = document.getElementById('expenseReportModal');
    if (eModal) eModal.classList.add('active');
}

function logAction(action, details) {
    if (supabaseClient) {
        supabaseClient.from('audit_logs').insert([
            { shop_id: getShopId(), action, details, cashier_name: 'Admin', timestamp: new Date().toISOString() }
        ]).then(({error}) => { if(error) console.error("Audit log error:", error.message); });
    }
}
// ===== SAFE REPORT VIEW SWITCHERS (PREVENTS CRASHES) =====
function switchDailySummaryView(view) {
    currentDailySummaryView = view;
    var btns = document.querySelectorAll('.dailyrep-view-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('dailySummaryExcelContainer');
    var list = document.getElementById('dailySummaryListContainer');
    var grid = document.getElementById('dailySummaryGridContainer');
    if (excel) excel.style.display = view === 'excel' ? 'block' : 'none';
    if (list) list.style.display = view === 'list' ? 'block' : 'none';
    if (grid) grid.style.display = view === 'grid' ? 'block' : 'none';
    if (view === 'excel') { if (!window.dailySummaryTable) initDailySummaryExcel(); else window.dailySummaryTable.setData(getDailySummaryData()); }
    else if (view === 'list') { dailySummaryListPage = 1; buildDailySummaryList(); }
    else if (view === 'grid') { dailySummaryGridPage = 1; buildDailySummaryGrid(); }
}

function switchSalesReportView(view) {
    currentSalesRepView = view;
    var btns = document.querySelectorAll('.salesrep-view-btn');
    for (var i=0; i<btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('salesReportExcelContainer');
    var list = document.getElementById('salesReportListContainer');
    var grid = document.getElementById('salesReportGridContainer');
    if (excel) excel.style.display = view==='excel'?'block':'none';
    if (list) list.style.display = view==='list'?'block':'none';
    if (grid) grid.style.display = view==='grid'?'block':'none';
    if (view==='excel') { if (!window.salesRepTable) initSalesReportExcel(); else window.salesRepTable.setData(getSalesReportData()); }
    else if (view==='list') { salesRepListPage=1; buildSalesReportList(); }
    else if (view==='grid') { salesRepGridPage=1; buildSalesReportGrid(); }
}

function switchCashierReportView(view) {
    currentCashierRepView = view;
    var btns = document.querySelectorAll('.cashierrep-view-btn');
    for (var i=0; i<btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('cashierReportExcelContainer');
    var list = document.getElementById('cashierReportListContainer');
    var grid = document.getElementById('cashierReportGridContainer');
    if (excel) excel.style.display = view==='excel'?'block':'none';
    if (list) list.style.display = view==='list'?'block':'none';
    if (grid) grid.style.display = view==='grid'?'block':'none';
    if (view==='excel') { if (!window.cashierRepTable) initCashierReportExcel(); else window.cashierRepTable.setData(getCashierReportData()); }
    else if (view==='list') { cashierRepListPage=1; buildCashierReportList(); }
    else if (view==='grid') { cashierRepGridPage=1; buildCashierReportGrid(); }
}

function switchTopProductsView(view) {
    currentTopProdView = view;
    var btns = document.querySelectorAll('.topprod-view-btn');
    for (var i=0; i<btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('topProductsExcelContainer');
    var list = document.getElementById('topProductsListContainer');
    var grid = document.getElementById('topProductsGridContainer');
    if (excel) excel.style.display = view==='excel'?'block':'none';
    if (list) list.style.display = view==='list'?'block':'none';
    if (grid) grid.style.display = view==='grid'?'block':'none';
    if (view==='excel') { if (!window.topProdTable) initTopProductsExcel(); else window.topProdTable.setData(getTopProductsData()); }
    else if (view==='list') { topProdListPage=1; buildTopProductsList(); }
    else if (view==='grid') { topProdGridPage=1; buildTopProductsGrid(); }
}

function switchSalaryReportView(view) {
    currentSalaryRepView = view;
    var btns = document.querySelectorAll('.salaryrep-view-btn');
    for (var i=0; i<btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('salaryReportExcelContainer');
    var list = document.getElementById('salaryReportListContainer');
    var grid = document.getElementById('salaryReportGridContainer');
    if (excel) excel.style.display = view==='excel'?'block':'none';
    if (list) list.style.display = view==='list'?'block':'none';
    if (grid) grid.style.display = view==='grid'?'block':'none';
    if (view==='excel') { if (!window.salaryRepTable) initSalaryReportExcel(); else window.salaryRepTable.setData(getSalaryReportData()); }
    else if (view==='list') { salaryRepListPage=1; buildSalaryReportList(); }
    else if (view==='grid') { salaryRepGridPage=1; buildSalaryReportGrid(); }
}

function switchLoanReportView(view) {
    currentLoanRepView = view;
    var btns = document.querySelectorAll('.loanrep-view-btn');
    for (var i=0; i<btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('loanReportExcelContainer');
    var list = document.getElementById('loanReportListContainer');
    var grid = document.getElementById('loanReportGridContainer');
    if (excel) excel.style.display = view==='excel'?'block':'none';
    if (list) list.style.display = view==='list'?'block':'none';
    if (grid) grid.style.display = view==='grid'?'block':'none';
    if (view==='excel') { if (!window.loanRepTable) initLoanReportExcel(); else window.loanRepTable.setData(getLoanReportData()); }
    else if (view==='list') { loanRepListPage=1; buildLoanReportList(); }
    else if (view==='grid') { loanRepGridPage=1; buildLoanReportGrid(); }
}

function switchBankReportView(view) {
    currentBankRepView = view;
    var btns = document.querySelectorAll('.bankrep-view-btn');
    for (var i=0; i<btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.view === view);
    var excel = document.getElementById('bankReportExcelContainer');
    var list = document.getElementById('bankReportListContainer');
    var grid = document.getElementById('bankReportGridContainer');
    if (excel) excel.style.display = view==='excel'?'block':'none';
    if (list) list.style.display = view==='list'?'block':'none';
    if (grid) grid.style.display = view==='grid'?'block':'none';
    if (view==='excel') { if (!window.bankRepTable) initBankReportExcel(); else window.bankRepTable.setData(getBankReportData()); }
    else if (view==='list') { bankRepListPage=1; buildBankReportList(); }
    else if (view==='grid') { bankRepGridPage=1; buildBankReportGrid(); }
}
