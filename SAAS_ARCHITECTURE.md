# SaaS API Platform - Architecture & Design

## System Overview

A complete SaaS platform for selling APIs with subscription and pay-as-you-go billing models.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + OAuth2
- **Billing**: Stripe SDK
- **API Documentation**: Swagger/OpenAPI
- **Caching**: Redis
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **Charts**: Recharts
- **Auth**: JWT + localStorage + refresh tokens

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **API Gateway**: Express middleware
- **Rate Limiting**: redis-rate-limit
- **Monitoring**: Prometheus + Grafana (optional)

## Database Schema

### Core Tables

```
users
├── id (UUID, PK)
├── email (unique)
├── password_hash
├── first_name
├── last_name
├── company_name
├── status (active, suspended, deleted)
├── role (admin, user)
├── created_at
└── updated_at

organizations
├── id (UUID, PK)
├── owner_id (FK to users)
├── name
├── slug
├── avatar_url
├── created_at
└── updated_at

plans
├── id (UUID, PK)
├── name
├── billing_type (subscription, pay_as_you_go, hybrid)
├── price (monthly or per-unit)
├── stripe_product_id
├── stripe_price_id
├── features (JSON)
├── rate_limit (requests/minute)
├── monthly_limit (or null for unlimited)
├── status (active, archived)
├── created_at
└── updated_at

subscriptions
├── id (UUID, PK)
├── user_id (FK)
├── plan_id (FK)
├── stripe_subscription_id
├── billing_cycle_start
├── billing_cycle_end
├── status (active, past_due, cancelled)
├── auto_renew
├── cancellation_date
├── created_at
└── updated_at

api_keys
├── id (UUID, PK)
├── user_id (FK)
├── key_hash
├── name
├── last_used_at
├── created_at
├── expires_at
└── revoked_at

usage_logs
├── id (BIGSERIAL, PK)
├── user_id (FK)
├── api_key_id (FK)
├── endpoint
├── method
├── status_code
├── response_time_ms
├── tokens_used
├── cost
├── timestamp
└── ip_address

billing_records
├── id (UUID, PK)
├── user_id (FK)
├── subscription_id (FK)
├── invoice_id
├── amount
├── currency
├── status (paid, pending, failed)
├── period_start
├── period_end
├── stripe_invoice_id
├── created_at
└── updated_at

payment_methods
├── id (UUID, PK)
├── user_id (FK)
├── stripe_payment_method_id
├── type (card, bank)
├── last_four
├── is_default
├── created_at
└── updated_at

api_endpoints
├── id (UUID, PK)
├── name
├── description
├── path
├── method
├── rate_limit_per_minute
├── public (true/false)
├── created_at
└── updated_at

audit_logs
├── id (UUID, PK)
├── user_id (FK)
├── action
├── resource_type
├── resource_id
├── changes (JSON)
├── ip_address
├── timestamp
└── updated_at
```

## API Architecture

### Authentication Flow
1. User registers/logs in
2. Server issues JWT + Refresh token
3. Refresh token stored in HTTP-only cookie
4. JWT used for API requests
5. Rate limiting applied per API key

### Billing Flow
1. User selects plan
2. Stripe payment intent created
3. Payment processed
4. Subscription created in DB + Stripe
5. Webhook confirms payment
6. Access granted

### Usage Tracking Flow
1. API request comes in
2. Middleware validates API key
3. Rate limit checked
4. Request logged
5. Usage counter incremented
6. Response sent

## API Endpoints

### Admin Routes (`/api/admin/`)
- Authentication
  - `POST /auth/login`
  - `POST /auth/logout`
  
- User Management
  - `GET /users`
  - `POST /users`
  - `PUT /users/:id`
  - `DELETE /users/:id`
  - `POST /users/:id/suspend`
  
- Plans Management
  - `GET /plans`
  - `POST /plans`
  - `PUT /plans/:id`
  - `DELETE /plans/:id`
  
- Subscriptions
  - `GET /subscriptions`
  - `PUT /subscriptions/:id`
  - `POST /subscriptions/:id/cancel`
  
- Analytics
  - `GET /analytics/revenue`
  - `GET /analytics/users`
  - `GET /analytics/usage`
  - `GET /analytics/top-users`
  
- Billing
  - `GET /billing/invoices`
  - `GET /billing/revenue-report`

### User Routes (`/api/user/`)
- Authentication
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `POST /auth/verify-email`
  
- Account
  - `GET /account/profile`
  - `PUT /account/profile`
  - `PUT /account/password`
  - `DELETE /account`
  
- API Keys
  - `GET /api-keys`
  - `POST /api-keys`
  - `DELETE /api-keys/:id`
  - `POST /api-keys/:id/rotate`
  
- Usage & Analytics
  - `GET /usage/summary`
  - `GET /usage/detailed`
  - `GET /usage/by-endpoint`
  
- Subscriptions
  - `GET /subscription`
  - `POST /subscription/upgrade`
  - `POST /subscription/downgrade`
  - `POST /subscription/cancel`
  
- Billing
  - `GET /billing/invoices`
  - `POST /billing/payment-methods`
  - `GET /billing/payment-methods`
  - `DELETE /billing/payment-methods/:id`
  - `POST /billing/download-invoice/:id`

### API Gateway Routes (`/api/v1/`)
- Public API endpoints with rate limiting
- Authentication via API key in header
- Usage tracking middleware
- Error handling middleware

## Security Features

1. **Authentication**
   - JWT with expiration
   - Refresh token rotation
   - Email verification
   - OAuth2 support

2. **API Key Security**
   - Keys hashed with bcrypt
   - Secure generation (crypto.randomBytes)
   - Rotation capability
   - Expiration support

3. **Rate Limiting**
   - Per API key limits
   - Per IP limits
   - Sliding window algorithm
   - Redis-based for accuracy

4. **Data Protection**
   - HTTPS/TLS enforced
   - CORS configured
   - Input validation
   - SQL injection prevention
   - XSS protection

5. **Audit Trail**
   - All admin actions logged
   - User activity tracking
   - API usage logs
   - Billing event logs

## Pricing Models

### 1. Subscription-Based
- Monthly/annual plans
- Fixed features per tier
- Recurring billing via Stripe
- Upgrade/downgrade support

### 2. Pay-As-You-Go
- Usage-based billing
- Metered via Stripe
- Per-request or per-token pricing
- Real-time tracking

### 3. Hybrid
- Base subscription + overage charges
- Included quota + extra usage paid
- Most flexible model

## Monitoring & Analytics

1. **Dashboard Metrics**
   - Total users
   - Active subscriptions
   - Monthly recurring revenue (MRR)
   - API usage trends
   - Payment success rate

2. **User Metrics**
   - API calls per month
   - Cost per request
   - Most used endpoints
   - Quota utilization

3. **Performance**
   - API response times
   - Error rates
   - Rate limit hits
   - Database query performance

## Deployment

1. **Development**
   - Docker Compose for local dev
   - PostgreSQL + Redis containers
   - Hot reloading

2. **Production**
   - Docker containers
   - Kubernetes (optional)
   - PostgreSQL managed service
   - Redis cache layer
   - CDN for frontend
   - SSL/TLS certificates

## Phase Rollout

1. **Phase 1**: Core auth + admin API
2. **Phase 2**: User dashboard + API keys
3. **Phase 3**: Stripe integration
4. **Phase 4**: Rate limiting + usage tracking
5. **Phase 5**: Advanced analytics
6. **Phase 6**: OAuth2 + external integrations

---

This architecture provides a scalable, secure, and feature-rich SaaS platform ready for production deployment.
