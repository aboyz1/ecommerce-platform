import Link from "next/link";
import { Package, Github, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  const links = {
    Shop: [
      { href: "/products", label: "All Products" },
      { href: "/products?isFeatured=true", label: "Featured" },
      { href: "/products?sort=newest", label: "New Arrivals" },
      { href: "/products?sort=price_asc", label: "Deals" },
    ],
    Account: [
      { href: "/account", label: "My Account" },
      { href: "/account/orders", label: "Orders" },
      { href: "/account/wishlist", label: "Wishlist" },
      { href: "/auth/login", label: "Sign In" },
    ],
    Support: [
      { href: "#", label: "Help Center" },
      { href: "#", label: "Contact Us" },
      { href: "#", label: "Returns & Refunds" },
      { href: "#", label: "Shipping Info" },
    ],
    Legal: [
      { href: "#", label: "Privacy Policy" },
      { href: "#", label: "Terms of Service" },
      { href: "#", label: "Cookie Policy" },
    ],
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gradient">ShopClone</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Premium products, exceptional service. Shop the future today.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} ShopClone. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <img
              src="https://raw.githubusercontent.com/stripe-samples/checkout-one-time-payments/master/client/images/visa.svg"
              alt="Visa"
              className="h-6 opacity-60"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/68px-Mastercard-logo.svg.png"
              alt="Mastercard"
              className="h-6 opacity-60"
            />
            <div className="text-xs text-gray-400 ml-2">Powered by Stripe</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
