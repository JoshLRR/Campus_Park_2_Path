/**
 * Map view component.
 *
 * This file defines the MapView UI component responsible for rendering
 * the primary visual representation of the campus map. It serves as the
 * central interaction surface for spatial navigation.
 *
 * The MapView is expected to support:
 * - Display of campus buildings, paths, and landmarks
 * - Visualization of selected destinations and routes
 * - Real-time updates based on routing or filter changes
 * - User interactions such as pan, zoom, and focus
 *
 * @remarks
 * This component is intentionally empty during early development
 * while map rendering technology and data integration are evaluated.
 *
 * Map rendering logic (e.g. canvas, SVG, or third-party libraries)
 * should be encapsulated within this component or delegated to
 * specialized subcomponents to avoid leaking map concerns elsewhere.
 */

export function MapView() {
  return (
    <div>
      <h2 style={{marginTop: 0}}>Map</h2>
      <p style={{marginTop: 0, opacity: 0.8}}>PlaceHolder</p>
      <div
        style={{
          height: '70vh',
          border: '1px dashed currentColor',
          borderRadius: 8,
        }}
      />
    </div>
  );
}
