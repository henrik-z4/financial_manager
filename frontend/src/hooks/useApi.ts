import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction();
      setState({
        data: result,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Произошла неожиданная ошибка',
      });
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
    reset,
  };
}

export interface UseMutationState {
  loading: boolean;
  error: string | null;
}

export interface UseMutationReturn<T, P> extends UseMutationState {
  mutate: (params: P) => Promise<T>;
  reset: () => void;
}

export function useMutation<T, P>(
  mutationFunction: (params: P) => Promise<T>
): UseMutationReturn<T, P> {
  const [state, setState] = useState<UseMutationState>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: P): Promise<T> => {
    setState({ loading: true, error: null });
    
    try {
      const result = await mutationFunction(params);
      setState({ loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Произошла неожиданная ошибка';
      setState({ loading: false, error: errorMessage });
      throw error;
    }
  }, [mutationFunction]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}