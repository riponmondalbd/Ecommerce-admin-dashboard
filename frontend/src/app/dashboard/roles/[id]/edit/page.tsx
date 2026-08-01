'use client';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import api from '@/lib/axios-client'
import Link from 'next/link';

// Validation schema for role editing
const roleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  permissions: z.string().array().min(1, 'At least one permission must be selected'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface Permission {
  key: string;
  name: string;
  group: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{ permission: { key: string; name: string } }>;
}

export default function EditRolePage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});

  // Fetch all permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await api.get('/permissions', { params: { limit: 100 } });
        const response = res.data?.data || res.data;
        const data = Array.isArray(response) ? response : (response?.data || []);
        setAllPermissions(data);

        // Group permissions by group
        const grouped: Record<string, Permission[]> = {};
        data.forEach((perm: Permission) => {
          if (!grouped[perm.group]) grouped[perm.group] = [];
          grouped[perm.group].push(perm);
        });
        setGroupedPermissions(grouped);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        toast.error('Failed to load permissions');
      }
    };
    fetchPermissions();
  }, [toast]);

  // Fetch role data
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await api.get(`/roles/${roleId}`);
        const role = res.data?.data || res.data;
        if (role) {
          setPermissions(role.permissions?.map((p: { permission: { key: string } }) => p.permission.key) || []);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load role');
        router.push('/dashboard/roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [roleId, router, toast]);

  // Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
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
      await api.put(`/roles/${roleId}`, {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      });
      toast.success('Role updated successfully!');
      router.push('/dashboard/roles');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role');
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Role</h1>
          <p className="text-gray-600">Update role details and permissions</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Role Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
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

            {/* Permission Grid by Group */}
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{group}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {perms.map(perm => {
                      const isSelected = permissions.includes(perm.key);
                      return (
                        <button
                          key={perm.key}
                          type="button"
                          onClick={() => togglePermission(perm.key)}
                          className={`px-3 py-2 rounded-md text-sm text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-800 ring-2 ring-offset-2 ring-indigo-500'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium">{perm.key}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected permissions display */}
            {permissions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected permissions ({permissions.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
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
            <Link href="/dashboard/roles">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit">Update Role</Button>
          </div>
        </form>
      </div>
    </div>
  );
}