import { getShipDefinition } from "../data/ships";
import type { RunState } from "../types/game";

const SAVE_KEY = "pirate-deckbuilder-run-v1";

export function saveRun(run: RunState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(run));
}

export function loadRun(): RunState | null {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as RunState;
    if (parsed.version !== 1 || !Array.isArray(parsed.encounters)) return null;
    const ship = parsed.ship ?? getShipDefinition(parsed.selectedShipId ?? "iron_gull");
    return {
      ...parsed,
      selectedShipId: parsed.selectedShipId ?? ship.id,
      ship,
      crew: parsed.crew ?? [],
      crewChoices: parsed.crewChoices ?? [],
      currentEventId: parsed.currentEventId ?? (parsed.phase === "event" ? "haunted_lighthouse" : null),
      eventResultText: parsed.eventResultText ?? null,
      pendingRemoveHpLoss: parsed.pendingRemoveHpLoss ?? 0,
      battle: parsed.battle
        ? {
            ...parsed.battle,
            nextTurnEnergyBonus: parsed.battle.nextTurnEnergyBonus ?? 0,
            firstAttackBonusUsed: parsed.battle.firstAttackBonusUsed ?? false,
          }
        : null,
    };
  } catch {
    return null;
  }
}

export function clearRun(): void {
  localStorage.removeItem(SAVE_KEY);
}
