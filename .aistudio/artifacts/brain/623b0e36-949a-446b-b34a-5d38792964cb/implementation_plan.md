# Restoration of Manifesto Underwater Header & Preservation of Accreditations

Restore the high-fidelity underwater diver header and translucent double wave curve transition for the Official Boat Dive Manifesto export, eliminating production 404 network errors through self-contained embedded SVG vector artwork while keeping all newly added PCSSD and DOT accreditation features intact.

## User Review & Critical Decisions

> [!IMPORTANT]
> All critical decisions have been confirmed through Phase 1 clarification:
> - **Zero-404 Asset Delivery**: Use self-contained, embedded SVG vector artwork representing the underwater scuba diver, sunbeams, rising bubbles, fish, and ocean gradient directly inside the component canvas. This guarantees 100% reliability with zero external network requests on Vercel or any hosting provider.
> - **Preserve All Accreditations**: Retain all PCSSD and DOT accreditation schema definitions (`051_operator_pcssd_dot_accreditations.sql`), operator application uploads, operator profile chips, and establishment directory badges.
> - **Wave Transition Aesthetics**: Render the wave boundary as translucent layered SVG double wave curves with soft gradient blending into the white snapshot card.

---

## 1. Overview & Core Concept

### What It Does
When operators generate and export the Official Boat Dive Manifesto snapshot (for Coast Guard / Bantay Dagat compliance), the exported card presents:
1. **Underwater Banner**: A rich oceanic gradient header (`#0044CC` to `#0B79F2`) with glowing top-right sunbeams, silhouetted scuba diver, rising bubble trails, and ambient fish.
2. **Brand & Title Hierarchy**: Embedded white SINSAY brand logo with its cyan accent bar, followed by the crisp, high-contrast title "Official Boat Dive Manifesto" in pure white typography.
3. **Frosted Double Wave Transition**: Layered organic SVG wave paths featuring soft translucency (`rgba(255,255,255,0.3)` and `rgba(255,255,255,0.7)`) leading smoothly into the white vessel & diver card.
4. **Vessel & Diver Snapshot**: 8-tile vessel grid and diver roster table with verified eco dive IDs and fee clearance indicators.

### Key Value
- **100% Production Reliability**: By moving from external PNG asset loading to embedded vector artwork, the snapshot card will never fail, timeout, or return 404 in production builds on Vercel.
- **Accreditation Continuity**: Dive shops maintain their PCSSD and DOT official compliance badges across the app without any regression.

---

## 2. User Experience & Visual Design

### Header Visual Hierarchy
```
┌────────────────────────────────────────────────────────┐
│  SINSAY [Logo]                  ☀ Sunbeams             │
│  ────────                       ° ◦ Bubbles            │
│  Official Boat Dive                  \                 │
│  Manifesto                     🏊 Scuba Diver          │
│                                                        │
│  ~ ~ ~ Frosted Outer Wave (rgba 255,255,255,0.3) ~ ~ ~ │
│  ~ ~ ~ Translucent Inner Wave (rgba 255,255,255,0.7) ~ │
├─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───┤
│                                                        │
│   [ White Vessel Details & Diver Manifest Card ]       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Aesthetic Specifications
- **Ocean Sky to Deep Water Gradient**: `#023E8A` at the top right sunbeam focal point flowing down to `#0077B6` and `#03045E` depth tones.
- **Sunbeam Shafts**: Multi-angled SVG polygon rays with radial fade opacities (`0.12` to `0.28`).
- **Scuba Diver Silhouette**: Accurate technical scuba diver vector path (tank, regulator hose, mask, fins, outstretched trim posture).
- **Bubbles**: Gradient-stroked translucent circular bubbles (`r=3` to `r=8`) rising toward the surface.
- **Wave Curves**: Dual cubic Bézier paths (`d="M0,..."`) providing a smooth double-crest marine motion that masks effortlessly over the white card boundary.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Embedded SVG Vector Artwork vs. External PNG Bundling
- **Chosen Approach**: Render the diver scene, sunbeams, bubbles, and waves via `react-native-svg` (`<Svg>`, `<Defs>`, `<LinearGradient>`, `<Path>`, `<Circle>`).
- **Why**: Bundling raster images in Expo web produces dynamic hash paths (e.g., `assets/assets/manifesto-hero-bg.[hash].png`) that can be blocked or 404'd by static rewrites, aggressive service workers, or CDN mismatches. Embedded SVG renders synchronously, has zero HTTP roundtrips, scales losslessly at any pixel density (1x, 2x, 3x export), and cannot 404.
- **Alternative Considered**: Relying on `/manifesto-hero-bg.png` from `/public`. While functional, static files can still be delayed or blocked by browser cache states.

### Decision 2: Preserving Accreditation Infrastructure
- **Chosen Approach**: Keep `051_operator_pcssd_dot_accreditations.sql`, updated `src/types/supabase.ts`, `EstablishmentCard.tsx`, `apply-operator.tsx`, and `profile.tsx`.
- **Why**: The user added these features intentionally; restoring the manifesto design must not overwrite or roll back these valuable accreditation assets.

---

## 4. Technical Architecture & Component Structure

### Architecture Flow
```
┌────────────────────────────────────────────────────────┐
│                   Manifests Screen                     │
│           (src/app/(operator-tabs)/manifests.tsx)      │
└──────────────────────────┬─────────────────────────────┘
                           │ triggers snapshot export
                           ▼
┌────────────────────────────────────────────────────────┐
│                 ManifestSnapshotCard                   │
│         (src/components/ManifestSnapshotCard.tsx)      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ManifestoUnderwaterHero (Embedded Vector Scene) │  │
│  │   • Sky-to-deep LinearGradient                   │  │
│  │   • Diver silhouette path                        │  │
│  │   • Sunbeam ray paths                            │  │
│  │   • Rising bubble elements                       │  │
│  │   • Soft double wave curves                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Manifest Details Card                           │  │
│  │   • 8-tile vessel grid                           │  │
│  │   • Diver roster with fees & waivers             │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────┘
                           │ html2canvas / snapshot
                           ▼
┌────────────────────────────────────────────────────────┐
│             High-Resolution PNG Download               │
└────────────────────────────────────────────────────────┘
```

### Implementation Checklist
1. **Build `ManifestoUnderwaterHero` SVG component**:
   - Embed linear gradients (`#0B79F2` -> `#023E8A`).
   - Draw sunbeam rays, diver silhouette, rising bubbles, and fish vectors.
   - Draw the double frosted wave curve paths at the bottom of the hero banner.
2. **Update `ManifestSnapshotCard.tsx`**:
   - Replace the external raster image `<Image source={require("../../assets/manifesto-hero-bg.png")} />` with the zero-network SVG hero component.
   - Position the brand logo and manifesto title cleanly over the vector banner without overlap.
3. **PWA & Cache Synchronization**:
   - Bump cache name in `public/sw.js` to `sinsay-v6` so production clients immediately receive the refreshed assets.
4. **Verification**:
   - Verify that all PCSSD and DOT accreditation components compile cleanly.
   - Run `npm run build` to confirm the production web bundle succeeds with zero errors.
