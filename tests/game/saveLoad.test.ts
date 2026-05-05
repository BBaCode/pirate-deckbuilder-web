import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialRun } from "../../src/game/createInitialRun";
import { loadRun, saveRun } from "../../src/game/saveLoad";

const SAVE_KEY = "pirate-deckbuilder-run-v1";

describe("save/load", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
    });
  });

  it("round-trips a current run", () => {
    const run = createInitialRun("cannon_ship");

    saveRun(run);
    const loaded = loadRun();

    expect(loaded?.selectedShipId).toBe("cannon_ship");
    expect(loaded?.phase).toBe(run.phase);
    expect(loaded?.player.resources.cannonCharge).toEqual(run.player.resources.cannonCharge);
  });

  it("normalizes older saves with missing newer fields", () => {
    const run = createInitialRun("cannon_ship");
    const legacyRun = {
      ...run,
      crew: undefined,
      crewChoices: undefined,
      currentEventId: undefined,
      eventResultText: undefined,
      pendingRemoveHpLoss: undefined,
      player: {
        ...run.player,
        resources: undefined,
        statusEffects: undefined,
      },
      battle: run.battle
        ? {
            ...run.battle,
            enemy: {
              ...run.battle.enemy,
              resources: undefined,
              statusEffects: undefined,
            },
            nextTurnEnergyBonus: undefined,
            firstAttackBonusUsed: undefined,
            activePowers: undefined,
            completedEnemyActionPhaseThresholds: undefined,
          }
        : null,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(legacyRun));
    const loaded = loadRun();

    expect(loaded?.crew).toEqual([]);
    expect(loaded?.crewChoices).toEqual([]);
    expect(loaded?.player.resources.cannonCharge).toEqual({ value: 0, max: 5 });
    expect(loaded?.player.statusEffects).toEqual({});
    expect(loaded?.battle?.enemy.resources).toEqual({});
    expect(loaded?.battle?.enemy.statusEffects).toEqual({});
    expect(loaded?.battle?.nextTurnEnergyBonus).toBe(0);
    expect(loaded?.battle?.firstAttackBonusUsed).toBe(false);
    expect(loaded?.battle?.activePowers).toEqual({});
    expect(loaded?.battle?.completedEnemyActionPhaseThresholds).toEqual([]);
  });
});
