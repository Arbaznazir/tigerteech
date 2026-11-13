"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products, type Product } from "@/data/products";
import {
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/currency";

export type CartItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  status: "placed" | "processing" | "shipped";
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

type StoreState = {
  cart: CartItem[];
  wishlist: string[];
  user: Omit<User, "password"> | null;
  users: User[];
  orders: Order[];
  lastOrderId: string | null;
  currency: CurrencyCode;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setCurrency: (code: CurrencyCode) => void;
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  register: (name: string, email: string, password: string) => string | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  placeOrder: (shippingAddress: Order["shippingAddress"]) => string;
  cartCount: () => number;
  cartSubtotal: () => number;
  getCartProducts: () => (CartItem & { product: Product })[];
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      user: null,
      users: [],
      orders: [],
      lastOrderId: null,
      currency: DEFAULT_CURRENCY,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setCurrency: (code) => {
        if (!isCurrencyCode(code)) return;
        set({ currency: code });
      },

      addToCart: (item) => {
        const quantity = item.quantity ?? 1;
        set((state) => {
          const existing = state.cart.find(
            (c) =>
              c.productId === item.productId &&
              c.size === item.size &&
              c.color === item.color
          );
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.productId === item.productId &&
                c.size === item.size &&
                c.color === item.color
                  ? { ...c, quantity: c.quantity + quantity }
                  : c
              ),
            };
          }
          return {
            cart: [...state.cart, { ...item, quantity }],
          };
        });
      },

      removeFromCart: (productId, size, color) =>
        set((state) => ({
          cart: state.cart.filter(
            (c) =>
              !(
                c.productId === productId &&
                c.size === size &&
                c.color === color
              )
          ),
        })),

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId, size, color);
          return;
        }
        set((state) => ({
          cart: state.cart.map((c) =>
            c.productId === productId && c.size === size && c.color === color
              ? { ...c, quantity }
              : c
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),

      register: (name, email, password) => {
        const exists = get().users.some(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (exists) return "An account with this email already exists.";
        const user: User = {
          id: `u_${Date.now()}`,
          name,
          email,
          password,
        };
        set((state) => ({
          users: [...state.users, user],
          user: { id: user.id, name: user.name, email: user.email },
        }));
        return null;
      },

      login: (email, password) => {
        const user = get().users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );
        if (!user) return "Invalid email or password.";
        set({
          user: { id: user.id, name: user.name, email: user.email },
        });
        return null;
      },

      logout: () => set({ user: null }),

      placeOrder: (shippingAddress) => {
        const cart = get().cart;
        const subtotal = get().cartSubtotal();
        const shipping = subtotal >= 99 ? 0 : 9.99;
        const id = `TT-${Date.now().toString(36).toUpperCase()}`;
        const order: Order = {
          id,
          createdAt: new Date().toISOString(),
          items: [...cart],
          subtotal,
          shipping,
          total: subtotal + shipping,
          shippingAddress,
          status: "placed",
        };
        set((state) => ({
          orders: [order, ...state.orders],
          cart: [],
          lastOrderId: id,
        }));
        return id;
      },

      cartCount: () => get().cart.reduce((sum, c) => sum + c.quantity, 0),

      cartSubtotal: () =>
        get().cart.reduce((sum, c) => {
          const product = products.find((p) => p.id === c.productId);
          return sum + (product?.priceMin ?? 0) * c.quantity;
        }, 0),

      getCartProducts: () =>
        get()
          .cart.map((c) => {
            const product = products.find((p) => p.id === c.productId);
            if (!product) return null;
            return { ...c, product };
          })
          .filter(Boolean) as (CartItem & { product: Product })[],
    }),
    {
      name: "tigerteeh-store",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        user: state.user,
        users: state.users,
        orders: state.orders,
        lastOrderId: state.lastOrderId,
        currency: state.currency,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StoreState>;
        return {
          ...current,
          ...p,
          currency: isCurrencyCode(p.currency) ? p.currency : current.currency,
        };
      },
    }
  )
);
