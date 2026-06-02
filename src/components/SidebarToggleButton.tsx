/**
 * SidebarToggleButton.tsx
 *
 * Displays the button used to reopen the left sidebar when it is closed.
 *
 * This component was extracted from App.tsx without changing behavior.
 */

type SidebarToggleButtonProps = {
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (value: boolean) => void;
};

export function SidebarToggleButton({
  isLeftSidebarOpen,
  setIsLeftSidebarOpen,
}: SidebarToggleButtonProps) {
  if (isLeftSidebarOpen) {
    return null;
  }

  return (
    <button
      onClick={() => setIsLeftSidebarOpen(true)}
      className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      title="Open sidebar"
    >
      <span className="text-xl">☰</span>
    </button>
  );
}
