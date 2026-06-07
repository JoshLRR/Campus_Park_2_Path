import {GraphNode} from '../components/Map/GraphOverlay';

export type DirectionStep = {
  nodeId: number;
  position: {x: number; y: number; floorNum: number};
  label: string;
  distanceTo: number;
  kind:
    | 'start'
    | 'waypoint'
    | 'destination'
    | 'turn-left'
    | 'turn-right'
    | 'straight';
};

// Minimum angle (radians) to call something a turn — ~30 degrees
const TURN_THRESHOLD_RAD = Math.PI / 6;
// Emit "continue straight" after walking this far without a turn (meters) —
// roughly a minute's walk, a reasonable interval for a wayfinding reminder
const STRAIGHT_RUN_DISTANCE_THRESHOLD = 75;

function detectTurn(
  prev: {x: number; y: number},
  curr: {x: number; y: number},
  next: {x: number; y: number},
): 'left' | 'right' | 'straight' {
  const inX = curr.x - prev.x;
  const inY = curr.y - prev.y;
  const outX = next.x - curr.x;
  const outY = next.y - curr.y;

  const magIn = Math.sqrt(inX * inX + inY * inY);
  const magOut = Math.sqrt(outX * outX + outY * outY);
  if (magIn === 0 || magOut === 0) return 'straight';

  const cosAngle = (inX * outX + inY * outY) / (magIn * magOut);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  if (angle < TURN_THRESHOLD_RAD) return 'straight';

  // y-down coord system: positive cross product = clockwise = right turn
  const cross = inX * outY - inY * outX;
  return cross > 0 ? 'right' : 'left';
}

export function buildDirections(
  path: number[],
  graphNodes: GraphNode[],
  startLabel: string,
  destLabel: string,
): DirectionStep[] {
  if (path.length < 2) return [];

  const nodeMap = new Map(graphNodes.map(n => [n.id, n]));

  const startNode = nodeMap.get(path[0]);
  if (!startNode) return [];

  const steps: DirectionStep[] = [];
  steps.push({
    nodeId: path[0],
    position: startNode.position,
    label: startLabel,
    distanceTo: 0,
    kind: 'start',
  });

  let accDistance = 0;

  for (let i = 1; i < path.length - 1; i++) {
    const prevNode = nodeMap.get(path[i - 1]);
    const currNode = nodeMap.get(path[i]);
    const nextNode = nodeMap.get(path[i + 1]);
    if (!prevNode || !currNode || !nextNode) continue;

    const edge = prevNode.neighbors.find(n => n.to === path[i]);
    accDistance += edge?.distance ?? 0;

    if (currNode.kind === 'room' && currNode.roomNumber) {
      steps.push({
        nodeId: path[i],
        position: currNode.position,
        label: currNode.roomNumber,
        distanceTo: accDistance,
        kind: 'waypoint',
      });
      accDistance = 0;
      continue;
    }

    const turn = detectTurn(
      prevNode.position,
      currNode.position,
      nextNode.position,
    );

    if (turn !== 'straight') {
      steps.push({
        nodeId: path[i],
        position: currNode.position,
        label: turn === 'left' ? 'Turn left' : 'Turn right',
        distanceTo: accDistance,
        kind: turn === 'left' ? 'turn-left' : 'turn-right',
      });
      accDistance = 0;
    } else if (accDistance > STRAIGHT_RUN_DISTANCE_THRESHOLD) {
      steps.push({
        nodeId: path[i],
        position: currNode.position,
        label: 'Continue straight',
        distanceTo: accDistance,
        kind: 'straight',
      });
      accDistance = 0;
    }
  }

  // Final edge to destination
  const lastPrevNode = nodeMap.get(path[path.length - 2]);
  const destNode = nodeMap.get(path[path.length - 1]);
  if (lastPrevNode && destNode) {
    const edge = lastPrevNode.neighbors.find(
      n => n.to === path[path.length - 1],
    );
    accDistance += edge?.distance ?? 0;
    steps.push({
      nodeId: path[path.length - 1],
      position: destNode.position,
      label: destLabel,
      distanceTo: accDistance,
      kind: 'destination',
    });
  }

  return steps;
}
