"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProductById } from "./mock-data";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  /** A cart only ever holds one stall's products — Morva pays a single
   *  settlement recipient per transaction, so a cross-stall cart wouldn't
   *  have anywhere coherent to check out to. */
  stallSlug: string | null;
  lines: CartLine[];
}

export interface ResolvedCartLine extends CartLine {
  name: string;
  meta: string;
  priceUsd: number;
  photoUrl?: string;
  lineTotalUsd: number;
}

interface CartContextValue {
  stallSlug: string | null;
  lines: CartLine[];
  itemCount: number;
  totalUsd: number;
  quantityFor: (productId: string) => number;
  /** `quantity <= 0` removes the line. Adding a product from a different
   *  stall than what's already in the cart starts a fresh cart for that
   *  stall — carrying the old one over silently isn't meaningful here. */
  setQuantity: (stallSlug: string, productId: string, quantity: number) => void;
  resolvedLines: () => ResolvedCartLine[];
  clear: () => void;
}

const EMPTY_STATE: CartState = { stallSlug: null, lines: [] };
const STORAGE_KEY = "morva:cart";

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Starts empty on every render pass (server and first client render alike)
  // to avoid a hydration mismatch — localStorage only exists client-side,
  // so the persisted cart is loaded in an effect, same as AuthProvider's
  // Magic session restore.
  const [state, setState] = useState<CartState>(EMPTY_STATE);

  useEffect(() => {
    // Deferred to a microtask so setState never runs synchronously within
    // the effect's commit — same reasoning as AuthProvider's session-restore
    // effect.
    Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw) as CartState);
      } catch {
        // Corrupted or inaccessible storage — just start empty.
      }
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private browsing) — cart just won't persist.
    }
  }, [state]);

  const setQuantity = useCallback((stallSlug: string, productId: string, quantity: number) => {
    setState((prev) => {
      const sameStall = prev.stallSlug === stallSlug;
      const lines = sameStall ? prev.lines : [];
      const withoutProduct = lines.filter((line) => line.productId !== productId);
      const next = quantity > 0 ? [...withoutProduct, { productId, quantity }] : withoutProduct;
      return { stallSlug: next.length > 0 ? stallSlug : null, lines: next };
    });
  }, []);

  const clear = useCallback(() => setState(EMPTY_STATE), []);

  const quantityFor = useCallback(
    (productId: string) => state.lines.find((line) => line.productId === productId)?.quantity ?? 0,
    [state.lines]
  );

  const resolvedLines = useCallback(
    () =>
      state.lines
        .map((line): ResolvedCartLine | null => {
          const product = getProductById(line.productId);
          if (!product) return null;
          return {
            ...line,
            name: product.name,
            meta: product.meta,
            priceUsd: product.priceUsd,
            photoUrl: product.photoUrl,
            lineTotalUsd: product.priceUsd * line.quantity,
          };
        })
        .filter((line): line is ResolvedCartLine => line !== null),
    [state.lines]
  );

  const itemCount = state.lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalUsd = resolvedLines().reduce((sum, line) => sum + line.lineTotalUsd, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      stallSlug: state.stallSlug,
      lines: state.lines,
      itemCount,
      totalUsd,
      quantityFor,
      setQuantity,
      resolvedLines,
      clear,
    }),
    [state, itemCount, totalUsd, quantityFor, setQuantity, resolvedLines, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
