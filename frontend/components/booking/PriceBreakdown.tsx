import { formatPrice } from "@/lib/formatPrice";
import type { PriceQuote } from "@/lib/types";

export function PriceBreakdown({ quote }: { quote: PriceQuote }) {
  return (
    <div className="mt-6 space-y-3 text-[16px]">
      <div className="flex justify-between">
        <span className="underline">
          {formatPrice(quote.nightly_price, quote.currency)} × {quote.nights} night{quote.nights === 1 ? "" : "s"}
        </span>
        <span>{formatPrice(quote.subtotal, quote.currency, true)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Cleaning fee</span>
        <span>{formatPrice(quote.cleaning_fee, quote.currency, true)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Service fee</span>
        <span>{formatPrice(quote.service_fee, quote.currency, true)}</span>
      </div>
      <div className="border-t border-border-default pt-4">
        <div className="flex justify-between font-semibold">
          <span>Total before taxes</span>
          <span>{formatPrice(quote.total, quote.currency, true)}</span>
        </div>
      </div>
    </div>
  );
}
