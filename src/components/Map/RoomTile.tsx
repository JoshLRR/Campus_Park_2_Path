/**
 * Room tile component.
 *
 * This file defines the RoomTile UI component, a presentational element
 * responsible for rendering a single room or destination entry within
 * a list-based interface (e.g. search results or destination lists).
 *
 * A RoomTile is expected to represent:
 * - Core room identifiers (name, number, building)
 * - High-level status indicators (e.g. available, closed, out of service)
 * - Accessibility or utility hints where relevant
 *
 * @remarks
 * This component is intended to be **purely presentational**.
 * It should receive all required data via props and delegate
 * selection, navigation, or state changes to parent components.
 *
 * Keeping RoomTile focused on rendering ensures it can be reused
 * across different contexts (search results, favorites, recents)
 * without coupling it to specific workflows.
 */

import React from 'react';

export interface RoomTileProps {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  isDragging: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  building?: string;
  floor?: number;
  onPointerDown: (e: React.PointerEvent<SVGRectElement>, id: number) => void;
  onClick?: (id: number) => void;
}

export const RoomTile: React.FC<RoomTileProps> = ({
  id,
  x,
  y,
  width,
  height,
  name,
  isDragging,
  isSelected = false,
  isHighlighted = false,
  building,
  floor,
  onPointerDown,
  onClick,
}) => {
  // Determine fill color based on state
  const getFillColor = () => {
    if (isSelected) return '#ef4444'; // red-500
    if (isHighlighted) return '#3b82f6'; // blue-500
    return '#0ea5e9'; // sky-500
  };

  // Determine stroke color based on state
  const getStrokeColor = () => {
    if (isSelected) return '#dc2626'; // red-600
    if (isHighlighted) return '#2563eb'; // blue-600
    return '#000000'; // black
  };

  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <g>
      {/* Room rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={isSelected ? 3 : 2}
        rx={4}
        ry={4}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          filter: isSelected
            ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            : 'none',
          transition: 'all 0.2s ease-in-out',
        }}
        onPointerDown={e => onPointerDown(e, id)}
        onClick={handleClick}
      />

      {/* Selection indicator */}
      {isSelected && (
        <circle
          cx={x + width - 6}
          cy={y + 6}
          r={4}
          fill="#dc2626"
          stroke="white"
          strokeWidth={1}
        >
          <animate
            attributeName="r"
            values="3;5;3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Room name text */}
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        alignmentBaseline="middle"
        fill="white"
        fontSize={Math.min(12, (width / name.length) * 1.2)}
        fontWeight={isSelected ? 'bold' : 'normal'}
        pointerEvents="none"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {name.length > 10 ? `${name.slice(0, 8)}...` : name}
      </text>

      {/* Tooltip on hover */}
      {(building || floor) && (
        <title>
          {name}
          {building && ` - ${building}`}
          {floor && ` (Floor ${floor})`}
        </title>
      )}
    </g>
  );
};
