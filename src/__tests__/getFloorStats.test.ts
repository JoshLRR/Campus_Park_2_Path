import {expect, test} from 'vitest';
import {getFloorStats} from '../logic/getFloorStats';
import {Room} from '../components/Map/MapView';
import {GraphNode} from '../components/Map/GraphOverlay';

type RoomWithId = Room & {id: number};

const nodes: GraphNode[] = [
  {id: 1, kind: 'room', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
  {id: 2, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
  {id: 3, kind: 'path', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
  {id: 4, kind: 'room', position: {x: 0, y: 0, floorNum: 2}, neighbors: []},
];

const rooms: RoomWithId[] = [
  {id: 1, name: 'A', building: 'X', buildingId: 1, floor: 1, x: 0, y: 0},
  {id: 2, name: 'B', building: 'X', buildingId: 1, floor: 1, x: 0, y: 0},
  {id: 3, name: 'C', building: 'X', buildingId: 1, floor: 2, x: 0, y: 0},
];

test('counts nodes, path nodes, room nodes, and rooms on the active floor', () => {
  expect(getFloorStats(nodes, rooms, 1)).toEqual({
    nodes: 3,
    pathNodes: 2,
    roomNodes: 1,
    rooms: 2,
  });
});

test('counts stats for a different floor', () => {
  expect(getFloorStats(nodes, rooms, 2)).toEqual({
    nodes: 1,
    pathNodes: 0,
    roomNodes: 1,
    rooms: 1,
  });
});

test('returns zeroed stats for a floor with no nodes or rooms', () => {
  expect(getFloorStats(nodes, rooms, 99)).toEqual({
    nodes: 0,
    pathNodes: 0,
    roomNodes: 0,
    rooms: 0,
  });
});
