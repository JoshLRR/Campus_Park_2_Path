import {NodeId} from './Node';

export interface Edge {
  to: NodeId;
  distance: number;
}
