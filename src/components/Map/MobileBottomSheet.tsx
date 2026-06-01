import React, {useState} from 'react';
import {GraphNode} from './GraphOverlay';
import {PathResult} from './pathfinding';
import {NavigationPoint} from './MapView';

type DrawerTab = 'navigation' | 'floors' | 'display';

interface MobileBottomSheetProps {
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

export function MobileBottomSheet({
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
                                  }: MobileBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('navigation');
  const [isExpanded, setIsExpanded] = useState(false);

  const hasNav = !!(startPoint || destinationPoint);
  const nodeName = selectedGraphNode?.roomNumber ?? (selectedGraphNode ? `Node ${selectedGraphNode.id}` : null);
  const nodeAddress = selectedGraphNode ? `Floor ${selectedGraphNode.position.floorNum} · ${selectedGraphNode.kind}` : null;

  const displayToggles = [
    {label: 'Path Nodes', value: showPathNodes, onChange: onShowPathNodesChange},
    {label: 'Room Nodes', value: showRoomNodes, onChange: onShowRoomNodesChange},
    {label: 'Path Edges', value: showPathEdges, onChange: onShowPathEdgesChange},
    {label: 'Room Connections', value: showRoomConnections, onChange: onShowRoomConnectionsChange},
    {label: 'Route', value: showRoute, onChange: onShowRouteChange},
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div className="bg-white rounded-tl-[25px] rounded-tr-[25px] shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.10)] overflow-hidden">
        <button
          onClick={() => setIsExpanded(p => !p)}
          className="w-full flex flex-col items-center pt-3 pb-1"
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </button>

        {!isExpanded && (
          <div className="px-4 pb-6">
            <p className="text-[18px] font-bold text-[#1e2022] text-center tracking-[0.5px] mb-1">
              {nodeName ?? (hasNav ? 'Navigation active' : 'Select a node')}
            </p>
            <p className="text-[14px] text-[#77838f] text-center tracking-[0.5px] mb-4">
              {nodeAddress ?? (hasNav
                ? `${startPoint ? `From: ${startPoint.label}` : ''}${startPoint && destinationPoint ? ' → ' : ''}${destinationPoint ? `To: ${destinationPoint.label}` : ''}`
                : 'Tap a node on the map')}
            </p>
            {currentRoute?.success && (
              <div className="flex justify-center mb-4">
                <div className="bg-[#2563EB] rounded-full px-4 py-1 text-white text-sm font-semibold">
                  📍 {currentRoute.totalDistance.toFixed(1)} units · {currentRoute.path.length} waypoints
                </div>
              </div>
            )}
            {currentRoute && !currentRoute.success && hasNav && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full px-4 py-1 text-red-700 text-sm font-semibold">No route found</div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onSetStart} disabled={!selectedGraphNode} className="flex-1 h-[50px] rounded-[25px] border-2 border-[#2563EB] text-[#2563EB] text-[14px] font-bold tracking-[1px] disabled:opacity-40 transition-opacity">
                Set as Start
              </button>
              <button onClick={onSetEnd} disabled={!selectedGraphNode} className="flex-1 h-[50px] rounded-[25px] bg-[#2563EB] text-white text-[14px] font-bold tracking-[1px] disabled:opacity-40 transition-opacity">
                Set as End
              </button>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            <div className="flex border-b border-gray-200">
              {(['navigation', 'floors', 'display'] as DrawerTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold tracking-wide transition-colors ${activeTab === tab ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab === 'navigation' ? '🧭 Nav' : tab === 'floors' ? '🏢 Floors' : '🎨 Display'}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'navigation' && (
                <div className="space-y-3">
                  {!hasNav && !selectedGraphNode && (
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
                        <button onClick={onSetStart} className="flex-1 py-2 rounded-[20px] border-2 border-[#2563EB] text-[#2563EB] text-xs font-bold">Set as Start</button>
                        <button onClick={onSetEnd} className="flex-1 py-2 rounded-[20px] bg-[#2563EB] text-white text-xs font-bold">Set as End</button>
                      </div>
                    </div>
                  )}
                  {startPoint && (
                    <div className="flex items-center justify-between bg-red-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs text-red-500 font-bold">START</p>
                        <p className="text-sm font-semibold text-[#1e2022]">{startPoint.label}</p>
                        {startPoint.floor !== undefined && <p className="text-xs text-gray-400">Floor {startPoint.floor}</p>}
                      </div>
                      <button onClick={onStartPointClear} className="text-red-400 text-xl">×</button>
                    </div>
                  )}
                  {destinationPoint && (
                    <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs text-green-500 font-bold">DESTINATION</p>
                        <p className="text-sm font-semibold text-[#1e2022]">{destinationPoint.label}</p>
                        {destinationPoint.floor !== undefined && <p className="text-xs text-gray-400">Floor {destinationPoint.floor}</p>}
                      </div>
                      <button onClick={onDestinationPointClear} className="text-green-400 text-xl">×</button>
                    </div>
                  )}
                  {currentRoute?.success && (
                    <div className="bg-yellow-50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-600 font-bold">ROUTE FOUND</p>
                        <p className="text-sm text-[#1e2022]">{currentRoute.totalDistance.toFixed(1)} units · {currentRoute.path.length} waypoints</p>
                      </div>
                      <button onClick={onClearRoute} className="text-xs bg-red-500 text-white px-3 py-1 rounded-full">Clear</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'floors' && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">Select a floor to view</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableFloors.map(floor => (
                      <button
                        key={floor}
                        onClick={() => onFloorChange?.(floor)}
                        className={`py-2 rounded-xl text-sm font-semibold transition-colors ${floor === currentFloor ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {floor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'display' && (
                <div className="space-y-3">
                  {displayToggles.map(({label, value, onChange}) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-[#1e2022] font-medium">{label}</span>
                      <button
                        onClick={() => onChange?.(!value)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-[#2563EB]' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
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
