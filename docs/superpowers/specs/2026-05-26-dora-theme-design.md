# Dora the Explorer Theme — Design Spec
**Date**: 2026-05-26  
**Branch**: feature+dora  
**Theme Concept**: "Searching" — Dora explores, searches, discovers. Every interaction echoes the quest.

---

## Context

Redesign the visual theme of the USRP/Vortex control app to match Dora the Explorer's aesthetic.  
**Constraints:**
- Zero functionality changes
- Zero text label changes (nav labels, card titles, button text — all stay)
- **Only text change**: sidebar app name `USRP` → `Dora`
- Preserve all Framer Motion page transitions (update timing/style only)
- Dark mode toggle remains functional; this spec defines the **light** default

**Direction**: Sunny Storybook — warm sky backgrounds, pastel cards, illustrated decorative elements, soft bouncy interactions.

---

## 1. Color Palette

### Background Hierarchy
| Token | Hex | Usage |
|---|---|---|
| `sky-canvas` | `#E3F4FF` | App root background |
| `cream-page` | `#FFFDF0` | Card/panel background |
| `warm-fog` | `#FFF4E3` | Sidebar background |
| `cloud-white` | `#FFFFFF` | Modal, input backgrounds |

### Brand Colors (Dora Palette)
| Token | Hex | Usage |
|---|---|---|
| `dora-orange` | `#FF8C42` | Primary CTAs, active nav, key accents |
| `dora-orange-dark` | `#E06A1A` | Button shadow/border |
| `adventure-purple` | `#9B5DE5` | Secondary actions, modals, tab highlights |
| `sky-blue` | `#5BC8F5` | Active states, RX charts, links |
| `sunshine-yellow` | `#FFCA3A` | Stars, warnings, search sparkles |
| `meadow-green` | `#56C271` | Success, connected status |
| `sunset-red` | `#FF5E5B` | Error, disconnected status |

### Pastel Card Backgrounds (one per section)
| Token | Hex | Used On |
|---|---|---|
| `pastel-orange` | `#FFE8D6` | VortexPage cards |
| `pastel-purple` | `#EDE3FF` | ScanPage panels |
| `pastel-blue` | `#D9F2FF` | RxPage chart container |
| `pastel-green` | `#D8F7E4` | Scan results panel |

### Text
| Token | Hex | Usage |
|---|---|---|
| `story-ink` | `#2D2A3E` | Primary text, headings |
| `tale-gray` | `#5A5773` | Body, secondary labels |
| `whisper-gray` | `#9B97B0` | Placeholders, disabled |
| `map-brown` | `#7A5C3A` | Nav chapter labels |

### Status Colors (override existing)
- Connected → `meadow-green` `#56C271` (was emerald)
- Disconnected → `sunset-red` `#FF5E5B` (was rose)

---

## 2. Typography

Replace current fonts (`Rajdhani`, `Barlow`) with:

```
Display:  "Baloo 2" (Google Fonts, weights 600 700 800)
Body:     "Quicksand" (Google Fonts, weights 400 500 600 700)
Mono:     "JetBrains Mono" (keep, data/chart labels only)
```

Google Fonts import (add to `index.html`):
```
https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Quicksand:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap
```

### Type Scale
| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Sidebar app name | Baloo 2 | 20px | 800 | `dora-orange` |
| Page title (Topbar) | Baloo 2 | 22px | 700 | `story-ink` |
| Card title | Baloo 2 | 16px | 700 | `story-ink` |
| Nav item label | Baloo 2 | 14px | 600 | `map-brown` → `dora-orange` active |
| Body text | Quicksand | 15px | 500 | `tale-gray` |
| Button text | Baloo 2 | 14px | 600 | white/inherit |
| Table header | Quicksand | 12px | 700 | `tale-gray` uppercase |
| Table cell data | Quicksand | 14px | 500 | `story-ink` |
| Numeric data values | JetBrains Mono | 13px | 500 | `dora-orange` |
| Status/badge text | Quicksand | 11px | 700 | white |

---

## 3. Component Redesigns

