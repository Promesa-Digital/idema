# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IDEMA React is the marketing/institutional website for IDEMA (Instituto de Educación), a Peruvian technical education institute. It's a React 19 SPA built with TypeScript, Vite 7, and Tailwind CSS v4.

## Commands

- `npm run dev` - Start dev server with HMR
- `npm run build` - Type-check with `tsc -b` then build with Vite
- `npm run lint` - ESLint across all TS/TSX files
- `npm run preview` - Preview production build locally

No test framework is configured.

## Architecture

**Routing**: React Router v6 with lazy-loaded pages via `React.lazy()` in `src/App.tsx`. All pages render inside a shared `Layout` component (`src/components/Layout.tsx`) which provides Navbar, Footer, WhatsApp button, CartDrawer, ToastContainer, and ScrollToTop.

**Data-driven pages**: Programs are organized by category in `src/data/programs/` (carreras, auxiliares, especializaciones, cursos) as static arrays of `Carrera` objects. A shared `categories.ts` defines the category metadata. Detail pages (`ProgramDetailPage`, `CursoDetailPage`) look up entries by `:slug` route param. Routes like `/carreras/:slug`, `/auxiliares/:slug`, and `/especializaciones/:slug` all use `ProgramDetailPage`, while `/cursos/:slug` uses `CursoDetailPage`.

**State management**: Cart state lives in `src/context/CartContext.tsx` using React Context. Access via `useCart()` hook.

**Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Custom theme tokens (colors, fonts) defined in `src/index.css` under `@theme`. Three font families: Poppins (h1-h3 headings), Montserrat (h4-h6 subheadings), Lato (body text).

**Path alias**: `@` maps to `src/` (configured in `vite.config.ts`).

**Key types**: All shared interfaces in `src/types/index.ts` — `Carrera` is the central type used for all program categories.

**Dev proxy**: Vite proxies `/api/noticias` to `https://idema.edu.pe/php/noticias_proxy.php` for news data.

## Conventions

- All content is in Spanish
- Currency is Peruvian Soles (S/)
- WhatsApp integration for lead generation (reps configured in `src/data/whatsapp.ts`)
- Culqi payment gateway integration via `useCulqi` hook
- SEO handled with `react-helmet-async`
- Animations use `framer-motion`
- Particle effects via `@tsparticles/react`
- Carousel/slider components use `swiper`
- Icons from `react-icons`
- Intersection observer via `react-intersection-observer`
