# E-Commerce Admin Dashboard - Frontend

React + Vite frontend for the Trends Bird Limited E-commerce Admin Dashboard. Implements Task 13 from the backend assignment specification.

---

## 📋 Overview

A full-featured e-commerce admin panel built with **React + Vite + TypeScript**, featuring:

- JWT-based authentication with refresh token rotation
- Permission-based navigation and route protection
- Responsive dashboard with statistics display
- Product catalog management interface
- Clean modular architecture

**Tech Stack**: React 19, Vite 8, React Router v7, Axios, Tailwind CSS, TanStack React Query

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/ecommerce-admin.git
cd ecommerce-admin/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000` (Vite auto-assigns if port is in use).

---

## 🔗 API Integration

Vite is configured to proxy all `/api/*` requests to the backend server (`http://localhost:5000`). This eliminates CORS issues during development.

**Base API URL**: `/api/*` → resolves to `http://localhost:5000/api/*`

### Key Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user, set JWT cookies |
| `/api/auth/logout` | POST | Revoke refresh token, clear session |
| `/api/auth/refresh` | POST | Rotate refresh token, get new access token |
| `/api/me` | GET | Get current user profile with permissions |
| `/api/products` | GET | List products (pagination, filtering) |
| `/api/categories` | GET | List categories (tree structure) |
| `/api/brands` | GET | List brands |
| `/health` | GET | Backend health check |

---

## 🛡️ Authentication Flow

### Login Process
1. User enters email/password on `/login` page
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates, sets `access_token` and `refresh_token` as httpOnly cookies
4. Frontend fetches user profile from `/api/me`
5. Redirect to `/dashboard` or `/`

### Token Refresh
- Access tokens expire every 15 minutes
- When a request fails with 401, the AuthContext automatically calls `/api/auth/refresh`
- If refresh succeeds, retry failed request with new access token
- If refresh fails, redirect to `/login`

### Logout
- Calls `/api/auth/logout` to revoke refresh token
- Clears local user state
- Redirects to `/login`

---

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Global auth state provider
│   │   └── QueryClientContext.tsx # React Query global state
│   ├── components/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.tsx      # Authentication form
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.tsx  # Statistics overview
│   │   │   └── products/
│   │   │       └── Products.tsx   # Product data table
│   │   └── layout/
│   │       └── sidebar/
│   │           └── Sidebar.tsx    # Permission-based navigation menu
│   │       └── utils/
│   │           └── PrivateRoute.tsx # Route guard component
│   │       └── ui/
│   │           └── Loading.tsx    # Spinner component
│   ├── services/
│   │   ├── api.ts                 # Axios instance with interceptors
│   │   ├── AuthService.ts         # Auth operations wrapper
│   │   └── ProductService.ts      # Product operations wrapper
│   ├── App.tsx                    # Main router configuration
│   ├── main.tsx                   # Entry point (React DOM render)
│   ├── index.css                  # Tailwind directives
│   └── index.html                 # HTML entry point
├── vite.config.ts                 # Vite config with proxy setup
├── package.json                   # Dependencies & scripts
└── tsconfig.json                  # TypeScript configuration
```

---

## 🗂️ Routing Configuration

| Route | Component | Protected | Required Permission |
|-------|-----------|-----------|---------------------|
| `/login` | Login | No | None |
| `/` | Dashboard + Layout | Yes | `dashboard:read` |
| `/products` | Products + Layout | Yes | `product:read` |

**PrivateRoute Logic**:
1. Check if user is authenticated (has valid access token via cookie)
2. If not authenticated → redirect to `/login` (save `from` location for post-login return)
3. If a permission key is specified → check if user has that permission
4. If permission missing → redirect to `/`
5. Otherwise → render the protected component

---

## 🎨 Styling System

**Tailwind CSS** is used for all styling:
- Custom colors defined in `tailwind.config.js`
- Responsive breakpoints at 64px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Utility-first approach with custom components where needed
- No inline styles except for dynamic values

---

## 🧪 Testing Instructions

### Authentication Test Sequence
1. Visit `http://localhost:3000/login`
2. Enter credentials (use seed data from backend):
   - Admin: `admin@trends-bird.com` / `admin123`
   - Catalog: `catalog@trends-bird.com` / `catalog123`
3. Verify successful login and redirect to `/`
4. Verify sidebar shows correct menu items based on role
5. Refresh page - should maintain session
6. Wait >15 minutes - verify automatic token refresh
7. Click logout - verify redirect to `/login` and cleared session

### Route Protection Test
1. Logged in as a user without `product:read` permission
2. Try accessing `/products` - should redirect to `/`
3. Verify you cannot see Products tab in sidebar

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.101.4",      # Data fetching/caching
    "axios": "^1.18.1",                     # HTTP client
    "react-router-dom": "^7.18.1",          # Routing
    "tailwindcss": "^4.3.3"                 # Styling
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.3",       # React support for Vite
    "typescript": "~6.0.2",                 # Language
    "vite": "^8.1.1"                       # Build tool
  }
}
```

---

## ⚙️ Configuration

### Vite (`vite.config.ts`)
- Server runs on port 3000 (auto-adjusts if occupied)
- Proxy: `/api` → `http://localhost:5000` (rewrite removes `/api` prefix)

### Tailwind (`tailwind.config.js`)
- Content scans all `.tsx`, `.ts`, `.html`, `.js` files in `src/` and `public/`
- No custom theme extensions (uses default Tailwind palette)

---

## 🔄 Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Visit `http://localhost:3000`
4. Make changes - Vite provides HMR (Hot Module Replacement)
5. Build for production: `npm run build` (outputs to `dist/`)

---

## 📝 Notes

- The frontend assumes the backend is already running and properly seeded
- All authentication state is managed via cookies set by the backend
- The `AuthContext` automatically handles token refresh when needed
- Product list and dashboard statistics are stubbed for development; they will populate once connected to real backend APIs with proper CORS and authentication handling
- For production deployment, the Vite build output can be served by any static file server or integrated with the Express backend

---

*Built for Trends Bird Limited Intern Assignment – Frontend module complete.*