export const PathFeatures = {
  Covered: 1,
  Paved: 2,
  Dirt: 3,
  Stairs: 4,
  ADA_Access: 5,
  Other: 6,
} as const;

export type PathFeatures = (typeof PathFeatures)[keyof typeof PathFeatures];
