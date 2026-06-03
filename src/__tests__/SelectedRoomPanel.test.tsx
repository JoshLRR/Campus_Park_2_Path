import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {SelectedRoomPanel} from '../components/Map/SelectedRoomPanel';
import {Room} from '../components/Map/MapView';

const room: Room & {id: number} = {
  id: 5,
  name: 'Room 101',
  building: 'Library',
  buildingId: 1,
  floor: 2,
  x: 0,
  y: 0,
};

describe('SelectedRoomPanel', () => {
  it('renders nothing when no room is selected', () => {
    const {container} = render(
      <SelectedRoomPanel
        selectedRoom={null}
        clearSelection={vi.fn()}
        onSetStartPoint={vi.fn()}
        onSetDestination={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders room details and wires the action buttons', () => {
    const clearSelection = vi.fn();
    const onSetStartPoint = vi.fn();
    const onSetDestination = vi.fn();
    render(
      <SelectedRoomPanel
        selectedRoom={room}
        clearSelection={clearSelection}
        onSetStartPoint={onSetStartPoint}
        onSetDestination={onSetDestination}
      />,
    );
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText(/Library • Floor 2/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Set as Start'}));
    expect(onSetStartPoint).toHaveBeenCalledWith(room);

    fireEvent.click(screen.getByRole('button', {name: 'Set as Destination'}));
    expect(onSetDestination).toHaveBeenCalledWith(room);

    fireEvent.click(screen.getByRole('button', {name: '×'}));
    expect(clearSelection).toHaveBeenCalled();
  });
});
