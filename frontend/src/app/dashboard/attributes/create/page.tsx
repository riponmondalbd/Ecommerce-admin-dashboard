
'use client';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';

// Validation schema for attribute creation (matches backend CreateAttributeDto)
const attributeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  type: z.enum(['TEXT', 'SELECT', 'COLOR', 'IMAGE']),
});

type AttributeFormValues = z.infer<typeof attributeSchema>;

export default function CreateAttributePage() {
  const toast = useToast();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'TEXT' | 'SELECT' | 'COLOR' | 'IMAGE'>('TEXT');

  // Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      type: 'TEXT',
      slug: '',
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

  // Handle type change to update form defaults
  const handleTypeChange = (type: string) => {
    setSelectedType(type as typeof selectedType);
    setValue('type', type as any);
  };

  // Handle form submission
  const onSubmit: SubmitHandler<AttributeFormValues> = async (data) => {
    try {
      await api.post('/attributes', {
        ...data,
      });
      toast.success('Attribute created successfully!');
      router.push('/dashboard/attributes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create attribute');
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Attribute</h1>
          <p className="text-gray-600">Define an attribute that products can have (e.g., Color, Size)</p>
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
                  placeholder="e.g., Color, Size, Material"
                  className={`w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="Auto-generated"
                  className="w-full border-gray-300"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text Input</SelectItem>
                      <SelectItem value="SELECT">Dropdown Selection</SelectItem>
                      <SelectItem value="COLOR">Color Picker</SelectItem>
                      <SelectItem value="IMAGE">Image Upload</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedType === 'COLOR' && (
                    <Input
                      type="color"
                      defaultValue="#000000"
                      className="w-12 h-10 p-0 border border-gray-300 rounded"
                      aria-label="Color preview"
                    />
                  )}
                </div>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Type-specific instructions */}
          <section className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
            <p className="text-sm text-blue-800">
              {selectedType === 'TEXT' && 'This creates a free-text field for product variations.'}
              {selectedType === 'SELECT' && 'This creates a dropdown menu for predefined selections. You will add values after creating the attribute.'}
              {selectedType === 'COLOR' && 'This creates a color picker interface for selecting colors. Values will be hexadecimal color codes.'}
              {selectedType === 'IMAGE' && 'This creates an image upload field for visual options like patterns or logos.'}
            </p>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Create Attribute</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
