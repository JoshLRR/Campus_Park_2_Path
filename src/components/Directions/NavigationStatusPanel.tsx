/**
 * NavigationStatusPanel.tsx
 *
 * Displays the currently selected start and destination navigation points.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {NavigationPoint} from '../Map/MapView';
import {PathResult} from '../Map/pathfinding';

type NavigationStatusPanelProps = {
  startPoint: NavigationPoint | null;
  destinationPoint: NavigationPoint | null;
  currentRoute: PathResult | null;
  clearStartPoint: () => void;
  clearDestination: () => void;
};

export function NavigationStatusPanel({
  startPoint,
  destinationPoint,
  currentRoute,
  clearStartPoint,
  clearDestination,
}: NavigationStatusPanelProps) {
  if (!startPoint && !destinationPoint) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
      <h3 className="text-lg font-semibold text-purple-800 mb-2">Navigation</h3>

      {startPoint && (
        <div className="mb-2 text-sm">
          <span className="text-red-600 font-medium">Start:</span>{' '}
          {startPoint.label}
          {startPoint.floor && (
            <span className="text-gray-500"> (Floor {startPoint.floor})</span>
          )}
          <button
            onClick={clearStartPoint}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {destinationPoint && (
        <div className="mb-2 text-sm">
          <span className="text-green-600 font-medium">Destination:</span>{' '}
          {destinationPoint.label}
          {destinationPoint.floor && (
            <span className="text-gray-500">
              {' '}
              (Floor {destinationPoint.floor})
            </span>
          )}
          <button
            onClick={clearDestination}
            className="ml-2 text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {startPoint && destinationPoint && (
        <div className="mt-3 pt-2 border-t border-purple-200">
          <button
            onClick={() => {
              // Future: Show detailed turn-by-turn directions
              console.log('Route details:', currentRoute);
            }}
            className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
          >
            Get Detailed Directions
          </button>
        </div>
      )}
    </div>
  );
}
