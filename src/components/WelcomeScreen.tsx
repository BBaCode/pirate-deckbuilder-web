const heroImage = new URL("../public/images/welcome-hero.png", import.meta.url).href;

type WelcomeScreenProps = {
  onPlay: () => void;
};

export function WelcomeScreen({ onPlay }: WelcomeScreenProps) {
  return (
    <main className="welcome-screen">
      <section className="welcome-hero" aria-label="Dark Seas of Ether">
        <img className="welcome-hero-image" src={heroImage} alt="" aria-hidden="true" />
        <div className="welcome-hero-shade" aria-hidden="true" />
        <div className="welcome-content">
          <p className="eyebrow welcome-kicker">A crownless sea waits</p>
          <h1>Dark Seas of Ether</h1>
          <div className="welcome-lore">
            <p>
              In the elder age of sail, before the moon learned pity, the Deep Seas were ruled by pirate-lords who bound their black flags to drowned stars.
            </p>
            <p>
              Their captains grew rich on wreckage and sorcery, raising reef-fortresses where bells tolled beneath the water and no honest lantern dared burn.
            </p>
            <p>
              Now the last free fleets gather at the edge of the world, where timber creaks like old prophecy and every cannon is sworn against the abyss.
            </p>
            <p>
              Take command, break the evil covenants of the pirate kings, and carve a wake through darkness until the deep itself remembers the name of humankind.
            </p>
          </div>
          <button className="primary welcome-play" onClick={onPlay}>Play</button>
        </div>
      </section>
    </main>
  );
}
