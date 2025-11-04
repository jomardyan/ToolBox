# Platform Architecture & Deployment Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ React 18 + Vite (TypeScript)                            │   │
│  │ ├── LoginPage / RegisterPage (Auth)                     │   │
│  │ ├── DashboardLayout (Protected Routes)                  │   │
│  │ ├── Dashboard Pages (API Keys, Usage, Billing)          │   │
│  │ └── Admin Pages (Users, Plans, Analytics)               │   │
│  │                                                          │   │
│  │ State Management: Zustand (auth store)                  │   │
│  │ HTTP Client: Axios with interceptors                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/CORS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Express)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware Stack:                                        │   │
│  │ ├── Helmet (security headers)                            │   │
│  │ ├── CORS (cross-origin requests)                         │   │
│  │ ├── Compression (gzip)                                   │   │
│  │ ├── Rate Limiter (100 req/15min)                         │   │
│  │ └── Auth Middleware (JWT verification)                  │   │
│  │                                                          │   │
│  │ Routes:                                                  │   │
│  │ ├── /auth/* (Register, Login, Refresh, etc)             │   │
│  │ ├── /user/* (Protected user routes)                      │   │
│  │ ├── /admin/* (Protected admin routes)                    │   │
│  │ └── /stripe/webhook (Webhook handler)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL/Transactions
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA & SERVICES LAYER                         │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  PostgreSQL (Prisma) │  │  Redis (Optional)    │             │
│  │  15 Models:          │  │  Rate Limiting       │             │
│  │  ├── User            │  │  Caching             │             │
│  │  ├── Plan            │  │  Sessions            │             │
│  │  ├── Subscription    │  │  Temporary Data      │             │
│  │  ├── ApiKey          │  └──────────────────────┘             │
│  │  ├── UsageLog        │                                       │
│  │  ├── BillingRecord   │  ┌──────────────────────┐             │
│  │  ├── PaymentMethod   │  │  Stripe API          │             │
│  │  ├── Organization    │  │  ├── Subscriptions   │             │
│  │  ├── AuditLog        │  │  ├── Payments        │             │
│  │  └── ... (6 more)    │  │  └── Webhooks        │             │
│  └──────────────────────┘  └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Service Layer Architecture

```
┌────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Node.js)                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  AuthService              ApiKeyService               │
│  ├── register()           ├── createKey()             │
│  ├── login()              ├── listKeys()              │
│  ├── refreshToken()       ├── revokeKey()             │
│  ├── logout()             ├── rotateKey()             │
│  ├── verifyEmail()        └── validateKey()           │
│  └── resetPassword()                                  │
│                          UsageService                 │
│  CryptoUtils              ├── logUsage()              │
│  ├── generateJWT()        ├── getSummary()            │
│  ├── verifyJWT()          ├── getDetailed()           │
│  ├── hashPassword()       ├── getMonthly()            │
│  ├── comparePassword()    ├── getQuotaStatus()        │
│  ├── generateApiKey()     └── getByEndpoint()         │
│  └── hashApiKey()                                     │
│                          StripeService                │
│  RateLimiter              ├── createCustomer()        │
│  ├── checkLimit()         ├── createSubscription()    │
│  ├── getUsage()           ├── handleWebhook()         │
│  └── reset()              └── updateInvoice()         │
│                                                       │
└────────────────────────────────────────────────────────┘
```

## Data Flow: User Registration

```
1. User submits form (email, password, name, company)
                           │
                           ▼
2. Frontend validates input
                           │
                           ▼
3. POST /api/auth/register (axios)
                           │
                           ▼
4. Backend receives request
   ├── Validate input
   ├── Hash password (bcrypt)
   ├── Create user in DB
   ├── Generate verification token
   ├── Send verification email
   └── Create Stripe customer
                           │
                           ▼
5. Return tokens + user data
   ├── accessToken (15min)
   ├── refreshToken (7d)
   └── user object
                           │
                           ▼
6. Frontend stores tokens in localStorage
                           │
                           ▼
7. Redirect to dashboard
```

## Data Flow: API Call with Rate Limiting

```
1. Frontend makes API call
   GET /api/user/api-keys
                           │
                           ▼
2. Axios interceptor adds Bearer token
                           │
                           ▼
3. Express receives request
                           │
                           ▼
4. Rate limiter middleware checks
   ├── Get client IP
   ├── Check Redis sorted set
   ├── Compare against 100 req/15min
   └── Allow or reject
                           │
                           ▼
5. Auth middleware verifies JWT
   ├── Extract token from header
   ├── Verify signature
   ├── Check expiration
   └── Extract user ID
                           │
                           ▼
6. Route handler processes request
   ├── Prisma queries database
   ├── Filter by user ID
   └── Return paginated results
                           │
                           ▼
7. Response sent to frontend
                           │
                           ▼
8. If 401 (token expired):
   ├── Axios interceptor catches 401
   ├── Call POST /api/auth/refresh
   ├── Get new accessToken
   ├── Retry original request
   └── Return response
```

## Data Flow: Stripe Webhook

```
1. Customer action on Stripe (e.g., subscription charged)
                           │
                           ▼
2. Stripe sends webhook event
   POST /api/stripe/webhook
   {
     "type": "invoice.payment_succeeded",
     "data": { "object": {...} }
   }
                           │
                           ▼
3. Backend verifies signature
   ├── Get stripe-signature header
   ├── Reconstruct event payload
   ├── Verify with webhook secret
   └── Ensure authenticity
                           │
                           ▼
4. Route handler processes event
   ├── Extract event type
   ├── Call appropriate handler
   ├── Update database
   └── Log event
                           │
                           ▼
5. Example: Payment Succeeded
   ├── Find user by Stripe customer ID
   ├── Create BillingRecord with PAID status
   ├── Update subscription (if needed)
   ├── Send email confirmation
   └── Log in audit trail
                           │
                           ▼
6. Return 200 OK to Stripe
```

## Deployment Architecture

### Local Development
```
Docker Compose:
├── postgres:latest
├── redis:latest (optional)
├── Backend service (Express)
└── Frontend service (Vite dev server)

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Database: localhost:5432
```

### Production Deployment

```
┌─────────────────────────────────────────────────────────┐
│                   AWS / Cloud Provider                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  CloudFront CDN  │         │   ALB / Ingress  │     │
│  │  (Static Files)  │         │  (Load Balancer) │     │
│  └────────┬─────────┘         └────────┬─────────┘     │
│           │                           │                │
│           │                    ┌──────▼────────┐       │
│           │                    │  Kubernetes   │       │
│           │                    │  or ECS       │       │
│           │                    │  - Backend    │       │
│           │                    │  - Frontend   │       │
│           │                    │  - Nginx      │       │
│           │                    └──────┬────────┘       │
│           │                           │                │
│           └──────────┬────────────────┘                │
│                      ▼                                 │
│              ┌─────────────────┐                       │
│              │  RDS PostgreSQL │                       │
│              │  (Multi-AZ)     │                       │
│              └─────────────────┘                       │
│                                                         │
│              ┌─────────────────┐                       │
│              │ ElastiCache     │                       │
│              │ (Redis)         │                       │
│              └─────────────────┘                       │
│                                                         │
│              ┌─────────────────┐                       │
│              │  CloudWatch     │                       │
│              │  Monitoring     │                       │
│              └─────────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CORS_ORIGINS=https://yourdomain.com
SENDGRID_API_KEY=SG_xxx (optional)
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Monitoring & Observability

### Logging
- Winston logger with file rotation
- Separate error and combined logs
- Request/response logging
- Audit trail for admin actions

### Metrics to Monitor
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query times
- Rate limiter hits
- Stripe API errors
- User signup/login rates
- Subscription conversions

### Alerting
- Error rate > 5%
- Response time > 1s
- Database connection pool full
- Redis connection loss
- Stripe webhook failures
- Disk space < 10%

## Scalability Considerations

### Horizontal Scaling
1. Load balancer distribution across multiple backend instances
2. Shared PostgreSQL database (not sharded yet)
3. Shared Redis for rate limiting and caching
4. Stateless backend design

### Vertical Scaling
- Increase server CPU/memory
- Database read replicas for reporting
- Elasticsearch for usage log search

### Optimization
- Database query indexing (already done)
- Connection pooling
- Response compression
- Static asset caching
- API response caching via Redis

## Security in Production

- SSL/TLS certificates (Let's Encrypt)
- WAF (Web Application Firewall)
- DDoS protection
- VPN for admin access
- Secrets management (AWS Secrets Manager)
- Database encryption at rest
- Audit logging enabled
- 2FA for admin accounts
- IP whitelisting for admin API

## Disaster Recovery

- Daily database backups
- Multi-AZ deployment
- RTO: 1 hour
- RPO: 1 hour
- Backup retention: 30 days
- Failover automation

## Performance SLAs

- Uptime: 99.9%
- API Response Time: < 200ms (p95)
- Dashboard Load Time: < 2s
- Webhook Processing: < 5s
- Email Delivery: < 5 min

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run all tests (unit, integration, E2E)
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Rollback plan documented

### Deployment Steps
1. [ ] Deploy backend to staging
2. [ ] Run smoke tests
3. [ ] Deploy frontend to staging
4. [ ] User acceptance testing
5. [ ] Deploy backend to production
6. [ ] Deploy frontend to production
7. [ ] Verify all systems operational
8. [ ] Monitor metrics for 24 hours

### Post-Deployment
- [ ] All health checks passing
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] User feedback positive
- [ ] Documentation updated

---

**Generated**: November 4, 2025  
**Version**: 1.0  
**Status**: Ready for Production Deployment
