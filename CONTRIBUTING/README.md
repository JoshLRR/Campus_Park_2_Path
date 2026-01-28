# Creating a new branch

> Documentation on existing tests can be found in [`docs/testing/README.md`](../docs/testing/README.md).

## Branch Name Formatting

layer/feature_type/INITIALS/FEATURE/SUB_FEATURE

ex. backend/feature/jlo/login_service/fix_account_retrieval
or
ex. frontend/feature/dom/login_view

```
git checkout -b <BRANCH_NAME>

git push --set-upstream <BRANCH_NAME>
```

## Creating tests

All tests are written using Vitest and live in `src/__tests__/`.

### Naming
- For TypeScript modules: `<ModuleName>.test.ts`
- For React components: `<ComponentName>.test.tsx`

### Imports
Import the function/component from its location under `src/`.

Example:

```ts
import { expect, test } from 'vitest'
import { sum } from '../logic/sum'

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
})

```

Then in a file named sum.js

```
export function sum(a, b) {
  return a + b
}
```

Run tests from the project root:

```bash
npm test
```

