// PathingAPI.ts

import {IPathingAPI} from './IPathingAPI';
import {PathRequestDTO, PathResponseDTO} from './PathingAPI.dto';
import {PathOrchestrator} from '../PathApplication/PathOrchestrator';

export class PathingAPI implements IPathingAPI {
  constructor(private readonly orchestrator: PathOrchestrator) {}

  async path(request: PathRequestDTO): Promise<PathResponseDTO> {
    const result: PathResponseDTO = {status: 'internal_error'};
    try {
      // eventually JSON Schema validation (stub for now)
      this.validateRequest(request);

      // Semantic validation
      //const domainRequest = this.transformToDomain(request);

      // Invoke orchestration
      //const result = await this.orchestrator.computePath(domainRequest);
    } catch (validation_error) {
      console.log(validation_error);
    }
    return result;
  }

  private validateRequest(request: PathRequestDTO): void {
    // TODO: plug in JSON schema validation
    request.origin.value = 'tk';
  }

  private transformToDomain(request: PathRequestDTO) {
    // TODO: convert DTO -> Domain objects
    return request;
  }
}
