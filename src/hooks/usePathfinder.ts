/**
 * usePathfinder.ts
 *
 * Creates the Pathfinder instance used by the map routing flow.
 *
 * This hook was extracted from App.tsx without changing behavior.
 */

import {useMemo} from 'react';
import {GraphNode} from '../components/Map/GraphOverlay';
import {Pathfinder} from '../components/Map/pathfinding';

export function usePathfinder(graphNodes: GraphNode[]): Pathfinder | null {
  return useMemo(() => {
    return graphNodes.length > 0 ? new Pathfinder(graphNodes) : null;
  }, [graphNodes]);
}
