# 🛍️ ShopClone — Production-Ready E-Commerce Platform

A full-stack e-commerce application with Next.js frontend, Express backend, PostgreSQL database, Stripe payments, and Docker deployment.

---

## 🏗️ Architecture

```
e-commerce/
├── frontend/          # Next.js 14 (App Router) + TypeScript + Tailwind
├── backend/           # Node.js + Express + TypeScript + Prisma
├── docker/            # Nginx configuration
├── docker-compose.yml # Full stack orchestration
└── README.md
```

## ✨ Features

| Feature      | Details                                          |
| ------------ | ------------------------------------------------ |
| **Auth**     | JWT + refresh tokens, bcrypt, password reset     |
| **Products** | Search, filter, sort, variants, reviews, ratings |
| **Cart**     | Guest + authenticated, cart merge on login       |
| **Checkout** | Multi-step, Stripe Elements, tax calc            |
| **Payments** | Stripe PaymentIntents + webhooks                 |
| **Orders**   | Full lifecycle, email notifications              |
| **Admin**    | Dashboard, analytics, inventory, order mgmt      |
| **Security** | Helmet, CORS, rate limiting, validation          |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Stripe account (for payments)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd frontend
cp .env.example .env.local
# Edit .env.local
```

**Required variables:**

| Variable                             | Description                                        |
| ------------------------------------ | -------------------------------------------------- |
| `DATABASE_URL`                       | PostgreSQL connection string                       |
| `JWT_SECRET`                         | Min 32-char random secret (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET`                 | Another 32-char secret                             |
| `STRIPE_SECRET_KEY`                  | `sk_test_...` from Stripe dashboard                |
| `STRIPE_PUBLISHABLE_KEY`             | `pk_test_...` from Stripe dashboard                |
| `STRIPE_WEBHOOK_SECRET`              | `whsec_...` from Stripe CLI/dashboard              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as `STRIPE_PUBLISHABLE_KEY` (frontend)        |

### 3. Database Setup

```bash
cd backend

# Push schema to database
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed sample data (categories, products, admin user)
npm run prisma:seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

### Demo Credentials (after seeding)

| Role  | Email                     | Password     |
| ----- | ------------------------- | ------------ |
| Admin | `admin@shopify-clone.com` | `Admin1234!` |
| User  | `user@example.com`        | `User1234!`  |

---

## 🐳 Docker Deployment

### 1. Configure production .env

```bash
# At project root, create .env
cp backend/.env.example .env
```

Fill in your production values (use strong secrets for JWT).

### 2. Build and Run

```bash
docker-compose up --build -d
```

This starts:

- **PostgreSQL** on port 5432
- **Backend** on port 4000
- **Frontend** on port 3000
- **Nginx** on port 80

### 3. Run Migrations in Docker

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

### Access

- Frontend: http://localhost
- API: http://localhost/api
- Backend direct: http://localhost:4000

---

## 💳 Stripe Configuration

### Test Mode Setup

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. Add them to your `.env` files

### Webhooks (Local Testing)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:4000/api/orders/webhook

# Copy the displayed webhook secret to STRIPE_WEBHOOK_SECRET
```

### Test Cards

| Card                  | Result                  |
| --------------------- | ----------------------- |
| `4242 4242 4242 4242` | Success                 |
| `4000 0000 0000 9995` | Insufficient funds      |
| `4000 0025 0000 3155` | 3D Secure auth required |

Use any future expiry date, any CVC, any postal code.

---

## 🧪 Testing

```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests cover:

- Auth (register, login, token refresh, /me)
- Products (listing with filters, detail, admin CRUD)

---

## 📡 API Reference

### Base URL: `http://localhost:4000/api`

#### Authentication

| Method | Endpoint                | Auth | Description      |
| ------ | ----------------------- | ---- | ---------------- |
| POST   | `/auth/register`        | ❌   | Register user    |
| POST   | `/auth/login`           | ❌   | Login            |
| POST   | `/auth/refresh`         | ❌   | Refresh tokens   |
| POST   | `/auth/logout`          | ✅   | Logout           |
| POST   | `/auth/forgot-password` | ❌   | Send reset email |
| POST   | `/auth/reset-password`  | ❌   | Reset password   |
| GET    | `/auth/me`              | ✅   | Get current user |

#### Products

| Method | Endpoint             | Auth  | Description                           |
| ------ | -------------------- | ----- | ------------------------------------- |
| GET    | `/products`          | ❌    | List (search, filter, sort, paginate) |
| GET    | `/products/featured` | ❌    | Featured products                     |
| GET    | `/products/:slug`    | ❌    | Product detail                        |
| POST   | `/products`          | Admin | Create product                        |
| PATCH  | `/products/:id`      | Admin | Update product                        |
| DELETE | `/products/:id`      | Admin | Soft delete                           |

#### Cart

| Method | Endpoint          | Auth     | Description      |
| ------ | ----------------- | -------- | ---------------- |
| GET    | `/cart`           | Optional | Get cart         |
| POST   | `/cart/items`     | Optional | Add item         |
| PATCH  | `/cart/items/:id` | Optional | Update qty       |
| DELETE | `/cart/items/:id` | Optional | Remove item      |
| POST   | `/cart/merge`     | ✅       | Merge guest cart |

#### Orders

| Method | Endpoint                     | Auth   | Description              |
| ------ | ---------------------------- | ------ | ------------------------ |
| POST   | `/orders`                    | ✅     | Create from cart         |
| POST   | `/orders/:id/payment-intent` | ✅     | Get Stripe client secret |
| GET    | `/orders`                    | ✅     | My orders                |
| GET    | `/orders/:id`                | ✅     | Order detail             |
| PATCH  | `/orders/:id/status`         | Admin  | Update status            |
| POST   | `/orders/:id/refund`         | Admin  | Refund order             |
| POST   | `/orders/webhook`            | Stripe | Webhook handler          |

#### Admin

| Method | Endpoint           | Auth  | Description      |
| ------ | ------------------ | ----- | ---------------- |
| GET    | `/admin/dashboard` | Admin | Analytics stats  |
| GET    | `/admin/inventory` | Admin | Inventory status |
| GET    | `/admin/users`     | Admin | All users        |

---

## 🔐 Security

- **Passwords**: bcrypt with 12 rounds
- **Tokens**: Short-lived JWT (15m) + rotating refresh tokens (7d)
- **Rate Limiting**: 100 req/15min general, 10 req/15min auth
- **Headers**: Helmet (CSP, XSS, HSTS, etc.)
- **Validation**: Zod on every input
- **CORS**: Whitelisted origins only
- **Stripe**: Webhook signature verification
- **SQL**: Prisma ORM prevents injection

---

## 📦 Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Backend  | Node.js, Express, TypeScript                  |
| Database | PostgreSQL + Prisma ORM                       |
| Payments | Stripe                                        |
| Auth     | JWT + bcrypt                                  |
| Email    | Nodemailer                                    |
| DevOps   | Docker, Docker Compose, Nginx                 |
| Testing  | Jest + Supertest                              |
