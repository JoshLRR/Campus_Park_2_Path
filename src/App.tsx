import {useState} from 'react';
import {MapView, NavigationPoint} from './components/Map/MapView';
import {PathResult} from './components/Map/pathfinding';
import {RightRoomPanel} from './components/Map/RightRoomPanel';
import {AppSidebar} from './components/AppSidebar';
import {getMapWidth} from './logic/getMapWidth';
import {getFloorStats} from './logic/getFloorStats';
import {filterRooms} from './logic/filterRooms';
import {getSelectedGraphNode, getSelectedRoom} from './logic/getSelectedItems';
import {SidebarToggleButton} from './components/SidebarToggleButton';
import {useGraphData} from './hooks/useGraphData';
import {useRouteCalculation} from './hooks/useRouteCalculation';
import {usePathfinder} from './hooks/usePathfinder';
import {useNavigationSelection} from './hooks/useNavigationSelection';
import {initialBuildings, sampleRooms} from './data/mockCampusData';
import './index.css';
import './App.css';

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

  const {
    handleRoomSelect,
    handleGraphNodeSelect,
    clearSelection,
    handleSetStartPoint,
    handleSetDestination,
    handleSetStartPointFromNode,
    handleSetDestinationFromNode,
    clearStartPoint,
    clearDestination,
    clearRoute,
  } = useNavigationSelection({
    buildings: initialBuildings,
    setSelectedRoomId,
    setSelectedGraphNodeId,
    setStartPoint,
    setDestinationPoint,
    setCurrentRoute,
  });

  const selectedRoom = getSelectedRoom(sampleRooms, selectedRoomId);

  const selectedGraphNode = getSelectedGraphNode(
    graphNodes,
    selectedGraphNodeId,
  );

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