### Cards (VortexPage ConfigCard, ScanPage panels)
- Background: `pastel-orange` `#FFE8D6`
- Border: `1.5px solid #FFD4A6`
- Border-radius: `20px`
- Box-shadow: `0 4px 20px rgba(255,140,66,0.12), 0 1px 4px rgba(0,0,0,0.04)`
- Top decoration: 4px strip of repeating 5px orange dots (`#FFB37A`) at top edge via pseudo-element
- Hover: `translateY(-2px)`, shadow deepens, `0.25s cubic-bezier(0.34,1.56,0.64,1)`
- Card title: Baloo 2, 16px, 700, `story-ink`
- Card section label (was tiny uppercase gray): Quicksand 11px, 700, `whisper-gray`, uppercase, letter-spacing 0.08em

### Sliders
- Track height: `8px`, border-radius `100px`
- Track gradient: `linear-gradient(90deg, #FFE8D6 0%, #FF8C42 var(--fill-pct), #E8E4F7 var(--fill-pct))`  
  *(filled orange left of thumb, lavender-gray right)*
- Thumb: `22×22px` circle, background `#FF8C42`, border `3px solid white`, shadow `0 2px 8px rgba(255,140,66,0.55)`
- Thumb hover: `scale(1.25)`, `0.2s cubic-bezier(0.34,1.56,0.64,1)`
- Numeric input (right of label): keep JetBrains Mono but recolor to `dora-orange`, background `white`, border `1.5px solid #FFD4A6`, radius `8px`

### Toggle Switch (Spectrum Invert)
- Track off: `#D8D4EC` background, `1.5px solid #C5A3F5`
- Track on: `linear-gradient(135deg, #56C271, #3DAD5A)`
- Thumb: white circle, shadow `0 2px 6px rgba(0,0,0,0.15)`
- Transition: `0.3s cubic-bezier(0.34,1.56,0.64,1)` — springy bounce

### Buttons
**Primary (save/run/connect)**
- Background: `linear-gradient(135deg, #FF8C42, #E06A1A)`
- Border-radius: `50px` (full pill)
- Shadow: `0 4px 14px rgba(255,140,66,0.40)`
- Hover: `translateY(-2px) scale(1.03)`, shadow `0 8px 22px rgba(255,140,66,0.55)`
- Font: Baloo 2, 14px, 600

**Secondary/Ghost (cancel/resume)**
- Border: `2px solid #9B5DE5`, color `#9B5DE5`
- Hover: background `rgba(155,93,229,0.08)`
- Border-radius: `50px`

**Bandwidth toggle buttons (80/160/320 MHz)**
- Replace segmented control: 3 pill buttons side by side in a `#FFFDF0` rounded container
- Active: background `#FF8C42`, text white, shadow `0 4px 14px rgba(255,140,66,0.35)`
- Inactive: background transparent, text `tale-gray`, hover: background `#FFE8D6`

### Input Fields
- Background: `#FFFFFF`
- Border: `2px solid #D8D4EC`
- Border-radius: `12px`
- Focus: border `#9B5DE5`, ring `0 0 0 3px rgba(155,93,229,0.18)`
- Font: Quicksand 14px 500

### Toast Notifications
- Success: `#D8F7E4` bg, `#56C271` border, `story-ink` text
- Error: `#FFE0E0` bg, `#FF5E5B` border
- Border-radius: `16px`
- Font: Quicksand 14px 500
- Shadow: `0 8px 24px rgba(0,0,0,0.12)`

### Modals (RunModal, ScheduleModal)
- Backdrop: `rgba(45,42,62,0.45)` + `blur(4px)`
- Background: `#FFFDF0`, border-radius `24px`, padding `32px`
- Border: `2px solid #EDE3FF`
- Shadow: `0 20px 60px rgba(155,93,229,0.25)`
- Top strip: 4px gradient `linear-gradient(90deg, #FF8C42, #FFCA3A, #56C271, #5BC8F5, #9B5DE5)`
- Enter: `scale(0.92) translateY(20px)` → final, `0.35s cubic-bezier(0.34,1.56,0.64,1)`
- Title: Baloo 2, 20px, 700, `story-ink`

