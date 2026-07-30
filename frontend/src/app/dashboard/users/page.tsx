'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';

// User row component
const UserRow = ({ user, onActivate, onDeactivate, onLock, onUnlock, onDelete }: { user: any; onActivate: () => void; onDeactivate: () => void; onLock: () => void; onUnlock: () => void; onDelete: () => void }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'LOCKED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold mr-3">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-rounded-full px-2.5 py-.5 text-xs font-medium ${getStatusColor(user.status)}`}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{user.role?.name || 'No role'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-1">
        {user.status === 'INACTIVE' && <Button variant="secondary" size="xs" onClick={onActivate}>Activate</Button>}
        {user.status === 'ACTIVE' && <Button variant="secondary" size="xs" onClick={onDeactivate}>Deactivate</Button>}
        {user.status !== 'LOCKED' && <Button variant="secondary" size="xs" onClick={onLock}>Lock</Button>}
        {user.status === 'LOCKED' && <Button variant="secondary" size="xs" onClick={onUnlock}>Unlock</Button>}
        <Button variant="danger" size="xs" onClick={onDelete}>Delete</Button>
      </td>
    </tr>
  );
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);

  // Fetch users with filters
  const { data, isLoading, refetch } = useQuery(
    ['users', searchTerm, filterRole],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterRole) params.set('roleId', filterRole);
      const res = await api.get('/api/users', { params });
      return res.data;
    },
    { keepPreviousData: true }
  );

  const handleCreate = async () => {
    alert('Redirecting to create user page...');
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Users refreshed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Users</h2>
          <Button onClick={handleCreate}>Create User</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts and permissions</p>
        </div>
        <Button onClick={handleCreate}>Create User</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterRole || ''} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {/* Roles would be populated from API */}
          </SelectContent>
        </Select>
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
            {data?.data.map((user: any) => (
              <UserRow
                key={user.id}
                user={user}
                onActivate={() => toast('Activate user', { type: 'info' })}
                onDeactivate={() => toast('Deactivate user', { type: 'info' })}
                onLock={() => toast('Lock user', { type: 'info' })}
                onUnlock={() => toast('Unlock user', { type: 'info' })}
                onDelete={() => toast('Delete user', { type: 'warning' })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
