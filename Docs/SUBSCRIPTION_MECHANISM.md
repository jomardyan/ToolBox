# Subscription Mechanism Integration Summary

## Overview

This document describes the complete subscription mechanism implementation, including authentication, rate limiting, quota enforcement, billing, and dashboard integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Request ID Tracking                          │
│                  (Middleware Layer 1)                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Security Headers                            │
│                  (helmet, CORS, etc.)                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IP-Based Rate Limiting                       │
│               (200 requests per 15 min per IP)                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Tier-Based Rate Limiting                       │
│          (Dynamic based on subscription plan)                   │
│   Free: 10/min | Pro: 60/min | Enterprise: 1000/min           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Authentication                             │
│              (JWT Token or API Key)                             │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Usage Tracking                               │
│         (Track endpoint, method, response time)                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Quota Enforcement                             │
│           (Check monthly API call limits)                       │
│     Free: 1000/mo | Pro: 50k/mo | Enterprise: Unlimited       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Route Handler                                │
│              (Process business logic)                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Response                                   │
│    (With quota headers, rate limit headers, request ID)        │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Authentication Layer
**Files:**
- `backend/src/middleware/auth.ts`

**Features:**
- JWT token authentication
- API key authentication
- User status validation
- Role-based access control
- API key revocation and expiration checking

**Integration:**
- Applied per-route in route files
- Required for protected endpoints
- Populates `req.user` with authenticated user info

### 2. Rate Limiting

#### A. IP-Based Rate Limiting
**Purpose:** Prevent abuse from single IP addresses

**Configuration:**
```typescript
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 200,                   // 200 requests per window
```

**Applied to:** All `/api/*` routes

#### B. Tier-Based Rate Limiting
**File:** `backend/src/middleware/rateLimitByTier.ts`

**Configuration:**
| Tier | Requests/Minute |
|------|----------------|
| Free | 10 |
| Starter | 30 |
| Professional | 60 |
| Business | 120 |
| Enterprise | 1000 |

**Features:**
- Dynamic rate limiting based on subscription plan
- Database-driven limits from `Plan.rateLimit` field
- Graceful fallback to default limits
- User-friendly error messages with upgrade links

**Applied to:** All `/api/*` routes after IP rate limiting

### 3. Quota Enforcement
**File:** `backend/src/middleware/quotaEnforcement.ts`

**Features:**
- Monthly API call limit enforcement
- Billing cycle awareness
- Real-time usage counting
- Quota header responses
- Upgrade suggestions when quota exceeded

**Response Headers:**
```
X-Quota-Limit: 1000
X-Quota-Used: 742
X-Quota-Remaining: 258
X-Quota-Reset: 2025-12-01T00:00:00.000Z
```

**Applied to:** All `/api/*` routes after rate limiting

### 4. Usage Tracking
**File:** `backend/src/middleware/usageTracking.ts`

**Tracked Metrics:**
- User ID and API key ID
- Endpoint and HTTP method
- Status code
- Response time (milliseconds)
- IP address and user agent
- Error messages for failed requests
- Timestamp

**Database Model:**
```prisma
model UsageLog {
  id              BigInt
  userId          String
  apiKeyId        String?
  endpoint        String
  method          String
  statusCode      Int
  responseTimeMs  Int
  tokensUsed      Int
  cost            Float
  ipAddress       String?
  userAgent       String?
  errorMessage    String?
  timestamp       DateTime
}
```

**Features:**
- Non-blocking async tracking
- Doesn't impact request performance
- Comprehensive error logging
- Used for billing calculations

### 5. Subscription Management

#### Database Models

**Plan:**
```prisma
model Plan {
  id                String
  name              String
  type              PlanType
  price             Float
  currency          String
  billingPeriod     String
  rateLimit         Int
  monthlyLimit      Int?
  maxApiKeys        Int
  supportLevel      String
  status            PlanStatus
}
```

**Subscription:**
```prisma
model Subscription {
  id                    String
  userId                String
  planId                String
  stripeSubscriptionId  String?
  billingCycleStart     DateTime
  billingCycleEnd       DateTime
  status                SubscriptionStatus
  autoRenew             Boolean
}
```

#### API Endpoints

**Get Current Subscription:**
```
GET /api/user/subscription
Authorization: Bearer {token}
```

**List Available Plans:**
```
GET /api/user/subscription/plans
```

