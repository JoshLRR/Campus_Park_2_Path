import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {RouteOverlay} from '../components/Map/RouteOverlay';
import {GraphNode} from '../components/Map/GraphOverlay';

const identity = (p: {x: number; y: number}) => ({x: p.x, y: p.y});

const node = (
  id: number,
  floorNum: number,
  neighbors: number[],
  extra: Partial<GraphNode> = {},
): GraphNode => ({
  id,
  kind: 'path',
  position: {x: id * 10, y: id * 5, floorNum},
  neighbors: neighbors.map(to => ({to, distance: 1})),
  ...extra,
});

const svg = (child: React.ReactNode) => <svg>{child}</svg>;

describe('RouteOverlay', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('renders nothing for a route shorter than two nodes', () => {
    const {container} = render(
      svg(
        <RouteOverlay
          nodes={[node(1, 1, [])]}
          routePath={[1]}
          scalePosition={identity}
          currentFloor={1}
        />,
      ),
    );
    expect(container.querySelector('g')).toBeNull();
  });

  it('draws the route path and start/destination labels on the current floor', () => {
    const nodes = [
      node(1, 1, [2], {kind: 'room', roomNumber: 'A1'}),
      node(2, 1, [1], {kind: 'room', roomNumber: 'B2'}),
    ];
    const {container} = render(
      svg(
        <RouteOverlay
          nodes={nodes}
          routePath={[1, 2]}
          scalePosition={identity}
          totalDistance={12}
          currentFloor={1}
        />,
      ),
    );
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('START')).toBeInTheDocument();
    expect(screen.getByText('DESTINATION')).toBeInTheDocument();
  });

  it('shows a cross-floor message when the route is on other floors', () => {
    const nodes = [node(1, 1, [2]), node(2, 1, [1, 3]), node(3, 2, [2])];
    render(
      svg(
        <RouteOverlay
          nodes={nodes}
          routePath={[1, 2, 3]}
          scalePosition={identity}
          currentFloor={2}
        />,
      ),
    );
    expect(
      screen.getByText('Route continues on other floors'),
    ).toBeInTheDocument();
  });

  it('renders nothing when segments have no edge and no other floor exists', () => {
    // both nodes on the current floor but with no edge between them
    const nodes = [node(1, 1, []), node(2, 1, [])];
    const {container} = render(
      svg(
        <RouteOverlay
          nodes={nodes}
          routePath={[1, 2]}
          scalePosition={identity}
          currentFloor={1}
        />,
      ),
    );
    expect(container.querySelector('g')).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});
