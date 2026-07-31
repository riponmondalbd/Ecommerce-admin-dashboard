'use client';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { useState, useEffect } from 'react';
import api from '@/lib/axios-client';

// Validation schema for product variant creation (matches backend CreateProductVariantDto)
const variantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().optional().nullable(),
  inventory: z.number().nonnegative('Inventory must be non-negative'),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']),
  lowStockThreshold: z.number().int().min(0),
  weight: z.number().optional().nullable(),
  dimensions: z.object({
    width: z.number().positive(),
    depth: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  isActive: z.boolean(),
  attributeValueIds: z.string().array(),
  mediaIds: z.string().array().optional(),
});

type VariantFormValues = z.infer<typeof variantSchema>;

export default function CreateVariantPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [attributeValues, setAttributeValues] = useState<any[]>([]);
  const [mediaIds, setMediaIds] = useState<string[]>([]);

  // Fetch product details on mount
  useEffect(() => {
    if (productId) {
      api.get(`/api/products/${productId}`)
        .then(res => {
          setProduct(res.data);
          // Set default values based on product
          formMethods.setValue('price', res.data.price);
        })
        .catch(err => console.error('Failed to fetch product:', err));
    }
  }, [productId]);

  // Fetch attribute values (for dropdown selection)
  useEffect(() => {
    api.get('/api/attributes')
      .then(res => {
        const allValues: any[] = [];
        res.data.data.forEach((attr: { name: string; values: Array<{ id: string; label: string; attributeId: string }> }) => {
          if (attr.values) {
            attr.values.forEach(val => {
              allValues.push({
                id: val.id,
                label: `${attr.name} - ${val.label}`,
                attributeId: val.attributeId,
                valueId: val.id,
              });
            });
          }
        });
        setAttributeValues(allValues);
      })
      .catch(err => console.error('Failed to fetch attributes:', err));
  }, []);

  // Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      productId: productId || '',
      isActive: true,
      lowStockThreshold: 5,
      inventory: 0,
      dimensions: { width: 0, depth: 0, height: 0 },
    },
  });

  const formMethods = { register, handleSubmit, errors, watch, setValue };

  // Handle form submission
  const onSubmit: SubmitHandler<VariantFormValues> = async (data) => {
    try {
      const variantData = { ...data, productId };
      // Delete dimensions if empty for cleaner API payload
      if (!data.dimensions || Object.keys(data.dimensions).length === 0) {
        delete variantData.dimensions;
      }

      await api.post(`/api/products/${productId}/variants`, variantData);
      toast.success('Variant created successfully!');
      router.push(`/dashboard/products/${productId}/variants`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create variant');
    }
  };

  if (!productId || !product) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Variant</h1>
          <p className="text-gray-600">for product: {product.name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SKU & Pricing */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              SKU & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (optional)
                </label>
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="Auto-generated if left empty"
                  className="w-full border-gray-300"
                />
              </div>

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
                  placeholder="Optional"
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Inventory Settings */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Inventory Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock *
                </label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  {...register('inventory')}
                  value={0}
                  className={`w-full ${errors.inventory ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.inventory && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="stockStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status *
                </label>
                <select
  value={watch('stockStatus') || 'IN_STOCK'}
  onChange={(e) => setValue('stockStatus', e.target.value as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK')}
  className="border border-gray-300 rounded-md p-2 focus:ring-primary focus:border-primary w-full"
>
  <option value="IN_STOCK">In Stock</option>
  <option value="LOW_STOCK">Low Stock</option>
  <option value="OUT_OF_STOCK">Out of Stock</option>
</select>
                {errors.stockStatus && (
                  <p className="mt-1 text-sm text-red-600">{errors.stockStatus.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold *
                </label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  {...register('lowStockThreshold')}
                  value={5}
                  onChange={(e) => setValue('lowStockThreshold', parseInt(e.target.value))}
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Physical Attributes */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Physical Attributes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  {...register('weight')}
                  placeholder="Optional"
                  className="w-full border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (W x D x H)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Width"
                    name="dimensionWidth"
                    value={watch('dimensions?.width') || ''}
                    onChange={(e) => setValue('dimensions', { ...(watch('dimensions') || {}), width: parseFloat(e.target.value) || 0 })}
                    className="w-full border-gray-300"
                  />
                  <Input
                    type="number"
                    placeholder="Depth"
                    {...register('dimensions.depth')}
                    value={watch('dimensions?.depth') || ''}
                    onChange={(e) => setValue('dimensions', { ...(watch('dimensions') || {}), depth: parseFloat(e.target.value) || 0 })}
                    className="w-full border-gray-300"
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    {...register('dimensions.height')}
                    value={watch('dimensions?.height') || ''}
                    onChange={(e) => setValue('dimensions', { ...(watch('dimensions') || {}), height: parseFloat(e.target.value) || 0 })}
                    className="w-full border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3 mt-6">
                  <input
                    type="checkbox"
                    checked={watch('isActive') || true}
                    onChange={(e) => setValue('isActive', e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </section>

          {/* Associations - Simplified */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Attribute Values
            </h2>
            <p className="text-sm text-gray-500 mb-4">Attribute values need to be fetched from the backend and populated dynamically. This would typically show checkboxes or multi-select for available attribute values.</p>
            {/* In a real implementation, this would include actual attribute value selection */}
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Create Variant</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
