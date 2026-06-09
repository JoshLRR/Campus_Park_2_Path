/**
 * formatDistance.ts
 *
 * Formats route distances (stored in feet, per graph calibration) for display.
 */

export type DistanceUnit = 'm' | 'ft';

const FEET_TO_METERS = 1 / 3.28084;

export function formatDistance(feet: number, unit: DistanceUnit): string {
  const value = unit === 'ft' ? feet : feet * FEET_TO_METERS;
  return `${value.toFixed(0)} ${unit}`;
}
