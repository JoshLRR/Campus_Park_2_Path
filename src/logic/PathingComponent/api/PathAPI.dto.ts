/**
 * PathAPI.dto.ts
 *
 * Wire-format DTOs for the Pathfinding API boundary — the raw
 * request/response shapes exchanged with the frontend, validated
 * against `PathRequest.schema.json` before being mapped to internal
 * domain types (`PathRequest`/`PathResult`).
 */

export type PositionDTO = {
  x: number;
  y: number;
  floorNum: number;
};

export type PathRequestDTO = {
  origin: {
    mode: 'node' | 'coordinate';
    value: string | PositionDTO;
  };
  destination: {
    mode: 'node' | 'poiType';
    value: string;
  };
  preferences?: {
    avoidStairs?: boolean;
    avoidUncovered?: boolean;
    avoidUnpaved?: boolean;
  };
};

export type PathResponseDTO = {
  status: 'success' | 'validation_error' | 'not_found' | 'internal_error';
  message?: string;
  path?: {
    nodes: string[];
    totalDistance: number;
  };
};
