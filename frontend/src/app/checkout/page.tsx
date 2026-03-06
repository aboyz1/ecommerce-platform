"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

function CheckoutForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation/${orderId}`,
        },
      });
      if (error) {
        toast.error(error.message || "Payment failed");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full btn-lg"
      >
        <ShieldCheck className="w-5 h-5" />
        {isProcessing ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          "Pay Now"
        )}
      </button>
      <p className="text-center text-xs text-gray-400">
        🔒 Secured by Stripe. Your card information is never stored.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, subtotal, itemCount } = useCartStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [step, setStep] = useState<"details" | "payment">("details");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (itemCount === 0) {
      router.push("/cart");
      return;
    }
    api.get("/users/addresses").then(({ data }) => {
      setAddresses(data.data);
      const def = data.data.find((a: any) => a.isDefault);
      if (def) setSelectedAddress(def.id);
      else if (data.data[0]) setSelectedAddress(data.data[0].id);
    });
  }, [isAuthenticated, itemCount, router]);

  const shippingOptions = [
    {
      id: "standard",
      label: "Standard Shipping",
      time: "5-7 days",
      price: subtotal >= 100 ? 0 : 5.99,
    },
    {
      id: "express",
      label: "Express Shipping",
      time: "2-3 days",
      price: 14.99,
    },
    {
      id: "overnight",
      label: "Overnight Shipping",
      time: "1 day",
      price: 24.99,
    },
  ];

  const selectedShipping =
    shippingOptions.find((o) => o.id === shippingMethod) ?? shippingOptions[0];
  const tax = (subtotal + selectedShipping.price) * 0.08;
  const total = subtotal + selectedShipping.price + tax;

  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }
    setLoading(true);
    try {
      const { data: orderData } = await api.post("/orders", {
        addressId: selectedAddress,
        shippingMethod,
        notes,
      });
      const order = orderData.data;
      setOrderId(order.id);

      const { data: PIdata } = await api.post(
        `/orders/${order.id}/payment-intent`,
      );
      setClientSecret(PIdata.data.clientSecret);
      setStep("payment");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
        <h1 className="text-3xl font-black mt-4">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {step === "details" ? (
            <>
              {/* Shipping Address */}
              <div className="card p-6">
                <h2 className="font-bold text-lg mb-4">Shipping Address</h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No saved addresses</p>
                    <Link
                      href="/account/addresses"
                      className="btn-primary btn-sm"
                    >
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? "border-primary-600 bg-primary-50 dark:bg-primary-950" : "border-gray-100 dark:border-gray-800 hover:border-gray-200"}`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                          className="mt-1 accent-primary-600"
                        />
                        <div>
                          <p className="font-semibold">{addr.name}</p>
                          <p className="text-sm text-gray-500">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                            {addr.state} {addr.postalCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            {addr.country}
                          </p>
                        </div>
                        {addr.isDefault && (
                          <span className="badge badge-primary ml-auto">
                            Default
                          </span>
                        )}
                      </label>
                    ))}
                    <Link
                      href="/account/addresses"
                      className="btn-ghost btn-sm mt-2"
                    >
                      + Add new address
                    </Link>
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              <div className="card p-6">
                <h2 className="font-bold text-lg mb-4">Shipping Method</h2>
                <div className="space-y-3">
                  {shippingOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${shippingMethod === opt.id ? "border-primary-600 bg-primary-50 dark:bg-primary-950" : "border-gray-100 dark:border-gray-800 hover:border-gray-200"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={opt.id}
                          checked={shippingMethod === opt.id}
                          onChange={() => setShippingMethod(opt.id)}
                          className="accent-primary-600"
                        />
                        <div>
                          <p className="font-semibold">{opt.label}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {opt.time}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">
                        {opt.price === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `$${opt.price.toFixed(2)}`
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="card p-6">
                <h2 className="font-bold text-lg mb-4">
                  Order Notes (optional)
                </h2>
                <textarea
                  className="input resize-none min-h-20"
                  placeholder="Special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={loading || !selectedAddress}
                className="btn-primary w-full btn-lg"
              >
                {loading ? "Preparing..." : "Continue to Payment →"}
              </button>
            </>
          ) : (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-6">Payment Details</h2>
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm orderId={orderId} onSuccess={() => {}} />
                </Elements>
              )}
              <button
                onClick={() => setStep("details")}
                className="btn-ghost btn-sm mt-4"
              >
                ← Back to shipping
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product.images[0] && (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-400">
                        {item.variant.value}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold">
                    $
                    {(
                      (Number(item.product.basePrice) +
                        (item.variant
                          ? Number(item.variant.priceAdjustment)
                          : 0)) *
                      item.quantity
                    ).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span>
                  {selectedShipping.price === 0
                    ? "FREE"
                    : `$${selectedShipping.price.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-lg border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Secured by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
