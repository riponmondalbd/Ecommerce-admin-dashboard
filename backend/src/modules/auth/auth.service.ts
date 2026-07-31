import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';
import { LoginInput } from './dtos/login.dto';
import { RegisterInput } from './dtos/register.dto';

export class AuthService {
  /**
   * Register is intentionally disabled — accounts are created through the User module only.
   * The assignment explicitly states: "No public sign-up. Accounts are created through the User module."
   */
  async register(_input: RegisterInput) {
    throw new AppError('Public registration is not allowed. Contact an administrator to create an account.', 403);
  }

  async login(input: LoginInput, req?: any) {
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

    const refreshTokenObj = await this.getOrCreateRefreshToken(user, req);
    const rotated = await this.rotateRefreshToken(user.id, refreshTokenObj.id, req);

    return { accessToken, refreshToken: rotated.token };
  }

  private async getOrCreateRefreshToken(user: any, req?: any) {
    const tokenRec = await prisma.refreshToken.findFirst({
      where: { userId: user.id, revoked: false },
    });
    if (tokenRec) return tokenRec;

    const userAgent = req?.headers['user-agent'] || '';
    const ipAddress = req?.ip || req?.socket?.remoteAddress || '';
    const tok = require('crypto').randomBytes(64).toString('hex');
    const exp = new Date();
    exp.setDate(exp.getDate() + parseInt(env.jwtRefreshExpiresIn));
    return prisma.refreshToken.create({
      data: { token: tok, userId: user.id, expiresAt: exp, userAgent, ipAddress },
    });
  }

  private async rotateRefreshToken(userId: string, tokenId: string, req?: any) {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true, revokedAt: new Date() },
    });

    const userAgent = req?.headers['user-agent'] || '';
    const ipAddress = req?.ip || req?.socket?.remoteAddress || '';
    const tok = require('crypto').randomBytes(64).toString('hex');
    const exp = new Date();
    exp.setDate(exp.getDate() + parseInt(env.jwtRefreshExpiresIn));
    return prisma.refreshToken.create({
      data: { token: tok, userId, expiresAt: exp, userAgent, ipAddress },
    });
  }

  async refreshToken(refreshToken: string, req?: any) {
    const db = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });
    if (!db || db.revoked || db.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401);
    if (db.user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    const accessToken = jwt.sign(
      { userId: db.user.id, email: db.user.email, role: db.user.role.name },
      env.jwtAccessSecret,
      { expiresIn: env.jwtAccessExpiresIn } as SignOptions
    );

    const rotated = await this.rotateRefreshToken(db.userId, db.id, req);
    return { accessToken, refreshToken: rotated.token };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
    return { success: true };
  }

  getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }
}

export const authService = new AuthService();
