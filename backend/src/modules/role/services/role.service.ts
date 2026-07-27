import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import { ListRoleDto, CreateRoleDto, UpdateRoleDto, PartialUpdateRoleDto } from '../../../validation/schemas';

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
 * Get all roles with optional filtering and pagination
 */
export const getRoles = async (input: unknown) => {
  const validated = validateInput(input, ListRoleDto);

  const where = {} as any;

  if (validated.search !== undefined && validated.search !== '') {
    where.name = {
      contains: validated.search,
      mode: 'insensitive',
    };
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      take: limit,
      skip,
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          select: {
            permission: { select: { key: true, name: true } },
          },
        },
        users: { select: { id: true, email: true } },
      },
    }),
    prisma.role.count({ where }),
  ]);

  return {
    data: roles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Get a single role by ID
 */
export const getRoleById = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { select: { permission: { select: { key: true, name: true } } } },
      users: { select: { id: true, email: true } },
    },
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  return role;
};

/**
 * Create a new role
 */
export const createRole = async (input: unknown) => {
  const validated = validateInput(input, CreateRoleDto);

  // Check if role name already exists
  const existing = await prisma.role.findUnique({ where: { name: validated.name } });
  if (existing) {
    throw new AppError('Role with this name already exists', 409);
  }

  const role = await prisma.role.create({
    data: { name: validated.name },
  });

  return role;
};

/**
 * Update an existing role (PUT - full replacement)
 */
export const updateRole = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdateRoleDto);

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new AppError('Role not found', 404);
  }

  // Check if new name conflicts with another role
  if (validated.name !== role.name) {
    const existing = await prisma.role.findUnique({ where: { name: validated.name } });
    if (existing) {
      throw new AppError('Role with this name already exists', 409);
    }
  }

  return await prisma.role.update({
    where: { id },
    data: { name: validated.name },
    include: { permissions: { select: { permission: { select: { key: true } } } } },
  });
};

/**
 * Partially update a role (PATCH)
 */
export const partialUpdateRole = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateRoleDto);

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new AppError('Role not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) {
    if (validated.name !== role.name) {
      const existing = await prisma.role.findUnique({ where: { name: validated.name } });
      if (existing) throw new AppError('Role with this name already exists', 409);
    }
    updateData.name = validated.name;
  }

  return await prisma.role.update({
    where: { id },
    data: updateData,
    include: { permissions: { select: { permission: { select: { key: true } } } } },
  });
};

/**
 * Delete a role with safety guards
 */
export const deleteRole = async (id: string) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new AppError('Role not found', 404);
  }

  // Safety guard 1: Check if role has any users assigned
  const userCount = await prisma.user.count({ where: { roleId: id } });
  if (userCount > 0) {
    throw new AppError(`Cannot delete role: ${role.name} has ${userCount} user(s) assigned`, 400);
  }

  // Safety guard 2: Check if role has any permissions assigned
  const permissionCount = await prisma.rolePermission.count({ where: { roleId: id } });
  if (permissionCount > 0) {
    throw new AppError(`Cannot delete role: ${role.name} has ${permissionCount} permission(s) assigned`, 400);
  }

  await prisma.role.delete({ where: { id } });
  return { success: true, message: 'Role deleted successfully' };
};

/**
 * Assign a permission to a role
 */
export const assignPermissionToRole = async (roleId: string, permissionId: string) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } });

  if (!role) throw new AppError('Role not found', 404);
  if (!permission) throw new AppError('Permission not found', 404);

  // Check if already assigned
  const existing = await prisma.rolePermission.findFirst({
    where: { roleId, permissionId },
  });

  if (existing) {
    throw new AppError('Permission already assigned to this role', 409);
  }

  return await prisma.rolePermission.create({ data: { roleId, permissionId } });
};

/**
 * Remove a permission from a role
 */
export const removePermissionFromRole = async (roleId: string, permissionId: string) => {
  const assignment = await prisma.rolePermission.findFirst({
    where: { roleId, permissionId },
  });

  if (!assignment) {
    throw new AppError('Permission not assigned to this role', 404);
  }

  await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  return { success: true, message: 'Permission removed from role' };
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
      roles: { some: { roleId } },
    },
    include: {
      roles: { select: { role: { select: { name: true } } } },
    },
  });

  return permissions;
};
