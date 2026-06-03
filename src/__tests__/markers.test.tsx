import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render} from '@testing-library/react';
import {StartMarker} from '../components/Map/StartMarker';
import {DestinationMarker} from '../components/Map/DestinationMarker';

const svg = (child: React.ReactNode) => <svg>{child}</svg>;

describe('StartMarker', () => {
  it('renders the base marker with a tooltip and no label', () => {
    const {container} = render(svg(<StartMarker x={10} y={20} />));
    expect(container.querySelector('title')?.textContent).toBe('Start Point');
    // base circle + inner dot, no label rect when label is absent
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('rect')).toBeNull();
  });

  it('renders a label and includes it in the tooltip', () => {
    const {container, getByText} = render(
      svg(<StartMarker x={0} y={0} label="Lobby" />),
    );
    expect(getByText('Lobby')).toBeInTheDocument();
    expect(container.querySelector('title')?.textContent).toBe(
      'Start Point: Lobby',
    );
    expect(container.querySelector('rect')).not.toBeNull();
  });

  it('renders the animated ring when animated', () => {
    const {container} = render(svg(<StartMarker x={0} y={0} isAnimated />));
    expect(container.querySelector('animate')).not.toBeNull();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const {container} = render(svg(<StartMarker x={0} y={0} onClick={onClick} />));
    fireEvent.click(container.querySelector('g')!);
    expect(onClick).toHaveBeenCalled();
  });
});

describe('DestinationMarker', () => {
  it('renders the base marker tooltip without a label', () => {
    const {container} = render(svg(<DestinationMarker x={1} y={2} />));
    expect(container.querySelector('title')?.textContent).toBe('Destination');
  });

  it('includes the label in the tooltip', () => {
    const {container, getByText} = render(
      svg(<DestinationMarker x={0} y={0} label="Lab" isAnimated />),
    );
    expect(getByText('Lab')).toBeInTheDocument();
    expect(container.querySelector('title')?.textContent).toBe(
      'Destination: Lab',
    );
    expect(container.querySelector('animate')).not.toBeNull();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const {container} = render(
      svg(<DestinationMarker x={0} y={0} onClick={onClick} />),
    );
    fireEvent.click(container.querySelector('g')!);
    expect(onClick).toHaveBeenCalled();
  });
});
