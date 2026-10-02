SESSION LOG
sw.js hardened (cache v405+), 4 zombie files deleted (chatfix, livecall, modernchat, rescue)
Offline test PASS: app shell loads offline; product reg/login need internet (normal)
Spine read (8 files): report done. Critical: C1 confirm=Promise auto-YES, C2 license cache maxShops:1, C3 offline sales skip fiscal receipts
Zombie scans: admin 13073ln/28dup, pos 6489/9dup (updateCart x2!), advanced 5dup, master 5dup
master.html fully read. FOUND: loadTierSettings() crash = Plan Manager stuck (confirmed!)
SQL DONE: added support_facebook/instagram/telegram/website columns to global_settings → contacts save PASS
NOW: Wave 1 = 7 function replacements in master.html (fix crash + await confirms) → bump sw.js +1 → test 5 items
NEXT: Wave 2 = delete dead code in master (~420 lines) → then ad
