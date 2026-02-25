import {describe, it, expect} from 'vitest';

import {
  assertIsPathRequestDTO,
  PathRequestValidationError,
} from '../logic/api/PathRequestValidator.ts';

import type {PathRequestDTO} from '../logic/api/PathAPI.dto.ts';

function expectValid(data: unknown): asserts data is PathRequestDTO {
  expect(() => assertIsPathRequestDTO(data)).not.toThrow();
}

function expectInvalid(data: unknown): PathRequestValidationError {
  let err: unknown;
  try {
    assertIsPathRequestDTO(data);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(PathRequestValidationError);
  return err as PathRequestValidationError;
}

/**
 * Helper builders (keeps tests readable, and makes it easy to tweak if DTO evolves).
 */
function buildValidNodeRequest(
  overrides?: Partial<PathRequestDTO>,
): PathRequestDTO {
  const base: PathRequestDTO = {
    origin: {mode: 'node', value: 'A110'},
    destination: {mode: 'node', value: 'B204'},
    preferences: {
      avoidStairs: true,
      avoidUncovered: false,
      avoidUnpaved: false,
    },
  };
  return {...base, ...overrides};
}

function buildValidCoordinateRequest(
  overrides?: Partial<PathRequestDTO>,
): PathRequestDTO {
  const base: PathRequestDTO = {
    origin: {mode: 'node', value: {x: 12.34, y: 56.78, floorNum: 1}},
    destination: {mode: 'coordinate', value: 'restroom'},
    preferences: {
      avoidStairs: true,
      avoidUncovered: true,
      avoidUnpaved: false,
    },
  };
  return {...base, ...overrides};
}

describe('PathRequestValidator (JSON Schema)', () => {
  it('accepts a valid request with origin.mode=node and string origin.value', () => {
    const req = buildValidNodeRequest();
    expectValid(req);
  });

  it('accepts a valid request with origin.mode=coordinate and object origin.value', () => {
    const req = buildValidCoordinateRequest();
    expectValid(req);
  });

  it('accepts requests when preferences is omitted (if schema marks it optional)', () => {
    const req = buildValidNodeRequest();
    delete (req as unknown as {preferences?: unknown}).preferences;

    expectValid(req);
  });

  it('rejects when request is not an object', () => {
    expectInvalid('not-an-object');
    expectInvalid(42);
    expectInvalid(null);
    expectInvalid(undefined);
    expectInvalid([]);
  });

  it('rejects when required fields are missing: origin', () => {
    const req = {destination: {mode: 'node', value: 'B204'}};
    const err = expectInvalid(req);
    expect(err.details).toBeTruthy();
  });

  it('rejects when required fields are missing: destination', () => {
    const req = {origin: {mode: 'node', value: 'A110'}};
    const err = expectInvalid(req);
    expect(err.details).toBeTruthy();
  });

  it('rejects origin with invalid mode', () => {
    const req = buildValidNodeRequest();
    // runtime corruption
    (req.origin as unknown as {mode: string}).mode = 'room'; // not allowed by schema
    expectInvalid(req);
  });

  it('rejects destination with invalid mode', () => {
    const req = buildValidNodeRequest();
    (req.destination as unknown as {mode: string}).mode = 'closest'; // not allowed
    expectInvalid(req);
  });

  it('rejects origin.mode=node when origin.value is not a string', () => {
    const req = buildValidNodeRequest();
    (req.origin as unknown as {value: unknown}).value = {
      x: 1,
      y: 2,
      floorNum: 1,
    };
    expectInvalid(req);
  });

  it('rejects origin.mode=coordinate when origin.value is not a Coordinate object', () => {
    const req = buildValidCoordinateRequest();
    (req.origin as unknown as {value: unknown}).value = 'A110';
    expectInvalid(req);
  });

  it('rejects origin.mode=coordinate when Coordinate is missing required fields', () => {
    const req = buildValidCoordinateRequest();
    (req.origin as unknown as {value: unknown}).value = {x: 1, y: 2}; // missing floorNum
    expectInvalid(req);
  });

  it('rejects origin.mode=coordinate when floorNum is not an integer', () => {
    const req = buildValidCoordinateRequest();
    (req.origin as unknown as {value: unknown}).value = {
      x: 1,
      y: 2,
      floorNum: 1.5,
    };
    expectInvalid(req);
  });

  it('rejects destination.value when not a string', () => {
    const req = buildValidNodeRequest();
    (req.destination as unknown as {value: unknown}).value = 123;
    expectInvalid(req);
  });

  it('rejects empty strings if schema enforces minLength=1', () => {
    const req = buildValidNodeRequest();
    (req.origin as unknown as {value: unknown}).value = '';
    expectInvalid(req);

    const req2 = buildValidNodeRequest();
    (req2.destination as unknown as {value: unknown}).value = '';
    expectInvalid(req2);
  });

  it('rejects unknown extra properties at the top level when additionalProperties=false', () => {
    const req = buildValidNodeRequest() as unknown as Record<string, unknown>;
    req['unexpected'] = 'nope';
    expectInvalid(req);
  });

  it('rejects unknown extra properties inside origin/destination/coordinate when additionalProperties=false', () => {
    const req = buildValidCoordinateRequest();

    // extra prop inside origin
    (req.origin as unknown as Record<string, unknown>)['extra'] = true;
    expectInvalid(req);

    const req2 = buildValidCoordinateRequest();
    // extra prop inside coordinate value
    (req2.origin.value as unknown as Record<string, unknown>)['z'] = 999;
    expectInvalid(req2);

    const req3 = buildValidCoordinateRequest();
    // extra prop inside destination
    (req3.destination as unknown as Record<string, unknown>)['extra'] = true;
    expectInvalid(req3);
  });
});
