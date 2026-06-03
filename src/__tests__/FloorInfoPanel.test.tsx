import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {FloorInfoPanel} from '../components/Map/FloorInfoPanel';

// Stat values are chosen not to collide with the floor-button labels (1, 2, 3).
const stats = {nodes: 17, pathNodes: 11, roomNodes: 6, rooms: 9};

describe('FloorInfoPanel', () => {
  it('shows the current floor and its statistics', () => {
    render(
      <FloorInfoPanel
        currentFloor={2}
        floorStats={stats}
        availableFloors={[1, 2, 3]}
        onFloorChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Floor 2')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('renders a button for each available floor', () => {
    render(
      <FloorInfoPanel
        currentFloor={2}
        floorStats={stats}
        availableFloors={[1, 2, 3]}
        onFloorChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', {name: '1'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '2'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '3'})).toBeInTheDocument();
  });

  it('calls onFloorChange with the chosen floor', () => {
    const onFloorChange = vi.fn();
    render(
      <FloorInfoPanel
        currentFloor={2}
        floorStats={stats}
        availableFloors={[1, 2, 3]}
        onFloorChange={onFloorChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: '3'}));
    expect(onFloorChange).toHaveBeenCalledWith(3);
  });
});
