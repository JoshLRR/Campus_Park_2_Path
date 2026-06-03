import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {RoomSearchPanel} from '../components/Search/RoomSearchPanel';
import {Room} from '../components/Map/MapView';

type SearchRoom = Room & {id: number};

const makeRooms = (n: number): SearchRoom[] =>
  Array.from({length: n}, (_, i) => ({
    id: i + 1,
    name: `Room ${i + 1}`,
    building: 'Library',
    buildingId: 1,
    floor: 1,
    x: 0,
    y: 0,
  }));

function renderPanel(overrides = {}) {
  const handlers = {
    setSearchTerm: vi.fn(),
    setIsRightPanelOpen: vi.fn(),
    onSetStartPoint: vi.fn(),
    onSetDestination: vi.fn(),
    onRoomSelect: vi.fn(),
  };
  render(
    <RoomSearchPanel
      searchTerm=""
      filteredRooms={[]}
      isRightPanelOpen={true}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe('RoomSearchPanel', () => {
  it('updates the search term on input', () => {
    const handlers = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText('Search rooms or buildings...'),
      {
        target: {value: 'lib'},
      },
    );
    expect(handlers.setSearchTerm).toHaveBeenCalledWith('lib');
  });

  it('shows a "Show Rooms" button only when the panel is closed', () => {
    const handlers = renderPanel({isRightPanelOpen: false});
    const button = screen.getByRole('button', {name: 'Show Rooms'});
    fireEvent.click(button);
    expect(handlers.setIsRightPanelOpen).toHaveBeenCalledWith(true);
  });

  it('renders results and wires the per-room actions', () => {
    const rooms = makeRooms(1);
    const handlers = renderPanel({searchTerm: 'room', filteredRooms: rooms});
    expect(screen.getByText('1 results found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Start'}));
    expect(handlers.onSetStartPoint).toHaveBeenCalledWith(rooms[0]);
    fireEvent.click(screen.getByRole('button', {name: 'Dest'}));
    expect(handlers.onSetDestination).toHaveBeenCalledWith(rooms[0]);
    fireEvent.click(screen.getByRole('button', {name: 'Select'}));
    expect(handlers.onRoomSelect).toHaveBeenCalledWith(1);
  });

  it('caps the list at 5 and notes more results exist', () => {
    renderPanel({searchTerm: 'room', filteredRooms: makeRooms(7)});
    expect(screen.getByText('7 results found')).toBeInTheDocument();
    expect(screen.getAllByRole('button', {name: 'Select'})).toHaveLength(5);
    expect(screen.getByText(/Showing first 5 results/)).toBeInTheDocument();
  });

  it('shows a no-results message when nothing matches', () => {
    renderPanel({searchTerm: 'zzz', filteredRooms: []});
    expect(
      screen.getByText(/No rooms found matching "zzz"/),
    ).toBeInTheDocument();
  });
});
