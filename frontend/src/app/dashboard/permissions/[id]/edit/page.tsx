'use client';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Link from 'next/link';
import api from '@/lib/axios-client';

// Validation schema for permission editing
const permissionSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(50, 'Key must be less than 50 characters')
    .regex(/^[a-z_]+:[a-z_]+$/, 'Key must follow format "module:action" (e.g., "product:create")'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(255).optional(),
  group: z.string().min(1, 'Group is required'),
  isActive: z.boolean().optional(),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

const permissionGroups = [
  'AUTHENTICATION',
  'USER_MANAGEMENT',
  'ROLE_MANAGEMENT',
  'PERMISSION_MANAGEMENT',
  'PRODUCT',
  'CATEGORY',
  'BRAND',
  'ATTRIBUTE',
  'MEDIA',
  'ORDER',
  'DASHBOARD',
  'SETTINGS',
];

export default function EditPermissionPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const permissionId = params.id as string;
  const [loading, setLoading] = useState(true);

  // Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      key: '',
      name: '',
      description: '',
      group: 'PERMISSION_MANAGEMENT',
      isActive: true,
    },
  });

  // Fetch permission data
  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const res = await api.get(`/permissions/${permissionId}`);
        const permission = res.data?.data || res.data;
        if (permission) {
          setValue('key', permission.key);
          setValue('name', permission.name);
          setValue('description', permission.description || '');
          setValue('group', permission.group);
          setValue('isActive', permission.isActive);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load permission');
        router.push('/dashboard/permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermission();
  }, [permissionId, router, setValue, toast]);

  // Handle form submission
  const onSubmit: SubmitHandler<PermissionFormValues> = async (data) => {
    try {
      await api.put(`/permissions/${permissionId}`, {
        ...data,
        key: data.key.toLowerCase(),
      });
      toast.success('Permission updated successfully!');
      router.push('/dashboard/permissions');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update permission');
    }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Permission</h1>
          <p className="text-gray-600">Update permission details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Permission Details
            </h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Key <span className="text-red-500">*</span>
                </label>
                <Input
                  id="key"
                  {...register('key')}
                  placeholder="e.g., product:create, user:read, category:update"
                  className={`w-full ${errors.key ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.key && (
                  <p className="mt-1 text-sm text-red-600">{errors.key.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Format: module:action (lowercase, letters and underscores only)</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Create Product, Read Users, Update Category"
                  className={`w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of what this permission allows"
                  className="w-full border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                  Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="group"
                  {...register('group')}
                  className={`w-full rounded-md px-3 py-2 text-sm border focus:ring-indigo-500 focus:border-indigo-500 ${errors.group ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select a group</option>
                  {permissionGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                {errors.group && (
                  <p className="mt-1 text-sm text-red-600">{errors.group.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/dashboard/permissions">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit">Update Permission</Button>
          </div>
        </form>
      </div>
    </div>
  );
}