import React from 'react';
import {MapView, Building} from './components/Map/MapView';
import './index.css';
import './App.css';

const initialBuildings: Building[] = [
  {id: 1, x: 100, y: 100, width: 80, height: 60, name: 'Library'},
  {id: 2, x: 250, y: 150, width: 120, height: 80, name: 'Building A'},
];

export default function App() {
  return (
    <div className="w-full h-screen flex">
      {/* Left side: building info */}
      <div className="w-1/4 h-full p-6 bg-gray-100 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Building Info</h2>
        {initialBuildings.map(b => (
          <div
            key={b.id}
            className="p-2 mb-2 border rounded bg-white shadow-sm"
          >
            <p className="font-semibold">{b.name}</p>
            <p>
              Position: ({b.x}, {b.y}) | Size: ({b.width}x{b.height})
            </p>
          </div>
        ))}
      </div>

      {/* Right side: map */}
      <div className="w-1/2 h-full relative">
        {/* MapView with draggable buildings */}
        <MapView initialBuildings={initialBuildings} />
      </div>
    </div>
  );
}
