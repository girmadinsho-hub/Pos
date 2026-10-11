// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — EXTRAS MODULE (Step 14b)
//  Notebook (tab15) · Devices (tab20) · Intercom (tab19)
//  +50%: overdue reminder banner · WhatsApp note share ·
//  stale-device detector · revoke alert · sound+vibrate on
//  chat · quick replies · category filter chips.
// ═════════════════════════════════════════════════════════

if (typeof v4S === 'undefined') { window.v4S = {}; }

// ═════════════════════════════════════════════════════════
//  📓 NOTEBOOK (tab15)
// ═════════════════════════════════════════════════════════
var v4nb = { data:[], q:'', cat:'', page:1, perPage:15 };

var V4NB_CATS = { '':'📂 All', 'Work':'💼 Work', 'Personal':'👤 Personal', 'Important':'⭐ Important', 'Idea':'💡 Idea', 'Meeting':'🤝 Meeting', 'Finance':'💰 Finance' };
var V4NB_COLORS = { '#ffffff':'⚪ White', '#fef3c7':'🟡 Yellow', '#d1fae5':'🟢 Mint', '#dbeafe':'🔵 Sky', '#fce7f3':'🟣 Pink', '#fee2e2':'🔴 Rose' };

async function v4nbLoad() {
  try {
    const { data } = await supabaseClient.from('notes').select('*').eq('shop_id', getShopId()).order('created_at', { ascending: false }).limit(200);
    v4nb.data = (data || []).map(function(n){
      return { id:n.id, text:n.text, category:n.category || '', color:n.color || '#ffffff',
        reminderDate:n.reminder_date, reminderTime:n.reminder_time,
        pinned:!!n.pinned, createdAt:n.created_at };
    });
  } catch(e) { v4nb.data = []; }
  return v4nb.data;
}
async function v4nbRefresh(){ await v4nbLoad(); v4nbRender(); }

function v4nbIsOverdue(n) {
  if (!n.reminderDate) return false;
  var today = new Date().toISOString().slice(0,10);
  return n.reminderDate < today;
}
function v4nbIsToday(n) {
  if (!n.reminderDate) return false;
  return n.reminderDate === new Date().toISOString().slice(0,10);
}
function v4nbTitle(t) { var f = String(t||'').split('\n')[0].trim(); return f.length > 50 ? f.substring(0,47) + '…' : (f || 'Empty note'); }
function v4nbSnippet(t) { return String(t||'').split('\n').slice(1,3).join(' ').trim(); }
function v4nbBorder(cat) {
  var c = { 'Work':'#3b82f6', 'Personal':'#10b981', 'Important':'#ef4444', 'Idea':'#f59e0b', 'Meeting':'#8b5cf6', 'Finance':'#ec4899' };
  return c[cat] || '#cbd5e1';
}

