/** Amounts are stored and displayed in USD (`daily_rate_usd`, `total_amount_usd`). */
export function formatDailyRateUsd(amount: number): string {
  const n = Number(amount);
  const opts: Intl.NumberFormatOptions = Number.isInteger(n)
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `$${n.toLocaleString('en-US', opts)}`;
}
