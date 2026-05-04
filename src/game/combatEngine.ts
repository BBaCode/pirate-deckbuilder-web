import { cards } from "../data/cards";
import { enemiesById } from "../data/enemies";
import { powers } from "../data/powers";
import type { BattleState, CardEffect, EnemyAction, EnemyDefinition, RunState } from "../types/game";
import {
  getBattleStartCrewBonuses,
  getBattleWonHeal,
  getCardPlayedCrewDamage,
  getTurnStartCrewBonuses,
} from "./crewEngine";
import { createCardInstance } from "./createInitialRun";
import {
  addStatus,
  applyDamageModifiers,
  consumeAllResource,
  createCombatantState,
  getResourceAmount,
  isConditionMet,
  reduceStatuses,
  resetResources,
  updateResource,
} from "./mechanics";
import { createBattleRewardChoices } from "./rewardEngine";

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function getCurrentEnemy(run: RunState) {
  const encounter = run.encounters[run.encounterIndex];
  const enemyId = run.battle?.enemyId ?? encounter?.enemyId;
  if (!enemyId) throw new Error("Current encounter does not have an enemy.");
  return enemiesById[enemyId];
}

export function getEnemyIntent(run: RunState): EnemyAction | null {
  if (!run.battle) return null;
  const enemy = getCurrentEnemy(run);
  return getEnemyAction(enemy, run.battle);
}

export function describeEnemyIntent(run: RunState): string | null {
  if (!run.battle) return null;
  return describeEnemyAction(getEnemyAction(getCurrentEnemy(run), run.battle), run);
}

export function startBattle(run: RunState, encounterIndex: number): RunState {
  const encounter = run.encounters[encounterIndex];
  if (!encounter.enemyId) throw new Error("Cannot start a battle without an enemy.");

  const enemyDefinition = enemiesById[encounter.enemyId];
  const crewStartBonuses = getBattleStartCrewBonuses(run);
  const battle: BattleState = {
    enemyId: enemyDefinition.id,
    enemy: createCombatantState(
      Math.max(1, enemyDefinition.maxHp - crewStartBonuses.enemyHpLoss),
      enemyDefinition.maxHp,
    ),
    enemyActionIndex: 0,
    energy: 3 + crewStartBonuses.energy,
    drawPile: shuffle(run.masterDeck),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    nextTurnEnergyBonus: 0,
    firstAttackBonusUsed: false,
    activePowers: {},
    turn: 1,
  };

  const withBattle = applyTurnStartCrewEffects(
    applyBattleStartPassive({
    ...run,
    phase: "battle",
    encounterIndex,
    battle,
    player: {
      ...run.player,
      block: 0,
      resources: resetResources(run.player.resources, run.ship.resources),
      statusEffects: {},
    },
    rewardChoices: [],
    crewChoices: [],
    currentEventId: null,
    eventResultText: null,
    pendingRemoveHpLoss: 0,
    log: [`Encounter ${encounterIndex + 1}: ${enemyDefinition.name} off the bow!`, ...run.log].slice(0, 12),
    }),
    true,
  );

  return drawCards(withBattle, getStartingHandSize(withBattle) + crewStartBonuses.extraDraw);
}

export function drawCards(run: RunState, count: number): RunState {
  if (!run.battle) return run;

  let nextRunBase = run;
  let battle = { ...run.battle };
  let log = run.log;

  for (let drawn = 0; drawn < count; drawn += 1) {
    // When the draw pile runs dry, the discard pile becomes a freshly shuffled draw pile.
    if (battle.drawPile.length === 0) {
      if (battle.discardPile.length === 0) break;
      battle = {
        ...battle,
        drawPile: shuffle(battle.discardPile),
        discardPile: [],
      };
      log = ["The crew reshuffles the hold.", ...log].slice(0, 12);
    }

    const [nextCard, ...remainingDrawPile] = battle.drawPile;
    battle = {
      ...battle,
      drawPile: remainingDrawPile,
    };

    const cardDefinition = cards[nextCard.cardId];
    if (cardDefinition.onDrawEffects?.length) {
      let nextRun: RunState = {
        ...nextRunBase,
        battle: {
          ...battle,
          exhaustPile: [...battle.exhaustPile, nextCard],
        },
        log,
      };
      for (const effect of cardDefinition.onDrawEffects) {
        nextRun = applyCardEffect(nextRun, effect);
      }
      nextRunBase = nextRun;
      battle = nextRun.battle ?? battle;
      log = [`${cardDefinition.name} triggers: ${cardDefinition.description}`, ...nextRun.log].slice(0, 12);
    } else {
      battle = {
        ...battle,
        hand: [...battle.hand, nextCard],
      };
    }
  }

  return { ...nextRunBase, battle, log };
}

