// frontend/src/components/Dashboard/BillingDashboard.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Invoice, PaymentMethod, BillingOverview } from '../../types/saas';

export const BillingDashboard: React.FC = () => {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [overviewRes, invoicesRes, pmRes] = await Promise.all([
        api.getBillingOverview(),
        api.getInvoices(1, 5),
        api.getPaymentMethods()
      ]);
      setOverview(overviewRes.data.data);
      setInvoices(invoicesRes.data.data.invoices);
      setPaymentMethods(pmRes.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentMethod = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      await api.deletePaymentMethod(id);
      await fetchBillingData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete payment method');
    }
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      await api.setDefaultPaymentMethod(id);
      await fetchBillingData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set default');
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

      {/* Billing Overview */}
      {overview && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Billing Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">${overview.totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">${overview.pendingAmount.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-xl font-bold">{overview.subscription.plan.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>

        {paymentMethods.length === 0 ? (
          <p className="text-gray-500 text-sm">No payment methods on file.</p>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded"
              >
                <div>
                  <p className="font-medium">
                    {method.type === 'card' ? `${method.brand} •••• ${method.lastFour}` : `Bank •••• ${method.lastFour}`}
                  </p>
                  {method.expiryMonth && (
                    <p className="text-sm text-gray-500">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  )}
                  {method.isDefault && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => setDefaultPaymentMethod(method.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => deletePaymentMethod(method.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>

        {invoices.length === 0 ? (
          <p className="text-gray-500 text-sm">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2">Invoice</th>
                  <th className="text-left py-2">Period</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-2">{invoice.invoiceId}</td>
                    <td className="py-2">
                      {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
                      {new Date(invoice.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-2 font-semibold">${invoice.amount.toFixed(2)}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;
