import {Edge} from './Edge';

export type NodeId = number;

export interface Position {
  x: number;
  y: number;
  floorNum: number;
}

export interface Node {
  id: NodeId;
  position: Position;
  neighbors: Edge[];
}
