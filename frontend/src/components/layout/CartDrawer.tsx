"use client";

import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

export default function CartDrawer() {
  const {
    items,
    subtotal,
    itemCount,
    isOpen,
    closeDrawer,
    updateItem,
    removeItem,
  } = useCartStore();

  const getItemPrice = (item: (typeof items)[0]) => {
    return (
      Number(item.product.basePrice) +
      (item.variant ? Number(item.variant.priceAdjustment) : 0)
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-white dark:bg-gray-950 shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-lg">Shopping Cart</h2>
            <span className="badge badge-primary">{itemCount}</span>
          </div>
          <button
            onClick={closeDrawer}
            className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Your cart is empty
                </p>
                <p className="text-sm text-gray-500">
                  Add some products to get started
                </p>
              </div>
              <Link
                href="/products"
                onClick={closeDrawer}
                className="btn-primary btn-sm"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const price = getItemPrice(item);
              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeDrawer}
                      className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.variant.name}: {item.variant.value}
                      </p>
                    )}
                    <p className="font-bold text-primary-600 dark:text-primary-400 mt-1">
                      ${price.toFixed(2)}
                    </p>

                    {/* Quantity control */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={
                          item.quantity >=
                          (item.product.inventory?.quantity ?? 0)
                        }
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Subtotal ({itemCount} items)
              </span>
              <span className="font-bold text-lg">${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Shipping & taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cart"
              onClick={closeDrawer}
              className="btn-secondary w-full flex items-center justify-center"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
