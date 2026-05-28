/**
 * Mobile/Tablet Map view component.
 *
 * Uses the Figma-designed header and bottom sheet UI from 15Map.tsx,
 * wired to the live map canvas (TileSystem, GraphOverlay, RouteOverlay).
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
import {Building, Room, NavigationPoint} from './MapView';

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
  /** Called when user taps "Set as Start" on a selected node */
  onSetStartFromSelected?: () => void;
  /** Called when user taps "Set as End" on a selected node */
  onSetEndFromSelected?: () => void;
}

// ─── Figma Header ────────────────────────────────────────────────────────────

function FigmaHeader() {
  return (
    <div className="absolute left-0 right-0 top-0 z-30 overflow-hidden" style={{height: 64}}>
      {/* Blue background */}
      <div className="absolute inset-0 bg-[#2563EB] shadow-[0px_2px_48px_0px_rgba(0,0,0,0.13)]" />
      {/* Hamburger icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <svg width="20" height="14" fill="none" viewBox="0 0 20 14">
          <path d="M1 7H19" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M1 1H19" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M1 13H19" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
      {/* Title */}
      <p className="absolute inset-0 flex items-center justify-center text-white text-base font-semibold tracking-[0.864px]">
        Campus Map
      </p>
    </div>
  );
}

// ─── Figma Bottom Sheet ───────────────────────────────────────────────────────

interface FigmaBottomSheetProps {
  selectedGraphNode: GraphNode | null;
  startPoint: NavigationPoint | null;
  destinationPoint: NavigationPoint | null;
  currentRoute: PathResult | null;
  availableFloors: number[];
  currentFloor: number;
  showPathNodes: boolean;
  showRoomNodes: boolean;
  showPathEdges: boolean;
  showRoomConnections: boolean;
  showRoute: boolean;
  onSetStart: () => void;
  onSetEnd: () => void;
  onStartPointClear?: () => void;
  onDestinationPointClear?: () => void;
  onClearRoute?: () => void;
  onFloorChange?: (floor: number) => void;
  onShowPathNodesChange?: (v: boolean) => void;
  onShowRoomNodesChange?: (v: boolean) => void;
  onShowPathEdgesChange?: (v: boolean) => void;
  onShowRoomConnectionsChange?: (v: boolean) => void;
  onShowRouteChange?: (v: boolean) => void;
}

