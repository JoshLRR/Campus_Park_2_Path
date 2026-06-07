/**
 * Room.ts
 *
 * Canonical list of room and destination identifiers, and the `Room`
 * union type derived from it for use throughout the app and graph data.
 */

// TODO Add every room and destination to this list. Yaaaaay.
const rooms = [
  'A109',
  'A110',
  'Parking_Lot_1B',
  'Parking_Lot_1A',
  'Parking_Lot_3A',
  'Parking_Lot_3B',
  'Parking_Lot_5',
  'Parking_Lot_4',
  'Parking_Lot_6',
  'Parking_Lot_8',
  'Parking_Lot_10',
  'Parking_Lot_12',
  'Parking_Lot_15',
  'Parking_Lot_13',
  'Parking_Lot_10C',
  'Parking_Lot_B1',
  'Parking_Lot_B2',
  'Parking_Lot_14',
  'Parking_Lot_B3',
  'Parking_Lot_C2',
  'Parking_Lot_C3',
  'Parking_Lot_C4',
  'Parking_Lot_C1',
  'Parking_Lot_C5',
  'Parking_Lot_C6',
  'Parking_Lot_C8',
  'Parking_Lot_C10',
  'Parking_Lot_D1',
  'Parking_Lot_C12',
  'Parking_Lot_D2',
  'Parking_Lot_18',
  'Parking_Lot_19',
  'Parking_Lot_16',
  'Parking_Lot_17',
  'Parking_Lot_9F',
  'Parking_Lot_9',
  'Parking_Lot_11',
  'Parking_Lot_20',
  'Parking_Lot_21',
  'Parking_Lot_F2',
] as const;

export const Room = Object.fromEntries(rooms.map(r => [r, r])) as {
  [K in (typeof rooms)[number]]: K;
};

export type Room = (typeof rooms)[number];
