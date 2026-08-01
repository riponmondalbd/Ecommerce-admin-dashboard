
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import api from '@/lib/axios-client';
import { Brand, CategoryNode, Media, Attribute, AttributeValue } from '@/types';

// ─── Validation schema ────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().optional(),
  sku: z.string().max(50).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  hasVariants: z.boolean(),
  price: z.number().min(0, 'Price must be non-negative'),
  salePrice: z.number().min(0).optional().nullable(),
  stock: z.number().min(0),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']).optional(),
  weight: z.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  brandId: z.string().optional(),
  categoryIds: z.array(z.string()),
  mediaIds: z.array(z.string()),
}).refine(
  (data) => data.salePrice === undefined || data.salePrice === null || data.salePrice <= data.price,
  { message: 'Sale price must not exceed price', path: ['salePrice'] }
);

type ProductFormValues = z.infer<typeof productSchema>;

// ─── Category multi-select ────────────────────────────────────────────────────

function CategoryMultiSelect({
  value, onChange, error,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => api.get('/categories/tree').then((r) => r.data?.data || r.data),
  });

  const categories = useMemo(() => {
    const list: CategoryNode[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any[]) || [];
    return list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categoriesData, search]);

  const selected = useMemo(
    () => categories.filter((c) => value.includes(c.id)),
    [categories, value]
  );

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between min-h-10.5"
        >
          <span className="truncate flex-1">
            {selected.length > 0
              ? selected.map((c) => c.name).join(', ')
              : 'Select categories…'}
          </span>
          <svg className="w-4 h-4 text-gray-400 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-hidden">
              <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400"
                />
              </div>
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
              ) : categories.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
              ) : (
                <ul className="py-1 overflow-y-auto max-h-56">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => toggle(cat.id)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 ${
                          value.includes(cat.id) ? 'bg-indigo-50 text-indigo-700' : ''
                        }`}
                        style={{ paddingLeft: `${cat.level * 16 + 12}px` }}
                      >
                        <span className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center shrink-0">
                          {value.includes(cat.id) && (
                            <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ─── Brand single-select ──────────────────────────────────────────────────────

function BrandSelect({
  value, onChange, error,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () =>
      api.get('/brands?limit=200').then((r) => {
        const resp = r.data?.data || r.data;
        return Array.isArray(resp) ? resp : resp?.data || [];
      }),
  });

  const brands: Brand[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  return (
    <div className="space-y-1">
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a brand (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No brand</SelectItem>
          {isLoading ? (
            <SelectItem value="_loading" disabled>Loading…</SelectItem>
          ) : (
            brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ─── Media library multi-select ───────────────────────────────────────────────

function MediaMultiSelect({
  value, onChange, error,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media-list'],
    queryFn: () =>
      api.get('/media?limit=200').then((r) => {
        const resp = r.data?.data || r.data;
        return Array.isArray(resp) ? resp : resp?.data || [];
      }),
  });

  const mediaList: Media[] = useMemo(
    () => (Array.isArray(mediaData) ? mediaData.filter((m) => m.status === 'READY') : []),
    [mediaData]
  );

  const selected = useMemo(
    () => mediaList.filter((m) => value.includes(m.id)),
    [mediaList, value]
  );

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 mb-2 block">Selected images</span>
          <div className="flex flex-wrap gap-2">
            {selected.map((m) => (
              <div key={m.id} className="relative group w-20 h-20">
                <img
                  src={m.publicUrl}
                  alt={m.fileName}
                  className="w-full h-full object-cover rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between min-h-10.5"
        >
          <span className="truncate flex-1">
            {selected.length > 0
              ? `${selected.length} image${selected.length > 1 ? 's' : ''} from library`
              : 'Select images from library…'}
          </span>
          <svg className="w-4 h-4 text-gray-400 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
              ) : mediaList.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No images in library. Upload some below or go to{' '}
                  <a href="/dashboard/media" className="text-indigo-600 hover:underline">Media Library</a>.
                </div>
              ) : (
                <ul className="p-2 overflow-y-auto max-h-64">
                  <li className="grid grid-cols-4 gap-2">
                    {mediaList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id)}
                        className={`relative rounded-md overflow-hidden border-2 transition-colors aspect-square ${
                          value.includes(m.id)
                            ? 'border-indigo-500 ring-2 ring-indigo-300'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={m.publicUrl}
                          alt={m.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {value.includes(m.id) && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] truncate px-1 py-0.5">
                          {m.fileName}
                        </span>
                      </button>
                    ))}
                  </li>
                </ul>
              )}
            </div>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">
        Upload images from your device below, or select from the library above.
      </p>
    </div>
  );
}

