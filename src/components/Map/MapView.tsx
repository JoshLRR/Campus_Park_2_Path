/**
 * Map view component.
 *
 * This file defines the MapView UI component responsible for rendering
 * the primary visual representation of the campus map. It serves as the
 * central interaction surface for spatial navigation.
 *
 * The MapView is expected to support:
 * - Display of campus buildings, paths, and landmarks
 * - Visualization of selected destinations and routes
 * - Real-time updates based on routing or filter changes
 * - User interactions such as pan, zoom, and focus
 *
 * @remarks
 * This component is intentionally empty during early development
 * while map rendering technology and data integration are evaluated.
 *
 * Map rendering logic (e.g. canvas, SVG, or third-party libraries)
 * should be encapsulated within this component or delegated to
 * specialized subcomponents to avoid leaking map concerns elsewhere.
 */

import React, {useState, useRef} from 'react';
import {TransformWrapper, TransformComponent} from 'react-zoom-pan-pinch';

// Building type
export interface Building {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

export type Point = {x: number; y: number};

export interface PolygonBuilding extends Building {
  points: Point[];
}

// Props
interface MapViewProps {
  initialBuildings: Building[];
}

// Grid snap size
const GRID_SIZE = 20;

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

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
      <TransformWrapper
        panning={{disabled: draggingId !== null}}
        wheel={{step: 0.08}}
        doubleClick={{disabled: true}}
        pinch={{step: 5}}
        minScale={0.4}
        maxScale={4}
        limitToBounds={false}
      >
        <TransformComponent
          wrapperStyle={{width: '100%', height: '100%'}}
          contentStyle={{
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
            position: 'relative',
          }}
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
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
