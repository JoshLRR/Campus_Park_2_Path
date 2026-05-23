/**
 * RouteStatusPanel.tsx
 *
 * Displays successful route summary information or a route error message.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {NavigationPoint} from '../Map/MapView';
import {PathResult} from '../Map/pathfinding';

type RouteStatusPanelProps = {
  currentRoute: PathResult | null;
  startPoint: NavigationPoint | null;
  destinationPoint: NavigationPoint | null;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;
  clearRoute: () => void;
};

export function RouteStatusPanel({
  currentRoute,
  startPoint,
  destinationPoint,
  showRoute,
  setShowRoute,
  clearRoute,
}: RouteStatusPanelProps) {
  return (
    <>
      {currentRoute && currentRoute.success && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Current Route
          </h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Status:</strong> Route found!
            </p>
            <p>
              <strong>Distance:</strong> {currentRoute.totalDistance.toFixed(1)}{' '}
              units
            </p>
            <p>
              <strong>Waypoints:</strong> {currentRoute.path.length}
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={clearRoute}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Clear Route
            </button>
            <button
              onClick={() => setShowRoute(!showRoute)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showRoute
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              {showRoute ? 'Hide Route' : 'Show Route'}
            </button>
          </div>
        </div>
      )}

      {currentRoute &&
        !currentRoute.success &&
        startPoint &&
        destinationPoint && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Route Error
            </h3>
            <p className="text-sm text-red-600">
              No route could be found between the selected start and destination
              points.
            </p>
            <div className="mt-3">
              <button
                onClick={clearRoute}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
              >
                Clear Points
              </button>
            </div>
          </div>
        )}
    </>
  );
}
