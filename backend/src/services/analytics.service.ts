import { prisma } from "../config/database";

export class AnalyticsService {
  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      totalOrders,
      monthlyOrders,
      totalCustomers,
      newCustomers,
      pendingOrders,
      topProducts,
      recentOrders,
      revenueByDay,
    ] = await Promise.all([
      // Total revenue (all time)
      prisma.payment.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amount: true },
      }),
      // This month revenue
      prisma.payment.aggregate({
        where: { status: "SUCCEEDED", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // Last month revenue
      prisma.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Total orders
      prisma.order.count(),
      // Monthly orders
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      // Total customers
      prisma.user.count({ where: { role: "USER" } }),
      // New customers this month
      prisma.user.count({
        where: { role: "USER", createdAt: { gte: startOfMonth } },
      }),
      // Pending orders
      prisma.order.count({ where: { status: "PENDING" } }),

      // Top selling products
      prisma.orderItem.groupBy({
        by: ["productId", "name"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          payment: { select: { status: true } },
        },
      }),

      // Revenue last 30 days
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', created_at) AS day,
          SUM(amount) AS revenue
        FROM payments
        WHERE status = 'SUCCEEDED'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const monthlyGrowth =
      lastMonthRevenue._sum.amount && Number(lastMonthRevenue._sum.amount) > 0
        ? ((Number(monthlyRevenue._sum.amount ?? 0) -
            Number(lastMonthRevenue._sum.amount)) /
            Number(lastMonthRevenue._sum.amount)) *
          100
        : 0;

    return {
      revenue: {
        total: Number(totalRevenue._sum.amount ?? 0),
        monthly: Number(monthlyRevenue._sum.amount ?? 0),
        growth: Math.round(monthlyGrowth * 100) / 100,
      },
      orders: {
        total: totalOrders,
        monthly: monthlyOrders,
        pending: pendingOrders,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomers,
      },
      topProducts,
      recentOrders,
      revenueByDay,
    };
  }

  async getInventoryStatus() {
    return prisma.inventory.findMany({
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { quantity: "asc" },
    });
  }
}

export const analyticsService = new AnalyticsService();
