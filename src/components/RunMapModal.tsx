import type { RunState } from "../types/game";
import { RunMap } from "./RunMap";

type RunMapModalProps = {
  encounters: RunState["encounters"];
  currentIndex: number;
  onClose: () => void;
};

export function RunMapModal({ encounters, currentIndex, onClose }: RunMapModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="map-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Run map"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Run Map</p>
            <span>Encounter {currentIndex + 1} of {encounters.length}</span>
          </div>
          <button className="secondary pile-close" onClick={onClose}>Close</button>
        </div>
        <RunMap encounters={encounters} currentIndex={currentIndex} />
      </section>
    </div>
  );
}
