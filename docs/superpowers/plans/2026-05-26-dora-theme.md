# Dora Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the app's visual theme to Dora the Explorer "Searching" aesthetic — warm sky colors, pastel cards, illustrated hero, bouncy animations — without touching any functionality or text labels (except `USRP` → `Dora`).

**Architecture:** Pure visual reskin — replace Tailwind classes, CSS variables, font imports, and component markup only. All state, hooks, API calls, and routing stay unchanged. Light mode gets the full Dora treatment; dark mode keeps its existing palette.

**Tech Stack:** React 18 + TypeScript strict, TailwindCSS, Framer Motion, Google Fonts (Baloo 2, Quicksand)

---

## File Map

| File | Change |
|---|---|
| `index.html` | Title → "Dora", swap font imports, remove `class="dark"` from html |
| `tailwind.config.js` | Add Dora colors, fonts, shadows, animations, keyframes |
| `src/index.css` | Add keyframes, update scrollbar + slider thumb for light theme |
| `src/components/Sidebar.tsx` | Full visual restyle |
| `src/components/Topbar.tsx` | Full visual restyle |
| `src/components/ThemeToggle.tsx` | Restyle pill toggle |
| `src/components/Toast.tsx` | Pastel backgrounds, rounded corners |
| `src/features/hero/DoraSkyCanvas.tsx` | **NEW** — CSS illustrated landscape (replaces WaveCanvas) |
| `src/features/hero/WaveCanvas.tsx` | No change — just stop importing it |
| `src/features/hero/HeroPage.tsx` | Use DoraSkyCanvas, restyle card |
| `src/features/vortex/VortexPage.tsx` | Restyle cards, sliders, buttons |
| `src/features/scan/ScanPage.tsx` | Restyle toolbar, DeviceStatePanel, modals |
| `src/features/scan/ScanTable.tsx` | Restyle header, rows, cells |
| `src/features/rx/RxPage.tsx` | Restyle tab bar, chart container, controls |
| `src/App.tsx` | Root background `bg-gray-50` → `bg-sky-canvas` |

---

## Task 1: Foundation — index.html + Tailwind Config

**Files:**
- Modify: `index.html`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Update index.html**

Replace the entire file:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dora</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Quicksand:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Note: removed `class="dark"` so light mode (Dora theme) is the default.

- [ ] **Step 2: Replace tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // existing dark-mode base colors — keep for dark: classes
        base: {
          950: '#030712',
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
        },
        // Dora light-mode backgrounds
        'sky-canvas':  '#E3F4FF',
        'cream-page':  '#FFFDF0',
        'warm-fog':    '#FFF4E3',
        // Dora brand colors
        'dora-orange':      '#FF8C42',
        'dora-orange-dark': '#E06A1A',
        'adv-purple':       '#9B5DE5',
        'adv-purple-dark':  '#7B3FC8',
        'sky-blue-d':       '#5BC8F5',
        'sunshine':         '#FFCA3A',
        'meadow-green':     '#56C271',
        'meadow-green-dk':  '#3DAD5A',
        'sunset-red':       '#FF5E5B',
        // Dora pastel card backgrounds
        'pastel-orange': '#FFE8D6',
        'pastel-purple': '#EDE3FF',
        'pastel-blue':   '#D9F2FF',
        'pastel-green':  '#D8F7E4',
        // Dora text colors
        'story-ink':    '#2D2A3E',
        'tale-gray':    '#5A5773',
        'whisper-gray': '#9B97B0',
        'map-brown':    '#7A5C3A',
        // keep existing cyan/violet for dark mode chart usage
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        violet: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body:    ['Quicksand', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        // keep existing glow shadows for dark mode
        'glow-cyan':   '0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.15)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15)',
        'glow-sm':     '0 0 8px rgba(34,211,238,0.25)',
        // Dora shadows
        'dora-card':       '0 4px 20px rgba(255,140,66,0.12), 0 1px 4px rgba(0,0,0,0.04)',
        'dora-card-hover': '0 8px 32px rgba(255,140,66,0.22)',
        'dora-btn':        '0 4px 14px rgba(255,140,66,0.40)',
        'dora-btn-hover':  '0 8px 22px rgba(255,140,66,0.55)',
        'dora-purple-btn': '0 4px 14px rgba(155,93,229,0.40)',
        'dora-modal':      '0 20px 60px rgba(155,93,229,0.25)',
        'dora-sidebar':    '4px 0 20px rgba(255,140,66,0.10)',
        'dora-hero':       '0 16px 48px rgba(255,140,66,0.22)',
        'dora-thumb':      '0 2px 8px rgba(255,140,66,0.55)',
        'tab-active-d':    '0 4px 12px rgba(91,200,245,0.45)',
      },
      animation: {
        'pulse-slow':     'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':        'fadeIn 0.6s ease forwards',
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'float 8s ease-in-out 2s infinite',
        'sway':           'sway 3s ease-in-out infinite alternate',
        'twinkle':        'twinkle 2.5s ease-in-out infinite alternate',
        'sun-pulse':      'sunPulse 2s ease-in-out infinite',
        'searching':      'searchingSpin 2s cubic-bezier(0.34,1.56,0.64,1) infinite',
        'dora-bounce-in': 'doraBounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        sway: {
          '0%':   { transform: 'rotate(-6deg)' },
          '100%': { transform: 'rotate(6deg)' },
        },
        twinkle: {
          '0%':   { opacity: '0.3', transform: 'scale(0.8)' },
          '100%': { opacity: '1',   transform: 'scale(1.1)' },
        },
        sunPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 3px #FFCA3A)' },
          '50%':      { filter: 'drop-shadow(0 0 9px #FFCA3A)' },
        },
        searchingSpin: {
          '0%':   { transform: 'rotate(0deg)' },
          '80%':  { transform: 'rotate(340deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        doraBounceIn: {
          '0%':   { opacity: '0', transform: 'translateY(32px) scale(0.92)' },
          '60%':  { opacity: '1', transform: 'translateY(-6px) scale(1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Start dev server and confirm it loads**

```bash
npm run dev
```

Expected: browser opens, app loads (may look broken/unstyled temporarily — that's fine).

- [ ] **Step 4: Update App.tsx root background**

In `src/App.tsx`, change the AppShell div:

```tsx
// Change: dark:bg-base-950 bg-gray-50
// To:
<div className="flex h-screen w-screen overflow-hidden dark:bg-base-950 bg-sky-canvas">
```

- [ ] **Step 5: Commit**

```bash
git add index.html tailwind.config.js src/App.tsx
git commit -m "feat(dora): add font imports, Tailwind Dora tokens, and root bg color"
```

---

## Task 2: Global CSS — Keyframes + Scrollbar + Slider

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after { box-sizing: border-box; }

  html, body, #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    font-family: 'Quicksand', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom range slider */
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #FF8C42;
    border: 3px solid #ffffff;
    box-shadow: 0 2px 8px rgba(255,140,66,0.55);
    cursor: pointer;
    position: relative;
    z-index: 1;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.25);
  }
  input[type='range']:disabled::-webkit-slider-thumb {
    background: #D8D4EC;
    border-color: #E8E4F7;
    box-shadow: none;
  }
  /* dark mode slider thumb */
  .dark input[type='range']::-webkit-slider-thumb {
    background: #22d3ee;
    border-color: #111827;
    box-shadow: 0 0 8px rgba(34,211,238,0.5);
  }
  .dark input[type='range']:disabled::-webkit-slider-thumb {
    background: #374151;
    box-shadow: none;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,140,66,0.25); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,140,66,0.45); }
  .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
  .dark ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

  /* Plotly overrides */
  .js-plotly-plot .plotly .modebar { display: none !important; }
}

