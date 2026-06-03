/**
 * SelectedRoomPanel.tsx
 *
 * Displays details for the currently selected room and provides controls
 * for setting that room as the navigation start or destination.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {Room} from './MapView';

type SelectedRoom = Room & {
  id: number;
};

type SelectedRoomPanelProps = {
  selectedRoom: SelectedRoom | null | undefined;
  clearSelection: () => void;
  onSetStartPoint: (room: SelectedRoom) => void;
  onSetDestination: (room: SelectedRoom) => void;
};

export function SelectedRoomPanel({
  selectedRoom,
  clearSelection,
  onSetStartPoint,
  onSetDestination,
}: SelectedRoomPanelProps) {
  if (!selectedRoom) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-blue-800">Selected Room</h3>
        <button
          onClick={clearSelection}
          className="text-blue-600 hover:text-blue-800 font-bold"
        >
          ×
        </button>
      </div>

      <p className="font-medium">{selectedRoom.name}</p>

      <p className="text-sm text-gray-600">
        {selectedRoom.building} • Floor {selectedRoom.floor}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSetStartPoint(selectedRoom)}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Set as Start
        </button>

        <button
          onClick={() => onSetDestination(selectedRoom)}
          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
        >
          Set as Destination
        </button>
      </div>
    </div>
  );
}
