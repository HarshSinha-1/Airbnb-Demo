"use client";

import { api } from "@/lib/api";
import { ApiError } from "@/lib/types";
import { useCurrentUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type WishlistContextValue = {
  savedIds: Set<number>;
  loading: boolean;
  isSaved: (listingId: number) => boolean;
  toggle: (listingId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const items = await api.getWishlist();
      setSavedIds(new Set(items.map((item) => item.listing_id)));
    } catch {
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isSaved = useCallback((listingId: number) => savedIds.has(listingId), [savedIds]);

  const toggle = useCallback(
    async (listingId: number) => {
      const currentlySaved = savedIds.has(listingId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        if (currentlySaved) {
          await api.removeFromWishlist(listingId);
          showToast("Removed from wishlist");
        } else {
          await api.addToWishlist(listingId);
          showToast("Saved to wishlist");
        }
      } catch (err) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        const message =
          err instanceof ApiError ? err.message : "Could not update wishlist";
        showToast(message, "error");
      }
    },
    [savedIds, showToast],
  );

  const value = useMemo(
    () => ({ savedIds, loading, isSaved, toggle, refresh }),
    [savedIds, loading, isSaved, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
