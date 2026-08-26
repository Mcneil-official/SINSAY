# SINSAY — Eco-Dive Tourism PWA

## Goal & Constraints
- **Target**: PWA (Expo web static export), not native iOS/Android
- **Styling**: NativeWind + Tailwind CSS available, but existing screens use `StyleSheet`; new components use NativeWind minimally
- **Routing**: Expo Router file-based with `(tabs)` (tourist) and `(operator-tabs)` groups
- **Design**: Mobile-first, max-width 480px container centered on desktop
- **PH mobile format**: `+63 9XXXXXXXXX`
- **Supabase Edge Functions**: Use direct `fetch` to Gemini REST API (no npm imports in Deno)

## Route Structure (file-based, Expo Router)

```
src/app/
├── index.tsx                        # Splash ("Explore" button → /next)
├── next.tsx … next5.tsx             # Onboarding (no nav bar)
├── signup.tsx                       # Auth (no nav bar)
├── loginpage.tsx                    # Auth (no nav bar) — redirects to /(tabs)
├── dive-sites.tsx                   # Stub dive sites list (loading/empty/error states)
├── establishments.tsx               # Stub establishments list (loading/empty/error states)
│
├── (tabs)/                          # Tourist app — role: tourist
│   ├── _layout.tsx                  # TouristGate + Tabs + BottomNav
│   ├── index.tsx                    # Home (carousel, dive sites, establishments cards)
│   ├── eco-dive-id/
│   │   ├── index.tsx                # ID card (incomplete) + profile progress bar
│   │   └── complete.tsx             # ID card (complete) + 4-step dive tracker
│   ├── dive-assistant/
│   │   ├── index.tsx                # AI landing page
│   │   ├── chat.tsx                 # Chat with Gemini (push)
│   │   └── planner.tsx              # Trip planner (push)
│   └── profile/
│       ├── index.tsx                # Profile hub
│       └── apply-operator.tsx       # Operator application form
│
├── tourist/dive-details/            # Stack routes from eco-dive-id (push)
│   ├── step1.tsx                    # Basic info + dive type
│   └── step2.tsx                    # Certification + uploads (certified path only)
│
├── (operator-tabs)/                 # Operator app — role: operator
│   ├── _layout.tsx                  # OperatorGate + Tabs + BottomNav
│   ├── index.tsx                    # Dashboard (stats, recent manifests)
│   ├── manifests.tsx                # Manifest list
│   ├── profile.tsx                  # Operator profile
│   └── buy-pass/
│       ├── index.tsx                # Pass selection
│       ├── payment.tsx              # QR payment (push)
│       └── upload.tsx               # Upload receipt (push)
│
├── establishment/create-manifest/   # Stack routes from dashboard (push)
│   ├── step1.tsx                    # Manifest form + diver list + submit
│   ├── add-diver.tsx                # Diver search/walk-in
│   └── confirmed.tsx                # Manifest submitted confirmation
│
└── _layout.tsx                      # Root: AuthProvider + max-width 480px shell + slide_from_right animation
```

## Completed Work

### Sprint 0 — Quick Fixes
- Fixed asset paths in legacy screens
- Migrated `navigation` prop → `useRouter()`
- Replaced 3 missing `id-detail-*.png` with View-based cards

### Sprint F1–F7 — Frontend
- Shared component library: `Button`, `TextInput`, `Card`, `StatusBadge`, `FileUpload`, `StatCard`, `ProgressBar`, `Dropdown`, `HeroCarousel`, `DiveSiteCard`, `EstablishmentCard`, `BottomNav`
- Both tab layouts with pill-shaped floating nav bar
- Tourist screens: home, dive ID (4-step flow), AI assistant (chat + planner), profile, apply-operator
- Operator screens: dashboard, manifests, create-manifest (3-step), buy pass (3-step), profile
- PWA setup: manifest, service worker, 480px container
- Deleted all 6 legacy files

### B8–B10 — Notifications & Activation Backend
- **B8**: `006_notifications.sql` — notifications table (5 types), RLS, realtime enabled
- **B9**: `007_activation_trigger.sql` — AFTER INSERT trigger on `manifest_divers` auto-activates Eco-Dive IDs and inserts notification
- **B10**: `008_active_status.sql` — adds `'active'` and `'expired'` to `eco_dive_ids` status check constraint

### B1–B7 — Supabase Backend
- **B1**: `@supabase/supabase-js`, `supabase.ts` client, `AuthContext`, `useAuth`, `supabase.ts` types (7 tables), `.env` setup
- **Migrations**:
  - `001_initial_schema.sql`: 6 tables (tourists, operator_applications, dive_pass_inventory, payment_transactions, dive_manifests, manifest_divers), auth signup trigger, updated_at trigger, public storage buckets, RLS on all tables
  - `002_eco_dive_ids.sql`: eco_dive_ids table + RLS
  - `003_manifest_rls.sql`: Operator search permissions on tourists + eco_dive_ids
  - `004_private_storage.sql`: Buckets → private, MIME allowlist, 5MB limit, storage RLS
  - `005_manifest_capacity_trigger.sql`: AFTER INSERT trigger enforcing `manifest_divers.count ≤ max_divers`
- **B2**: Tourist registration + eco-dive ID flow wired to DB
- **B3**: Operator onboarding with file uploads to `operator_uploads` bucket
- **B4**: Dive pass purchase with receipt upload + payment_transactions insert
- **B5**: Dive manifesto insert with batch divers + pass credit deduction
- **B6**: Edge Function `gemini-proxy` (Deno) — rate-limited, dive-topic-constrained, server-side API key
- **B7**: Dashboard fetches real manifests/divers/passes; manifests list queries DB; no dead code

