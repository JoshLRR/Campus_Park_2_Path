import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {AppLayout} from '../components/AppLayout';

describe('AppLayout', () => {
  it('renders left, center, and right regions', () => {
    render(
      <AppLayout
        left={<div>LEFT</div>}
        center={<div>CENTER</div>}
        right={<div>RIGHT</div>}
      />,
    );

    expect(screen.getByText('LEFT')).toBeTruthy();
    expect(screen.getByText('CENTER')).toBeTruthy();
    expect(screen.getByText('RIGHT')).toBeTruthy();
  });
});
