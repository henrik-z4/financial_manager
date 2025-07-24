import React from 'react';
import type { Reserve } from '../types/api';

interface ReserveCardProps {
  reserve: Reserve;
  onEdit: (reserve: Reserve) => void;
  onDelete: (id: number) => void;
  onAddMoney: (id: number) => void;
  onWithdrawMoney: (id: number) => void;
}

const ReserveCard: React.FC<ReserveCardProps> = ({
  reserve,
  onEdit,
  onDelete,
  onAddMoney,
  onWithdrawMoney
}) => {
  const progressPercentage = Math.min((reserve.currentAmount / reserve.targetAmount) * 100, 100);
  const isCompleted = reserve.currentAmount >= reserve.targetAmount;
  const remainingAmount = Math.max(reserve.targetAmount - reserve.currentAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all duration-200 hover:shadow-md ${
      isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {reserve.name}
            {isCompleted && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Достигнуто
              </span>
            )}
          </h3>
          {reserve.purpose && (
            <p className="text-sm text-gray-600">{reserve.purpose}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(reserve)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Редактировать"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(reserve.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Удалить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Прогресс</span>
          <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Суммы */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Накоплено</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(reserve.currentAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Цель</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(reserve.targetAmount)}
          </p>
        </div>
      </div>

      {/* Осталось накопить */}
      {!isCompleted && (
        <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 mb-1">Осталось накопить</p>
          <p className="text-xl font-bold text-blue-800">
            {formatCurrency(remainingAmount)}
          </p>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-2">
        <button
          onClick={() => onAddMoney(reserve.id)}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Пополнить
        </button>
        {reserve.currentAmount > 0 && (
          <button
            onClick={() => onWithdrawMoney(reserve.id)}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            Снять
          </button>
        )}
      </div>

      {/* Празднование достижения цели */}
      {isCompleted && (
        <div className="mt-4 text-center p-3 bg-green-100 rounded-lg border border-green-200">
          <div className="text-2xl mb-1">🎉</div>
          <p className="text-sm font-medium text-green-800">
            Поздравляем! Цель достигнута!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReserveCard;