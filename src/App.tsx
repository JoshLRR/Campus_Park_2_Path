import {useState} from 'react';

import './App.css';

function App() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const doors = [
    {edge: 'bottom', offset: -25},
    {edge: 'top', offset: 15},
    {edge: 'left', offset: -7},
    {edge: 'right', offset: 9},
    ] as const;

  return (
    <>
      <div className="horizontalScroll">
        <div className="containerRectangle">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`rectangleBuilding ${
                activeIndex === i ? 'active' : ''
              }`}
              onMouseDown={() => setActiveIndex(i)}
              onMouseUp={() => setActiveIndex(null)}
              onMouseLeave={() => setActiveIndex(null)}
              onTouchStart={() => setActiveIndex(i)}
              onTouchEnd={() => setActiveIndex(null)}
            />
          ))}
          <div className="circleStart"></div>
        </div>
      </div>
    </>
  );
}

export default App;
