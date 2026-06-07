/**
 * GraphRepository.ts
 *
 * Contract for sources of campus graph data. Implementors (hardcoded,
 * JSON-seeded, live-DB-backed) all expose the same `getGraph()` shape
 * so the pathing subsystem can be wired to any of them interchangeably.
 */

import type {Node} from '../types/Node';

export interface GraphRepository {
  getGraph(): Node[];
}
