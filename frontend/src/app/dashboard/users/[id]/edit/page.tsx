'use client';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';
import ConfirmDialog from '@/components/ConfirmDialog';

// Validation schema for user update (matches backend UpdateUserDto)
const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage() {
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<{ id: string | null; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {},
  });

  // Fetch user data on mount
  useEffect(() => {
    if (id) {
      api.get(`/api/users/${id}`)
        .then(res => {
          setUser(res.data);
          formMethods.reset(res.data);
        })
        .catch(err => console.error('Failed to fetch user:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const formMethods = { register, handleSubmit, errors, watch, setValue, reset };

  // Handle form submission
  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      if (!user?.id) return;

      const updateData = {
        ...data,
        // Only include password if provided
        password: data.password ? data.password : undefined,
        roleId: data.roleId || undefined,
      };

      await api.put(`/api/users/${user.id}`, updateData);
      toast.success('User updated successfully!');
      router.push('/dashboard/users');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  // Status action handlers
  const handleActivate = async () => {
    try {
      await api.put(`/api/users/${id}/activate`);
      toast.success('User activated!');
      window.location.reload();
    } catch (err) {
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivate = async () => {
    try {
      await api.put(`/api/users/${id}/deactivate`);
      toast.success('User deactivated!');
      window.location.reload();
    } catch (err) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleLock = async () => {
    try {
      await api.put(`/api/users/${id}/lock`);
      toast.success('User locked!');
      window.location.reload();
    } catch (err) {
      toast.error('Failed to lock user');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleteUser({ id: user.id, name: user.name });
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/users/${deleteUser.id}`);
      toast.success('User deleted successfully!');
      setDeleteUser(null);
      router.push('/dashboard/users');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-full">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-500">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit User</h1>
          <p className="text-gray-600">Update user details and permissions</p>
        </div>

        {/* Current Info Display */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Current Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user?.role?.name === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                user?.role?.name === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user?.role?.name || 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                user?.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {user?.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm text-gray-500">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  value={user?.name || ''}
                  onChange={(e) => setValue('name', e.target.value)}
                  className={`w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  value={user?.email || ''}
                  readOnly
                  className="w-full bg-gray-100 border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Role Assignment */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L15.71 8.245a2 2 0 00-2.83 0l-2.273 2.273a2 2 0 01-2.83 0L8.28 8.245a2 2 0 00-2.83 0L2.148 12.5C1.378 13.333 2.34 15 3.88 15h.11z" />
              </svg>
              Role Assignment
            </h2>
            <div>
              <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Role
              </label>
              <Select value={watch('roleId') || ''} onValueChange={(v) => setValue('roleId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {/* Roles would be populated from API */}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Changing your own role may be restricted by self-escalation prevention.</p>
            </div>
          </section>

          {/* Password Update */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Password Update
            </h2>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password (leave blank to keep unchanged)
              </label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full border-gray-300"
              />
            </div>
          </section>

          {/* Actions - Status controls based on current status */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Account Actions
            </h2>
            <div className="flex flex-wrap gap-2">
              {(user?.status === 'INACTIVE' || user?.status === 'LOCKED') && (
                <Button variant="secondary" onClick={handleActivate}>Activate User</Button>
              )}
              {(user?.status === 'ACTIVE' || user?.status === 'LOCKED') && (
                <Button variant="secondary" onClick={handleDeactivate}>Deactivate User</Button>
              )}
              {user?.status !== 'LOCKED' && (
                <Button variant="secondary" onClick={handleLock}>Lock User</Button>
              )}
              <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
            </div>
          </section>

          {/* Save changes */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}