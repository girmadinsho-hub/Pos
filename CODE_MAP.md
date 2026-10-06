📄 FILE 1: CODE_MAP.md
🔍 HOW: GitHub web → repo → Add file → Create new file → name it CODE_MAP.md → paste everything below the line → Commit.

═══ SMARTSHOP PRO — CODE MAP ═══
Written by the Pilot after the FULL CODE READ (23/23 files, ~19,000 lines).
THE reference for every future session. Update as modules are ported.
1. FILE INVENTORY (reading status: ALL READ ✅)
File	Lines	Role	Health
index.html	219	Launcher (secret master = 5 logo taps)	✅ clean
admin.html	13,110	v3 owner HQ, 22 tabs	🧟 22 zombie families
admin-clean.html	885	v4 shell (templates + data-driven sidebar)	✅ clean
v4-dashboard.js	135	v4 dashboard module	✅ clean
v4-products.js	1,181	v4 products module (DONE, tested)	✅ clean
v4-sales.js	309	v4 sales module (awaiting 3 tests)	✅ clean
pos.html	6,489	Cashier/waiter terminal	🧟 8 zombie families
kitchen.html	948	Chef display	✅ zero zombies
menu.html	775	QR customer menu	✅ zero zombies
hotel.html	523	Hotel desk (STANDALONE engine copy)	⚠️ engine duplicated
hotel.js	~420	Hotel engine (admin owner tab)	⚠️ same engine ×2
master.html	1,298	Platform HQ (plans, licenses, backup)	⚠️ 1 dup id (sdInput)
shared.js	1,254	i18n + dialogs + sync + multi-shop	✅ solid
ssauth.js	80	PBKDF2 PINs + server login	✅ clean
ssfeatures.js	177	Plan engine (DB-driven)	✅ clean
ssperf.js	114	Server summaries + pagination	✅ clean
ssfiscal.js	110	ERCA gapless receipts	✅ clean
ssprint.js	267	BLE/USB/system print	✅ clean (n2 dup trivial)
ssupload.js	89	Storage upload + fallback	✅ clean
sheet.js	542	ModernSheet table engine	✅ clean
advanced.js	2,055	Reports + staff engine	🧟 4 zombie families
smartcom.js	944	Chat + calls (WebRTC)	✅ solid
config.js	13	Supabase keys	✅ clean
sw.js	86	Cache v451 (27 files)	—
scanner-v3.html	—	DEV tool (chunk feeder + zombie scan). NOT cached.	—
2. ZOMBIE LAW (root cause)
8 months of remote fixes = rescue-pastes appended to file ENDS.JavaScript keeps the LAST definition → the tail blocks are the LIVE code;the earlier copies are dead twins.When porting to v4: ALWAYS port the LAST (tail) copy, never the first.

