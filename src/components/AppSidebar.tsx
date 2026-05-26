/**
 * AppSidebar.tsx
 *
 * Renders the left sidebar for the Campus Navigator app.
 *
 * This component was extracted from App.tsx without changing behavior.
 * It composes floor information, graph controls, route status, navigation
 * status, search, and selected item panels.
 */

import {NavigationPoint, Room} from './Map/MapView';
import {GraphNode} from './Map/GraphOverlay';
import {Pathfinder, PathResult} from './Map/pathfinding';
import {FloorInfoPanel} from './Map/FloorInfoPanel';
import {CrossFloorRouteWarning} from './Map/CrossFloorRouteWarning';
import {GraphDisplayControls} from './Map/GraphDisplayControls';
import {RouteStatusPanel} from './Directions/RouteStatusPanel';
import {GraphNetworkPanel} from './Map/GraphNetworkPanel';
import {NavigationStatusPanel} from './Directions/NavigationStatusPanel';
import {SelectedGraphNodePanel} from './Map/SelectedGraphNodePanel';
import {RoomSearchPanel} from './Search/RoomSearchPanel';
import {SelectedRoomPanel} from './Map/SelectedRoomPanel';

type AppRoom = Room & {
  id: number;
};

type FloorStats = {
  nodes: number;
  pathNodes: number;
  roomNodes: number;
  rooms: number;
};

type AppSidebarProps = {
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (value: boolean) => void;

  currentFloor: number;
  floorStats: FloorStats;
  availableFloors: number[];
  handleFloorChange: (floor: number) => void;

  currentRoute: PathResult | null;
  graphNodes: GraphNode[];

  showPathNodes: boolean;
  setShowPathNodes: (value: boolean) => void;
  showRoomNodes: boolean;
  setShowRoomNodes: (value: boolean) => void;
  showPathEdges: boolean;
  setShowPathEdges: (value: boolean) => void;
  showRoomConnections: boolean;
  setShowRoomConnections: (value: boolean) => void;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;

  startPoint: NavigationPoint | null;
  destinationPoint: NavigationPoint | null;
  clearRoute: () => void;

  pathfinder: Pathfinder | null;
  showGraphDebug: boolean;
  setShowGraphDebug: (value: boolean) => void;

  clearStartPoint: () => void;
  clearDestination: () => void;

  selectedGraphNode: GraphNode | null | undefined;
  clearSelection: () => void;
  handleSetStartPointFromNode: (node: GraphNode) => void;
  handleSetDestinationFromNode: (node: GraphNode) => void;

  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredRooms: AppRoom[];
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (value: boolean) => void;
  handleSetStartPoint: (room: AppRoom) => void;
  handleSetDestination: (room: AppRoom) => void;
  handleRoomSelect: (roomId: number) => void;

  selectedRoom: AppRoom | null | undefined;
};

export function AppSidebar({
  isLeftSidebarOpen,
  setIsLeftSidebarOpen,
  currentFloor,
  floorStats,
  availableFloors,
  handleFloorChange,
  currentRoute,
  graphNodes,
  showPathNodes,
  setShowPathNodes,
  showRoomNodes,
  setShowRoomNodes,
  showPathEdges,
  setShowPathEdges,
  showRoomConnections,
  setShowRoomConnections,
  showRoute,
  setShowRoute,
  startPoint,
  destinationPoint,
  clearRoute,
  pathfinder,
  showGraphDebug,
  setShowGraphDebug,
  clearStartPoint,
  clearDestination,
  selectedGraphNode,
  clearSelection,
  handleSetStartPointFromNode,
  handleSetDestinationFromNode,
  searchTerm,
  setSearchTerm,
  filteredRooms,
  isRightPanelOpen,
  setIsRightPanelOpen,
  handleSetStartPoint,
  handleSetDestination,
  handleRoomSelect,
  selectedRoom,
}: AppSidebarProps) {
  return (
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
        <SelectedGraphNodePanel
          selectedGraphNode={selectedGraphNode}
          clearSelection={clearSelection}
          onSetStartPoint={handleSetStartPointFromNode}
          onSetDestination={handleSetDestinationFromNode}
        />

        {/* Room Search */}
        <RoomSearchPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredRooms={filteredRooms}
          isRightPanelOpen={isRightPanelOpen}
          setIsRightPanelOpen={setIsRightPanelOpen}
          onSetStartPoint={handleSetStartPoint}
          onSetDestination={handleSetDestination}
          onRoomSelect={handleRoomSelect}
        />

        {/* Selected Room Info */}
        <SelectedRoomPanel
          selectedRoom={selectedRoom}
          clearSelection={clearSelection}
          onSetStartPoint={handleSetStartPoint}
          onSetDestination={handleSetDestination}
        />
      </div>
    </div>
  );
}
