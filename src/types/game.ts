export type CardEffect =
  | { type: "damage"; amount: number; hits?: number }
  | { type: "block"; amount: number }
  | { type: "heal"; amount: number }
  | { type: "draw"; amount: number }
  | { type: "energy"; amount: number }
  | { type: "nextTurnEnergy"; amount: number }
  | { type: "loseHp"; amount: number }
  | { type: "reduceEnemyBlock"; amount: number };

export type CardRarity = "common" | "uncommon" | "rare";

export type CrewRarity = "common" | "uncommon" | "rare";

export type CardTag = "attack" | "defense" | "repair" | "cannon" | "boarding" | "curse" | "utility";

export type Card = {
  id: string;
  name: string;
  cost: number;
  description: string;
  rarity: CardRarity;
  tags: CardTag[];
  effects: CardEffect[];
};

export type CardInstance = {
  instanceId: string;
  cardId: string;
};

export type StartingDeckEntry = {
  cardId: string;
  count: number;
};

export type ShipPassive =
  | { type: "battleStartBlock"; amount: number }
  | { type: "firstAttackBonus"; amount: number }
  | { type: "firstTurnDraw"; amount: number };

export type PlayerShipDefinition = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  maxHp: number;
  startingDeck: StartingDeckEntry[];
  passive: ShipPassive;
};

export type CrewTriggerType =
  | "firstAttackPlayed"
  | "battleWon"
  | "battleStart"
  | "turnStart"
  | "cardRewardGeneration"
  | "portHeal"
  | "cannonCardPlayed";

export type CrewEffect =
  | { type: "damage"; amount: number }
  | { type: "heal"; amount: number }
  | { type: "draw"; amount: number }
  | { type: "block"; amount: number }
  | { type: "energy"; amount: number }
  | { type: "rewardOptions"; amount: number }
  | { type: "enemyHpLoss"; amount: number };

export type CrewMateDefinition = {
  id: string;
  name: string;
  title: string;
  description: string;
  rarity: CrewRarity;
  triggerType: CrewTriggerType;
  effect: CrewEffect;
};

export type EnemyAction =
  | { type: "attack"; amount: number; hits?: number }
  | { type: "block"; amount: number }
  | { type: "attackBlock"; attack: number; block: number };

export type EnemyDefinition = {
  id: string;
  name: string;
  maxHp: number;
  actions: EnemyAction[];
};

export type EncounterType = "normal" | "elite" | "port" | "event" | "boss";

export type Encounter = {
  id: string;
  type: EncounterType;
  enemyId?: string;
  completed: boolean;
};

export type EventChoiceEffect =
  | { type: "gainCard"; rarity?: CardRarity; tags?: CardTag[]; hpLoss?: number; resultText: string }
  | { type: "cardChoice"; rarity?: CardRarity; tags?: CardTag[]; count: number; resultText: string }
  | { type: "heal"; amount: number; resultText: string }
  | { type: "removeCard"; hpLoss?: number; resultText: string }
  | { type: "crewOrHeal"; healAmount: number; resultText: string; fallbackText: string }
  | { type: "crewOrCard"; rarity?: CardRarity; tags?: CardTag[]; resultText: string; fallbackText: string };

export type EventChoiceDefinition = {
  id: string;
  label: string;
  description: string;
  effect: EventChoiceEffect;
};

export type EventDefinition = {
  id: string;
  name: string;
  flavorText: string;
  choices: EventChoiceDefinition[];
};

export type CombatantState = {
  hp: number;
  maxHp: number;
  block: number;
};

export type BattleState = {
  enemyId: string;
  enemy: CombatantState;
  enemyActionIndex: number;
  energy: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  nextTurnEnergyBonus: number;
  firstAttackBonusUsed: boolean;
  turn: number;
};

export type RunPhase =
  | "battle"
  | "reward"
  | "port"
  | "event"
  | "eventReward"
  | "eventCardReward"
  | "crewReward"
  | "removeCard"
  | "victory"
  | "defeat";

export type RunState = {
  version: 1;
  seed: number;
  phase: RunPhase;
  encounterIndex: number;
  encounters: Encounter[];
  selectedShipId: string;
  ship: PlayerShipDefinition;
  crew: CrewMateDefinition[];
  player: CombatantState;
  masterDeck: CardInstance[];
  battle: BattleState | null;
  rewardChoices: string[];
  crewChoices: string[];
  currentEventId: string | null;
  eventResultText: string | null;
  pendingRemoveHpLoss: number;
  log: string[];
};
