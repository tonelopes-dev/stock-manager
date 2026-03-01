import { startOfDay, subDays } from "date-fns";

/**
 * Parses a date string in YYYY-MM-DD format and returns a local Date object.
 * This avoids UTC shifts that happen with new Date(str).
 */
export const parseLocalDay = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Returns the default 'from' and 'to' dates for the sales page.
 * Standardizes on the 'Last 7 Days' to match the default Client UI filter.
 */
export const getDefaultSalesRange = () => {
  const now = new Date();
  const to = startOfDay(now);
  const from = startOfDay(subDays(now, 7));
  
  return { from, to };
};
