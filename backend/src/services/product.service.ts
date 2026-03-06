import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class ProductService {
  async list(params: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    isFeatured?: boolean;
    sort?: string;
  }) {
    const {
      page,
      limit,
      category,
      search,
      minPrice,
      maxPrice,
      minRating,
      isFeatured,
      sort,
    } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined)
        (where.basePrice as Record<string, number>).gte = minPrice;
      if (maxPrice !== undefined)
        (where.basePrice as Record<string, number>).lte = maxPrice;
    }
    if (minRating !== undefined) {
      where.avgRating = { gte: minRating };
    }
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const orderBy = this.getOrderBy(sort);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          inventory: { select: { quantity: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        variants: true,
        inventory: true,
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!product) throw new AppError("Product not found", 404);
    return product;
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        variants: true,
        inventory: true,
      },
    });
    if (!product) throw new AppError("Product not found", 404);
    return product;
  }

  async create(data: {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    basePrice: number;
    comparePrice?: number;
    sku: string;
    isFeatured?: boolean;
    weight?: number;
    stock: number;
  }) {
    const slugExists = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (slugExists) throw new AppError("Slug already in use", 409);

    const skuExists = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (skuExists) throw new AppError("SKU already in use", 409);

    return prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        comparePrice: data.comparePrice,
        sku: data.sku,
        isFeatured: data.isFeatured ?? false,
        weight: data.weight,
        inventory: { create: { quantity: data.stock } },
      },
      include: { inventory: true, category: true },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      categoryId: string;
      basePrice: number;
      comparePrice: number | null;
      sku: string;
      isFeatured: boolean;
      isActive: boolean;
      weight: number;
    }>,
  ) {
    await this.getById(id);
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, inventory: true },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async updateStock(productId: string, quantity: number) {
    return prisma.inventory.update({
      where: { productId },
      data: { quantity },
    });
  }

  async getFeatured(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        inventory: { select: { quantity: true } },
      },
    });
  }

  private getOrderBy(sort?: string) {
    switch (sort) {
      case "price_asc":
        return { basePrice: "asc" as const };
      case "price_desc":
        return { basePrice: "desc" as const };
      case "rating":
        return { avgRating: "desc" as const };
      case "newest":
        return { createdAt: "desc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  }
}

export const productService = new ProductService();
