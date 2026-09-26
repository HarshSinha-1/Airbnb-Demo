"use client";

import { ToastProvider } from "@/context/ToastContext";
import { UserProvider } from "@/context/UserContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Footer } from "@/components/nav/Footer";
import { NavBar } from "@/components/nav/NavBar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ToastProvider>
        <WishlistProvider>
          <NavBar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </WishlistProvider>
      </ToastProvider>
    </UserProvider>
  );
}
