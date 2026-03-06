"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
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
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

// Inner component uses useSearchParams — must be wrapped in Suspense
function ProductsInner() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    minRating: searchParams.get("minRating") ?? "",
    sort: searchParams.get("sort") ?? "newest",
    page: parseInt(searchParams.get("page") ?? "1"),
  });

  const limit = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.minRating) params.set("minRating", filters.minRating);
      params.set("sort", filters.sort);
      params.set("page", String(filters.page));
      params.set("limit", String(limit));

      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.data);
      setTotal(data.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data.data));
  }, []);

  const updateFilter = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : (value as number),
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      sort: "newest",
      page: 1,
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">All Products</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total} products found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="input py-2 text-sm w-48"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside
          className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}
        >
          <div className="card p-5 space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div>
              <label className="label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Category</label>
              <div className="space-y-2">
                <div
                  onClick={() => updateFilter("category", "")}
                  className={`px-3 py-2 rounded-xl cursor-pointer text-sm transition-all ${!filters.category ? "bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  All Categories
                </div>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => updateFilter("category", cat.slug)}
                    className={`px-3 py-2 rounded-xl cursor-pointer text-sm transition-all ${filters.category === cat.slug ? "bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  className="input py-2 text-sm"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  className="input py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="label">Min Rating</label>
              <div className="space-y-1">
                {[4, 3, 2].map((r) => (
                  <div
                    key={r}
                    onClick={() => updateFilter("minRating", String(r))}
                    className={`px-3 py-2 rounded-xl cursor-pointer text-sm transition-all ${filters.minRating === String(r) ? "bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >
                    {"★".repeat(r)}
                    {"☆".repeat(5 - r)} & up
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                No products found
              </p>
              <p className="text-sm text-gray-500">Try different filters</p>
              <button onClick={clearFilters} className="btn-primary btn-sm">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => updateFilter("page", p)}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${p === filters.page ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-300"}`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper — required because ProductsInner uses useSearchParams()
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="section">
          <div className="skeleton h-10 w-48 mb-8 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="skeleton aspect-square" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsInner />
    </Suspense>
  );
}
