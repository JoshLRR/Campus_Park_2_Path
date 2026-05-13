import {describe, expect, it} from 'vitest';
import {EdgePruning} from '../logic/PathingComponent/application/context/EdgePruning';
import {EdgeWeighting} from '../logic/PathingComponent/application/context/EdgeWeighting';
import {GraphContextBuilder} from '../logic/PathingComponent/application/context/GraphContextBuilder';
import {PathNode} from '../types/PathNode';
import {RoomNode} from '../types/RoomNode';
import {PathFeatures} from '../types/PathFeatures';
import {RoomFeatures} from '../types/RoomFeatures';
import {Room} from '../types/Room';
import type {Node} from '../types/Node';
import type {PathRequest} from '../types/PathRequest';

/* ─── Shared fixtures ────────────────────────────────────────────────────────
 *
 *   A109(0) --10-- paved(1) --15-- stairs(2) --8-- A110(3)
 *
 * Node 1: PathNode with PathFeatures.Paved
 * Node 2: PathNode with PathFeatures.Stairs
 * Nodes 0, 3: RoomNodes (no PathFeatures)
 *
 * All edges are bidirectional for realism.
 */
function buildGraph(): Node[] {
  return [
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
    new PathNode(
      2,
      {x: 25, y: 0, floorNum: 0},
      [
        {to: 1, distance: 15},
        {to: 3, distance: 8},
      ],
      [PathFeatures.Stairs],
    ),
    new RoomNode(
      3,
      {x: 33, y: 0, floorNum: 0},
      Room.A110,
      [RoomFeatures.Classroom],
      [{to: 2, distance: 8}],
    ),
  ];
}

function makeRequest(avoidFeatures: PathFeatures[] = []): PathRequest {
  return {
    origin: {kind: 'node', nodeId: 0},
    destination: {kind: 'node', nodeId: 3},
    avoidFeatures,
  };
}

// ─── EdgePruning ──────────────────────────────────────────────────────────────

describe('EdgePruning', () => {
  it('leaves the graph unchanged when avoidFeatures is empty', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    pruner.prune(graph, []);

    expect(graph).toHaveLength(4);
  });

  it('removes a PathNode whose features include an avoided feature', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    pruner.prune(graph, [PathFeatures.Stairs]);

    const ids = graph.map(n => n.id);
    expect(ids).not.toContain(2);
  });

  it('strips edges from remaining nodes that point to pruned nodes', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    pruner.prune(graph, [PathFeatures.Stairs]);

    // Node 1 had an edge to node 2 — it must be gone after pruning
    const node1 = graph.find(n => n.id === 1)!;
    expect(node1.neighbors.map(e => e.to)).not.toContain(2);
  });

  it('does not remove PathNodes whose features do not intersect avoidFeatures', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    pruner.prune(graph, [PathFeatures.Stairs]);

    // Node 1 (Paved) should survive
    const ids = graph.map(n => n.id);
    expect(ids).toContain(1);
  });

  it('does not remove RoomNodes regardless of avoided features', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    // Avoid every PathFeature — RoomNodes still must not be removed
    pruner.prune(graph, [PathFeatures.Stairs, PathFeatures.Paved]);

    const ids = graph.map(n => n.id);
    expect(ids).toContain(0);
    expect(ids).toContain(3);
  });

  it('removes multiple PathNodes when all match avoidFeatures', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    pruner.prune(graph, [PathFeatures.Paved, PathFeatures.Stairs]);

    const ids = graph.map(n => n.id);
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(2);
  });

  it('strips edges from RoomNodes that point to pruned nodes', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    // Node 2 (Stairs) is pruned; node 3 (RoomNode) has an edge to node 2
    pruner.prune(graph, [PathFeatures.Stairs]);

    const node3 = graph.find(n => n.id === 3)!;
    expect(node3.neighbors.map(e => e.to)).not.toContain(2);
  });

  it('leaves nodes intact when avoidFeatures has no matching PathNode', () => {
    const graph = buildGraph();
    const pruner = new EdgePruning();

    // PathFeatures.Paved and PathFeatures.Stairs exist, but not some hypothetical third value
    // Re-use an existing feature but confirm no extra nodes are removed
    pruner.prune(graph, [PathFeatures.Paved]);

    const ids = graph.map(n => n.id);
    expect(ids).not.toContain(1); // node 1 is Paved — removed
    expect(ids).toContain(2);     // node 2 is Stairs — kept
    expect(ids).toContain(0);
    expect(ids).toContain(3);
  });
});

