import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class CartService {
  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new AppError("User ID or session ID required", 400);
    }

    const where = userId ? { userId } : { sessionId };
    let cart = await prisma.cart.findUnique({
      where,
      include: this.cartInclude(),
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: userId ? { userId } : { sessionId },
        include: this.cartInclude(),
      });
    }
    return cart;
  }

  async mergeGuestCart(guestSessionId: string, userId: string) {
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId: guestSessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await this.getOrCreateCart(userId);

    for (const item of guestCart.items) {
      await this.addItem(
        userId,
        undefined,
        item.productId,
        item.quantity,
        item.variantId ?? undefined,
      );
    }

    // Delete guest cart
    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  async addItem(
    userId: string | undefined,
    sessionId: string | undefined,
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    // Validate product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { inventory: true, variants: true },
    });
    if (!product) throw new AppError("Product not found", 404);

    const available = product.inventory?.quantity ?? 0;
    if (available < quantity) {
      throw new AppError(`Only ${available} items in stock`, 400);
    }

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) throw new AppError("Variant not found", 404);
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    const existing = cart.items.find(
      (i) =>
        i.productId === productId &&
        (variantId ? i.variantId === variantId : !i.variantId),
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (available < newQty) {
        throw new AppError(`Only ${available} items in stock`, 400);
      }
      return prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            update: { where: { id: existing.id }, data: { quantity: newQty } },
          },
        },
        include: this.cartInclude(),
      });
    }

    return prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: { create: { productId, quantity, variantId } },
      },
      include: this.cartInclude(),
    });
  }

  async updateItem(
    cartItemId: string,
    quantity: number,
    userId?: string,
    sessionId?: string,
  ) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = cart.items.find((i) => i.id === cartItemId);
    if (!item) throw new AppError("Cart item not found", 404);

    if (quantity <= 0) {
      return this.removeItem(cartItemId, userId, sessionId);
    }

    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { inventory: true },
    });
    if ((product?.inventory?.quantity ?? 0) < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    return prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: { update: { where: { id: cartItemId }, data: { quantity } } },
      },
      include: this.cartInclude(),
    });
  }

  async removeItem(cartItemId: string, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return this.getOrCreateCart(userId, sessionId);
  }

  async clearCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async getCartSummary(cart: Awaited<ReturnType<typeof this.getOrCreateCart>>) {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const price =
        Number(item.product.basePrice) +
        (item.variant ? Number(item.variant.priceAdjustment) : 0);
      subtotal += price * item.quantity;
      itemCount += item.quantity;
    }

    return { subtotal, itemCount, items: cart.items };
  }

  private cartInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              inventory: { select: { quantity: true } },
            },
          },
          variant: true,
        },
      },
    } as const;
  }
}

export const cartService = new CartService();
