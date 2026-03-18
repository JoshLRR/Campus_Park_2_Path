import React from 'react';
import {GraphNode} from './GraphOverlay';

interface RouteOverlayProps {
  nodes: GraphNode[];
  routePath: number[];
  scalePosition: (pos: {x: number; y: number}) => {x: number; y: number};
  totalDistance?: number;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = ({
  nodes,
  routePath,
  scalePosition,
  totalDistance = 0,
}) => {
  if (routePath.length < 2) return null;

  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // Create path segments following the actual graph edges
  const pathSegments = [];
  for (let i = 0; i < routePath.length - 1; i++) {
    const currentNode = nodeMap.get(routePath[i]);
    const nextNode = nodeMap.get(routePath[i + 1]);

    if (currentNode && nextNode) {
      // Verify that there's actually an edge between these nodes
      const edgeExists = currentNode.neighbors.some(
        neighbor => neighbor.to === nextNode.id,
      );

      if (edgeExists) {
        const startPos = scalePosition(currentNode.position);
        const endPos = scalePosition(nextNode.position);

        pathSegments.push({
          start: startPos,
          end: endPos,
          index: i,
          startNode: currentNode,
          endNode: nextNode,
        });
      } else {
        console.warn(
          `No edge found between nodes ${currentNode.id} and ${nextNode.id}`,
        );
      }
    }
  }

  if (pathSegments.length === 0) return null;

  // Create a single continuous path string for smooth animation
  const createPathString = () => {
    if (pathSegments.length === 0) return '';

    let pathString = `M ${pathSegments[0].start.x} ${pathSegments[0].start.y}`;

    for (const segment of pathSegments) {
      pathString += ` L ${segment.end.x} ${segment.end.y}`;
    }

    return pathString;
  };

  const pathString = createPathString();

  return (
    <g style={{zIndex: 15}}>
      {/* Single continuous route path for smooth animation */}
      <g>
        {/* Background path (wider, darker) for better visibility */}
        <path
          d={pathString}
          fill="none"
          stroke="#1f2937"
          strokeWidth={10}
          opacity={0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main route path with smooth flowing animation */}
        <path
          d={pathString}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={6}
          opacity={1.0}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="15,10"
        >
          {/* Smooth continuous animation across entire path */}
          <animate
            attributeName="stroke-dashoffset"
            values="25;0;-25"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Route waypoint indicators */}
      {routePath.map((nodeId, index) => {
        const node = nodeMap.get(nodeId);
        if (!node) return null;

        const pos = scalePosition(node.position);
        const isStart = index === 0;
        const isEnd = index === routePath.length - 1;
        const isKeyWaypoint =
          isStart || isEnd || (index % 5 === 0 && index > 0); // Show every 5th waypoint

        // Only show start, end, and key waypoints to avoid clutter
        if (!isKeyWaypoint) return null;

        return (
          <g key={`route-waypoint-${nodeId}`}>
            {/* Waypoint circle with glow effect */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isStart || isEnd ? 16 : 8}
              fill={isStart ? '#ef4444' : isEnd ? '#22c55e' : '#fbbf24'}
              stroke={isStart ? '#dc2626' : isEnd ? '#16a34a' : '#f59e0b'}
              strokeWidth={3}
              opacity={1.0}
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
              }}
            >
              {/* Pulsing animation for start and end points */}
              {(isStart || isEnd) && (
                <animate
                  attributeName="r"
                  values={`${isStart || isEnd ? 16 : 8};${isStart || isEnd ? 20 : 12};${isStart || isEnd ? 16 : 8}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Start/End labels */}
            {(isStart || isEnd) && (
              <>
                <text
                  x={pos.x}
                  y={pos.y + (isStart ? -25 : -25)}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill={isStart ? '#dc2626' : '#16a34a'}
                  style={{
                    textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
                    pointerEvents: 'none',
                  }}
                >
                  {isStart ? 'START' : 'DESTINATION'}
                </text>

                {/* Node type indicator */}
                <text
                  x={pos.x}
                  y={pos.y + (isStart ? -12 : -12)}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isStart ? '#dc2626' : '#16a34a'}
                  style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                    pointerEvents: 'none',
                  }}
                >
                  {node.roomNumber || `${node.kind} node`}
                </text>
              </>
            )}

            {/* Step number for intermediate waypoints */}
            {!isStart && !isEnd && (
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fontSize={10}
                fontWeight="bold"
                fill="#1f2937"
                style={{
                  pointerEvents: 'none',
                }}
              >
                {index}
              </text>
            )}
          </g>
        );
      })}

      {/* Distance and route info indicator */}
      {totalDistance > 0 && pathSegments.length > 0 && (
        <g>
          {/* Find middle of route for info display */}
          {(() => {
            const midIndex = Math.floor(pathSegments.length / 2);
            const midSegment = pathSegments[midIndex];
            const midX = (midSegment.start.x + midSegment.end.x) / 2;
            const midY = (midSegment.start.y + midSegment.end.y) / 2;

            return (
              <g>
                {/* Background for route info */}
                <rect
                  x={midX - 45}
                  y={midY - 30}
                  width={90}
                  height={25}
                  fill="rgba(255, 255, 255, 0.95)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  rx={12}
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                  }}
                />

                {/* Distance text */}
                <text
                  x={midX}
                  y={midY - 15}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  fill="#1f2937"
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  {totalDistance.toFixed(1)} units
                </text>

                {/* Route segment count */}
                <text
                  x={midX}
                  y={midY - 5}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#6b7280"
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  {pathSegments.length} segments
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
};
