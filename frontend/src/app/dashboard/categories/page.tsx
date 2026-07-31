'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
// Note: CategoryTreeItem is defined below as a local component

// Recursive component for rendering nested categories
const CategoryTreeItem = ({
  category,
  onEdit,
  onDelete,
  maxDepth = 0
}: {
  category: {
    id: string;
    name: string;
    slug: string;
    children?: Array<{ id: string; name: string; slug: string }>;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  maxDepth?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div style={{ marginLeft: `${maxDepth * 20}px` }}>
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 group">
        <div className="flex items-center flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <svg
            className={`w-4 h-4 mr-2 text-gray-400 transform transition-transform ${hasChildren ? (expanded ? 'rotate-90' : 'rotate(0)') : 'hidden'}`}
            fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
          <span className="font-medium text-gray-900">{category.name}</span>
          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{category.slug}</span>
        </div>
        <div className="space-x-2 hidden group-hover:flex">
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(category.id); }}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}>Delete</Button>
        </div>
      </div>

      {hasChildren && category.children && expanded && (
        <div className="mt-1 ml-4 border-l-2 border-gray-300 pl-4">
          {category.children.map(child => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              onEdit={onEdit}
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
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', parentId: '' });

  // Fetch categories - including the tree view endpoint
  const { data: treeData, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => api.get('/categories/tree').then(res => res.data)
  });

  // Also get flat list for create operation details
  const { data: listData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => api.get('/categories').then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">Categories</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', {
        name: newCategory.name,
        slug: newCategory.slug || newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        parentId: newCategory.parentId || null
      });
      toast.success('Category created successfully!');
      setCreatingNew(false);
      setNewCategory({ name: '', slug: '', parentId: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleEdit = (id: string) => {
    alert(`Editing category with ID: ${id}. In a real implementation, this would open an edit modal.`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this category?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product categories and their hierarchy</p>
        </div>
        <Button onClick={() => setCreatingNew(true)}>Add Category</Button>
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
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <Input
                    id="slug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                    placeholder="Auto-generated from name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
                  <select
                    id="parentId"
                    value={newCategory.parentId || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">No parent (top-level)</option>
                    {/* Parent categories would be populated from API */}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setCreatingNew(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Tree View */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Category Hierarchy</h3>
        {treeData?.data && treeData.data.length > 0 ? (
          treeData.data.map((category: { id: string; name: string; slug: string; children?: any[] }) => (
            <CategoryTreeItem
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-50">
            No categories found. Click "Add Category" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
