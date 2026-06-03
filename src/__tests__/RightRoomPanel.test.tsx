import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {RightRoomPanel} from '../components/Map/RightRoomPanel';
import {Room} from '../components/Map/MapView';

type PanelRoom = Room & {id: number};

const rooms: PanelRoom[] = [
  {
    id: 1,
    name: 'Room A',
    building: 'Library',
    buildingId: 1,
    floor: 1,
    x: 0,
    y: 0,
  },
  {
    id: 2,
    name: 'Room B',
    building: 'Science',
    buildingId: 2,
    floor: 2,
    x: 0,
    y: 0,
  },
];

function renderPanel(overrides = {}) {
  const handlers = {
    setIsRightPanelOpen: vi.fn(),
    onRoomSelect: vi.fn(),
    onSetStartPoint: vi.fn(),
    onSetDestination: vi.fn(),
  };
  const result = render(
    <RightRoomPanel
      isRightPanelOpen={true}
      currentFloor={1}
      sampleRooms={rooms}
      selectedRoomId={null}
      {...handlers}
      {...overrides}
    />,
  );
  return {...handlers, ...result};
}

describe('RightRoomPanel', () => {
  it('renders nothing when closed', () => {
    const {container} = renderPanel({isRightPanelOpen: false});
    expect(container).toBeEmptyDOMElement();
  });

  it('lists only rooms on the current floor', () => {
    renderPanel({currentFloor: 1});
    expect(screen.getByText('Room A')).toBeInTheDocument();
    expect(screen.queryByText('Room B')).toBeNull();
  });

  it('shows an empty message for a floor with no rooms', () => {
    renderPanel({currentFloor: 3});
    expect(screen.getByText('No rooms on Floor 3')).toBeInTheDocument();
  });

  it('selects a room on row click and closes on the × button', () => {
    const handlers = renderPanel();
    fireEvent.click(screen.getByText('Room A'));
    expect(handlers.onRoomSelect).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', {name: '×'}));
    expect(handlers.setIsRightPanelOpen).toHaveBeenCalledWith(false);
  });

  it('sets start/destination without triggering row selection', () => {
    const handlers = renderPanel();
    fireEvent.click(screen.getByRole('button', {name: 'Start'}));
    expect(handlers.onSetStartPoint).toHaveBeenCalledWith(rooms[0]);
    fireEvent.click(screen.getByRole('button', {name: 'Dest'}));
    expect(handlers.onSetDestination).toHaveBeenCalledWith(rooms[0]);
    // stopPropagation means the row's onRoomSelect was not called by the buttons
    expect(handlers.onRoomSelect).not.toHaveBeenCalled();
  });
});
