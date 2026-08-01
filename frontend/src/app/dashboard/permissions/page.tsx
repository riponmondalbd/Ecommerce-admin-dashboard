'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import ConfirmDialog from '@/components/ConfirmDialog';
import Link from 'next/link';

interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  group: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: Array<{ role: { name: string } }>;
}

const PermissionRow = ({ permission, onEdit, onDelete }: { permission: Permission; onEdit: (p: Permission) => void; onDelete: (p: Permission) => void }) => {
  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm font-medium text-gray-900">{permission.key}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{permission.name}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-xs text-gray-400 font-mono">{permission.group}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          permission.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {permission.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(permission.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/permissions/${permission.id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => onDelete(permission)}>Delete</Button>
        </div>
      </td>
    </tr>
  );
};

export default function PermissionsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [sortField, setSortField] = useState<'key' | 'name' | 'group' | 'isActive' | 'createdAt'>('key');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<Permission | null>(null);
  const LIMIT = 10;

  // Fetch permissions
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['permissions', searchTerm, groupFilter, sortField, sortOrder, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sort: sortField,
        order: sortOrder
      });
      if (searchTerm) params.set('search', searchTerm);
      if (groupFilter) params.set('group', groupFilter);
      const res = await api.get('/permissions', { params });
      const response = res.data?.data || res.data;
      return Array.isArray(response) ? { data: response, pagination: { total: response.length, pages: 1 } } : response;
    },
  });

  // Extract permissions list safely
  const permissionList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  // Extract unique groups from the data
  const groups = permissionList.reduce((acc: string[], perm: Permission) => {
    if (perm.group && !acc.includes(perm.group)) acc.push(perm.group);
    return acc;
  }, [] as string[]);

  const totalItems = data?.pagination?.total || permissionList.length || 0;
  const totalPages = data?.pagination?.pages || Math.ceil(totalItems / LIMIT) || 1;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/permissions/${id}`);
    },
    onSuccess: () => {
      toast.success('Permission deleted successfully!');
      setDeleteDialog(null);
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete permission');
    },
  });

  // Handle delete
  const handleDelete = (permission: Permission) => {
    setDeleteDialog(permission);
  };

  const confirmDelete = () => {
    if (deleteDialog) {
      deleteMutation.mutate(deleteDialog.id);
    }
  };

  // Handle sorting
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort indicator
  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return (
      <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Reset to first page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleGroupChange = useCallback((value: string) => {
    setGroupFilter(value);
    setPage(1);
  }, []);

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">System capabilities and access controls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Link href="/dashboard/permissions/create">
            <Button>Create Permission</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Input
          placeholder="Search by key or name..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={groupFilter}
          onChange={(e) => handleGroupChange(e.target.value)}
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
              {[
                { key: 'key' as const, label: 'Permission Key' },
                { key: 'name' as const, label: 'Name' },
                { key: 'group' as const, label: 'Group' },
                { key: 'isActive' as const, label: 'Status' },
                { key: 'createdAt' as const, label: 'Created' },
                { key: 'actions' as const, label: 'Actions' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => key !== 'actions' && handleSort(key as typeof sortField)}
                >
                  <div className="flex items-center">
                    {label}
                    {key !== 'actions' && <SortIcon field={key as typeof sortField} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                  <p>Loading permissions...</p>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                  <p>Failed to load permissions: {(error as any)?.response?.data?.message || String(error)}</p>
                  <button onClick={() => refetch()} className="mt-2 text-sm text-indigo-600 underline">Retry</button>
                </td>
              </tr>
            ) : permissionList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No permissions found</td>
              </tr>
            ) : (
              permissionList.map((perm: Permission) => (
                <PermissionRow
                  key={perm.id}
                  permission={perm}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        title="Delete Permission"
        message={`Are you sure you want to delete "${deleteDialog?.name}" (${deleteDialog?.key})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </div>
  );
}