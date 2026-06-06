import {useState} from 'react';
import {MapView, NavigationPoint} from './components/Map/MapView';
import {PathResult} from './components/Map/pathfinding';
import {SearchPanel} from './components/SearchPanel';
import {DevPanel} from './components/DevPanel';
import {getFloorStats} from './logic/getFloorStats';
import {getSelectedGraphNode} from './logic/getSelectedItems';
import {useGraphData} from './hooks/useGraphData';
import {useRouteCalculation} from './hooks/useRouteCalculation';
import {usePathfinder} from './hooks/usePathfinder';
import {useNavigationSelection} from './hooks/useNavigationSelection';
import './index.css';
import './App.css';

export default function App() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<number | null>(
    null,
  );
  const focusBuilding = null;
  const [startPoint, setStartPoint] = useState<NavigationPoint | null>(null);
  const [destinationPoint, setDestinationPoint] =
    useState<NavigationPoint | null>(null);
  const {graphNodes, availableFloors, rooms} = useGraphData();

  const [currentFloor, setCurrentFloor] = useState(1);
  const [currentRoute, setCurrentRoute] = useState<PathResult | null>(null);

  const [devMode, setDevMode] = useState(false);

  // Graph visibility — off by default; toggled in dev panel
  const [showPathNodes, setShowPathNodes] = useState(false);
  const [showPathEdges, setShowPathEdges] = useState(false);
  const [showRoomConnections, setShowRoomConnections] = useState(false);
  const [showRoomNodes, setShowRoomNodes] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [showGraphDebug, setShowGraphDebug] = useState(false);

  const pathfinder = usePathfinder(graphNodes);

  useRouteCalculation({
    startPoint,
    destinationPoint,
    pathfinder,
    setCurrentRoute,
  });

  const handleFloorChange = (floor: number) => {
    setCurrentFloor(floor);

    const selectedRoom = selectedRoomId
      ? rooms.find(r => r.id === selectedRoomId)
      : null;
    const selectedNode = selectedGraphNodeId
      ? graphNodes.find(n => n.id === selectedGraphNodeId)
      : null;

    if (selectedRoom && selectedRoom.floor !== floor) {
      setSelectedRoomId(null);
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
    buildings: [],
    setSelectedRoomId,
    setSelectedGraphNodeId,
    setStartPoint,
    setDestinationPoint,
    setCurrentRoute,
  });

  const selectedGraphNode = getSelectedGraphNode(
    graphNodes,
    selectedGraphNodeId,
  );
  const floorStats = getFloorStats(graphNodes, rooms, currentFloor);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Full-screen map */}
      <div className="w-full h-full">
        <MapView
          initialBuildings={[]}
          selectedRoomId={selectedRoomId}
          selectedGraphNodeId={selectedGraphNodeId}
          focusBuildingId={focusBuilding}
          rooms={rooms}
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

      {/* Search / Directions panel — top left */}
      <div className="absolute top-4 left-4 z-20">
        <SearchPanel
          rooms={rooms}
          startPoint={startPoint}
          destinationPoint={destinationPoint}
          currentRoute={currentRoute}
          onSetStartPoint={handleSetStartPoint}
          onSetDestination={handleSetDestination}
          onRoomSelect={handleRoomSelect}
          clearRoute={clearRoute}
          clearStartPoint={clearStartPoint}
          clearDestination={clearDestination}
        />
      </div>

      {/* Developer panel — top right */}
      {devMode && (
        <div className="absolute top-4 right-4 z-20">
          <DevPanel
            onClose={() => setDevMode(false)}
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
            showGraphDebug={showGraphDebug}
            setShowGraphDebug={setShowGraphDebug}
            graphNodes={graphNodes}
            floorStats={floorStats}
            currentFloor={currentFloor}
            availableFloors={availableFloors}
            pathfinder={pathfinder}
            selectedGraphNode={selectedGraphNode}
            clearSelection={clearSelection}
            onSetStartPointFromNode={handleSetStartPointFromNode}
            onSetDestinationFromNode={handleSetDestinationFromNode}
          />
        </div>
      )}

      {/* Dev mode toggle — bottom left */}
      <div className="absolute bottom-6 left-4 z-20">
        <button
          onClick={() => setDevMode(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all duration-200 ${
            devMode
              ? 'bg-indigo-600 text-white shadow-indigo-200'
              : 'bg-white text-gray-500 hover:text-indigo-600 hover:shadow-md'
          }`}
          title="Toggle developer view"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          {devMode ? 'Dev on' : 'Dev'}
        </button>
      </div>
    </div>
  );
}
