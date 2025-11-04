# Quick Start Guide - SaaS API Platform

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Stripe account (optional for testing)

### Step 1: Clone & Navigate
```bash
cd /workspaces/ToolBox
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install bcrypt cors helmet compression express-rate-limit cookie-parser winston prisma @prisma/client stripe ioredis --save
npm install --save-dev @types/express @types/node ts-node

# Setup database
npx prisma generate
npx prisma migrate dev --name init

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
STRIPE_SECRET_KEY=sk_test_demo
STRIPE_WEBHOOK_SECRET=whsec_demo
EOF

# Start backend
npm run dev
```

Backend will be available at `http://localhost:3001`

### Step 3: Frontend Setup

```bash
# In new terminal
cd frontend

# Install dependencies
npm install zustand recharts axios @hookform/resolvers zod --save

# Create .env file
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:3001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_demo
EOF

# Start frontend
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [SAAS_ARCHITECTURE.md](./SAAS_ARCHITECTURE.md) | Complete system design & architecture |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Detailed installation & deployment |
| [SAAS_README.md](./SAAS_README.md) | Project overview & features |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What's built, what's next |

## 🧪 Test API Endpoints

### 1. Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the `accessToken` from response.

### 3. Create API Key
```bash
curl -X POST http://localhost:3001/api/user/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name": "My First Key"}'
```

### 4. Get Usage Summary
```bash
curl http://localhost:3001/api/user/usage/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get Subscription
```bash
curl http://localhost:3001/api/user/subscription \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Admin Routes (Requires Admin Role)

```bash
# List users
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# List plans
curl http://localhost:3001/api/admin/plans \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get analytics
curl http://localhost:3001/api/admin/analytics/revenue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🔄 Key Features to Try

### User Dashboard
1. **API Keys**: Create, view, rotate, revoke
2. **Usage**: See real-time usage charts
3. **Subscription**: Upgrade/downgrade plans
4. **Billing**: View invoices, manage payment methods

### Admin Dashboard
1. **Users**: View, suspend, promote users
2. **Plans**: Create/edit pricing tiers
3. **Analytics**: Revenue, usage trends, top users
4. **Subscriptions**: Manage all subscriptions

## 🐛 Troubleshooting

### "Cannot find module" error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database connection error
```bash
# Create database if needed
createdb saas_db

# Reset database
npx prisma migrate reset
```

### Port already in use
```bash
# Backend uses 3001, Frontend uses 5173
# Kill existing processes or change ports
# In backend/.env: change PORT=3001 to PORT=3002
# In frontend: npm run dev -- --port 5174
```

## 📁 Project Structure

```
ToolBox/
├── backend/              # Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, validation
│   │   ├── utils/       # Helpers
│   │   └── app.ts       # Express app
│   └── package.json
├── frontend/             # React UI
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── utils/       # Helpers
│   │   ├── store/       # State management
│   │   └── types/       # TypeScript types
│   └── package.json
├── SAAS_ARCHITECTURE.md  # Design docs
├── SETUP_GUIDE.md        # Install guide
├── SAAS_README.md        # Project readme
└── IMPLEMENTATION_SUMMARY.md  # Progress report
```

## 💡 Next Steps

1. **Finish Frontend**
   - Login/Register pages
   - Admin dashboard UI
   - Settings pages

2. **Add Features**
   - Email notifications
   - Stripe webhook handler
   - Advanced analytics

3. **Testing**
   - Write unit tests
   - Integration tests
   - E2E tests

4. **Deploy**
   - Docker setup
   - CI/CD pipeline
   - Production deployment

## 📞 Need Help?

1. Check documentation files
2. Review IMPLEMENTATION_SUMMARY.md for architecture details
3. Check SETUP_GUIDE.md for detailed instructions
4. Look at API endpoint implementations in `backend/src/routes/`

## 🎯 Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can register a user
- [ ] Can login with registered user
- [ ] Can create API key
- [ ] Can view usage
- [ ] Can see subscription details
- [ ] API calls return 200s (not 404s)

---

Happy building! 🚀
