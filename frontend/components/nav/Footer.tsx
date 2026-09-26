import { FOOTER_COLUMNS } from "@/lib/constants";
import { GlobeIcon } from "@/components/ui/Icons";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-default bg-surface-soft">
      <div className="page-gutter grid max-w-[1440px] grid-cols-3 gap-10 py-12">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-sm font-semibold">{col.title}</h3>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <Link href="/coming-soon" className="text-sm text-text-body hover:underline">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="page-gutter flex items-center justify-between border-t border-border-default py-6 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-text-body">
          <span>© 2026 Airbnb Clone</span>
          <span>·</span>
          <Link href="/coming-soon" className="hover:underline">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/coming-soon" className="hover:underline">
            Terms
          </Link>
          <span>·</span>
          <Link href="/coming-soon" className="hover:underline">
            Sitemap
          </Link>
        </div>
        <div className="flex items-center gap-4 font-semibold">
          <span className="inline-flex items-center gap-2">
            <GlobeIcon /> English (IN)
          </span>
          <span>USD</span>
        </div>
      </div>
    </footer>
  );
}
