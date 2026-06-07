/**
 * RouteOverlay.tsx
 *
 * Draws the calculated route on the map — the path line through the
 * route's nodes (with an optional highlighted segment) plus the total
 * distance — scaled and positioned via the same `scalePosition` helper
 * as `GraphOverlay`.
 */

import React from 'react';
import {GraphNode} from './GraphOverlay';

interface RouteOverlayProps {
  nodes: GraphNode[];
  routePath: number[];
  scalePosition: (pos: {x: number; y: number}) => {x: number; y: number};
  totalDistance?: number;
  currentFloor: number;
  highlightedSegment?: {from: number; to: number} | null;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = ({
  nodes,
  routePath,
  scalePosition,
  currentFloor,
  highlightedSegment,
}) => {
  if (routePath.length < 2) return null;

  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // Collect segments where both endpoints are on the current floor
  const segments: {x1: number; y1: number; x2: number; y2: number}[] = [];

  for (let i = 0; i < routePath.length - 1; i++) {
    const a = nodeMap.get(routePath[i]);
    const b = nodeMap.get(routePath[i + 1]);
    if (!a || !b) continue;
    if (
      a.position.floorNum !== currentFloor ||
      b.position.floorNum !== currentFloor
    )
      continue;
    const edgeExists = a.neighbors.some(n => n.to === b.id);
    if (!edgeExists) continue;
    const pa = scalePosition(a.position);
    const pb = scalePosition(b.position);
    segments.push({x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y});
  }

  const hasRouteOnOtherFloor =
    segments.length === 0 &&
    routePath.some(id => {
      const n = nodeMap.get(id);
      return n && n.position.floorNum !== currentFloor;
    });

  if (segments.length === 0) {
    if (!hasRouteOnOtherFloor) return null;
    return (
      <g>
        <text
          x={1250}
          y={200}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill="#4285f4"
          style={{
            textShadow: '1px 1px 3px rgba(255,255,255,0.9)',
            pointerEvents: 'none',
          }}
        >
          Route continues on another floor
        </text>
      </g>
    );
  }

  // Build a single continuous path string
  let d = `M ${segments[0].x1} ${segments[0].y1}`;
  for (const seg of segments) {
    d += ` L ${seg.x2} ${seg.y2}`;
  }

  // Build highlighted sub-path if a segment is active
  let highlightD: string | null = null;
  if (highlightedSegment) {
    const fromIdx = routePath.indexOf(highlightedSegment.from);
    const toIdx = routePath.indexOf(highlightedSegment.to);
    if (fromIdx !== -1 && toIdx !== -1) {
      const lo = Math.min(fromIdx, toIdx);
      const hi = Math.max(fromIdx, toIdx);
      const subPath = routePath.slice(lo, hi + 1);
      const hlSegs: {x1: number; y1: number; x2: number; y2: number}[] = [];
      for (let i = 0; i < subPath.length - 1; i++) {
        const a = nodeMap.get(subPath[i]);
        const b = nodeMap.get(subPath[i + 1]);
        if (!a || !b) continue;
        if (
          a.position.floorNum !== currentFloor ||
          b.position.floorNum !== currentFloor
        )
          continue;
        const pa = scalePosition(a.position);
        const pb = scalePosition(b.position);
        hlSegs.push({x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y});
      }
      if (hlSegs.length > 0) {
        highlightD = `M ${hlSegs[0].x1} ${hlSegs[0].y1}`;
        for (const seg of hlSegs) {
          highlightD += ` L ${seg.x2} ${seg.y2}`;
        }
      }
    }
  }

  return (
    <g>
      {/* Casing (darker, wider) */}
      <path
        d={d}
        fill="none"
        stroke="#1a73e8"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
        vectorEffect="non-scaling-stroke"
      />
      {/* Main route line */}
      <path
        d={d}
        fill="none"
        stroke="#4285f4"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        vectorEffect="non-scaling-stroke"
      />
      {/* Highlighted segment overlay */}
      {highlightD && (
        <>
          <path
            d={highlightD}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={highlightD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={1}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </g>
  );
};
