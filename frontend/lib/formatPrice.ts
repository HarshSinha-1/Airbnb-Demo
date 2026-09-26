export function formatPrice(amount: number, currency: string = "USD", exact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: exact ? 2 : 0,
  }).format(amount);
}
