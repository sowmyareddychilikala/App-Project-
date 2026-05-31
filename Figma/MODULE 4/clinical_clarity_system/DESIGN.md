---
name: Clinical Clarity System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#201100'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c2300'
  on-tertiary-container: '#c88000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 16px
  container-padding-desktop: 40px
  gutter: 24px
  card-gap: 16px
---

## Brand & Style

The design system is anchored in the concept of "Clinical Clarity." It prioritizes reliability, precision, and calm through a high-utility interface that reduces cognitive load for users managing their health. The aesthetic is **Corporate / Modern** with a lean toward **Minimalism**, ensuring that critical information—such as expiration dates and dosage instructions—takes center stage without visual noise.

The target audience ranges from tech-savvy individuals to seniors and caregivers, requiring an interface that feels both cutting-edge and deeply accessible. By utilizing ample whitespace and a structured "digital medicine cabinet" metaphor, the design system evokes a sense of order and medical professionalism.

## Colors

The palette is strategically curated to communicate status at a glance, adhering to standard medical and safety conventions.

- **Primary (Deep Blue):** Used for headers, navigation, and primary actions to establish an atmosphere of authority and trust.
- **Secondary (Mint Green):** Represents "Active/Safe" status. It is used for medicines in good standing and positive confirmations.
- **Warning (Amber):** Reserved strictly for "Near Expiry" alerts. It creates a sense of urgency without causing panic.
- **Critical (Red):** Used for "Expired" status and destructive actions. It demands immediate attention.
- **Neutral (Cool Grays):** A range of slate grays provides a clean, institutional backdrop that prevents the vibrant status colors from overwhelming the user.

## Typography

The design system utilizes **Inter** for all levels to ensure maximum legibility across digital displays. Inter’s tall x-height and neutral character make it ideal for reading small medical labels and dates.

- **Scale:** A tight typographic scale ensures hierarchy is clear even in data-heavy views.
- **Emphasis:** Bold weights are used sparingly for medicine names and critical dates to ensure they "pop" against the body text.
- **Accessibility:** Line heights are generous (1.5x for body text) to accommodate users with visual impairments or those reading in low-light environments.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy to maintain the "organized cabinet" feel. 

- **Desktop:** A 12-column grid centered in a 1200px container.
- **Mobile:** A single-column fluid layout with 16px side margins.
- **Spacing Rhythm:** An 8px linear scale (8, 16, 24, 32, 40, 48, 64) is used for all padding and margins to create a mathematical harmony.
- **Density:** The system favors "Room to Breathe." Large gaps between medicine categories (e.g., Prescriptions vs. Supplements) help the user distinguish groups of information quickly.

## Elevation & Depth

To simulate the organization of a medicine cabinet, the design system uses **Tonal Layers** combined with **Soft Ambient Shadows**.

- **Level 0 (Background):** Solid Neutral (`#F8FAFC`).
- **Level 1 (Cards):** Pure white surfaces with a subtle 1px border (`#E2E8F0`) and a soft, high-diffusion shadow (Color: `#1E293B`, Opacity: 4%, Blur: 12px, Y: 4px).
- **Level 2 (Modals/Popovers):** Deeper shadows to indicate focus and priority.
- **Interactive Depth:** On hover, cards should subtly lift (shadow increases in blur) to provide tactile feedback without looking "gamey."

## Shapes

The shape language is defined by **Rounded** corners (Level 2). This softens the "clinical" edge of the app, making it feel more approachable and modern.

- **Standard Elements:** 8px (0.5rem) radius for buttons and input fields.
- **Cards:** 16px (1rem) radius for medicine containers to emphasize the "object" feel.
- **Status Indicators:** Fully pill-shaped (rounded-full) for chips and status badges to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Deep Blue background with White text. High-contrast, used for "Add Medicine."
- **Secondary:** White background with a Deep Blue border. Used for "Edit" or "View History."
- **Ghost:** No border or background; used for low-priority actions like "Dismiss."

### Cards (The "Medicine Cabinet" Unit)
The card is the hero of the design system. Every card must contain:
1.  **Icon/Avatar:** A simplified pill, bottle, or tube icon.
2.  **Title:** The name of the medicine (Headline-SM).
3.  **Status Badge:** A pill-shaped chip using the status colors (Mint, Amber, or Red).
4.  **Meta Data:** Expiry date and dosage frequency in Body-SM.

### Inputs & Fields
Input fields use a subtle light-gray background with a 1px border that turns Deep Blue on focus. Labels sit clearly above the field in Label-MD style.

### Status Chips
Small, non-interactive badges.
- **Active:** Mint background (10% opacity) with dark mint text.
- **Expiring:** Amber background (10% opacity) with dark amber text.
- **Expired:** Red background (10% opacity) with dark red text.

### Progress Bars
Used for tracking "Days Left." The bar color changes dynamically from Green to Amber to Red as the expiration date approaches.