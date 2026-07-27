# 🏭 Trends Bird Limited - E-Commerce Admin Dashboard (Backend)

## 📋 Overview

Full-featured e-commerce admin panel built with **Express.js + TypeScript**, **Prisma ORM**, **PostgreSQL**, and following modular architecture for scalability. Implements Tasks 4-12 from the backend assignment specification.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18.x
- PostgreSQL ≥ 13.x
- Redis (for session management, optional)

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/ecommerce-admin.git
cd ecommerce-admin/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run seed script (first time only)
node scripts/seed-database.js

# Start development server
npm run dev

# Start production server
npm start
```

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── modules/                    # Feature modules (Auth, User, Role, Permission, Media, Category, Brand, Attribute, Product)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── role/
│   │   ├── permission/
│   │   ├── media/
│   │   ├── category/
│   │   ├── brand/
│   │   ├── attribute/
│   │   └── product/                # ⭐ Star feature module
│   │       ├── controllers/
│   │       ├── services/
│   │       └── *.routes.ts
│   ├── config/                     # Environment config & enums
│   ├── middleware/                 # Auth & error middleware
│   ├── utils/                      # Response helpers, logging
│   ├── validation/                 # Zod DTO schemas
│   └── app.ts                      # Express application entry
├── prisma/                         # Database schema & migrations
│   └── schema.prisma
├── scripts/                        # Seed scripts
│   └── seed-database.js
├── .env                            # Environment variables
├── package.json
└── tsconfig.json
```

---

## 🔐 Authentication & Authorization

### JWT Strategy
- **Access Token**: 15 minutes expiration, short-lived for security
- **Refresh Token**: 7 days expiration, rotated on each use
- **Logout**: Revokes refresh token immediately

### RBAC System (`requirePermission` Middleware)
Each endpoint validates against a `permission_key:action` pattern:

| Module | Required Permission Pattern |
|--------|---------------------------|
| Authentication | `authentication:*` |
| User Management | `user_management:*` |
| Role Management | `role_management:*` |
| Permission Management | `permission_management:*` |
| Media Library | `media:*` |
| Category System | `category:*` |
| Brand System | `brand:*` |
| Attribute System | `attribute:*` |
| Product Module (⭐) | `product:*`, `product_variant:*`, `transaction:*` |

**Default Roles**:
- `SUPER_ADMIN` – All permissions (system-protected, cannot be deleted or downgraded)
- `ADMIN` – Full CRUD across most modules (excludes auth/permission management)
- `CATALOG_MANAGER` – Product, Category, Brand, Attribute, Media management
- `SUPPORT_AGENT` – Read-only access to products and media
- `VIEWER` – Limited read access to categories and brands

---

## 📦 Modules Overview

### 1. Authentication Task 4 ✅
- `/api/register` – Create new user account
- `/api/login` – Issue JWT access + refresh tokens
- `/api/logout` – Revoke refresh token
- `/api/refresh` – Rotate refresh token and issue new access token
- `/api/me` – Get current authenticated user profile

### 2. Permission Management Task 5 ✅
- CRUD permissions with pagination, search, and group filtering
- Each permission has a unique key (e.g., `product:create`)
- Protected by `requirePermission('permission_management:*')`

### 3. Role Management Task 6 ✅
- Assign/remove permissions to roles
- Safety guards prevent deletion of roles with active assignments
- Last super admin protected from deletion

