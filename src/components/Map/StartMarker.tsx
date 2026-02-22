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
