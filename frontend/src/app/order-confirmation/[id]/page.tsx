"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Package, Truck, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="section flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="section max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-black mb-3">Order Confirmed! 🎉</h1>
        <p className="text-gray-500 text-lg">Thank you for your purchase!</p>
        <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 mt-4">
          <span className="text-sm text-gray-500">Order number:</span>
          <span className="font-bold text-sm">{order.orderNumber}</span>
        </div>
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Order Details</h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400 m-auto" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-bold">
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span>${Number(order.shippingCost).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span>${Number(order.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-lg border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-5 h-5 text-primary-600" />
          <h2 className="font-bold text-lg">Shipping Address</h2>
        </div>
        <p className="font-semibold">{order.address.name}</p>
        <p className="text-sm text-gray-500">
          {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}
        </p>
        <p className="text-sm text-gray-500">
          {order.address.city}, {order.address.state} {order.address.postalCode}
        </p>
        <p className="text-sm text-gray-500">{order.address.country}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/account/orders"
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" /> Track Order
        </Link>
        <Link
          href="/products"
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
