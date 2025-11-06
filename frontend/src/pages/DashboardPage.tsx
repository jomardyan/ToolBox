import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { useAppStore } from '../store/appStore';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { FaCheckCircle, FaKey, FaChartLine, FaBox, FaArrowRight, FaCreditCard, FaFileInvoice, FaPlus } from 'react-icons/fa';

interface DashboardStats {
  activeSubscription: boolean;
  totalApiCalls: number;
  monthlyUsage: number;
  quotaRemaining: number;
  apiKeysCount: number;
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { darkMode } = useAppStore();

  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Create abort controller for request cancellation
        abortController = new AbortController();
        
        const [quotaRes, keysRes] = await Promise.all([
          api.getQuotaStatus(),
          api.getApiKeys()
        ]);

        // Only update state if component is still mounted
        if (!isMounted) return;

        const quota = quotaRes.data.data;
        const keys = keysRes.data.data;

        setStats({
          activeSubscription: quota.status === 'ACTIVE',
          totalApiCalls: quota.totalUsage || 0,
          monthlyUsage: quota.currentUsage || 0,
          quotaRemaining: quota.remaining || 0,
          apiKeysCount: keys.length || 0
        });
      } catch (err: any) {
        // Only update state if component is still mounted and error isn't from abort
        if (isMounted && !abortController?.signal.aborted) {
          setError(err.response?.data?.message || 'Failed to load stats');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Cleanup function to prevent state updates on unmount
    return () => {
      isMounted = false;
      abortController?.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <SkeletonCard />
            </Card>
          ))}
        </div>
        <Card>
          <SkeletonCard />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-2xl border-2 ${
        darkMode 
          ? 'bg-danger-900/20 border-danger-800 text-danger-300' 
          : 'bg-danger-50 border-danger-200 text-danger-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h2>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome back! Here's an overview of your account.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FaCheckCircle size={24} />}
          title="Subscription Status"
          value={stats.activeSubscription ? 'Active' : 'Inactive'}
          color={stats.activeSubscription ? 'success' : 'warning'}
          subtitle={stats.activeSubscription ? 'All systems operational' : 'Subscription inactive'}
        />

        <StatCard
          icon={<FaKey size={24} />}
          title="API Keys"
          value={stats.apiKeysCount}
          color="primary"
          action={
            <Link 
              to="/dashboard/api-keys" 
              className={`text-sm font-medium hover:underline ${
                darkMode ? 'text-primary-400' : 'text-primary-600'
              }`}
            >
              Manage <FaArrowRight className="inline" size={12} />
            </Link>
          }
        />

        <StatCard
          icon={<FaChartLine size={24} />}
          title="This Month Usage"
          value={stats.monthlyUsage.toLocaleString()}
          color="info"
          trend={{ value: 12, isPositive: true }}
          action={
            <Link 
              to="/dashboard/usage" 
              className={`text-sm font-medium hover:underline ${
                darkMode ? 'text-info-400' : 'text-info-600'
              }`}
            >
              Details <FaArrowRight className="inline" size={12} />
            </Link>
          }
        />

        <StatCard
          icon={<FaBox size={24} />}
          title="Quota Remaining"
          value={stats.quotaRemaining.toLocaleString()}
          color={stats.quotaRemaining < 1000 ? 'warning' : 'success'}
          action={
            <Link 
              to="/dashboard/subscription" 
              className={`text-sm font-medium hover:underline ${
                darkMode ? 'text-success-400' : 'text-success-600'
              }`}
            >
              Upgrade <FaArrowRight className="inline" size={12} />
            </Link>
          }
        />
      </div>

      {/* Quick Actions */}
      <Card gradient>
        <CardHeader gradient>
          <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
          <p className="text-white/80 text-sm mt-1">Get started with common tasks</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/dashboard/api-keys" 
              className={`group p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                darkMode 
                  ? 'border-gray-800 hover:border-primary-600 bg-gray-800/50' 
                  : 'border-gray-200 hover:border-primary-500 bg-white'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 ${
                darkMode ? 'bg-primary-900/30' : 'bg-primary-100'
              }`}>
                <FaPlus className={`text-2xl ${darkMode ? 'text-primary-400' : 'text-primary-600'}`} />
              </div>
              <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Create API Key
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Generate a new API key for your application
              </p>
              <div className={`mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all ${
                darkMode ? 'text-primary-400' : 'text-primary-600'
              }`}>
                Get Started <FaArrowRight />
              </div>
            </Link>

            <Link 
              to="/dashboard/subscription" 
              className={`group p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                darkMode 
                  ? 'border-gray-800 hover:border-success-600 bg-gray-800/50' 
                  : 'border-gray-200 hover:border-success-500 bg-white'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 ${
                darkMode ? 'bg-success-900/30' : 'bg-success-100'
              }`}>
                <FaCreditCard className={`text-2xl ${darkMode ? 'text-success-400' : 'text-success-600'}`} />
              </div>
              <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manage Subscription
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                View and upgrade your subscription plan
              </p>
              <div className={`mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all ${
                darkMode ? 'text-success-400' : 'text-success-600'
              }`}>
                View Plans <FaArrowRight />
              </div>
            </Link>

            <Link 
              to="/dashboard/billing" 
              className={`group p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                darkMode 
                  ? 'border-gray-800 hover:border-info-600 bg-gray-800/50' 
                  : 'border-gray-200 hover:border-info-500 bg-white'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 ${
                darkMode ? 'bg-info-900/30' : 'bg-info-100'
              }`}>
                <FaFileInvoice className={`text-2xl ${darkMode ? 'text-info-400' : 'text-info-600'}`} />
              </div>
              <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                View Invoices
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Download and review your billing history
              </p>
              <div className={`mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all ${
                darkMode ? 'text-info-400' : 'text-info-600'
              }`}>
                View History <FaArrowRight />
              </div>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Activity Feed Placeholder */}
      <Card>
        <CardHeader>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <div className="text-6xl mb-4 opacity-30">📊</div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No recent activity to display
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DashboardPage;
