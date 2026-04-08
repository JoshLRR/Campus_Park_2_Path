import {PathAPI} from './PathAPI';
import {PathOrchestrator} from '../application/PathOrchestrator';
import type {GraphRepository} from '../../../repositories/GraphRepository';
import graphJson from '../../../repositories/graph.json';
import {JsonGraphRepository} from '../../../repositories/JsonGraphRepository';

/**
 * Factory function that constructs and wires the `PathAPI` with its dependencies.
 *
 * Instantiates a `PathOrchestrator` with the graph provided by `repo` and injects
 * it into a new `PathAPI` instance. This is the only place where the pathing
 * subsystem is assembled — all other code depends on `I_PathAPI`, not on this factory.
 *
 * @param repo - A `GraphRepository` whose graph is used for all path computations.
 *               Defaults to `HardcodedGraphRepository` for development; swap in the
 *               real campus repository when it is available.
 * @returns A fully configured `PathAPI` ready to accept routing requests.
 */
export function createPathAPI(
  repo: GraphRepository = new JsonGraphRepository(graphJson),
) {
  const orchestrator = new PathOrchestrator(repo.getGraph());
  return new PathAPI(orchestrator);
}
