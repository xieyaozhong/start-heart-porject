export const USD_PRICING_RATE_TWD = 30;

export function usdFromTwd(amountTwd: number) {
  return Math.round(amountTwd / USD_PRICING_RATE_TWD);
}
