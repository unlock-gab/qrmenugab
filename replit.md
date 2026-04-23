# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a multi-restaurant QR ordering SaaS platform built with Next.js.

### Internationalisation
- **Language**: French-first (fr-DZ locale), Arabic secondary
- **Currency**: DA (Algerian Dinar) — `formatDA()` in `src/lib/i18n.ts`
- **All 3 spaces fully in French**: Public marketplace (`/`), Merchant (`/merchant/*`), Admin (`/admin/*`)
- **Admin sidebar signOut** redirects to `/admin/login` (not merchant)

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
- `MERCHANT_OWNER` — Restaurant owner; full access to dashboard + all operational modes
- `MERCHANT_STAFF` — General staff; dashboard + all operational modes
- `STAFF_KITCHEN` — Kitchen-only access; redirects to `/kitchen` on login
- `STAFF_WAITER` — Waiter-only access; redirects to `/waiter` on login
- `STAFF_CASHIER` — Cashier-only access; redirects to `/cashier` on login

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
- `/dashboard` — restaurant overview (with operational shortcuts + unpaid orders stat)
- `/orders` — orders management
- `/tables` — tables + QR codes
- `/categories` — menu categories
- `/menu-items` — menu items
- `/staff` — staff management (owner only, supports role selection)
- `/subscription` — current plan + usage
- `/settings` — restaurant settings

### Operational Modes (Phase 5)
- `/kitchen` — Kitchen Display System (dark theme, shows NEW/PREPARING/READY, auto-refresh 8s, beep on new order)
- `/waiter` — Waiter workspace (table-centric, mark as SERVED, quick order overview)
- `/waiter/new-order` — Manual order entry (choose table + items + notes)
- `/cashier` — Cashier workspace (unpaid orders, mark as PAID + payment method)
- `/print/[orderId]` — Printable receipt (restaurant branding, items, total, payment method)

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

### Operational APIs (Phase 5)
- `/api/kitchen` — GET active orders for KDS (NEW/PREPARING/READY)
- `/api/waiter` — GET table overview with active orders
- `/api/cashier` — GET unpaid orders
- `/api/orders/[id]/pay` — POST mark order as PAID with payment method
- `/api/orders/manual` — POST create manual order (waiter access)
- `/api/orders/[id]` — PATCH extended with preparedAt/servedAt auto-timestamps

### Public APIs
- `/api/public/menu` — customer menu data
- `/api/orders` (public POST) — place order (legacy QR/DINE_IN)
- `/api/public/order` (POST) — place TAKEAWAY/DELIVERY order with customer info, loyalty, notifications

### Customer APIs (JWT cookie `customer_token`)
- `/api/customer/auth/register` — POST register customer
- `/api/customer/auth/login` — POST login customer
- `/api/customer/auth/me` — GET authenticated customer profile
- `/api/customer/auth/logout` — POST logout
- `/api/customer/orders` — GET order history for logged-in customer
- `/api/customer/loyalty` — GET loyalty accounts + transactions

### Branch APIs
- `/api/branches` — GET/POST (merchant-scoped)
- `/api/branches/[id]` — PATCH/DELETE

### Notification APIs
- `/api/notifications` — GET notification log (merchant-scoped)

---

## Phase 7 Routes
- `/order/[restaurantSlug]/[branchSlug]` — Public branch ordering page (takeaway/delivery)
- `/customer/login` — Customer login
- `/customer/register` — Customer registration
- `/customer/orders` — Customer order history
- `/branches` — Merchant branch management
- `/notifications` — Merchant notification log + settings

---

## Database Schema (Prisma)

