import { describeEnemyAction } from "../game/combatEngine";
import type { EnemyAction } from "../types/game";

type EnemyIntentProps = {
  action: EnemyAction | null;
  description?: string | null;
};

export function EnemyIntent({ action, description }: EnemyIntentProps) {
  if (!action) return null;

  return (
    <div className="intent">
      <span>Intent</span>
      <strong>{description ?? describeEnemyAction(action)}</strong>
    </div>
  );
}
