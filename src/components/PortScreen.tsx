import { cards } from "../data/cards";
import { getAvailableCrew } from "../game/crewEngine";
import type { RunState } from "../types/game";
import { TopbarRunActions } from "./TopbarRunActions";

type PortScreenProps = {
  run: RunState;
  onRepair: () => void;
  onRecruitCrew: () => void;
  onStartRemoval: () => void;
  onRemoveCard: (instanceId: string) => void;
  onRestart: () => void;
};

export function PortScreen({ run, onRepair, onRecruitCrew, onStartRemoval, onRemoveCard, onRestart }: PortScreenProps) {
  const repairAmount = Math.ceil(run.player.maxHp * 0.25);
  const hasAvailableCrew = getAvailableCrew(run).length > 0;

  if (run.phase === "removeCard") {
    return (
      <main className="screen centered">
        <Header run={run} onRestart={onRestart} title="Remove a card" />
        <section className="deck-grid">
          {run.masterDeck.map((card) => {
            const definition = cards[card.cardId];
            return (
              <button className="deck-card" key={card.instanceId} onClick={() => onRemoveCard(card.instanceId)}>
                <strong>{definition.name}</strong>
                <span>{definition.description}</span>
              </button>
            );
          })}
        </section>
      </main>
    );
  }

  return (
    <main className="screen centered">
      <Header run={run} onRestart={onRestart} title="Port" />
      <section className="choice-grid">
        <button className="choice-card" onClick={onRepair}>
          <span className="choice-icon" aria-hidden="true">+</span>
          <strong>Repair Hull</strong>
          <span>Restore {repairAmount} HP.</span>
        </button>
        <button className="choice-card" onClick={onStartRemoval}>
          <span className="choice-icon" aria-hidden="true">-</span>
          <strong>Trim the Deck</strong>
          <span>Remove one card from your deck.</span>
        </button>
        <button className="choice-card" onClick={onRecruitCrew}>
          <span className="choice-icon" aria-hidden="true">*</span>
          <strong>{hasAvailableCrew ? "Recruit Crew Mate" : "No Crew Available"}</strong>
          <span>{hasAvailableCrew ? "Choose from available sailors for the rest of the run." : "Take minor repairs instead."}</span>
        </button>
      </section>
    </main>
  );
}

function Header({ run, onRestart, title }: { run: RunState; onRestart: () => void; title: string }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Encounter {run.encounterIndex + 1} of {run.encounters.length}</p>
        <h1>{title}</h1>
        <p className="screen-intro">Spend a quiet hour before the black water calls again.</p>
      </div>
      <TopbarRunActions run={run} onRestart={onRestart} />
    </header>
  );
}
