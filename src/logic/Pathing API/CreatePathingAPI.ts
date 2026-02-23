// createPathingAPI.ts (in pathing subsystem, not in UI)
import {PathingAPI} from './PathingAPI';
import {PathOrchestrator} from '../PathApplication/PathOrchestrator';
//import { buildGraph } from "./infrastructure/buildGraph";

/**
 *
 * @returns a `PathingAPI` object, necessary for performing a pathing request
 */
export function createPathingAPI() {
  //const graph = ... ;
  // TODO : Inject PathOrchestrator with the graph probably once that's finished
  // const orchestrator = new PathOrchestrator(graph);
  const orchestrator = new PathOrchestrator();
  return new PathingAPI(orchestrator);
}
