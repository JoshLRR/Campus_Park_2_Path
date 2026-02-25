/**
 * Start marker component.
 *
 * This file defines the StartMarker UI component responsible for
 * visually indicating the starting point of a navigation route
 * on the campus map.
 *
 * The StartMarker is expected to:
 * - Represent the user’s selected origin or current location
 * - Remain visually distinct from destinations and path overlays
 * - Update position when the start location changes
 *
 * @remarks
 * This component is intentionally minimal and presentational.
 * It should not perform location resolution or routing logic.
 *
 * Any logic related to determining the start point (e.g. nearest
 * entrance, parking location, or user-selected origin) should
 * be handled upstream and passed in as data.
 */

import React from 'react';

interface StartMarkerProps {
  x: number;
  y: number;
  label?: string;
}

export const StartMarker: React.FC<StartMarkerProps> = ({x, y, label}) => {
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill="red" stroke="black" strokeWidth={2} />
      {label && (
        <text x={x + 15} y={y + 5} fontSize={14} fill="black">
          {label}
        </text>
      )}
    </g>
  );
};
