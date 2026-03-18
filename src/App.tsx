import React, {useState} from 'react';
import {MapView, Room, NavigationPoint} from './components/Map/MapView';
import './index.css';
import './App.css';

const initialBuildings = [
];

// Sample room data with positions within buildings
const sampleRooms: Room[] = [
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [focusBuilding, setFocusBuilding] = useState<number | null>(null);
  const [startPoint, setStartPoint] = useState<NavigationPoint | null>(null);
  const [destinationPoint, setDestinationPoint] =
    useState<NavigationPoint | null>(null);

  // Toggle states for sidebars
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // Filter rooms based on search term
  const filteredRooms = sampleRooms.filter(
    room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper function to get room position on map
  const getRoomPosition = (room: Room) => {
    const building = initialBuildings.find(b => b.id === room.buildingId);
    if (!building) return {x: 0, y: 0};
    return {
      x: building.x + room.x + (room.width || 30) / 2,
      y: building.y + room.y + (room.height || 20) / 2,
    };
  };

  // Handle room selection from search or map
  const handleRoomSelect = (roomId: number) => {
    const room = sampleRooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoomId(roomId);
      setFocusBuilding(room.buildingId);
      setSearchTerm(''); // Clear search after selection
    }
  };

  // Handle setting start point
  const handleSetStartPoint = (room: Room) => {
    const position = getRoomPosition(room);
    setStartPoint({
      roomId: room.id,
      x: position.x,
      y: position.y,
      label: room.name,
    });
    setSearchTerm('');
  };

  // Handle setting destination point
  const handleSetDestination = (room: Room) => {
    const position = getRoomPosition(room);
    setDestinationPoint({
      roomId: room.id,
      x: position.x,
      y: position.y,
      label: room.name,
    });
    setSearchTerm('');
  };

  // Handle clearing selection
  const clearSelection = () => {
    setSelectedRoomId(null);
    setFocusBuilding(null);
  };

  // Clear navigation points
  const clearStartPoint = () => setStartPoint(null);
  const clearDestination = () => setDestinationPoint(null);

  // Get selected room details
  const selectedRoom = selectedRoomId
    ? sampleRooms.find(r => r.id === selectedRoomId)
    : null;

  // Calculate map width based on sidebar states
  const getMapWidth = () => {
    if (isLeftSidebarOpen && isRightPanelOpen) return 'w-1/2';
    if (isLeftSidebarOpen || isRightPanelOpen) return 'w-3/4';
    return 'w-full';
  };

  return (
    <div className="w-full h-screen flex relative">
      {/* Left Sidebar */}
      <div
        className={`${isLeftSidebarOpen ? 'w-1/4' : 'w-0'} h-full bg-gray-100 overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <div
          className={`w-80 h-full p-6 overflow-auto ${isLeftSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Campus Navigator</h2>
            <button
              onClick={() => setIsLeftSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              title="Close sidebar"
            >
              ×
            </button>
          </div>

          {/* Navigation Status */}
          {(startPoint || destinationPoint) && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                Navigation
              </h3>
              {startPoint && (
                <div className="mb-2 text-sm">
                  <span className="text-red-600 font-medium">Start:</span>{' '}
                  {startPoint.label}
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
                  <span className="text-green-600 font-medium">
                    Destination:
                  </span>{' '}
                  {destinationPoint.label}
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
                  <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
                    Get Detailed Directions
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Room Search Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Search Rooms</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search rooms or buildings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchTerm && (
              <div className="mt-3 max-h-60 overflow-y-auto border rounded-md bg-white shadow-sm">
                <div className="p-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {filteredRooms.length} room(s) found
                  </p>
                  {filteredRooms.map(room => (
                    <div
                      key={room.id}
                      className="p-2 mb-1 border rounded bg-gray-50 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className="flex-1"
                          onClick={() => handleRoomSelect(room.id)}
                        >
                          <p className="font-medium text-sm cursor-pointer">
                            {room.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {room.building} • Floor {room.floor}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleSetStartPoint(room)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                            title="Set as start point"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleSetDestination(room)}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                            title="Set as destination"
                          >
                            Go
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredRooms.length === 0 && (
                    <p className="text-sm text-gray-500 italic p-2">
                      No rooms found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Room Info */}
          {selectedRoom && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-blue-800">
                  Selected Room
                </h3>
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
                  onClick={() => handleSetStartPoint(selectedRoom)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  Set as Start
                </button>
                <button
                  onClick={() => handleSetDestination(selectedRoom)}
                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          )}

          {/* Buildings List */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Buildings</h3>
            <p className="text-xs text-gray-600 mb-3 italic">
              All rooms are always visible. Click buildings to highlight their
              rooms.
            </p>
            {initialBuildings.map(b => (
              <div
                key={b.id}
                className={`p-3 mb-2 border rounded transition-colors cursor-pointer ${
                  focusBuilding === b.id
                    ? 'bg-blue-100 border-blue-300 shadow-md'
                    : 'bg-white shadow-sm hover:bg-gray-50'
                }`}
                onClick={() =>
                  setFocusBuilding(focusBuilding === b.id ? null : b.id)
                }
              >
                <p className="font-semibold">{b.name}</p>
                <p className="text-sm text-gray-600">
                  Position: ({b.x}, {b.y}) | Size: ({b.width}×{b.height})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Rooms: {sampleRooms.filter(r => r.buildingId === b.id).length}
                </p>
                {focusBuilding === b.id && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-600 font-medium">
                      🔍 Rooms are highlighted - Click to remove highlight
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left Sidebar Toggle Button (when closed) */}
      {!isLeftSidebarOpen && (
        <button
          onClick={() => setIsLeftSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 bg-white border-2 border-gray-300 rounded-md p-2 shadow-lg hover:bg-gray-50 transition-colors"
          title="Open navigation panel"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Map Container */}
      <div
        className={`${getMapWidth()} h-full relative transition-all duration-300 ease-in-out`}
      >
        <MapView
          initialBuildings={initialBuildings}
          selectedRoomId={selectedRoomId}
          focusBuildingId={focusBuilding}
          rooms={sampleRooms}
          startPoint={startPoint}
          destinationPoint={destinationPoint}
          onRoomSelect={handleRoomSelect}
          onStartPointClear={clearStartPoint}
          onDestinationPointClear={clearDestination}
        />

        {/* Right Panel Toggle Button */}
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="absolute top-4 right-4 z-10 bg-white border-2 border-gray-300 rounded-md p-2 shadow-lg hover:bg-gray-50 transition-colors"
          title={isRightPanelOpen ? 'Close info panel' : 'Open info panel'}
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isRightPanelOpen
                  ? 'M6 18L18 6M6 6l12 12'
                  : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              }
            />
          </svg>
        </button>
      </div>

      {/* Right Info Panel */}
      <div
        className={`${isRightPanelOpen ? 'w-1/4' : 'w-0'} h-full bg-white border-l border-gray-200 overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <div
          className={`w-80 h-full p-6 overflow-auto ${isRightPanelOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Map Info</h2>
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              title="Close info panel"
            >
              ×
            </button>
          </div>

          {/* Current Selection Info */}
          {selectedRoom && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Current Selection
              </h3>
              <p className="font-medium">{selectedRoom.name}</p>
              <p className="text-sm text-gray-600 mb-2">
                {selectedRoom.building} • Floor {selectedRoom.floor}
              </p>
              <div className="text-xs text-gray-500">
                <p>
                  Position: ({selectedRoom.x}, {selectedRoom.y})
                </p>
                <p>
                  Size: {selectedRoom.width || 30} × {selectedRoom.height || 20}
                </p>
              </div>
            </div>
          )}

          {/* Building Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Campus Statistics</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">
                  Total Buildings
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {initialBuildings.length}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Total Rooms</p>
                <p className="text-2xl font-bold text-green-600">
                  {sampleRooms.length}
                </p>
              </div>
              {focusBuilding && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">
                    Highlighted Building Rooms
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      sampleRooms.filter(r => r.buildingId === focusBuilding)
                        .length
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Room List for Highlighted Building */}
          {focusBuilding && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                {initialBuildings.find(b => b.id === focusBuilding)?.name} Rooms
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sampleRooms
                  .filter(room => room.buildingId === focusBuilding)
                  .map(room => (
                    <div
                      key={room.id}
                      className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
                        selectedRoomId === room.id
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleRoomSelect(room.id)}
                    >
                      <p className="font-medium">{room.name}</p>
                      <p className="text-xs text-gray-600">
                        Floor {room.floor}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Map Controls Help */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Map Controls</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Mouse wheel:</strong> Zoom in/out
              </p>
              <p>
                <strong>Click & drag:</strong> Pan around map
              </p>
              <p>
                <strong>Click buildings:</strong> Highlight rooms
              </p>
              <p>
                <strong>Click rooms:</strong> Select and get info
              </p>
              <p>
                <strong>Click markers:</strong> Remove start/destination
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
