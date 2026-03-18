import {describe, expect, test, vi} from 'vitest';

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

import {createPathAPI} from '../logic/PathingComponent/api/CreatePathingAPI';
import {JsonGraphRepository} from '../repositories/JsonGraphRepository';

// Integration tests for the PathingComponent stack.
//
// These tests exercise the full request lifecycle end-to-end:
//   JsonGraph → PathAPI → PathOrchestrator → DijkstraAlgorithm → PathResponseDTO
//
// Graph layout used across all tests (distances in feet):
//
//   room_A(0) --10-- p1(1) --15-- p2(2) --8-- room_B(3)
//                      |              |
//                     12             14
//                      |              |
//                     p3(4) --20-- p4(5) --10-- room_C(6)
//                      |
//                     16
//                      |
//                   room_D(7)
//
// Expected shortest paths (Dijkstra):
//   0 → 3   via 0→1→2→3       cost = 33
//   0 → 6   via 0→1→2→5→6     cost = 49
//   0 → 7   via 0→1→4→7       cost = 38
//   3 → 7   via 3→2→1→4→7     cost = 51

const testGraph = {
  nodes: [
    {
      id: 0,
      kind: 'room',
      position: {x: 0, y: 0, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [{to: 1, distance: 10}],
      features: [],
      roomNumber: 'room_A',
    },
    {
      id: 1,
      kind: 'path',
      position: {x: 10, y: 0, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [
        {to: 0, distance: 10},
        {to: 2, distance: 15},
        {to: 4, distance: 12},
      ],
      features: [],
    },
    {
      id: 2,
      kind: 'path',
      position: {x: 25, y: 0, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [
        {to: 1, distance: 15},
        {to: 3, distance: 8},
        {to: 5, distance: 14},
      ],
      features: [],
    },
    {
      id: 3,
      kind: 'room',
      position: {x: 33, y: 0, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [{to: 2, distance: 8}],
      features: [],
      roomNumber: 'room_B',
    },
    {
      id: 4,
      kind: 'path',
      position: {x: 10, y: 12, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [
        {to: 1, distance: 12},
        {to: 5, distance: 20},
        {to: 7, distance: 16},
      ],
      features: [],
    },
    {
      id: 5,
      kind: 'path',
      position: {x: 25, y: 14, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [
        {to: 2, distance: 14},
        {to: 4, distance: 20},
        {to: 6, distance: 10},
      ],
      features: [],
    },
    {
      id: 6,
      kind: 'room',
      position: {x: 45, y: 14, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [{to: 5, distance: 10}],
      features: [],
      roomNumber: 'room_C',
    },
    {
      id: 7,
      kind: 'room',
      position: {x: 10, y: 28, floorNum: 0},
      imagePosition: {x: 0, y: 0},
      neighbors: [{to: 4, distance: 16}],
      features: [],
      roomNumber: 'room_D',
    },
  ],
};

function makeAPI() {
  return createPathAPI(new JsonGraphRepository(testGraph));
}

describe('PathingComponent integration', () => {
  test('shortest path across the main corridor', async () => {
    const response = await makeAPI().path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'node', value: '3'},
    });

    expect(response).toMatchObject({
      status: 'success',
      path: {nodes: ['0', '1', '2', '3'], totalDistance: 33},
    });
    expect(() => JSON.stringify(response)).not.toThrow();
  });

  test('shortest path to a node reachable via a junction detour', async () => {
    const response = await makeAPI().path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'node', value: '6'},
    });

    expect(response).toMatchObject({
      status: 'success',
      path: {nodes: ['0', '1', '2', '5', '6'], totalDistance: 49},
    });
  });

  test('shortest path using the lower branch', async () => {
    const response = await makeAPI().path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'node', value: '7'},
    });

    expect(response).toMatchObject({
      status: 'success',
      path: {nodes: ['0', '1', '4', '7'], totalDistance: 38},
    });
  });

  test('shortest path from far end back through both branches', async () => {
    const response = await makeAPI().path({
      origin: {mode: 'node', value: '3'},
      destination: {mode: 'node', value: '7'},
    });

    expect(response).toMatchObject({
      status: 'success',
      path: {nodes: ['3', '2', '1', '4', '7'], totalDistance: 51},
    });
  });
});
