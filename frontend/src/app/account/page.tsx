"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import {
  Package,
  User,
  Heart,
  MapPin,
  ChevronRight,
  Clock,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-warning",
  PAID: "badge-primary",
  PROCESSING: "badge-primary",
  SHIPPED: "badge-primary",
  DELIVERED: "badge-success",
  CANCELLED: "badge-danger",
  REFUNDED: "badge-gray",
};

export default function AccountPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    api
      .get("/orders?limit=5")
      .then(({ data }) => setOrders(data.data))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const quickLinks = [
    {
      href: "/account/orders",
      icon: Package,
      label: "My Orders",
      desc: "Track your purchases",
    },
    {
      href: "/account/wishlist",
      icon: Heart,
      label: "Wishlist",
      desc: "Saved items",
    },
    {
      href: "/account/profile",
      icon: User,
      label: "Profile",
      desc: "Personal info",
    },
    {
      href: "/account/addresses",
      icon: MapPin,
      label: "Addresses",
      desc: "Saved locations",
    },
  ];

  return (
    <div className="section max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-2xl font-black">
          {user?.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-black">
            Hi, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500">{user?.email}</p>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="badge badge-primary mt-2">
              Admin
            </Link>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="card-hover p-5 flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recent Orders
          </h2>
          <Link
            href="/account/orders"
            className="btn-ghost btn-sm text-primary-600"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No orders yet</p>
            <Link href="/products" className="btn-primary btn-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="flex items-center gap-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {order.items?.length} item
                    {order.items?.length !== 1 ? "s" : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold">${Number(order.total).toFixed(2)}</p>
                  <span
                    className={`badge text-xs mt-1 ${STATUS_STYLES[order.status] ?? "badge-gray"}`}
                  >
                    {order.status}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
