# E-Commerce Admin Dashboard

A full-featured, production-ready e-commerce admin panel built with **Express + TypeScript** (backend) and **Next.js 16** (frontend), featuring role-based access control, JWT token rotation, and a complete product management system with variants, inventory tracking, and transaction history.

Developed as part of the Backend Developer Intern assignment for **Trends Bird Limited**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Architecture](#architecture)
- [Security](#security)
- [Authentication & Authorization](#authentication--authorization)
- [Frontend](#frontend)
- [Seed Data](#seed-data)
- [Build & Quality](#build--quality)
- [Development Guidelines](#development-guidelines)

---

## Tech Stack

| Layer           | Technology                              | Version  |
| --------------- | --------------------------------------- | -------- |
| **Backend**     | Express.js                              | ^5.1.0   |
|                 | TypeScript                              | ^5.9.2   |
| **Frontend**    | Next.js (App Router)                    | ^16.2.12 |
|                 | React                                   | ^19.2.8  |
|                 | Tailwind CSS                            | ^4       |
|                 | Zustand                                 | ^5.0.14  |
|                 | React Query                             | ^5.10.4  |
|                 | React Hook Form                         | ^7.83.0  |
|                 | Zod                                     | ^4.4.3   |
| **Database**    | PostgreSQL                              | —        |
| **ORM**         | Prisma                                  | ^6.13.0  |
| **Auth**        | JWT (jsonwebtoken)                      | ^9.0.2   |
|                 | Bcrypt                                  | ^6.0.0   |
| **File Upload** | Multer                                  | ^2.0.2   |
|                 | Sharp                                   | ^0.34.3  |
| **Validation**  | Zod                                     | ^3.25.76 |
| **Security**    | Helmet, CORS, Rate Limiter, Compression | —        |
| **Linting**     | ESLint + Prettier                       | —        |

---

## Features

### Authentication & Security

- JWT access token (15 min) + refresh token (7 days) rotation
- Secure logout with token revocation
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- Helmet security headers
- CORS protection

### Role-Based Access Control (RBAC)

- Hierarchical user roles: Super Admin, Admin, Catalog Manager, Support Agent, Viewer
- Fine-grained permissions with CRUD operations per module
- System role protection (cannot delete/modify built-in roles)
- Permission middleware on every protected route
- Self-escalation prevention

### Product Management (Core Module)

- Full CRUD for products with draft/published/archived status
- **Product Variants** with unique SKUs, individual pricing, and stock
- **Attribute System** — TEXT, DROPDOWN, RADIO, CHECKBOX, COLOR_SWATCH, IMAGE_SWATCH
- **Inventory Transactions** — trace every stock change (create, sell, restock, adjust, transfer)
- Product-media gallery with thumbnail assignment
- Sale price and regular price support
- Featured product flag

### Catalog Management

- **Categories** — Nested tree structure with cycle detection, slug validation, breadcrumb support
- **Brands** — CRUD with status management, logo upload via media system
- **Attributes & Values** — Manage product attributes (Color, Size, etc.) with swatch support
- **Media Library** — Upload images/videos/documents, auto thumbnail generation via Sharp, filter by type

### Dashboard

- Aggregate statistics (total products, categories, brands, users, recent transactions)
- Real-time data from authenticated API

### Frontend

- Next.js 16 App Router with TypeScript
- Permission-based dynamic sidebar navigation
- Responsive dashboard layout
- Toast notifications
- Confirmation dialogs
- React Query for server state management
- Zustand for client-side auth state

---

## Project Structure

```
Ecommerce-admin-dashboard/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express app & middleware setup
│   │   ├── server.ts               # HTTP server entry point
│   │   ├── config/
│   │   │   ├── env.ts              # Environment variable validation
│   │   │   └── enums.ts            # Shared enum definitions
│   │   ├── database/
│   │   │   └── prisma.ts           # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts  # JWT authentication
│   │   │   ├── errorHandler.ts     # Global error handler
│   │   │   └── requestLogger.ts    # Development request logging
│   │   ├── modules/
│   │   │   ├── auth/               # Login, logout, refresh, /me
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   └── middleware/
│   │   │   ├── permission/         # Permission CRUD + role assignment
│   │   │   │   ├── controllers/
│   │   │   │   ├── middleware/
│   │   │   │   ├── permission.routes.ts
│   │   │   │   └── services/
│   │   │   ├── role/               # Role CRUD + permission management
│   │   │   │   ├── controllers/
│   │   │   │   ├── middleware/
│   │   │   │   ├── role.routes.ts
│   │   │   │   ├── routes/
│   │   │   │   └── services/
│   │   │   ├── user/               # User CRUD + status management
│   │   │   │   ├── controllers/
│   │   │   │   ├── middleware/
│   │   │   │   ├── user.routes.ts
│   │   │   │   ├── routes/
│   │   │   │   └── services/
│   │   │   ├── media/              # File upload, thumbnails, media library
│   │   │   │   ├── controllers/
│   │   │   │   ├── media.routes.ts
│   │   │   │   └── services/
│   │   │   ├── category/           # Nested category tree with cycle detection
│   │   │   │   ├── controllers/
│   │   │   │   ├── category.routes.ts
│   │   │   │   └── services/
│   │   │   ├── brand/              # Brand CRUD with media integration
│   │   │   │   ├── controllers/
│   │   │   │   ├── brand.routes.ts
│   │   │   │   └── services/
│   │   │   ├── attribute/          # Attributes & values management
│   │   │   │   ├── controllers/
│   │   │   │   ├── attribute.routes.ts
│   │   │   │   └── services/
│   │   │   ├── product/            # ⭐ Products, variants, inventory, transactions
│   │   │   │   ├── controllers/
│   │   │   │   ├── product.routes.ts
│   │   │   │   └── services/
│   │   │   └── dashboard/          # Aggregate statistics
│   │   │       ├── controllers/
│   │   │       ├── dashboard.routes.ts
│   │   │       └── services/
│   │   ├── types/
│   │   │   └── request.d.ts        # Express request type augmentation
│   │   ├── utils/
│   │   │   ├── apiResponse.ts      # Standardized API response helper
│   │   │   ├── appError.ts         # Custom error class
│   │   │   └── logger.ts           # Structured logging
│   │   └── validation/
│   │       └── schemas.ts          # Zod validation schemas
│   ├── prisma/
│   │   └── schema.prisma           # Database schema (22 models)
│   ├── scripts/
│   │   ├── seed-database.js        # Full seed script
│   │   └── seed-minimal.js         # Minimal seed script
│   ├── uploads/                    # Uploaded media files (gitignored)
│   ├── .env                        # Environment variables
│   ├── .env.example                # Environment template
│   ├── .eslintrc                   # ESLint configuration
│   ├── tsconfig.json               # TypeScript configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout with Geist fonts
│   │   │   ├── page.tsx            # Home redirect
│   │   │   ├── login/page.tsx      # Login page
│   │   │   ├── dashboard/          # Protected dashboard layout
│   │   │   │   ├── layout.tsx      # Sidebar + header layout
│  404 │   │   │   ├── page.tsx      # Dashboard overview
│   │   │   │   ├── products/       # Product listing & management
│   │   │   │   ├── categories/     # Category tree management
│   │   │   │   ├── brands/         # Brand CRUD
│   │   │   │   ├── attributes/     # Attribute & value management
│   │   │   │   ├── media/          # Media library
│   │   │   │   ├── permissions/    # Permission management
│   │   │   │   ├── roles/          # Role management
│   │   │   │   └── users/          # User management
│   │   │   ├── error.tsx           # Error boundary
│   │   │   └── protect.tsx         # Route guard
│   │   ├── components/
│   │   │   ├── ClientWrapper.tsx   # Hydration wrapper for Zustand
│   │   │   ├── Providers.tsx       # React Query provider
│   │   │   ├── Sidebar.tsx         # Permission-based navigation
│   │   │   ├── StatCard.tsx        # Dashboard stat cards
│   │   │   ├── ConfirmDialog.tsx   # Confirmation modal
│   │   │   └── ui/                 # Reusable UI components
│   │   │       ├── button.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       └── Toast.tsx
│   │   ├── lib/
│   │   │   ├── axios-client.ts     # Axios instance with interceptors
│   │   │   ├── query-client.ts     # React Query configuration
│   │   │   └── auth-utils.ts       # Token management utilities
│   │   ├── store/
│   │   │   └── authStore.ts        # Zustand auth store
│   │   └── types/
│   │       ├── index.ts            # TypeScript type definitions
│   │       └── icons.ts            # Icon type definitions
│   └── package.json
└── README.md
```

---

## Database Schema

The database consists of **22 models** across 6 conceptual domains:

### Identity & Access (5 models)

| Model            | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `User`           | User accounts with role, status, avatar, last login     |
| `Role`           | Role definitions with system protection flag            |
| `Permission`     | Granular permissions keyed by `module:action` pattern   |
| `RolePermission` | Junction table linking roles to permissions             |
| `RefreshToken`   | JWT rotation tokens with expiry and revocation tracking |

### Content & Catalog (7 models)

| Model            | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `Category`       | Nested tree via self-referencing `parentId`, slug-unique          |
| `Brand`          | Brand entities with status and optional logo media                |
| `Attribute`      | Product attributes (Color, Size, etc.) with type enum             |
| `AttributeValue` | Individual values linked to an attribute                          |
| `Media`          | Unified media library — images, videos, documents with thumbnails |
| `ProductMedia`   | Junction table: products ↔ media (gallery/thumbnail)              |
| `VariantMedia`   | Junction table: variants ↔ media                                  |

### Product & Inventory (6 models)

| Model                   | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `Product`               | Core product with status, pricing, stock, featured flag |
| `ProductVariant`        | Variant-level SKU, pricing, inventory, dimensions       |
| `ProductAttributeValue` | M:N junction: variants ↔ attribute values               |
| `ProductTransaction`    | Audit trail for all inventory movements                 |

### Dashboard (1 model)

| Model      | Description                               |
| ---------- | ----------------------------------------- |
| (computed) | Aggregate stats derived from other models |

### Key Relationships

```
User ──→ Role ──→ RolePermission ──→ Permission
  │
  └──→ RefreshToken

Product ──→ Brand
Product ──→ Category (many-to-many)
Product ──→ ProductVariant ──→ ProductAttributeValue ──→ AttributeValue ──→ Attribute
Product ──→ ProductMedia ──→ Media
Product ──→ ProductTransaction

Category ──→ Category (self-referencing tree)
Brand ──→ Media (logo)
```

### Indexes

- All foreign keys are indexed
- Unique indexes on `email`, `slug`, `sku`, `token`, `key`
- Composite index on `(productId, variantId, type)` for transactions
- Index on `expiresAt` for refresh token cleanup

---

## API Reference

All endpoints return a standardized response format:

```json
{ "success": true, "data": { ... }, "message": "..." }
// or on error:
{ "success": false, "message": "Error description" }
```

### Auth Endpoints

| Method | Endpoint            | Auth     | Description                                                |
| ------ | ------------------- | -------- | ---------------------------------------------------------- |
| POST   | `/api/auth/login`   | Public   | Login with email/password, returns access + refresh tokens |
| POST   | `/api/auth/refresh` | Public   | Rotate refresh token, returns new access token             |
| POST   | `/api/auth/logout`  | Public   | Revoke current refresh token                               |
| GET    | `/api/auth/me`      | Required | Get current user with permissions                          |

### Permission Endpoints

| Method | Endpoint                             | Permission          | Description                      |
| ------ | ------------------------------------ | ------------------- | -------------------------------- |
| GET    | `/api/permissions`                   | `permission:read`   | List all permissions (paginated) |
| GET    | `/api/permissions/:id`               | `permission:read`   | Get single permission            |
| POST   | `/api/permissions`                   | `permission:create` | Create permission                |
| PUT    | `/api/permissions/:id`               | `permission:update` | Full update permission           |
| PATCH  | `/api/permissions/:id`               | `permission:update` | Partial update permission        |
| DELETE | `/api/permissions/:id`               | `permission:delete` | Delete permission                |
| POST   | `/api/permissions/:id/roles/:roleId` | `permission:update` | Assign to role                   |
| DELETE | `/api/permissions/:id/roles/:roleId` | `permission:update` | Remove from role                 |

### Role Endpoints

| Method | Endpoint                                       | Permission    | Description                            |
| ------ | ---------------------------------------------- | ------------- | -------------------------------------- |
| GET    | `/api/roles`                                   | `role:read`   | List roles (paginated, searchable)     |
| GET    | `/api/roles/:id`                               | `role:read`   | Get single role                        |
| POST   | `/api/roles`                                   | `role:create` | Create role                            |
| PUT    | `/api/roles/:id`                               | `role:update` | Full update role                       |
| PATCH  | `/api/roles/:id`                               | `role:update` | Partial update role                    |
| DELETE | `/api/roles/:id`                               | `role:delete` | Delete role (guarded: no system roles) |
| POST   | `/api/roles/:roleId/permissions/:permissionId` | `role:update` | Assign permission                      |
| DELETE | `/api/roles/:roleId/permissions/:permissionId` | `role:update` | Remove permission                      |
| GET    | `/api/roles/:roleId/permissions`               | `role:read`   | Get role's permissions                 |

### User Endpoints

| Method | Endpoint                    | Permission    | Description                        |
| ------ | --------------------------- | ------------- | ---------------------------------- |
| GET    | `/api/users`                | `user:read`   | List users (paginated, filterable) |
| GET    | `/api/users/:id`            | `user:read`   | Get single user                    |
| POST   | `/api/users`                | `user:create` | Create user                        |
| PUT    | `/api/users/:id`            | `user:update` | Full update user                   |
| PATCH  | `/api/users/:id`            | `user:update` | Partial update user                |
| DELETE | `/api/users/:id`            | `user:delete` | Delete user                        |
| PUT    | `/api/users/:id/activate`   | `user:update` | Activate user                      |
| PUT    | `/api/users/:id/deactivate` | `user:update` | Deactivate user                    |
| PUT    | `/api/users/:id/lock`       | `user:update` | Lock user                          |
| PUT    | `/api/users/:id/unlock`     | `user:update` | Unlock user                        |
| GET    | `/api/users/:roleId`        | `user:read`   | Get users by role                  |

### Media Endpoints

| Method | Endpoint                         | Permission     | Description                        |
| ------ | -------------------------------- | -------------- | ---------------------------------- |
| GET    | `/api/media`                     | `media:read`   | List media (paginated, filterable) |
| GET    | `/api/media/:id`                 | `media:read`   | Get single media                   |
| POST   | `/api/media`                     | `media:create` | Upload file (multipart)            |
| PUT    | `/api/media/:id`                 | `media:update` | Full update media                  |
| PATCH  | `/api/media/:id`                 | `media:update` | Partial update media               |
| DELETE | `/api/media/:id`                 | `media:delete` | Delete media                       |
| GET    | `/api/media/assigned-to/:userId` | `media:read`   | Get user's uploaded media          |

### Category Endpoints

| Method | Endpoint                        | Permission        | Description                 |
| ------ | ------------------------------- | ----------------- | --------------------------- |
| GET    | `/api/categories`               | `category:read`   | List categories (paginated) |
| GET    | `/api/categories/tree`          | `category:read`   | Get full nested tree        |
| GET    | `/api/categories/:id/ancestors` | `category:read`   | Get breadcrumb path         |
| GET    | `/api/categories/:id`           | `category:read`   | Get single category         |
| POST   | `/api/categories`               | `category:create` | Create category             |
| PUT    | `/api/categories/:id`           | `category:update` | Full update category        |
| PATCH  | `/api/categories/:id`           | `category:update` | Partial update category     |
| DELETE | `/api/categories/:id`           | `category:delete` | Delete category             |

### Brand Endpoints

| Method | Endpoint                     | Permission     | Description             |
| ------ | ---------------------------- | -------------- | ----------------------- |
| GET    | `/api/brands`                | `brand:read`   | List brands (paginated) |
| GET    | `/api/brands/:id`            | `brand:read`   | Get single brand        |
| POST   | `/api/brands`                | `brand:create` | Create brand            |
| PUT    | `/api/brands/:id`            | `brand:update` | Full update brand       |
| PATCH  | `/api/brands/:id`            | `brand:update` | Partial update brand    |
| DELETE | `/api/brands/:id`            | `brand:delete` | Delete brand            |
| POST   | `/api/brands/:brandId/media` | `brand:update` | Assign logo media       |
| DELETE | `/api/brands/:brandId/media` | `brand:update` | Remove logo media       |

### Attribute Endpoints

| Method | Endpoint                     | Permission         | Description              |
| ------ | ---------------------------- | ------------------ | ------------------------ |
| GET    | `/api/attributes`            | `attribute:read`   | List attributes          |
| GET    | `/api/attributes/:id`        | `attribute:read`   | Get single attribute     |
| POST   | `/api/attributes`            | `attribute:create` | Create attribute         |
| PUT    | `/api/attributes/:id`        | `attribute:update` | Full update attribute    |
| PATCH  | `/api/attributes/:id`        | `attribute:update` | Partial update attribute |
| DELETE | `/api/attributes/:id`        | `attribute:delete` | Delete attribute         |
| GET    | `/api/attributes/:id/values` | `attribute:read`   | List attribute values    |
| POST   | `/api/attributes/:id/values` | `attribute:update` | Create attribute value   |
| PUT    | `/api/attribute-values/:id`  | `attribute:update` | Full update value        |
| PATCH  | `/api/attribute-values/:id`  | `attribute:update` | Partial update value     |
| DELETE | `/api/attribute-values/:id`  | `attribute:delete` | Delete value             |

### Product Endpoints (Star Module)

| Method | Endpoint                         | Permission       | Description                           |
| ------ | -------------------------------- | ---------------- | ------------------------------------- |
| GET    | `/api/products`                  | `product:read`   | List products (paginated, filterable) |
| GET    | `/api/products/:id`              | `product:read`   | Get product with variants             |
| POST   | `/api/products`                  | `product:create` | Create product                        |
| PUT    | `/api/products/:id`              | `product:update` | Full update product                   |
| PATCH  | `/api/products/:id`              | `product:update` | Partial update product                |
| DELETE | `/api/products/:id`              | `product:delete` | Delete product                        |
| GET    | `/api/products/:id/variants`     | `product:read`   | List product variants                 |
| POST   | `/api/products/:id/variants`     | `product:update` | Create variant                        |
| PUT    | `/api/variants/:id`              | `product:update` | Update variant                        |
| DELETE | `/api/variants/:id`              | `product:delete` | Delete variant                        |
| PUT    | `/api/variants/:id/restock`      | `product:update` | Restock inventory                     |
| PUT    | `/api/variants/:id/sell`         | `product:update` | Record sale                           |
| GET    | `/api/products/:id/transactions` | `product:read`   | Transaction history                   |

### Dashboard Endpoint

| Method | Endpoint               | Auth     | Description          |
| ------ | ---------------------- | -------- | -------------------- |
| GET    | `/api/dashboard/stats` | Required | Aggregate statistics |

### Health Check

| Method | Endpoint  | Description         |
| ------ | --------- | ------------------- |
| GET    | `/health` | Public health check |

---

## Installation & Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend
cd Ecommerce-admin-dashboard/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL credentials
# Create the database if it doesn't exist:
#   CREATE DATABASE ecommerce_admin_dashboard_db;

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run seed-init

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend
cd Ecommerce-admin-dashboard/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Environment Variables

### Backend (`.env`)

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_admin_dashboard_db"

# JWT Secrets — Generate with: openssl rand -hex 32
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Token Expiry
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Admin Seed Password
ADMIN_PASSWORD=Admin@123
```

### Frontend

The frontend proxies API requests to `localhost:5000` via Next.js `next.config` settings.

---

## Running the Application

### Development Mode

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Database Studio

```bash
cd backend
npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
```

---

## Architecture

### Backend Architecture

The backend follows a **clean modular architecture** with strict separation of concerns:

```
Route → Controller → Service → Prisma (Database)
              ↓
         Validation (Zod schemas)
              ↓
         Response Formatting (apiResponse.ts)
```

**Per Module Pattern:**

- `*.routes.ts` — Express route definitions with middleware composition
- `controllers/*.controller.ts` — Request/response handling, input extraction
- `services/*.service.ts` — Business logic, database operations, transactions
- `middleware/` — Module-specific middleware (permission checks)
- `dtos/` — Data transfer objects for request validation

**Cross-Cutting Concerns:**

- [app.ts](Ecommerce-admin-dashboard/backend/src/app.ts) — Global middleware composition (security, logging, error handling)
- [middleware/auth.middleware.ts](Ecommerce-admin-dashboard/backend/src/middleware/auth.middleware.ts) — JWT verification, user extraction
- [middleware/errorHandler.ts](Ecommerce-admin-dashboard/backend/src/middleware/errorHandler.ts) — Centralized error handling
- [validation/schemas.ts](Ecommerce-admin-dashboard/backend/src/validation/schemas.ts) — Shared Zod schemas
- [utils/apiResponse.ts](Ecommerce-admin-dashboard/backend/src/utils/apiResponse.ts) — Standardized JSON responses
- [utils/appError.ts](Ecommerce-admin-dashboard/backend/src/utils/appError.ts) — Custom error class with status codes

### Frontend Architecture

```
App Router (Next.js 16)
├── Layout Tree
│   ├── Root Layout (fonts, global CSS)
│   └── Dashboard Layout (sidebar, auth guard)
├── Pages (React Server Components + Client Components)
│   ├── Login — Authentication form
│   └── Dashboard/* — Module CRUD pages
├── Components
│   ├── Providers — React Query setup
│   ├── Sidebar — Permission-filtered navigation
│   ├── StatCard — Dashboard statistics
│   └── ui/* — Reusable primitive components
├── lib/
│   ├── axios-client — API client with auth interceptors
│   └── query-client — React Query configuration
└── store/
    └── authStore — Zustand auth state
```

---

## Security

| Concern               | Implementation                                                                      |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Authentication**    | JWT with short-lived access tokens (15 min) + rotating refresh tokens (7 days)      |
| **Password Security** | bcrypt hashing with appropriate work factor                                         |
| **Authorization**     | RBAC via `requirePermission` middleware on every protected route                    |
| **Input Validation**  | Zod schemas on all create/update endpoints                                          |
| **Rate Limiting**     | 10 requests/15 min on auth endpoints (bypassed in development)                      |
| **HTTP Security**     | Helmet headers (CSP, HSTS, X-Frame-Options, etc.)                                   |
| **CORS**              | Configured with credentials support                                                 |
| **SQL Injection**     | Prevented by Prisma ORM parameterized queries                                       |
| **File Upload**       | Multer with size limits (5MB), Sharp for thumbnail generation, mime-type validation |
| **Self-Escalation**   | Users cannot assign themselves super-admin roles                                    |
| **System Roles**      | Built-in roles (`isSystem: true`) cannot be deleted or modified                     |

---

## Authentication & Authorization

### JWT Token Flow

```
1. Login → POST /api/auth/login { email, password }
   → Returns: { accessToken, refreshToken }

2. Access protected API → Include accessToken in Authorization header
   → Middleware verifies JWT, attaches user to req

3. Refresh token expires → POST /api/auth/refresh { refreshToken }
   → Returns new accessToken (old refreshToken revoked)

4. Logout → POST /api/auth/logout { refreshToken }
   → Revokes refresh token in database
```

### Permission Key Pattern

Permissions follow a `module:action` naming convention:

| Permission Key      | Description        |
| ------------------- | ------------------ |
| `permission:read`   | View permissions   |
| `permission:create` | Create permissions |
| `permission:update` | Update permissions |
| `permission:delete` | Delete permissions |
| `role:read`         | View roles         |
| `role:create`       | Create roles       |
| `role:update`       | Update roles       |
| `role:delete`       | Delete roles       |
| `user:read`         | View users         |
| `user:create`       | Create users       |
| `user:update`       | Update users       |
| `user:delete`       | Delete users       |
| `media:read`        | View media         |
| `media:create`      | Upload media       |
| `media:update`      | Update media       |
| `media:delete`      | Delete media       |
| `category:read`     | View categories    |
| `category:create`   | Create categories  |
| `category:update`   | Update categories  |
| `category:delete`   | Delete categories  |
| `brand:read`        | View brands        |
| `brand:create`      | Create brands      |
| `brand:update`      | Update brands      |
| `brand:delete`      | Delete brands      |
| `attribute:read`    | View attributes    |
| `attribute:create`  | Create attributes  |
| `attribute:update`  | Update attributes  |
| `attribute:delete`  | Delete attributes  |
| `product:read`      | View products      |
| `product:create`    | Create products    |
| `product:update`    | Update products    |
| `product:delete`    | Delete products    |

---

## Frontend

### Pages

| Page           | Route                               | Description                   |
| -------------- | ----------------------------------- | ----------------------------- |
| Login          | `/login`                            | Email/password authentication |
| Dashboard      | `/dashboard`                        | Overview with statistics      |
| Products       | `/dashboard/products`               | Product listing with filters  |
| Create Product | `/dashboard/products/create`        | New product form              |
| Edit Product   | `/dashboard/products/[id]/edit`     | Product edit form             |
| Variants       | `/dashboard/products/[id]/variants` | Variant management            |
| Categories     | `/dashboard/categories`             | Category tree view            |
| Brands         | `/dashboard/brands`                 | Brand listing                 |
| Attributes     | `/dashboard/attributes`             | Attribute management          |
| Media Library  | `/dashboard/media`                  | File upload & management      |
| Permissions    | `/dashboard/permissions`            | Permission CRUD               |
| Roles          | `/dashboard/roles`                  | Role management               |
| Users          | `/dashboard/users`                  | User management               |

### Key Components

- **Sidebar** — Dynamically generated from user permissions
- **StatCard** — Reusable statistics display
- **ConfirmDialog** — Safe delete confirmation modal
- **Toast** — Success/error notification system
- **ClientWrapper** — Hydration-safe Zustand store wrapper

---

## Seed Data

The seed script creates:

1. **Permissions** — 35+ permissions across all modules
2. **Roles** — Super Admin, Admin, Catalog Manager, Support Agent, Viewer
3. **Super Admin User** — Default admin account (`admin@trendsbird.com`)
4. **Catalog User** — Catalog manager account for testing
5. **Sample Catalog Data** — Categories, brands, attributes, products with variants

### Running the Seed

```bash
cd backend
npm run seed-init
```

### Default Credentials

| Role            | Email                    | Password    |
| --------------- | ------------------------ | ----------- |
| Super Admin     | `admin@trendsbird.com`   | `Admin@123` |
| Catalog Manager | `catalog@trendsbird.com` | `Admin@123` |

---

## Build & Quality

### Backend Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run seed-init        # Seed database with initial data
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run format         # Format with Prettier
```

### Frontend Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Run production build
npm run lint     # Run ESLint
```

### TypeScript Configuration

- Strict mode enabled (`strict: true`)
- Target: ES2022, Module: CommonJS
- Path aliases: `@/*` → `src/*`
- No implicit any, strict null checks, strict function types
- Unused locals/parameters flagged as errors

---

## Development Guidelines

### Code Organization

- Each module has its own `routes/`, `controllers/`, `services/` directory
- Routes define endpoints with middleware composition
- Controllers handle HTTP I/O only
- Services contain all business logic
- Validation schemas in `validation/schemas.ts`

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Git Workflow

- Feature-based commits (one feature per commit)
- Meaningful commit messages
- Never commit secrets (`.env`, `.env.local`)

---

## Project Stats

| Metric                   | Value |
| ------------------------ | ----- |
| Backend TypeScript files | 48    |
| Frontend source files    | 50    |
| Database models          | 22    |
| API endpoints            | ~50   |
| Permission keys          | 35+   |
| User roles               | 5     |
| Attribute types          | 6     |
| Transaction types        | 7     |
| Backend dependencies     | 17    |
| Frontend dependencies    | 13    |

---

## License

Internal project — Ripon Mondal
