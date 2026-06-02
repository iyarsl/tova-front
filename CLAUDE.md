# CLAUDE.md — USRP Frontend

## Project Overview

Web conntrol for usrp and vortex combained together. 

- Back code is at: **C:\Users\TESLA\PycharmProjects\brain-fuck**

## Always do first

- Always invoke the `frontend-design` skill before writing any frontend code, every session, no exceptions
- For ANY conversation always use the `caveman` plugin
- Use `Playwright` for browser automating and screen shots


## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** — build tool and dev server
- **TailwindCSS** — utility-first styling.
- **TanStack Query (React Query v5)** — server state, caching, polling
- **Axios** — HTTP client (one configured instance)
- **Plotly.js** (`react-plotly.js`) — time domain, FFT, spectrogram charts
- **Vitest** + **React Testing Library** — unit and component tests
- **ESLint** + **Prettier** — linting and formatting

## Conventions

- Follow TypeScript strict mode — no any, no as unknown
- PascalCase components, camelCase functions/variables, UPPER_SNAKE_CASE constants
-One component per file; filename matches component name
- No dead or commented-out code
- Short, indicative names — rfInput not radioFrequencyInputValue
- Types/interfaces: prefix I only for interfaces when disambiguation needed; prefer plain type aliases
- Zod for runtime validation of API responses
- console.log only in dev; use a logger utility in production paths
- CSS: Tailwind utility classes; no inline styles; no CSS modules

## Scope Discipline

- Default to minimal solutions; do NOT build full examples/scaffolding when a snippet is requested
- For library usage questions, show only the library usage — not a wrapping server/app
- Ask before modifying existing files like api.py when the request could be solved with a separate module

## Architecture

```
src/
  api/          # Axios client + typed request functions, one file per resource
  components/   # Reusable UI primitives (no business logic)
  features/     # Domain slices: vortex/, usrp/ — each owns its hooks + views
  hooks/        # Shared custom hooks
  types/        # Shared TypeScript types mirroring backend Pydantic models
  utils/        # Pure helpers (unit-testable, no React)
  context/
  App.tsx
  main.tsx
```

No barrel `index.ts` files unless directory has 4+ exports.

Feature folders own their state, components, and hooks. Do not put feature logic in `components/`.

## Backend API

FastAPI runs locally (default `http://localhost:8000`). Base URL in `VITE_API_BASE_URL` env var.

### VORTEX Endpoints (proxied from device)

| Method | Path | Payload | Notes |
|--------|------|---------|-------|
| GET | `/vortex/config` | — | Returns current device config |
| POST | `/vortex/rfin` | `{ ghz: number }` | 0.01–26 GHz |
| POST | `/vortex/output` | `{ mhz: number }` | 0–3500 MHz |
| POST | `/vortex/gain` | `{ db: number }` | 0–90 dB |
| POST | `/vortex/ifbw` | `{ bw: "80 MHz" \| "160 MHz" \| "320 MHz" }` | Version-gated |
| POST | `/vortex/invert` | `{ enabled: boolean }` | Spectrum inversion |
| POST | `/vortex/save` | — | Save as device default |
| POST | `/vortex/resume` | — | Release web control to device screen |

Config response shape:
```ts
type VortexConfig = {
  rfin_hz: number;
  gain_db: number;
  output_hz: number;
  ifbw_mhz: number;
  gain_mode: string;
  version: string;
};
```

## Device Constraints — Enforce in UI

- `ifbw = "320 MHz"` → force output field to 1250 MHz, disable output input
- `version === "1.0.1A"` → hide 320 MHz IF BW option
- `version === "1.0.1C"` → disable entire IF BW selector
- After `POST /vortex/resume` → show locked banner, disable all controls until page reload

All constraint logic lives in `src/features/vortex/constraints.ts` — pure functions, unit-tested.

## State Management

No global store (Redux/Zustand). Use TanStack Query for server state:
- Poll `GET /vortex/config` every 5 seconds while tab is focused
- Optimistic updates on mutations
- Invalidate config query on successful mutation

Local UI state stays in component or nearest ancestor. No prop drilling beyond 2 levels — lift or colocate.


## Error Handling

Map backend HTTP status codes to user-visible messages:

| Code | Meaning | UI behavior |
|------|---------|-------------|
| 409 | Already connected / already streaming / not connected | Toast or inline error |
| 404 | Device not connected | Redirect user to connect first |
| 503 | RXError / TXError from hardware | Show hardware error message |
| 504 | Stream read timeout | Show timeout warning, offer retry |

Use an Axios response interceptor in `src/api/client.ts` to centralize error extraction from `{ detail }` response bodies.


- Wrap all API calls in typed error boundaries
- Toast notifications for user-facing errors (no modal dialogs for transient errors)
- Form validation: show inline errors; block submit on invalid state
- Never swallow errors silently

## Testing

- **Vitest** for unit tests (`*.test.ts`)
- **React Testing Library** for component tests (`*.test.tsx`)
- **Mock Axios** via `vi.mock('axios')` — never hit the real backend in tests
- Test custom hooks with `@testing-library/react` `renderHook`
- Coverage target: all API utility functions and custom hooks

Run tests: `npm run test`

## Git Workflow

- Always confirm current branch before committing; verify the intended target branch
- Never auto-resolve merge conflicts without showing the user the conflicting hunks first
- Do NOT stage Playwright MCP artifacts (*.png, test-results/) — check `git status` carefully before `git add`
- After commits, verify with `git log --oneline -5` to confirm landing branch

## Testing & Verification

- After code changes, run type-checking (tsc/mypy) and relevant tests before declaring done
- For UI changes, suggest verifying with the dev server or Playwright
- For race-condition-prone code (streams, async), explicitly check for sentinel/lifecycle ordering

## Verification Before Claims

- Never state behavior of external libraries/APIs as fact without verifying (check docs, source, or run code first)
- When uncertain, say 'I need to verify' rather than asserting
- Re-check git state before claiming branches/commits exist or don't exist
- Before stating any fact about a library's behavior, git state, or whether code exists, run the actual verification command (pip show, git log, grep, etc.) and show the output
- If verification is not possible, say 'I'm not sure — let me check' instead of asserting

