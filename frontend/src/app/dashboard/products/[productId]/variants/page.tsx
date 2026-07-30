'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { ProductVariant } from '@/types';

// Modal component for restock action
const RestockModal = ({ variant, onClose, onRestock }) => {
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant.id || !quantity || parseInt(quantity) <= 0) return;

    try {
      await api.put(`/api/variants/${variant.id}/restock`, { quantity: parseInt(quantity) });
      toast.success(`Successfully restocked ${variant.sku} by ${quantity} units`);
      onRestock(); // Refresh data
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restock');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Restock Inventory</h3>
        <p className="mb-2 text-sm text-gray-600">Product: {variant.productName}</p>
        <p className="mb-2 text-sm text-gray-600">SKU: {variant.sku}</p>
        <p className="mb-2 text-sm text-gray-600">Current Inventory: {variant.inventory}</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to add</label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mb-4"
          />
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">Restock</Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal component for sell action
const SellModal = ({ variant, onClose, onSell }) => {
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant.id || !quantity || parseInt(quantity) <= 0) return;

    try {
      // Check if there's enough inventory first
      if (parseInt(quantity) > variant.inventory) {
        throw new Error('Insufficient inventory');
      }

      await api.put(`/api/variants/${variant.id}/sell`, { quantity: parseInt(quantity) });
      toast.success(`Successfully sold ${variant.sku}: ${quantity} units`);
      onSell(); // Refresh data
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sell item - check inventory');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Sell Inventory</h3>
        <p className="mb-2 text-sm text-gray-600">Product: {variant.productName}</p>
        <p className="mb-2 text-sm text-gray-600">SKU: {variant.sku}</p>
        <p className="mb-2 text-sm text-gray-600">Current Inventory: {variant.inventory}</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to sell</label>
          <Input
            type="number"
            min="1"
            max={variant.inventory}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mb-4"
          />
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1 danger">Sell</Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProductVariantsPage({ params }: { params: { productId: string } }) {
  const { productId } = params;
  const queryClient = useQueryClient();
  const [showRestockModal, setShowRestockModal] = useState<ProductVariant | null>(null);
  const [showSellModal, setShowSellModal] = useState<ProductVariant | null>(null);

  // Fetch variants for this product
  const { data: variantsData, isLoading, refetch } = useQuery(
    [`variants-${productId}`],
    async () => {
      const res = await api.get(`/api/products/${productId}/variants`);
      return res.data;
    },
    { enabled: !!productId }
  );

  // Handle refresh after mutation
  const handleRefresh = () => {
    refetch().then(() => {
      toast.info('Variants refreshed');
    });
  };

  if (!productId) {
    return <div className="p-8">Invalid product ID</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">Variants for Product</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading variants...</p>
        </div>
      </div>
    );
  }

  const variants = variantsData?.data || [];

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
          <p className="text-sm text-gray-500 mt-1">Manage product variants and inventory levels</p>
        </div>
        <Button onClick={handleRefresh}>Refresh</Button>
      </div>

      {/* Variants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variants.length === 0 ? (
              <tr>
                <td className="px-6 py-4 whitespace-center col-span-5 text-gray-500">No variants found. Create one below.</td>
              </tr>
            ) : (
              variants.map((variant: ProductVariant) => (
                <tr key={variant.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{variant.sku}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">${variant.price.toFixed(2)}</p>
                    {variant.salePrice && (
                      <p className="text-sm text-gray-500 line-through">$${variant.salePrice.toFixed(2)}</p>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${variant.inventory < variant.lowStockThreshold ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                    {variant.inventory} units
                    {variant.inventory < variant.lowStockThreshold && (
                      <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Low</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-rounded-full px-2.5 py-.5 text-xs font-medium ${
                      variant.stockStatus === 'IN_STOCK' ? 'bg-green-100 text-green-800' :
                      variant.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {variant.stockStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowRestockModal(variant)}>Restock</Button>
                    <Button variant="danger" size="sm" onClick={() => setShowSellModal(variant)}>Sell</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Restock Modal */}
      {showRestockModal && (
        <RestockModal
          variant={{ ...showRestockModal, productName: '-' }} // Mount component needs productName
          onClose={() => setShowRestockModal(null)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <SellModal
          variant={{ ...showSellModal, productName: '-' }}
          onClose={() => setShowSellModal(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
