import { useState } from 'react';

interface EditPlanModalProps {
  planId?: string;
  initialData?: {
    name?: string;
    description?: string;
    price?: number;
    interval?: 'monthly' | 'annual';
    features?: string[];
    usageLimit?: number;
  };
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const EditPlanModal = ({
  planId,
  initialData,
  onClose,
  onSubmit,
  isLoading,
}: EditPlanModalProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [interval, setInterval] = useState<'monthly' | 'annual'>(
    initialData?.interval || 'monthly'
  );
  const [usageLimit, setUsageLimit] = useState(
    initialData?.usageLimit?.toString() || ''
  );
  const [features, setFeatures] = useState<string[]>(initialData?.features || []);
  const [newFeature, setNewFeature] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!name.trim()) {
        setError('Plan name is required');
        return;
      }

      if (!price || parseFloat(price) < 0) {
        setError('Valid price is required');
        return;
      }

      if (!usageLimit || parseInt(usageLimit) < 0) {
        setError('Valid usage limit is required');
        return;
      }

      const submitData: any = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        interval,
        usageLimit: parseInt(usageLimit),
        features,
      };

      if (planId) {
        submitData.planId = planId;
      }

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save plan');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 my-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {planId ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Professional"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <div className="mt-1 flex items-center">
                <span className="text-gray-600 mr-2">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="99"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plan description for customers"
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Billing Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'monthly' | 'annual')}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Usage Limit (calls/month)
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="1000"
                min="0"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-700">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add feature (e.g., API Access)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition text-sm"
                disabled={isLoading || !newFeature.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
