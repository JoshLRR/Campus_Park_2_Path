import Ajv, {JSONSchemaType} from 'ajv';
import type {PathRequestDTO} from './PathAPI.dto';
import schema from './schemas/PathRequest.schema.json';

const ajv = new Ajv({
  allErrors: true,
  strict: true,
});

const validate = ajv.compile<PathRequestDTO>(
  schema as unknown as JSONSchemaType<PathRequestDTO>,
);

export class PathRequestValidationError extends Error {
  constructor(public readonly details: unknown) {
    super('Invalid PathRequestDTO');
    this.name = 'PathRequestValidationError';
  }
}

/**
 * Runtime assertion + type narrowing.
 */
export function assertIsPathRequestDTO(
  data: unknown,
): asserts data is PathRequestDTO {
  const valid = validate(data);

  if (!valid) {
    throw new PathRequestValidationError(validate.errors ?? []);
  }
}
