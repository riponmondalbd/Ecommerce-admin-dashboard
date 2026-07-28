import api from './api';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

class CategoryService {
  // Get all categories as a tree
  async list() {
    const response = await api.get('/categories/tree');
    return response.data;
  }

  // Get a category by ID with ancestors
  async getById(id: string) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  }

  // Get ancestors of a category
  async getAncestors(id: string) {
    const response = await api.get(`/categories/${id}/ancestors`);
    return response.data;
  }
}

export default new CategoryService();