@layer utilities {
  /* Legacy dark-mode background utilities (keep for dark: classes) */
  .bg-base-950 { background-color: #030712; }
  .bg-base-900 { background-color: #111827; }
  .bg-base-800 { background-color: #1f2937; }
  .bg-base-700 { background-color: #374151; }

  .border-white\/8  { border-color: rgba(255,255,255,0.08); }
  .bg-radial-\[ellipse_at_center\] { background-image: radial-gradient(ellipse at center, var(--tw-gradient-stops)); }

  .font-display { font-family: 'Baloo 2', cursive; }
  .font-mono    { font-family: 'JetBrains Mono', monospace; }
  .font-body    { font-family: 'Quicksand', sans-serif; }

  /* Legacy glow shadows for dark mode */
  .shadow-glow-cyan   { box-shadow: 0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.15); }
  .shadow-glow-violet { box-shadow: 0 0 20px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15); }
  .shadow-glow-sm     { box-shadow: 0 0 8px rgba(34,211,238,0.25); }

  .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4,0,0.6,1) infinite; }
}
```

- [ ] **Step 2: Verify dev server still compiles with no errors**

Check browser console — should be no Tailwind/CSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(dora): update global CSS keyframes and slider/scrollbar styles"
```

---

## Task 3: Sidebar Redesign

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Replace Sidebar.tsx**

