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
  onPlay?: (instanceId: string) => void;
};

export function CardView({ card, disabled = false, damageBonuses = [], onPlay }: CardViewProps) {
  const definition = cards[card.cardId];
  const damageText = buildDamageText(definition, damageBonuses);

  return (
    <button
      className={`card rarity-${definition.rarity}`}
      disabled={disabled}
      onClick={() => onPlay?.(card.instanceId)}
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

function buildDamageText(card: Card, damageBonuses: CardDamageBonus[]): { base: string; bonuses: CardDamageBonus[] } | null {
  const damageEffect = card.effects.find((effect) => effect.type === "damage");
  if (!damageEffect || damageBonuses.length === 0) return null;

  const hits = damageEffect.hits && damageEffect.hits > 1 ? ` x ${damageEffect.hits}` : "";
  return {
    base: `${damageEffect.amount}${hits}`,
    bonuses: damageBonuses,
  };
}
