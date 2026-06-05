import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {GraphDisplayControls} from '../components/Map/GraphDisplayControls';

function setup(overrides = {}) {
  const setters = {
    setShowPathNodes: vi.fn(),
    setShowRoomNodes: vi.fn(),
    setShowPathEdges: vi.fn(),
    setShowRoomConnections: vi.fn(),
    setShowRoute: vi.fn(),
  };
  render(
    <GraphDisplayControls
      showPathNodes={true}
      showRoomNodes={true}
      showPathEdges={true}
      showRoomConnections={true}
      showRoute={true}
      {...setters}
      {...overrides}
    />,
  );
  return setters;
}

describe('GraphDisplayControls', () => {
  it('reflects checkbox state and toggles a layer on change', () => {
    const setters = setup({showPathNodes: true});
    const pathNodes = screen.getByRole('checkbox', {name: /Show Path Nodes/});
    expect(pathNodes).toBeChecked();
    fireEvent.click(pathNodes);
    expect(setters.setShowPathNodes).toHaveBeenCalledWith(false);
  });

  it('Show All enables every layer', () => {
    const setters = setup();
    fireEvent.click(screen.getByRole('button', {name: 'Show All'}));
    expect(setters.setShowPathNodes).toHaveBeenCalledWith(true);
    expect(setters.setShowRoomNodes).toHaveBeenCalledWith(true);
    expect(setters.setShowPathEdges).toHaveBeenCalledWith(true);
    expect(setters.setShowRoomConnections).toHaveBeenCalledWith(true);
    expect(setters.setShowRoute).toHaveBeenCalledWith(true);
  });

  it('Hide All disables every layer', () => {
    const setters = setup();
    fireEvent.click(screen.getByRole('button', {name: 'Hide All'}));
    expect(setters.setShowPathNodes).toHaveBeenCalledWith(false);
    expect(setters.setShowRoomNodes).toHaveBeenCalledWith(false);
    expect(setters.setShowPathEdges).toHaveBeenCalledWith(false);
    expect(setters.setShowRoomConnections).toHaveBeenCalledWith(false);
    expect(setters.setShowRoute).toHaveBeenCalledWith(false);
  });
});
