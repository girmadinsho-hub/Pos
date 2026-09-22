// ═════════════════════════════════════════════════════════
//  SMARTSHOP PERFORMANCE MODULE
//  Server-side summaries + paginated detailed sales
//  (Phone never downloads full history again)
// ═════════════════════════════════════════════════════════

var SS_PERF = {
  detailedPage: 0,
  detailedPageSize: 50,
  detailedHasMore: false,
  detailedCache: [],
  detailedDateFrom: null
};

// ---------- SERVER SUMMARY (daily buckets, split-payment aware) ----------
async function ssFetchDailySummary(fromDate, toDate) {
  var params = [getShopId()];
  if (fromDate) params.push(new Date(fromDate).toISOString());
  else params.push(null);
  if (toDate) params.push(new Date(toDate.getTime() + 86400000).toISOString());
  else params.push(null);

  var res = await supabaseClient.rpc('get_sales_summary', {
    p_shop_id: params[0], p_from: params[1], p_to: params[2]
  });
  if (res.error) throw new Error(res.error.message);
  return (res.data || []).map(function(r) {
    return { date: r.bucket, cash: Number(r.cash), card: Number(r.card),
             mobile: Number(r.mobile), credit: Number(r.credit),
             tax: Number(r.tax_total), total: Number(r.total), count: Number(r.tx_count) };
  });
}

// Group daily rows → weekly / monthly / yearly (tiny data, done on phone)
function ssGroupDaily(daily, mode) {
  var map = {};
  daily.forEach(function(d) {
    var dt = new Date(d.date + 'T00:00:00');
    var key, label;
    if (mode === 'week') {
      var day = dt.getDay(); var diff = dt.getDate() - day + (day === 0 ? -6 : 1);
      var wk = new Date(dt.getFullYear(), dt.getMonth(), diff);
      key = wk.toISOString().slice(0, 10);
      label = 'Week of ' + key;
    } else if (mode === 'month') {
      key = d.date.slice(0, 7);
      label = key;
    } else {
      key = d.date.slice(0, 4);
      label = key;
    }
    if (!map[key]) map[key] = { key: key, label: label, cash: 0, card: 0, mobile: 0, credit: 0, tax: 0, total: 0, count: 0 };
    var m = map[key];
    m.cash += d.cash; m.card += d.card; m.mobile += d.mobile; m.credit += d.credit;
    m.tax += d.tax; m.total += d.total; m.count += d.count;
  });
  return Object.values(map).sort(function(a, b) { return b.key.localeCompare(a.key); });
}

// ---------- PAGINATED DETAILED SALES (50 at a time) ----------
async function ssFetchDetailedPage(append) {
  if (!append) { SS_PERF.detailedPage = 0; SS_PERF.detailedCache = []; }

  var from = SS_PERF.detailedDateFrom ? new Date(SS_PERF.detailedDateFrom).toISOString() : null;
  var query = supabaseClient.from('sales')
    .select('id, time, total, subtotal, discount, tax, profit, payment_method, payments, cashier_name, customer_name, customer_phone, items, invoice_no, note, order_type, shift_id, paid_at, voided')
    .eq('shop_id', getShopId())
    .eq('voided', false)
    .order('time', { ascending: false })
    .range(SS_PERF.detailedPage * SS_PERF.detailedPageSize, (SS_PERF.detailedPage + 1) * SS_PERF.detailedPageSize - 1);
  if (from) query = query.gte('time', from);

  var res = await query;
  if (res.error) throw new Error(res.error.message);

  var rows = (res.data || []).map(function(s) {
    return { id: s.id, time: s.time, total: s.total, subtotal: s.subtotal || 0,
             discount: s.discount || 0, tax: s.tax || 0, profit: s.profit || 0,
             paymentMethod: s.payment_method, payments: s.payments || [],
             cashierName: s.cashier_name || 'Unknown', customerName: s.customer_name,
             customerPhone: s.customer_phone, items: s.items || [], invoiceNo: s.invoice_no || '',
             note: s.note || '', orderType: s.order_type || '', shiftId: s.shift_id || '',
             paidAt: s.paid_at };
  });

  SS_PERF.detailedCache = append ? SS_PERF.detailedCache.concat(rows) : rows;
  SS_PERF.detailedHasMore = rows.length === SS_PERF.detailedPageSize;
  SS_PERF.detailedPage++;
  return SS_PERF.detailedCache;
}

// ---------- KPI OVERVIEW (server does the math) ----------
async function ssFetchKpis(fromDate) {
  var daily = await ssFetchDailySummary(fromDate, null);
  var k = { revenue: 0, grossProfit: 0, creditDue: 0, taxTotal: 0, txCount: 0, pay: { cash: 0, card: 0, mobile: 0, credit: 0 } };
  daily.forEach(function(d) {
    k.revenue += d.total; k.taxTotal += d.tax; k.txCount += d.count;
    k.pay.cash += d.cash; k.pay.card += d.card; k.pay.mobile += d.mobile; k.pay.credit += d.credit;
  });
  // Profit + unpaid credit need per-sale data — small targeted query
  var q = supabaseClient.from('sales')
    .select('profit, total, payment_method, paid_at')
    .eq('shop_id', getShopId()).eq('voided', false);
  if (fromDate) q = q.gte('time', new Date(fromDate).toISOString());
  var res = await q.select('profit, total, payment_method, paid_at, time');
  if (!res.error && res.data) {
    res.data.forEach(function(s) {
      k.grossProfit += Number(s.profit || 0);
      if (s.payment_method === 'credit' && !s.paid_at) k.creditDue += Number(s.total || 0);
    });
  }
  return k;
}
