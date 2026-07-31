'use client';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';

// Validation schema for category creation (matches backend CreateCategoryDto)
const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CreateCategoryPage() {
  const router = useRouter();

  // Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      parentId: '',
    },
  });

  // Auto-generate slug if not provided
  const watchName = watch('name');
  useEffect(() => {
    if (watchName && !watch('slug')) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [watchName, watch('slug'), setValue]);

  // Handle form submission
  const onSubmit: SubmitHandler<CategoryFormValues> = async (data) => {
    try {
      await api.post('/categories', {
        ...data,
        parentId: data.parentId || null,
      });
      toast.success('Category created successfully!');
      router.push('/dashboard/categories');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Category</h1>
          <p className="text-gray-600">Define a new category for your product catalog</p>
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
                  placeholder="e.g., Electronics"
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
                  placeholder="Auto-generated from name"
                  className={`w-full ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Hierarchy */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Category Hierarchy
            </h2>
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category (optional - leave empty for top-level)
              </label>
              <Select value={watch('parentId') || ''} onValueChange={(v) => setValue('parentId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent (top-level)</SelectItem>
                  {/* Parent categories would be populated from API */}
                </SelectContent>
              </Select>
              {errors.parentId && (
                <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Create Category</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
