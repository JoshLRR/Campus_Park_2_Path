/**
 * JsonGraphRepository.ts
 *
 * `GraphRepository` implementation that builds the graph from a plain
 * JSON document (e.g. the seeded `graph.json`), mapping each raw node
 * into a `RoomNode` or `PathNode` based on its `kind`.
 */

import type {GraphRepository} from './GraphRepository';
import type {Node} from '../types/Node';
import {PathNode} from '../types/PathNode';
import {RoomNode} from '../types/RoomNode';
import type {Room} from '../types/Room';
import type {PathFeatures} from '../types/PathFeatures';
import type {RoomFeatures} from '../types/RoomFeatures';

interface JsonNeighbor {
  to: number;
  distance: number;
}

interface JsonNode {
  id: number;
  kind: string;
  position: {x: number; y: number; floorNum: number};
  neighbors: JsonNeighbor[];
  features: number[];
  roomNumber?: string;
}

export interface JsonGraph {
  nodes: JsonNode[];
  [key: string]: unknown;
}

export class JsonGraphRepository implements GraphRepository {
  private readonly nodes: Node[];

  constructor(json: JsonGraph) {
    this.nodes = json.nodes.map(n => {
      if (n.kind === 'room') {
        return new RoomNode(
          n.id,
          n.position,
          (n.roomNumber ?? '') as Room,
          n.features as RoomFeatures[],
          n.neighbors,
        );
      }
      return new PathNode(
        n.id,
        n.position,
        n.neighbors,
        n.features as PathFeatures[],
      );
    });
  }

  getGraph(): Node[] {
    return this.nodes;
  }
}
