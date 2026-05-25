/**
 * Mobile/Tablet Map view component.
 *
 * This is the touch-optimized layout for phones and tablets.
 * The map takes the full screen, with controls in a slide-up bottom drawer.
 */

import React, {useRef, useState, useCallback} from 'react';
import TileSystem from './TileSystem';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import {RoomTile} from './RoomTile';
import {StartMarker} from './StartMarker';
import {DestinationMarker} from './DestinationMarker';
import {GraphOverlay, GraphNode} from './GraphOverlay';
import {RouteOverlay} from './RouteOverlay';
import {PathResult} from './pathfinding';
import {MAP_CONSTANTS, graphToMapCoords} from './MapConstants';
import {
  Building,
  Room,
  NavigationPoint,
} from './MapView';

const WORLD_WIDTH = MAP_CONSTANTS.WORLD_WIDTH;
const WORLD_HEIGHT = MAP_CONSTANTS.WORLD_HEIGHT;

type DrawerTab = 'navigation' | 'floors' | 'display';

interface MobileMapViewProps {
  initialBuildings: (Building & {id: number})[];
  selectedRoomId?: number | null;
  selectedGraphNodeId?: number | null;
  focusBuildingId?: number | null;
  rooms?: (Room & {id: number})[];
  startPoint?: NavigationPoint | null;
  destinationPoint?: NavigationPoint | null;
  graphNodes?: GraphNode[];
  showGraphDebug?: boolean;
  showPathNodes?: boolean;
  showPathEdges?: boolean;
  showRoomConnections?: boolean;
  showRoomNodes?: boolean;
  currentRoute?: PathResult | null;
  showRoute?: boolean;
  currentFloor: number;
  availableFloors: number[];
  onRoomSelect?: (roomId: number) => void;
  onGraphNodeSelect?: (nodeId: number) => void;
  onStartPointClear?: () => void;
  onDestinationPointClear?: () => void;
  onFloorChange?: (floor: number) => void;
  onClearRoute?: () => void;
  onShowPathNodesChange?: (value: boolean) => void;
  onShowPathEdgesChange?: (value: boolean) => void;
  onShowRoomConnectionsChange?: (value: boolean) => void;
  onShowRoomNodesChange?: (value: boolean) => void;
  onShowRouteChange?: (value: boolean) => void;
}

