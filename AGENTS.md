# AGENTS.md

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b && vite build
npm run lint     # ESLint (all TS/TSX)
npm run preview  # Preview prod build
```

No test framework. No `test` command exists.

## Key quirks

- **No tests**: There is nothing to run or verify beyond lint. `npm run build` is the closest thing to a correctness check (catches type errors via `tsc -b`).
- **Path alias**: `@` → `src/` (vite.config.ts + tsconfig). Use it instead of relative `../../`.
- **Tailwind v4**: Theme tokens live in `src/index.css` under `@theme`. No `tailwind.config.js`. Custom font families: Poppins (h1-h3), Montserrat (h4-h6), Lato (body).
- **All content in Spanish**, currency in Peruvian Soles (S/).
- **Vite dev proxies** (`vite.config.ts`):
  - `/api/noticias` → `idema.edu.pe/php/noticias_proxy.php`
  - `/php/lead_intake_proxy.php` → `idema.edu.pe/php/lead_intake_proxy.php`
- **Data is static**: Programs live as TS arrays in `src/data/programs/` (carreras, auxiliares, especializaciones, cursos). `Carrera` type (`src/types/index.ts`) is shared across all categories.
- **Env var**: `VITE_CULQI_PUBLIC_KEY` needed for payments (Culqi checkout integration). No `.env.example` committed — ask if unsure.
- **Utility scripts** (`scripts/`): `sync-culqi-links.mjs` (syncs Culqi plan UUIDs into `cursos.ts`), `import-culqi-csv.mjs`. Requires `CULQI_SECRET_KEY` in `.env`.

## Architecture (short)

- React Router v6, lazy-loaded pages in `src/App.tsx`
- All pages inside `src/components/Layout.tsx` (navbar, footer, whatsapp, cart drawer, announcement modal, toast)
- Navbar (`src/components/layout/Navbar.tsx`, ~700 lines): contains inline contact form popup rendered via `createPortal`. Not split into sub-components.
- Cart state: `src/context/CartContext.tsx` → `useCart()`
- Lead intake: `src/utils/leadIntake.ts` — POSTs to proxy, has offline retry queue in localStorage
- WhatsApp: `src/data/whatsapp.ts` — rep rotation by session via `sessionStorage`
- SEO: `react-helmet-async`; animations: `framer-motion`; icons: `react-icons`; sliders: `swiper`; particles: `@tsparticles/react`
- Components organized in subdirectories: `layout/`, `ui/`, `cart/`, `home/`, `programs/`, `legal/`

## Editing conventions

- Do not add comments unless explicitly asked.
- Do not commit unless asked.
- If you add a new file/component, check `src/components/` for existing patterns first.
- TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`). An unused import will fail `tsc -b`.
