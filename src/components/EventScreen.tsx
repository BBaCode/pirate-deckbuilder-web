import { cards } from "../data/cards";
import { eventsById } from "../data/events";
import { getCardDisplayType } from "../game/cardTypes";
import type { RunState } from "../types/game";
import { TopbarRunActions } from "./TopbarRunActions";

type EventScreenProps = {
  run: RunState;
  onChooseEventChoice: (choiceId: string) => void;
  onChooseEventCard: (cardId: string) => void;
  onContinue: () => void;
  onRestart: () => void;
};

export function EventScreen({ run, onChooseEventChoice, onChooseEventCard, onContinue, onRestart }: EventScreenProps) {
  const addedCard = run.phase === "eventReward" ? cards[run.rewardChoices[0]] : null;
  const addedCardType = addedCard ? getCardDisplayType(addedCard) : null;
  const event = run.currentEventId ? eventsById[run.currentEventId] : null;

  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Encounter {run.encounterIndex + 1} of {run.encounters.length}</p>
          <h1>{event?.name ?? "Strange Waters"}</h1>
          <p className="screen-intro">A choice waits in the mist.</p>
        </div>
        <TopbarRunActions run={run} onRestart={onRestart} />
      </header>

      {addedCard ? (
        <>
          <section className="event-panel">
            <p>{run.eventResultText ?? "A card is added to your deck."}</p>
          </section>

          <section className="reward-grid event-reward-grid">
            <article className={`card reward-card rarity-${addedCard.rarity} card-kind-${addedCardType}`}>
              <span className="card-cost">{addedCard.cost}</span>
              <span className="rarity-label">{addedCard.rarity}</span>
              <strong>{addedCard.name}</strong>
              <span className="card-description">{addedCard.description}</span>
              <span className="tag-row">
                <span className="tag">{addedCardType}</span>
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
              const cardType = getCardDisplayType(card);
              return (
                <button className={`card reward-card rarity-${card.rarity} card-kind-${cardType}`} key={card.id} onClick={() => onChooseEventCard(card.id)}>
                  <span className="card-cost">{card.cost}</span>
                  <span className="rarity-label">{card.rarity}</span>
                  <strong>{card.name}</strong>
                  <span className="card-description">{card.description}</span>
                  <span className="tag-row">
                    <span className="tag">{cardType}</span>
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
