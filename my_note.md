My professional analysis — 3 strengths + 3 refinements
✅ What's RIGHT about this model:
Strength
Why it works
Free tier = adoption engine	Kiosk owners start free → see value → grow → upgrade. This is how WhatsApp won Africa — free first, then monetize
Standard/Premium split per type	Not everyone needs everything. A small shop doesn't need menu engineering. They pay less, get less. Fair
Hotel = one full tier	Hotels are complex businesses. Splitting into "budget hotel" vs "luxury hotel" plans adds confusion. One tier, full power. Correct
Enterprise = à la carte	Master prices each combination individually. Flexible for custom negotiations. Already has ent_base, ent_per_branch, ent_per_cashier in Plan Manager

🔧 My 3 refinements (professional recommendations):
Refinement 1: The Free tier needs a conversion trigger
text

FREE TIER EXPERIENCE:
  Owner uses it happily for weeks...
  
  Then one day they think: "How much profit did I make this month?"
  → Dashboard says: "✨ Upgrade to Standard to see your profit"
  
  Or: "I want to add product #16"
  → Alert: "✨ Standard plan: 200 products — upgrade now"
  
  Or: "I want to hire a second cashier"
  → Alert: "✨ Standard plan: 2 cashiers"
The free tier should WORK perfectly for what it allows — but the walls should be VISIBLE and the door to upgrade always open.

Refinement 2: Enterprise pricing = formula, not manual
Instead of Master manually pricing every combination:

text

ENTERPRISE PRICING FORMULA (Master sets 3 numbers):

  ent_base     = 500 Br  (starting fee for being "enterprise")
  ent_per_shop = varies by type:
    + retail shop  = +500 Br/month (or the Standard price × 0.5)
    + cafe shop    = +500 Br/month
    + hotel shop   = +2,000 Br/month
  
  Example: 1 hotel + 1 retail + 1 cafe
    = 500 (base) + 2000 (hotel) + 500 (retail) + 500 (cafe)
    = 3,500 Br/month
  
  Example: 3 retail shops
    = 500 (base) + 500 × 3
    = 2,000 Br/month
  
  Example: 2 hotels
    = 500 (base) + 2000 × 2
    = 4,500 Br/month
Why formula > manual:

Master sets 3 numbers once → all combinations auto-priced
No manual calculation per customer
Consistent pricing (no negotiation confusion)
Already partially built in Plan Manager (ent_base, ent_per_branch, ent_per_cashier)
Refinement 3: Trial = ONE shop, not three
text

CURRENT DESIGN (previous discussion):
  Trial → owner can have 1 retail + 1 cafe + 1 hotel (3 shops simultaneously)
  
