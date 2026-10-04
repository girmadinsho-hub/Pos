SESSION LOG
sw.js hardened (cache v405+), 4 zombie files deleted (chatfix, livecall, modernchat, rescue)
Offline test PASS: app shell loads offline; product reg/login need internet (normal)
Spine read (8 files): report done. Critical: C1 confirm=Promise auto-YES, C2 license cache maxShops:1, C3 offline sales skip fiscal receipts
Zombie scans: admin 13073ln/28dup, pos 6489/9dup (updateCart x2!), advanced 5dup, master 5dup
master.html fully read. FOUND: loadTierSettings() crash = Plan Manager stuck (confirmed!)
SQL DONE: added support_facebook/instagram/telegram/website columns to global_settings → contacts save PASS
NOW: Wave 1 = 7 function replacements in master.html (fix crash + await confirms) → bump sw.js +1 → test 5 items
NEXT: Wave 2 = delete dead code in master (~420 lines) → then ad

MASTER.HTML: CLEAN ✅ (~1270 lines, 0 zombies). Plan Manager healed, CEO Dashboard live (4 boxes),await-confirms fixed, 💣 deleteShopForever + eraseShopData added, deleteShopLicense restored,cleanupShopData rebuilt on eraseShopData. sw.js bumped through v408+
NEXT: read sheet.js + advanced.js + hotel.js → then admin.html full read (~14 chunks) →ONE report → build admin-clean.html tab-by-tab
ADMIN.HTML FULLY READ (13073 ln). All core files now read.
NEW CRITICALS: K1 savePosSettings x2→TOT tax rule DEAD; K2 getFilteredDetailedSales x2→Detailed filters DEAD; K3 addProduct/staff NO plan-limit check (verify+fix); K4 dupeditCreditModal id; K5 window.onload x6; K6 appLang hoisting
advanced.js ~50% dead in admin (staff/expense/daily-summary views overridden inline)
PLAN: R surgical fixes → B admin-clean.html tab-by-tab → C pos → D advanced de-zombie
HOTEL UNLOCKED: stale license cache was the lock → re-activation refreshed it →hotel plan features loaded (plan row exists — no SQL needed)
Fix A (exit door law: tabs 13/14 never locked) — [CONFIRM APPLIED / still to apply]
K7 v2 real test: renewal → reopen → auto-updated? [PENDING]
NEXT QUEUE: Phase R — K1 savePosSettings merge → K2 dead filter copy → K3 plan limits→ K4 dup modal. Then admin-clean build (role engine built into skeleton from day one)
ROOT CAUSE CONFIRMED BY CAPTAIN: license plan name must exist in the shop'sbusiness-type plan group. Wrong-group key = menus shrink. Correct = full.
Master RULE: always generate keys from the shop's own business-type group
Fix 1 (extend-in-place) RECOMMENDED — prevents extend from inventing 'Basic'
Fix 2 (plan-row guard) — SKIPPED by Captain decision (clean rebuild will own it)
K7 status: works when plan names match; manual activation = reliable fallback
QUEUE: Phase R → K1 savePosSettings merge (tax law) → K2 → K3 → K4
)
📅 PHASE R COMPLETE
K1: savePosSettings merged (dead copy deleted) → TOT/VAT law restored
Fix A: loadPosSettings added (was missing! settings never loaded back)
Fix B: unified 🧾 Tax & VAT card (one card, one saveTaxConfig), scattered fields removed
Earlier: K7v2 license refresh, extend-in-place (master), exit-door law (ssfeatures 13/14)
Hotel unlocked: correct-group key → full menus. Master rule: generate key from shop's own type group
REMAINING: K2 (getFilteredDetailedSales dead copy → filters dead), K3 (addProduct/staff noplan-limit check — verify then fix), K4 (dup editCreditModal id)
THEN: Phase B admin-clean.html (role engine in skeleton day one)