---

## 4. Sidebar Redesign

### Structure
- Expanded width: `240px` (was 220px)
- Collapsed width: `64px` (unchanged)
- Background: `#FFF4E3` (warm-fog)
- Right border: `2px solid #FFE4C4`
- Shadow: `4px 0 20px rgba(255,140,66,0.10)`

### Header Area
- App name (was "USRP"): **"Dora"** — Baloo 2, 22px, 800, `#FF8C42`
- Icon: a magnifying glass 🔍 (SVG, 24px, `#FF8C42`) — **Searching theme icon**
- Section label "Workspace" → stays as-is but restyled: Quicksand, 10px, 700, `whisper-gray`

### Nav Items
- Container: `44px` tall, `margin: 3px 10px`, border-radius `14px`
- Default: background transparent, text `map-brown`
- Hover: background `rgba(255,140,66,0.10)`, `translateX(2px)`, `0.15s ease`
- Active: background `linear-gradient(135deg, #FFE8D6, #FFD4A6)`, left `3px solid #FF8C42`, text `#FF8C42`
- Icons stay as-is (⚡ ⊞ ◈) but get colored on active state

**Searching motif — map trail dots**: a vertical dotted line (`border-left: 2px dashed #FFD4A6`) connects nav items along the left side — like a map trail showing the adventure path. The active item's dot is filled orange.

### Status Pill (bottom)
- Connected:
  - Background `#D8F7E4`, border `1.5px solid #56C271`
  - Icon: ☀️ sun SVG (18px, `#FFCA3A`) with `sun-pulse` animation
  - Text: version string, Quicksand 12px 700, `#1F7A3D`
- Disconnected:
  - Background `#FFE0E0`, border `1.5px solid #FF5E5B`
  - Icon: 🔍 magnifying glass spinning/scanning — **Searching theme**
  - Text: "Disconnected", `#B03030`
  - Animation: `searching-spin` — magnifying glass rotates 360° slowly with a slight bounce, `2s cubic-bezier(0.34,1.56,0.64,1) infinite`

---

## 5. Topbar Redesign

- Background: `#FFFDF0`
- Border-bottom: `1.5px solid #F0EBD8`
- Shadow: `0 2px 12px rgba(0,0,0,0.05)`
- Title: Baloo 2, 22px, 700, `story-ink`
- Three yellow dots (`#FFCA3A`, 6px each, 4px gap) decorating left of title
- ThemeToggle button: pill `78×30px`, `#E3F4FF` bg, sun/moon icons, white circle slides to active icon

---

## 6. HeroPage Redesign

### Background
- Gradient: `radial-gradient(ellipse at 50% 0%, #B8E4FF 0%, #E3F4FF 50%, #D8F7E4 100%)`
- Bottom strip (ground): `18%` height, `linear-gradient(180deg, #D8F7E4, #B0ECC5)`, rounded top corners
- Replace WaveCanvas with illustrated CSS/SVG landscape:
  - 2 floating clouds (white, `box-shadow` styling, float animation)
  - 2 rounded-top trees at edges (pure CSS or inline SVG, greens `#56C271` / `#3DAD5A`)
  - 5 small flowers in ground strip (alternating `#FF8C42`, `#FFCA3A`, `#FF5E5B`)
  - 6 sparkle stars scattered in sky (`#FFCA3A`, twinkle animation)

### Center Card
- Width: `min(440px, 90vw)`, border-radius `28px`
- Background: `#FFFDF0`
- Border: `2px solid #FFD4A6`
- Shadow: `0 16px 48px rgba(255,140,66,0.22)`
- Top banner: 5px strip of rainbow gradient
- Entrance: `opacity:0, translateY(40px), scale(0.95)` → final, `0.6s cubic-bezier(0.34,1.56,0.64,1)`, delay `0.2s`

