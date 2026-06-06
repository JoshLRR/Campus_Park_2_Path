import {beforeAll, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {
  MapView,
  Building,
  NavigationPoint,
  Room,
} from '../components/Map/MapView';
import {GraphNode} from '../components/Map/GraphOverlay';
import {PathResult} from '../components/Map/pathfinding';

// react-zoom-pan-pinch and the tile system rely on browser APIs that jsdom
// does not implement. Polyfill the minimum needed to render without crashing.
beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

const buildings: (Building & {id: number})[] = [
  {id: 1, name: 'Library', x: 100, y: 100, width: 50, height: 50, floors: [1]},
];

const rooms: (Room & {id: number})[] = [
  {
    id: 5,
    name: 'Lab',
    building: 'Library',
    buildingId: 1,
    floor: 1,
    x: 5,
    y: 5,
    width: 30,
    height: 20,
  },
  {
    id: 6,
    name: 'Attic',
    building: 'Library',
    buildingId: 1,
    floor: 2,
    x: 5,
    y: 5,
  },
];

const graphNodes: GraphNode[] = [
  {
    id: 1,
    kind: 'path',
    position: {x: 1, y: 1, floorNum: 1},
    neighbors: [{to: 2, distance: 1}],
  },
  {
    id: 2,
    kind: 'path',
    position: {x: 2, y: 2, floorNum: 1},
    neighbors: [{to: 1, distance: 1}],
  },
];

function renderMap(overrides = {}) {
  const handlers = {
    onRoomSelect: vi.fn(),
    onGraphNodeSelect: vi.fn(),
    onFloorChange: vi.fn(),
    onStartPointClear: vi.fn(),
    onDestinationPointClear: vi.fn(),
  };
  const result = render(
    <MapView
      initialBuildings={buildings}
      rooms={rooms}
      graphNodes={graphNodes}
      currentFloor={1}
      availableFloors={[1, 2]}
      {...handlers}
      {...overrides}
    />,
  );
  return {...handlers, ...result};
}

describe('MapView', () => {
  it('renders without crashing with minimal required props', () => {
    const {container} = render(
      <MapView
        initialBuildings={buildings}
        currentFloor={1}
        availableFloors={[1]}
      />,
    );
    expect(container.querySelector('div')).not.toBeNull();
  });

  it('renders the building and only current-floor rooms', () => {
    renderMap();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Lab')).toBeInTheDocument();
    expect(screen.queryByText('Attic')).toBeNull();
  });

  it('selects a room when its tile is clicked', () => {
    const {onRoomSelect, container} = renderMap();
    const roomRect = container.querySelector('[data-room-id="5"] rect')!;
    fireEvent.click(roomRect);
    expect(onRoomSelect).toHaveBeenCalledWith(5);
  });

  it('changes floor from the floor selector', () => {
    const {onFloorChange} = renderMap();
    fireEvent.click(screen.getByTitle('Floor 2'));
    expect(onFloorChange).toHaveBeenCalledWith(2);
  });

  it('renders start and destination markers on the current floor', () => {
    const startPoint: NavigationPoint = {
      x: 10,
      y: 10,
      label: 'Origin',
      floor: 1,
    };
    const destinationPoint: NavigationPoint = {
      x: 20,
      y: 20,
      label: 'Target',
      floor: 1,
    };
    const {container} = renderMap({startPoint, destinationPoint});
    const titles = Array.from(container.querySelectorAll('title')).map(
      t => t.textContent,
    );
    expect(titles).toContain('Start Point: Origin');
    expect(titles).toContain('Destination: Target');
  });

  it('shows an off-floor indicator and jumps to that floor', () => {
    const startPoint: NavigationPoint = {
      x: 10,
      y: 10,
      label: 'Origin',
      floor: 2,
    };
    const {onFloorChange} = renderMap({startPoint});
    expect(screen.getByText(/Start point/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Go to Floor 2'}));
    expect(onFloorChange).toHaveBeenCalledWith(2);
  });

  it('renders the route overlay when a successful route is shown', () => {
    const currentRoute: PathResult = {
      success: true,
      path: [1, 2],
      totalDistance: 5,
    };
    const {container} = renderMap({currentRoute, showRoute: true});
    // RouteOverlay renders a casing + main path in Google blue
    const paths = Array.from(container.querySelectorAll('path'));
    expect(paths.some(p => p.getAttribute('stroke') === '#4285f4')).toBe(true);
  });
});
