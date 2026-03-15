/**
 * Map view component.
 *
 * This file defines the MapView UI component responsible for rendering
 * the primary visual representation of the campus map. It serves as the
 * central interaction surface for spatial navigation.
 */

import React, {useRef} from 'react';
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
                                                  onDestinationPointClear
                                                }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Handle room click
  const handleRoomClick = (roomId: number) => {
    if (onRoomSelect) {
      onRoomSelect(roomId);
    }
  };

  // Handle room pointer down (for potential future dragging if needed)
  const handleRoomPointerDown = (e: React.PointerEvent<SVGRectElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Currently no dragging functionality - just prevent event bubbling
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-green-100 relative overflow-hidden"
    >
      <TransformWrapper
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
            {/* Buildings - Static, no movement */}
            {initialBuildings.map(building => {
              const isFocused = focusBuildingId === building.id;
              const buildingRooms = rooms.filter(room => room.buildingId === building.id);

              return (
                <g key={building.id}>
                  {/* Building name - Positioned above the rectangle */}
                  <text
                    x={building.x + building.width / 2}
                    y={building.y - 10}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill={isFocused ? '#2563eb' : '#000000'}
                    fontSize={14}
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{
                      textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
                      transition: 'fill 0.3s ease-in-out',
                    }}
                  >
                    {building.name}
                  </text>

                  {/* Building rectangle - No movement, only color changes */}
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
                      cursor: 'pointer',
                      filter: isFocused ? 'drop-shadow(0 8px 25px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      transition: 'fill 0.3s ease-in-out, stroke 0.3s ease-in-out, filter 0.3s ease-in-out, stroke-width 0.3s ease-in-out',
                    }}
                  />

                  {/* All rooms within building - Always visible */}
                  {buildingRooms.map(room => (
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
                      isDragging={false} // No dragging functionality
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
            <span>Highlighted Building</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-500 border border-gray-600 rounded-sm"></div>
            <span>Room (Default)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 border border-cyan-600 rounded-sm"></div>
            <span>Room (Highlighted)</span>
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
            <div className="w-6 h-1 bg-purple-500" style={{background: 'repeating-linear-gradient(90deg, #8b5cf6 0px, #8b5cf6 8px, transparent 8px, transparent 12px)'}}></div>
            <span>Route</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs max-w-48">
        <p><strong>Controls:</strong></p>
        <p>• Mouse wheel: Zoom</p>
        <p>• Drag: Pan around map</p>
        <p>• Click buildings: Highlight rooms</p>
        <p>• Click rooms: Select</p>
        <p>• Click markers: Remove</p>
      </div>
    </div>
  );
};
