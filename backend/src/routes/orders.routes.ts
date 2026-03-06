import { Router } from "express";
import { z } from "zod";
import { orderService } from "../services/order.service";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { sendSuccess, paginationMeta } from "../utils/response";
import { stripe } from "../config/stripe";
import { env } from "../config/env";

const router = Router();

const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});

// POST /api/orders
router.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  async (req, res, next) => {
    try {
      const order = await orderService.createFromCart(req.userId!, req.body);
      sendSuccess(res, order, "Order created", 201);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/orders/:id/payment-intent
router.post("/:id/payment-intent", authenticate, async (req, res, next) => {
  try {
    const result = await orderService.createPaymentIntent(
      req.params.id,
      req.userId!,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders (user's orders)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const page = parseInt((req.query.page as string) ?? "1");
    const limit = parseInt((req.query.limit as string) ?? "10");
    const { orders, total } = await orderService.getUserOrders(
      req.userId!,
      page,
      limit,
    );
    sendSuccess(
      res,
      orders,
      undefined,
      200,
      paginationMeta(total, page, limit),
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const order = await orderService.getById(req.params.id, req.userId);
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/refund (admin)
router.post(
  "/:id/refund",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      await orderService.refundOrder(req.params.id);
      sendSuccess(res, null, "Refund processed");
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/orders/:id/status (admin)
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateStatusSchema),
  async (req, res, next) => {
    try {
      const order = await orderService.updateStatus(
        req.params.id,
        req.body.status,
      );
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/orders/admin/all (admin)
router.get("/admin/all", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt((req.query.page as string) ?? "1");
    const limit = parseInt((req.query.limit as string) ?? "20");
    const status = req.query.status as string;
    const { orders, total } = await orderService.getAll(page, limit, status);
    sendSuccess(
      res,
      orders,
      undefined,
      200,
      paginationMeta(total, page, limit),
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/webhook (Stripe webhook — no auth, raw body)
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "payment_intent.succeeded":
        await orderService.handlePaymentSuccess(event.data.object.id);
        break;
      case "payment_intent.payment_failed":
        await orderService.handlePaymentFailure(event.data.object.id);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    res.status(400).json({ error: message });
  }
});

export default router;
