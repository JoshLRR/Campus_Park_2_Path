/**
 * buildDirections.test.ts
 *
 * Unit tests for the distance-based "Continue straight" reminder in
 * `buildDirections` (src/logic/buildDirections.ts) — it should fire once
 * accumulated walking distance since the last instruction exceeds
 * STRAIGHT_RUN_DISTANCE_THRESHOLD (75m), and reset the accumulator.
 */

import {expect, test} from 'vitest';
import {buildDirections} from '../logic/buildDirections';
import {GraphNode} from '../components/Map/GraphOverlay';

function pathNode(
  id: number,
  x: number,
  y: number,
  neighbors: Array<{to: number; distance: number}>,
): GraphNode {
  return {id, kind: 'path', position: {x, y, floorNum: 1}, neighbors};
}

test('emits "Continue straight" only once accumulated distance exceeds the threshold, then resets', () => {
  // Five colinear nodes (no turns) along x=0, walked in a straight line:
  // accDistance after each hop: 35, 75 (at threshold — no reminder yet),
  // 85 (over threshold — reminder fires here, then resets), 10 (post-reset).
  const nodes: GraphNode[] = [
    pathNode(1, 0, 0, [{to: 2, distance: 35}]),
    pathNode(2, 0, 35, [{to: 3, distance: 40}]),
    pathNode(3, 0, 75, [{to: 4, distance: 10}]),
    pathNode(4, 0, 85, [{to: 5, distance: 10}]),
    pathNode(5, 0, 95, []),
  ];

  const steps = buildDirections([1, 2, 3, 4, 5], nodes, 'Start', 'Destination');

  expect(steps.map(s => ({kind: s.kind, distanceTo: s.distanceTo}))).toEqual([
    {kind: 'start', distanceTo: 0},
    {kind: 'straight', distanceTo: 85},
    {kind: 'destination', distanceTo: 10},
  ]);
  expect(steps[1].label).toBe('Continue straight');
  expect(steps[1].nodeId).toBe(4);
});

test('does not emit "Continue straight" for runs that stay within the threshold', () => {
  // Three colinear nodes; total straight-line distance is well under 75m.
  const nodes: GraphNode[] = [
    pathNode(1, 0, 0, [{to: 2, distance: 20}]),
    pathNode(2, 0, 20, [{to: 3, distance: 20}]),
    pathNode(3, 0, 40, []),
  ];

  const steps = buildDirections([1, 2, 3], nodes, 'Start', 'Destination');

  expect(steps.map(s => s.kind)).toEqual(['start', 'destination']);
});
