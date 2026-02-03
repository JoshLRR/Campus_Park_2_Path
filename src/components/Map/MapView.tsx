type MapViewProps = {
  selectedDestinationId: string | null;
};

export function MapView({ selectedDestinationId }: MapViewProps) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Map</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        PlaceHolder
      </p>
      <div style={{ height: '70vh', border: '1px dashed currentColor', borderRadius: 8 }} />
    </div>
  );
}
