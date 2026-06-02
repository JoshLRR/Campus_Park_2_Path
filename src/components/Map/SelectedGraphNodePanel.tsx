/**
 * SelectedGraphNodePanel.tsx
 *
 * Displays details for the currently selected graph node and provides controls
 * for setting that node as the navigation start or destination.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {GraphNode} from './GraphOverlay';

type SelectedGraphNodePanelProps = {
  selectedGraphNode: GraphNode | null | undefined;
  clearSelection: () => void;
  onSetStartPoint: (node: GraphNode) => void;
  onSetDestination: (node: GraphNode) => void;
};

export function SelectedGraphNodePanel({
  selectedGraphNode,
  clearSelection,
  onSetStartPoint,
  onSetDestination,
}: SelectedGraphNodePanelProps) {
  if (!selectedGraphNode) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-red-800">
          Selected Graph Node
        </h3>
        <button
          onClick={clearSelection}
          className="text-red-600 hover:text-red-800 font-bold"
        >
          ×
        </button>
      </div>

      <p className="font-medium">
        {selectedGraphNode.roomNumber || `Node ${selectedGraphNode.id}`}
      </p>

      <p className="text-sm text-gray-600">
        Type: {selectedGraphNode.kind} • ID: {selectedGraphNode.id}
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Position: ({selectedGraphNode.position.x.toFixed(1)},{' '}
        {selectedGraphNode.position.y.toFixed(1)})
      </p>

      <p className="text-xs text-gray-500">
        Floor: {selectedGraphNode.position.floorNum}
      </p>

      <p className="text-xs text-gray-500">
        Connections: {selectedGraphNode.neighbors.length}
      </p>

      {selectedGraphNode.features && selectedGraphNode.features.length > 0 && (
        <p className="text-xs text-gray-500">
          Features: {selectedGraphNode.features.join(', ')}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSetStartPoint(selectedGraphNode)}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Set as Start
        </button>

        <button
          onClick={() => onSetDestination(selectedGraphNode)}
          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
        >
          Set as Destination
        </button>
      </div>
    </div>
  );
}
