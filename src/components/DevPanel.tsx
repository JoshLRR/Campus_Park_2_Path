/**
 * DevPanel.tsx
 *
 * Developer-only overlay (toggled via the "Dev" button) for inspecting
 * and debugging the live graph — toggles for graph/route overlay
 * visibility, per-floor node/room stats, and quick "set as start/destination"
 * actions on the currently selected graph node.
 */

import {GraphNode} from './Map/GraphOverlay';
import {Pathfinder} from './Map/pathfinding';

type FloorStats = {
  nodes: number;
  pathNodes: number;
  roomNodes: number;
  rooms: number;
};

type DevPanelProps = {
  onClose: () => void;

  showPathNodes: boolean;
  setShowPathNodes: (v: boolean) => void;
  showRoomNodes: boolean;
  setShowRoomNodes: (v: boolean) => void;
  showPathEdges: boolean;
  setShowPathEdges: (v: boolean) => void;
  showRoomConnections: boolean;
  setShowRoomConnections: (v: boolean) => void;
  showRoute: boolean;
  setShowRoute: (v: boolean) => void;
  showGraphDebug: boolean;
  setShowGraphDebug: (v: boolean) => void;

  graphNodes: GraphNode[];
  floorStats: FloorStats;
  currentFloor: number;
  availableFloors: number[];
  pathfinder: Pathfinder | null;

  selectedGraphNode: GraphNode | null | undefined;
  clearSelection: () => void;
  onSetStartPointFromNode: (node: GraphNode) => void;
  onSetDestinationFromNode: (node: GraphNode) => void;
};

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
};

function ToggleRow({
  label,
  checked,
  onChange,
  color = 'bg-blue-500',
}: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? color : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </label>
  );
}

export function DevPanel({
  onClose,
  showPathNodes,
  setShowPathNodes,
  showRoomNodes,
  setShowRoomNodes,
  showPathEdges,
  setShowPathEdges,
  showRoomConnections,
  setShowRoomConnections,
  showRoute,
  setShowRoute,
  showGraphDebug,
  setShowGraphDebug,
  graphNodes,
  floorStats,
  currentFloor,
  availableFloors,
  pathfinder,
  selectedGraphNode,
  clearSelection,
  onSetStartPointFromNode,
  onSetDestinationFromNode,
}: DevPanelProps) {
  const totalEdges = graphNodes.reduce(
    (n, node) => n + node.neighbors.length,
    0,
  );
  const avgConn =
    graphNodes.length > 0 ? (totalEdges / graphNodes.length).toFixed(1) : '0';

  return (
    <div className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Dev
          </span>
          <span className="text-sm font-semibold text-gray-800">
            Developer View
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Overlay toggles */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Graph Overlay
          </p>
          <ToggleRow
            label="Path Nodes"
            checked={showPathNodes}
            onChange={setShowPathNodes}
            color="bg-blue-500"
          />
          <ToggleRow
            label="Room Nodes"
            checked={showRoomNodes}
            onChange={setShowRoomNodes}
            color="bg-red-400"
          />
          <ToggleRow
            label="Path Edges"
            checked={showPathEdges}
            onChange={setShowPathEdges}
            color="bg-indigo-500"
          />
          <ToggleRow
            label="Room Connections"
            checked={showRoomConnections}
            onChange={setShowRoomConnections}
            color="bg-purple-500"
          />
          <ToggleRow
            label="Show Route"
            checked={showRoute}
            onChange={setShowRoute}
            color="bg-blue-600"
          />
          <ToggleRow
            label="Node Labels"
            checked={showGraphDebug}
            onChange={setShowGraphDebug}
            color="bg-gray-600"
          />
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Stats — Floor {currentFloor}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>Total nodes</span>
            <span className="font-medium text-gray-800">
              {graphNodes.length}
            </span>
            <span>Floor nodes</span>
            <span className="font-medium text-gray-800">
              {floorStats.nodes}
            </span>
            <span>Path / Room</span>
            <span className="font-medium text-gray-800">
              {floorStats.pathNodes} / {floorStats.roomNodes}
            </span>
            <span>Total edges</span>
            <span className="font-medium text-gray-800">{totalEdges}</span>
            <span>Avg connections</span>
            <span className="font-medium text-gray-800">{avgConn}</span>
            <span>Floors</span>
            <span className="font-medium text-gray-800">
              {availableFloors.join(', ')}
            </span>
            <span>Pathfinder</span>
            <span
              className={`font-medium ${pathfinder ? 'text-green-600' : 'text-amber-600'}`}
            >
              {pathfinder ? 'Ready' : 'Loading'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Legend
          </p>
          <div className="space-y-1.5 text-xs text-gray-600">
            {showPathNodes && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <span>Path Node</span>
              </div>
            )}
            {showRoomNodes && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                <span>Room Node</span>
              </div>
            )}
            {showPathEdges && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-indigo-500 flex-shrink-0" />
                <span>Path Edge</span>
              </div>
            )}
            {showRoomConnections && (
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-0.5 flex-shrink-0"
                  style={{
                    background:
                      'repeating-linear-gradient(90deg,#7c3aed 0,#7c3aed 3px,transparent 3px,transparent 6px)',
                  }}
                />
                <span>Room Connection</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200 flex-shrink-0" />
              <span>Start point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span>Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-1 rounded bg-blue-500 flex-shrink-0" />
              <span>Route</span>
            </div>
          </div>
        </div>

        {/* Selected node */}
        {selectedGraphNode && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Selected Node
              </p>
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Deselect
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-sm text-gray-800">
                {selectedGraphNode.roomNumber ?? `Node ${selectedGraphNode.id}`}
              </p>
              <p>
                Type:{' '}
                <span className="font-medium capitalize">
                  {selectedGraphNode.kind}
                </span>{' '}
                &middot; ID: {selectedGraphNode.id}
              </p>
              <p>
                Floor: {selectedGraphNode.position.floorNum} &middot; Edges:{' '}
                {selectedGraphNode.neighbors.length}
              </p>
              <p className="text-gray-500">
                ({selectedGraphNode.position.x.toFixed(1)},{' '}
                {selectedGraphNode.position.y.toFixed(1)})
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onSetStartPointFromNode(selectedGraphNode)}
                className="flex-1 text-xs bg-blue-500 text-white py-1.5 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Set Start
              </button>
              <button
                onClick={() => onSetDestinationFromNode(selectedGraphNode)}
                className="flex-1 text-xs bg-red-500 text-white py-1.5 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Set Dest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
