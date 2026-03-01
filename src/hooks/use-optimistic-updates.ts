"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  immediateUpdate?: boolean;
}

export function useOptimisticUpdates<T = any>() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);

  const executeOptimistic = useCallback(
    async (
      mutationFn: () => Promise<T>,
      optimisticValue: T,
      options: OptimisticUpdateOptions<T> = {}
    ) => {
      const { onSuccess, onError, onSettled, immediateUpdate = true } = options;

      try {
        setIsUpdating(true);
        
        // Apply optimistic update immediately if requested
        if (immediateUpdate) {
          setOptimisticData(optimisticValue);
        }

        // Execute the actual mutation
        const result = await mutationFn();

        // Clear optimistic state
        setOptimisticData(null);

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Clear optimistic state on error
        setOptimisticData(null);

        // Call error callback
        if (onError) {
          onError(error as Error);
        }

        throw error;
      } finally {
        setIsUpdating(false);
        if (onSettled) {
          onSettled();
        }
      }
    },
    []
  );

  return {
    isUpdating,
    optimisticData,
    executeOptimistic,
    clearOptimisticData: () => setOptimisticData(null),
  };
}

// Hook for transaction-specific optimistic updates
export function useTransactionOptimisticUpdates() {
  const { isUpdating, optimisticData, executeOptimistic } = useOptimisticUpdates();

  const deleteTransactionOptimistically = useCallback(
    async (
      transactionId: string,
      currentTransactions: any[],
      mutationFn: () => Promise<any>
    ) => {
      // Create optimistic state where transaction is removed
      const optimisticTransactions = currentTransactions.filter(t => t.id !== transactionId);

      return executeOptimistic(
        mutationFn,
        optimisticTransactions,
        {
          onSuccess: () => {
            toast.success("Transaction deleted successfully");
          },
          onError: (error) => {
            toast.error("Failed to delete transaction");
            console.error("Delete error:", error);
          },
        }
      );
    },
    [executeOptimistic]
  );

  return {
    isUpdating,
    optimisticData,
    deleteTransactionOptimistically,
  };
}
