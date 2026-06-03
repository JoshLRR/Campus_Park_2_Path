/**
 * Map view component.
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

// Building type
export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  floors?: number[];
}

export type Point = { x: number; y: number };

export interface PolygonBuilding extends Building {
  points: Point[];
}

// Room interface
export interface Room {
  name: string;
  building: string;
  buildingId: number;
  floor: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// Navigation points interface
export interface NavigationPoint {
  roomId?: number;
  x: number;
  y: number;
  label: string;
  floor?: number;
}

interface MapViewProps {
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
}

const WORLD_WIDTH = MAP_CONSTANTS.WORLD_WIDTH;
const WORLD_HEIGHT = MAP_CONSTANTS.WORLD_HEIGHT;

export const MapView: React.FC<MapViewProps> = ({
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Viewport tracking for tile culling
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    scale: 1,
  });

  // Update viewport for tile culling optimization
  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
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
  }, []);

  // Initialize viewport on mount
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

  // Handle window resize to update viewport dimensions
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

  // Filter items based on current floor
  const filterByFloor = <T extends {floor?: number}>(items: T[]): T[] => {
    return items.filter(item => item.floor === currentFloor);
  };

  // Filter graph nodes by current floor
  const currentFloorGraphNodes = graphNodes.filter(
    node => node.position.floorNum === currentFloor,
  );

  // Filter rooms by current floor
  const currentFloorRooms = filterByFloor(rooms);

  // Filter buildings that have rooms/content on current floor
  const buildingsWithCurrentFloorContent = initialBuildings.filter(building => {
    const hasRoomsOnFloor = currentFloorRooms.some(
      room => room.buildingId === building.id,
    );
    const hasFloorsProperty =
      building.floors && building.floors.includes(currentFloor);
    return hasRoomsOnFloor || hasFloorsProperty || currentFloor === 1;
  });

  // Handle room pointer down
  const handleRoomPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle room click
  const handleRoomClick = (roomId: number) => {
    onRoomSelect?.(roomId);
  };

  // Check if navigation points are on current floor
  const isStartPointOnCurrentFloor =
    !startPoint?.floor || startPoint.floor === currentFloor;
  const isDestinationPointOnCurrentFloor =
    !destinationPoint?.floor || destinationPoint.floor === currentFloor;

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-200 relative overflow-hidden"
    >
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
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
            position: 'relative',
          }}
        >
          {/* Optimized Tile System with Viewport Culling */}
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
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 10,
            }}
          >
            {/* Graph overlay with nodes and edges - filtered by floor */}
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

            {/* Buildings */}
            {buildingsWithCurrentFloorContent.map((building, index) => {
              const isFocused = focusBuildingId === building.id;
              const buildingRooms = currentFloorRooms.filter(
                room => room.buildingId === building.id,
              );

              return (
                <g key={index}>
                  {/* Building name */}
                  <text
                    x={building.x + building.width / 2}
                    y={building.y - 10}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill={isFocused ? '#2563eb' : '#000000'}
                    fontSize={14}
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{
                      textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
                      transition: 'fill 0.3s ease-in-out',
                    }}
                  >
                    {building.name}
                    {building.floors && building.floors.length > 1 && (
                      <tspan
                        x={building.x + building.width / 2}
                        dy="12"
                        fontSize={10}
                        fill="#6b7280"
                      >
                        Floors: {building.floors.join(', ')}
                      </tspan>
                    )}
                  </text>

                  {/* Building rectangle */}
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
                    style={{
                      cursor: 'pointer',
                      filter: isFocused
                        ? 'drop-shadow(0 8px 25px rgba(59, 130, 246, 0.5))'
                        : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      transition:
                        'fill 0.3s ease-in-out, stroke 0.3s ease-in-out, filter 0.3s ease-in-out, stroke-width 0.3s ease-in-out',
                    }}
                  />

                  {/* Rooms within building */}
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
                      onPointerDown={e => handleRoomPointerDown(e)}
                      onClick={() => handleRoomClick(room.id)}
                    />
                  ))}
                </g>
              );
            })}

            {/* Route overlay */}
            {currentRoute && currentRoute.success && showRoute && (
              <RouteOverlay
                nodes={currentFloorGraphNodes}
                routePath={currentRoute.path}
                scalePosition={graphToMapCoords}
                totalDistance={currentRoute.totalDistance}
                currentFloor={currentFloor}
              />
            )}

            {/* Navigation markers */}
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

      {/* Floor indicators for off-floor navigation points */}
      {startPoint && !isStartPointOnCurrentFloor && (
        <div className="absolute bottom-24 right-4 bg-red-50 border border-red-200 p-2 rounded-lg shadow-lg text-xs">
          <p className="text-red-700">
            <strong>Start point</strong> is on Floor {startPoint.floor}
          </p>
          <button
            onClick={() =>
              startPoint.floor && onFloorChange?.(startPoint.floor)
            }
            className="text-red-600 hover:text-red-800 underline"
          >
            Go to Floor {startPoint.floor}
          </button>
        </div>
      )}

      {destinationPoint && !isDestinationPointOnCurrentFloor && (
        <div className="absolute bottom-40 right-4 bg-green-50 border border-green-200 p-2 rounded-lg shadow-lg text-xs">
          <p className="text-green-700">
            <strong>Destination</strong> is on Floor {destinationPoint.floor}
          </p>
          <button
            onClick={() =>
              destinationPoint.floor && onFloorChange?.(destinationPoint.floor)
            }
            className="text-green-600 hover:text-green-800 underline"
          >
            Go to Floor {destinationPoint.floor}
          </button>
        </div>
      )}

      {/* Floor Selector */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <h4 className="font-semibold mb-2 text-sm">Floor</h4>
        <div className="flex flex-wrap gap-1">
          {availableFloors.map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange?.(floor)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                floor === currentFloor
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={`Switch to Floor ${floor}`}
            >
              {floor}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Current: Floor {currentFloor}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Legend</h4>
        </div>
        <div className="space-y-1">
          {showPathNodes && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Path Node</span>
            </div>
          )}
          {showRoomNodes && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Room Node</span>
            </div>
          )}
          {showPathEdges && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-indigo-600"></div>
              <span>Path Edge</span>
            </div>
          )}
          {showRoomConnections && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-1 bg-indigo-600"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #4f46e5 0px, #4f46e5 4px, transparent 4px, transparent 8px)',
                }}
              ></div>
              <span>Room Connection</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-500 border border-black rounded-sm"></div>
            <span>Building</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Destination</span>
          </div>
          {showRoute && currentRoute && currentRoute.success && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-yellow-500"></div>
              <span>Route</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs max-w-48">
        <p>
          <strong>Controls:</strong>
        </p>
        <p>• Mouse wheel: Zoom</p>
        <p>• Drag: Pan around map</p>
        <p>• Click floor buttons: Change floor</p>
        <p>• Click buildings: Highlight rooms</p>
        <p>• Click rooms: Select</p>
        <p>• Click graph nodes: Select node</p>
        <p>• Click markers: Remove</p>
      </div>
    </div>
  );
};
