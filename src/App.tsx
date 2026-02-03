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
