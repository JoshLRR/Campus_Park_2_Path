import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useRouteCalculation} from '../hooks/useRouteCalculation';
import {NavigationPoint} from '../components/Map/MapView';
import {Pathfinder, PathResult} from '../components/Map/pathfinding';

const start: NavigationPoint = {x: 0, y: 0, label: 'A', floor: 1};
const dest: NavigationPoint = {x: 10, y: 10, label: 'B', floor: 1};

function makePathfinder(overrides: Partial<Pathfinder>): Pathfinder {
  return {
    findClosestNode: vi.fn(),
    findPath: vi.fn(),
    ...overrides,
  } as unknown as Pathfinder;
}

describe('useRouteCalculation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('clears the route when inputs are missing', async () => {
    const setCurrentRoute = vi.fn();
    renderHook(() =>
      useRouteCalculation({
        startPoint: null,
        destinationPoint: dest,
        pathfinder: makePathfinder({}),
        setCurrentRoute,
      }),
    );
    await waitFor(() => expect(setCurrentRoute).toHaveBeenCalledWith(null));
  });

  it('sets the computed route when a path is found', async () => {
    const route: PathResult = {
      success: true,
      path: [1, 2, 3],
      totalDistance: 42,
    };
    const pathfinder = makePathfinder({
      findClosestNode: vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(3),
      findPath: vi.fn().mockResolvedValue(route),
    });
    const setCurrentRoute = vi.fn();

    renderHook(() =>
      useRouteCalculation({
        startPoint: start,
        destinationPoint: dest,
        pathfinder,
        setCurrentRoute,
      }),
    );

    await waitFor(() => expect(setCurrentRoute).toHaveBeenCalledWith(route));
    expect(pathfinder.findPath).toHaveBeenCalledWith(1, 3);
  });

  it('reports failure when a nearby node cannot be found', async () => {
    const pathfinder = makePathfinder({
      findClosestNode: vi.fn().mockReturnValue(null),
    });
    const setCurrentRoute = vi.fn();

    renderHook(() =>
      useRouteCalculation({
        startPoint: start,
        destinationPoint: dest,
        pathfinder,
        setCurrentRoute,
      }),
    );

    await waitFor(() =>
      expect(setCurrentRoute).toHaveBeenCalledWith({
        success: false,
        path: [],
        totalDistance: 0,
        message: 'Could not find nearby graph nodes',
      }),
    );
  });

  it('reports failure when pathfinding throws', async () => {
    const pathfinder = makePathfinder({
      findClosestNode: vi.fn().mockReturnValue(1),
      findPath: vi.fn().mockRejectedValue(new Error('boom')),
    });
    const setCurrentRoute = vi.fn();

    renderHook(() =>
      useRouteCalculation({
        startPoint: start,
        destinationPoint: dest,
        pathfinder,
        setCurrentRoute,
      }),
    );

    await waitFor(() =>
      expect(setCurrentRoute).toHaveBeenCalledWith({
        success: false,
        path: [],
        totalDistance: 0,
        message: 'Route calculation failed',
      }),
    );
  });
});
