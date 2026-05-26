/**
 * useRouteCalculation.ts
 *
 * Calculates the current route when both a start point and destination point
 * are selected.
 *
 * This hook was extracted from App.tsx without changing behavior.
 */

import {useEffect} from 'react';
import {NavigationPoint} from '../components/Map/MapView';
import {Pathfinder, PathResult} from '../components/Map/pathfinding';

type UseRouteCalculationProps = {
  startPoint: NavigationPoint | null;
  destinationPoint: NavigationPoint | null;
  pathfinder: Pathfinder | null;
  setCurrentRoute: (route: PathResult | null) => void;
};

export function useRouteCalculation({
  startPoint,
  destinationPoint,
  pathfinder,
  setCurrentRoute,
}: UseRouteCalculationProps) {
  useEffect(() => {
    const calculateRoute = async () => {
      if (!startPoint || !destinationPoint || !pathfinder) {
        setCurrentRoute(null);
        return;
      }

      try {
        // Find closest graph nodes to start and destination points
        const startNodeId = pathfinder.findClosestNode(
          startPoint.x,
          startPoint.y,
          startPoint.floor || 1,
        );

        const endNodeId = pathfinder.findClosestNode(
          destinationPoint.x,
          destinationPoint.y,
          destinationPoint.floor || 1,
        );

        if (startNodeId === null || endNodeId === null) {
          setCurrentRoute({
            success: false,
            path: [],
            totalDistance: 0,
            message: 'Could not find nearby graph nodes',
          });
          return;
        }

        const route = await pathfinder.findPath(startNodeId, endNodeId);
        setCurrentRoute(route);
      } catch (error) {
        console.error('Route calculation failed:', error);
        setCurrentRoute({
          success: false,
          path: [],
          totalDistance: 0,
          message: 'Route calculation failed',
        });
      }
    };

    void calculateRoute();
  }, [startPoint, destinationPoint, pathfinder, setCurrentRoute]);
}
