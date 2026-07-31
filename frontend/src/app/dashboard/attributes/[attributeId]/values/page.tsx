'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

// Attribute value row component
const AttributeValueRow = ({ value, onDelete }: { value: any; onDelete: () => void }) => (
  <tr className="border-t hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      {value.type === 'COLOR' && (
        <div className="w-6 h-6 rounded border" style={{ backgroundColor: value.referenceValue }} />
      )}
      {value.type === 'IMAGE' ? (
        <img src={value.referenceValue} alt={value.label} className="w-12 h-12 object-cover rounded" />
      ) : (
        <span className="font-medium text-gray-900">{value.label}</span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="text-sm text-gray-500">{value.referenceValue}</span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Button variant="secondary" size="sm">Edit</Button>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
    </td>
  </tr>
);

export default function AttributeValuesPage({ params }: { params: { attributeId: string } }) {
  const { attributeId } = params;
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch attribute values
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attribute-values', attributeId],
    queryFn: async () => {
      if (!attributeId) throw new Error('Missing attribute ID');
      const res = await api.get(`/api/attributes/${attributeId}/values`);
      return res.data;
    },
  });

  const handleCreate = async () => {
    alert(`Redirecting to create attribute value for attribute ${attributeId}...`);
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Values refreshed');
  };

  if (!attributeId) {
    return <div className="p-8">Invalid attribute ID</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">Attribute Values</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading values...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attribute Values</h2>
          <p className="text-sm text-gray-500 mt-1">Manage available values for this attribute</p>
        </div>
        <Button onClick={handleCreate}>Add Value</Button>
      </div>

      {/* Search filter could go here */}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label / Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data?.map((value: any) => (
              <AttributeValueRow key={value.id} value={value} onDelete={() => toast.info('Deleted')} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
