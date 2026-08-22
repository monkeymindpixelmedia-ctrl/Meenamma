---
name: Meenamma
description: Cyberpunk South-Asian Neo-Traditional Micro-Savings & Partner Network
colors:
  primary: "#FFD700"
  primary-deep: "#C59B27"
  secondary: "#F59E0B"
  tertiary: "#10B981"
  bg-obsidian: "#070605"
  surface-glass: "rgba(18, 14, 10, 0.82)"
  border-gold: "rgba(212, 175, 55, 0.22)"
  text-primary: "#F5F2EB"
  text-secondary: "#A8A090"
  accent-alabaster: "#F7F7F7"
typography:
  display:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "'Outfit', -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Outfit', -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'Outfit', -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.22em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg-obsidian}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "#FFE44D"
  button-outline:
    backgroundColor: "rgba(7, 6, 5, 0.4)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card-glass:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "24px"
  input-cyber:
    backgroundColor: "rgba(7, 6, 5, 0.6)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: Meenamma

## Overview

**Creative North Star: "The Neo-Traditional Gold Vault"**

Meenamma unites ancient Tamil micro-savings ceremonies (Kudam) with cyberpunk fintech precision. The canvas is immersed in pitch obsidian night (`#070605`), evoking ancestral treasury vaults and nocturnal markets, illuminated by sharp neon gold filigree (`#FFD700`), warm earthen amber (`#F59E0B`), and deep translucent glassmorphism.

The visual pacing avoids both sterile corporate fintech minimalism and noisy crypto-slop. Interfaces are high-density, tactile, and ceremonial: ritual step selectors respond with physical spring damping, tabular numbers gleam with subtle warm radiance, and Tamil glyphs ("மீ", "மீனம்மை") anchor every interaction in living cultural memory.

**Key Characteristics:**
- Deep obsidian canvas layered with translucent amber/gold radial light cones.
- Neon gold accents applied with strict compositional discipline.
- Dual-world typography pairing editorial serif display titles with crisp sans-serif metrics and Tamil heritage glyphs.
- Tactile spring transitions with smooth physical momentum and zero jitter.

## Colors

The palette balances intense radiant gold against dark obsidian and frosted smoke glass.

### Primary
- **Neon Cyber Gold** (`#FFD700`): The primary currency of action. Used for primary CTA buttons, active Kudam step highlights, progress rings, and focal points.

### Secondary
- **Deep Temple Gold** (`#C59B27`): Supporting accent for gradient stops, secondary borders, and inactive progress segments.

### Tertiary
- **Auspicious Amber** (`#F59E0B`): Glow accents, alert highlights, and energetic radial ambient gradients.
- **Temple Emerald** (`#10B981`): Transaction success badges, verified partner checkmarks, and positive yield indicators.

### Neutral
- **Obsidian Canvas** (`#070605`): The base canvas background.
- **Glass Card Smoke** (`rgba(18, 14, 10, 0.82)`): Elevated container surface with backdrop blur.
- **Filigree Border Gold** (`rgba(212, 175, 55, 0.22)`): Hairline outlines separating surfaces.
- **Primary Text** (`#F5F2EB`): High-contrast warm off-white for body copy, titles, and values.
- **Muted Text** (`#A8A090`): Subtitles, helper notes, and unselected options.

### Named Rules
**The Rarity of Radiance Rule.** Neon Gold (`#FFD700`) must never exceed 15% of viewport area. Backgrounds and container fills must remain dark obsidian to preserve the luminosity of active elements.

**The No-Dead-Grey Rule.** Neutral surfaces and text must contain warm amber/gold undertones (`#120E0A`, `#F5F2EB`), never neutral cool steel greys.

## Typography

**Display Font:** Cormorant Garamond (with Georgia, serif fallback)  
**Body Font:** Outfit (with -apple-system, sans-serif fallback)  
**Tamil Heritage Font:** Noto Serif Tamil (with serif fallback)  
**Monospace / Numerals:** Tabular font styling with Cormorant Garamond numerals

**Character:** Sacred editorial warmth meets surgical fintech accuracy. Headings have literary poise, while labels and currency values are engineered for rapid financial parsing.

### Hierarchy
- **Display** (Weight 400, `clamp(2.25rem, 5vw, 3.75rem)`, line-height 1.1): Hero banners and ritual milestone headings.
- **Headline** (Weight 500, `clamp(1.5rem, 3vw, 2.25rem)`, line-height 1.2): Section titles and modal headers.
- **Title** (Weight 600, `1.125rem`, line-height 1.4): Card headings and partner tier titles.
- **Body** (Weight 400, `0.9375rem`, line-height 1.6): Explanatory copy, terms, and transaction descriptions (max width 65ch).
- **Label** (Weight 600, `0.6875rem`, letter-spacing `0.22em`, uppercase): Overlines, badges, table headers, and status chips.

