import React, { useState } from 'react';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import { transactionService } from '../services/transactionService';
import type { Transaction, CreateTransactionRequest } from '../types/api';

const Transactions: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
      try {
        await transactionService.delete(id);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Ошибка при удалении транзакции');
      }
    }
  };

  const handleFormSubmit = async (transactionData: CreateTransactionRequest) => {
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, transactionData);
      } else {
        await transactionService.create(transactionData);
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Транзакции</h1>
        <button
          onClick={handleCreateTransaction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Добавить транзакцию</span>
        </button>
      </div>

      <TransactionList
        key={refreshKey}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <TransactionForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;