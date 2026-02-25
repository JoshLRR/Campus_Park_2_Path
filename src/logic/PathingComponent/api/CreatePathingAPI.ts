// createPathAPI.ts (in pathing subsystem, not in UI)
import {PathAPI} from './PathAPI';
import {PathOrchestrator} from '../application/PathOrchestrator';
//import { buildGraph } from "./infrastructure/buildGraph";

/**
 *
 * @returns a `PathAPI` object, necessary for performing a pathing request
 */
export function createPathAPI() {
  //const graph = ... ;
  // TODO : Inject PathOrchestrator with the graph probably once that's finished
  // const orchestrator = new PathOrchestrator(graph);
  const orchestrator = new PathOrchestrator();
  return new PathAPI(orchestrator);
}
