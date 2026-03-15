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

/**
 * Thrown when an incoming request fails JSON schema validation.
 *
 * The `details` field contains the raw AJV error array, which can be
 * inspected to identify exactly which fields failed and why.
 */
export class PathRequestValidationError extends Error {
  constructor(public readonly details: unknown) {
    super('Invalid PathRequestDTO');
    this.name = 'PathRequestValidationError';
  }
}

/**
 * Asserts that `data` conforms to the `PathRequestDTO` JSON schema.
 *
 * This is a TypeScript assertion function — if it returns without throwing,
 * the compiler narrows `data` to `PathRequestDTO` at the call site.
 *
 * Validation is performed by AJV using the schema at:
 * `src/logic/PathingComponent/api/schemas/PathRequest.schema.json`
 *
 * @param data - Raw unknown input to validate.
 * @throws {PathRequestValidationError} If `data` does not match the schema.
 */
export function assertIsPathRequestDTO(
  data: unknown,
): asserts data is PathRequestDTO {
  const valid = validate(data);

  if (!valid) {
    throw new PathRequestValidationError(validate.errors ?? []);
  }
}
