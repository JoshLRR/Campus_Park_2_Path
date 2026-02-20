import {Edge} from './Edge';

export type NodeId = number;

export interface Node {
  id: NodeId;
  position: PositionOptions;
  neighbors: Edge[];
}
