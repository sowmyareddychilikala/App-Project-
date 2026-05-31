---
name: Clinical Clarity
colors:
  surface: '#f8fafb'
  surface-dim: '#d8dadb'
  surface-bright: '#f8fafb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f5'
  surface-container: '#eceeef'
  surface-container-high: '#e6e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#41474e'
  inverse-surface: '#2d3132'
  inverse-on-surface: '#eff1f2'
  outline: '#72787f'
  outline-variant: '#c1c7cf'
  surface-tint: '#2e628c'
  primary: '#003555'
  on-primary: '#ffffff'
  primary-container: '#0f4c75'
  on-primary-container: '#8bbceb'
  inverse-primary: '#9acbfb'
  secondary: '#006496'
  on-secondary: '#ffffff'
  secondary-container: '#7dc5ff'
  on-secondary-container: '#00517b'
  tertiary: '#0b364a'
  on-tertiary: '#ffffff'
  tertiary-container: '#274d61'
  on-tertiary-container: '#98bdd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#9acbfb'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#0b4a73'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#91cdff'
  on-secondary-fixed: '#001e31'
  on-secondary-fixed-variant: '#004b72'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#a6cce4'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#254b5f'
  background: '#f8fafb'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
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
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 20px
  gutter: 12px
  stack-sm: 4px
  stack-md: 16px
  stack-lg: 24px
  section-gap: 32px
---

## Brand & Style
The design system is centered on **trust, precision, and accessibility**. Designed for a mobile medicine information app, it facilitates a "calm-tech" experience where critical health data is presented without visual noise.

The style is **Corporate / Modern** with a clinical lean. It prioritizes high legibility and a sense of institutional reliability. The aesthetic is characterized by expansive whitespace, a disciplined color application, and a focus on clarity over decoration. The emotional response should be one of reassurance—providing users with a sense of safety and professional guidance when managing their health.

## Colors
The palette is rooted in medical heritage. The **Primary Blue (#0F4C75)** is used for brand presence, primary actions, and authoritative headers. The **Secondary Blue (#3282B8)** functions as a supportive health-tint, used for secondary interactions and iconography.

A neutral background of **#F9FBFC** prevents the "stark white" eye strain while maintaining a sterile, clinical feel. Semantic colors (Red, Amber, Green) are critical for medication safety alerts and dosage status; they should always be accompanied by icons to ensure accessibility for color-blind users.

## Typography
This design system utilizes **Inter** for its exceptional legibility and systematic structure. The hierarchy is intentionally strict to separate "Medical Nomenclature" from "Patient Instructions."

- **Headlines:** Use Bold weights for medication names.
- **Body Text:** Use Regular weight for general information, switching to Medium for specific dosage instructions (e.g., "Take 2 tablets").
- **Labels:** Small, uppercase labels are reserved for metadata like "Active Ingredients" or "Manufacturer."

## Layout & Spacing
The layout follows a **fluid grid** optimized for mobile devices. It utilizes a 4-column system for mobile views with a standard 20px outer margin to ensure content doesn't feel cramped against the bezel.

Spacing follows an 8px base unit. Vertical rhythm is established through "Stacking" tokens—use `stack-md` for related information (like a dosage and its frequency) and `section-gap` to separate distinct medical categories. High "Safe Area" padding is used at the bottom of screens to accommodate navigation bars and floating action buttons for emergency features.

## Elevation & Depth
The design system employs **Tonal Layers** and **Ambient Shadows** to create a subtle sense of priority. 

- **Level 0 (Surface):** The background (#F9FBFC).
- **Level 1 (Cards):** Pure white (#FFFFFF) surfaces with a very soft, diffused shadow (Blur: 12px, Opacity: 4%, Color: #0F4C75). Used for individual medication entries.
- **Level 2 (Modals/Overlays):** White surfaces with a more pronounced shadow (Blur: 24px, Opacity: 8%). Used for urgent drug interaction warnings or dosage confirmations.

Avoid heavy borders; use light gray (#E1E8ED) 1px outlines for input fields to maintain the clean, clinical aesthetic.

## Shapes
The shape language is **Soft**. A 0.25rem (4px) base radius is used for small elements like checkboxes and tags, while 0.5rem (8px) is the standard for cards and buttons. This provides a professional, modern feel that is friendlier than sharp corners but more serious than highly rounded "bubbly" designs. Large containers (modals) use 0.75rem (12px) for a soft "sheet" appearance.

## Components
- **Buttons:** Primary buttons use a solid #0F4C75 fill with white text. Secondary buttons use a #3282B8 outline. Height should be 48px minimum for "fat-finger" accessibility in healthcare contexts.
- **Medicine Cards:** White backgrounds, 8px corner radius, featuring a clear icon of the form factor (pill, liquid, etc.) on the left.
- **Status Chips:** Used for "In Stock" or "Prescription Required." Low-saturation background tints of the status colors with high-contrast text.
- **Input Fields:** 1px border (#E1E8ED), 4px radius. Labels should always be persistent (not floating) to ensure the user never loses context while typing complex dosages.
- **Progressive Disclosure:** Use accordions for "Side Effects" and "Drug Interactions" to keep the primary screen clean while allowing deep-dives.
- **Icons:** Use "Medical/Health" themed line icons with a consistent 2px stroke weight.