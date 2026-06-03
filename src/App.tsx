import React, {useState, useEffect, useMemo} from 'react';
import {
  MapView,
  Room,
  NavigationPoint,
  Building} from './components/Map/MapView';
import {RightRoomPanel,
} from './components/Map/RightRoomPanel';
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
/*import {initialBuildings, sampleRooms} from './data/mockCampusData'; */
import {MobileMapView} from './components/Map/MobileMapView';
import {GraphNode} from './components/Map/GraphOverlay';
import {Pathfinder, PathResult} from './components/Map/pathfinding';
import { MAP_CONSTANTS, graphToMapCoords } from './components/Map/MapConstants';
import './index.css';
import './App.css';
import {useDeviceType} from "./components/hooks/useDeviceType";

const initialBuildings: (Building & {id: number})[] = [];

// Sample room data with positions within buildings
const sampleRooms: (Room & {id: number})[] = [];

export default function App() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(
    () => window.innerWidth < 1024,
  );
  useEffect(() => {
    const handleResize = () => setIsMobileOrTablet(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  const [currentFloor, setCurrentFloor] = useState(0);

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
        {isMobileOrTablet ? (
          <MobileMapView
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
            onClearRoute={clearRoute}
            onSetStartFromSelected={handleSetStartPointFromNode.bind(null, selectedGraphNodeId!)}
            onSetEndFromSelected={handleSetDestinationFromNode.bind(null, selectedGraphNodeId!)}
            onSetStartFromNodeId={handleSetStartPointFromNode}
            onSetEndFromNodeId={handleSetDestinationFromNode}
            onShowPathNodesChange={setShowPathNodes}
            onShowPathEdgesChange={setShowPathEdges}
            onShowRoomConnectionsChange={setShowRoomConnections}
            onShowRoomNodesChange={setShowRoomNodes}
            onShowRouteChange={setShowRoute}
          />
        ) : (
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
          )}
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
