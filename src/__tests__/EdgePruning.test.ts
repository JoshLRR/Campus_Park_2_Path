import {describe, expect, it} from 'vitest';
import {EdgePruning} from '../logic/PathingComponent/application/context/EdgePruning';
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

describe('EdgePruning', () => {
  // ── No-op cases ─────────────────────────────────────────────────────────────

  it('leaves the graph unchanged when avoidFeatures is empty', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, []);

    expect(graph).toHaveLength(4);
    expect(graph.map(n => n.id)).toEqual([0, 1, 2, 3]);
  });

  it('leaves edge counts unchanged when avoidFeatures is empty', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, []);

    expect(graph[1].neighbors).toHaveLength(2);
    expect(graph[2].neighbors).toHaveLength(2);
  });

  it('leaves the graph unchanged when no PathNode carries an avoided feature', () => {
    const graph = buildGraph();
    // PathFeatures.Covered and PathFeatures.Dirt are absent from the fixture
    new EdgePruning().prune(graph, [PathFeatures.Covered, PathFeatures.Dirt]);

    expect(graph).toHaveLength(4);
    expect(graph.map(n => n.id)).toEqual([0, 1, 2, 3]);
  });

  // ── Node removal ─────────────────────────────────────────────────────────────

  it('removes a PathNode whose features include an avoided feature', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    expect(graph.map(n => n.id)).not.toContain(2);
  });

  it('removes a PathNode matched by a single feature even when it has multiple features', () => {
    const multiFeatureNode = new PathNode(
      4,
      {x: 50, y: 0, floorNum: 0},
      [],
      [PathFeatures.Paved, PathFeatures.Covered],
    );
    const graph: Node[] = [multiFeatureNode];

    new EdgePruning().prune(graph, [PathFeatures.Covered]);

    expect(graph).toHaveLength(0);
  });

  it('removes all PathNodes whose features overlap avoidFeatures', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Paved, PathFeatures.Stairs]);

    const ids = graph.map(n => n.id);
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(2);
  });

  it('preserves PathNodes whose features do not intersect avoidFeatures', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    expect(graph.map(n => n.id)).toContain(1); // node 1 is Paved, not Stairs
  });

  // ── RoomNode protection ──────────────────────────────────────────────────────

  it('never removes RoomNodes regardless of avoidFeatures', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Paved, PathFeatures.Stairs]);

    const ids = graph.map(n => n.id);
    expect(ids).toContain(0);
    expect(ids).toContain(3);
  });

  // ── Edge cleanup ─────────────────────────────────────────────────────────────

  it('strips edges from a PathNode that point to a pruned node', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    // Node 1 had an edge to node 2 — must be gone after pruning
    const node1 = graph.find(n => n.id === 1)!;
    expect(node1.neighbors.map(e => e.to)).not.toContain(2);
  });

  it('strips edges from a RoomNode that point to a pruned node', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    // Node 3 had an edge to node 2 — must be gone after pruning
    const node3 = graph.find(n => n.id === 3)!;
    expect(node3.neighbors.map(e => e.to)).not.toContain(2);
  });

  it('retains edges that do not point to pruned nodes', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    // Node 1 still has an edge to node 0 (not pruned)
    const node1 = graph.find(n => n.id === 1)!;
    expect(node1.neighbors.map(e => e.to)).toContain(0);
  });

  it('removes all edges pointing to pruned nodes when multiple nodes are pruned', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Paved, PathFeatures.Stairs]);

    // Only RoomNodes 0 and 3 remain; both had edges exclusively into pruned nodes
    const node0 = graph.find(n => n.id === 0)!;
    const node3 = graph.find(n => n.id === 3)!;
    expect(node0.neighbors).toHaveLength(0);
    expect(node3.neighbors).toHaveLength(0);
  });

  // ── Graph integrity ──────────────────────────────────────────────────────────

  it('preserves node order for the remaining nodes', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    // Nodes 0, 1, 3 remain; order must be preserved (ascending by original position)
    expect(graph.map(n => n.id)).toEqual([0, 1, 3]);
  });

  it('retains the correct edge distances on surviving edges', () => {
    const graph = buildGraph();
    new EdgePruning().prune(graph, [PathFeatures.Stairs]);

    const node1 = graph.find(n => n.id === 1)!;
    expect(node1.neighbors.find(e => e.to === 0)!.distance).toBe(10);
  });
});
