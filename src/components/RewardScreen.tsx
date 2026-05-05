import { cards } from "../data/cards";
import { getCardDisplayType } from "../game/cardTypes";
import type { RunState } from "../types/game";
import { TopbarRunActions } from "./TopbarRunActions";

type RewardScreenProps = {
  run: RunState;
  onChooseReward: (cardId: string) => void;
  onSkipReward: () => void;
  onRestart: () => void;
};

export function RewardScreen({
  run,
  onChooseReward,
  onSkipReward,
  onRestart,
}: RewardScreenProps) {
  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Enemy vessel downed</p>
          <h1>Victory!</h1>
          <p className="screen-intro">
            Choose a card for the voyage ahead, or sail lighter.
          </p>
        </div>
        <TopbarRunActions run={run} onRestart={onRestart} />
      </header>

      <section className="reward-grid">
        {run.rewardChoices.map((cardId) => {
          const card = cards[cardId];
          const cardType = getCardDisplayType(card);
          return (
            <button
              className={`card reward-card rarity-${card.rarity} card-kind-${cardType}`}
              key={cardId}
              onClick={() => onChooseReward(cardId)}
            >
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
      <button className="secondary skip-reward" onClick={onSkipReward}>
        Skip Reward
      </button>
    </main>
  );
}
