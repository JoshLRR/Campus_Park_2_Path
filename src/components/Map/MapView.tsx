/**
 * Map view component.
 */

import React, {useRef, useState, useCallback, useMemo} from 'react';
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

// Building type
export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  floors?: number[];
}

export type Point = {x: number; y: number};

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
  features?: number[];
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
  focusPoint?: {x: number; y: number; seq: number; targetScale?: number} | null;
  highlightedSegment?: {from: number; to: number} | null;
  onRoomSelect?: (roomId: number) => void;
  onGraphNodeSelect?: (nodeId: number) => void;
  onStartPointClear?: () => void;
  onDestinationPointClear?: () => void;
  onFloorChange?: (floor: number) => void;
}

const WORLD_WIDTH = 20000;
const WORLD_HEIGHT = 20000;
export const NODE_SCALE = 1 / 0.1445603396126786;
export const NODE_OFFSET_X = 0;
export const NODE_OFFSET_Y = 0;

// Default landing view — the path node and scale the map opens on and
// returns to when the recenter button is pressed
export const DEFAULT_VIEW_NODE_ID = 306;
const DEFAULT_VIEW_SCALE = 0.1;

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
  focusPoint,
  highlightedSegment,
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

  // onTransformed fires at pointer-move frequency; throttled on a wall-clock
  // interval (rather than per-frame) so the resulting re-renders don't
  // compete with the browser's own gesture rendering for frame budget.
  const VIEWPORT_UPDATE_INTERVAL_MS = 150;
  const viewportThrottleRef = useRef<{
    timeoutId: ReturnType<typeof setTimeout> | null;
    lastRunAt: number;
  }>({timeoutId: null, lastRunAt: 0});

  const applyViewportFromTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    const {state} = ref;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    setViewport({
      x: -state.positionX / state.scale,
      y: -state.positionY / state.scale,
      width: containerRect.width,
      height: containerRect.height,
      scale: state.scale,
    });
  }, []);

  const handleTransform = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      const tracker = viewportThrottleRef.current;
      const now = Date.now();
      const elapsed = now - tracker.lastRunAt;

      if (tracker.timeoutId !== null) {
        clearTimeout(tracker.timeoutId);
        tracker.timeoutId = null;
      }

      if (elapsed >= VIEWPORT_UPDATE_INTERVAL_MS) {
        tracker.lastRunAt = now;
        applyViewportFromTransform(ref);
      } else {
        tracker.timeoutId = setTimeout(() => {
          tracker.lastRunAt = Date.now();
          tracker.timeoutId = null;
          applyViewportFromTransform(ref);
        }, VIEWPORT_UPDATE_INTERVAL_MS - elapsed);
      }
    },
    [applyViewportFromTransform],
  );

  React.useEffect(() => {
    return () => {
      if (viewportThrottleRef.current.timeoutId !== null) {
        clearTimeout(viewportThrottleRef.current.timeoutId);
      }
    };
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

  // Default landing view — centers on path node 306 at the standard zoomed-out scale
  const centerOnDefaultView = useCallback(
    (animationTime = 0) => {
      const container = containerRef.current;
      const transform = transformRef.current;
      const node = graphNodes.find(n => n.id === DEFAULT_VIEW_NODE_ID);
      if (!container || !transform || !node) return;
      const rect = container.getBoundingClientRect();
      const targetX = node.position.x * NODE_SCALE - NODE_OFFSET_X;
      const targetY = node.position.y * NODE_SCALE - NODE_OFFSET_Y;
      const posX = rect.width / 2 - targetX * DEFAULT_VIEW_SCALE;
      const posY = rect.height / 2 - targetY * DEFAULT_VIEW_SCALE;
      transform.setTransform(posX, posY, DEFAULT_VIEW_SCALE, animationTime);
    },
    [graphNodes],
  );

  // Center on the default view once graph data has loaded
  const hasCenteredOnLoad = useRef(false);
  React.useEffect(() => {
    if (hasCenteredOnLoad.current) return;
    if (graphNodes.some(n => n.id === DEFAULT_VIEW_NODE_ID)) {
      centerOnDefaultView();
      hasCenteredOnLoad.current = true;
    }
  }, [graphNodes, centerOnDefaultView]);

  // Animate to a CSS world position when focusPoint changes
  React.useEffect(() => {
    if (!focusPoint || !transformRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentScale = transformRef.current.state?.scale ?? 0.1;
    const targetScale = Math.max(currentScale, focusPoint.targetScale ?? 0.7);
    const posX = rect.width / 2 - focusPoint.x * targetScale;
    const posY = rect.height / 2 - focusPoint.y * targetScale;
    transformRef.current.setTransform(
      posX,
      posY,
      targetScale,
      400,
      'easeOutCubic',
    );
  }, [focusPoint]);

  // Memoized so these filters don't re-scan the full (1000+ node) graph on
  // every viewport-driven re-render during pan/zoom
  const currentFloorGraphNodes = useMemo(
    () => graphNodes.filter(node => node.position.floorNum === currentFloor),
    [graphNodes, currentFloor],
  );

  const currentFloorRooms = useMemo(
    () => rooms.filter(room => room.floor === currentFloor),
    [rooms, currentFloor],
  );

  const buildingsWithCurrentFloorContent = useMemo(
    () =>
      initialBuildings.filter(building => {
        const hasRoomsOnFloor = currentFloorRooms.some(
          room => room.buildingId === building.id,
        );
        const hasFloorsProperty =
          building.floors && building.floors.includes(currentFloor);
        return hasRoomsOnFloor || hasFloorsProperty || currentFloor === 1;
      }),
    [initialBuildings, currentFloorRooms, currentFloor],
  );

  // Handle room pointer down
  const handleRoomPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle room click
  const handleRoomClick = (roomId: number) => {
    onRoomSelect?.(roomId);
  };

  // Map zoom & recenter controls
  const handleZoomIn = () => transformRef.current?.zoomIn();
  const handleZoomOut = () => transformRef.current?.zoomOut();
  const handleRecenter = () => centerOnDefaultView(400);

  // Scale position function — must match GraphOverlay's formula
  const scalePosition = (pos: {x: number; y: number}) => ({
    x: pos.x * NODE_SCALE - NODE_OFFSET_X,
    y: pos.y * NODE_SCALE - NODE_OFFSET_Y,
  });

  // Check if navigation points are on current floor
  const isStartPointOnCurrentFloor =
    !startPoint?.floor || startPoint.floor === currentFloor;
  const isDestinationPointOnCurrentFloor =
    !destinationPoint?.floor || destinationPoint.floor === currentFloor;

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-stone-100 relative overflow-hidden"
    >
      <TransformWrapper
        ref={transformRef}
        wheel={{step: 0.08}}
        doubleClick={{disabled: true}}
        pinch={{step: 5}}
        // Disables the library's default momentum/glide-on-release panning
        panning={{velocityDisabled: true}}
        minScale={0.05}
        maxScale={4}
        limitToBounds={false}
        initialScale={DEFAULT_VIEW_SCALE}
        initialPositionX={176}
        initialPositionY={-432}
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
                scalePosition={scalePosition}
                totalDistance={currentRoute.totalDistance}
                currentFloor={currentFloor}
                highlightedSegment={highlightedSegment}
              />
            )}

            {/* Focused room highlight — pulsing ring to help locate a room
                zoomed to via search (e.g. the search panel's "view" eye icon) */}
            {(() => {
              const focusedRoom = selectedRoomId
                ? currentFloorRooms.find(room => room.id === selectedRoomId)
                : null;
              if (!focusedRoom) return null;
              const pos = scalePosition(focusedRoom);
              return (
                <g
                  transform={`translate(${pos.x} ${pos.y}) scale(${
                    1 / viewport.scale
                  })`}
                  pointerEvents="none"
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={18}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    opacity={0.85}
                  >
                    <animate
                      attributeName="r"
                      values="18;28;18"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9;0.25;0.9"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })()}

            {/* Navigation markers — wrapped in an inverse-scale group so they
                stay a constant on-screen size regardless of map zoom level */}
            {startPoint && isStartPointOnCurrentFloor && (
              <g
                transform={`translate(${scalePosition(startPoint).x} ${
                  scalePosition(startPoint).y
                }) scale(${1 / viewport.scale})`}
              >
                <StartMarker
                  x={0}
                  y={0}
                  label={startPoint.label}
                  isAnimated={true}
                  onClick={onStartPointClear}
                />
              </g>
            )}

            {destinationPoint && isDestinationPointOnCurrentFloor && (
              <g
                transform={`translate(${scalePosition(destinationPoint).x} ${
                  scalePosition(destinationPoint).y
                }) scale(${1 / viewport.scale})`}
              >
                <DestinationMarker
                  x={0}
                  y={0}
                  label={destinationPoint.label}
                  isAnimated={true}
                  onClick={onDestinationPointClear}
                />
              </g>
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Zoom & recenter controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-1 bg-white rounded-2xl shadow-xl p-1">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom in"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom out"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
        <div className="h-px bg-gray-100 mx-1" />
        <button
          onClick={handleRecenter}
          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Recenter map"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="6.5" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>

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
      {availableFloors.length > 1 && (
        <div className="absolute bottom-6 right-4 flex flex-col gap-1 bg-white rounded-2xl shadow-xl p-1.5">
          {[...availableFloors].reverse().map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange?.(floor)}
              className={`w-9 h-9 text-sm font-bold rounded-xl transition-colors ${
                floor === currentFloor
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={`Floor ${floor}`}
            >
              {floor}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
