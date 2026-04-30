import { getDay } from "date-fns";

export interface PromotionSchedule {
  type: "always" | "scheduled";
  days?: number[];
  startTime?: string;
  endTime?: string;
}

export interface ProductWithPromotion {
  promoActive: boolean;
  promoSchedule?: any;
  promoPrice?: number | any;
  price: number | any;
}

/**
 * Checks if a promotion is currently active based on the product's schedule.
 * Correctly handles America/Sao_Paulo timezone to avoid server/client discrepancies.
 */
export function isPromotionActive(product: ProductWithPromotion | null | undefined): boolean {
  if (!product || !product.promoActive || !product.promoPrice) return false;
  
  try {
    const schedule = product.promoSchedule as PromotionSchedule | null;
    
    // If no schedule details, but promoActive is true, consider it "always"
    if (!schedule || schedule.type === "always") return true;

    // Get current time in America/Sao_Paulo
    // This works both on server (Node) and client (Browser)
    const nowInSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    
    // 1. Check Day of Week
    if (schedule.days && schedule.days.length > 0) {
      const currentDay = getDay(nowInSP); // 0 (Sun) to 6 (Sat)
      if (!schedule.days.includes(currentDay)) {
        return false;
      }
    }

    // 2. Check Time Range
    if (schedule.startTime && schedule.endTime) {
      const [startH, startM] = schedule.startTime.split(":").map(Number);
      const [endH, endM] = schedule.endTime.split(":").map(Number);
      
      const nowH = nowInSP.getHours();
      const nowM = nowInSP.getMinutes();
      
      const nowTotalMinutes = nowH * 60 + nowM;
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;

      // Handle Overnight Promotions (e.g., 22:00 to 02:00)
      if (startTotalMinutes <= endTotalMinutes) {
        // Standard range (same day)
        if (nowTotalMinutes < startTotalMinutes || nowTotalMinutes > endTotalMinutes) {
          return false;
        }
      } else {
        // Overnight range
        // Active if (now >= start) OR (now <= end)
        if (nowTotalMinutes < startTotalMinutes && nowTotalMinutes > endTotalMinutes) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("[PromotionEngine] Error validating promotion:", error);
    // Fallback to false on error to prevent incorrect discounts
    return false;
  }
}

/**
 * Returns the price that should be applied to the product.
 */
export function getProductAppliedPrice(product: ProductWithPromotion, isEmployeeSale: boolean = false): number {
  if (isEmployeeSale) {
    // For simplicity, we assume cost + operationalCost is handled elsewhere or passed here
    // In many parts of this system, employee price is cost + opCost.
    return Number(product.price); // Fallback
  }
  
  return isPromotionActive(product) ? Number(product.promoPrice) : Number(product.price);
}