function FigmaBottomSheet({
                            selectedGraphNode,
                            startPoint,
                            destinationPoint,
                            currentRoute,
                            availableFloors,
                            currentFloor,
                            showPathNodes,
                            showRoomNodes,
                            showPathEdges,
                            showRoomConnections,
                            showRoute,
                            onSetStart,
                            onSetEnd,
                            onStartPointClear,
                            onDestinationPointClear,
                            onClearRoute,
                            onFloorChange,
                            onShowPathNodesChange,
                            onShowRoomNodesChange,
                            onShowPathEdgesChange,
                            onShowRoomConnectionsChange,
                            onShowRouteChange,
                          }: FigmaBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('navigation');
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveNavigation = !!(startPoint || destinationPoint);

  // The Figma "ConfirmTaxi" sheet — shown collapsed showing selected node info
  // and expanded showing full navigation / floors / display tabs
  const nodeName = selectedGraphNode?.roomNumber || (selectedGraphNode ? `Node ${selectedGraphNode.id}` : null);
  const nodeAddress = selectedGraphNode
    ? `Floor ${selectedGraphNode.position.floorNum} · ${selectedGraphNode.kind}`
    : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      {/* Figma-styled white card */}
      <div
        className="bg-white rounded-tl-[25px] rounded-tr-[25px] shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.10)] overflow-hidden"
      >
        {/* Drag handle */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="w-full flex flex-col items-center pt-3 pb-1"
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </button>

        {/* Collapsed state: shows node name + Set as Start / Set as End */}
        {!isExpanded && (
          <div className="px-4 pb-6">
            {/* Node name / navigation status */}
            <p className="text-[18px] font-bold text-[#1e2022] text-center tracking-[0.5px] mb-1">
              {nodeName ?? (hasActiveNavigation ? 'Navigation active' : 'Select a node')}
            </p>
            <p className="text-[14px] text-[#77838f] text-center tracking-[0.5px] mb-4">
              {nodeAddress ?? (
                hasActiveNavigation
                  ? `${startPoint ? `From: ${startPoint.label}` : ''}${startPoint && destinationPoint ? ' → ' : ''}${destinationPoint ? `To: ${destinationPoint.label}` : ''}`
                  : 'Tap a node on the map'
              )}
            </p>

            {/* Route info pill */}
            {currentRoute?.success && (
              <div className="flex justify-center mb-4">
                <div className="bg-[#2563EB] rounded-full px-4 py-1 text-white text-sm font-semibold">
                  📍 {currentRoute.totalDistance.toFixed(1)} units · {currentRoute.path.length} waypoints
                </div>
              </div>
            )}
            {currentRoute && !currentRoute.success && hasActiveNavigation && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full px-4 py-1 text-red-700 text-sm font-semibold">
                  No route found
                </div>
              </div>
            )}

            {/* Figma-styled Set as Start / Set as End buttons */}
            <div className="flex gap-3">
              <button
                onClick={onSetStart}
                disabled={!selectedGraphNode}
                className="flex-1 h-[50px] rounded-[25px] border-2 border-[#2563EB] text-[#2563EB] text-[14px] font-bold tracking-[1px] disabled:opacity-40 transition-opacity"
              >
                Set as Start
              </button>
              <button
                onClick={onSetEnd}
                disabled={!selectedGraphNode}
                className="flex-1 h-[50px] rounded-[25px] bg-[#2563EB] text-white text-[14px] font-bold tracking-[1px] disabled:opacity-40 transition-opacity"
              >
                Set as End
              </button>
            </div>
          </div>
        )}

        {/* Expanded state: full tabs */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            {/* Tab bar */}
            <div className="flex border-b border-gray-200">
              {(['navigation', 'floors', 'display'] as DrawerTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold tracking-wide transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                      : 'text-gray-400 hover:text-gray-600'
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
                  {!hasActiveNavigation && !selectedGraphNode && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Tap a node on the map, then tap Set as Start or Set as End
                    </p>
                  )}
                  {selectedGraphNode && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-2">
                      <p className="text-xs text-[#2563EB] font-semibold mb-1">SELECTED NODE</p>
                      <p className="text-sm font-bold text-[#1e2022]">{nodeName}</p>
                      <p className="text-xs text-[#77838f]">{nodeAddress}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={onSetStart}
                          className="flex-1 py-2 rounded-[20px] border-2 border-[#2563EB] text-[#2563EB] text-xs font-bold"
                        >
                          Set as Start
                        </button>
                        <button
                          onClick={onSetEnd}
                          className="flex-1 py-2 rounded-[20px] bg-[#2563EB] text-white text-xs font-bold"
                        >
                          Set as End
                        </button>
                      </div>
                    </div>
                  )}
                  {startPoint && (
                    <div className="flex items-center justify-between bg-red-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs text-red-500 font-bold">START</p>
                        <p className="text-sm font-semibold text-[#1e2022]">{startPoint.label}</p>
                        {startPoint.floor !== undefined && (
                          <p className="text-xs text-gray-400">Floor {startPoint.floor}</p>
                        )}
                      </div>
                      <button onClick={onStartPointClear} className="text-red-400 text-xl">×</button>
                    </div>
                  )}
                  {destinationPoint && (
                    <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs text-green-500 font-bold">DESTINATION</p>
                        <p className="text-sm font-semibold text-[#1e2022]">{destinationPoint.label}</p>
                        {destinationPoint.floor !== undefined && (
                          <p className="text-xs text-gray-400">Floor {destinationPoint.floor}</p>
                        )}
                      </div>
                      <button onClick={onDestinationPointClear} className="text-green-400 text-xl">×</button>
                    </div>
                  )}
                  {currentRoute?.success && (
                    <div className="bg-yellow-50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-600 font-bold">ROUTE FOUND</p>
                        <p className="text-sm text-[#1e2022]">
                          {currentRoute.totalDistance.toFixed(1)} units · {currentRoute.path.length} waypoints
                        </p>
                      </div>
                      <button
                        onClick={onClearRoute}
                        className="text-xs bg-red-500 text-white px-3 py-1 rounded-full"
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
                  <p className="text-xs text-gray-500 mb-3">Select a floor to view</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableFloors.map(floor => (
                      <button
                        key={floor}
                        onClick={() => onFloorChange?.(floor)}
                        className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                          floor === currentFloor
                            ? 'bg-[#2563EB] text-white'
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
                <div className="space-y-3">
                  {[
                    {label: 'Path Nodes', value: showPathNodes, onChange: onShowPathNodesChange},
                    {label: 'Room Nodes', value: showRoomNodes, onChange: onShowRoomNodesChange},
                    {label: 'Path Edges', value: showPathEdges, onChange: onShowPathEdgesChange},
                    {label: 'Room Connections', value: showRoomConnections, onChange: onShowRoomConnectionsChange},
                    {label: 'Route', value: showRoute, onChange: onShowRouteChange},
                  ].map(({label, value, onChange}) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-[#1e2022] font-medium">{label}</span>
                      <button
                        onClick={() => onChange?.(!value)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          value ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main MobileMapView ───────────────────────────────────────────────────────

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
                                                              onSetStartFromSelected,
                                                              onSetEndFromSelected,
                                                            }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const scalePosition = graphToMapCoords;

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
      const rect = container.getBoundingClientRect();
      setViewport(prev => ({...prev, width: rect.width, height: rect.height}));
    }
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setViewport(prev => ({...prev, width: rect.width, height: rect.height}));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterByFloor = <T extends {floor?: number}>(items: T[]) =>
    items.filter(item => item.floor === currentFloor);

  const currentFloorGraphNodes = graphNodes.filter(
    n => n.position.floorNum === currentFloor,
  );
  const currentFloorRooms = filterByFloor(rooms);
  const buildingsWithCurrentFloorContent = initialBuildings.filter(building => {
    const hasRooms = currentFloorRooms.some(r => r.buildingId === building.id);
    const hasFloor = building.floors?.includes(currentFloor);
    return hasRooms || hasFloor || currentFloor === 1;
  });

  const isStartOnFloor = !startPoint?.floor || startPoint.floor === currentFloor;
  const isDestOnFloor = !destinationPoint?.floor || destinationPoint.floor === currentFloor;

  // Resolve the currently selected graph node (for the bottom sheet)
  const selectedGraphNode = selectedGraphNodeId
    ? graphNodes.find(n => n.id === selectedGraphNodeId) ?? null
    : null;

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-200 relative overflow-hidden">
      {/* ── Live Map Canvas ── */}
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
          contentStyle={{width: WORLD_WIDTH, height: WORLD_HEIGHT, position: 'relative'}}
        >
          {/* Tile layer */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0,
              width: WORLD_WIDTH, height: WORLD_HEIGHT,
              zIndex: 0, pointerEvents: 'none',
            }}
          >
            <TileSystem tileSize={8192} className="tile-background" viewport={viewport} />
          </div>

          {/* SVG layer */}
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
              const buildingRooms = currentFloorRooms.filter(r => r.buildingId === building.id);
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
                    x={building.x} y={building.y}
                    width={building.width} height={building.height}
                    fill={isFocused ? '#3b82f6' : '#0ea5e9'}
                    stroke={isFocused ? '#2563eb' : '#000000'}
                    strokeWidth={isFocused ? 3 : 2}
                    rx={6} ry={6} opacity={0.8}
                  />
                  {buildingRooms.map((room, ri) => (
                    <RoomTile
                      key={ri}
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
                scalePosition={scalePosition}
                totalDistance={currentRoute.totalDistance}
                currentFloor={currentFloor}
              />
            )}

            {startPoint && isStartOnFloor && (
              <StartMarker
                x={startPoint.x} y={startPoint.y}
                label={startPoint.label} isAnimated
                onClick={onStartPointClear}
              />
            )}

            {destinationPoint && isDestOnFloor && (
              <DestinationMarker
                x={destinationPoint.x} y={destinationPoint.y}
                label={destinationPoint.label} isAnimated
                onClick={onDestinationPointClear}
              />
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* ── Figma Header (overlaid on top of map) ── */}
      <FigmaHeader />

      {/* ── Floor pills (below header) ── */}
      <div className="absolute top-[72px] left-3 right-3 flex gap-1 z-20 pointer-events-none">
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow pointer-events-auto">
          {availableFloors.map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange?.(floor)}
              className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors ${
                floor === currentFloor
                  ? 'bg-[#2563EB] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>

      {/* ── Off-floor warnings ── */}
      {startPoint && !isStartOnFloor && (
        <div className="absolute top-[112px] left-3 right-3 bg-red-50 border border-red-200 p-2 rounded-lg shadow text-xs z-20">
          <span className="text-red-700 font-medium">Start</span>
          <span className="text-red-600"> is on Floor {startPoint.floor} — </span>
          <button onClick={() => startPoint.floor && onFloorChange?.(startPoint.floor)} className="text-red-600 underline">
            Go there
          </button>
        </div>
      )}
      {destinationPoint && !isDestOnFloor && (
        <div className="absolute top-[112px] left-3 right-3 bg-green-50 border border-green-200 p-2 rounded-lg shadow text-xs z-20">
          <span className="text-green-700 font-medium">Destination</span>
          <span className="text-green-600"> is on Floor {destinationPoint.floor} — </span>
          <button onClick={() => destinationPoint.floor && onFloorChange?.(destinationPoint.floor)} className="text-green-600 underline">
            Go there
          </button>
        </div>
      )}

      {/* ── Figma Bottom Sheet ── */}
      <FigmaBottomSheet
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
        onSetStart={() => onSetStartFromSelected?.()}
        onSetEnd={() => onSetEndFromSelected?.()}
        onStartPointClear={onStartPointClear}
        onDestinationPointClear={onDestinationPointClear}
        onClearRoute={onClearRoute}
        onFloorChange={onFloorChange}
        onShowPathNodesChange={onShowPathNodesChange}
        onShowRoomNodesChange={onShowRoomNodesChange}
        onShowPathEdgesChange={onShowPathEdgesChange}
        onShowRoomConnectionsChange={onShowRoomConnectionsChange}
        onShowRouteChange={onShowRouteChange}
      />
    </div>
  );
};
