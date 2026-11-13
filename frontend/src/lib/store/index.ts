"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Product } from "@/data/products";
import { API_URL } from "@/lib/api";
import { findProductById } from "@/lib/catalog";
import {
  clearCustomerToken,
  getCustomerToken,
  setCustomerToken,
} from "@/lib/customer-auth";
import {
  DEFAULT_CURRENCY,
  isCurrencyCode,
  setLiveFxRates,
  type CurrencyCode,
} from "@/lib/currency";
import type { UsdFxRates } from "@/lib/fx";
import type { MeasurementSet } from "@/lib/measurements";

export type CartItem = {
  productId: string;
  variantId?: string;
  size: string;
  color: string;
  quantity: number;
  /** Locked unit price when added — validated against backend at checkout. */
  unitPrice?: number;
  maxPerOrder?: number;
  stock?: number;
  /** Snapshot so bag still renders if catalog cache is cold. */
  productName?: string;
  productSlug?: string;
  productImage?: string;
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
  phone?: string;
  avatarUrl?: string;
  /** male | female — set at signup; defaults new measurement sets */
  gender?: string;
  address?: Record<string, string>;
  measurementSets?: MeasurementSet[];
  password?: string;
};

function clampCartQty(
  current: number,
  add: number,
  maxPerOrder = 0,
  stock = 999
) {
  const cap =
    maxPerOrder > 0
      ? Math.max(0, Math.min(maxPerOrder, stock))
      : Math.max(0, stock);
  return Math.min(cap, current + add);
}

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
  /** Bumps when live FX rates load so price formatters re-render. */
  fxRevision: number;
  fxDate: string;
  fxSource: "live" | "cache" | "fallback" | "pending";
  setFxRates: (
    rates: UsdFxRates,
    meta: { date: string; source: "live" | "cache" | "fallback" }
  ) => void;
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  clearCoupon: () => void;
  updateCartUnitPrices: (byVariantId: Record<string, number>) => void;
  toggleWishlist: (productId: string) => void;
  register: (
    name: string,
    email: string,
    password: string,
    opts?: { confirmPassword?: string; gender?: string }
  ) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    gender?: string;
    address?: Record<string, string>;
    measurementSets?: MeasurementSet[];
  }) => Promise<string | null>;
  placeOrder: (
    shippingAddress: Order["shippingAddress"],
    opts?: {
      paymentMethod?: "cod" | "online";
      measurementSnapshot?: Record<string, unknown>;
      lineMeasurements?: Record<string, unknown>;
      dealId?: string;
      couponCode?: string;
      expectedPaidAmount?: number;
    }
  ) => Promise<string>;
  cartCount: () => number;
  cartSubtotal: () => number;
  getCartProducts: () => (CartItem & { product: Product })[];
  /** Fill missing name/image/slug on cart lines from the catalog cache. */
  enrichCartFromCatalog: () => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      couponCode: "",
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
      fxRevision: 0,
      fxDate: "",
      fxSource: "pending",
      setFxRates: (rates, meta) => {
        setLiveFxRates(rates);
        set((state) => ({
          fxRevision: state.fxRevision + 1,
          fxDate: meta.date,
          fxSource: meta.source,
        }));
      },

      addToCart: (item) => {
        const quantity = item.quantity ?? 1;
        const maxPerOrder = item.maxPerOrder ?? 0;
        const stock = item.stock ?? 999;
        const cached = findProductById(item.productId);
        const snapshot = {
          productName: item.productName || cached?.name,
          productSlug: item.productSlug || cached?.slug,
          productImage: item.productImage || cached?.image,
          unitPrice:
            item.unitPrice ?? cached?.priceMin ?? undefined,
        };
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
                  ? {
                      ...c,
                      variantId: item.variantId || c.variantId,
                      unitPrice:
                        snapshot.unitPrice ?? c.unitPrice ?? undefined,
                      productName: snapshot.productName || c.productName,
                      productSlug: snapshot.productSlug || c.productSlug,
                      productImage: snapshot.productImage || c.productImage,
                      maxPerOrder,
                      stock,
                      quantity: clampCartQty(
                        c.quantity,
                        quantity,
                        maxPerOrder,
                        stock
                      ),
                    }
                  : c
              ),
            };
          }
          return {
            cart: [
              ...state.cart,
              {
                ...item,
                ...snapshot,
                maxPerOrder,
                stock,
                quantity: clampCartQty(0, quantity, maxPerOrder, stock),
              },
            ],
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
          cart: state.cart.map((c) => {
            if (
              !(
                c.productId === productId &&
                c.size === size &&
                c.color === color
              )
            ) {
              return c;
            }
            const maxPerOrder = c.maxPerOrder ?? 0;
            const stock = c.stock ?? 999;
            return {
              ...c,
              quantity: clampCartQty(0, quantity, maxPerOrder, stock),
            };
          }),
        }));
      },

      clearCart: () => set({ cart: [], couponCode: "" }),

      setCouponCode: (code) =>
        set({ couponCode: String(code || "").trim().toUpperCase() }),
      clearCoupon: () => set({ couponCode: "" }),

      updateCartUnitPrices: (byVariantId) => {
        set((state) => ({
          cart: state.cart.map((c) => {
            if (!c.variantId) return c;
            const next = byVariantId[c.variantId];
            if (typeof next !== "number") return c;
            return { ...c, unitPrice: next };
          }),
        }));
      },

      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),

      register: async (name, email, password, opts) => {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              password,
              confirmPassword: opts?.confirmPassword ?? password,
              gender: opts?.gender || "",
            }),
          });
          const json = (await res.json()) as {
            data?: {
              token: string;
              user: {
                id: string;
                name: string;
                email: string;
                gender?: string;
              };
            };
            error?: string | null;
          };
          if (!res.ok || json.error || !json.data?.token) {
            return json.error || "Could not register";
          }
          setCustomerToken(json.data.token);
          // Keep guest cart — already in zustand state
          set({
            user: {
              id: json.data.user.id,
              name: json.data.user.name,
              email: json.data.user.email,
              gender: json.data.user.gender,
            },
          });
          await get().refreshProfile();
          return null;
        } catch {
          return "Could not reach the server";
        }
      },

      login: async (email, password) => {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ email, password }),
          });
          const json = (await res.json()) as {
            data?: {
              token: string;
              user: { id: string; name: string; email: string; role?: string };
            };
            error?: string | null;
          };
          if (!res.ok || json.error || !json.data?.token) {
            return json.error || "Invalid email or password.";
          }
          if (json.data.user.role === "admin") {
            return "Use the seller panel for admin accounts.";
          }
          setCustomerToken(json.data.token);
          set({
            user: {
              id: json.data.user.id,
              name: json.data.user.name,
              email: json.data.user.email,
            },
          });
          await get().refreshProfile();
          return null;
        } catch {
          return "Could not reach the server";
        }
      },

      logout: () => {
        clearCustomerToken();
        set({ user: null });
      },

      refreshProfile: async () => {
        const token = getCustomerToken();
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/api/v1/me`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const json = (await res.json()) as {
            data?: {
              id: string;
              name: string;
              email: string;
              phone?: string;
              avatarUrl?: string;
              gender?: string;
              address?: Record<string, string>;
              measurementSets?: MeasurementSet[];
            };
            error?: string | null;
          };
          if (!res.ok || !json.data) return;
          set({
            user: {
              id: json.data.id,
              name: json.data.name,
              email: json.data.email,
              phone: json.data.phone,
              avatarUrl: json.data.avatarUrl,
              gender: json.data.gender,
              address: json.data.address,
              measurementSets: json.data.measurementSets || [],
            },
          });
        } catch {
          // ignore
        }
      },

      updateProfile: async (patch) => {
        const token = getCustomerToken();
        if (!token) return "Not logged in";
        try {
          const current = get().user;
          const body: Record<string, unknown> = {
            name: patch.name ?? current?.name ?? "",
            phone: patch.phone ?? current?.phone ?? "",
            avatarUrl: patch.avatarUrl ?? current?.avatarUrl ?? "",
            address: patch.address ?? current?.address ?? {},
          };
          if (patch.gender !== undefined) {
            body.gender = patch.gender;
          }
          if (patch.measurementSets) {
            body.measurementSets = patch.measurementSets;
          }
          const res = await fetch(`${API_URL}/api/v1/me`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });
          const json = (await res.json()) as {
            data?: {
              id: string;
              name: string;
              email: string;
              phone?: string;
              avatarUrl?: string;
              gender?: string;
              address?: Record<string, string>;
              measurementSets?: MeasurementSet[];
            };
            error?: string | null;
          };
          if (!res.ok || json.error || !json.data) {
            return json.error || "Could not update profile";
          }
          set({
            user: {
              id: json.data.id,
              name: json.data.name,
              email: json.data.email,
              phone: json.data.phone,
              avatarUrl: json.data.avatarUrl,
              gender: json.data.gender ?? current?.gender,
              address: json.data.address,
              measurementSets:
                json.data.measurementSets || current?.measurementSets || [],
            },
          });
          return null;
        } catch {
          return "Could not reach the server";
        }
      },

      placeOrder: async (shippingAddress, opts) => {
        const cart = get().cart;
        if (!cart.length) throw new Error("Cart is empty");
        if (!get().user) throw new Error("Please log in to checkout");

        const token = getCustomerToken();
        if (!token) throw new Error("Please log in to checkout");

        const missingVariant = cart.find((c) => !c.variantId);
        if (missingVariant) {
          throw new Error(
            "Some cart items are missing inventory links. Remove and re-add them."
          );
        }

        const subtotal = get().cartSubtotal();
        const couponCode = (opts?.couponCode || get().couponCode || "").trim();
        const shipping = subtotal >= 99 ? 0 : 9.99;
        const expectedPaid =
          typeof opts?.expectedPaidAmount === "number"
            ? opts.expectedPaidAmount
            : subtotal + shipping;

        const res = await fetch(`${API_URL}/api/v1/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: shippingAddress.email,
            shipping: shippingAddress,
            measurementSnapshot: opts?.measurementSnapshot || {},
            paymentMethod: opts?.paymentMethod || "cod",
            couponCode,
            dealId: opts?.dealId || undefined,
            expectedSubtotal: subtotal,
            expectedTotal: expectedPaid,
            expectedPaidAmount: expectedPaid,
            items: cart.map((c) => {
              const product = findProductById(c.productId);
              const unit =
                c.unitPrice ??
                product?.priceMin ??
                0;
              const key =
                c.variantId || `${c.productId}:${c.size}:${c.color}`;
              const lineMeas = opts?.lineMeasurements?.[key];
              return {
                variantId: c.variantId,
                qty: c.quantity,
                expectedUnitPrice: unit,
                measurementSnapshot: lineMeas || {},
              };
            }),
          }),
        });
        const json = (await res.json()) as {
          data?: {
            id?: string;
            status?: string;
            currentTotal?: number;
            expectedTotal?: number;
            message?: string;
            lines?: {
              productName?: string;
              expectedUnitPrice?: number;
              currentUnitPrice?: number;
            }[];
          };
          error?: string | null;
        };
        if (!res.ok || json.error || !json.data?.id) {
          if (res.status === 409 && json.data?.currentTotal != null) {
            const lines = (json.data.lines || [])
              .map((l) =>
                l.productName
                  ? `${l.productName}: was $${Number(l.expectedUnitPrice).toFixed(2)}, now $${Number(l.currentUnitPrice).toFixed(2)}`
                  : ""
              )
              .filter(Boolean)
              .join(" · ");
            throw new Error(
              `${json.error || json.data.message || "Prices changed."}${lines ? ` ${lines}` : ""} Refresh checkout and pay $${Number(json.data.currentTotal).toFixed(2)}.`
            );
          }
          throw new Error(json.error || "Could not place order");
        }
        const id = json.data.id;
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
          couponCode: "",
          lastOrderId: id,
        }));
        await get().updateProfile({
          phone: shippingAddress.phone,
          address: {
            fullName: shippingAddress.fullName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country,
          },
        });
        return id;
      },

      cartCount: () => get().cart.reduce((sum, c) => sum + c.quantity, 0),

      cartSubtotal: () =>
        get().cart.reduce((sum, c) => {
          const product = findProductById(c.productId);
          const unit = c.unitPrice ?? product?.priceMin ?? 0;
          return sum + unit * c.quantity;
        }, 0),

      getCartProducts: () =>
        get()
          .cart.map((c) => {
            const product = findProductById(c.productId);
            if (!product) return null;
            return { ...c, product };
          })
          .filter(Boolean) as (CartItem & { product: Product })[],

      enrichCartFromCatalog: () => {
        set((state) => {
          let changed = false;
          const cart = state.cart.map((c) => {
            const product = findProductById(c.productId);
            if (!product) return c;
            const catalogImage = product.image || product.images?.[0] || "";
            const currentImage = (c.productImage || "").trim();
            const badImage =
              !currentImage ||
              currentImage === "/brand-logo.png" ||
              currentImage.endsWith("/brand-logo.png");
            const next = {
              ...c,
              productName:
                !c.productName || c.productName === "Product" || c.productName === "Loading…"
                  ? product.name
                  : c.productName,
              productSlug: c.productSlug || product.slug,
              productImage: badImage && catalogImage ? catalogImage : currentImage || catalogImage,
              unitPrice: c.unitPrice ?? product.priceMin,
            };
            if (
              next.productName !== c.productName ||
              next.productSlug !== c.productSlug ||
              next.productImage !== c.productImage ||
              next.unitPrice !== c.unitPrice
            ) {
              changed = true;
            }
            return next;
          });
          return changed ? { cart } : state;
        });
      },
    }),
    {
      name: "tigerteeh-store",
      partialize: (state) => ({
        cart: state.cart,
        couponCode: state.couponCode,
        wishlist: state.wishlist,
        user: state.user,
        users: state.users,
        orders: state.orders,
        lastOrderId: state.lastOrderId,
        currency: state.currency,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (typeof window !== "undefined" && getCustomerToken()) {
          void state?.refreshProfile();
        } else if (state?.user && !getCustomerToken()) {
          state?.logout();
        }
      },
    }
  )
);
