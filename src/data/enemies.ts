import type { EnemyDefinition } from "../types/game";

export const enemies: EnemyDefinition[] = [
  {
    id: "dinghy_raider",
    name: "Dinghy Raider",
    maxHp: 25,
    actions: [
      { type: "attack", amount: 6 },
      { type: "block", amount: 5 },
    ],
  },
  {
    id: "reef_smuggler",
    name: "Reef Smuggler",
    maxHp: 30,
    actions: [
      { type: "attack", amount: 7 },
      { type: "attackBlock", attack: 4, block: 4 },
    ],
  },
  {
    id: "saboteur",
    name: "Saboteur",
    maxHp: 32,
    actions: [
      { type: "applyStatus", target: "player", statusId: "weak", amount: 1 },
      { type: "addStatusCard", cardId: "misfire", count: 1 },
      { type: "attack", amount: 7 },
    ],
  },
  {
    id: "powder_sloop",
    name: "Powder Sloop",
    maxHp: 34,
    actions: [
      { type: "attack", amount: 5, hits: 2 },
      { type: "block", amount: 7 },
    ],
  },
  {
    id: "corsair",
    name: "Corsair",
    maxHp: 46,
    actions: [
      { type: "applyStatus", target: "self", statusId: "strength", amount: 1 },
      { type: "attack", amount: 9 },
      { type: "attackBlock", attack: 5, block: 5 },
    ],
  },
  {
    id: "royal_hunter",
    name: "Royal Hunter",
    maxHp: 56,
    actions: [
      { type: "applyStatus", target: "self", statusId: "strength", amount: 2 },
      { type: "attack", amount: 12 },
      { type: "block", amount: 9 },
      { type: "attackBlock", attack: 8, block: 7 },
    ],
  },
  {
    id: "ghost_frigate",
    name: "Ghost Frigate",
    maxHp: 100,
    actions: [
      { type: "applyStatus", target: "self", statusId: "strength", amount: 1 },
      { type: "attack", amount: 10 },
      { type: "block", amount: 12 },
      { type: "attack", amount: 6, hits: 2 },
    ],
    actionPhases: [
      {
        hpAtOrBelow: 50,
        actions: [
          { type: "applyStatus", target: "self", statusId: "strength", amount: 3 },
          { type: "attack", amount: 14, hits: 2 },
          { type: "attackBlock", attack: 16, block: 12 },
        ],
      },
    ],
  },
];

export const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy]));

export const normalEnemyIds = ["dinghy_raider", "reef_smuggler", "saboteur", "powder_sloop"];

export const eliteEnemyIds = ["corsair", "royal_hunter"];

export const bossEnemyIds = ["ghost_frigate"];
