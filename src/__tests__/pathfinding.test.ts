import {beforeEach, describe, expect, it, vi} from 'vitest';
import {GraphNode} from '../components/Map/GraphOverlay';

// Control the PathAPI that Pathfinder calls internally.
const mockPath = vi.hoisted(() => vi.fn());
vi.mock('../logic/PathingComponent/api/CreatePathingAPI', () => ({
  createPathAPI: () => ({path: mockPath}),
}));

// Imported after the mock is registered.
import {Pathfinder} from '../components/Map/pathfinding';

const nodes: GraphNode[] = [
  {id: 1, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
  {id: 2, kind: 'path', position: {x: 100, y: 0, floorNum: 1}, neighbors: []},
  {id: 3, kind: 'room', position: {x: 100, y: 100, floorNum: 1}, neighbors: []},
];

describe('Pathfinder.findClosestNode', () => {
  it('returns null when there are no nodes', () => {
    const pf = new Pathfinder([]);
    expect(pf.findClosestNode(0, 0)).toBeNull();
  });

  it('returns the id of the nearest node (accounting for scaleInverse)', () => {
    const pf = new Pathfinder(nodes);
    // (1000, 0) * 0.1 = (100, 0) -> exactly node 2
    expect(pf.findClosestNode(1000, 0)).toBe(2);
  });

  it('honors an explicit scaleInverse', () => {
    const pf = new Pathfinder(nodes);
    // (100, 100) * 1 -> exactly node 3
    expect(pf.findClosestNode(100, 100, 1)).toBe(3);
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
    expect(mockPath).not.toHaveBeenCalled();
  });

  it('returns a trivial path when start equals end', async () => {
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(2, 2);
    expect(result).toEqual({path: [2], totalDistance: 0, success: true});
    expect(mockPath).not.toHaveBeenCalled();
  });

  it('transforms a successful API response', async () => {
    mockPath.mockResolvedValue({
      status: 'success',
      message: 'ok',
      path: {nodes: ['1', '2', '3'], totalDistance: 12.5},
    });
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 3);

    expect(result).toEqual({
      path: [1, 2, 3],
      totalDistance: 12.5,
      success: true,
      message: 'ok',
    });
    expect(mockPath).toHaveBeenCalledWith({
      origin: {mode: 'node', value: '1'},
      destination: {mode: 'node', value: '3'},
    });
  });

  it('handles a success status with no path data', async () => {
    mockPath.mockResolvedValue({status: 'success'});
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 3);
    expect(result.success).toBe(false);
    expect(result.message).toBe('API returned success but no path data');
  });

  it('maps not_found to a failed result', async () => {
    mockPath.mockResolvedValue({status: 'not_found'});
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 3);
    expect(result).toEqual({
      path: [],
      totalDistance: 0,
      success: false,
      message: 'No path found',
    });
  });

  it('maps validation_error using the provided message', async () => {
    mockPath.mockResolvedValue({status: 'validation_error', message: 'bad'});
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 3);
    expect(result.success).toBe(false);
    expect(result.message).toBe('bad');
  });

  it('maps internal_error to a failed result', async () => {
    mockPath.mockResolvedValue({status: 'internal_error'});
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 3);
    expect(result.message).toBe('Internal server error');
  });

  it('maps an unknown status to a failed result', async () => {
    mockPath.mockResolvedValue({status: 'something_else'});
    const pf = new Pathfinder(nodes);
    const result = await pf.findPath(1, 3);
    expect(result.message).toBe('Unknown response status');
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