**Card contents** (same as current, restyled):
- Logo mark: magnifying glass SVG (48px, `#FF8C42`) with glow `drop-shadow(0 0 12px rgba(255,140,66,0.5))` — **Searching icon**
- Title: "USRP Control" stays as text — Baloo 2, clamp(36px,6vw,48px), 800, `#FF8C42`
- Tagline: stays — Quicksand, 15px, 500, `tale-gray`
- Status line: ☀️ icon when online, 🔍 spinning when offline — Quicksand 12px
- Connect button: primary pill style, text "Connect" stays, with magnifying-glass spark animation on click
- Connecting state: 🔍 magnifying glass sweeping animation instead of spinner

---

## 7. VortexPage Redesign

### Layout
- Background: `sky-canvas` `#E3F4FF`
- Cards same 2×2 grid, gap `20px`

### Cards
- Apply global card style: `pastel-orange` bg, dotted top strip, `20px` radius
- Card titles keep existing text, just restyled to Baloo 2 700
- The `resumed` warning banner: `#FFF6CC` bg, `#FFCA3A` border, Quicksand 14px, `#7A5C3A` text, `20px` radius

### Action Buttons (Save to Flash / Resume Control)
- "Save to Flash": primary orange pill
- "Resume Control": purple pill (`#9B5DE5` bg, white text)

---

## 8. ScanPage Redesign

- Background: `sky-canvas`
- DeviceStatePanel: `pastel-purple` `#EDE3FF` bg, `2px solid #C5A3F5` border, `16px` radius
- Toolbar buttons: keep text, restyle to pill shape, orange primary + ghost variants
- ScanTable: `cream-page` bg, `20px` radius, header row `pastel-orange`, row hover `#FFF4E3`
- Results panel: `pastel-green` bg
- Modals: global modal spec above
- Import success badge: `pastel-blue` bg, `sky-blue` border

---

## 9. RxPage Redesign

### Tab Bar
- Container: `#FFFDF0` bg, `1.5px solid #E8D8C4`, `14px` radius, `6px` padding
- Active tab: `linear-gradient(135deg, #5BC8F5, #3BA8D5)`, white text, shadow `0 4px 12px rgba(91,200,245,0.45)`
- Tab sliding indicator: floating `#5BC8F5` bg pill that translates between positions

### Chart Container
- Outer: `pastel-blue` `#D9F2FF`, `20px` radius, `1.5px solid #9ADFF5`
- Inner chart canvas: stays dark (`#111827`) — chart colors unchanged
- Add `12px` radius to the canvas div

### Controls
- Freeze/Resume button: keeps text, restyled — Freeze = purple pill, Resume = orange pill
- Status chip: "Live" = `meadow-green` badge, "Silence/Done" = gray, "Error" = `sunset-red`
- Connecting/streaming states: "Searching…" dot for connecting state (Searching theme)

---

## 10. Animations

