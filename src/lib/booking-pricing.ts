/** Flat add-on when renter selects pickup & drop-off at checkout (USD). */
export const PICKUP_DROPOFF_FEE_USD = 10;

export function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function totalUsd(dailyRateUsd: number, days: number): number {
  return Math.round(dailyRateUsd * days * 100) / 100;
}

/** Full capture amount: rental + optional pickup/drop-off + refundable deposit snapshot. */
export function computeBookingTotalUsd(
  dailyRateUsd: number,
  days: number,
  includePickupDropoff: boolean,
  refundableDepositUsd: number
): number {
  const rent = totalUsd(dailyRateUsd, days);
  const pickup = includePickupDropoff ? PICKUP_DROPOFF_FEE_USD : 0;
  const dep = roundMoney2(Math.max(0, refundableDepositUsd));
  return roundMoney2(rent + pickup + dep);
}
