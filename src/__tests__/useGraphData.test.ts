import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useGraphData} from '../hooks/useGraphData';
import {GraphNode} from '../components/Map/GraphOverlay';

const node = (id: number, floorNum?: number): GraphNode => ({
  id,
  kind: 'path',
  position: {x: 0, y: 0, floorNum: floorNum as number},
  neighbors: [],
});

const roomNode = (
  id: number,
  roomNumber: string,
  x: number,
  y: number,
  floorNum: number,
): GraphNode => ({
  id,
  kind: 'room',
  position: {x, y, floorNum},
  neighbors: [],
  roomNumber,
});

function mockFetchResolve(body: unknown, ok = true, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe('useGraphData', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty nodes, empty rooms, and a default floor', () => {
    mockFetchResolve([]);
    const {result} = renderHook(() => useGraphData());
    expect(result.current.graphNodes).toEqual([]);
    expect(result.current.rooms).toEqual([]);
    expect(result.current.availableFloors).toEqual([1]);
  });

  it('loads nodes from an array response and derives sorted floors', async () => {
    mockFetchResolve([node(1, 2), node(2, 1)]);
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(result.current.graphNodes).toHaveLength(2));
    expect(result.current.availableFloors).toEqual([1, 2]);
  });

  it('reads nodes from a {nodes: [...]} response', async () => {
    mockFetchResolve({nodes: [node(1, 3)]});
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(result.current.graphNodes).toHaveLength(1));
    expect(result.current.availableFloors).toEqual([3]);
  });

  it('defaults missing floorNum to 1', async () => {
    mockFetchResolve([node(1)]);
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(result.current.graphNodes).toHaveLength(1));
    expect(result.current.graphNodes[0].position.floorNum).toBe(1);
    expect(result.current.availableFloors).toEqual([1]);
  });

  it('keeps defaults when the fetch response is not ok', async () => {
    mockFetchResolve(null, false, 500);
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(result.current.graphNodes).toEqual([]);
    expect(result.current.rooms).toEqual([]);
    expect(result.current.availableFloors).toEqual([1]);
  });

  it('derives rooms from room-kind nodes with roomNumber', async () => {
    mockFetchResolve({nodes: [node(1, 1), roomNode(2, 'A101', 150, 200, 1)]});
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(result.current.rooms).toHaveLength(1));
    expect(result.current.rooms[0]).toMatchObject({
      id: 2,
      name: 'A101',
      building: 'A',
      floor: 1,
      x: 150,
      y: 200,
    });
  });

  it('excludes path nodes and room nodes without a roomNumber from rooms', async () => {
    const noRoomNumber: GraphNode = {
      id: 3,
      kind: 'room',
      position: {x: 0, y: 0, floorNum: 1},
      neighbors: [],
    };
    mockFetchResolve({nodes: [node(1, 1), noRoomNumber]});
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(result.current.graphNodes).toHaveLength(2));
    expect(result.current.rooms).toEqual([]);
  });

  it('falls back to "Campus" as building when roomNumber has no letter prefix', async () => {
    mockFetchResolve({nodes: [roomNode(1, '101', 0, 0, 1)]});
    const {result} = renderHook(() => useGraphData());

    await waitFor(() => expect(result.current.rooms).toHaveLength(1));
    expect(result.current.rooms[0].building).toBe('Campus');
  });
});
