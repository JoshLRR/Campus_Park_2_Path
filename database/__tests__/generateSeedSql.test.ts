import fs from 'fs';
import os from 'os';
import path from 'path';

import {describe, expect, it} from 'vitest';

import {
  generateSeedSql,
  ReferenceData,
  runGenerateSeedSqlCli,
} from '../scripts/generateSeedSql';
import {GraphJson, GraphNode} from '../scripts/validateGraph';

function makeNode(
  id: number,
  kind: string = 'path',
  options: Partial<GraphNode> = {},
): GraphNode {
  return {
    id,
    kind,
    position: {x: id, y: id + 1, floorNum: 0},
    imagePosition: {x: id * 100, y: id * 100 + 1},
    neighbors: [],
    features: [],
    ...options,
  };
}

function makeValidGraph(): GraphJson {
  return {
    graphId: 'test-graph',
    nodes: [
      makeNode(1, 'path', {
        position: {x: 11.25, y: 22.5, floorNum: 0},
        imagePosition: {x: 999, y: 999},
        neighbors: [{to: 2, distance: 10.5}],
      }),
      makeNode(2, 'room', {
        roomNumber: 'T101',
        features: [8],
        position: {x: 33.75, y: 44.25, floorNum: 0},
        imagePosition: {x: 888, y: 888},
        neighbors: [{to: 1, distance: 10.5}],
      }),
    ],
  };
}

function makeReferenceData(): ReferenceData {
  return {
    buildings: [
      {
        code: 'T',
        name: 'T Building',
      },
    ],
    roomFeatures: [
      {
        featureId: 8,
        name: 'classroom',
        description: 'Classroom or instructional space',
      },
    ],
  };
}

describe('generateSeedSql', () => {
  it('uses position, not imagePosition', () => {
    const sql = generateSeedSql(makeValidGraph());

    expect(sql).toContain('(1, 11.25, 22.5');
    expect(sql).toContain('(2, 33.75, 44.25');
    expect(sql).not.toContain('999');
    expect(sql).not.toContain('888');
  });

  it('uses reference data for building and room feature names', () => {
    const sql = generateSeedSql(makeValidGraph(), makeReferenceData());

    expect(sql).toContain("('T', 'T Building')");
    expect(sql).toContain(
      "(8, 'classroom', 'Classroom or instructional space')",
    );
    expect(sql).not.toContain('graph_feature_8');
  });

  it('preserves graph node ids from graph.json', () => {
    const sql = generateSeedSql(makeValidGraph());

    expect(sql).toContain(
      'INSERT INTO graph_nodes (graph_node_id, x, y, building_id, floor, is_active) VALUES',
    );
    expect(sql).toContain('(1, 11.25, 22.5');
    expect(sql).toContain('(2, 33.75, 44.25');
    expect(sql).toContain('ALTER TABLE graph_nodes AUTO_INCREMENT = 3;');
  });

  it('creates one room row but multiple room_nodes for duplicate room nodes', () => {
    const graph: GraphJson = {
      graphId: 'duplicate-room-test',
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

    const sql = generateSeedSql(graph);

    expect(sql).toContain("'T121'");
    expect(sql).toContain('(50, (SELECT room_id FROM rooms');
    expect(sql).toContain('(51, (SELECT room_id FROM rooms');
    expect(sql).not.toContain('T121_NODE');
  });

  it('creates room feature inserts', () => {
    const graph: GraphJson = {
      graphId: 'feature-test',
      nodes: [
        makeNode(1),
        makeNode(2, 'room', {
          roomNumber: 'T101',
          features: [8],
          neighbors: [{to: 1, distance: 5}],
        }),
        makeNode(3, 'room', {
          roomNumber: 'T101',
          features: [8],
          neighbors: [{to: 1, distance: 7}],
        }),
      ],
    };

    const sql = generateSeedSql(graph, makeReferenceData());

    expect(sql).toContain(
      'INSERT INTO room_features (feature_id, name, description) VALUES',
    );
    expect(sql).toContain(
      "(8, 'classroom', 'Classroom or instructional space')",
    );
    expect(sql).toContain(
      'INSERT INTO room_feature_map (room_id, feature_id) VALUES',
    );
  });

  it('creates directed edges from neighbor entries', () => {
    const sql = generateSeedSql(makeValidGraph());

    expect(sql).toContain(
      'INSERT INTO edges (from_node_id, to_node_id, distance, is_active) VALUES',
    );
    expect(sql).toContain('(1, 2, 10.5, 1)');
    expect(sql).toContain('(2, 1, 10.5, 1)');
  });

  it('throws when a neighbor points to a missing node', () => {
    const graph: GraphJson = {
      nodes: [makeNode(1, 'path', {neighbors: [{to: 999, distance: 5}]})],
    };

    expect(() => generateSeedSql(graph)).toThrow('points to missing node');
  });

  it('CLI refuses to write seed SQL when validation fails', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-sql-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const outputPath = path.join(tempDir, 'seed_graph.sql');

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

    const exitCode = runGenerateSeedSqlCli([graphPath, outputPath]);

    expect(exitCode).toBe(1);
    expect(fs.existsSync(outputPath)).toBe(false);
  });

  it('CLI writes seed SQL when validation passes', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-sql-'));
    const graphPath = path.join(tempDir, 'graph.json');
    const outputPath = path.join(tempDir, 'seed_graph.sql');
    const referenceDataPath = path.join(tempDir, 'referenceData.json');

    fs.writeFileSync(graphPath, JSON.stringify(makeValidGraph()), 'utf8');
    fs.writeFileSync(
      referenceDataPath,
      JSON.stringify(makeReferenceData()),
      'utf8',
    );

    const exitCode = runGenerateSeedSqlCli([
      graphPath,
      outputPath,
      '--reference-data',
      referenceDataPath,
    ]);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(outputPath)).toBe(true);

    const sql = fs.readFileSync(outputPath, 'utf8');
    expect(sql).toContain('INSERT INTO graph_nodes');
    expect(sql).toContain('INSERT INTO edges');
    expect(sql).toContain(
      "(8, 'classroom', 'Classroom or instructional space')",
    );
  });
});
