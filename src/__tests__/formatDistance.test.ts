/**
 * formatDistance.test.ts
 *
 * Unit tests for `formatDistance` (src/logic/formatDistance.ts) — the
 * meters-to-feet display formatter behind the distance-unit toggle.
 */

import {expect, test} from 'vitest';
import {formatDistance} from '../logic/formatDistance';

test('formats meters as-is, rounded to the nearest whole number', () => {
  expect(formatDistance(120, 'm')).toBe('120 m');
  expect(formatDistance(120.6, 'm')).toBe('121 m');
  expect(formatDistance(0, 'm')).toBe('0 m');
});

test('converts meters to feet using the standard conversion factor', () => {
  expect(formatDistance(1, 'ft')).toBe('3 ft'); // 1 * 3.28084 -> 3.28 -> 3
  expect(formatDistance(10, 'ft')).toBe('33 ft'); // 32.8084 -> 33
  expect(formatDistance(100, 'ft')).toBe('328 ft'); // 328.084 -> 328
});
