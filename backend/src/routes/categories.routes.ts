import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { sendSuccess } from "../utils/response";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

// GET /api/categories
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { children: true, parent: true },
    });
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories (admin)
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(categorySchema),
  async (req, res, next) => {
    try {
      const category = await prisma.category.create({ data: req.body });
      sendSuccess(res, category, "Category created", 201);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/categories/:id (admin)
router.patch("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id (admin)
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
});

export default router;
