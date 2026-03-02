import { UnitType } from "@prisma/client";

export type UnitFamily = "MASS" | "VOLUME" | "UNIT";

export interface UnitInfo {
  family: UnitFamily;
  ratio: number; // Ratio to base unit (G for MASS, ML for VOLUME, UN for UNIT)
}

export const UNIT_CONFIG: Record<UnitType, UnitInfo> = {
  [UnitType.KG]: { family: "MASS", ratio: 1000 },
  [UnitType.G]: { family: "MASS", ratio: 1 },
  [UnitType.L]: { family: "VOLUME", ratio: 1000 },
  [UnitType.ML]: { family: "VOLUME", ratio: 1 },
  [UnitType.UN]: { family: "UNIT", ratio: 1 },
};

/**
 * Checks if two units belong to the same family
 */
export function isUnitCompatible(unitA: UnitType, unitB: UnitType): boolean {
  return UNIT_CONFIG[unitA].family === UNIT_CONFIG[unitB].family;
}
