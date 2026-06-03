import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {RouteStatusPanel} from '../components/Directions/RouteStatusPanel';
import {NavigationPoint} from '../components/Map/MapView';
import {PathResult} from '../components/Map/pathfinding';

const start: NavigationPoint = {x: 0, y: 0, label: 'A', floor: 1};
const dest: NavigationPoint = {x: 1, y: 1, label: 'B', floor: 1};

describe('RouteStatusPanel', () => {
  it('renders nothing when there is no route', () => {
    const {container} = render(
      <RouteStatusPanel
        currentRoute={null}
        startPoint={start}
        destinationPoint={dest}
        showRoute={true}
        setShowRoute={vi.fn()}
        clearRoute={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('summarizes a successful route and toggles visibility', () => {
    const route: PathResult = {success: true, path: [1, 2, 3], totalDistance: 12.34};
    const setShowRoute = vi.fn();
    const clearRoute = vi.fn();
    render(
      <RouteStatusPanel
        currentRoute={route}
        startPoint={start}
        destinationPoint={dest}
        showRoute={true}
        setShowRoute={setShowRoute}
        clearRoute={clearRoute}
      />,
    );
    const panel = screen.getByText('Current Route').closest('div')!;
    expect(panel).toHaveTextContent('Distance: 12.3 units');
    expect(panel).toHaveTextContent('Waypoints: 3');

    fireEvent.click(screen.getByRole('button', {name: 'Hide Route'}));
    expect(setShowRoute).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole('button', {name: 'Clear Route'}));
    expect(clearRoute).toHaveBeenCalled();
  });

  it('shows the Show Route label when the route is hidden', () => {
    const route: PathResult = {success: true, path: [1], totalDistance: 0};
    render(
      <RouteStatusPanel
        currentRoute={route}
        startPoint={start}
        destinationPoint={dest}
        showRoute={false}
        setShowRoute={vi.fn()}
        clearRoute={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', {name: 'Show Route'})).toBeInTheDocument();
  });

  it('shows an error when the route failed and both points are set', () => {
    const route: PathResult = {success: false, path: [], totalDistance: 0};
    render(
      <RouteStatusPanel
        currentRoute={route}
        startPoint={start}
        destinationPoint={dest}
        showRoute={true}
        setShowRoute={vi.fn()}
        clearRoute={vi.fn()}
      />,
    );
    expect(screen.getByText('Route Error')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Clear Points'})).toBeInTheDocument();
  });

  it('does not show the error when a point is missing', () => {
    const route: PathResult = {success: false, path: [], totalDistance: 0};
    const {container} = render(
      <RouteStatusPanel
        currentRoute={route}
        startPoint={start}
        destinationPoint={null}
        showRoute={true}
        setShowRoute={vi.fn()}
        clearRoute={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
