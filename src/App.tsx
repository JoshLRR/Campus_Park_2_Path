import React, {useState} from 'react';
import {
  MapView,
  Room,
  NavigationPoint,
  Building,
} from './components/Map/MapView';
import {GraphNode} from './components/Map/GraphOverlay';
import {PathResult} from './components/Map/pathfinding';
import {RightRoomPanel} from './components/Map/RightRoomPanel';
import {AppSidebar} from './components/AppSidebar';
import {getMapWidth} from './logic/getMapWidth';
import {getFloorStats} from './logic/getFloorStats';
import {filterRooms} from './logic/filterRooms';
import {
  createNavigationPointFromGraphNode,
  createNavigationPointFromRoom,
} from './logic/createNavigationPoint';
import {SidebarToggleButton} from './components/SidebarToggleButton';
import {useGraphData} from './hooks/useGraphData';
import {useRouteCalculation} from './hooks/useRouteCalculation';
import {usePathfinder} from './hooks/usePathfinder';
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
  const {graphNodes, availableFloors} = useGraphData();

  // Floor management
  const [currentFloor, setCurrentFloor] = useState(1);

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

  // Create pathfinder instance
  const pathfinder = usePathfinder(graphNodes);

  // Calculate route whenever start/destination points or pathfinder changes
  useRouteCalculation({
    startPoint,
    destinationPoint,
    pathfinder,
    setCurrentRoute,
  });

  // Filter rooms based on search term
  const filteredRooms = filterRooms(sampleRooms, searchTerm);

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
    setStartPoint(createNavigationPointFromRoom(room, initialBuildings));
  };

  // Handle setting start point from graph node
  const handleSetStartPointFromNode = (node: GraphNode) => {
    setStartPoint(createNavigationPointFromGraphNode(node));
  };

  // Handle setting destination point from regular room
  const handleSetDestination = (room: Room & {id: number}) => {
    setDestinationPoint(createNavigationPointFromRoom(room, initialBuildings));
  };

  // Handle setting destination point from graph node
  const handleSetDestinationFromNode = (node: GraphNode) => {
    setDestinationPoint(createNavigationPointFromGraphNode(node));
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

  const floorStats = getFloorStats(graphNodes, sampleRooms, currentFloor);

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
      <SidebarToggleButton
        isLeftSidebarOpen={isLeftSidebarOpen}
        setIsLeftSidebarOpen={setIsLeftSidebarOpen}
      />

      {/* Main Map View */}
      <div className={getMapWidth(isLeftSidebarOpen, isRightPanelOpen)}>
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
