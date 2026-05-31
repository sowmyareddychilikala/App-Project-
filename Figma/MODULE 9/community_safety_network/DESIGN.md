---
name: Community Safety Network
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
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Public Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  status-tag:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 16px
  gutter: 12px
  stack-sm: 4px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered to project **authoritative calm**. It serves as a critical infrastructure for community safety, requiring a visual language that balances immediate urgency with steady reliability. The aesthetic is **Modern Corporate** with a heavy emphasis on **Functional Utility**, drawing inspiration from emergency response interfaces and high-stakes medical dashboards.

The target audience consists of local residents and safety volunteers who need to process information rapidly under stress. To achieve this, the UI utilizes generous whitespace for clarity, high-contrast markers for actionable alerts, and a strict hierarchy that prevents information overload during critical events.

## Colors

The palette is anchored by **Deep Navy**, representing institutional trust and stability. This is contrasted with **Safety Amber** for cautionary alerts and **Signal Red** for high-priority emergencies. 

- **Primary (Deep Navy):** Used for headers, primary actions, and branding elements to establish authority.
- **Secondary (Slate):** Used for supporting text, iconography, and secondary interface elements to maintain a professional, grounded feel.
- **Tertiary (Amber):** Reserved strictly for "Warning" states and active monitoring indicators.
- **Backgrounds:** A system of light grays (`#F1F5F9`) and pure whites is used to ensure maximum legibility for map overlays and data cards.

## Typography

Typography prioritizes **accessibility and rapid scanning**. 

**Public Sans** is used for headlines to provide a clean, institutional strength. Its geometric roots offer a sense of modern efficiency. 

**Atkinson Hyperlegible Next** is used for all body text and labels. This choice is mission-critical, as it was specifically designed to increase character recognition for people with low vision—a vital feature when users are viewing alerts on the move or in high-glare outdoor environments. 

Headlines should use a "tight" line height to feel urgent, while body text remains "open" (1.5x) to prevent fatigue during long-form reports.

## Layout & Spacing

This design system uses a **Fluid 8pt Grid System**. On mobile devices, the layout adheres to a 4-column structure with 16px side margins.

- **Map-First Layout:** The primary view is a full-bleed map. Functional UI elements (search bars, filter chips) are treated as floating "system layers" positioned with a 16px inset from the screen edges.
- **Information Density:** For list-based views or report logs, spacing is compact (12px gutters) to allow as much information as possible to be visible above the fold.
- **Touch Targets:** All interactive elements (buttons, report toggles) must maintain a minimum 48x48px tap area, regardless of their visual size.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **High-Contrast Outlines** rather than heavy shadows, to maintain a "utility" look.

- **Level 0 (Map/Base):** The bottom layer.
- **Level 1 (Surface):** White cards with a subtle 1px border (`#E2E8F0`). No shadow. Used for standard information.
- **Level 2 (Active Alert):** Cards with a 2px colored border (Amber or Red) and a soft, low-opacity shadow (8% alpha) to make them appear to "float" above the map.
- **Sheet Overlays:** Bottom sheets used for reporting incidents use a Backdrop Blur (20px) on the map behind them to focus the user’s attention on the form inputs.

## Shapes

The shape language is **Soft (0.25rem)**. 

Sharp corners feel too aggressive, while pill-shapes feel too casual or "bubbly." The `rounded-sm` approach provides a precise, engineered feel. 

- **Primary Buttons:** Subtle rounding (4px) to maintain a blocky, sturdy appearance.
- **Alert Badges:** Slightly more rounded (8px) to differentiate them as distinct "pills" of information against the more rigid card structures.
- **Inputs:** Square corners with a very slight radius to imply a structured, form-based environment.

## Components

### Alert Cards
Alert cards are the primary vessel for information. They must feature a high-contrast "Status Header" using the tertiary Amber or Red color. The headline should be bold and concise. Time-stamps are always displayed in the top right in a `label-bold` style.

### Map Indicators
Markers use a "pin and pulse" system. Critical alerts pulse subtly to draw the eye without creating visual noise. The pin color must correspond exactly to the alert level defined in the color palette.

### Primary Action Button (SOS)
A specialized "Quick Report" or "SOS" button should be floating, circular, and utilize the Primary Navy color with a white icon. This provides a clear, high-contrast anchor for the user.

### Status Indicators
Use a "Traffic Light" system for community risk levels:
- **Low:** Slate Blue (Neutral)
- **Elevated:** Amber (Tertiary)
- **High:** Red (Danger)
These appear as filled chips with white, uppercase text.

### Input Fields
Inputs use a "Structured Box" style. They feature a light gray fill and a 1px border that thickens and changes to Primary Navy on focus. Labels are always visible above the field (never hidden as placeholders) to ensure clarity during data entry.