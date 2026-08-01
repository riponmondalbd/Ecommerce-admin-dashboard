import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useParams } from 'next/navigation';

const RestockModal = ({ variant, onClose, onRestock }: { variant: any; onClose: () => void; onRestock: () => void }) => {
  const toast = useToast();
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant.id || !quantity || parseInt(quantity) <= 0) return;
    try {
      await api.put(`/variants/${variant.id}/restock`, { quantity: parseInt(quantity) });
      toast.success(`Restocked ${variant.sku} by ${quantity} units`);
      onRestock();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restock');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Restock Inventory</h3>
        <p className="text-sm text-gray-600 mb-2">SKU: {variant.sku}</p>
        <p className="text-sm text-gray-600 mb-4">Current Inventory: {variant.inventory}</p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to add</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Restock</Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SellModal = ({ variant, onClose, onSell }: { variant: any; onClose: () => void; onSell: () => void }) => {
  const toast = useToast();
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant.id || !quantity || parseInt(quantity) <= 0) return;
    if (parseInt(quantity) > variant.inventory) {
      toast.error('Insufficient inventory');
      return;
    }
    try {
      await api.put(`/variants/${variant.id}/sell`, { quantity: parseInt(quantity) });
      toast.success(`Sold ${quantity} units of ${variant.sku}`);
      onSell();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sell item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Sell Inventory</h3>
        <p className="text-sm text-gray-600 mb-2">SKU: {variant.sku}</p>
        <p className="text-sm text-gray-600 mb-4">Current Inventory: {variant.inventory}</p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to sell</label>
          <input
            type="number"
            min="1"
            max={variant.inventory}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white">Sell</Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProductVariantsPage() {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const { id: productId } = params;
  const [showRestockModal, setShowRestockModal] = useState<any>(null);
  const [showSellModal, setShowSellModal] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['variants', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/variants`);
      return res.data;
    },
    enabled: !!productId,
  });

  const [deleteVariant, setDeleteVariant] = useState<string | null>(null);

  const handleDeleteVariant = async (id: string) => {
    setDeleteVariant(id);
  };

  const confirmDelete = async () => {
    if (!deleteVariant) return;
    try {
      await api.delete(`/variants/${deleteVariant}`);
      toast.success('Variant deleted!');
      setDeleteVariant(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete variant');
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
          <p className="text-sm text-gray-500 mt-1">Manage product variants and inventory levels</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Button variant="outline">Back to Product</Button>
          </Link>
          <Link href={`/dashboard/products/${productId}/variants/create`}>
            <Button>Create Variant</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-500">Loading variants...</p>
        </div>
      ) : (
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
              {(!data?.data || data.data.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No variants found. Create one above.
                  </td>
                </tr>
              ) : (
                data.data.map((variant: any) => (
                  <tr key={variant.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">{variant.sku}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">${Number(variant.price).toFixed(2)}</p>
                      {variant.salePrice && (
                        <p className="text-sm text-gray-500 line-through">${Number(variant.salePrice).toFixed(2)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className={variant.inventory < variant.lowStockThreshold ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {variant.inventory} units
                      </p>
                      {variant.inventory < variant.lowStockThreshold && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Low</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {variant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm" onClick={() => setShowRestockModal(variant)}>Restock</Button>
                        <Button variant="destructive" size="sm" onClick={() => setShowSellModal(variant)}>Sell</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteVariant(variant.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showRestockModal && (
        <RestockModal
          variant={showRestockModal}
          onClose={() => setShowRestockModal(null)}
          onRestock={() => refetch()}
        />
      )}
      {showSellModal && (
        <SellModal
          variant={showSellModal}
          onClose={() => setShowSellModal(null)}
          onSell={() => refetch()}
        />
      )}

      {/* Delete Variant Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteVariant}
        title="Delete Variant"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteVariant(null)}
      />
    </div>
  );
}
