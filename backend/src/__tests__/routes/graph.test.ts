import {describe, it, expect, beforeEach, vi} from 'vitest';
import request from 'supertest';
import type {FieldPacket, RowDataPacket} from 'mysql2';
import {app} from '../../server';
import {pool} from '../../db/pool';

vi.mock('../../db/pool', () => ({
  pool: {query: vi.fn()},
}));

const mockQuery = vi.mocked(pool.query);

type NodeRow = RowDataPacket & {
  id: number;
  x: number;
  y: number;
  floorNum: number | null;
  kind: 'room' | 'path';
  roomNumber: string | null;
};

type EdgeRow = RowDataPacket & {
  fromNodeId: number;
  toNodeId: number;
  distance: number;
};

type RoomFeatureRow = RowDataPacket & {
  roomId: number;
  featureId: number;
};

type PathFeatureRow = RowDataPacket & {
  graphNodeId: number;
  featureId: number;
};

const noFields: FieldPacket[] = [];

function nodeResult(rows: NodeRow[]): [NodeRow[], FieldPacket[]] {
  return [rows, noFields];
}

function edgeResult(rows: EdgeRow[]): [EdgeRow[], FieldPacket[]] {
  return [rows, noFields];
}

function roomFeatureResult(
  rows: RoomFeatureRow[] = [],
): [RoomFeatureRow[], FieldPacket[]] {
  return [rows, noFields];
}

function pathFeatureResult(
  rows: PathFeatureRow[] = [],
): [PathFeatureRow[], FieldPacket[]] {
  return [rows, noFields];
}

function mockGraphQueries(
  nodeRows: NodeRow[],
  edgeRows: EdgeRow[] = [],
  roomFeatureRows: RoomFeatureRow[] = [],
  pathFeatureRows: PathFeatureRow[] = [],
) {
  mockQuery
    .mockResolvedValueOnce(nodeResult(nodeRows))
    .mockResolvedValueOnce(edgeResult(edgeRows))
    .mockResolvedValueOnce(roomFeatureResult(roomFeatureRows))
    .mockResolvedValueOnce(pathFeatureResult(pathFeatureRows));
}

describe('GET /api/graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with a nodes array', async () => {
    mockGraphQueries([], []);

    const res = await request(app).get('/api/graph');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nodes');
    expect(Array.isArray(res.body.nodes)).toBe(true);
  });

  it('returns empty nodes when database has no rows', async () => {
    mockGraphQueries([], []);

    const res = await request(app).get('/api/graph');

    expect(res.status).toBe(200);
    expect(res.body.nodes).toEqual([]);
  });

  it('shapes a path node correctly', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 1,
        x: 10,
        y: 20,
        floorNum: 2,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
    ];
    mockGraphQueries(nodeRows, []);

    const res = await request(app).get('/api/graph');
    const node = res.body.nodes[0];

    expect(node).toMatchObject({
      id: 1,
      kind: 'path',
      type: 'path',
      position: {x: 10, y: 20, floorNum: 2},
      neighbors: [],
      features: [],
    });
    expect(node.roomNumber).toBeUndefined();
  });

  it('shapes a room node correctly and includes roomNumber', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 2,
        x: 50,
        y: 60,
        floorNum: 1,
        kind: 'room',
        roomNumber: 'B202',
      } as NodeRow,
    ];
    mockGraphQueries(nodeRows, []);

    const res = await request(app).get('/api/graph');
    const node = res.body.nodes[0];

    expect(node).toMatchObject({
      id: 2,
      kind: 'room',
      type: 'room',
      position: {x: 50, y: 60, floorNum: 1},
      roomNumber: 'B202',
    });
  });

  it('builds neighbor relationships from edge rows', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 1,
        x: 0,
        y: 0,
        floorNum: 1,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
      {
        id: 2,
        x: 10,
        y: 0,
        floorNum: 1,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
    ];
    const edgeRows: EdgeRow[] = [
      {fromNodeId: 1, toNodeId: 2, distance: 10} as EdgeRow,
    ];
    mockGraphQueries(nodeRows, edgeRows);

    const res = await request(app).get('/api/graph');
    const node1 = res.body.nodes.find((n: {id: number}) => n.id === 1);
    const node2 = res.body.nodes.find((n: {id: number}) => n.id === 2);

    expect(node1.neighbors).toEqual([{to: 2, distance: 10}]);
    expect(node2.neighbors).toEqual([]);
  });

  it('handles multiple edges from the same node', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 1,
        x: 0,
        y: 0,
        floorNum: 1,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
      {
        id: 2,
        x: 10,
        y: 0,
        floorNum: 1,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
      {
        id: 3,
        x: 0,
        y: 10,
        floorNum: 1,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
    ];
    const edgeRows: EdgeRow[] = [
      {fromNodeId: 1, toNodeId: 2, distance: 10} as EdgeRow,
      {fromNodeId: 1, toNodeId: 3, distance: 10} as EdgeRow,
    ];
    mockGraphQueries(nodeRows, edgeRows);

    const res = await request(app).get('/api/graph');
    const node1 = res.body.nodes.find((n: {id: number}) => n.id === 1);

    expect(node1.neighbors).toHaveLength(2);
    expect(node1.neighbors).toContainEqual({to: 2, distance: 10});
    expect(node1.neighbors).toContainEqual({to: 3, distance: 10});
  });

  it('defaults floorNum to 1 when null', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 1,
        x: 5,
        y: 5,
        floorNum: null,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
    ];
    mockGraphQueries(nodeRows, []);

    const res = await request(app).get('/api/graph');
    expect(res.body.nodes[0].position.floorNum).toBe(1);
  });

  it('attaches room features from room_feature_map by roomId', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 1,
        x: 0,
        y: 0,
        floorNum: 1,
        kind: 'room',
        roomNumber: 'B202',
        roomId: 7,
      } as NodeRow,
    ];
    mockGraphQueries(nodeRows, [], [
      {roomId: 7, featureId: 3} as RoomFeatureRow,
      {roomId: 7, featureId: 8} as RoomFeatureRow,
    ]);

    const res = await request(app).get('/api/graph');
    const node = res.body.nodes[0];

    expect(node.features).toEqual([3, 8]);
  });

  it('attaches path features from path_feature_map by graphNodeId', async () => {
    const nodeRows: NodeRow[] = [
      {
        id: 5,
        x: 0,
        y: 0,
        floorNum: 1,
        kind: 'path',
        roomNumber: null,
      } as NodeRow,
    ];
    mockGraphQueries(nodeRows, [], [], [
      {graphNodeId: 5, featureId: 1} as PathFeatureRow,
      {graphNodeId: 5, featureId: 4} as PathFeatureRow,
    ]);

    const res = await request(app).get('/api/graph');
    const node = res.body.nodes[0];

    expect(node.features).toEqual([1, 4]);
  });

  it('returns 500 when the database query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app).get('/api/graph');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({error: 'Failed to load graph'});
  });
});
