# RetailAdmin — E-commerce Admin Dashboard

A production-ready admin dashboard for an e-commerce retail business, built with **Next.js (App Router)**, **MongoDB/Mongoose**, **Tailwind CSS**, **Cloudflare R2**, **Resend**, and secure **HTTP-only cookie session auth**.

## Stack

- **Framework:** Next.js 16 (App Router, Route Handlers, Proxy/Middleware)
- **Database:** MongoDB via Mongoose ODM
- **Styling:** Tailwind CSS 4
- **Auth:** Stateless JWT stored in an HTTP-only, secure, `SameSite=Lax` cookie (signed with `jose`), bcrypt password hashing
- **File storage:** Cloudflare R2 (S3-compatible) with automatic local-disk fallback when R2 credentials aren't configured
- **Email:** Resend with reusable HTML templates (gracefully no-ops if `RESEND_API_KEY` is missing)
- **Charts:** Recharts
- **Icons:** lucide-react

## Getting started

```bash
npm install
npx tsx scripts/seed.ts   # creates the first Super Admin + sample catalog/orders
npm run dev
```

Default seeded login: **admin@example.com / Admin@12345** (change immediately via the Profile page).

## Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (e.g. MongoDB Atlas in production). If unreachable, the app automatically falls back to an embedded MongoDB instance for local/sandbox convenience. |
| `AUTH_SECRET` | Secret used to sign session JWTs. Use a long random string in production. |
| `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_SECONDS` | Session cookie configuration. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_ENDPOINT` | Cloudflare R2 credentials for image/file uploads. If left blank, uploads are stored under `/public/uploads` instead. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend transactional email credentials. If left blank, emails are skipped (logged only). |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Used only by `scripts/seed.ts`. |

## Architecture

- `src/models` — Mongoose schemas: `Admin`, `Category`, `Product`, `Customer`, `Order`, `Payment`, `Notification`, `StockLog`, `Settings`.
- `src/lib` — `db.ts` (connection), `auth.ts` (sessions/password hashing), `r2.ts` (uploads), `email.ts` (Resend + templates), `notify.ts` (notification + email triggers), `validators.ts` (Zod schemas), `api-utils.ts` (consistent API responses/error handling).
- `src/app/api/*` — REST API route handlers for every module (auth, products, categories, orders, stock, customers, payments, notifications, settings, uploads, dashboard stats).
- `src/app/(dashboard)/dashboard/*` — protected admin UI pages (Overview, Products, Categories, Orders, Stock, Customers, Payments, Notifications, Settings, Profile).
- `src/proxy.ts` — route protection: verifies the session cookie for all pages/APIs except `/login`, `/api/auth/*`, and `/api/health`.
- `src/components` — reusable UI primitives (Button, Input, Modal, ConfirmDialog, Table, Pagination, Toast, ImageUploader) and layout (Sidebar, Header, Breadcrumbs).

## Role-based access control

The `Admin` model already stores a `role` field (`super_admin`, `admin`, `order_manager`, `product_manager`, `inventory_manager`) so permission checks per-route can be layered on top of `getSession()` without further schema changes.

## Notes for production

- Point `MONGODB_URI` to a managed cluster (e.g. MongoDB Atlas).
- Configure real Cloudflare R2 and Resend credentials.
- Set a strong, unique `AUTH_SECRET` and ensure the app is served over HTTPS (the session cookie is marked `secure` automatically when `NODE_ENV=production`).
