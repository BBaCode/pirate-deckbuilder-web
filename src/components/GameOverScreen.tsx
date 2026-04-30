type GameOverScreenProps = {
  onRestart: () => void;
};

export function GameOverScreen({ onRestart }: GameOverScreenProps) {
  return (
    <main className="screen outcome">
      <p className="eyebrow">Defeat</p>
      <h1>Lost at sea</h1>
      <p>Your ship went down, but the next run is already calling.</p>
      <button className="primary" onClick={onRestart}>Start New Run</button>
    </main>
  );
}
