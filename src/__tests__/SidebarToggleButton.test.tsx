import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {SidebarToggleButton} from '../components/SidebarToggleButton';

describe('SidebarToggleButton', () => {
  it('renders nothing when the sidebar is open', () => {
    const {container} = render(
      <SidebarToggleButton
        isLeftSidebarOpen={true}
        setIsLeftSidebarOpen={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a button when the sidebar is closed', () => {
    render(
      <SidebarToggleButton
        isLeftSidebarOpen={false}
        setIsLeftSidebarOpen={vi.fn()}
      />,
    );
    expect(screen.getByTitle('Open sidebar')).toBeTruthy();
  });

  it('opens the sidebar when clicked', () => {
    const setOpen = vi.fn();
    render(
      <SidebarToggleButton
        isLeftSidebarOpen={false}
        setIsLeftSidebarOpen={setOpen}
      />,
    );
    fireEvent.click(screen.getByTitle('Open sidebar'));
    expect(setOpen).toHaveBeenCalledWith(true);
  });
});
