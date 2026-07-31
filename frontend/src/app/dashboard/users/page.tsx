'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';

const UserRow = ({ user, onStatusChange }: { user: any; onStatusChange: () => void }) => {
  const toast = useToast();

  const handleAction = async (action: string) => {
    try {
      await api.put(`/users/${user.id}/${action}`);
      toast.success(`User ${action}d successfully!`);
      onStatusChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deleted successfully!');
      onStatusChange();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-600';
      case 'LOCKED': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold mr-3">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{user.role?.name || 'No role'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-1">
          {user.status === 'INACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => handleAction('activate')}>Activate</Button>
          )}
          {user.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => handleAction('deactivate')}>Deactivate</Button>
          )}
          {user.status !== 'LOCKED' && (
            <Button variant="secondary" size="sm" onClick={() => handleAction('lock')}>Lock</Button>
          )}
          {user.status === 'LOCKED' && (
            <Button variant="secondary" size="sm" onClick={() => handleAction('unlock')}>Unlock</Button>
          )}
          <Link href={`/dashboard/users/${user.id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
        </div>
      </td>
    </tr>
  );
};

export default function UsersPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', searchTerm, filterRole, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchTerm) params.set('search', searchTerm);
      if (filterRole) params.set('roleId', filterRole);
      const res = await api.get('/users', { params });
      return res.data.data;
    },
  });

  // Fetch roles for filter dropdown
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles?limit=100').then(r => r.data.data),
  });

  const totalItems = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT) || 1;

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Link href="/dashboard/users/create">
            <Button>Create User</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={filterRole || ''}
          onChange={(e) => setFilterRole(e.target.value || null)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          {rolesData?.data?.map((role: any) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading users...</p>
              </td></tr>
            ) : (Array.isArray(data?.data) ? data.data : []).length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
            ) : (
              (Array.isArray(data?.data) ? data.data : []).map((user: any) => (
                <UserRow key={user.id} user={user} onStatusChange={() => refetch()} />
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
