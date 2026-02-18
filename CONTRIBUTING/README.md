# Contributing to Campus Part & Path

Thank you for your interest in contributing to our project! In this document you will find information on our development process.

# File Structure

Here is the overall structure of this repo:

campus-park-2-path/
├─ .github/
│ └─ workflows/
│ └─ runner-heartbeat.yml
├─ LICENSE
├─ README.md
├─ package.json
├─ package-lock.json
├─ vite.config.ts
├─ tsconfig.json
│ └─ index.html
├─ docs/
│ └─ testing/
│ ├─ testing-log.md
│ ├─ verification-matrix.md
│ └─ evidence/
│ └─ sprint-2/
│ └─ (screenshots / terminal output)
├─ src/
│ ├─ main.tsx
│ ├─ App.tsx
│ ├─ components/
│ │ ├─ Map/
│ │ │ ├─ MapView.tsx
│ │ │ ├─ RoomTile.tsx
│ │ │ ├─ StartMarker.tsx
│ │ │ └─ RouteOverlay.tsx
│ │ ├─ Search/
│ │ │ ├─ SearchBar.tsx
│ │ │ └─ DestinationList.tsx
│ │ └─ Directions/
│ │ ├─ DirectionsPanel.tsx
│ │ └─ ReadDirectionsButton.tsx
│ ├─ data/
│ │ ├─ rooms.ts
│ │ └─ routes.ts # directions + arrows
│ ├─ logic/
│ │ ├─ search.ts # filter by roomNumber OR feature
│ │ ├─ routing.ts # select hard-coded route
│ │ └─ accessibility.ts # build read-aloud text
│ ├─ types/ # for
│ │ ├─ Room.ts
│ │ └─ Route.ts
│ ├─ styles/
│ │ └─ global.css
│ └─ __tests__/

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

# Creating tests

All tests are written using Vitest and live in `src/__tests__/`.

## Naming
- For TypeScript modules: `<ModuleName>.test.ts`
- For React components: `<ComponentName>.test.tsx`

## Imports
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

