# Quick Reference Guide

## Getting Started (5 Minutes)

### Start Backend
```bash
cd /workspaces/ToolBox/backend
npm install  # First time only
npm run dev
# Server runs on http://localhost:3001
# Health check: GET http://localhost:3001/health
```

### Start Frontend
```bash
cd /workspaces/ToolBox/frontend
npm install  # First time only
npm run dev
# App runs on http://localhost:5173
```

### Test User Credentials
```
Email: test@example.com
Password: TestPassword123
```

---

## Important File Locations

### Frontend Routes
- `/frontend/src/App.tsx` - Main router with all routes
- `/frontend/src/pages/` - Page components
- `/frontend/src/components/` - Reusable components
- `/frontend/src/utils/apiClient.ts` - API client with all methods
- `/frontend/src/store/authStore.ts` - Auth state management

### Backend Routes
- `/backend/src/routes/` - All API route handlers
- `/backend/src/routes/authRoutes.ts` - Auth endpoints
- `/backend/src/routes/webhookRoutes.ts` - Stripe webhook handler
- `/backend/src/services/` - Business logic

### Database
- `/backend/PRISMA_SCHEMA.prisma` - Database schema
- All migrations in `/backend/prisma/migrations/`

### Documentation
- `SAAS_ARCHITECTURE.md` - System design
- `SETUP_GUIDE.md` - Installation guide
- `QUICK_START.md` - 5-minute setup
- `DASHBOARD_INTEGRATION_GUIDE.md` - Component integration
- `COMPLETION_CHECKLIST.md` - Feature checklist
- `ARCHITECTURE_DEPLOYMENT.md` - Deployment guide

---

## API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/register         - Register new user
POST   /api/auth/login            - Login user
POST   /api/auth/refresh          - Refresh token
POST   /api/auth/logout           - Logout user
POST   /api/auth/verify-email     - Verify email
POST   /api/auth/request-password-reset - Request password reset
POST   /api/auth/reset-password   - Reset password
GET    /api/auth/me               - Get current user
```

### API Keys
```
GET    /api/user/api-keys         - List API keys
POST   /api/user/api-keys         - Create API key
DELETE /api/user/api-keys/:id     - Revoke API key
POST   /api/user/api-keys/:id/rotate - Rotate API key
```

### Usage
```
GET    /api/user/usage/summary    - Get usage summary (30 days)
GET    /api/user/usage/detailed   - Get detailed usage
GET    /api/user/usage/monthly/:year/:month - Monthly usage
GET    /api/user/usage/quota      - Get quota status
GET    /api/user/usage/by-endpoint - Usage by endpoint
```

### Subscriptions
```
GET    /api/user/subscription     - Get current subscription
GET    /api/user/subscription/plans - List available plans
POST   /api/user/subscription/upgrade - Upgrade plan
POST   /api/user/subscription/downgrade - Downgrade plan
POST   /api/user/subscription/cancel - Cancel subscription
```

### Billing
```
GET    /api/user/billing/invoices - List invoices
GET    /api/user/billing/payment-methods - List payment methods
POST   /api/user/billing/payment-methods - Add payment method
DELETE /api/user/billing/payment-methods/:id - Delete payment method
POST   /api/user/billing/payment-methods/:id/set-default - Set default
GET    /api/user/billing/overview - Billing overview
```

### Admin
```
GET    /api/admin/users           - List users
GET    /api/admin/users/:id       - Get user details
POST   /api/admin/users/:id/suspend - Suspend user
POST   /api/admin/users/:id/reactivate - Reactivate user
POST   /api/admin/users/:id/make-admin - Make admin
POST   /api/admin/users/:id/remove-admin - Remove admin
DELETE /api/admin/users/:id       - Delete user

GET    /api/admin/plans           - List plans
GET    /api/admin/plans/:id       - Get plan details
POST   /api/admin/plans           - Create plan
PUT    /api/admin/plans/:id       - Update plan
DELETE /api/admin/plans/:id       - Delete plan

GET    /api/admin/analytics/revenue - Revenue analytics
GET    /api/admin/analytics/api   - API usage analytics
GET    /api/admin/analytics/users - User analytics
GET    /api/admin/analytics/top-users - Top users
```

### Stripe
```
POST   /api/stripe/webhook        - Stripe webhook handler
```

---

## Common Tasks

### Add New API Endpoint
1. Create service method in `/backend/src/services/`
2. Create route handler in `/backend/src/routes/`
3. Add to `app.ts` route configuration
4. Add to `apiClient` in frontend

### Add New Component
1. Create component in `/frontend/src/components/`
2. Add types to `/frontend/src/types/saas.ts`
3. Import and use in pages
4. Export from component index

### Add New Page
1. Create page in `/frontend/src/pages/`
2. Add route to `App.tsx`
3. Add navigation link in `DashboardLayout.tsx`
4. Use ProtectedRoute if needed

### Debug API Issues
```bash
# Check backend logs
tail -f /workspaces/ToolBox/logs/backend.log

