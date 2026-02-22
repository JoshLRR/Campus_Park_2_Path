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
