'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuthStore } from '@/store/authStore';

const RoleRow = ({ role }: { role: any }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  // Handle both cases: role might be a string or an object with name property
  const userRole = user?.role?.name || user?.role;
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      // Add force=true query param for SUPER_ADMIN
      const url = isSuperAdmin ? `/roles/${role.id}?force=true` : `/roles/${role.id}`;
      await api.delete(url);
      toast.success('Role deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  // Don't allow deleting system roles (unless SUPER_ADMIN with force)
  const isSystemRole = role.isSystem && !isSuperAdmin;

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <p className="font-medium text-gray-900">{role.name}</p>
          {role.isActive === false && (
            <span className="text-xs text-gray-500">Inactive</span>
          )}
          {role.isSystem && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">System</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{role.users?.length || 0} user(s)</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{role.permissions?.length || 0} permission(s)</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/roles/${role.id}/edit`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          {!isSystemRole && (
            <>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                Delete
              </Button>
              <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Role"
                message={`Are you sure you want to delete "${role.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
              />
            </>
          )}
          {isSystemRole && (
            <Button variant="destructive" size="sm" disabled title="System roles cannot be deleted">
              Delete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default function RolesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['roles', searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchTerm) params.set('search', searchTerm);
      const res = await api.get('/roles', { params });
      // Handle both response formats - unwrap API wrapper { success: true, data: {...} }
      const response = res.data?.data || res.data;
      return Array.isArray(response) ? { data: response, pagination: { total: response.length, pages: 1 } } : response;
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  // Extract roles list safely
  const roleList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  const totalItems = data?.pagination?.total || roleList.length || 0;
  const totalPages = data?.pagination?.pages || Math.ceil(totalItems / LIMIT) || 1;

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
          <p className="text-sm text-gray-500 mt-1">Define roles and assign permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRefresh}>Refresh</Button>
          <Link href="/dashboard/roles/create">
            <Button>Create Role</Button>
          </Link>
        </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading roles...</p>
              </td></tr>
            ) : roleList.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No roles found</td></tr>
            ) : (
              roleList.map((role: any) => (
                <RoleRow key={role.id} role={role} />
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
