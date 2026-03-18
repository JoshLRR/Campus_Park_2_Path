/**
 * Destination marker component.
 *
 * This file defines the DestinationMarker UI component responsible for
 * visually indicating the destination point of a navigation route
 * on the campus map.
 *
 * The DestinationMarker is expected to:
 * - Represent the user's selected destination or target location
 * - Remain visually distinct from start points and path overlays
 * - Update position when the destination changes
 */

import React from 'react';

interface DestinationMarkerProps {
  x: number;
  y: number;
  label?: string;
  isAnimated?: boolean;
  onClick?: () => void;
}

export const DestinationMarker: React.FC<DestinationMarkerProps> = ({
  x,
  y,
  label,
  isAnimated = false,
  onClick,
}) => {
  return (
    <g onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default'}}>
      {/* Animated ring effect */}
      {isAnimated && (
        <circle
          cx={x}
          cy={y}
          r={12}
          fill="none"
          stroke="rgba(34, 197, 94, 0.4)"
          strokeWidth={4}
        >
          <animate
            attributeName="r"
            values="12;20;12"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0.2;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Main marker circle */}
      <circle
        cx={x}
        cy={y}
        r={12}
        fill="#22c55e"
        stroke="white"
        strokeWidth={3}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          transition: 'all 0.2s ease-in-out',
        }}
      />

      {/* Inner dot - same as StartMarker */}
      <circle cx={x} cy={y} r={4} fill="white" />

      {/* Label */}
      {label && (
        <g>
          {/* Label background */}
          <rect
            x={x + 15}
            y={y - 10}
            width={label.length * 8 + 8}
            height={20}
            fill="rgba(34, 197, 94, 0.9)"
            stroke="white"
            strokeWidth={1}
            rx={4}
            ry={4}
          />
          {/* Label text */}
          <text
            x={x + 19}
            y={y + 4}
            fontSize={12}
            fill="white"
            fontWeight="bold"
          >
            {label}
          </text>
        </g>
      )}

      {/* Tooltip */}
      <title>Destination{label ? `: ${label}` : ''}</title>
    </g>
  );
};
