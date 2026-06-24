import { startOfDay, subDays } from "date-fns";

/** UTC-3 offset in milliseconds (Brazil Standard Time — no DST since 2019). */
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Returns a Date whose UTC fields represent the current BRT wall-clock time.
 * Use this instead of `new Date()` when recording timestamps that should
 * reflect the Brazilian business day (e.g. sale date, stock movement date).
 */
export const nowBRT = (): Date => {
  return new Date(Date.now() - BRT_OFFSET_MS);
};

/**
 * Returns today's date string in YYYY-MM-DD format, in BRT timezone.
 */
export const todayBRT = (): string => {
  return nowBRT().toISOString().split("T")[0];
};

/**
 * Parses a date string in YYYY-MM-DD format and returns a UTC Date object
 * at midnight. Uses Date.UTC to avoid system-timezone shifts.
 */
export const parseLocalDay = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Returns the default 'from' and 'to' dates for the sales page.
 * Standardizes on the 'Last 7 Days' to match the default Client UI filter.
 * Uses BRT-aware "now" so the range is correct for the Brazilian business day.
 */
export const getDefaultSalesRange = () => {
  const now = nowBRT();
  const to = startOfDay(now);
  const from = startOfDay(subDays(now, 7));

  return { from, to };
};