### 4. User Management Task 7 ✅
- Self-escalation prevention (cannot upgrade own/other's role beyond authority)
- Password hashing with bcrypt (saltRounds: 10)
- Account state controls: activate/deactivate/lock/unlock

### 5. Media Library Task 8 ✅
- File upload via Multer (10MB limit)
- Thumbnail generation via Sharp (300×300px)
- Automatic file cleanup on delete
- Filter by type, status, uploader
- Endpoints: `POST /api/media`, `GET /api/media`, `DELETE /api/media/:id`

### 6. Category System Task 9 ✅
- Self-referential nested tree structure (infinite depth)
- Cycle detection prevents circular parent-child relationships
- Auto-generated slug with uniqueness enforcement
- Breadcrumb ancestry tracking
- Endpoints: `POST /api/categories`, `GET /api/categories/:id/ancestors`, `GET /api/categories/tree`

### 7. Brand System Task 10 ✅
- CRUD with status management (ACTIVE/INACTIVE)
- Logo attachment linked to Media model
- Endpoints: `POST /api/brands`, `GET /api/brands/:id`

### 8. Attribute System Task 11 ✅
- Four attribute types: TEXT, SELECT, COLOR, IMAGE
- Value management with sort ordering for UI display
- Many-to-many junction linking Products ↔ Attributes
- Endpoints: `POST /api/attributes/:id/values`, `GET /api/attributes/:id/values`

### 9. Product Module Task 12 (⭐ STAR) ✅
**Core Features:**
- Product CRUD with Category/Brand associations
- Variant-based SKU system per variant (not global product-wide)
- Per-variant pricing overriding base product price
- Inventory tracking per variant
- Attribute-value combinations for variants
- Transaction logging (CREATE/UPDATE/SELL/RESTOCK/ADJUST/TRANSFER)

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product |
| GET | `/api/products/{id}` | Get product with variants |
| PUT | `/api/products/{id}` | Update product |
| PATCH | `/api/products/{id}` | Partial update product |
| DELETE | `/api/products/{id}` | Delete product (requires no variants) |
| GET | `/api/products/{productId}/variants` | List all variants for product |
| POST | `/api/products/{productId}/variants` | Create variant |
| PUT | `/api/variants/{id}` | Update variant |
| DELETE | `/api/variants/{id}` | Delete variant |
| PUT | `/api/variants/{id}/restock` | Restock inventory (+quantity) |
| PUT | `/api/variants/{id}/sell` | Sell inventory (-quantity with validation) |
| GET | `/api/products/{productId}/transactions` | Transaction history |

**Transaction Types:**
- `CREATE` – Product/variant created
- `UPDATE` – Product/variant updated
- `SELL` – Unit sale (negative quantity)
- `RESTOCK` – Inventory replenishment (positive quantity)
- `ADJUST` – Inventory adjustment (damage/return)
- `DELETE` – Product/variant removed
- `TRANSFER` – Inter-warehouse transfer (future extension)

---

## 🗃️ Database Schema Highlights

**Key Relationships:**
- `User → Role` (many-to-one, cascade delete)
- `Role ↔ Permission` (many-to-many via RolePermission join)
- `Media ← Brand` (one-to-one optional, brand can have logo)
- `Category → Parent` (self-referential, nullable parentId)
- `Product → Category` (many-to-one)
- `Product → Brand` (many-to-one)
- `ProductVariant → Product` (many-to-one, one product has many variants)
- `ProductAttribute ↔ AttributeValue` (many-to-many junction)
- `ProductTransaction` (audit log for all product-state changes)

---

## 🔧 Configuration

### `.env.example` (Copy to `.env` and configure)

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db"

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-token-super-secret-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-super-secret-key-change-in-production

# Security
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_STRICT=LAX
SESSION_COOKIE_MAX_AGE=7d # Refresh token lifespan in milliseconds

# Paths
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=info
```

---

## 🧪 Testing

### Unit Tests (placeholder - implement with Jest)
```bash
npm install --save-dev jest @types/jest ts-jest
```

### Integration Test Example (cURL)

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product for development",
    "price": 99.99,
    "sku": "TEST001",
    "categoryId": "<category-id>",
    "brandId": "<brand-id>",
    "status": "PUBLISHED"
  }'
```

**Create Variant:**
```bash
curl -X POST http://localhost:3000/api/products/<product-id>/variants \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST001-VAR1",
    "price": 99.99,
    "inventory": 10,
    "attributeValueIds": ["<attribute-value-id>"]
  }'
```

**Sell Variant (Inventory Deduction):**
```bash
curl -X PUT http://localhost:3000/api/variants/<variant-id>/sell \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}'
```

---

## 🛡️ Security Measures Implemented

1. **JWT Rotation** – Access token refreshed on every successful refresh token use; old refresh token invalidated
2. **Password Hashing** – bcrypt with salt rounds = 10
3. **Input Validation** – Zod runtime validation on all request bodies/query params
4. **RBAC Enforcement** – `requirePermission` middleware on all protected routes
5. **Self-Escalation Prevention** – User cannot assign themselves or others a higher/equal role than their own
6. **Safety Guards** – Prevent deletion of resources with active dependencies (e.g., delete role if users assigned, delete category if child exists)
7. **SQL Injection Protection** – Prisma ORM parameterized queries
8. **CSRF Protection** – Enabled via `helmet()` middleware
9. **Rate Limiting** – (Implement via express-rate-limit for production)
10. **HTTPS Enforcement** – Set `SESSION_COOKIE_SECURE=true` in production

---

## 📊 Performance Optimizations

1. **Prisma Query Optimization** – `include`/`select` used to fetch only needed fields, pagination via `take`/`skip`
2. **Indexing** – Automatic indexes on foreign keys (`roleId`, `parentId`, `uploadedById`, etc.) and unique constraints (`email`, `sku`, `slug`, `key`)
3. **Thumbnail Generation** – Async processing in background, does not block API response
4. **Connection Pooling** – Prisma connection pool configured based on DB capacity

---

## 🔄 Migration Strategy

```bash
# Create a new migration
npx prisma migrate dev --name add_products

# Apply migrations to production
npx prisma migrate deploy

# Push schema to DB (development only)
npx prisma db push
```

Migrations are stored in `prisma/migrations/` and should be version-controlled.

---

## 📈 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
- [ ] Enable `SESSION_COOKIE_SECURE=true` (HTTPS required)
- [ ] Configure reverse proxy (Nginx/Caddy) with SSL termination
- [ ] Set up process manager (PM2/systemd) for auto-restart
- [ ] Configure logging aggregation (Winston + ELG stack or similar)
- [ ] Set up automated backups for PostgreSQL
- [ ] Implement health check endpoint (`/health`) for load balancer
- [ ] Configure CORS whitelist for frontend origin
- [ ] Set appropriate security headers via Helmet
- [ ] Enable gzip/brotli compression
- [ ] Implement rate limiting middleware
- [ ] Review all permissions in RBAC matrix
- [ ] Verify seed data matches production requirements
- [ ] Load test with simulated traffic (artillery/k6)

---

## 📞 Support & Maintenance

**Maintenance Schedule:**
- Weekly dependency updates (`npm outdated`, `npm audit`)
- Monthly security review of JWT rotation and logout flows
- Quarterly audit of RBAC permission assignments
- Bi-annual database performance review (indexes, slow queries)

**Emergency Procedures:**
- If JWT secret compromised: rotate immediately, invalidate all sessions via refresh token revocation list
- If database compromised: restore from backup, rotate all secrets, audit all accounts
- If unauthorized access detected: lock affected user accounts, trigger security audit, review logs

---

## 📄 License

MIT License – See LICENSE file for details.

---

*Built for Trends Bird Limited Backend Intern Assignment – Tasks 4 through 12 complete.*