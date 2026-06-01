import React, {useState} from 'react';
import {GraphNode} from './GraphOverlay';

interface RoomMenuProps {
  isOpen: boolean;
  onClose: () => void;
  graphNodes: GraphNode[];
  currentFloor: number;
  selectedGraphNodeId?: number | null;
  onNodeSelect: (nodeId: number) => void;
  onSetStart: (nodeId: number) => void;
  onSetEnd: (nodeId: number) => void;
}

function RoomRow({
                   node,
                   isSelected,
                   onSelect,
                   onSetStart,
                   onSetEnd,
                 }: {
  node: GraphNode;
  isSelected: boolean;
  onSelect: () => void;
  onSetStart: () => void;
  onSetEnd: () => void;
}) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center justify-between gap-2">
        <button onClick={onSelect} className="flex-1 text-left min-w-0">
          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#2563EB]' : 'text-[#1e2022]'}`}>
            {node.roomNumber}
          </p>
          <p className="text-xs text-gray-400">Floor {node.position.floorNum}</p>
        </button>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onSetStart} className="px-2 py-1 rounded-lg border border-[#2563EB] text-[#2563EB] text-xs font-semibold">
            Start
          </button>
          <button onClick={onSetEnd} className="px-2 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-semibold">
            End
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileRoomMenu({
                                 isOpen,
                                 onClose,
                                 graphNodes,
                                 currentFloor,
                                 selectedGraphNodeId,
                                 onNodeSelect,
                                 onSetStart,
                                 onSetEnd,
                               }: RoomMenuProps) {
  const [search, setSearch] = useState('');

  const roomNodes = graphNodes.filter(n => n.kind === 'room' && n.roomNumber);
  const floors = [...new Set(roomNodes.map(n => n.position.floorNum))].sort((a, b) => a - b);
  const filtered = roomNodes.filter(n =>
    !search || n.roomNumber?.toLowerCase().includes(search.toLowerCase()),
  );

  const makeRowProps = (node: GraphNode) => ({
    key: node.id,
    node,
    isSelected: selectedGraphNodeId === node.id,
    onSelect: () => { onNodeSelect(node.id); onClose(); },
    onSetStart: () => { onSetStart(node.id); onClose(); },
    onSetEnd: () => { onSetEnd(node.id); onClose(); },
  });

  return (
    <>
      <div
        className={`absolute inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`absolute top-0 left-0 bottom-0 z-50 w-[80%] max-w-[320px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-[#2563EB] px-4 pt-10 pb-4 flex items-center justify-between flex-shrink-0">
          <p className="text-white text-lg font-bold tracking-wide">Rooms</p>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none" aria-label="Close menu">×</button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        {!search && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 border-b border-gray-100">
            {floors.map(floor => (
              <span
                key={floor}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${floor === currentFloor ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
              >
                Floor {floor}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">No rooms found</p>
          )}
          {search && filtered.map(node => <RoomRow {...makeRowProps(node)} />)}
          {!search && floors.map(floor => {
            const floorRooms = filtered.filter(n => n.position.floorNum === floor);
            if (floorRooms.length === 0) return null;
            return (
              <div key={floor}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Floor {floor}</p>
                </div>
                {floorRooms.map(node => <RoomRow {...makeRowProps(node)} />)}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
