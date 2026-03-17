import {describe, expect, test} from 'vitest';
import {createPathAPI} from '../logic/PathingComponent/api/CreatePathingAPI';

// Integration tests for the PathingComponent stack.
//
// These tests exercise the full request lifecycle end-to-end:
//   raw JSON → PathAPI → PathOrchestrator → DijkstraAlgorithm → PathResponseDTO
//
// The HardcodedGraphRepository is used by default (no repo argument to createPathAPI).
//
// Graph layout for reference:
//   A109(0) --10-- p1(1) --15-- p2(2) --8-- A110(3)
//                   |              |
//                  12             14
//                   |              |
//                  p3(4) --20-- p4(5) --10-- Parking_1A(6)
//                   |
//                  16
//                   |
//               Parking_1B(7)

describe('PathingComponent integration', () => {
  test('returns a JSON path response for a valid node-to-node request', async () => {
    const api = createPathAPI();

    const response = await api.path({
      origin: {mode: 'node', value: '0'},
      destination: {mode: 'node', value: '3'},
    });

    expect(response).toMatchObject({
      status: 'success',
      path: {
        nodes: ['0', '1', '2', '3'],
        totalDistance: 33,
      },
    });
    expect(() => JSON.stringify(response)).not.toThrow();
  });
});
