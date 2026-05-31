---
name: Clinical Empathy
colors:
  surface: '#f3faff'
  surface-dim: '#c7dde9'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f6ff'
  surface-container: '#dbf1fe'
  surface-container-high: '#d5ecf8'
  surface-container-highest: '#cfe6f2'
  on-surface: '#071e27'
  on-surface-variant: '#414754'
  inverse-surface: '#1e333c'
  inverse-on-surface: '#dff4ff'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#8df5e4'
  on-secondary-container: '#007165'
  tertiary: '#4f6169'
  on-tertiary: '#ffffff'
  tertiary-container: '#677a82'
  on-tertiary-container: '#00060a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#8df5e4'
  secondary-fixed-dim: '#70d8c8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#d2e6ef'
  tertiary-fixed-dim: '#b6cad2'
  on-tertiary-fixed: '#0b1e24'
  on-tertiary-fixed-variant: '#374951'
  background: '#f3faff'
  on-background: '#071e27'
  surface-variant: '#cfe6f2'
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
    letterSpacing: -0.01em
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  touch-target: 48px
  gutter: 16px
  margin-mobile: 20px
---

## Brand & Style

The design system is anchored in a "Clinical yet Empathetic" aesthetic. It balances the rigor and precision of medical information with the warmth and support of a community. The target audience includes patients, caregivers, and medical professionals who require high legibility and a stress-reducing interface.

The visual style follows a **Modern Corporate** approach with **Soft UI** influences. It prioritizes clarity through generous whitespace, high-contrast typography, and a "Soft UI" layer logic that uses subtle shadows and depth to make the interface feel tactile and safe rather than cold and clinical.

## Colors

The palette is designed to instill a sense of calm and reliability. 

- **Primary Blue:** A deep, professional blue used for primary actions, branding, and active states.
- **Secondary Teal:** A soothing teal used for community-focused features and secondary accents.
- **Backgrounds:** Use a very light off-white/blue tint (#F8FAFC) to reduce eye strain compared to pure white.
- **Status Colors:** Red is reserved for "Side Effects" or "Critical Alerts," while Green is used for "Recovery Tracking" and "Success" states. Both are calibrated for AA accessibility standards against the light background.

## Typography

This design system utilizes **Inter** for its exceptional readability and neutral, professional tone. 

To ensure accessibility for users who may have visual impairments or are viewing the app in high-stress situations:
- **Scalability:** Body text never drops below 16px.
- **Contrast:** Text colors use high-contrast grays (near-black) to ensure a high contrast ratio.
- **Hierarchy:** Strong font weights (600-700) are used for headlines to allow for quick scanning of medical information.

## Layout & Spacing

The layout is built on a **Fluid Grid** optimized for mobile-first interactions. 

- **Touch Targets:** All interactive elements (buttons, links, icons) must maintain a minimum hit area of 48x48px to ensure ease of use for patients who may have limited dexterity.
- **Margins:** A standard 20px side margin provides breathing room on mobile devices.
- **Content Blocks:** Use a vertical 8px rhythm. Cards and sections are separated by 16px or 24px to clearly delineate different medical topics or community posts.

## Elevation & Depth

This design system employs a **Soft UI** approach to depth. Rather than using harsh borders, it uses layers to create a clean, modern feel.

- **Surface Levels:** 
    - **Level 0 (Background):** Solid #F8FAFC.
    - **Level 1 (Cards/Inputs):** White (#FFFFFF) with a very soft, diffused shadow (Offset 0, 4px; Blur 12px; 5% opacity black).
    - **Level 2 (Modals/Popovers):** White (#FFFFFF) with a more defined shadow (Offset 0, 8px; Blur 24px; 10% opacity black).
- **Interactive Depth:** Buttons should have a subtle 2px vertical offset to appear slightly "raised," reinforcing their clickability.

## Shapes

The shape language is "Approachable Geometric." 

- **Standard Elements:** Buttons, input fields, and small cards use a **12px (0.5rem)** corner radius.
- **Large Containers:** Content cards and feature blocks use a **16px (1rem)** corner radius to feel softer and more inviting.
- **Pill Elements:** Use fully rounded corners for tags, chips, and "active" status indicators to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Solid Primary Blue background with White text. 12px radius. 
- **Secondary:** Outlined in Secondary Teal with Teal text.
- **Tertiary:** Ghost style for less critical actions like "Cancel" or "Skip."

### Cards
- Always use a White background. 
- Apply Level 1 elevation (subtle shadow).
- Padding should be a minimum of 16px to ensure medical data isn't cramped.

### Input Fields
- Use a light gray border (#E2E8F0) that thickens and turns Primary Blue on focus.
- Help text and error messages must be clearly visible below the field.

### Chips & Tags
- **Side Effect Tags:** Red background at 10% opacity with solid Red text.
- **Community Tags:** Teal background at 10% opacity with solid Teal text.

### Health Specific Components
- **Progress Trackers:** Use rounded "pill" bars for medication or recovery tracking.
- **Community Avatars:** Circular with a subtle border to indicate "Verified Professional" or "Community Leader" status.