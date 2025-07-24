import React from 'react';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  type: 'income' | 'expense';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  selectClassName?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  type,
  error,
  required = false,
  disabled = false,
  selectClassName
}) => {
  const incomeCategories = [
    'Зарплата',
    'Фриланс',
    'Бизнес',
    'Инвестиции',
    'Подарки',
    'Возврат долга',
    'Продажа',
    'Пособия',
    'Другое'
  ];

  const expenseCategories = [
    'Продукты',
    'Транспорт',
    'Жилье',
    'Коммунальные услуги',
    'Связь',
    'Одежда',
    'Здоровье',
    'Образование',
    'Развлечения',
    'Кафе и рестораны',
    'Спорт',
    'Красота',
    'Подарки',
    'Путешествия',
    'Техника',
    'Автомобиль',
    'Страхование',
    'Налоги',
    'Кредиты',
    'Другое'
  ];

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Категория {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={
          selectClassName
            ? `${selectClassName} ${error ? 'border-red-500' : ''}`
            : `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'}`
        }
        required={required}
      >
        <option value="">Выберите категорию</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CategorySelector;