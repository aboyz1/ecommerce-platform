import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/database";
import { stripe } from "../config/stripe";
import { AppError } from "../middleware/errorHandler";
import { emailService } from "./email.service";

export class OrderService {
  async createFromCart(
    userId: string,
    data: {
      addressId: string;
      shippingMethod: string;
      notes?: string;
    },
  ) {
    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      const available = item.product.inventory?.quantity ?? 0;
      if (available < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${item.product.name}. Available: ${available}`,
          400,
        );
      }
      const price =
        Number(item.product.basePrice) +
        (item.variant ? Number(item.variant.priceAdjustment) : 0);
      subtotal += price * item.quantity;
    }

    const shippingCost = this.calculateShipping(data.shippingMethod, subtotal);
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const total = subtotal + shippingCost + tax;

    const orderNumber = `ORD-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: data.addressId,
          shippingMethod: data.shippingMethod,
          notes: data.notes,
          subtotal,
          shippingCost,
          tax,
          total,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price:
                Number(item.product.basePrice) +
                (item.variant ? Number(item.variant.priceAdjustment) : 0),
              name: item.product.name,
              image: item.product.images[0]?.url,
            })),
          },
        },
        include: { items: true, user: true, address: true },
      });

      // Deduct inventory
      for (const item of cart.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return order;
  }

  async createPaymentIntent(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (order.userId !== userId) throw new AppError("Unauthorized", 403);
    if (order.status !== "PENDING")
      throw new AppError("Order already processed", 400);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100), // Stripe uses cents
      currency: "usd",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
      },
      automatic_payment_methods: { enabled: true },
    });

    // Save payment intent
    await prisma.payment.upsert({
      where: { orderId },
      update: { stripePaymentId: paymentIntent.id },
      create: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: order.total,
        currency: "usd",
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntentId },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
      },
    });

    if (!payment) return;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED" },
      });
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: "PAID" },
      });
    });

    // Send confirmation email (non-blocking)
    emailService
      .sendOrderConfirmationEmail(
        payment.order.user.email,
        payment.order.user.name,
        payment.order.orderNumber,
        Number(payment.order.total),
        payment.order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
      )
      .catch(() => {});
  }

  async handlePaymentFailure(paymentIntentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntentId },
    });
    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }

  async refundOrder(orderId: string) {
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new AppError("Payment not found", 404);
    if (payment.status !== "SUCCEEDED")
      throw new AppError("Cannot refund this payment", 400);

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundId: refund.id,
          refundAmount: payment.amount,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      });
    });
  }

  async getUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          address: true,
          payment: true,
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total };
  }

  async getById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        address: true,
        payment: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (userId && order.userId !== userId)
      throw new AppError("Unauthorized", 403);
    return order;
  }

  async updateStatus(orderId: string, status: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("Order not found", 404);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as never },
      include: { user: true },
    });

    if (status === "SHIPPED") {
      emailService
        .sendShippingEmail(
          updated.user.email,
          updated.user.name,
          updated.orderNumber,
        )
        .catch(() => {});
    }

    return updated;
  }

  async getAll(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as never } : {};
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);
    return { orders, total };
  }

  private calculateShipping(method: string, subtotal: number): number {
    if (subtotal >= 100) return 0; // Free shipping over $100
    switch (method) {
      case "standard":
        return 5.99;
      case "express":
        return 14.99;
      case "overnight":
        return 24.99;
      default:
        return 5.99;
    }
  }
}

export const orderService = new OrderService();
