import type {NodeId} from './Node';

export type PathResult =
  | {
      status: 'found';
      nodes: NodeId[];
      totalDistance: number;
      warnings: PathWarning[];
    }
  | {status: 'not_found'};

export type PathWarningCode =
  | 'avoids_stairs'
  | 'uncovered_segment'
  | 'unpaved_surface'
  | 'dimly_lit'
  | 'long_route';

export type PathWarning = {
  code: PathWarningCode;
  message: string;
};
