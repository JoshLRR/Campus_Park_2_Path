import {beforeEach, describe, expect, it, vi} from 'vitest';
import {GraphNode} from '../components/Map/GraphOverlay';

// Control the PathAPI used by findPathFromCoordinates / findPathToPOI.
const mockPath = vi.hoisted(() => vi.fn());
vi.mock('../logic/PathingComponent/api/CreatePathingAPI', () => ({
  createPathAPI: () => ({path: mockPath}),
}));

// Imported after the mock is registered.
import {Pathfinder} from '../components/Map/pathfinding';

// Floor-1 nodes used in most tests (no edges — cannot route between them).
const nodes: GraphNode[] = [
  {id: 1, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
  {id: 2, kind: 'path', position: {x: 100, y: 0, floorNum: 1}, neighbors: []},
  {
    id: 3,
    kind: 'room',
    position: {x: 100, y: 100, floorNum: 1},
    neighbors: [],
    roomNumber: 'A101',
  },
];

// Connected graph for real Dijkstra tests: 1 --10--> 2 --15--> 3
const connectedNodes: GraphNode[] = [
  {
    id: 1,
    kind: 'path',
    position: {x: 0, y: 0, floorNum: 1},
    neighbors: [{to: 2, distance: 10}],
  },
  {
    id: 2,
    kind: 'path',
    position: {x: 10, y: 0, floorNum: 1},
    neighbors: [
      {to: 1, distance: 10},
      {to: 3, distance: 15},
    ],
  },
  {
    id: 3,
    kind: 'room',
    position: {x: 25, y: 0, floorNum: 1},
    neighbors: [{to: 2, distance: 15}],
    roomNumber: 'A101',
  },
];

describe('Pathfinder.findClosestNode', () => {
  it('returns null when there are no nodes', () => {
    const pf = new Pathfinder([]);
    expect(pf.findClosestNode(0, 0)).toBeNull();
  });

  it('returns the closest node on the default floor (1)', () => {
    const pf = new Pathfinder(nodes);
    // node 2 at (100, 0) is closest to (1000, 0) among floor-1 nodes
    expect(pf.findClosestNode(1000, 0)).toBe(2);
  });

  it('returns the exact-match node when the floor matches', () => {
    const pf = new Pathfinder(nodes);
    // (100, 100) on floor 1 lands directly on node 3
    expect(pf.findClosestNode(100, 100, 1)).toBe(3);
  });

  it('ignores nodes on other floors', () => {
    const multiFloorNodes: GraphNode[] = [
      ...nodes,
      // A floor-2 node that is much closer to origin than any floor-1 node
      {id: 4, kind: 'path', position: {x: 1, y: 1, floorNum: 2}, neighbors: []},
    ];
    const pf = new Pathfinder(multiFloorNodes);
    // Asking for floor 1 must not pick up node 4 even though it's nearest overall
    expect(pf.findClosestNode(0, 0, 1)).toBe(1);
    // Asking for floor 2 should find node 4
    expect(pf.findClosestNode(0, 0, 2)).toBe(4);
  });
});

describe('Pathfinder.findPath', () => {
  beforeEach(() => mockPath.mockReset());

  it('fails when either node id is unknown', async () => {
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 999);
    expect(result).toEqual({
      path: [],
      totalDistance: 0,
      success: false,
      message: 'Invalid node IDs',
    });
  });

  it('returns a trivial path when start equals end', async () => {
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(2, 2);
    expect(result).toEqual({path: [2], totalDistance: 0, success: true});
  });

  it('finds the shortest path through the live graph', async () => {
    const pf = new Pathfinder(connectedNodes);
    const result = await pf.findPath(1, 3);
    expect(result).toEqual({
      path: [1, 2, 3],
      totalDistance: 25,
      success: true,
    });
  });

  it('finds a single-hop path', async () => {
    const pf = new Pathfinder(connectedNodes);
    const result = await pf.findPath(1, 2);
    expect(result).toEqual({
      path: [1, 2],
      totalDistance: 10,
      success: true,
    });
  });

  it('returns not_found when the graph is disconnected', async () => {
    const disconnected: GraphNode[] = [
      {id: 1, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
      {
        id: 4,
        kind: 'path',
        position: {x: 50, y: 0, floorNum: 1},
        neighbors: [],
      },
    ];
    const pf = new Pathfinder(disconnected);
    const result = await pf.findPath(1, 4);
    expect(result).toEqual({
      path: [],
      totalDistance: 0,
      success: false,
      message: 'No path found',
    });
  });
});

describe('Pathfinder.findPathFromCoordinates', () => {
  beforeEach(() => mockPath.mockReset());

  it('fails when the destination node is unknown', async () => {
    const pf = new Pathfinder(nodes);
    const result = await pf.findPathFromCoordinates(0, 0, 1, 999);
    expect(result.message).toBe('Invalid destination node ID');
    expect(mockPath).not.toHaveBeenCalled();
  });

  it('builds a coordinate request and transforms the response', async () => {
    mockPath.mockResolvedValue({
      status: 'success',
      path: {nodes: ['3'], totalDistance: 0},
    });
    const pf = new Pathfinder(nodes);
    await pf.findPathFromCoordinates(50, 70, 2, 3);
    expect(mockPath).toHaveBeenCalledWith({
      origin: {mode: 'coordinate', value: {x: 5, y: 7, floorNum: 2}},
      destination: {mode: 'node', value: '3'},
    });
  });
});

describe('Pathfinder.findPathToPOI', () => {
  beforeEach(() => mockPath.mockReset());

  it('fails when the start node is unknown', async () => {
    const pf = new Pathfinder(nodes);
    const result = await pf.findPathToPOI(999, 'restroom');
    expect(result.message).toBe('Invalid start node ID');
    expect(mockPath).not.toHaveBeenCalled();
  });

  it('builds a poiType request with preferences', async () => {
    mockPath.mockResolvedValue({
      status: 'success',
      path: {nodes: ['1', '2'], totalDistance: 3},
    });
    const pf = new Pathfinder(nodes);
    await pf.findPathToPOI(1, 'restroom', {avoidStairs: true});
    expect(mockPath).toHaveBeenCalledWith({
      origin: {mode: 'node', value: '1'},
      destination: {mode: 'poiType', value: 'restroom'},
      preferences: {avoidStairs: true},
    });
  });
});
