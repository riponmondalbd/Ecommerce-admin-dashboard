'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

const CategoryTreeItem = ({
  category,
  onDelete,
  maxDepth = 0,
}: {
  category: any;
  onDelete: (id: string, name: string) => void;
  maxDepth?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div style={{ marginLeft: maxDepth > 0 ? `${maxDepth * 24}px` : '0' }}>
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 group">
        <div className="flex items-center flex-1">
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : 'rotate-0'}`}
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {!hasChildren && <span className="w-5 mr-2" />}
          <span className="font-medium text-gray-900">{category.name}</span>
          <span className="ml-2 text-xs text-gray-400 font-mono">{category.slug}</span>
          {category.isActive === false && (
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Inactive</span>
          )}
        </div>
        <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/categories/create?parentId=${category.id}`}>
            <Button variant="outline" size="sm">Add Child</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => onDelete(category.id, category.name)}>Delete</Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1">
          {category.children.map((child: any) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              onDelete={onDelete}
              maxDepth={maxDepth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoriesPage() {
  const toast = useToast();
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
  const [responseData, setResponseData] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string | null; name: string } | null>(null);

  const { data: treeData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res = await api.get('/categories/tree');
      console.log('Full response:', res);
      setResponseData(res.data);
      // Handle both response formats
      const response = res.data;
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', {
        name: newCategory.name,
        slug: newCategory.slug || newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        isActive: true,
      });
      toast.success('Category created successfully!');
      setCreatingNew(false);
      setNewCategory({ name: '', slug: '' });
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleteDialog({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog?.id) return;
    try {
      await api.delete(`/categories/${deleteDialog.id}`);
      toast.success('Category deleted successfully!');
      setDeleteDialog(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Debug Info — only shown on error */}
      {isError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm font-medium text-red-700">API Error:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40 text-red-600">{String((error as any)?.response?.data?.message || error)}</pre>
          <p className="text-xs mt-1 text-red-500">
            Status: {(error as any)?.response?.status} — If you see 403, your role may be missing the <code>category:read</code> permission.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product categories and their hierarchy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Button onClick={() => setCreatingNew(true)}>Add Category</Button>
        </div>
      </div>

      {/* Create Category Modal */}
      {creatingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Category</h3>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    required
                    placeholder="e.g., Electronics"
                  />
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <Input
                    id="slug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                    placeholder="Auto-generated from name"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" type="button" onClick={() => setCreatingNew(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />

      {/* Category Tree View */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Category Hierarchy</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-500">Loading categories...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">Failed to load categories.</p>
            <p className="text-sm text-gray-500 mt-1">
              {(error as any)?.response?.status === 403
                ? 'You do not have permission to view categories (category:read).'
                : (error as any)?.response?.data?.message || String(error)}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm text-indigo-600 underline hover:text-indigo-800"
            >Try again</button>
          </div>
        ) : Array.isArray(treeData) && treeData.length > 0 ? (
          treeData.map((category: any) => (
            <CategoryTreeItem
              key={category.id}
              category={category}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No categories found. Click "Add Category" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
