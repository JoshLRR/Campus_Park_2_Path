import {Node} from './Node';
import {RoomFeatures} from './RoomFeatures';
import {NodeId} from './Node';
import {Position} from './Node';
import {Edge} from './Edge';
import {Room} from './Room';

export class RoomNode implements Node {
  id: NodeId;
  position: Position;
  neighbors: Edge[];
  features: RoomFeatures[];
  roomNumber: Room;
  //   building: string; // Keep separate so we can find all rooms for a single building?
  // For now embedding the building into the room number. If a reason to keep it separate appears
  // it'll be easy to switch

  constructor(
    id: NodeId,
    position: Position,
    roomNumber: Room,
    features: RoomFeatures[] = [],
    neighbors: Edge[] = [],
    // building: string,
  ) {
    this.id = id;
    this.position = position;
    this.roomNumber = roomNumber;
    this.features = features;
    this.neighbors = neighbors;
    // this.building = building;
  }
}
