import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const generalLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW),
  max: parseInt(env.RATE_LIMIT_MAX),
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: "Too many upload requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
