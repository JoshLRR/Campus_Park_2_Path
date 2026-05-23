/**
 * CrossFloorRouteWarning.tsx
 *
 * Displays a warning when the current route spans multiple floors.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {GraphNode} from './GraphOverlay';
import {PathResult} from './pathfinding';

type CrossFloorRouteWarningProps = {
  currentRoute: PathResult | null;
  graphNodes: GraphNode[];
  currentFloor: number;
  onFloorChange: (floor: number) => void;
};

export function CrossFloorRouteWarning({
  currentRoute,
  graphNodes,
  currentFloor,
  onFloorChange,
}: CrossFloorRouteWarningProps) {
  if (!currentRoute || !currentRoute.success) {
    return null;
  }

  const routeFloors = [
    ...new Set(
      currentRoute.path.map(nodeId => {
        const node = graphNodes.find(n => n.id === nodeId);
        return node ? node.position.floorNum : currentFloor;
      }),
    ),
  ].sort((a, b) => a - b);

  if (routeFloors.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
      <h3 className="text-lg font-semibold text-amber-800 mb-2">
        Multi-Floor Route
      </h3>
      <p className="text-sm text-amber-700 mb-2">
        This route spans multiple floors: {routeFloors.join(', ')}
      </p>
      <div className="flex flex-wrap gap-1">
        {routeFloors.map(floor => (
          <button
            key={floor}
            onClick={() => onFloorChange(floor)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              floor === currentFloor
                ? 'bg-amber-600 text-white'
                : 'bg-amber-200 text-amber-800 hover:bg-amber-300'
            }`}
          >
            Floor {floor}
          </button>
        ))}
      </div>
    </div>
  );
}
