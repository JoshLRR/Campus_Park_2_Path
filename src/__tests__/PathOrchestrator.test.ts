import {describe, expect, it, vi} from 'vitest';

vi.mock('../logging/index', () => ({
  appLogger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  },
}));

import {PathOrchestrator} from '../logic/PathingComponent/application/PathOrchestrator';
import type {PathRequest} from '../types/PathRequest';
import type {Node} from '../types/Node';
import {RoomNode} from '../types/RoomNode';
import {PathNode} from '../types/PathNode';
import {RoomFeatures} from '../types/RoomFeatures';
import {PathFeatures} from '../types/PathFeatures';
import {Room} from '../types/Room';

/* ─── Fixtures ──────────────────────────────────────────────────────────────── */

/**
 * Minimal 3-node graph:
 *
 *   A109(0) --10-- junction(1) --15-- A110(2)
 *
 * Node 2 has the Elevator feature for poiType tests.
 * Total cost 0→2: 25.
 */
const TEST_GRAPH: Node[] = [
  new RoomNode(
    0,
    {x: 0, y: 0, floorNum: 0},
    Room.A109,
    [RoomFeatures.Classroom],
    [{to: 1, distance: 10}],
  ),
  new PathNode(
    1,
    {x: 10, y: 0, floorNum: 0},
    [
      {to: 0, distance: 10},
      {to: 2, distance: 15},
    ],
    [PathFeatures.Paved],
  ),
  new RoomNode(
    2,
    {x: 25, y: 0, floorNum: 0},
    Room.A110,
    [RoomFeatures.Elevator],
    [{to: 1, distance: 15}],
  ),
];

function makeRequest(overrides?: Partial<PathRequest>): PathRequest {
  return {
    origin: {kind: 'node', nodeId: 0},
    destination: {kind: 'node', nodeId: 2},
    avoidFeatures: [],
    ...overrides,
  };
}

// ─── Routing — node destination ───────────────────────────────────────────────

describe('resolvePath() — node destination', () => {
  it('returns a found path between two connected nodes', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const result = await orchestrator.resolvePath(makeRequest());

    expect(result).toMatchObject({
      status: 'found',
      nodes: [0, 1, 2],
      totalDistance: 25,
    });
  });

  it('uses origin.nodeId as the start of the path', async () => {
    // Requesting from node 2 back to node 0 should produce the reversed path
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const result = await orchestrator.resolvePath(
      makeRequest({
        origin: {kind: 'node', nodeId: 2},
        destination: {kind: 'node', nodeId: 0},
      }),
    );

    expect(result).toMatchObject({
      status: 'found',
      nodes: [2, 1, 0],
      totalDistance: 25,
    });
  });

  it('returns not_found when the destination node is unreachable', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    // Node 99 does not exist in the graph
    const result = await orchestrator.resolvePath(
      makeRequest({destination: {kind: 'node', nodeId: 99}}),
    );

    expect(result).toMatchObject({status: 'not_found'});
  });
});

// ─── Routing — poiType destination ────────────────────────────────────────────

describe('resolvePath() — poiType destination', () => {
  it('finds the nearest node matching the requested POI type', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const result = await orchestrator.resolvePath(
      makeRequest({destination: {kind: 'poiType', poiType: 'Elevator'}}),
    );

    expect(result).toMatchObject({
      status: 'found',
      nodes: [0, 1, 2],
      totalDistance: 25,
    });
  });

  it('returns not_found when no node has the requested POI type', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const result = await orchestrator.resolvePath(
      makeRequest({destination: {kind: 'poiType', poiType: 'Gym'}}),
    );

    expect(result).toMatchObject({status: 'not_found'});
  });
});

// ─── Coordinate origin (not yet supported) ────────────────────────────────────

describe('resolvePath() — coordinate origin', () => {
  it('throws when origin kind is coordinate', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const request = makeRequest({
      origin: {kind: 'coordinate', position: {x: 5, y: 5, floorNum: 0}},
    });

    await expect(orchestrator.resolvePath(request)).rejects.toThrow();
  });

  it('thrown error message identifies coordinate origin as unsupported', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const request = makeRequest({
      origin: {kind: 'coordinate', position: {x: 5, y: 5, floorNum: 0}},
    });

    await expect(orchestrator.resolvePath(request)).rejects.toThrow(
      'coordinate origin not yet supported',
    );
  });

  it('does not swallow the error — it propagates to the caller', async () => {
    const orchestrator = new PathOrchestrator(TEST_GRAPH);
    const request = makeRequest({
      origin: {kind: 'coordinate', position: {x: 5, y: 5, floorNum: 0}},
    });

    await expect(orchestrator.resolvePath(request)).rejects.toThrow();
  });
});

// ─── TODO: Context Decoration ─────────────────────────────────────────────────

describe('resolvePath() — context decoration (not yet implemented)', () => {
  it.todo('passes the full graph unchanged when avoidFeatures is empty');
  it.todo(
    'excludes edges tagged PathFeatures.Stairs when avoidFeatures contains Stairs',
  );
  it.todo(
    'excludes edges tagged PathFeatures.Covered when avoidFeatures contains Covered',
  );
  it.todo('can exclude multiple feature types simultaneously');
  it.todo('passes the decorated graph (not the raw graph) to the algorithm');
});

// ─── TODO: Path Export ────────────────────────────────────────────────────────

describe('resolvePath() — path export (not yet implemented)', () => {
  it.todo('found result includes human-readable step-by-step directions');
  it.todo('each direction step corresponds to a node transition in the path');
  it.todo('not_found result does not include directions');
});

// ─── TODO: Coordinate origin resolution ──────────────────────────────────────

describe('resolvePath() — coordinate origin resolution (not yet implemented)', () => {
  it.todo(
    'resolves a coordinate origin to the nearest node before invoking the algorithm',
  );
  it.todo('uses the exact node when the coordinate matches a node position');
  it.todo(
    'returns not_found when no node is within a reasonable distance of the coordinate',
  );
});
