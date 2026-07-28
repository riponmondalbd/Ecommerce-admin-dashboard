import { useState, useEffect } from 'react';
import api from '../api';
import type { PaginatedResponse } from '@/types/api';

// Since the backend doesn't have a dedicated stats endpoint, we'll fetch counts separately
export const useDashboardStats = () => {
  const [stats, setStats] = useState<{ products: number; categories: number; brands: number; transactions: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch product count
        const prodResponse = await api.get<{ data: PaginatedResponse<any> }>('api/products?limit=1');
        const products = prodResponse.data.data?.total || 0;

        // Fetch category count
        const catResponse = await api.get<{ data: PaginatedResponse<any> }>('api/categories?limit=1');
        const categories = catResponse.data.data?.total || 0;

        // Fetch brand count
        const brandResponse = await api.get<{ data: PaginatedResponse<any> }>('api/brands?limit=1');
        const brands = brandResponse.data.data?.total || 0;

        // Simulated transaction count (in real app, fetch from transactions endpoint)
        const transactions = Math.floor(Math.random() * 50) + 20;

        setStats({ products, categories, brands, transactions });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
