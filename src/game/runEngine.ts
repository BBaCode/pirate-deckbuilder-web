import { events } from "../data/events";
import { bossEnemyIds, eliteEnemyIds, normalEnemyIds } from "../data/enemies";
import type { CardInstance, Encounter, EncounterType, EventChoiceEffect, RunState } from "../types/game";
import { startBattle } from "./combatEngine";
import { addCrewMate, generateCrewReward, getAvailableCrew, getPortHealBonus } from "./crewEngine";
import { createEventCardChoices } from "./rewardEngine";

const RUN_LENGTH = 7;
const ENCOUNTER_SEQUENCE: EncounterType[] = ["normal", "normal", "event", "normal", "elite", "port", "boss"];

export function generateEncounters(seed: number): Encounter[] {
  const bossId = pickOne(bossEnemyIds);
  let normalCursor = Math.abs(seed) % normalEnemyIds.length;
  let eliteCursor = Math.abs(seed + 1) % eliteEnemyIds.length;

  return ENCOUNTER_SEQUENCE.map((type, index) => {
    let enemyId: string | undefined;

    if (type === "normal") {
      enemyId = normalEnemyIds[normalCursor % normalEnemyIds.length];
      normalCursor += 1;
    }

    if (type === "elite") {
      enemyId = eliteEnemyIds[eliteCursor % eliteEnemyIds.length];
      eliteCursor += 1;
    }

    if (type === "boss") {
      enemyId = bossId;
    }

    return {
      id: `encounter-${index + 1}-${type}`,
      type,
      enemyId,
      completed: false,
    };
  });
}

export function enterCurrentEncounter(run: RunState): RunState {
  const encounter = run.encounters[run.encounterIndex];

  if (!encounter) {
    return { ...run, phase: "victory", battle: null };
  }

  if (encounter.type === "normal" || encounter.type === "elite" || encounter.type === "boss") {
    return startBattle(run, run.encounterIndex);
  }

  if (encounter.type === "port") {
    return {
      ...withLog(run, "You dock at a friendly port."),
      phase: "port",
      battle: null,
      rewardChoices: [],
      crewChoices: [],
      currentEventId: null,
      eventResultText: null,
      pendingRemoveHpLoss: 0,
      player: { ...run.player, block: 0 },
    };
  }

  const event = pickOne(events);
  return {
    ...withLog(run, `${event.name} appears on the horizon.`),
    phase: "event",
    battle: null,
    rewardChoices: [],
    crewChoices: [],
    currentEventId: event.id,
    eventResultText: null,
    pendingRemoveHpLoss: 0,
    player: { ...run.player, block: 0 },
  };
}

export function markCurrentEncounterComplete(run: RunState): RunState {
  return {
    ...run,
    encounters: run.encounters.map((encounter, index) =>
      index === run.encounterIndex ? { ...encounter, completed: true } : encounter,
    ),
  };
}

export function advanceToNextEncounter(run: RunState): RunState {
  const nextRun = {
    ...run,
    encounterIndex: run.encounterIndex + 1,
    battle: null,
    rewardChoices: [],
    crewChoices: [],
    currentEventId: null,
    eventResultText: null,
    pendingRemoveHpLoss: 0,
  };

  if (nextRun.encounterIndex >= RUN_LENGTH) {
    return { ...nextRun, phase: "victory" };
  }

  return enterCurrentEncounter(nextRun);
}

export function chooseReward(run: RunState, cardId: string): RunState {
  if (run.phase !== "reward" || !run.rewardChoices.includes(cardId)) return run;

  const nextRun = withLog(
    {
      ...run,
      masterDeck: [...run.masterDeck, createCardInstance("reward", cardId)],
      rewardChoices: [],
    },
    "New plunder joins the deck.",
  );

  return advanceToNextEncounter(nextRun);
}

export function skipReward(run: RunState): RunState {
  if (run.phase !== "reward") return run;

  return advanceToNextEncounter(
    withLog(
      {
        ...run,
        rewardChoices: [],
      },
      "You leave the extra cargo behind.",
    ),
  );
}

export function repairAtPort(run: RunState): RunState {
  if (run.phase !== "port") return run;

  const amount = Math.ceil(run.player.maxHp * 0.25) + getPortHealBonus(run);
  const repaired = withLog(
    {
      ...markCurrentEncounterComplete(run),
      player: {
        ...run.player,
        hp: Math.min(run.player.maxHp, run.player.hp + amount),
      },
    },
    `The shipwright repairs ${amount} hull.`,
  );

  return advanceToNextEncounter(repaired);
}

export function startCrewRecruitment(run: RunState): RunState {
  if (run.phase !== "port" && run.phase !== "event") return run;

  const crewChoices = generateCrewReward(run, 1);
  if (crewChoices.length === 0) {
    return healSmallAndAdvance(run, "No available crew answered the call, so the supplies go to repairs.");
  }

  return {
    ...run,
    phase: "crewReward",
    crewChoices,
  };
}

export function chooseCrew(run: RunState, crewId: string): RunState {
  if (run.phase !== "crewReward" || !run.crewChoices.includes(crewId)) return run;

  const recruited = withLog(addCrewMate(markCurrentEncounterComplete(run), crewId), run.eventResultText ?? "A new crew mate joins the voyage.");
  return advanceToNextEncounter(recruited);
}

export function startCardRemoval(run: RunState): RunState {
  if (run.phase !== "port") return run;
  return { ...run, phase: "removeCard" };
}

