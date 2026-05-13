import {describe, expect, it} from 'vitest';
import {EdgeWeighting} from '../logic/PathingComponent/application/context/EdgeWeighting';
import {PathNode} from '../types/PathNode';
import {RoomNode} from '../types/RoomNode';
import {PathFeatures} from '../types/PathFeatures';
import {Room} from '../types/Room';
import {RoomFeatures} from '../types/RoomFeatures';
import type {Node} from '../types/Node';

/* ─── Shared fixture ────────────────────────────────────────────────────────
 *
 *   A109(0) --10-- paved(1) --15-- stairs(2) --8-- A110(3)
 *
 * Node 0: RoomNode (A109)
 * Node 1: PathNode [Paved]
 * Node 2: PathNode [Stairs]
 * Node 3: RoomNode (A110)
 *
 * All edges are bidirectional.
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

describe('EdgeWeighting', () => {
  // ── No-op cases ────────────────────────────────────────────────────────────

  it('leaves all edge distances unchanged when avoidFeatures is empty', () => {
    const graph = buildGraph();
    new EdgeWeighting().weight(graph, []);

    expect(graph[0].neighbors[0].distance).toBe(10); // 0→1
    expect(graph[1].neighbors[0].distance).toBe(10); // 1→0
    expect(graph[1].neighbors[1].distance).toBe(15); // 1→2
    expect(graph[2].neighbors[0].distance).toBe(15); // 2→1
    expect(graph[2].neighbors[1].distance).toBe(8);  // 2→3
    expect(graph[3].neighbors[0].distance).toBe(8);  // 3→2
  });

  it('leaves all edge distances unchanged when no PathNode carries an avoided feature', () => {
    const graph = buildGraph();
    // PathFeatures.Covered and PathFeatures.Dirt are not present in the fixture
    new EdgeWeighting().weight(graph, [PathFeatures.Covered, PathFeatures.Dirt]);

    expect(graph[0].neighbors[0].distance).toBe(10);
    expect(graph[1].neighbors[1].distance).toBe(15);
    expect(graph[2].neighbors[1].distance).toBe(8);
  });

  // ── Penalty application ────────────────────────────────────────────────────

  it('inflates edges into an avoided PathNode by exactly 10×', () => {
    const graph = buildGraph();
    new EdgeWeighting().weight(graph, [PathFeatures.Stairs]);

    // Edge 1→2 was 15; node 2 (Stairs) is avoided → 15 × 10 = 150
    const edgeFrom1 = graph[1].neighbors.find(e => e.to === 2)!;
    expect(edgeFrom1.distance).toBe(150);
  });

  it('inflates all edges whose destination matches an avoided feature', () => {
    const graph = buildGraph();
    new EdgeWeighting().weight(graph, [PathFeatures.Stairs]);

    // Both edges leading *into* node 2 should be penalised
    const edgeFrom1 = graph[1].neighbors.find(e => e.to === 2)!; // 15 → 150
    const edgeFrom3 = graph[3].neighbors.find(e => e.to === 2)!; // 8  → 80
    expect(edgeFrom1.distance).toBe(150);
    expect(edgeFrom3.distance).toBe(80);
  });

  it('inflates edges for every avoided PathNode when multiple features are specified', () => {
    const graph = buildGraph();
    new EdgeWeighting().weight(graph, [PathFeatures.Paved, PathFeatures.Stairs]);

    // Edges into node 1 (Paved): 0→1 = 10 → 100, 2→1 = 15 → 150
    expect(graph[0].neighbors.find(e => e.to === 1)!.distance).toBe(100);
    expect(graph[2].neighbors.find(e => e.to === 1)!.distance).toBe(150);

    // Edges into node 2 (Stairs): 1→2 = 15 → 150, 3→2 = 8 → 80
    expect(graph[1].neighbors.find(e => e.to === 2)!.distance).toBe(150);
    expect(graph[3].neighbors.find(e => e.to === 2)!.distance).toBe(80);
  });

  // ── Non-avoided nodes are untouched ────────────────────────────────────────

  it('does not inflate edges into a PathNode whose features do not intersect avoidFeatures', () => {
    const graph = buildGraph();
    new EdgeWeighting().weight(graph, [PathFeatures.Stairs]);

    // Node 1 is Paved, not Stairs — edges into it must be unchanged
    expect(graph[0].neighbors.find(e => e.to === 1)!.distance).toBe(10);
    expect(graph[2].neighbors.find(e => e.to === 1)!.distance).toBe(15);
  });

  it('does not inflate edges into RoomNodes regardless of avoidFeatures', () => {
    const graph = buildGraph();
    // Avoid every PathFeature in the graph — RoomNodes must never be penalised
    new EdgeWeighting().weight(graph, [PathFeatures.Paved, PathFeatures.Stairs]);

    // Edge 2→3 leads into a RoomNode — must stay at 8
    expect(graph[2].neighbors.find(e => e.to === 3)!.distance).toBe(8);
    // Edge 1→0 leads into a RoomNode — must stay at 10
    expect(graph[1].neighbors.find(e => e.to === 0)!.distance).toBe(10);
  });

  // ── PathNode with multiple features ────────────────────────────────────────

  it('inflates edges into a PathNode that carries multiple features when any one matches', () => {
    const multiFeatureNode = new PathNode(
      4,
      {x: 50, y: 0, floorNum: 0},
      [],
      [PathFeatures.Paved, PathFeatures.Covered],
    );
    const source = new PathNode(
      5,
      {x: 40, y: 0, floorNum: 0},
      [{to: 4, distance: 20}],
      [],
    );
    const graph: Node[] = [source, multiFeatureNode];

    new EdgeWeighting().weight(graph, [PathFeatures.Covered]);

    expect(graph[0].neighbors.find(e => e.to === 4)!.distance).toBe(200); // 20 × 10
  });

  // ── Isolation ──────────────────────────────────────────────────────────────

  it('does not modify edge distances on nodes with no outgoing edges into avoided nodes', () => {
    const graph = buildGraph();
    new EdgeWeighting().weight(graph, [PathFeatures.Stairs]);

    // Node 0 only has an edge to node 1 (Paved, not avoided)
    expect(graph[0].neighbors[0].distance).toBe(10);
  });
});
