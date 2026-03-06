import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import toast from "react-hot-toast";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: Array<{ url: string; altText?: string }>;
    inventory: { quantity: number };
  };
  variant?: {
    id: string;
    name: string;
    value: string;
    priceAdjustment: number;
  };
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  openDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      isLoading: false,
      isOpen: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get("/cart");
          set({
            items: data.data.items || [],
            subtotal: data.data.subtotal || 0,
            itemCount: data.data.itemCount || 0,
          });
        } catch {
          // Ignore
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, quantity, variantId) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/cart/items", {
            productId,
            quantity,
            variantId,
          });
          set({
            items: data.data.items || [],
            subtotal: data.data.subtotal || 0,
            itemCount: data.data.itemCount || 0,
            isOpen: true,
          });
          toast.success("Added to cart!");
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to add item";
          toast.error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      updateItem: async (itemId, quantity) => {
        set({ isLoading: true });
        try {
          const { data } = await api.patch(`/cart/items/${itemId}`, {
            quantity,
          });
          set({
            items: data.data.items || [],
            subtotal: data.data.subtotal || 0,
            itemCount: data.data.itemCount || 0,
          });
        } catch {
          toast.error("Failed to update cart");
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (itemId) => {
        set({ isLoading: true });
        try {
          const { data } = await api.delete(`/cart/items/${itemId}`);
          set({
            items: data.data.items || [],
            subtotal: data.data.subtotal || 0,
            itemCount: data.data.itemCount || 0,
          });
          toast.success("Item removed");
        } catch {
          toast.error("Failed to remove item");
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        try {
          await api.delete("/cart");
          set({ items: [], subtotal: 0, itemCount: 0 });
        } catch {
          toast.error("Failed to clear cart");
        }
      },

      toggleDrawer: () => set((s) => ({ isOpen: !s.isOpen })),
      closeDrawer: () => set({ isOpen: false }),
      openDrawer: () => set({ isOpen: true }),
    }),
    {
      name: "cart-store",
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        itemCount: state.itemCount,
      }),
    },
  ),
);
