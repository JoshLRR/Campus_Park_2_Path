import type {IRoom} from './Room.ts';

export interface IRoomSearchService {
  search(searchQuery: string): Promise<IRoom[]>;
}

/**
 * Searches rooms by ID, name, or keyword. Primarily used for returning room search results in the UI.
 *
 * Ranking rules:
 * - exact ID match first
 * - exact keyword match next
 * - substring name/ID/keyword matches after
 *
 * Search is case-insensitive and trims whitespace.
 */
export class DefaultRoomSearchService implements IRoomSearchService {
  constructor(private readonly roomRepo: IRoomRepository) {}

  async search(searchQuery: string): Promise<IRoom[]> {
    const query = searchQuery.trim().toLowerCase();
    const rooms = await this.roomRepo.getAllRooms();
    if (!query) return rooms;

    return rooms
      .map(room => ({room, score: scoreRoom(room, query)}))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.room);
  }
}

function scoreRoom(room: IRoom, query: string): number {
  const id = room.id.toLowerCase();
  const name = room.name.toLowerCase();
  const keywords = room.keywords.map(k => k.toLowerCase());

  if (id === query) return 100;
  if (keywords.includes(query)) return 80;
  if (name.includes(query)) return 50;
  if (id.includes(query)) return 40;
  if (keywords.some(k => k.includes(query))) return 30;

  return 0;
}