import { describe, expect, it } from "vitest";
import { createInitialRun, createCardInstance } from "../../src/game/createInitialRun";
import { endTurn } from "../../src/game/combatEngine";
import { createCombatantState } from "../../src/game/mechanics";
import type { RunState } from "../../src/types/game";

describe("enemy actions", () => {
  it("advances enemy actions and can add Misfire status cards", () => {
    const weakRun = endTurn(withEnemy("saboteur", 0));
    expect(weakRun.battle?.enemyActionIndex).toBe(1);
    expect(weakRun.player.statusEffects.weak).toBe(1);

    const statusCardRun = endTurn({
      ...withEnemy("saboteur", 1),
      battle: {
        ...withEnemy("saboteur", 1).battle!,
        drawPile: ["basic_attack", "basic_defend", "load_cannons", "fire_cannons", "basic_attack"].map((cardId) =>
          createCardInstance(cardId),
        ),
      },
    });

    expect(statusCardRun.battle?.enemyActionIndex).toBe(2);
    expect(statusCardRun.battle?.discardPile.some((card) => card.cardId === "misfire")).toBe(true);
  });

  it("fires a boss phase transition once when its HP threshold is crossed", () => {
    const transitionRun = endTurn({
      ...withEnemy("ghost_frigate", 0),
      battle: {
        ...withEnemy("ghost_frigate", 0).battle!,
        enemy: createCombatantState(50, 100),
      },
      player: {
        ...withEnemy("ghost_frigate", 0).player,
        hp: 75,
        block: 100,
      },
    });

    expect(transitionRun.battle?.completedEnemyActionPhaseThresholds).toEqual([50]);
    expect(transitionRun.battle?.enemy.statusEffects.strength).toBe(3);
    expect(transitionRun.battle?.enemyActionIndex).toBe(0);

    const nextRun = endTurn({
      ...transitionRun,
      player: {
        ...transitionRun.player,
        block: 100,
      },
    });

    expect(nextRun.battle?.completedEnemyActionPhaseThresholds).toEqual([50]);
    expect(nextRun.battle?.enemy.statusEffects.strength).toBe(3);
    expect(nextRun.battle?.enemyActionIndex).toBe(1);
  });
});

function withEnemy(enemyId: string, enemyActionIndex: number): RunState {
  const run = createInitialRun("cannon_ship");
  if (!run.battle) return run;

  return {
    ...run,
    battle: {
      ...run.battle,
      enemyId,
      enemy: createCombatantState(enemyId === "ghost_frigate" ? 100 : 32, enemyId === "ghost_frigate" ? 100 : 32),
      enemyActionIndex,
      hand: [],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      completedEnemyActionPhaseThresholds: [],
    },
  };
}
