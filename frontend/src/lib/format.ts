/** Formats a USD-denominated amount for display. Plain `.toFixed(2)` would
 *  silently round any genuinely non-zero sub-cent amount (e.g. $0.001,
 *  a realistic price now that settlement tokens have 6 decimals) down to
 *  "0.00" — indistinguishable from an actual $0 bug. This shows 2 decimals
 *  for normal amounts, and falls back to up to 6 (trimmed of trailing
 *  zeros) only when 2 would otherwise display a non-zero value as zero. */
export function formatUsd(value: number): string {
  if (value !== 0 && Math.abs(value) < 0.005) {
    const trimmed = value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    if (trimmed && trimmed !== "0" && trimmed !== "-0") return trimmed;
  }
  return value.toFixed(2);
}
