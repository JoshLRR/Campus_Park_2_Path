import React, {useState, useEffect, useMemo} from 'react';
import {
  MapView,
  Room,
  NavigationPoint,
  Building,
} from './components/Map/MapView';
import {GraphNode} from './components/Map/GraphOverlay';
import {Pathfinder, PathResult} from './components/Map/pathfinding';
import {RightRoomPanel} from './components/Map/RightRoomPanel';
import {AppSidebar} from './components/AppSidebar';
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
      <AppSidebar
        isLeftSidebarOpen={isLeftSidebarOpen}
        setIsLeftSidebarOpen={setIsLeftSidebarOpen}
        currentFloor={currentFloor}
        floorStats={floorStats}
        availableFloors={availableFloors}
        handleFloorChange={handleFloorChange}
        currentRoute={currentRoute}
        graphNodes={graphNodes}
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
        startPoint={startPoint}
        destinationPoint={destinationPoint}
        clearRoute={clearRoute}
        pathfinder={pathfinder}
        showGraphDebug={showGraphDebug}
        setShowGraphDebug={setShowGraphDebug}
        clearStartPoint={clearStartPoint}
        clearDestination={clearDestination}
        selectedGraphNode={selectedGraphNode}
        clearSelection={clearSelection}
        handleSetStartPointFromNode={handleSetStartPointFromNode}
        handleSetDestinationFromNode={handleSetDestinationFromNode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredRooms={filteredRooms}
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
        handleSetStartPoint={handleSetStartPoint}
        handleSetDestination={handleSetDestination}
        handleRoomSelect={handleRoomSelect}
        selectedRoom={selectedRoom}
      />

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
      <RightRoomPanel
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
        currentFloor={currentFloor}
        sampleRooms={sampleRooms}
        selectedRoomId={selectedRoomId}
        onRoomSelect={handleRoomSelect}
        onSetStartPoint={handleSetStartPoint}
        onSetDestination={handleSetDestination}
      />
    </div>
  );
}
