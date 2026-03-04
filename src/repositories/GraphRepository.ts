import type {Node} from '../types/Node';

export interface GraphRepository {
  getGraph(): Node[];
}
