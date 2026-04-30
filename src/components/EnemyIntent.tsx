import { describeEnemyAction } from "../game/combatEngine";
import type { EnemyAction } from "../types/game";

type EnemyIntentProps = {
  action: EnemyAction | null;
};

export function EnemyIntent({ action }: EnemyIntentProps) {
  if (!action) return null;

  return (
    <div className="intent">
      <span>Intent</span>
      <strong>{describeEnemyAction(action)}</strong>
    </div>
  );
}