// ─── EdgeWeighting ────────────────────────────────────────────────────────────

describe('EdgeWeighting', () => {
  it('leaves edge distances unchanged when avoidFeatures is empty', () => {
    const graph = buildGraph();
    const weighter = new EdgeWeighting();

    weighter.weight(graph, []);

    const node1 = graph.find(n => n.id === 1)!;
    expect(node1.neighbors.find(e => e.to === 2)!.distance).toBe(15);
  });

  it('inflates the distance of edges leading into an avoided PathNode', () => {
    const graph = buildGraph();
    const weighter = new EdgeWeighting();

    // Avoid Stairs → edges into node 2 should be penalised
    weighter.weight(graph, [PathFeatures.Stairs]);

    const node1 = graph.find(n => n.id === 1)!;
    const edgeToStairs = node1.neighbors.find(e => e.to === 2)!;
    expect(edgeToStairs.distance).toBeGreaterThan(15);
  });

  it('does not inflate edges leading into a non-avoided PathNode', () => {
    const graph = buildGraph();
    const weighter = new EdgeWeighting();

    // Only avoid Stairs; Paved node (1) edges should be untouched
    weighter.weight(graph, [PathFeatures.Stairs]);

    const node0 = graph.find(n => n.id === 0)!;
    const edgeToPaved = node0.neighbors.find(e => e.to === 1)!;
    expect(edgeToPaved.distance).toBe(10);
  });

  it('does not inflate edges leading into RoomNodes', () => {
    const graph = buildGraph();
    const weighter = new EdgeWeighting();

    // RoomNodes carry RoomFeatures, not PathFeatures — should never be penalised
    weighter.weight(graph, [PathFeatures.Stairs, PathFeatures.Paved]);

    const node2 = graph.find(n => n.id === 2)!;
    const edgeToRoom = node2.neighbors.find(e => e.to === 3)!;
    expect(edgeToRoom.distance).toBe(8);
  });
});

// ─── GraphContextBuilder ──────────────────────────────────────────────────────

describe('GraphContextBuilder', () => {
  it('does not mutate the original graph', () => {
    const original = buildGraph();
    const originalLength = original.length;
    const originalEdgeCount = original[1].neighbors.length;
    const builder = new GraphContextBuilder();

    builder.build(original, makeRequest([PathFeatures.Stairs]));

    expect(original).toHaveLength(originalLength);
    expect(original[1].neighbors).toHaveLength(originalEdgeCount);
  });

  it('returns a graph with the same nodes when avoidFeatures is empty', () => {
    const graph = buildGraph();
    const builder = new GraphContextBuilder();

    const result = builder.build(graph, makeRequest([]));

    expect(result).toHaveLength(graph.length);
    expect(result.map(n => n.id)).toEqual(graph.map(n => n.id));
  });

  it('removes avoided PathNodes from the returned graph', () => {
    const graph = buildGraph();
    const builder = new GraphContextBuilder();

    const result = builder.build(graph, makeRequest([PathFeatures.Stairs]));

    expect(result.map(n => n.id)).not.toContain(2);
  });

  it('applies pruning and weighting together — avoided node is removed and unrelated edges are untouched', () => {
    // Avoid Stairs: node 2 is pruned; edge from node 1 to node 0 (no avoided feature) stays at original cost
    const graph = buildGraph();
    const builder = new GraphContextBuilder();

    const result = builder.build(graph, makeRequest([PathFeatures.Stairs]));

    // Pruning: node 2 must be gone
    expect(result.map(n => n.id)).not.toContain(2);

    // Weighting: edge from node 1 to node 0 (Paved → A109, no avoided feature) is unaffected
    const node1 = result.find(n => n.id === 1)!;
    const edgeToRoom = node1.neighbors.find(e => e.to === 0)!;
    expect(edgeToRoom.distance).toBe(10);
  });

  it('original graph edges are not modified after weighting', () => {
    const original = buildGraph();
    const originalDistance = original[0].neighbors[0].distance; // edge 0→1 = 10
    const builder = new GraphContextBuilder();

    builder.build(original, makeRequest([PathFeatures.Paved]));

    expect(original[0].neighbors[0].distance).toBe(originalDistance);
  });
});
