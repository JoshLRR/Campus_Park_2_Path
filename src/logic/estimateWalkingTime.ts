/**
 * estimateWalkingTime.ts
 *
 * Estimates and formats how long a route takes to walk, based on a
 * fixed average walking pace applied to the route's total distance (in meters).
 */

const WALKING_SPEED_METERS_PER_MINUTE = 80;

export function formatWalkingTime(meters: number): string {
  const minutes = meters / WALKING_SPEED_METERS_PER_MINUTE;
  if (minutes < 1) return '<1 min';
  return `~${Math.round(minutes)} min`;
}
