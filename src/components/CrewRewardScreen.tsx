import { crewById } from "../data/crew";
import type { RunState } from "../types/game";
import { RunMap } from "./RunMap";

type CrewRewardScreenProps = {
  run: RunState;
  onChooseCrew: (crewId: string) => void;
  onRestart: () => void;
};

export function CrewRewardScreen({ run, onChooseCrew, onRestart }: CrewRewardScreenProps) {
  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Recruit crew</p>
          <h1>Choose a crew mate</h1>
          <p className="screen-intro">Every sailor brings a different kind of trouble.</p>
        </div>
        <button className="secondary" onClick={onRestart}>Restart Run</button>
      </header>
      <RunMap encounters={run.encounters} currentIndex={run.encounterIndex} />

      <section className="crew-choice-grid">
        {run.crewChoices.map((crewId) => {
          const crew = crewById[crewId];
          return (
            <button className={`crew-card crew-${crew.rarity}`} key={crew.id} onClick={() => onChooseCrew(crew.id)}>
              <span className="rarity-label">{crew.rarity}</span>
              <strong>{crew.name}</strong>
              <em>{crew.title}</em>
              <span>{crew.description}</span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
