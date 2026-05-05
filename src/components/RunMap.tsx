import type { Encounter, EncounterType } from "../types/game";

const mapBackground = new URL("../public/images/run-map.png", import.meta.url)
  .href;

type RunMapProps = {
  encounters: Encounter[];
  currentIndex: number;
};

const labels: Record<EncounterType, string> = {
  normal: "Battle",
  elite: "Elite",
  port: "Port",
  event: "Event",
  boss: "Boss",
};

function EncounterIcon({ type }: { type: EncounterType }) {
  if (type === "normal") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h3l9 13-2 2L4 7z" />
        <path d="M19 4h-3L7 17l2 2L20 7z" />
        <path d="M7 16l-3 3" />
        <path d="M17 16l3 3" />
      </svg>
    );
  }

  if (type === "event") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8a4 4 0 0 1 8 1c0 3-4 3-4 6" />
        <path d="M12 19h.01" />
      </svg>
    );
  }

  if (type === "elite") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c4 0 7 3 7 7 0 3-2 5-4 6v3H9v-3c-2-1-4-3-4-6 0-4 3-7 7-7z" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M10 15h4" />
      </svg>
    );
  }

  if (type === "port") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v15" />
        <path d="M8 8h8" />
        <path d="M10 4h4" />
        <path d="M5 14c1 4 4 6 7 6s6-2 7-6" />
        <path d="M5 14h3" />
        <path d="M16 14h3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9l3-5 4 5 4-5 3 5v5H5z" />
      <path d="M7 14c1 4 3 6 5 6s4-2 5-6" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
    </svg>
  );
}

const iconTitles: Record<EncounterType, string> = {
  normal: "Battle icon",
  elite: "Elite icon",
  port: "Port icon",
  event: "Event icon",
  boss: "Boss icon",
};

const legendTypes: EncounterType[] = [
  "normal",
  "event",
  "elite",
  "port",
  "boss",
];

type MapNodePosition = {
  encounterIndex: number;
  x: number;
  y: number;
};

const mapNodes: MapNodePosition[] = [
  { encounterIndex: 0, x: 70, y: 35 },
  { encounterIndex: 1, x: 40, y: 28 },
  { encounterIndex: 2, x: 55, y: 52 },
  { encounterIndex: 3, x: 72, y: 66 },
  { encounterIndex: 4, x: 57, y: 80 },
  { encounterIndex: 5, x: 32, y: 45 },
  { encounterIndex: 6, x: 31, y: 60 },
];

const routeConnections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
] as const;

function getMapNode(index: number, encounterCount: number): MapNodePosition {
  return (
    mapNodes[index] ?? {
      encounterIndex: index,
      x: encounterCount <= 1 ? 50 : 12 + (index / (encounterCount - 1)) * 76,
      y: index % 2 === 0 ? 58 : 42,
    }
  );
}

export function RunMap({ encounters, currentIndex }: RunMapProps) {
  const positionedNodes = encounters.map((encounter, index) => ({
    ...getMapNode(index, encounters.length),
    encounter,
    index,
  }));

  return (
    <nav className="run-map" aria-label="Run progress">
      <img
        className="run-map-image"
        src={mapBackground}
        alt=""
        aria-hidden="true"
      />
      <div className="run-map-legend" aria-label="Map legend">
        {legendTypes.map((type) => (
          <div className="run-map-legend-item" key={type}>
            <span
              className={`run-map-legend-marker ${type}`}
              title={iconTitles[type]}
              aria-hidden="true"
            >
              <EncounterIcon type={type} />
            </span>
            <span>{labels[type]}</span>
          </div>
        ))}
      </div>
      <svg
        className="run-map-routes"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {routeConnections.map(([fromIndex, toIndex]) => {
          const fromNode = positionedNodes[fromIndex];
          const toNode = positionedNodes[toIndex];

          if (!fromNode || !toNode) {
            return null;
          }

          const routeState =
            toIndex <= currentIndex
              ? "done"
              : fromIndex === currentIndex
                ? "available"
                : "locked";

          return (
            <line
              className={`run-map-route ${routeState}`}
              key={`${fromIndex}-${toIndex}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
            />
          );
        })}
      </svg>
      <div className="run-map-nodes">
        {positionedNodes.map(({ encounter, index, x, y }) => {
          const nodeState = encounter.completed
            ? "done"
            : index === currentIndex
              ? "current"
              : "locked";

          return (
            <button
              className={`map-node ${encounter.type} ${nodeState}`}
              disabled={nodeState === "locked"}
              key={encounter.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              type="button"
              aria-label={`${labels[encounter.type]} encounter ${index + 1}${nodeState === "current" ? ", current" : ""}`}
            >
              <span className="map-node-marker">
                <EncounterIcon type={encounter.type} />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
