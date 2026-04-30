import { cards } from "../data/cards";
import type { RunState } from "../types/game";
import { RunMap } from "./RunMap";

type RewardScreenProps = {
  run: RunState;
  onChooseReward: (cardId: string) => void;
  onSkipReward: () => void;
  onRestart: () => void;
};

export function RewardScreen({ run, onChooseReward, onSkipReward, onRestart }: RewardScreenProps) {
  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Spoils of battle</p>
          <h1>Choose a card</h1>
          <p className="screen-intro">Claim one prize for the voyage ahead, or sail lighter.</p>
        </div>
        <button className="secondary" onClick={onRestart}>Restart Run</button>
      </header>
      <RunMap encounters={run.encounters} currentIndex={run.encounterIndex} />

      <section className="reward-grid">
        {run.rewardChoices.map((cardId) => {
          const card = cards[cardId];
          return (
            <button className={`card reward-card rarity-${card.rarity}`} key={cardId} onClick={() => onChooseReward(cardId)}>
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
      <button className="secondary skip-reward" onClick={onSkipReward}>Skip Reward</button>
    </main>
  );
}
