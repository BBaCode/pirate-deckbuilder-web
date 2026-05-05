import { describe, expect, it } from "vitest";
import { createInitialRun } from "../../src/game/createInitialRun";
import {
  chooseEventCardReward,
  chooseReward,
  continueAfterEventReward,
  enterCurrentEncounter,
  generateEncounters,
  removeCardAtPort,
  repairAtPort,
  resolveEventChoice,
  skipReward,
  startCardRemoval,
} from "../../src/game/runEngine";
import type { RunState } from "../../src/types/game";

describe("run engine", () => {
  it("keeps the P0 Cannon Ship run on the fixed seven-encounter route", () => {
    expect(generateEncounters(42).map((encounter) => encounter.type)).toEqual([
      "normal",
      "normal",
      "event",
      "normal",
      "elite",
      "port",
      "boss",
    ]);
  });

  it("starts a Cannon Ship run in battle with the expected starter shape", () => {
    const run = createInitialRun("cannon_ship");

    expect(run.phase).toBe("battle");
    expect(run.selectedShipId).toBe("cannon_ship");
    expect(run.player.hp).toBe(75);
    expect(run.masterDeck).toHaveLength(10);
    expect(run.battle?.hand).toHaveLength(5);
    expect(run.player.resources.cannonCharge).toEqual({ value: 2, max: 5 });
  });

  it("advances from rewards when choosing or skipping a card", () => {
    const rewardRun = {
      ...createInitialRun("cannon_ship"),
      phase: "reward",
      battle: null,
      rewardChoices: ["quick_load", "reinforced_hull", "chain_shot"],
      encounters: generateEncounters(42).map((encounter, index) =>
        index === 0 ? { ...encounter, completed: true } : encounter,
      ),
    } satisfies RunState;

    const skipped = skipReward(rewardRun);
    expect(skipped.phase).toBe("battle");
    expect(skipped.encounterIndex).toBe(1);
    expect(skipped.masterDeck).toHaveLength(rewardRun.masterDeck.length);

    const chosen = chooseReward(rewardRun, "quick_load");
    expect(chosen.phase).toBe("battle");
    expect(chosen.encounterIndex).toBe(1);
    expect(chosen.masterDeck).toHaveLength(rewardRun.masterDeck.length + 1);
    expect(chosen.masterDeck.at(-1)?.cardId).toBe("quick_load");
  });

  it("handles the port repair and card removal paths before the boss", () => {
    const portRun = enterCurrentEncounter({
      ...createInitialRun("cannon_ship"),
      phase: "battle",
      battle: null,
      encounterIndex: 5,
      encounters: generateEncounters(42),
      player: {
        ...createInitialRun("cannon_ship").player,
        hp: 40,
      },
    });

    expect(portRun.phase).toBe("port");

    const repaired = repairAtPort(portRun);
    expect(repaired.phase).toBe("battle");
    expect(repaired.encounterIndex).toBe(6);
    expect(repaired.encounters[5].completed).toBe(true);
    expect(repaired.player.hp).toBeGreaterThan(40);

    const removalRun = startCardRemoval(portRun);
    const removedInstanceId = removalRun.masterDeck[0].instanceId;
    const removed = removeCardAtPort(removalRun, removedInstanceId);

    expect(removed.phase).toBe("battle");
    expect(removed.encounterIndex).toBe(6);
    expect(removed.encounters[5].completed).toBe(true);
    expect(removed.masterDeck.some((card) => card.instanceId === removedInstanceId)).toBe(false);
    expect(removed.masterDeck).toHaveLength(portRun.masterDeck.length - 1);
  });

  it("progresses event choices through reward, card choice, and direct advance paths", () => {
    const baseEventRun = toEventRun("treasure_map");

    const gainedCard = resolveEventChoice(baseEventRun, "follow_map");
    expect(gainedCard.phase).toBe("eventReward");
    expect(gainedCard.encounters[2].completed).toBe(true);
    expect(gainedCard.rewardChoices).toHaveLength(1);

    const afterEventReward = continueAfterEventReward(gainedCard);
    expect(afterEventReward.phase).toBe("battle");
    expect(afterEventReward.encounterIndex).toBe(3);

    const cardChoice = resolveEventChoice(baseEventRun, "sell_map");
    expect(cardChoice.phase).toBe("eventCardReward");
    expect(cardChoice.rewardChoices).toHaveLength(2);

    const chosenEventCard = chooseEventCardReward(cardChoice, cardChoice.rewardChoices[0]);
    expect(chosenEventCard.phase).toBe("battle");
    expect(chosenEventCard.encounterIndex).toBe(3);
    expect(chosenEventCard.masterDeck).toHaveLength(baseEventRun.masterDeck.length + 1);

    const healed = resolveEventChoice(toEventRun("mutiny_brewing", 50), "give_speech");
    expect(healed.phase).toBe("battle");
    expect(healed.encounterIndex).toBe(3);
    expect(healed.player.hp).toBe(56);
  });
});

function toEventRun(eventId: string, hp = 75): RunState {
  return {
    ...createInitialRun("cannon_ship"),
    phase: "event",
    battle: null,
    encounterIndex: 2,
    encounters: generateEncounters(42),
    currentEventId: eventId,
    player: {
      ...createInitialRun("cannon_ship").player,
      hp,
    },
  };
}
