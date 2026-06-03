import {expect, test} from 'vitest';
import {getRoomPosition} from '../logic/getRoomPosition';
import {Building, Room} from '../components/Map/MapView';

type BuildingWithId = Building & {id: number};
type RoomWithId = Room & {id: number};

const buildings: BuildingWithId[] = [
  {id: 1, name: 'Library', x: 100, y: 200, width: 50, height: 60},
  {id: 2, name: 'Science', x: 300, y: 400, width: 70, height: 80},
];

function makeRoom(overrides: Partial<RoomWithId> = {}): RoomWithId {
  return {
    id: 10,
    name: 'A100',
    building: 'Library',
    buildingId: 1,
    floor: 1,
    x: 5,
    y: 7,
    ...overrides,
  };
}

test('adds the room offset to the matching building position', () => {
  const room = makeRoom({building: 'Library', x: 5, y: 7});
  expect(getRoomPosition(room, buildings)).toEqual({x: 105, y: 207});
});

test('resolves position for a different building by name', () => {
  const room = makeRoom({building: 'Science', x: 1, y: 2});
  expect(getRoomPosition(room, buildings)).toEqual({x: 301, y: 402});
});

test('returns the origin when no building matches', () => {
  const room = makeRoom({building: 'Unknown'});
  expect(getRoomPosition(room, buildings)).toEqual({x: 0, y: 0});
});