export function playCard(run: RunState, cardInstanceId: string): RunState {
  if (run.phase !== "battle" || !run.battle) return run;

  const cardInstance = run.battle.hand.find((card) => card.instanceId === cardInstanceId);
  if (!cardInstance) return run;

  const card = cards[cardInstance.cardId];
  if (card.unplayable) return withLog(run, `${card.name} cannot be played.`);
  if (card.cost > run.battle.energy) return withLog(run, `Not enough wind for ${card.name}.`);

  let nextRun: RunState = {
    ...run,
    battle: {
      ...run.battle,
      energy: run.battle.energy - card.cost,
      hand: run.battle.hand.filter((cardInHand) => cardInHand.instanceId !== cardInstanceId),
    },
  };

  for (const effect of card.effects) {
    nextRun = applyCardEffect(nextRun, effect);
  }

  nextRun = applyCardPlayedBonuses(nextRun, card);
  nextRun = movePlayedCardToPile(nextRun, cardInstance);

  nextRun = withLog(nextRun, `${card.name}: ${card.description}`);
  return checkBattleEnd(nextRun);
}

export function endTurn(run: RunState): RunState {
  if (run.phase !== "battle" || !run.battle) return run;

  let nextRun: RunState = applyEndTurnPowers(run);

  nextRun = {
    ...run,
    ...nextRun,
    player: reduceStatuses(nextRun.player),
    battle: {
      ...nextRun.battle!,
      enemy: { ...nextRun.battle!.enemy, block: 0 },
      discardPile: [...nextRun.battle!.discardPile, ...nextRun.battle!.hand],
      hand: [],
    },
  };

  nextRun = performEnemyAction(nextRun);
  nextRun = checkBattleEnd(nextRun);
  if (nextRun.phase !== "battle" || !nextRun.battle) return nextRun;

  nextRun = {
    ...nextRun,
    player: { ...nextRun.player, block: 0 },
    battle: {
      ...nextRun.battle,
      enemy: reduceStatuses(nextRun.battle.enemy),
      energy: 3 + nextRun.battle.nextTurnEnergyBonus,
      nextTurnEnergyBonus: 0,
      firstAttackBonusUsed: false,
      turn: nextRun.battle.turn + 1,
    },
  };

  nextRun = applyTurnStartCrewEffects(nextRun, false);

  return drawCards(nextRun, 5);
}

function applyBattleStartPassive(run: RunState): RunState {
  if (run.ship.passive.type === "battleStartResource") {
    return {
      ...withLog(run, `${run.ship.name} starts with ${run.ship.passive.amount} ${run.ship.passive.resourceId}.`),
      player: updateResource(run.player, run.ship.passive.resourceId, run.ship.passive.amount),
    };
  }

  if (run.ship.passive.type !== "battleStartBlock") return run;
  if (run.ship.passive.amount <= 0) return run;

  return {
    ...withLog(run, `${run.ship.name} braces for ${run.ship.passive.amount} block.`),
    player: {
      ...run.player,
      block: run.player.block + run.ship.passive.amount,
    },
  };
}

function getStartingHandSize(run: RunState): number {
  if (run.ship.passive.type !== "firstTurnDraw") return 5;
  return 5 + run.ship.passive.amount;
}

