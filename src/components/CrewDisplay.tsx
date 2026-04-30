import type { CrewMateDefinition } from "../types/game";

type CrewDisplayProps = {
  crew: CrewMateDefinition[];
  className?: string;
};

export function CrewDisplay({ crew, className = "" }: CrewDisplayProps) {
  if (crew.length === 0) {
    return (
      <aside className={`crew-panel ${className}`}>
        <strong>Crew</strong>
        <span>No crew recruited yet.</span>
      </aside>
    );
  }

  return (
    <aside className={`crew-panel ${className}`}>
      <strong>Crew</strong>
      <div className="crew-list">
        {crew.map((mate) => (
          <span className={`crew-chip crew-${mate.rarity}`} key={mate.id} title={mate.description}>
            {mate.name}
          </span>
        ))}
      </div>
    </aside>
  );
}
