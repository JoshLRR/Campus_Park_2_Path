/**
 * getMapWidth.ts
 *
 * Determines the map container width based on sidebar visibility.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

export function getMapWidth(
  isLeftSidebarOpen: boolean,
  isRightPanelOpen: boolean,
): string {
  if (isLeftSidebarOpen && isRightPanelOpen) return 'w-1/2';
  if (isLeftSidebarOpen || isRightPanelOpen) return 'w-3/4';
  return 'w-full';
}
