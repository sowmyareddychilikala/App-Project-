---
name: Medical Verification System
colors:
  surface: '#f8f9ff'
  surface-dim: '#c4dcfd'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d1e4ff'
  on-surface: '#011d35'
  on-surface-variant: '#434654'
  inverse-surface: '#19324b'
  inverse-on-surface: '#e9f1ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#46617b'
  on-secondary: '#ffffff'
  secondary-container: '#c4e0fe'
  on-secondary-container: '#48637d'
  tertiary: '#3f4447'
  on-tertiary: '#ffffff'
  tertiary-container: '#565b5f'
  on-tertiary-container: '#cfd3d7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#cee5ff'
  secondary-fixed-dim: '#aec9e7'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#2e4962'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f8f9ff'
  on-background: '#011d35'
  surface-variant: '#d1e4ff'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
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
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style

The design system is engineered for a high-stakes medical environment where accuracy and trust are non-negotiable. The brand personality is clinical, authoritative, and efficient, designed to reduce cognitive load for healthcare professionals and patients alike.

The visual style follows a **Corporate / Modern** aesthetic, prioritizing clarity over decoration. It utilizes a flat UI foundation with strategic use of subtle shadows to establish a clear information hierarchy. The interface communicates reliability through structured layouts, ample whitespace, and a high-contrast color palette that ensures critical status information is immediately recognizable.

## Colors

The palette is anchored by a deep **Medical Blue** that symbolizes stability and professionalism. 

- **Primary:** Used for key brand elements and primary actions like "Begin Scan."
- **Neutrals:** A range of cool grays and deep slates to provide structure without the harshness of pure black.
- **Status Colors:** These are high-chroma variants designed for instant differentiation. 
    - **Success Green:** Indicates "Genuine" or "Verified."
    - **Warning Orange:** Indicates "Suspicious" or "Requires Review."
    - **Danger Red:** Indicates "Risk," "Expired," or "Counterfeit."

Backgrounds should remain clean white or very light gray to maintain a sterile, clinical feel.

## Typography

This design system uses **Inter** for all text roles. Inter’s tall x-height and clear letterforms ensure maximum legibility for dense technical data and rapid status checks.

- **Headlines:** Use a bold weight to anchor sections. On mobile, headlines scale down to prevent excessive wrapping.
- **Body Text:** Standardized at 16px for general reading to ensure accessibility in low-light clinical environments.
- **Labels:** Used for metadata (e.g., "Batch Number," "Expiry Date") and are often paired with a medium weight to distinguish from value text.

## Layout & Spacing

The layout is built on an **8px grid system**, ensuring consistent vertical and horizontal rhythm. 

- **Desktop:** A 12-column fixed grid with a max width of 1200px. Sidebars are used for navigation, while the central area focuses on results and history.
- **Mobile:** A fluid 4-column layout with 16px side margins. Elements like scan results should span the full width of the container for maximum touch targets.
- **Spacing Philosophy:** Generous padding within cards (24px) helps isolate data points, making it easier for users to extract information quickly during a verification event.

## Elevation & Depth

This design system employs a **Tonal Layering** approach combined with **Ambient Shadows** to create a soft hierarchy.

1. **Base Layer:** The light background (Neutral 50) acts as the foundation.
2. **Surface Layer:** White cards or containers used for content blocks. These use a very soft, diffused shadow (Blur: 12px, Opacity: 4%, Color: Blue-Tinted Slate) to lift them slightly off the background.
3. **Interactive Layer:** Elements like buttons or active states use a slightly deeper shadow to signify "tappability."
4. **Overlay Layer:** Modals and full-screen camera views use a dark backdrop (80% opacity) to focus the user's attention entirely on the verification task.

## Shapes

The shape language is **Soft**, utilizing a 4px (0.25rem) base corner radius. This provides a balance between the precision of sharp corners and the friendliness of rounded ones.

- **Standard Elements:** 4px radius for input fields and small buttons.
- **Cards & Large Containers:** 8px (rounded-lg) to frame information blocks clearly.
- **Status Indicators:** Small dots or square chips with 2px radius for a technical, data-centric appearance.

## Components

### Buttons
- **Primary:** Solid Medical Blue with white text. High-contrast and prominent.
- **Secondary:** Outlined blue or neutral for less critical actions like "View Details."
- **Scanning Action:** Large, centered floating action button or full-width button at the bottom of the screen.

### Scan History Cards
- Structured layout with a small status indicator chip in the top right.
- Left-aligned title (Product Name) with a sub-line for the timestamp.
- Subtle 1px border (#E4E7EB) to define boundaries on white backgrounds.

### Status Indicators
- **Badges:** Small, rounded containers with a light background and dark text of the same hue (e.g., Light Green bg with Dark Green text).
- **Icons:** Paired with text for accessibility—checkmarks for success, exclamation for warning, and cross-marks for danger.

### Extraction Results
- Use a split-row layout: "Label" on the left (semi-bold) and "Value" on the right (regular).
- Use divider lines only when necessary; prefer 8px of vertical spacing to group related data points.

### Input Fields
- Clear, labeled fields with a subtle gray border that turns Primary Blue on focus.
- Validation states should use the Danger Red color for error text below the field.