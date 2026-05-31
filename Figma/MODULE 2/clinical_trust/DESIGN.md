---
name: Clinical Trust
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#434654'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#b6171e'
  on-secondary: '#ffffff'
  secondary-container: '#da3433'
  on-secondary-container: '#fffbff'
  tertiary: '#683700'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a4b00'
  on-tertiary-container: '#ffc99d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb3ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#930010'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ffb77a'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6d3a00'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style

This design system is engineered for a high-stakes healthcare environment where clarity, reliability, and speed of comprehension are paramount. The brand personality is authoritative yet empathetic, positioning the application as a vigilant guardian of patient safety. 

The aesthetic follows a **Modern Corporate** approach with a heavy emphasis on **High-Contrast** accessibility. It utilizes ample whitespace to reduce cognitive load, ensuring that critical medical information is never obscured by decorative elements. The visual language is disciplined and systematic, designed to evoke a sense of clinical precision and absolute dependability.

## Colors

The palette is strictly functional, utilizing color as a communication tool rather than just an aesthetic choice. 

- **Primary (Trust Blue):** Used for navigation, primary actions, and branding. It reinforces stability and professional healthcare standards.
- **Secondary (Emergency Red):** Reserved exclusively for critical alerts, missed doses, or contraindication warnings. It must maintain a high contrast ratio against white backgrounds.
- **Tertiary (Warning Amber):** Dedicated to time-sensitive but non-critical information, such as upcoming expiries or refill reminders.
- **Neutral:** A deep slate-charcoal is used for text to ensure maximum legibility, avoiding pure black to reduce eye strain during frequent use.
- **Surface:** The background is a clean white (#FFFFFF) with subtle cool-gray (#F4F7FA) secondary surfaces to define content areas.

## Typography

The typography system prioritizes extreme legibility. **Atkinson Hyperlegible Next** is selected for headlines due to its distinctive character shapes, which prevent misreading of similar letters—a critical requirement for medical names and dosages. **Inter** is used for body text and labels for its systematic, neutral, and highly readable nature at small sizes.

Hierarchy is enforced through weight and color rather than just size. All critical medical instructions (e.g., "Take with food") should use `body-lg` with a semi-bold weight to ensure they stand out within a list.

## Layout & Spacing

This design system employs a **Fluid Grid** model optimized for handheld devices. It follows a 4px baseline shift to ensure all elements align perfectly within the vertical rhythm.

- **Margins:** A standard 16px margin is maintained on the horizontal edges of the mobile screen.
- **Touch Targets:** No interactive element (buttons, toggles, list items) shall be smaller than 48x48px to accommodate users with varying motor skills.
- **Stacking:** Vertical spacing between cards and modules is set to 12px or 16px to maintain clear separation while maximizing screen real estate.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**. 

- **Level 0 (Background):** Solid white or very light gray.
- **Level 1 (Cards):** Use a 1px solid border (#E2E8F0) instead of heavy shadows to maintain a clean, clinical look. 
- **Level 2 (Active/Floating):** Subtle, diffused ambient shadows (0px 4px 12px rgba(0, 0, 0, 0.05)) are used only for high-priority items like the "Add Medication" FAB or active bottom sheets.
- **Scrims:** When modals are active, use a high-opacity (60%) dark tint to focus the user's attention entirely on the safety interaction.

## Shapes

The design system utilizes **Soft** geometry. A corner radius of 4px (0.25rem) is the default for standard components like input fields and small buttons. Larger containers and cards use 8px (0.5rem). This subtle rounding offers a modern, approachable feel while maintaining the structured, professional look necessary for a medical application. Circles are used only for status indicators and profile avatars.

## Components

### Buttons
- **Primary:** Solid Trust-Blue with white text. High-contrast and easily identifiable.
- **Emergency Action:** Solid Emergency-Red for "Stop Medication" or "Report Adverse Effect."
- **Ghost:** Used for secondary actions (e.g., "View History") with a 1px border.

### Alert Badges
- Small, high-visibility pills. 
- **Critical:** White text on Emergency-Red. 
- **Warning:** Dark-Neutral text on Warning-Amber.
- **Safe/Taken:** White text on a muted Teal/Green (#2E7D32).

### Dashboard Cards
Cards are the primary container. They feature a 1px border, 8px corner radius, and use `headline-md` for titles. For medications, the dosage and frequency must be prominently displayed using the `label-bold` style in a secondary color to ensure quick scanning.

### Bottom Navigation
A fixed bar with four primary slots: Dashboard, Schedule, Med-Cabinet, and Profile. Icons are 24px, accompanied by `label-sm` text. Active states use the Primary Trust-Blue; inactive states use a medium-gray (#64748B).

### Input Fields
Strictly defined by a 1px border. Error states for incorrect dosages or invalid entries must change the border to Emergency-Red and include a supporting icon for accessibility.