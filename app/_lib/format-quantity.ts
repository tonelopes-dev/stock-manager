/**
 * Formats a quantity with its unit for display in the UI.
 * 
 * Features:
 * - Brazilian decimal notation (comma)
 * - Smart unit downscaling: values < 1 in L → ml, values < 1 in KG → g
 * - Removes unnecessary trailing zeros
 * 
 * @example
 * formatQuantity(11.05, "L")   → "11,05 L"
 * formatQuantity(0.005, "L")   → "5 ml"
 * formatQuantity(0.15, "KG")   → "150 g"
 * formatQuantity(12, "L")      → "12 L"
 * formatQuantity(-0.01, "L")   → "-10 ml"
 * formatQuantity(500, "ML")    → "500 ml"
 */

const UNIT_DISPLAY: Record<string, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UN: "un",
};

const DOWNSCALE_MAP: Record<string, { targetUnit: string; factor: number }> = {
  L: { targetUnit: "ML", factor: 1000 },
  KG: { targetUnit: "G", factor: 1000 },
};

function formatNumber(value: number, maxDecimals: number = 2): string {
  // Round to max decimals to avoid floating point artifacts
  const rounded = Math.round(value * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  
  return rounded.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatQuantity(
  value: number,
  unit: string,
  options?: { alwaysShowSign?: boolean }
): string {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  let displayValue = absValue;
  let displayUnit = unit;

  // Smart downscale: If value is < 1 in a "big" unit, convert to smaller unit
  const downscale = DOWNSCALE_MAP[unit];
  if (downscale && absValue < 1 && absValue > 0) {
    displayValue = absValue * downscale.factor;
    displayUnit = downscale.targetUnit;
  }

  const label = UNIT_DISPLAY[displayUnit] || displayUnit;
  const sign = isNegative ? "-" : (options?.alwaysShowSign ? "+" : "");
  const formatted = formatNumber(displayValue);

  return `${sign}${formatted} ${label}`;
}

/**
 * Formats a quantity for cost-per-unit display (e.g., "R$ 34,00/L")
 * Always uses the stock unit without downscaling.
 */
export function getUnitLabel(unit: string): string {
  return UNIT_DISPLAY[unit] || unit;
}
