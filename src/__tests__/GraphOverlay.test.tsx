import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {GraphOverlay, GraphNode} from '../components/Map/GraphOverlay';

const node = (
  id: number,
  kind: 'path' | 'room',
  floorNum: number,
  neighbors: number[] = [],
  extra: Partial<GraphNode> = {},
): GraphNode => ({
  id,
  kind,
  position: {x: id * 10, y: id * 10, floorNum},
  neighbors: neighbors.map(to => ({to, distance: 1})),
  ...extra,
});

function renderOverlay(nodes: GraphNode[], overrides = {}) {
  return render(
    <svg>
      <GraphOverlay
        nodes={nodes}
        worldWidth={1000}
        worldHeight={1000}
        currentFloor={1}
        {...overrides}
      />
    </svg>,
  );
}

describe('GraphOverlay', () => {
  it('only renders nodes on the current floor', () => {
    renderOverlay([node(1, 'path', 1), node(2, 'path', 2)]);
    expect(screen.getByText('N1')).toBeInTheDocument();
    expect(screen.queryByText('N2')).toBeNull();
  });

  it('hides path nodes when showPathNodes is false', () => {
    renderOverlay([node(1, 'path', 1)], {showPathNodes: false});
    expect(screen.queryByText('N1')).toBeNull();
  });

  it('hides room nodes when showRoomNodes is false', () => {
    renderOverlay([node(1, 'room', 1, [], {roomNumber: 'A1'})], {
      showRoomNodes: false,
    });
    expect(screen.queryByText('A1')).toBeNull();
  });

  it('labels rooms by room number and paths by id', () => {
    renderOverlay([
      node(1, 'room', 1, [], {roomNumber: 'A1'}),
      node(2, 'path', 1),
    ]);
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('N2')).toBeInTheDocument();
  });

  it('renders visible path edges as lines', () => {
    const {container} = renderOverlay([
      node(1, 'path', 1, [2]),
      node(2, 'path', 1, [1]),
    ]);
    expect(container.querySelectorAll('line').length).toBeGreaterThan(0);
  });

  it('hides path edges when showPathEdges is false', () => {
    const {container} = renderOverlay(
      [node(1, 'path', 1, [2]), node(2, 'path', 1, [1])],
      {showPathEdges: false},
    );
    expect(container.querySelectorAll('line')).toHaveLength(0);
  });

  it('calls onNodeClick with the node id when a node is clicked', () => {
    const onNodeClick = vi.fn();
    const {container} = renderOverlay([node(7, 'path', 1)], {onNodeClick});
    const circle = container.querySelector('circle[style*="cursor"]')
      || container.querySelector('circle');
    fireEvent.click(circle!);
    expect(onNodeClick).toHaveBeenCalledWith(7);
  });

  it('renders selection highlights for the selected node', () => {
    const {container} = renderOverlay([node(1, 'room', 1, [], {roomNumber: 'A1'})], {
      selectedNodeId: 1,
    });
    // selection adds animated glow rings on top of the base node circle
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(1);
  });
});
