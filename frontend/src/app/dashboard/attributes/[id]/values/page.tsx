'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AttributeValuesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const { id: attributeId } = params;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newValue, setNewValue] = useState({ label: '', referenceValue: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attribute-values', attributeId],
    queryFn: async () => {
      if (!attributeId) throw new Error('Missing attribute ID');
      const res = await api.get(`/attributes/${attributeId}/values`);
      return res.data;
    },
    enabled: !!attributeId,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeId || !newValue.label) return;
    try {
      await api.post(`/attributes/${attributeId}/values`, {
        label: newValue.label,
        referenceValue: newValue.referenceValue,
      });
      toast.success('Attribute value created!');
      setShowCreateModal(false);
      setNewValue({ label: '', referenceValue: '' });
      await queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create attribute value');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attribute value?')) return;
    try {
      await api.delete(`/attribute-values/${id}`);
      toast.success('Attribute value deleted!');
      await queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete attribute value');
    }
  };

  if (!attributeId) {
    return <div className="p-8"><p className="text-red-600">Invalid attribute ID</p></div>;
  }

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attribute Values</h2>
          <p className="text-sm text-gray-500 mt-1">Manage available values for this attribute</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/attributes">
            <Button variant="outline">Back</Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>Add Value</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-500">Loading values...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label / Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data?.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No values yet. Add one above.</td></tr>
              ) : (
                data?.data?.map((value: any) => (
                  <tr key={value.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {value.referenceValue?.startsWith('#') ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: value.referenceValue }}
                          />
                          <span className="font-medium text-gray-900">{value.label}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">{value.label}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {value.referenceValue || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(value.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(value.id)}>Delete</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Value Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Attribute Value</h3>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                  <Input
                    value={newValue.label}
                    onChange={(e) => setNewValue({...newValue, label: e.target.value})}
                    placeholder="e.g., Red, Blue, Small"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Value</label>
                  <Input
                    value={newValue.referenceValue}
                    onChange={(e) => setNewValue({...newValue, referenceValue: e.target.value})}
                    placeholder="e.g., #FF0000 for colors, S/L/XL for sizes"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit">Add Value</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
