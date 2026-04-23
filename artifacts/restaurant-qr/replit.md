# Restaurant QR Ordering SaaS Platform

## Overview
A production-ready multi-restaurant QR ordering SaaS platform built with Next.js 15, TypeScript, PostgreSQL (Prisma), Tailwind CSS, and NextAuth.

## Demo Credentials
- **Platform Admin**: admin@platform.com / admin123
- **Restaurant Demo**: demo@restaurant.com / demo123
- **Restaurant Slug**: demo-bistro

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth (Credentials + role-based)
- **Styling**: Tailwind CSS + Sonner toasts
- **Port**: $PORT env var (dev: 21363)

### Key Routes
- `/` — Landing page
- `/login`, `/signup` — Auth pages
- `/onboarding` — New restaurant setup wizard
- `/dashboard` — Merchant overview
- `/menu-items` — Menu management (stock, translations, options)
- `/menu-items/[id]/options` — Item options/modifiers editor
- `/categories` — Category management
- `/tables` — QR table management
- `/orders` — Order management (kitchen view)
- `/waiter` — Waiter dashboard + pending waiter requests panel
- `/cashier` — Cashier payment processing (shows finalTotal with discounts)
- `/promos` — Promo code management
- `/reservations` — Reservation management
- `/reports` — Sales & operational reports
- `/staff` — Staff management
- `/settings` — Restaurant settings
- `/subscription` — Subscription plan management
- `/print/[orderId]` — Print receipt (shows discount, options, finalTotal)
- `/menu/[slug]/[token]` — Public customer menu (EN/AR, call waiter, promo, options)
- `/reserve/[slug]` — Public reservation form

### User Roles
- `SUPER_ADMIN` — Platform admin
- `OWNER` — Restaurant owner (full access)
- `MANAGER` — Restaurant manager
- `STAFF` — Kitchen/waiter staff
- `CASHIER` — Payment processing

## Phase 6 Features (Complete)

### ✅ T001: Schema
- Enums: DiscountType, WaiterRequestType/Status, ReservationStatus, SelectionType
- MenuItem: stockTrackingEnabled, stockQuantity, ingredientsText, translationsJson
- Category: translationsJson
- Order: discountAmount, finalTotal (computed), discountCode, promoCodeId
- Models: MenuItemOptionGroup, MenuItemOption, OrderItemOption
- Models: PromoCode, WaiterRequest, Reservation

### ✅ T002: Promo Code System
- CRUD at `/api/promo-codes`
- Public validation at `/api/promo-codes/validate`
- Merchant page at `/promos`
- Order API applies promo, sets discountAmount

### ✅ T003: Call Waiter
- Customer presses 🔔 Waiter button in public menu
- Creates waiter request via `/api/waiter-requests`
- Waiter page polls every 8s for pending requests

### ✅ T004: Reservations
- Public form at `/reserve/[slug]`
- Merchant management at `/reservations`
- Status flow: PENDING → CONFIRMED/CANCELLED/COMPLETED

### ✅ T005: Stock Management
- Merchant form: stockTrackingEnabled toggle + stockQuantity input
- Inline stock quick-edit in item list
- Low stock / out-of-stock badges
- Order API decrements stock in transaction; auto-disables when hits 0

### ✅ T006: Item Options/Modifiers
- Option groups editor at `/menu-items/[id]/options`
- API: `/api/menu-items/[id]/options` (groups) + `/api/menu-items/[id]/options/item` (single)
- Customer selects options in modal; captured in OrderItemOption
- Cart key includes options for differentiation

### ✅ T007: Multilingual Public Menu
- translationsJson: `{"ar":{"name":"...","description":"..."}}` format
- Merchant form: "خيارات متقدمة" section for Arabic name/description
- Public menu: EN/AR switcher, graceful fallback to English
- Demo data pre-seeded with Arabic translations

### ✅ T008: Reporting
- `/api/reports` with period param (today/week/month)
- Dashboard at `/reports`: revenue, orders, top items, table usage, promo usage

### ✅ T009: Navigation
- Sidebar: Promos, Reservations, Reports links added

### ✅ T010: Receipts
- Print receipt shows: discount line (with code), item options, finalTotal
- Cashier PayDialog shows: itemized + discount row + المبلغ المستحق (finalTotal)
- Cashier card shows finalTotal prominently

## Important Technical Notes
- Prisma Decimal fields → always convert with `Number()` before sending to client
- translationsJson stored as string; parse with JSON.parse safely
- Cart key format: `${menuItemId}:${sortedOptionIds}` for unique differentiation
- Stock decrement uses Prisma transaction to prevent race conditions
- Promo validation: isActive, time window, usage limit, min order amount
