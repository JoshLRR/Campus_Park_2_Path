import fs from 'node:fs';
import path from 'node:path';

export type GraphNodeKind = 'path' | 'room';

export interface GraphNeighbor {
  to: number;
  distance: number;
}

export interface GraphPosition {
  x: number;
  y: number;
  floorNum?: number;
}

export interface GraphNode {
  id: number;
  kind: GraphNodeKind | string;
  position?: GraphPosition;
  imagePosition?: {
    x: number;
    y: number;
  };
  neighbors?: GraphNeighbor[];
  features?: number[];
  roomNumber?: string;
}

export interface GraphJson {
  format?: string;
  formatVersion?: number;
  graphId?: string;
  savedAt?: string;
  nodes?: GraphNode[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const DEFAULT_REPORT_PATH = 'database/reports/graph_validation_report.txt';

function featureSignature(node: GraphNode): string {
  return [...(node.features ?? [])]
    .map(feature => Number(feature))
    .sort((a, b) => a - b)
    .join(',');
}

function featureDisplay(node: GraphNode): string {
  return `[${featureSignature(node)}]`;
}

function roomCode(node: GraphNode): string {
  return (node.roomNumber ?? '').trim();
}

export function validateGraph(graph: GraphJson): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodes = graph.nodes;

  if (!Array.isArray(nodes)) {
    return {
      isValid: false,
      errors: ['graph.json must contain a top-level nodes array'],
      warnings: [],
    };
  }

  const seenIds = new Set<number>();
  const duplicateIds: number[] = [];

  for (const node of nodes) {
    if (!Number.isInteger(node.id)) {
      errors.push(
        `Node is missing a valid integer id: ${JSON.stringify(node)}`,
      );
      continue;
    }

    if (seenIds.has(node.id)) {
      duplicateIds.push(node.id);
    }

    seenIds.add(node.id);
  }

  if (duplicateIds.length > 0) {
    errors.push(
      `Duplicate graph node ids found: ${[...new Set(duplicateIds)]
        .sort((a, b) => a - b)
        .join(', ')}`,
    );
  }

  const nodeIds = seenIds;
  const roomNodes = nodes.filter(node => node.kind === 'room');
  const pathNodes = nodes.filter(node => node.kind === 'path');

  const unlabeledRoomNodeIds = roomNodes
    .filter(node => roomCode(node).length === 0)
    .map(node => node.id)
    .sort((a, b) => a - b);

  if (unlabeledRoomNodeIds.length > 0) {
    errors.push(
      `Unlabeled room nodes found. These need roomNumber fixed or the nodes removed: ${unlabeledRoomNodeIds.join(
        ', ',
      )}`,
    );
  }

  const roomsByCode = new Map<string, GraphNode[]>();

  for (const node of roomNodes) {
    const code = roomCode(node);

    if (!code) {
      continue;
    }

    const current = roomsByCode.get(code) ?? [];
    current.push(node);
    roomsByCode.set(code, current);
  }

  for (const [code, duplicateRoomNodes] of [...roomsByCode.entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    if (duplicateRoomNodes.length <= 1) {
      continue;
    }

    const signatures = new Set(duplicateRoomNodes.map(featureSignature));
    const details = duplicateRoomNodes
      .slice()
      .sort((a, b) => a.id - b.id)
      .map(node => `node ${node.id} features ${featureDisplay(node)}`)
      .join(', ');

    if (signatures.size > 1) {
      errors.push(
        `Duplicate roomNumber "${code}" has mismatched feature sets: ${details}`,
      );
    } else {
      warnings.push(
        `Duplicate roomNumber "${code}" is valid as multiple room nodes for one room: ${details}`,
      );
    }
  }

  for (const node of nodes) {
    const neighbors = node.neighbors ?? [];

    if (!Array.isArray(neighbors)) {
      errors.push(`Node ${node.id} has neighbors that are not a list`);
      continue;
    }

    for (const neighbor of neighbors) {
      if (!Number.isInteger(neighbor.to)) {
        errors.push(
          `Node ${node.id} has a neighbor without a valid 'to': ${JSON.stringify(neighbor)}`,
        );
        continue;
      }

      if (!nodeIds.has(neighbor.to)) {
        errors.push(
          `Node ${node.id} has neighbor ${neighbor.to}, but node ${neighbor.to} does not exist`,
        );
      }

      const distance = Number(neighbor.distance);

      if (!Number.isFinite(distance)) {
        errors.push(
          `Node ${node.id} -> ${neighbor.to} is missing a valid distance`,
        );
        continue;
      }

      if (distance <= 0) {
        errors.push(
          `Node ${node.id} -> ${neighbor.to} has non-positive distance ${distance}`,
        );
      }
    }
  }

  const unknownKindIds = nodes
    .filter(node => node.kind !== 'room' && node.kind !== 'path')
    .map(node => node.id)
    .sort((a, b) => a - b);

  if (unknownKindIds.length > 0) {
    warnings.push(
      `Nodes with unknown kind found: ${unknownKindIds.join(', ')}`,
    );
  }

  warnings.push(`Found ${nodes.length} total nodes`);
  warnings.push(`Found ${pathNodes.length} path nodes`);
  warnings.push(`Found ${roomNodes.length} room nodes`);
  warnings.push(`Found ${roomsByCode.size} unique labeled rooms`);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildValidationReport(
  graphPath: string,
  result: ValidationResult,
): string {
  const lines: string[] = [`Validation report for ${graphPath}`, ''];

  if (result.errors.length > 0) {
    lines.push('ERRORS');
    for (const error of result.errors) {
      lines.push(`- ${error}`);
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('WARNINGS / INFO');
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  lines.push(result.isValid ? 'RESULT: PASS' : 'RESULT: FAIL');

  return lines.join('\n');
}

export function readGraphJson(graphPath: string): GraphJson {
  return JSON.parse(fs.readFileSync(graphPath, 'utf8')) as GraphJson;
}

function parseArgs(argv: string[]): {
  graphPath?: string;
  reportPath: string;
  noReport: boolean;
} {
  const args = [...argv];
  const parsed: {graphPath?: string; reportPath: string; noReport: boolean} = {
    reportPath: DEFAULT_REPORT_PATH,
    noReport: false,
  };

  parsed.graphPath = args.shift();

  while (args.length > 0) {
    const arg = args.shift();

    if (arg === '--report') {
      parsed.reportPath = args.shift() ?? DEFAULT_REPORT_PATH;
    }

    if (arg === '--no-report') {
      parsed.noReport = true;
    }
  }

  return parsed;
}

export function runValidateGraphCli(argv = process.argv.slice(2)): number {
  const {graphPath, reportPath, noReport} = parseArgs(argv);

  if (!graphPath) {
    console.error(
      'Usage: tsx database/scripts/validateGraph.ts <graph.json> [--report <report.txt>] [--no-report]',
    );
    return 1;
  }

  const graph = readGraphJson(graphPath);
  const result = validateGraph(graph);
  const report = buildValidationReport(graphPath, result);

  if (!noReport) {
    fs.mkdirSync(path.dirname(reportPath), {recursive: true});
    fs.writeFileSync(reportPath, `${report}\n`, 'utf8');
    console.log(`Wrote validation report to ${reportPath}`);
  }

  console.log(report);
  return result.isValid ? 0 : 1;
}

if (process.argv[1]?.endsWith('validateGraph.ts')) {
  process.exitCode = runValidateGraphCli();
}
