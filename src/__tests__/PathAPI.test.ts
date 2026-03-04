import {describe, it, expect, vi} from 'vitest';

vi.mock('../logging/index', () => ({
  appLogger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  },
}));

import {PathAPI} from '../logic/PathingComponent/api/PathAPI';
import {PathOrchestrator} from '../logic/PathingComponent/application/PathOrchestrator';
import {PathFeatures} from '../types/PathFeatures';
import type {PathResult} from '../types/PathResponse';
import type {PathRequest} from '../types/PathRequest';
import type {PathRequestDTO} from '../logic/PathingComponent/api/PathAPI.dto';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function makeOrchestrator(result: PathResult): {
  api: PathAPI;
  resolveSpy: ReturnType<typeof vi.fn>;
} {
  const resolveSpy = vi.fn().mockResolvedValue(result);
  const orchestrator = {resolvePath: resolveSpy} as unknown as PathOrchestrator;
  return {api: new PathAPI(orchestrator), resolveSpy};
}

const FOUND_RESULT: PathResult = {
  status: 'found',
  nodes: [1, 2, 3],
  totalDistance: 42.5,
};

const NOT_FOUND_RESULT: PathResult = {status: 'not_found'};

function nodeRequest(overrides?: Partial<PathRequestDTO>): PathRequestDTO {
  return {
    origin: {mode: 'node', value: '1'},
    destination: {mode: 'node', value: '2'},
    ...overrides,
  };
}

function coordinateRequest(
  overrides?: Partial<PathRequestDTO>,
): PathRequestDTO {
  return {
    origin: {mode: 'coordinate', value: {x: 12.34, y: 56.78, floorNum: 1}},
    destination: {mode: 'poiType', value: 'restroom'},
    ...overrides,
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────

describe('path() — validation', () => {
  it('returns validation_error for null input', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const result = await api.path(null);
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for a plain string', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const result = await api.path('not-an-object');
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error when origin is missing', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const result = await api.path({destination: {mode: 'node', value: '2'}});
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error when destination is missing', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const result = await api.path({origin: {mode: 'node', value: '1'}});
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for an invalid origin mode', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const req = nodeRequest();
    (req.origin as unknown as {mode: string}).mode = 'room';
    const result = await api.path(req);
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for an invalid destination mode', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const req = nodeRequest();
    (req.destination as unknown as {mode: string}).mode = 'closest';
    const result = await api.path(req);
    expect(result.status).toBe('validation_error');
  });

  it('does not call the orchestrator when validation fails', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(null);
    expect(resolveSpy).not.toHaveBeenCalled();
  });
});

// ─── Response mapping ────────────────────────────────────────────────────────

describe('path() — response mapping', () => {
  it('returns success with path data when orchestrator finds a path', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const result = await api.path(nodeRequest());
    expect(result.status).toBe('success');
    expect(result.path?.totalDistance).toBe(42.5);
  });

  it('maps NodeIds to strings in the success response', async () => {
    const {api} = makeOrchestrator(FOUND_RESULT);
    const result = await api.path(nodeRequest());
    expect(result.path?.nodes).toEqual(['1', '2', '3']);
  });

  it('returns not_found when orchestrator returns not_found', async () => {
    const {api} = makeOrchestrator(NOT_FOUND_RESULT);
    const result = await api.path(nodeRequest());
    expect(result.status).toBe('not_found');
  });
});

// ─── Domain transformation ───────────────────────────────────────────────────

describe('path() — domain transformation', () => {
  it('maps node origin to {kind: node, nodeId: number}', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(nodeRequest({origin: {mode: 'node', value: '42'}}));
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.origin).toEqual({kind: 'node', nodeId: 42});
  });

  it('maps coordinate origin to {kind: coordinate, position}', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(coordinateRequest());
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.origin).toEqual({
      kind: 'coordinate',
      position: {x: 12.34, y: 56.78, floorNum: 1},
    });
  });

  it('maps node destination to {kind: node, nodeId: number}', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(nodeRequest({destination: {mode: 'node', value: '99'}}));
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.destination).toEqual({kind: 'node', nodeId: 99});
  });

  it('maps poiType destination to {kind: poiType, poiType: string}', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(coordinateRequest());
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.destination).toEqual({
      kind: 'poiType',
      poiType: 'restroom',
    });
  });

  it('maps avoidStairs to PathFeatures.Stairs', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(nodeRequest({preferences: {avoidStairs: true}}));
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.avoidFeatures).toContain(PathFeatures.Stairs);
  });

  it('maps avoidUncovered to PathFeatures.Covered', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(nodeRequest({preferences: {avoidUncovered: true}}));
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.avoidFeatures).toContain(PathFeatures.Covered);
  });

  it('maps avoidUnpaved to PathFeatures.Paved', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    await api.path(nodeRequest({preferences: {avoidUnpaved: true}}));
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.avoidFeatures).toContain(PathFeatures.Paved);
  });

  it('sends empty avoidFeatures when preferences are omitted', async () => {
    const {api, resolveSpy} = makeOrchestrator(FOUND_RESULT);
    const req = nodeRequest();
    delete req.preferences;
    await api.path(req);
    const domainRequest = resolveSpy.mock.calls[0][0] as PathRequest;
    expect(domainRequest.avoidFeatures).toEqual([]);
  });
});

// ─── Error handling ──────────────────────────────────────────────────────────

describe('path() — error handling', () => {
  it('returns internal_error when the orchestrator throws', async () => {
    const resolveSpy = vi.fn().mockRejectedValue(new Error('graph exploded'));
    const orchestrator = {
      resolvePath: resolveSpy,
    } as unknown as PathOrchestrator;
    const api = new PathAPI(orchestrator);
    const result = await api.path(nodeRequest());
    expect(result.status).toBe('internal_error');
  });

  it('never propagates exceptions to the caller', async () => {
    const resolveSpy = vi.fn().mockRejectedValue(new Error('unexpected'));
    const orchestrator = {
      resolvePath: resolveSpy,
    } as unknown as PathOrchestrator;
    const api = new PathAPI(orchestrator);
    await expect(api.path(nodeRequest())).resolves.not.toThrow();
  });
});
