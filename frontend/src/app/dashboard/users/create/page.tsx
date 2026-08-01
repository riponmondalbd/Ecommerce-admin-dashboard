'use client';
import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import useToast from '@/components/ui/Toast';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function CreateUserPage() {
  const toast = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      status: 'ACTIVE',
      role: 'CATALOG_MANAGER',
    },
  });

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'];
  const validStatus = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'];

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    console.log('[CreateUser] Submitting:', data);
    setSubmitting(true);

    try {
      const response = await api.post('/users', data);
      toast.success('User created successfully!');
      router.push('/dashboard/users');
    } catch (error: any) {
      let errorMsg = 'Failed to create user';
      if (error.response?.data?.message) errorMsg = error.response.data.message;
      else if (error.response?.data?.errorMsg) errorMsg = error.response.data.errorMsg;
      else if (error.message) errorMsg = error.message;
      toast.error(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Create New User</h2>
          <p className="mt-2 text-sm text-gray-600">Add a new user to your admin team</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-lg shadow-sm bg-white py-6 px-4 sm:px-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
                  <Input id="name" type="text" required {...register('name')} className={`w-full ${errors.name ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                  <Input id="email" type="email" required {...register('email')} className={`w-full ${errors.email ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
              </div>

              <div className="pt-1 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
                    <Input id="password" type="password" required {...register('password')} className="w-full border-gray-300" />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role *</label>
                    <Controller name="role" control={control} render={({ field }) => (
                      <select
                        id="role"
                        name="role"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className={`w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="">Select a role</option>
                        {validRoles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    )} />
                    {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Initial Status *</label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <select
                      id="status"
                      name="status"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={`w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">Select status</option>
                      {validStatus.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )} />
                  {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    submitting ? 'bg-blue-400 not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}