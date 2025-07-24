import React, { useState, useEffect } from 'react';
import CategorySelector from './CategorySelector';
import PrioritySelector from './PrioritySelector';
import type { Transaction, CreateTransactionRequest } from '../types/api';
import LoadingSpinner from './LoadingSpinner';


interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: CreateTransactionRequest) => Promise<void>;
  transaction?: Transaction | null;
  title?: string;
  isLoading?: boolean;
}

interface FormData {
  type: 'income' | 'expense';
  category: string;
  amount: string;
  description: string;
  priority: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  date: string;
  notes: string;
}

interface FormErrors {
  type?: string;
  category?: string;
  amount?: string;
  description?: string;
  priority?: string;
  date?: string;
  notes?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  title,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    priority: 'средний',
    date: new Date().toISOString().split('T')[0] || '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});


  // сброс формы при открытии/закрытии модального окна или изменении транзакции
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // режим редактирования — заполнение формы данными транзакции
        setFormData({
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount.toString(),
          description: transaction.description,
          priority: transaction.priority,
          date: transaction.date.split('T')[0] || '', // преобразование в формат YYYY-MM-DD
          notes: transaction.notes || ''
        });
      } else {
        // режим создания — сброс к значениям по умолчанию
        setFormData({
          type: 'expense',
          category: '',
          amount: '',
          description: '',
          priority: 'средний',
          date: new Date().toISOString().split('T')[0] || '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, transaction]);

  // простая валидация формы транзакции
  const validateFormData = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.type) newErrors.type = 'Тип обязателен';
    if (!formData.category.trim()) newErrors.category = 'Категория обязательна';
    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (!formData.amount || isNaN(amount) || amount <= 0) newErrors.amount = 'Сумма должна быть больше 0';
    if (!formData.description.trim()) newErrors.description = 'Описание обязательно';
    if (!formData.priority) newErrors.priority = 'Приоритет обязателен';
    if (!formData.date) newErrors.date = 'Дата обязательна';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // очищаем ошибку при вводе пользователем
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // отмечаем все поля как "посещённые" для отображения ошибок
    const allFields = Object.keys(formData) as (keyof FormData)[];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    if (!validateFormData()) {
      // ошибка валидации, не отправляем форму
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transactionData: CreateTransactionRequest = {
        type: formData.type,
        category: formData.category.trim(),
        amount: parseFloat(formData.amount.replace(',', '.')),
        description: formData.description.trim(),
        priority: formData.priority,
        date: formData.date,
        notes: formData.notes.trim() || undefined
      };

      await onSubmit(transactionData);
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      // обработка ошибок реализована в расширенных api-хуках
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // разрешаем только цифры, запятую и точку
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    handleFieldChange('amount', cleanValue);
  };

  const formatAmountDisplay = (value: string): string => {
    if (!value) return '';
    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue)) return value;
    
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title || (transaction ? 'Редактировать транзакцию' : 'Новая транзакция')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              disabled={isSubmitting || isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* тип транзакции */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Тип транзакции <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFieldChange('type', 'income')}
                  disabled={isSubmitting || isLoading}
                  className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.type === 'income'
                      ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-300 dark:border-green-700'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">↗</span>
                    <span className="font-medium">Доход</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('type', 'expense')}
                  disabled={isSubmitting || isLoading}
                  className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.type === 'expense'
                      ? 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 border-red-300 dark:border-red-700'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">↙</span>
                    <span className="font-medium">Расход</span>
                  </div>
                </button>
              </div>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* категория */}
            <CategorySelector
            value={formData.category}
            onChange={(category) => handleFieldChange('category', category)}
            type={formData.type}
            error={touched.category ? errors.category : undefined}
            required
            disabled={isSubmitting || isLoading}
            selectClassName="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />

            {/* сумма */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Сумма <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                  placeholder="0,00"
                  disabled={isSubmitting || isLoading}
                  className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    touched.amount && errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">₽</span>
                </div>
              </div>
              {formData.amount && !errors.amount && (
                <p className="text-xs text-gray-500">
                  {formatAmountDisplay(formData.amount)} ₽
                </p>
              )}
              {touched.amount && errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* описание */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                placeholder="Введите описание транзакции"
                disabled={isSubmitting || isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  touched.description && errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {touched.description && errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* приоритет */}
            <PrioritySelector
              value={formData.priority}
              onChange={(priority) => handleFieldChange('priority', priority)}
              error={touched.priority ? errors.priority : undefined}
              required
              disabled={isSubmitting || isLoading}
              buttonClassName={(selected, color) =>
                `p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  selected
                    ? color.includes('blue')
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 border-current shadow-md'
                      : color.includes('green')
                      ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-300 dark:border-green-700 border-current shadow-md'
                      : color.includes('red')
                      ? 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 border-red-300 dark:border-red-700 border-current shadow-md'
                      : color.includes('yellow')
                      ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 border-current shadow-md'
                      : /* для серого (низкий приоритет) */
                        'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-500 border-current shadow-md'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`
              }
            />

            {/* дата */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
                max={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting || isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  touched.date && errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {formData.date && !(touched.date && errors.date) && (
                <p className="text-xs text-gray-500">
                  {formatDateForDisplay(formData.date)}
                </p>
              )}
              {touched.date && errors.date && (
                <p className="text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* заметки */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Заметки
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Дополнительная информация (необязательно)"
                rows={3}
                disabled={isSubmitting || isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              {touched.notes && errors.notes && (
                <p className="text-sm text-red-600">{errors.notes}</p>
              )}
            </div>

            {/* кнопки отправки */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isSubmitting || isLoading) && (
                  <LoadingSpinner size="sm" className="mr-2 p-0" />
                )}
                {isSubmitting ? 'Сохранение...' : (transaction ? 'Сохранить' : 'Создать')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;