import { BillingDashboard } from '../components/Dashboard/BillingDashboard';

export const BillingPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Billing & Invoices</h2>
      <p className="text-gray-600 mb-6">Manage your billing information and payment methods</p>
      <BillingDashboard />
    </div>
  );
};

export default BillingPage;