**Upgrade Subscription:**
```
POST /api/user/subscription/upgrade
Content-Type: application/json
Authorization: Bearer {token}

{
  "planId": "uuid"
}
```

**Downgrade Subscription:**
```
POST /api/user/subscription/downgrade
Content-Type: application/json
Authorization: Bearer {token}

{
  "planId": "uuid"
}
```

**Cancel Subscription:**
```
POST /api/user/subscription/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "Optional cancellation reason"
}
```

### 6. Billing Management

#### API Endpoints

**Get Billing Overview:**
```
GET /api/user/billing/overview
Authorization: Bearer {token}

Response:
{
  "subscription": {...},
  "totalSpent": 149.97,
  "pendingAmount": 29.99,
  "lastInvoice": {...}
}
```

**List Invoices:**
```
GET /api/user/billing/invoices?page=1&pageSize=10
Authorization: Bearer {token}
```

**Get Payment Methods:**
```
GET /api/user/billing/payment-methods
Authorization: Bearer {token}
```

**Add Payment Method:**
```
POST /api/user/billing/payment-methods
Content-Type: application/json
Authorization: Bearer {token}

{
  "stripePaymentMethodId": "pm_...",
  "type": "CARD",
  "lastFour": "4242",
  "brand": "Visa",
  "expiryMonth": 12,
  "expiryYear": 2025
}
```

**Delete Payment Method:**
```
DELETE /api/user/billing/payment-methods/{id}
Authorization: Bearer {token}
```

**Set Default Payment Method:**
```
POST /api/user/billing/payment-methods/{id}/set-default
Authorization: Bearer {token}
```

### 7. Admin Routes

#### Plan Management

**List All Plans:**
```
GET /api/admin/plans
Authorization: Bearer {admin-token}
```

**Get Plan Details:**
```
GET /api/admin/plans/{id}
Authorization: Bearer {admin-token}
```

**Create Plan:**
```
POST /api/admin/plans
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "name": "Premium",
  "type": "SUBSCRIPTION",
  "price": 99.99,
  "currency": "usd",
  "billingPeriod": "monthly",
  "rateLimit": 200,
  "monthlyLimit": 100000,
  "maxApiKeys": 20,
  "supportLevel": "priority"
}
```

**Update Plan:**
```
PUT /api/admin/plans/{id}
Content-Type: application/json
Authorization: Bearer {admin-token}
```

**Archive Plan:**
```
DELETE /api/admin/plans/{id}
Authorization: Bearer {admin-token}
```

### 8. Frontend Dashboard

#### Pages

**Subscription Page:**
- Location: `frontend/src/pages/SubscriptionPage.tsx`
- Features:
  - Display current subscription details
  - List all available plans
  - Upgrade/downgrade subscription
  - Cancel subscription
  - Visual plan comparison

**Billing Page:**
- Location: `frontend/src/pages/BillingPage.tsx`
- Features:
  - Billing overview (total spent, pending)
  - Invoice history with pagination
  - Payment methods management
  - Add/remove payment methods
  - Set default payment method

**Dashboard Page:**
- Location: `frontend/src/pages/DashboardPage.tsx`
- Features:
  - Subscription status card
  - Usage statistics
  - Quick links to subscription and billing
  - API key management

### 9. Stripe Integration
**File:** `backend/src/services/stripeService.ts`

**Features:**
- Customer creation
- Subscription management
- Payment processing
- Invoice handling
- Webhook event processing

**Webhook Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Middleware Execution Order

The middleware chain is carefully ordered for optimal performance and security:

1. **Request ID Tracking** - Adds unique ID to each request
2. **Security Headers** - Helmet, CORS, compression
3. **Body Parsing** - JSON and URL-encoded
4. **Cookie Parser** - Parse cookies
5. **IP Rate Limiting** - Prevent IP-based abuse (200/15min)
6. **Tier-Based Rate Limiting** - Apply subscription-based limits
7. **Request Logging** - Log incoming requests
8. **Usage Tracking** - Track for billing (async)
9. **Quota Enforcement** - Check monthly limits
10. **Route Handlers** - Process business logic
11. **Error Handler** - Catch and sanitize errors

## Testing

**Test File:** `backend/src/__tests__/middleware/subscriptionFlow.test.ts`

