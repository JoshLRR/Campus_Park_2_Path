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

import {createPathAPI} from '../logic/PathingComponent/api/CreatePathingAPI';
import {PathOrchestrator} from '../logic/PathingComponent/application/PathOrchestrator';
import {HardcodedGraphRepository} from '../repositories/HardcodedGraphRepository';
import type {GraphRepository} from '../repositories/GraphRepository';
import type {PathRequest} from '../types/PathRequest';
import type {PathRequestDTO} from '../logic/PathingComponent/api/PathAPI.dto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeRequest(overrides?: Partial<PathRequestDTO>): PathRequestDTO {
  return {
    origin: {mode: 'node', value: '0'},
    destination: {mode: 'node', value: '3'},
    ...overrides,
  };
}

// ─── Validation pipeline ──────────────────────────────────────────────────────
//
// These tests verify that malformed requests are rejected by the real validator
// before they ever reach the orchestrator.

describe('Integration: validation rejects bad requests before orchestration', () => {
  it('returns validation_error for null', async () => {
    const api = createPathAPI();
    const result = await api.path(null);
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error when origin is missing', async () => {
    const api = createPathAPI();
    const result = await api.path({destination: {mode: 'node', value: '3'}});
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error when destination is missing', async () => {
    const api = createPathAPI();
    const result = await api.path({origin: {mode: 'node', value: '0'}});
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for an invalid origin mode', async () => {
    const api = createPathAPI();
    const req = nodeRequest();
    (req.origin as unknown as {mode: string}).mode = 'building';
    const result = await api.path(req);
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for an empty node value string', async () => {
    const api = createPathAPI();
    const req = nodeRequest();
    (req.origin as unknown as {value: string}).value = '';
    const result = await api.path(req);
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for unknown extra top-level properties', async () => {
    const api = createPathAPI();
    const req = {...nodeRequest(), extra: 'unexpected'} as unknown;
    const result = await api.path(req);
    expect(result.status).toBe('validation_error');
  });

  it('does not invoke the orchestrator when validation fails', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    await api.path(null);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ─── Valid requests flow end-to-end ──────────────────────────────────────────
//
// These tests verify that valid requests pass through the full pipeline and
// produce a well-formed response. The orchestrator is currently a stub that
// always returns not_found, so that is the expected outcome for all routing
// requests until algorithm implementations are wired in.

describe('Integration: valid requests are processed end-to-end', () => {
  it('returns a structured PathResponseDTO for a node-to-node request', async () => {
    const api = createPathAPI();
    const result = await api.path(nodeRequest());
    expect(result).toHaveProperty('status');
  });

  it('returns not_found for a valid node-to-node request (orchestrator is a stub)', async () => {
    const api = createPathAPI();
    const result = await api.path(nodeRequest());
    expect(result.status).toBe('not_found');
  });

  it('invokes the orchestrator exactly once for a valid request', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    await api.path(nodeRequest());
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('accepts a coordinate origin without throwing', async () => {
    const api = createPathAPI();
    const result = await api.path({
      origin: {mode: 'coordinate', value: {x: 10, y: 0, floorNum: 0}},
      destination: {mode: 'node', value: '3'},
    });
    expect(result).toHaveProperty('status');
  });

  it('accepts a poiType destination without throwing', async () => {
    const api = createPathAPI();
    const result = await api.path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'poiType', value: 'restroom'},
    });
    expect(result).toHaveProperty('status');
  });

  it('accepts all three preferences set to true', async () => {
    const api = createPathAPI();
    const result = await api.path(
      nodeRequest({
        preferences: {
          avoidStairs: true,
          avoidUncovered: true,
          avoidUnpaved: true,
        },
      }),
    );
    expect(result).toHaveProperty('status');
  });

  it('accepts a request with preferences omitted', async () => {
    const api = createPathAPI();
    const req = nodeRequest();
    delete req.preferences;
    const result = await api.path(req);
    expect(result).toHaveProperty('status');
  });

  it('returns internal_error when the orchestrator throws unexpectedly', async () => {
    const spy = vi
      .spyOn(PathOrchestrator.prototype, 'resolvePath')
      .mockRejectedValue(new Error('graph exploded'));
    const api = createPathAPI();
    const result = await api.path(nodeRequest());
    expect(result.status).toBe('internal_error');
    spy.mockRestore();
  });
});

// ─── Domain transformation is wired correctly ─────────────────────────────────
//
// These tests use call-through spies to observe the domain PathRequest that
// reaches the orchestrator, verifying the DTO→domain mapping is wired correctly
// across the full API→orchestrator boundary.

describe('Integration: DTO is correctly transformed into a domain PathRequest', () => {
  it('passes {kind: node, nodeId: number} for a node origin', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    await api.path(nodeRequest({origin: {mode: 'node', value: '1'}}));
    const domain = spy.mock.calls[0][0] as PathRequest;
    expect(domain.origin).toEqual({kind: 'node', nodeId: 1});
    spy.mockRestore();
  });

  it('passes {kind: coordinate, position} for a coordinate origin', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    await api.path({
      origin: {mode: 'coordinate', value: {x: 10, y: 0, floorNum: 0}},
      destination: {mode: 'node', value: '3'},
    });
    const domain = spy.mock.calls[0][0] as PathRequest;
    expect(domain.origin).toEqual({
      kind: 'coordinate',
      position: {x: 10, y: 0, floorNum: 0},
    });
    spy.mockRestore();
  });

  it('passes {kind: node, nodeId: number} for a node destination', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    await api.path(nodeRequest({destination: {mode: 'node', value: '6'}}));
    const domain = spy.mock.calls[0][0] as PathRequest;
    expect(domain.destination).toEqual({kind: 'node', nodeId: 6});
    spy.mockRestore();
  });

  it('passes {kind: poiType, poiType: string} for a poiType destination', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    await api.path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'poiType', value: 'parking'},
    });
    const domain = spy.mock.calls[0][0] as PathRequest;
    expect(domain.destination).toEqual({kind: 'poiType', poiType: 'parking'});
    spy.mockRestore();
  });

  it('passes an empty avoidFeatures array when preferences are omitted', async () => {
    const spy = vi.spyOn(PathOrchestrator.prototype, 'resolvePath');
    const api = createPathAPI();
    const req = nodeRequest();
    delete req.preferences;
    await api.path(req);
    const domain = spy.mock.calls[0][0] as PathRequest;
    expect(domain.avoidFeatures).toEqual([]);
    spy.mockRestore();
  });
});

// ─── Factory and dependency injection ─────────────────────────────────────────

describe('Integration: factory wires components correctly', () => {
  it('produces a new independent instance on each call', () => {
    const api1 = createPathAPI();
    const api2 = createPathAPI();
    expect(api1).not.toBe(api2);
  });

  it('uses HardcodedGraphRepository by default', () => {
    const spy = vi.spyOn(HardcodedGraphRepository.prototype, 'getGraph');
    createPathAPI();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('accepts a custom GraphRepository and calls getGraph() on it', () => {
    const fakeRepo: GraphRepository = {getGraph: vi.fn().mockReturnValue([])};
    createPathAPI(fakeRepo);
    expect(fakeRepo.getGraph).toHaveBeenCalledOnce();
  });

  it('custom repo with an empty graph still returns a valid response', async () => {
    const fakeRepo: GraphRepository = {getGraph: vi.fn().mockReturnValue([])};
    const api = createPathAPI(fakeRepo);
    const result = await api.path(nodeRequest());
    expect(result).toHaveProperty('status');
  });
});
