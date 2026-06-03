import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {GraphNetworkPanel} from '../components/Map/GraphNetworkPanel';
import {GraphNode} from '../components/Map/GraphOverlay';
import {Pathfinder} from '../components/Map/pathfinding';

const nodes: GraphNode[] = [
  {
    id: 1,
    kind: 'room',
    position: {x: 1.2, y: 3.4, floorNum: 1},
    neighbors: [{to: 2, distance: 1}],
    roomNumber: 'A1',
  },
  {id: 2, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: [{to: 1, distance: 1}]},
];

const floorStats = {nodes: 2, pathNodes: 1, roomNodes: 1, rooms: 1};

function renderPanel(overrides = {}) {
  const setShowGraphDebug = vi.fn();
  render(
    <GraphNetworkPanel
      graphNodes={nodes}
      floorStats={floorStats}
      currentFloor={1}
      availableFloors={[1, 2]}
      pathfinder={new Pathfinder(nodes)}
      showGraphDebug={false}
      setShowGraphDebug={setShowGraphDebug}
      {...overrides}
    />,
  );
  return setShowGraphDebug;
}

describe('GraphNetworkPanel', () => {
  it('summarizes node counts and hides debug when off', () => {
    renderPanel({showGraphDebug: false});
    expect(screen.getByText(/2 nodes total/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Debug OFF'})).toBeInTheDocument();
    expect(screen.queryByText('Debug Info')).toBeNull();
  });

  it('toggles debug mode when the button is clicked', () => {
    const setShowGraphDebug = renderPanel({showGraphDebug: false});
    fireEvent.click(screen.getByRole('button', {name: 'Debug OFF'}));
    expect(setShowGraphDebug).toHaveBeenCalledWith(true);
  });

  it('shows debug details including a sample node when on', () => {
    renderPanel({showGraphDebug: true});
    expect(screen.getByText('Debug Info')).toBeInTheDocument();
    expect(screen.getByText('Sample Node:')).toBeInTheDocument();
    const debug = screen.getByText('Debug Info').closest('div')!;
    expect(debug).toHaveTextContent('Total Edges: 2');
    expect(debug).toHaveTextContent('Avg Connections per Node: 1.0');
    expect(debug).toHaveTextContent('Pathfinder Status: Ready');
  });

  it('reports the pathfinder as loading when null', () => {
    renderPanel({showGraphDebug: true, pathfinder: null});
    expect(screen.getByText('Debug Info').closest('div')!).toHaveTextContent(
      'Pathfinder Status: Loading...',
    );
  });
});
