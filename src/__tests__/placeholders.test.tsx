import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {SearchBar} from '../components/Search/SearchBar';
import {DestinationList} from '../components/Search/DestinationList';
import {PathOverlay} from '../components/Map/PathOverlay';

describe('presentational placeholders render', () => {
  it('SearchBar renders', () => {
    render(<SearchBar />);
    expect(screen.getByText('SearchBar placeholder')).toBeTruthy();
  });

  it('DestinationList renders', () => {
    render(<DestinationList />);
    expect(screen.getByText('DestinationList placeholder')).toBeTruthy();
  });

  it('PathOverlay renders', () => {
    render(<PathOverlay />);
    expect(screen.getByText('PathOverlay placeholder')).toBeTruthy();
  });
});
