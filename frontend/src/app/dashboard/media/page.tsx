'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';

// Media grid item component
const MediaItem = ({ media, onDelete }: { media: any; onDelete: () => void }) => (
  <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow hover:shadow-md transition-shadow">
    {media.type === 'IMAGE' ? (
      <img src={media.publicUrl} alt={media.fileName} className="w-full h-48 object-cover" />
    ) : media.type === 'VIDEO' ? (
      <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <svg className="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    ) : (
      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-4xl">📄</span>
      </div>
    )}

    {/* Overlay with actions */}
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
        <Button variant="secondary" size="sm">View</Button>
        <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
      </div>
    </div>

    {/* Info below image */}
    <div className="p-3">
      <h3 className="text-sm font-medium truncate">{media.fileName}</h3>
      <p className="text-xs text-gray-500">{media.size.toLocaleString()} bytes</p>
      <span className={`inline-flex items-rounded-full px-2 py-.5 text-xs mt-1 ${
        media.status === 'READY' ? 'bg-green-100 text-green-800' :
        media.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {media.status}
      </span>
    </div>
  </div>
);

export default function MediaPage() {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');

  // Fetch media with filters
  const { data, isLoading, refetch } = useQuery(
    ['media', filterType, filterStatus],
    async () => {
      const params: URLSearchParams = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get('/api/media', { params });
      return res.data;
    },
    { keepPreviousData: true }
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    try {
      await api.delete(`/api/media/${id}`);
      toast.success('Media deleted successfully!');
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete media');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);

    try {
      await api.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Media uploaded successfully!');
      setShowUploadModal(false);
      setFile(null);
      setAltText('');
      await refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload media');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Media Library</h2>
          <Button onClick={() => setShowUploadModal(true)}>Upload Media</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading media...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product images, documents, and videos</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>Upload Media</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={filterType || ''} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="DOCUMENT">Document</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus || ''} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={refetch}>Refresh</Button>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {data?.data?.map((media: any) => (
          <MediaItem key={media.id} media={media} onDelete={() => handleDelete(media.id)} />
        ))}
      </div>

      {(!data?.data || data.data.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          No media found. Upload your first file above.
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload New Media</h3>
            <form onSubmit={handleUploadSubmit}>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1">Select File</span>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>
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
                <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                <Button type="submit">Upload</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
