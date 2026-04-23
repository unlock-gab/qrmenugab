# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a multi-restaurant QR ordering SaaS platform built with Next.js.

## Main Application: Restaurant QR Ordering System

`artifacts/restaurant-qr` — Full-stack Next.js application for restaurant QR ordering (SaaS multi-tenant).

### Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT, credentials provider)
- **Styling**: Tailwind CSS v4
- **Validation**: Zod

### User Roles
- `PLATFORM_ADMIN` — Platform owner; manages all restaurants, users, plans via `/admin/*`
- `MERCHANT_OWNER` — Restaurant owner; manages their restaurant via `/dashboard/*`
- `MERCHANT_STAFF` — Restaurant staff; limited access to operational pages

### Demo Credentials
- **Platform Admin**: admin@platform.com / admin123
- **Merchant Demo**: demo@restaurant.com / demo123
- **Restaurant slug**: demo-bistro
- **Customer QR URL**: `/menu/demo-bistro/cmob92hw3000mqx34h7llmvgu`

### Key Configuration
- `.env.local`: `NEXTAUTH_URL=http://localhost:80`, `NEXTAUTH_SECRET=dev-local-secret-...`
- Port: 80 (Replit proxy) → 21363 (Next.js dev)
- Express API server: port 8080 (at `/express-api`, separate from Next.js `/api`)

---

## Phase 1 Features (MVP)
- Merchant login (JWT/NextAuth)
- Dashboard with live stats
- Tables management + QR token generation
- Categories + Menu Items CRUD
- Orders dashboard with status flow
- Customer QR menu (mobile-first)
- Cart + order placement

## Phase 2 Features
- QR Code generation with download/print
- Sound notifications (Web Audio API, no external file)
- Settings page (restaurant profile, currency, sound toggle)
- Enhanced dashboard (stat cards: New/Preparing/Ready/Revenue)
- Improved orders view (detail modal, seen tracking, 8s polling)
- Enhanced customer menu UX

## Phase 3 Features (SaaS Platform)
- **Platform Admin Panel** at `/admin/*` (dark slate theme, separate from merchant)
- **Role-based route protection** in middleware (PLATFORM_ADMIN vs MERCHANT_OWNER/STAFF)
- **Admin Dashboard**: platform-wide metrics (restaurants, users, orders, tables)
- **Admin Restaurant Management**: list, create (with owner account), edit, change status, assign plan
- **Admin Plans Management**: create/edit subscription plans with limits
- **Admin Users Page**: view all users with role badges
- **Restaurant Status Lifecycle**: ACTIVE, INACTIVE, SUSPENDED, PENDING_SETUP
- **Subscription-Ready Architecture**: SubscriptionPlan + RestaurantSubscription models
- **Merchant Onboarding Flow**: multi-step guided setup at `/onboarding`
- **Staff Management**: merchant owners can add/deactivate MERCHANT_STAFF users
- **Subscription Page**: read-only plan view with usage bars
- **White-label Branding**: `primaryColor` applied to customer menu header
- **Usage Limits**: max tables, menu items, staff enforced at API level
- **Public Route Hardening**: proper status messages for SUSPENDED/INACTIVE/PENDING restaurants

---

## Routes

### Public
- `/login` — sign in (redirects by role)
- `/menu/[slug]/[token]` — public customer QR menu (with branding + status checks)

### Platform Admin (`/admin/*`)
- `/admin/dashboard` — platform metrics overview
- `/admin/restaurants` — all restaurants list + status filter
- `/admin/restaurants/new` — create restaurant + owner account
- `/admin/restaurants/[id]` — manage restaurant (info, status, plan, users)
- `/admin/plans` — subscription plans CRUD
- `/admin/users` — all users with role filter

### Merchant (`/dashboard/*`)
- `/dashboard` — restaurant overview
- `/orders` — orders management
- `/tables` — tables + QR codes
- `/categories` — menu categories
- `/menu-items` — menu items
- `/staff` — staff management (owner only)
- `/subscription` — current plan + usage
- `/settings` — restaurant settings

### Onboarding
- `/onboarding` — multi-step setup (PENDING_SETUP merchants redirected here)

---

## API Routes

### NextAuth
- `POST /api/auth/[...nextauth]`

### Merchant APIs
- `/api/settings` — GET/PATCH restaurant settings
- `/api/tables` — GET/POST tables (with limit check)
- `/api/tables/[id]` — PATCH/DELETE
- `/api/categories` — GET/POST
- `/api/categories/[id]` — PATCH/DELETE
- `/api/menu-items` — GET/POST (with limit check)
- `/api/menu-items/[id]` — PATCH/DELETE
- `/api/orders` — GET/POST
- `/api/orders/[id]` — PATCH
- `/api/merchant/staff` — GET/POST staff
- `/api/merchant/staff/[id]` — PATCH (activate/deactivate)
- `/api/merchant/subscription` — GET current plan + usage
- `/api/onboarding` — GET status, POST steps

### Platform Admin APIs
- `/api/admin/stats` — platform metrics
- `/api/admin/restaurants` — GET list, POST create
- `/api/admin/restaurants/[id]` — GET, PATCH, DELETE
- `/api/admin/plans` — GET list, POST create
- `/api/admin/plans/[id]` — PATCH, DELETE (deactivate)
- `/api/admin/users` — GET all users

### Public APIs
- `/api/public/menu` — customer menu data
- `/api/orders` (public POST) — place order

---

## Database Schema (Prisma)

### Enums
- `UserRole`: PLATFORM_ADMIN, MERCHANT_OWNER, MERCHANT_STAFF
- `RestaurantStatus`: ACTIVE, INACTIVE, SUSPENDED, PENDING_SETUP
- `OrderStatus`: NEW, PREPARING, READY, SERVED, PAID, CANCELLED
- `SubscriptionStatus`: TRIAL, ACTIVE, EXPIRED, CANCELLED

### Models
- `User` — with role, isActive, restaurantId
- `Restaurant` — with status, onboardingCompleted, primaryColor, secondaryColor
- `SubscriptionPlan` — name, price, maxTables, maxMenuItems, maxStaffUsers
- `RestaurantSubscription` — links restaurant ↔ plan with status/dates
- `Table` — with qrToken, isActive
- `Category`, `MenuItem`, `Order`, `OrderItem`

---

## Lib Utilities
- `src/lib/permissions.ts` — role helpers (requirePlatformAdmin, requireMerchant, etc.)
- `src/lib/limits.ts` — usage limit checks (checkTableLimit, checkMenuItemLimit, checkStaffLimit)
- `src/lib/auth.ts` — NextAuth config
- `src/lib/prisma.ts` — Prisma client
- `src/lib/sound.ts` — Web Audio API beep

## Docker / VPS Readiness
- No Replit-specific services used
- All config via environment variables
- DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET required in production
- Portable Next.js build
