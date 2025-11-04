import { UsageChart } from '../components/Dashboard/UsageChart';

export const UsagePage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage & Analytics</h2>
      <p className="text-gray-600 mb-6">Track your API usage and quota consumption</p>
      <UsageChart />
    </div>
  );
};

export default UsagePage;
