'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

const PermissionRow = ({ permission }: { permission: any }) => {
  const toast = useToast();
  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm font-medium text-gray-900">{permission.key}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{permission.name}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          permission.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {permission.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  );
};

export default function PermissionsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['permissions', searchTerm, groupFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchTerm) params.set('search', searchTerm);
      if (groupFilter) params.set('group', groupFilter);
      const res = await api.get('/permissions', { params });
      // Handle both response formats - unwrap API wrapper { success: true, data: {...} }
      const response = res.data?.data || res.data;
      return Array.isArray(response) ? { data: response, pagination: { total: response.length, pages: 1 } } : response;
    },
  });

  // Extract permissions list safely
  const permissionList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  // Extract unique groups from the data
  const groups = permissionList.reduce((acc: string[], perm: any) => {
    if (perm.group && !acc.includes(perm.group)) acc.push(perm.group);
    return acc;
  }, [] as string[]);

  const totalItems = data?.pagination?.total || permissionList.length || 0;
  const totalPages = data?.pagination?.pages || Math.ceil(totalItems / LIMIT) || 1;

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">System capabilities and access controls</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Input
          placeholder="Search by key or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Groups</option>
          {groups.map((g: string) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading permissions...</p>
              </td></tr>
            ) : permissionList.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No permissions found</td></tr>
            ) : (
              permissionList.map((perm: any) => (
                <PermissionRow key={perm.id} permission={perm} />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages} ({totalItems} total)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
