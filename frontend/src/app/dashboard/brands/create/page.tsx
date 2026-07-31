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
import api from '@/lib/axios-client'; // For all API calls including media uploads

// Validation schema for brand creation (matches backend CreateBrandDto)
const brandSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function CreateBrandPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      status: 'ACTIVE',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (fileInput.files && fileInput.files[0]) {
      setFile(fileInput.files[0]);
      e.target.value = ''; // Reset so same file can be selected again
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<BrandFormValues> = async (data) => {
    try {
      // Create brand first without media
      const brandRes = await api.post('/api/brands', data);
      const brandId = brandRes.data.id;

      // Upload logo if file was provided
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId);

        await api.post(`/api/brands/${brandId}/media`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Brand created with logo!');
      } else {
        toast.success('Brand created successfully!');
      }

      router.push('/dashboard/brands');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create brand');
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Brand</h1>
          <p className="text-gray-600">Define a new brand for your products with a logo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                  placeholder="e.g., TechWave"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'ACTIVE' | 'INACTIVE')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Logo Upload */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.666-.9l2.278-4a2 2 0 012.118-1.53h7.23a2 2 0 011.94 2.79l-2.73 5.46a2 2 0 00-.172.51l.847 3.852a2 2 0 001.996 1.67h2.061a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V11.67a2 2 0 001.996-1.67l.847-3.852a2 2 0 00-.172-.51L2.058 4.09A2 2 0 01.118 1.3h7.23a2 2 0 012.118 1.53l-2.278 4A2 2 0 007.93 7H5a2 2 0 01-2-2z" />
              </svg>
              Logo Upload
            </h2>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo (recommended: PNG or JPG, under 10MB)
                </label>
                <div className="flex items-center justify-between w-full">
                  <label htmlFor="logo" className="cursor-pointer relative inline-flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    {file ? (
                      <img src={URL.createObjectURL(file)} alt="Logo preview" className="w-full h-full object-contain rounded" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </label>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Click to browse files or drag and drop here</p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Creating...' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
