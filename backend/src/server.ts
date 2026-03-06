import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import { env } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";

// Routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/products.routes";
import categoryRoutes from "./routes/categories.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/orders.routes";
import userRoutes from "./routes/users.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === "production",
  }),
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  }),
);

// ─── Stripe webhook must use raw body ──────────────────────────────────────
app.use("/api/orders/webhook", express.raw({ type: "application/json" }));

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }),
  );
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────
app.use("/api", generalLimiter);

// ─── Static Files (uploads) ─────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT);

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} (${env.NODE_ENV})`);
});

export { app };
