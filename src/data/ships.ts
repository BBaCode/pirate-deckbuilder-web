import type { PlayerShipDefinition } from "../types/game";
import { cannonChargeResource } from "../game/mechanics";

export const ships: PlayerShipDefinition[] = [
  {
    id: "cannon_ship",
    name: "Cannon Ship",
    subtitle: "Momentum cannon starter",
    description: "Build Cannon Charge, then cash it in for heavy broadsides.",
    maxHp: 75,
    startingDeck: [
      { cardId: "basic_attack", count: 4 },
      { cardId: "basic_defend", count: 4 },
      { cardId: "load_cannons", count: 1 },
      { cardId: "fire_cannons", count: 1 },
    ],
    passive: { type: "battleStartResource", resourceId: "cannonCharge", amount: 2 },
    resources: [cannonChargeResource],
  },
  {
    id: "iron_gull",
    name: "The Iron Gull",
    subtitle: "Defensive starter ship",
    description: "A sturdy vessel built to survive long fights.",
    maxHp: 80,
    startingDeck: [
      { cardId: "cannon_shot", count: 5 },
      { cardId: "brace", count: 5 },
    ],
    passive: { type: "battleStartBlock", amount: 5 },
  },
  {
    id: "crimson_wake",
    name: "The Crimson Wake",
    subtitle: "Aggressive cannon ship",
    description: "A fast raider that wins by ending fights quickly.",
    maxHp: 65,
    startingDeck: [
      { cardId: "cannon_shot", count: 6 },
      { cardId: "brace", count: 2 },
      { cardId: "quick_jab", count: 2 },
    ],
    passive: { type: "firstAttackBonus", amount: 2 },
  },
  {
    id: "mist_reaver",
    name: "The Mist Reaver",
    subtitle: "Tricky ghost ship",
    description: "A haunted ship that relies on tempo and evasive play.",
    maxHp: 70,
    startingDeck: [
      { cardId: "cannon_shot", count: 4 },
      { cardId: "brace", count: 4 },
      { cardId: "smoke_screen", count: 2 },
    ],
    passive: { type: "firstTurnDraw", amount: 1 },
  },
];

export const playableShips = ships.filter((ship) => ship.id === "cannon_ship");

export const shipsById = Object.fromEntries(ships.map((ship) => [ship.id, ship]));

export function getShipDefinition(shipId: string): PlayerShipDefinition {
  return shipsById[shipId] ?? ships[0];
}
