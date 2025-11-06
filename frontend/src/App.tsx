import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdvancedFeaturesPage } from './pages/AdvancedFeaturesPage';
import { FAQPage } from './pages/FAQPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { UsagePage } from './pages/UsagePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { BillingPage } from './pages/BillingPage';
import { AdminLayout } from './components/AdminLayout';
import { AdminUsers } from './components/AdminUsers';
import { AdminPlans } from './components/AdminPlans';
import { AdminAnalytics } from './components/AdminAnalytics';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { api } from './utils/apiClient';

function App() {
  const { setUser, logout, setLoading, isLoading } = useAuthStore();

  // Check authentication status on app load
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      // If no access token, user is not logged in
      if (!accessToken) {
        logout();
        setLoading(false);
        return;
      }

      // Verify the token by fetching current user
      setLoading(true);
      try {
        const response = await api.getMe();
        if (response.data.success && response.data.data) {
          setUser(response.data.data);
        } else {
          // Token invalid, clear auth
          logout();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (error) {
        // Token expired or invalid, logout
        logout();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, logout, setLoading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* PUBLIC Routes - No Authentication Required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/converter" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/advanced" element={<AdvancedFeaturesPage />} />
        <Route path="/faq" element={<FAQPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* PROTECTED Dashboard Routes - Authentication Required */}
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

        {/* PROTECTED Admin Routes - Admin Authentication Required */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
                  <p className="text-gray-600 mt-2">Select a section from the sidebar</p>
                </div>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout title="Users Management">
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout title="Plans Management">
                <AdminPlans />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout title="Analytics">
                <AdminAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