function applyCardPlayedBonuses(run: RunState, card: (typeof cards)[string]): RunState {
  if (!run.battle) return run;

  const isFirstAttack = card.tags.includes("attack") && !run.battle.firstAttackBonusUsed;
  const shipDamage = getShipFirstAttackDamage(run, isFirstAttack);
  const crewDamage = getCardPlayedCrewDamage(run, card, isFirstAttack);
  const totalDamage = shipDamage + crewDamage;

  if (totalDamage <= 0) return run;

  return {
    ...withLog(run, `Passive bonuses add ${totalDamage} damage.`),
    battle: {
      ...run.battle,
      enemy: dealDamage(run.battle.enemy, applyDamageModifiers(totalDamage, run.player, run.battle.enemy)),
      firstAttackBonusUsed: card.tags.includes("attack") ? true : run.battle.firstAttackBonusUsed,
    },
  };
}

function getShipFirstAttackDamage(run: RunState, isFirstAttack: boolean): number {
  if (!isFirstAttack || run.ship.passive.type !== "firstAttackBonus") return 0;
  return run.ship.passive.amount;
}

function applyTurnStartCrewEffects(run: RunState, isFirstTurn: boolean): RunState {
  if (!run.battle) return run;

  const bonuses = getTurnStartCrewBonuses(run, isFirstTurn);
  const withStats: RunState = {
    ...run,
    player: {
      ...run.player,
      block: run.player.block + bonuses.block,
    },
    battle: {
      ...run.battle,
      energy: run.battle.energy + bonuses.energy,
    },
  };

  return bonuses.draw > 0 ? drawCards(withStats, bonuses.draw) : withStats;
}

export function restartRun(createInitialRun: () => RunState): RunState {
  return createInitialRun();
}

function applyCardEffect(run: RunState, effect: CardEffect): RunState {
  if (!run.battle) return run;

  if (effect.type === "damage") {
    const hits = effect.hits ?? 1;
    const scaled = resolveScaledDamage(run, effect);
    let nextRun = scaled.run;
    let enemy = run.battle.enemy;
    for (let hit = 0; hit < hits; hit += 1) {
      const damage = applyDamageModifiers(scaled.amount, nextRun.player, enemy);
      enemy = dealDamage(enemy, damage);
    }
    return {
      ...nextRun,
      battle: { ...nextRun.battle!, enemy },
    };
  }

  if (effect.type === "block") {
    return {
      ...run,
      player: {
        ...run.player,
        block: run.player.block + effect.amount,
      },
    };
  }

  if (effect.type === "heal") {
    return {
      ...run,
      player: {
        ...run.player,
        hp: Math.min(run.player.maxHp, run.player.hp + effect.amount),
      },
    };
  }

  if (effect.type === "draw") {
    return drawCards(run, effect.amount);
  }

  if (effect.type === "energy") {
    return {
      ...run,
      battle: {
        ...run.battle,
        energy: run.battle.energy + effect.amount,
      },
    };
  }

  if (effect.type === "nextTurnEnergy") {
    return {
      ...run,
      battle: {
        ...run.battle,
        nextTurnEnergyBonus: run.battle.nextTurnEnergyBonus + effect.amount,
      },
    };
  }

  if (effect.type === "loseHp") {
    return {
      ...run,
      player: {
        ...run.player,
        hp: Math.max(0, run.player.hp - effect.amount),
      },
    };
  }

  if (effect.type === "resource") {
    return {
      ...run,
      player: updateResource(run.player, effect.resourceId, effect.amount),
    };
  }

  if (effect.type === "applyStatus") {
    if (effect.target === "player") {
      return {
        ...run,
        player: addStatus(run.player, effect.statusId, effect.amount),
      };
    }

    return {
      ...run,
      battle: {
        ...run.battle,
        enemy: addStatus(run.battle.enemy, effect.statusId, effect.amount),
      },
    };
  }

  if (effect.type === "conditional") {
    if (!isConditionMet(run.player, effect.condition)) return run;
    return effect.effects.reduce((nextRun, nestedEffect) => applyCardEffect(nextRun, nestedEffect), run);
  }

  if (effect.type === "activatePower") {
    return {
      ...run,
      battle: {
        ...run.battle,
        activePowers: {
          ...run.battle.activePowers,
          [effect.powerId]: (run.battle.activePowers[effect.powerId] ?? 0) + 1,
        },
      },
    };
  }

  return {
    ...run,
    battle: {
      ...run.battle,
      enemy: {
        ...run.battle.enemy,
        block: Math.max(0, run.battle.enemy.block - effect.amount),
      },
    },
  };
}

