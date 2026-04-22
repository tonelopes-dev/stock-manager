
import { formatQuantity } from "../app/_lib/format-quantity";

console.log("Current behavior:");
console.log("0.001 KG ->", formatQuantity(0.001, "KG")); // Expected: "1 g"
console.log("10.0001 UN ->", formatQuantity(10.0001, "UN")); // Expected: "10,0001 un"? Currently "10 UN"?
console.log("0.0001 KG ->", formatQuantity(0.0001, "KG")); // Expected: "0,1 g"? Currently "0 Kg"?

function formatNumberNew(value: number, maxDecimals: number = 4): string {
  const rounded = Math.round(value * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  return rounded.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

console.log("\nNew behavior (maxDecimals 4):");
console.log("10.0001 UN ->", formatNumberNew(10.0001) + " un");
console.log("0.0001 KG ->", formatNumberNew(0.0001 * 1000) + " g");
