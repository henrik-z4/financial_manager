import React, { useState } from 'react';
import { useReserves, useCreateReserve, useUpdateReserve, useDeleteReserve, useAddMoneyToReserve, useWithdrawMoneyFromReserve } from '../hooks/useReserves';
import ReserveCard from '../components/ReserveCard';
import ReserveForm from '../components/ReserveForm';
import ReserveMoneyModal from '../components/ReserveMoneyModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { Reserve, CreateReserveRequest, UpdateReserveRequest } from '../types/api';

const Reserves: React.FC = () => {
  const { data: reserves, loading, error, refetch } = useReserves();
  const createReserve = useCreateReserve();
  const updateReserve = useUpdateReserve();
  const deleteReserve = useDeleteReserve();
  const addMoney = useAddMoneyToReserve();
  const withdrawMoney = useWithdrawMoneyFromReserve();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReserve, setEditingReserve] = useState<Reserve | null>(null);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [moneyModalType, setMoneyModalType] = useState<'add' | 'withdraw'>('add');
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null);

  const handleCreateReserve = async (data: CreateReserveRequest) => {
    try {
      await createReserve.mutate(data);
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      console.error('Не удалось создать резерв:', error);
    }
  };

  const handleUpdateReserve = async (data: UpdateReserveRequest) => {
    if (!editingReserve) return;
    
    try {
      await updateReserve.mutate({ id: editingReserve.id, reserve: data });
      setIsFormOpen(false);
      setEditingReserve(null);
      refetch();
    } catch (error) {
      console.error('Не удалось обновить резерв:', error);
    }
  };

  const handleDeleteReserve = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот резерв?')) {
      return;
    }

    try {
      await deleteReserve.mutate(id);
      refetch();
    } catch (error) {
      console.error('Не удалось удалить резерв:', error);
    }
  };

  const handleEditReserve = (reserve: Reserve) => {
    setEditingReserve(reserve);
    setIsFormOpen(true);
  };

  const handleAddMoney = (id: number) => {
    const reserve = reserves?.find(r => r.id === id);
    if (reserve) {
      setSelectedReserve(reserve);
      setMoneyModalType('add');
      setIsMoneyModalOpen(true);
    }
  };

  const handleWithdrawMoney = (id: number) => {
    const reserve = reserves?.find(r => r.id === id);
    if (reserve) {
      setSelectedReserve(reserve);
      setMoneyModalType('withdraw');
      setIsMoneyModalOpen(true);
    }
  };

  const handleMoneyOperation = async (amount: number) => {
    if (!selectedReserve) return;

    try {
      if (moneyModalType === 'add') {
        await addMoney.mutate({ id: selectedReserve.id, amount });
      } else {
        await withdrawMoney.mutate({ id: selectedReserve.id, amount });
      }
      setIsMoneyModalOpen(false);
      setSelectedReserve(null);
      refetch();
    } catch (error) {
      console.error('Не удалось выполнить операцию с деньгами:', error);
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

  // вычисление итоговых значений
  const totalCurrent = reserves?.reduce((sum, reserve) => sum + reserve.currentAmount, 0) || 0;
  const totalTarget = reserves?.reduce((sum, reserve) => sum + reserve.targetAmount, 0) || 0;
  const completedReserves = reserves?.filter(reserve => reserve.currentAmount >= reserve.targetAmount).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorMessage 
          message="Не удалось загрузить резервы" 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* шапка страницы */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Резервы</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Добавить резерв
        </button>
      </div>

      {/* сводные карточки */}
      {reserves && reserves.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего накоплено</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCurrent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Достигнуто целей</p>
                <p className="text-2xl font-bold text-gray-900">{completedReserves} из {reserves.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Общий прогресс</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* список резервов */}
      {reserves && reserves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reserves.map((reserve) => (
            <ReserveCard
              key={reserve.id}
              reserve={reserve}
              onEdit={handleEditReserve}
              onDelete={handleDeleteReserve}
              onAddMoney={handleAddMoney}
              onWithdrawMoney={handleWithdrawMoney}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет резервов</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Создайте свой первый резервный фонд для достижения финансовых целей
          </p>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать резерв
          </button>
        </div>
      )}

      {/* модальное окно формы резерва */}
      <ReserveForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReserve(null);
        }}
        onSubmit={editingReserve ? 
          (data: CreateReserveRequest | UpdateReserveRequest) => handleUpdateReserve(data as UpdateReserveRequest) : 
          (data: CreateReserveRequest | UpdateReserveRequest) => handleCreateReserve(data as CreateReserveRequest)
        }
        reserve={editingReserve}
        isLoading={createReserve.loading || updateReserve.loading}
      />

      {/* модальное окно операций с деньгами */}
      <ReserveMoneyModal
        isOpen={isMoneyModalOpen}
        onClose={() => {
          setIsMoneyModalOpen(false);
          setSelectedReserve(null);
        }}
        onSubmit={handleMoneyOperation}
        reserve={selectedReserve}
        type={moneyModalType}
        isLoading={addMoney.loading || withdrawMoney.loading}
      />
    </div>
  );
};

export default Reserves;