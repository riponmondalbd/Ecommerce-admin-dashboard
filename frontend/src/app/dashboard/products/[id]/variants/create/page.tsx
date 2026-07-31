'use client';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';

const variantSchema = z.object({
  sku: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().optional().nullable(),
  inventory: z.number().nonnegative('Inventory must be non-negative'),
  lowStockThreshold: z.number().int().min(0),
  weight: z.number().optional().nullable(),
  isActive: z.boolean(),
});

type VariantFormValues = z.infer<typeof variantSchema>;

export default function CreateVariantPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { id: productId } = params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      isActive: true,
      lowStockThreshold: 5,
      inventory: 0,
    },
  });

  useEffect(() => {
    if (productId) {
      api.get(`/products/${productId}`)
        .then(res => {
          setProduct(res.data);
          setValue('price', res.data.price);
        })
        .catch(err => console.error('Failed to fetch product:', err))
        .finally(() => setLoading(false));
    }
  }, [productId, setValue]);

  const onSubmit: SubmitHandler<VariantFormValues> = async (data) => {
    try {
      await api.post(`/products/${productId}/variants`, data);
      toast.success('Variant created successfully!');
      router.push(`/dashboard/products/${productId}/variants`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create variant');
    }
  };

  if (loading || !productId) {
    return (
      <div className="p-8 min-h-full">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href={`/dashboard/products/${productId}/variants`} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            &larr; Back to variants
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Variant</h1>
          <p className="text-gray-600">for: {product?.name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">SKU & Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU (optional)</label>
                <Input id="sku" {...register('sku')} placeholder="Auto-generated if left empty" />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <Input id="price" type="number" step="0.01" {...register('price')} value={product?.price} onChange={(e) => setValue('price', parseFloat(e.target.value))} className={errors.price ? 'border-red-500' : ''} />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>
              <div>
                <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                <Input id="salePrice" type="number" step="0.01" {...register('salePrice')} placeholder="Optional" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
                <Input id="inventory" type="number" {...register('inventory')} value={0} className={errors.inventory ? 'border-red-500' : ''} />
                {errors.inventory && <p className="mt-1 text-sm text-red-600">{errors.inventory.message}</p>}
              </div>
              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <Input id="lowStockThreshold" type="number" {...register('lowStockThreshold')} value={5} onChange={(e) => setValue('lowStockThreshold', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="flex items-center space-x-3 mt-6">
                  <input type="checkbox" checked={watch('isActive')} onChange={(e) => setValue('isActive', e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link href={`/dashboard/products/${productId}/variants`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit">Create Variant</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
