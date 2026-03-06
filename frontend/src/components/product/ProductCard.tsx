"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { clsx } from "clsx";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice?: number;
  avgRating: number;
  reviewCount: number;
  images: Array<{ url: string; altText?: string }>;
  inventory?: { quantity: number };
  category?: { name: string; slug: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.basePrice) / product.comparePrice) *
          100,
      )
    : 0;

  const isOutOfStock = (product.inventory?.quantity ?? 1) === 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.id, 1);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please sign in to save to wishlist");
      return;
    }
    try {
      await api.post(`/users/wishlist/${product.id}`);
      toast.success("Added to wishlist!");
    } catch {
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="card-hover group block">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-gray-800">
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].altText ?? product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && (
            <span className="badge bg-red-500 text-white">-{discount}%</span>
          )}
          {isOutOfStock && (
            <span className="badge bg-gray-500 text-white">Out of Stock</span>
          )}
          {product.category && (
            <span className="badge badge-primary">{product.category.name}</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-sm"
          aria-label="Add to wishlist"
        >
          <Heart className="w-4 h-4" />
        </button>

        {/* Quick Add (hover) */}
        <div
          className={clsx(
            "absolute bottom-0 left-0 right-0 p-3 transition-all duration-300",
            "translate-y-full group-hover:translate-y-0",
          )}
        >
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="btn-primary w-full text-xs py-2.5 shadow-lg"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={clsx(
                    "w-3 h-3",
                    i < Math.round(product.avgRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900 dark:text-gray-100">
            ${Number(product.basePrice).toFixed(2)}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">
              ${Number(product.comparePrice).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