PROBLEM:
  - A kiosk owner doesn't need to try a hotel
  - Managing 3 empty shops during trial = overwhelming
  - Slows conversion (they're "exploring" instead of "committing")

REFINED:
  Trial → owner picks ONE shop type → 30 days full features
  → After trial: "Want to try another type? Create your second shop now!"
  → Second shop gets its own mini-trial (14 days?)
  → Or: they activate a plan and add more shops immediately
Why one shop:

Simpler mental model for low-society users
Faster to value ("I set up my shop and I'm selling today")
Faster to conversion ("trial ending → I need to pick a plan")
The complete plan matrix (Master's Plan Manager)
text

┌──────────────────────────────────────────────────────────────────┐
│  MASTER'S PLAN TABLE (what he configures)                       │
├──────────┬──────────┬────────┬─────────┬──────────┬────────────┤
│ Plan     │ Type     │ Price  │ Products│ Cashiers │ Features   │
│ Name     │          │ /mo    │         │          │            │
├──────────┼──────────┼────────┼─────────┼──────────┼────────────┤
│ Free     │ retail   │ 0      │ 15      │ 1        │ basic POS  │
│ Standard │ retail   │ 500    │ 200     │ 2        │ + reports  │
│ Premium  │ retail   │ 1,000  │ 1000    │ 5        │ + all      │
├──────────┼──────────┼────────┼─────────┼──────────┼────────────┤
│ Free     │ cafe     │ 0      │ 15      │ 1        │ basic POS  │
│ Standard │ cafe     │ 500    │ 100     │ 2        │ + kitchen  │
│ Premium  │ cafe     │ 1,000  │ ∞       │ 5        │ + recipes  │
├──────────┼──────────┼────────┼─────────┼──────────┼────────────┤
│ Hotel    │ hotel    │ 2,000  │ ∞       │ ∞        │ EVERYTHING │
│ Suite    │ hotel    │ 5,000  │ ∞       │ ∞        │ + priority │
├──────────┼──────────┼────────┼─────────┼──────────┼────────────┤
│ Enterprise│ any     │ custom │ ∞       │ ∞        │ everything │
│          │          │        │         │          │ + multi    │
└──────────┴──────────┴────────┴─────────┴──────────┴────────────┘

ENTERPRISE CONFIG (separate section):
  ent_base       = 500 Br
  ent_retail_add = 500 Br per shop
  ent_cafe_add   = 500 Br per shop
  ent_hotel_add  = 2,000 Br per shop
The shop creation flow (owner's experience)
text

SETTINGS → MY SHOPS → ➕ CREATE NEW SHOP

  "What type?"
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ 🛒      │ │ ☕      │ │ 🏨      │
  │ Retail  │ │ Cafe   │ │ Hotel  │
  │ ✓ OK    │ │ ✓ OK   │ │ ✓ OK   │
  └─────────┘ └─────────┘ └─────────┘
  
  Trial: 1/1 used? → ⛔ "You already have a retail shop on trial.
                       Activate a plan to add more."
  
  Enterprise: ✓ unlimited
  
  Premium Plan (retail only): 
    ✓ Retail OK
    ⛔ Cafe → "Your plan covers retail only.
               Activate a cafe plan or Enterprise."
Revenue projection (why this model works)
text

MARKET SIZE (Ethiopia, rough):

  Kiosks / street vendors:    500,000+  → FREE (future: ads, micro-features)
  Small retail shops:          50,000   → 500 Br/mo = 25M Br/mo market
  Growing retail:              10,000   → 1,000 Br/mo = 10M Br/mo
  Small cafes:                 20,000   → 500 Br/mo = 10M Br/mo
  Restaurants:                  5,000   → 1,000 Br/mo = 5M Br/mo
  Hotels:                       2,000   → 2,000 Br/mo = 4M Br/mo
  Multi-shop owners:              500   → ~3,000 Br/mo = 1.5M Br/mo

  Realistic capture (10% in 3 years): ~5.5M Br/month
  = ~66M Br/year (~$1.2M USD)

This model serves EVERYONE from kiosk to five-star hotel,
with a clear upgrade path at every level.
🎯 Your decisions, Captain:
#
Question
My recommendation
1	Free tier exists? (15 products, forever free)	✓ Yes — this is the adoption engine
2	Standard/Premium split for retail + cafe?	✓ Yes — your vision confirmed
3	Hotel = one tier (full package)?	✓ Yes — don't split hotels
4	Enterprise = formula pricing (base + per_shop by type)?	✓ Yes — Master sets 4 numbers
5	Trial = 1 shop (not 3)?	✓ My refinement — simpler, faster conversion
6	Free tier shows upgrade prompts at limits?	✓ Yes — visible walls, open door
7	Plan Manager already handles this structure?	✓ Yes — just needs the Free plan rows added

Say "approved" (or adjust) and I deliver:

The Plan Manager seed rows (Free/Standard/Premium/Hotel/Enterprise)
The shop creation wizard (v4-shops.js)
The limit engine (reads from plans table live)
The trial system (1 shop, full features, 30 days)


Send a Message



