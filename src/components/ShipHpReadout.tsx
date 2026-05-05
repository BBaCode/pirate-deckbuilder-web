import type { RunState } from "../types/game";

type ShipHpReadoutProps = {
  run: RunState;
};

export function ShipHpReadout({ run }: ShipHpReadoutProps) {
  const hpPercent = Math.max(0, (run.player.hp / run.player.maxHp) * 100);

  return (
    <div className="ship-hp-readout" aria-label={`${run.ship.name} hull ${run.player.hp} of ${run.player.maxHp} HP`}>
      <span className="ship-hp-label">Hull</span>
      <span className="ship-hp-meter" aria-hidden="true">
        <span style={{ width: `${hpPercent}%` }} />
      </span>
      <strong>{run.player.hp}/{run.player.maxHp} HP</strong>
    </div>
  );
}
