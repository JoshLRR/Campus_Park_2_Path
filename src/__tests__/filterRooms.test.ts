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
    features: [7, 9], // Elevator, Vending Machine
  },
  {
    id: 4,
    name: 'T100',
    building: 'T',
    buildingId: 3,
    floor: 1,
    x: 0,
    y: 0,
    features: [1, 3], // Men's Bathroom, Women's Bathroom
  },
  {
    id: 5,
    name: 'Tech Hub',
    building: 'Annex',
    buildingId: 4,
    floor: 4,
    x: 0,
    y: 0,
    features: [17], // Computer Lab
  },
  {
    id: 6,
    name: 'Elevator Lobby',
    building: 'Annex',
    buildingId: 4,
    floor: 5,
    x: 0,
    y: 0,
  },
  {
    id: 7,
    name: 'Gym Annex',
    building: 'Annex',
    buildingId: 4,
    floor: 6,
    x: 0,
    y: 0,
    features: [21], // Gym
  },
  {
    id: 8,
    name: 'Gymnasium Storage',
    building: 'Annex',
    buildingId: 4,
    floor: 7,
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
  expect(result.map(r => r.id)).toEqual([2, 4]);
});

test('returns all rooms for an empty search term', () => {
  expect(filterRooms(rooms, '')).toHaveLength(8);
});

test('returns an empty array when nothing matches', () => {
  expect(filterRooms(rooms, 'zzz')).toEqual([]);
});

test('matches rooms by feature label (case-insensitive)', () => {
  const result = filterRooms(rooms, 'elevator');
  // Room 3 matches via an exact feature-label match ("Elevator"); room 6
  // ("Elevator Lobby") only matches partially by name, so it ranks after.
  expect(result.map(r => r.id)).toEqual([3, 6]);
});

test('matches multiple rooms sharing a feature label', () => {
  const result = filterRooms(rooms, 'bathroom');
  expect(result.map(r => r.id)).toEqual([4]);
});

test('rooms without features are not matched by feature search', () => {
  const result = filterRooms(rooms, 'vending');
  expect(result.map(r => r.id)).toEqual([3]);
});

test('ranks partial room-name matches above partial feature-label matches', () => {
  // 'lab' partially matches room 1's name ("Chemistry Lab") and room 5's
  // feature label ("Computer Lab") — the room-name match should come first.
  const result = filterRooms(rooms, 'lab');
  expect(result.map(r => r.id)).toEqual([1, 5]);
});

test('ranks exact feature-label matches above partial room-name matches', () => {
  // 'gym' is an exact match for room 7's feature label ("Gym") and only a
  // partial match for room 8's name ("Gymnasium Storage") — the exact
  // feature match should outrank the partial name match.
  const result = filterRooms(rooms, 'gym');
  expect(result.map(r => r.id)).toEqual([7, 8]);
});
