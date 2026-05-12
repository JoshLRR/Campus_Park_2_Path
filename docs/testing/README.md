# Writing and Recording Testing Data

## Running Tests

Run tests from the project root:

```bash
npm test
```

To run just one test:

```bash
npm test testName
```

*please remember to replace `testName` with your actual test name*

## Coverage

Coverage is provided by [`@vitest/coverage-v8`](https://vitest.dev/guide/coverage). It is not generated automatically — neither CI nor any git hook produces it, so you have to run it locally when you want a fresh report.

To generate a report:

```bash
npx vitest run --coverage
```

You can also use `npm test -- --coverage`, but that also fires the `pretest` (`tsc`) and `posttest` (`gts lint`) hooks, so it takes longer. Use the `npx` form for a quick check.

### What you get

A summary table prints to the terminal, and the full report is written to `./coverage/` (gitignored — do not commit it):

- `coverage/index.html` — browsable per-file drilldown with line-by-line highlighting. Open it in a browser.
- `coverage/clover.xml` — XML totals, useful if you ever want to plug into a coverage service.
- `coverage/coverage-final.json` — raw V8 data.

The four metrics reported are **statements**, **branches**, **functions**, and **lines**. Only files imported by a test are instrumented, so untested files don't appear in the report at all — adding a test is what surfaces a file's coverage.

There are currently no thresholds configured, so coverage cannot fail the build. The numbers are informational.

## Writing a new test

TODO: How to read each table and use it to write tests when that feature is added.

- "Status" refers to the status of the individual test it will read:
	- ☑️ if the test is implemented
	- ⬜ if the test is not yet implemented
	- " * " if there is a note about the test's implementation (there will be more information at the foot of the table)
- "Value" is the input variable for the test
- "File Name" for the path of the file it is testing

## Profiled Tests
### **(Example Component) Unit Tests**

These are located in `src/file/path`

| Status | File name | Description  | etc... |
| :---------------: | ----------------------------- | :----------: | -----|
| ☑️ | src/file/path.csv    | This is a description of a test |  etc...  |
| ⬜ | src/file/path.csv    | This is a description of a test |  etc...  |
| ⬜* | src/file/path.csv   | This is a description of a test |  etc...  |
\* this is a note about a test

TODO Tests when that feature is added.

### **Pathfinding Functions**

These are located in the file `src/file/path`

| Status | File name | Description  | etc... |
| :---------------: | ----------------------------- | :----------: | -----|
| ☑️ | src/file/path.csv    | This is a description of a test |  etc...  |
| ⬜ | src/file/path.csv    | This is a description of a test |  etc...  |
| ⬜\* | src/file/path.csv   | This is a description of a test |  etc...  |
\* this is a note about a test

TODO Tests when that feature is added.