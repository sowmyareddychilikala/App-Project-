---
name: Clinical Trust Framework
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
  on-surface-variant: '#3f4850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#4d5d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#66768d'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
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
  label-sm:
    fontFamily: Inter
    fontSize: 11px
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
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered to project institutional authority, medical precision, and unwavering reliability. Catering to healthcare professionals and health-conscious consumers, the brand personality is clinical yet accessible—prioritizing clarity of information over decorative flair.

The aesthetic follows a **Modern Healthcare** approach, blending **Minimalism** with **Corporate** reliability. It utilizes expansive white space to reduce cognitive load, high-contrast ratios for accessibility (WCAG 2.1 AAA compliance where possible), and a systematic layout that mirrors the efficiency of a well-run medical facility. The emotional response should be one of safety and transparency, ensuring users feel confident in the reputation data they are consuming.

## Colors

The palette is rooted in medical blues and greens, colors scientifically associated with health, hygiene, and calm. This design system uses a primary "Medical Blue" for core navigation and actions, and a "Clinical Teal" for secondary emphasis.

The semantic system is the core of the reputation logic:
- **Trusted:** An emerald green used for high-performing pharmacies.
- **Under Observation:** A warm amber to signal caution without immediate alarm.
- **High Risk:** A high-contrast, vivid red for immediate danger or low reputation scores.

The background is a crisp neutral white (#FFFFFF) with a very light slate (#F8FAFC) used for section nesting, ensuring a sterile and organized environment.

## Typography

This design system utilizes **Inter** for all typographic roles. Inter’s tall x-height and neutral character make it exceptionally legible for technical data and status labels. 

The type hierarchy is structured to favor readability at a glance. Headlines use a tighter letter-spacing and heavier weights to establish clear content sections. Body copy is optimized with generous line heights (1.5x) to ensure medical descriptions and data points are easy to parse. Small labels (label-md) are used for category tags and status badges, often paired with increased letter spacing for clarity in compact spaces.

## Layout & Spacing

The layout is built on a rigorous **8px Grid System**, ensuring all components align with mathematical precision. 

- **Desktop:** A 12-column fixed grid centered in the viewport, with a max-width of 1280px. This provides a structured "dashboard" feel for managing large sets of pharmacy data.
- **Mobile:** A fluid 4-column grid. Large data tables reflow into card-based layouts. 
- **Spacing Rhythm:** Vertical spacing (stack-*) follows the 8px scale to create a clear hierarchy between headlines, sub-bullets, and paragraph blocks. 

Margins are generous (40px on desktop) to reinforce the minimalist, high-end healthcare aesthetic, preventing the UI from feeling cluttered or overwhelming.

## Elevation & Depth

Visual hierarchy is established primarily through **Tonal Layers** and **Low-contrast Outlines**. To maintain a clean, professional look, the design system avoids heavy shadows.

- **Level 0 (Surface):** The primary background (#FFFFFF).
- **Level 1 (Sub-surface):** Slightly recessed areas using #F8FAFC for search bars or sidebars.
- **Level 2 (Cards):** Elevated via a 1px solid border (#E2E8F0) and a very soft ambient shadow (0px 4px 6px rgba(0, 0, 0, 0.02)). 
- **Interaction:** On hover, cards transition to a slightly deeper shadow (0px 10px 15px rgba(0, 0, 0, 0.04)) to provide tactile feedback without breaking the minimalist aesthetic.

Depth is used to "pop" critical reputation alerts, where the high-risk red components may sit slightly higher in the visual stack than neutral information.

## Shapes

The shape language is **Rounded**, utilizing a 0.5rem (8px) base radius. This softens the clinical feel, making the app feel modern and approachable rather than cold and industrial.

- **Buttons & Inputs:** Use the standard 8px radius.
- **Status Badges (Chips):** Utilize a full pill-shape (rounded-xl) to distinguish them from interactive buttons.
- **Cards:** Use a 16px (1rem) radius to create a containerized, "protective" feel for pharmacy data.
- **Map Elements:** Map pins and tooltips use sharp bottom points with rounded tops to combine geographic precision with the system's overall soft geometry.

## Components

### Pharmacy Reputation Cards
The primary vehicle for information. Each card must feature:
- A high-visibility **Status Badge** in the top right corner using the semantic color system (e.g., "Trusted" in Emerald Green).
- A clear Title (headline-md) and a secondary location label.
- A "Reputation Score" visualization—typically a circular progress ring or a simplified 1-5 metric.

### Status Indicators & Chips
Used for filtering pharmacy categories. Selected chips use the Primary Medical Blue with white text; unselected chips use a subtle slate outline.

### Map Integration Elements
The map interface uses custom markers color-coded to the pharmacy's reputation. Tapping a marker opens a "Quick-View" drawer containing the pharmacy's core metrics and a button to view the full report.

### Input Fields
Inputs are clean with 1px borders. Focus states use a 2px Medical Blue ring. Labels always sit above the field in `label-md` to ensure clarity for users with visual impairments.

### Navigation
A top-bar navigation system on desktop for category switching (e.g., "All Pharmacies," "Retail," "Hospital-based"). On mobile, this transitions to a persistent bottom navigation bar for core app views: Search, Map, Saved, and Profile.