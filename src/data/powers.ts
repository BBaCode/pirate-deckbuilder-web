import type { CardEffect } from "../types/game";

export type PowerDefinition = {
  id: string;
  name: string;
  endTurnEffects: CardEffect[];
};

export const powers: Record<string, PowerDefinition> = {
  ammo_cache: {
    id: "ammo_cache",
    name: "Ammo Cache",
    endTurnEffects: [{ type: "resource", resourceId: "cannonCharge", amount: 1 }],
  },
};
