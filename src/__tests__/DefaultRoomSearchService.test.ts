import {describe, it, expect, vi, beforeEach} from 'vitest';
import {DefaultRoomSearchService} from '../types/RoomSearchService';
import type {IRoom} from '../types/Room';
import {RoomType} from '../types/Room';

function makeRepo(rooms: IRoom[]): IRoomRepository {
  return {
    getAllRooms: vi.fn(async () => rooms),
    getRoomById: vi.fn(async (id: string) => {
      const q = id.trim().toLowerCase();
      return rooms.find(r => r.id.toLowerCase() === q) ?? null;
    }),
  };
}

describe('DefaultRoomSearchService', () => {
  let rooms: IRoom[];
  let repo: IRoomRepository;

  beforeEach(() => {
    rooms = [
      {
        id: 'N101',
        name: 'Classroom N101',
        type: RoomType.classroom,
        keywords: ['classroom', 'lecture'],
      },
      {
        id: 'N102',
        name: 'Classroom N102',
        type: RoomType.classroom,
        keywords: ['classroom'],
      },
      {
        id: 'CAFE',
        name: 'Campus Cafe',
        type: RoomType.cafe,
        keywords: ['cafe', 'coffee', 'food'],
      },
      {
        id: 'BATH',
        name: 'Main Bathroom',
        type: RoomType.bathroom,
        keywords: ['bathroom', 'restroom'],
      },
    ];

    repo = makeRepo(rooms);
  });

  it('returns all rooms when query is empty or whitespace', async () => {
    const svc = new DefaultRoomSearchService(repo);

    const a = await svc.search('');
    const b = await svc.search('   ');

    expect(a).toHaveLength(4);
    expect(b).toHaveLength(4);
    expect(repo.getAllRooms).toHaveBeenCalledTimes(2);
  });

  it('matches exact room id (case-insensitive)', async () => {
    const svc = new DefaultRoomSearchService(repo);

    const result = await svc.search('n101');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('N101');
  });

  it('matches exact keyword (case-insensitive and trimmed)', async () => {
    const svc = new DefaultRoomSearchService(repo);

    const result = await svc.search('  CAFE  ');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('CAFE');
  });

  it("matches partial keyword (e.g., 'caf' finds cafe)", async () => {
    const svc = new DefaultRoomSearchService(repo);

    const result = await svc.search('caf');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('CAFE');
  });

  it("matches by name substring (e.g., 'campus' finds cafe)", async () => {
    const svc = new DefaultRoomSearchService(repo);

    const result = await svc.search('campus');

    expect(result.map(r => r.id)).toContain('CAFE');
  });

  it('returns [] when nothing matches', async () => {
    const svc = new DefaultRoomSearchService(repo);

    const result = await svc.search('does-not-exist');

    expect(result).toEqual([]);
  });

  it('orders by relevance: exact id match beats partial matches', async () => {
    // Add a room that partially matches "N101"
    rooms.push({
      id: 'N101A',
      name: 'Annex N101A',
      type: RoomType.classroom,
      keywords: ['classroom'],
    });

    repo = makeRepo(rooms);
    const svc = new DefaultRoomSearchService(repo);

    const result = await svc.search('N101');

    expect(result[0].id).toBe('N101'); // exact should be first
    expect(result.map(r => r.id)).toContain('N101A'); // partial should still show up
  });

  it('calls getAllRooms once per search call', async () => {
    const svc = new DefaultRoomSearchService(repo);

    await svc.search('cafe');
    await svc.search('bathroom');

    expect(repo.getAllRooms).toHaveBeenCalledTimes(2);
  });
});
