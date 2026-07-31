'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

// Role row component
const RoleRow = ({ role, onRefresh }: { role: any; onRefresh: () => void }) => (
  <tr className="border-t hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="font-medium text-gray-900">{role.name}</span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="text-sm text-gray-500">{role.permissionsCount} permission{role.permissionsCount !== 1 ? 's' : ''}</span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(role.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Button variant="secondary" size="sm">Edit Permissions</Button>
    </td>
  </tr>
);

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch roles
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['roles', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const res = await api.get('/roles', { params });
      return res.data;
    },
  });

  const handleCreate = async () => {
    alert('Redirecting to create role page...');
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Roles refreshed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Roles</h2>
          <Button onClick={handleCreate}>Create Role</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
          <p className="text-sm text-gray-500 mt-1">Define roles and assign permissions to users</p>
        </div>
        <Button onClick={handleCreate}>Create Role</Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data.map((role: any) => (
              <RoleRow key={role.id} role={role} onRefresh={handleRefresh} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
