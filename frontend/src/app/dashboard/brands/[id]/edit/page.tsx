
'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';

// Validation schema for brand update (matches backend UpdateBrandDto)
const brandSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function EditBrandPage() {
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form initialization — must be before any useEffect that calls setValue
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    control,
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      slug: '',
      status: 'ACTIVE',
    },
  });

  // Fetch brand data and populate form
  useEffect(() => {
    if (!id) return;
    api.get(`/brands/${id}`)
      .then(res => {
        const brandData = res.data.data || res.data;
        setBrand(brandData);
        // Use reset() to populate all fields at once — the correct RHF pattern
        reset({
          name: brandData.name ?? '',
          slug: brandData.slug ?? '',
          status: brandData.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        });
      })
      .catch(err => console.error('Failed to fetch brand:', err))
      .finally(() => setLoading(false));
  }, [id, reset]);

  // Auto-generate slug from name if slug is empty
  const watchName = watch('name');
  const watchSlug = watch('slug');
  useEffect(() => {
    if (watchName && !watchSlug) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [watchName]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<BrandFormValues> = async (data) => {
    try {
      if (!brand?.id) return;
      setUploading(true);

      // Update brand details
      await api.put(`/brands/${brand.id}`, data);

      // Upload and link logo if a new file was selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('altText', `${data.name} logo`);

        const mediaRes = await api.post('/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const mediaId = mediaRes.data?.data?.id || mediaRes.data?.id;
        if (mediaId) {
          await api.post(`/brands/${brand.id}/media`, { mediaId });
        }
      }

      toast.success('Brand updated successfully!');
      router.push('/dashboard/brands');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update brand');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !brand) {
    return (
      <div className="p-8 min-h-full">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading brand...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Brand</h1>
          <p className="text-gray-600">Update brand details below</p>
        </div>

        {/* Logo Display */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Current Logo</h3>
          <div className="flex items-center space-x-4">
            {file ? (
              <img src={URL.createObjectURL(file)} alt="New logo preview" className="w-24 h-24 rounded border object-contain" />
            ) : brand.media ? (
              <img src={brand.media.publicUrl} alt={brand.name} className="w-24 h-24 rounded border object-contain" />
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                No logo
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {file ? `New Logo: ${file.name}` : brand.media ? `Logo (${brand.media.fileName})` : 'No logo assigned yet'}
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                {file ? 'Change Logo' : 'Upload New Logo'}
              </Button>
            </div>
          </div>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  className={`w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <Input
                  id="slug"
                  {...register('slug')}
                  className="w-full border-gray-300"
                />
              </div>

              {/* Status — using Controller for proper Radix UI Select integration */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Updating...' : 'Update Brand'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
