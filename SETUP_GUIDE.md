# SaaS API Platform - Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for rate limiting caching)
- Stripe account (for billing integration)
- npm or yarn

## Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd ToolBox
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Environment Setup

#### Backend Environment (.env)

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-secret-key-change-in-prod
JWT_REFRESH_SECRET=your-refresh-secret-change-in-prod
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
```

#### Frontend Environment (.env.local)

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
```

### 4. Database Setup

#### Create PostgreSQL Database

```bash
createdb saas_db
```

#### Run Prisma Migrations

```bash
cd backend
npm run db:migrate
npm run db:seed  # Optional: seed with sample data
```

#### Apply Prisma Schema

Copy the `PRISMA_SCHEMA.prisma` file to `backend/prisma/schema.prisma`:

```bash
cp PRISMA_SCHEMA.prisma backend/prisma/schema.prisma
```

Then run:

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

## Running the Application

### Development Mode

#### Terminal 1: Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

#### Terminal 2: Frontend

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Production Build

#### Backend

```bash
cd backend
npm run build
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout user
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/request-password-reset - Request password reset
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/me                - Get current user
```

### User Routes

```
API Keys:
GET    /api/user/api-keys          - List API keys
POST   /api/user/api-keys          - Create API key
DELETE /api/user/api-keys/:id      - Revoke API key
POST   /api/user/api-keys/:id/rotate - Rotate API key

Usage:
GET    /api/user/usage/summary     - Get usage summary
GET    /api/user/usage/detailed    - Get detailed usage logs
GET    /api/user/usage/monthly/:year/:month - Get monthly usage
GET    /api/user/usage/quota       - Get quota status
GET    /api/user/usage/by-endpoint - Get usage by endpoint

Subscriptions:
GET    /api/user/subscription      - Get current subscription
GET    /api/user/subscription/plans - List available plans
POST   /api/user/subscription/upgrade - Upgrade plan
POST   /api/user/subscription/downgrade - Downgrade plan
POST   /api/user/subscription/cancel - Cancel subscription

Billing:
GET    /api/user/billing/invoices  - List invoices
GET    /api/user/billing/payment-methods - List payment methods
POST   /api/user/billing/payment-methods - Add payment method
DELETE /api/user/billing/payment-methods/:id - Delete payment method
POST   /api/user/billing/payment-methods/:id/set-default - Set default
GET    /api/user/billing/overview  - Get billing overview
```

### Admin Routes

```
Analytics:
GET    /api/admin/analytics/revenue - Get revenue analytics
GET    /api/admin/analytics/api    - Get API usage analytics
GET    /api/admin/analytics/users  - Get user analytics
GET    /api/admin/analytics/top-users - Get top users

Users:
GET    /api/admin/users            - List all users
GET    /api/admin/users/:id        - Get user details
POST   /api/admin/users/:id/suspend - Suspend user
POST   /api/admin/users/:id/reactivate - Reactivate user
POST   /api/admin/users/:id/make-admin - Make user admin
POST   /api/admin/users/:id/remove-admin - Remove admin role
DELETE /api/admin/users/:id        - Delete user

Plans:
GET    /api/admin/plans            - List all plans
GET    /api/admin/plans/:id        - Get plan details
POST   /api/admin/plans            - Create plan
PUT    /api/admin/plans/:id        - Update plan
DELETE /api/admin/plans/:id        - Archive plan
```

## Stripe Integration

### Setup Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Create new endpoint
3. Set URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Test Stripe

```bash
# Using Stripe CLI
stripe listen --forward-to localhost:3001/api/stripe/webhook
stripe trigger customer.subscription.created
```

## Testing

### Backend Tests

```bash
cd backend
npm run test
npm run test:watch
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm run test
npm run test:watch
```

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### Heroku Deployment

```bash
# Create app
heroku create saas-api-platform

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# ... set other variables

# Deploy
git push heroku main
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql --version

# Create database if not exists
createdb saas_db

# Run migrations
cd backend
npx prisma migrate deploy
```

### JWT Token Expired

Tokens expire after 15 minutes. Use refresh token to get a new one:

```bash
POST /api/auth/refresh
Body: { "refreshToken": "your-refresh-token" }
```

### Rate Limiting Issues

If Redis is not running, rate limiting will be disabled. Install Redis:

```bash
# macOS
brew install redis

# Ubuntu
sudo apt-get install redis-server

# Start Redis
redis-server
```

### Stripe Webhook Not Receiving Events

1. Verify webhook URL is accessible
2. Check `STRIPE_WEBHOOK_SECRET` is correct
3. Review Stripe dashboard for failed webhooks
4. Check backend logs for errors

## Development Tools

### Generate Admin User

```bash
cd backend
npx ts-node scripts/create-admin.ts
```

### Seed Database

```bash
cd backend
npx prisma db seed
```

### Reset Database

```bash
cd backend
npx prisma migrate reset
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Restrict to specific domains
4. **Rate Limiting**: Enabled by default (15 requests/15 min per IP)
5. **API Keys**: Hash before storage, never log
6. **Passwords**: Minimum 8 characters, hashed with bcrypt
7. **Tokens**: Use short expiration times, rotate refresh tokens

## Next Steps

1. Create Admin Dashboard frontend (React components)
2. Create User Dashboard frontend (React components)
3. Add email notifications
4. Implement OAuth2 (Google, GitHub)
5. Add analytics dashboard
6. Set up monitoring (Sentry, DataDog)
7. Configure CI/CD pipeline
8. Add comprehensive testing

---

For support, create an issue in the repository or contact the team.
