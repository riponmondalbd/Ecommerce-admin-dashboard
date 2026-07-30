'use client';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';

// Validation schema for role creation (matches backend CreateRole payload)
const roleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  permissions: z.string().array().min(1, 'At least one permission must be selected'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function CreateRolePage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>([]);

  // Predefined list of available permissions (would ideally be fetched from API)
  const allPermissions = [
    'product:read', 'product:create', 'product:update', 'product:delete',
    'category:read', 'category:create', 'category:update', 'category:delete',
    'brand:read', 'brand:create', 'brand:update', 'brand:delete',
    'attribute:read', 'attribute:create', 'attribute:update', 'attribute:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'user:read', 'user:create', 'user:update', 'user:delete',
    'role:read', 'role:create', 'role:update', 'role:delete',
    'permission:read', 'permission:create', 'permission:update', 'permission:delete',
  ];

  // Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  // Handle permission toggle
  const togglePermission = (perm: string) => {
    setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  // Handle form submission
  const onSubmit: SubmitHandler<RoleFormValues> = async (data) => {
    try {
      await api.post('/api/roles', {
        ...data,
        permissions: data.permissions,
      });
      toast.success('Role created successfully!');
      router.push('/dashboard/roles');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create role');
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Role</h1>
          <p className="text-gray-600">Define a new role with specific permissions for users</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Role Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name *
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Admin, Editor, Viewer"
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
                  placeholder="Brief description of the role"
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Permission Assignment - Grid View */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Assign Permissions
            </h2>
            <p className="text-sm text-gray-600 mb-4">Select one or more permissions for this role (minimum 1 required)</p>

            {/* Permission Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
              {allPermissions.map(perm => {
                const isSelected = permissions.includes(perm);
                return (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    className={`px-3 py-2 rounded-md text-sm text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{perm}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected permissions display */}
            {permissions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected permissions ({permissions.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm, idx) => (
                    <span key={idx} className="inline-flex items-centered px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {errors.permissions && (
              <p className="mt-2 text-sm text-red-600">{errors.permissions.message}</p>
            )}
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Create Role</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
