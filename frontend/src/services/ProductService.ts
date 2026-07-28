import api from './api';

interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'all';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  categoryId: string;
  brandId: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  inventoryQuantity: number;
  createdAt: string;
  updatedAt: string;
  variantCount: number;
}

export interface ProductResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

class ProductService {
  // Get all products with pagination and filtering
  async list(params: ProductQueryParams = {}) {
    const response = await api.get<ProductResponse>('/products', { params });
    return response.data;
  }

  // Get product by ID with variants
  async get(id: string) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  }

  // Create a new product
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'variantCount'>) {
    const response = await api.post('/products', product);
    return response.data;
  }

  // Update a product
  async update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  }

  // Delete a product (only if no variants exist)
  async delete(id: string) {
    await api.delete(`/products/${id}`);
  }

  // List variants for a product
  async listVariants(productId: string) {
    const response = await api.get(`/products/${productId}/variants`);
    return response.data;
  }

  // Create a variant for a product
  async createVariant(productId: string, variant: {
    sku: string;
    price: number;
    inventory: number;
    attributeValueIds: string[];
  }) {
    const response = await api.post(`/products/${productId}/variants`, variant);
    return response.data;
  }

  // Sell a variant (deduct inventory)
  async sellVariant(variantId: string, quantity: number) {
    return await api.put(`/variants/${variantId}/sell`, { quantity });
  }

  // Restock a variant (add inventory)
  async restockVariant(variantId: string, quantity: number) {
    return await api.put(`/variants/${variantId}/restock`, { quantity });
  }
}

export default new ProductService();