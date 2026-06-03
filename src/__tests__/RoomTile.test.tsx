import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render} from '@testing-library/react';
import {RoomTile} from '../components/Map/RoomTile';

const baseProps = {
  id: 3,
  x: 0,
  y: 0,
  width: 40,
  height: 20,
  name: 'Lab',
  isDragging: false,
  onPointerDown: vi.fn(),
};

const svg = (child: React.ReactNode) => <svg>{child}</svg>;

describe('RoomTile', () => {
  it('uses the default fill and shows no selection ring', () => {
    const {container} = render(svg(<RoomTile {...baseProps} />));
    const rect = container.querySelector('rect')!;
    expect(rect.getAttribute('fill')).toBe('#0ea5e9');
    // only the room rect — no animated selection circle
    expect(container.querySelector('circle')).toBeNull();
  });

  it('uses the selected fill and renders a selection ring', () => {
    const {container} = render(svg(<RoomTile {...baseProps} isSelected />));
    expect(container.querySelector('rect')!.getAttribute('fill')).toBe('#ef4444');
    expect(container.querySelector('circle')).not.toBeNull();
  });

  it('uses the highlighted fill', () => {
    const {container} = render(svg(<RoomTile {...baseProps} isHighlighted />));
    expect(container.querySelector('rect')!.getAttribute('fill')).toBe('#3b82f6');
  });

  it('truncates long names', () => {
    const {getByText} = render(
      svg(<RoomTile {...baseProps} name="Conference Room A" />),
    );
    expect(getByText('Conferen...')).toBeInTheDocument();
  });

  it('stops propagation and calls onClick', () => {
    const onClick = vi.fn();
    const {container} = render(svg(<RoomTile {...baseProps} onClick={onClick} />));
    fireEvent.click(container.querySelector('rect')!);
    expect(onClick).toHaveBeenCalled();
  });

  it('forwards pointer-down events', () => {
    const onPointerDown = vi.fn();
    const {container} = render(
      svg(<RoomTile {...baseProps} onPointerDown={onPointerDown} />),
    );
    fireEvent.pointerDown(container.querySelector('rect')!);
    expect(onPointerDown).toHaveBeenCalled();
  });

  it('renders a tooltip when building or floor is provided', () => {
    const {container} = render(
      svg(<RoomTile {...baseProps} building="Library" floor={2} />),
    );
    expect(container.querySelector('title')?.textContent).toContain('Library');
    expect(container.querySelector('title')?.textContent).toContain('Floor 2');
  });
});
