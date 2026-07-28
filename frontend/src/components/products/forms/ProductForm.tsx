import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import productService from '../../../../../services/ProductService';
import categoryService from '../../../../../services/CategoryService';
import brandService from '../../../../../services/BrandService';

interface ProductFormProps {
  initialProduct?: any; // For editing, undefined for creating
  onClose: () => void;
  onSave: (product: any) => void;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  sku: string;
  categoryId: string;
  brandId: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  inventoryQuantity: string;
}

interface FormErrors {
  [key: string]: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    sku: '',
    categoryId: '',
    brandId: '',
    status: 'PUBLISHED',
    inventoryQuantity: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Load categories and brands on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const catRes = await categoryService.list();
        setCategories(catRes || []);

        const brandRes = await brandService.list();
        setBrands(brandRes || []);
      } catch (err) {
        console.error('Failed to load options:', err);
      }
    };

    loadOptions();
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        description: initialProduct.description || '',
        price: initialProduct.price.toString(),
        sku: initialProduct.sku || '',
        categoryId: initialProduct.categoryId || '',
        brandId: initialProduct.brandId || '',
        status: initialProduct.status || 'PUBLISHED',
        inventoryQuantity: initialProduct.inventoryQuantity?.toString() || '',
      });
    } else {
      setErrors({});
    }
  }, [initialProduct]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const validate = useCallback(): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.brandId) {
      newErrors.brandId = 'Brand is required';
    }

    if (!formData.inventoryQuantity || isNaN(formData.inventoryQuantity) || parseInt(formData.inventoryQuantity) < 0) {
      newErrors.inventoryQuantity = 'Valid inventory quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!validate()) return;

    setLoading(true);

    try {
      const payload: Omit<FormData, 'price' | 'inventoryQuantity'> = {
        ...formData,
        price: parseFloat(formData.price),
        inventoryQuantity: parseInt(formData.inventoryQuantity, 10),
      };

      if (initialProduct) {
        // Update existing product
        const updatedProduct = await productService.update(initialProduct.id, payload);
        onSave(updatedProduct);
      } else {
        // Create new product
        const createdProduct = await productService.create(payload);
        onSave(createdProduct);
      }

      // Reset form after successful save
      setFormData({
        name: '',
        description: '',
        price: '',
        sku: '',
        categoryId: '',
        brandId: '',
        status: 'PUBLISHED',
        inventoryQuantity: '',
      });
      onClose();
    } catch (err) {
      console.error('Failed to save product:', err);
      setErrors({ server: 'Failed to save product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const hasError = Object.keys(errors).length > 0 || !!errors.server;

  // Select dropdown helpers
  const selectCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setFormData(prev => ({ ...prev, categoryId: id, categoryLabel: cat?.name || '' }));
  };

  const selectBrand = (id: string) => {
    const brand = brands.find(b => b.id === id);
    setFormData(prev => ({ ...prev, brandId: id, brandLabel: brand?.name || '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {initialProduct ? 'Edit Product' : 'Create Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.server && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {errors.server}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
              disabled={loading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product description"
              disabled={loading}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.sku ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter unique SKU"
              disabled={loading}
            />
            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              id="brandId"
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.brandId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">Select a brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && <p className="mt-1 text-sm text-red-600">{errors.brandId}</p>}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Inventory */}
          <div>
            <label htmlFor="inventoryQuantity" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Inventory Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="inventoryQuantity"
              name="inventoryQuantity"
              min="0"
              value={formData.inventoryQuantity}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.inventoryQuantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              disabled={loading}
            />
            {errors.inventoryQuantity && <p className="mt-1 text-sm text-red-600">{errors.inventoryQuantity}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-500 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : initialProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;