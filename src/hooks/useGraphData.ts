/**
 * useGraphData.ts
 *
 * Loads graph node data for the campus map.
 *
 * This hook was extracted from App.tsx without changing behavior.
 */

import {useEffect, useState} from 'react';
import {GraphNode} from '../components/Map/GraphOverlay';

export function useGraphData() {
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [availableFloors, setAvailableFloors] = useState<number[]>([1]);

  useEffect(() => {
    const loadGraphData = async () => {
      try {
        const response = await fetch('/graph.json');

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
          },
        }));

        setGraphNodes(nodes);

        // Extract available floors
        const floors = [
          ...new Set(nodes.map(node => node.position.floorNum)),
        ].sort((a, b) => a - b);

        setAvailableFloors(floors.length > 0 ? floors : [0]);

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
  };
}
