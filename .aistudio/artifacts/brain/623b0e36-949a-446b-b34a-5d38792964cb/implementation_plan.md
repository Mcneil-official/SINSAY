# Horizontal Header Alignment: Back & SINSAY Logo

Align the Back navigation action and SINSAY brand logo horizontally along the top header row across the Onboarding flow (`OnboardingCard.tsx`) and the Authentication screens (`AuthLayout.tsx`) on desktop and tablet wide screens, matching the confirmed user preference.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following layout choices have been confirmed via clarifying answers:
> - **Horizontal Distribution**: Back button placed on the far left, and the SINSAY logo placed on the far right within the white panel (`justifyContent: "space-between"`).
> - **Screen Scope**: Desktop and tablet wide screens (`isWide = isTablet || isDesktop`). Mobile layouts remain untouched with their existing mobile headers.
> - **Unified Visual Consistency**: Both Onboarding (`next.tsx`–`next5.tsx`) and Auth (`loginpage.tsx` and `signup.tsx`) will share identical horizontal header geometry and vertical alignment.

---

## 1. Overview & Core Concept

- **What It Delivers**: Replaces vertically stacked Back links and logos with a streamlined horizontal top header row. The Back button is immediately accessible on the left edge, while the SINSAY logo anchors the top right corner of the white panel, cleanly separating navigation and branding.
- **Target Experience**: Divers, tourists, and operators onboarding or logging in on desktop, laptop, or tablet.
- **Key Value**: Reclaims vertical screen height for body content, regulations, and auth inputs while establishing clean, predictable horizontal eye scanning.

---

## 2. User Experience & Visual Design

### Header Row Composition

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        White Panel Header (Desktop / Tablet View)                      │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────┐                           │
│   │  ‹ Back                                   [SINSAY]     │   <-- Horizontal Row      │
│   └────────────────────────────────────────────────────────┘                           │
│                                                                                        │
│   WELCOME TO MABINI!                                                                   │
│   Before you dive, there's something important.                                        │
│   ...                                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Row Geometry**:
  - `flexDirection: "row"`, `alignItems: "center"`, `justifyContent: "space-between"`, `width: "100%"`.
- **Left Item (Back Button)**:
  - Clean chevron icon (`chevron-back`) paired with "Back" label in deep navy `#0F172A`.
  - Hit slop of 12px for effortless cursor clicking.
- **Right Item (SINSAY Logo)**:
  - Scaled brand mark with crisp aspect ratio (approx. 140×34px), positioned neatly before the wave boundary.
- **Content Below**:
  - Onboarding titles and auth tabs sit immediately below the unified header with clean 20px margin.

---

## 3. Technical Implementation Plan

1. **Update `src/components/OnboardingCard.tsx`**:
   - Wrap the Back button pressable and the SINSAY `<Image>` inside `<View style={styles.desktopHeaderRow}>`.
   - Add `desktopHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 16 }`.
   - Adjust `styles.desktopLogo` and `styles.backRow` margins for seamless baseline alignment.
2. **Update `src/components/AuthLayout.tsx`**:
   - Wrap `wideBackRow` and `wideLogo` inside `<View style={styles.wideHeaderRow}>`.
   - Add `wideHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 16 }`.
   - Center-align subtitle and tab row under the new header.
3. **Verification**:
   - Run `compile_applet`.
   - Test `/next` through `/next5`, `/loginpage`, and `/signup` on desktop.
   - Verify mobile screens are completely unaffected.
