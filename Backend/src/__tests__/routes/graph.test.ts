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

const noFields: FieldPacket[] = [];

function nodeResult(rows: NodeRow[]): [NodeRow[], FieldPacket[]] {
  return [rows, noFields];
}

function edgeResult(rows: EdgeRow[]): [EdgeRow[], FieldPacket[]] {
  return [rows, noFields];
}

describe('GET /api/graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with a nodes array', async () => {
    mockQuery
      .mockResolvedValueOnce(nodeResult([]))
      .mockResolvedValueOnce(edgeResult([]));

    const res = await request(app).get('/api/graph');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nodes');
    expect(Array.isArray(res.body.nodes)).toBe(true);
  });

  it('returns empty nodes when database has no rows', async () => {
    mockQuery
      .mockResolvedValueOnce(nodeResult([]))
      .mockResolvedValueOnce(edgeResult([]));

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
    mockQuery
      .mockResolvedValueOnce(nodeResult(nodeRows))
      .mockResolvedValueOnce(edgeResult([]));

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
    mockQuery
      .mockResolvedValueOnce(nodeResult(nodeRows))
      .mockResolvedValueOnce(edgeResult([]));

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
    mockQuery
      .mockResolvedValueOnce(nodeResult(nodeRows))
      .mockResolvedValueOnce(edgeResult(edgeRows));

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
    mockQuery
      .mockResolvedValueOnce(nodeResult(nodeRows))
      .mockResolvedValueOnce(edgeResult(edgeRows));

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
    mockQuery
      .mockResolvedValueOnce(nodeResult(nodeRows))
      .mockResolvedValueOnce(edgeResult([]));

    const res = await request(app).get('/api/graph');
    expect(res.body.nodes[0].position.floorNum).toBe(1);
  });

  it('returns 500 when the database query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app).get('/api/graph');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({error: 'Failed to load graph'});
  });
});
