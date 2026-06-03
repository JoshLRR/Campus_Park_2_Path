import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {DirectionsPanel} from '../components/Directions/DirectionsPanel';

describe('DirectionsPanel', () => {
  it('renders the panel content', () => {
    render(<DirectionsPanel />);
    expect(screen.getByText('DirectionsPanel placeholder')).toBeTruthy();
  });

  it('renders the read-directions button', () => {
    render(<DirectionsPanel />);
    const button = screen.getByRole('button', {name: /read directions/i});
    expect(button).toBeTruthy();
  });
});
