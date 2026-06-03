import {beforeAll, describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {MapView, Building} from '../components/Map/MapView';

// react-zoom-pan-pinch and the tile system rely on browser APIs that jsdom
// does not implement. Polyfill the minimum needed to render without crashing.
beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

const buildings: (Building & {id: number})[] = [
  {id: 1, name: 'Library', x: 100, y: 100, width: 50, height: 50, floors: [1]},
];

describe('MapView', () => {
  it('renders without crashing with minimal required props', () => {
    const {container} = render(
      <MapView
        initialBuildings={buildings}
        currentFloor={1}
        availableFloors={[1]}
      />,
    );
    expect(container).toBeTruthy();
    expect(container.querySelector('div')).not.toBeNull();
  });
});
