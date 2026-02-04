/**
 * Application layout shell component.
 *
 * {@link AppLayout} defines the high-level structural layout of the
 * application UI. It organizes content into three persistent regions:
 * a left sidebar, a central main area, and a right sidebar.
 *
 * Layout regions:
 * - **Left**: Search and destination discovery content
 * - **Center**: Primary interactive content (e.g. map view)
 * - **Right**: Directions, route steps, or contextual information
 *
 * Each region is rendered using composition via {@link ReactNode},
 * allowing the parent application to control what content is displayed
 * without coupling layout to specific features.
 *
 * @remarks
 * This component is intentionally presentational and stateless.
 * It does not manage data, routing, or business logic.
 *
 * Semantic HTML elements (`aside`, `main`) and ARIA labels are used to
 * improve accessibility and screen reader navigation.
 * Any visual styling or responsive behavior should be handled via CSS.
 */

import type {ReactNode} from 'react';

type AppLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function AppLayout({left, center, right}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="app-left" aria-label="Search and destination list">
        {left}
      </aside>

      <main className="app-center" aria-label="Map">
        {center}
      </main>

      <aside className="app-right" aria-label="Directions">
        {right}
      </aside>
    </div>
  );
}
