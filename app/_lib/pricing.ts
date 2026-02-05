import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calcula a margem de lucro de um produto.
 * @param price Preço de venda
 * @param cost Custo do produto
 * @returns Retorna a margem em porcentagem (ex: 50.0 para 50%)
 */
export function calculateMargin(price: number | Decimal, cost: number | Decimal): number {
  const p = typeof price === "number" ? price : price.toNumber();
  const c = typeof cost === "number" ? cost : cost.toNumber();

  if (p === 0) return 0;
  
  const margin = ((p - c) / p) * 100;
  return Math.round(margin * 100) / 100; // Arredonda para 2 casas decimais
}

/**
 * Calcula o lucro bruto de um produto.
 */
export function calculateProfit(price: number | Decimal, cost: number | Decimal): number {
  const p = typeof price === "number" ? price : price.toNumber();
  const c = typeof cost === "number" ? cost : cost.toNumber();
  
  return p - c;
}
