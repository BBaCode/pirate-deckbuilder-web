import { cards } from "../data/cards";
import { enemiesById } from "../data/enemies";
import type { BattleState, CardEffect, EnemyAction, RunState } from "../types/game";
import {
  getBattleStartCrewBonuses,
  getBattleWonHeal,
  getCardPlayedCrewDamage,
  getTurnStartCrewBonuses,
} from "./crewEngine";
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
  return enemy.actions[run.battle.enemyActionIndex % enemy.actions.length];
}

export function startBattle(run: RunState, encounterIndex: number): RunState {
  const encounter = run.encounters[encounterIndex];
  if (!encounter.enemyId) throw new Error("Cannot start a battle without an enemy.");

  const enemyDefinition = enemiesById[encounter.enemyId];
  const crewStartBonuses = getBattleStartCrewBonuses(run);
  const battle: BattleState = {
    enemyId: enemyDefinition.id,
    enemy: {
      hp: Math.max(1, enemyDefinition.maxHp - crewStartBonuses.enemyHpLoss),
      maxHp: enemyDefinition.maxHp,
      block: 0,
    },
    enemyActionIndex: 0,
    energy: 3 + crewStartBonuses.energy,
    drawPile: shuffle(run.masterDeck),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    nextTurnEnergyBonus: 0,
    firstAttackBonusUsed: false,
    turn: 1,
  };

  const withBattle = applyTurnStartCrewEffects(
    applyBattleStartPassive({
    ...run,
    phase: "battle",
    encounterIndex,
    battle,
    player: { ...run.player, block: 0 },
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
      hand: [...battle.hand, nextCard],
    };
  }

  return { ...run, battle, log };
}

export function playCard(run: RunState, cardInstanceId: string): RunState {
  if (run.phase !== "battle" || !run.battle) return run;

  const cardInstance = run.battle.hand.find((card) => card.instanceId === cardInstanceId);
  if (!cardInstance) return run;

  const card = cards[cardInstance.cardId];
  if (card.cost > run.battle.energy) return withLog(run, `Not enough wind for ${card.name}.`);

  let nextRun: RunState = {
    ...run,
    battle: {
      ...run.battle,
      energy: run.battle.energy - card.cost,
      hand: run.battle.hand.filter((cardInHand) => cardInHand.instanceId !== cardInstanceId),
      discardPile: [...run.battle.discardPile, cardInstance],
    },
  };

  for (const effect of card.effects) {
    nextRun = applyCardEffect(nextRun, effect);
  }

  nextRun = applyCardPlayedBonuses(nextRun, card);

  nextRun = withLog(nextRun, `${card.name}: ${card.description}`);
  return checkBattleEnd(nextRun);
}

export function endTurn(run: RunState): RunState {
  if (run.phase !== "battle" || !run.battle) return run;

  let nextRun: RunState = {
    ...run,
    battle: {
      ...run.battle,
      enemy: { ...run.battle.enemy, block: 0 },
      discardPile: [...run.battle.discardPile, ...run.battle.hand],
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
  if (run.ship.passive.type !== "battleStartBlock") return run;

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
      enemy: dealDamage(run.battle.enemy, totalDamage),
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
    let enemy = run.battle.enemy;
    for (let hit = 0; hit < hits; hit += 1) {
      enemy = dealDamage(enemy, effect.amount);
    }
    return {
      ...run,
      battle: { ...run.battle, enemy },
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

function performEnemyAction(run: RunState): RunState {
  if (!run.battle) return run;

  const enemyDefinition = getCurrentEnemy(run);
  const action = enemyDefinition.actions[run.battle.enemyActionIndex % enemyDefinition.actions.length];
  let nextRun = run;

  if (action.type === "attack") {
    nextRun = enemyAttack(nextRun, action.amount, action.hits ?? 1);
  } else if (action.type === "block") {
    nextRun = enemyBlock(nextRun, action.amount);
  } else {
    nextRun = enemyAttack(nextRun, action.attack, 1);
    nextRun = enemyBlock(nextRun, action.block);
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
    player = dealDamage(player, amount);
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

export function describeEnemyAction(action: EnemyAction): string {
  if (action.type === "attack") {
    const hits = action.hits && action.hits > 1 ? ` x ${action.hits}` : "";
    return `Attacks for ${action.amount}${hits}`;
  }
  if (action.type === "block") return `Gains ${action.amount} block`;
  return `Attacks for ${action.attack} and gains ${action.block} block`;
}
