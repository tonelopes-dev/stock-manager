import { UnitType } from "@prisma/client";

export type UnitFamily = "MASS" | "VOLUME" | "UNIT";

export interface UnitInfo {
  family: UnitFamily;
  ratio: number; // Ratio to base unit (G for MASS, ML for VOLUME, UN for UNIT)
  step: string;
  min: string;
  placeholder: string;
}

export const UNIT_CONFIG: Record<UnitType, UnitInfo> = {
  [UnitType.KG]: { 
    family: "MASS", 
    ratio: 1000, 
    step: "0.001", 
    min: "0.001", 
    placeholder: "Ex: 0,5" 
  },
  [UnitType.G]: { 
    family: "MASS", 
    ratio: 1, 
    step: "1", 
    min: "1", 
    placeholder: "Ex: 500" 
  },
  [UnitType.L]: { 
    family: "VOLUME", 
    ratio: 1000, 
    step: "0.001", 
    min: "0.001", 
    placeholder: "Ex: 1,5" 
  },
  [UnitType.ML]: { 
    family: "VOLUME", 
    ratio: 1, 
    step: "1", 
    min: "1", 
    placeholder: "Ex: 250" 
  },
  [UnitType.UN]: { 
    family: "UNIT", 
    ratio: 1, 
    step: "1", 
    min: "1", 
    placeholder: "Ex: 12" 
  },
  [UnitType.PCT]: { 
    family: "UNIT", 
    ratio: 1, 
    step: "1", 
    min: "1", 
    placeholder: "Ex: 5" 
  },
  [UnitType.MC]: { 
    family: "UNIT", 
    ratio: 1, 
    step: "1", 
    min: "1", 
    placeholder: "Ex: 3" 
  },
};

/**
 * Checks if two units belong to the same family
 */
export function isUnitCompatible(unitA: UnitType, unitB: UnitType): boolean {
  return UNIT_CONFIG[unitA].family === UNIT_CONFIG[unitB].family;
}
