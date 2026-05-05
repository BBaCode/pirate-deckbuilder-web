import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cards } from "../data/cards";
import { describeEnemyIntent, getCurrentEnemy, getEnemyIntent } from "../game/combatEngine";
import { getCardPlayedCrewDamageSources } from "../game/crewEngine";
import type { ResourceState, RunState, StatusEffectState } from "../types/game";
import { CardView } from "./CardView";
import { CrewDisplay } from "./CrewDisplay";
import { EnemyIntent } from "./EnemyIntent";
import { RunMapModal } from "./RunMapModal";

const shipImages: Record<string, string> = {
  cannon_ship: new URL("../public/images/ship-crimson-wake.png", import.meta.url).href,
  iron_gull: new URL("../public/images/ship-iron-gull.png", import.meta.url).href,
  crimson_wake: new URL("../public/images/ship-crimson-wake.png", import.meta.url).href,
  mist_reaver: new URL("../public/images/ship-mist-reaver.png", import.meta.url).href,
};

type BattleScreenProps = {
  run: RunState;
  onPlayCard: (instanceId: string) => void;
  onEndTurn: () => void;
  onRestart: () => void;
};

type HpIndicator = {
  id: number;
  amount: number;
  type: "damage" | "healing";
};

type TurnBanner = {
  id: number;
  label: "Player Turn" | "Enemy Turn";
  tone: "player" | "enemy";
};

const ENEMY_TURN_PAUSE_MS = 1500;
const BATTLE_TOUR_STORAGE_KEY = "pirate-web-deckbuilder:battle-tour-complete";

const battleTourSteps = [
  {
    target: "topbar",
    title: "Battle Controls",
    body: "Use Draw and Discard to inspect your piles, Map to see the route ahead, and Restart Run when you want a fresh voyage.",
  },
  {
    target: "battlefield",
    title: "Battlefield",
    body: "Your ship and the enemy ship fight here. HP, Block, status effects, crew bonuses, and enemy intent all live in this area.",
  },
  {
    target: "turn",
    title: "End Your Turn",
    body: "This panel shows the current turn and your energy. When you are done playing cards, press End Turn so the enemy can act.",
  },
  {
    target: "hand",
    title: "Your Hand",
    body: "Select cards from your hand to play them. The number in the card corner is its energy cost, which spends from the energy you get each turn.",
  },
] as const;

