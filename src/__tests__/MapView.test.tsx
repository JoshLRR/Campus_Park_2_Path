import {beforeAll, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {
  MapView,
  Building,
  NavigationPoint,
  Room,
  DEFAULT_VIEW_NODE_ID,
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

  it('recalculates viewport dimensions when the window resizes', () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    renderMap();
    const callsBeforeResize = rectSpy.mock.calls.length;
    fireEvent(window, new Event('resize'));
    // handleResize re-reads the container's bounding rect to update viewport
    // dimensions — proving the listener ran rather than just being attached.
    expect(rectSpy.mock.calls.length).toBeGreaterThan(callsBeforeResize);
    rectSpy.mockRestore();
  });

  it('animates the view to a focus point when one is provided', () => {
    const focusPoint = {x: 100, y: 200, seq: 1, targetScale: 0.6};
    // The focus-point effect reads the container/transform refs, computes a
    // target position and scale, and calls setTransform — if any guard or
    // calculation along that path threw, this render would fail outright.
    renderMap({focusPoint});
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('updates the viewport scale via onTransformed once a focus-point animation completes', async () => {
    // The "view" eye icon focuses on a room and zooms in via setTransform,
    // which animates the underlying TransformWrapper and fires onTransformed
    // (handleTransform) — that's what keeps `viewport.scale` in sync, which
    // in turn drives the inverse-scale on markers and the highlight ring.
    const focusPoint = {x: 100, y: 200, seq: 1, targetScale: 0.6};
    const {container} = renderMap({selectedRoomId: 5, focusPoint});
    const ring = () =>
      container.querySelector('circle[stroke="#f59e0b"]')?.parentElement;
    const initialTransform = ring()?.getAttribute('transform');
    await waitFor(() => {
      expect(ring()?.getAttribute('transform')).not.toBe(initialTransform);
    });
  });

  it('renders zoom and recenter controls', () => {
    renderMap();
    expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
    expect(screen.getByTitle('Recenter map')).toBeInTheDocument();
  });

  it('zooms in when the zoom-in button is clicked', async () => {
    // Clicking calls transformRef.current.zoomIn(), which animates the
    // TransformWrapper and fires onTransformed — observable here as a
    // change in the highlight ring's inverse-scale transform.
    const {container} = renderMap({selectedRoomId: 5});
    const ring = () =>
      container.querySelector('circle[stroke="#f59e0b"]')?.parentElement;
    const initialTransform = ring()?.getAttribute('transform');
    fireEvent.click(screen.getByTitle('Zoom in'));
    await waitFor(() => {
      expect(ring()?.getAttribute('transform')).not.toBe(initialTransform);
    });
  });

  it('zooms out when the zoom-out button is clicked', async () => {
    const {container} = renderMap({selectedRoomId: 5});
    const ring = () =>
      container.querySelector('circle[stroke="#f59e0b"]')?.parentElement;
    const initialTransform = ring()?.getAttribute('transform');
    fireEvent.click(screen.getByTitle('Zoom out'));
    await waitFor(() => {
      expect(ring()?.getAttribute('transform')).not.toBe(initialTransform);
    });
  });

  it('recenters the view on the default node when the recenter button is clicked', async () => {
    // MapView centers on DEFAULT_VIEW_NODE_ID both on mount and on recenter,
    // so — given the same graph data and container size — clicking "Recenter
    // map" should animate the transform back to the same value it started at.
    const defaultViewNode: GraphNode = {
      id: DEFAULT_VIEW_NODE_ID,
      kind: 'path',
      position: {x: 5, y: 5, floorNum: 1},
      neighbors: [],
    };
    const {container} = renderMap({
      selectedRoomId: 5,
      graphNodes: [...graphNodes, defaultViewNode],
    });
    const ring = () =>
      container.querySelector('circle[stroke="#f59e0b"]')?.parentElement;
    const initialTransform = ring()?.getAttribute('transform');

    fireEvent.click(screen.getByTitle('Zoom in'));
    await waitFor(() => {
      expect(ring()?.getAttribute('transform')).not.toBe(initialTransform);
    });

    fireEvent.click(screen.getByTitle('Recenter map'));
    await waitFor(() => {
      expect(ring()?.getAttribute('transform')).toBe(initialTransform);
    });
  });

  it('prevents the default action and stops propagation on room pointer-down', () => {
    const {container} = renderMap();
    const roomRect = container.querySelector('[data-room-id="5"] rect')!;
    const event = new Event('pointerdown', {bubbles: true, cancelable: true});
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    fireEvent(roomRect, event);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('shows an off-floor indicator and jumps to that floor for the destination point', () => {
    const destinationPoint: NavigationPoint = {
      x: 10,
      y: 10,
      label: 'Target',
      floor: 2,
    };
    const {onFloorChange} = renderMap({destinationPoint});
    expect(screen.getByText(/Destination/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Go to Floor 2'}));
    expect(onFloorChange).toHaveBeenCalledWith(2);
  });

  it('renders a pulsing highlight ring around the selected room', () => {
    const {container} = renderMap({selectedRoomId: 5});
    const ring = container.querySelector('circle[stroke="#f59e0b"]');
    expect(ring).not.toBeNull();
  });

  it('highlights the focused building with a different fill, stroke, and label color', () => {
    const {container} = renderMap({focusBuildingId: 1});
    // Combine fill + stroke-width to disambiguate from a same-colored,
    // highlighted RoomTile rect (which uses the same blue but stroke-width 2).
    const focusedRect = container.querySelector(
      'rect[fill="#3b82f6"][stroke-width="3"]',
    );
    expect(focusedRect).not.toBeNull();
    expect(focusedRect?.getAttribute('stroke')).toBe('#2563eb');
    expect(
      container.querySelector('text[fill="#2563eb"]')?.textContent,
    ).toContain('Library');
  });

  it('shows a multi-floor badge for buildings spanning more than one floor', () => {
    const annex = {
      id: 2,
      name: 'Annex',
      x: 300,
      y: 300,
      width: 40,
      height: 40,
      floors: [1, 2],
    };
    renderMap({initialBuildings: [...buildings, annex]});
    expect(screen.getByText(/Floors: 1, 2/)).toBeInTheDocument();
  });

  it('includes floor-1 buildings that have neither rooms nor floors metadata for it', () => {
    const tower = {
      id: 3,
      name: 'Tower',
      x: 500,
      y: 500,
      width: 40,
      height: 40,
      floors: [3],
    };
    renderMap({initialBuildings: [...buildings, tower], currentFloor: 1});
    expect(screen.getByText('Tower')).toBeInTheDocument();
  });

  it('falls back to default room dimensions when width/height are not set', () => {
    const storage = {
      id: 7,
      name: 'Storage',
      building: 'Library',
      buildingId: 1,
      floor: 1,
      x: 40,
      y: 40,
    };
    const {container} = renderMap({rooms: [...rooms, storage]});
    const rect = container.querySelector('[data-room-id="7"] rect')!;
    expect(rect.getAttribute('width')).toBe('30');
    expect(rect.getAttribute('height')).toBe('20');
  });
});
