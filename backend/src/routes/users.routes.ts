import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { sendSuccess } from "../utils/response";
import { AppError } from "../middleware/errorHandler";

const router = Router();

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

const addressSchema = z.object({
  name: z.string().min(2),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/users/profile
router.get("/profile", authenticate, async (req, res, next) => {
  try {
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

// PATCH /api/users/profile
router.patch(
  "/profile",
  authenticate,
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: req.body,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          phone: true,
        },
      });
      sendSuccess(res, user, "Profile updated");
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/users/addresses
router.get("/addresses", authenticate, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/addresses
router.post(
  "/addresses",
  authenticate,
  validate(addressSchema),
  async (req, res, next) => {
    try {
      if (req.body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.userId },
          data: { isDefault: false },
        });
      }
      const address = await prisma.address.create({
        data: { ...req.body, userId: req.userId! },
      });
      sendSuccess(res, address, "Address saved", 201);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/users/addresses/:id
router.patch("/addresses/:id", authenticate, async (req, res, next) => {
  try {
    const addr = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!addr) throw new AppError("Address not found", 404);
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      });
    }
    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/addresses/:id
router.delete("/addresses/:id", authenticate, async (req, res, next) => {
  try {
    const addr = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!addr) throw new AppError("Address not found", 404);
    await prisma.address.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, "Address deleted");
  } catch (err) {
    next(err);
  }
});

// GET /api/users/wishlist
router.get("/wishlist", authenticate, async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                inventory: { select: { quantity: true } },
              },
            },
          },
        },
      },
    });
    sendSuccess(res, wishlist?.items ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/wishlist/:productId
router.post("/wishlist/:productId", authenticate, async (req, res, next) => {
  try {
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.userId },
    });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: req.userId! },
      });
    }
    await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: req.params.productId,
        },
      },
      update: {},
      create: { wishlistId: wishlist.id, productId: req.params.productId },
    });
    sendSuccess(res, null, "Added to wishlist");
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/wishlist/:productId
router.delete("/wishlist/:productId", authenticate, async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.userId },
    });
    if (wishlist) {
      await prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id, productId: req.params.productId },
      });
    }
    sendSuccess(res, null, "Removed from wishlist");
  } catch (err) {
    next(err);
  }
});

export default router;