### New keyframes to add to `index.css`
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
@keyframes sway {
  0%   { transform: rotate(-6deg); }
  100% { transform: rotate(6deg); }
}
@keyframes twinkle {
  0%   { opacity: 0.3; transform: scale(0.8); }
  100% { opacity: 1;   transform: scale(1.1); }
}
@keyframes sun-pulse {
  0%, 100% { filter: drop-shadow(0 0 3px #FFCA3A); }
  50%       { filter: drop-shadow(0 0 9px #FFCA3A); }
}
@keyframes searching-spin {
  0%   { transform: rotate(0deg); }
  80%  { transform: rotate(340deg); }
  100% { transform: rotate(360deg); }
}
@keyframes dora-bounce-in {
  0%   { opacity: 0; transform: translateY(32px) scale(0.92); }
  60%  { opacity: 1; transform: translateY(-6px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}
```

### Tailwind animation tokens to add
```js
'float':          'float 6s ease-in-out infinite',
'float-slow':     'float 8s ease-in-out 2s infinite',
'sway':           'sway 3s ease-in-out infinite alternate',
'twinkle':        'twinkle 2.5s ease-in-out infinite alternate',
'sun-pulse':      'sun-pulse 2s ease-in-out infinite',
'searching':      'searching-spin 2s cubic-bezier(0.34,1.56,0.64,1) infinite',
'dora-bounce-in': 'dora-bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
```

---

## 11. Tailwind Config Changes

### Colors to add under `theme.extend.colors`
```js
'sky-canvas':     '#E3F4FF',
'cream-page':     '#FFFDF0',
'warm-fog':       '#FFF4E3',
'dora-orange':    '#FF8C42',
'dora-orange-dark':'#E06A1A',
'adventure-purple':'#9B5DE5',
'sky-blue-dora':  '#5BC8F5',
'sunshine':       '#FFCA3A',
'meadow-green':   '#56C271',
'sunset-red':     '#FF5E5B',
'story-ink':      '#2D2A3E',
'tale-gray':      '#5A5773',
'whisper-gray':   '#9B97B0',
'map-brown':      '#7A5C3A',
'pastel-orange':  '#FFE8D6',
'pastel-purple':  '#EDE3FF',
'pastel-blue':    '#D9F2FF',
'pastel-green':   '#D8F7E4',
```

### Font families (replace existing)
```js
display: ['"Baloo 2"', 'cursive'],
body:    ['Quicksand', 'sans-serif'],
mono:    ['"JetBrains Mono"', 'monospace'],
```

### Box shadows to add
```js
'dora-card':        '0 4px 20px rgba(255,140,66,0.12), 0 1px 4px rgba(0,0,0,0.04)',
'dora-card-hover':  '0 8px 32px rgba(255,140,66,0.22)',
'dora-btn':         '0 4px 14px rgba(255,140,66,0.40)',
'dora-btn-hover':   '0 8px 22px rgba(255,140,66,0.55)',
'dora-purple-btn':  '0 4px 14px rgba(155,93,229,0.40)',
'dora-modal':       '0 20px 60px rgba(155,93,229,0.25)',
'dora-sidebar':     '4px 0 20px rgba(255,140,66,0.10)',
'dora-hero':        '0 16px 48px rgba(255,140,66,0.22)',
'dora-thumb':       '0 2px 8px rgba(255,140,66,0.55)',
'tab-active':       '0 4px 12px rgba(91,200,245,0.45)',
```

---

## 12. Files to Modify

| File | Changes |
|---|---|
| `index.html` | Add Google Fonts link |
| `tailwind.config.js` | New colors, fonts, shadows, animations, keyframes |
| `src/index.css` | New keyframe definitions, scrollbar colors, slider thumb, range input |
| `src/components/Sidebar.tsx` | Full visual restyle + "Dora" name + search icon + map trail dots + status pill redesign |
| `src/components/Topbar.tsx` | Restyle: cream bg, Baloo 2 title, dot decoration, pill theme toggle |
| `src/components/Toast.tsx` | Restyle: pastel-bg variants, rounded 16px |
| `src/features/hero/HeroPage.tsx` | Replace WaveCanvas with CSS landscape, restyle card, add illustrated elements |
| `src/features/hero/WaveCanvas.tsx` | Delete or replace with CSS-only decorative element |
| `src/features/vortex/VortexPage.tsx` | Restyle cards, sliders, buttons, resumed banner |
| `src/features/scan/ScanPage.tsx` | Restyle toolbar, panels, DeviceStatePanel |
| `src/features/scan/ScanTable.tsx` | Restyle table header/rows/hover |
| `src/features/rx/RxPage.tsx` | Restyle tab bar, chart container, controls |

---

## 13. Verification

1. Run `npm run dev` — app loads, all pages render
2. Navigate all 3 routes: Vortex, Scan, RX — no layout breaks
3. VortexPage: all sliders functional, BW toggle works, save/resume buttons work
4. ScanPage: table, modals, import/export all functional
5. RxPage: tab switching works, freeze/resume works, charts render
6. HeroPage: connect flow works, animated landscape visible
7. Sidebar: collapse/expand works, nav highlighting correct
8. Theme toggle: dark mode still works (dark mode styles in each component need to be preserved or adapted)
9. No TypeScript errors (`npm run build`)
