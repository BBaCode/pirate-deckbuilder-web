import type { Card } from "../types/game";

export type CardDisplayType = "attack" | "skill" | "power" | "status" | "curse";

export function getCardDisplayType(card: Card): CardDisplayType {
  if (card.tags.includes("power")) return "power";
  if (card.tags.includes("status")) return "status";
  if (card.tags.includes("curse") && card.unplayable) return "curse";
  if (card.tags.includes("attack")) return "attack";
  if (card.tags.includes("curse")) return "curse";
  return "skill";
}
