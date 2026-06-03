import express from 'express';
import {pool} from '../db/pool';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [nodes] = await pool.query(`
      SELECT
        gn.graph_node_id AS id,
        gn.x,
        gn.y,
        gn.floor,
        CASE
          WHEN rn.room_id IS NOT NULL THEN 'room'
          ELSE 'path'
        END AS kind,
        r.room_code AS roomNumber
      FROM graph_nodes gn
      LEFT JOIN room_nodes rn ON gn.graph_node_id = rn.graph_node_id
      LEFT JOIN rooms r ON rn.room_id = r.room_id
      WHERE gn.is_active = 1
      ORDER BY gn.graph_node_id;
    `);

    const [edges] = await pool.query(`
      SELECT
        from_node_id,
        to_node_id,
        distance
      FROM edges
      WHERE is_active = 1;
    `);

    res.json({
      nodes,
      edges,
    });
  } catch (error) {
    console.error('Failed to load graph:', error);
    res.status(500).json({error: 'Failed to load graph'});
  }
});

export default router;
