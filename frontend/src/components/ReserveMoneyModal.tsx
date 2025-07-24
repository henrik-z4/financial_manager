import React, { useState, useEffect } from 'react';
import type { Reserve } from '../types/api';

interface ReserveMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  reserve: Reserve | null;
  type: 'add' | 'withdraw';
  isLoading?: boolean;
}

const ReserveMoneyModal: React.FC<ReserveMoneyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reserve,
  type,
  isLoading = false
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    
    if (!value || isNaN(numValue) || numValue <= 0) {
      return 'Сумма должна быть больше 0';
    }

    if (type === 'withdraw' && reserve && numValue > reserve.currentAmount) {
      return 'Сумма не может превышать текущий баланс резерва';
    }

    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(parseFloat(amount));
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (error) {
      setError('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen || !reserve) return null;

  const isAdd = type === 'add';
  const title = isAdd ? 'Пополнить резерв' : 'Снять с резерва';
  const buttonText = isAdd ? 'Пополнить' : 'Снять';
  const buttonColor = isAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Reserve Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{reserve.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Текущий баланс:</span>
                <p className="font-semibold">{formatCurrency(reserve.currentAmount)}</p>
              </div>
              <div>
                <span className="text-gray-600">Цель:</span>
                <p className="font-semibold">{formatCurrency(reserve.targetAmount)}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Сумма *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  autoFocus
                />
                <span className="absolute right-3 top-2 text-gray-500">₽</span>
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Preview */}
            {amount && !error && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  После операции:
                </p>
                <div className="text-sm text-blue-800">
                  <p>
                    Новый баланс: {formatCurrency(
                      isAdd 
                        ? reserve.currentAmount + parseFloat(amount)
                        : reserve.currentAmount - parseFloat(amount)
                    )}
                  </p>
                  <p>
                    Прогресс: {(
                      ((isAdd 
                        ? reserve.currentAmount + parseFloat(amount)
                        : reserve.currentAmount - parseFloat(amount)
                      ) / reserve.targetAmount) * 100
                    ).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
                disabled={isLoading || !!error}
              >
                {isLoading ? 'Обработка...' : buttonText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReserveMoneyModal;