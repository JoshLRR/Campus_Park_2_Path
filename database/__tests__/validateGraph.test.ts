import fs from 'fs';
import os from 'os';
import path from 'path';

import {describe, expect, it, vi} from 'vitest';

import {
  buildValidationReport,
  GraphJson,
  GraphNode,
  runValidateGraphCli,
  validateGraph,
} from '../scripts/validateGraph';

function makeNode(
  id: number,
  kind: string = 'path',
  options: Partial<GraphNode> = {},
): GraphNode {
  return {
    id,
    kind,
    position: {x: id, y: id + 1, floorNum: 0},
    imagePosition: {x: id * 10, y: id * 10 + 1},
    neighbors: [],
    features: [],
    ...options,
  };
}

function makeValidGraph(): GraphJson {
  return {
    graphId: 'test-graph',
    savedAt: '2026-05-12T00:00:00.000Z',
    nodes: [
      makeNode(1, 'path', {neighbors: [{to: 2, distance: 10.5}]}),
      makeNode(2, 'room', {
        roomNumber: 'T101',
        features: [8],
        neighbors: [{to: 1, distance: 10.5}],
      }),
    ],
  };
}

describe('validateGraph', () => {
  it('passes valid graph data', () => {
    const result = validateGraph(makeValidGraph());

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain('Found 2 total nodes');
    expect(result.warnings).toContain('Found 1 unique labeled rooms');
  });

  it('allows duplicate room numbers when feature sets match', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1),
        makeNode(50, 'room', {
          roomNumber: 'T121',
          features: [8],
          neighbors: [{to: 1, distance: 5}],
        }),
        makeNode(51, 'room', {
          roomNumber: 'T121',
          features: [8],
          neighbors: [{to: 1, distance: 7}],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(
      result.warnings.some(warning =>
        warning.includes('Duplicate roomNumber "T121" is valid'),
      ),
    ).toBe(true);
  });

  it('fails duplicate room numbers when feature sets do not match', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1),
        makeNode(36, 'room', {
          roomNumber: 'T102',
          features: [13],
          neighbors: [{to: 1, distance: 5}],
        }),
        makeNode(41, 'room', {
          roomNumber: 'T102',
          features: [3],
          neighbors: [{to: 1, distance: 7}],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(error =>
        error.includes(
          'Duplicate roomNumber "T102" has mismatched feature sets',
        ),
      ),
    ).toBe(true);
  });

  it('fails unlabeled room nodes', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1),
        makeNode(44, 'room', {
          roomNumber: '',
          features: [3],
          neighbors: [{to: 1, distance: 5}],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(error => error.includes('Unlabeled room nodes found')),
    ).toBe(true);
    expect(result.errors.some(error => error.includes('44'))).toBe(true);
  });

  it('fails missing neighbor node references', () => {
    const graph: GraphJson = {
      nodes: [makeNode(1, 'path', {neighbors: [{to: 999, distance: 5}]})],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Node 1 has neighbor 999, but node 999 does not exist',
    );
  });

  it('fails zero or negative distances', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1, 'path', {neighbors: [{to: 2, distance: 0}]}),
        makeNode(2),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Node 1 -> 2 has non-positive distance 0');
  });

  it('fails when graph.json has no top-level nodes array', () => {
    const result = validateGraph({} as GraphJson);

    expect(result).toEqual({
      isValid: false,
      errors: ['graph.json must contain a top-level nodes array'],
      warnings: [],
    });
  });

  it('fails nodes with a missing or non-integer id', () => {
    const graph: GraphJson = {
      nodes: [
        {kind: 'path', neighbors: []} as unknown as GraphNode,
        makeNode(2),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(error =>
        error.includes('Node is missing a valid integer id'),
      ),
    ).toBe(true);
  });

  it('treats a missing roomNumber the same as a blank one, sorted by id', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1),
        makeNode(45, 'room', {features: [3], neighbors: [{to: 1, distance: 5}]}),
        makeNode(30, 'room', {
          roomNumber: '   ',
          features: [2],
          neighbors: [{to: 1, distance: 5}],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Unlabeled room nodes found. These need roomNumber fixed or the nodes removed: 30, 45',
    );
  });

  it('normalizes feature signatures (sorting multi-value sets, defaulting missing features) when comparing duplicates', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1),
        makeNode(60, 'room', {
          roomNumber: 'T200',
          features: [9, 3],
          neighbors: [{to: 1, distance: 5}],
        }),
        makeNode(61, 'room', {
          roomNumber: 'T200',
          features: [3, 9],
          neighbors: [{to: 1, distance: 5}],
        }),
        makeNode(70, 'room', {
          roomNumber: 'T300',
          features: undefined,
          neighbors: [{to: 1, distance: 5}],
        }),
        makeNode(71, 'room', {
          roomNumber: 'T300',
          features: [],
          neighbors: [{to: 1, distance: 5}],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(true);
    expect(
      result.warnings.some(warning =>
        warning.includes('Duplicate roomNumber "T200" is valid'),
      ),
    ).toBe(true);
    expect(
      result.warnings.some(warning =>
        warning.includes('Duplicate roomNumber "T300" is valid'),
      ),
    ).toBe(true);
  });

  it('fails when a node has neighbors that are not a list', () => {
    const graph: GraphJson = {
      nodes: [
        {
          ...makeNode(1),
          neighbors: 'not-an-array' as unknown as GraphNode['neighbors'],
        },
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Node 1 has neighbors that are not a list');
  });

  it('fails neighbors with a non-integer "to" reference', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1, 'path', {
          neighbors: [{to: 'two' as unknown as number, distance: 5}],
        }),
        makeNode(2),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(error =>
        error.includes("has a neighbor without a valid 'to'"),
      ),
    ).toBe(true);
  });

  it('fails neighbors with a non-numeric distance', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1, 'path', {
          neighbors: [{to: 2, distance: 'far' as unknown as number}],
        }),
        makeNode(2),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(error => error.includes('is missing a valid distance')),
    ).toBe(true);
  });

  it('warns about nodes with an unrecognized kind, sorted by id', () => {
    const graph: GraphJson = {
      nodes: [makeNode(1), makeNode(20, 'elevator'), makeNode(10, 'stairwell')],
    };

    const result = validateGraph(graph);

    expect(result.warnings).toContain(
      'Nodes with unknown kind found: 10, 20',
    );
  });

  it('fails duplicate node ids, sorted numerically when more than one id repeats', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(2),
        makeNode(2, 'room', {roomNumber: 'T102', features: [3]}),
        makeNode(1),
        makeNode(1, 'room', {
          roomNumber: 'T101',
          features: [8],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate graph node ids found: 1, 2');
  });

  it('treats a missing neighbors list as an empty one', () => {
    const graph: GraphJson = {
      nodes: [{...makeNode(1), neighbors: undefined}],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('builds a readable pass/fail report', () => {
    const result = validateGraph(makeValidGraph());
    const report = buildValidationReport('graph.json', result);

    expect(report).toContain('Validation report for graph.json');
    expect(report).toContain('RESULT: PASS');
  });

  it('omits the WARNINGS section when the result has no warnings', () => {
    const report = buildValidationReport('graph.json', {
      isValid: false,
      errors: ['Something went wrong'],
      warnings: [],
    });

    expect(report).toContain('ERRORS');
    expect(report).toContain('- Something went wrong');
    expect(report).not.toContain('WARNINGS / INFO');
    expect(report).toContain('RESULT: FAIL');
  });

  it('CLI prints usage and returns 1 when no graph path is provided', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const exitCode = runValidateGraphCli([]);

      expect(exitCode).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Usage: tsx database/scripts/validateGraph.ts',
        ),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('CLI falls back to the default report path when --report is given without a value', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-validation-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const originalCwd = process.cwd();

    fs.writeFileSync(graphPath, JSON.stringify(makeValidGraph()), 'utf8');

    try {
      process.chdir(tempDir);

      const exitCode = runValidateGraphCli([graphPath, '--report']);

      const defaultReportPath = path.join(
        tempDir,
        'database',
        'reports',
        'graph_validation_report.txt',
      );

      expect(exitCode).toBe(0);
      expect(fs.existsSync(defaultReportPath)).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('CLI writes a custom report and returns 0 for valid graph data', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-validation-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const reportPath = path.join(tempDir, 'report.txt');

    fs.writeFileSync(graphPath, JSON.stringify(makeValidGraph()), 'utf8');

    const exitCode = runValidateGraphCli([graphPath, '--report', reportPath]);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(fs.readFileSync(reportPath, 'utf8')).toContain('RESULT: PASS');
  });

  it('CLI writes a report to the default report path when no --report path is provided', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-validation-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const originalCwd = process.cwd();

    fs.writeFileSync(graphPath, JSON.stringify(makeValidGraph()), 'utf8');

    try {
      process.chdir(tempDir);

      const exitCode = runValidateGraphCli([graphPath]);

      const defaultReportPath = path.join(
        tempDir,
        'database',
        'reports',
        'graph_validation_report.txt',
      );

      expect(exitCode).toBe(0);
      expect(fs.existsSync(defaultReportPath)).toBe(true);
      expect(fs.readFileSync(defaultReportPath, 'utf8')).toContain(
        'RESULT: PASS',
      );
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('CLI returns 1 for invalid graph data and still writes the default report', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-validation-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const originalCwd = process.cwd();

    fs.writeFileSync(
      graphPath,
      JSON.stringify({
        nodes: [
          makeNode(44, 'room', {
            roomNumber: '',
            features: [3],
          }),
        ],
      }),
      'utf8',
    );

    try {
      process.chdir(tempDir);

      const exitCode = runValidateGraphCli([graphPath]);

      const defaultReportPath = path.join(
        tempDir,
        'database',
        'reports',
        'graph_validation_report.txt',
      );

      expect(exitCode).toBe(1);
      expect(fs.existsSync(defaultReportPath)).toBe(true);

      const report = fs.readFileSync(defaultReportPath, 'utf8');
      expect(report).toContain('RESULT: FAIL');
      expect(report).toContain('Unlabeled room nodes found');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('CLI does not write a report when --no-report is used', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-validation-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const originalCwd = process.cwd();

    fs.writeFileSync(graphPath, JSON.stringify(makeValidGraph()), 'utf8');

    try {
      process.chdir(tempDir);

      const exitCode = runValidateGraphCli([graphPath, '--no-report']);

      const defaultReportPath = path.join(
        tempDir,
        'database',
        'reports',
        'graph_validation_report.txt',
      );

      expect(exitCode).toBe(0);
      expect(fs.existsSync(defaultReportPath)).toBe(false);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
