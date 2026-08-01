'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';
import ConfirmDialog from '@/components/ConfirmDialog';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage() {
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<{ id: string | null; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (id) {
      api.get(`/users/${id}`)
        .then(res => {
          const userData = res.data?.data || res.data;
          setUser(userData);
          reset({
            name: userData.name || '',
            email: userData.email || '',
            password: '',
            role: userData.role?.name || '',
            status: userData.status || 'ACTIVE',
          });
        })
        .catch(err => console.error('Failed to fetch user:', err))
        .finally(() => setLoading(false));
    }
  }, [id, reset]);

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'];
  const validStatus = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'];

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      if (!user?.id) return;

      const updateData: any = {
        name: data.name,
        email: data.email,
      };

      if (data.password) updateData.password = data.password;
      if (data.role) updateData.role = data.role;

      updateData.status = data.status;

      console.log('[UpdateUser] Sending:', updateData);
      const response = await api.put(`/users/${user.id}`, updateData);
      console.log('[UpdateUser] Success:', response.data);
      toast.success('User updated successfully!');
      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('[UpdateUser] Error:', error);
      let errorMsg = 'Failed to update user';
      if (error.response?.data?.message) errorMsg = error.response.data.message;
      else if (error.response?.data?.errorMsg) errorMsg = error.response.data.errorMsg;
      else if (error.message) errorMsg = error.message;
      else errorMsg = 'Unknown error occurred';

      toast.error(errorMsg);
      alert('Update failed: ' + errorMsg);
    }
  };

  const handleActivate = async () => {
    try { await api.put(`/users/${id}/activate`); toast.success('User activated!'); window.location.reload(); }
    catch (err) { toast.error('Failed to activate user'); }
  };

  const handleDeactivate = async () => {
    try { await api.put(`/users/${id}/deactivate`); toast.success('User deactivated!'); window.location.reload(); }
    catch (err) { toast.error('Failed to deactivate user'); }
  };

  const handleLock = async () => {
    try { await api.put(`/users/${id}/lock`); toast.success('User locked!'); window.location.reload(); }
    catch (err) { toast.error('Failed to lock user'); }
  };

  const handleUnlock = async () => {
    try { await api.put(`/users/${id}/unlock`); toast.success('User unlocked!'); window.location.reload(); }
    catch (err) { toast.error('Failed to unlock user'); }
  };

  const handleDelete = async () => { if (!user) return; setDeleteUser({ id: user.id, name: user.name }); };

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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="mt-4 text-gray-500">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Edit User</h1>
          <p className="mt-2 text-sm text-gray-600">Update user details and permissions</p>
        </div>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input id="name" type="text" {...register('name')} className={`w-full ${errors.name ? 'border-red-300' : 'border-gray-300'}`} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input id="email" type="email" {...register('email')} readOnly className="w-full bg-gray-100 border-gray-300" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Role Assignment</h2>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Assign Role (leave empty to keep current)</label>
              <Controller name="role" control={control} render={({ field }) => (
                <select
                  id="role"
                  name="role"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={`w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${errors.role ? 'border-red-300' : ''}`}
                >
                  <option value="">Keep current role</option>
                  {validRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              )} />
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Changing your own role may be restricted by self-escalation prevention.</p>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Password Update</h2>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep unchanged)</label>
              <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="w-full border-gray-300" />
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Account Status</h2>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Controller name="status" control={control} render={({ field }) => (
                <select
                  id="status"
                  name="status"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={`w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${errors.status ? 'border-red-300' : ''}`}
                >
                  <option value="">No change</option>
                  {validStatus.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )} />
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
            <div className="flex flex-wrap gap-2">
              {(user?.status === 'INACTIVE' || user?.status === 'LOCKED') && (
                <Button variant="secondary" size="sm" onClick={handleActivate}>Activate User</Button>
              )}
              {(user?.status === 'ACTIVE' || user?.status === 'LOCKED') && (
                <Button variant="secondary" size="sm" onClick={handleDeactivate}>Deactivate User</Button>
              )}
              {user?.status !== 'LOCKED' && (
                <Button variant="secondary" size="sm" onClick={handleLock}>Lock User</Button>
              )}
              {user?.status === 'LOCKED' && (
                <Button variant="secondary" size="sm" onClick={handleUnlock}>Unlock User</Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDelete}>Delete User</Button>
            </div>
          </section>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="secondary" size="sm" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" size="sm">Save Changes</Button>
          </div>
        </form>
      </div>

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