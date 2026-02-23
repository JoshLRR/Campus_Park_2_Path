export type PositionDTO = {
  x: number;
  y: number;
  floorNum: number;
};

export type PathRequestDTO = {
  origin: {
    type: 'node' | 'coordinate';
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
