# Onboarding & Authentication Wave Boundary Design

Adopt the organic fluid wave curve on the white content panel across both the Onboarding flow (`next.tsx` through `next5.tsx`) and the Authentication screens (`loginpage.tsx` and `signup.tsx`) on desktop and tablet wide screens, matching the uploaded design reference.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design choices have been confirmed via clarifying answers:
> - **Unified Design Across Onboarding & Auth**: Both `OnboardingCard.tsx` and `AuthLayout.tsx` will share the identical smooth SVG S-curve wave boundary profile for visual continuity.
> - **Responsive Scope**: Desktop and tablet wide screens only (`isWide = isDesktop || isTablet`). Mobile layouts retain their native bottom-sheet and full-width forms.
> - **Right-Side Imagery**:
>   - Onboarding retains the full-bleed diver/ocean illustrations per step (`2.jpeg`, `3.png`, `4.jpeg`, `5.jpeg`, `6.jpeg`).
>   - Login & Signup retain the current rich marine background image (`1.png`).
> - **Zero Disruption to Existing Functionality**: Only the panel border geometry and wave divider are updated. All form fields, auth submissions, step flows, validation, and buttons remain untouched.

---

## 1. Overview & Core Concept

- **What It Delivers**: Replaces the standard straight vertical divider line on the desktop split-screen with an organic S-curve marine wave. The white container sweeps fluidly into the deep blue ocean artwork on the right, bringing the brand's coastal dive identity to life across both onboarding and account access.
- **Target Experience**: Divers, tourists, and operators accessing SINSAY onboarding or signing in on desktop, laptop, and tablet browsers.
- **Key Value**: Delivers the bespoke marine aesthetic requested in the reference image, establishing immediate visual cohesion from onboarding through login and signup.

---

## 2. User Experience & Visual Design

### Visual Structure
- **Left Panel (White Content Container)**:
  - Surface: Pure `#FFFFFF`.
  - Content: Padded safely within the straight rectangular interior (`paddingHorizontal: 48` to `56px`) so titles, regulation rows, and form inputs never clip or touch the wave.
- **Wave Edge (Right Boundary)**:
  - Scalable vector S-curve wave running 100% of the viewport height.
  - S-curve geometry matching the reference image:
    - Top: Convex crest sweeping smoothly into the ocean artwork.
    - Mid-section: Soft trough curving inward alongside the middle content.
    - Lower section: Gentle crest swelling outward above the primary action buttons.
    - Bottom: Tapering inward toward the bottom left corner.
  - Pure white fill (`#FFFFFF`), seamless with the left panel, removing all harsh border lines.
- **Right Panel (Ocean Artwork)**:
  - Full-bleed hero artwork (`heroImage` on onboarding; `1.png` on auth) creating the ocean backdrop visible through the wave contour.

---

## 3. Technical Architecture & Component Mapping

### Unified Component Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        OnboardingCard / AuthLayout (Desktop View)                      │
│                                                                                        │
│   ┌──────────────────────────────────────────────┐░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│   │  [SINSAY Logo]                               │╲                                    │
│   │  < Back                                      │ ╲   [Ocean Hero / Marine Artwork]   │
│   │                                              │  )                                  │
│   │  Onboarding Content / Auth Form              │ (                                   │
│   │  - Headlines & Subtitles                     │  )                                  │
│   │  - Regulation Cards / Login & Signup Tabs    │   ╲                                 │
│   │  - Inputs, Checkboxes & Actions              │    )                                │
│   │                                              │   ╱                                 │
│   │  [ Primary Action Button ]                   │  (                                  │
│   │                                              │   ╲                                 │
│   │                                              │    )                                │
│   └──────────────────────────────────────────────┘───╱░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│      <─── Solid White Content Area ───>  <─ Wave Edge ─>  <── Ocean Artwork Panel ──>  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Shared Wave Divider Component
- Create a dedicated, reusable vector component `src/components/WaveDivider.tsx` using `react-native-svg` (`Svg`, `Path`).
- Set `viewBox="0 0 100 1000"` with `preserveAspectRatio="none"` and `height: "100%"`.
- Path runs an exact cubic Bézier S-curve filled with `#FFFFFF` extending outward from the white panel over the right-side image.
- Reuse `WaveDivider` in both:
  1. `src/components/OnboardingCard.tsx` (onboarding flow)
  2. `src/components/AuthLayout.tsx` (login & signup flow)

---

## 4. Implementation Steps

1. **Create `src/components/WaveDivider.tsx`**:
   - Clean vector S-curve matching the reference image.
   - Fully responsive, stretching dynamically to any viewport height.
2. **Update `src/components/OnboardingCard.tsx`**:
   - Remove straight `borderRightWidth: 1` and `borderRightColor: "#F1F5F9"`.
   - Embed `<WaveDivider />` on the right boundary of `leftPanel`.
   - Maintain padding and layout for all 5 onboarding steps.
3. **Update `src/components/AuthLayout.tsx`**:
   - Remove straight `borderRightWidth: 1` and `borderRightColor: "#F1F5F9"`.
   - Embed `<WaveDivider />` on the right boundary of `wideLeft`.
   - Maintain tab switching and input ergonomics.
4. **Export & Verification**:
   - Export from `src/components/index.ts`.
   - Run `lint_applet` and `compile_applet`.
   - Test `/next` through `/next5`, `/loginpage`, and `/signup` on desktop.

---

## 5. Verification Plan

1. **Onboarding Verification**:
   - Navigate to `http://localhost:3000/next` and advance through steps 1 to 5.
   - Verify that the white panel has the smooth S-curve wave boundary blending into the ocean hero background.
2. **Auth Verification**:
   - Navigate to `http://localhost:3000/loginpage` and `http://localhost:3000/signup`.
   - Verify that the identical wave boundary is applied, separating the form from `1.png`.
3. **Mobile Isolation**:
   - Check mobile screen width (<640px) to verify zero regressions on mobile layouts.
