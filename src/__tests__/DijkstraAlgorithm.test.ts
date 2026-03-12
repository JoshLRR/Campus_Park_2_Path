import {expect, test} from 'vitest';
import {DijkstraAlgorithm} from '../logic/PathingComponent/application/DijkstraAlgorithm';
import {RoomNode} from '../types/RoomNode';
import {PathNode} from '../types/PathNode';
import {RoomFeatures} from '../types/RoomFeatures';
import {PathFeatures} from '../types/PathFeatures';
import {Room} from '../types/Room';
import type {Node} from '../types/Node';

/**
 * Shared test graph — mirrors the layout in HardcodedGraphRepository:
 *
 *   A109(0) --10-- p1(1) --15-- p2(2) --8-- A110(3)
 *                   |              |
 *                  12             14
 *                   |              |
 *                  p3(4) --20-- p4(5) --10-- Parking_1A(6)
 *                   |
 *                  16
 *                   |
 *               Parking_1B(7)
 *
 * Expected shortest-path costs:
 *   0 → 3   (0→1→2→3)       cost = 33
 *   0 → 6   (0→1→2→5→6)     cost = 49
 *   0 → 7   (0→1→4→7)       cost = 38
 *   3 → 7   (3→2→1→4→7)     cost = 51
 */
function buildTestGraph(): Node[] {
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
        {to: 4, distance: 12},
      ],
      [PathFeatures.Paved, PathFeatures.Covered],
    ),
    new PathNode(
      2,
      {x: 25, y: 0, floorNum: 0},
      [
        {to: 1, distance: 15},
        {to: 3, distance: 8},
        {to: 5, distance: 14},
      ],
      [PathFeatures.Paved],
    ),
    new RoomNode(
      3,
      {x: 33, y: 0, floorNum: 0},
      Room.A110,
      [RoomFeatures.Classroom],
      [{to: 2, distance: 8}],
    ),
    new PathNode(
      4,
      {x: 10, y: 12, floorNum: 0},
      [
        {to: 1, distance: 12},
        {to: 5, distance: 20},
        {to: 7, distance: 16},
      ],
      [PathFeatures.Paved, PathFeatures.ADA_Access],
    ),
    new PathNode(
      5,
      {x: 25, y: 14, floorNum: 0},
      [
        {to: 4, distance: 20},
        {to: 2, distance: 14},
        {to: 6, distance: 10},
      ],
      [PathFeatures.Paved],
    ),
    new RoomNode(
      6,
      {x: 45, y: 14, floorNum: 0},
      Room.Parking_Lot_1A,
      [RoomFeatures.Parking_Lot],
      [{to: 5, distance: 10}],
    ),
    new RoomNode(
      7,
      {x: 10, y: 28, floorNum: 0},
      Room.Parking_Lot_1B,
      [RoomFeatures.Parking_Lot, RoomFeatures.Bus_Stop],
      [{to: 4, distance: 16}],
    ),
  ];
}

// ================ POINT-TO-POINT TESTS ================

test('finds path to a direct neighbor', async () => {
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {kind: 'node', nodeId: 1});

  expect(result).toMatchObject({
    status: 'found',
    nodes: [0, 1],
    totalDistance: 10,
  });
});

test('finds shortest path across multiple hops', async () => {
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {kind: 'node', nodeId: 3});

  expect(result).toMatchObject({
    status: 'found',
    nodes: [0, 1, 2, 3],
    totalDistance: 33,
  });
});

test('picks the shorter route when two paths exist to the destination', async () => {
  // 0→1→4→7 (cost 38) is shorter than 0→1→2→5→4→7 (cost 59)
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {kind: 'node', nodeId: 7});

  expect(result).toMatchObject({
    status: 'found',
    nodes: [0, 1, 4, 7],
    totalDistance: 38,
  });
});

test('finds correct path when starting from a non-origin node', async () => {
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(3, {kind: 'node', nodeId: 7});

  expect(result).toMatchObject({
    status: 'found',
    nodes: [3, 2, 1, 4, 7],
    totalDistance: 51,
  });
});

test('returns a single-node path when start equals destination', async () => {
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {kind: 'node', nodeId: 0});

  expect(result).toMatchObject({
    status: 'found',
    nodes: [0],
    totalDistance: 0,
  });
});

test('returns not_found when destination node is unreachable', async () => {
  const isolatedGraph: Node[] = [
    new RoomNode(0, {x: 0, y: 0, floorNum: 0}, Room.A109, [], []),
    new RoomNode(99, {x: 100, y: 100, floorNum: 0}, Room.A110, [], []),
  ];
  const algorithm = new DijkstraAlgorithm(isolatedGraph);
  const result = await algorithm.findPath(0, {kind: 'node', nodeId: 99});

  expect(result).toMatchObject({status: 'not_found'});
});

// ================ POI DESTINATION TESTS ================

test('finds the nearest node matching a poiType when multiple candidates exist', async () => {
  // Both node 6 (cost 49) and node 7 (cost 38) have Parking_Lot; node 7 is closer
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {
    kind: 'poiType',
    poiType: 'Parking_Lot',
  });

  expect(result).toMatchObject({
    status: 'found',
    nodes: [0, 1, 4, 7],
    totalDistance: 38,
  });
});

test('finds the only node matching a poiType', async () => {
  // Only node 7 has Bus_Stop
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {
    kind: 'poiType',
    poiType: 'Bus_Stop',
  });

  expect(result).toMatchObject({
    status: 'found',
    nodes: [0, 1, 4, 7],
    totalDistance: 38,
  });
});

test('returns not_found when no node has the requested poiType feature', async () => {
  // No node in the test graph has an Elevator
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {
    kind: 'poiType',
    poiType: 'Elevator',
  });

  expect(result).toMatchObject({status: 'not_found'});
});

test('returns not_found for an unrecognised poiType string', async () => {
  const algorithm = new DijkstraAlgorithm(buildTestGraph());
  const result = await algorithm.findPath(0, {
    kind: 'poiType',
    poiType: 'NotARealFeature',
  });

  expect(result).toMatchObject({status: 'not_found'});
});

test('does not match PathNodes for a poiType destination', async () => {
  // PathFeatures and RoomFeatures are separate enums; a PathNode should never
  // satisfy a poiType destination even if the numeric values happen to collide
  const graphWithOnlyPathNodes: Node[] = [
    new PathNode(
      0,
      {x: 0, y: 0, floorNum: 0},
      [{to: 1, distance: 5}],
      [PathFeatures.Covered],
    ),
    new PathNode(
      1,
      {x: 5, y: 0, floorNum: 0},
      [{to: 0, distance: 5}],
      [PathFeatures.Stairs],
    ),
  ];
  const algorithm = new DijkstraAlgorithm(graphWithOnlyPathNodes);
  const result = await algorithm.findPath(0, {
    kind: 'poiType',
    poiType: 'Elevator',
  });

  expect(result).toMatchObject({status: 'not_found'});
});
