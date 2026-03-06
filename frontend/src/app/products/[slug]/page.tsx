"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Variant {
  id: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stock: number;
}
interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  createdAt: string;
  user: { name: string; avatar?: string };
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.data);
      })
      .catch(() => router.push("/products"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="section">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton w-20 h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const variantGroups = product.variants.reduce(
    (acc: Record<string, Variant[]>, v: Variant) => {
      if (!acc[v.name]) acc[v.name] = [];
      acc[v.name].push(v);
      return acc;
    },
    {},
  );

  const selectedVariantObj = product.variants.find((v: Variant) =>
    Object.entries(selectedVariants).every(
      ([name, value]) => v.name === name && v.value === value,
    ),
  );

  const price =
    Number(product.basePrice) +
    (selectedVariantObj ? Number(selectedVariantObj.priceAdjustment) : 0);
  const inStock = (product.inventory?.quantity ?? 0) > 0;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addItem(product.id, quantity, selectedVariantObj?.id);
    setAddingToCart(false);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save wishlist");
      return;
    }
    await api.post(`/users/wishlist/${product.id}`);
    toast.success("Added to wishlist!");
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to leave a review");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      toast.success("Review submitted!");
      const { data } = await api.get(`/products/${slug}`);
      setProduct(data.data);
      setReviewRating(0);
      setReviewTitle("");
      setReviewBody("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="section">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/products" className="hover:text-primary-600">
          Products
        </Link>
        <ChevronRight className="w-4 h-4" />
        {product.category && (
          <>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-primary-600"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
          {product.name}
        </span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {product.images[selectedImage] && (
              <Image
                src={product.images[selectedImage].url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {product.images.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === selectedImage ? "border-primary-600" : "border-transparent hover:border-gray-300"}`}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="badge badge-primary"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl font-black leading-tight">{product.name}</h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(product.avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
              </div>
              <span className="font-semibold">
                {Number(product.avgRating).toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black">${price.toFixed(2)}</span>
            {product.comparePrice && (
              <span className="text-xl text-gray-400 line-through">
                ${Number(product.comparePrice).toFixed(2)}
              </span>
            )}
            {product.comparePrice && (
              <span className="badge bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-sm">
                Save ${(Number(product.comparePrice) - price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Variants */}
          {Object.entries(variantGroups).map(([name, variants]) => (
            <div key={name}>
              <label className="label">{name}</label>
              <div className="flex flex-wrap gap-2">
                {(variants as Variant[]).map((v) => (
                  <button
                    key={v.id}
                    onClick={() =>
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [name]: v.value,
                      }))
                    }
                    disabled={v.stock === 0}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedVariants[name] === v.value ? "border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300" : "border-gray-200 dark:border-gray-700 hover:border-primary-300"} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div>
            <label className="label">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold text-lg">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(product.inventory?.quantity ?? 99, quantity + 1),
                  )
                }
                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 ml-2">
                {inStock
                  ? `${product.inventory.quantity} in stock`
                  : "❌ Out of stock"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className="btn-primary flex-1 btn-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              {addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleWishlist}
              className="btn-secondary w-14 h-14 rounded-xl flex items-center justify-center"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Perks */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span>Free shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span>30-day return policy</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold mb-3">Description</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-20">
        <h2 className="text-2xl font-black mb-8">Customer Reviews</h2>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Review form */}
          <div className="card p-6">
            <h3 className="font-bold mb-4">Write a Review</h3>
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="label">Your Rating</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i + 1)}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${i < reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  placeholder="Sum it up"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Review</label>
                <textarea
                  className="input min-h-24 resize-none"
                  placeholder="Share your experience..."
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={reviewRating === 0 || submittingReview}
                className="btn-primary w-full"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* Review list */}
          <div className="lg:col-span-2 space-y-4">
            {product.reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No reviews yet. Be the first!
              </div>
            ) : (
              product.reviews.map((review: Review) => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {review.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">
                          {review.user.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <p className="font-semibold text-sm mb-1">
                          {review.title}
                        </p>
                      )}
                      {review.body && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {review.body}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
