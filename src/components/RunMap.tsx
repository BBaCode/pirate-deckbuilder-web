import type { Encounter, EncounterType } from "../types/game";

type RunMapProps = {
  encounters: Encounter[];
  currentIndex: number;
};

const labels: Record<EncounterType, string> = {
  normal: "Battle",
  elite: "Elite",
  port: "Port",
  event: "Event",
  boss: "Boss",
};

export function RunMap({ encounters, currentIndex }: RunMapProps) {
  return (
    <nav className="run-map" aria-label="Run progress">
      {encounters.map((encounter, index) => (
        <div
          className={`map-node ${encounter.type} ${index === currentIndex ? "current" : ""} ${encounter.completed ? "done" : ""}`}
          key={encounter.id}
        >
          <span>{index + 1}</span>
          <strong>{labels[encounter.type]}</strong>
        </div>
      ))}
    </nav>
  );
}
