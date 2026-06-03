import React, {useRef, useState, useCallback, useEffect} from 'react';
import {TransformWrapper, TransformComponent, ReactZoomPanPinchRef} from 'react-zoom-pan-pinch';
import TileSystem from './TileSystem';
import {RoomTile} from './RoomTile';
import {StartMarker} from './StartMarker';
import {DestinationMarker} from './DestinationMarker';
import {GraphOverlay, GraphNode} from './GraphOverlay';
import {RouteOverlay} from './RouteOverlay';
import {PathResult} from './pathfinding';
import {MAP_CONSTANTS, graphToMapCoords} from './MapConstants';
import {Building, Room, NavigationPoint} from './MapView';
import {MobileMapHeader} from './MobileMapHeader';
import {MobileRoomMenu} from './MobileRoomMenu';
import {MobileBottomSheet} from './MobileBottomSheet';

const {WORLD_WIDTH, WORLD_HEIGHT} = MAP_CONSTANTS;

const DEFAULT_MIN_SCALE = 0.4;
const DEFAULT_MAX_SCALE = 4;

export interface MapBounds {
  /** Minimum world-space X the viewport left edge may reach */
  minX: number;
  /** Maximum world-space X the viewport left edge may reach */
  maxX: number;
  /** Minimum world-space Y the viewport top edge may reach */
  minY: number;
  /** Maximum world-space Y the viewport top edge may reach */
  maxY: number;
}

