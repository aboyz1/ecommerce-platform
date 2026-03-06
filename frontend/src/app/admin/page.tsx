"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-warning",
  PAID: "badge-primary",
  PROCESSING: "badge-primary",
  SHIPPED: "badge-primary",
  DELIVERED: "badge-success",
  CANCELLED: "badge-danger",
  REFUNDED: "badge-gray",
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${up ? "text-green-600" : "text-red-600"}`}
          >
            {up ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "inventory"
  >("overview");
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    api
      .get("/admin/dashboard")
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (activeTab === "orders") {
      api.get("/orders/admin/all").then(({ data }) => setOrders(data.data));
    }
    if (activeTab === "inventory") {
      api.get("/admin/inventory").then(({ data }) => setInventory(data.data));
    }
  }, [activeTab]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    await api.patch(`/orders/${orderId}/status`, { status });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
    setUpdatingOrder(null);
  };

  if (loading) {
    return (
      <div className="section">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  const revenueData =
    stats?.revenueByDay?.map((d: any) => ({
      day: new Date(d.day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: Number(d.revenue),
    })) ?? [];

  return (
    <div className="section">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary btn-sm">
          + New Product
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {(["overview", "orders", "inventory"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-300"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              icon={DollarSign}
              value={`$${stats.revenue.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`$${stats.revenue.monthly.toFixed(2)} this month`}
              trend={stats.revenue.growth}
            />
            <StatCard
              title="Total Orders"
              icon={ShoppingBag}
              value={stats.orders.total.toLocaleString()}
              subtitle={`${stats.orders.monthly} this month`}
            />
            <StatCard
              title="Customers"
              icon={Users}
              value={stats.customers.total.toLocaleString()}
              subtitle={`+${stats.customers.newThisMonth} this month`}
            />
            <StatCard
              title="Pending Orders"
              icon={Clock}
              value={stats.orders.pending.toLocaleString()}
              subtitle="Awaiting action"
            />
          </div>

          {/* Revenue Chart */}
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-xl">Revenue (Last 30 Days)</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products & Recent Orders */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="font-bold mb-4">Top Products</h2>
              <div className="space-y-3">
                {stats.topProducts.map((p: any, i: number) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-xs font-bold text-primary-600">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {p.name}
                    </span>
                    <span className="badge badge-primary">
                      {p._sum.quantity} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Recent Orders</h2>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="btn-ghost btn-sm text-primary-600"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.name}
                      </p>
                    </div>
                    <span
                      className={`badge ${STATUS_STYLES[order.status] ?? "badge-gray"}`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Status",
                    "Total",
                    "Date",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p>{order.user?.name}</p>
                      <p className="text-gray-400 text-xs">
                        {order.user?.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${STATUS_STYLES[order.status] ?? "badge-gray"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
                        disabled={updatingOrder === order.id}
                        className="input py-1 text-xs w-36"
                      >
                        {[
                          "PENDING",
                          "PAID",
                          "PROCESSING",
                          "SHIPPED",
                          "DELIVERED",
                          "CANCELLED",
                          "REFUNDED",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {[
                    "Product",
                    "Category",
                    "Stock",
                    "Reserved",
                    "Status",
                    "Low Stock Alert",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {inventory.map((inv: any) => {
                  const isLow = inv.quantity <= inv.lowStockAlert;
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${isLow ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold">
                          {inv.product.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {inv.product.sku}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {inv.product.category?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-sm ${isLow ? "text-red-600" : "text-gray-900 dark:text-gray-100"}`}
                        >
                          {inv.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {inv.reservedQty}
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="badge badge-danger">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {inv.lowStockAlert}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
