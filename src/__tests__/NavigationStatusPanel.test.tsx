import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {NavigationStatusPanel} from '../components/Directions/NavigationStatusPanel';
import {NavigationPoint} from '../components/Map/MapView';

const start: NavigationPoint = {x: 0, y: 0, label: 'Lobby', floor: 1};
const dest: NavigationPoint = {x: 9, y: 9, label: 'Lab', floor: 2};

describe('NavigationStatusPanel', () => {
  it('renders nothing when no points are selected', () => {
    const {container} = render(
      <NavigationStatusPanel
        startPoint={null}
        destinationPoint={null}
        currentRoute={null}
        clearStartPoint={vi.fn()}
        clearDestination={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the start point and clears it on click', () => {
    const clearStartPoint = vi.fn();
    render(
      <NavigationStatusPanel
        startPoint={start}
        destinationPoint={null}
        currentRoute={null}
        clearStartPoint={clearStartPoint}
        clearDestination={vi.fn()}
      />,
    );
    expect(screen.getByText('Lobby')).toBeInTheDocument();
    expect(screen.getByText('(Floor 1)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: '×'}));
    expect(clearStartPoint).toHaveBeenCalled();
  });

  it('shows the directions button only when both points are set', () => {
    const {rerender} = render(
      <NavigationStatusPanel
        startPoint={start}
        destinationPoint={null}
        currentRoute={null}
        clearStartPoint={vi.fn()}
        clearDestination={vi.fn()}
      />,
    );
    expect(screen.queryByText('Get Detailed Directions')).toBeNull();

    rerender(
      <NavigationStatusPanel
        startPoint={start}
        destinationPoint={dest}
        currentRoute={null}
        clearStartPoint={vi.fn()}
        clearDestination={vi.fn()}
      />,
    );
    expect(screen.getByText('Lab')).toBeInTheDocument();
    expect(screen.getByText('Get Detailed Directions')).toBeInTheDocument();
  });
});
