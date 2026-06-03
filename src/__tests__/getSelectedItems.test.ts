import {expect, test} from 'vitest';
import {getSelectedRoom, getSelectedGraphNode} from '../logic/getSelectedItems';
import {Room} from '../components/Map/MapView';
import {GraphNode} from '../components/Map/GraphOverlay';

type RoomWithId = Room & {id: number};

const rooms: RoomWithId[] = [
  {id: 1, name: 'A100', building: 'Lib', buildingId: 1, floor: 1, x: 0, y: 0},
  {id: 2, name: 'B200', building: 'Sci', buildingId: 2, floor: 2, x: 0, y: 0},
];

const nodes: GraphNode[] = [
  {id: 10, kind: 'room', position: {x: 0, y: 0, floorNum: 1}, neighbors: []},
  {id: 20, kind: 'path', position: {x: 1, y: 1, floorNum: 1}, neighbors: []},
];

test('getSelectedRoom finds the room by id', () => {
  expect(getSelectedRoom(rooms, 2)).toBe(rooms[1]);
});

test('getSelectedRoom returns null when id is null', () => {
  expect(getSelectedRoom(rooms, null)).toBeNull();
});

test('getSelectedRoom returns undefined when id is not found', () => {
  expect(getSelectedRoom(rooms, 999)).toBeUndefined();
});

test('getSelectedGraphNode finds the node by id', () => {
  expect(getSelectedGraphNode(nodes, 20)).toBe(nodes[1]);
});

test('getSelectedGraphNode returns null when id is null', () => {
  expect(getSelectedGraphNode(nodes, null)).toBeNull();
});

test('getSelectedGraphNode returns undefined when id is not found', () => {
  expect(getSelectedGraphNode(nodes, 999)).toBeUndefined();
});
