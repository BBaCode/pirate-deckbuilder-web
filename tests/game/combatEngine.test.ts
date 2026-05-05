import { describe, expect, it } from "vitest";
import { createInitialRun, createCardInstance } from "../../src/game/createInitialRun";
import { playCard, endTurn } from "../../src/game/combatEngine";
import type { RunState } from "../../src/types/game";

describe("combat engine", () => {
  it("loads Cannon Charge without exceeding the resource cap", () => {
    const run = withHand(createInitialRun("cannon_ship"), ["load_cannons"]);
    const loaded = playCard(run, run.battle!.hand[0].instanceId);

    expect(loaded.player.resources.cannonCharge.value).toBe(4);

    const nearlyFull = {
      ...withHand(createInitialRun("cannon_ship"), ["load_cannons"]),
      player: {
        ...run.player,
        resources: {
          cannonCharge: { value: 4, max: 5 },
        },
      },
    };
    const capped = playCard(nearlyFull, nearlyFull.battle!.hand[0].instanceId);

    expect(capped.player.resources.cannonCharge.value).toBe(5);
  });

  it("fires cannons by spending all Cannon Charge for scaled damage", () => {
    const baseRun = withHand(createInitialRun("cannon_ship"), ["fire_cannons"]);
    const run = {
      ...baseRun,
      player: {
        ...baseRun.player,
        resources: {
          cannonCharge: { value: 3, max: 5 },
        },
      },
    };
    const startingEnemyHp = run.battle!.enemy.hp;
    const fired = playCard(run, run.battle!.hand[0].instanceId);

    expect(fired.player.resources.cannonCharge.value).toBe(0);
    expect(fired.battle?.enemy.hp).toBe(startingEnemyHp - 12);
  });

  it("advances turns through the enemy action and draws a fresh hand", () => {
    const baseRun = withHand(createInitialRun("cannon_ship"), []);
    const run = {
      ...baseRun,
      battle: {
        ...baseRun.battle!,
        drawPile: ["basic_attack", "basic_defend", "load_cannons", "fire_cannons", "basic_attack"].map((cardId) =>
          createCardInstance(cardId),
        ),
      },
    };
    const nextTurn = endTurn(run);

    expect(nextTurn.phase).toBe("battle");
    expect(nextTurn.battle?.turn).toBe(2);
    expect(nextTurn.battle?.energy).toBe(3);
    expect(nextTurn.battle?.hand).toHaveLength(5);
  });

  it("moves to rewards when a non-boss battle is won", () => {
    const run = withHand(createInitialRun("cannon_ship"), ["basic_attack"]);
    const nearDefeat = {
      ...run,
      battle: {
        ...run.battle!,
        enemy: {
          ...run.battle!.enemy,
          hp: 1,
          block: 0,
        },
      },
    };
    const won = playCard(nearDefeat, nearDefeat.battle.hand[0].instanceId);

    expect(won.phase).toBe("reward");
    expect(won.battle).toBeNull();
    expect(won.encounters[0].completed).toBe(true);
    expect(won.rewardChoices.length).toBeGreaterThan(0);
  });
});

function withHand(run: RunState, cardIds: string[]): RunState {
  if (!run.battle) return run;

  return {
    ...run,
    battle: {
      ...run.battle,
      energy: 3,
      hand: cardIds.map((cardId) => createCardInstance(cardId)),
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
    },
  };
}
