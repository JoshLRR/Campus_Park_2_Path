
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
  onNodeClick?: (nodeId: number) => void;
}

// Simple scale factor to convert graph coordinates to map coordinates
const SCALE_FACTOR = 10; // Adjust this to fit your map scale

export const GraphOverlay: React.FC<GraphOverlayProps> = ({
                                                            nodes, //eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                            worldWidth, //eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                            worldHeight,
                                                            showDebugInfo = false,
                                                            selectedNodeId = null,
                                                            showPathNodes = true,
                                                            showPathEdges = true,
                                                            showRoomConnections = true,
                                                            showRoomNodes = true,
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

  // Filter nodes based on visibility settings
  const getVisibleNodes = () => {
    return nodes.filter(node => {
      if (node.kind === 'path' && !showPathNodes) return false;
      if (node.kind === 'room' && !showRoomNodes) return false;
      return true;
    });
  };

  const visibleNodes = getVisibleNodes();

  // Check if an edge should be visible based on its endpoints and connection type
  const isEdgeVisible = (sourceNode: GraphNode, targetNode: GraphNode) => {
    // If either node is not visible, don't show the edge
    if (!visibleNodes.includes(sourceNode) || !visibleNodes.includes(targetNode)) {
      return false;
    }

    const isPathToPath = sourceNode.kind === 'path' && targetNode.kind === 'path';
    const isRoomConnection = sourceNode.kind === 'room' || targetNode.kind === 'room';

    if (isPathToPath && !showPathEdges) return false;
    if (isRoomConnection && !showRoomConnections) return false;

    return true;
  };

  return (
    <g style={{zIndex: 3}}>
      {/* Render edges first (so they appear behind nodes) */}
      {visibleNodes.map(node => {
        const nodePos = scalePosition(node.position);

        return node.neighbors.map(neighbor => {
          const neighborNode = nodes.find(n => n.id === neighbor.to);
          if (!neighborNode) return null;

          // Check if this edge should be visible
          if (!isEdgeVisible(node, neighborNode)) return null;

          const neighborPos = scalePosition(neighborNode.position);

          const isPathToPath = node.kind === 'path' && neighborNode.kind === 'path';
          const isRoomConnection = node.kind === 'room' || neighborNode.kind === 'room';

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

        return (
          <g key={`node-${node.id}`}>
            {/* Selection highlight ring */}
            {isSelected && (
              <circle
                cx={nodePos.x}
                cy={nodePos.y}
                r={isRoom ? 18 : 16}
                fill="none"
                stroke={isRoom ? '#dc2626' : '#1d4ed8'}
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

            {/* Node circle */}
            <circle
              cx={nodePos.x}
              cy={nodePos.y}
              r={isRoom ? (showDebugInfo ? 10 : 8) : showDebugInfo ? 8 : 6}
              fill={
                isRoom
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

            {/* Debug: Show node ID and coordinates */}
            {showDebugInfo && (
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
            )}

            {/* Distance labels on edges - only show in debug mode or for selected nodes */}
            {(showDebugInfo || isSelected) &&
              node.neighbors.map(neighbor => {
                const neighborNode = nodes.find(n => n.id === neighbor.to);
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
                    fontSize={showDebugInfo ? 9 : 8}
                    fill={showDebugInfo ? '#000000' : '#6b7280'}
                    fontWeight={showDebugInfo ? 'bold' : 'normal'}
                    style={{
                      textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                      pointerEvents: 'none',
                    }}
                  >
                    {neighbor.distance.toFixed(1)}
                  </text>
                );
              })}

            {/* Debug: Show neighbor count */}
            {showDebugInfo && (
              <text
                x={nodePos.x + 15}
                y={nodePos.y}
                textAnchor="middle"
                fontSize={8}
                fill="#059669"
                fontWeight="bold"
                style={{
                  textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                  pointerEvents: 'none',
                }}
              >
                {node.neighbors.length}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
