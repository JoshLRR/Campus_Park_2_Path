import '@testing-library/jest-dom/vitest';
import {afterEach} from 'vitest';
import {cleanup} from '@testing-library/react';

// Unmount React trees rendered by @testing-library between tests so that
// queries do not see DOM left over from previous test cases.
afterEach(() => {
  cleanup();
});
