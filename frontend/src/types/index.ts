// Combined type definitions for frontend-backend integration

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface RefreshRequest {
  refreshToken: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: Role;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
}

// DTOs for forms (matching backend validation)
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  roleId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  phone?: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  phone?: string;
}

interface PartialUpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  phone?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  weight?: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  sku: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  brand?: Brand;
  categories: Category[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

interface CreateProductDto {
  name: string;
  slug?: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  weight?: number;
  isActive: boolean;
  isFeatured: boolean;
  sku?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  brandId?: string;
  categoryId?: string;
  categoryIds: string[];
  mediaIds?: string[];
}

// Variant types
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  salePrice?: number;
  inventory: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  lowStockThreshold: number;
  weight?: number;
  dimensions?: Dimensions;
  isActive: boolean;
  attributeValues: AttributeValue[];
  mediaAttachments: MediaAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface CreateProductVariantDto {
  productId: string;
  sku?: string;
  price: number;
  salePrice?: number;
  inventory?: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: Dimensions;
  isActive?: boolean;
  attributeValueIds: string[];
  mediaIds?: string[];
}

// Dimension type
interface Dimensions {
  width: number;
  depth: number;
  height: number;
}

// Transaction types
export interface ProductTransaction {
  id: string;
  productId: string;
  variantId?: string;
  type: TransactionType;
  quantity: number;
  priceAtTime: number;
  notes: string;
  createdBy?: string;
  createdAt: string;
  product?: Product;
  variant?: ProductVariant;
}

export enum TransactionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  RESTOCK = 'RESTOCK',
  SELL = 'SELL',
}

// Category types (nested tree structure)
export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: CategoryNode | null;
  children?: CategoryNode[];
  level: number;
  createdAt: string;
  updatedAt: string;
}

// Alias for the tree node used in frontend
export type CategoryTreeItem = CategoryNode;
export type Category = CategoryNode;

interface CreateCategoryDto {
  name: string;
  slug?: string;
  parentId?: string | null;
}

interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

// Brand types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE';
  media?: Media; // logo
  createdAt: string;
  updatedAt: string;
}

interface CreateBrandDto {
  name: string;
  slug?: string;
  status: 'ACTIVE' | 'INACTIVE';
  mediaId?: string;
}

// Attribute types
export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: AttributeTypeEnum;
  attributeValues: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export enum AttributeTypeEnum {
  TEXT = 'TEXT',
  DROPDOWN = 'DROPDOWN',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  COLOR_SWATCH = 'COLOR_SWATCH',
  IMAGE_SWATCH = 'IMAGE_SWATCH',
}

export const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Text',
  DROPDOWN: 'Dropdown',
  RADIO: 'Radio',
  CHECKBOX: 'Checkbox',
  COLOR_SWATCH: 'Color',
  IMAGE_SWATCH: 'Image',
};

export const ATTRIBUTE_TYPE_BADGE_COLORS: Record<string, string> = {
  TEXT: 'bg-gray-100 text-gray-800',
  DROPDOWN: 'bg-blue-100 text-blue-800',
  RADIO: 'bg-green-100 text-green-800',
  CHECKBOX: 'bg-purple-100 text-purple-800',
  COLOR_SWATCH: 'bg-yellow-100 text-yellow-800',
  IMAGE_SWATCH: 'bg-pink-100 text-pink-800',
};

interface CreateAttributeDto {
  name: string;
  slug?: string;
  type: AttributeTypeEnum;
}

export interface AttributeValue {
  id: string;
  slug: string;
  label: string;
  referenceValue: string | null;
  sortOrder: number;
  attributeId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateAttributeValueDto {
  label: string;
  referenceValue?: string;
  sortOrder?: number;
}

// Media types
export interface Media {
  id: string;
  fileName: string;
  altText?: string;
  filePath: string;
  publicUrl: string;
  type: MediaType;
  size: number;
  status: 'PROCESSING' | 'READY' | 'ERROR';
  metadata?: any;
  uploadedBy: User;
  createdAt: string;
  updatedAt: string;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

interface MediaAttachment {
  id: string;
  mediaId: string;
  sortOrder: number;
  media: Media;
}

// Permission & Role types
export interface Permission {
  id: string;
  key: string; // e.g., "product:create"
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePermissionDto {
  key: string;
  description: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// Query parameters for list endpoints
interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
}

// Auth API response from /me endpoint
interface MeResponse {
  success: boolean;
  data: {
    user: User;
    permissions: string[];
  };
}

