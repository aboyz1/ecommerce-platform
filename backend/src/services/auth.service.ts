import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { emailService } from "./email.service";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const rounds = parseInt(env.BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, rounds);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        cart: { create: {} },
        wishlist: { create: {} },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch(() => {});

    return { user, ...tokens };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, role: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Clean up expired token
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new AppError("Invalid or expired refresh token", 401);
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.role);
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return;

    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store as refresh token with special prefix for reset
    await prisma.refreshToken.create({
      data: {
        token: `reset_${resetToken}`,
        userId: user.id,
        expiresAt: expires,
      },
    });

    await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: `reset_${token}` },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const rounds = parseInt(env.BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
  }

  private async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
