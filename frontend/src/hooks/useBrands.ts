import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const useBrands = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await api.get('/brands');
        const brandSummaries = (response.data as any[]).map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          status: b.status,
        }));
        setBrands(brandSummaries);
      } catch (err) {
        console.error('Failed to fetch brands:', err);
        setError('Failed to load brands');
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [user, authLoading]);

  return {
    brands,
    loading: loading || authLoading,
    error,
  };
};

export default useBrands;