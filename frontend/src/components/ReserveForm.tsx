import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import type { Reserve, CreateReserveRequest, UpdateReserveRequest } from '../types/api';

interface ReserveFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReserveRequest | UpdateReserveRequest) => void;
  reserve?: Reserve | null;
  isLoading?: boolean;
}

const ReserveForm: React.FC<ReserveFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reserve,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    purpose: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // сбрасываем форму при открытии/закрытии модального окна или изменении резерва
  useEffect(() => {
    if (isOpen) {
      if (reserve) {
        setFormData({
          name: reserve.name,
          targetAmount: reserve.targetAmount.toString(),
          currentAmount: reserve.currentAmount.toString(),
          purpose: reserve.purpose || ''
        });
      } else {
        setFormData({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          purpose: ''
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, reserve]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = 'Целевая сумма должна быть больше 0';
    }

    const currentAmount = parseFloat(formData.currentAmount);
    if (formData.currentAmount && (isNaN(currentAmount) || currentAmount < 0)) {
      newErrors.currentAmount = 'Текущая сумма не может быть отрицательной';
    }

    if (currentAmount > targetAmount) {
      newErrors.currentAmount = 'Текущая сумма не может превышать целевую';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    // очищаем ошибку при вводе
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const data = {
      name: formData.name.trim(),
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      purpose: formData.purpose.trim() || undefined
    };

    onSubmit(data);
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {reserve ? 'Редактировать резерв' : 'Создать резерв'}
          </h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название резерва *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Например: Отпуск, Новый автомобиль"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Целевая сумма *
            </label>
            <div className="relative">
              <input
                type="number"
                id="targetAmount"
                value={formData.targetAmount}
                onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, targetAmount: true }))}
                className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  touched.targetAmount && errors.targetAmount ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="100000"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">₽</span>
            </div>
            {touched.targetAmount && errors.targetAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>
            )}
          </div>

          {/* Current Amount */}
          <div>
            <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Текущая сумма
            </label>
            <div className="relative">
              <input
                type="number"
                id="currentAmount"
                value={formData.currentAmount}
                onChange={(e) => handleInputChange('currentAmount', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, currentAmount: true }))}
                className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  touched.currentAmount && errors.currentAmount ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">₽</span>
            </div>
            {touched.currentAmount && errors.currentAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.currentAmount}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Описание (необязательно)
            </label>
            <textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Для чего этот резерв..."
              rows={3}
              disabled={isLoading}
            />
            {touched.purpose && errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
            )}
          </div>

          {/* Progress Preview */}
          {formData.targetAmount && formData.currentAmount && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Предварительный просмотр:</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((parseFloat(formData.currentAmount) / parseFloat(formData.targetAmount)) * 100, 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {((parseFloat(formData.currentAmount) / parseFloat(formData.targetAmount)) * 100).toFixed(1)}% от цели
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading && (
                <LoadingSpinner size="sm" className="mr-2 p-0" />
              )}
              {isLoading ? 'Сохранение...' : (reserve ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReserveForm;