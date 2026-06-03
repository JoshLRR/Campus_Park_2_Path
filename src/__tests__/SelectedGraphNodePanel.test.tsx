import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {SelectedGraphNodePanel} from '../components/Map/SelectedGraphNodePanel';
import {GraphNode} from '../components/Map/GraphOverlay';

const node: GraphNode = {
  id: 7,
  kind: 'room',
  position: {x: 1.25, y: 2.75, floorNum: 3},
  neighbors: [{to: 1, distance: 5}],
  features: [10, 20],
  roomNumber: 'B201',
};

describe('SelectedGraphNodePanel', () => {
  it('renders nothing when no node is selected', () => {
    const {container} = render(
      <SelectedGraphNodePanel
        selectedGraphNode={null}
        clearSelection={vi.fn()}
        onSetStartPoint={vi.fn()}
        onSetDestination={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders node details, features, and wires the buttons', () => {
    const onSetStartPoint = vi.fn();
    const onSetDestination = vi.fn();
    render(
      <SelectedGraphNodePanel
        selectedGraphNode={node}
        clearSelection={vi.fn()}
        onSetStartPoint={onSetStartPoint}
        onSetDestination={onSetDestination}
      />,
    );
    expect(screen.getByText('B201')).toBeInTheDocument();
    expect(screen.getByText(/Type: room/)).toBeInTheDocument();
    expect(screen.getByText(/Position: \(1.3, 2.8\)/)).toBeInTheDocument();
    expect(screen.getByText(/Features: 10, 20/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Set as Start'}));
    expect(onSetStartPoint).toHaveBeenCalledWith(node);
    fireEvent.click(screen.getByRole('button', {name: 'Set as Destination'}));
    expect(onSetDestination).toHaveBeenCalledWith(node);
  });

  it('falls back to a generated label and omits features when absent', () => {
    const bare: GraphNode = {
      id: 42,
      kind: 'path',
      position: {x: 0, y: 0, floorNum: 1},
      neighbors: [],
    };
    render(
      <SelectedGraphNodePanel
        selectedGraphNode={bare}
        clearSelection={vi.fn()}
        onSetStartPoint={vi.fn()}
        onSetDestination={vi.fn()}
      />,
    );
    expect(screen.getByText('Node 42')).toBeInTheDocument();
    expect(screen.queryByText(/Features:/)).toBeNull();
  });
});