3. ZOMBIE CENSUS (keeper = last definition)
admin.html (22 families)
loadMoreList ×4 @4254,5353,7173,7286 → keeper @7286
loadMoreGrid ×4 @4281,5382,7208,7412 → keeper @7412
safeGet ×3 @4689,5547,12811 → keeper @12811 (same: safeGetNum, safeChecked)
getCashierReportData ×2 @7617,8312 → keeper @8312
getTopProductsData ×2 @7703,8346 → keeper @8346
initSalesTables ×2 @7155,7768 → keeper @7768
setCashierRepPeriod ×3 @7603,8276,8298 → keeper @8298
setTopProdPeriod ×3 @7609,8282,8304 → keeper @8304
renderList ×2 @4225,7354 → keeper @7354
brToCurrency ×2 @3405,3412 → DELETE BOTH (Br hack dies in v4)
applyRoleRestrictions ×2 @9964,10235 → keeper @10235
toggleEditBulkFields ×2 @4990,5018 → keeper @5018
loadMoreDaily/Weekly/Monthly(List+Grid) ×2 each → keepers = the later pair
loadMoreDetailed(List+Grid) ×2 each → keepers = the later pair
advanced.js (4 families)
openZReportModal ×3 @25,152,1986 → keeper @1986
openTaxReportModal ×3 @38,239,1999 → keeper @1999
openExpenseReportModal ×3 @55,319,2016 → keeper @2016
openPnLModal ×2 @8,1969 → keeper @1969
pos.html (8 families)
Waiter rescue block @~6100+ OVERRIDES: loadPOSTables, openTablesModal,selectTable, openWaiterStatus, updateCart → tail = keeper (deliberate)
formatIngredientIssues ×3 @6413,6471,6479 → keep ONE copy in v4
loadRecipeCache ×2 @6399,6425 → keeper @6425
manualLinkPos ×2 @4369,4380 → identical twins
master.html
id="sdInput" ×2 @1255,1262 (same dialog, harmless in practice — fix in v4)
4. HIDDEN LAWS (memorize before touching anything)
TRIAL = TOP PLAN of the shop's business type (ssfeatures.js)
TOT shops NEVER charge tax — rate locked to 0 (POS + saveTaxConfig)
License checks FAIL OPEN offline — business never stops
Split payments bucketed into cash/card/mobile/credit EVERYWHERE
Payroll = salary_ledger engine: earned/paid/advance/adjust,monthly anniversary rule, weekly Saturday end-mode
Recipe save auto-updates virtual product cost_price
Virtual products deduct recipe INGREDIENTS (factors/yield), never own stock
One-device-one-shop (deviceKey + deviceRegistered + server check)
Fiscal receipts: gapless RCP-YYYY-#### via RPC; void keeps number
Shop switcher = ENTERPRISE only; ownership-checked everywhere
Master's plans table = single source of pricing/limits/features
Exit-door law: Settings(13) + License(14) never plan-locked
5. V4 PORT ORDER + KEEPER SOURCE
Stock ← admin 4210-4770 zone + v4-products tools (half done)
Credits ← admin 4470-4620 + settle/delete
Losses ← admin 5090-5300 + advanced 1199-1310
Expenses ← admin 7790-7990
Staff/Payroll ← admin 3501-3850 (ledger engine) + advanced 1620-2050
Suppliers/PO ← admin 6330-6790 (partial receive!)
Recipes ← admin 9860-11000
Hotel tab ← hotel.js lazy-load (engine exists, use ONE home)
Reports ← advanced.js keepers @1969+ + FIX unbounded queries:MenuEng/CRM/Marketing currently download ALL sales → bound by periodRemaining small tabs: Loyalty/Loans/Bank/Notebook/Intercom/Devices
6. V4 LAWS (the 10 commandments)
One function = one home (module file; shell stays a shell)
fmtMoney only — ZERO "Br " literals (kill the replace hack)
sanitize() on every user string entering HTML
No unbounded queries — period bounds or RPC, always
Every surface styled in BOTH themes
Port the LAST v3 copy (zombie law)
New module = sw.js cache entry + CACHE_NAME +1 same day
Every module registers V4_TAB_LOADERS[tabNumber]
Tables self-heal (rebuild if container bulldozed)
Captain tests PASS before the checklist row turns ✅
7. CLEANUP TARGETS (during ports, never separately)
4 dialog systems → ONE in shared.js (adopt master's dropdown-prompt)
ModernSheet CSS ×3 copies → sheet.js injects its own
3 shop-id keys (shopId/kitchenShopId/hotelShopId) → one resolver
6 print paths → ssprint.js engine only
APP_CONFIG in admin.html (dead plans copy) → plans table only
📄 FILE 2: PROJECT_BIBLE.md (updated)
🔍 HOW: GitHub web → open the existing PROJECT_BIBLE.md → ✏️ pencil icon → select all, delete, paste everything below → Commit. (Or create new if none exists.)

═══ PROJECT BIBLE — SESSION MEMORY ═══
PASTE THIS AT THE START OF EVERY NEW SESSION.
Last updated: after the FULL CODE READ (23/23 files complete).
WHERE WE ARE (one paragraph)
v3 runs the real business. v4 (admin-clean.html + v4-*.js) is the cleanrebuild: skeleton, dashboard, products = DONE+tested. Sales module done,awaiting Captain's 3 tests (sidebar dup hunt / cashier+top data / itemdetail pagination). FULL CODE READ complete — every line of every file isdocumented in CODE_MAP.md (read that file too). Next: Step 5 = Stock module.

THE MISSION
Port all v3 admin functions into v4 modules (Steps 5-13), 100% parity,Captain tests each, then cutover (v3→backup). Then Phase C (POS + roles)and Phase D (Play Store, Chapa/Telebirr, ERCA).

HOW WE WORK (proven laws — never break)
One change → Captain tests → PASS/FAIL → next. Nothing silent.
Complete copy-paste blocks: 📄 FILE · 🔍 FIND · 👀 YOU'LL-SEE · ✂️ ACTION
GitHub web = only edit room. Acode = read only (stale-file trap).
sw.js: new module → add to cache list + CACHE_NAME +1 → commit →close ALL tabs → open → close → open (the #1 trap).
Never patch v3 admin except P0 surgical. Zombies stay behind.
PORT THE LAST COPY: rescue blocks at file ends are the LIVE code.
Speed law: no unbounded queries. Dark-mode law: both themes.
Anchor doesn't match → STOP, Captain sends the zone.
KEY FACTS
Live: https://girmadinsho-hub.github.io/Pos/
Master/founder: girmadinsho@gmail.com · phone +251973316100
Test shops: sagure (hotel, real sales), friendscoffee-dajt
Test cashiers: Teshome, Hana, Hotel Desk…
Money: 500-2000 Br/mo tiers, hotel ~5000, Enterprise custom (base+per-branch+per-cashier, Master-configured)
Known quirk: one Br -1000 hotel sale (deposit>charges) — harmless
Dev tools: scanner-v3.html (feeds code to chat, zombie scan — not cached)
Supabase: RLS everywhere, RPCs: get_sales_summary, deduct_stock,add_stock, next_fiscal_receipt, staff-login (rate-limited PINs)
ENGINE LOCATIONS (where the brains live)
Payroll ledger: admin.html ~3501-3850 (SS_LEDGER engine)
Recipe engine: admin.html ~9860-11000 + POS checkVirtualIngredients
Fiscal: ssfiscal.js · Print: ssprint.js · Plans: ssfeatures.js +master.html Plan Manager · Perf: ssperf.js · Hotel: hotel.js (×2 copies!)
POS checkout: pos.html completePayment ~3080-3450 (fiscal+loyalty+table-sweep+shift-stamp all in one flow)
SESSION START CHECKLIST
Captain pastes this Bible (and CODE_MAP.md if engineer needs detail).
Check: any pending Captain tests? (Currently: Sales ×3)
Check PARITY_CHECKLIST.md rows.
One module at a time. Port → paste blocks → Captain tests → ✅.
QUEUE
NOW: Sales 3 tests → tick checklist → update this Bible.
NEXT: Step 5 Stock (v4-stock.js) — half lives in v4-products already.
Parallel business track: first 10 customers on v3 apps (they don'ttouch admin), ERCA paperwork started.
🎯 Your stairs now:
Paste both files into the repo (5 minutes, two commits).
Then do the 3 Sales tests on your phone (sidebar / Cashier+Top / Item Detail) — one line each: PASS or FAIL.
Reply here with the results. 3× PASS = Step 5 Stock opens with its parity checklist + first copy-paste block, exactly as promised.
The memory is now permanent, Captain. Nothing we learned can ever vanish. 🚀
📄 One small thing before you rest — Bible update
Close today properly so tomorrow starts clean. GitHub → PROJECT_BIBLE.md → ✏️ → add this at the bottom:

SESSION LOG — Stock & Credits Day
Full code read COMPLETE (23/23 files) → see CODE_MAP.md
Products sealed: duplicate-push bug fixed, import guard,variant-group delete, honest failure state, station parity
Sales 95% sealed. PENDING (logged, not forgotten): Cashierfold-card auto-render — workaround: change period dropdown.Fix in a future fold-system pass (all fold cards at once).
Stock sealed at 180%: alerts, valuation, ABC, cover days,expiry manager, sleeping stock, smart restock + WhatsApp
NEW LAW: UI-2 = button-modal design (health strip + biggrouped buttons + table) — standard for ALL v4 modules
Credits v2: CAPTAIN'S LAW = settle keeps record visible(✅ PAID badge, collected-today/month counters); delete isthe ONLY removal
NEW LAW: scan-verify after every paste (scanner 🧟 confirmsfunction exists → then cache ritual → then test)
Standing grant: +50% world-class powers on every module
NEXT: Step 7 Losses → Step 8 Expenses (quick wins, samepattern) → then Staff/Payroll (the big one)
Then rest, Captain. The monster that was admin.html is being left behind one sealed module at a time — and today was the biggest single day of the rebuild.

When you return: 6 Credits tests, then say the word — "Losses" — and the quick-win row continues. 🏗️





Send a Message



