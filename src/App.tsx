/**
 * Root application component.
 *
 * {@link App} composes the primary high-level layout of the application
 * by assembling core feature panels into the shared {@link AppLayout}.
 * It defines what content appears in the left, center, and right regions
 * of the UI.
 *
 * Layout regions:
 * - **Left panel**: Search and destination discovery
 *   ({@link SearchBar}, {@link DestinationList})
 * - **Center panel**: Interactive campus map
 *   ({@link MapView})
 * - **Right panel**: Route guidance and directions output
 *   ({@link DirectionsPanel})
 *
 * This component is intentionally kept free of business logic and state.
 * Its responsibility is orchestration and composition only; data fetching,
 * routing logic, and state management are delegated to child components.
 *
 * @remarks
 * {@link App} serves as the top-level UI boundary for the application.
 * Any global providers (context, routing, theming) should be introduced
 * here if needed in the future.
 */

import {AppLayout} from './components/AppLayout';

import {SearchBar} from './components/Search/SearchBar';
import {DestinationList} from './components/Search/DestinationList';
import {MapView} from './components/Map/MapView';
import {DirectionsPanel} from './components/Directions/DirectionsPanel';

export default function App() {
  return (
    <AppLayout
      left={
        <>
          <SearchBar />
          <DestinationList />
        </>
      }
      center={<MapView />}
      right={<DirectionsPanel />}
    />
  );
}
