import Ajv, {JSONSchemaType} from 'ajv';
import type {PathRequestDTO} from './PathingAPI.dto';
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
    // eslint-disable-next-line no-console
    console.log(validate.errors);
    throw new PathRequestValidationError(validate.errors ?? []);
  }
}
