import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';
import { LoginInput } from './dtos/login.dto';
import { RegisterInput } from './dtos/register.dto';

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) throw new AppError('Email already registered', 409);

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const roleName = input.role as string;
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) role = await prisma.role.create({ data: { name: roleName } });

    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        roleId: role.id,
      },
    });
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } });
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);
    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      env.jwtAccessSecret,
      { expiresIn: env.jwtAccessExpiresIn } as SignOptions
    );

    const refreshTokenObj = await this.getOrCreateRefreshToken(user);
    const rotated = await this.rotateRefreshToken(user.id, refreshTokenObj.id);

    return { accessToken, refreshToken: rotated.token };
  }

  private async getOrCreateRefreshToken(user: any) {
    const tokenRec = await prisma.refreshToken.findFirst({
      where: { userId: user.id, revoked: false },
    });
    if (tokenRec) return tokenRec;

    const tok = require('crypto').randomBytes(64).toString('hex');
    const exp = new Date();
    exp.setDate(exp.getDate() + parseInt(env.jwtRefreshExpiresIn));
    return prisma.refreshToken.create({
      data: { token: tok, userId: user.id, expiresAt: exp, userAgent: '', ipAddress: '' },
    });
  }

  private async rotateRefreshToken(userId: string, tokenId: string) {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true, revokedAt: new Date() },
    });

    const tok = require('crypto').randomBytes(64).toString('hex');
    const exp = new Date();
    exp.setDate(exp.getDate() + parseInt(env.jwtRefreshExpiresIn));
    return prisma.refreshToken.create({
      data: { token: tok, userId, expiresAt: exp, userAgent: '', ipAddress: '' },
    });
  }

  async refreshToken(refreshToken: string) {
    const db = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });
    if (!db || db.revoked || db.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401);

    const accessToken = jwt.sign(
      { userId: db.user.id, email: db.user.email, role: db.user.role.name },
      env.jwtAccessSecret,
      { expiresIn: env.jwtAccessExpiresIn } as SignOptions
    );

    await this.rotateRefreshToken(db.userId, db.id);
    return { accessToken };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
    return { success: true };
  }

  getUserById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  }
}

export const authService = new AuthService();