export interface MobileMapViewProps {
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
  /** Minimum zoom scale (default: 0.4) */
  minScale?: number;
  /** Maximum zoom scale (default: 4) */
  maxScale?: number;
  /** Optional pan boundaries in world-space coordinates */
  bounds?: MapBounds;
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
  onSetStartFromSelected?: () => void;
  onSetEndFromSelected?: () => void;
  onSetStartFromNodeId?: (nodeId: number) => void;
  onSetEndFromNodeId?: (nodeId: number) => void;
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
                                                              minScale = DEFAULT_MIN_SCALE,
                                                              maxScale = DEFAULT_MAX_SCALE,
                                                              bounds,
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
                                                              onSetStartFromSelected,
                                                              onSetEndFromSelected,
                                                              onSetStartFromNodeId,
                                                              onSetEndFromNodeId,
                                                            }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewport, setViewport] = useState({x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT, scale: 1});

  const updateViewportSize = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setViewport(prev => ({...prev, width: rect.width, height: rect.height}));
  }, []);

  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    const {state} = ref;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (bounds) {
      // Convert world-space bounds to screen-space positions, then clamp.
      const clampedX = Math.min(
        -bounds.minX * state.scale,
        Math.max(-bounds.maxX * state.scale, state.positionX),
      );
      const clampedY = Math.min(
        -bounds.minY * state.scale,
        Math.max(-bounds.maxY * state.scale, state.positionY),
      );

      if (clampedX !== state.positionX || clampedY !== state.positionY) {
        ref.setTransform(clampedX, clampedY, state.scale, 0);
        return;
      }
    }

    setViewport({
      x: -state.positionX / state.scale,
      y: -state.positionY / state.scale,
      width: rect.width,
      height: rect.height,
      scale: state.scale,
    });
  }, [bounds]);

  useEffect(() => {
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, [updateViewportSize]);

  const currentFloorRooms = rooms.filter(r => r.floor === currentFloor);
  const currentFloorGraphNodes = graphNodes.filter(n => n.position.floorNum === currentFloor);
  const visibleBuildings = initialBuildings.filter(b =>
    currentFloorRooms.some(r => r.buildingId === b.id) || b.floors?.includes(currentFloor) || currentFloor === 1,
  );

  const isStartOnFloor = !startPoint?.floor || startPoint.floor === currentFloor;
  const isDestOnFloor = !destinationPoint?.floor || destinationPoint.floor === currentFloor;
  const selectedGraphNode = selectedGraphNodeId != null
    ? (graphNodes.find(n => n.id === selectedGraphNodeId) ?? null)
    : null;

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-200 relative">
      <TransformWrapper
        ref={transformRef}
        wheel={{step: 0.08}}
        doubleClick={{disabled: true}}
        pinch={{step: 5}}
        minScale={minScale}
        maxScale={maxScale}
        limitToBounds={false}
        onTransformed={handleTransform}
      >
        <TransformComponent
          wrapperStyle={{width: '100%', height: '100%'}}
          contentStyle={{width: WORLD_WIDTH, height: WORLD_HEIGHT, position: 'relative'}}
        >
          <div style={{position: 'absolute', top: 0, left: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT, zIndex: 0, pointerEvents: 'none'}}>
            <TileSystem tileSize={8192} className="tile-background" viewport={viewport} />
          </div>

          <svg width={WORLD_WIDTH} height={WORLD_HEIGHT} style={{position: 'absolute', top: 0, left: 0, zIndex: 10}}>
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

            {visibleBuildings.map((building, index) => {
              const isFocused = focusBuildingId === building.id;
              const buildingRooms = currentFloorRooms.filter(r => r.buildingId === building.id);
              return (
                <g key={index}>
                  <text
                    x={building.x + building.width / 2} y={building.y - 10}
                    textAnchor="middle" alignmentBaseline="middle"
                    fill={isFocused ? '#2563eb' : '#000000'}
                    fontSize={14} fontWeight="bold" pointerEvents="none"
                  >
                    {building.name}
                  </text>
                  <rect
                    x={building.x} y={building.y} width={building.width} height={building.height}
                    fill={isFocused ? '#3b82f6' : '#0ea5e9'} stroke={isFocused ? '#2563eb' : '#000000'}
                    strokeWidth={isFocused ? 3 : 2} rx={6} ry={6} opacity={0.8}
                  />
                  {buildingRooms.map((room, ri) => (
                    <RoomTile
                      key={ri}
                      id={room.id}
                      x={building.x + room.x} y={building.y + room.y}
                      width={room.width || 30} height={room.height || 20}
                      name={room.name} building={room.building} floor={room.floor}
                      isDragging={false}
                      isSelected={selectedRoomId === room.id}
                      isHighlighted={focusBuildingId === room.buildingId}
                      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => onRoomSelect?.(room.id)}
                    />
                  ))}
                </g>
              );
            })}

            {currentRoute?.success && showRoute && (
              <RouteOverlay
                nodes={graphNodes}
                routePath={currentRoute.path}
                scalePosition={graphToMapCoords}
                totalDistance={currentRoute.totalDistance}
                currentFloor={currentFloor}
              />
            )}

            {startPoint && isStartOnFloor && (
              <StartMarker x={startPoint.x} y={startPoint.y} label={startPoint.label} isAnimated onClick={onStartPointClear} />
            )}
            {destinationPoint && isDestOnFloor && (
              <DestinationMarker x={destinationPoint.x} y={destinationPoint.y} label={destinationPoint.label} isAnimated onClick={onDestinationPointClear} />
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      <MobileMapHeader onMenuOpen={() => setIsMenuOpen(true)} />

      <MobileRoomMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        graphNodes={graphNodes}
        currentFloor={currentFloor}
        selectedGraphNodeId={selectedGraphNodeId}
        onNodeSelect={nodeId => onGraphNodeSelect?.(nodeId)}
        onSetStart={nodeId => onSetStartFromNodeId?.(nodeId)}
        onSetEnd={nodeId => onSetEndFromNodeId?.(nodeId)}
      />

      <div className="absolute top-[72px] left-3 right-3 flex gap-1 z-20 pointer-events-none">
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow pointer-events-auto">
          {availableFloors.map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange?.(floor)}
              className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors ${floor === currentFloor ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>

      {startPoint && !isStartOnFloor && (
        <div className="absolute top-[112px] left-3 right-3 bg-red-50 border border-red-200 p-2 rounded-lg shadow text-xs z-20">
          <span className="text-red-700 font-medium">Start</span>
          <span className="text-red-600"> is on Floor {startPoint.floor} — </span>
          <button onClick={() => startPoint.floor && onFloorChange?.(startPoint.floor)} className="text-red-600 underline">Go there</button>
        </div>
      )}
      {destinationPoint && !isDestOnFloor && (
        <div className="absolute top-[112px] left-3 right-3 bg-green-50 border border-green-200 p-2 rounded-lg shadow text-xs z-20">
          <span className="text-green-700 font-medium">Destination</span>
          <span className="text-green-600"> is on Floor {destinationPoint.floor} — </span>
          <button onClick={() => destinationPoint.floor && onFloorChange?.(destinationPoint.floor)} className="text-green-600 underline">Go there</button>
        </div>
      )}

      <MobileBottomSheet
        selectedGraphNode={selectedGraphNode}
        startPoint={startPoint ?? null}
        destinationPoint={destinationPoint ?? null}
        currentRoute={currentRoute}
        availableFloors={availableFloors}
        currentFloor={currentFloor}
        showPathNodes={showPathNodes}
        showRoomNodes={showRoomNodes}
        showPathEdges={showPathEdges}
        showRoomConnections={showRoomConnections}
        showRoute={showRoute}
        onSetStart={() => selectedGraphNode && onSetStartFromNodeId?.(selectedGraphNode.id)}
        onSetEnd={() => selectedGraphNode && onSetEndFromNodeId?.(selectedGraphNode.id)}
        onStartPointClear={onStartPointClear}
        onDestinationPointClear={onDestinationPointClear}
        onClearRoute={onClearRoute}
        onFloorChange={onFloorChange}
        onShowPathNodesChange={onShowPathNodesChange}
        onShowRoomNodesChange={onShowRoomNodesChange}
        onShowPathEdgesChange={onShowPathEdgesChange}
        onShowRoomConnectionsChange={onShowRoomConnectionsChange}
        onShowRouteChange={onShowRouteChange}
        graphNodes={graphNodes}
        onSetStartFromNodeId={onSetStartFromNodeId}
        onSetEndFromNodeId={onSetEndFromNodeId}
      />
    </div>
  );
};
