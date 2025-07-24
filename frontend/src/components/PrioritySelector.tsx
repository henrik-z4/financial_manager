import React from 'react';

type PriorityValue = 'низкий' | 'средний' | 'высокий' | 'максимальный' | 'целевой';

interface PrioritySelectorProps {
  value: PriorityValue;
  onChange: (value: PriorityValue) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  buttonClassName?: (selected: boolean, color: string) => string;
}

const priorities = [
  {
    value: 'низкий' as const,
    label: 'Низкий',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '○'
  },
  {
    value: 'средний' as const,
    label: 'Средний',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '◐'
  },
  {
    value: 'высокий' as const,
    label: 'Высокий',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '◑'
  },
  {
    value: 'максимальный' as const,
    label: 'Максимальный',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '●'
  },
  {
    value: 'целевой' as const,
    label: 'Целевой',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '★'
  }
];

const PrioritySelector: React.FC<PrioritySelectorProps> = ({ value, onChange, disabled, error, required, buttonClassName }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Приоритет {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {priorities.map((priority) => (
          <button
            key={priority.value}
            type="button"
            onClick={() => onChange(priority.value)}
            disabled={disabled}
            className={
              buttonClassName
                ? buttonClassName(value === priority.value, priority.color)
                : [
                    'p-2.5 rounded-lg border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    value === priority.value
                      ? `${priority.color} border-current shadow-md bg-gray-200 dark:bg-primary-700/70 dark:text-white dark:border-primary-500`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 dark:bg-gray-700',
                    'flex items-center justify-center whitespace-normal break-words'
                  ].join(' ')
            }
            style={{ fontSize: '0.95rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
          >
            <span className="grid grid-cols-[auto_1fr] items-center w-full">
              <span className="flex items-center justify-center w-5 h-5 text-lg mr-2">{priority.icon}</span>
              <span className="text-center w-full leading-tight text-sm font-medium break-words">{priority.label}</span>
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PrioritySelector;