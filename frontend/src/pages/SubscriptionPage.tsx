import { SubscriptionManager } from '../components/Dashboard/SubscriptionManager';

export const SubscriptionPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Subscription Management</h2>
      <p className="text-gray-600 mb-6">Upgrade, downgrade, or cancel your subscription</p>
      <SubscriptionManager />
    </div>
  );
};

export default SubscriptionPage;
