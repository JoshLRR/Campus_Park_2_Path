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
