"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  Zap,
} from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count: { products: number };
}

const features = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $100" },
  { icon: ShieldCheck, title: "Secure Checkout", desc: "Powered by Stripe" },
  { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free" },
  { icon: Star, title: "Top Rated", desc: "4.9★ avg rating" },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/products/featured"), api.get("/categories")])
      .then(([prod, cat]) => {
        setFeatured(prod.data.data);
        setCategories(cat.data.data.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-gray-950">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl animate-spin-slow" />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl"
            style={{ animationDelay: "-3s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary-400/10 blur-2xl" />
        </div>

        <div className="section relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Zap className="w-4 h-4 text-accent-400" />
                <span className="text-sm text-white/90 font-medium">
                  New Arrivals Every Week
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                Shop the{" "}
                <span className="bg-gradient-to-r from-primary-300 to-accent-400 bg-clip-text text-transparent">
                  Future
                </span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg">
                Discover premium products curated just for you. Fast shipping,
                easy returns, and secure payments — all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="btn-primary btn-lg shadow-xl shadow-primary-900/50"
                >
                  Shop Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/products?isFeatured=true"
                  className="btn bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 px-8 py-4 text-base active:scale-95 rounded-xl font-semibold transition-all duration-200"
                >
                  View Featured
                </Link>
              </div>
            </div>

            {/* Hero image grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in">
              {featured.slice(0, 4).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className={`relative rounded-2xl overflow-hidden ${i === 0 ? "aspect-[3/4]" : i === 1 ? "aspect-square" : i === 2 ? "aspect-square" : "aspect-[3/4]"} group`}
                >
                  {p.images[0] && (
                    <Image
                      src={p.images[0].url}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="300px"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-sm font-bold">
                      ${Number(p.basePrice).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="section py-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 font-semibold text-sm mb-2">
                Browse
              </p>
              <h2 className="text-3xl font-black">Shop by Category</h2>
            </div>
            <Link
              href="/products"
              className="btn-ghost text-primary-600 hover:text-primary-700"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-950 hover:shadow-xl transition-all duration-300"
              >
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                    sizes="300px"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold text-lg">{cat.name}</p>
                  <p className="text-white/70 text-sm">
                    {cat._count.products} products
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="section bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-none">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 font-semibold text-sm mb-2">
                Handpicked
              </p>
              <h2 className="text-3xl font-black">Featured Products</h2>
            </div>
            <Link
              href="/products?isFeatured=true"
              className="btn-ghost text-primary-600 hover:text-primary-700"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="section">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-600 to-accent-500 p-12 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-8xl">✦</div>
            <div className="absolute bottom-4 right-8 text-6xl">✦</div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 relative">
            Get 20% off your first order
          </h2>
          <p className="text-white/80 text-lg mb-8 relative">
            Join thousands of happy customers today.
          </p>
          <Link
            href="/auth/register"
            className="btn bg-white text-primary-600 hover:bg-gray-50 px-10 py-4 text-base font-bold rounded-xl active:scale-95 transition-all duration-200 relative"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
