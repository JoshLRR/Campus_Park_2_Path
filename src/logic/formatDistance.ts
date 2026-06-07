/**
 * formatDistance.ts
 *
 * Formats route distances (stored in meters) for display, converting
 * to feet and appending the unit suffix when the user prefers `ft`.
 */

export type DistanceUnit = 'm' | 'ft';

const METERS_TO_FEET = 3.28084;

export function formatDistance(meters: number, unit: DistanceUnit): string {
  const value = unit === 'ft' ? meters * METERS_TO_FEET : meters;
  return `${value.toFixed(0)} ${unit}`;
}
