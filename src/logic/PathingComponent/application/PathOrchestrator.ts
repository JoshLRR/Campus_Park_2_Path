import {IPathOrchestrator} from './I_PathOrchestrator';
import {appLogger} from '../../../logging/index';
import type {Node} from '../../../types/Node';
import {PathRequestDTO} from '../api/PathAPI.dto';

// TODO : Inject PathOrchestrator with the graph probably once that's finished

export class PathOrchestrator implements IPathOrchestrator {
  constructor(private readonly graph: Node[]) {}

  async resolvePath(request: PathRequestDTO) {
  }
}
