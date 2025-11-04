// frontend/src/components/AdminPlans.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../utils/api';
import AdminLayout from './AdminLayout';

interface Plan {
  id: string;
  name: string;
  description?: string;
  type: 'SUBSCRIPTION' | 'PAY_AS_YOU_GO' | 'HYBRID';
  price: number;
  currency: string;
  rateLimit: number;
  monthlyLimit?: number;
  maxApiKeys: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

interface FormData {
  name: string;
  description: string;
  type: 'SUBSCRIPTION' | 'PAY_AS_YOU_GO' | 'HYBRID';
  price: number;
  currency: string;
  rateLimit: number;
  monthlyLimit: number | null;
  maxApiKeys: number;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  type: 'SUBSCRIPTION',
  price: 0,
  currency: 'usd',
  rateLimit: 1000,
  monthlyLimit: null,
  maxApiKeys: 5,
};

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/plans');
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (err) {
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      type: plan.type,
      price: plan.price,
      currency: plan.currency,
      rateLimit: plan.rateLimit,
      monthlyLimit: plan.monthlyLimit || null,
      maxApiKeys: plan.maxApiKeys,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        const response = await apiClient.put(`/admin/plans/${editingId}`, formData);
        if (response.data.success) {
          setPlans(plans.map(p => p.id === editingId ? response.data.data : p));
          setShowForm(false);
          setEditingId(null);
        }
      } else {
        const response = await apiClient.post('/admin/plans', formData);
        if (response.data.success) {
          setPlans([...plans, response.data.data]);
          setShowForm(false);
        }
      }
      setFormData(initialFormData);
    } catch (err) {
      setError('Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const response = await apiClient.delete(`/admin/plans/${planId}`);
      if (response.data.success) {
        setPlans(plans.filter(p => p.id !== planId));
      }
    } catch (err) {
      setError('Failed to delete plan');
    }
  };

  return (
    <AdminLayout title="Plans Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Pricing Plans</h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData(initialFormData);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            {showForm ? 'Cancel' : '+ Create Plan'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Plan Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SUBSCRIPTION">Subscription</option>
                    <option value="PAY_AS_YOU_GO">Pay-As-You-Go</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Rate Limit (req/min)
                  </label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, rateLimit: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Max API Keys
                  </label>
                  <input
                    type="number"
                    value={formData.maxApiKeys}
                    onChange={(e) =>
                      setFormData({ ...formData, maxApiKeys: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Monthly Limit (null = unlimited)
                </label>
                <input
                  type="number"
                  value={formData.monthlyLimit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyLimit: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No plans found. Create one to get started.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <p className="text-2xl font-bold text-blue-600">
                    ${plan.price.toFixed(2)}
                    <span className="text-sm text-gray-600">/month</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="font-semibold">{plan.type}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Rate Limit: <span className="font-semibold">{plan.rateLimit} req/min</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Monthly Limit:{' '}
                    <span className="font-semibold">
                      {plan.monthlyLimit ? `${plan.monthlyLimit.toLocaleString()}` : 'Unlimited'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Max API Keys: <span className="font-semibold">{plan.maxApiKeys}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
