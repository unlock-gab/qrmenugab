# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a multi-restaurant QR ordering system built with Next.js.

## Main Application: Restaurant QR Ordering System

`artifacts/restaurant-qr` — Full-stack Next.js application for restaurant QR ordering.

### Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT, credentials provider)
- **Styling**: Tailwind CSS v4
- **Validation**: Zod

### Features (Phase 1 MVP)
- **Merchant login** — JWT-based secure auth
- **Dashboard** — live stats and active orders overview
- **Tables management** — CRUD + QR token generation
- **Categories management** — CRUD, active/inactive
- **Menu items management** — CRUD with images, pricing, availability
- **Orders dashboard** — status flow, polling refresh (ready for real-time in Phase 2)
- **Customer QR menu** — mobile-first ordering experience
- **Cart + order placement** — full order creation flow
- **Multi-tenant** — all queries scoped to restaurant

### Routes
- `/login` — merchant login
- `/dashboard` — overview dashboard
- `/tables` — tables management
- `/categories` — categories management
- `/menu-items` — menu items management
- `/orders` — orders dashboard
- `/menu/[slug]/[token]` — public customer QR menu

### API Routes
- `POST /api/auth/[...nextauth]` — NextAuth handler
- `GET/POST /api/tables` — tables CRUD
- `PATCH/DELETE /api/tables/[id]`
- `GET/POST /api/categories`
- `PATCH/DELETE /api/categories/[id]`
- `GET/POST /api/menu-items`
- `PATCH/DELETE /api/menu-items/[id]`
- `GET/POST /api/orders`
- `PATCH /api/orders/[id]` — update order status
- `GET /api/public/[slug]/[token]` — public menu data

### Key Commands (from workspace root)
```bash
# Install packages
pnpm install --filter @workspace/restaurant-qr

# Prisma commands (run from artifacts/restaurant-qr/)
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Demo Credentials
- Email: `demo@restaurant.com`
- Password: `demo123`
- Restaurant slug: `demo-bistro`
- Sample QR URL: `/menu/demo-bistro/<qrToken>` (get token from tables page)

### Future Ready
- Real-time order notifications (Phase 2 — add WebSocket or SSE)
- QR code image generation (Phase 2)
- Admin panel
- Staff roles
- Subscriptions/billing
- Docker deployment (Dokploy-ready — no Replit lock-in)

---

## Other Artifacts (unused by main app)

- `artifacts/api-server` — Express API server (not used by restaurant app)
- `artifacts/mockup-sandbox` — UI prototyping canvas

## Shared Libraries (for api-server, not restaurant-qr)

- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands (workspace root)

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
