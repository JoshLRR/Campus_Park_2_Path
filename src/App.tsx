import React, {useState, useEffect, useMemo} from 'react';
import {
  MapView,
  Room,
  NavigationPoint,
  Building,
} from './components/Map/MapView';
import {GraphNode} from './components/Map/GraphOverlay';
import {Pathfinder, PathResult} from './components/Map/pathfinding';
import {GraphDisplayControls} from './components/Map/GraphDisplayControls';
import {FloorInfoPanel} from './components/Map/FloorInfoPanel';
import {CrossFloorRouteWarning} from './components/Map/CrossFloorRouteWarning';
import {RouteStatusPanel} from './components/Directions/RouteStatusPanel';
import {NavigationStatusPanel} from './components/Directions/NavigationStatusPanel';
import {GraphNetworkPanel} from './components/Map/GraphNetworkPanel';
import './index.css';
import './App.css';

const initialBuildings: (Building & {id: number})[] = [];

// Sample room data with positions within buildings
const sampleRooms: (Room & {id: number})[] = [];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<number | null>(
    null,
  );
  const [focusBuilding, setFocusBuilding] = useState<number | null>(null);
  const [startPoint, setStartPoint] = useState<NavigationPoint | null>(null);
  const [destinationPoint, setDestinationPoint] =
    useState<NavigationPoint | null>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);

  // Floor management
  const [currentFloor, setCurrentFloor] = useState(1);
  const [availableFloors, setAvailableFloors] = useState<number[]>([1]);

  // Debug mode toggle
  const [showGraphDebug, setShowGraphDebug] = useState(false);

  // Graph element visibility toggles
  const [showPathNodes, setShowPathNodes] = useState(true);
  const [showPathEdges, setShowPathEdges] = useState(true);
  const [showRoomConnections, setShowRoomConnections] = useState(true);
  const [showRoomNodes, setShowRoomNodes] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // Toggle states for sidebars
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // Route state
  const [currentRoute, setCurrentRoute] = useState<PathResult | null>(null);

  // Load graph data from graph.json
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        const response = await fetch('/graph.json');
        const data = await response.json();

        if (data.nodes && Array.isArray(data.nodes)) {
          setGraphNodes(data.nodes);

          // Extract available floors from graph nodes with proper typing
          const floorNumbers: number[] = data.nodes
            .map((node: GraphNode) => node.position.floorNum)
            .filter(
              (floorNum: number): floorNum is number =>
                typeof floorNum === 'number',
            );

          const floors: number[] = [...new Set(floorNumbers)].sort(
            (a: number, b: number) => a - b,
          );
          setAvailableFloors(floors);

          // Set current floor to the lowest available floor
          if (floors.length > 0) {
            setCurrentFloor(floors[0]);
          }
        }
      } catch (error) {
        console.error('Error loading graph data:', error);
      }
    };

    void loadGraphData();
  }, []);

  // Create pathfinder instance
  const pathfinder = useMemo(() => {
    return graphNodes.length > 0 ? new Pathfinder(graphNodes) : null;
  }, [graphNodes]);

  // Calculate route when start and destination points change
  useEffect(() => {
    const calculateRoute = async () => {
      if (startPoint && destinationPoint && pathfinder) {
        const SCALE_INVERSE = 0.1; // Inverse of SCALE_FACTOR from GraphOverlay

        try {
          // Find closest nodes to start and destination points
          const startNodeId = pathfinder.findClosestNode(
            startPoint.x,
            startPoint.y,
            SCALE_INVERSE,
          );
          const endNodeId = pathfinder.findClosestNode(
            destinationPoint.x,
            destinationPoint.y,
            SCALE_INVERSE,
          );

          if (startNodeId !== null && endNodeId !== null) {
            // Updated to use async/await with the API-based pathfinding
            const route = await pathfinder.findPath(startNodeId, endNodeId);
            setCurrentRoute(route);
          } else {
            setCurrentRoute({
              path: [],
              totalDistance: 0,
              success: false,
              message: 'Could not find nodes near start or destination points',
            });
          }
        } catch (error) {
          console.error('Route calculation failed:', error);
          setCurrentRoute({
            path: [],
            totalDistance: 0,
            success: false,
            message: 'Route calculation failed. Please try again.',
          });
        }
      } else {
        setCurrentRoute(null);
      }
    };

    void calculateRoute();
  }, [startPoint, destinationPoint, pathfinder]);

  // Filter rooms based on search term
  const filteredRooms = sampleRooms.filter(
    room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper function to get room position on map
  const getRoomPosition = (room: Room & {id: number}) => {
    const building = initialBuildings.find(b => b.id === room.buildingId);
    if (!building) return {x: 0, y: 0};
    return {
      x: building.x + room.x + (room.width || 30) / 2,
      y: building.y + room.y + (room.height || 20) / 2,
    };
  };

  // Handle floor change
  const handleFloorChange = (floor: number) => {
    setCurrentFloor(floor);

    // Clear selection if selected room/node is not on the new floor
    const selectedRoom = selectedRoomId
      ? sampleRooms.find(r => r.id === selectedRoomId)
      : null;
    const selectedNode = selectedGraphNodeId
      ? graphNodes.find(n => n.id === selectedGraphNodeId)
      : null;

    if (selectedRoom && selectedRoom.floor !== floor) {
      setSelectedRoomId(null);
      setFocusBuilding(null);
    }

    if (selectedNode && selectedNode.position.floorNum !== floor) {
      setSelectedGraphNodeId(null);
    }
  };

  // Handle room selection from search or map
  const handleRoomSelect = (roomId: number) => {
    const room = sampleRooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoomId(roomId);
      setSelectedGraphNodeId(null); // Clear graph node selection
      setFocusBuilding(room.buildingId);
      setSearchTerm(''); // Clear search after selection

      // Switch to the room's floor if different
      if (room.floor !== currentFloor) {
        setCurrentFloor(room.floor);
      }
    }
  };

  // Handle graph node selection
  const handleGraphNodeSelect = (nodeId: number) => {
    const node = graphNodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedGraphNodeId(nodeId);
      setSelectedRoomId(null); // Clear room selection
      setFocusBuilding(null); // Clear building focus

      // Switch to the node's floor if different
      if (node.position.floorNum !== currentFloor) {
        setCurrentFloor(node.position.floorNum);
      }
    }
  };

  // Handle setting start point from regular room
  const handleSetStartPoint = (room: Room & {id: number}) => {
    const position = getRoomPosition(room);
    setStartPoint({
      roomId: room.id,
      x: position.x,
      y: position.y,
      label: room.name,
      floor: room.floor,
    });
    setSearchTerm('');
  };

  // Handle setting start point from graph node
  const handleSetStartPointFromNode = (node: GraphNode) => {
    const SCALE_FACTOR = 10; // Same as in GraphOverlay
    setStartPoint({
      roomId: node.id,
      x: node.position.x * SCALE_FACTOR,
      y: node.position.y * SCALE_FACTOR,
      label: node.roomNumber || `Node ${node.id}`,
      floor: node.position.floorNum,
    });
  };

  // Handle setting destination point from regular room
  const handleSetDestination = (room: Room & {id: number}) => {
    const position = getRoomPosition(room);
    setDestinationPoint({
      roomId: room.id,
      x: position.x,
      y: position.y,
      label: room.name,
      floor: room.floor,
    });
    setSearchTerm('');
  };

  // Handle setting destination point from graph node
  const handleSetDestinationFromNode = (node: GraphNode) => {
    const SCALE_FACTOR = 10; // Same as in GraphOverlay
    setDestinationPoint({
      roomId: node.id,
      x: node.position.x * SCALE_FACTOR,
      y: node.position.y * SCALE_FACTOR,
      label: node.roomNumber || `Node ${node.id}`,
      floor: node.position.floorNum,
    });
  };

  // Handle clearing selection
  const clearSelection = () => {
    setSelectedRoomId(null);
    setSelectedGraphNodeId(null);
    setFocusBuilding(null);
  };

  // Clear navigation points
  const clearStartPoint = () => {
    setStartPoint(null);
    setCurrentRoute(null);
  };

  const clearDestination = () => {
    setDestinationPoint(null);
    setCurrentRoute(null);
  };

  // Clear route
  const clearRoute = () => {
    setStartPoint(null);
    setDestinationPoint(null);
    setCurrentRoute(null);
  };

  // Get selected room details
  const selectedRoom = selectedRoomId
    ? sampleRooms.find(r => r.id === selectedRoomId)
    : null;

  // Get selected graph node details
  const selectedGraphNode = selectedGraphNodeId
    ? graphNodes.find(n => n.id === selectedGraphNodeId)
    : null;

  // Calculate map width based on sidebar states
  const getMapWidth = () => {
    if (isLeftSidebarOpen && isRightPanelOpen) return 'w-1/2';
    if (isLeftSidebarOpen || isRightPanelOpen) return 'w-3/4';
    return 'w-full';
  };

  // Get floor statistics
  const getFloorStats = () => {
    const currentFloorNodes = graphNodes.filter(
      n => n.position.floorNum === currentFloor,
    );
    const currentFloorRooms = sampleRooms.filter(r => r.floor === currentFloor);

    return {
      nodes: currentFloorNodes.length,
      pathNodes: currentFloorNodes.filter(n => n.kind === 'path').length,
      roomNodes: currentFloorNodes.filter(n => n.kind === 'room').length,
      rooms: currentFloorRooms.length,
    };
  };

  const floorStats = getFloorStats();

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

          {/* Floor Information */}
          <FloorInfoPanel
            currentFloor={currentFloor}
            floorStats={floorStats}
            availableFloors={availableFloors}
            onFloorChange={handleFloorChange}
          />

          {/* Cross-floor route warning */}
          <CrossFloorRouteWarning
            currentRoute={currentRoute}
            graphNodes={graphNodes}
            currentFloor={currentFloor}
            onFloorChange={handleFloorChange}
          />

          {/* Graph Visibility Controls */}
          <GraphDisplayControls
            showPathNodes={showPathNodes}
            setShowPathNodes={setShowPathNodes}
            showRoomNodes={showRoomNodes}
            setShowRoomNodes={setShowRoomNodes}
            showPathEdges={showPathEdges}
            setShowPathEdges={setShowPathEdges}
            showRoomConnections={showRoomConnections}
            setShowRoomConnections={setShowRoomConnections}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
          />

          {/* Route Status Panel */}
          <RouteStatusPanel
            currentRoute={currentRoute}
            startPoint={startPoint}
            destinationPoint={destinationPoint}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            clearRoute={clearRoute}
          />

          {/* Graph Network Panel */}
          <GraphNetworkPanel
            graphNodes={graphNodes}
            floorStats={floorStats}
            currentFloor={currentFloor}
            availableFloors={availableFloors}
            pathfinder={pathfinder}
            showGraphDebug={showGraphDebug}
            setShowGraphDebug={setShowGraphDebug}
          />

          {/* Navigation Status */}
          <NavigationStatusPanel
            startPoint={startPoint}
            destinationPoint={destinationPoint}
            currentRoute={currentRoute}
            clearStartPoint={clearStartPoint}
            clearDestination={clearDestination}
          />

          {/* Selected Graph Node Info */}
          {selectedGraphNode && (
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
              {selectedGraphNode.features &&
                selectedGraphNode.features.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Features: {selectedGraphNode.features.join(', ')}
                  </p>
                )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleSetStartPointFromNode(selectedGraphNode)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  Set as Start
                </button>
                <button
                  onClick={() =>
                    handleSetDestinationFromNode(selectedGraphNode)
                  }
                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          )}

          {/* Room Search Section */}
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
                          Dest
                        </button>
                        <button
                          onClick={() => handleRoomSelect(room.id)}
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
        </div>
      </div>

      {/* Toggle button for closed sidebar */}
      {!isLeftSidebarOpen && (
        <button
          onClick={() => setIsLeftSidebarOpen(true)}
          className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Open sidebar"
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      {/* Main Map View */}
      <div className={getMapWidth()}>
        <MapView
          initialBuildings={initialBuildings}
          selectedRoomId={selectedRoomId}
          selectedGraphNodeId={selectedGraphNodeId}
          focusBuildingId={focusBuilding}
          rooms={sampleRooms}
          startPoint={startPoint}
          destinationPoint={destinationPoint}
          graphNodes={graphNodes}
          showGraphDebug={showGraphDebug}
          showPathNodes={showPathNodes}
          showPathEdges={showPathEdges}
          showRoomConnections={showRoomConnections}
          showRoomNodes={showRoomNodes}
          currentRoute={currentRoute}
          showRoute={showRoute}
          currentFloor={currentFloor}
          availableFloors={availableFloors}
          onRoomSelect={handleRoomSelect}
          onGraphNodeSelect={handleGraphNodeSelect}
          onStartPointClear={clearStartPoint}
          onDestinationPointClear={clearDestination}
          onFloorChange={handleFloorChange}
        />
      </div>

      {/* Right Panel - Room List (Optional) */}
      {isRightPanelOpen && (
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
              {sampleRooms
                .filter(room => room.floor === currentFloor)
                .map(room => (
                  <div
                    key={room.id}
                    className={`p-3 border rounded-md transition-colors cursor-pointer ${
                      selectedRoomId === room.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleRoomSelect(room.id)}
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
                            handleSetStartPoint(room);
                          }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                        >
                          Start
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSetDestination(room);
                          }}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                          Dest
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {sampleRooms.filter(room => room.floor === currentFloor)
                .length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No rooms on Floor {currentFloor}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
