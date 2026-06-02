/**
 * GraphDisplayControls.tsx
 *
 * Renders checkbox controls for toggling graph visualization layers.
 *
 * This component is intentionally extracted from App.tsx without changing
 * behavior. It controls visibility for path nodes, room nodes, path edges,
 * room connections, and the current route overlay.
 */

type GraphDisplayControlsProps = {
  showPathNodes: boolean;
  setShowPathNodes: (value: boolean) => void;
  showRoomNodes: boolean;
  setShowRoomNodes: (value: boolean) => void;
  showPathEdges: boolean;
  setShowPathEdges: (value: boolean) => void;
  showRoomConnections: boolean;
  setShowRoomConnections: (value: boolean) => void;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;
};

export function GraphDisplayControls({
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
}: GraphDisplayControlsProps) {
  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
      <h3 className="text-lg font-semibold text-green-800 mb-3">
        Graph Display
      </h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPathNodes}
            onChange={e => setShowPathNodes(e.target.checked)}
            className="rounded"
          />
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Show Path Nodes
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showRoomNodes}
            onChange={e => setShowRoomNodes(e.target.checked)}
            className="rounded"
          />
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Show Room Nodes
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPathEdges}
            onChange={e => setShowPathEdges(e.target.checked)}
            className="rounded"
          />
          <span className="flex items-center gap-2">
            <div className="w-6 h-1 bg-indigo-600"></div>
            Show Path Edges
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showRoomConnections}
            onChange={e => setShowRoomConnections(e.target.checked)}
            className="rounded"
          />
          <span className="flex items-center gap-2">
            <div
              className="w-6 h-1 bg-indigo-600"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #4f46e5 0px, #4f46e5 4px, transparent 4px, transparent 8px)',
              }}
            ></div>
            Show Room Connections
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showRoute}
            onChange={e => setShowRoute(e.target.checked)}
            className="rounded"
          />
          <span className="flex items-center gap-2">
            <div className="w-6 h-1 bg-yellow-500"></div>
            Show Route
          </span>
        </label>
      </div>

      <div className="mt-3 pt-2 border-t border-green-200 flex gap-2">
        <button
          onClick={() => {
            setShowPathNodes(true);
            setShowRoomNodes(true);
            setShowPathEdges(true);
            setShowRoomConnections(true);
            setShowRoute(true);
          }}
          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
        >
          Show All
        </button>
        <button
          onClick={() => {
            setShowPathNodes(false);
            setShowRoomNodes(false);
            setShowPathEdges(false);
            setShowRoomConnections(false);
            setShowRoute(false);
          }}
          className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          Hide All
        </button>
      </div>
    </div>
  );
}