# Test endpoint manually
curl -X GET http://localhost:3001/health

# Check database
cd backend && npx prisma studio
```

### Reset Database (Development Only)
```bash
cd backend
npx prisma migrate reset
npm run seed  # If seed script exists
```

---

## Environment Variables

### Backend `.env`
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_db
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend `.env.local`
```
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Testing Workflows

### Test Registration Flow
1. Go to http://localhost:5173/register
2. Fill in form with:
   - Full Name: Test User
   - Company: Test Company
   - Email: testuser@example.com
   - Password: TestPass123
3. Accept terms and click "Create Account"
4. Should redirect to dashboard

### Test API Key Creation
1. Login as user
2. Navigate to "API Keys" in sidebar
3. Click "Create New Key"
4. Enter key name "test-key"
5. Copy the displayed key (only shown once)
6. Use key in API requests: `Authorization: Bearer sk_xxx`

### Test Stripe Webhook (Local)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3001/api/stripe/webhook

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

---

## Debugging Tips

### TypeScript Errors
```bash
cd frontend  # or backend
npm run type-check
```

### Linting Issues
```bash
cd frontend
npm run lint
npm run lint -- --fix  # Auto-fix
```

### Database Issues
```bash
cd backend
npx prisma db push      # Apply migrations
npx prisma studio      # Visual database editor
npx prisma migrate dev --name add_new_field
```

### API Errors
- Check browser console (F12)
- Check backend logs (tail -f logs/backend.log)
- Check status codes (200, 401, 404, 500)
- Check response body for error message

---

## Performance Monitoring

### Frontend
- Chrome DevTools → Performance tab
- Network tab shows API latency
- Lighthouse for overall score

### Backend
- Winston logs show response times
- Database query logging enabled in dev
- Rate limiter stats available

### Benchmarks
- Dashboard load: < 2s
- API response: < 200ms
- Auth token refresh: < 100ms

---

## Deployment Commands

### Docker Build
```bash
# Backend
docker build -f docker/Dockerfile.backend -t saas-backend:latest .

# Frontend
docker build -f docker/Dockerfile.frontend -t saas-frontend:latest .
```

### Docker Compose (Local Dev)
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f backend
```

### Push to Registry
```bash
docker tag saas-backend:latest gcr.io/project/saas-backend:latest
docker push gcr.io/project/saas-backend:latest
```

---

## Important Commands

```bash
# Start both services
npm run dev:all  # If script exists in root package.json

# Backend development
cd backend && npm run dev
npm run lint
npm run test
npm run build

# Frontend development
cd frontend && npm run dev
npm run build
npm run preview

# Database
npx prisma migrate dev
npx prisma migrate reset
npx prisma generate

# Git operations
git status
git add .
git commit -m "message"
git push origin main
```

---

## Useful Keyboard Shortcuts

### Chrome DevTools
- `F12` - Open DevTools
- `Ctrl+Shift+K` - Console
- `Ctrl+Shift+I` - Inspector
- `Ctrl+Shift+J` - Console

### VS Code
- `Ctrl+K Ctrl+F` - Format document
- `Ctrl+J` - Toggle terminal
- `Ctrl+P` - Quick file open
- `Ctrl+F` - Find in file
- `Ctrl+H` - Find and replace

---

## Links & Resources

### Frontend URLs
- App: http://localhost:5173
- Login: http://localhost:5173/login
- Register: http://localhost:5173/register
- Dashboard: http://localhost:5173/dashboard

### Backend URLs
- API: http://localhost:3001/api
- Health: http://localhost:3001/health
- Swagger (if configured): http://localhost:3001/api-docs

### Documentation
- See `/workspaces/ToolBox/SAAS_ARCHITECTURE.md`
- See `/workspaces/ToolBox/SETUP_GUIDE.md`
- See `/workspaces/ToolBox/QUICK_START.md`

### External Resources
- Stripe: https://stripe.com/docs
- Prisma: https://www.prisma.io/docs
- React: https://react.dev
- Express: https://expressjs.com

---

## Support

### Getting Help
1. Check documentation files first
2. Review error messages and stack traces
3. Search GitHub issues
4. Check Stripe webhook logs
5. Review database with Prisma Studio

### Common Issues

**Problem**: "Cannot find module" error
**Solution**: Ensure relative path is correct, `npm install` completed

**Problem**: Database connection refused
**Solution**: Ensure PostgreSQL running, DATABASE_URL correct in .env

**Problem**: API returns 401 Unauthorized
**Solution**: Token expired, check localStorage, try refresh

**Problem**: Stripe webhook not working
**Solution**: Verify webhook secret, check Stripe logs, test with CLI

---

## Version Information

```
Node.js: 18+
npm: 9+
PostgreSQL: 13+
React: 18
Express: 4
Prisma: 5
TypeScript: 5
```

---

**Last Updated**: November 4, 2025  
**Status**: Current & Complete  
**Questions**: Check documentation files or review code comments
