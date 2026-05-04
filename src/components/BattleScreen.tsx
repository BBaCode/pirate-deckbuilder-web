import { useEffect, useRef, useState, type ReactNode } from "react";
import { cards } from "../data/cards";
import { describeEnemyIntent, getCurrentEnemy, getEnemyIntent } from "../game/combatEngine";
import { getCardPlayedCrewDamageSources } from "../game/crewEngine";
import type { ResourceState, RunState, StatusEffectState } from "../types/game";
import { CardView } from "./CardView";
import { CrewDisplay } from "./CrewDisplay";
import { EnemyIntent } from "./EnemyIntent";
import { RunMap } from "./RunMap";

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

export function BattleScreen({ run, onPlayCard, onEndTurn, onRestart }: BattleScreenProps) {
  const [playerHpIndicator, setPlayerHpIndicator] = useState<HpIndicator | null>(null);
  const [enemyHpIndicator, setEnemyHpIndicator] = useState<HpIndicator | null>(null);
  const [viewedPile, setViewedPile] = useState<"draw" | "discard" | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const previousHpRef = useRef<{ player: number; enemy: number; enemyId: string } | null>(null);

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

  if (!run.battle) return null;

  const enemyDefinition = getCurrentEnemy(run);

  return (
    <main className="screen">
      <header className="topbar battle-topbar">
        <div>
          <h1>Dark Seas of Ether</h1>
        </div>
        <div className="topbar-actions">
          <button className="secondary" onClick={() => setIsMapOpen(true)}>Map</button>
          <button className="secondary" onClick={onRestart}>Restart Run</button>
        </div>
      </header>

      {isMapOpen ? (
        <MapViewer
          encounters={run.encounters}
          currentIndex={run.encounterIndex}
          onClose={() => setIsMapOpen(false)}
        />
      ) : null}

      <section className="battlefield" aria-label="Battlefield">
        <ShipPanel
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

      <section className="turn-panel">
        <div className="resource-row">
          <strong>Turn {run.battle.turn}</strong>
          <span className="resource-pill">Energy {run.battle.energy}/3</span>
          {Object.entries(run.player.resources).map(([resourceId, resource]) => (
            <span className="resource-pill" key={resourceId}>
              {formatLabel(resourceId)} {resource.value}/{resource.max}
            </span>
          ))}
          <button className="resource-pill pile-button" onClick={() => setViewedPile("draw")}>
            Draw {run.battle.drawPile.length}
          </button>
          <button className="resource-pill pile-button" onClick={() => setViewedPile("discard")}>
            Discard {run.battle.discardPile.length}
          </button>
        </div>
        <button className="primary" onClick={onEndTurn}>End Turn</button>
      </section>

      {viewedPile ? (
        <PileViewer
          title={viewedPile === "draw" ? "Draw Pile" : "Discard Pile"}
          cards={viewedPile === "draw" ? run.battle.drawPile : run.battle.discardPile}
          onClose={() => setViewedPile(null)}
        />
      ) : null}

      <section className="hand-panel" aria-label="Hand">
        <div className="section-heading">
          <p className="eyebrow">Hand</p>
          <span>{run.battle.hand.length} cards ready</span>
        </div>
        <div className="hand">
          {run.battle.hand.map((card) => (
            <CardView
              key={card.instanceId}
              card={card}
              disabled={cards[card.cardId].cost > run.battle!.energy}
              resourceValues={Object.fromEntries(
                Object.entries(run.player.resources).map(([resourceId, resource]) => [resourceId, resource.value]),
              )}
              damageBonuses={getCardPlayedCrewDamageSources(
                run,
                cards[card.cardId],
                cards[card.cardId].tags.includes("attack") && !run.battle!.firstAttackBonusUsed,
              )}
              onPlay={onPlayCard}
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
    </main>
  );
}

type MapViewerProps = {
  encounters: RunState["encounters"];
  currentIndex: number;
  onClose: () => void;
};

function MapViewer({ encounters, currentIndex, onClose }: MapViewerProps) {
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
    <article className={`ship ${accent}`}>
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
