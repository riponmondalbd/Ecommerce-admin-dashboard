'use client';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { useEffect, useState } from 'react';
import api from '@/lib/axios-client';
import { Product } from '@/types';

// Validation schema for product update (matches backend UpdateProductDto)
const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  shortDescription: z.string().min(5, 'Short description must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().optional().nullable(),
  stock: z.number().nonnegative('Stock must be non-negative'),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']),
  weight: z.number().optional().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0),
  sku: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  brandId: z.string(),
  categoryIds: z.string().array(),
  mediaIds: z.string().array().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch product data on mount
  useEffect(() => {
    if (id) {
      api.get(`/products/${id}`)
        .then(res => {
          setProduct(res.data);
          formMethods.reset(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch product:', err);
          toast.error('Failed to load product');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Form initialization with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {},
  });

  const formMethods = { register, handleSubmit, errors, watch, setValue, reset };

  // Auto-generate slug if not provided
  const watchSlug = watch('slug');
  const watchName = watch('name');
  useEffect(() => {
    if (watchName && !watchSlug && product) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug || product.slug);
    }
  }, [watchName, watchSlug, product, setValue]);

  // Handle form submission
  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    try {
      if (!product?.id) return;

      const res = await api.put(`/products/${product.id}`, data);
      toast.success('Product updated successfully!');
      router.push('/dashboard/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  if (loading || !product) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600">Update product details below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  value={product.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  className={`w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <Input
                  id="slug"
                  {...register('slug')}
                  value={product.slug || ''}
                  onChange={(e) => setValue('slug', e.target.value)}
                  className={`w-full ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description *
                </label>
                <textarea
                  id="shortDescription"
                  rows={2}
                  {...register('shortDescription')}
                  value={product.shortDescription || ''}
                  onChange={(e) => setValue('shortDescription', e.target.value)}
                  className={`w-full border-gray-300 ${errors.shortDescription ? 'border-red-500' : ''} focus:ring-primary focus:border-primary rounded-md`}
                />
                {errors.shortDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Select value={product.status} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6升到38c-.553 0-1 .448-1 1s.447 1 1 1h.001c.553 0 1-.448 1-1s-.447-1-1-1zm3 0H6a3 3 0 00-3 3v1a3 3 0 003 3h10a3 3 0 003-3v-1a3 3 0 00-3-3z" />
              </svg>
              Pricing & Inventory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price')}
                  value={product.price}
                  onChange={(e) => setValue('price', parseFloat(e.target.value))}
                  className={`w-full ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price
                </label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  {...register('salePrice')}
                  value={product.salePrice ?? ''}
                  onChange={(e) => setValue('salePrice', e.target.value === '' ? null : parseFloat(e.target.value))}
                  className="w-full border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock')}
                  value={product.stock}
                  onChange={(e) => setValue('stock', parseInt(e.target.value))}
                  className={`w-full ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="stockStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status *
                </label>
                <Select value={product.stockStatus} onValueChange={(v) => setValue('stockStatus', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                {errors.stockStatus && (
                  <p className="mt-1 text-sm text-red-600">{errors.stockStatus.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  {...register('weight')}
                  value={product.weight ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue('weight', val === '' ? null : parseFloat(val));
                  }}
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={product.isActive}
                    onChange={(e) => setValue('isActive', e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={product.isFeatured}
                    onChange={(e) => setValue('isFeatured', e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>

              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...register('sortOrder')}
                  value={product.sortOrder}
                  onChange={(e) => setValue('sortOrder', parseInt(e.target.value))}
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Associations - Simplified */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Associations
            </h2>
            <p className="text-sm text-gray-500 mb-4">Brand and Category associations require additional data fetching from API.</p>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Update Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
