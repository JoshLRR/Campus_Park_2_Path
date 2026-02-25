/**
 * Path overlay component.
 *
 * This file defines the PathOverlay UI component responsible for
 * visually representing a calculated route on top of the campus map.
 * It renders the active navigation path without owning routing logic.
 *
 * The PathOverlay is expected to:
 * - Display the current route between origin and destination
 * - Update when routing results change
 * - Visually distinguish paths from base map features
 * - Support accessibility-aware styling where applicable
 *
 * @remarks
 * This component is intentionally empty during early development
 * while routing data structures and map rendering strategies
 * are being finalized.
 *
 * PathOverlay should remain a presentational layer only.
 * All route computation, filtering, and weighting must occur
 * upstream in the routing logic before being passed in for display.
 */

export function PathOverlay() {
  return <div>PathOverlay placeholder</div>;
}
