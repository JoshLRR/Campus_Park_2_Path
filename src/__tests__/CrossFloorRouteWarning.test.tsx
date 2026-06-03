import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {CrossFloorRouteWarning} from '../components/Map/CrossFloorRouteWarning';
import {GraphNode} from '../components/Map/GraphOverlay';
import {PathResult} from '../components/Map/pathfinding';

const node = (id: number, floorNum: number): GraphNode => ({
  id,
  kind: 'path',
  position: {x: 0, y: 0, floorNum},
  neighbors: [],
});

const graphNodes = [node(1, 1), node(2, 1), node(3, 2)];

describe('CrossFloorRouteWarning', () => {
  it('renders nothing when there is no route', () => {
    const {container} = render(
      <CrossFloorRouteWarning
        currentRoute={null}
        graphNodes={graphNodes}
        currentFloor={1}
        onFloorChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the route fails', () => {
    const route: PathResult = {success: false, path: [], totalDistance: 0};
    const {container} = render(
      <CrossFloorRouteWarning
        currentRoute={route}
        graphNodes={graphNodes}
        currentFloor={1}
        onFloorChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a single-floor route', () => {
    const route: PathResult = {success: true, path: [1, 2], totalDistance: 5};
    const {container} = render(
      <CrossFloorRouteWarning
        currentRoute={route}
        graphNodes={graphNodes}
        currentFloor={1}
        onFloorChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('warns and lists floors when the route spans multiple floors', () => {
    const route: PathResult = {success: true, path: [1, 3], totalDistance: 9};
    const onFloorChange = vi.fn();
    render(
      <CrossFloorRouteWarning
        currentRoute={route}
        graphNodes={graphNodes}
        currentFloor={1}
        onFloorChange={onFloorChange}
      />,
    );
    expect(screen.getByText('Multi-Floor Route')).toBeTruthy();
    expect(screen.getByText(/spans multiple floors: 1, 2/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', {name: 'Floor 2'}));
    expect(onFloorChange).toHaveBeenCalledWith(2);
  });
});
