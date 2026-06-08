/**
 * GraphOverlay.tsx
 *
 * Defines the `GraphNode` shape used throughout the map/routing layer
 * and renders the raw graph (nodes and connecting edges) on top of the
 * tiled map for debugging — converting stored `position` units into
 * on-screen pixels via `scalePosition` (derived from `graph.json`'s
 * `calibration.unitsPerPixel`).
 */

import React from 'react';

export interface GraphNode {
  id: number;
  kind: 'path' | 'room';
  position: {
    x: number;
    y: number;
    floorNum: number;
  };
  neighbors: Array<{
    to: number;
    distance: number;
  }>;
  features?: number[];
  roomNumber?: string;
}

interface GraphOverlayProps {
  nodes: GraphNode[];
  worldWidth: number;
  worldHeight: number;
  showDebugInfo?: boolean;
  selectedNodeId?: number | null;
  showPathNodes?: boolean;
  showPathEdges?: boolean;
  showRoomConnections?: boolean;
  showRoomNodes?: boolean;
  currentFloor: number;
  onNodeClick?: (nodeId: number) => void;
}

const SCALE_FACTOR = 1 / 0.1445603396126786;

const GraphOverlayComponent: React.FC<GraphOverlayProps> = ({
  nodes, //eslint-disable-next-line @typescript-eslint/no-unused-vars
  worldWidth, //eslint-disable-next-line @typescript-eslint/no-unused-vars
  worldHeight,
  showDebugInfo = false,
  selectedNodeId = null,
  showPathNodes = true,
  showPathEdges = true,
  showRoomConnections = true,
  showRoomNodes = true,
  currentFloor,
  onNodeClick,
}) => {
  // Convert graph coordinates to map coordinates
  const scalePosition = (pos: {x: number; y: number}) => ({
    x: pos.x * SCALE_FACTOR,
    y: pos.y * SCALE_FACTOR,
  });

  const handleNodeClick = (nodeId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNodeClick?.(nodeId);
  };

  const nodeById = React.useMemo(() => {
    const map = new Map<number, GraphNode>();
    for (const node of nodes) map.set(node.id, node);
    return map;
  }, [nodes]);

  // Filter nodes based on visibility settings and current floor
  const visibleNodes = React.useMemo(
    () =>
      nodes.filter(node => {
        if (node.position.floorNum !== currentFloor) return false;
        if (node.kind === 'path' && !showPathNodes) return false;
        if (node.kind === 'room' && !showRoomNodes) return false;
        return true;
      }),
    [nodes, currentFloor, showPathNodes, showRoomNodes],
  );

  const visibleNodeIds = React.useMemo(
    () => new Set(visibleNodes.map(node => node.id)),
    [visibleNodes],
  );

  const crossFloorNodeIds = React.useMemo(() => {
    const ids = new Set<number>();
    for (const node of nodes) {
      const crossesFloor = node.neighbors.some(neighbor => {
        const neighborNode = nodeById.get(neighbor.to);
        return (
          neighborNode &&
          neighborNode.position.floorNum !== node.position.floorNum
        );
      });
      if (crossesFloor) ids.add(node.id);
    }
    return ids;
  }, [nodes, nodeById]);

  // Check if an edge should be visible based on its endpoints and connection type
  const isEdgeVisible = (sourceNode: GraphNode, targetNode: GraphNode) => {
    // Only show edges where both nodes are on the current floor
    if (
      sourceNode.position.floorNum !== currentFloor ||
      targetNode.position.floorNum !== currentFloor
    ) {
      return false;
    }

    // If either node is not visible due to settings, don't show the edge
    if (
      !visibleNodeIds.has(sourceNode.id) ||
      !visibleNodeIds.has(targetNode.id)
    ) {
      return false;
    }

    const isPathToPath =
      sourceNode.kind === 'path' && targetNode.kind === 'path';
    const isRoomConnection =
      sourceNode.kind === 'room' || targetNode.kind === 'room';

    if (isPathToPath && !showPathEdges) return false;
    if (isRoomConnection && !showRoomConnections) return false;

    return true;
  };

  const hasCrossFloorConnection = (node: GraphNode) =>
    crossFloorNodeIds.has(node.id);

  return (
    <g style={{zIndex: 3}}>
      {/* Define gradients for glow effects */}
      <defs>
        <radialGradient id="roomGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#dc2626" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="crossFloorGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Render edges first (so they appear behind nodes) */}
      {visibleNodes.map(node => {
        const nodePos = scalePosition(node.position);

        return node.neighbors.map(neighbor => {
          const neighborNode = nodeById.get(neighbor.to);
          if (!neighborNode) return null;

          // Check if this edge should be visible
          if (!isEdgeVisible(node, neighborNode)) return null;

          const neighborPos = scalePosition(neighborNode.position);

          const isPathToPath =
            node.kind === 'path' && neighborNode.kind === 'path';
          // eslint-disable-next-line
          const isRoomConnection =
            node.kind === 'room' || neighborNode.kind === 'room';

          return (
            <line
              key={`edge-${node.id}-${neighbor.to}`}
              x1={nodePos.x}
              y1={nodePos.y}
              x2={neighborPos.x}
              y2={neighborPos.y}
              stroke={showDebugInfo ? '#ec4899' : '#4f46e5'}
              strokeWidth={showDebugInfo ? 3 : 2}
              opacity={showDebugInfo ? 0.8 : 0.6}
              strokeDasharray={isPathToPath ? 'none' : '4,4'}
              style={{
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
          );
        });
      })}

      {/* Render nodes */}
      {visibleNodes.map(node => {
        const nodePos = scalePosition(node.position);
        const isRoom = node.kind === 'room';
        const isSelected = selectedNodeId === node.id;
        const hasCrossFloor = hasCrossFloorConnection(node);

        return (
          <g key={`node-${node.id}`}>
            {/* Selection highlight - different for rooms vs path nodes */}
            {isSelected && (
              <>
                {isRoom ? (
                  // Glow effect for room nodes
                  <>
                    {/* Outer glow rings */}
                    <circle
                      cx={nodePos.x}
                      cy={nodePos.y}
                      r={20}
                      fill="url(#roomGlow)"
                    >
                      <animate
                        attributeName="r"
                        values="20;25;20"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0.3;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={nodePos.x}
                      cy={nodePos.y}
                      r={15}
                      fill="url(#roomGlow)"
                    >
                      <animate
                        attributeName="r"
                        values="15;20;15"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0.4;0.8"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                ) : (
                  // Keep dashed circle for path nodes
                  <circle
                    cx={nodePos.x}
                    cy={nodePos.y}
                    r={16}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={4}
                    opacity={0.6}
                    strokeDasharray="6,4"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="0;10"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </>
            )}

            {/* Cross-floor connection indicator */}
            {hasCrossFloor && !isSelected && (
              <circle
                cx={nodePos.x}
                cy={nodePos.y}
                r={12}
                fill="url(#crossFloorGlow)"
                opacity={0.6}
              >
                <animate
                  attributeName="r"
                  values="12;16;12"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.3;0.6"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Node circle */}
            <circle
              cx={nodePos.x}
              cy={nodePos.y}
              r={isRoom ? (showDebugInfo ? 10 : 8) : showDebugInfo ? 8 : 6}
              fill={
                hasCrossFloor && !isSelected
                  ? '#f59e0b' // amber for cross-floor connections
                  : isRoom
                    ? showDebugInfo
                      ? '#dc2626'
                      : '#ef4444'
                    : showDebugInfo
                      ? '#1d4ed8'
                      : '#3b82f6'
              }
              stroke={
                isSelected
                  ? isRoom
                    ? '#dc2626'
                    : '#1d4ed8'
                  : hasCrossFloor
                    ? '#f59e0b'
                    : isRoom
                      ? '#dc2626'
                      : '#1d4ed8'
              }
              strokeWidth={isSelected ? 3 : showDebugInfo ? 3 : 2}
              opacity={isSelected ? 1.0 : showDebugInfo ? 1.0 : 0.8}
              style={{
                cursor: 'pointer',
                filter: isSelected
                  ? 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6))'
                  : showDebugInfo
                    ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
                    : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={e => handleNodeClick(node.id, e)}
            />

            {/* Node label */}
            <text
              x={nodePos.x}
              y={nodePos.y - (showDebugInfo ? 15 : 12)}
              textAnchor="middle"
              fontSize={showDebugInfo ? 12 : 10}
              fontWeight={
                isSelected ? 'bold' : showDebugInfo ? 'bold' : 'normal'
              }
              fill={
                isSelected ? '#000000' : showDebugInfo ? '#000000' : '#1f2937'
              }
              style={{
                textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                pointerEvents: 'none',
              }}
            >
              {isRoom && node.roomNumber ? node.roomNumber : `N${node.id}`}
            </text>

            {/* Floor indicator for cross-floor connections */}
            {hasCrossFloor && (
              <text
                x={nodePos.x + 12}
                y={nodePos.y - 8}
                textAnchor="start"
                fontSize={8}
                fontWeight="bold"
                fill="#f59e0b"
                style={{
                  textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                  pointerEvents: 'none',
                }}
              >
                ↕
              </text>
            )}

            {/* Debug: Show node ID, coordinates and floor */}
            {showDebugInfo && (
              <>
                <text
                  x={nodePos.x}
                  y={nodePos.y + 20}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#666666"
                  style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                    pointerEvents: 'none',
                  }}
                >
                  ({node.position.x.toFixed(1)}, {node.position.y.toFixed(1)})
                </text>
                <text
                  x={nodePos.x}
                  y={nodePos.y + 30}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#666666"
                  style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                    pointerEvents: 'none',
                  }}
                >
                  Floor {node.position.floorNum}
                </text>
              </>
            )}

            {/* Distance labels on edges - only show in debug mode or for selected nodes */}
            {(showDebugInfo || isSelected) &&
              node.neighbors.map(neighbor => {
                const neighborNode = nodeById.get(neighbor.to);
                if (!neighborNode) return null;

                // Only show distance label if the edge is visible
                if (!isEdgeVisible(node, neighborNode)) return null;

                const neighborPos = scalePosition(neighborNode.position);
                const midX = (nodePos.x + neighborPos.x) / 2;
                const midY = (nodePos.y + neighborPos.y) / 2;

                return (
                  <text
                    key={`distance-${node.id}-${neighbor.to}`}
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#059669"
                    fontWeight="bold"
                    style={{
                      textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                      pointerEvents: 'none',
                    }}
                  >
                    {neighbor.distance.toFixed(1)}
                  </text>
                );
              })}
          </g>
        );
      })}
    </g>
  );
};

export const GraphOverlay = React.memo(GraphOverlayComponent);
