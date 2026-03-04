/**
 * Map view component.
 *
 * This file defines the MapView UI component responsible for rendering
 * the primary visual representation of the campus map. It serves as the
 * central interaction surface for spatial navigation.
 */

import React, {useState, useRef} from 'react';
import {TransformWrapper, TransformComponent} from 'react-zoom-pan-pinch';
import {RoomTile} from './RoomTile';
import {StartMarker} from './StartMarker';
import {DestinationMarker} from './DestinationMarker';

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

// Room interface
export interface Room {
  id: number;
  name: string;
  building: string;
  buildingId: number;
  floor: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// Navigation points interface
export interface NavigationPoint {
  roomId?: number;
  x: number;
  y: number;
  label: string;
}

// Props
interface MapViewProps {
  initialBuildings: Building[];
  selectedRoomId?: number | null;
  focusBuildingId?: number | null;
  rooms?: Room[];
  startPoint?: NavigationPoint | null;
  destinationPoint?: NavigationPoint | null;
  onRoomSelect?: (roomId: number) => void;
  onStartPointClear?: () => void;
  onDestinationPointClear?: () => void;
}

// Grid snap size
const GRID_SIZE = 20;

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

export const MapView: React.FC<MapViewProps> = ({
  initialBuildings,
  selectedRoomId,
  focusBuildingId,
  rooms = [],
  startPoint,
  destinationPoint,
  onRoomSelect,
  onStartPointClear,
  onDestinationPointClear,
}) => {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingType, setDraggingType] = useState<'building' | 'room' | null>(
    null,
  );
  const [offset, setOffset] = useState({x: 0, y: 0});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  // Handle building pointer down
  const handleBuildingPointerDown = (e: React.PointerEvent, id: number) => {
    const building = buildings.find(b => b.id === id);
    if (!building || !containerRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle room pointer down
  const handleRoomPointerDown = (
    e: React.PointerEvent<SVGRectElement>,
    id: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const room = rooms.find(r => r.id === id);
    if (!room || !containerRef.current) return;

    const building = buildings.find(b => b.id === room.buildingId);
    if (!building) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const absoluteRoomX = building.x + room.x;
    const absoluteRoomY = building.y + room.y;

    setOffset({x: pointerX - absoluteRoomX, y: pointerY - absoluteRoomY});
    setDraggingId(id);
    setDraggingType('room');
  };

  // Handle room click
  const handleRoomClick = (roomId: number) => {
    if (onRoomSelect) {
      onRoomSelect(roomId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    if (draggingType === 'building') {
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
    }
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setDraggingType(null);
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
          <svg
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            style={{position: 'absolute', top: 0, left: 0}}
          >
            {/* Buildings */}
            {buildings.map(building => {
              const isFocused = focusBuildingId === building.id;
              const buildingRooms = rooms.filter(
                room => room.buildingId === building.id,
              );

              return (
                <g key={building.id}>
                  {/* Building rectangle */}
                  <rect
                    x={building.x}
                    y={building.y}
                    width={building.width}
                    height={building.height}
                    fill={isFocused ? '#3b82f6' : '#0ea5e9'} // blue-500 : sky-500
                    stroke={isFocused ? '#2563eb' : '#000000'} // blue-600 : black
                    strokeWidth={isFocused ? 3 : 2}
                    rx={6}
                    ry={6}
                    style={{
                      cursor: draggingId === building.id ? 'grabbing' : 'grab',
                      filter: isFocused
                        ? 'drop-shadow(0 8px 25px rgba(59, 130, 246, 0.5))'
                        : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      transition: 'all 0.3s ease-in-out',
                      transform: isFocused ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: 'center',
                    }}
                    onPointerDown={e =>
                      handleBuildingPointerDown(e, building.id)
                    }
                  />

                  {/* Building name */}
                  <text
                    x={building.x + building.width / 2}
                    y={building.y + building.height / 2}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="white"
                    fontSize={16}
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {building.name}
                  </text>

                  {/* Rooms within building */}
                  {(isFocused ||
                    buildingRooms.some(room => room.id === selectedRoomId) ||
                    startPoint?.roomId ||
                    destinationPoint?.roomId) &&
                    buildingRooms.map(room => (
                      <RoomTile
                        key={room.id}
                        id={room.id}
                        x={building.x + room.x}
                        y={building.y + room.y}
                        width={room.width || 30}
                        height={room.height || 20}
                        name={room.name}
                        building={room.building}
                        floor={room.floor}
                        isDragging={
                          draggingId === room.id && draggingType === 'room'
                        }
                        isSelected={selectedRoomId === room.id}
                        isHighlighted={focusBuildingId === room.buildingId}
                        onPointerDown={handleRoomPointerDown}
                        onClick={handleRoomClick}
                      />
                    ))}
                </g>
              );
            })}

            {/* Navigation markers */}
            {startPoint && (
              <StartMarker
                x={startPoint.x}
                y={startPoint.y}
                label={startPoint.label}
                isAnimated={true}
                onClick={onStartPointClear}
              />
            )}

            {destinationPoint && (
              <DestinationMarker
                x={destinationPoint.x}
                y={destinationPoint.y}
                label={destinationPoint.label}
                isAnimated={true}
                onClick={onDestinationPointClear}
              />
            )}

            {/* Simple path line between start and destination */}
            {startPoint && destinationPoint && (
              <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={destinationPoint.x}
                y2={destinationPoint.y}
                stroke="#8b5cf6"
                strokeWidth={3}
                strokeDasharray="8,4"
                opacity={0.7}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </line>
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-500 border border-black rounded-sm"></div>
            <span>Building</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 border-2 border-blue-600 rounded-sm"></div>
            <span>Focused Building</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-500 border border-gray-600 rounded-sm"></div>
            <span>Room</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 border-2 border-red-600 rounded-sm"></div>
            <span>Selected Room</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-1 bg-purple-500"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #8b5cf6 0px, #8b5cf6 8px, transparent 8px, transparent 12px)',
              }}
            ></div>
            <span>Route</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs max-w-48">
        <p>
          <strong>Controls:</strong>
        </p>
        <p>• Mouse wheel: Zoom</p>
        <p>• Drag buildings: Move</p>
        <p>• Click rooms: Select</p>
        <p>• Click markers: Remove</p>
        <p>• Pan: Drag empty area</p>
      </div>
    </div>
  );
};
