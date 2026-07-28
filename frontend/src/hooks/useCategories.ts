import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export const useCategories = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        const catSummaries = (response.data as any[]).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
        }));
        setCategories(catSummaries);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user, authLoading]);

  return {
    categories,
    loading: loading || authLoading,
    error,
  };
};

export default useCategories;