### Refinement (R1–R8)
- **R1 — Shared BottomNav**: Extracted from both `_layout.tsx` files into `src/components/BottomNav.tsx`; both layouts pass `tabIcons`/`tabLabels` as props
- **R2 — Route alignment**: Flattened `/landing/*` to root (`next.tsx`, `signup.tsx`, `loginpage.tsx`); moved `dive-details/` → `tourist/dive-details/`; updated 17+ navigation references
- **R3 — Gemini Edge Function**: Created `supabase/functions/gemini-proxy/index.ts` (Deno); removed client-side `EXPO_PUBLIC_GEMINI_API_KEY` and `@google/generative-ai`; client now calls via `supabase.functions.invoke`
- **R4 — Private storage**: `004_private_storage.sql` migration; `src/lib/storage.ts` with `validateFile()` (MIME + max 5MB), `uploadFile()`, `getSignedUrl()`; updated apply-operator and receipt upload to store paths instead of public URLs
- **R5 — Capacity constraint**: `005_manifest_capacity_trigger.sql` with AFTER INSERT FOR EACH STATEMENT trigger
- **R6 — States audit**: Added loading/empty/error states to dive-sites, establishments, eco-dive-id, complete; add saveError feedback to step1/step2
- **R7 — Accessibility**: `accessibilityRole`, `accessibilityState`, `accessibilityLabel` on BottomNav tabs, Button, Dropdown trigger and options
- **R8 — Animations**: Root layout changed from `"none"` (web) / `"default"` → `"slide_from_right"` on all platforms

## Key Decisions
- Login redirects to `/(tabs)` (not `/`) to avoid splash loop
- Operator accounts: one account per establishment (no multi-staff for now)
- Active/Done on manifests derived from `dive_date` (not manually toggled)
- Pass credits: `operator_pass_ledger` view computes remaining from verified purchases minus consumed manifests (no client-side decrement)
- Nav bars use `flex: 1` distribution, navy active color, "Dive Assistant" label
- Edge Function uses direct `fetch` to Gemini REST API (no npm imports in Deno)
- Private buckets store file path in DB; signed URLs generated on read with `getSignedUrl()`
- Capacity constraint enforced DB-side via trigger (not just client validation)

## Next Steps / Backlog
- (All R1–R8 + Phase 1–5 profile work + Operator dashboard deep-dive compliance complete)
- Potential future work: signed URL display for stored receipts/documents, admin dashboard (out of scope), operator notifications, i18n for non-profile screens, avatar upload, multi-staff operator accounts

## Profile Page Edits (Phase 1–5)
- **Phase 1 — My Account edit**: `src/app/(tabs)/profile/edit-profile.tsx` — full_name, contact_number, email via auth.updateUser
- **Phase 2 — Dynamic Apply row**: `src/app/(tabs)/profile/index.tsx` — row reflects pending/rejected/no-application state; rejected users can re-apply
- **Phase 2 — Rejection resubmit**: `src/app/(tabs)/profile/apply-operator.tsx` — shows pending read-only view, allows fresh submission on rejection
- **Phase 3 — Realtime operator status**: `src/context/AuthContext.tsx` — `operator-app-changes` channel; auto-refreshes JWT on approval
- **Phase 4 — Help & FAQ**: `src/app/(tabs)/profile/help.tsx`, `faq.tsx` — static content screens
- **Phase 5 — i18n**: `src/lib/i18n.ts` — `t(key, locale)` with English + Filipino; `src/types/supabase.ts` — `language_preference` added to TouristRow; `019_language_preference.sql` — DB column; Language toggle on profile toggles `language_preference`; all profile screens use `t()`

## Relevant Files
- `src/app/(tabs)/_layout.tsx` — Tourist tab layout with BottomNav
- `src/app/(operator-tabs)/_layout.tsx` — Operator tab layout with BottomNav
- `src/components/BottomNav.tsx` — Shared pill-shaped bottom nav
- `src/lib/gemini.ts` — Client-side calls `supabase.functions.invoke("gemini-proxy")`, falls back to mock
- `supabase/functions/gemini-proxy/index.ts` — Deno Edge Function (rate-limited, topic-constrained)
- `src/lib/storage.ts` — File validation (MIME + size), upload, signed URL helpers
- `src/lib/supabase.ts` — Supabase client
- `src/context/AuthContext.tsx` — Auth state + profile + ecoId + operatorApplication + isOperator
- `supabase/migrations/001_initial_schema.sql` through `008_active_status.sql`
- `supabase/migrations/006_notifications.sql` — notifications table, RLS, realtime
- `supabase/migrations/007_activation_trigger.sql` — manifest insert → eco_dive_ids activation + notification
- `supabase/migrations/008_active_status.sql` — adds active/expired to eco_dive_ids status
- `supabase/migrations/018_tourists_insert_policy.sql` — lets users INSERT own tourists row (needed for P3 fallback)
- `supabase/migrations/019_language_preference.sql` — language_preference column on tourists
- `supabase/migrations/020_pass_ledger_dive_date.sql` — dive_date on dive_manifests, operator_pass_ledger view + RLS
- `supabase/migrations/021_manifest_fixes.sql` — captain_name on dive_manifests, tourist_id on manifest_divers, operator search RLS policy
- `supabase/migrations/022_buy_pass_tables.sql` — pass_pricing table, payment_config table, rejected status on payment_transactions
- `src/constants/colors.ts` — Color palette
- `src/components/index.ts` — Component barrel exports
