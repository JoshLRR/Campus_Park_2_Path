import {useState} from 'react';
import RoomTile from './components/Map/RoomTile';
//import StartMarker from './components/Map/StartMarker';

import './App.css';

function App() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rooms = ['101', '102', '103', '104'] as const;

  return (
    <div className="horizontalScroll">
      <div className="containerRectangle">
        {rooms.map((room, i) => (
          <RoomTile
            key={room}
            roomNumber={room}
            isActive={activeIndex === i}
            onActivate={() => setActiveIndex(i)}
            onDeactivate={() => setActiveIndex(null)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
