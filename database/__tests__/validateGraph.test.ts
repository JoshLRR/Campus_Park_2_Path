import fs from 'fs';
import os from 'os';
import path from 'path';

import {describe, expect, it} from 'vitest';

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

  it('fails duplicate node ids', () => {
    const graph: GraphJson = {
      nodes: [
        makeNode(1),
        makeNode(1, 'room', {
          roomNumber: 'T101',
          features: [8],
        }),
      ],
    };

    const result = validateGraph(graph);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate graph node ids found: 1');
  });

  it('builds a readable pass/fail report', () => {
    const result = validateGraph(makeValidGraph());
    const report = buildValidationReport('graph.json', result);

    expect(report).toContain('Validation report for graph.json');
    expect(report).toContain('RESULT: PASS');
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
