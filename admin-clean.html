<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SmartShop Pro v4 — Clean Admin</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<script>window.onerror=function(m,s,l){var d=document.createElement('div');d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999999;background:#7f1d1d;color:#fff;padding:8px;font:12px monospace';d.textContent='❌ '+m+' | L'+l;d.onclick=function(){d.remove()};document.body.appendChild(d);};</script>
<style>
:root{--primary:#2563eb;--bg:#f1f5f9;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--ok:#10b981;--bad:#ef4444}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif}
body{background:var(--bg);color:var(--text);font-size:15px}
body.dark{background:#0f172a;color:#e2e8f0}
body.dark .card{background:#1e293b;border-color:#334155}
body.dark .sidebar{background:#1e293b}
body.dark .sidebar-tab{color:#cbd5e1;border-bottom-color:#334155}
body.dark .sidebar-tab.active{background:#1e3a8a;color:#fff}
.screen{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);z-index:5000;flex-direction:column}
.screen.show{display:flex}
.box{background:#fff;color:#1e293b;border-radius:20px;padding:28px;width:92%;max-width:380px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.box h1{font-size:22px;color:#1e3a8a;margin-bottom:4px}
.box p{font-size:12px;color:var(--muted);margin-bottom:14px}
.box input{width:100%;padding:13px;margin:6px 0;border:2px solid var(--border);border-radius:12px;font-size:15px;outline:none}
.btn{width:100%;padding:13px;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;margin-top:8px}
.btn-p{background:var(--primary);color:#fff}.btn-g{background:var(--ok);color:#fff}.btn-o{background:#fff;color:#334155;border:1.5px solid #cbd5e1}
#loadingBar{width:0%;height:100%;background:#fff;border-radius:10px;transition:width .3s}
.header{position:sticky;top:0;z-index:1000;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.header .hbtn{background:rgba(255,255,255,.2);border:none;color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:15px}
.header select{max-width:70px;padding:4px;border-radius:8px;border:none;font-size:11px}
.verbadge{font-size:9px;background:rgba(255,255,255,.25);padding:2px 7px;border-radius:8px;font-weight:700}
.sidebar{position:fixed;top:0;left:-280px;width:280px;height:100%;background:#fff;z-index:2000;overflow-y:auto;transition:.3s;box-shadow:2px 0 10px rgba(0,0,0,.1)}
.sidebar.open{left:0}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1999;display:none}
.sidebar-overlay.show{display:block}
.sidebar-tab{padding:13px 18px;border-bottom:1px solid #f1f5f9;cursor:pointer;font-weight:600;font-size:14px;color:#475569;display:flex;align-items:center;gap:10px;border-left:4px solid transparent}
.sidebar-tab:hover{background:#f8fafc}
.sidebar-tab.active{background:#eff6ff;color:var(--primary);border-left-color:var(--primary)}
  .sidebar-tab.has-sub .sub-arrow{margin-left:auto;font-size:11px;opacity:.6;transition:transform .2s}
.sidebar-tab.has-sub .sub-arrow.open{transform:rotate(90deg);opacity:1}
.submenu{background:#f8fafc}
body.dark .submenu{background:#0f172a}
.submenu-item{padding:10px 16px 10px 34px;cursor:pointer;font-size:13px;font-weight:500;color:#64748b;border-left:3px solid transparent}
.submenu-item:hover{background:#eff6ff;color:#1e293b;border-left-color:#93c5fd}
body.dark .submenu-item{color:#94a3b8}
body.dark .submenu-item:hover{background:#1e3a8a;color:#fff}
.side-foot{padding:14px;font-size:10px;color:var(--muted);text-align:center;line-height:1.6}
.badge{font-size:9px;font-weight:800;background:var(--primary);color:#fff;padding:2px 8px;border-radius:8px;margin-left:auto}
.container{padding:12px;max-width:1000px;margin:0 auto}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:14px}
.tab-content{display:none}
.placeholder{ text-align:center;padding:40px 14px;color:var(--muted)}
.placeholder b{font-size:40px;display:block;margin-bottom:8px}
</style>
<style>
/* ═══ MODERNSHEET KIT — v3 quality restored ═══ */
.modern-sheet-wrapper{background:#fff;border-radius:12px;border:1px solid #dadce0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
body.dark .modern-sheet-wrapper{background:#1e293b;border-color:#334155}
.modern-sheet-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #dadce0;background:#f8f9fa;flex-wrap:wrap}
body.dark .modern-sheet-toolbar{background:#0f172a;border-color:#334155}
.modern-sheet-toolbar input[type="text"]{flex:1;min-width:120px;padding:6px 12px;border:1px solid #dadce0;border-radius:20px;font-size:13px;background:#fff;outline:none}
body.dark .modern-sheet-toolbar input[type="text"]{background:#334155;border-color:#475569;color:#e2e8f0}
.modern-sheet-toolbar button{padding:6px 12px;border:1px solid #dadce0;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;font-weight:500;white-space:nowrap}
body.dark .modern-sheet-toolbar button{background:#334155;border-color:#475569;color:#e2e8f0}
/* 🔑 SCROLL LAW: horizontal swipe scrolls ONLY the table — never the page */
.modern-sheet-table-wrapper{overflow:auto;max-height:60vh;position:relative;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.modern-sheet-table{width:max-content;min-width:100%;border-collapse:collapse;table-layout:auto}
.modern-sheet-table thead{position:sticky;top:0;z-index:10}
.modern-sheet-table th{background:#f8f9fa;color:#202124;font-weight:600;padding:8px 12px;text-align:left;white-space:nowrap;border-bottom:2px solid #dadce0;border-right:1px solid #e8eaed;cursor:pointer;user-select:none;position:relative}
body.dark .modern-sheet-table th{background:#0f172a;color:#e2e8f0;border-bottom-color:#475569;border-right-color:#334155}
.modern-sheet-table th:hover{background:#e8eaed}
body.dark .modern-sheet-table th:hover{background:#1e293b}
.modern-sheet-table td{padding:6px 12px;border-bottom:1px solid #e8eaed;border-right:1px solid #f1f3f4;white-space:nowrap;color:#202124}
body.dark .modern-sheet-table td{border-bottom-color:#334155;border-right-color:#1e293b;color:#e2e8f0}
.modern-sheet-table tbody tr:nth-child(even){background:#f8f9fa}
body.dark .modern-sheet-table tbody tr:nth-child(even){background:#1a2332}
.modern-sheet-table tbody tr:hover{background:#e8f0fe}
body.dark .modern-sheet-table tbody tr:hover{background:#1e3a5f}
.modern-sheet-table .total-row{font-weight:700;background:#e6f4ea!important;border-top:2px solid #34a853}
body.dark .modern-sheet-table .total-row{background:#065f46!important}
.modern-sheet-table .empty-row td{text-align:center;padding:40px;color:#9aa0a6;font-style:italic}
.modern-sheet-resize-handle{position:absolute;top:0;right:0;width:14px;height:100%;cursor:col-resize;z-index:5}
.modern-sheet-resize-handle::before{content:'';position:absolute;top:0;left:-16px;width:44px;height:100%}
.modern-sheet-resize-handle:hover{background:#1a73e8;opacity:.3}
.modern-sheet-table th.frozen,.modern-sheet-table td.frozen{position:sticky;left:0;z-index:2;background:inherit}
.modern-sheet-table th.frozen{z-index:11}
.modern-sheet-footer{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border-top:1px solid #dadce0;background:#f8f9fa;font-size:11px;color:#5f6368}
body.dark .modern-sheet-footer{background:#0f172a;border-color:#334155;color:#94a3b8}
.modern-sheet-context-menu,.modern-sheet-filter-dropdown{position:fixed;background:#fff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:9999;min-width:180px;padding:6px 0;font-size:13px}
body.dark .modern-sheet-context-menu,body.dark .modern-sheet-filter-dropdown{background:#1e293b;color:#e2e8f0}
.modern-sheet-context-menu div,.modern-sheet-filter-dropdown label{padding:8px 16px;cursor:pointer;display:block}
.modern-sheet-context-menu div:hover,.modern-sheet-filter-dropdown label:hover{background:#e8f0fe}
body.dark .modern-sheet-context-menu div:hover,body.dark .modern-sheet-filter-dropdown label:hover{background:#334155}
.modern-sheet-filter-dropdown{max-height:200px;overflow-y:auto;padding:8px}
.modern-sheet-filter-dropdown label{display:flex;align-items:center;gap:8px;padding:4px 8px}
/* ═══ STANDARD DIALOGS — proper centered dialogs (was unstyled) ═══ */
#mainApp{overflow-x:hidden}
.standard-dialog-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;animation:sdFade .2s ease}
@keyframes sdFade{from{opacity:0}to{opacity:1}}
.standard-dialog-box{background:#fff;border-radius:16px;padding:24px;width:90%;max-width:400px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;animation:sdUp .25s ease}
@keyframes sdUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
.standard-dialog-icon{font-size:44px;margin-bottom:10px}
.standard-dialog-title{font-size:17px;font-weight:800;color:#1e293b;margin-bottom:8px}
.standard-dialog-message{font-size:15px;color:#475569;margin-bottom:18px;line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:45vh;overflow-y:auto;text-align:left}
.standard-dialog-input{width:100%;padding:13px;border:2px solid #e2e8f0;border-radius:10px;font-size:16px;margin-bottom:16px;text-align:center;outline:none}
.standard-dialog-input:focus{border-color:#2563eb}
.standard-dialog-buttons{display:flex;gap:10px}
.standard-dialog-btn{padding:12px 22px;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;flex:1}
.standard-dialog-btn:active{transform:scale(.97)}
.standard-dialog-btn-primary{background:#2563eb;color:#fff}
.standard-dialog-btn-secondary{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
  /* ═══ DARK MODE TEXT LAW — no dark-on-dark, ever ═══ */
body.dark{color:#f1f5f9}
body.dark .card-title{color:#f1f5f9}
body.dark label{color:#cbd5e1}
body.dark .placeholder{color:#94a3b8}
body.dark .placeholder b{color:#e2e8f0}
/* Products: labels, type cards, chips, notes */
body.dark .v4-type{color:#e2e8f0}
body.dark .v4-type small{color:#94a3b8}
body.dark .v4-type.active{color:#60a5fa}
body.dark .v4-chip{background:#334155;color:#e2e8f0;border-color:#475569}
body.dark .v4-chip.active{background:#2563eb!important;color:#fff!important}
body.dark .v4-badge{background:#2563eb;color:#fff}
body.dark .v4sw-body{background:#1e293b;color:#e2e8f0}
body.dark .v4sw-body small{color:#94a3b8}
body.dark .btn-mini{background:#334155;color:#e2e8f0;border-color:#475569}
body.dark .btn-mini.edit:hover{background:#1e3a8a;color:#60a5fa}
body.dark .btn-mini.delete:hover{background:#7f1d1d;color:#fca5a5}
/* stat sub-labels on gradient cards */
body.dark .stat-sub{color:#cbd5e1}
/* dialogs live on white boxes — keep their text dark */
body.dark .standard-dialog-box{color:#1e293b}
/* modals we build (edit/detail/tools) keep white body + dark text */
body.dark #v4emModal > div,
body.dark #v4detailModal > div,
body.dark #v4binModal > div,
body.dark #v4transferModal > div,
body.dark #v4stockCountModal > div,
body.dark #v4restockModal > div,
body.dark #v4varPriceModal > div,
body.dark #v4photoModal{color:#1e293b;background:#fff}
body.dark #v4emModal label,
body.dark #v4detailModal label,
body.dark #v4detailModal td,
body.dark #v4varPriceModal label{color:#475569}
/* maximize (v3 parity) */
.maximized-card{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:9000!important;margin:0!important;border-radius:0!important;background:#f8fafc!important;overflow-y:auto!important;padding:12px!important}
body.dark .maximized-card{background:#0f172a!important}

  
</style>
  
</head>
<body>
  <!-- ═══ SPLASH SCREEN (v3 heritage restored — brand family look) ═══ -->
<div id="splashScreen">
  <div style="text-align:center;color:#fff;padding:20px">
    <div style="font-size:56px;margin-bottom:10px;animation:v4splashPulse 1.6s ease-in-out infinite">🏪</div>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:.5px;margin:0">SmartShop Pro</h1>
    <p style="font-size:12px;opacity:.75;margin-top:5px">Owner Administration · <span id="splashVer">v4</span></p>
    <div style="width:140px;height:4px;background:rgba(255,255,255,.18);border-radius:4px;overflow:hidden;margin:20px auto 0">
      <div id="splashBar" style="width:0%;height:100%;background:#fff;border-radius:4px;transition:width 1.3s ease"></div>
    </div>
    <small style="display:block;margin-top:14px;font-size:10px;opacity:.5">tap to skip</small>
  </div>
</div>
<style>
#splashScreen{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);transition:opacity .6s ease;cursor:pointer}
#splashScreen.hide{opacity:0;pointer-events:none}
@keyframes v4splashPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
</style>
<script>
(function(){
  function v4SplashKill(){
    var s = document.getElementById('splashScreen');
    if (!s) return;
    s.classList.add('hide');
    setTimeout(function(){ if (s.parentNode) s.remove(); }, 700);
  }
  var bar = document.getElementById('splashBar');
  if (bar) setTimeout(function(){ bar.style.width = '100%'; }, 80);
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof APP_VERSION !== 'undefined') { var v = document.getElementById('splashVer'); if (v) v.textContent = APP_VERSION.split('-')[0]; }
    setTimeout(v4SplashKill, 1200);
  });
  setTimeout(v4SplashKill, 2000);                                  // safety net
  var sEl = document.getElementById('splashScreen');
  if (sEl) sEl.addEventListener('click', v4SplashKill);            // tap to skip
})();
</script>

<!-- LOGIN -->
<div class="screen show" id="loginScreen">
  <div class="box">
    <h1>🏪 SmartShop Pro</h1>
    <p>Owner Administration · Clean Build v4</p>
    <input type="email" id="loginEmail" placeholder="Owner Email" autocomplete="off">
    <input type="password" id="loginPass" placeholder="Password" autocomplete="new-password">
    <button class="btn btn-p" onclick="adminLogin()">🔓 Sign In</button>
    <button class="btn" style="background:#fff;color:#2563eb;border:1px solid #2563eb;font-weight:bold;margin-top:8px;" onclick="ssShowRegisterForm()">📝 Create New Account</button>
    <p style="margin-top:10px;font-size:11px;color:#94a3b8;cursor:pointer;text-decoration:underline;" onclick="ssForgotPassword()">🔑 Forgot password?</p>
  </div>
</div>
<!-- REGISTRATION (email + password ONLY — shop<!-- REGISTRATION (email + password ONLY — shop type chosen AFTER login) -->
<div class="screen" id="registerScreen">
  <div class="box" style="max-width:380px;">
    <div style="text-align:center;margin-bottom:12px;">
      <h1 style="font-size:22px;color:#1e3a8a;">🎉 Create Your Account</h1>
      <p style="font-size:12px;color:#64748b;">Just your email and password — we'll set up your shop next.</p>
    </div>
    <label style="font-size:10px;color:#64748b;font-weight:700;display:block;margin:4px 0 2px;text-align:left;">📧 EMAIL *</label>
    <input type="email" id="regEmail" placeholder="your@email.com" style="width:100%;padding:12px;margin:0 0 10px 0;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;">
    <label style="font-size:10px;color:#64748b;font-weight:700;display:block;margin:4px 0 2px;text-align:left;">🔐 PASSWORD *</label>
    <div style="position:relative;margin-bottom:6px;">
      <input type="password" id="regPass" placeholder="Min 6 characters" style="width:100%;padding:12px 44px 12px 12px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;" oninput="regCheckStrength()">
      <button type="button" onclick="regTogglePwd('regPass')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;">👁️</button>
    </div>
    <div style="display:flex;gap:3px;margin:0 0 4px;">
      <div id="strBar1" style="flex:1;height:5px;border-radius:3px;background:#e2e8f0;"></div>
      <div id="strBar2" style="flex:1;height:5px;border-radius:3px;background:#e2e8f0;"></div>
      <div id="strBar3" style="flex:1;height:5px;border-radius:3px;background:#e2e8f0;"></div>
    </div>
    <small id="strText" style="font-size:10px;color:#94a3b8;display:block;margin-bottom:10px;">Use letters + numbers for stronger password</small>
    <label style="font-size:10px;color:#64748b;font-weight:700;display:block;margin:4px 0 2px;text-align:left;">🔐 CONFIRM PASSWORD *</label>
    <div style="position:relative;margin-bottom:12px;">
      <input type="password" id="regPass2" placeholder="Repeat password" style="width:100%;padding:12px 44px 12px 12px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;" oninput="regCheckMatch()">
      <button type="button" onclick="regTogglePwd('regPass2')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;">👁️</button>
    </div>
    <div id="matchIndicator" style="font-size:11px;margin-bottom:10px;display:none;"></div>
    <button class="btn btn-p" onclick="registerAccount()">🚀 Create My Account</button>
    <p style="text-align:center;margin-top:10px;font-size:11px;color:#94a3b8;cursor:pointer;text-decoration:underline;" onclick="ssBackToLogin()">Already have an account? Sign In</p>
  </div>
</div>

<!-- REGISTRATION SUCCESS -->
<div class="screen" id="regSuccessScreen">
  <div class="box">
    <div style="font-size:48px;">🎉</div>
    <h3 style="margin-bottom:4px;">Account Created!</h3>
    <p style="font-size:12px;color:#64748b;">SAVE this information — you need it to sign in & connect devices.</p>
    <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:14px;margin:12px 0;">
      <div style="font-size:10px;color:#64748b;font-weight:800;letter-spacing:1px;">🔑 YOUR SHOP ID</div>
      <div id="regSuccessShopId" style="font-size:24px;font-weight:800;color:#2563eb;word-break:break-all;margin:4px 0;"></div>
      <button class="btn btn-p" onclick="navigator.clipboard.writeText(document.getElementById('regSuccessShopId').textContent).then(function(){alert('📋 Shop ID copied!')})" style="width:auto;padding:8px 16px;font-size:12px;">📋 Copy Shop ID</button>
    </div>
    <div style="text-align:left;font-size:12px;color:#334155;line-height:1.7;">
      <b>📝 Your login:</b> <span id="regSuccessEmail"></span> + the password you created<br>
      <b>Next steps:</b><br>
      1️⃣ Tap "Continue" and sign in<br>
      2️⃣ POS/Kitchen: sign in with your email — shop found automatically<br>
      🔑 Forgot password? Tap "Forgot Password?" on the login screen
    </div>
    <button class="btn btn-p" onclick="ssBackToLogin()" style="margin-top:14px;">Continue →</button>
  </div>
</div>

<!-- LOADING -->
<div class="screen" id="loadingScreen">
  <div style="color:#fff;text-align:center">
    <div style="font-size:20px;font-weight:800;margin-bottom:14px">SmartShop Pro</div>
    <div style="width:80%;max-width:280px;height:10px;background:rgba(255,255,255,.2);border-radius:10px;overflow:hidden"><div id="loadingBar"></div></div>
  </div>
</div>

<!-- APP PIN -->
<div class="screen" id="appPinScreen">
  <div class="box">
    <div style="font-size:36px">🔐</div>
    <h1 style="color:#1e293b">Enter App PIN</h1>
    <p>4-digit security PIN for this device</p>
    <input type="password" id="appPinInput" maxlength="4" placeholder="• • • •" style="text-align:center;font-size:22px;letter-spacing:8px">
    <button class="btn btn-p" onclick="verifyAppPin()">🔓 Unlock</button>
    <button class="btn btn-o" onclick="adminLogout()" style="color:var(--bad);border-color:var(--bad)">Logout</button>
  </div>
</div>
  <!-- ═══ PRODUCTS TEMPLATE (clean, v4 — 4-type law) ═══ -->
<template id="tab1HTML">
<div id="tab1" class="tab-content">

  <!-- ADD PRODUCT -->
  <div class="card">
    <div class="card-title" onclick="v4ToggleCard(this)">➕ Add Product <span class="arrow">▶</span></div>
    <div class="card-body" style="display:none">
      <label>📦 Product Name</label>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px">
        <input class="v4-in" id="v4prodName" placeholder="Enter product name">
        <select class="v4-in" id="v4prodUnit">
          <option value="">Unit</option>
          <option>kg</option><option>gram</option><option>litre</option><option>ml</option>
          <option>piece</option><option>packet</option><option>dozen</option><option>box</option>
          <option>bottle</option><option>can</option><option>pair</option><option>set</option>
          <option>roll</option><option>bundle</option><option>meter</option><option>cup</option><option>glass</option><option>spoon</option><option>dish</option>
        </select>
      </div>

      <label>🏷️ Product Type — the 4-type law</label>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px" id="v4typeCards">
        <div class="v4-type active" data-t="sell" onclick="v4PickType('sell')">🛒 <b>Sell Direct</b><small>Menu + stock + 2 prices</small></div>
        <div class="v4-type" data-t="raw" onclick="v4PickType('raw')">🧪 <b>Raw Material</b><small>Hidden — recipes only</small></div>
        <div class="v4-type" data-t="virtual" onclick="v4PickType('virtual')">🍔 <b>Prepared</b><small>Menu + price, no stock</small></div>
        <div class="v4-type" data-t="dual" onclick="v4PickType('dual')">🥚 <b>Dual Use</b><small>Sell AND recipe</small></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label>💵 Selling Price *</label><input type="number" class="v4-in" id="v4prodPrice" placeholder="0"></div>
        <div id="v4costWrap"><label>💰 Cost Price</label><input type="number" class="v4-in" id="v4prodCost" placeholder="0"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="v4stockWrap">
        <div><label>📊 Stock Qty</label><input type="number" class="v4-in" id="v4prodStock" placeholder="0"></div>
        <div><label>⚠️ Low Stock Alert</label><input type="number" class="v4-in" id="v4prodReorder" value="5"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="v4extraWrap">
        <div><label>📂 Category</label><input class="v4-in" id="v4prodCategory" placeholder="e.g., Beverages"></div>
        <div><label>📅 Expiry (optional)</label><input type="date" class="v4-in" id="v4prodExpiry"></div>
      </div>

      <div id="v4stationWrap">
        <label>🍳 Prep Station (kitchen routing)</label>
        <select class="v4-in" id="v4prodStation">
          <option value="Kitchen">🍳 Kitchen</option>
          <option value="Bar">🍹 Bar / Cold</option>
          <option value="Coffee">☕ Coffee / Hot</option>
        </select>
      </div>

      <label>🖼️ Image (optional)</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="v4-in" id="v4prodImage" placeholder="URL or upload" style="flex:1">
        <button class="v4-btn sm" style="width:auto" onclick="document.getElementById('v4prodImgFile').click()">📁</button>
        <input type="file" id="v4prodImgFile" accept="image/*" style="display:none" onchange="ssUploadProductImage(this,'v4prodImage')">
      </div>

      <label>🏷️ Barcode</label>
      <div style="display:flex;gap:8px">
      <button class="v4-btn sm" style="width:auto;background:#0d64f0" onclick="v4StartScanner('v4prodBarcode')">📷</button>
        
      </div>
            <label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="v4prodMenu" checked> 📱 Show on Customer QR Menu</label>

      <label style="margin-top:8px"><input type="checkbox" id="v4bulkChk" onchange="document.getElementById('v4bulkF').style.display=this.checked?'block':'none'"> 📦 Bulk Pricing (quantity discounts)</label>
      <div id="v4bulkF" style="display:none;background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;padding:10px;margin-bottom:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <input type="number" class="v4-in" id="v4bulkQty1" placeholder="Min Qty 1" style="margin:0">
          <input type="number" class="v4-in" id="v4bulkPrice1" placeholder="Price 1" style="margin:0">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <input type="number" class="v4-in" id="v4bulkQty2" placeholder="Min Qty 2" style="margin:0">
          <input type="number" class="v4-in" id="v4bulkPrice2" placeholder="Price 2" style="margin:0">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <input type="number" class="v4-in" id="v4bulkQty3" placeholder="Min Qty 3" style="margin:0">
          <input type="number" class="v4-in" id="v4bulkPrice3" placeholder="Price 3" style="margin:0">
        </div>
      </div>

            <label style="margin-top:8px"><input type="checkbox" id="v4varChk" onchange="document.getElementById('v4varF').style.display=this.checked?'block':'none'"> 🎨 Has Variants (colors, sizes…)</label>
      <div id="v4varF" style="display:none;background:#fdf2f8;border:1px dashed #ec4899;border-radius:10px;padding:10px;margin-bottom:8px">
        <div id="v4varRows"></div>
        <button class="v4-chip" style="width:100%;margin-top:4px" onclick="v4varAddRow()">+ Add Attribute (e.g., Color, Size)</button>
        <small id="v4varPreview" style="display:block;margin-top:6px;color:#db2777;font-weight:700"></small>
      </div>

      <label>🛠️ Modifiers & Add-ons (e.g., Extras, Sugar, Size)</label>
      <div id="v4addModBox"></div>
      <button class="v4-chip" style="width:100%;margin-top:2px" onclick="v4naAddGroup()">+ Add Modifier Group</button>

      <button class="v4-btn g" onclick="v4AddProduct()">✅ Add Product</button>
    </div>
  </div>  
  
  <!-- TOOLS (v3 parity) -->
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
    <button class="v4-chip" style="flex:1;background:#0d64f0;color:#fff;border:none" onclick="v4OpenTransfer()">🚚 Transfer</button>
    <button class="v4-chip" style="flex:1;background:#8b5cf6;color:#fff;border:none" onclick="v4OpenStockCount()">🧮 Stock Count</button>
    <button class="v4-chip" style="flex:1;background:#dc2626;color:#fff;border:none" onclick="v4OpenRestock()">🚨 Restock</button>
  </div>
  <!-- PRODUCT LIST -->
<div class="card" id="v4prodTableCard">    <div class="card-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      📦 Products <span class="v4-badge" id="v4prodCount">0</span>
      <span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">
        <button class="v4-chip active" id="v4pvExcel" onclick="v4ProductView('excel')">📊 Excel</button>
        <button class="v4-chip" id="v4pvList" onclick="v4ProductView('list')">📋 List</button>
        <button class="v4-chip" id="v4pvGrid" onclick="v4ProductView('grid')">⊞ Grid</button>
        <button class="v4-chip" onclick="v4ProductExport()">📥</button>
        <button class="v4-chip" onclick="v4ProductPrint()">🖨️</button>
        <button class="v4-chip" id="v4lowChip" onclick="v4ToggleLow()">🚨 Low</button>
        <button class="v4-chip" onclick="v4ToggleProductMaximize()">⛶</button>
        <button class="v4-chip" onclick="v4ImportCSV()">📂⬆</button>
        <button class="v4-chip" onclick="v4ExportCSV()">📄⬇</button>
        <button class="v4-chip" onclick="v4RefreshProducts()">🔄</button>
      </span>
    </div>
    
            <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px">
      <input class="v4-in" id="v4prodSearch" placeholder="🔍 Search…" style="flex:2;min-width:100px;max-width:160px;padding:7px 10px;margin:0;font-size:12px;height:34px;box-sizing:border-box">
      <select class="v4-in" id="v4prodCatFilter" style="flex:0 0 auto;min-width:0;width:auto;max-width:120px;padding:7px 6px;margin:0;font-size:12px;height:34px;box-sizing:border-box" onchange="v4RenderProductTable()"><option value="">All Categories</option></select>
      <select class="v4-in" id="v4prodUnitFilter" style="flex:0 0 auto;min-width:0;width:auto;max-width:100px;padding:7px 6px;margin:0;font-size:12px;height:34px;box-sizing:border-box" onchange="v4RenderProductTable()"><option value="">All Units</option></select>
      <select class="v4-in" id="v4prodTypeFilter" style="flex:0 0 auto;min-width:0;width:auto;max-width:110px;padding:7px 6px;margin:0;font-size:12px;height:34px;box-sizing:border-box" onchange="v4RenderProductTable()">
        <option value="">Type</option><option value="sell">🛒</option><option value="raw">🧪</option><option value="virtual">🍔</option><option value="dual">🥚</option>
      </select>
      <select class="v4-in" id="v4prodSort" style="flex:0 0 auto;min-width:0;width:auto;max-width:100px;padding:7px 6px;margin:0;font-size:12px;height:34px;box-sizing:border-box" onchange="v4RenderProductTable()">
        <option value="name-asc">A-Z</option><option value="name-desc">Z-A</option>
        <option value="price-desc">Price↑</option><option value="price-asc">Price↓</option><option value="popular">Popular</option>
      </select>
    </div>
    
        <div id="v4productExcel"></div>
    <div id="v4productList" style="display:none;max-height:60vh;overflow-y:auto"></div>
    <div id="v4productGrid" style="display:none;max-height:60vh;overflow-y:auto"></div>
  </div>
</div>
</template>
<style>
.v4-in{width:100%;padding:11px 13px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;margin:3px 0 9px 0;background:#fff;color:#0f172a;outline:none}
.v4-in:focus{border-color:#2563eb}
label{font-size:11px;font-weight:800;color:#475569;display:block;margin-top:4px}
.v4-type{border:2px solid #e2e8f0;border-radius:12px;padding:10px;cursor:pointer;text-align:center;background:#fff}
.v4-type small{display:block;font-size:9px;color:#64748b;margin-top:3px}
.v4-type.active{border-color:#2563eb;background:#eff6ff}
.v4-btn{width:100%;padding:13px;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;margin-top:10px}
.v4-btn.g{background:#10b981;color:#fff}.v4-btn.p{background:#2563eb;color:#fff}
.v4-btn.sm{padding:11px;background:#2563eb;color:#fff;margin:0}
.v4-chip{padding:7px 12px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer}
  .v4-chip.active{background:#2563eb!important;color:#fff!important;border-color:#2563eb!important}
.v4sw-body{background:#fff}
body.dark .v4sw-body{background:#1e293b}
.v4-badge{background:#2563eb;color:#fff;font-size:10px;font-weight:800;padding:2px 9px;border-radius:9px}
body.dark .v4-in{background:#0f172a;border-color:#475569;color:#f1f5f9}
body.dark .v4-type{background:#1e293b;border-color:#334155}
body.dark .v4-type.active{border-color:#3b82f6;background:#1e3a8a}
</style>
  
  <!-- ═══ SALES TEMPLATE (clean, v4) ═══ -->
<template id="tab2HTML">
  <div id="tab2" class="tab-content">

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="v4Fold('v4sumBody','v4sumArrow')">📅 Sales Summaries <span id="v4sumArrow" style="margin-left:auto">▾</span></div>
    <div id="v4sumBody">
      <div id="v4sumViews" style="display:flex;gap:5px;margin-bottom:8px">
        <button class="v4-chip active" onclick="v4SumView('excel',this)">📊 Excel</button>
        <button class="v4-chip" onclick="v4SumView('list',this)">📋 List</button>
        <button class="v4-chip" onclick="v4SumView('grid',this)">⊞ Grid</button>
      </div>
      <div id="v4sumPeriods" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch">        <button class="period-btn" onclick="v4SumPeriod('all',this)">All</button>
        <button class="period-btn active" onclick="v4SumPeriod('daily',this)">Daily</button>
        <button class="period-btn" onclick="v4SumPeriod('weekly',this)">Weekly</button>
        <button class="period-btn" onclick="v4SumPeriod('monthly',this)">Monthly</button>
        <button class="period-btn" onclick="v4SumPeriod('yearly',this)">Yearly</button>
      </div>
      <div id="v4sumExcel"></div>
      <div id="v4sumList" style="display:none"></div>
      <div id="v4sumGrid" style="display:none"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="v4Fold('v4detBody','v4detArrow')">📋 Detailed Sales <span class="v4-badge" id="v4detCount">0</span><span id="v4detViews" style="margin-left:auto;display:flex;gap:5px" onclick="event.stopPropagation()">
        <button class="v4-chip active" onclick="v4DetView('excel',this)">📊</button>
        <button class="v4-chip" onclick="v4DetView('list',this)">📋</button>
        <button class="v4-chip" onclick="v4DetView('grid',this)">⊞</button>
      </span><span id="v4detArrow" style="margin-left:6px">▸</span></div>
    <div id="v4detBody" style="display:none">
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <select class="v4-in" id="v4dPay" style="flex:1;min-width:90px;height:34px;padding:6px;margin:0;font-size:12px" onchange="v4RenderDetailed()"><option value="">All Payments</option><option value="cash">💵 Cash</option><option value="card">💳 Card</option><option value="mobile">📱 Mobile</option><option value="credit">📝 Credit</option><option value="split">🧾 Split</option></select>
        <select class="v4-in" id="v4dShift" style="flex:1;min-width:90px;height:34px;padding:6px;margin:0;font-size:12px" onchange="v4RenderDetailed()"><option value="">All Shifts</option><option value="☀️ Morning">☀️ Morning</option><option value="🌤 Afternoon">🌤 Afternoon</option><option value="🌙 Evening">🌙 Evening</option></select>
        <select class="v4-in" id="v4dCashier" style="flex:1;min-width:100px;height:34px;padding:6px;margin:0;font-size:12px" onchange="v4RenderDetailed()"><option value="">All Cashiers</option></select>
      </div>
      <div id="v4detExcel"></div>
      <div id="v4detList" style="display:none"></div>
      <div id="v4detGrid" style="display:none"></div>
      <div style="text-align:center;padding:8px"><button class="v4-chip" id="v4detMore" style="display:none" onclick="v4LoadMoreDetailed()">⬇ Load 50 More Sales</button></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="v4Fold('v4itemBody','v4itemArrow')">📦 Item Detail <span id="v4itemViews" style="margin-left:auto;display:flex;gap:5px" onclick="event.stopPropagation()">
        <button class="v4-chip active" onclick="v4ItemView('excel',this)">📊</button>
        <button class="v4-chip" onclick="v4ItemView('list',this)">📋</button>
        <button class="v4-chip" onclick="v4ItemView('grid',this)">⊞</button>
      </span><span id="v4itemArrow" style="margin-left:6px">▸</span></div>
    <div id="v4itemBody" style="display:none">
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <select class="v4-in" id="v4iShift" style="flex:1;min-width:100px;height:34px;padding:6px;margin:0;font-size:12px" onchange="v4ItemFilterChange()"><option value="">All Shifts</option><option value="Morning">☀️ Morning</option><option value="Afternoon">🌤 Afternoon</option><option value="Evening">🌙 Evening</option></select>
        <select class="v4-in" id="v4iCashier" style="flex:1;min-width:110px;height:34px;padding:6px;margin:0;font-size:12px" onchange="v4ItemFilterChange()"><option value="">All Cashiers</option></select>
      </div>
      <div id="v4itemExcel"></div>
      <div id="v4itemList" style="display:none"></div>
      <div id="v4itemGrid" style="display:none"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="v4Fold('v4cashBody','v4cashArrow')">👥 Cashier Performance <span id="v4cashViews" style="margin-left:auto;display:flex;gap:5px" onclick="event.stopPropagation()">
        <button class="v4-chip active" onclick="v4CashView('excel',this)">📊</button>
        <button class="v4-chip" onclick="v4CashView('list',this)">📋</button>
        <button class="v4-chip" onclick="v4CashView('grid',this)">⊞</button>
      </span><span id="v4cashArrow" style="margin-left:6px">▸</span></div>
    <div id="v4cashBody" style="display:none">
      <select class="v4-in" style="max-width:150px" onchange="v4S.cperiod=this.value;v4RenderCashier()"><option value="all">All</option><option value="today">Today</option><option value="week">Week</option><option value="month" selected>Month</option><option value="year">Year</option></select>
      <div id="v4cashExcel"></div>
      <div id="v4cashList" style="display:none"></div>
      <div id="v4cashGrid" style="display:none"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="v4Fold('v4topBody','v4topArrow')">🏆 Top Products <span id="v4topViews" style="margin-left:auto;display:flex;gap:5px" onclick="event.stopPropagation()">
        <button class="v4-chip active" onclick="v4TopView('excel',this)">📊</button>
        <button class="v4-chip" onclick="v4TopView('list',this)">📋</button>
        <button class="v4-chip" onclick="v4TopView('grid',this)">⊞</button>
      </span><span id="v4topArrow" style="margin-left:6px">▸</span></div>
    <div id="v4topBody" style="display:none">
      <select class="v4-in" style="max-width:150px" onchange="v4S.tperiod=this.value;v4RenderTop()"><option value="all">All</option><option value="today">Today</option><option value="week">Week</option><option value="month" selected>Month</option><option value="year">Year</option></select>
      <div id="v4topExcel"></div>
      <div id="v4topList" style="display:none"></div>
      <div id="v4topGrid" style="display:none"></div>
    </div>
  </div>

</div>
</template>
  
<!-- ═══ DASHBOARD TEMPLATE (clean, v4) ═══ -->
<template id="tab0HTML">
<div id="tab0" class="tab-content">

  <!-- PERIOD SELECTOR + LENS (same line) -->
  <div class="card" style="padding:12px">
    <div id="v4LensBar" style="display:none;gap:6px;margin-bottom:8px;"></div>
     <div style="display:flex;gap:4px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch">    
    <button class="period-btn active" data-p="daily" onclick="loadDashboardV4('daily',this)" style="padding:8px 12px;font-size:12px;white-space:nowrap;">📅 Today</button>
<button class="period-btn" data-p="weekly" onclick="loadDashboardV4('weekly',this)" style="padding:8px 12px;font-size:12px;white-space:nowrap;">📅 Week</button>
<button class="period-btn" data-p="monthly" onclick="loadDashboardV4('monthly',this)" style="padding:8px 12px;font-size:12px;white-space:nowrap;">📅 Month</button>
<button class="period-btn" data-p="yearly" onclick="loadDashboardV4('yearly',this)" style="padding:8px 12px;font-size:12px;white-space:nowrap;">📅 Year</button>
    </div>
  </div>

  <!-- ⚡ QUICK ACTIONS -->
  <div class="card" style="padding:10px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
      <button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#10b981;color:#fff;font-weight:800;font-size:10px" onclick="selectTab(1, document.getElementById('stab1'))">📦 Add<br>Product</button>
      <button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#ef4444;color:#fff;font-weight:800;font-size:10px" onclick="selectTab(7, document.getElementById('stab7'))">💸 Record<br>Expense</button>
      <button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#7c3aed;color:#fff;font-weight:800;font-size:10px" onclick="selectTab(6, document.getElementById('stab6'))">💰 Pay<br>Salary</button>
      <button class="v4-chip" style="text-align:center;padding:10px 4px;border:none;background:#f59e0b;color:#fff;font-weight:800;font-size:10px" onclick="selectTab(5, document.getElementById('stab5'))">📉 Record<br>Loss</button>
    </div>
  </div>

  <!-- KPI ROW 1 -->
  <div class="card" style="padding:12px">
    <div class="kpi-main" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
      <div class="stat-card" style="border-left:5px solid #3b82f6"><div class="stat-label">💰 Revenue</div><div class="stat-value" id="v4statRevenue">—</div><div class="stat-sub" id="v4statRevenueSub"></div><div id="v4statRevenueCompare" style="font-size:11px;margin-top:2px"></div></div>
      <div class="stat-card" style="border-left:5px solid #10b981"><div class="stat-label">📈 Gross Profit</div><div class="stat-value" id="v4statGrossProfit">—</div><div class="stat-sub" id="v4statProfitSub"></div></div>
      <div class="stat-card" style="border-left:5px solid #f59e0b"><div class="stat-label">💸 Expenses</div><div class="stat-value" id="v4statExpenses">—</div><div class="stat-sub" id="v4statExpensesSub"></div></div>
      <div class="stat-card" style="border-left:5px solid #8b5cf6"><div class="stat-label">💎 Net Profit</div><div class="stat-value" id="v4statNetProfit">—</div><div class="stat-sub" id="v4statNetSub"></div></div>
    </div>
    <!-- KPI ROW 2: Alerts -->
    <div class="kpi-alert" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px">
      <div class="stat-card" style="border-left:5px solid #ef4444;padding:10px 6px"><div class="stat-label">💳 Credit</div><div class="stat-value" id="v4statCreditDue" style="font-size:16px">—</div></div>
      <div class="stat-card" style="border-left:5px solid #f97316;padding:10px 6px"><div class="stat-label">⚠️ Low</div><div class="stat-value" id="v4statLowStock" style="font-size:16px">—</div></div>
      <div class="stat-card" style="border-left:5px solid #ec4899;padding:10px 6px"><div class="stat-label">🔔 Salary</div><div class="stat-value" id="v4statSalaryAlerts" style="font-size:16px">—</div></div>
      <div class="stat-card" style="border-left:5px solid #f59e0b;padding:10px 6px"><div class="stat-label">📅 Expiring</div><div class="stat-value" id="v4statExpiring" style="font-size:16px">—</div></div>
      <div class="stat-card" style="border-left:5px solid #14b8a6;padding:10px 6px"><div class="stat-label">🏦 Loans</div><div class="stat-value" id="v4statOpenLoans" style="font-size:16px">—</div></div>
    </div>
  </div>

  <!-- 🧠 SMART INSIGHTS -->
  <div class="card" style="padding:12px">
    <div class="card-title" style="font-size:13px">🧠 Smart Insights <small style="font-size:10px;color:#94a3b8">— tap to act</small></div>
    <div id="v4insights"></div>
  </div>

     <!-- 🏨 HOTEL OCCUPANCY (hotels only) -->
    <div class="card" id="v4occupancyCard" style="display:none;padding:12px">
      <div class="card-title" style="font-size:13px">🏨 Room Occupancy (Live)</div>
      <div id="v4occupancy"></div>
    </div>

  <!-- CHARTS: Sales + Payment side by side -->
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <div class="card" style="flex:1;min-width:280px">
      <div class="card-title">📈 Sales (7 Days)</div>
      <div style="height:200px"><canvas id="v4salesChart"></canvas></div>
    </div>
    <div class="card" style="flex:1;min-width:280px">
      <div class="card-title">💳 Payment Methods</div>
      <div style="height:200px"><canvas id="v4payChart"></canvas></div>
    </div>
  </div>

  <!-- 🪑 ACTIVE TABLES + 🍳 KITCHEN side by side (cafe/hotel only — Round 11) -->
  <div id="v4cafeWidgets" style="display:flex;gap:10px;flex-wrap:wrap">
    <div class="card" style="flex:1;min-width:250px">
      <div class="card-title">🪑 Active Tables (Cafe Floor)</div>
      <div id="v4activeTables" style="max-height:160px;overflow-y:auto"></div>
    </div>
    <div class="card" style="flex:1;min-width:250px">
      <div class="card-title">🍳 Kitchen Live Status</div>
      <div id="v4kitchenStatus"></div>
    </div>
  </div>

  <!-- ⏰ PEAK HOURS + 🤖 FORECAST side by side -->
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <div class="card" style="flex:1;min-width:280px">
      <div class="card-title">⏰ Peak Hour Analysis (30 Days)</div>
      <div id="v4peakHours" style="max-height:200px;overflow-y:auto;font-size:11px"></div>
    </div>
    <div class="card" style="flex:1;min-width:250px">
      <div class="card-title">🤖 Smart Forecast (Tomorrow)</div>
      <div id="v4forecast"></div>
    </div>
  </div>

  <!-- 💸 EXPENSE BREAKDOWN -->
  <div class="card">
    <div class="card-title">💸 Expense Breakdown</div>
    <div style="height:220px"><canvas id="v4expenseChart"></canvas></div>
  </div>

  <!-- 🕒 RECENT SALES + 👥 CASHIER side by side -->
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <div class="card" style="flex:1;min-width:280px">
      <div class="card-title" style="display:flex;align-items:center;gap:6px">🕒 Recent Sales
        <button class="v4-chip" style="font-size:9px;padding:4px 10px;margin-left:auto" onclick="v4DailySummaryWA()">📤</button>
      </div>
      <div id="v4recentSales" style="max-height:200px;overflow-y:auto;font-size:13px">Loading…</div>
    </div>
    <div class="card" style="flex:1;min-width:250px">
      <div class="card-title">👥 Cashier Breakdown</div>
      <div id="v4salesBreakdown" style="max-height:200px;overflow-y:auto;font-size:13px">Loading…</div>
    </div>
  </div>

</div>
</template>
<style>
/* ═══ v4 DASHBOARD — original look, one home ═══ */
.stat-card{background:#fff;border-radius:18px;padding:18px;text-align:center;border-left:6px solid #3b82f6;box-shadow:0 4px 12px rgba(0,0,0,.05)}
.stat-value{font-size:26px;font-weight:800;line-height:1.2}
.stat-label{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.5px}
.stat-sub{font-size:11px;color:#94a3b8;margin-top:3px}
/* KPI row 1 — the classic gradients */
.kpi-main .stat-card:nth-child(1){background:linear-gradient(135deg,#eff6ff,#dbeafe);border-left-color:#3b82f6}
.kpi-main .stat-card:nth-child(2){background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-left-color:#10b981}
.kpi-main .stat-card:nth-child(3){background:linear-gradient(135deg,#fffbeb,#fef3c7);border-left-color:#f59e0b}
.kpi-main .stat-card:nth-child(4){background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-left-color:#8b5cf6}
/* Alert row — classic tints (border colors stay inline) */
.kpi-alert .stat-card:nth-child(1){background:linear-gradient(135deg,#fef2f2,#fee2e2)}
.kpi-alert .stat-card:nth-child(2){background:linear-gradient(135deg,#fff7ed,#ffedd5)}
.kpi-alert .stat-card:nth-child(3){background:linear-gradient(135deg,#fdf2f8,#fce7f3)}
.kpi-alert .stat-card:nth-child(4){background:linear-gradient(135deg,#f0fdfa,#ccfbf1)}
/* Dark mode */
body.dark .stat-card{box-shadow:0 4px 12px rgba(0,0,0,.3)}
body.dark .kpi-main .stat-card:nth-child(1){background:linear-gradient(135deg,#172554,#1e3a8a)}
body.dark .kpi-main .stat-card:nth-child(2){background:linear-gradient(135deg,#064e3b,#065f46)}
body.dark .kpi-main .stat-card:nth-child(3){background:linear-gradient(135deg,#78350f,#92400e)}
body.dark .kpi-main .stat-card:nth-child(4){background:linear-gradient(135deg,#312e81,#3730a3)}
body.dark .kpi-alert .stat-card:nth-child(1){background:linear-gradient(135deg,#450a0a,#7f1d1d)}
body.dark .kpi-alert .stat-card:nth-child(2){background:linear-gradient(135deg,#7c2d12,#9a3412)}
body.dark .kpi-alert .stat-card:nth-child(3){background:linear-gradient(135deg,#831843,#9d174d)}
body.dark .kpi-alert .stat-card:nth-child(4){background:linear-gradient(135deg,#134e4a,#115e59)}
body.dark .stat-value{color:#f1f5f9}
body.dark .stat-label{color:#94a3b8}
body.dark .stat-sub{color:#94a3b8}
.period-btn{padding:10px 16px;border:2px solid #e2e8f0;border-radius:30px;font-size:13px;background:#fff;cursor:pointer;font-weight:700}
.period-btn.active{background:#3b82f6;color:#fff;border-color:#3b82f6}
body.dark .period-btn{background:#334155;color:#e2e8f0;border-color:#475569}
body.dark .period-btn.active{background:#2563eb;color:#fff;border-color:#2563eb}
</style>
<!-- Scanner overlay -->
<div id="v4scanContainer" style="display:none;position:fixed;inset:0;background:#000;z-index:9500;align-items:center;justify-content:center">
  <button onclick="v4StopScanner()" style="position:absolute;top:20px;right:20px;background:#fff;border:none;padding:10px 14px;border-radius:50%;font-size:18px">✖</button>
  <div id="v4scanVideo" style="width:95%;max-width:480px"></div>
</div>
  
<!-- MAIN -->
<div id="mainApp" style="display:none">
  <div class="header">
    <button class="hbtn" onclick="toggleSidebar()">☰</button>
    <span style="font-weight:800">SmartShop Pro <span class="verbadge" id="verBadge">v4</span></span>
    <span style="display:flex;gap:6px;align-items:center">
      <button class="hbtn" onclick="toggleDarkMode()">🌓</button>
      <select id="shopSwitcher" onchange="v4SwitchShop(this.value)" style="display:none;max-width:95px;padding:4px;border-radius:8px;border:none;font-size:11px"></select>
      <select id="langSelect" onchange="changeLanguage(this.value)"><option value="en">EN</option><option value="am">አማ</option><option value="om">OR</option></select>
      <button class="hbtn" onclick="adminLogout()">🚪</button>
    </span>
  </div>
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  <div class="sidebar" id="sidebar">
    <div style="padding:16px;font-weight:800;border-bottom:1px solid #f1f5f9;color:#1e3a8a">📋 Menu <span class="badge" id="planBadge">…</span></div>
    <div id="sideTabs"></div>
    <div class="side-foot" id="sideFoot">SmartShop Pro v4.0.0 — Clean Build<br>Step 1/14 · Skeleton</div>
  </div>
  <div class="container" id="tabContainer"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.3/dist/quagga.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js"></script>
<script src="config.js"></script>
<script src="sheet.js"></script>
<script src="shared.js"></script>
<script src="ssauth.js"></script>
<script src="ssperf.js"></script>
<script src="ssfeatures.js"></script>
<script src="ssupload.js"></script>
<script src="ssfiscal.js"></script>  <script>window.V4_TAB_LOADERS = {};</script>
<script src="v4-dashboard.js"></script>
<script src="v4-products.js"></script>
  <script src="v4-sales.js"></script>
  <script src="v4-stock.js"></script>
  <script src="v4-credits.js"></script>
  <script src="v4-losses.js"></script>
  <script src="v4-expenses.js"></script>
  <script src="v4-staff.js"></script>
  <script src="v4-suppliers.js"></script>
  <script src="v4-recipes.js"></script>
  <script src="v4-hotel.js"></script>
<script src="v4-reports.js"></script>
<script src="v4-money.js"></script>
  <script src="v4-extras.js"></script>
  <script src="v4-settings.js"></script>
<script src="v4-license-guard.js"></script>
<script src="v4-shops.js"></script>
<script src="smartcom.js"></script>
  
<script>
// ═════════════════════════════════════════════════════════
//  SMARTSHOP PRO v4 — CLEAN ADMIN · SKELETON (Step 1/14)
//  Laws: one function one place · data-driven UI · version on screen
//  Role: OWNER ONLY (Phase C adds roles) · Plan lock ACTIVE via ssfeatures
// ═════════════════════════════════════════════════════════
var APP_VERSION = '4.0.0-SKELETON';
  // 🛡️ CURRENCY GUARD — sheet.js render needs this (normally from shared.js; belt+braces)
if (typeof window.appCurrencySymbol === 'undefined' || !window.appCurrencySymbol) {
    window.appCurrencySymbol = localStorage.getItem('appCurrencySymbol') || 'Br ';
}

// ── TAB MAP (numbers match the classic admin 1:1 for clean porting) ──
var TABS = [
  {n:0,  icon:'📊', label:'Dashboard'},
  {n:1,  icon:'📦', label:'Products', sub:[
    {label:'➕ Add Product', act:'addProduct'},
    {label:'🚚 Transfer to Branch', act:'transfer'},
    {label:'🧮 Physical Stock Count', act:'stockCount'},
    {label:'🚨 Low Stock & Restock', act:'restock'}
  ]},
  {n:2,  icon:'💰', label:'Sales', sub:[
    {label:'📅 Summaries', act:'sum'},
    {label:'📋 Detailed Sales', act:'detailed'},
    {label:'📦 Item Detail', act:'itemDetail'},
    {label:'👤 Cashier Performance', act:'cashier'},
    {label:'🏆 Top Products', act:'top'}
  ]},
  {n:3,  icon:'📊', label:'Stock'},
  {n:4,  icon:'💳', label:'Credits'},
  {n:5,  icon:'📉', label:'Losses'},
  {n:6,  icon:'👥', label:'Staff'},
  {n:7,  icon:'💸', label:'Expenses'},
  {n:8,  icon:'📈', label:'Reports'},
  {n:9,  icon:'🏭', label:'Suppliers'},
  {n:18, icon:'🍳', label:'Recipes'},
  {n:21, icon:'🏨', label:'Hotel'},
  {n:10, icon:'🎁', label:'Loyalty'},
  {n:11, icon:'💸', label:'Loans'},
  {n:12, icon:'🏦', label:'Bank'},
  {n:15, icon:'📓', label:'Notebook'},
  {n:19, icon:'💬', label:'Intercom'},
  {n:13, icon:'⚙️', label:'Settings'},
  {n:14, icon:'🔑', label:'License'},
  {n:20, icon:'📱', label:'Devices'},
  {n:16, icon:'🏪', label:'Shops', ent:true}
];

// ── SIDEBAR + TAB CONTAINERS (data-driven, replaces 200 lines of HTML) ──
function buildSidebar() {
  var st = document.getElementById('sideTabs'), tc = document.getElementById('tabContainer');
  var sh = '', ch = '';
  TABS.forEach(function(t) {
    var hasSub = t.sub && t.sub.length;
    sh += '<div class="sidebar-tab' + (hasSub ? ' has-sub' : '') + '" id="stab' + t.n + '" onclick="sideTabClick(' + t.n + ', this)">' +
          '<span>' + t.icon + '</span><span style="flex:1">' + t.label + '</span>' +
          (hasSub ? '<span class="sub-arrow" id="sarrow' + t.n + '">▸</span>' : '') + '</div>';
    if (hasSub) {
      sh += '<div class="submenu" id="sub' + t.n + '" style="display:none">' +
        t.sub.map(function(s) {
          return '<div class="submenu-item" onclick="event.stopPropagation();v4SubAction(\'' + s.act + '\')">' + s.label + '</div>';
        }).join('') + '</div>';
    }
        var tpl = document.getElementById('tab' + t.n + 'HTML');
    ch += tpl ? tpl.innerHTML
        : '<div id="tab' + t.n + '" class="tab-content"><div class="card"><div class="placeholder">' +
          '<b>' + t.icon + '</b><b style="font-size:16px">' + t.label + '</b><br>' +
          '<span style="font-size:12px">🚧 Porting soon — arrives in a later step of the build.</span>' +
          '</div></div></div>';
  });
  st.innerHTML = sh;
  tc.innerHTML = ch;
}

// ── sidebar behavior: 1st tap opens tab (accordion stays), sub-items fire actions ──
var v4openSub = null;
function sideTabClick(n, el) {
  var t = TABS.find(function(x){ return x.n === n; });
  if (t && t.sub && t.sub.length) {
    // toggle accordion; open tab content too (first-tap law, v3 parity)
    var sub = document.getElementById('sub' + n);
    var opening = sub.style.display === 'none';
    document.querySelectorAll('.submenu').forEach(function(s){ s.style.display = 'none'; });
    document.querySelectorAll('.sub-arrow').forEach(function(a){ a.textContent = '▸'; a.classList.remove('open'); });
    if (opening) {
      sub.style.display = 'block';
      var ar = document.getElementById('sarrow' + n); if (ar) { ar.textContent = '▾'; ar.classList.add('open'); }
      if (el && !el.classList.contains('active')) selectTab(n, el);
      var sb = document.getElementById('sidebar'); if (sb && !sb.classList.contains('open')) sb.classList.add('open');
      var ov = document.getElementById('sidebarOverlay'); if (ov) ov.classList.add('show');
    } else if (el && el.classList.contains('active')) {
      closeSidebar();   // 2nd tap on an open parent = go to tab & close
    }
    return;
  }
  selectTab(n, el);
}

// ── sub-menu actions (v3 parity: same jumps & modals) ──
function v4SubAction(act) {
  closeSidebar();
  try {
    switch(act) {
      case 'addProduct':
        selectTab(1, document.getElementById('stab1'));
        setTimeout(function() {
          var card = document.querySelector('#tab1 .card');
          if (card) {
            card.scrollIntoView({ behavior:'smooth', block:'start' });
            var body = card.querySelector('.card-body');
            if (body && body.style.display === 'none') v4ToggleCard(card.querySelector('.card-title'));
          }
        }, 250);
        break;
      case 'transfer':    selectTab(1, document.getElementById('stab1')); setTimeout(v4OpenTransfer, 250); break;
      case 'stockCount':  selectTab(1, document.getElementById('stab1')); setTimeout(v4OpenStockCount, 250); break;
      case 'restock':     selectTab(1, document.getElementById('stab1')); setTimeout(v4OpenRestock, 250); break;
      case 'sum':         selectTab(2, document.getElementById('stab2')); setTimeout(function(){ var c = document.querySelector('#tab2 .card'); if (c) c.scrollIntoView({behavior:'smooth'}); }, 250); break;
      case 'detailed':    selectTab(2, document.getElementById('stab2')); setTimeout(function(){ var c = document.getElementById('v4detExcel'); if (c) c.closest('.card').scrollIntoView({behavior:'smooth'}); }, 350); break;
      case 'itemDetail':  selectTab(2, document.getElementById('stab2')); setTimeout(function(){ var c = document.getElementById('v4itemExcel'); if (c) c.closest('.card').scrollIntoView({behavior:'smooth'}); }, 350); break;      case 'cashier':     selectTab(2, document.getElementById('stab2')); setTimeout(function(){ var c = document.getElementById('v4cashExcel'); if (c) c.closest('.card').scrollIntoView({behavior:'smooth'}); }, 350); break;
      case 'top':         selectTab(2, document.getElementById('stab2')); setTimeout(function(){ var c = document.getElementById('v4topExcel'); if (c) c.closest('.card').scrollIntoView({behavior:'smooth'}); }, 350); break;
    }
  } catch(e) { console.warn('Sub action:', e.message); }
}
// ── LICENSE CACHE GETTER — proper home in v4 (classic admin keeps its own copy) ──
function getLicense() {
    try { return JSON.parse(localStorage.getItem('smartshop_license') || 'null'); }
    catch(e) { return null; }
}

// ── PLAN LOCK (business-type law + plan features, from ssfeatures.js) ──
function applyPlanVisibility() {
    TABS.forEach(function(t) {
        var el = document.getElementById('stab' + t.n);
        if (!el) return;
        var show = true;
        try {
            if (t.n === 21) show = (typeof ssHasFeature === 'function' && ssHasFeature('rooms'));
            else if (t.n === 18) {
                // 🍳 RECIPES — cafés AND hotels have kitchens; plus any plan carrying the feature
                var biz = (window.__currentShopRow && window.__currentShopRow.business_type) ||
                          (typeof SS_PLAN !== 'undefined' && SS_PLAN.businessType) || 'retail';
                show = (biz === 'cafe' || biz === 'hotel') ||
                       (typeof ssHasFeature === 'function' && ssHasFeature('recipes'));
            }     
            else if (t.ent) { var lic = getLicense(); show = !!(lic && lic.plan === 'enterprise'); }
            else if (typeof ssTabAllowed === 'function') show = ssTabAllowed(t.n);
        } catch(e) { console.warn('Tab visibility:', t.n, e.message); }
        el.style.display = show ? 'flex' : 'none';
              var sm = document.getElementById('sub' + t.n);
        if (sm) sm.style.display = 'none';   // collapsed with parent; reopens on tap
    });
    var b = document.getElementById('planBadge');
    if (b) {
        var lbl = (typeof ssPlanLabel === 'function') ? ssPlanLabel() : '…';
        var ico = '🛒';
        try { ico = (typeof ssIsCafe === 'function' && (ssIsCafe() || (window.__currentShopRow && window.__currentShopRow.business_type === 'hotel'))) ? '🏨' : '🛒'; } catch(e) {}
        b.textContent = ico + ' ' + lbl;
        b.title = 'Shop ID: ' + getShopId();   // long-press to see
    }
    // 🔑 Shop ID badge (always visible, next to plan)
    var sidBadge = document.getElementById('shopIdBadge');
    if (!sidBadge) {
        var foot = document.querySelector('.sidebar div:first-child');
        if (foot) {
            sidBadge = document.createElement('span');
            sidBadge.id = 'shopIdBadge';
            sidBadge.style.cssText = 'display:block;font-size:9px;font-weight:700;color:#94a3b8;margin-top:2px;letter-spacing:.5px;';
            foot.appendChild(sidBadge);
        }
    }
       if (sidBadge) sidBadge.textContent = '🔑 ' + getShopId();
    // 🎯 Round 12: type law runs LAST — the type always wins
    if (typeof v4TypeTabs === 'function') v4TypeTabs();
}
  
// ── TYPE LAW (Round 12 — the Captain's law, one home) ──
// retail: no Recipes(18), no Hotel(21) · cafe: no Hotel(21) · hotel: all menus
// Plan features (Master) may hide MORE — but never show what the type forbids.
// Runs LAST (after applyPlanVisibility / v4lgApplySidebar) so the type always wins.
function v4TypeTabs() {
    var bizType = (window.__currentShopRow && window.__currentShopRow.business_type) ||
                  (typeof SS_PLAN !== 'undefined' ? SS_PLAN.businessType : 'retail');
    var hide = (bizType === 'retail') ? [18, 21] : (bizType === 'cafe' ? [21] : []);
    hide.forEach(function(n) {
        var el = document.getElementById('stab' + n);
        if (el) el.style.display = 'none';
    });
}
  
// ── TAB SWITCH ──
function selectTab(i, el) {
  
  document.querySelectorAll('.tab-content').forEach(function(x){ x.style.display = 'none'; });
  var target = document.getElementById('tab' + i);
  if (target) target.style.display = 'block';
  document.querySelectorAll('.sidebar-tab').forEach(function(x){ x.classList.remove('active'); });
  if (el) el.classList.add('active');
  closeSidebar();
  if (V4_TAB_LOADERS[i]) { try { V4_TAB_LOADERS[i](); } catch(e) { console.warn('Tab loader ' + i + ':', e.message); } }
}

// ── SIDEBAR / DARK / LANGUAGE ──
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('show'); }
function closeSidebar(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); }

  // ── SHOP SWITCHER — visible when owner has 2+ shops ──
function v4InitSwitcher() {
  var sel = document.getElementById('shopSwitcher');
  if (!sel) return;
  var shops = window.__v4MyShops || [];
  if (shops.length < 2) { sel.style.display = 'none'; return; }
  var cur = getShopId();
  sel.innerHTML = shops.map(function(s){ return '<option value="' + s.shop_id + '"' + (s.shop_id === cur ? ' selected' : '') + '>' + (s.name || s.shop_id) + '</option>'; }).join('');
  sel.style.display = 'inline-block';
}async function v4SwitchShop(id) {
  if (!id || id === getShopId()) return;
  var s = (window.__v4MyShops || []).find(function(x){ return x.shop_id === id; });
  if (!await confirm('Switch to "' + (s ? s.name : id) + '"?\nThe page reloads with that shop.')) {
    document.getElementById('shopSwitcher').value = getShopId(); return;
  }
  localStorage.setItem('shopId', id);
  location.reload();
}
  function toggleDarkMode(){ document.body.classList.toggle('dark'); localStorage.setItem('darkMode', document.body.classList.contains('dark')?'1':'0'); }
// ═══ REGISTRATION SYSTEM (built-in — permanent) ═══
var regShopIdTouched = false, regShopIdAvailable = null, regCheckTimer = null, regStep = 1;

function ssShowRegisterForm() {
  document.getElementById('loginScreen').classList.remove('show');
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registerScreen').classList.add('show');
  document.getElementById('registerScreen').style.display = 'flex';
}
function ssBackToLogin() {
  document.getElementById('registerScreen').classList.remove('show');
  document.getElementById('registerScreen').style.display = 'none';
  document.getElementById('regSuccessScreen').classList.remove('show');
  document.getElementById('regSuccessScreen').style.display = 'none';
  document.getElementById('loginScreen').classList.add('show');
  document.getElementById('loginScreen').style.display = 'flex';
}
async function ssForgotPassword() {
  var email = await prompt('📧 Enter your email to receive a password reset link:');
  if (!email) return;
  try {
    var base = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: base + 'admin-clean.html' });
    if (error) throw error;
    alert('✅ Password reset link sent!\n\nCheck your email (and Spam folder).');
  } catch(e) { alert('❌ ' + e.message); }
}
function regGenerateShopId(name) { return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20); }

  
  


function regTogglePwd(id) {
  var el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
  var btn = el.parentElement.querySelector('button');
  if (btn) btn.textContent = el.type === 'password' ? '👁️' : '🙈';
}
function regCheckStrength() {
  var p = document.getElementById('regPass').value;
  var score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10 || (p.match(/[A-Z]/) && p.match(/[0-9]/))) score++;
  if (p.match(/[A-Z]/) && p.match(/[0-9]/) && p.match(/[^A-Za-z0-9]/)) score++;
  var colors = ['#ef4444', '#f59e0b', '#10b981'];
  var texts = ['Weak — add numbers', 'Good — add CAPS & symbols', 'Strong password! 💪'];
  for (var i = 1; i <= 3; i++) {
    document.getElementById('strBar' + i).style.background = (i <= score) ? colors[score - 1] : '#e2e8f0';
  }
  document.getElementById('strText').textContent = score > 0 ? texts[score - 1] : 'Use letters + numbers for stronger password';
  regCheckMatch();
}
function regCheckMatch() {
  var p1 = document.getElementById('regPass').value;
  var p2 = document.getElementById('regPass2').value;
  var el = document.getElementById('matchIndicator');
  if (!p2) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  if (p1 === p2) { el.innerHTML = '✅ Passwords match'; el.style.color = '#10b981'; }
  else { el.innerHTML = '❌ Passwords do not match'; el.style.color = '#ef4444'; }
}


async function registerAccount() {
  var email = document.getElementById('regEmail').value.trim();
  var pass = document.getElementById('regPass').value;
  var pass2 = document.getElementById('regPass2').value;

  if (!email) { alert('Please enter your email address.'); return; }
  if (!pass || pass.length < 6) { alert('Password must be at least 6 characters.'); return; }
  if (pass !== pass2) { alert('Passwords do not match!'); return; }

  var btn = document.querySelector('#registerScreen .btn-p');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Creating...'; }

  try {
    // Create AUTH USER only — NO shop yet (type picker comes after login)
    const { data, error } = await supabaseClient.auth.signUp({ email: email, password: pass });

    if (error) {
      if ((error.message || '').toLowerCase().indexOf('already') !== -1) {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Create My Account'; }
        alert('📧 This email already has a SmartShop account!\n\nUse the LOGIN screen instead.');
        ssBackToLogin();
        return;
      }
      throw error;
    }
    if (!data || !data.user) {
      // Some Supabase setups return no user but no error — treat as success
      // The auth state change will handle the rest
    }
    // Success → go back to login screen (they sign in, then get the type picker)
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Create My Account'; }
    alert('✅ Account created!\n\n📧 ' + email + '\n\nNow sign in with your email and password to set up your shop.');
    ssBackToLogin();
    document.getElementById('loginEmail').value = email;
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Create My Account'; }
    alert('❌ Registration failed: ' + e.message);
  }
}// ── LOGIN / LOGOUT ──
async function adminLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { alert('Enter email and password.'); return; }
  showScreen('loadingScreen');
  var bar = document.getElementById('loadingBar'), p = 0;
  var iv = setInterval(function(){ p = Math.min(90, p + Math.random()*10+3); bar.style.width = p+'%'; }, 150);
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email: email, password: pass });
    clearInterval(iv); bar.style.width = '100%';
    if (error) throw error;
    // onAuthStateChange opens the app
  } catch(e) { clearInterval(iv); showScreen('loginScreen'); alert('❌ ' + (e.message === 'Invalid login credentials' ? 'Incorrect email or password.' : e.message)); }
}
function adminLogout(){ supabaseClient.auth.signOut(); }

// ── SCREEN HELPER ──
function showScreen(id){
    ['loginScreen','loadingScreen','appPinScreen'].forEach(function(s){
        var el = document.getElementById(s);
        if (el) {
            el.classList.toggle('show', s === id);
            el.style.display = (s === id) ? 'flex' : 'none';
        }
    });
    if (id === null) {
        // Entering the app — hide ALL overlays, show mainApp
        ['loginScreen','loadingScreen','appPinScreen','ssTypePicker','ssShopPicker','ssTypeFullDialog','v4shUpgDialog'].forEach(function(s){
            var el = document.getElementById(s);
            if (el) { el.style.display = 'none'; el.classList.remove('show'); }
        });
        document.getElementById('mainApp').style.display = 'block';
    }
}
  
  // ═══ SHOP TYPE PICKER (checks existing types — 1 per type during trial) ═══
async function ssShowTypePicker(userEmail) {
    var loadingScreen = document.getElementById('loadingScreen');
    var loginScreen = document.getElementById('loginScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'none';

    var old = document.getElementById('ssTypePicker'); if (old) old.remove();

    // 🛡️ Check which types already exist (BY EMAIL — the reliable way)
    var createdTypes = {};
    try {
        const { data: existing } = await supabaseClient.from('shops')
            .select('business_type').eq('owner_email', userEmail).eq('active', true);
        (existing || []).forEach(function(s) {
            if (s.business_type) createdTypes[s.business_type] = true;
        });
    } catch(e) {
        console.warn('Type check failed:', e.message);
    }

    function typeBtn(type, icon, name, desc) {
        var already = !!createdTypes[type];
        return '<button ' + (already ? 'disabled ' : 'onclick="ssCreateTrialShop(\'' + type + '\',this)" ') +
            'style="background:' + (already ? '#fef2f2' : '#f8fafc') + ';border:2px solid ' + (already ? '#fecaca' : '#e2e8f0') + ';border-radius:14px;padding:14px 6px;cursor:' + (already ? 'not-allowed' : 'pointer') + ';text-align:center;' + (already ? 'opacity:.5;' : '') + '">' +
            '<span style="font-size:32px;display:block;margin-bottom:6px;">' + icon + '</span>' +
            '<b style="font-size:13px;color:#1e293b;display:block;">' + name + '</b>' +
            '<small style="font-size:10px;color:#64748b;display:block;margin-top:2px;">' + desc + '</small>' +
            '<span style="display:block;margin-top:8px;font-size:10px;font-weight:800;color:' + (already ? '#ef4444' : '#10b981') + ';">' + (already ? '⛔ Already created' : '✓ Create') + '</span>' +
            '</button>';
    }

    var m = document.createElement('div');
    m.id = 'ssTypePicker';
    m.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#0f172a,#1e3a8a);z-index:10005;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
    m.innerHTML = '<div style="background:#fff;border-radius:24px;padding:24px;width:100%;max-width:420px;text-align:center;color:#0f172a;">' +
        '<div style="font-size:48px;margin-bottom:6px;">🏪</div>' +
        '<h2 style="margin:0 0 6px;color:#1e3a8a;">Choose Your Shop</h2>' +
        '<p style="font-size:12px;color:#64748b;margin:0 0 16px;">This account owns several shops. Pick one to enter.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">' +
        typeBtn('retail', '🛒', 'Retail', 'Simple selling') +
        typeBtn('cafe', '☕', 'Cafe', 'Kitchen + tables') +
        typeBtn('hotel', '🏨', 'Hotel', 'Rooms + full service') +
        '</div>' +
        '<div style="background:#eff6ff;border-radius:10px;padding:10px;font-size:11px;color:#2563eb;">' +
        'You can create one of EACH type during trial.<br>Switch between them anytime.' +
        '</div>' +
        '<p style="font-size:11px;color:#94a3b8;margin:10px 0 0;">📧 ' + (userEmail || '') + '</p>' +
        '<button onclick="supabaseClient.auth.signOut()" style="margin-top:10px;background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;text-decoration:underline;">Logout</button>' +
        '</div>';
    document.body.appendChild(m);
}

async function ssCreateTrialShop(bizType, btnEl) {
    if (btnEl) { btnEl.disabled = true; btnEl.style.opacity = '.6'; }
    var typeIcon = { retail: '🛒', cafe: '☕', hotel: '🏨' }[bizType];
    var typeName = { retail: 'Retail', cafe: 'Cafe', hotel: 'Hotel' }[bizType];

    // Get email from AUTH SESSION (reliable)
    var email = '';
    try { const { data: { user } } = await supabaseClient.auth.getUser(); if (user) email = user.email; } catch(e) {}
    if (!email) {
        if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; }
        alert('❌ Could not verify your account. Please sign in again.');
        return;
    }

    // 🛡️ HARD CHECK: does this email already have a shop of this type?
    try {
        const { data: existing, error: checkErr } = await supabaseClient.from('shops')
            .select('shop_id, name').eq('owner_email', email).eq('business_type', bizType).eq('active', true);
        if (checkErr) throw new Error('Check failed: ' + checkErr.message);
        if (existing && existing.length > 0) {
            if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; }
            ssTrialTypeFull(bizType);
            return;
        }
    } catch(e) {
        console.warn('Type check error:', e.message);
        // If check fails, STILL block (better safe than duplicate)
        if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; }
        ssTrialTypeFull(bizType);
        return;
    }

    // Ask for shop name
    var shopName = await prompt(typeIcon + ' Name your ' + typeName + ' shop:');
    if (!shopName) { if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; } return; }
    shopName = shopName.trim();
    if (!shopName) { if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; } return; }

    var shopId = shopName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'shop' + Date.now().toString(36);

    // Check shop_id availability
    try {
        const { data: taken } = await supabaseClient.from('shops').select('shop_id').eq('shop_id', shopId).limit(1);
        if (taken && taken.length > 0) {
            shopId = shopId + Date.now().toString(36).substring(0, 4);   // auto-suffix
        }
    } catch(e) {}

    var trialDays = 30;
    try {
        const { data: gs } = await supabaseClient.from('global_settings').select('default_trial_days').eq('id', 'globalConfig').maybeSingle();
        if (gs && gs.default_trial_days > 0) trialDays = gs.default_trial_days;
    } catch(e) {}

    if (btnEl) btnEl.innerHTML = '⏳<br><small>Creating...</small>';

    try {
        await supabaseClient.from('shops').insert([{
            shop_id: shopId, name: shopName, owner_email: email,
            plan: 'trial', active: true, business_type: bizType,
            trial_expires: new Date(Date.now() + trialDays * 86400000).toISOString(),
            registered_at: new Date().toISOString()
        }]);
        await supabaseClient.from('settings').insert([{ shop_id: shopId, name: shopName, currency: 'Br ', shop_type: bizType === 'hotel' ? 'cafe' : bizType }]);
        try { await supabaseClient.auth.updateUser({ data: { shopId: shopId, shopName: shopName } }); } catch(e) {}
        localStorage.setItem('shopId', shopId);

        var m = document.getElementById('ssTypePicker'); if (m) m.remove();
        alert('✅ ' + shopName + ' created!\n\n🔑 Shop ID: ' + shopId + '\n📋 Type: ' + typeName);
        location.reload();   // ← reload → auth handler picks up the new shop → enters it
    } catch(e) {
        if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = '1'; btnEl.innerHTML = typeIcon; }
        alert('❌ ' + e.message);
    }
}

// Same-type limit → Contact Provider
function ssTrialTypeFull(bizType) {
    var typeName = { retail: 'Retail', cafe: 'Cafe', hotel: 'Hotel' }[bizType];
    var old = document.getElementById('ssTypeFullDialog'); if (old) old.remove();
    var m = document.createElement('div');
    m.id = 'ssTypeFullDialog';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10006;display:flex;align-items:center;justify-content:center;padding:16px;';
    m.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:380px;width:100%;padding:20px;color:#0f172a;text-align:center;">' +
        '<div style="font-size:40px;margin-bottom:8px">✨</div>' +
        '<h3 style="margin-bottom:8px;font-size:16px">Trial: 1 ' + typeName + ' Shop</h3>' +
        '<p style="font-size:13px;color:#64748b;margin-bottom:16px;line-height:1.5;">Trial allows 1 shop per type.<br><br>Want a 2nd ' + typeName + ' shop?<br>Your provider can set this up for you.</p>' +
        '<button class="btn btn-p" style="margin-bottom:8px;background:#f59e0b" onclick="document.getElementById(\'ssTypeFullDialog\').remove();ssContactProvider()">📞 Contact Provider</button>' +
        '<button class="btn" style="background:#fff;color:#64748b;border:1px solid #cbd5e1;" onclick="document.getElementById(\'ssTypeFullDialog\').remove()">✖ Close</button>' +
        '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
}


function ssShowShopPicker(shops) {
  // DON'T call showScreen(null) — it flashes mainApp for a split second
  var loginScreen = document.getElementById('loginScreen');
  var loadingScreen = document.getElementById('loadingScreen');
  var mainApp = document.getElementById('mainApp');
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (loginScreen) loginScreen.style.display = 'none';
  if (mainApp) mainApp.style.display = 'none';

  var old = document.getElementById('ssShopPicker'); if (old) old.remove();
  var m = document.createElement('div');
  m.id = 'ssShopPicker';
  m.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#0f172a,#1e3a8a);z-index:6000;display:flex;align-items:center;justify-content:center;padding:20px';
  var html = '<div class="box"><div style="font-size:34px">🏪</div><h1 style="color:#1e293b">Choose Your Shop</h1><p>This account owns several shops.</p>';
  shops.forEach(function(s){ html += '<button class="btn btn-o" style="margin-bottom:8px;text-align:left" onclick="ssPickShop(\'' + s.shop_id + '\')">' + (s.name || s.shop_id) + '<br><small style="color:#64748b">' + s.shop_id + ' · ' + (s.business_type || '') + '</small></button>'; });
  html += '<button class="btn btn-o" style="color:var(--bad);border-color:var(--bad)" onclick="supabaseClient.auth.signOut()">Logout</button></div>';
  m.innerHTML = html; document.body.appendChild(m);
}function ssPickShop(id){ localStorage.setItem('shopId', id); location.reload(); }

// ── APP PIN (sha256, same pattern as classic) ──
function verifyAppPin() {
  if (sha256(document.getElementById('appPinInput').value.trim()) === localStorage.getItem('appPinHash')) {
    document.getElementById('appPinScreen').classList.remove('show'); document.getElementById('appPinScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    init();
  } else { alert('❌ Incorrect App PIN.'); document.getElementById('appPinInput').value = ''; }
}
async function checkAppPinStatus() {
  var hash = localStorage.getItem('appPinHash');
  if (!hash) {
    var pin = await prompt('🔐 Create a 4-digit App PIN for this device:');
    if (pin && String(pin).length === 4) { localStorage.setItem('appPinHash', sha256(String(pin))); document.getElementById('mainApp').style.display = 'block'; init(); }
    else { alert('PIN must be exactly 4 digits.'); adminLogout(); }
  } else { showScreen('appPinScreen'); var i = document.getElementById('appPinInput'); i.value=''; i.focus(); }
}

// ── AUTH FLOW (simplified skeleton: license lockout ports with License tab step) ──
supabaseClient.auth.onAuthStateChange(async function(event, session) {
  try {
    var loadingScreen = document.getElementById('loadingScreen');
    var loginScreen = document.getElementById('loginScreen');
    var mainApp = document.getElementById('mainApp');
    var lockoutScreen = document.getElementById('lockoutScreen');
    var appPinScreen = document.getElementById('appPinScreen');

    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'none';
    if (lockoutScreen) lockoutScreen.style.display = 'none';
    if (appPinScreen) appPinScreen.style.display = 'none';

    if (event === 'PASSWORD_RECOVERY') {
        var rm = document.getElementById('newPasswordModal');
        if (rm) rm.classList.add('active');
        return;
    }

    if (session && session.user) {
        var user = session.user;
        var userEmail = user.email;

        // Fetch ALL my shops (ALWAYS — for picker, switcher, limits)
        var myShops = [];
        try {
            const { data: mine } = await supabaseClient.from('shops')
                .select('shop_id, name, plan, business_type, trial_expires')
                .eq('owner_email', userEmail).eq('active', true);
            myShops = mine || [];
        } catch(e) {}
        window.__v4MyShops = myShops;   // ← ALWAYS stored (for switcher + limits)

        // ━━━ Route 1: 0 shops → TYPE PICKER (new account)
        if (myShops.length === 0) {
            ssShowTypePicker(userEmail);
            return;
        }

        // ━━━ Route 2: figure out which shop to enter
        var storedShopId = localStorage.getItem('shopId') || '';
        var storedValid = storedShopId && myShops.some(function(s){ return s.shop_id === storedShopId; });

        var shopId;
        if (storedValid) {
            // Previous session's shop is valid → go straight in
            shopId = storedShopId;
        } else if (myShops.length === 1) {
            // Only 1 shop → go straight in
            shopId = myShops[0].shop_id;
            localStorage.setItem('shopId', shopId);
        } else {
            // 2+ shops + no valid stored shop → show picker
            ssShowShopPicker(myShops);
            return;
        }

        // ━━━ Route 3: Load the shop's FULL row (business_type is the KEY)
        var shopRow = null;
        try {
            const { data: row } = await supabaseClient.from('shops').select('*').eq('shop_id', shopId).maybeSingle();
            shopRow = row || null;
        } catch(e) {}
        window.__currentShopRow = shopRow;   // ← This drives ALL type-aware visibility

        // ━━━ Route 4: DB-FIRST LICENSE (if exists)
        try {
            const { data: lic } = await supabaseClient.from('licenses')
                .select('*').eq('shop_id', shopId)
                .order('created_at', { ascending: false }).limit(1).maybeSingle();
            if (lic && (!lic.status || lic.status === 'active') && lic.expiry_date && new Date(lic.expiry_date) > new Date()) {
                localStorage.setItem('smartshop_license', JSON.stringify({
                    plan: lic.plan || 'basic', startDate: lic.start_date || '',
                    expiryDate: lic.expiry_date || '', shopId: lic.shop_id || shopId,
                    shopName: lic.shop_name || '',
                    maxShops: Number(lic.max_shops) || 1,
                    maxCashiersPerShop: Number(lic.max_cashiers_per_shop) || 2,
                    maxProducts: Number(lic.max_products) || 999999
                }));
            }
        } catch(e) {}
        // ━━━ Route 4b: Master's global trial settings → device cache (Round 13 —
        // the countdown banner + type limits now obey the Master panel)
        try {
            const { data: gs } = await supabaseClient.from('global_settings')
                .select('default_trial_days, trial_warning_days, trial_shops_per_type')
                .eq('id', 'globalConfig').maybeSingle();
            if (gs) {
                if (gs.trial_warning_days > 0) localStorage.setItem('ss_trial_warning_days', String(gs.trial_warning_days));
                if (gs.trial_shops_per_type > 0) localStorage.setItem('ss_trial_shops_per_type', String(gs.trial_shops_per_type));
            }
        } catch(e) {}

        // ━━━ Route 5: For TRIAL shops — force SS_PLAN to match shop's business type
        if (shopRow && shopRow.plan === 'trial') {
            if (typeof SS_PLAN !== 'undefined') {
                SS_PLAN.businessType = shopRow.business_type || 'retail';
                SS_PLAN.name = 'Trial';
            }
        }

        // ━━━ Route 6: Enter the app
        showScreen(null);
        if (mainApp) mainApp.style.display = 'none';
        if (typeof checkAppPinStatus === 'function') {
            checkAppPinStatus();
        } else {
            if (mainApp) mainApp.style.display = 'block';
            if (typeof init === 'function') init();
        }

    } else {
        // Logged out → show login
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'none';
        if (lockoutScreen) lockoutScreen.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'flex';
        showScreen('loginScreen');
        var emailInput = document.getElementById('loginEmail');
        var passInput = document.getElementById('loginPass');
        if (emailInput) emailInput.value = '';
        if (passInput) passInput.value = '';
    }

  } catch(e) {
    console.warn('Auth handler:', e.message);
    try {
        var ls = document.getElementById('loginScreen');
        var lscr = document.getElementById('loadingScreen');
        if (lscr) lscr.style.display = 'none';
        if (ls) { ls.classList.add('show'); ls.style.display = 'flex'; }
    } catch(e2) {}
  }
});  
function v4ToggleCard(titleEl) {
  var body = titleEl.nextElementSibling;
  var arrow = titleEl.querySelector('.arrow');
  if (body) body.style.display = (body.style.display === 'none') ? 'block' : 'none';
  if (arrow) arrow.classList.toggle('open');
}
// ── INIT (one init chain — no window.onload fights, ever) ──
function init() {
    // 🛡️ HEADER LAW: exactly ONE header — runs FIRST, kills all twins
    var hh = document.querySelectorAll('#mainApp .header, body > .header');
    for (var hi = 1; hi < hh.length; hi++) hh[hi].remove();
    var ss = document.querySelectorAll('#mainApp .sidebar, body > .sidebar');
    for (var si = 1; si < ss.length; si++) ss[si].remove();
    var tc = document.querySelectorAll('#mainApp .container, body > .container:not(#tabContainer)');
    for (var ti = 1; ti < tc.length; ti++) tc[ti].remove();

    document.getElementById('verBadge').textContent = APP_VERSION.split('-')[0];
    document.getElementById('sideFoot').innerHTML = 'SmartShop Pro ' + APP_VERSION + '<br>Step 1/14 · Skeleton';
    document.getElementById('langSelect').value = appLang;
    changeLanguage(appLang);
    buildSidebar();

       // 🎯 SHOW DASHBOARD IMMEDIATELY (tab 0 = default landing)
    // Round 8: enter through selectTab() so the Dashboard loader runs on FIRST
    // entry — hotel Lens setup, live clock, and the 📤 share button live there.
    selectTab(0, document.getElementById('stab0'));

    // 🔀 Shop switcher — retry until auth data arrives
    var swTries = 0;
    var swInterval = setInterval(function() {
        swTries++;
        if (window.__v4MyShops && window.__v4MyShops.length >= 2) {
            clearInterval(swInterval);
            v4InitSwitcher();
            var shopTab = document.getElementById('shopSidebarTab');
            if (shopTab) shopTab.style.display = 'flex';
        } else if (swTries > 20) {
            clearInterval(swInterval);
        }
    }, 500);
  
    // 📊 Dashboard — load data after module ready
    var dashTries = 0;
    var dashInterval = setInterval(function() {
        dashTries++;
        if (typeof loadDashboardV4 === 'function') {
            clearInterval(dashInterval);
            loadDashboardV4('daily', null).catch(function(e){ console.warn('Dashboard:', e.message); });
        } else if (dashTries > 20) {
            clearInterval(dashInterval);
        }
    }, 500);

    v4LoadProducts();

    if (typeof ssLoadPlan === 'function') ssLoadPlan().then(function(){ applyPlanVisibility(); });
    else applyPlanVisibility();

    // 🎯 TYPE-AWARE TOOLS — hide tools not relevant to this shop's type
    if (typeof v4lgApplySidebar === 'function') v4lgApplySidebar();   // type law runs inside it (Round 12)

    if (localStorage.getItem('darkMode') === '1') document.body.classList.add('dark');
}</script>
</body>
</html>
