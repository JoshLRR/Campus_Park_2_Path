import React from 'react';
import {GraphNode} from './GraphOverlay';

interface RouteOverlayProps {
  nodes: GraphNode[];
  routePath: number[];
  scalePosition: (pos: {x: number; y: number}) => {x: number; y: number};
  totalDistance?: number;
  currentFloor: number;
}

interface RouteSegment {
  start: {x: number; y: number};
  end: {x: number; y: number};
  index: number;
  startNode: GraphNode;
  endNode: GraphNode;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = ({
  nodes,
  routePath,
  scalePosition,
  totalDistance = 0,
  currentFloor,
}) => {
  if (routePath.length < 2) return null;

  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // Filter route path to only include segments on current floor
  const currentFloorSegments: RouteSegment[] = [];
  for (let i = 0; i < routePath.length - 1; i++) {
    const currentNode = nodeMap.get(routePath[i]);
    const nextNode = nodeMap.get(routePath[i + 1]);

    if (currentNode && nextNode) {
      // Only include segments where both nodes are on current floor
      if (
        currentNode.position.floorNum === currentFloor &&
        nextNode.position.floorNum === currentFloor
      ) {
        // Verify that there's actually an edge between these nodes
        const edgeExists = currentNode.neighbors.some(
          neighbor => neighbor.to === nextNode.id,
        );

        if (edgeExists) {
          // Use positions directly without scaling
          const startPos = {x: currentNode.position.x, y: currentNode.position.y};
          const endPos = {x: nextNode.position.x, y: nextNode.position.y};

          currentFloorSegments.push({
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
  }

  if (currentFloorSegments.length === 0) {
    // Show message if route exists but not on current floor
    const hasRouteOnOtherFloors = routePath.some(nodeId => {
      const node = nodeMap.get(nodeId);
      return node && node.position.floorNum !== currentFloor;
    });

    if (hasRouteOnOtherFloors) {
      return (
        <g style={{zIndex: 15}}>
          <text
            x={1250} // Center of map
            y={200}
            textAnchor="middle"
            fontSize={14}
            fontWeight="bold"
            fill="#f59e0b"
            style={{
              textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
              pointerEvents: 'none',
            }}
          >
            Route continues on other floors
          </text>
          <text
            x={1250}
            y={220}
            textAnchor="middle"
            fontSize={12}
            fill="#6b7280"
            style={{
              textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
              pointerEvents: 'none',
            }}
          >
            Use floor selector to see full route
          </text>
        </g>
      );
    }

    return null;
  }

  // Create a single continuous path string for smooth animation
  const createPathString = () => {
    if (currentFloorSegments.length === 0) return '';

    let pathString = `M ${currentFloorSegments[0].start.x} ${currentFloorSegments[0].start.y}`;

    for (const segment of currentFloorSegments) {
      pathString += ` L ${segment.end.x} ${segment.end.y}`;
    }

    return pathString;
  };

  const pathString = createPathString();

  // Get nodes that are on current floor for waypoint display
  const currentFloorRouteNodes = routePath
    .map(nodeId => nodeMap.get(nodeId))
    .filter(
      (node): node is GraphNode =>
        node !== undefined && node.position.floorNum === currentFloor,
    );

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

      {/* Route waypoint indicators - only for nodes on current floor */}
      {currentFloorRouteNodes.map((node, index) => {
        // Use position directly
        const pos = {x: node.position.x, y: node.position.y};
        const originalIndex = routePath.indexOf(node.id);
        const isStart = originalIndex === 0;
        const isEnd = originalIndex === routePath.length - 1;
        const isKeyWaypoint =
          isStart || isEnd || (index % 3 === 0 && index > 0);

        if (!isKeyWaypoint) return null;

        return (
          <g key={`route-waypoint-${node.id}`}>
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

                {/* Floor indicator */}
                <text
                  x={pos.x}
                  y={pos.y + (isStart ? 35 : 35)}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#6b7280"
                  style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                    pointerEvents: 'none',
                  }}
                >
                  Floor {node.position.floorNum}
                </text>
              </>
            )}

            {/* Step number for intermediate waypoints */}
            {!isStart && !isEnd && (
              <>
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
                  {originalIndex}
                </text>
                {/* Floor indicator for waypoints */}
                <text
                  x={pos.x}
                  y={pos.y + 18}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#6b7280"
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  F{node.position.floorNum}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Distance and route info indicator for current floor */}
      {totalDistance > 0 && currentFloorSegments.length > 0 && (
        <g>
          {/* Find middle of route for info display */}
          {(() => {
            const midIndex = Math.floor(currentFloorSegments.length / 2);
            const midSegment = currentFloorSegments[midIndex];
            const midX = (midSegment.start.x + midSegment.end.x) / 2;
            const midY = (midSegment.start.y + midSegment.end.y) / 2;

            return (
              <g>
                {/* Background for route info */}
                <rect
                  x={midX - 55}
                  y={midY - 35}
                  width={110}
                  height={35}
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
                  y={midY - 20}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  fill="#f59e0b"
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  Route: {totalDistance.toFixed(1)}
                </text>

                {/* Floor indicator */}
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#6b7280"
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  Floor {currentFloor} segment
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
};
