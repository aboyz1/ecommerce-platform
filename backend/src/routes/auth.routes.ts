import { Router } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { sendSuccess } from "../utils/response";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(
      /(?=.*[A-Z])(?=.*[0-9])/,
      "Password must contain uppercase and number",
    ),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string() });

const forgotSchema = z.object({ email: z.string().email() });

const resetSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(
      /(?=.*[A-Z])(?=.*[0-9])/,
      "Password must contain uppercase and number",
    ),
});

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, "Registration successful", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  },
);

router.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/logout",
  authenticate,
  validate(refreshSchema),
  async (req, res, next) => {
    try {
      await authService.logout(req.body.refreshToken);
      sendSuccess(res, null, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotSchema),
  async (req, res, next) => {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(
        res,
        null,
        "If that email exists, a reset link has been sent",
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/reset-password",
  authLimiter,
  validate(resetSchema),
  async (req, res, next) => {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, null, "Password reset successfully");
    } catch (err) {
      next(err);
    }
  },
);

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const { prisma } = await import("../config/database");
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

export default router;
