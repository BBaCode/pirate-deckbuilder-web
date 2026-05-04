import { playableShips, ships } from "../data/ships";

type ShipSelectScreenProps = {
  onSelectShip: (shipId: string) => void;
};

const shipImages: Record<string, string> = {
  cannon_ship: new URL(
    "../public/images/ship-crimson-wake.png",
    import.meta.url,
  ).href,
  iron_gull: new URL("../public/images/ship-iron-gull.png", import.meta.url)
    .href,
  crimson_wake: new URL(
    "../public/images/ship-crimson-wake.png",
    import.meta.url,
  ).href,
  mist_reaver: new URL("../public/images/ship-mist-reaver.png", import.meta.url)
    .href,
};

export function ShipSelectScreen({ onSelectShip }: ShipSelectScreenProps) {
  return (
    <main className="screen centered">
      <header className="topbar">
        <div>
          <p className="eyebrow">Choose your ship</p>
          <h1>Dark Seas of Ether</h1>
          <p className="screen-intro">
            Pick a cursed hull and test your luck against the tide.
          </p>
        </div>
      </header>

      <section className="ship-select-grid">
        {playableShips.map((ship) => (
          <button
            className="ship-select-card"
            key={ship.id}
            onClick={() => onSelectShip(ship.id)}
          >
            <img
              className="ship-select-image"
              src={shipImages[ship.id]}
              alt=""
              aria-hidden="true"
            />
            <div>
              <p className="eyebrow">{ship.subtitle}</p>
              <h2>{ship.name}</h2>
            </div>
            {/* Unsure if needed? */}
            {/* <p>{ship.description}</p> */}
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
  if (passive.type === "battleStartBlock")
    return `Start each battle with ${passive.amount} block`;
  if (passive.type === "battleStartResource")
    return `Start each battle with ${passive.amount} ${formatLabel(passive.resourceId)}`;
  if (passive.type === "firstAttackBonus")
    return `First attack each turn deals +${passive.amount}`;
  return `Draw ${passive.amount} extra card on turn one`;
}

function formatLabel(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
