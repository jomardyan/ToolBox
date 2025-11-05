import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useState } from 'react';
import { 
  FaHome, FaKey, FaChartBar, FaCreditCard, FaFileInvoice, 
  FaUsers, FaLayerGroup, FaChartLine, FaBars, FaTimes,
  FaUserCircle, FaSignOutAlt, FaCog
} from 'react-icons/fa';

export const DashboardLayout = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { darkMode } = useAppStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // Helper function to determine if link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/dashboard/api-keys', label: 'API Keys', icon: <FaKey /> },
    { path: '/dashboard/usage', label: 'Usage & Analytics', icon: <FaChartBar /> },
    { path: '/dashboard/subscription', label: 'Subscription', icon: <FaCreditCard /> },
    { path: '/dashboard/billing', label: 'Billing', icon: <FaFileInvoice /> },
  ];

  const adminMenuItems = [
    { path: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { path: '/admin/plans', label: 'Plans', icon: <FaLayerGroup /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <FaChartLine /> },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Top Navigation */}
      <nav className={`sticky top-0 z-40 border-b ${
        darkMode 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      } shadow-sm`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h1 className={`text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent`}>
                  ToolBox
                </h1>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaUserCircle size={24} />
                  <div className="hidden md:block text-left">
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {user.firstName || user.email}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.role}
                    </div>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="p-4 border-b" style={{borderColor: darkMode ? '#374151' : '#e5e7eb'}}>
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {user.email}
                      </div>
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          darkMode 
                            ? 'text-gray-300 hover:bg-gray-800' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaCog /> Settings
                      </Link>
                      <button
                        onClick={() => {
                          localStorage.removeItem('accessToken');
                          localStorage.removeItem('refreshToken');
                          window.location.href = '/login';
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          darkMode 
                            ? 'text-red-400 hover:bg-gray-800' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } ${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'} overflow-hidden`}>
          <nav className="h-full overflow-y-auto py-6 px-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? darkMode
                      ? 'bg-primary-900/30 text-primary-400 font-medium shadow-lg shadow-primary-500/20'
                      : 'bg-primary-50 text-primary-700 font-medium shadow-md'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {user.role === 'admin' && (
              <>
                <div className="my-4">
                  <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Admin Panel
                  </div>
                </div>
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.path)
                        ? darkMode
                          ? 'bg-danger-900/30 text-danger-400 font-medium shadow-lg shadow-danger-500/20'
                          : 'bg-danger-50 text-danger-700 font-medium shadow-md'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
