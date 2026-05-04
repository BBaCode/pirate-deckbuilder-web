import type {
  CardCondition,
  CombatantState,
  ResourceDefinition,
  ResourceId,
  ResourceState,
  StatusEffectId,
  StatusEffectState,
} from "../types/game";

const persistentStatusIds = new Set<StatusEffectId>(["strength"]);
const opposingStatusIds: Partial<Record<StatusEffectId, StatusEffectId>> = {
  strength: "weak",
  weak: "strength",
};

export const cannonChargeResource: ResourceDefinition = {
  id: "cannonCharge",
  name: "Cannon Charge",
  max: 5,
  initialValue: 0,
};

export function createCombatantState(
  hp: number,
  maxHp: number,
  block = 0,
  resourceDefinitions: ResourceDefinition[] = [],
): CombatantState {
  return {
    hp,
    maxHp,
    block,
    resources: createResourceState(resourceDefinitions),
    statusEffects: {},
  };
}

export function createResourceState(definitions: ResourceDefinition[] = []): ResourceState {
  return definitions.reduce<ResourceState>((resources, definition) => {
    resources[definition.id] = {
      value: clamp(definition.initialValue, 0, definition.max),
      max: definition.max,
    };
    return resources;
  }, {});
}

export function resetResources(
  current: ResourceState | undefined,
  definitions: ResourceDefinition[] = [],
): ResourceState {
  return definitions.reduce<ResourceState>((resources, definition) => {
    const currentResource = current?.[definition.id];
    resources[definition.id] = {
      value: clamp(definition.initialValue, 0, definition.max),
      max: currentResource?.max ?? definition.max,
    };
    return resources;
  }, {});
}

export function normalizeResources(
  current: ResourceState | undefined,
  definitions: ResourceDefinition[] = [],
): ResourceState {
  return definitions.reduce<ResourceState>((resources, definition) => {
    const currentResource = current?.[definition.id];
    resources[definition.id] = {
      value: clamp(currentResource?.value ?? definition.initialValue, 0, currentResource?.max ?? definition.max),
      max: currentResource?.max ?? definition.max,
    };
    return resources;
  }, {});
}

export function getResourceAmount(combatant: CombatantState, resourceId: ResourceId): number {
  return combatant.resources[resourceId]?.value ?? 0;
}

export function updateResource(
  combatant: CombatantState,
  resourceId: ResourceId,
  amount: number,
): CombatantState {
  const current = combatant.resources[resourceId] ?? { value: 0, max: Number.POSITIVE_INFINITY };
  return {
    ...combatant,
    resources: {
      ...combatant.resources,
      [resourceId]: {
        ...current,
        value: clamp(current.value + amount, 0, current.max),
      },
    },
  };
}

export function consumeAllResource(
  combatant: CombatantState,
  resourceId: ResourceId,
): { combatant: CombatantState; amount: number } {
  const amount = getResourceAmount(combatant, resourceId);
  return {
    amount,
    combatant: {
      ...combatant,
      resources: {
        ...combatant.resources,
        [resourceId]: {
          ...(combatant.resources[resourceId] ?? { max: Number.POSITIVE_INFINITY }),
          value: 0,
        },
      },
    },
  };
}

export function addStatus(
  combatant: CombatantState,
  statusId: StatusEffectId,
  amount: number,
): CombatantState {
  const statusEffects = { ...combatant.statusEffects };
  let remainingAmount = amount;
  const opposingStatusId = opposingStatusIds[statusId];

  if (opposingStatusId && remainingAmount > 0) {
    const opposingAmount = statusEffects[opposingStatusId] ?? 0;
    const cancelledAmount = Math.min(opposingAmount, remainingAmount);
    remainingAmount -= cancelledAmount;

    const nextOpposingAmount = opposingAmount - cancelledAmount;
    if (nextOpposingAmount > 0) {
      statusEffects[opposingStatusId] = nextOpposingAmount;
    } else {
      delete statusEffects[opposingStatusId];
    }
  }

  const nextAmount = Math.max(0, (statusEffects[statusId] ?? 0) + remainingAmount);
  if (nextAmount > 0) {
    statusEffects[statusId] = nextAmount;
  } else {
    delete statusEffects[statusId];
  }

  return {
    ...combatant,
    statusEffects,
  };
}

export function reduceStatuses(combatant: CombatantState): CombatantState {
  const nextStatuses = Object.entries(combatant.statusEffects).reduce<StatusEffectState>(
    (statuses, [statusId, amount]) => {
      if (persistentStatusIds.has(statusId)) {
        statuses[statusId] = amount;
        return statuses;
      }
      const nextAmount = amount - 1;
      if (nextAmount > 0) statuses[statusId] = nextAmount;
      return statuses;
    },
    {},
  );

  return {
    ...combatant,
    statusEffects: nextStatuses,
  };
}

export function getStatusAmount(combatant: CombatantState, statusId: StatusEffectId): number {
  return combatant.statusEffects[statusId] ?? 0;
}

export function applyDamageModifiers(
  amount: number,
  attacker: CombatantState,
  target: CombatantState,
): number {
  let modifiedAmount = amount + getStatusAmount(attacker, "strength");
  if (getStatusAmount(attacker, "weak") > 0) {
    modifiedAmount = Math.floor(modifiedAmount * 0.75);
  }
  if (getStatusAmount(target, "vulnerable") > 0) {
    modifiedAmount = Math.ceil(modifiedAmount * 1.5);
  }
  return Math.max(0, modifiedAmount);
}

export function isConditionMet(combatant: CombatantState, condition: CardCondition): boolean {
  const resourceAmount = getResourceAmount(combatant, condition.resourceId);
  if (condition.type === "resourceAtLeast") return resourceAmount >= condition.amount;
  return resourceAmount > condition.amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
