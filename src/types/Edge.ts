/**
 * Edge.ts
 *
 * A directed graph connection from one node to another (`to` plus a
 * traversal `distance`), stored on `Node.neighbors`.
 */

import {NodeId} from './Node';

export interface Edge {
  to: NodeId;
  distance: number;
}
