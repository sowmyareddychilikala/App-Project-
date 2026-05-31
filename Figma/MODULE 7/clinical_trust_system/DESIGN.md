---
name: Clinical Trust System
colors:
  surface: '#f6faff'
  surface-dim: '#d2dbe4'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf5fe'
  surface-container: '#e6eff8'
  surface-container-high: '#e0e9f2'
  surface-container-highest: '#dbe4ed'
  on-surface: '#141d23'
  on-surface-variant: '#424752'
  inverse-surface: '#293138'
  inverse-on-surface: '#e9f2fb'
  outline: '#727783'
  outline-variant: '#c2c6d4'
  surface-tint: '#005db6'
  primary: '#00478d'
  on-primary: '#ffffff'
  primary-container: '#005eb8'
  on-primary-container: '#c8daff'
  inverse-primary: '#a9c7ff'
  secondary: '#006e25'
  on-secondary: '#ffffff'
  secondary-container: '#80f98b'
  on-secondary-container: '#007327'
  tertiary: '#94001f'
  on-tertiary: '#ffffff'
  tertiary-container: '#bb1931'
  on-tertiary-container: '#ffcecd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#83fc8e'
  secondary-fixed-dim: '#66df75'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#00531a'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#ffb3b2'
  on-tertiary-fixed: '#410008'
  on-tertiary-fixed-variant: '#92001f'
  background: '#f6faff'
  on-background: '#141d23'
  surface-variant: '#dbe4ed'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  score-display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for the healthcare sector, where clarity, reliability, and precision are paramount. The brand personality is **authoritative yet empathetic**, striking a balance between clinical excellence and patient-centered accessibility.

The visual style is **Corporate / Modern**, leaning into a high-trust aesthetic that prioritizes information density without sacrificing legibility. We utilize a "Soft Clinical" approach: professional layouts tempered by generous white space and friendly, rounded UI elements. This ensures that complex medical data and "Trust Scores" feel approachable rather than overwhelming. The emotional response should be one of calm assurance and absolute clarity.

## Colors

This design system utilizes a palette rooted in traditional medical semiotics to ensure instant recognition and cognitive ease.

*   **Primary (Medical Blue):** `#005EB8`. Used for branding, primary actions, and active states. It represents stability and professional expertise.
*   **Success (Safety Green):** `#28A745`. Reserved specifically for "High Trust" indicators, positive health trends, and completed actions.
*   **Alert (Alert Red):** `#DC3545`. Utilized for critical warnings, abnormal lab results, and urgent notifications.
*   **Neutral Palette:** Employs a range of cool grays. Backgrounds use a very light tint (`#F8F9FA`) to reduce eye strain, while typography spans from deep charcoal (`#212529`) for headings to medium gray (`#6C757D`) for supportive metadata.

## Typography

The design system relies exclusively on **Inter** for its systematic, utilitarian, and highly legible characteristics, especially at small sizes common in medical data tables.

*   **Hierarchy:** Use `headline-lg` for primary screen titles and `score-display` specifically for Trust Scores or primary numerical biometrics.
*   **Readability:** For long-form medical reports, `body-md` is the standard. Use `body-sm` for secondary metadata or disclaimers.
*   **Data Labeling:** `label-md` should be used for all form labels and table headers to provide clear distinction from the data itself.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for high information density. 

*   **Mobile:** 4-column grid with 16px margins and 16px gutters.
*   **Tablet/Desktop:** 12-column grid with 24px gutters and variable margins.
*   **Spacing Logic:** We use a 4px baseline shift. Most components should use `md` (16px) padding for internal elements to maintain a breathable, professional feel. 
*   **Density:** In data-heavy views (like lab results), vertical spacing can be reduced to `sm` (8px) to allow more information to be visible above the fold.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**.

*   **Surface Strategy:** The primary background is the lowest layer. Content is housed in "Cards" or "Containers" that are pure white (`#FFFFFF`).
*   **Shadows:** We use very soft, diffused shadows to indicate interactive elements. A standard elevation shadow uses the Primary Color or Neutral Gray at 5-8% opacity with a large blur (12px+) and no spread.
*   **Dividers:** Use subtle 1px borders (`#E9ECEF`) instead of shadows to separate list items or table rows, keeping the interface clean and clinical.

## Shapes

The shape language is consistently **Rounded**, designed to soften the clinical nature of the content and make the app feel accessible.

*   **Standard Elements:** Buttons, Input Fields, and small Cards use a 0.5rem (8px) radius.
*   **Container Elements:** Main content cards or modal sheets use `rounded-lg` (16px) to create a distinct visual frame.
*   **Trust Score Gauges:** Use full circles or heavy rounding to emphasize the "holistic" nature of the health data.

## Components

*   **Buttons:** Primary buttons are solid Medical Blue with white text. Secondary buttons use a Medical Blue outline with a subtle background tint on hover.
*   **Trust Score Chips:** Use a background-fill of Safety Green with a 10% opacity, paired with a solid Safety Green border and text for high-visibility status indicators.
*   **Input Fields:** High-contrast borders (`#CED4DA`) that shift to Medical Blue on focus. Error states must use Alert Red for both the border and the supportive helper text.
*   **Cards:** The fundamental unit for reports. Cards should have a 16px corner radius, a subtle 1px neutral border, and a low-intensity ambient shadow.
*   **Lists:** Healthcare lists (like medication or appointments) should use "Value-Label" pairs, where the value is in `body-md` (bold) and the label is in `label-md` (gray) positioned directly above or to the left.
*   **Progress Indicators:** Use linear bars for health goals, applying a gradient from Primary Blue to Safety Green to represent positive progression.