type BattleTourTarget = (typeof battleTourSteps)[number]["target"];
type BattleTourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function BattleScreen({ run, onPlayCard, onEndTurn, onRestart }: BattleScreenProps) {
  const [playerHpIndicator, setPlayerHpIndicator] = useState<HpIndicator | null>(null);
  const [enemyHpIndicator, setEnemyHpIndicator] = useState<HpIndicator | null>(null);
  const [viewedPile, setViewedPile] = useState<"draw" | "discard" | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isResolvingEnemyTurn, setIsResolvingEnemyTurn] = useState(false);
  const [turnBanner, setTurnBanner] = useState<TurnBanner | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);
  const [tourTargetRect, setTourTargetRect] = useState<BattleTourRect | null>(null);
  const previousHpRef = useRef<{ player: number; enemy: number; enemyId: string } | null>(null);
  const previousTurnRef = useRef<string | null>(null);
  const enemyTurnTimeoutRef = useRef<number | null>(null);
  const tourTargets = useRef<Record<BattleTourTarget, HTMLElement | null>>({
    topbar: null,
    battlefield: null,
    turn: null,
    hand: null,
  });

  useEffect(() => {
    if (!run.battle) {
      previousHpRef.current = null;
      return;
    }

    const previousHp = previousHpRef.current;
    const currentHp = {
      player: run.player.hp,
      enemy: run.battle.enemy.hp,
      enemyId: run.battle.enemyId,
    };

    if (previousHp && previousHp.enemyId === currentHp.enemyId) {
      setHpIndicator(previousHp.player, currentHp.player, setPlayerHpIndicator);
      setHpIndicator(previousHp.enemy, currentHp.enemy, setEnemyHpIndicator);
    }

    previousHpRef.current = currentHp;
  }, [run.battle, run.player.hp]);

  useEffect(() => {
    if (!run.battle) return;

    const turnKey = `${run.battle.enemyId}-${run.battle.turn}`;
    if (previousTurnRef.current === turnKey) return;

    previousTurnRef.current = turnKey;
    setIsResolvingEnemyTurn(false);
    setTurnBanner({ id: Date.now(), label: "Player Turn", tone: "player" });
  }, [run.battle]);

  useEffect(() => {
    return () => {
      if (enemyTurnTimeoutRef.current !== null) window.clearTimeout(enemyTurnTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(BATTLE_TOUR_STORAGE_KEY) !== "complete") {
        setTourStepIndex(0);
      }
    } catch {
      setTourStepIndex(0);
    }
  }, []);

  useLayoutEffect(() => {
    if (tourStepIndex === null) return;

    const step = battleTourSteps[tourStepIndex];
    const target = tourTargets.current[step.target];
    if (!target) return;

    const targetElement = target;
    targetElement.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });

    function updateTourTargetRect() {
      const rect = targetElement.getBoundingClientRect();
      const inset = 8;
      setTourTargetRect({
        top: Math.max(inset, rect.top - inset),
        left: Math.max(inset, rect.left - inset),
        width: Math.min(window.innerWidth - inset * 2, rect.width + inset * 2),
        height: Math.min(window.innerHeight - inset * 2, rect.height + inset * 2),
      });
    }

    updateTourTargetRect();
    const observer = new ResizeObserver(updateTourTargetRect);
    observer.observe(targetElement);
    window.addEventListener("resize", updateTourTargetRect);
    window.addEventListener("scroll", updateTourTargetRect, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTourTargetRect);
      window.removeEventListener("scroll", updateTourTargetRect, true);
    };
  }, [tourStepIndex]);

  if (!run.battle) return null;

  const enemyDefinition = getCurrentEnemy(run);

  function handlePlayCard(instanceId: string) {
    if (isResolvingEnemyTurn) return;
    onPlayCard(instanceId);
  }

  function handleEndTurn() {
    if (isResolvingEnemyTurn) return;

    setIsResolvingEnemyTurn(true);
    setTurnBanner({ id: Date.now(), label: "Enemy Turn", tone: "enemy" });
    enemyTurnTimeoutRef.current = window.setTimeout(() => {
      onEndTurn();
      enemyTurnTimeoutRef.current = null;
    }, ENEMY_TURN_PAUSE_MS);
  }

  function completeTour() {
    try {
      window.localStorage.setItem(BATTLE_TOUR_STORAGE_KEY, "complete");
    } catch {
      // The walkthrough can still close when storage is unavailable.
    }
    setTourStepIndex(null);
    setTourTargetRect(null);
  }

  function handleTourNext() {
    if (tourStepIndex === null) return;
    if (tourStepIndex >= battleTourSteps.length - 1) {
      completeTour();
      return;
    }
    setTourStepIndex(tourStepIndex + 1);
  }

  return (
    <main className="screen" data-testid="battle-screen">
      <header
        className="topbar battle-topbar"
        ref={(node) => {
          tourTargets.current.topbar = node;
        }}
      >
        <div>
          <h1>Dark Seas of Ether</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="secondary modal-action"
            data-testid="draw-pile-button"
            onClick={() => setViewedPile("draw")}
          >
            Draw {run.battle.drawPile.length}
          </button>
          <button
            className="secondary modal-action"
            data-testid="discard-pile-button"
            onClick={() => setViewedPile("discard")}
          >
            Discard {run.battle.discardPile.length}
          </button>
          <button className="secondary modal-action" onClick={() => setIsMapOpen(true)}>Map</button>
          <button className="secondary" onClick={onRestart}>Restart Run</button>
        </div>
      </header>

      {isMapOpen ? (
        <RunMapModal
          encounters={run.encounters}
          currentIndex={run.encounterIndex}
          onClose={() => setIsMapOpen(false)}
        />
      ) : null}

      {turnBanner ? (
        <div className={`turn-banner turn-banner-${turnBanner.tone}`} key={turnBanner.id} aria-live="polite">
          {turnBanner.label}
        </div>
      ) : null}

      <section
        className="battlefield"
        aria-label="Battlefield"
        ref={(node) => {
          tourTargets.current.battlefield = node;
        }}
      >
        <ShipPanel
          testId="player-ship"
          name={run.ship.name}
          subtitle={run.ship.subtitle}
          hp={run.player.hp}
          maxHp={run.player.maxHp}
          block={run.player.block}
          resources={run.player.resources}
          statuses={run.player.statusEffects}
          hpIndicator={playerHpIndicator}
          accent="player"
          imageSrc={shipImages[run.selectedShipId]}
          footer={<CrewDisplay crew={run.crew} className="ship-crew" />}
        />

        <ShipPanel
          testId="enemy-ship"
          name={enemyDefinition.name}
          hp={run.battle.enemy.hp}
          maxHp={run.battle.enemy.maxHp}
          block={run.battle.enemy.block}
          statuses={run.battle.enemy.statusEffects}
          hpIndicator={enemyHpIndicator}
          accent="enemy"
          intent={<EnemyIntent action={getEnemyIntent(run)} description={describeEnemyIntent(run)} />}
        />
      </section>

      <section
        className="turn-panel"
        ref={(node) => {
          tourTargets.current.turn = node;
        }}
      >
        <div className="resource-row">
          <strong>Turn {run.battle.turn}</strong>
          <span className="resource-pill">Energy {run.battle.energy}/3</span>
        </div>
        <button className="primary" onClick={handleEndTurn} disabled={isResolvingEnemyTurn}>End Turn</button>
      </section>

      {viewedPile ? (
        <PileViewer
          title={viewedPile === "draw" ? "Draw Pile" : "Discard Pile"}
          cards={viewedPile === "draw" ? run.battle.drawPile : run.battle.discardPile}
          onClose={() => setViewedPile(null)}
        />
      ) : null}

      <section
        className="hand-panel"
        aria-label="Hand"
        data-testid="hand"
        ref={(node) => {
          tourTargets.current.hand = node;
        }}
      >
        <div className="section-heading">
          <p className="eyebrow">Hand</p>
          <span>{run.battle.hand.length} cards ready</span>
        </div>
        <div className="hand">
          {run.battle.hand.map((card) => (
            <CardView
              key={card.instanceId}
              card={card}
              disabled={isResolvingEnemyTurn || cards[card.cardId].cost > run.battle!.energy}
              resourceValues={Object.fromEntries(
                Object.entries(run.player.resources).map(([resourceId, resource]) => [resourceId, resource.value]),
              )}
              damageBonuses={getCardPlayedCrewDamageSources(
                run,
                cards[card.cardId],
                cards[card.cardId].tags.includes("attack") && !run.battle!.firstAttackBonusUsed,
              )}
              onPlay={handlePlayCard}
            />
          ))}
        </div>
      </section>

      <aside className="log">
        <strong>Captain's log</strong>
        {run.log.map((entry, index) => (
          <p key={`${entry}-${index}`}>{entry}</p>
        ))}
      </aside>

      {tourStepIndex !== null && tourTargetRect ? (
        <BattleTourOverlay
          rect={tourTargetRect}
          step={battleTourSteps[tourStepIndex]}
          stepIndex={tourStepIndex}
          stepCount={battleTourSteps.length}
          onNext={handleTourNext}
          onSkip={completeTour}
        />
      ) : null}
    </main>
  );
}

