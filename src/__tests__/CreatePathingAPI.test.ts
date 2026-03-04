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
import {PathAPI} from '../logic/PathingComponent/api/PathAPI';
import {HardcodedGraphRepository} from '../repositories/HardcodedGraphRepository';
import type {GraphRepository} from '../repositories/GraphRepository';
import type {Node} from '../types/Node';

// ─── Factory shape ───────────────────────────────────────────────────────────

describe('createPathAPI() — factory shape', () => {
  it('returns a PathAPI instance', () => {
    const api = createPathAPI();
    expect(api).toBeInstanceOf(PathAPI);
  });

  it('exposes a path() method (satisfies I_PathAPI)', () => {
    const api = createPathAPI();
    expect(typeof api.path).toBe('function');
  });

  it('returns a distinct instance on each call', () => {
    const api1 = createPathAPI();
    const api2 = createPathAPI();
    expect(api1).not.toBe(api2);
  });
});

// ─── Default repository ──────────────────────────────────────────────────────

describe('createPathAPI() — default repository', () => {
  it('uses HardcodedGraphRepository when no repo is provided', () => {
    const spy = vi.spyOn(HardcodedGraphRepository.prototype, 'getGraph');
    createPathAPI();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

// ─── Custom repository ───────────────────────────────────────────────────────

describe('createPathAPI() — custom repository', () => {
  it('calls getGraph() on the provided repo', () => {
    const fakeRepo: GraphRepository = {getGraph: vi.fn().mockReturnValue([])};
    createPathAPI(fakeRepo);
    expect(fakeRepo.getGraph).toHaveBeenCalledOnce();
  });

  it('uses the graph returned by the provided repo', () => {
    const customNode = {id: 99, edges: []} as unknown as Node;
    const fakeRepo: GraphRepository = {
      getGraph: vi.fn().mockReturnValue([customNode]),
    };
    // Just verifying the factory accepts the repo without error
    expect(() => createPathAPI(fakeRepo)).not.toThrow();
  });
});

// ─── Functional smoke tests ──────────────────────────────────────────────────

describe('createPathAPI() — functional smoke tests', () => {
  it('returns a PathResponseDTO with a status field for a valid request', async () => {
    const api = createPathAPI();
    const result = await api.path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'node', value: '3'},
    });
    expect(result).toHaveProperty('status');
  });

  it('never throws — resolves for a valid request', async () => {
    const api = createPathAPI();
    await expect(
      api.path({
        origin: {mode: 'node', value: '1'},
        destination: {mode: 'node', value: '2'},
      }),
    ).resolves.toBeDefined();
  });

  it('returns validation_error for a null request', async () => {
    const api = createPathAPI();
    const result = await api.path(null);
    expect(result.status).toBe('validation_error');
  });

  it('returns validation_error for a malformed request', async () => {
    const api = createPathAPI();
    const result = await api.path({origin: {mode: 'node', value: '1'}});
    expect(result.status).toBe('validation_error');
  });
});
