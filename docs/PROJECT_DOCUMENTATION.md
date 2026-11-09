# SINSAY — Project Documentation Overview

**Eco-Dive Tourism PWA** for Mabini, Anilao (Batangas, PH) — Expo web static export + Supabase backend.

---

## 1. Users / Actors

| Actor | Description | Access |
|---|---|---|
| **Tourist (Guest)** | Public visitor — browses dive sites, establishments, map | No login: `/`, onboarding, `/dive-sites`, `/establishments`, `/map`, `/dive-site/[id]`, `/establishment/[id]`, privacy/terms |
| **Tourist (Registered)** | Has account; owns Eco-Dive ID, favorites, AI assistant | Tourist tabs `/(tabs)` |
| **Dive Operator** | Tourist whose `operator_applications.status = 'approved'` — one account per establishment | Operator tabs `/(operator-tabs)` + can browse tourist view (`viewAsTourist`) |
| **Tourism Office (TO) Staff** | `to_staff` table (`staff` / `superadmin`); no app UI in this repo — verifies receipts, applications, manifests, manages pricing/sites via dashboard/SQL (out of scope) | DB-only: RLS grants, `audit_logs` |
| **AI (Gemini)** | Server-side via `gemini-proxy` Edge Function | Not a user |

Role determination: `isOperator = operatorApplication?.status === "approved"` in `AuthContext` — there is no separate admin role in app code.

---

## 2. Modules

### Frontend (Expo Router, `src/app/`)

