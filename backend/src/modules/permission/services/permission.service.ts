import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import {
  ListPermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  PartialUpdatePermissionDto,
} from '../../../validation/schemas';

// Validate the input against Zod schemas
const validateInput = <T>(input: unknown, schema: z.Schema<T>): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join(', ');
    throw new AppError(`Validation failed: ${issues}`, 400);
  }
  return parsed.data;
};

/**
 * Get all permissions with optional filtering and pagination
 */
export const getPermissions = async (input: unknown) => {
  const validated = validateInput(input, ListPermissionDto);

  const where = {} as any;

  if (validated.group !== undefined) {
    where.group = validated.group;
  }

  if (validated.isActive !== undefined) {
    where.isActive = validated.isActive;
  }

  if (validated.search !== undefined && validated.search !== '') {
    where.OR = [
      { name: { contains: validated.search, mode: 'insensitive' } },
      { key: { contains: validated.search, mode: 'insensitive' } },
    ];
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  // Build orderBy
  const orderBy: any = {};
  if (validated.sort) {
    orderBy[validated.sort] = validated.order || 'asc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      take: limit,
      skip,
      orderBy,
      include: {
        roles: {
          select: {
            role: {
              select: { name: true }
            }
          }
        }
      }
    }),
    prisma.permission.count({ where })
  ]);

  return {
    data: permissions,
    pagination: {
      page: page,
      limit: limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

/**
 * Get a single permission by ID
 */
export const getPermissionById = async (id: string) => {
  const permission = await prisma.permission.findUnique({
    where: { id },
    include: {
      roles: {
        select: {
          role: {
            select: { name: true }
          }
        }
      }
    }
  });

  if (!permission) {
    throw new AppError('Permission not found', 404);
  }

  return permission;
};

/**
 * Create a new permission
 */
export const createPermission = async (input: unknown) => {
  const validated = validateInput(input, CreatePermissionDto);

  // Check if permission key already exists
  const existing = await prisma.permission.findUnique({
    where: { key: validated.key },
  });

  if (existing) {
    throw new AppError('Permission with this key already exists', 409);
  }

  const permission = await prisma.permission.create({
    data: {
      key: validated.key,
      name: validated.name,
      description: validated.description,
      group: validated.group,
      isActive: validated.isActive ?? true,
    },
    include: { roles: { select: { role: { select: { name: true } } } } }
  });

  return permission;
};

/**
 * Update an existing permission
 */
export const updatePermission = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdatePermissionDto);

  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) {
    throw new AppError('Permission not found', 404);
  }

  // Check if new key conflicts with another permission
  if (validated.key && validated.key !== permission.key) {
    const existing = await prisma.permission.findUnique({ where: { key: validated.key } });
    if (existing) {
      throw new AppError('Permission with this key already exists', 409);
    }
  }

  return await prisma.permission.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description,
      group: validated.group,
      isActive: validated.isActive,
    },
    include: { roles: { select: { role: { select: { name: true } } } } }
  });
};

/**
 * Partially update a permission (PATCH)
 */
export const partialUpdatePermission = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdatePermissionDto);

  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) {
    throw new AppError('Permission not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.group !== undefined) updateData.group = validated.group;
  if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

  // Check key conflict only if key is provided and changing
  if (validated.key && validated.key !== permission.key) {
    const existing = await prisma.permission.findUnique({ where: { key: validated.key } });
    if (existing) {
      throw new AppError('Permission with this key already exists', 409);
    }
    updateData.key = validated.key;
  } else if (validated.key && validated.key === permission.key) {
    // Keep the original key if same value
    updateData.key = validated.key;
  }

  return await prisma.permission.update({
    where: { id },
    data: updateData,
    include: { roles: { select: { role: { select: { name: true } } } } }
  });
};

/**
 * Delete a permission
 */
export const deletePermission = async (id: string) => {
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) {
    throw new AppError('Permission not found', 404);
  }

  // Check if permission is assigned to any roles
  const assignments = await prisma.rolePermission.count({
    where: { permissionId: id }
  });

  if (assignments > 0) {
    throw new AppError('Cannot delete permission: it is assigned to one or more roles', 400);
  }

  await prisma.permission.delete({ where: { id } });
  return { success: true, message: 'Permission deleted successfully' };
};

/**
 * Get all permissions assigned to a role
 */
export const getPermissionsByRole = async (roleId: string) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new AppError('Role not found', 404);
  }

  const permissions = await prisma.permission.findMany({
    where: {
      roles: {
        some: { roleId }
      }
    },
    include: {
      roles: {
        select: { role: { select: { name: true } } }
      }
    }
  });

  return permissions;
};

/**
 * Assign a permission to a role
 */
export const assignPermissionToRole = async (roleId: string, permissionId: string) => {
  const [role, permission] = await Promise.all([
    prisma.role.findUnique({ where: { id: roleId } }),
    prisma.permission.findUnique({ where: { id: permissionId } })
  ]);

  if (!role) throw new AppError('Role not found', 404);
  if (!permission) throw new AppError('Permission not found', 404);

  // Check if already assigned
  const existing = await prisma.rolePermission.findMany({
    where: { roleId, permissionId },
    take: 1
  }).then(r => r[0]);

  if (existing) {
    throw new AppError('Permission already assigned to this role', 409);
  }

  return await prisma.rolePermission.create({
    data: { roleId, permissionId }
  });
};

/**
 * Remove a permission from a role
 */
export const removePermissionFromRole = async (roleId: string, permissionId: string) => {
  const assignment = await prisma.rolePermission.findMany({
    where: { roleId, permissionId },
    take: 1
  }).then(r => r[0]);

  if (!assignment) {
    throw new AppError('Permission not assigned to this role', 404);
  }

  await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  return { success: true, message: 'Permission removed from role' };
};

/**
 * Get permissions needed for a user based on their role
 */
export const getUserPermissions = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              permission: {
                select: { key: true, name: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Extract permission keys from role permissions relationship
  const permissions = user.role.permissions.map(rp => ({
    key: rp.permission.key,
    name: rp.permission.name,
  }));

  return permissions;
};

/**
 * Check if a user has a specific permission
 */
export const checkPermission = async (userId: string, requiredPermission: string) => {
  const userPermissions = await getUserPermissions(userId);
  const hasPermission = userPermissions.some(p => p.key === requiredPermission);

  return hasPermission;
};

/**
 * Middleware to enforce permission requirement
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const hasPermission = await checkPermission(req.userId, requiredPermission);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};