function v4nbEnsureUI() {
  var tab = document.getElementById('tab15');
  if (!tab || tab.dataset.nbBuilt === '1') return;
  tab.dataset.nbBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4nbH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4nbH b{font-size:13px;display:block;word-break:break-word;}' +
    '.v4nbH small{font-size:9px;font-weight:800;color:#64748b;}' +
    '.v4nbCatChip{padding:6px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;}' +
    '.v4nbCatChip.active{background:#2563eb;color:#fff;border-color:#2563eb;}' +
    'body.dark .v4nbCatChip{background:#334155;color:#e2e8f0;border-color:#475569;}' +
    '.v4nbNote{background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-left:4px solid #cbd5e1;cursor:pointer;}' +
    'body.dark .v4nbNote{background:#1e293b;}' +
    '</style>' +
    '<div class="card" style="padding:12px" id="v4nbHealth"></div>' +
    '<div class="card" style="padding:12px">' +
      '<button class="v4-btn g" style="margin:0" onclick="v4nbOpen()">➕ New Note</button>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">📓 Notebook <span class="v4-badge" id="v4nbCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="v4-chip" onclick="v4nbRefresh()">🔄</button>' +
        '</span>' +
      '</div>' +
      '<input class="v4-in" id="v4nbSearch" placeholder="🔍 Search notes…" style="padding:8px 12px;margin:0 0 8px 0;font-size:13px;height:36px;box-sizing:border-box" oninput="v4nb.q=this.value.toLowerCase();v4nb.page=1;v4nbRender()">' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px" id="v4nbCats">' +
        Object.keys(V4NB_CATS).map(function(k){
          return '<button class="v4nbCatChip' + (k === '' ? ' active' : '') + '" data-cat="' + k + '" onclick="v4nbSetCat(\'' + k + '\', this)">' + V4NB_CATS[k] + '</button>';
        }).join('') +
      '</div>' +
      '<div id="v4nbGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px"></div>' +
      '<div id="v4nbMore" style="text-align:center;padding:12px;display:none;"><button class="v4-chip" onclick="v4nb.page++;v4nbRender()">⬇ Load More</button></div>' +
    '</div>';
}
function v4nbSetCat(cat, el) {
  v4nb.cat = cat;
  document.querySelectorAll('#v4nbCats .v4nbCatChip').forEach(function(c){ c.classList.remove('active'); });
  if (el) el.classList.add('active');
  v4nb.page = 1;
  v4nbRender();
}
function v4nbFiltered() {
  return v4nb.data.filter(function(n){
    if (v4nb.cat && n.category !== v4nb.cat) return false;
    if (v4nb.q && String(n.text).toLowerCase().indexOf(v4nb.q) === -1) return false;
    return true;
  }).sort(function(a,b){
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
function v4nbRender() {
  // health strip
  var el = document.getElementById('v4nbHealth');
  if (el) {
    var overdue = v4nb.data.filter(v4nbIsOverdue);
    var today = v4nb.data.filter(v4nbIsToday);
    var pinned = v4nb.data.filter(function(n){ return n.pinned; });
    el.innerHTML = '<div style="display:flex;gap:8px">' +
      '<div class="v4nbH"><b style="color:#3b82f6">' + v4nb.data.length + '</b><small>📓 NOTES</small></div>' +
      '<div class="v4nbH"><b style="color:#f59e0b">' + pinned.length + '</b><small>📌 PINNED</small></div>' +
      '<div class="v4nbH"><b style="color:' + (today.length > 0 ? '#f97316' : '#94a3b8') + '">' + today.length + '</b><small>🕐 TODAY</small></div>' +
      '<div class="v4nbH"><b style="color:' + (overdue.length > 0 ? '#ef4444' : '#94a3b8') + '">' + overdue.length + '</b><small>⏰ OVERDUE</small></div>' +
      '</div>' +
      (overdue.length > 0 ? '<div style="margin-top:8px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:8px;text-align:center;font-size:12px;font-weight:700;color:#dc2626">⏰ ' + overdue.length + ' note reminder(s) OVERDUE — tap overdue notes to act</div>' : '');
  }
  var grid = document.getElementById('v4nbGrid'); if (!grid) return;
  var rows = v4nbFiltered();
  var cnt = document.getElementById('v4nbCount'); if (cnt) cnt.textContent = rows.length;
  var slice = rows.slice(0, v4nb.page * v4nb.perPage);
  var more = document.getElementById('v4nbMore');
  if (more) more.style.display = rows.length > slice.length ? 'block' : 'none';
  if (!slice.length) {
    grid.innerHTML = '<div class="placeholder" style="grid-column:1/-1">📭 No notes found.</div>';
    return;
  }
  var html = '';
  slice.forEach(function(n){
    var overdue = v4nbIsOverdue(n);
    var today = v4nbIsToday(n);
    var bg = n.color || '#ffffff';
    var pinIcon = n.pinned ? '📌 ' : '';
    var reminderStr = n.reminderDate
      ? '<div style="font-size:11px;color:' + (overdue ? '#dc2626' : (today ? '#f97316' : '#64748b')) + ';font-weight:' + (overdue || today ? '700' : '400') + ';margin-top:4px">' +
        (overdue ? '⏰ OVERDUE: ' : (today ? '🕐 TODAY: ' : '📅 ')) + n.reminderDate + (n.reminderTime ? ' ' + n.reminderTime : '') + '</div>'
      : '';
    html += '<div class="v4nbNote" style="background:' + bg + ';border-left-color:' + (overdue ? '#dc2626' : v4nbBorder(n.category)) + '" onclick="v4nbOpen(\'' + n.id + '\')">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:4px;color:#1e293b">' + pinIcon + sanitize(v4nbTitle(n.text)) + '</div>' +
      (v4nbSnippet(n.text) ? '<div style="font-size:12px;color:#475569;white-space:pre-wrap;line-height:1.4">' + sanitize(v4nbSnippet(n.text)) + '</div>' : '') +
      reminderStr +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11px;color:#94a3b8">' +
        '<span>' + (n.category ? V4NB_CATS[n.category] : '') + ' · ' + new Date(n.createdAt).toLocaleDateString() + '</span>' +
        '<span style="display:flex;gap:4px" onclick="event.stopPropagation()">' +
          '<button class="btn-mini" onclick="v4nbTogglePin(\'' + n.id + '\')" title="Pin">' + (n.pinned ? '📌' : '📍') + '</button>' +
          '<button class="btn-mini" style="background:#25D366;color:#fff" onclick="v4nbShare(\'' + n.id + '\')" title="WhatsApp">📤</button>' +
          '<button class="btn-mini delete" onclick="v4nbDelete(\'' + n.id + '\')">🗑️</button>' +
        '</span>' +
      '</div></div>';
  });
  grid.innerHTML = html;
}

// ── note editor modal ──
function v4nbOpen(id) {
  var n = id ? v4nb.data.find(function(x){ return x.id === id; }) : null;
  var m = document.createElement('div');
  m.id = 'v4nbEditor';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:8300;overflow-y:auto;padding:14px;display:flex;align-items:center;justify-content:center;';
  var catOpts = Object.keys(V4NB_CATS).filter(function(k){ return k; }).map(function(k){
    return '<option value="' + k + '"' + (n && n.category === k ? ' selected' : '') + '>' + V4NB_CATS[k] + '</option>';
  }).join('');
  var colOpts = Object.keys(V4NB_COLORS).map(function(c){
    return '<option value="' + c + '"' + (n && n.color === c ? ' selected' : '') + '>' + V4NB_COLORS[c] + '</option>';
  }).join('');
  m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:520px;width:100%;padding:18px;color:#0f172a">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<b style="font-size:17px">' + (n ? '✏️ Edit Note' : '➕ New Note') + '</b>' +
    '<button onclick="v4nbCloseEditor()" style="background:none;border:none;font-size:22px;cursor:pointer">✖</button></div>' +
    '<textarea id="nbText" class="form-input" rows="6" placeholder="Write your note… (first line = title)" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;font-size:14px;resize:vertical;margin-bottom:10px">' + sanitize(n ? n.text : '') + '</textarea>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px">' +
    '<select id="nbCat" class="form-input" style="flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:13px"><option value="">📂 No Category</option>' + catOpts + '</select>' +
    '<select id="nbColor" class="form-input" style="flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:13px">' + colOpts + '</select>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:10px">' +
    '<input type="date" id="nbRemDate" class="form-input" style="flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:13px" value="' + (n ? (n.reminderDate || '') : '') + '">' +
    '<input type="time" id="nbRemTime" class="form-input" style="flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:13px" value="' + (n ? (n.reminderTime || '') : '') + '">' +
    '</div>' +
    '<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin-bottom:8px"><input type="checkbox" id="nbPinned"' + (n && n.pinned ? ' checked' : '') + '> 📌 Pin to top</label>' +
    '<button class="v4-btn g" onclick="v4nbSave(\'' + (n ? n.id : '') + '\')">💾 Save</button>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if (e.target === m) v4nbCloseEditor(); });
  window._v4nbEditId = n ? n.id : null;
}
function v4nbCloseEditor() { var m = document.getElementById('v4nbEditor'); if (m) m.remove(); }
async function v4nbSave(id) {
  var text = document.getElementById('nbText').value.trim();
  if (!text) { alert('Write something first.'); return; }
  var payload = { text: text, category: document.getElementById('nbCat').value,
    color: document.getElementById('nbColor').value,
    reminder_date: document.getElementById('nbRemDate').value || null,
    reminder_time: document.getElementById('nbRemTime').value || null,
    pinned: document.getElementById('nbPinned').checked,
    shop_id: getShopId(), updated_at: new Date().toISOString() };
  try {
    if (id) {
      const { error } = await supabaseClient.from('notes').update(payload).eq('id', id);
      if (error) throw error;
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await supabaseClient.from('notes').insert([payload]);
      if (error) throw error;
    }
    v4nbCloseEditor();
    await v4nbRefresh();
    alert('✅ Note saved!');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4nbTogglePin(id) {
  var n = v4nb.data.find(function(x){ return x.id === id; }); if (!n) return;
  try {
    await supabaseClient.from('notes').update({ pinned: !n.pinned }).eq('id', id);
    n.pinned = !n.pinned;
    v4nbRender();
  } catch(e) {}
}
async function v4nbDelete(id) {
  var n = v4nb.data.find(function(x){ return x.id === id; }); if (!n) return;
  if (!await confirm('🗑️ Delete this note?\n\n"' + v4nbTitle(n.text) + '"')) return;
  try {
    await supabaseClient.from('notes').delete().eq('id', id);
    await v4nbRefresh();
    alert('✅ Deleted.');
  } catch(e) { alert('❌ ' + e.message); }
}
function v4nbShare(id) {
  var n = v4nb.data.find(function(x){ return x.id === id; }); if (!n) return;
  var msg = '📝 ' + v4nbTitle(n.text) + '\n\n' + n.text + '\n\n— SmartShop Pro';
  ssShareTo(msg, { title: '📝 Note — ' + v4nbTitle(n.text) });
}
// ═════════════════════════════════════════════════════════
//  📱 DEVICES (tab20)
// ═════════════════════════════════════════════════════════
var v4dv = { data:[] };

async function v4dvLoad() {
  try {
    const { data } = await supabaseClient.from('devices').select('*').eq('shop_id', getShopId()).order('last_seen', { ascending: false });
    v4dv.data = data || [];
  } catch(e) { v4dv.data = []; }
  return v4dv.data;
}
async function v4dvRefresh(){ await v4dvLoad(); v4dvRender(); }

function v4dvEnsureUI() {
  var tab = document.getElementById('tab20');
  if (!tab || tab.dataset.dvBuilt === '1') return;
  tab.dataset.dvBuilt = '1';
  tab.innerHTML =
    '<style>' +
    '.v4dvH{flex:1;text-align:center;background:rgba(148,163,184,.08);border-radius:10px;padding:9px 4px;min-width:0;}' +
    '.v4dvH b{font-size:13px;display:block;}' +
    '.v4dvH small{font-size:9px;font-weight:800;color:#64748b;}' +
    '</style>' +
    '<div class="card" style="padding:12px" id="v4dvHealth"></div>' +
    '<div class="card" style="padding:12px">' +
      '<div style="display:flex;gap:6px">' +
      '<button class="v4-btn g" style="margin:0;flex:1" onclick="v4dvLockAll(true)">🔒 Lock ALL Devices</button>' +
      '<button class="v4-btn" style="margin:0;flex:1;background:#10b981" onclick="v4dvLockAll(false)">🔓 Unlock ALL</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">📱 Device Manager <span class="v4-badge" id="v4dvCount">0</span>' +
        '<span style="margin-left:auto;display:flex;gap:6px"><button class="v4-chip" onclick="v4dvRefresh()">🔄</button></span>' +
      '</div>' +
      '<p style="font-size:12px;color:#64748b;margin-bottom:10px">Every activated POS, Kitchen, and Hotel device appears here. Revoke = instant lock. Restore = back online.</p>' +
      '<div id="v4dvList"></div>' +
    '</div>';
}
function v4dvIsStale(d) {
  if (!d.last_seen) return true;
  return (Date.now() - new Date(d.last_seen).getTime()) > 24 * 3600000;   // 24h
}
function v4dvRender() {
  var el = document.getElementById('v4dvHealth');
  if (el) {
    var active = v4dv.data.filter(function(d){ return d.status === 'active'; });
    var revoked = v4dv.data.filter(function(d){ return d.status === 'revoked'; });
    var stale = active.filter(v4dvIsStale);
    el.innerHTML = '<div style="display:flex;gap:8px">' +
      '<div class="v4dvH"><b style="color:#10b981">' + active.length + '</b><small>🟢 ACTIVE</small></div>' +
      '<div class="v4dvH"><b style="color:#ef4444">' + revoked.length + '</b><small>🔴 REVOKED</small></div>' +
      '<div class="v4dvH"><b style="color:' + (stale.length > 0 ? '#f97316' : '#94a3b8') + '">' + stale.length + '</b><small>⏰ OFFLINE 24h+</small></div>' +
      '</div>' +
      (stale.length > 0 ? '<div style="margin-top:8px;background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.3);border-radius:10px;padding:8px;text-align:center;font-size:12px;font-weight:700;color:#ea580c">⚠️ ' + stale.length + ' active device(s) haven\'t checked in for 24+ hours — check if the shop is still using them</div>' : '');
  }
  var box = document.getElementById('v4dvList'); if (!box) return;
  var cnt = document.getElementById('v4dvCount'); if (cnt) cnt.textContent = v4dv.data.length;
  if (!v4dv.data.length) {
    box.innerHTML = '<div class="placeholder">No devices registered yet.<br>Activate a POS or Kitchen device first.</div>';
    return;
  }
  var html = '';
  v4dv.data.forEach(function(d){
    var isActive = d.status === 'active';
    var stale = isActive && v4dvIsStale(d);
    var mins = d.last_seen ? Math.floor((Date.now() - new Date(d.last_seen)) / 60000) : null;
    var seen = d.last_seen
      ? new Date(d.last_seen).toLocaleString() + (mins !== null && mins < 60 ? ' (' + mins + 'm ago)' : (mins !== null && mins < 1440 ? ' (' + Math.floor(mins/60) + 'h ago)' : ''))
      : 'Never';
    var icon = d.device_type === 'kitchen' ? '👨‍🍳' : (d.device_type === 'hotel' ? '🏨' : '💰');
    html += '<div style="display:flex;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid #f1f5f9;' + (!isActive ? 'opacity:.6;' : '') + '">' +
      '<div style="flex:1;min-width:0">' +
        '<b style="font-size:14px">' + icon + ' ' + sanitize(d.device_name || d.device_type || 'Device') + '</b>' +
        '<br><small style="color:' + (isActive ? (stale ? '#ea580c' : '#10b981') : '#ef4444') + ';font-weight:700">' +
          (isActive ? (stale ? '🟠 Active (stale)' : '🟢 Active') : '🔴 Revoked') +
        '</small>' +
        '<br><small style="color:#94a3b8;font-size:11px">Last seen: ' + seen + '</small>' +
      '</div>' +
      '<div style="flex-shrink:0">' +
        (isActive
          ? '<button class="btn-mini" style="background:#dc2626;color:#fff" onclick="v4dvRevoke(\'' + d.id + '\')">⛔ Revoke</button>'
          : '<button class="btn-mini" style="background:#10b981;color:#fff" onclick="v4dvRestore(\'' + d.id + '\')">✅ Restore</button>') +
      '</div></div>';
  });
  box.innerHTML = html;
}
async function v4dvRevoke(id) {
  var d = v4dv.data.find(function(x){ return x.id === id; });
  if (!await confirm('⛔ Revoke "' + (d ? d.device_name : 'this device') + '"?\n\nIt will be locked INSTANTLY — the staff member using it cannot work until you restore.')) return;
  try {
    const { error } = await supabaseClient.from('devices').update({ status: 'revoked' }).eq('id', id);
    if (error) throw error;
    await v4dvRefresh();
    // 📤 bonus: WhatsApp alert to yourself
    var msg = '🚨 DEVICE REVOKED — ' + (d ? d.device_name : 'Device') + '\nTime: ' + new Date().toLocaleString() + '\n\nIf you did NOT do this, check who accessed your admin!';
  if (await confirm('✅ Revoked.\n\n📤 Send yourself an alert about this action?')) {
      ssShareTo(msg, { title: '🚨 Device Revoked' });
    }
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4dvRestore(id) {
  var d = v4dv.data.find(function(x){ return x.id === id; });
  if (!await confirm('✅ Restore "' + (d ? d.device_name : 'this device') + '"?')) return;
  try {
    const { error } = await supabaseClient.from('devices').update({ status: 'active' }).eq('id', id);
    if (error) throw error;
    await v4dvRefresh();
    alert('✅ Device restored.');
  } catch(e) { alert('❌ ' + e.message); }
}
async function v4dvLockAll(lock) {
  if (!await confirm(lock ? '🔒 Lock ALL devices? Every POS and Kitchen will be disabled instantly.' : '🔓 Unlock all devices?')) return;
  try {
    const { error } = await supabaseClient.from('devices').update({ status: lock ? 'revoked' : 'active' }).eq('shop_id', getShopId());
    if (error) throw error;
    await v4dvRefresh();
    alert(lock ? '🔒 All devices locked.' : '🔓 All devices unlocked.');
  } catch(e) { alert('❌ ' + e.message); }
}

// ── tab loaders (Round 1 fix — wires Notebook + Devices into v4) ──
V4_TAB_LOADERS[15] = function() { v4nbEnsureUI(); v4nbLoad().then(v4nbRender); };
V4_TAB_LOADERS[20] = function() { v4dvEnsureUI(); v4dvLoad().then(v4dvRender); };
