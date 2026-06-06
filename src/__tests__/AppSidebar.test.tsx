import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {AppSidebar} from '../components/AppSidebar';

function buildProps(overrides = {}) {
  return {
    isLeftSidebarOpen: true,
    setIsLeftSidebarOpen: vi.fn(),
    currentFloor: 1,
    floorStats: {nodes: 0, pathNodes: 0, roomNodes: 0, rooms: 0},
    availableFloors: [1],
    handleFloorChange: vi.fn(),
    currentRoute: null,
    graphNodes: [],
    showPathNodes: true,
    setShowPathNodes: vi.fn(),
    showRoomNodes: true,
    setShowRoomNodes: vi.fn(),
    showPathEdges: true,
    setShowPathEdges: vi.fn(),
    showRoomConnections: true,
    setShowRoomConnections: vi.fn(),
    showRoute: true,
    setShowRoute: vi.fn(),
    startPoint: null,
    destinationPoint: null,
    clearRoute: vi.fn(),
    pathfinder: null,
    showGraphDebug: false,
    setShowGraphDebug: vi.fn(),
    clearStartPoint: vi.fn(),
    clearDestination: vi.fn(),
    selectedGraphNode: null,
    clearSelection: vi.fn(),
    handleSetStartPointFromNode: vi.fn(),
    handleSetDestinationFromNode: vi.fn(),
    rooms: [],
    isRightPanelOpen: true,
    setIsRightPanelOpen: vi.fn(),
    handleSetStartPoint: vi.fn(),
    handleSetDestination: vi.fn(),
    handleRoomSelect: vi.fn(),
    selectedRoom: null,
    ...overrides,
  };
}

describe('AppSidebar', () => {
  it('renders the header and composed child panels', () => {
    render(<AppSidebar {...buildProps()} />);
    expect(screen.getByText('Campus Navigator')).toBeInTheDocument();
    expect(screen.getByText('Floor 1')).toBeInTheDocument();
    expect(screen.getByText('Graph Display')).toBeInTheDocument();
    expect(screen.getByText('Graph Network')).toBeInTheDocument();
    expect(screen.getByText('Room Search')).toBeInTheDocument();
  });

  it('closes the sidebar via the × button', () => {
    const setIsLeftSidebarOpen = vi.fn();
    render(<AppSidebar {...buildProps({setIsLeftSidebarOpen})} />);
    fireEvent.click(screen.getByTitle('Close sidebar'));
    expect(setIsLeftSidebarOpen).toHaveBeenCalledWith(false);
  });
});
