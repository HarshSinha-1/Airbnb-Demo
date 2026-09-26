"use client";

import { useCurrentUser } from "@/context/UserContext";
import { MenuIcon } from "@/components/ui/Icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function UserSwitcher() {
  const { users, currentUser, setCurrentUserId, loading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-[86px] items-center justify-between rounded-full border border-border-default bg-surface-raised text-text-primary px-3 transition-shadow duration-150 hover:shadow-float"
        aria-label="Account menu"
      >
        <MenuIcon />
        {currentUser?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUser.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-text-secondary text-xs text-white">
            {loading ? "…" : "?"}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-[240px] overflow-hidden rounded-xl bg-surface-raised border border-border-soft py-2 shadow-lift">
          {currentUser ? (
            <>
              <Link href="/trips" className="block px-4 py-3 text-sm font-semibold hover:bg-surface-soft" onClick={() => setOpen(false)}>
                Trips
              </Link>
              <Link href="/wishlist" className="block px-4 py-3 text-sm font-semibold hover:bg-surface-soft" onClick={() => setOpen(false)}>
                Wishlists
              </Link>
              <Link href="/host" className="block px-4 py-3 text-sm hover:bg-surface-soft" onClick={() => setOpen(false)}>
                Host dashboard
              </Link>
              <div className="my-2 border-t border-border-soft" />
            </>
          ) : null}
          <p className="px-4 pb-2 pt-1 text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
            Act as mock user
          </p>
          <div className="max-h-72 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setCurrentUserId(user.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-soft ${
                  currentUser?.id === user.id ? "font-semibold" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="min-w-0">
                  <span className="block truncate">{user.name}</span>
                  <span className="text-xs text-text-secondary">
                    {user.is_host ? (user.is_superhost ? "Host · Superhost" : "Host") : "Guest"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
