import type {NodeId} from './Node';

export type PathResult =
  | {status: 'found'; nodes: NodeId[]; totalDistance: number}
  | {status: 'not_found'};
