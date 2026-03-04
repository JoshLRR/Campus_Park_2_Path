import {IPathOrchestrator} from './I_PathOrchestrator';
import {appLogger} from '../../../logging/index';
import type {Node} from '../../../types/Node';
import {PathRequest} from '../../../types/PathRequest';
import {PathResult} from '../../../types/PathResponse';

export class PathOrchestrator implements IPathOrchestrator {
  constructor(private readonly graph: Node[]) {}

  async resolvePath(request: PathRequest): Promise<PathResult> {
    appLogger.debug('PathOrchestrator: resolving path', {request});
    try {
      const result: PathResult = {status: 'not_found'};

      // TODO: strategy selection, decoration, algorithm invocation

      if (result.status === 'not_found') {
        appLogger.warn('PathOrchestrator: no path found', {request});
      } else {
        appLogger.info('PathOrchestrator: path resolved successfully');
      }
      return result;
    } catch (error) {
      appLogger.error(
        'PathOrchestrator: unexpected error during path resolution',
        {request},
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