### Named Rules
**The Tabular Rupee Rule.** All financial amounts (₹) must render with tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal layout shift during live updates.

## Layout

- **Grid Model:** 12-column responsive fluid grid on desktop (`max-w-7xl`, 80rem), shifting to a single-column 16px padded mobile stream.
- **Density:** High information density on operational surfaces (dashboard, admin PIN tables), balanced with spacious breathing room on ceremony and landing sections.
- **Spacing Rhythm:** Based on an 8px modular scale (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Sticky Navigation:** Bottom tab bar navigation for mobile viewport (`h-16`, safe-area-inset padded) and top hairline glass header on desktop.

## Elevation & Depth

Meenamma avoids heavy drop-shadows on flat shapes in favor of **translucent tonal glass layering** and **localized radiant glows**.

### Shadow Vocabulary
- **Ambient Gold Glow** (`0 0 30px -5px rgba(212, 175, 55, 0.08)`): Applied to elevated glass cards.
- **Button Cyber Glow** (`0 4px 20px rgba(255, 215, 0, 0.25)`): Applied to active primary buttons.
- **Modal Depth** (`0 30px 60px -15px rgba(0, 0, 0, 0.8)`): Applied to dialogs, sheets, and popovers.

### Named Rules
**The Glass-Before-Shadow Rule.** Depth is created through translucent glass card surfaces (`backdrop-filter: blur(28px)`) with hairline gold borders (`1px solid rgba(212, 175, 55, 0.22)`), not opaque grey dropshadows.

## Shapes

- **Radius Strategy:** Consistent 8px corners (`rounded-md` / `rounded-lg`) for interactive cards, buttons, and inputs; sharp 2px corners for editorial badges; full pill radius (`rounded-full`) for circular tags and the Kudam Mandala.
- **Corner Filigree Accent:** Subtle corner ticks (`::before` / `::after` 1px gold brackets) on signature hero panels.

## Components

### Buttons
- **Shape:** Gently rounded corners (8px radius).
- **Primary Cyber Gold:** High-contrast gradient (`linear-gradient(135deg, #FFD700 0%, #C59B27 100%)`), dark text (`#070605`), uppercase tracking (`0.22em`), font size 12px.
- **Hover / Focus:** Lighter gold shift (`#FFE44D`), `translateY(-1px)`, intensified gold glow.
- **Outline / Secondary:** Dark glass background (`rgba(7, 6, 5, 0.4)`), gold border (`1px solid rgba(212, 175, 55, 0.35)`), warm off-white text.

### Cards / Containers
- **Corner Style:** 8px radius (`border-radius: 8px`).
- **Background:** Obsidian glass (`rgba(18, 14, 10, 0.82)`), blur 28px.
- **Border:** 1px hairline gold (`rgba(212, 175, 55, 0.22)`).
- **Internal Padding:** 16px on mobile, 24px to 32px on desktop.

### Inputs / Fields
- **Style:** Deep translucent fill (`rgba(7, 6, 5, 0.6)`), 1px gold border (`rgba(212, 175, 55, 0.2)`), 8px radius, off-white text.
- **Focus State:** Radiant border shift (`#FFD700`) with diffuse inner and outer glow (`0 0 15px -3px rgba(255, 215, 0, 0.25)`).

### Status Chips & Badges
- **Gold Badge:** Translucent gold fill (`rgba(255, 215, 0, 0.08)`), 1px gold border, uppercase tracking `0.2em`, font size 9px.
- **Emerald Badge:** Translucent green fill (`rgba(16, 185, 129, 0.1)`), 1px emerald border, `#10B981` text.

### Signature Component: Kudam Savings Mandala
- Dynamic SVG mandala visualizer with concentric rotating rings, live rupee step scaling (₹1 to ₹100), and particle glow feedback upon mandate activation.

## Do's and Don'ts

### Do:
- **Do** maintain deep obsidian canvas backgrounds (`#070605`) with warm ambient lighting.
- **Do** format all currency and numerical metrics using tabular figures.
- **Do** use Tamil heritage typography ("மீ", "மீனம்மை") purposefully in brand anchors and badges.
- **Do** support full motion reduction preferences (`prefers-reduced-motion: reduce`).

### Don't:
- **Don't** use standard cool grey backgrounds or flat solid grey cards.
- **Don't** flood screens with raw neon yellow; keep accent coverage disciplined (<15%).
- **Don't** use generic stock photos or corporate vector illustration slop.
- **Don't** hide fees, mandate terms, or partner payout calculations.
