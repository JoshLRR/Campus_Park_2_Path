/**
 * PathNode.ts
 *
 * Concrete `Node` implementation representing a non-room waypoint
 * (hallway junction, outdoor path segment, etc.) in the campus graph.
 */

import {Node} from './Node';
import {NodeId} from './Node';
import {Position} from './Node';
import {Edge} from './Edge';
import {PathFeatures} from './PathFeatures';

export class PathNode implements Node {
  id: NodeId;
  position: Position;
  neighbors: Edge[];
  features: PathFeatures[];

  constructor(
    id: NodeId,
    position: Position,
    neighbors: Edge[] = [],
    features: PathFeatures[] = [],
  ) {
    this.id = id;
    this.position = position;
    this.features = features;
    this.neighbors = neighbors;
  }
}
