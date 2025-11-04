# Dashboard Integration Guide

This guide explains how to integrate the existing dashboard components into working pages.

## Architecture Overview

```
App.tsx
  ├── /login → LoginPage
  ├── /register → RegisterPage
  └── /dashboard → DashboardLayout (protected)
      ├── / → DashboardPage
      ├── /api-keys → ApiKeysPage
      ├── /usage → UsagePage
      ├── /subscription → SubscriptionPage
      ├── /billing → BillingPage
      └── /admin → AdminLayout (admin-only)
          ├── /users → AdminUsersPage
          ├── /plans → AdminPlansPage
          └── /analytics → AdminAnalyticsPage
```

## Existing Components

### ✅ Already Created & Ready to Use

1. **Frontend Auth Pages**:
   - `LoginPage.tsx` - Full login form
   - `RegisterPage.tsx` - Full registration form

2. **Dashboard Components**:
   - `ApiKeysManager.tsx` - API keys table + create
   - `UsageChart.tsx` - Usage charts + quota status
   - `SubscriptionManager.tsx` - Plans + upgrade/downgrade
   - `BillingDashboard.tsx` - Invoices + payment methods

3. **Layout Components**:
   - `DashboardLayout.tsx` - Main dashboard layout with sidebar
   - `ProtectedRoute.tsx` - Route authentication guard
   - `DashboardPage.tsx` - Main dashboard overview

### 🔄 Component Integration Map

## Step 1: Create Router Configuration

Create `/frontend/src/App.tsx` with routes:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages that will wrap existing components
import ApiKeysPage from './pages/ApiKeysPage';
import UsagePage from './pages/UsagePage';
import SubscriptionPage from './pages/SubscriptionPage';
import BillingPage from './pages/BillingPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Step 2: Create Wrapper Pages

### ApiKeysPage
```typescript
// frontend/src/pages/ApiKeysPage.tsx
import { ApiKeysManager } from '../components/Dashboard/ApiKeysManager';

export const ApiKeysPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">API Keys</h2>
      <ApiKeysManager />
    </div>
  );
};

export default ApiKeysPage;
```

### UsagePage
```typescript
// frontend/src/pages/UsagePage.tsx
import { UsageChart } from '../components/Dashboard/UsageChart';

export const UsagePage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage & Analytics</h2>
      <UsageChart />
    </div>
  );
};

export default UsagePage;
```

### SubscriptionPage
```typescript
// frontend/src/pages/SubscriptionPage.tsx
import { SubscriptionManager } from '../components/Dashboard/SubscriptionManager';

export const SubscriptionPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Subscription</h2>
      <SubscriptionManager />
    </div>
  );
};

export default SubscriptionPage;
```

### BillingPage
```typescript
// frontend/src/pages/BillingPage.tsx
import { BillingDashboard } from '../components/Dashboard/BillingDashboard';

export const BillingPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Billing</h2>
      <BillingDashboard />
    </div>
  );
};

export default BillingPage;
```

## Step 3: Update Main Entry Point

Make sure `/frontend/src/main.tsx` imports App:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## Step 4: Environment Configuration

Create `.env.local` in frontend:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## Step 5: Start Development

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

## Component Props & Dependencies

### ApiKeysManager
- **Props**: None (fetches via apiClient)
- **Required**: User must be authenticated
- **API Calls**: 
  - GET `/user/api-keys`
  - POST `/user/api-keys`
  - DELETE `/user/api-keys/:id`
  - POST `/user/api-keys/:id/rotate`

### UsageChart
- **Props**: None (fetches via apiClient)
- **Required**: User must be authenticated
- **API Calls**:
  - GET `/user/usage/summary`
  - GET `/user/usage/quota`

### SubscriptionManager
- **Props**: None (fetches via apiClient)
- **Required**: User must be authenticated
- **API Calls**:
  - GET `/user/subscription`
  - GET `/user/subscription/plans`
  - POST `/user/subscription/upgrade`
  - POST `/user/subscription/downgrade`
  - POST `/user/subscription/cancel`

### BillingDashboard
- **Props**: None (fetches via apiClient)
- **Required**: User must be authenticated
- **API Calls**:
  - GET `/user/billing/invoices`
  - GET `/user/billing/payment-methods`
  - GET `/user/billing/overview`
  - POST `/user/billing/payment-methods`
  - DELETE `/user/billing/payment-methods/:id`
  - POST `/user/billing/payment-methods/:id/set-default`

## Testing Checklist

- [ ] Navigate to `/login` - sees login form
- [ ] Login with test credentials - redirected to dashboard
- [ ] Sidebar shows user email and logout button
- [ ] Click "API Keys" - loads API keys manager
- [ ] Click "Usage & Analytics" - loads usage chart
- [ ] Click "Subscription" - loads subscription manager
- [ ] Click "Billing" - loads billing dashboard
- [ ] Click "Logout" - redirected to login
- [ ] Try accessing `/dashboard` without auth - redirected to login

## Remaining Admin Dashboard

For admin features, create similar structure:
- `/admin` → AdminLayout (admin-only protected)
  - `/admin/users` → AdminUsersPage
  - `/admin/plans` → AdminPlansPage
  - `/admin/analytics` → AdminAnalyticsPage

Backend APIs are already implemented:
- GET `/admin/users` - List users
- GET `/admin/users/:id` - User details
- POST `/admin/users/:id/suspend` - Suspend user
- POST `/admin/users/:id/reactivate` - Reactivate user
- POST `/admin/users/:id/make-admin` - Make admin
- POST `/admin/users/:id/remove-admin` - Remove admin
- GET `/admin/plans` - List plans
- POST `/admin/plans` - Create plan
- PUT `/admin/plans/:id` - Update plan
- DELETE `/admin/plans/:id` - Delete plan
- GET `/admin/analytics/revenue` - Revenue data
- GET `/admin/analytics/api` - API analytics
- GET `/admin/analytics/users` - User analytics
- GET `/admin/analytics/top-users` - Top users report

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Make sure all imports use correct paths. Components are in:
- Pages: `src/pages/`
- Components: `src/components/` or `src/components/Dashboard/`

### Issue: API calls 401 (Unauthorized)
**Solution**: Ensure auth tokens are set in localStorage after login

### Issue: Components not showing data
**Solution**: Check browser console for API errors. Ensure backend is running on port 3001

### Issue: Styling looks broken
**Solution**: Make sure Tailwind CSS is configured in `tailwind.config.js` and imported in `index.css`

## Next Steps After Integration

1. **Test all dashboard pages** with real data
2. **Create admin dashboard pages** using same pattern
3. **Add email service** for account verification
4. **Setup Docker** for containerized deployment
5. **Configure CI/CD** pipeline for automated testing
6. **Performance testing** and optimization
7. **Security audit** of authentication flow
8. **Create user documentation** and API guide

## Support Files

- `apiClient.ts` - All API methods configured
- `authStore.ts` - Zustand store for auth state
- `DashboardLayout.tsx` - Main layout with sidebar
- `ProtectedRoute.tsx` - Route protection wrapper

All components are production-ready and fully typed with TypeScript.
