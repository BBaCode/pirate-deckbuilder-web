import { getShipDefinition } from "../data/ships";
import type { CardInstance, RunState } from "../types/game";
import { createCombatantState } from "./mechanics";
import { enterCurrentEncounter, generateEncounters } from "./runEngine";

let nextInstanceNumber = 1;

export function createCardInstance(cardId: string, resolvedCardId?: string): CardInstance {
  return {
    cardId: resolvedCardId ?? cardId,
    instanceId: `card-${Date.now()}-${nextInstanceNumber++}`,
  };
}

export function createInitialRun(shipId: string): RunState {
  const ship = getShipDefinition(shipId);
  const seed = Date.now();
  const masterDeck = ship.startingDeck.flatMap((entry) =>
    Array.from({ length: entry.count }, () => createCardInstance(entry.cardId)),
  );

  const run: RunState = {
    version: 1,
    seed,
    phase: "battle",
    encounterIndex: 0,
    encounters: generateEncounters(seed),
    selectedShipId: ship.id,
    ship,
    crew: [],
    player: createCombatantState(ship.maxHp, ship.maxHp, 0, ship.resources),
    masterDeck,
    battle: null,
    rewardChoices: [],
    crewChoices: [],
    currentEventId: null,
    eventResultText: null,
    pendingRemoveHpLoss: 0,
    log: ["The tide turns. Your run begins."],
  };

  return enterCurrentEncounter(run);
}
