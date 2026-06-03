import {expect, test} from 'vitest';
import {getMapWidth} from '../logic/getMapWidth';

test('returns w-1/2 when both sidebars are open', () => {
  expect(getMapWidth(true, true)).toBe('w-1/2');
});

test('returns w-3/4 when only the left sidebar is open', () => {
  expect(getMapWidth(true, false)).toBe('w-3/4');
});

test('returns w-3/4 when only the right panel is open', () => {
  expect(getMapWidth(false, true)).toBe('w-3/4');
});

test('returns w-full when neither sidebar is open', () => {
  expect(getMapWidth(false, false)).toBe('w-full');
});
