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
    maxHp: 40,
    actions: [
      { type: "attack", amount: 8 },
      { type: "attackBlock", attack: 5, block: 5 },
    ],
  },
  {
    id: "royal_hunter",
    name: "Royal Hunter",
    maxHp: 48,
    actions: [
      { type: "attack", amount: 11 },
      { type: "block", amount: 9 },
      { type: "attackBlock", attack: 7, block: 6 },
    ],
  },
  {
    id: "ghost_frigate",
    name: "Ghost Frigate",
    maxHp: 60,
    actions: [
      { type: "attack", amount: 10 },
      { type: "block", amount: 10 },
      { type: "attack", amount: 6, hits: 2 },
    ],
  },
];

export const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy]));

export const normalEnemyIds = ["dinghy_raider", "reef_smuggler", "powder_sloop"];

export const eliteEnemyIds = ["corsair", "royal_hunter"];

export const bossEnemyIds = ["ghost_frigate"];
