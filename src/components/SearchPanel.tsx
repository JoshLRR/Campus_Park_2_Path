import {useState} from 'react';
import {NavigationPoint, Room} from './Map/MapView';
import {PathResult} from './Map/pathfinding';
import {filterRooms, matchedFeatureLabel} from '../logic/filterRooms';
import {FEATURE_LABELS} from '../logic/featureLabels';

type SearchRoom = Room & {id: number};

type SearchPanelProps = {
  rooms: SearchRoom[];
  startPoint: NavigationPoint | null;
  destinationPoint: NavigationPoint | null;
  currentRoute: PathResult | null;
  onSetStartPoint: (room: SearchRoom) => void;
  onSetDestination: (room: SearchRoom) => void;
  onRoomSelect: (roomId: number) => void;
  onFocusRoom: (room: {x: number; y: number}) => void;
  clearRoute: () => void;
  clearStartPoint: () => void;
  clearDestination: () => void;
};

export function SearchPanel({
  rooms,
  startPoint,
  destinationPoint,
  currentRoute,
  onSetStartPoint,
  onSetDestination,
  onRoomSelect,
  onFocusRoom,
  clearRoute,
  clearStartPoint,
  clearDestination,
}: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null);

  const filteredRooms = filterRooms(rooms, searchTerm);
  const hasNavigation = !!(startPoint || destinationPoint);

  const handleSelectRoom = (room: SearchRoom) => {
    onRoomSelect(room.id);
    setShowResults(false);
  };

  const handleSetStart = (room: SearchRoom) => {
    onSetStartPoint(room);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleSetDest = (room: SearchRoom) => {
    onSetDestination(room);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div
      className="w-80 bg-white rounded-2xl shadow-2xl overflow-hidden"
      style={{pointerEvents: 'auto'}}
    >
      {/* Search input */}
      <div className="flex items-center gap-3 px-4 py-3">
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search rooms or buildings..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
        />
        {searchTerm && (
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setSearchTerm('');
              setShowResults(false);
            }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search results */}
      {showResults && searchTerm && (
        <div className="border-t border-gray-100 max-h-96 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              No rooms found for &ldquo;{searchTerm}&rdquo;
            </p>
          ) : (
            filteredRooms.slice(0, 8).map(room => {
              const featureLabel = matchedFeatureLabel(room, searchTerm);
              const displayName = featureLabel
                ? `${featureLabel} - ${room.name}`
                : room.name;

              return (
                <div
                  key={room.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  {/* Main result row */}
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleSelectRoom(room)}
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {room.building} &middot; Floor {room.floor}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Eye — zoom to room */}
                        <button
                          title="View on map"
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            e.stopPropagation();
                            onFocusRoom(room);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {/* Info — expand features */}
                        <button
                          title="Room info"
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            e.stopPropagation();
                            setExpandedRoomId(
                              expandedRoomId === room.id ? null : room.id,
                            );
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            expandedRoomId === room.id
                              ? 'text-indigo-600 bg-indigo-50'
                              : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            e.stopPropagation();
                            handleSetStart(room);
                          }}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors font-medium"
                        >
                          From
                        </button>
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            e.stopPropagation();
                            handleSetDest(room);
                          }}
                          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full hover:bg-red-100 transition-colors font-medium"
                        >
                          To
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded info panel */}
                  {expandedRoomId === room.id && (
                    <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2 mb-1.5">
                        Features
                      </p>
                      {room.features && room.features.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.features.map(f => (
                            <span
                              key={f}
                              className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600"
                            >
                              {FEATURE_LABELS[f] ?? 'Other'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">
                          No features listed for this room.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Navigation summary card */}
      {hasNavigation && !showResults && (
        <div className="border-t border-gray-100 p-4">
          {/* Start row */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-100 flex-shrink-0" />
            {startPoint ? (
              <span className="text-sm text-gray-700 flex-1 truncate">
                {startPoint.label}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic flex-1">
                Choose start
              </span>
            )}
            {startPoint && (
              <button
                onClick={clearStartPoint}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Connector */}
          <div className="ml-[5px] w-px h-3 bg-gray-200 mb-1" />

          {/* Destination row */}
          <div className="flex items-center gap-3">
            <svg
              className="w-3 h-3 text-red-500 flex-shrink-0"
              viewBox="0 0 12 16"
              fill="currentColor"
            >
              <path d="M6 0C2.686 0 0 2.686 0 6c0 3.314 6 10 6 10s6-6.686 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            {destinationPoint ? (
              <span className="text-sm text-gray-700 flex-1 truncate">
                {destinationPoint.label}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic flex-1">
                Choose destination
              </span>
            )}
            {destinationPoint && (
              <button
                onClick={clearDestination}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Route result */}
          {currentRoute?.success && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-blue-600">
                ~{currentRoute.totalDistance.toFixed(0)} m
              </span>
              <button
                onClick={clearRoute}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear route
              </button>
            </div>
          )}

          {currentRoute && !currentRoute.success && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-red-500">
                {currentRoute.message ?? 'No route found'}
              </span>
              <button
                onClick={clearRoute}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