### Enums
- `UserRole`: PLATFORM_ADMIN, MERCHANT_OWNER, MERCHANT_STAFF, STAFF_KITCHEN, STAFF_WAITER, STAFF_CASHIER
- `RestaurantStatus`: ACTIVE, INACTIVE, SUSPENDED, PENDING_SETUP
- `OrderStatus`: NEW, PREPARING, READY, SERVED, PAID, CANCELLED
- `PaymentStatus`: UNPAID, PAID
- `PaymentMethod`: CASH, CARD, TRANSFER, OTHER
- `OrderSource`: QR, MANUAL, ONLINE
- `OrderType`: DINE_IN, TAKEAWAY, DELIVERY
- `BranchStatus`: ACTIVE, INACTIVE
- `SubscriptionStatus`: TRIAL, ACTIVE, EXPIRED, CANCELLED
- `NotificationChannel`: EMAIL, SMS, WHATSAPP, PUSH
- `NotificationStatus`: PENDING, SENT, FAILED, SKIPPED
- `LoyaltyTransactionType`: EARN, REDEEM, EXPIRE, ADJUST

### Models
- `User` — with role, isActive, restaurantId, assignedBranchId
- `Restaurant` — with status, primaryColor, notificationsEnabled, notifyChannels, pointsPerUnit
- `Branch` — name, slug, address, phone, isDefault, status (branchId on Table/Order/Reservation/WaiterRequest)
- `SubscriptionPlan`, `RestaurantSubscription`
- `Table` — with qrToken, isActive, branchId
- `Category`, `MenuItem`
- `Order` — orderType, orderSource, customerName, customerPhone, deliveryAddress, customerId, branchId, loyaltyPointsAwarded
- `OrderItem`, `OrderItemOption`
- `Customer` — email, name, phone, passwordHash, isActive (separate JWT auth)
- `LoyaltyAccount` — customerId + restaurantId unique, pointsBalance
- `LoyaltyTransaction` — loyaltyAccountId, orderId, type, pointsDelta
- `NotificationLog` — channel, status, eventType, recipient, body, sentAt

---

## Lib Utilities
- `src/lib/permissions.ts` — role helpers (requirePlatformAdmin, requireMerchant, etc.)
- `src/lib/limits.ts` — usage limit checks (checkTableLimit, checkMenuItemLimit, checkStaffLimit)
- `src/lib/auth.ts` — NextAuth config
- `src/lib/prisma.ts` — Prisma client
- `src/lib/sound.ts` — Web Audio API beep
- `src/lib/customerAuth.ts` — Customer JWT (jose, httpOnly cookie `customer_token`, 30d)
- `src/lib/loyalty.ts` — awardLoyaltyPoints() — called when order marked PAID
- `src/lib/notifications.ts` — fireNotification() — logs events to NotificationLog

## Phase 7 i18n + Multi-Branch (Session Complete)
- **Completed**: T701-T710 (schema, branches, customer accounts, loyalty, notifications, delivery/takeaway, branch-aware ops + reports)
- **i18n system**: `src/lib/i18n.ts` — FR/AR translation dict + `formatDA()` for DA currency + `getLang/setLang` (localStorage)
  - French is DEFAULT, Arabic is secondary. Toggle button (عر/FR) on all public-facing pages
- **BranchSwitcher**: `src/components/dashboard/BranchSwitcher.tsx`
  - Merchant sidebar shows branch dropdown (MERCHANT_OWNER/MERCHANT_STAFF only)
  - `getBranchId()` / `setBranchId()` stored in localStorage key `selectedBranchId`
  - Dispatches `window.dispatchEvent(new Event("branchChanged"))` on change
  - Kitchen, Cashier, Reports pages listen to `branchChanged` and re-fetch filtered data
- **API branchId filtering**: `/api/kitchen?branchId=`, `/api/cashier?branchId=`, `/api/reports?branchId=`
- **Reports**: Added `branchBreakdown` + `orderTypeBreakdown` + `newCustomers` to `/api/reports` response
- **Merchant dashboard labels**: French-first (Sidebar, Kitchen, Cashier, Reports)
- **Public order page**: `/order/[restaurantSlug]/[branchSlug]` — French-first, DA currency, FR↔AR toggle
- **Customer pages**: login/register/orders — French-first with FR↔AR toggle

## Docker / VPS Readiness
- No Replit-specific services used
- All config via environment variables
- DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET required in production
- Portable Next.js build
