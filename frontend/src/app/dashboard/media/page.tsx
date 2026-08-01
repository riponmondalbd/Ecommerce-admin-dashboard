'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import ConfirmDialog from '@/components/ConfirmDialog';
import Link from 'next/link';

import { Media } from '@/types';

const MediaItem = ({ media, onDelete }: { media: Media; onDelete: () => void }) => {
  const isImage = media.type === 'IMAGE';
  const isVideo = media.type === 'VIDEO';
  const isDocument = media.type === 'DOCUMENT';

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Main content based on type */}
      {isImage ? (
        <img
          src={`/uploads/${media.fileName}`}
          alt={media.altText || media.fileName}
          className="w-full h-48 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : isVideo ? (
        <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg className="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      ) : (
        <div className="w-full h-48 flex flex-col items-center justify-center p-4 bg-gray-50">
          {isDocument ? (
            <svg className="w-16 h-16 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          ) : (
            <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4v-5a2 2 0 012-2h4a2 2 0 012 2v5a4 4 0 01-4 4zM17 7a2.004 2.004 0 01-1.714-1.91l-1.864-8A1.38 1.38 0 0012 1.5H4.5A2.5 2.5 0 002 4v11c0 .55.45 1 1 1h3"/>
            </svg>
          )}
          <span className="text-xs text-center font-medium text-gray-700 truncate">{media.fileName}</span>
        </div>
      )}

      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
          <Button variant="secondary" size="sm" onClick={() => window.open(`/uploads/${media.fileName}`, '_blank')}>View</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
        </div>
      </div>

      {/* Info below item */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={media.fileName}>{media.fileName}</h3>
        <p className="text-xs text-gray-500">{media.size.toLocaleString()} bytes</p>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs mt-1 ${
          media.status === 'READY' ? 'bg-green-100 text-green-800' :
          media.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
          media.status === 'ERROR' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {media.status}
        </span>
      </div>
    </div>
  );
};

export default function MediaPage() {
  const toast = useToast();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 12;
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['media', filterType, filterStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get('/media', { params });
      const response = res.data?.data || res.data;
      return Array.isArray(response) ? { data: response, pagination: { total: response.length, pages: 1 } } : response;
    },
  });

  const mediaList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const totalItems = data?.pagination?.total || mediaList.length || 0;
  const totalPages = data?.pagination?.pages || Math.ceil(totalItems / LIMIT) || 1;

  const handleDelete = async (id: string) => {
    setDeleteMediaId(id);
  };

  const confirmDelete = async () => {
    if (!deleteMediaId) return;
    try {
      await api.delete(`/media/${deleteMediaId}`);
      toast.success('Media deleted successfully!');
      setDeleteMediaId(null);
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete media');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);

    try {
      await api.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Media uploaded successfully!');
      setShowUploadModal(false);
      setFile(null);
      setAltText('');
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product images, documents, and videos</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>Upload Media</Button>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || null)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
          <option value="DOCUMENT">Document</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="READY">Ready</option>
          <option value="PROCESSING">Processing</option>
          <option value="ERROR">Error</option>
        </select>
        <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-500">Loading media...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No media found. Upload your first file above.
          </div>
        ) : (
          mediaList.map((media: Media) => (
            <MediaItem key={media.id} media={media} onDelete={() => handleDelete(media.id)} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages} ({totalItems} items)
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

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload New Media</h3>
            <form onSubmit={handleUploadSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                  <input
                    type="file"
                    accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="altText" className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text (optional)
                  </label>
                  <Input
                    id="altText"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Description for accessibility"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" type="button" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteMediaId}
        title="Delete Media"
        message="Are you sure you want to delete this media? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteMediaId(null)}
      />
    </div>
  );
}