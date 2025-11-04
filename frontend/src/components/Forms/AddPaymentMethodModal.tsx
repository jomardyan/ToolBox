import { useState } from 'react';

interface AddPaymentMethodModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const AddPaymentMethodModal = ({ onClose, onSubmit, isLoading }: AddPaymentMethodModalProps) => {
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankRouting, setBankRouting] = useState('');
  const [bankName, setBankName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (method === 'card') {
        if (!cardNumber || !expiryMonth || !expiryYear || !cvc) {
          setError('All card fields are required');
          return;
        }
        await onSubmit({ type: 'card', cardNumber, expiryMonth, expiryYear, cvc });
      } else {
        if (!bankAccount || !bankRouting || !bankName) {
          setError('All bank fields are required');
          return;
        }
        await onSubmit({ type: 'bank', account: bankAccount, routing: bankRouting, bankName });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Payment Method</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="card"
                checked={method === 'card'}
                onChange={(e) => setMethod(e.target.value as 'card' | 'bank')}
                className="mr-2"
              />
              <span className="text-sm font-medium">Credit Card</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="bank"
                checked={method === 'bank'}
                onChange={(e) => setMethod(e.target.value as 'card' | 'bank')}
                className="mr-2"
              />
              <span className="text-sm font-medium">Bank Account</span>
            </label>
          </div>

          {method === 'card' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <input
                    type="text"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="text"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    placeholder="YY"
                    maxLength={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CVC</label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Routing Number</label>
                <input
                  type="text"
                  value={bankRouting}
                  onChange={(e) => setBankRouting(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
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
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
