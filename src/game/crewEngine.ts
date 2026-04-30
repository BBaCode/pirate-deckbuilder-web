import { crewById, crewMates } from "../data/crew";
import type { Card, CrewMateDefinition, CrewRarity, RunState } from "../types/game";

type CrewRewardWeight = {
  rarity: CrewRarity;
  weight: number;
};

const crewWeights: CrewRewardWeight[] = [
  { rarity: "common", weight: 65 },
  { rarity: "uncommon", weight: 28 },
  { rarity: "rare", weight: 7 },
];

export function getAvailableCrew(run: RunState): CrewMateDefinition[] {
  const ownedIds = new Set(run.crew.map((crew) => crew.id));
  return crewMates.filter((crew) => !ownedIds.has(crew.id));
}

export function generateCrewReward(run: RunState, count: number): string[] {
  const choices: string[] = [];

  while (choices.length < count) {
    const rarity = rollCrewRarity();
    const candidate = pickCrewByRarity(run, rarity, choices) ?? pickAnyCrew(run, choices);
    if (!candidate) break;
    choices.push(candidate.id);
  }

  return choices;
}

export function addCrewMate(run: RunState, crewId: string): RunState {
  if (run.crew.some((crew) => crew.id === crewId)) return run;
  const crew = crewById[crewId];
  if (!crew) return run;
  return {
    ...run,
    crew: [...run.crew, crew],
    crewChoices: [],
  };
}

export function getBattleStartCrewBonuses(run: RunState) {
  return run.crew.reduce(
    (bonuses, crew) => {
      if (crew.triggerType !== "battleStart") return bonuses;
      if (crew.effect.type === "draw") bonuses.extraDraw += crew.effect.amount;
      if (crew.effect.type === "energy") bonuses.energy += crew.effect.amount;
      if (crew.effect.type === "enemyHpLoss") bonuses.enemyHpLoss += crew.effect.amount;
      return bonuses;
    },
    { extraDraw: 0, energy: 0, enemyHpLoss: 0 },
  );
}

export function getTurnStartCrewBonuses(run: RunState, isFirstTurn: boolean) {
  return run.crew.reduce(
    (bonuses, crew) => {
      if (crew.triggerType !== "turnStart") return bonuses;
      if (crew.id === "ghost_cook" && !isFirstTurn) return bonuses;
      if (crew.effect.type === "block") bonuses.block += crew.effect.amount;
      if (crew.effect.type === "energy") {
        bonuses.energy += crew.effect.amount;
        if (crew.id === "ghost_cook") bonuses.draw += 1;
      }
      return bonuses;
    },
    { block: 0, energy: 0, draw: 0 },
  );
}

export function getCardPlayedCrewDamage(run: RunState, card: Card, isFirstAttack: boolean): number {
  return getCardPlayedCrewDamageSources(run, card, isFirstAttack).reduce((bonus, source) => bonus + source.amount, 0);
}

export function getCardPlayedCrewDamageSources(run: RunState, card: Card, isFirstAttack: boolean): Array<{ name: string; amount: number }> {
  return run.crew.reduce<Array<{ name: string; amount: number }>>((sources, crew) => {
    if (crew.effect.type !== "damage") return sources;
    if (crew.triggerType === "firstAttackPlayed" && isFirstAttack && card.tags.includes("attack")) {
      return [...sources, { name: crew.name, amount: crew.effect.amount }];
    }
    if (crew.triggerType === "cannonCardPlayed" && card.tags.includes("cannon")) {
      return [...sources, { name: crew.name, amount: crew.effect.amount }];
    }
    return sources;
  }, []);
}

export function getBattleWonHeal(run: RunState): number {
  return run.crew.reduce((heal, crew) => {
    if (crew.triggerType === "battleWon" && crew.effect.type === "heal") return heal + crew.effect.amount;
    return heal;
  }, 0);
}

export function getPortHealBonus(run: RunState): number {
  return run.crew.reduce((heal, crew) => {
    if (crew.triggerType === "portHeal" && crew.effect.type === "heal") return heal + crew.effect.amount;
    return heal;
  }, 0);
}

export function getRewardOptionCount(run: RunState): number {
  return run.crew.reduce((count, crew) => {
    if (crew.triggerType === "cardRewardGeneration" && crew.effect.type === "rewardOptions") {
      return count + crew.effect.amount;
    }
    return count;
  }, 3);
}

function pickCrewByRarity(run: RunState, rarity: CrewRarity, existingChoices: string[]): CrewMateDefinition | null {
  return pickOne(getAvailableCrew(run).filter((crew) => crew.rarity === rarity && !existingChoices.includes(crew.id)));
}

function pickAnyCrew(run: RunState, existingChoices: string[]): CrewMateDefinition | null {
  return pickOne(getAvailableCrew(run).filter((crew) => !existingChoices.includes(crew.id)));
}

function rollCrewRarity(): CrewRarity {
  const total = crewWeights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of crewWeights) {
    roll -= item.weight;
    if (roll <= 0) return item.rarity;
  }
  return "common";
}

function pickOne<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}
