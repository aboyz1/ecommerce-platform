import { Router } from "express";
import { prisma } from "../config/database";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { analyticsService } from "../services/analytics.service";
import { productService } from "../services/product.service";
import { sendSuccess, paginationMeta } from "../utils/response";

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard
router.get("/dashboard", async (_req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory
router.get("/inventory", async (_req, res, next) => {
  try {
    const inventory = await analyticsService.getInventoryStatus();
    sendSuccess(res, inventory);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/inventory/:productId
router.patch("/inventory/:productId", async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const inventory = await productService.updateStock(
      req.params.productId,
      quantity,
    );
    sendSuccess(res, inventory, "Stock updated");
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const page = parseInt((req.query.page as string) ?? "1");
    const limit = parseInt((req.query.limit as string) ?? "20");
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    sendSuccess(res, users, undefined, 200, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        phone: true,
        avatar: true,
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { payment: { select: { status: true } } },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    sendSuccess(res, user, "Role updated");
  } catch (err) {
    next(err);
  }
});

export default router;