export const MobileMapView: React.FC<MobileMapViewProps> = ({
  initialBuildings,
  selectedRoomId,
  selectedGraphNodeId,
  focusBuildingId,
  rooms = [],
  startPoint,
  destinationPoint,
  graphNodes = [],
  showGraphDebug = false,
  showPathNodes = true,
  showPathEdges = true,
  showRoomConnections = true,
  showRoomNodes = true,
  currentRoute = null,
  showRoute = true,
  currentFloor,
  availableFloors,
  onRoomSelect,
  onGraphNodeSelect,
  onStartPointClear,
  onDestinationPointClear,
  onFloorChange,
  onClearRoute,
  onShowPathNodesChange,
  onShowPathEdgesChange,
  onShowRoomConnectionsChange,
  onShowRoomNodesChange,
  onShowRouteChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const scalePosition = graphToMapCoords;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>('navigation');

  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    scale: 1,
  });

  const handleTransform = useCallback(
    (ref: ReactZoomPanPinchRef, _event: unknown) => {
      const {state} = ref;
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setViewport({
          x: -state.positionX / state.scale,
          y: -state.positionY / state.scale,
          width: containerRect.width,
          height: containerRect.height,
          scale: state.scale,
        });
      }
    },
    [],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setViewport(prev => ({
        ...prev,
        width: containerRect.width,
        height: containerRect.height,
      }));
    }
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setViewport(prev => ({
          ...prev,
          width: containerRect.width,
          height: containerRect.height,
        }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterByFloor = <T extends {floor?: number}>(items: T[]): T[] =>
    items.filter(item => item.floor === currentFloor);

  const currentFloorGraphNodes = graphNodes.filter(
    node => node.position.floorNum === currentFloor,
  );
  const currentFloorRooms = filterByFloor(rooms);
  const buildingsWithCurrentFloorContent = initialBuildings.filter(building => {
    const hasRoomsOnFloor = currentFloorRooms.some(
      room => room.buildingId === building.id,
    );
    const hasFloorsProperty =
      building.floors && building.floors.includes(currentFloor);
    return hasRoomsOnFloor || hasFloorsProperty || currentFloor === 1;
  });

  const isStartPointOnCurrentFloor =
    !startPoint?.floor || startPoint.floor === currentFloor;
  const isDestinationPointOnCurrentFloor =
    !destinationPoint?.floor || destinationPoint.floor === currentFloor;

  const hasActiveNavigation = !!(startPoint || destinationPoint);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-200 relative overflow-hidden">
      {/* Full-screen Map */}
      <TransformWrapper
        ref={transformRef}
        wheel={{step: 0.08}}
        doubleClick={{disabled: true}}
        pinch={{step: 5}}
        minScale={0.4}
        maxScale={4}
        limitToBounds={false}
        onTransformed={handleTransform}
      >
        <TransformComponent
          wrapperStyle={{width: '100%', height: '100%'}}
          contentStyle={{
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WORLD_WIDTH,
              height: WORLD_HEIGHT,
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            <TileSystem
              tileSize={8192}
              className="tile-background"
              viewport={viewport}
            />
          </div>

          <svg
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            style={{position: 'absolute', top: 0, left: 0, zIndex: 10}}
          >
            <GraphOverlay
              nodes={currentFloorGraphNodes}
              worldWidth={WORLD_WIDTH}
              worldHeight={WORLD_HEIGHT}
              showDebugInfo={showGraphDebug}
              selectedNodeId={selectedGraphNodeId}
              showPathNodes={showPathNodes}
              showPathEdges={showPathEdges}
              showRoomConnections={showRoomConnections}
              showRoomNodes={showRoomNodes}
              onNodeClick={onGraphNodeSelect}
              currentFloor={currentFloor}
            />

            {buildingsWithCurrentFloorContent.map((building, index) => {
              const isFocused = focusBuildingId === building.id;
              const buildingRooms = currentFloorRooms.filter(
                room => room.buildingId === building.id,
              );
              return (
                <g key={index}>
                  <text
                    x={building.x + building.width / 2}
                    y={building.y - 10}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill={isFocused ? '#2563eb' : '#000000'}
                    fontSize={14}
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {building.name}
                  </text>
                  <rect
                    x={building.x}
                    y={building.y}
                    width={building.width}
                    height={building.height}
                    fill={isFocused ? '#3b82f6' : '#0ea5e9'}
                    stroke={isFocused ? '#2563eb' : '#000000'}
                    strokeWidth={isFocused ? 3 : 2}
                    rx={6}
                    ry={6}
                    opacity={0.8}
                  />
                  {buildingRooms.map((room, roomIndex) => (
                    <RoomTile
                      key={roomIndex}
                      id={room.id}
                      x={building.x + room.x}
                      y={building.y + room.y}
                      width={room.width || 30}
                      height={room.height || 20}
                      name={room.name}
                      building={room.building}
                      floor={room.floor}
                      isDragging={false}
                      isSelected={selectedRoomId === room.id}
                      isHighlighted={focusBuildingId === room.buildingId}
                      onPointerDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => onRoomSelect?.(room.id)}
                    />
                  ))}
                </g>
              );
            })}

            {currentRoute && currentRoute.success && showRoute && (
              <RouteOverlay
                nodes={graphNodes}
                routePath={currentRoute.path}
                scalePosition={scalePosition}
                totalDistance={currentRoute.totalDistance}
                currentFloor={currentFloor}
              />
            )}

            {startPoint && isStartPointOnCurrentFloor && (
              <StartMarker
                x={startPoint.x}
                y={startPoint.y}
                label={startPoint.label}
                isAnimated={true}
                onClick={onStartPointClear}
              />
            )}

            {destinationPoint && isDestinationPointOnCurrentFloor && (
              <DestinationMarker
                x={destinationPoint.x}
                y={destinationPoint.y}
                label={destinationPoint.label}
                isAnimated={true}
                onClick={onDestinationPointClear}
              />
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Top bar: floor selector + route status */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 z-20 pointer-events-none">
        {/* Floor pills */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow pointer-events-auto">
          {availableFloors.map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange?.(floor)}
              className={`px-3 py-1 text-sm rounded-full transition-colors font-medium ${
                floor === currentFloor
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>

        {/* Route status badge */}
        {currentRoute && currentRoute.success && (
          <div className="ml-auto bg-yellow-400/95 backdrop-blur-sm text-yellow-900 rounded-full px-3 py-1 text-xs font-semibold shadow pointer-events-auto">
            📍 {currentRoute.totalDistance.toFixed(1)} units
          </div>
        )}
        {currentRoute && !currentRoute.success && hasActiveNavigation && (
          <div className="ml-auto bg-red-100/95 backdrop-blur-sm text-red-700 rounded-full px-3 py-1 text-xs font-semibold shadow pointer-events-auto">
            No route found
          </div>
        )}
      </div>

      {/* Off-floor navigation warnings */}
      {startPoint && !isStartPointOnCurrentFloor && (
        <div className="absolute top-14 left-3 right-3 bg-red-50 border border-red-200 p-2 rounded-lg shadow text-xs z-20">
          <span className="text-red-700 font-medium">Start</span>
          <span className="text-red-600"> is on Floor {startPoint.floor} — </span>
          <button
            onClick={() => startPoint.floor && onFloorChange?.(startPoint.floor)}
            className="text-red-600 underline"
          >
            Go there
          </button>
        </div>
      )}

      {destinationPoint && !isDestinationPointOnCurrentFloor && (
        <div className="absolute top-14 left-3 right-3 bg-green-50 border border-green-200 p-2 rounded-lg shadow text-xs z-20">
          <span className="text-green-700 font-medium">Destination</span>
          <span className="text-green-600"> is on Floor {destinationPoint.floor} — </span>
          <button
            onClick={() =>
              destinationPoint.floor && onFloorChange?.(destinationPoint.floor)
            }
            className="text-green-600 underline"
          >
            Go there
          </button>
        </div>
      )}

      {/* Bottom drawer toggle handle */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Handle bar */}
        <button
          onClick={() => setIsDrawerOpen(prev => !prev)}
          className="w-full flex flex-col items-center pt-2 pb-1 bg-white rounded-t-2xl shadow-lg"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-1" />
          <span className="text-xs text-gray-500">
            {isDrawerOpen ? 'Hide controls' : 'Show controls'}
          </span>
        </button>

        {/* Drawer content */}
        {isDrawerOpen && (
          <div className="bg-white shadow-lg max-h-72 overflow-y-auto">
            {/* Tab bar */}
            <div className="flex border-b border-gray-200">
              {(['navigation', 'floors', 'display'] as DrawerTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'navigation' ? '🧭 Nav' : tab === 'floors' ? '🏢 Floors' : '🎨 Display'}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Navigation tab */}
              {activeTab === 'navigation' && (
                <div className="space-y-3">
                  {!hasActiveNavigation && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Tap a node on the map, then use "Set as Start" or "Set as Destination"
                    </p>
                  )}

                  {startPoint && (
                    <div className="flex items-center justify-between bg-red-50 rounded-lg p-2">
                      <div>
                        <span className="text-xs text-red-500 font-semibold">START</span>
                        <p className="text-sm font-medium">{startPoint.label}</p>
                        {startPoint.floor !== undefined && (
                          <p className="text-xs text-gray-400">Floor {startPoint.floor}</p>
                        )}
                      </div>
                      <button
                        onClick={onStartPointClear}
                        className="text-red-400 hover:text-red-600 text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {destinationPoint && (
                    <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                      <div>
                        <span className="text-xs text-green-500 font-semibold">DESTINATION</span>
                        <p className="text-sm font-medium">{destinationPoint.label}</p>
                        {destinationPoint.floor !== undefined && (
                          <p className="text-xs text-gray-400">Floor {destinationPoint.floor}</p>
                        )}
                      </div>
                      <button
                        onClick={onDestinationPointClear}
                        className="text-green-400 hover:text-green-600 text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {currentRoute && currentRoute.success && (
                    <div className="bg-yellow-50 rounded-lg p-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-600 font-semibold">ROUTE FOUND</p>
                        <p className="text-sm">
                          {currentRoute.totalDistance.toFixed(1)} units ·{' '}
                          {currentRoute.path.length} waypoints
                        </p>
                      </div>
                      <button
                        onClick={onClearRoute}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Floors tab */}
              {activeTab === 'floors' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Select a floor to view</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableFloors.map(floor => (
                      <button
                        key={floor}
                        onClick={() => onFloorChange?.(floor)}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          floor === currentFloor
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {floor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Display tab */}
              {activeTab === 'display' && (
                <div className="space-y-2">
                  {[
                    {label: 'Path Nodes', value: showPathNodes, onChange: onShowPathNodesChange},
                    {label: 'Room Nodes', value: showRoomNodes, onChange: onShowRoomNodesChange},
                    {label: 'Path Edges', value: showPathEdges, onChange: onShowPathEdgesChange},
                    {label: 'Room Connections', value: showRoomConnections, onChange: onShowRoomConnectionsChange},
                    {label: 'Route', value: showRoute, onChange: onShowRouteChange},
                  ].map(({label, value, onChange}) => (
                    <label key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{label}</span>
                      <button
                        onClick={() => onChange?.(!value)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          value ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            value ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
