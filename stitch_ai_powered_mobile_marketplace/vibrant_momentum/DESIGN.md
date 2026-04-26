---
name: Vibrant Momentum
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#5a4136'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#8e7164'
  outline-variant: '#e2bfb0'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#ffb693'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#0054d6'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c94ff'
  on-tertiary-container: '#002b76'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#dae1ff'
  tertiary-fixed-dim: '#b3c5ff'
  on-tertiary-fixed: '#001849'
  on-tertiary-fixed-variant: '#003fa4'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system is built to evoke a sense of "Vibrant Momentum"—a retail environment that feels fast, friendly, and fundamentally reliable. The core personality balances the high-energy excitement of a new purchase with the professional rigor required for secure e-commerce.

The design style leans into **Modern Minimalism** with **Airy High-Fidelity** accents. It prioritizes vast amounts of whitespace to let product imagery breathe, utilizing subtle depth cues and high-quality iconography to create a premium feel. The interface avoids unnecessary clutter, ensuring that the bright primary palette serves as a functional guide rather than a visual distraction.

## Colors
The palette is dominated by the primary orange, used strategically for "Momentum" elements—actions, notifications, and key brand touchpoints. 

- **Primary (#FF6B00):** Represents energy and the core brand identity. Used for primary CTAs and progress indicators.
- **Secondary (#121212):** A deep, near-black charcoal that provides "Grounded Trust." Used for typography and heavy structural elements.
- **Tertiary (#0066FF):** A crisp blue used sparingly for informative links or secondary validation to balance the warmth of the orange.
- **Surface & Background:** Utilizes a bright, airy white (#FFFFFF) with ultra-light grey (#F9FAFB) for section layering, maintaining a clean and spacious aesthetic.

## Typography
This design system utilizes **Plus Jakarta Sans** across all levels to maintain a modern, friendly, and geometric appearance. The typeface's open counters and optimistic curves perfectly complement the energetic brand color.

Headlines use heavy weights and slight negative letter-spacing to create a "bold retail" impact. Body text is set with generous line-height to ensure readability during long browsing sessions. Labels and UI metadata utilize medium and semi-bold weights to ensure hierarchy is maintained even at smaller scales.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid Grid**. On desktop, content is contained within a 1280px max-width 12-column grid to ensure readability. On mobile, it transitions to a fluid 2-column or 1-column layout with 20px side margins.

Spacing is based on an 8px rhythmic scale. Generous "Airy" padding (MD and LG units) is preferred between major sections to prevent the interface from feeling crowded. Vertical rhythm is strictly enforced to maintain the "Modern" clean aesthetic.

## Elevation & Depth
The design system uses **Ambient Shadows** and **Tonal Layers** to create hierarchy. Surfaces do not use harsh borders; instead, depth is defined by:

1.  **Level 0 (Background):** Solid white or #F9FAFB.
2.  **Level 1 (Cards/Containers):** Subtle, extra-diffused shadows (Opacity: 4%, Blur: 20px) with no visible border.
3.  **Level 2 (Interactive/Floating):** Slightly more pronounced shadows (Opacity: 8%, Blur: 30px) used for hover states and dropdowns.
4.  **Accent Elevation:** Important primary buttons may use a soft orange-tinted glow (shadow color derived from #FF6B00 at 20% opacity) to signify their importance.

## Shapes
The design system adopts a **Rounded** shape language to reinforce the "friendly and approachable" brand pillars. 

Standard components like input fields and buttons use a 0.5rem (8px) radius. Product cards and large containers utilize 1rem (16px) to create a softer, more modern aesthetic. For specialized "Momentum" elements like category tags or promotional bubbles, pill-shaped (full radius) containers are used to draw the eye.

## Components

### Buttons
Primary buttons are solid #FF6B00 with white text, featuring a subtle "lift" on hover. Secondary buttons use an outline style with a 1.5px border weight. Active states should involve a slight scale-down effect (98%) to provide tactile feedback.

### Input Fields
Inputs are minimal: a light grey background (#F3F4F6) that transitions to a white background with a 1.5px orange border on focus. Floating labels are used to maintain clarity without sacrificing space.

### Product Cards
Cards are the cornerstone of the e-commerce experience. They feature a 16px corner radius, no border, and a soft ambient shadow. Product images should have a slight zoom-in effect on hover to enhance the "High-Fidelity" feel.

### Chips & Tags
Used for categories and filters. They should be pill-shaped. Inactive chips have a light grey fill; active chips utilize the primary orange with white text.

### Modern Icon Set
Icons should be "Linear" with a 2px stroke weight and rounded terminals. Use a consistent icon set (like Lucide or custom-designed equivalents) to ensure the UI feels cohesive and high-end.

### Navigation Bar
The header is sticky with a "Glassmorphism" effect (backdrop-blur: 12px) to keep the user grounded while they scroll through long product listings.