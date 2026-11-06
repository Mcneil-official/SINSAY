# Compact Device Responsiveness & Layout Hardening (Down to 320px)

A comprehensive responsiveness plan to audit and optimize SINSAY across compact smartphones (320px–375px width, including iPhone SE, Galaxy A-series, and foldable cover screens) and standard mobile displays, ensuring zero horizontal clipping, adaptive card wrapping, and thumb-friendly touch targets.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during interactive clarification and form the foundation of this implementation:

- **Target Dimensions**: All compact viewports down to **320px width** (covering ultra-compact devices, foldables, and narrow browser windows).
- **Scope**: Comprehensive audit and responsive hardening across **all Tourist and Operator screens** (Home, Dashboard, Create Manifest, Buy Pass, Eco-Dive ID, and Onboarding).
- **Data Adaptation**: **Adaptive cards with flexible wrapping** and touch-friendly targets ($\ge 44\text{px}$) instead of forced horizontal scrolling or squished multi-column tables.

---

## 1. Overview & Core Concept

### What It Delivers
This enhancement hardens SINSAY's layout geometry and spatial calculations so that all interface components naturally flex from ultra-compact 320px screens up to wide desktop tablets without horizontal scrollbar leaks, cut-off text, or collision between header actions and logos.

### Target Personas & Real-World Context
- **Divers & Tourists on Boats/Docks**: Tourists registering on older or compact smartphones under direct sunlight; need large touch targets ($\ge 44\text{px}$) and clear, uncluttered text.
- **Dive Operators at Anilao Pier**: Operators managing daily dive manifests and dive pass purchases on handheld mobile devices on the go.

### Key Value
Seamless layout resilience and tap ergonomics regardless of screen size, preserving visual balance, accessibility standards, and regulatory compliance readability.

---

## 2. User Experience & Visual Design

### Compact Viewport Ergonomics (320px–375px)
- **Natural Thumb Zone & Aggregated Sticky Limits**: Maintain fixed navigation elements (Top Bar + Bottom Tab Nav) within the 15% sticky surface budget, ensuring 85%+ of vertical screen space remains open for scrollable cards.
- **Dynamic Content Padding**:
  - Devices $\ge 375\text{px}$: Standard $20\text{px}$ horizontal container padding.
  - Compact devices $< 360\text{px}$ (e.g. 320px): Adaptive $14\text{px}$–$16\text{px}$ padding to give card content an extra $8\text{px}$–$12\text{px}$ of breathing room.
- **Header & Action Bar Alignment**:
  - Scale Tourist Top Bar logo dynamically on compact screens (`max-w-[130px]` on $< 360\text{px}$) to prevent collision with Search, Notification, and Avatar action buttons.
- **Operator Dashboard KPI Card Wrapping**:
  - On standard screens: 3-column KPI card grid.
  - On $\le 360\text{px}$ screens: Adaptive wrap (2 columns on row 1, 1 full-width card on row 2, or adaptive text sizing) to eliminate cut-off metric labels like "TODAY'S DIVERS" and "REMAINING PASSES".
- **Bottom Navigation Tab Scaling**:
  - Provide adaptive horizontal tab padding on compact widths so that 4-tab tourist and operator bars never crowd or wrap unexpectedly.
- **Diver Card & Pass Purchase Presets**:
  - Add `flexWrap: "wrap"` and `rowGap: 6` to the 5 bulk preset chips in Buy Pass (`5`, `10`, `20`, `50`, `100`).
  - Ensure diver metadata and edit controls in the Manifest wizard comfortably wrap inside the card container.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Adaptive Cards vs. Horizontal Scroll Tables
- **Chosen Approach**: Adaptive wrapping cards with stacked field rows and clear label-value pairings.
- **Why**: Horizontal scroll tables on small touchscreens introduce confusing nested gestures (scrolling horizontally within a vertically scrolling page) and obscure important compliance fields.
- **Alternatives Considered**: Truncating text or using mini fixed-width tables (rejected: causes legibility loss).

### Decision 2: Centralized Responsive Flags in `LayoutContext`
- **Chosen Approach**: Extend `LayoutContext` with `isCompact: boolean` (`width <= 360px`) and `windowWidth: number`.
- **Why**: Prevents multiple disparate `useWindowDimensions()` listeners across screens, keeping layout switches synchronized on one deferred snapshot.

---

## 4. Technical Architecture & Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 LayoutContext (App Level)                   │
│   width < 360px ──> isCompact = true, paddingH = 14px       │
│   360px - 640px ──> isMobile = true, paddingH = 20px        │
│   640px - 1024px ──> isTablet = true, maxWidth = 720px      │
│   >= 1024px     ──> isDesktop = true, multi-col sidebar     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│       Tourist Screens         │ │     Operator Screens      │
│ • Adaptive TopBar Logo & Icons│ │ • KPI Stat Row Wrap/Scale │
│ • Hero Carousel 320px scaling │ │ • Buy Pass Chip Wrap      │
│ • BottomNav Pill Auto-Scale   │ │ • Diver List Stacked Meta │
│ • Eco-Dive ID Aspect Ratio    │ │ • Manifest Wizard Stepper │
└───────────────────────────────┘ └───────────────────────────┘
```

### Component Action Checklist

1. **`src/context/LayoutContext.tsx`**:
   - Add `isCompact` (`width <= 360`) and `windowWidth: number` to `LayoutState`.
2. **`src/components/ContentContainer.tsx`**:
   - Make default `paddingH` responsive: `isCompact ? 14 : 20`.
3. **`src/components/BottomNav.tsx`**:
   - Apply compact padding (`paddingHorizontal: 8` on $\le 360\text{px}$) and flexible tab margins to keep all 4 tabs comfortably spaced on 320px screens.
4. **`src/app/(tabs)/index.tsx` (Tourist Home)**:
   - Make top bar logo responsive (`maxWidth: 130` on compact screens) and action buttons spacing adaptive.
5. **`src/app/(operator-tabs)/index.tsx` (Operator Dashboard)**:
   - Ensure the 3 KPI stat cards adapt gracefully on $\le 360\text{px}$ viewports.
6. **`src/app/(operator-tabs)/buy-pass/index.tsx` (Buy Pass)**:
   - Ensure `presetsRow` wraps with `flexWrap: "wrap"` and `rowGap: 6`.
7. **`src/app/establishment/create-manifest/step1.tsx` (Create Manifest)**:
   - Ensure step progress indicators, vessel input rows, and diver cards never overflow 320px width.
8. **Verification**:
   - Run unit tests (`npm test`), linter (`lint_applet`), and compiler (`compile_applet`).
