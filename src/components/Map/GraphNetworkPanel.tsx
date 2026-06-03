/**
 * GraphNetworkPanel.tsx
 *
 * Displays graph network summary information and optional debug details.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {GraphNode} from './GraphOverlay';
import {Pathfinder} from './pathfinding';

type FloorStats = {
  nodes: number;
  pathNodes: number;
  roomNodes: number;
  rooms: number;
};

type GraphNetworkPanelProps = {
  graphNodes: GraphNode[];
  floorStats: FloorStats;
  currentFloor: number;
  availableFloors: number[];
  pathfinder: Pathfinder | null;
  showGraphDebug: boolean;
  setShowGraphDebug: (value: boolean) => void;
};

export function GraphNetworkPanel({
  graphNodes,
  floorStats,
  currentFloor,
  availableFloors,
  pathfinder,
  showGraphDebug,
  setShowGraphDebug,
}: GraphNetworkPanelProps) {
  return (
    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-indigo-800">Graph Network</h3>
        <button
          onClick={() => setShowGraphDebug(!showGraphDebug)}
          className={`text-xs px-3 py-1 rounded transition-colors ${
            showGraphDebug
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-200 text-indigo-700 hover:bg-indigo-300'
          }`}
          title={showGraphDebug ? 'Hide debug info' : 'Show debug info'}
        >
          {showGraphDebug ? 'Debug ON' : 'Debug OFF'}
        </button>
      </div>

      <p className="text-sm text-indigo-700">
        {graphNodes.length} nodes total ({floorStats.nodes} on Floor{' '}
        {currentFloor})
      </p>
      <p className="text-xs text-indigo-600 mt-1">
        Path nodes: {graphNodes.filter(n => n.kind === 'path').length} total (
        {floorStats.pathNodes} on Floor {currentFloor})
      </p>
      <p className="text-xs text-indigo-600">
        Room nodes: {graphNodes.filter(n => n.kind === 'room').length} total (
        {floorStats.roomNodes} on Floor {currentFloor})
      </p>

      {/* Debug Information */}
      {showGraphDebug && (
        <div className="mt-3 p-3 bg-indigo-100 border border-indigo-300 rounded text-xs">
          <h4 className="font-semibold text-indigo-800 mb-2">Debug Info</h4>
          <div className="space-y-1">
            <p>
              <strong>Total Edges:</strong>{' '}
              {graphNodes.reduce((acc, node) => acc + node.neighbors.length, 0)}
            </p>
            <p>
              <strong>Avg Connections per Node:</strong>{' '}
              {graphNodes.length > 0
                ? (
                    graphNodes.reduce(
                      (acc, node) => acc + node.neighbors.length,
                      0,
                    ) / graphNodes.length
                  ).toFixed(1)
                : '0'}
            </p>
            <p>
              <strong>Rooms with Numbers:</strong>{' '}
              {graphNodes.filter(n => n.kind === 'room' && n.roomNumber).length}
            </p>
            <p>
              <strong>Available Floors:</strong> {availableFloors.join(', ')}
            </p>
            <p>
              <strong>Pathfinder Status:</strong>{' '}
              {pathfinder ? 'Ready' : 'Loading...'}
            </p>
          </div>

          {/* Sample node details */}
          {graphNodes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-indigo-200">
              <p className="font-semibold text-indigo-800">Sample Node:</p>
              <p>
                <strong>ID:</strong> {graphNodes[0].id}
              </p>
              <p>
                <strong>Type:</strong> {graphNodes[0].kind}
              </p>
              <p>
                <strong>Position:</strong> (
                {graphNodes[0].position.x.toFixed(1)},{' '}
                {graphNodes[0].position.y.toFixed(1)})
              </p>
              <p>
                <strong>Floor:</strong> {graphNodes[0].position.floorNum}
              </p>
              <p>
                <strong>Neighbors:</strong> {graphNodes[0].neighbors.length}
              </p>
              {graphNodes[0].roomNumber && (
                <p>
                  <strong>Room:</strong> {graphNodes[0].roomNumber}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