type BattleTourOverlayProps = {
  rect: BattleTourRect;
  step: (typeof battleTourSteps)[number];
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onSkip: () => void;
};

function BattleTourOverlay({ rect, step, stepIndex, stepCount, onNext, onSkip }: BattleTourOverlayProps) {
  const tooltip = getTourTooltipPosition(rect);

  return (
    <div className="battle-tour" aria-live="polite">
      <div
        className="battle-tour-highlight"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
      <section
        className={`battle-tour-card battle-tour-card-${tooltip.placement}`}
        role="dialog"
        aria-label="Battle walkthrough"
        style={{ top: tooltip.top, left: tooltip.left }}
      >
        <p className="eyebrow">Step {stepIndex + 1} of {stepCount}</p>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="battle-tour-actions">
          <button className="secondary battle-tour-skip" onClick={onSkip}>Skip</button>
          <button className="primary" onClick={onNext}>
            {stepIndex === stepCount - 1 ? "Done" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}

function getTourTooltipPosition(rect: BattleTourRect) {
  const cardWidth = Math.min(340, window.innerWidth - 28);
  const gap = 16;
  const margin = 14;
  const enoughRightSpace = rect.left + rect.width + gap + cardWidth <= window.innerWidth - margin;
  const enoughLeftSpace = rect.left - gap - cardWidth >= margin;
  const rawTop = rect.top + Math.min(36, rect.height * 0.28);
  const top = Math.min(Math.max(margin, rawTop), window.innerHeight - 260);

  if (enoughRightSpace) {
    return {
      top,
      left: rect.left + rect.width + gap,
      placement: "right",
    };
  }

  if (enoughLeftSpace) {
    return {
      top,
      left: rect.left - gap - cardWidth,
      placement: "left",
    };
  }

  const belowTop = rect.top + rect.height + gap;
  if (belowTop <= window.innerHeight - 230) {
    return {
      top: belowTop,
      left: Math.min(Math.max(margin, rect.left), window.innerWidth - cardWidth - margin),
      placement: "bottom",
    };
  }

  return {
    top: Math.max(margin, rect.top - 230),
    left: Math.min(Math.max(margin, rect.left), window.innerWidth - cardWidth - margin),
    placement: "top",
  };
}

type PileViewerProps = {
  title: string;
  cards: { instanceId: string; cardId: string }[];
  onClose: () => void;
};

function PileViewer({ title, cards: pileCards, onClose }: PileViewerProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="pile-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">{title}</p>
            <span>{pileCards.length} cards</span>
          </div>
          <button className="secondary pile-close" onClick={onClose}>Close</button>
        </div>
        {pileCards.length > 0 ? (
          <div className="pile-modal-grid">
            {pileCards.map((card) => (
              <CardView card={card} key={card.instanceId} viewOnly />
            ))}
          </div>
        ) : (
          <p className="empty-pile">No cards here.</p>
        )}
      </section>
    </div>
  );
}

type ShipPanelProps = {
  testId: string;
  name: string;
  subtitle?: string;
  hp: number;
  maxHp: number;
  block: number;
  resources?: ResourceState;
  statuses?: StatusEffectState;
  hpIndicator?: HpIndicator | null;
  accent: "player" | "enemy";
  imageSrc?: string;
  intent?: ReactNode;
  footer?: ReactNode;
};

function ShipPanel({
  testId,
  name,
  subtitle,
  hp,
  maxHp,
  block,
  resources = {},
  statuses = {},
  hpIndicator,
  accent,
  imageSrc,
  intent,
  footer,
}: ShipPanelProps) {
  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  const visibleResources = Object.entries(resources);
  const visibleStatuses = Object.entries(statuses).filter(([, amount]) => amount > 0);

  return (
    <article className={`ship ${accent}`} data-testid={testId}>
      <div className="ship-main">
        <div className={`ship-art ${imageSrc ? "has-image" : ""}`} aria-hidden="true">
          {imageSrc ? <img src={imageSrc} alt="" /> : null}
          {!imageSrc ? <span>{accent === "player" ? "SHIP" : "FOE"}</span> : null}
        </div>
        <div className="ship-title">
          <p className="eyebrow">{accent === "player" ? "Your vessel" : "Enemy vessel"}</p>
          <h2>{name}</h2>
          {subtitle ? <span>{subtitle}</span> : null}
          {intent}
        </div>
      </div>

      <div className="ship-combat-stats">
        <div className="meter" aria-label={`${name} HP`}>
          <span style={{ width: `${hpPercent}%` }} />
        </div>
        {hpIndicator ? (
          <span
            className={`hp-float hp-float-${hpIndicator.type}`}
            key={hpIndicator.id}
            aria-live="polite"
          >
            {hpIndicator.type === "damage" ? "-" : "+"}
            {hpIndicator.amount}
          </span>
        ) : null}
        <div className="stat-row">
          <strong>{hp}/{maxHp} HP</strong>
          <span className="block-badge">{block} Block</span>
        </div>
      </div>

      <div className="ship-extras">
        {visibleResources.length > 0 ? (
          <div className="stat-chip-row">
            {visibleResources.map(([resourceId, resource]) => (
              <span className="resource-pill" key={resourceId}>
                {formatLabel(resourceId)} {resource.value}/{resource.max}
              </span>
            ))}
          </div>
        ) : null}
        {visibleStatuses.length > 0 ? (
          <div className="stat-chip-row">
            {visibleStatuses.map(([statusId, amount]) => (
              <span className="status-badge" key={statusId}>
                {formatLabel(statusId)} {amount}
              </span>
            ))}
          </div>
        ) : null}
        {footer}
      </div>
    </article>
  );
}

function setHpIndicator(
  previousHp: number,
  currentHp: number,
  setIndicator: (indicator: HpIndicator | null) => void,
) {
  const delta = currentHp - previousHp;
  if (delta === 0) return;

  setIndicator({
    id: Date.now() + Math.abs(delta),
    amount: Math.abs(delta),
    type: delta < 0 ? "damage" : "healing",
  });
}

function formatLabel(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
