import { describe, expect, it } from "vitest";
import {
  addStatus,
  applyDamageModifiers,
  createCombatantState,
  updateResource,
} from "../../src/game/mechanics";
import { createInitialRun, createCardInstance } from "../../src/game/createInitialRun";
import { drawCards } from "../../src/game/combatEngine";

describe("mechanics", () => {
  it("keeps Misfire charge disruption inside resource bounds", () => {
    const emptyChargeRun = {
      ...createInitialRun("cannon_ship"),
      battle: {
        ...createInitialRun("cannon_ship").battle!,
        hand: [],
        drawPile: [createCardInstance("misfire")],
        discardPile: [],
      },
      player: {
        ...createInitialRun("cannon_ship").player,
        resources: {
          cannonCharge: { value: 0, max: 5 },
        },
      },
    };

    const atZero = drawCards(emptyChargeRun, 1);
    expect(atZero.player.resources.cannonCharge.value).toBe(0);
    expect(atZero.battle?.hand).toHaveLength(0);
    expect(atZero.battle?.exhaustPile.at(-1)?.cardId).toBe("misfire");

    const chargedRun = {
      ...emptyChargeRun,
      battle: {
        ...emptyChargeRun.battle!,
        drawPile: [createCardInstance("misfire")],
        exhaustPile: [],
      },
      player: updateResource(emptyChargeRun.player, "cannonCharge", 2),
    };

    const disrupted = drawCards(chargedRun, 1);
    expect(disrupted.player.resources.cannonCharge.value).toBe(1);
  });

  it("cancels opposing strength and weak statuses", () => {
    const strengthened = addStatus(createCombatantState(20, 20), "strength", 2);
    const weakened = addStatus(strengthened, "weak", 1);

    expect(weakened.statusEffects).toEqual({ strength: 1 });

    const fullyWeakened = addStatus(weakened, "weak", 2);
    expect(fullyWeakened.statusEffects).toEqual({ weak: 1 });
  });

  it("applies core combat damage modifiers", () => {
    const attacker = {
      ...createCombatantState(20, 20),
      statusEffects: { strength: 2, weak: 1 },
    };
    const target = addStatus(createCombatantState(20, 20), "vulnerable", 1);

    expect(applyDamageModifiers(10, attacker, target)).toBe(14);
  });
});
