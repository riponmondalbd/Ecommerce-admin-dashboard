import api from './api';

interface Brand {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  mediaId?: string;
}

class BrandService {
  // Get all brands
  async list() {
    const response = await api.get('/brands');
    return response.data;
  }

  // Get a brand by ID
  async getById(id: string) {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  }

  // Create a brand
  async create(name: string, mediaId?: string) {
    const response = await api.post('/brands', { name, mediaId });
    return response.data;
  }

  // Update a brand
  async update(id: string, data: Partial<Omit<Brand, 'id'>>) {
    const response = await api.put(`/brands/${id}`, data);
    return response.data;
  }

  // Delete a brand
  async delete(id: string) {
    await api.delete(`/brands/${id}`);
  }
}

export default new BrandService();