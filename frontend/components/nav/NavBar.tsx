"use client";

import { AirbnbLogo, GlobeIcon } from "@/components/ui/Icons";
import { SearchBar } from "@/components/nav/SearchBar";
import { UserSwitcher } from "@/components/nav/UserSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Homes" },
  { href: "/experiences", label: "Experiences" },
  { href: "/services", label: "Services" },
];

export function NavBar() {
  const pathname = usePathname();
  const showFullSearch = pathname === "/" || pathname === "/search" || pathname === "/experiences" || pathname === "/services";

  return (
    <header className="sticky top-0 z-50 bg-bg">
      <div className="page-gutter flex h-20 items-center justify-between border-b border-border-soft">
        <Link href="/" className="flex w-[280px] items-center gap-2 text-rausch" aria-label="Airbnb home">
          <AirbnbLogo className="h-8 w-8" />
          <span className="text-xl font-semibold tracking-tight">airbnb</span>
        </Link>
        <nav className="flex items-center gap-8">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/listing") || pathname === "/search"
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[14px] ${active ? "font-semibold text-text-primary" : "font-medium text-text-secondary hover:text-text-primary"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/host" className="rounded-full px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
            Become a host
          </Link>
          <button type="button" className="rounded-full p-3 text-text-primary hover:bg-surface-soft" aria-label="Language">
            <GlobeIcon />
          </button>
          <ThemeToggle />
          <UserSwitcher />
        </div>
      </div>
      <div className="border-b border-border-soft bg-bg py-4">
        <SearchBar compact={!showFullSearch} />
      </div>
    </header>
  );
}
