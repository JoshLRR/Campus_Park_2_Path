import {Node} from './Node';
import {RoomFeatures} from './RoomFeatures';
import {NodeId} from './Node';
import {Position} from './Node';
import {Edge} from './Edge';

export class RoomNode implements Node {
  id: NodeId;
  position: Position;
  neighbors: Edge[];
  features: RoomFeatures[];
  roomNumber: string; // Thinking this should come from a list elsewhere instead of strings like this

  constructor(
    id: NodeId,
    position: Position,
    roomNumber: string,
    features: RoomFeatures[] = [],
    neighbors: Edge[] = [],
  ) {
    this.id = id;
    this.position = position;
    this.roomNumber = roomNumber;
    this.features = features;
    this.neighbors = neighbors;
  }
}
