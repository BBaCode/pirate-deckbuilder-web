import { cards } from "../data/cards";
import { eventsById } from "../data/events";
import type { RunState } from "../types/game";
import { RunMap } from "./RunMap";

type EventScreenProps = {
  run: RunState;
  onChooseEventChoice: (choiceId: string) => void;
  onChooseEventCard: (cardId: string) => void;
  onContinue: () => void;
  onRestart: () => void;
};

export function EventScreen({ run, onChooseEventChoice, onChooseEventCard, onContinue, onRestart }: EventScreenProps) {
  const addedCard = run.phase === "eventReward" ? cards[run.rewardChoices[0]] : null;
  const event = run.currentEventId ? eventsById[run.currentEventId] : null;

  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Encounter {run.encounterIndex + 1} of {run.encounters.length}</p>
          <h1>{event?.name ?? "Strange Waters"}</h1>
          <p className="screen-intro">A choice waits in the mist.</p>
        </div>
        <button className="secondary" onClick={onRestart}>Restart Run</button>
      </header>
      <RunMap encounters={run.encounters} currentIndex={run.encounterIndex} />

      {addedCard ? (
        <>
          <section className="event-panel">
            <p>{run.eventResultText ?? "A card is added to your deck."}</p>
          </section>

          <section className="reward-grid event-reward-grid">
            <article className={`card reward-card rarity-${addedCard.rarity}`}>
              <span className="card-cost">{addedCard.cost}</span>
              <span className="rarity-label">{addedCard.rarity}</span>
              <strong>{addedCard.name}</strong>
              <span className="card-description">{addedCard.description}</span>
              <span className="tag-row">
                {addedCard.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </span>
            </article>
          </section>

          <button className="primary continue-button" onClick={onContinue}>Continue</button>
        </>
      ) : run.phase === "eventCardReward" ? (
        <>
          <section className="event-panel">
            <p>{run.eventResultText ?? "Choose one card to add to your deck."}</p>
          </section>

          <section className="reward-grid">
            {run.rewardChoices.map((cardId) => {
              const card = cards[cardId];
              return (
                <button className={`card reward-card rarity-${card.rarity}`} key={card.id} onClick={() => onChooseEventCard(card.id)}>
                  <span className="card-cost">{card.cost}</span>
                  <span className="rarity-label">{card.rarity}</span>
                  <strong>{card.name}</strong>
                  <span className="card-description">{card.description}</span>
                  <span className="tag-row">
                    {card.tags.map((tag) => (
                      <span className="tag" key={tag}>{tag}</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </section>
        </>
      ) : (
        <>
          <section className="event-panel">
            <p>{event?.flavorText ?? "The sea offers a strange opportunity."}</p>
          </section>

          <section className="choice-grid">
            {event?.choices.map((choice) => (
              <button className="choice-card" key={choice.id} onClick={() => onChooseEventChoice(choice.id)}>
                <strong>{choice.label}</strong>
                <span>{choice.description}</span>
              </button>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
