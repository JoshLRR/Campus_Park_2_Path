import {PathAPI} from './PathAPI';
import {PathOrchestrator} from '../application/PathOrchestrator';
// TODO replace this when we get the actual graph
import {testGraph} from '../../../exampleTest/TestGraph';

/**
 * Factory function that constructs and wires the `PathAPI` with its dependencies.
 *
 * Instantiates a `PathOrchestrator` with the campus graph and injects it into
 * a new `PathAPI` instance. This is the only place where the pathing subsystem
 * is assembled — all other code depends on `I_PathAPI`, not on this factory.
 *
 * @returns A fully configured `PathAPI` ready to accept routing requests.
 *
 * @todo Replace `testGraph` with the real campus graph once available.
 * @todo Consider injecting the graph as a parameter once `GraphProvider` is implemented.
 */
export function createPathAPI() {
  // TODO : Inject PathOrchestrator with the graph probably once that's finished
  // const orchestrator = new PathOrchestrator(graph);
  const orchestrator = new PathOrchestrator(testGraph);
  return new PathAPI(orchestrator);
}
