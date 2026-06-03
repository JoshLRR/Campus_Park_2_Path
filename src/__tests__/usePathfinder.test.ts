import {describe, expect, it} from 'vitest';
import {renderHook} from '@testing-library/react';
import {usePathfinder} from '../hooks/usePathfinder';
import {Pathfinder} from '../components/Map/pathfinding';
import {GraphNode} from '../components/Map/GraphOverlay';

const nodes: GraphNode[] = [
  {id: 1, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
];

describe('usePathfinder', () => {
  it('returns null when there are no graph nodes', () => {
    const {result} = renderHook(() => usePathfinder([]));
    expect(result.current).toBeNull();
  });

  it('returns a Pathfinder instance when nodes are present', () => {
    const {result} = renderHook(() => usePathfinder(nodes));
    expect(result.current).toBeInstanceOf(Pathfinder);
  });

  it('memoizes the instance across re-renders with the same nodes', () => {
    const {result, rerender} = renderHook(
      ({n}) => usePathfinder(n),
      {initialProps: {n: nodes}},
    );
    const first = result.current;
    rerender({n: nodes});
    expect(result.current).toBe(first);
  });

  it('creates a new instance when the nodes array changes', () => {
    const {result, rerender} = renderHook(
      ({n}) => usePathfinder(n),
      {initialProps: {n: nodes}},
    );
    const first = result.current;
    rerender({n: [...nodes]});
    expect(result.current).not.toBe(first);
  });
});
