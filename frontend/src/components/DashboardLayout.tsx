import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const DashboardLayout = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">SaaS Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.email}</span>
              {user.role === 'ADMIN' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Admin</span>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  window.location.href = '/login';
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow min-h-[calc(100vh-4rem)]">
          <nav className="mt-4 space-y-1 px-2">
            <a href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Dashboard
            </a>
            <a href="/dashboard/api-keys" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              API Keys
            </a>
            <a href="/dashboard/usage" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Usage & Analytics
            </a>
            <a href="/dashboard/subscription" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Subscription
            </a>
            <a href="/dashboard/billing" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Billing
            </a>

            {user.role === 'ADMIN' && (
              <>
                <div className="border-t my-2"></div>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Admin</div>
                <a href="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Users
                </a>
                <a href="/admin/plans" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Plans
                </a>
                <a href="/admin/analytics" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Analytics
                </a>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
