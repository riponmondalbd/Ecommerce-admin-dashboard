import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import productService from '../../../services/ProductService';
import Modal from '../../../components/ui/Modal';
import ProductForm from '../../products/forms/ProductForm';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  categoryId: string;
  brandId: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('all');

  // Modal state for Create/Edit operations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.list({ page: 1, limit: 20 });
        setProducts(response.data || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        // Show error notification in a real app
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || product.categoryId === filterCategory;
      const matchesBrand = filterBrand === '' || product.brandId === filterBrand;
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterBrand, filterStatus]);

  // Handle open create modal
  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Handle form save/create/update
  const handleSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        // Update existing product
        const updated = await productService.update(editingProduct.id, productData);
        setProducts(products.map(p => p.id === updated.id ? updated : p));
      } else {
        // Create new product
        const created = await productService.create(productData);
        setProducts([created, ...products]);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Failed to save product. Please try again.');
    }
  };

  // Handle delete (simplified - would require permission check)
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  if (!user) return null;
  if (loading) return <div className="text-center py-12"><div className="inline-animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>;

  return (
    <>
      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Product Catalog</h1>
              <p className="mt-2 text-gray-600">Manage your products, variants, and inventory</p>
            </div>
            <button
              onClick={handleCreate}
              className="mt-4 sm:mt-0 inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2">➕</span>
              Create Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Categories</option>
                {/* Options would be populated from API in a full implementation */}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                id="brand"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Brands</option>
                {/* Options would be populated from API in a full implementation */}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Filter summary */}
          {(searchTerm || filterCategory || filterBrand || filterStatus !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredProducts.length > 0 ? `Found ${filteredProducts.length} product(s)` : 'No products match your criteria.'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterBrand('');
                  setFilterStatus('all');
                }}
                className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Product Table */}
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 19l28.14-28.14a1 1 001.414 1.414l-28.14 28.14A1 1 0014 19H12v16h16z" />
                      </svg>
                      <p className="mt-2 text-sm">No products found. Try adjusting your filters.</p>
                      {!searchTerm && !filterCategory && !filterBrand && filterStatus === 'all' && (
                        <p className="mt-1 text-sm text-gray-400">Or <button className="text-indigo-600 hover:text-indigo-800 underline" onClick={handleCreate}>create your first product</button></p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Category
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Brand
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.status === 'PUBLISHED' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : product.status === 'DRAFT' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {filteredProducts.length} of {products.length} results
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {editingProduct ? (
          <ProductForm
            initialProduct={editingProduct}
            onClose={() => {
              setIsModalOpen(false);
              setEditingProduct(null);
            }}
            onSave={(product) => {
              // Product will be handled in handleSubmit
            }}
          />
        ) : (
          <ProductForm
            onClose={() => setIsModalOpen(false)}
            onSave={(product) => {
              // Product will be handled in handleSubmit
            }}
          />
        )}
      </Modal>
    </>
  );
};

export default Products;