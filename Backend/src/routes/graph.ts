/**
 * routes/graph.ts
 *
 * Express router exposing the campus graph (`/api/graph`) — reads
 * nodes, edges, and room-feature associations from MySQL and assembles
 * them into the JSON graph shape the frontend's `JsonGraphRepository` expects.
 */

import express, {Request, Response} from 'express';
import {RowDataPacket} from 'mysql2';
import {pool} from '../db/pool';

const router = express.Router();

type GraphNodeRow = RowDataPacket & {
  id: number;
  x: number;
  y: number;
  floorNum: number;
  kind: 'room' | 'path';
  roomNumber: string | null;
  roomId: number | null;
};

type EdgeRow = RowDataPacket & {
  fromNodeId: number;
  toNodeId: number;
  distance: number;
};

type RoomFeatureRow = RowDataPacket & {
  roomId: number;
  featureId: number;
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [nodeRows] = await pool.query<GraphNodeRow[]>(`
      SELECT
        gn.graph_node_id AS id,
        gn.x,
        gn.y,
        gn.floor AS floorNum,
        CASE
          WHEN rn.room_id IS NOT NULL THEN 'room'
          ELSE 'path'
        END AS kind,
        r.room_code AS roomNumber,
        r.room_id AS roomId
      FROM graph_nodes gn
      LEFT JOIN room_nodes rn
        ON gn.graph_node_id = rn.graph_node_id
      LEFT JOIN rooms r
        ON rn.room_id = r.room_id
      WHERE gn.is_active = 1
      ORDER BY gn.graph_node_id;
    `);

    const [edgeRows] = await pool.query<EdgeRow[]>(`
      SELECT
        from_node_id AS fromNodeId,
        to_node_id AS toNodeId,
        distance
      FROM edges
      WHERE is_active = 1;
    `);

    const [featureRows] = await pool.query<RoomFeatureRow[]>(`
      SELECT
        room_id AS roomId,
        feature_id AS featureId
      FROM room_feature_map;
    `);

    const featuresByRoomId = new Map<number, number[]>();

    for (const row of featureRows) {
      const existingFeatures = featuresByRoomId.get(row.roomId) ?? [];
      existingFeatures.push(row.featureId);
      featuresByRoomId.set(row.roomId, existingFeatures);
    }

    const neighborsByNodeId = new Map<
      number,
      {to: number; distance: number}[]
    >();

    for (const edge of edgeRows) {
      const existingNeighbors = neighborsByNodeId.get(edge.fromNodeId) ?? [];

      existingNeighbors.push({
        to: edge.toNodeId,
        distance: Number(edge.distance),
      });

      neighborsByNodeId.set(edge.fromNodeId, existingNeighbors);
    }

    const nodes = nodeRows.map(node => ({
      id: node.id,
      kind: node.kind,
      type: node.kind,
      position: {
        x: Number(node.x),
        y: Number(node.y),
        floorNum: Number(node.floorNum ?? 1),
      },
      neighbors: neighborsByNodeId.get(node.id) ?? [],
      features: node.roomId ? (featuresByRoomId.get(node.roomId) ?? []) : [],
      ...(node.roomNumber ? {roomNumber: node.roomNumber} : {}),
    }));

    res.json({
      nodes,
    });
  } catch (error) {
    console.error('Failed to load graph:', error);
    res.status(500).json({error: 'Failed to load graph'});
  }
});

export default router;
