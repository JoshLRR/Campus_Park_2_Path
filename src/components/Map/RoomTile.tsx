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
  onPointerDown: (e: React.PointerEvent<SVGRectElement>, id: number) => void;
}

export const RoomTile: React.FC<RoomTileProps> = ({
  id,
  x,
  y,
  width,
  height,
  name,
  isDragging,
  onPointerDown,
}) => {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="blue"
        stroke="black"
        strokeWidth={2}
        rx={4}
        ry={4}
        style={{cursor: isDragging ? 'grabbing' : 'grab'}}
        onPointerDown={e => onPointerDown(e, id)}
      />
      /* This text below is just here to fix a lint issue with name being unused
      */
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        alignmentBaseline="middle"
        fill="white"
        fontSize={14}
        pointerEvents="none"
      >
        {name}
      </text>
    </>
  );
};