export function removeCardAtPort(run: RunState, instanceId: string): RunState {
  if (run.phase !== "removeCard") return run;

  const removedCard = run.masterDeck.find((card) => card.instanceId === instanceId);
  if (!removedCard) return run;

  const nextRun = withLog(
    {
      ...markCurrentEncounterComplete(run),
      masterDeck: run.masterDeck.filter((card) => card.instanceId !== instanceId),
      player: {
        ...run.player,
        hp: Math.max(0, run.player.hp - run.pendingRemoveHpLoss),
      },
      pendingRemoveHpLoss: 0,
    },
    run.eventResultText ?? "A card is tossed overboard.",
  );

  return advanceToNextEncounter(nextRun);
}

export function resolveEventChoice(run: RunState, choiceId: string): RunState {
  if (run.phase !== "event") return run;

  const event = events.find((item) => item.id === run.currentEventId);
  const choice = event?.choices.find((item) => item.id === choiceId);
  if (!choice) return run;

  return applyEventEffect(run, choice.effect);
}

export function chooseEventCardReward(run: RunState, cardId: string): RunState {
  if (run.phase !== "eventCardReward" || !run.rewardChoices.includes(cardId)) return run;

  const nextRun = withLog(
    {
      ...markCurrentEncounterComplete(run),
      masterDeck: [...run.masterDeck, createCardInstance("event", cardId)],
      rewardChoices: [],
    },
    run.eventResultText ?? "A card joins the deck.",
  );

  return advanceToNextEncounter(nextRun);
}

function applyEventEffect(run: RunState, effect: EventChoiceEffect): RunState {
  if (effect.type === "gainCard") {
    const cardId = createEventCardChoices(run, { count: 1, rarity: effect.rarity, tags: effect.tags })[0];
    if (!cardId) return healSmallAndAdvance(run, "No suitable card was found, so the crew repairs 5 HP.");

    const withCost = applyHpLoss(run, effect.hpLoss ?? 0);
    if (withCost.player.hp <= 0) return { ...withCost, phase: "defeat", battle: null };

    return withLog(
      {
        ...markCurrentEncounterComplete(withCost),
        phase: "eventReward",
        masterDeck: [...withCost.masterDeck, createCardInstance("event", cardId)],
        rewardChoices: [cardId],
        eventResultText: effect.resultText,
      },
      effect.resultText,
    );
  }

  if (effect.type === "cardChoice") {
    const rewardChoices = createEventCardChoices(run, { count: effect.count, rarity: effect.rarity, tags: effect.tags });
    if (rewardChoices.length === 0) return healSmallAndAdvance(run, "No suitable card was found, so the crew repairs 5 HP.");

    return {
      ...run,
      phase: "eventCardReward",
      rewardChoices,
      eventResultText: effect.resultText,
    };
  }

  if (effect.type === "heal") {
    return advanceToNextEncounter(
      withLog(
        {
          ...markCurrentEncounterComplete(run),
          player: {
            ...run.player,
            hp: Math.min(run.player.maxHp, run.player.hp + effect.amount),
          },
        },
        effect.resultText,
      ),
    );
  }

  if (effect.type === "removeCard") {
    const withCost = applyHpLoss(run, effect.hpLoss ?? 0);
    if (withCost.player.hp <= 0) return { ...withCost, phase: "defeat", battle: null };

    return {
      ...withCost,
      phase: "removeCard",
      pendingRemoveHpLoss: 0,
      eventResultText: effect.resultText,
    };
  }

  if (effect.type === "crewOrHeal") {
    if (getAvailableCrew(run).length > 0) {
      return { ...run, phase: "crewReward", crewChoices: generateCrewReward(run, 1), eventResultText: effect.resultText };
    }
    return healSmallAndAdvance(run, effect.fallbackText, effect.healAmount);
  }

  if (getAvailableCrew(run).length > 0) {
    return { ...run, phase: "crewReward", crewChoices: generateCrewReward(run, 1), eventResultText: effect.resultText };
  }

  const cardId = createEventCardChoices(run, { count: 1, rarity: effect.rarity, tags: effect.tags })[0];
  if (!cardId) return healSmallAndAdvance(run, "No reward was found, so the crew repairs 5 HP.");

  return withLog(
    {
      ...markCurrentEncounterComplete(run),
      phase: "eventReward",
      masterDeck: [...run.masterDeck, createCardInstance("event", cardId)],
      rewardChoices: [cardId],
      eventResultText: effect.fallbackText,
    },
    effect.fallbackText,
  );
}

export function continueAfterEventReward(run: RunState): RunState {
  if (run.phase !== "eventReward") return run;
  return advanceToNextEncounter({ ...run, rewardChoices: [] });
}

export function createCardInstance(source: string, cardId: string): CardInstance {
  return {
    cardId,
    instanceId: `${source}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function withLog(run: RunState, message: string): RunState {
  return {
    ...run,
    log: [message, ...run.log].slice(0, 12),
  };
}

function healSmallAndAdvance(run: RunState, message: string, amount = 5): RunState {
  return advanceToNextEncounter(
    withLog(
      {
        ...markCurrentEncounterComplete(run),
        player: {
          ...run.player,
          hp: Math.min(run.player.maxHp, run.player.hp + amount),
        },
      },
      message,
    ),
  );
}

function applyHpLoss(run: RunState, amount: number): RunState {
  if (amount <= 0) return run;
  return {
    ...run,
    player: {
      ...run.player,
      hp: Math.max(0, run.player.hp - amount),
    },
  };
}
