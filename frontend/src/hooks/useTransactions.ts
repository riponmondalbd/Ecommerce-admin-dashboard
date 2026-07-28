import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export interface TransactionSummary {
  id: string;
  type: 'CREATE' | 'SELL' | 'RESTOCK' | 'ADJUST' | 'DELETE';
  productId?: string;
  variantId?: string;
  quantity: number;
  priceAtTime: number;
  createdAt: string;
  notes?: string;
}

export const useTransactions = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products/transactions');
        const transSummaries = (response.data as any[]).map((t: any) => ({
          id: t.id,
          type: t.type,
          productId: t.productId,
          variantId: t.variantId,
          quantity: t.quantity,
          priceAtTime: t.priceAtTime,
          createdAt: t.createdAt,
          notes: t.notes,
        }));
        setTransactions(transSummaries);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, authLoading]);

  return {
    transactions,
    loading: loading || authLoading,
    error,
  };
};

export default useTransactions;