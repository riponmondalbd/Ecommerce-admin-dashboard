'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

// Permission row component
const PermissionRow = ({ permission }: { permission: any }) => (
  <tr className="border-t hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="font-medium text-gray-900">{permission.key}</span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
      {permission.description}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(permission.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap space-x-2">
      <Button variant="secondary" size="sm">Edit</Button>
      <Button variant="danger" size="sm">Delete</Button>
    </td>
  </tr>
);

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch permissions
  const { data, isLoading, refetch } = useQuery(
    ['permissions', searchTerm],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const res = await api.get('/api/permissions', { params });
      return res.data;
    },
    { keepPreviousData: true }
  );

  const handleCreate = async () => {
    alert('Redirecting to create permission page...');
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Permissions refreshed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Permissions</h2>
          <Button onClick={handleCreate}>Create Permission</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Define granular access controls for the system</p>
        </div>
        <Button onClick={handleCreate}>Create Permission</Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by key or description..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data.map((perm: any) => (
              <PermissionRow key={perm.id} permission={perm} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
