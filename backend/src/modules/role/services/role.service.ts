import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import { ListRoleDto, CreateRoleDto, UpdateRoleDto, PartialUpdateRoleDto } from '../../../validation/schemas';

// Permissions that MUST be held by at least one role to prevent a lock-out
const CRITICAL_PERMISSIONS = [
  'role:delete',
  'role:update',
  'user:delete',
  'user:create',
  'permission:delete',
];

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

  // Extract permissions before creating role
  const { permissions: permissionKeys, description, ...roleData } = validated;

  // Create role with description
  const role = await prisma.role.create({
    data: {
      name: roleData.name,
      description: description || null,
    },
  });

  // Assign permissions if provided
  if (permissionKeys && permissionKeys.length > 0) {
    // Find permission IDs from keys
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true, key: true },
    });

    // Check if all requested permissions exist
    const foundKeys = permissions.map(p => p.key);
    const missingKeys = permissionKeys.filter((key: string) => !foundKeys.includes(key));
    if (missingKeys.length > 0) {
      throw new AppError(`Permissions not found: ${missingKeys.join(', ')}`, 404);
    }

    // Create role-permission assignments
    await prisma.rolePermission.createMany({
      data: permissions.map(p => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  // Return role with permissions
  return getRoleById(role.id);
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

  // Update role basic info
  await prisma.role.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description ?? null,
    },
  });

  // Update permissions if provided (full replacement)
  if (validated.permissions !== undefined) {
    // Remove all existing permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    // Assign new permissions if any
    if (validated.permissions.length > 0) {
      // Find permission IDs from keys
      const permissions = await prisma.permission.findMany({
        where: { key: { in: validated.permissions } },
        select: { id: true, key: true },
      });

      // Check if all requested permissions exist
      const foundKeys = permissions.map(p => p.key);
      const missingKeys = validated.permissions.filter((key: string) => !foundKeys.includes(key));
      if (missingKeys.length > 0) {
        throw new AppError(`Permissions not found: ${missingKeys.join(', ')}`, 404);
      }

      // Create role-permission assignments
      await prisma.rolePermission.createMany({
        data: permissions.map(p => ({ roleId: id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }

  return getRoleById(id);
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

  if (validated.description !== undefined) {
    updateData.description = validated.description;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.role.update({
      where: { id },
      data: updateData,
    });
  }

  return getRoleById(id);
};

/**
 * Delete a role with safety guards
 */
export const deleteRole = async (id: string, force: boolean = false) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new AppError('Role not found', 404);
  }

  // Safety guard 1: Check if role has any users assigned
  const userCount = await prisma.user.count({ where: { roleId: id } });
  if (userCount > 0 && !force) {
    throw new AppError(`Cannot delete role: ${role.name} has ${userCount} user(s) assigned. Use force=true to override.`, 400);
  }

  // Safety guard 2: Check if role has any permissions assigned
  const permissionCount = await prisma.rolePermission.count({ where: { roleId: id } });
  if (permissionCount > 0 && !force) {
    throw new AppError(`Cannot delete role: ${role.name} has ${permissionCount} permission(s) assigned. Use force=true to override.`, 400);
  }

  // Safety guard 3: Prevent deleting system roles (unless forced by super admin)
  if (role.isSystem && !force) {
    throw new AppError(`Cannot delete system role: ${role.name}. Use force=true to override.`, 400);
  }

  // If force=true, remove all permissions and users first
  if (force) {
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    // Note: Users with this role will need to be reassigned or handled separately
    // We don't delete users, just remove the role assignment
    // Find a default role (first non-system role) to assign users to
    const defaultRole = await prisma.role.findFirst({
      where: { isSystem: false, id: { not: id } },
      select: { id: true },
    });
    const defaultRoleId = defaultRole?.id || id; // fallback to same id if no other role exists
    await prisma.user.updateMany({
      where: { roleId: id },
      data: { roleId: defaultRoleId },
    });
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
 * Remove a permission from a role with safety guard.
 * Refuses to remove a permission if it would leave no role holding it.
 */
export const removePermissionFromRole = async (roleId: string, permissionId: string) => {
  const assignment = await prisma.rolePermission.findFirst({
    where: { roleId, permissionId },
  });

  if (!assignment) {
    throw new AppError('Permission not assigned to this role', 404);
  }

  // Fetch the permission key before deletion
  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
    select: { key: true },
  });
  if (!permission) {
    throw new AppError('Permission not found', 404);
  }

  // Safety guard: For critical permissions, ensure at least one other role retains it
  if (CRITICAL_PERMISSIONS.includes(permission.key)) {
    const remainingRoles = await prisma.rolePermission.count({
      where: {
        permissionId,
        roleId: { not: roleId },
      },
    });
    if (remainingRoles === 0) {
      throw new AppError(
        `Cannot revoke ${permission.key}: no other role would retain this permission. At least one role must keep it to prevent system lockout.`,
        400,
      );
    }
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
