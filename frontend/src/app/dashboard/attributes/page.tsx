'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';

// Attribute row component
const AttributeRow = ({ attribute, onRefresh }: { attribute: any; onRefresh: () => void }) => {
  const typeLabels: Record<string, string> = {
    TEXT: 'Text',
    SELECT: 'Select',
    COLOR: 'Color',
    IMAGE: 'Image',
  };

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-medium text-gray-900">{attribute.name}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-rounded-full px-2.5 py-.5 text-xs font-medium ${
          attribute.type === 'COLOR' ? 'bg-blue-100 text-blue-800' :
          attribute.type === 'IMAGE' ? 'bg-purple-100 text-purple-800' :
          attribute.type === 'SELECT' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {typeLabels[attribute.type] || attribute.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {attribute.valuesCount} value{attribute.valuesCount !== 1 ? 's' : ''}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(attribute.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Button variant="secondary" size="sm">Edit</Button>
      </td>
    </tr>
  );
};

export default function AttributesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  // Fetch attributes with filtering
  const { data, isLoading, refetch } = useQuery(
    ['attributes', searchTerm, filterType],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterType) params.set('type', filterType);
      const res = await api.get('/api/attributes', { params });
      return res.data;
    },
    { keepPreviousData: true }
  );

  const handleCreate = async () => {
    alert('Redirecting to create attribute page...');
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Attributes refreshed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Attributes</h2>
          <Button onClick={handleCreate}>Create Attribute</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading attributes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attributes</h2>
          <p className="text-sm text-gray-500 mt-1">Define product attributes like Color, Size, Material, etc.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRefresh}>Refresh</Button>
          <Button onClick={handleCreate}>Create Attribute</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterType || ''} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="SELECT">Select</SelectItem>
            <SelectItem value="COLOR">Color</SelectItem>
            <SelectItem value="IMAGE">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data.map((attr: any) => (
              <AttributeRow key={attr.id} attribute={attr} onRefresh={handleRefresh} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
