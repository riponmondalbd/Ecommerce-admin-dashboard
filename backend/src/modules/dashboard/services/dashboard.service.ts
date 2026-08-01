import { prisma } from '../../../database/prisma';

/**
 * Dashboard statistics data.
 */
export interface DashboardStats {
  products: number;
  categories: number;
  brands: number;
  users: number;
  media: number;
}

/**
 * Fetch all dashboard stat counts in parallel for efficiency.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [products, categories, brands, users, media] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.user.count(),
    prisma.media.count(),
  ]);

  return { products, categories, brands, users, media };
};
