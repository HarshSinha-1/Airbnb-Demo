import { formatMoney } from "@/lib/format";
import type { PriceQuote } from "@/lib/types";

export function PriceBreakdown({ quote }: { quote: PriceQuote }) {
  return (
    <div className="mt-6 space-y-3 text-[16px]">
      <div className="flex justify-between">
        <span className="underline">
          {formatMoney(quote.nightly_price)} × {quote.nights} night{quote.nights === 1 ? "" : "s"}
        </span>
        <span>{formatMoney(quote.subtotal, true)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Cleaning fee</span>
        <span>{formatMoney(quote.cleaning_fee, true)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Service fee</span>
        <span>{formatMoney(quote.service_fee, true)}</span>
      </div>
      <div className="border-t border-border-default pt-4">
        <div className="flex justify-between font-semibold">
          <span>Total before taxes</span>
          <span>{formatMoney(quote.total, true)}</span>
        </div>
      </div>
    </div>
  );
}
