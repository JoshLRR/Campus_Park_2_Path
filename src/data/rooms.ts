export type RoomRecord = {
  building: string;
  room_num: number;
  room_features: number[];
};

export const rooms: RoomRecord[] = [
  {building: 'A', room_num: 110, room_features: [1, 2]},
  {building: 'A', room_num: 109, room_features: []},
  {building: 'A', room_num: 111, room_features: [3]},
  {building: 'A', room_num: 112, room_features: [9]},
];