// ─── File upload zone (upload from device) ────────────────────────────────────

function ImageUploadZone({
  onUploaded,
  uploading,
}: {
  onUploaded: (mediaId: string, url: string) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', file.name);
      try {
        const res = await api.post('/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const media = res.data?.data;
        if (media?.id) {
          onUploaded(media.id, media.publicUrl || '');
        }
      } catch {
        // Silently fail
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload from Device
        <span className="ml-1 text-xs text-gray-400 font-normal">(JPG, PNG, GIF, WebP — max 10 MB each)</span>
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-gray-500">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">
              Click to upload or drag &amp; drop
            </p>
            <p className="text-xs text-gray-400">Images will be saved to your Media Library</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditProductPage() {
  const toast = useToast();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      status: 'PUBLISHED',
      sortOrder: 0,
      stock: 0,
      categoryIds: [],
      mediaIds: [],
      hasVariants: false,
    },
  });

  // Fetch product data on mount
  useEffect(() => {
    if (id) {
      api.get(`/products/${id}`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setProduct(data);
          // Map product data to form values
          setValue('name', data.name || '');
          setValue('slug', data.slug || '');
          setValue('sku', data.sku || '');
          setValue('shortDescription', data.shortDescription || '');
          setValue('description', data.description || '');
          setValue('hasVariants', data.hasVariants || false);
          setValue('price', data.price ?? 0);
          setValue('salePrice', data.salePrice);
          setValue('stock', data.stock ?? 0);
          setValue('stockStatus', data.stockStatus || undefined);
          setValue('weight', data.weight);
          setValue('isActive', data.isActive ?? true);
          setValue('isFeatured', data.isFeatured ?? false);
          setValue('sortOrder', data.sortOrder ?? 0);
          setValue('status', data.status || 'PUBLISHED');
          setValue('brandId', data.brandId || data.brand?.id || '');
          setValue('categoryIds', (data.categories || []).map((c: any) => c.id));
          setValue('mediaIds', (data.mediaAttachments || []).map((m: any) => m.mediaId));
        })
        .catch((err) => {
          console.error('Failed to fetch product:', err);
          toast.error('Failed to load product');
        })
        .finally(() => setLoading(false));
    }
  }, [id, setValue, toast]);

  const watchName = watch('name');
  const watchSlug = watch('slug');
  const watchPrice = watch('price');
  const hasVariants = watch('hasVariants');

  // Auto-generate slug from name
  useEffect(() => {
    if (watchName && !watchSlug) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [watchName, watchSlug, setValue]);

  // Auto-clear sale price if it exceeds price
  useEffect(() => {
    if (watchPrice !== undefined && watchPrice !== null) {
      const sp = watch('salePrice');
      if (sp !== undefined && sp !== null && sp > watchPrice) {
        setValue('salePrice', undefined);
      }
    }
  }, [watchPrice, watch('salePrice'), setValue, watch]);

  const handleUploaded = useCallback((mediaId: string, _url: string) => {
    const current = watch('mediaIds');
    const updated = [...new Set([...current, mediaId])];
    setValue('mediaIds', updated);
    toast.success('Image uploaded and added!');
  }, [watch, setValue, toast]);

  const onSubmit = async (data: any) => {
    if (!id) return;
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        sku: data.sku || undefined,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        hasVariants: data.hasVariants,
        price: data.price,
        salePrice: data.salePrice ?? undefined,
        stock: data.stock ?? 0,
        stockStatus: data.stockStatus || undefined,
        weight: data.weight ?? undefined,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder ?? 0,
        status: data.status,
        brandId: data.brandId || undefined,
        categories: data.categoryIds,
        mediaIds: data.mediaIds.length > 0 ? data.mediaIds : undefined,
      };
      await api.put(`/products/${id}`, payload);
      toast.success('Product updated successfully!');
      router.push('/dashboard/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading product…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600">Update product details below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ═══ Basic Information ═══ */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Premium Wireless Headphones"
                  className={`w-full ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                  <span className="ml-1 text-xs text-gray-400 font-normal">(auto-generated)</span>
                </label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="premium-wireless-headphones"
                  className={`w-full ${errors.slug ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="e.g., WH-1000XM5"
                  className="w-full border-gray-300"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watch('status')}
                  onValueChange={(v) => setValue('status', v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
              </div>

              {/* Short Description */}
              <div className="md:col-span-2">
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  id="shortDescription"
                  rows={2}
                  {...register('shortDescription')}
                  placeholder="A brief summary for listings and search results…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.shortDescription && <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>}
              </div>

              {/* Full Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description
                </label>
                <textarea
                  id="description"
                  rows={5}
                  {...register('description')}
                  placeholder="Detailed product description…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>
            </div>
          </section>

          {/* ═══ Pricing & Inventory ═══ */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Pricing &amp; Inventory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={`w-full pl-7 ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>

              {/* Sale Price */}
              <div>
                <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price
                  <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('salePrice', {
                      setValueAs: (v: any) =>
                        v === '' || v === null || v === undefined ? undefined : parseFloat(v),
                    })}
                    placeholder="0.00"
                    className="w-full pl-7 border-gray-300"
                  />
                </div>
                {errors.salePrice && <p className="mt-1 text-sm text-red-600">{errors.salePrice.message}</p>}
              </div>

              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                  <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Stock Status */}
              <div>
                <label htmlFor="stockStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status
                </label>
                <select
                  id="stockStatus"
                  value={watch('stockStatus') || ''}
                  onChange={(e) =>
                    setValue('stockStatus', (e.target.value || undefined) as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | undefined)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Auto (based on stock)</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
                {errors.stockStatus && <p className="mt-1 text-sm text-red-600">{errors.stockStatus.message}</p>}
              </div>

              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                  <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  min="0"
                  {...register('weight', {
                    setValueAs: (v: any) =>
                      v === '' || v === null || v === undefined ? undefined : parseFloat(v),
                  })}
                  placeholder="0.000"
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </section>

          {/* ═══ Features ═══ */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Active</span>
                    <p className="text-xs text-gray-500 mt-0.5 ml-14">Visible to customers</p>
                  </div>
                </label>
              </div>

              {/* Featured toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" {...register('isFeatured')} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-amber-500 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                    <p className="text-xs text-gray-500 mt-0.5 ml-14">Show on homepage</p>
                  </div>
                </label>
              </div>

              {/* Has Variants toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" {...register('hasVariants')} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Has Variants</span>
                    <p className="text-xs text-gray-500 mt-0.5 ml-14">Product has size/color options</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                {...register('sortOrder', { valueAsNumber: true })}
                className="w-full max-w-xs border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in listings</p>
            </div>
          </section>

          {/* ═══ Associations ═══ */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Associations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand */}
              <div>
                <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <BrandSelect
                  value={watch('brandId')}
                  onChange={(v) => setValue('brandId', v)}
                  error={errors.brandId?.message}
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories
                  <span className="ml-1 text-xs text-gray-400 font-normal">(select one or more)</span>
                </label>
                <CategoryMultiSelect
                  value={watch('categoryIds')}
                  onChange={(ids) => setValue('categoryIds', ids)}
                  error={errors.categoryIds?.message}
                />
              </div>
            </div>
          </section>

          {/* ═══ Product Images ═══ */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Product Images
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Upload from device */}
              <div>
                <ImageUploadZone onUploaded={handleUploaded} uploading={saving} />
              </div>

              {/* Right: Select from library */}
              <div>
                <MediaMultiSelect
                  value={watch('mediaIds')}
                  onChange={(ids) => setValue('mediaIds', ids)}
                  error={errors.mediaIds?.message}
                />
              </div>
            </div>
          </section>

          {/* ═══ Actions ═══ */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button variant="secondary" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Update Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
