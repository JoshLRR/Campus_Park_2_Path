# Creating a new branch

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

Name your test file `<CLASS_NAME>.test.ts`, for example, `Account.test.ts`
At the beginning of your test file include the following imports

```
import { expect, test } from 'vitest'
import { <TEST_NAMES } from './<FILE_NAME>.ts'
```

Here's an example, in a file named sum.test.js

```
import { expect, test } from 'vitest'
import { sum } from './sum.js'

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

The tests can then be run in the CLI with
```
npx vitest
```
or
```
npx vitest run
```
or
```
npm test run
```

---