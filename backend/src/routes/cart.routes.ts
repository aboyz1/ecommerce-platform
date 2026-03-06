import { Router } from "express";
import { z } from "zod";
import { cartService } from "../services/cart.service";
import { validate } from "../middleware/validate";
import { authenticate, optionalAuth, AuthRequest } from "../middleware/auth";
import { sendSuccess } from "../utils/response";

const router = Router();

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  variantId: z.string().uuid().optional(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

// GET /api/cart
router.get("/", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = req.headers["x-session-id"] as string;
    const cart = await cartService.getOrCreateCart(req.userId, sessionId);
    const summary = await cartService.getCartSummary(cart);
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/items
router.post(
  "/items",
  optionalAuth,
  validate(addItemSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const { productId, quantity, variantId } = req.body;
      const cart = await cartService.addItem(
        req.userId,
        sessionId,
        productId,
        quantity,
        variantId,
      );
      const summary = await cartService.getCartSummary(cart);
      sendSuccess(res, summary, "Item added to cart");
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/cart/items/:itemId
router.patch(
  "/items/:itemId",
  optionalAuth,
  validate(updateItemSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const cart = await cartService.updateItem(
        req.params.itemId,
        req.body.quantity,
        req.userId,
        sessionId,
      );
      const summary = await cartService.getCartSummary(cart);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/cart/items/:itemId
router.delete(
  "/items/:itemId",
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const cart = await cartService.removeItem(
        req.params.itemId,
        req.userId,
        sessionId,
      );
      const summary = await cartService.getCartSummary(cart);
      sendSuccess(res, summary, "Item removed");
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/cart (clear)
router.delete("/", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = req.headers["x-session-id"] as string;
    await cartService.clearCart(req.userId, sessionId);
    sendSuccess(res, null, "Cart cleared");
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/merge (merge guest cart on login)
router.post("/merge", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await cartService.mergeGuestCart(sessionId, req.userId!);
    }
    const cart = await cartService.getOrCreateCart(req.userId);
    const summary = await cartService.getCartSummary(cart);
    sendSuccess(res, summary, "Cart merged");
  } catch (err) {
    next(err);
  }
});

export default router;