function resolveScaledDamage(
  run: RunState,
  effect: Extract<CardEffect, { type: "damage" }>,
): { run: RunState; amount: number } {
  let amount = effect.amount;
  let nextRun = run;

  for (const scaling of effect.scaling ?? []) {
    if (scaling.type === "resource") {
      const resourceAmount = getResourceAmount(nextRun.player, scaling.resourceId);
      amount += resourceAmount * scaling.multiplier;
      if (scaling.consume === "all") {
        const consumed = consumeAllResource(nextRun.player, scaling.resourceId);
        nextRun = { ...nextRun, player: consumed.combatant };
      }
    }
  }

  return { run: nextRun, amount };
}

function movePlayedCardToPile(run: RunState, cardInstance: { instanceId: string; cardId: string }): RunState {
  if (!run.battle) return run;
  const card = cards[cardInstance.cardId];
  if (card.tags.includes("power")) {
    return {
      ...run,
      battle: {
        ...run.battle,
        exhaustPile: [...run.battle.exhaustPile, cardInstance],
      },
    };
  }

  return {
    ...run,
    battle: {
      ...run.battle,
      discardPile: [...run.battle.discardPile, cardInstance],
    },
  };
}

function applyEndTurnPowers(run: RunState): RunState {
  if (!run.battle) return run;

  return Object.entries(run.battle.activePowers).reduce((nextRun, [powerId, stacks]) => {
    const power = powers[powerId];
    if (!power) return nextRun;

    let poweredRun = nextRun;
    for (let stack = 0; stack < stacks; stack += 1) {
      poweredRun = power.endTurnEffects.reduce(
        (effectRun, effect) => applyCardEffect(effectRun, effect),
        poweredRun,
      );
    }

    return withLog(poweredRun, `${power.name} adds momentum.`);
  }, run);
}

function performEnemyAction(run: RunState): RunState {
  if (!run.battle) return run;

  const enemyDefinition = getCurrentEnemy(run);
  const action = getEnemyAction(enemyDefinition, run.battle);
  let nextRun = run;

  if (action.type === "attack") {
    nextRun = enemyAttack(nextRun, action.amount, action.hits ?? 1);
  } else if (action.type === "block") {
    nextRun = enemyBlock(nextRun, action.amount);
  } else if (action.type === "attackBlock") {
    nextRun = enemyAttack(nextRun, action.attack, 1);
    nextRun = enemyBlock(nextRun, action.block);
  } else if (action.type === "applyStatus") {
    if (action.target === "self") {
      if (!nextRun.battle) return nextRun;
      nextRun = {
        ...nextRun,
        battle: {
          ...nextRun.battle,
          enemy: addStatus(nextRun.battle.enemy, action.statusId, action.amount),
        },
      };
    } else {
      nextRun = {
        ...nextRun,
        player: addStatus(nextRun.player, action.statusId, action.amount),
      };
    }
  } else {
    if (!nextRun.battle) return nextRun;
    const statusCards = Array.from({ length: action.count }, () => createCardInstance(action.cardId));
    nextRun = {
      ...nextRun,
      battle: {
        ...nextRun.battle,
        discardPile: [...nextRun.battle.discardPile, ...statusCards],
      },
    };
  }

  return {
    ...withLog(nextRun, `${enemyDefinition.name} ${describeEnemyAction(action).toLowerCase()}.`),
    battle: nextRun.battle
      ? {
          ...nextRun.battle,
          enemyActionIndex: nextRun.battle.enemyActionIndex + 1,
        }
      : null,
  };
}

