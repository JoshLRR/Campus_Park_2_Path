/**
 * App.tsx
 *
 * Root component — owns navigation state (start/destination, current
 * route, selected floor, dev-mode toggles) and composes the map with
 * the search/directions panel and developer panel. Wires graph data,
 * the pathfinder, and route calculation into the UI, and derives
 * turn-by-turn directions from the active route.
 */

import {useState, useEffect, useMemo} from 'react';
import {
  MapView,
  NavigationPoint,
  NODE_SCALE,
  NODE_OFFSET_X,
  NODE_OFFSET_Y,
} from './components/Map/MapView';
import {PathResult, RoutePreferences} from './components/Map/pathfinding';
import {SearchPanel} from './components/SearchPanel';
import {DevPanel} from './components/DevPanel';
import {AccessibilityPanel} from './components/AccessibilityPanel';
import {DirectionsPanel} from './components/DirectionsPanel';
import {buildDirections} from './logic/buildDirections';
import {createNavigationPointFromRoom} from './logic/createNavigationPoint';
import {DistanceUnit} from './logic/formatDistance';
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
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [routePreferences, setRoutePreferences] = useState<RoutePreferences>(
    {},
  );
  const [viewMode, setViewMode] = useState<'search' | 'directions'>('search');
  const [focusPoint, setFocusPoint] = useState<{
    x: number;
    y: number;
    seq: number;
  } | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [nearestFeatureMessage, setNearestFeatureMessage] = useState<
    string | null
  >(null);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('m');

  // Graph visibility — off by default; toggled in dev panel
  const [showPathNodes, setShowPathNodes] = useState(false);
  const [showPathEdges, setShowPathEdges] = useState(false);
  const [showRoomConnections, setShowRoomConnections] = useState(false);
  const [showRoomNodes, setShowRoomNodes] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [showGraphDebug, setShowGraphDebug] = useState(false);

  const pathfinder = usePathfinder(graphNodes);

  // Auto-switch to directions view when a route is successfully calculated
  useEffect(() => {
    if (currentRoute?.success) setViewMode('directions');
  }, [currentRoute]);

  const directions = useMemo(() => {
    if (!currentRoute?.success || !startPoint || !destinationPoint) return [];
    return buildDirections(
      currentRoute.path,
      graphNodes,
      startPoint.label,
      destinationPoint.label,
    );
  }, [currentRoute, graphNodes, startPoint, destinationPoint]);

  const handleFocusStep = (
    position: {x: number; y: number},
    fromNodeId: number,
    toNodeId: number,
  ) => {
    setFocusPoint(prev => ({
      x: position.x * NODE_SCALE - NODE_OFFSET_X,
      y: position.y * NODE_SCALE - NODE_OFFSET_Y,
      seq: (prev?.seq ?? 0) + 1,
    }));
    setHighlightedSegment({from: fromNodeId, to: toNodeId});
  };

  const handleFocusRoom = (room: {
    id: number;
    x: number;
    y: number;
    floor: number;
  }) => {
    setSelectedRoomId(room.id);
    setSelectedGraphNodeId(null);
    setCurrentFloor(room.floor);
    setFocusPoint(prev => ({
      x: room.x * NODE_SCALE - NODE_OFFSET_X,
      y: room.y * NODE_SCALE - NODE_OFFSET_Y,
      seq: (prev?.seq ?? 0) + 1,
      targetScale: 0.6,
    }));
  };

  const handleClearRoute = () => {
    clearRoute();
    setViewMode('search');
    setHighlightedSegment(null);
    setNearestFeatureMessage(null);
  };

  const handleFindNearestFeature = async (featureId: number) => {
    setNearestFeatureMessage(null);

    if (!startPoint || !pathfinder) {
      setNearestFeatureMessage('Choose a start point first.');
      return;
    }

    const startNodeId = pathfinder.findClosestNode(
      startPoint.x,
      startPoint.y,
      startPoint.floor ?? 1,
    );
    if (startNodeId === null) {
      setNearestFeatureMessage(
        'Could not find a graph node near the start point.',
      );
      return;
    }

    const result = await pathfinder.findNearestRoomWithFeature(
      startNodeId,
      featureId,
    );
    if (!result.success || result.targetNodeId === undefined) {
      setNearestFeatureMessage(
        result.message ?? 'No matching room could be found.',
      );
      return;
    }

    const room = rooms.find(r => r.id === result.targetNodeId);
    if (!room) {
      setNearestFeatureMessage(
        'Found a match, but could not resolve the room.',
      );
      return;
    }

    setDestinationPoint(createNavigationPointFromRoom(room, []));
  };

  useRouteCalculation({
    startPoint,
    destinationPoint,
    pathfinder,
    setCurrentRoute,
    preferences: routePreferences,
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
          focusPoint={focusPoint}
          highlightedSegment={highlightedSegment}
          onRoomSelect={handleRoomSelect}
          onGraphNodeSelect={handleGraphNodeSelect}
          onStartPointClear={clearStartPoint}
          onDestinationPointClear={clearDestination}
          onFloorChange={handleFloorChange}
        />
      </div>

      {/* Search / Directions panel — top left */}
      <div className="absolute top-4 left-4 z-20">
        {viewMode === 'directions' && directions.length > 0 ? (
          <DirectionsPanel
            steps={directions}
            totalDistance={currentRoute?.totalDistance ?? 0}
            accessibilityWarning={currentRoute?.accessibilityWarning ?? null}
            distanceUnit={distanceUnit}
            onChangeDistanceUnit={setDistanceUnit}
            onBack={() => setViewMode('search')}
            onClear={handleClearRoute}
            onFocusStep={handleFocusStep}
          />
        ) : (
          <SearchPanel
            rooms={rooms}
            startPoint={startPoint}
            destinationPoint={destinationPoint}
            currentRoute={currentRoute}
            distanceUnit={distanceUnit}
            onSetStartPoint={handleSetStartPoint}
            onSetDestination={handleSetDestination}
            onRoomSelect={handleRoomSelect}
            onFocusRoom={handleFocusRoom}
            onFindNearestFeature={handleFindNearestFeature}
            nearestFeatureMessage={nearestFeatureMessage}
            clearRoute={handleClearRoute}
            clearStartPoint={clearStartPoint}
            clearDestination={clearDestination}
          />
        )}
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

      {/* Accessibility panel — floats above the toggle row */}
      {accessibilityMode && (
        <div className="absolute bottom-20 right-4 z-20">
          <AccessibilityPanel
            onClose={() => setAccessibilityMode(false)}
            preferences={routePreferences}
            setPreferences={setRoutePreferences}
          />
        </div>
      )}

      {/* Mode toggles — bottom right */}
      <div className="absolute bottom-6 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setAccessibilityMode(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all duration-200 ${
            accessibilityMode
              ? 'bg-emerald-600 text-white shadow-emerald-200'
              : 'bg-white text-gray-500 hover:text-emerald-600 hover:shadow-md'
          }`}
          title="Toggle accessibility preferences"
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {accessibilityMode ? 'Accessibility on' : 'Accessibility'}
        </button>

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
