import {GraphNode} from '../components/Map/GraphOverlay';

export type DirectionStep = {
  nodeId: number;
  position: {x: number; y: number; floorNum: number};
  label: string;
  distanceTo: number;
  kind: 'start' | 'waypoint' | 'destination';
};

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
    if (!prevNode || !currNode) continue;

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
