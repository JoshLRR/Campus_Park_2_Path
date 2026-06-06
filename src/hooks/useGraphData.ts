/**
 * useGraphData.ts
 *
 * Loads graph node data for the campus map.
 *
 * This hook was extracted from App.tsx without changing behavior.
 */

import {useEffect, useState} from 'react';
import {GraphNode} from '../components/Map/GraphOverlay';
import {Room} from '../components/Map/MapView';

type AppRoom = Room & {id: number};

export function useGraphData() {
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [availableFloors, setAvailableFloors] = useState<number[]>([1]);
  const [rooms, setRooms] = useState<AppRoom[]>([]);

  useEffect(() => {
    const loadGraphData = async () => {
      try {
        const response = await fetch('/api/graph');

        if (!response.ok) {
          throw new Error(`Failed to fetch graph.json: ${response.status}`);
        }

        const data = await response.json();

        const rawNodes: GraphNode[] = Array.isArray(data)
          ? data
          : (data.nodes ?? []);

        // Convert JSON data to GraphNode format
        const nodes: GraphNode[] = rawNodes.map((node: GraphNode) => ({
          ...node,
          position: {
            ...node.position,
            floorNum: node.position.floorNum ?? 1,
          },
        }));

        setGraphNodes(nodes);

        // Derive Room objects from room-kind nodes
        const derivedRooms: AppRoom[] = nodes
          .filter(node => node.kind === 'room' && node.roomNumber)
          .map(node => {
            const buildingMatch = node.roomNumber!.match(/^([A-Za-z]+)/);
            return {
              id: node.id,
              name: node.roomNumber!,
              building: buildingMatch ? buildingMatch[1] : 'Campus',
              buildingId: 0,
              floor: node.position.floorNum,
              x: node.position.x,
              y: node.position.y,
            };
          });

        setRooms(derivedRooms);

        // Extract available floors
        const floors = [
          ...new Set(nodes.map(node => node.position.floorNum)),
        ].sort((a, b) => a - b);

        setAvailableFloors(floors.length > 0 ? floors : [1]);

        console.log(
          `Loaded ${nodes.length} graph nodes across ${floors.length} floors`,
        );
      } catch (error) {
        console.error('Failed to load graph data:', error);
      }
    };

    void loadGraphData();
  }, []);

  return {
    graphNodes,
    availableFloors,
    rooms,
  };
}
