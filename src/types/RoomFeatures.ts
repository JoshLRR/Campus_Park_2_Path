// TODO - Update numbers
export const RoomFeatures = {
  "Men's_Bathroom": 1,
  "Men's_Bathroom_with_Changing_Table": 2,
  "Women's_Bathroom": 3,
  "Women's_Bathroom_with_Changing_Table": 4,
  Family_Bathroom: 5,
  // All_Gender_Bathroom:
  Elevator: 7,
  Classroom: 8,
  Vending_Machine: 9,
  Office: 10,
  Parking_Lot: 11,
  // Parking_Lot_1B: // Hmm, should we make each parking lot a room rather than a room feature?
  // Parking_Lot_1A:
  //  Parking_Lot_3A:
  // Parking_Lot_3B:
  // Parking_Lot_5:
  // Parking_Lot_4:
  // Parking_Lot_6:
  // Parking_Lot_8:
  // Parking_Lot_10:
  // Parking_Lot_12:
  // Parking_Lot_15:
  // Parking_Lot_13
  // Parking_Lot_10C
  // Parking_Lot_B1:
  // Parking_Lot_B2:
  // Parking_Lot_14:
  // Parking_Lot_B3:
  // Parking_Lot_C2:
  // Parking_Lot_C3:
  // Parking_Lot_C4:
  // Parking_Lot_C1:
  // Parking_Lot_C5:
  // Parking_Lot_C6:
  // Parking_Lot_C8:
  // Parking_Lot_C10:
  // Parking_Lot_D1:
  // Parking_Lot_C12:
  // Parking_Lot_D2:
  // Parking_Lot_18:
  // Parking_Lot_19:
  // Parking_Lot_16:
  // Parking_Lot_17:
  // Parking_Lot_9F:
  // Parking_Lot_9:
  // Parking_Lot_11:
  // Parking_Lot_20:
  // Parking_Lot_21:
  // Parking_Lot_F2:
  // ADA_Parking_Spot:      // Need to think about how this should actually be implemented
  Parking_Garage: 12,
  Cafe: 13,
  Cafeteria: 14,
  Library: 15,
  Printers: 16,
  Computer_Lab: 17,
  Prayer_Room: 18,
  Lactation_Room: 19,
  Shower: 20,
  Gym: 21,
  Lockers: 22,
  Locker_room: 23,
  Conference_room: 24,
  Study_room: 25,
  Study_room_with_whiteboard: 26,
  // Smoke_Shack:
  // Parking_Meter:
  // Bus_Stop:
  // Emergency_Phone:
  // EV_Charging_Station:
  Other: 27,
} as const;

export type RoomFeatures = (typeof RoomFeatures)[keyof typeof RoomFeatures];
