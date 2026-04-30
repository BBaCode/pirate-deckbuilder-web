import type { ReactNode } from "react";
import { cards } from "../data/cards";
import { getCurrentEnemy, getEnemyIntent } from "../game/combatEngine";
import { getCardPlayedCrewDamageSources } from "../game/crewEngine";
import type { RunState } from "../types/game";
import { CardView } from "./CardView";
import { CrewDisplay } from "./CrewDisplay";
import { EnemyIntent } from "./EnemyIntent";
import { RunMap } from "./RunMap";

type BattleScreenProps = {
  run: RunState;
  onPlayCard: (instanceId: string) => void;
  onEndTurn: () => void;
  onRestart: () => void;
};

export function BattleScreen({ run, onPlayCard, onEndTurn, onRestart }: BattleScreenProps) {
  if (!run.battle) return null;

  const enemyDefinition = getCurrentEnemy(run);

  return (
    <main className="screen">
      <header className="topbar battle-topbar">
        <div>
          <h1>Dark Seas of Ether</h1>
        </div>
        <button className="secondary" onClick={onRestart}>Restart Run</button>
      </header>
      <RunMap encounters={run.encounters} currentIndex={run.encounterIndex} />

      <section className="battlefield" aria-label="Battlefield">
        <ShipPanel
          name={run.ship.name}
          subtitle={run.ship.subtitle}
          hp={run.player.hp}
          maxHp={run.player.maxHp}
          block={run.player.block}
          accent="player"
          footer={<CrewDisplay crew={run.crew} className="ship-crew" />}
        />

        <ShipPanel
          name={enemyDefinition.name}
          hp={run.battle.enemy.hp}
          maxHp={run.battle.enemy.maxHp}
          block={run.battle.enemy.block}
          accent="enemy"
          intent={<EnemyIntent action={getEnemyIntent(run)} />}
        />
      </section>

      <section className="turn-panel">
        <div className="resource-row">
          <strong>Turn {run.battle.turn}</strong>
          <span className="resource-pill">Energy {run.battle.energy}/3</span>
          <span className="resource-pill">Draw {run.battle.drawPile.length}</span>
          <span className="resource-pill">Discard {run.battle.discardPile.length}</span>
        </div>
        <button className="primary" onClick={onEndTurn}>End Turn</button>
      </section>

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

type ShipPanelProps = {
  name: string;
  subtitle?: string;
  hp: number;
  maxHp: number;
  block: number;
  accent: "player" | "enemy";
  intent?: ReactNode;
  footer?: ReactNode;
};

function ShipPanel({ name, subtitle, hp, maxHp, block, accent, intent, footer }: ShipPanelProps) {
  const hpPercent = Math.max(0, (hp / maxHp) * 100);

  return (
    <article className={`ship ${accent}`}>
      <div className="ship-art" aria-hidden="true">
        <span>{accent === "player" ? "SHIP" : "FOE"}</span>
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
      <div className="stat-row">
        <strong>{hp}/{maxHp} HP</strong>
        <span className="block-badge">{block} Block</span>
      </div>
      {footer}
    </article>
  );
}
