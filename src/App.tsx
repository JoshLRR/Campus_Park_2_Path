import { AppLayout } from './components/AppLayout';

function LeftStub() {
  return (
    <div>
      <h2>Search / Destinations</h2>
      <p>Dom’s SearchBar + DestinationList will mount here.</p>

      <ul>
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i}>Destination {i + 1}</li>
        ))}
      </ul>
    </div>
  );
}

function CenterStub() {
  return (
    <div style={{ height: '100%' }}>
      <h2>Map</h2>
      <p>Xavier’s MapView will mount here.</p>
      <div style={{ height: '80%', border: '1px dashed currentColor' }} />
    </div>
  );
}

function RightStub() {
  return (
    <div>
      <h2>Directions</h2>
      <p>Mo’s DirectionsPanel will mount here.</p>

      <ol>
        <li>Step 1 placeholder</li>
        <li>Step 2 placeholder</li>
        <li>Step 3 placeholder</li>
      </ol>
    </div>
  );
}

export default function App() {
  return <AppLayout left={<LeftStub />} center={<CenterStub />} right={<RightStub />} />;
}
