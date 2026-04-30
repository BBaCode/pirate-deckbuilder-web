type VictoryScreenProps = {
  onRestart: () => void;
};

export function VictoryScreen({ onRestart }: VictoryScreenProps) {
  return (
    <main className="screen outcome">
      <p className="eyebrow">Victory</p>
      <h1>The seas are yours</h1>
      <p>You survived the voyage and sent the final foe back into the mist.</p>
      <button className="primary" onClick={onRestart}>Sail Again</button>
    </main>
  );
}
