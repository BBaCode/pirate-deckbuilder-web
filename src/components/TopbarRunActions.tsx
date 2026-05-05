import { useState } from "react";
import type { RunState } from "../types/game";
import { RunMapModal } from "./RunMapModal";
import { ShipHpReadout } from "./ShipHpReadout";

type TopbarRunActionsProps = {
  run: RunState;
  onRestart: () => void;
};

export function TopbarRunActions({ run, onRestart }: TopbarRunActionsProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <>
      <div className="topbar-actions decision-topbar-actions">
        <ShipHpReadout run={run} />
        <button className="secondary modal-action" onClick={() => setIsMapOpen(true)}>Map</button>
        <button className="secondary" onClick={onRestart}>Restart Run</button>
      </div>
      {isMapOpen ? (
        <RunMapModal
          encounters={run.encounters}
          currentIndex={run.encounterIndex}
          onClose={() => setIsMapOpen(false)}
        />
      ) : null}
    </>
  );
}
