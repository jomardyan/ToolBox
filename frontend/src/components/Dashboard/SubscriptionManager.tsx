// frontend/src/components/Dashboard/SubscriptionManager.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Subscription, Plan } from '../../types/saas';

export const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, plansRes] = await Promise.all([
        api.getCurrentSubscription(),
        api.getPlans()
      ]);
      setSubscription(subRes.data.data);
      setPlans(plansRes.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
      await api.upgradePlan(planId);
      await fetchData();
      alert('Plan upgraded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async (planId: string) => {
    if (!window.confirm('Downgrading may reduce your limits. Continue?')) return;

    try {
      setLoading(true);
      await api.downgradePlan(planId);
      await fetchData();
      alert('Plan downgraded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to downgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel? You can resubscribe anytime.')) return;

    try {
      setLoading(true);
      await api.cancelSubscription('User cancelled');
      await fetchData();
      alert('Subscription cancelled successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {subscription && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-xl font-bold">{subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-bold capitalize">{subscription.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-xl font-bold">
                ${subscription.plan.price}/<span className="text-sm">{subscription.plan.billingPeriod}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Billing</p>
              <p className="text-xl font-bold">
                {new Date(subscription.billingCycleEnd).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded mb-6">
            <p className="font-medium mb-3">Features</p>
            <ul className="space-y-2">
              <li className="text-sm">✓ Rate Limit: {subscription.plan.rateLimit} req/min</li>
              <li className="text-sm">
                ✓ Monthly Limit: {subscription.plan.monthlyLimit ? `${subscription.plan.monthlyLimit} requests` : 'Unlimited'}
              </li>
              <li className="text-sm">✓ API Keys: {subscription.plan.maxApiKeys} max</li>
              <li className="text-sm">✓ Support: {subscription.plan.supportLevel}</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showPlans ? 'Hide Plans' : 'Change Plan'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Plans List */}
      {showPlans && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 ${
                  subscription?.planId === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <h4 className="font-semibold mb-2">{plan.name}</h4>
                <p className="text-2xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-sm text-gray-600">/{plan.billingPeriod}</span>
                </p>
                <ul className="space-y-1 text-sm mb-4">
                  <li>• Rate: {plan.rateLimit} req/min</li>
                  <li>• Limit: {plan.monthlyLimit || 'Unlimited'} requests</li>
                  <li>• Keys: {plan.maxApiKeys} max</li>
                </ul>
                {subscription?.planId === plan.id ? (
                  <button disabled className="w-full px-3 py-2 bg-gray-200 text-gray-600 rounded">
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      subscription!.plan.price > plan.price
                        ? handleDowngrade(plan.id)
                        : handleUpgrade(plan.id)
                    }
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {subscription!.plan.price > plan.price ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
