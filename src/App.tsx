import { useEffect, useState } from "react";
import { BattleScreen } from "./components/BattleScreen";
import { CrewRewardScreen } from "./components/CrewRewardScreen";
import { EventScreen } from "./components/EventScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { PortScreen } from "./components/PortScreen";
import { RewardScreen } from "./components/RewardScreen";
import { ShipSelectScreen } from "./components/ShipSelectScreen";
import { VictoryScreen } from "./components/VictoryScreen";
import { endTurn, playCard } from "./game/combatEngine";
import { createInitialRun } from "./game/createInitialRun";
import {
  chooseCrew,
  chooseEventCardReward,
  chooseReward,
  continueAfterEventReward,
  removeCardAtPort,
  repairAtPort,
  resolveEventChoice,
  skipReward,
  startCardRemoval,
  startCrewRecruitment,
} from "./game/runEngine";
import { clearRun, loadRun, saveRun } from "./game/saveLoad";
import type { RunState } from "./types/game";

export default function App() {
  const [run, setRun] = useState<RunState | null>(() => loadRun());

  useEffect(() => {
    if (run) saveRun(run);
  }, [run]);

  function restart() {
    clearRun();
    setRun(null);
  }

  function startRun(shipId: string) {
    const nextRun = createInitialRun(shipId);
    saveRun(nextRun);
    setRun(nextRun);
  }

  function updateRun(update: (current: RunState) => RunState) {
    setRun((current) => (current ? update(current) : current));
  }

  if (!run) {
    return <ShipSelectScreen onSelectShip={startRun} />;
  }

  if (run.phase === "reward") {
    return (
      <RewardScreen
        run={run}
        onChooseReward={(cardId) => updateRun((current) => chooseReward(current, cardId))}
        onSkipReward={() => updateRun((current) => skipReward(current))}
        onRestart={restart}
      />
    );
  }

  if (run.phase === "crewReward") {
    return (
      <CrewRewardScreen
        run={run}
        onChooseCrew={(crewId) => updateRun((current) => chooseCrew(current, crewId))}
        onRestart={restart}
      />
    );
  }

  if (run.phase === "port" || run.phase === "removeCard") {
    return (
      <PortScreen
        run={run}
        onRepair={() => updateRun((current) => repairAtPort(current))}
        onRecruitCrew={() => updateRun((current) => startCrewRecruitment(current))}
        onStartRemoval={() => updateRun((current) => startCardRemoval(current))}
        onRemoveCard={(instanceId) => updateRun((current) => removeCardAtPort(current, instanceId))}
        onRestart={restart}
      />
    );
  }

  if (run.phase === "event" || run.phase === "eventReward" || run.phase === "eventCardReward") {
    return (
      <EventScreen
        run={run}
        onChooseEventChoice={(choiceId) => updateRun((current) => resolveEventChoice(current, choiceId))}
        onChooseEventCard={(cardId) => updateRun((current) => chooseEventCardReward(current, cardId))}
        onContinue={() => updateRun((current) => continueAfterEventReward(current))}
        onRestart={restart}
      />
    );
  }

  if (run.phase === "victory") {
    return <VictoryScreen onRestart={restart} />;
  }

  if (run.phase === "defeat") {
    return <GameOverScreen onRestart={restart} />;
  }

  return (
    <BattleScreen
      run={run}
      onPlayCard={(instanceId) => updateRun((current) => playCard(current, instanceId))}
      onEndTurn={() => updateRun((current) => endTurn(current))}
      onRestart={restart}
    />
  );
}
