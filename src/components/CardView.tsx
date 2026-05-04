import { cards } from "../data/cards";
import type { Card, CardInstance } from "../types/game";

export type CardDamageBonus = {
  name: string;
  amount: number;
};

type CardViewProps = {
  card: CardInstance;
  disabled?: boolean;
  damageBonuses?: CardDamageBonus[];
  resourceValues?: Record<string, number>;
  viewOnly?: boolean;
  onPlay?: (instanceId: string) => void;
};

export function CardView({
  card,
  disabled = false,
  damageBonuses = [],
  resourceValues = {},
  viewOnly = false,
  onPlay,
}: CardViewProps) {
  const definition = cards[card.cardId];
  const damageText = buildDamageText(definition, damageBonuses, resourceValues);
  const isDisabled = !viewOnly && (disabled || definition.unplayable);

  return (
    <button
      className={`card rarity-${definition.rarity} ${viewOnly ? "view-only" : ""}`}
      disabled={isDisabled}
      aria-disabled={viewOnly ? true : undefined}
      tabIndex={viewOnly ? -1 : undefined}
      type="button"
      onClick={() => {
        if (!viewOnly) onPlay?.(card.instanceId);
      }}
    >
      <span className="card-cost">{definition.cost}</span>
      <span className="rarity-label">{definition.rarity}</span>
      <strong>{definition.name}</strong>
      <span className="card-description">{definition.description}</span>
      {damageText ? (
        <span className="damage-preview">
          {damageText.base}
          {damageText.bonuses.map((bonus) => (
            <span className="damage-bonus" key={`${bonus.name}-${bonus.amount}`}>
              {" "}+ {bonus.amount} ({bonus.name})
            </span>
          ))}
        </span>
      ) : null}
      <span className="tag-row">
        {definition.tags.map((tag) => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </span>
    </button>
  );
}

function buildDamageText(
  card: Card,
  damageBonuses: CardDamageBonus[],
  resourceValues: Record<string, number>,
): { base: string; bonuses: CardDamageBonus[] } | null {
  const damageEffect = card.effects.find((effect) => effect.type === "damage");
  if (!damageEffect) return null;

  const scaledAmount = (damageEffect.scaling ?? []).reduce((amount, scaling) => {
    if (scaling.type === "resource") {
      return amount + (resourceValues[scaling.resourceId] ?? 0) * scaling.multiplier;
    }
    return amount;
  }, damageEffect.amount);
  if (damageBonuses.length === 0 && scaledAmount === damageEffect.amount) return null;
  const hits = damageEffect.hits && damageEffect.hits > 1 ? ` x ${damageEffect.hits}` : "";
  return {
    base: `${scaledAmount}${hits}`,
    bonuses: damageBonuses,
  };
}