function enemyAttack(run: RunState, amount: number, hits: number): RunState {
  let player = run.player;
  for (let hit = 0; hit < hits; hit += 1) {
    const damage = run.battle ? applyDamageModifiers(amount, run.battle.enemy, player) : amount;
    player = dealDamage(player, damage);
  }
  return { ...run, player };
}

function enemyBlock(run: RunState, amount: number): RunState {
  if (!run.battle) return run;
  return {
    ...run,
    battle: {
      ...run.battle,
      enemy: {
        ...run.battle.enemy,
        block: run.battle.enemy.block + amount,
      },
    },
  };
}

function dealDamage<T extends { hp: number; block: number }>(target: T, amount: number): T {
  const blockedDamage = Math.min(target.block, amount);
  const unblockedDamage = amount - blockedDamage;
  return {
    ...target,
    block: target.block - blockedDamage,
    hp: Math.max(0, target.hp - unblockedDamage),
  };
}

function checkBattleEnd(run: RunState): RunState {
  if (!run.battle) return run;

  if (run.player.hp <= 0) {
    return {
      ...withLog(run, "Your ship slips beneath the waves."),
      phase: "defeat",
      battle: null,
    };
  }

  if (run.battle.enemy.hp <= 0) {
    const completedRun = applyBattleWonCrewEffects(markCurrentEncounterComplete(run));
    const currentEncounter = run.encounters[run.encounterIndex];
    if (currentEncounter.type === "boss") {
      return {
        ...withLog(completedRun, "The final enemy fades into sea mist."),
        phase: "victory",
        battle: null,
      };
    }

    return {
      ...withLog(completedRun, "Victory! Choose a card for the voyage ahead."),
      phase: "reward",
      battle: null,
      rewardChoices: createBattleRewardChoices(completedRun),
    };
  }

  return run;
}

function applyBattleWonCrewEffects(run: RunState): RunState {
  const heal = getBattleWonHeal(run);
  if (heal <= 0) return run;

  return {
    ...withLog(run, `Your crew patches ${heal} HP after the battle.`),
    player: {
      ...run.player,
      hp: Math.min(run.player.maxHp, run.player.hp + heal),
    },
  };
}

function withLog(run: RunState, message: string): RunState {
  return {
    ...run,
    log: [message, ...run.log].slice(0, 12),
  };
}

function markCurrentEncounterComplete(run: RunState): RunState {
  return {
    ...run,
    encounters: run.encounters.map((encounter, index) =>
      index === run.encounterIndex ? { ...encounter, completed: true } : encounter,
    ),
  };
}

function getEnemyAction(enemy: EnemyDefinition, battle: BattleState): EnemyAction {
  const actions = getEnemyActions(enemy, battle);
  return actions[battle.enemyActionIndex % actions.length];
}

function getEnemyActions(enemy: EnemyDefinition, battle: BattleState): EnemyAction[] {
  const matchingPhase = [...(enemy.actionPhases ?? [])]
    .sort((left, right) => left.hpAtOrBelow - right.hpAtOrBelow)
    .find((phase) => battle.enemy.hp <= phase.hpAtOrBelow);

  return matchingPhase?.actions ?? enemy.actions;
}

export function describeEnemyAction(action: EnemyAction, run?: RunState): string {
  if (action.type === "attack") {
    const hits = action.hits && action.hits > 1 ? ` x ${action.hits}` : "";
    const amount = getIntentAttackAmount(action.amount, run);
    return `Attacks for ${amount}${hits}`;
  }
  if (action.type === "block") return `Gains ${action.amount} block`;
  if (action.type === "attackBlock") {
    return `Attacks for ${getIntentAttackAmount(action.attack, run)} and gains ${action.block} block`;
  }
  if (action.type === "applyStatus" && action.target === "self") return `Gains ${action.amount} ${action.statusId}`;
  if (action.type === "applyStatus") return `Applies ${action.amount} ${action.statusId}`;
  return `Adds ${action.count} ${cards[action.cardId]?.name ?? "status card"}`;
}

function getIntentAttackAmount(amount: number, run?: RunState): number {
  if (!run?.battle) return amount;
  return applyDamageModifiers(amount, run.battle.enemy, run.player);
}
