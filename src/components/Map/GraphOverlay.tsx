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
  onNodeClick?: (nodeId: number) => void;
}

// Simple scale factor to convert graph coordinates to map coordinates
const SCALE_FACTOR = 10; // Adjust this to fit your map scale

export const GraphOverlay: React.FC<GraphOverlayProps> = ({
                                                            nodes,
                                                            worldWidth,
                                                            worldHeight,
                                                            showDebugInfo = false,
                                                            selectedNodeId = null,
                                                            onNodeClick,
                                                          }) => {
  // Convert graph coordinates to map coordinates
  const scalePosition = (pos: { x: number; y: number }) => ({
    x: pos.x * SCALE_FACTOR,
    y: pos.y * SCALE_FACTOR,
  });

  const handleNodeClick = (nodeId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNodeClick?.(nodeId);
  };

  return (
    <g style={{ zIndex: 3 }}>
      {/* Render edges first (so they appear behind nodes) */}
      {nodes.map(node => {
        const nodePos = scalePosition(node.position);

        return node.neighbors.map(neighbor => {
          const neighborNode = nodes.find(n => n.id === neighbor.to);
          if (!neighborNode) return null;

          const neighborPos = scalePosition(neighborNode.position);

          return (
            <line
              key={`edge-${node.id}-${neighbor.to}`}
              x1={nodePos.x}
              y1={nodePos.y}
              x2={neighborPos.x}
              y2={neighborPos.y}
              stroke={showDebugInfo ? "#ec4899" : "#4f46e5"}
              strokeWidth={showDebugInfo ? 3 : 2}
              opacity={showDebugInfo ? 0.8 : 0.6}
              strokeDasharray={node.kind === 'path' && neighborNode.kind === 'path' ? "none" : "4,4"}
            />
          );
        });
      })}

      {/* Render nodes */}
      {nodes.map(node => {
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
              r={isRoom ? (showDebugInfo ? 10 : 8) : (showDebugInfo ? 8 : 6)}
              fill={isRoom ? (showDebugInfo ? '#dc2626' : '#ef4444') : (showDebugInfo ? '#1d4ed8' : '#3b82f6')}
              stroke={isSelected ? (isRoom ? '#dc2626' : '#1d4ed8') : (isRoom ? '#dc2626' : '#1d4ed8')}
              strokeWidth={isSelected ? 3 : (showDebugInfo ? 3 : 2)}
              opacity={isSelected ? 1.0 : (showDebugInfo ? 1.0 : 0.8)}
              style={{
                cursor: 'pointer',
                filter: isSelected
                  ? 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6))'
                  : showDebugInfo
                    ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
                    : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseOver={(e) => {
                const target = e.target as SVGCircleElement;
                target.style.transform = 'scale(1.2)';
                target.style.transformOrigin = `${nodePos.x}px ${nodePos.y}px`;
              }}
              onMouseOut={(e) => {
                const target = e.target as SVGCircleElement;
                target.style.transform = 'scale(1)';
              }}
            />

            {/* Node label */}
            <text
              x={nodePos.x}
              y={nodePos.y - (showDebugInfo ? 15 : 12)}
              textAnchor="middle"
              fontSize={showDebugInfo ? 12 : 10}
              fontWeight={isSelected ? "bold" : (showDebugInfo ? "bold" : "normal")}
              fill={isSelected ? "#000000" : (showDebugInfo ? "#000000" : "#1f2937")}
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
            {(showDebugInfo || isSelected) && node.neighbors.map(neighbor => {
              const neighborNode = nodes.find(n => n.id === neighbor.to);
              if (!neighborNode) return null;

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
                  fill={showDebugInfo ? "#000000" : "#6b7280"}
                  fontWeight={showDebugInfo ? "bold" : "normal"}
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

            {/* Selection indicator text */}
            {isSelected && (
              <text
                x={nodePos.x}
                y={nodePos.y + (showDebugInfo ? 35 : 25)}
                textAnchor="middle"
                fontSize={10}
                fill={isRoom ? "#dc2626" : "#1d4ed8"}
                fontWeight="bold"
                style={{
                  textShadow: '1px 1px 3px rgba(255,255,255,0.9)',
                  pointerEvents: 'none',
                }}
              >
                SELECTED
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
