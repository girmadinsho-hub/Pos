BizMaster POS
Multi-business Point of Sale for shops, cafés, hotels & restaurants —running on GitHub Pages + Supabase, no server to maintain.

🔗 Live app: https://girmadinsho-hub.github.io/Pos/

Features
💳 POS terminal (PWA — install on your home screen, works offline)
🏪 One account, many businesses
💬 Staff intercom — text, voice notes, photos, files + voice & video calls(works across POS, Kitchen, Hotel and Admin)
👥 Staff & cashier management
🍳 Kitchen display + waiter orders
🏨 Hotel front desk, housekeeping & security — room board, folio, check-in/out
📱 QR menu for customers' phones
📊 Reports, expenses, suppliers, loans
🌐 English · አማርኛ (Amharic) · Afaan Oromoo
Pages
File	Purpose
index.html	Sign in / create account
pos.html	POS terminal
admin-clean.html	Shop admin dashboard (current)
admin.html	Legacy admin — still opened from the POS admin button during migration
master.html	Master console (authorized accounts only)
staff.html	Staff management
kitchen.html	Kitchen display
hotel.html	Hotel desk — rooms, guests, staff intercom
menu.html, table-qr.html	Public QR menu
help.html	Help & support
Tech
Plain HTML/JS — no build step, no framework
Supabase (PostgreSQL) with Row Level Security on every business table
Supabase Realtime chat + WebRTC voice/video calls (smartcom.js)
Service worker (sw.js) for offline caching (PWA)
Security
config.js holds only the public Supabase key — safe by design
Data is protected by RLS policies, not by hiding code
master.html requires an authorized master account (master_users role check)
Maintainer notes
After every code change, bump CACHE_NAME in sw.js,or users keep the old cached version
Project docs: CODE_MAP.md, PROJECT_BIBLE.md
© BizMaster POS · Support: girmadinsho@gmail.com

