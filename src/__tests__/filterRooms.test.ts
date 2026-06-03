import {expect, test} from 'vitest';
import {filterRooms} from '../logic/filterRooms';
import {Room} from '../components/Map/MapView';

type RoomWithId = Room & {id: number};

const rooms: RoomWithId[] = [
  {
    id: 1,
    name: 'Chemistry Lab',
    building: 'Science',
    buildingId: 1,
    floor: 2,
    x: 0,
    y: 0,
  },
  {
    id: 2,
    name: 'Reading Room',
    building: 'Library',
    buildingId: 2,
    floor: 1,
    x: 0,
    y: 0,
  },
  {
    id: 3,
    name: 'Lecture Hall',
    building: 'Science',
    buildingId: 1,
    floor: 3,
    x: 0,
    y: 0,
  },
];

test('matches rooms by name (case-insensitive)', () => {
  const result = filterRooms(rooms, 'chemistry');
  expect(result.map(r => r.id)).toEqual([1]);
});

test('matches rooms by building name', () => {
  const result = filterRooms(rooms, 'Science');
  expect(result.map(r => r.id)).toEqual([1, 3]);
});

test('matches rooms by floor number', () => {
  const result = filterRooms(rooms, '1');
  expect(result.map(r => r.id)).toEqual([2]);
});

test('returns all rooms for an empty search term', () => {
  expect(filterRooms(rooms, '')).toHaveLength(3);
});

test('returns an empty array when nothing matches', () => {
  expect(filterRooms(rooms, 'zzz')).toEqual([]);
});
