import { Router } from "express";
import { z } from "zod";
import { productService } from "../services/product.service";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { sendSuccess, paginationMeta } from "../utils/response";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";

const router = Router();

const listQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(parseInt(v ?? "20"), 100)),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  minRating: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  isFeatured: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined,
    ),
  sort: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  basePrice: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  sku: z.string().min(1),
  isFeatured: z.boolean().optional(),
  weight: z.number().positive().optional(),
  stock: z.number().int().min(0),
});

// GET /api/products
router.get("/", validate(listQuerySchema, "query"), async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query as unknown as z.infer<
      typeof listQuerySchema
    >;
    const { products, total } = await productService.list({
      page,
      limit,
      ...filters,
    });
    sendSuccess(
      res,
      products,
      undefined,
      200,
      paginationMeta(total, page, limit),
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured
router.get("/featured", async (_req, res, next) => {
  try {
    const products = await productService.getFeatured();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const product = await productService.getBySlug(req.params.slug);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
});

// POST /api/products (admin)
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createSchema),
  async (req, res, next) => {
    try {
      const product = await productService.create(req.body);
      sendSuccess(res, product, "Product created", 201);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/products/:id (admin)
router.patch("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (admin)
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    await productService.delete(req.params.id);
    sendSuccess(res, null, "Product deleted");
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/images (admin)
router.post(
  "/:id/images",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { url, altText, isPrimary } = req.body;
      await productService.getById(req.params.id);
      const image = await prisma.productImage.create({
        data: {
          productId: req.params.id,
          url,
          altText,
          isPrimary: isPrimary ?? false,
        },
      });
      sendSuccess(res, image, "Image added", 201);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/products/:id/reviews
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.id },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/reviews
router.post("/:id/reviews", authenticate, async (req, res, next) => {
  try {
    const { rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }
    const review = await prisma.review.create({
      data: {
        productId: req.params.id,
        userId: req.userId!,
        rating,
        title,
        body,
      },
      include: { user: { select: { name: true, avatar: true } } },
    });
    // Recalculate avg rating
    const stats = await prisma.review.aggregate({
      where: { productId: req.params.id },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: req.params.id },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewCount: stats._count,
      },
    });
    sendSuccess(res, review, "Review submitted", 201);
  } catch (err) {
    next(err);
  }
});

export default router;