**Test Coverage:**
- ✅ JWT authentication
- ✅ API key authentication
- ✅ Invalid credential rejection
- ✅ Tier-based rate limiting
- ✅ Rate limit enforcement
- ✅ Quota tracking
- ✅ Quota enforcement
- ✅ Subscription retrieval
- ✅ Plan listing
- ✅ Subscription upgrade/downgrade
- ✅ Billing overview
- ✅ Invoice listing
- ✅ Payment method management
- ✅ Usage tracking in database
- ✅ Complete middleware chain integration

**Run Tests:**
```bash
cd backend
npm test -- subscriptionFlow.test.ts
```

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/toolbox

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting (optional overrides)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### Default Plan Limits

| Plan | Price/Month | Rate Limit | Monthly Calls | API Keys | Support |
|------|-------------|------------|---------------|----------|---------|
| Free | $0 | 10/min | 1,000 | 2 | Community |
| Starter | $9.99 | 30/min | 10,000 | 5 | Email |
| Professional | $29.99 | 60/min | 50,000 | 10 | Priority |
| Business | $99.99 | 120/min | 200,000 | 20 | Phone |
| Enterprise | Custom | 1000/min | Unlimited | Unlimited | Dedicated |

## Error Handling

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": "Free tier rate limit exceeded. Upgrade for higher limits.",
  "statusCode": 429,
  "requestId": "uuid",
  "retryAfter": 60
}
```

### Quota Exceeded (429)
```json
{
  "success": false,
  "error": "Monthly API quota exceeded",
  "statusCode": 429,
  "requestId": "uuid",
  "quota": {
    "limit": 1000,
    "used": 1001,
    "remaining": 0,
    "resetDate": "2025-12-01T00:00:00.000Z"
  },
  "upgradeUrl": "https://yourdomain.com/subscription/upgrade"
}
```

### Authentication Failed (401)
```json
{
  "success": false,
  "error": "Invalid API key",
  "statusCode": 401,
  "requestId": "uuid"
}
```

## Monitoring

### Metrics Tracked
- Request counts per endpoint
- Authentication success/failure rates
- Rate limit hits per tier
- Quota utilization per user
- Average response times
- Error rates

### Metrics Endpoints
```
GET /api/metrics/health        # Health check with metrics
GET /api/metrics              # Full metrics (admin only)
GET /api/metrics/prometheus   # Prometheus format
```

## Security Considerations

1. **API Key Storage**: Keys are hashed using SHA-256 before storage
2. **JWT Secrets**: Minimum 32 characters, validated at startup
3. **Rate Limiting**: Multi-layer (IP + tier-based)
4. **Quota Enforcement**: Prevents abuse and ensures fair usage
5. **Usage Tracking**: Non-blocking to prevent performance impact
6. **Error Messages**: Sanitized to prevent information leakage
7. **Request IDs**: Enable request tracing for debugging

## Future Enhancements

- [ ] Redis-based rate limiting for horizontal scaling
- [ ] Advanced analytics dashboard
- [ ] Custom plan creation per customer
- [ ] Usage-based billing (pay-as-you-go)
- [ ] Team/organization subscriptions
- [ ] API key scoping (specific endpoints)
- [ ] Webhook notifications for quota alerts
- [ ] Multi-currency support
- [ ] Trial period management
- [ ] Coupon/discount code system

## Documentation

All documentation has been moved to the `/Docs` folder:

- **[API_MONETIZATION_STRATEGY.md](../Docs/API_MONETIZATION_STRATEGY.md)** - Monetization details
- **[PRODUCTION_DEPLOYMENT_GUIDE.md](../Docs/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[SECURITY_CHECKLIST.md](../Docs/SECURITY_CHECKLIST.md)** - Security requirements
- **[FINAL_IMPLEMENTATION_SUMMARY.md](../Docs/FINAL_IMPLEMENTATION_SUMMARY.md)** - Complete implementation

## Conclusion

The subscription mechanism is fully integrated and production-ready. All components work together seamlessly:

1. ✅ Authentication (JWT + API Key)
2. ✅ Rate Limiting (IP + Tier-based)
3. ✅ Quota Enforcement (Monthly limits)
4. ✅ Usage Tracking (Billing data)
5. ✅ Subscription Management (Upgrade/Downgrade/Cancel)
6. ✅ Billing Dashboard (Invoices + Payment methods)
7. ✅ Admin Tools (Plan management)
8. ✅ Stripe Integration (Payment processing)
9. ✅ Frontend UI (Dashboard pages)
10. ✅ Comprehensive Testing

The system is ready for production deployment with proper monitoring, error handling, and security measures in place.
