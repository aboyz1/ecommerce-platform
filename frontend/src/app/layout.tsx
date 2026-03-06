import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopClone — Premium E-Commerce",
  description:
    "Discover premium products with fast shipping and secure checkout powered by Stripe.",
  keywords: ["shopping", "ecommerce", "online store", "products"],
  openGraph: {
    title: "ShopClone",
    description: "Premium E-Commerce Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <CartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#18181b",
              color: "#fff",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
