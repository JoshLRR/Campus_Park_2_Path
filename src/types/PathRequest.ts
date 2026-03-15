import type {NodeId, Position} from './Node';
import type {PathFeatures} from './PathFeatures';

export type PathOrigin =
  | {kind: 'node'; nodeId: NodeId}
  | {kind: 'coordinate'; position: Position};

export type PathDestination =
  | {kind: 'node'; nodeId: NodeId}
  | {kind: 'poiType'; poiType: string};

export type PathRequest = {
  origin: PathOrigin;
  destination: PathDestination;
  avoidFeatures: PathFeatures[];
};
