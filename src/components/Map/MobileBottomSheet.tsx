import React, {useState} from 'react';
import {GraphNode} from './GraphOverlay';
import {PathResult} from './pathfinding';
import {NavigationPoint} from './MapView';

type DrawerTab = 'navigation' | 'rooms' | 'display';

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
  graphNodes?: GraphNode[];
  onSetStartFromNodeId?: (nodeId: number) => void;
  onSetEndFromNodeId?: (nodeId: number) => void;
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
                                    graphNodes = [],
                                    onSetStartFromNodeId,
                                    onSetEndFromNodeId,
                                  }: MobileBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('navigation');
  const [isExpanded, setIsExpanded] = useState(false);
  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');

  const hasNav = !!(startPoint || destinationPoint);
  const nodeName = selectedGraphNode?.roomNumber ?? (selectedGraphNode ? `Node ${selectedGraphNode.id}` : null);
  const nodeAddress = selectedGraphNode ? `Floor ${selectedGraphNode.position.floorNum} · ${selectedGraphNode.kind}` : null;

  const roomNodes = graphNodes.filter(n => n.kind === 'room' && n.roomNumber);

  const filteredStartNodes = startSearch.trim()
    ? roomNodes.filter(n => n.roomNumber!.toLowerCase().includes(startSearch.toLowerCase()))
    : [];

  const filteredEndNodes = endSearch.trim()
    ? roomNodes.filter(n => n.roomNumber!.toLowerCase().includes(endSearch.toLowerCase()))
    : [];

  const filteredRoomNodes = roomSearch.trim()
    ? roomNodes.filter(n => n.roomNumber!.toLowerCase().includes(roomSearch.toLowerCase()))
    : roomNodes;

  const handleSelectStart = (node: GraphNode) => {
    onSetStartFromNodeId?.(node.id);
    setStartSearch('');
    setStartFocused(false);
  };

  const handleSelectEnd = (node: GraphNode) => {
    onSetEndFromNodeId?.(node.id);
    setEndSearch('');
    setEndFocused(false);
  };

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
            {/* Navigation search inputs */}
            <div className="space-y-2 mb-4">
              {/* Start input */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-3 py-2">
                  <span className="text-red-500 text-xs font-bold flex-shrink-0">FROM</span>
                  {startPoint ? (
                    <span className="flex-1 text-sm font-semibold text-[#1e2022] truncate">{startPoint.label}</span>
                  ) : (
                    <input
                      className="flex-1 text-sm bg-transparent outline-none text-[#1e2022] placeholder-gray-400"
                      placeholder="Search start room…"
                      value={startSearch}
                      onChange={e => setStartSearch(e.target.value)}
                      onFocus={() => setStartFocused(true)}
                      onBlur={() => setTimeout(() => setStartFocused(false), 150)}
                    />
                  )}
                  {startPoint && (
                    <button onClick={onStartPointClear} className="text-red-400 text-lg leading-none flex-shrink-0">×</button>
                  )}
                </div>
                {startFocused && filteredStartNodes.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-2xl shadow-lg border border-gray-100 max-h-40 overflow-y-auto z-50">
                    {filteredStartNodes.slice(0, 8).map(node => (
                      <button
                        key={node.id}
                        onMouseDown={() => handleSelectStart(node)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-[#1e2022]"
                      >
                        <span className="font-semibold">{node.roomNumber}</span>
                        <span className="text-gray-400 text-xs ml-2">Floor {node.position.floorNum}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* End input */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-3 py-2">
                  <span className="text-green-600 text-xs font-bold flex-shrink-0">TO</span>
                  {destinationPoint ? (
                    <span className="flex-1 text-sm font-semibold text-[#1e2022] truncate">{destinationPoint.label}</span>
                  ) : (
                    <input
                      className="flex-1 text-sm bg-transparent outline-none text-[#1e2022] placeholder-gray-400"
                      placeholder="Search destination room…"
                      value={endSearch}
                      onChange={e => setEndSearch(e.target.value)}
                      onFocus={() => setEndFocused(true)}
                      onBlur={() => setTimeout(() => setEndFocused(false), 150)}
                    />
                  )}
                  {destinationPoint && (
                    <button onClick={onDestinationPointClear} className="text-green-500 text-lg leading-none flex-shrink-0">×</button>
                  )}
                </div>
                {endFocused && filteredEndNodes.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-2xl shadow-lg border border-gray-100 max-h-40 overflow-y-auto z-50">
                    {filteredEndNodes.slice(0, 8).map(node => (
                      <button
                        key={node.id}
                        onMouseDown={() => handleSelectEnd(node)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-[#1e2022]"
                      >
                        <span className="font-semibold">{node.roomNumber}</span>
                        <span className="text-gray-400 text-xs ml-2">Floor {node.position.floorNum}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Route status */}
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

            {/* Selected node quick-set buttons */}
            {selectedGraphNode && (
              <div className="flex gap-3">
                <button onClick={onSetStart} className="flex-1 h-[50px] rounded-[25px] border-2 border-[#2563EB] text-[#2563EB] text-[14px] font-bold tracking-[1px] transition-opacity">
                  Set as Start
                </button>
                <button onClick={onSetEnd} className="flex-1 h-[50px] rounded-[25px] bg-[#2563EB] text-white text-[14px] font-bold tracking-[1px] transition-opacity">
                  Set as End
                </button>
              </div>
            )}
            {!selectedGraphNode && (
              <p className="text-xs text-center text-gray-400">
                {nodeName ? '' : 'Search above or tap a node on the map'}
              </p>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            <div className="flex border-b border-gray-200">
              {(['navigation', 'rooms', 'display'] as DrawerTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold tracking-wide transition-colors ${activeTab === tab ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab === 'navigation' ? '🧭 Nav' : tab === 'rooms' ? '🚪 Rooms' : '🎨 Display'}
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

              {activeTab === 'rooms' && (
                <div>
                  <div className="relative mb-3">
                    <input
                      className="w-full text-sm bg-gray-100 rounded-xl px-3 py-2 outline-none text-[#1e2022] placeholder-gray-400"
                      placeholder="Search rooms…"
                      value={roomSearch}
                      onChange={e => setRoomSearch(e.target.value)}
                    />
                    {roomSearch && (
                      <button
                        onClick={() => setRoomSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {filteredRoomNodes.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">No rooms found</p>
                    )}
                    {filteredRoomNodes.map(node => (
                      <div key={node.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-[#1e2022]">{node.roomNumber}</p>
                          <p className="text-xs text-gray-400">Floor {node.position.floorNum}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onSetStartFromNodeId?.(node.id)}
                            className="text-xs px-2 py-1 rounded-lg border border-[#2563EB] text-[#2563EB] font-semibold"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => onSetEndFromNodeId?.(node.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-[#2563EB] text-white font-semibold"
                          >
                            End
                          </button>
                        </div>
                      </div>
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
