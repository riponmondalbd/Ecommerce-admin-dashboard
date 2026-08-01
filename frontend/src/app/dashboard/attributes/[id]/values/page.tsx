'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useParams } from 'next/navigation';
import { AttributeValue, ATTRIBUTE_TYPE_LABELS, ATTRIBUTE_TYPE_BADGE_COLORS } from '@/types';

export default function AttributeValuesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const { id: attributeId } = params;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<AttributeValue | null>(null);
  const [newValue, setNewValue] = useState({ label: '', referenceValue: '' });
  const [editValue, setEditValue] = useState({ label: '', referenceValue: '' });
  const [deleteValue, setDeleteValue] = useState<string | null>(null);
  const [deleteValueLabel, setDeleteValueLabel] = useState<string>('');

  const { data: attributeData, isLoading: loadingAttr, error: attrError } = useQuery({
    queryKey: ['attribute', attributeId],
    queryFn: async () => {
      if (!attributeId) throw new Error('Missing attribute ID');
      const res = await api.get(`/attributes/${attributeId}`);
      return res.data.data;
    },
    enabled: !!attributeId,
  });

  const { data: valuesData, isLoading: loadingValues, refetch } = useQuery({
    queryKey: ['attribute-values', attributeId],
    queryFn: async () => {
      if (!attributeId) throw new Error('Missing attribute ID');
      const res = await api.get(`/attributes/${attributeId}/values`);
      return res.data.data;
    },
    enabled: !!attributeId,
  });

  const attribute = attributeData;
  const values = Array.isArray(valuesData) ? valuesData : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeId || !newValue.label.trim()) return;
    try {
      await api.post(`/attributes/${attributeId}/values`, {
        label: newValue.label.trim(),
        referenceValue: newValue.referenceValue || undefined,
      });
      toast.success('Attribute value created!');
      setShowCreateModal(false);
      setNewValue({ label: '', referenceValue: '' });
      await queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] });
      await queryClient.invalidateQueries({ queryKey: ['attribute', attributeId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create attribute value');
    }
  };

  const handleEdit = (value: AttributeValue) => {
    setEditValue({ label: value.label, referenceValue: value.referenceValue || '' });
    setShowEditModal(value);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || !editValue.label.trim()) return;
    try {
      await api.put(`/attribute-values/${showEditModal.id}`, {
        label: editValue.label.trim(),
        referenceValue: editValue.referenceValue || undefined,
      });
      toast.success('Attribute value updated!');
      setShowEditModal(null);
      await queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] });
      await queryClient.invalidateQueries({ queryKey: ['attribute', attributeId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update attribute value');
    }
  };

  const handleDelete = (value: AttributeValue) => {
    setDeleteValue(value.id);
    setDeleteValueLabel(value.label);
  };

  const confirmDelete = async () => {
    if (!deleteValue) return;
    try {
      await api.delete(`/attribute-values/${deleteValue}`);
      toast.success('Attribute value deleted!');
      setDeleteValue(null);
      setDeleteValueLabel('');
      await queryClient.invalidateQueries({ queryKey: ['attribute-values', attributeId] });
      await queryClient.invalidateQueries({ queryKey: ['attribute', attributeId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete attribute value');
    }
  };

  const isColorType = attribute?.type === 'COLOR_SWATCH';
  const isImageType = attribute?.type === 'IMAGE_SWATCH';

  if (!attributeId) {
    return (
      <div className="p-8 min-h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Invalid attribute ID</p>
          <Link href="/dashboard/attributes" className="text-sm text-red-600 hover:underline mt-2 inline-block">
            &larr; Back to Attributes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/attributes" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              &larr; Attributes
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {loadingAttr ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">{attribute?.name}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  ATTRIBUTE_TYPE_BADGE_COLORS[attribute?.type] || 'bg-gray-100 text-gray-800'
                }`}>
                  {ATTRIBUTE_TYPE_LABELS[attribute?.type] || attribute?.type}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage available values for this attribute</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/attributes">
            <Button variant="outline">Back to List</Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>Add Value</Button>
        </div>
      </div>

      {/* Loading state */}
      {loadingAttr || loadingValues ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500">Loading attribute values...</p>
        </div>
      ) : attrError || (valuesData as any)?.message ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium mb-1">Failed to load attribute values</p>
          <p className="text-sm text-red-500">
            {(valuesData as any)?.message || attrError?.message || 'Unknown error'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Values ({values.length})</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isColorType && 'Reference values are color names. Use hex codes (e.g., #FF0000) for better previews.'}
                {!isColorType && !isImageType && 'Reference values are internal codes.'}
              </p>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label / Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {values.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">No values yet</p>
                    <p className="text-sm text-gray-500 mb-4">Add your first value to get started.</p>
                    <Button size="sm" onClick={() => setShowCreateModal(true)}>Add Value</Button>
                  </td>
                </tr>
              ) : (
                values.map((value: AttributeValue) => (
                  <tr key={value.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {isColorType && value.referenceValue && (
                          <div
                            className="w-8 h-8 rounded-md border border-gray-200 shadow-sm shrink-0"
                            style={{ backgroundColor: value.referenceValue.startsWith('#') ? value.referenceValue : value.referenceValue }}
                            title={value.referenceValue}
                          />
                        )}
                        {isImageType && (
                          <div className="w-8 h-8 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {!isColorType && !isImageType && (
                          <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-indigo-600">{value.label.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{value.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 font-mono">{value.slug}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-mono ${value.referenceValue ? 'text-gray-700' : 'text-gray-400'}`}>
                        {value.referenceValue || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{value.sortOrder}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(value.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(value)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(value)}
                        >
                          Delete
                        </Button>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Attribute Value</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Adding to <span className="font-medium text-gray-700">{attribute?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newValue.label}
                    onChange={(e) => setNewValue({ ...newValue, label: e.target.value })}
                    placeholder={isColorType ? 'e.g., Red, Blue, Emerald' : 'e.g., Small, Medium, Large'}
                    required
                    autoFocus
                  />
                  {isColorType && (
                    <p className="mt-1 text-xs text-gray-500">
                      For color attributes, use a color name. In the Reference Value field, enter the hex code.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Value
                  </label>
                  <Input
                    value={newValue.referenceValue}
                    onChange={(e) => setNewValue({ ...newValue, referenceValue: e.target.value })}
                    placeholder={
                      isColorType
                        ? 'e.g., #FF0000'
                        : isImageType
                        ? 'e.g., https://example.com/image.jpg'
                        : 'e.g., #FF0000, S, XL'
                    }
                  />
                  {isColorType && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a hex color code (e.g., <code className="bg-gray-100 px-1 rounded">#FF0000</code>)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Value</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Value Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Attribute Value</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Updating <span className="font-medium text-gray-700">{showEditModal.label}</span>
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editValue.label}
                    onChange={(e) => setEditValue({ ...editValue, label: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Value
                  </label>
                  <Input
                    value={editValue.referenceValue}
                    onChange={(e) => setEditValue({ ...editValue, referenceValue: e.target.value })}
                    placeholder="e.g., #FF0000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowEditModal(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteValue}
        title="Delete Attribute Value"
        message={`Are you sure you want to delete "${deleteValueLabel}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteValue(null); setDeleteValueLabel(''); }}
      />
    </div>
  );
}
