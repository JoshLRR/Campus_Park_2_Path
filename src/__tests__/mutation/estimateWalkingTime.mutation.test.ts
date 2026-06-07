/**
 * estimateWalkingTime.mutation.test.ts
 *
 * Targets a mutant Stryker reported as surviving against
 * `src/logic/estimateWalkingTime.ts` (`npm run test:mutation`):
 * replacing the `~${Math.round(minutes)} min` template with `''` still
 * passed the existing suite, because nothing asserted on the exact
 * formatted string. These cases pin down the literal output so that
 * mutation survives only if the formatting itself is genuinely
 * unobservable.
 */

import {expect, test} from 'vitest';
import {formatWalkingTime} from '../../logic/estimateWalkingTime';

test('formats sub-minute distances as "<1 min"', () => {
  expect(formatWalkingTime(40)).toBe('<1 min');
});

test('formats minute-or-longer distances as "~N min"', () => {
  expect(formatWalkingTime(80)).toBe('~1 min');
  expect(formatWalkingTime(400)).toBe('~5 min');
});

test('rounds to the nearest minute', () => {
  expect(formatWalkingTime(279)).toBe('~3 min');
  expect(formatWalkingTime(281)).toBe('~4 min');
});
