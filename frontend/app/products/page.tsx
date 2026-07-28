'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Layout } from '@/components/layout/Layout';
import { Plus as AddIcon, Filter as FilterIcon, Search as SearchIcon, Edit as EditIcon, Trash as TrashIcon, Package as ProductIcon } from 'lucide-react';
import type { Product } from '@/types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=25&page=1');
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           false;
  });

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading products...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <Button variant="primary">
            <AddIcon className="mr-2" /> Add Product
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
            <p className="text-sm text-gray-50">Showing {filteredProducts.length} products</p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ProductIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-50">No products found matching your criteria.</p>
            </div>
          ) => (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <ProductIcon className="text-gray-400 w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6py-4 whitespace-nowrap text-sm text-gray-500">{product.sku || '-'}</td>
                      <td className="px-6py-4 whitespace-nowrap text-sm text-gray-500">{product.category?.name || '-'}</td>
                      <td className="px-6py-4 whitespace-nowrap text-sm text-gray-500">{product.brand?.name || '-'}</td>
                      <td className="px-6py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.price.toFixed(2)}</td>
                      <td className="px-6py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-3">
                          <button className="text-primary-600 hover:text-primary-900">
                            <EditIcon className="inline-block w-4 h-4" />
                          </button>
                          <button className="text-error-600 hover:text-error-900">
                            <TrashIcon className="inline-block w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="pt-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(25, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={true}
                  className="px-3 py-1 border border-gray-300 text-sm text-gray-500 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50"
                >
                  1
                </button>
                <button
                  disabled={true}
                  className="px-3 py-1 border border-gray-300 text-sm text-gray-500 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
