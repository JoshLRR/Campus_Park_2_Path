/**
 * RoomSearchPanel.tsx
 *
 * Displays the room search input and search results for selecting rooms,
 * start points, and destinations.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

import {Room} from '../Map/MapView';

type SearchRoom = Room & {
  id: number;
};

type RoomSearchPanelProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredRooms: SearchRoom[];
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (value: boolean) => void;
  onSetStartPoint: (room: SearchRoom) => void;
  onSetDestination: (room: SearchRoom) => void;
  onRoomSelect: (roomId: number) => void;
};

export function RoomSearchPanel({
  searchTerm,
  setSearchTerm,
  filteredRooms,
  isRightPanelOpen,
  setIsRightPanelOpen,
  onSetStartPoint,
  onSetDestination,
  onRoomSelect,
}: RoomSearchPanelProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Room Search</h3>
        {!isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            title="Open room panel"
          >
            Show Rooms
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search rooms or buildings..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Search Results */}
      {searchTerm && filteredRooms.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-2">
            {filteredRooms.length} results found
          </p>

          {filteredRooms.slice(0, 5).map(room => (
            <div
              key={room.id}
              className="mb-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{room.name}</p>
                  <p className="text-xs text-gray-500">
                    {room.building} • Floor {room.floor}
                  </p>
                </div>

                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => onSetStartPoint(room)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                    title="Set as start point"
                  >
                    Start
                  </button>

                  <button
                    onClick={() => onSetDestination(room)}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                    title="Set as destination"
                  >
                    Dest
                  </button>

                  <button
                    onClick={() => onRoomSelect(room.id)}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                    title="Select room"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredRooms.length > 5 && (
            <p className="text-xs text-gray-500 mt-2">
              Showing first 5 results. Continue typing to refine.
            </p>
          )}
        </div>
      )}

      {searchTerm && filteredRooms.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">
          No rooms found matching "{searchTerm}"
        </p>
      )}
    </div>
  );
}
