export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category?: {
    id: string;
    name: string;
  };
  categoryId?: string;
  brand?: {
    id: string;
    name: string;
  };
  brandId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku?: string;
  price?: number;
  inventory: number;
  weight?: number;
  dimensions?: Record<string, any>;
  attributeValues: ProductAttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeValue {
  id: string;
  productVariantId: string;
  attributeValueId: string;
  attributeValue?: {
    id: string;
    label: string;
    valueCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}
