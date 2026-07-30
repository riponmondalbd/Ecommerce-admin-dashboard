import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import bcrypt from 'bcrypt';
import { ListUserDto, CreateUserDto, UpdateUserDto, PartialUpdateUserDto } from '../../../validation/schemas';

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
 * Get all users with optional filtering and pagination
 */
export const getUsers = async (input: unknown) => {
  const validated = validateInput(input, ListUserDto);

  const where = {} as any;

  if (validated.search !== undefined && validated.search !== '') {
    where.OR = [
      { name: { contains: validated.search, mode: 'insensitive' } },
      { email: { contains: validated.search, mode: 'insensitive' } },
    ];
  }

  if (validated.roleId !== undefined) {
    where.roleId = validated.roleId;
  }

  if (validated.status !== undefined) {
    where.status = validated.status;
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        role: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
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
 * Get a single user by ID
 */
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: { select: { name: true } } },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Create a new user with password hashing and role assignment
 */
export const createUser = async (input: unknown, _requestingUserId?: string) => {
  const validated = validateInput(input, CreateUserDto);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(validated.password, 10);

  const roleName = validated.role || 'CATALOG_MANAGER';

  // Find or create the role
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({ data: { name: roleName } });
  }

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      password: hashedPassword,
      roleId: role.id,
      status: validated.status || 'ACTIVE',
    },
    include: { role: { select: { name: true } } },
  });

  return user;
};

/**
 * Update an existing user (PUT - full replacement)
 */
export const updateUser = async (id: string, input: unknown, requestingUserId?: string) => {
  const validated = validateInput(input, UpdateUserDto);

  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check for email conflict if email is being changed
  if (validated.email !== user.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
  }

  // Self-escalation prevention: A user cannot upgrade their own role
  if (requestingUserId && requestingUserId === id) {
    const roleOrder: Record<string, number> = {
      VIEWER: 0,
      SUPPORT_AGENT: 1,
      CATALOG_MANAGER: 2,
      ADMIN: 3,
      SUPER_ADMIN: 4,
    };

    const newRoleName = validated.role;
    const currentRoleName = user.role?.name;

    if (newRoleName && currentRoleName && roleOrder[newRoleName] !== undefined && roleOrder[currentRoleName] !== undefined) {
      if (roleOrder[newRoleName]! >= roleOrder[currentRoleName]!) {
        throw new AppError('Self-role escalation is not permitted', 403);
      }
    }
  }

  // Update the user (password only if provided)
  const updateData: any = {
    email: validated.email,
    name: validated.name,
    phone: validated.phone,
    roleId: validated.role,
    status: validated.status,
  };

  if (validated.password !== undefined) {
    updateData.password = await bcrypt.hash(validated.password, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: { select: { name: true } } },
  });
};

/**
 * Partially update a user (PATCH)
 */
export const partialUpdateUser = async (id: string, input: unknown, requestingUserId?: string) => {
  const validated = validateInput(input, PartialUpdateUserDto);

  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) {
    updateData.name = validated.name;
  }

  if (validated.phone !== undefined) {
    updateData.phone = validated.phone;
  }

  if (validated.email !== undefined && validated.email !== user.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
    updateData.email = validated.email;
  }

  if (validated.status !== undefined && validated.status !== user.status) {
    updateData.status = validated.status;
  }

  if (validated.password !== undefined) {
    updateData.password = await bcrypt.hash(validated.password, 10);
  }

  if (validated.role !== undefined && validated.role !== user.roleId) {
    // Self-escalation prevention
    if (requestingUserId && requestingUserId === id) {
      const roleOrder: Record<string, number> = {
        VIEWER: 0,
        SUPPORT_AGENT: 1,
        CATALOG_MANAGER: 2,
        ADMIN: 3,
        SUPER_ADMIN: 4,
      };

      const newRoleName = validated.role;
      const currentRoleName = user.role?.name;

      if (newRoleName && currentRoleName && roleOrder[newRoleName] !== undefined && roleOrder[currentRoleName] !== undefined) {
        if (roleOrder[newRoleName]! >= roleOrder[currentRoleName]!) {
          throw new AppError('Self-role escalation is not permitted', 403);
        }
      }
    }
    updateData.roleId = validated.role;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields to update', 400);
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: { select: { name: true } } },
  });
};

/**
 * Delete a user with safety guards
 */
export const deleteUser = async (id: string, _requestingUserId?: string) => {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Safety guard: Cannot delete the last super admin
  if (user.role?.name === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: { name: 'SUPER_ADMIN' } },
    });
    if (superAdminCount <= 1) {
      throw new AppError('Cannot delete the last super administrator', 400);
    }
  }

  await prisma.user.delete({ where: { id } });
  return { success: true, message: 'User deleted successfully' };
};

/**
 * Activate a user account
 */
export const activateUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.status === 'ACTIVE') {
    throw new AppError('User is already active', 400);
  }

  return await prisma.user.update({
    where: { id },
    data: { status: 'ACTIVE' },
    include: { role: { select: { name: true } } },
  });
};

/**
 * Deactivate a user account
 */
export const deactivateUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('User is not active', 400);
  }

  return await prisma.user.update({
    where: { id },
    data: { status: 'INACTIVE' },
    include: { role: { select: { name: true } } },
  });
};

/**
 * Lock a user account
 */
export const lockUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.status === 'LOCKED') {
    throw new AppError('User is already locked', 400);
  }

  return await prisma.user.update({
    where: { id },
    data: { status: 'LOCKED' },
    include: { role: { select: { name: true } } },
  });
};

/**
 * Unlock a user account
 */
export const unlockUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.status !== 'LOCKED') {
    throw new AppError('User is not locked', 400);
  }

  return await prisma.user.update({
    where: { id },
    data: { status: 'ACTIVE' },
    include: { role: { select: { name: true } } },
  });
};

/**
 * Get all users assigned to a specific role
 */
export const getUsersByRole = async (roleId: string) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new AppError('Role not found', 404);
  }

  const users = await prisma.user.findMany({
    where: { roleId },
    include: { role: { select: { name: true } } },
  });

  return users;
};
