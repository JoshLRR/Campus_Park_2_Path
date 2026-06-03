/**
 * FloorInfoPanel.tsx
 *
 * Displays the currently selected floor, floor-level graph statistics,
 * and buttons for switching between available floors.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

type FloorStats = {
  nodes: number;
  pathNodes: number;
  roomNodes: number;
  rooms: number;
};

type FloorInfoPanelProps = {
  currentFloor: number;
  floorStats: FloorStats;
  availableFloors: number[];
  onFloorChange: (floor: number) => void;
};

export function FloorInfoPanel({
  currentFloor,
  floorStats,
  availableFloors,
  onFloorChange,
}: FloorInfoPanelProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        Floor {currentFloor}
      </h3>
      <div className="text-sm space-y-1">
        <p>
          <strong>Graph nodes:</strong> {floorStats.nodes}
        </p>
        <p>
          <strong>Path nodes:</strong> {floorStats.pathNodes}
        </p>
        <p>
          <strong>Room nodes:</strong> {floorStats.roomNodes}
        </p>
        <p>
          <strong>Rooms:</strong> {floorStats.rooms}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-xs text-blue-600 mb-2">Available floors:</p>
        <div className="flex flex-wrap gap-1">
          {availableFloors.map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange(floor)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                floor === currentFloor
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
