/**
 * RightRoomPanel.tsx
 *
 * Displays the optional right-side room list panel for the current floor.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {Room} from './MapView';

type PanelRoom = Room & {
  id: number;
};

type RightRoomPanelProps = {
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (value: boolean) => void;
  currentFloor: number;
  sampleRooms: PanelRoom[];
  selectedRoomId: number | null;
  onRoomSelect: (roomId: number) => void;
  onSetStartPoint: (room: PanelRoom) => void;
  onSetDestination: (room: PanelRoom) => void;
};

export function RightRoomPanel({
  isRightPanelOpen,
  setIsRightPanelOpen,
  currentFloor,
  sampleRooms,
  selectedRoomId,
  onRoomSelect,
  onSetStartPoint,
  onSetDestination,
}: RightRoomPanelProps) {
  if (!isRightPanelOpen) {
    return null;
  }

  const currentFloorRooms = sampleRooms.filter(
    room => room.floor === currentFloor,
  );

  return (
    <div className="w-1/4 h-full bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="w-full h-full p-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Rooms (Floor {currentFloor})
          </h3>
          <button
            onClick={() => setIsRightPanelOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            title="Close panel"
          >
            ×
          </button>
        </div>

        {/* Floor-specific room list */}
        <div className="space-y-2">
          {currentFloorRooms.map(room => (
            <div
              key={room.id}
              className={`p-3 border rounded-md transition-colors cursor-pointer ${
                selectedRoomId === room.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => onRoomSelect(room.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-gray-500">{room.building}</p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSetStartPoint(room);
                    }}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                  >
                    Start
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSetDestination(room);
                    }}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    Dest
                  </button>
                </div>
              </div>
            </div>
          ))}

          {currentFloorRooms.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No rooms on Floor {currentFloor}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
