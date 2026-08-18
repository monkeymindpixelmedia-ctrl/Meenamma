# Design System

<!-- impeccable:design-schema 1 -->

## Visual Identity

Cyberpunk / South-Asian Neo-Traditional. Deep obsidian dark canvas contrast against neon gold filigree, electric amber accents, translucent glassmorphism, and responsive Tamil typography ("மீ").

## Color Strategy

Drenched dark canvas (`#070605` background, `#120E0A` glass cards) with neon gold accents (`#FFD700`, `#E6B800`) and warm amber glow (`#F59E0B`).

| Role | Token | Hex / Value |
|---|---|---|
| Background Canvas | `--color-bg-obsidian` | `#070605` |
| Glass Surface | `--color-glass` | `rgba(20, 16, 12, 0.75)` |
| Neon Gold Accent | `--color-gold-neon` | `#FFD700` |
| Deep Gold | `--color-gold-deep` | `#C59B27` |
| Muted Gold / Text | `--color-gold-muted` | `#997A20` |
| Text Primary | `--color-text-primary` | `#F5F2EB` |
| Text Secondary | `--color-text-secondary` | `#A8A090` |
| Border Glass | `--color-border-gold` | `rgba(212, 175, 55, 0.25)` |

## Typography

- Display / Headings: Serif (`font-serif` / Playfair Display / Georgia) paired with Tamil Heritage typography ("மீனம்மை")
- Numbers & Metrics: Tabular Monospace (`font-mono`) with high-contrast glowing tracking
- Labels & Subtitles: Uppercase Monospace with `letter-spacing: 0.35em`

## Micro-Interactions & Motion

- Spring animations (`framer-motion`) with Emil Kowalski ease `[0.16, 1, 0.3, 1]`
- Interactive Live Kudam Savings Simulator with dynamic SVG mandala rotation & step scaling
- Translucent glassmorphism with `backdrop-filter: blur(16px)` and subtle gold outline highlights
