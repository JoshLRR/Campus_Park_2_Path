import {expect, test} from 'vitest';
import {RoomNode} from '../types/RoomNode';
import {PathNode} from '../types/PathNode';
import {RoomFeatures} from '../types/RoomFeatures';
import {PathFeatures} from '../types/PathFeatures';

test('RoomNode constructor assigns defaults', () => {
  const position = {x: 1, y: 2, floorNum: 3};
  const node = new RoomNode(1, position, '101');

  expect(node.id).toBe(1);
  expect(node.position).toBe(position);
  expect(node.roomNumber).toBe('101');
  expect(node.features).toEqual([]);
  expect(node.neighbors).toEqual([]);
});

test('RoomNode constructor assigns provided values', () => {
  const position = {x: 10, y: 20, floorNum: 0};
  const neighbors = [{to: 2, distance: 5}];
  const features = [RoomFeatures.Cafe, RoomFeatures.Library];
  const node = new RoomNode(7, position, 'B-12', features, neighbors);

  expect(node.id).toBe(7);
  expect(node.position).toBe(position);
  expect(node.roomNumber).toBe('B-12');
  expect(node.features).toBe(features);
  expect(node.neighbors).toBe(neighbors);
});

test('RoomNode allows empty fields without validation', () => {
  const position = {x: 0, y: 0, floorNum: 0};
  const node = new RoomNode(9, position, '', [], []);

  expect(node.roomNumber).toBe('');
  expect(node.features).toEqual([]);
  expect(node.neighbors).toEqual([]);
});

test('PathNode constructor assigns defaults', () => {
  const position = {x: 3, y: 4, floorNum: 1};
  const node = new PathNode(5, position);

  expect(node.id).toBe(5);
  expect(node.position).toBe(position);
  expect(node.features).toEqual([]);
  expect(node.neighbors).toEqual([]);
});

test('PathNode constructor assigns provided values', () => {
  const position = {x: 8, y: 9, floorNum: 2};
  const neighbors = [{to: 6, distance: 12}];
  const features = [PathFeatures.Paved, PathFeatures.Covered];
  const node = new PathNode(11, position, neighbors, features);

  expect(node.id).toBe(11);
  expect(node.position).toBe(position);
  expect(node.features).toBe(features);
  expect(node.neighbors).toBe(neighbors);
});

test('PathNode constructor preserves neighbors/features argument order', () => {
  const position = {x: 2, y: 3, floorNum: 1};
  const neighbors = [{to: 99, distance: 1}];
  const features = [PathFeatures.Stairs];
  const node = new PathNode(12, position, neighbors, features);

  expect(node.neighbors).toBe(neighbors);
  expect(node.features).toBe(features);
});

test('node fields can be updated after construction', () => {
  const position = {x: 0, y: 0, floorNum: 0};
  const node = new RoomNode(3, position, 'A-1');

  node.roomNumber = 'A-2';
  node.features.push(RoomFeatures.Locker_room);
  node.neighbors.push({to: 4, distance: 7});

  expect(node.roomNumber).toBe('A-2');
  expect(node.features).toEqual([RoomFeatures.Locker_room]);
  expect(node.neighbors).toEqual([{to: 4, distance: 7}]);
});
