/**
 * estimateWalkingTime.ts
 *
 * Estimates and formats how long a route takes to walk based on the route's
 * total distance (in feet, per graph calibration) and a typical walking pace.
 */

const WALKING_SPEED_FEET_PER_MINUTE = 262;

export function formatWalkingTime(feet: number): string {
  const minutes = feet / WALKING_SPEED_FEET_PER_MINUTE;
  if (minutes < 1) return '<1 min';
  return `~${Math.round(minutes)} min`;
}
