import { getShipDefinition } from "../data/ships";
import type { RunState } from "../types/game";
import { normalizeResources } from "./mechanics";

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
    const player = {
      ...parsed.player,
      resources: normalizeResources(parsed.player.resources, ship.resources),
      statusEffects: parsed.player.statusEffects ?? {},
    };
    return {
      ...parsed,
      selectedShipId: parsed.selectedShipId ?? ship.id,
      ship,
      player,
      crew: parsed.crew ?? [],
      crewChoices: parsed.crewChoices ?? [],
      currentEventId: parsed.currentEventId ?? (parsed.phase === "event" ? "haunted_lighthouse" : null),
      eventResultText: parsed.eventResultText ?? null,
      pendingRemoveHpLoss: parsed.pendingRemoveHpLoss ?? 0,
      battle: parsed.battle
        ? {
            ...parsed.battle,
            enemy: {
              ...parsed.battle.enemy,
              resources: parsed.battle.enemy.resources ?? {},
              statusEffects: parsed.battle.enemy.statusEffects ?? {},
            },
            nextTurnEnergyBonus: parsed.battle.nextTurnEnergyBonus ?? 0,
            firstAttackBonusUsed: parsed.battle.firstAttackBonusUsed ?? false,
            activePowers: parsed.battle.activePowers ?? {},
            completedEnemyActionPhaseThresholds: parsed.battle.completedEnemyActionPhaseThresholds ?? [],
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
