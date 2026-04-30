import { ships } from "../data/ships";

type ShipSelectScreenProps = {
  onSelectShip: (shipId: string) => void;
};

export function ShipSelectScreen({ onSelectShip }: ShipSelectScreenProps) {
  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Choose your ship</p>
          <h1>Dark Seas of Ether</h1>
          <p className="screen-intro">Pick a cursed hull and test your luck against the tide.</p>
        </div>
      </header>

      <section className="ship-select-grid">
        {ships.map((ship) => (
          <button className="ship-select-card" key={ship.id} onClick={() => onSelectShip(ship.id)}>
            <div>
              <p className="eyebrow">{ship.subtitle}</p>
              <h2>{ship.name}</h2>
            </div>
            <p>{ship.description}</p>
            <div className="ship-select-stats">
              <strong>{ship.maxHp} HP</strong>
              <span>{describePassive(ship.passive)}</span>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}

function describePassive(passive: (typeof ships)[number]["passive"]): string {
  if (passive.type === "battleStartBlock") return `Start each battle with ${passive.amount} block`;
  if (passive.type === "firstAttackBonus") return `First attack each turn deals +${passive.amount}`;
  return `Draw ${passive.amount} extra card on turn one`;
}
