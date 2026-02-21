// TODO - Update numbers
// Note: This list is not final. We gonna be like league of legends where everything is coded as minions, except in our case everything is a room l o l
export const RoomFeatures = {
  "Men's_Bathroom": 1,
  "Men's_Bathroom_with_Changing_Table": 2,
  "Women's_Bathroom": 3,
  "Women's_Bathroom_with_Changing_Table": 4,
  Family_Bathroom: 5,
  All_Gender_Bathroom: 6,
  Elevator: 7,
  Classroom: 8,
  Vending_Machine: 9,
  Office: 10,
  Parking_Lot: 11,
  // ADA_Parking_Spot: // Need to think about how this should actually be implemented. Leave as stretch goal?
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
  Smoke_Shack: 27,
  Parking_Meter: 28,
  Bus_Stop: 29,
  Emergency_Phone: 30,
  EV_Charging_Station: 31,
  Other: 32,
} as const;

export type RoomFeatures = (typeof RoomFeatures)[keyof typeof RoomFeatures];