| Module | Routes | Purpose |
|---|---|---|
| **Auth & Onboarding** | `/`, `/next`–`next5`, `/signup`, `/loginpage`, `/auth/callback`, `/auth/reset-password` | Splash → 6-screen onboarding → signup/login (email + Google); T&C consent |
| **Tourist Home** | `/(tabs)/index` | Hero carousel, dive-site & establishment cards, map entry |
| **Directories** | `/dive-sites`, `/establishment/[id]`, `/dive-site/[id]`, `/establishments` | Public listings with loading/empty/error states, search, favorites |
| **Map** | `/map` (+ `/(tabs)/map`) | Hand-built SVG map of Mabini dive sites (pan/zoom, pins, drawer) — no native maps lib |
| **Eco-Dive ID** | `/(tabs)/eco-dive-id`, `/tourist/dive-details/step1–2` | Digital dive passport: incomplete → complete (data + cert uploads) → active → expired; ID card front/back, QR/share |
| **Dive Assistant (AI)** | `/(tabs)/dive-assistant/` + `chat`, `planner` | Gemini chat + structured trip planner (hidden from tab bar) |
| **Tourist Profile** | `/(tabs)/profile/*` | Edit account, favorites, dive details, apply-as-operator, help/FAQ, language toggle (EN/FIL), sign out |
| **Operator Dashboard** | `/(operator-tabs)/index` | Stats (today's divers, remaining passes, weekly manifests), recent manifests, quick actions |
| **Manifests** | `/(operator-tabs)/manifests`, `/establishment/create-manifest/step1–confirmed` | Manifest wizard: boat/dive details → diver search + walk-ins → capacity-checked submit via RPC; Active/Done derived from `dive_date` |
| **Buy Pass** | `/(operator-tabs)/buy-pass/` → `payment` → `upload` | Pass selection (`pass_pricing`) → GCash QR payment → receipt upload → pending verification |
| **Operator Profile** | `/(operator-tabs)/profile` | Establishment info, ledger, staff roles |
| **Notifications** | `/notifications` | In-app inbox, realtime, deep links |
| **Legal** | `/privacy`, `/terms` | Static, i18n'd |

### Shared components (`src/components/`)

UI kit: `Button`, `TextInput`, `Card`, `ContentContainer`, `StatusBadge`, `StatCard`, `ProgressBar`, `StepProgress`, `Dropdown`, `FileUpload`, `EmptyState`/`ErrorState`, `BottomNav` (shared pill nav), `HeroCarousel`, `DiveSiteCard`, `EstablishmentCard`, `EcoDivePassportView` (the actual Eco-ID screen), `ResortProfileHero`, AI panels (`FloatingAssistant`, chat/planner panels), PWA prompt + `UnsupportedDeviceScreen` (desktop ≥1024px disabled).

### Lib (`src/lib/`)

`supabase`, `storage` (validate/upload/signed URL), `gemini` (edge-fn transport), `i18n` (EN/FIL), `diveDate`, `manifestDrafts`, `plannerSites`, `password`, `userFacingError`, `registerSW`, avatar helpers.

### Backend (Supabase)

- **DB**: 48 migrations — 20 tables, 2 views, triggers, RLS, realtime, pg_cron
- **Edge Function**: `gemini-proxy` (Deno) — rate-limited (chat 10/min, planner 5/min), topic-gated to diving, server-side API key
- **Storage buckets**: `tourist_uploads`, `operator_uploads` (private, MIME+5MB), `dive-site-photos`, `operator_media` (public)

---

## 3. Process Flows

### 3.1 Tourist registration → Eco-Dive ID

```
Splash → Onboarding → /signup (auth.users)
  → trigger handle_new_user() creates tourists row
  → /(tabs) Home
  → Eco-Dive ID: incomplete → step1 (basic info + dive type)
       ├ non-certified → upsert eco_dive_ids status='complete'
       └ certified → step2 (cert details + doc upload) → complete
  → passport view (ID card, QR, share)
```

### 3.2 Operator onboarding

```
Tourist → Profile → Apply as Operator (establishment details + permits/PCSS uploads)
  → operator_applications status='pending' (realtime)
  → TO staff verifies (out-of-band) → approved | rejected (+reason)
  → realtime operator-app-changes → JWT refresh → isOperator=true
  → gate redirects to /(operator-tabs); approved row upserts public establishments listing (trigger 047)
  (rejected → can re-submit; only one live application per tourist — partial unique index)
```

### 3.3 Dive pass purchase (Buy Credits)

```
Operator → Buy Pass → pick pass_pricing (One-Day ₱150 / Annual ₱2000), qty 1–100
  → payment screen (GCash QR, copy reference)
  → upload receipt → create_buy_pass_order() RPC [atomic: inventory + pending payment]
  → TO verifies payment (service-side) → status='verified'
  → operator_pass_ledger view credits balance (purchased_passes / annual_purchased)
  ⚠ remaining_passes is NEVER decremented — ledger view is source of truth
```

### 3.4 Dive manifest submission (core operational flow)

```
Operator → Create Manifest → step1: boat/vessel, dive_date, dive_mode, location, max_divers
  → add divers: search existing tourists (eco_id) or add walk-ins
  → client capacity check + DB trigger 005 (statement-level, ≤ max_divers)
  → create_manifest_with_divers() RPC (SECURITY DEFINER, atomic, advisory lock):
       • validates date ≥ today, boat fields required if Boat Dive
       • inserts manifest + divers
       • one-day balance check vs non-annual-covered divers (walk-ins consume)
       • annual holders: assign 1-year slot, overlap guard, cross-operator coverage
       • returns {manifest_id, remaining}
  → confirmed screen + 'manifest_submitted' notification to operator
  → TO verifies manifest (verified=true)          ← gate for everything below
       ├ trigger 044 → activate_manifest_divers() → eco IDs status='active'
       │                + 'eco_dive_activated' notification to each diver
       └ Active/Done in lists derived from dive_date (not manual toggle)
  → daily pg_cron (18:00 UTC) expire_eco_dive_ids():
       active → expired if not covered by verified future manifest or valid annual pass (silent)
```

### 3.5 AI assistant

```
Home/Profile → Dive Assistant → chat | planner
  → supabase.functions.invoke("gemini-proxy")
  → rate limit (per type:SHA-256 of JWT) → topic gate (dive/Mabini keywords)
  → Gemini REST (direct fetch) → reply / strict JSON itinerary
  → error → bubble + Retry (mock only if EXPO_PUBLIC_USE_MOCK_AI=1)
  → planner inputs also logged to dive_plan_requests / dive_plan_inputs (analytics)
```

### 3.6 Notifications (in-app, realtime)

| Type | Producer | Recipient |
|---|---|---|
| `manifest_submitted` | trigger on manifest INSERT | Operator |
| `eco_dive_activated` | trigger 044 on TO verify | Each diver on manifest |
| `announcement_published` | trigger on active announcement INSERT | All tourists (fan-out) |
| `operator_application_approved/rejected`, `pass_purchase_verified`, `dive_plan_ready` | CHECK-allowed; no trigger in repo (staff-side) | — |

Realtime channels in `AuthContext`: `eco-dive-changes`, `notification-inserts`, `operator-app-changes`.

---

## 4. Data Model (summary)

- **Core**: `tourists` (↔ auth.users) · `operator_applications` · `to_staff` · `establishments` (1:1 operator)
- **Passes/payments**: `pass_pricing` · `payment_config` (single-row) · `dive_pass_inventory` · `payment_transactions` (client SELECT-only after 048) · `annual_pass_holders` (exact 1-year, overlap-guarded)
- **Manifests**: `dive_manifests` (`verified` gate, `dive_date`, capacity) · `manifest_divers` (`is_walk_in`, `tourist_id`)
- **Eco-ID**: `eco_dive_ids` (1:1 tourist; `incomplete→complete→active→expired`)
- **Engagement**: `notifications` · `announcements` · `tourist_favorites` · `dive_sites` · `dive_plan_requests/inputs` · `audit_logs` (append-only)
- **Views**: `operator_pass_ledger` (purchased − consumed; annual slots consumable, never refunded) · `dive_profile_completion` (%)
- **Key RPCs**: `create_buy_pass_order`, `create_manifest_with_divers`, `get_operator_stats`, `save_operator_profile`

---

## 5. Key Rules & Decisions

- Pass credits: never client-decremented; ledger view only; walk-ins consume; expired annual slots don't free up
- Eco-ID activation requires TO verification of the manifest; expiry is a silent daily cron
- Capacity enforced DB-side (trigger), not just client validation
- Private buckets store paths in DB; signed URLs on read; 5 MB + MIME allowlist
- Login redirects to `/(tabs)` (splash-loop avoidance); gates prevent operator↔tourist flash
- Mobile-first 480px; desktop ≥1024px shows unsupported screen; PWA with service worker
- `darkMode: "class"` in Tailwind is load-bearing (css-interop constraint) — light-only app

---

## 6. Notable Gaps found during review

1. `tourist/dive-details/step1.tsx:217` pushes `/eco-dive-id/complete` — route doesn't exist at root (actual: `/(tabs)/eco-dive-id/complete`) → likely 404
2. `src/constants/ecoStatus.ts` is dead code (zero imports); `EcoDivePassportView` duplicates status strings
3. AGENTS.md's "4-step dive tracker" on `complete.tsx` is stale — `complete.tsx` is a re-export; `StepProgress` belongs to the manifest wizard
4. Columns used by code/RPCs but absent from migrations: `dive_manifests.boat_contact/crew_count/instructor_name`, `eco_dive_ids.updated_at`, `tourists.cert_upload_path/logbook_upload_path`
5. Loose RLS never tightened: `announcements` I/U/D and `notifications` INSERT are any-authenticated; `establishments` DELETE any-authenticated
6. After 048, client-side staff payment verification would fail — must go through service role (TO dashboard is elsewhere)
