// createPathAPI.ts (in pathing subsystem, not in UI)
import {PathAPI} from './PathAPI';
import {PathOrchestrator} from '../application/PathOrchestrator';
//import { buildGraph } from "./infrastructure/buildGraph";
// TODO replace this when we get the actual graph
import {testGraph} from '../../../exampleTest/TestGraph';

/**
 *
 * @returns a `PathAPI` object, necessary for performing a pathing request
 */
export function createPathAPI() {
  //const graph = ... ;
  // TODO : Inject PathOrchestrator with the graph probably once that's finished
  // const orchestrator = new PathOrchestrator(graph);
  const orchestrator = new PathOrchestrator(testGraph);
  return new PathAPI(orchestrator);
}
