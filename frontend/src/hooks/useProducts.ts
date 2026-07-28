import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
}

export const useProducts = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products');
        // Transform to simplified summary format
        const productSummaries = (response.data as any[]).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          status: p.status,
          createdAt: p.createdAt,
        }));
        setProducts(productSummaries);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, authLoading]);

  return {
    products,
    loading: loading || authLoading,
    error,
    refetch: () => {}, // Could implement reload logic here
  };
};

export default useProducts;