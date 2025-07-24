import React, { useState, useEffect, useMemo } from 'react';
import type { TransactionFilters, Transaction } from '../types/api';
import { useTransactions } from '../hooks/useTransactions';
import TransactionCard from './TransactionCard';
import TransactionFiltersComponent from './TransactionFilters';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface TransactionListProps {
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    limit: 20,
    offset: 0
  });

  // отложенный поиск для уменьшения количества запросов к api
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // обновление фильтров при изменении отложенного поиска
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearch || undefined,
      offset: 0
    }));
  }, [debouncedSearch]);

  const filtersWithSearch = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined
  }), [filters, debouncedSearch]);

  const { data, loading, error, refetch } = useTransactions(filtersWithSearch);

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    if (newFilters.search !== undefined) {
      setSearchTerm(newFilters.search);
      // не обновлять фильтры сразу при поиске, дождаться debounce
      const { search, ...otherFilters } = newFilters;
      setFilters(otherFilters);
    } else {
      setFilters(newFilters);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      limit: 20,
      offset: 0
    });
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const handleLoadMore = () => {
    if (data && data.hasMore) {
      setFilters(prev => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 20)
      }));
    }
  };

  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessage 
          message="Не удалось загрузить транзакции" 
          onRetry={refetch}
        />
      </div>
    );
  }

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = data ? Math.ceil(data.total / (filters.limit || 20)) : 0;

  return (
    <div className="space-y-6">

      <TransactionFiltersComponent
        filters={{ ...filters, search: searchTerm }}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {loading && !data && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {data && (
        <>
          {/* сводка по результатам */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Показано {data.items.length} из {data.total} транзакций
            </span>
            {totalPages > 1 && (
              <span>
                Страница {currentPage} из {totalPages}
              </span>
            )}
          </div>

          {/* список транзакций */}
          {data.items.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Транзакции не найдены</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Попробуйте изменить фильтры или добавить новую транзакцию
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                />
              ))}
            </div>
          )}

          {/* пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Первая
                </button>
                <button
                  onClick={() => handlePageChange((filters.offset || 0) - (filters.limit || 20))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Предыдущая
                </button>
              </div>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange((pageNum - 1) * (filters.limit || 20))}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange((filters.offset || 0) + (filters.limit || 20))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Следующая
                </button>
                <button
                  onClick={() => handlePageChange((totalPages - 1) * (filters.limit || 20))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Последняя
                </button>
              </div>
            </div>
          )}

          {/* кнопка "загрузить ещё" (альтернатива пагинации) */}
          {data.hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Загрузка...' : 'Загрузить ещё'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionList;