# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IDEMA React is the marketing/institutional website for IDEMA (Instituto de Educación), a Peruvian technical education institute. It's a React 19 SPA built with TypeScript, Vite 8, and Tailwind CSS v4.

## Commands

- `npm run dev` - Start dev server with HMR
- `npm run build` - Type-check with `tsc -b` then build with Vite
- `npm run lint` - ESLint across all TS/TSX files
- `npm run preview` - Preview production build locally

No test framework is configured.

## Architecture

**Routing**: React Router v6 with lazy-loaded pages via `React.lazy()` in `src/App.tsx`. All pages render inside a shared `Layout` component (Navbar, Footer, WhatsApp button, CartDrawer, ToastContainer).

**Data-driven pages**: Programs (carreras, auxiliares, especializaciones, cursos) are defined as static arrays of `Carrera` objects in `src/data/`. Detail pages (`CarreraPage`, `AuxiliarPage`, etc.) look up entries by `:slug` route param.

**State management**: Cart state lives in `src/context/CartContext.tsx` using React Context. Access via `useCart()` hook.

**Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Custom theme tokens (colors, fonts) defined in `src/index.css` under `@theme`. Fonts: Montserrat (headings), Roboto Slab (body).

**Path alias**: `@` maps to `src/` (configured in `vite.config.ts`).

**Key types**: All shared interfaces in `src/types/index.ts` - `Carrera` is the central type used for all program categories.

## Directory Structure

- `src/components/home/` - Homepage sections (Hero, CarrerasSection, etc.)
- `src/components/layout/` - Navbar, Footer
- `src/components/ui/` - Reusable UI (LoadingSpinner, SectionTitle, ProgramCard, etc.)
- `src/components/cart/` - CartDrawer
- `src/hooks/` - Custom hooks (useAnalytics, useCulqi, useScrollspy, useToast)
- `src/data/` - Static data files for programs and navigation
- `src/pages/` - Route-level page components
- `public/assets/` - Static images and files

## Conventions

- All content is in Spanish
- Currency is Peruvian Soles (S/)
- WhatsApp integration for lead generation (reps configured in `src/data/whatsapp.ts`)
- Culqi payment gateway integration via `useCulqi` hook
- SEO handled with `react-helmet-async`
- Animations use `framer-motion`
- Particle effects via `@tsparticles/react`
