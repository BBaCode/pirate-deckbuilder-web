import { cards, cardsByRarity, rewardCardIds } from "../data/cards";
import type { CardRarity, CardTag, RunState } from "../types/game";
import { getRewardOptionCount } from "./crewEngine";

type RarityWeight = {
  rarity: CardRarity;
  weight: number;
};

const normalWeights: RarityWeight[] = [
  { rarity: "common", weight: 72 },
  { rarity: "uncommon", weight: 23 },
  { rarity: "rare", weight: 5 },
];

const eliteWeights: RarityWeight[] = [
  { rarity: "common", weight: 45 },
  { rarity: "uncommon", weight: 40 },
  { rarity: "rare", weight: 15 },
];

export function createBattleRewardChoices(run: RunState): string[] {
  const encounterType = run.encounters[run.encounterIndex]?.type ?? "normal";
  const weights = encounterType === "elite" ? eliteWeights : normalWeights;
  return createRewardChoices(run, weights);
}

export function createEventCardReward(run: RunState): string {
  return createRewardChoices(run, normalWeights)[0] ?? shuffle(rewardCardIds)[0];
}

export function createEventCardChoices(
  run: RunState,
  options: { count?: number; rarity?: CardRarity; tags?: CardTag[] },
): string[] {
  const choices: string[] = [];
  const deckCounts = countDeckCards(run);
  const count = options.count ?? 1;

  while (choices.length < count) {
    const candidate = pickFilteredCard(options, choices, deckCounts) ?? pickAnyCard(choices);
    if (!candidate) break;
    choices.push(candidate);
  }

  return choices;
}

function createRewardChoices(run: RunState, weights: RarityWeight[]): string[] {
  const choices: string[] = [];
  const deckCounts = countDeckCards(run);
  const rewardCount = getRewardOptionCount(run);

  while (choices.length < rewardCount) {
    const rarity = rollRarity(weights);
    const candidate = pickCardFromRarity(rarity, choices, deckCounts) ?? pickAnyCard(choices);
    if (!candidate) break;
    choices.push(candidate);
  }

  return choices;
}

function rollRarity(weights: RarityWeight[]): CardRarity {
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of weights) {
    roll -= item.weight;
    if (roll <= 0) return item.rarity;
  }

  return weights[0].rarity;
}

function pickCardFromRarity(rarity: CardRarity, existingChoices: string[], deckCounts: Record<string, number>): string | null {
  const candidates = cardsByRarity[rarity].filter((cardId) => !existingChoices.includes(cardId));
  const preferred = candidates.filter((cardId) => deckCounts[cardId] < 3);
  return pickOne(preferred.length > 0 ? preferred : candidates);
}

function pickAnyCard(existingChoices: string[]): string | null {
  return pickOne(rewardCardIds.filter((cardId) => !existingChoices.includes(cardId)));
}

function pickFilteredCard(
  options: { rarity?: CardRarity; tags?: CardTag[] },
  existingChoices: string[],
  deckCounts: Record<string, number>,
): string | null {
  const candidates = rewardCardIds.filter((cardId) => {
    const card = cards[cardId];
    const matchesRarity = !options.rarity || card.rarity === options.rarity;
    const matchesTags = !options.tags || options.tags.some((tag) => card.tags.includes(tag));
    return matchesRarity && matchesTags && !existingChoices.includes(cardId);
  });
  const preferred = candidates.filter((cardId) => deckCounts[cardId] < 3);
  return pickOne(preferred.length > 0 ? preferred : candidates);
}

function countDeckCards(run: RunState): Record<string, number> {
  return run.masterDeck.reduce<Record<string, number>>((counts, card) => {
    counts[card.cardId] = (counts[card.cardId] ?? 0) + 1;
    return counts;
  }, {});
}

function pickOne<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
