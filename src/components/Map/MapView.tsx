import React, {useState, useRef} from 'react';

// Building type
export interface Building {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

// Props
interface MapViewProps {
  initialBuildings: Building[];
}

// Grid snap size
const GRID_SIZE = 20;

export const MapView: React.FC<MapViewProps> = ({initialBuildings}) => {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    const building = buildings.find(b => b.id === id);
    if (!building || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    setOffset({x: pointerX - building.x, y: pointerY - building.y});
    setDraggingId(id);

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    setBuildings(prev =>
      prev.map(b =>
        b.id === draggingId
          ? {
              ...b,
              x: snap(pointerX - offset.x),
              y: snap(pointerY - offset.y),
            }
          : b,
      ),
    );
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-green-100 relative overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {buildings.map(b => (
        <div
          key={b.id}
          className="absolute bg-sky-500 border border-black flex items-center justify-center text-white font-semibold cursor-grab select-none"
          style={{
            left: b.x,
            top: b.y,
            width: b.width,
            height: b.height,
          }}
          onPointerDown={e => handlePointerDown(e, b.id)}
        >
          {b.name}
        </div>
      ))}
    </div>
  );
};