```tsx
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '@/api/vortex'

type NavItem = { to: string; label: string; icon: string }

const navItems: NavItem[] = [
  { to: '/vortex', label: 'Vortex Config', icon: '⚡' },
  { to: '/config', label: 'Scan Table',    icon: '⊞' },
  { to: '/rx',     label: 'RX Graphs',     icon: '◈' },
]

// Magnifying-glass SVG — the "Searching" motif
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

// Sun icon for connected status
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const { data, isError } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    refetchInterval: 5000,
    retry: false,
  })

  const connected = !isError && !!data

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 h-full flex flex-col bg-warm-fog dark:bg-base-900 border-r border-[#FFE4C4] dark:border-white/[0.07] shadow-dora-sidebar dark:shadow-none overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#FFE4C4] dark:border-white/[0.07] min-h-[60px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <SearchIcon className="w-5 h-5 text-dora-orange flex-shrink-0" />
            <span className="font-display font-extrabold text-xl text-dora-orange dark:text-cyan-400 whitespace-nowrap">
              Dora
            </span>
          </div>
        )}
        {collapsed && (
          <SearchIcon className="w-6 h-6 text-dora-orange dark:text-cyan-400 mx-auto" />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-base-800 border border-[#FFD4A6] dark:border-white/10 text-dora-orange dark:text-[#9ca3af] hover:border-dora-orange dark:hover:text-cyan-400 shadow-sm transition-colors ml-auto flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-sm">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-body font-bold tracking-[0.12em] uppercase text-whisper-gray dark:text-[#4b5563]">
            Workspace
          </span>
        </div>
      )}

      {/* Nav — map trail container */}
      <nav className="flex-1 py-2 flex flex-col gap-0.5 px-2 relative">
        {/* Map trail dotted line (light mode only, expanded) */}
        {!collapsed && (
          <div
            className="absolute left-[22px] top-3 bottom-3 w-0 dark:hidden"
            style={{ borderLeft: '2px dashed #FFD4A6' }}
          />
        )}

        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-[9px] rounded-[14px] text-[14px] font-display font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-pastel-orange to-[#FFD4A6] text-dora-orange border-l-[3px] border-dora-orange dark:bg-cyan-400/10 dark:text-cyan-400 dark:border dark:border-cyan-400/20'
                  : 'text-map-brown dark:text-[#9ca3af] hover:bg-[rgba(255,140,66,0.10)] dark:hover:bg-white/5 hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Map trail dot (light mode) */}
                {!collapsed && (
                  <span
                    className={`absolute left-[-6px] w-3 h-3 rounded-full border-2 dark:hidden flex-shrink-0 ${
                      isActive
                        ? 'bg-dora-orange border-dora-orange'
                        : 'bg-white border-[#FFD4A6]'
                    }`}
                    style={{ top: '50%', transform: 'translateY(-50%)' }}
                  />
                )}
                <span className={`text-base flex-shrink-0 w-5 text-center z-10 ${
                  isActive ? 'text-dora-orange dark:text-cyan-400' : ''
                }`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden z-10">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status pill */}
      <div className="px-3 py-4 border-t border-[#FFE4C4] dark:border-white/[0.07]">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-[14px] text-xs font-body font-bold ${
            connected
              ? 'bg-pastel-green border border-meadow-green/40 text-meadow-green-dk dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400'
              : 'bg-[#FFE0E0] border border-sunset-red/40 text-[#B03030] dark:bg-rose-500/10 dark:border dark:border-rose-500/20 dark:text-rose-400'
          }`}
        >
          {connected ? (
            <SunIcon className="w-4 h-4 flex-shrink-0 animate-sun-pulse text-sunshine dark:text-emerald-400" />
          ) : (
            <SearchIcon className="w-4 h-4 flex-shrink-0 animate-searching text-sunset-red dark:text-rose-400" />
          )}
          {!collapsed && (
            <span className="whitespace-nowrap">
              {connected ? `v${data?.version}` : 'Disconnected'}
            </span>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
```

- [ ] **Step 2: Run dev server, navigate to any page, verify sidebar renders**

Expected: warm cream sidebar, "Dora" in orange, map trail dots visible, magnifying-glass icon.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(dora): restyle Sidebar with Dora theme and searching motifs"
```

---

## Task 4: Topbar + ThemeToggle Redesign

**Files:**
- Modify: `src/components/Topbar.tsx`
- Modify: `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Replace Topbar.tsx**

```tsx
import { ThemeToggle } from './ThemeToggle'

type TopbarProps = { title: string }

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page dark:bg-base-900 shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      <div className="flex items-center gap-3">
        {/* Three decorative dots */}
        <div className="flex gap-1 dark:hidden">
          {['#FFCA3A', '#FF8C42', '#56C271'].map(c => (
            <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <h1 className="font-display font-bold text-[22px] text-story-ink dark:text-[#f9fafb] tracking-tight">
          {title}
        </h1>
      </div>
      <ThemeToggle />
    </header>
  )
}
```

- [ ] **Step 2: Replace ThemeToggle.tsx**

```tsx
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center gap-1.5 rounded-full px-1.5 py-1.5 text-xs font-body font-semibold border transition-all duration-200 hover:opacity-80 focus:outline-none bg-[#E3F4FF] dark:bg-base-800 border-[#C5DFF0] dark:border-white/[0.10] relative w-[80px] h-[32px]"
    >
      {/* Sliding selector */}
      <div
        className={`absolute top-1 w-[28px] h-[24px] rounded-full bg-white dark:bg-base-700 shadow-sm transition-all duration-200 ${
          isDark ? 'left-[46px]' : 'left-[2px]'
        }`}
      />
      {/* Sun */}
      <span className={`relative z-10 ml-1 text-base transition-colors ${!isDark ? 'text-sunshine' : 'text-[#6b7280]'}`}>
        ☀️
      </span>
      {/* Moon */}
      <span className={`relative z-10 ml-auto mr-1 text-base transition-colors ${isDark ? 'text-cyan-400' : 'text-[#9ca3af]'}`}>
        🌙
      </span>
    </button>
  )
}
```

- [ ] **Step 3: Verify topbar renders on Vortex, Scan, and RX pages**

Expected: cream background, three dots, Baloo 2 title, sun/moon pill toggle.

- [ ] **Step 4: Commit**

```bash
git add src/components/Topbar.tsx src/components/ThemeToggle.tsx
git commit -m "feat(dora): restyle Topbar and ThemeToggle with Dora theme"
```

---

## Task 5: Toast Redesign

**Files:**
- Modify: `src/components/Toast.tsx`

- [ ] **Step 1: Replace only the `colors` map and container classes in Toast.tsx**

Replace the `colors` constant and the toast `className` in the motion.div:

```tsx
import { createContext, use, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return use(ToastContext)
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

const colors: Record<ToastType, string> = {
  success: 'bg-pastel-green  border-meadow-green/50  text-meadow-green-dk dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-400',
  error:   'bg-[#FFE0E0]     border-sunset-red/50    text-[#B03030]       dark:bg-rose-500/10    dark:border-rose-500/50    dark:text-rose-400',
  warning: 'bg-[#FFF6CC]     border-sunshine/60      text-[#7A5C3A]       dark:bg-amber-500/10   dark:border-amber-500/50   dark:text-amber-400',
  info:    'bg-pastel-blue   border-sky-blue-d/50    text-[#1A6A8A]       dark:bg-cyan-500/10    dark:border-cyan-500/50    dark:text-cyan-400',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-dora-card font-body text-sm min-w-64 pointer-events-auto ${colors[t.type]}`}
            >
              <span className="text-base font-bold">{icons[t.type]}</span>
              <span className="text-story-ink dark:text-gray-200 font-body">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}
```

- [ ] **Step 2: Trigger a toast to verify**

Navigate to `/config`, click "Validate" — a toast should appear with the new pastel styling.

- [ ] **Step 3: Commit**

```bash
git add src/components/Toast.tsx
git commit -m "feat(dora): restyle Toast notifications with pastel Dora palette"
```

---

## Task 6: DoraSkyCanvas — CSS Illustrated Hero Background

**Files:**
- Create: `src/features/hero/DoraSkyCanvas.tsx`

- [ ] **Step 1: Create DoraSkyCanvas.tsx**

```tsx
// Pure CSS illustrated landscape — replaces WaveCanvas on the HeroPage.
// No canvas API, no animation frame — just CSS animations.
export function DoraSkyCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* Sky gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #B8E4FF 0%, #E3F4FF 55%, #D8F7E4 100%)',
        }}
      />

      {/* Sparkle stars */}
      {[
        { top: '8%',  left: '12%', delay: '0s',    size: '14px', color: '#FFCA3A' },
        { top: '14%', left: '72%', delay: '0.8s',  size: '10px', color: '#FFCA3A' },
        { top: '22%', left: '88%', delay: '1.6s',  size: '12px', color: '#FFCA3A' },
        { top: '6%',  left: '45%', delay: '2.4s',  size: '8px',  color: '#FFFFFF' },
        { top: '30%', left: '28%', delay: '1.2s',  size: '10px', color: '#FFCA3A' },
        { top: '18%', left: '58%', delay: '3.2s',  size: '8px',  color: '#FFFFFF' },
      ].map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle"
          style={{
            top: s.top, left: s.left,
            animationDelay: s.delay,
            fontSize: s.size,
            color: s.color,
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      ))}

      {/* Cloud 1 — large, left */}
      <div
        className="absolute animate-float"
        style={{ top: '8%', left: '6%', animationDelay: '0s' }}
      >
        <CloudShape width={180} />
      </div>

      {/* Cloud 2 — medium, center-right */}
      <div
        className="absolute animate-float-slow"
        style={{ top: '5%', left: '58%', animationDelay: '2s' }}
      >
        <CloudShape width={130} />
      </div>

      {/* Cloud 3 — small, far right */}
      <div
        className="absolute animate-float"
        style={{ top: '12%', right: '4%', animationDelay: '4s' }}
      >
        <CloudShape width={90} />
      </div>

      {/* Ground strip */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '22%',
          background: 'linear-gradient(180deg, #D8F7E4 0%, #B0ECC5 100%)',
          borderRadius: '60% 60% 0 0 / 30px 30px 0 0',
        }}
      />

      {/* Tree left */}
      <div className="absolute bottom-[18%] left-[4%]">
        <TreeShape height={130} />
      </div>
      <div className="absolute bottom-[18%] left-[9%]">
        <TreeShape height={100} />
      </div>

      {/* Tree right */}
      <div className="absolute bottom-[18%] right-[5%]">
        <TreeShape height={140} />
      </div>

      {/* Flowers in ground strip */}
      {[
        { left: '18%', color: '#FF8C42', delay: '0s'   },
        { left: '32%', color: '#FFCA3A', delay: '0.4s' },
        { left: '48%', color: '#FF5E5B', delay: '0.8s' },
        { left: '62%', color: '#9B5DE5', delay: '0.2s' },
        { left: '76%', color: '#FF8C42', delay: '0.6s' },
      ].map((f, i) => (
        <div
          key={i}
          className="absolute animate-sway"
          style={{
            bottom: '19%',
            left: f.left,
            animationDelay: f.delay,
            transformOrigin: 'bottom center',
          }}
        >
          <FlowerShape color={f.color} />
        </div>
      ))}
    </div>
  )
}

function CloudShape({ width }: { width: number }) {
  const h = width * 0.42
  return (
    <div
      style={{
        width,
        height: h,
        background: '#FFFFFF',
        borderRadius: '50%',
        boxShadow: `
          ${width * 0.22}px ${h * 0.15}px 0 ${width * -0.05}px #FFFFFF,
          ${width * 0.55}px ${h * 0.1}px  0 ${width * -0.08}px #FFFFFF,
          0 ${h * 0.3}px   ${width * 0.12}px rgba(200,230,255,0.5)
        `,
        opacity: 0.92,
      }}
    />
  )
}

function TreeShape({ height }: { height: number }) {
  const trunkW = height * 0.14
  const crownR = height * 0.38
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Crown */}
      <div
        style={{
          width: crownR * 2,
          height: crownR * 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #6ED882, #3DAD5A)',
          boxShadow: '0 4px 12px rgba(61,173,90,0.35)',
          marginBottom: -crownR * 0.4,
        }}
      />
      {/* Trunk */}
      <div
        style={{
          width: trunkW,
          height: height * 0.32,
          background: 'linear-gradient(180deg, #8B6340, #6B4A28)',
          borderRadius: `0 0 ${trunkW * 0.4}px ${trunkW * 0.4}px`,
        }}
      />
    </div>
  )
}

function FlowerShape({ color }: { color: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      {/* Stem */}
      <line x1="10" y1="12" x2="10" y2="24" stroke="#56C271" strokeWidth="2.5" strokeLinecap="round" />
      {/* Petals */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <ellipse
          key={i}
          cx={10 + 5 * Math.cos((deg - 90) * Math.PI / 180)}
          cy={6  + 5 * Math.sin((deg - 90) * Math.PI / 180)}
          rx="3.5"
          ry="2"
          fill={color}
          opacity="0.9"
          transform={`rotate(${deg}, ${10 + 5 * Math.cos((deg - 90) * Math.PI / 180)}, ${6 + 5 * Math.sin((deg - 90) * Math.PI / 180)})`}
        />
      ))}
      {/* Center */}
      <circle cx="10" cy="6" r="3" fill="#FFCA3A" />
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/hero/DoraSkyCanvas.tsx
git commit -m "feat(dora): add DoraSkyCanvas CSS illustrated landscape component"
```

---

## Task 7: HeroPage Redesign

**Files:**
- Modify: `src/features/hero/HeroPage.tsx`

- [ ] **Step 1: Replace HeroPage.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DoraSkyCanvas } from './DoraSkyCanvas'
import { fetchConfig } from '@/api/vortex'
import { useQuery } from '@tanstack/react-query'

type ConnectState = 'idle' | 'connecting' | 'success'

// Magnifying-glass SVG — Searching motif
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

export function HeroPage() {
  const navigate = useNavigate()
  const [connectState, setConnectState] = useState<ConnectState>('idle')

  const { data, isError } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    retry: 1,
    refetchInterval: false,
  })

  const online = !isError && !!data

  async function handleConnect() {
    setConnectState('connecting')
    await new Promise(r => setTimeout(r, 900))
    setConnectState('success')
    await new Promise(r => setTimeout(r, 500))
    navigate('/vortex')
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-canvas">
      <DoraSkyCanvas />

      {/* Center card */}
      <div className="absolute inset-0 flex items-center justify-center p-6" style={{ paddingBottom: '10%' }}>
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          className="relative w-full max-w-[440px]"
        >
          {/* Rainbow banner top */}
          <div
            className="absolute top-0 left-0 right-0 h-[5px] rounded-t-[28px]"
            style={{ background: 'linear-gradient(90deg, #FF8C42, #FFCA3A, #56C271, #5BC8F5, #9B5DE5)' }}
          />

          {/* Card body */}
          <div className="rounded-[28px] border-2 border-[#FFD4A6] bg-cream-page shadow-dora-hero pt-8 pb-8 px-10">

            {/* Logo mark — magnifying glass */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pastel-orange border-2 border-[#FFD4A6]"
                style={{ boxShadow: '0 0 20px rgba(255,140,66,0.3)' }}
              >
                <SearchIcon className="w-9 h-9 text-dora-orange" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="font-display font-extrabold text-[2.8rem] leading-tight text-dora-orange">
                USRP Control
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-center text-tale-gray font-body text-[15px] mb-8">
              Real-time RF control & signal visualization
            </p>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mb-7">
              {online ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse-slow" />
                  <span className="font-mono text-xs text-meadow-green-dk">
                    Device online · v{data?.version}
                  </span>
                </>
              ) : (
                <>
                  <SearchIcon className="w-3.5 h-3.5 text-sunset-red animate-searching" />
                  <span className="font-mono text-xs text-sunset-red">
                    Backend unreachable
                  </span>
                </>
              )}
            </div>

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={connectState !== 'idle'}
              className="w-full relative group py-4 px-6 rounded-full font-display font-bold text-lg text-white overflow-hidden transition-all duration-200 disabled:cursor-default disabled:opacity-80"
              style={{
                background: connectState === 'idle'
                  ? 'linear-gradient(135deg, #FF8C42, #E06A1A)'
                  : undefined,
                boxShadow: connectState === 'idle'
                  ? '0 4px 14px rgba(255,140,66,0.40)'
                  : undefined,
              }}
            >
              {connectState === 'idle' && (
                <>
                  <span className="relative z-10">Connect</span>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-full" />
                </>
              )}
              {connectState === 'connecting' && (
                <span className="flex items-center justify-center gap-3 text-white bg-[#E06A1A] rounded-full px-6 py-0 -mx-6 -my-4 h-[56px]">
                  <SearchIcon className="w-5 h-5 animate-searching" />
                  Connecting…
                </span>
              )}
              {connectState === 'success' && (
                <span className="flex items-center justify-center gap-2 text-white bg-meadow-green rounded-full px-6 py-0 -mx-6 -my-4 h-[56px] font-body">
                  <span className="text-lg">✓</span> Connected
                </span>
              )}
            </button>

            {/* Decorative dots row */}
            <div className="flex justify-center gap-2 mt-5">
              {['#FF8C42', '#FFCA3A', '#56C271', '#5BC8F5', '#9B5DE5'].map(c => (
                <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success flash */}
      <AnimatePresence>
        {connectState === 'success' && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0.6 }}
            animate={{ scaleX: 1, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.5, ease: 'easeIn' }}
            className="absolute inset-0 bg-meadow-green/20 origin-left pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify HeroPage at `http://localhost:5173/`**

Expected: illustrated sky/landscape background, cream card with rainbow banner, orange magnifying glass icon, orange Connect button, colored dots at bottom.

- [ ] **Step 3: Commit**

```bash
git add src/features/hero/HeroPage.tsx
git commit -m "feat(dora): redesign HeroPage with illustrated landscape and Dora card"
```

---

## Task 8: VortexPage Redesign

**Files:**
- Modify: `src/features/vortex/VortexPage.tsx`

- [ ] **Step 1: Replace VortexPage.tsx**

```tsx
import { useState, useRef, useEffect } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useVortexConfig } from './useVortexConfig'
import {
  availableBandwidths, isOutputLocked, isIfbwDisabled,
  IFBW_320_OUTPUT_MHZ,
} from './constraints'

function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-[20px] border border-[#FFD4A6] dark:border-white/[0.07] bg-pastel-orange dark:bg-base-900 p-6 shadow-dora-card dark:shadow-none transition-all hover:shadow-dora-card-hover hover:-translate-y-0.5">
      {/* Dot-row decoration */}
      <div
        className="absolute top-0 left-6 right-6 h-[4px] rounded-b-full dark:hidden"
        style={{
          background: 'repeating-linear-gradient(90deg, #FFB37A 0px, #FFB37A 5px, transparent 5px, transparent 13px)',
          borderRadius: '0 0 4px 4px',
        }}
      />
      <h3 className="font-display font-bold text-[15px] text-story-ink dark:text-[#4b5563] uppercase tracking-[0.12em] mb-5 mt-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  disabled?: boolean
  locked?: boolean
  onCommit: (v: number) => void
}

function SliderField({ label, value, min, max, step, unit, disabled, locked, onCommit }: SliderFieldProps) {
  const [draft, setDraft] = useState<number | null>(null)
  const [text, setText] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = draft ?? value
  const pct = ((current - min) / (max - min)) * 100
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const snap = (v: number) => Math.round(v / step) * step
  const fmt = (v: number) => v.toFixed(v < 10 ? 3 : 1)

  const scheduleCommit = (v: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { onCommit(v); setDraft(null) }, 400)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled || locked) return
    e.preventDefault()
    const next = clamp(snap(current + (e.deltaY < 0 ? step : -step)))
    setDraft(next)
    scheduleCommit(next)
  }

  const commitText = () => {
    if (text === null) return
    const p = parseFloat(text)
    if (!isNaN(p)) { const v = clamp(snap(p)); setDraft(v); onCommit(v) }
    setText(null)
  }

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40' : ''}`} onWheel={handleWheel}>
      <div className="flex justify-between items-center">
        <label className="font-body text-[13px] font-semibold text-tale-gray dark:text-[#9ca3af]">{label}</label>
        <div className="flex items-center gap-1.5">
          {locked && <span className="text-[#7A5C3A] text-xs">🔒</span>}
          <input
            type="text"
            inputMode="decimal"
            value={text ?? fmt(current)}
            onChange={e => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Enter') { commitText(); (e.target as HTMLInputElement).blur() }
              else if (e.key === 'Escape') setText(null)
              else if (e.key === 'ArrowUp') { e.preventDefault(); const n = clamp(snap(current + step)); setDraft(n); scheduleCommit(n) }
              else if (e.key === 'ArrowDown') { e.preventDefault(); const n = clamp(snap(current - step)); setDraft(n); scheduleCommit(n) }
            }}
            disabled={disabled || locked}
            className="font-mono text-sm w-20 text-right text-dora-orange dark:text-cyan-400 bg-white dark:bg-base-950/60 px-2 py-0.5 rounded-lg border border-[#FFD4A6] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-dora-orange/30 dark:focus:ring-cyan-400/50 disabled:cursor-not-allowed"
          />
          <span className="font-mono text-xs text-whisper-gray dark:text-[#4b5563] w-8">{unit}</span>
        </div>
      </div>
      {/* Slider track */}
      <div className="relative">
        <div className="h-2 rounded-full bg-[#E8E4F7] dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-dora-orange dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min} max={max} step={step}
          value={current}
          disabled={disabled || locked}
          onChange={e => { setText(null); setDraft(parseFloat(e.target.value)) }}
          onMouseUp={() => { if (draft !== null) { onCommit(draft); setDraft(null) } }}
          onTouchEnd={() => { if (draft !== null) { onCommit(draft); setDraft(null) } }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-2"
          style={{ WebkitAppearance: 'none' }}
        />
      </div>
    </div>
  )
}

export function VortexPage() {
  const {
    config, isLoading, isError,
    rfinMut, outputMut, gainMut, ifbwMut, invertMut, saveMut, resumeMut,
  } = useVortexConfig()

  const [resumed, setResumed] = useState(false)
  const [localBw, setLocalBw] = useState<number | null>(null)
  const [localInvert, setLocalInvert] = useState<boolean | null>(null)

  useEffect(() => { setLocalBw(null) },     [config?.ifbw_mhz])
  useEffect(() => { setLocalInvert(null) }, [config?.gain_mode])

  if (isLoading) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center text-tale-gray dark:text-[#6b7280] font-body text-sm">
        Loading device config…
      </div>
    </PageTransition>
  )

  if (isError || !config) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center text-sunset-red dark:text-rose-500 font-body text-sm">
        ✕ Cannot reach device at {import.meta.env.VITE_API_BASE_URL}
      </div>
    </PageTransition>
  )

  const bws        = availableBandwidths(config.version)
  const outLocked  = isOutputLocked(config.ifbw_mhz)
  const bwDisabled = isIfbwDisabled(config.version)

  const displayBw     = localBw     ?? config.ifbw_mhz
  const displayInvert = localInvert ?? Boolean(config.gain_mode)

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
        <Topbar title="Vortex Config" />

        {resumed && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-[16px] border border-sunshine/50 bg-[#FFF6CC] dark:bg-amber-500/10 dark:border-amber-500/30 text-[#7A5C3A] dark:text-amber-500 font-body text-sm flex items-center gap-2">
            <span>⚠</span> Control released — reload to regain access
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* RF Frequency */}
            <ConfigCard title="RF Input">
              <SliderField
                label="Frequency"
                value={config.rfin_ghz}
                min={0.01} max={26} step={0.001}
                unit="GHz"
                disabled={resumed}
                onCommit={v => rfinMut.mutate(v)}
              />
            </ConfigCard>

            {/* Output */}
            <ConfigCard title="IF Output">
              <SliderField
                label="Frequency"
                value={outLocked ? IFBW_320_OUTPUT_MHZ : config.output_mhz}
                min={0} max={3500} step={0.1}
                unit="MHz"
                disabled={resumed}
                locked={outLocked}
                onCommit={v => outputMut.mutate(v)}
              />
            </ConfigCard>

            {/* Gain */}
            <ConfigCard title="Gain">
              <SliderField
                label="Gain"
                value={config.gain_db}
                min={0} max={90} step={0.5}
                unit="dB"
                disabled={resumed}
                onCommit={v => gainMut.mutate(v)}
              />
            </ConfigCard>

            {/* IF Bandwidth */}
            <ConfigCard title="IF Bandwidth">
              <div className="space-y-3">
                <div className={`flex rounded-[14px] border border-[#FFD4A6] dark:border-white/10 overflow-hidden bg-white dark:bg-transparent ${bwDisabled || resumed ? 'opacity-40' : ''}`}>
                  {[80, 160, 320].map(bw => {
                    const available = bws.includes(bw)
                    const active    = displayBw === bw
                    return (
                      <button
                        key={bw}
                        disabled={!available || bwDisabled || resumed}
                        onClick={() => {
                          const prev = localBw ?? config.ifbw_mhz
                          setLocalBw(bw)
                          ifbwMut.mutate(bw, { onError: () => setLocalBw(prev) })
                        }}
                        className={`flex-1 py-2.5 text-sm font-display font-bold transition-all duration-150 ${
                          active
                            ? 'bg-dora-orange text-white shadow-dora-btn dark:bg-cyan-400/20 dark:text-cyan-400'
                            : available
                              ? 'text-tale-gray dark:text-[#9ca3af] hover:text-story-ink hover:bg-pastel-orange dark:hover:text-[#e5e7eb] dark:hover:bg-white/5'
                              : 'text-whisper-gray dark:text-[#374151] cursor-not-allowed'
                        }`}
                      >
                        {bw} MHz
                      </button>
                    )
                  })}
                </div>
                {bwDisabled && (
                  <p className="text-xs text-whisper-gray dark:text-[#4b5563] font-mono">Disabled on v{config.version}</p>
                )}
              </div>
            </ConfigCard>

            {/* Invert */}
            <ConfigCard title="Spectrum">
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] font-semibold text-tale-gray dark:text-[#9ca3af]">Invert Spectrum</span>
                <button
                  disabled={resumed}
                  onClick={() => {
                    const next = !displayInvert
                    setLocalInvert(next)
                    invertMut.mutate(next, { onError: () => setLocalInvert(!next) })
                  }}
                  className={`relative w-14 h-7 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-dora-orange/40 dark:focus:ring-cyan-400/50 ${
                    displayInvert
                      ? 'bg-gradient-to-r from-meadow-green to-meadow-green-dk border-meadow-green/40 dark:from-cyan-400/20 dark:to-cyan-400/20 dark:border-cyan-400/40'
                      : 'bg-[#E8E4F7] border-[#D8D4EC] dark:bg-white/5 dark:border-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    displayInvert ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </ConfigCard>

            {/* Device Info */}
            <ConfigCard title="Device Info">
              <div className="space-y-3">
                {[
                  { label: 'Firmware', value: config.version },
                  { label: 'Gain Mode', value: String(config.gain_mode) },
                  { label: 'RF In Hz', value: config.rfin_hz.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between border-b border-[#FFD4A6]/50 dark:border-white/[0.06] pb-2 last:border-0 last:pb-0">
                    <span className="font-body text-xs text-whisper-gray dark:text-[#6b7280]">{label}</span>
                    <span className="font-mono text-xs text-story-ink dark:text-[#e5e7eb]">{value}</span>
                  </div>
                ))}
              </div>
            </ConfigCard>

          </div>

          {/* Action buttons */}
          <div className="max-w-3xl mx-auto flex gap-3 mt-5">
            <button
              disabled={resumed || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="flex-1 py-3 rounded-full font-display font-bold tracking-wide text-[14px] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
              }}
            >
              {saveMut.isPending ? 'Saving…' : 'Save to Flash'}
            </button>
            <button
              disabled={resumed || resumeMut.isPending}
              onClick={() => { resumeMut.mutate(); setResumed(true) }}
              className="flex-1 py-3 rounded-full font-display font-bold tracking-wide text-[14px] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #9B5DE5, #7B3FC8)',
                boxShadow: '0 4px 14px rgba(155,93,229,0.40)',
              }}
            >
              {resumeMut.isPending ? 'Releasing…' : 'Resume Control'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 2: Navigate to `/vortex`, interact with all controls**

Expected: pastel-orange cards, orange sliders, pill buttons, green toggle, version info rows.

- [ ] **Step 3: Commit**

```bash
git add src/features/vortex/VortexPage.tsx
git commit -m "feat(dora): redesign VortexPage with Dora pastel cards and pill buttons"
```

---

## Task 9: ScanPage + ScanTable Redesign

**Files:**
- Modify: `src/features/scan/ScanPage.tsx`
- Modify: `src/features/scan/ScanTable.tsx`

- [ ] **Step 1: In ScanPage.tsx, replace the DeviceStatePanel function**

```tsx
function DeviceStatePanel() {
  const { data } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    refetchInterval: 5000,
  })

  if (!data) return null

  const items = [
    { label: 'RF In',   value: `${data.rfin_ghz.toFixed(4)} GHz` },
    { label: 'Output',  value: `${data.output_mhz.toFixed(1)} MHz` },
    { label: 'Gain',    value: `${data.gain_db} dB` },
    { label: 'IF BW',   value: `${data.ifbw_mhz} MHz` },
    { label: 'Version', value: data.version },
  ]

  return (
    <div className="mb-5 rounded-[16px] border border-[#C5A3F5] dark:border-white/[0.12] bg-pastel-purple dark:bg-base-900 overflow-hidden transition-colors">
      <div className="px-4 py-2 border-b border-[#C5A3F5]/50 dark:border-white/[0.12] bg-[#E6D8FF]/60 dark:bg-base-950/70">
        <span className="text-[10px] font-body font-bold tracking-[0.12em] uppercase text-adv-purple dark:text-[#6b7280]">
          Live Device State
        </span>
      </div>
      <div className="flex divide-x divide-[#C5A3F5]/40 dark:divide-white/[0.08]">
        {items.map(({ label, value }) => (
          <div key={label} className="flex-1 px-4 py-3">
            <div className="font-body text-[10px] font-bold text-whisper-gray dark:text-[#9ca3af] uppercase tracking-wider mb-1">{label}</div>
            <div className="font-mono text-[14px] text-dora-orange dark:text-cyan-400">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: In ScanPage.tsx, replace the RunModal function**

```tsx
function RunModal({
  onClose,
  onRun,
  loading,
}: {
  onClose: () => void
  onRun: (dir: string, mock: boolean) => void
  loading: boolean
}) {
  const [dir, setDir]   = useState('./output')
  const [mock, setMock] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(45,42,62,0.45)] backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.92, y: 20  }}
        className="w-full max-w-md rounded-[24px] border-2 border-[#EDE3FF] bg-cream-page shadow-dora-modal dark:border-white/[0.07] dark:bg-base-900 overflow-hidden"
      >
        {/* Rainbow top strip */}
        <div
          className="h-[4px]"
          style={{ background: 'linear-gradient(90deg, #FF8C42, #FFCA3A, #56C271, #5BC8F5, #9B5DE5)' }}
        />
        <div className="p-7">
          <h3 className="font-display font-bold text-[20px] text-story-ink dark:text-[#f9fafb] mb-6">
            Run Scan
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="font-body text-xs font-bold text-whisper-gray dark:text-[#6b7280] uppercase tracking-wider block mb-1.5">
                Output Directory
              </label>
              <input
                value={dir}
                onChange={e => setDir(e.target.value)}
                className="w-full bg-white dark:bg-base-950/60 border-2 border-[#D8D4EC] dark:border-white/10 rounded-[12px] px-3 py-2.5 font-mono text-[13px] text-story-ink dark:text-[#e5e7eb] focus:outline-none focus:border-adv-purple dark:focus:border-cyan-400/40 focus:ring-2 focus:ring-adv-purple/20 dark:focus:ring-cyan-400/20 transition-colors"
                placeholder="./output"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setMock(m => !m)}
                className={`relative w-11 h-6 rounded-full border-2 transition-all cursor-pointer ${
                  mock
                    ? 'bg-gradient-to-r from-meadow-green to-meadow-green-dk border-meadow-green/40 dark:bg-cyan-400/20 dark:border-cyan-400/40'
                    : 'bg-[#E8E4F7] border-[#D8D4EC] dark:bg-white/5 dark:border-white/10'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  mock ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className="font-body text-[13px] text-tale-gray dark:text-[#9ca3af]">Mock mode (no hardware)</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border-2 border-[#D8D4EC] dark:border-white/10 text-tale-gray dark:text-[#9ca3af] font-body text-[13px] font-semibold hover:bg-pastel-purple/30 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading || !dir}
              onClick={() => onRun(dir, mock)}
              className="flex-1 py-2.5 rounded-full font-display font-bold text-[14px] text-white disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
              }}
            >
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 3: In ScanPage.tsx, update the main ScanPage return JSX**

Replace the outer `div` className and toolbar section:

```tsx
return (
  <PageTransition>
    <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
      <Topbar title="Scan Table" />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-6xl mx-auto space-y-5">
          <DeviceStatePanel />

          <input
            id="excel-file-import"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-[0.08em] text-whisper-gray dark:text-[#4b5563] uppercase font-body font-bold">
              {rows.length} row{rows.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { clearErrors(); handleValidate() }}
                className="px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors"
              >
                Validate
              </button>
              <button
                onClick={downloadScanTemplate}
                title="Download Excel template"
                className="px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Template
              </button>
              <label
                htmlFor="excel-file-import"
                title="Import rows from Excel file"
                className="cursor-pointer px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                Import Excel
              </label>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Schedule
              </button>
              <button
                onClick={() => {
                  const ok = validateAll()
                  if (!ok) { toast('Fix validation errors before running', 'error'); return }
                  setShowModal(true)
                }}
                className="px-4 py-2 rounded-full font-display font-bold text-xs tracking-wide uppercase text-white hover:-translate-y-0.5 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                  boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
                }}
              >
                Run Scan
              </button>
            </div>
          </div>

          {/* Import success badge */}
          <AnimatePresence>
            {importedFileName && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2 px-3 py-2 rounded-[12px] border border-sky-blue-d/40 bg-pastel-blue dark:border-cyan-400/20 dark:bg-cyan-400/5"
              >
                <svg className="w-3.5 h-3.5 text-sky-blue-d dark:text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-mono text-[11px] text-[#1A6A8A] dark:text-cyan-400 flex-1">
                  Loaded from <span className="font-semibold">"{importedFileName}"</span>
                </span>
                <button
                  onClick={() => setImportedFileName(null)}
                  className="text-sky-blue-d/50 dark:text-cyan-400/50 hover:text-sky-blue-d dark:hover:text-cyan-400 transition-colors leading-none"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <ScanTable rows={rows} errors={errors} onUpdate={updateCell} onAdd={addRow} onRemove={removeRow} />

          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[16px] border border-meadow-green/30 bg-pastel-green dark:bg-emerald-500/5 p-4"
              >
                <div className="text-xs tracking-[0.08em] font-body font-bold text-meadow-green-dk dark:text-emerald-400 uppercase mb-3">
                  Output Files
                </div>
                <div className="space-y-1">
                  {results.map(f => (
                    <div key={f} className="font-mono text-xs text-tale-gray dark:text-[#9ca3af]">{f}</div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming Scheduled Runs */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display font-bold text-xs tracking-[0.12em] uppercase text-whisper-gray dark:text-white/40">
                Upcoming Scheduled Runs
              </span>
              <div className="flex-1 h-px bg-[#FFD4A6]/60 dark:bg-white/[0.06]" />
            </div>
            <ScheduledRunsTable />
          </div>

          {/* Scan History */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display font-bold text-xs tracking-[0.12em] uppercase text-whisper-gray dark:text-white/40">
                Scan History
              </span>
              <div className="flex-1 h-px bg-[#FFD4A6]/60 dark:bg-white/[0.06]" />
            </div>
            <ScanHistoryTable />
          </div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {showModal && (
        <RunModal
          onClose={() => setShowModal(false)}
          onRun={(dir, mock) => runMut.mutate({ dir, mock })}
          loading={runMut.isPending}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showScheduleModal && (
        <ScheduleModal
          rows={rows}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </AnimatePresence>
  </PageTransition>
)
```

- [ ] **Step 4: Replace ScanTable.tsx**

```tsx
import { useRef, useState } from 'react'
import type { ScanRow, ScanRowErrors } from '@/types/scan'

type Props = {
  rows: ScanRow[]
  errors: Record<string, ScanRowErrors>
  onUpdate: <K extends keyof Omit<ScanRow, 'id'>>(id: string, field: K, value: ScanRow[K]) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

type ColDef = {
  key:       keyof Omit<ScanRow, 'id'>
  header:    string
  subHeader: string
  width:     string
  type:      'number' | 'select'
  options?:  number[]
  min?:      number
  max?:      number
  step?:     number
}

const COLS: ColDef[] = [
  { key: 'duration',           header: 'Duration',       subHeader: 's',    width: 'w-24',  type: 'number', min: 0.01, step: 0.1 },
  { key: 'entrance_freq_ghz',  header: 'Entrance Freq',  subHeader: 'GHz',  width: 'w-36',  type: 'number', min: 0.01, max: 26, step: 0.001 },
  { key: 'out_freq_mhz',       header: 'Out Freq',       subHeader: 'MHz',  width: 'w-32',  type: 'number', min: 0, max: 3500, step: 0.1 },
  { key: 'bandwidth',          header: 'Bandwidth',      subHeader: 'MHz',  width: 'w-32',  type: 'select', options: [80, 160, 320] },
  { key: 'gain_db',            header: 'Gain',           subHeader: 'dB',   width: 'w-24',  type: 'number', min: 0, max: 90, step: 0.5 },
  { key: 'sample_rate',        header: 'Sample Rate',    subHeader: 'Hz',   width: 'w-36',  type: 'number', min: 1, step: 1000 },
]

type CellProps = {
  row:     ScanRow
  col:     ColDef
  error?:  string
  onUpdate: Props['onUpdate']
}

function Cell({ row, col, error, onUpdate }: CellProps) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const value = row[col.key]

  function commit(raw: string) {
    setEditing(false)
    if (col.type === 'number') {
      const n = parseFloat(raw)
      if (!isNaN(n)) onUpdate(row.id, col.key, n as never)
    }
  }

  const cellBase = `h-10 flex items-center px-3 font-mono text-[13px] border-r border-[#FFD4A6]/50 dark:border-white/[0.10] cursor-pointer transition-colors ${
    error
      ? 'bg-[#FFE0E0] dark:bg-rose-500/10 text-sunset-red dark:text-rose-300 border-b border-sunset-red/30 dark:border-rose-500/30'
      : 'hover:bg-pastel-orange/60 dark:hover:bg-cyan-400/[0.06] text-story-ink dark:text-[#d1d5db]'
  }`

  if (col.type === 'select') {
    const numVal = Number(value)
    const isValidOption = col.options!.includes(numVal)
    return (
      <div className={`${cellBase} p-0`}>
        <select
          value={numVal}
          onChange={e => onUpdate(row.id, col.key, parseInt(e.target.value) as never)}
          className="w-full h-full bg-transparent px-3 text-[13px] font-mono text-story-ink dark:text-[#d1d5db] focus:outline-none focus:bg-pastel-orange/50 dark:focus:bg-cyan-400/10 cursor-pointer"
        >
          {!isValidOption && (
            <option value={numVal} className="bg-white dark:bg-base-900 text-sunset-red">
              {numVal} (invalid)
            </option>
          )}
          {col.options!.map(o => (
            <option key={o} value={o} className="bg-white dark:bg-base-900">{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="h-10 flex items-center px-0 border-r border-[#FFD4A6]/50 dark:border-white/[0.10]">
        <input
          ref={inputRef}
          autoFocus
          type="number"
          defaultValue={String(value)}
          min={col.min}
          max={col.max}
          step={col.step}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full h-full bg-pastel-orange dark:bg-cyan-400/10 border border-dora-orange/40 dark:border-cyan-400/40 px-3 text-[13px] font-mono text-dora-orange-dark dark:text-cyan-300 focus:outline-none rounded-none"
        />
      </div>
    )
  }

  return (
    <div className={cellBase} onClick={() => setEditing(true)}>
      {typeof value === 'number' ? value.toLocaleString() : String(value)}
      {error && <span className="ml-2 text-sunset-red text-xs">⚠</span>}
    </div>
  )
}

export function ScanTable({ rows, errors, onUpdate, onAdd, onRemove }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="rounded-[20px] border-2 border-[#FFD4A6] dark:border-white/[0.12] overflow-hidden bg-cream-page dark:bg-base-900/40 transition-colors shadow-dora-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-pastel-orange to-[#FFD4A6] dark:bg-base-950 border-b-2 border-[#FFD4A6] dark:border-white/[0.12]">
              <th className="w-10 px-3 py-0 border-r border-[#FFD4A6]/50 dark:border-white/[0.10]" />
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={`${col.width} text-left border-r border-[#FFD4A6]/50 dark:border-white/[0.10] last:border-r-0`}
                >
                  <div className="py-2.5 px-3">
                    <div className="font-display text-xs font-bold tracking-[0.12em] text-story-ink dark:text-[#f3f4f6] uppercase">
                      {col.header}
                    </div>
                    <div className="font-mono text-[10px] text-whisper-gray dark:text-[#6b7280] mt-0.5">{col.subHeader}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowErr = errors[row.id] ?? {}
              const hasError = Object.keys(rowErr).length > 0
              return (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHovered(row.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`border-b border-[#FFD4A6]/30 dark:border-white/[0.08] last:border-b-0 transition-colors ${
                    idx % 2 === 0 ? 'bg-cream-page dark:bg-white/[0.015]' : 'bg-[#FFFAF0] dark:bg-white/[0.035]'
                  } ${hasError ? 'bg-[#FFE8E8] dark:bg-rose-500/5' : ''}`}
                >
                  <td className="w-10 border-r border-[#FFD4A6]/40 dark:border-white/[0.10] bg-[#FFF8EE] dark:bg-base-950/50">
                    <div className="h-10 flex items-center justify-center">
                      {hovered === row.id ? (
                        <button
                          onClick={() => onRemove(row.id)}
                          className="w-5 h-5 flex items-center justify-center text-sunset-red hover:text-[#B03030] hover:bg-[#FFE0E0] rounded text-xs transition-colors dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/20"
                          aria-label="Remove row"
                        >
                          ×
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-whisper-gray dark:text-[#6b7280]">{idx + 1}</span>
                      )}
                    </div>
                  </td>
                  {COLS.map(col => (
                    <td key={col.key} className={col.width}>
                      <Cell
                        row={row}
                        col={col}
                        error={rowErr[col.key]}
                        onUpdate={onUpdate}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}

            <tr>
              <td colSpan={COLS.length + 1}>
                <button
                  onClick={onAdd}
                  className="w-full h-10 flex items-center justify-center gap-2 text-xs font-body font-semibold text-whisper-gray hover:text-dora-orange hover:bg-pastel-orange/40 dark:text-[#4b5563] dark:hover:text-cyan-400 dark:hover:bg-cyan-400/5 transition-colors"
                >
                  <span className="text-base leading-none">+</span>
                  <span>Add row</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Navigate to `/config`, verify table and toolbar render**

Expected: purple DeviceStatePanel, purple toolbar buttons, orange "Run Scan" button, warm table with orange header gradient.

- [ ] **Step 6: Commit**

```bash
git add src/features/scan/ScanPage.tsx src/features/scan/ScanTable.tsx
git commit -m "feat(dora): redesign ScanPage and ScanTable with Dora palette"
```

---

## Task 10: RxPage Redesign

**Files:**
- Modify: `src/features/rx/RxPage.tsx`

- [ ] **Step 1: Replace RxPage.tsx**

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useRxStream } from './useRxStream'
import { useVortexConfig } from '@/features/vortex/useVortexConfig'
import { useTheme } from '@/hooks/useTheme'
import type { SignalData, RxStatus } from '@/types/rx'
import _Plot from 'react-plotly.js'
import type { PlotParams } from 'react-plotly.js'
const Plot = (_Plot as unknown as { default: React.ComponentType<PlotParams> }).default
  ?? (_Plot as unknown as React.ComponentType<PlotParams>)

type Tab = 'time' | 'fft' | 'spectrogram'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'time',        label: 'Time Domain',  icon: '∿' },
  { id: 'fft',         label: 'FFT',          icon: '⌇' },
  { id: 'spectrogram', label: 'Spectrogram',  icon: '▦' },
]

const STATUS_CHIP: Record<RxStatus, { dot: string; label: string }> = {
  connecting: { dot: 'bg-sunshine',     label: 'Connecting…' },
  streaming:  { dot: 'bg-meadow-green', label: 'Live'        },
  silence:    { dot: 'bg-whisper-gray', label: 'Silence'     },
  no_device:  { dot: 'bg-sunset-red',   label: 'No Device'   },
  done:       { dot: 'bg-whisper-gray', label: 'Done'        },
  error:      { dot: 'bg-sunset-red',   label: 'Reconnecting…'},
}

const NO_DATA_MSG: Record<RxStatus, string> = {
  connecting: 'Connecting to stream…',
  streaming:  'Waiting for first frame…',
  silence:    'No signal — silence reported by device',
  no_device:  'No device connected',
  done:       'Stream ended',
  error:      'Connection lost — reconnecting…',
}

export function RxPage() {
  const [tab, setTab] = useState<Tab>('time')
  const [frozen, setFrozen]         = useState(false)
  const [frozenData, setFrozenData] = useState<SignalData | null>(null)

  const { data: liveData, status, sampleRate } = useRxStream()
  const { config: vortexConfig } = useVortexConfig()
  const { theme } = useTheme()

  const centerFreq = vortexConfig ? (vortexConfig.rfin_hz / 1e6).toFixed(0) : '—'
  const data: SignalData | null = frozen ? frozenData : liveData

  function handleToggle() {
    if (!frozen) setFrozenData(liveData)
    setFrozen(f => !f)
  }

  const isDark     = theme === 'dark'
  const bgColor    = isDark ? '#030712'  : '#0A1628'
  const paperColor = isDark ? '#111827'  : '#0F2040'
  const gridColor  = isDark ? '#1f2937'  : 'rgba(255,255,255,0.06)'
  const textColor  = isDark ? '#6b7280'  : 'rgba(255,255,255,0.45)'
  const lineColor  = '#5BC8F5'  // sky-blue-d for both modes in Dora

  const layoutBase: Partial<Plotly.Layout> = {
    paper_bgcolor: paperColor,
    plot_bgcolor:  bgColor,
    margin:        { t: 16, r: 24, b: 48, l: 56 },
    font:          { family: 'JetBrains Mono', size: 11, color: textColor },
    xaxis: { gridcolor: gridColor, zerolinecolor: gridColor, tickfont: { size: 10 } },
    yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, tickfont: { size: 10 } },
  }

  const chip = STATUS_CHIP[status]

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
        <Topbar title="RX Graphs" />

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page dark:bg-base-900 transition-colors">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-[13px] font-display font-bold tracking-wide uppercase transition-colors rounded-t-[12px] ${
                tab === t.id
                  ? 'text-white'
                  : 'text-whisper-gray dark:text-[#6b7280] hover:text-tale-gray dark:hover:text-[#d1d5db] hover:bg-pastel-orange/30 dark:hover:bg-white/5'
              }`}
              style={tab === t.id ? {
                background: 'linear-gradient(135deg, #5BC8F5, #3BA8D5)',
                boxShadow: '0 4px 12px rgba(91,200,245,0.45)',
              } : {}}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3 pb-2">
            {/* Status chip */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${chip.dot} ${status === 'streaming' ? 'animate-pulse' : ''}`} />
              <span className="font-body text-xs font-semibold text-whisper-gray dark:text-[#4b5563]">{chip.label}</span>
            </div>

            {/* Center freq / sample rate */}
            <span className="font-mono text-xs text-whisper-gray dark:text-[#4b5563]">
              {centerFreq} MHz · {sampleRate > 0 ? (sampleRate / 1e6).toFixed(1) : '—'} Msps
            </span>

            {/* Freeze / Resume button */}
            <button
              onClick={handleToggle}
              className="px-4 py-1.5 rounded-full font-display font-bold text-xs border-2 transition-all hover:-translate-y-0.5"
              style={
                !frozen
                  ? {
                    border: '2px solid #9B5DE5',
                    color: '#9B5DE5',
                    background: 'transparent',
                  }
                  : {
                    background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                    border: '2px solid transparent',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
                  }
              }
            >
              {!frozen ? '⏹ Freeze' : '▶ Resume'}
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden p-4 bg-sky-canvas dark:bg-base-950">
          <div className="absolute inset-4 rounded-[20px] border border-sky-blue-d/40 dark:border-white/[0.07] bg-pastel-blue dark:bg-base-900/40 p-3 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-3 rounded-[12px] overflow-hidden"
              >
                {tab === 'time' && data && (
                  <Plot
                    data={[{
                      x: data.time.x,
                      y: data.time.y,
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: lineColor, width: 1.5 },
                      name: 'Amplitude',
                    }]}
                    layout={{
                      ...layoutBase,
                      uirevision: 'time',
                      xaxis: { ...layoutBase.xaxis, title: { text: 'Time (ms)', font: { size: 10, color: textColor } } },
                      yaxis: { ...layoutBase.yaxis, title: { text: 'Amplitude', font: { size: 10, color: textColor } } },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}

                {tab === 'fft' && data && (
                  <Plot
                    data={[{
                      x: data.fft.x,
                      y: data.fft.y,
                      type: 'scatter',
                      mode: 'lines',
                      fill: 'tozeroy',
                      fillcolor: 'rgba(91,200,245,0.10)',
                      line: { color: lineColor, width: 1.5 },
                      name: 'Power',
                    }]}
                    layout={{
                      ...layoutBase,
                      uirevision: 'fft',
                      xaxis: { ...layoutBase.xaxis, title: { text: 'Frequency offset (MHz)', font: { size: 10, color: textColor } } },
                      yaxis: { ...layoutBase.yaxis, title: { text: 'Power (dBm)',             font: { size: 10, color: textColor } } },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}

                {tab === 'spectrogram' && data && (
                  <Plot
                    data={[{
                      z: data.spectrogram,
                      type: 'heatmap',
                      colorscale: 'Jet',
                      showscale: true,
                      colorbar: {
                        thickness: 12,
                        tickfont: { size: 10, color: textColor },
                        title: { text: 'dBm', font: { size: 10, color: textColor } },
                      },
                    }]}
                    layout={{
                      ...layoutBase,
                      uirevision: 'spectrogram',
                      xaxis: { ...layoutBase.xaxis, title: { text: 'Frequency bin', font: { size: 10, color: textColor } } },
                      yaxis: { ...layoutBase.yaxis, title: { text: 'Time →',         font: { size: 10, color: textColor } } },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}

                {!data && (
                  <div className="flex items-center justify-center h-full">
                    <span className="font-body text-sm text-white/40">
                      {NO_DATA_MSG[status]}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 2: Navigate to `/rx`, verify tab bar and chart container**

Expected: cream tab bar with blue active tabs, pastel-blue chart container wrapping dark chart canvas, orange/purple freeze button.

- [ ] **Step 3: Commit**

```bash
git add src/features/rx/RxPage.tsx
git commit -m "feat(dora): redesign RxPage with Dora tab bar and chart container"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full dev build to check for TypeScript errors**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript errors.

- [ ] **Step 2: Start dev server and walk all pages**

```bash
npm run dev
```

Checklist:
- [ ] HeroPage (`/`) — illustrated sky, cream card, orange connect button, searching icon
- [ ] Sidebar — "Dora" label, magnifying glass icon, map trail dots, status pill
- [ ] Topbar — three colored dots, Baloo 2 font, pill theme toggle
- [ ] VortexPage (`/vortex`) — pastel-orange cards, orange sliders, pill action buttons
- [ ] ScanPage (`/config`) — purple DeviceStatePanel, toolbar buttons, warm table
- [ ] RxPage (`/rx`) — blue tab bar, dark chart inside pastel-blue container
- [ ] Theme toggle — dark mode still applies existing dark styles
- [ ] Toast — trigger Validate on ScanPage, check pastel toast appears

- [ ] **Step 3: Verify all interactive features still work**

- [ ] Sliders drag and commit values
- [ ] BW buttons select correctly
- [ ] Spectrum invert toggle works
- [ ] Save to Flash / Resume Control buttons respond
- [ ] ScanTable: add row, edit cell, remove row
- [ ] Run Scan modal opens/closes
- [ ] Schedule modal opens/closes
- [ ] RxPage freeze/resume toggles

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(dora): complete Dora Explorer theme — all pages restyled"
```
