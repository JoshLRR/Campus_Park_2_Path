const WALKING_SPEED_METERS_PER_MINUTE = 80;

export function formatWalkingTime(meters: number): string {
  const minutes = meters / WALKING_SPEED_METERS_PER_MINUTE;
  if (minutes < 1) return '<1 min';
  return `~${Math.round(minutes)} min`;
}
