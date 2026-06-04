# Taxonomy & Classification Vocabulary

The controlled vocabulary for how businesses are classified. This is the **single
source of truth** for category, subcategory, and classification tags. Both the
human curator and any Claude/enrichment pass MUST use the values here verbatim —
do not invent new ones without adding them to this doc first.

Why this exists: `subcategory` is free text in the schema, and without a
controlled list the gold-standard pass drifts (e.g. "Auto Parts & Accessories"
vs "Auto Parts & Supplies", "Public elementary school" vs "Public Elementary
School"). That drift makes clean grouping and filtering impossible.

Related: [`prisma/schema.prisma`](../prisma/schema.prisma) (the fields),
[`lib/category-groups.ts`](../lib/category-groups.ts) (the group layer). The
canonical data-model + quality bar narrative lives in `DATA.md` (maintainer's
machine, gitignored); keep this file in sync with it.

---

## Master category list (CLOSED)

These 22 categories are the **complete, closed set**. A location MUST be assigned
exactly one. **Never invent a category.** `apply-enrichment.ts` enforces this — an
unrecognized `categoryName` fails to apply (`UNKNOWN CATEGORY`), so an invented
category silently drops the record. Use the name **verbatim** (it is slugified to
match): counts are current as of 2026-06-03.

`Restaurant & Food` · `Retail & Shopping` · `Beauty & Personal Care` ·
`Health & Medical` · `Pets & Animals` · `Automotive` · `Home & Trades` ·
`Professional Services` · `Financial` · `Real Estate` · `Fitness & Recreation` ·
`Childcare & Education` · `Arts & Entertainment` · `Agriculture` ·
`Manufacturing` · `Other` · `Government & Civic` · `Public Safety` · `Schools` ·
`Places of Worship` · `Community & Nonprofit` · `Wedding & Event Venues`

Adding a category is a deliberate schema/seed act by the maintainer — it is NOT
something an enrichment pass does. If a location doesn't fit any category, see the
flag protocol below.

## Browse categories (the 9 a visitor actually picks)

The 22 above are the **schema/type tier** (`Business.category`, closed + enforced
by `apply-enrichment.ts`). On top of them sits a **presentation layer of 9
consumer categories** — the browse top level, organized by intent — defined in
[`lib/category-groups.ts`](../lib/category-groups.ts). These are what a
resident/visitor picks; the 22 fold underneath. Names mirror the "Just visiting?"
hero cards (`VisitorBand`) so the hero and the browse reinforce instead of compete.

| Browse category | DB categories it contains |
|---|---|
| **Eat & Drink** | Restaurant & Food |
| **Shop** | Retail & Shopping |
| **Outdoors & Recreation** | Fitness & Recreation |
| **Arts, History & Culture** | Arts & Entertainment, Wedding & Event Venues |
| **Home, Auto & Services** | Automotive, Home & Trades |
| **Professional & Financial** | Financial, Professional Services, Real Estate |
| **Health & Beauty** | Health & Medical, Beauty & Personal Care |
| **Pets, Kids & Farm** | Pets & Animals, Childcare & Education, Agriculture |
| **Industry & Employers** | Manufacturing |
| **Community & Government** | Government & Civic, Schools, Public Safety, Community & Nonprofit, Places of Worship |

`Other` (storage / lodging / laundromat) sweeps into "Everything Else" until those
get a home (open decision below). This grouping is a one-file edit in
`category-groups.ts` — **no DB migration, no slug/URL change, fully reversible.**

## Fit-or-flag protocol

The category list is closed; the subcategory lists below are **closed but
extendable by the maintainer**. The pass does not get to expand them silently.

1. **Category** — assign one from the master list. If nothing fits, assign the
   closest (often `Other`) AND set `reviewFlag` (see below). Never invent.
2. **Subcategory** — assign one from that category's list, verbatim. If nothing
   fits, do **not** invent a value to "make it work." Instead:
   - set `subcategory` to the closest existing value, and
   - set `reviewFlag` to `subcategory: <your proposed value> — <why>`.
3. **`reviewFlag` is the control valve.** Any record with `reviewFlag` set is
   pinned to `STANDARD` (never auto-promoted to `GOLD`) and listed under "needs
   attention" by the apply script. The maintainer reviews flagged proposals and
   either adds the value to this doc (making it canonical) or reclassifies. This
   is how we keep control while still surfacing gaps the closed list misses.
4. When in doubt between two subcategories, pick one and add a `reviewFlag`
   noting the ambiguity rather than guessing silently.

---

## The four classification levels

| Level | Field | Cardinality | Example | Set by |
|---|---|---|---|---|
| **Group** | none (presentation) | derived | "Food & Dining" | `lib/category-groups.ts` |
| **Category** | `Business.category` (relation) | one | "Restaurant & Food" | curator |
| **Subcategory** | `Business.subcategory` (string) | **one** | "Cafe" | enrichment / curator |
| **Tags** | `Business.tags` (M:N) | **many** | "Southern", "BBQ", "family-owned" | enrichment / curator |

**The rule (decided 2026-06-03):**
- **Subcategory = the venue / business *type*.** Exactly one value, from the
  controlled list for that category. Answers "what kind of place is this?"
- **Tags = cross-cutting descriptors:** cuisine, attributes, amenities. Zero or
  more. Answers "what's it known for / what's true about it?"
- Never mash the two into subcategory. "Fast Food Seafood" → subcategory
  `Fast Food` + tag `Seafood`. "Southern/American" → subcategory `Restaurant`
  + tags `Southern`, `American`.

> **Pipeline status (2026-06-03):** `apply-enrichment.ts` now writes `tags`
> (a `tags: string[]` field, connect-or-create by name, replace semantics). Both
> axes are live: set `subcategory` to the **venue/primary type** (one, closed)
> and `tags` to cuisine + attributes (many). Tags are owned by enrichment — the
> record's full tag set replaces what's there, so always send the complete list.

**Formatting:** Title Case, ampersand not "and" (`Tire & Auto Repair`, not
`tire and auto repair`). No trailing qualifiers like "branch".

---

## Restaurant & Food

The motivating case. **Subcategory = venue type (one). Cuisine goes in tags.**

### Subcategory — venue type (pick one)
`Restaurant` · `Cafe` · `Bakery` · `Fast Food` · `Food Truck` ·
`Dessert & Ice Cream` · `Juice & Smoothie Bar`

Bar & grills fold into `Restaurant` (with a `Bar & Grill` tag) — a sit-down bar &
grill is a dinner option like any other restaurant. The homepage dinner picker
pulls only `Restaurant`.

Notes (v2, tightened 2026-06-04 — the splits that don't change a choice were dropped):
- `Restaurant` = the default sit-down venue. **Diner folds in here** — a diner is
  the same kind of place to a consumer; the character goes in a tag (`Southern`).
- `Fast Food` = counter/drive-thru/quick service. **Deli folds in here** (Subway
  is fast food) with a `Sandwiches` tag. Counter-service BBQ joints belong here too.
- `Cafe` = casual all-day food + coffee. **Coffee Shop / Pub & Bar fold into
  `Cafe` / `Bar & Grill`** respectively. Cuisine always goes in tags.
- Grocery stores, markets, and travel-stop convenience retail belong in
  **Retail & Shopping**, not here, even if they sell prepared food.

### Tags — cuisine (apply any that fit)
`American` · `Southern` · `BBQ` · `Italian` · `Mexican` · `Tex-Mex` · `Pizza` ·
`Seafood` · `Chinese` · `Japanese` · `Sushi` · `Thai` · `Burgers` · `Sandwiches` ·
`Breakfast` · `Wings` · `Steakhouse`

### Tags — attributes (cross-category, apply any that fit)
`family-owned` · `locally-owned` · `drive-thru` · `dine-in` · `takeout` ·
`delivery` · `outdoor-seating` · `dog-friendly` · `open-late` · `chain`

### Normalization of values already written (apply during cleanup)
| Found | → Subcategory | → Tags |
|---|---|---|
| `Cafe & Coffee` | `Cafe` | — |
| `Mexican` | `Restaurant` | `Mexican` |
| `Mexican Fast Food` | `Fast Food` | `Mexican` |
| `Fast Food Seafood` | `Fast Food` | `Seafood` |
| `Pizza` | `Restaurant` (or `Fast Food` if QSR) | `Pizza` |
| `Italian` | `Restaurant` | `Italian` |
| `Southern/American` | `Restaurant` | `Southern`, `American` |
| `Bar & Grill` | `Bar & Grill` | — |
| `Deli` / `Deli & Sandwiches` | `Fast Food` | `Sandwiches` |
| `Diner` / `Country Diner` | `Restaurant` | `Southern` (if applicable) |
| `Coffee Shop` / `Cafe & Coffee` | `Cafe` | — |
| `Nutrition & Smoothies` | `Juice & Smoothie Bar` | — |
| `Travel Stop & Southern BBQ` | move to **Retail & Shopping** → `Convenience & Travel Stop` | `BBQ` (food served) |

---

## Other categories — controlled subcategory lists

Normalized from the values the enrichment pass has written. Pick one per business.
Cuisine/specialty nuance and amenities go in tags, same rule as food.

**Automotive:** `Auto Repair` · `Tire & Auto Repair` · `Auto Repair & Towing` ·
`Auto Parts & Accessories` · `Car Wash` · `Body Shop` · `Dealership`
*(merge: "Auto Parts & Supplies" → `Auto Parts & Accessories`; "Tires & Brakes",
"Auto & Diesel Repair / Towing" → `Tire & Auto Repair` / `Auto Repair & Towing`)*

**Retail & Shopping:** `Dollar & Variety` · `Supercenter` · `Grocery` ·
`Convenience & Travel Stop` · `Hardware Store` · `Farm & Feed` · `Florist` ·
`Boutique` · `Antiques & Vintage` · `Home Decor` · `Smoke & Vape Shop` ·
`Liquidation & Discount` · `Jewelry`
*(merge: "Women's Boutique", "Women's Apparel & Gifts" → `Boutique` + tag
`women's`; "Grocery & Deli" → `Grocery`)*

**Financial:** `Bank` · `Credit Union` · `CPA & Accounting` · `Tax Preparation` ·
`Investment & Advisory` · `Insurance` *(merge: "Community Bank", "Community bank
branch" → `Bank` + tag `community-bank`; "Federal/Community Credit Union` →
`Credit Union`; "CPA / Accounting", "CPA / Tax Preparation" → `CPA & Accounting`)*

**Professional Services:** `Law Firm` · `Insurance Agency` · `Funeral Home` ·
`Web & IT Services` · `Marketing & Design` · `Photography` *(practice-area nuance → tags:
`criminal-defense`, `family-law`, `personal-injury`. "Funeral Home & Crematory"
→ `Funeral Home` + tag `crematory`. Keep funeral homes here, not in "Other".)*

**Health & Medical:** `Family Medicine` · `Urgent Care` · `Hospital` ·
`Dentistry` · `Pharmacy` · `Optometry` · `Specialty Clinic`
*(merge all pharmacy variants → `Pharmacy` + tags `independent`/`retail`;
"General & Cosmetic Dentistry" → `Dentistry`.)*

**Beauty & Personal Care:** `Hair Salon` · `Barber Shop` · `Nail Salon` ·
`Spa` · `Salon Suites` · `Dry Cleaning` *(merge: "Nail Salon & Tanning" →
`Nail Salon` + tag `tanning`.)*

**Home & Trades:** `Plumbing, Electrical & HVAC` · `HVAC & Refrigeration` ·
`Tree & Lawn Service` · `Concrete & Masonry` · `Construction` · `Roofing` ·
`Landscaping` · `Handyman` · `Propane & Gas` *(supply houses → tag `supply` or move to Retail if retail-facing.)*

**Fitness & Recreation:** `City Park` · `State Park` · `Greenway & Trail` ·
`Gym & Fitness Center` · `Recreation Center` · `Golf Course` · `Sports Complex` ·
`Studio` · `Show Grounds` *(merge: "City Park & Lake", "City Park & Greenway Trail" → `City Park`
+ tags `lake`/`greenway`; "Youth Sports/Soccer/Softball Complex" → `Sports
Complex` + sport tag; "Pilates" → `Studio` + tag `pilates`.)*

**Manufacturing:** `Automotive Components` · `Metal Fabrication & Machining` ·
`Plastics & Film` · `Packaging` · `Food Processing` · `Electronics` ·
`Printing` · `Distribution & Warehousing` · `Industrial Equipment` · `Consumer Goods`
*(specific product → tags. "Specialty
Food Production", "Food Processing" stay in Manufacturing, NOT Restaurant & Food.)*

**Pets & Animals:** `Veterinary` · `Pet Grooming` · `Boarding & Daycare` ·
`Pet Supplies`

**Real Estate:** `Residential Real Estate` · `Commercial Real Estate` ·
`Realty & Auction` *(merge: "Real Estate & Auction" → `Realty & Auction`.)*

**Agriculture:** `Farm & Ranch Supply` · `Livestock & Breeding` · `Crop & Produce` ·
`Winery & Vineyard`

**Childcare & Education:** `Childcare & Preschool` · `Tutoring & Enrichment` ·
`Early Intervention Services` *(merge: "Preschool & Daycare" → `Childcare &
Preschool`.)*

**Arts & Entertainment:** `Museum` · `Theatre` · `Gallery` · `Cinema` ·
`Live Music Venue`

**Wedding & Event Venues:** `Event Venue` *(v2: collapsed to one venue type;
`barn`, `outdoor`, `farm` are tags, not separate subcategories. This category
displays under the **Arts, History & Culture** browse category.)*

### Civic categories (Community & Government group)

**Government & Civic:** `City Hall` · `County Government Office` · `Court & Clerk` ·
`Post Office` · `Public Library` · `Public Works` · `Cemetery` *(the many specific
county offices — Register of Deeds, Trustee, Assessor, Election — → `County
Government Office` + a tag for the function, OR keep specific if you want office-
level pages. Decide before the pass finishes; currently 19 one-off values.)*

**Schools:** `Elementary School` · `Intermediate School` · `Middle School` ·
`High School` · `Middle & High School` · `District Administration` ·
`Career & Technical` *(Title Case, drop "Public" prefix — it's implied; add tag
`public`/`private`. Merge "Public middle/high school" + "Public middle and high
school" → `Middle & High School`.)*

**Public Safety:** `Fire Department` · `Police Department` · `Sheriff's Office` ·
`EMS` · `Animal Control` · `Detention Facility` *(merge: "Volunteer fire and
rescue", "Volunteer Fire Department", "Municipal Fire Department" → `Fire
Department` + tag `volunteer`/`municipal`.)*

**Community & Nonprofit:** `Chamber of Commerce` · `Senior Center` ·
`Social Services` · `Veterans Organization` · `Thrift & Donations`

**Places of Worship:** `Church` · `Other Place of Worship` *(denomination → tag.)*

### "Other" category — needs a home
Current "Other" holds `Self-Storage`, `Funeral Home`, `Hotel & Lodging`,
`Motel / Budget Hotel`, `Laundromat`. These aren't really "other":
- `Funeral Home` → **Professional Services** (above).
- `Self-Storage`, `Laundromat` → **Home & Trades** or a new `Services` category.
- `Hotel & Lodging`, `Motel` → a `Lodging & Travel` category (doesn't exist yet).

**Open decision:** add a `Lodging & Travel` and/or `Personal & Household Services`
category, or keep them swept into "Everything Else". This is a *category*-level
change (not subcategory) and a schema/seed touch — hold until the gold pass is done.

---

## Workflow

- Adding a value: edit this file first, then use it. PRs that introduce a new
  subcategory should update this doc in the same change.
- The enrichment pass should be handed this file (or its relevant section) so it
  emits canonical values, not invented ones.
- `scripts/normalize-taxonomy.ts` encodes the closed lists + drift map and was
  **applied to Neon on 2026-06-04** (229 updates, 0 flags, 7 `Other` rows held).
  It's idempotent (canonical values map to themselves), so it's safe to re-run
  after editing the map. DB snapshot before the run: `data/businesses-export-2026-06-04.csv`.
