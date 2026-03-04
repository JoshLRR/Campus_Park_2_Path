import type {GraphRepository} from './GraphRepository';
import type {Node} from '../types/Node';
import {PathNode} from '../types/PathNode';
import {RoomNode} from '../types/RoomNode';
import {PathFeatures} from '../types/PathFeatures';
import {RoomFeatures} from '../types/RoomFeatures';
import {Room} from '../types/Room';

/**
 * Hardcoded graph implementation of GraphRepository for development and testing.
 *
 * Graph layout (distances in feet):
 *
 *   A109(0) --10-- p1(1) --15-- p2(2) --8-- A110(3)
 *                   |              |
 *                  12             14
 *                   |              |
 *                  p3(4) --20-- p4(5) --10-- Parking_1A(6)
 *                   |
 *                  16
 *                   |
 *               Parking_1B(7)
 *
 * All edges are undirected (stored symmetrically on both endpoints).
 *
 * Expected shortest-path costs (Dijkstra / uniform-cost):
 *   A109(0) → A110(3)          0→1→2→3       cost = 33
 *   A109(0) → Parking_1A(6)   0→1→2→5→6     cost = 49
 *   A109(0) → Parking_1B(7)   0→1→4→7       cost = 38
 *   A110(3) → Parking_1B(7)   3→2→1→4→7     cost = 51
 */
export class HardcodedGraphRepository implements GraphRepository {
  getGraph(): Node[] {
    return [
      // id 0 — classroom A109, building entrance side
      new RoomNode(
        0,
        {x: 0, y: 0, floorNum: 0},
        Room.A109,
        [RoomFeatures.Classroom],
        [{to: 1, distance: 10}],
      ),

      // id 1 — covered junction at building entrance
      new PathNode(
        1,
        {x: 10, y: 0, floorNum: 0},
        [
          {to: 0, distance: 10},
          {to: 2, distance: 15},
          {to: 4, distance: 12},
        ],
        [PathFeatures.Paved, PathFeatures.Covered],
      ),

      // id 2 — hallway junction midpoint
      new PathNode(
        2,
        {x: 25, y: 0, floorNum: 0},
        [
          {to: 1, distance: 15},
          {to: 3, distance: 8},
          {to: 5, distance: 14},
        ],
        [PathFeatures.Paved],
      ),

      // id 3 — classroom A110, far end of the hallway
      new RoomNode(
        3,
        {x: 33, y: 0, floorNum: 0},
        Room.A110,
        [RoomFeatures.Classroom],
        [{to: 2, distance: 8}],
      ),

      // id 4 — ADA-accessible outer path junction
      new PathNode(
        4,
        {x: 10, y: 12, floorNum: 0},
        [
          {to: 1, distance: 12},
          {to: 5, distance: 20},
          {to: 7, distance: 16},
        ],
        [PathFeatures.Paved, PathFeatures.ADA_Access],
      ),

      // id 5 — outer path junction east
      new PathNode(
        5,
        {x: 25, y: 14, floorNum: 0},
        [
          {to: 4, distance: 20},
          {to: 2, distance: 14},
          {to: 6, distance: 10},
        ],
        [PathFeatures.Paved],
      ),

      // id 6 — surface parking lot 1A
      new RoomNode(
        6,
        {x: 45, y: 14, floorNum: 0},
        Room.Parking_Lot_1A,
        [RoomFeatures.Parking_Lot],
        [{to: 5, distance: 10}],
      ),

      // id 7 — surface parking lot 1B; also a bus stop
      new RoomNode(
        7,
        {x: 10, y: 28, floorNum: 0},
        Room.Parking_Lot_1B,
        [RoomFeatures.Parking_Lot, RoomFeatures.Bus_Stop],
        [{to: 4, distance: 16}],
      ),
    ];
  }
}
